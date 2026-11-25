#!/usr/bin/env node

/**
 * validate-writing.js
 * Keyword stuffing detection, banned formulations, common French language
 * errors, readability scoring, entity coverage, and number formatting.
 */

const fs = require('fs');
const path = require('path');
const { normalize, countKeyword, textIncludesKeyword, parseArgs, decodeEntities, mainHtml, markSentenceBreaks, splitSentences, wordRegex } = require('./utils');

const args = parseArgs();
const filePath = args.file;
const sidecarPath = args.sidecar;
const configPath = args.config;

if (!filePath) {
  console.error(JSON.stringify({
    status: 'error',
    message: 'Usage: node validate-writing.js --file <path> [--sidecar <path>] [--config <path>]'
  }));
  process.exit(2);
}

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({
    validator: 'validate-writing',
    file: filePath,
    status: 'error',
    checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }]
  }, null, 2));
  process.exit(2);
}

const ext = path.extname(filePath).toLowerCase();
const checks = [];
const warnings = [];

let primaryKeyword = null;
let semanticEntities = [];
if (sidecarPath) {
  try {
    const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    primaryKeyword = sidecar.strat?.primary_keyword || sidecar.analysis?.current_keyword || null;
    semanticEntities = sidecar.strat?.semantic_entities || [];
  } catch (e) {
    warnings.push(`Sidecar illisible: ${e.message}`);
  }
}

let maxSectionDensity = 3;
let siteLanguage = 'fr';
if (configPath) {
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    maxSectionDensity = cfg.seo?.max_section_keyword_density_percent ?? 3;
    siteLanguage = String(cfg.project?.language || 'fr').toLowerCase().slice(0, 2);
  } catch (e) {
    warnings.push(`Config illisible: ${e.message}`);
  }
}

function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

let bodyContent = '';
let headings = [];

if (ext === '.mdx' || ext === '.md') {
  bodyContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(bodyContent)) !== null) {
    headings.push({ level: match[1].length, text: match[2].trim(), index: match.index });
  }
} else if (ext === '.html' || ext === '.htm') {
  // Contenu principal seulement (<main>, sinon <article>, sinon <body> sans en-tête, menu ni pied) : le texte du menu
  // et du pied de page, commun à tout le site, n'est ni une phrase ni un paragraphe de la page.
  bodyContent = mainHtml(content);
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(bodyContent)) !== null) {
    headings.push({ level: parseInt(match[1]), text: match[2].replace(/<[^>]+>/g, '').trim(), index: match.index });
  }
}

const isHtml = ext === '.html' || ext === '.htm';
// Fin de bloc = fin de phrase (titres, li, td, th, dt, dd… ; en Markdown titres, listes, tableaux, paragraphes).
const withBreaks = isHtml
  ? markSentenceBreaks(bodyContent)
  : bodyContent.replace(/^(\s*(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|\|).*)$/gm, '$1\u2029').replace(/\n[ \t]*\n/g, '\n\u2029\n');
let cleanText = withBreaks
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/!\[.*?\]\(.*?\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[#*_`~\[\](){}|>]/g, '')
  .replace(/import\s+.*?from\s+['"].*?['"]/g, '')
  .replace(/export\s+.*?;/g, '')
  .replace(/<[A-Z]\w+[^>]*\/>/g, '')
  .replace(/<[A-Z]\w+[^>]*>[\s\S]*?<\/[A-Z]\w+>/g, '');
if (isHtml) cleanText = decodeEntities(cleanText);
const sentenceText = cleanText.replace(/[^\S\u2029]+/g, ' ');
const plainText = cleanText.replace(/\s+/g, ' ').trim();

const words = plainText.split(/\s+/).filter(w => w.length > 0);
const wordCount = words.length;

let paragraphs;
if (ext === '.html' || ext === '.htm') {
  paragraphs = [];
  const pRegex = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = pRegex.exec(bodyContent)) !== null) {
    const text = pm[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0) paragraphs.push(text);
  }
} else {
  paragraphs = bodyContent
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('#') && !p.startsWith('```') &&
      !p.startsWith('import') && !p.startsWith('export') && !p.startsWith('<'));
}

const sentences = splitSentences(sentenceText)
  .filter(s => s.trim().length > 5)
  .filter(s => s.split(/\s+/).filter(w => w.length > 0).length >= 3);

// =================================================================
// KEYWORD STUFFING CHECKS (using word boundary matching)
// =================================================================
if (primaryKeyword && primaryKeyword.length > 0) {
  const kwNorm = normalize(primaryKeyword);

  if (paragraphs.length > 0) {
    let stuffedParagraphs = 0;
    const stuffedDetails = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const count = countKeyword(paragraphs[i], primaryKeyword);
      if (i > 0 && count >= 2) {
        stuffedParagraphs++;
        stuffedDetails.push(`P${i + 1}: ${count}x`);
      }
    }

    addCheck('keyword_per_paragraph', stuffedParagraphs === 0,
      stuffedParagraphs === 0
        ? 'Max 1 occurrence du mot-cle par paragraphe (hors intro)'
        : `${stuffedParagraphs} paragraphe(s) avec 2+ occurrences: ${stuffedDetails.slice(0, 5).join(', ')}`);
  }

  if (sentences.length > 2) {
    let maxConsecutive = 0;
    let current = 0;

    for (const s of sentences) {
      if (textIncludesKeyword(s, primaryKeyword)) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }

    addCheck('keyword_consecutive_sentences', maxConsecutive < 3,
      maxConsecutive < 3
        ? `Max ${maxConsecutive} phrase(s) consecutive(s) avec le mot-cle`
        : `${maxConsecutive} phrases consecutives contiennent "${primaryKeyword}" (max: 2)`);
  }

  if (headings.length > 0) {
    const contentForSections = ext === '.html' || ext === '.htm'
      ? bodyContent
      : bodyContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

    const headingLineRegex = ext === '.html' || ext === '.htm'
      ? /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi
      : /^#{1,6}\s+.+$/gm;

    const headingPositions = [];
    let hm;
    while ((hm = headingLineRegex.exec(contentForSections)) !== null) {
      headingPositions.push(hm.index);
    }

    let highDensitySections = 0;
    const highDensityDetails = [];

    for (let i = 0; i < headingPositions.length; i++) {
      const start = headingPositions[i];
      const end = i + 1 < headingPositions.length ? headingPositions[i + 1] : contentForSections.length;
      const sectionText = contentForSections.substring(start, end)
        .replace(/<[^>]+>/g, ' ')
        .replace(/^#{1,6}\s+.*$/gm, '')
        .replace(/[#*_`~\[\](){}|>]/g, '')
        .replace(/\s+/g, ' ').trim();

      const sectionWords = sectionText.split(/\s+/).filter(w => w.length > 0);
      if (sectionWords.length < 20) continue;

      const kwCount = countKeyword(sectionText, primaryKeyword);
      const density = (kwCount / sectionWords.length) * 100;
      if (density > maxSectionDensity) {
        highDensitySections++;
        const headingText = headings[i]?.text || `Section ${i + 1}`;
        highDensityDetails.push(`"${headingText.substring(0, 40)}": ${density.toFixed(1)}%`);
      }
    }

    addCheck('keyword_section_density', highDensitySections === 0,
      highDensitySections === 0
        ? `Densite mot-cle < ${maxSectionDensity}% dans toutes les sections`
        : `${highDensitySections} section(s) > ${maxSectionDensity}%: ${highDensityDetails.join('; ')}`);
  }

  if (paragraphs.length >= 4) {
    let paraWithKw = 0;
    for (const p of paragraphs) {
      if (textIncludesKeyword(p, primaryKeyword)) paraWithKw++;
    }
    const ratio = paraWithKw / paragraphs.length;
    addCheck('keyword_paragraph_ratio', ratio <= 0.5,
      `Mot-cle dans ${paraWithKw}/${paragraphs.length} paragraphes (${(ratio * 100).toFixed(0)}%${ratio > 0.5 ? ' — max: 50%' : ''})`);
  }
} else {
  addCheck('keyword_stuffing_skipped', true,
    'Checks keyword stuffing non executes (mot-cle primaire non defini dans le side-car)');
}

// =================================================================
// ACCENT VERIFICATION (French) — Comprehensive 3-layer detection
// =================================================================
const accentPairs = [
  // === É at start ===
  ["ecart", "écart"], ["echange", "échange"], ["echantillon", "échantillon"],
  ["echeance", "échéance"], ["echelle", "échelle"], ["eclairage", "éclairage"],
  ["ecole", "école"], ["ecologie", "écologie"], ["ecologique", "écologique"],
  ["economie", "économie"], ["economique", "économique"], ["ecosysteme", "écosystème"],
  ["ecoute", "écoute"], ["ecran", "écran"], ["ecriture", "écriture"],
  ["edifice", "édifice"], ["edition", "édition"], ["education", "éducation"],
  ["egalite", "égalité"], ["eglise", "église"], ["elaboration", "élaboration"],
  ["elan", "élan"], ["electrique", "électrique"], ["electricite", "électricité"],
  ["element", "élément"], ["elementaire", "élémentaire"],
  ["election", "élection"], ["eleve", "élève"], ["elevage", "élevage"],
  ["eligibilite", "éligibilité"], ["eligible", "éligible"],
  ["elimination", "élimination"], ["eloignement", "éloignement"],
  ["emission", "émission"], ["emouvant", "émouvant"],
  ["energie", "énergie"], ["energetique", "énergétique"], ["enormement", "énormément"],
  ["epargne", "épargne"], ["epaisseur", "épaisseur"], ["epoque", "époque"],
  ["equipement", "équipement"], ["equipe", "équipe"],
  ["equilibre", "équilibre"], ["equivalent", "équivalent"],
  ["etablissement", "établissement"], ["etage", "étage"],
  ["etanche", "étanche"], ["etancheite", "étanchéité"],
  ["etape", "étape"], ["etat", "état"],
  ["etendue", "étendue"], ["eternite", "éternité"],
  ["etude", "étude"], ["etudiant", "étudiant"],
  ["evaluation", "évaluation"], ["evenement", "événement"],
  ["eventuel", "éventuel"], ["evolution", "évolution"], ["eviter", "éviter"],
  // === DÉ- prefix ===
  ["decennie", "décennie"], ["deces", "décès"],
  ["decision", "décision"], ["declaration", "déclaration"],
  ["decouverte", "découverte"], ["decret", "décret"],
  ["definition", "définition"], ["degradation", "dégradation"],
  ["demarche", "démarche"], ["demenagement", "déménagement"],
  ["deperdition", "déperdition"], ["deplacement", "déplacement"],
  ["deploiement", "déploiement"], ["depense", "dépense"], ["depot", "dépôt"],
  ["derogation", "dérogation"], ["desaccord", "désaccord"],
  ["desormais", "désormais"], ["desir", "désir"], ["designation", "désignation"],
  ["detail", "détail"], ["deterioration", "détérioration"],
  ["determination", "détermination"],
  ["developpement", "développement"], ["developper", "développer"],
  // === RÉ- prefix ===
  ["reaction", "réaction"], ["realiser", "réaliser"], ["realite", "réalité"],
  ["reclamation", "réclamation"], ["recuperation", "récupération"],
  ["redaction", "rédaction"], ["reduction", "réduction"],
  ["reforme", "réforme"], ["reference", "référence"],
  ["reflexion", "réflexion"], ["regime", "régime"],
  ["region", "région"], ["reglementation", "réglementation"],
  ["regulier", "régulier"], ["regulierement", "régulièrement"],
  ["rehabilitation", "réhabilitation"],
  ["remuneration", "rémunération"], ["renovation", "rénovation"],
  ["repartition", "répartition"], ["repertoire", "répertoire"],
  ["repercussion", "répercussion"], ["repetition", "répétition"],
  ["reponse", "réponse"], ["representation", "représentation"],
  ["reputation", "réputation"], ["reservation", "réservation"],
  ["residence", "résidence"], ["resistance", "résistance"],
  ["resolution", "résolution"], ["resultat", "résultat"], ["resume", "résumé"],
  ["reunion", "réunion"], ["revelation", "révélation"],
  ["revision", "révision"], ["revolution", "révolution"],
  ["reussite", "réussite"],
  // === PRÉ- prefix ===
  ["precaution", "précaution"], ["precedent", "précédent"],
  ["precision", "précision"], ["preference", "préférence"],
  ["preferer", "préférer"], ["preliminaire", "préliminaire"],
  ["premiere", "première"], ["preparation", "préparation"],
  ["presence", "présence"], ["presentation", "présentation"],
  ["preservation", "préservation"], ["president", "président"],
  ["prevention", "prévention"], ["prevision", "prévision"], ["prevu", "prévu"],
  // === CÉ-, GÉ-, HÉ-, LÉ-, MÉ-, PÉ-, SÉ-, TÉ-, VÉ-, BÉ-, FÉ- ===
  ["celebre", "célèbre"], ["celebrite", "célébrité"],
  ["cereale", "céréale"], ["ceremonie", "cérémonie"],
  ["geographie", "géographie"], ["geometrie", "géométrie"],
  ["genie", "génie"], ["genetique", "génétique"], ["general", "général"],
  ["generalement", "généralement"], ["generation", "génération"],
  ["heritage", "héritage"], ["heritier", "héritier"],
  ["heroique", "héroïque"], ["hesitation", "hésitation"],
  ["leger", "léger"], ["legerement", "légèrement"],
  ["legerete", "légèreté"], ["legende", "légende"],
  ["legislation", "législation"], ["legislatif", "législatif"],
  ["legitime", "légitime"], ["legitimite", "légitimité"],
  ["mecanisme", "mécanisme"], ["medecin", "médecin"],
  ["media", "média"], ["medicament", "médicament"],
  ["medieval", "médiéval"], ["melancolie", "mélancolie"],
  ["melange", "mélange"], ["memoire", "mémoire"],
  ["menage", "ménage"], ["merite", "mérite"],
  ["metal", "métal"], ["meteorologie", "météorologie"],
  ["methode", "méthode"], ["metier", "métier"],
  ["metre", "mètre"], ["metro", "métro"], ["metropole", "métropole"],
  ["pedagogie", "pédagogie"], ["penalite", "pénalité"],
  ["penible", "pénible"], ["penurie", "pénurie"],
  ["perimetre", "périmètre"], ["peripherie", "périphérie"], ["petrole", "pétrole"],
  ["secheresse", "sécheresse"], ["securite", "sécurité"],
  ["seduction", "séduction"], ["sejour", "séjour"],
  ["selection", "sélection"], ["semantique", "sémantique"],
  ["separation", "séparation"], ["sequence", "séquence"],
  ["serenite", "sérénité"], ["serieux", "sérieux"], ["severite", "sévérité"],
  ["telephone", "téléphone"], ["television", "télévision"],
  ["temoignage", "témoignage"],
  ["vehicule", "véhicule"], ["verification", "vérification"],
  ["veritable", "véritable"], ["verite", "vérité"],
  ["benevole", "bénévole"], ["beton", "béton"],
  ["benefice", "bénéfice"], ["beneficier", "bénéficier"],
  ["beneficiaire", "bénéficiaire"],
  ["federation", "fédération"], ["feminin", "féminin"],
  // === Other é/è in middle ===
  ["accelerer", "accélérer"], ["acces", "accès"],
  ["activite", "activité"], ["amelioration", "amélioration"],
  ["amenagement", "aménagement"], ["bibliotheque", "bibliothèque"],
  ["capacite", "capacité"], ["categorie", "catégorie"],
  ["communaute", "communauté"], ["completement", "complètement"],
  ["complexite", "complexité"], ["congres", "congrès"],
  ["consequence", "conséquence"], ["creation", "création"],
  ["critere", "critère"], ["caractere", "caractère"], ["carriere", "carrière"],
  ["derniere", "dernière"], ["different", "différent"],
  ["disponibilite", "disponibilité"], ["durabilite", "durabilité"],
  ["efficacite", "efficacité"], ["exces", "excès"],
  ["experience", "expérience"], ["exterieur", "extérieur"],
  ["fiabilite", "fiabilité"], ["fidelite", "fidélité"],
  ["frequence", "fréquence"], ["frequemment", "fréquemment"],
  ["immediat", "immédiat"], ["independant", "indépendant"],
  ["inferieur", "inférieur"], ["integrer", "intégrer"],
  ["integration", "intégration"], ["interessant", "intéressant"],
  ["interet", "intérêt"], ["interieur", "intérieur"],
  ["interpreter", "interpréter"], ["irregulier", "irrégulier"],
  ["maniere", "manière"], ["materiel", "matériel"], ["matiere", "matière"],
  ["modele", "modèle"], ["necessaire", "nécessaire"],
  ["negociation", "négociation"], ["operation", "opération"],
  ["periode", "période"], ["phenomene", "phénomène"],
  ["possibilite", "possibilité"], ["priorite", "priorité"],
  ["probleme", "problème"], ["procedure", "procédure"],
  ["proces", "procès"], ["progres", "progrès"],
  ["propriete", "propriété"], ["qualite", "qualité"],
  ["rentabilite", "rentabilité"], ["responsabilite", "responsabilité"],
  ["societe", "société"], ["special", "spécial"],
  ["specificite", "spécificité"], ["specifique", "spécifique"],
  ["strategie", "stratégie"], ["succes", "succès"],
  ["superieur", "supérieur"], ["systeme", "système"],
  ["temperature", "température"],
  // === -té words ===
  ["sante", "santé"], ["beaute", "beauté"], ["liberte", "liberté"],
  ["volonte", "volonté"], ["difficulte", "difficulté"],
  ["faculte", "faculté"], ["fierte", "fierté"], ["surete", "sûreté"],
  // === Missing common words ===
  ["numero", "numéro"], ["comite", "comité"],
  ["employe", "employé"], ["verifier", "vérifier"], ["proteger", "protéger"],
  ["delegue", "délégué"], ["delegation", "délégation"],
  ["fidele", "fidèle"], ["parallele", "parallèle"], ["clientele", "clientèle"],
  ["regle", "règle"],
  // === Short common words ===
  ["tres", "très"], ["meme", "même"], ["etes", "êtes"],
  ["apres", "après"], ["aupres", "auprès"], ["deja", "déjà"],
  ["voila", "voilà"], ["plutot", "plutôt"],
  ["aussitot", "aussitôt"], ["bientot", "bientôt"],
  ["pere", "père"], ["mere", "mère"], ["pres", "près"],
  ["decembre", "décembre"], ["fevrier", "février"],
  ["idee", "idée"], ["cle", "clé"],
  // === Ç words ===
  ["francais", "français"], ["francaise", "française"],
  ["facade", "façade"], ["lecon", "leçon"], ["facon", "façon"],
  ["recu", "reçu"], ["apercu", "aperçu"], ["decu", "déçu"],
  ["garcon", "garçon"], ["concu", "conçu"], ["concue", "conçue"],
  ["soupcon", "soupçon"], ["commercant", "commerçant"],
  ["percant", "perçant"], ["fiancailles", "fiançailles"],
  // === Ô words ===
  ["role", "rôle"], ["controle", "contrôle"],
  ["hopital", "hôpital"], ["hotel", "hôtel"], ["depot", "dépôt"],
  // === Â words ===
  ["batiment", "bâtiment"], ["chateau", "château"], ["grace", "grâce"],
  // === Ê words ===
  ["etre", "être"], ["fenetre", "fenêtre"], ["fete", "fête"],
  ["foret", "forêt"], ["enquete", "enquête"], ["tempete", "tempête"],
  ["arret", "arrêt"], ["pret", "prêt"],
  // === Î words ===
  ["ile", "île"],
];

// Mots entiers au sens Unicode (\p{L}) : « Fenêtres » est un seul mot, pas « fen » + « tres ».
const accentCheckWords = new Set(
  (plainText.toLowerCase().match(/\p{L}+/gu) || [])
    .filter(w => /^[a-z]+$/.test(w) && w.length >= 3)
);

const foundAccentErrors = [];
const accentFlagged = new Set();

for (const [wrong, correct] of accentPairs) {
  // Limites Unicode : \b ne voit pas les lettres accentuées (\btres\b trouvait « tres » dans « Fenêtres »).
  const regex = wordRegex(`${wrong}(?:s|es)?`, 'i');
  if (regex.test(plainText)) {
    foundAccentErrors.push(`"${wrong}" → "${correct}"`);
    accentFlagged.add(wrong);
  }
}

const accentPrefixes = [
  { prefix: 'ec', minLen: 4, excl: new Set(['ecchymose']) },
  { prefix: 'ed', minLen: 5, excl: new Set([]) },
  { prefix: 'eg', minLen: 4, excl: new Set([]) },
  { prefix: 'ep', minLen: 4, excl: new Set([]) },
  { prefix: 'eq', minLen: 4, excl: new Set([]) },
  { prefix: 'et', minLen: 5, excl: new Set([]) },
  { prefix: 'ev', minLen: 4, excl: new Set([]) },
];

for (const word of accentCheckWords) {
  if (accentFlagged.has(word)) continue;
  for (const { prefix, minLen, excl } of accentPrefixes) {
    if (word.length >= minLen && word.startsWith(prefix) && !excl.has(word)) {
      foundAccentErrors.push(`"${word}" → "é${word.slice(1)}"`);
      accentFlagged.add(word);
      break;
    }
  }
}

const iteExclusions = new Set([
  'conduite', 'poursuite', 'interdite', 'inscrite', 'prescrite',
  'produite', 'traduite', 'introduite', 'construite', 'reconduite',
  'reproduite', 'detruite', 'seduite', 'reduite', 'induite',
  'defaite', 'parfaite', 'satisfaite', 'insatisfaite',
  'extraite', 'distraite', 'abstraite', 'soustraite', 'retraite',
  'maudite', 'gratuite', 'fortuite', 'insolite', 'faillite', 'marmite',
  'arthrite', 'bronchite', 'cellulite', 'dermatite', 'gastrite',
  'hepatite', 'laryngite', 'meningite', 'sinusite', 'tendinite',
  'appendicite', 'conjonctivite', 'cystite', 'gingivite', 'otite',
  'pharyngite', 'rhinite',
  'composite', 'satellite', 'parasite', 'meteorite', 'favorite',
  'dynamite', 'graphite', 'anthracite', 'dolomite', 'lignite',
  'pyrite', 'magnetite', 'stalactite', 'stalagmite', 'malachite',
  'sulfite', 'bauxite',
  'explicite', 'implicite', 'illicite', 'hypocrite', 'termite', 'ermite',
]);

const iteExclusionsPlural = new Set([...iteExclusions].map(w => w + 's'));

const accentSuffixes = [
  { suffix: 'ite', correct: 'ité', minLen: 7, excl: iteExclusions },
  { suffix: 'ites', correct: 'ités', minLen: 8, excl: iteExclusionsPlural },
  { suffix: 'ere', correct: 'ère', minLen: 5, excl: new Set([]) },
  { suffix: 'eres', correct: 'ères', minLen: 6, excl: new Set([]) },
  { suffix: 'eme', correct: 'ème', minLen: 5, excl: new Set([]) },
  { suffix: 'emes', correct: 'èmes', minLen: 6, excl: new Set([]) },
  { suffix: 'ee', correct: 'ée', minLen: 5, excl: new Set([]) },
  { suffix: 'ees', correct: 'ées', minLen: 6, excl: new Set([]) },
  { suffix: 'ete', correct: 'été/ête', minLen: 6, excl: new Set([]) },
  { suffix: 'etes', correct: 'étés/êtes', minLen: 7, excl: new Set([]) },
];

for (const word of accentCheckWords) {
  if (accentFlagged.has(word)) continue;
  for (const { suffix, correct, minLen, excl } of accentSuffixes) {
    if (word.length >= minLen && word.endsWith(suffix) && !excl.has(word)) {
      foundAccentErrors.push(`"${word}" → "...${correct}"`);
      accentFlagged.add(word);
      break;
    }
  }
}

// Le dictionnaire et les motifs d'accents sont français : hors français, le contrôle ne s'applique pas
// (la relecture de la langue du site relève de validate-language / LanguageTool).
if (siteLanguage !== 'fr') foundAccentErrors.length = 0;
addCheck('accent_verification', foundAccentErrors.length === 0,
  siteLanguage !== 'fr'
    ? `Non applicable : contrôle d'accents français, site en « ${siteLanguage} » (relecture via validate-language)`
    : foundAccentErrors.length === 0
    ? 'Accents corrects (dictionnaire ~300 mots + patterns prefixes/suffixes)'
    : `${foundAccentErrors.length} mot(s) sans accent: ${foundAccentErrors.slice(0, 5).join(', ')}${foundAccentErrors.length > 5 ? ` (+${foundAccentErrors.length - 5} autres)` : ''}`);

// =================================================================
// BANNED FORMULATIONS
// =================================================================
const bannedFormulations = [
  "dans cet article", "il est important de noter", "n'hesitez pas",
  "force est de constater", "il convient de souligner", "comme son nom l'indique",
  "il est a noter", "vous l'aurez compris", "sans plus attendre",
  "dans le monde d'aujourd'hui", "il va sans dire", "a l'heure actuelle",
  "d'ores et deja", "il existe de nombreux", "il existe de nombreuses",
  "il existe plusieurs", "que vous soyez", "il est essentiel de",
  "il est crucial de", "il est primordial de", "comme nous l'avons vu",
  "en ce qui concerne", "en d'autres termes", "au fil des ans",
  "de nos jours", "pour conclure",
  // Tics oraux ou dramatisés relevés par un client (2026-11-21) : ni naturels ni pros
  "c'est la que se trouve", "le point que l'on oublie", "le point qu'on oublie",
  "prenons un exemple", "prenons l'exemple", "il suffit de multiplier",
];

const textNorm = normalize(plainText);
const foundBanned = [];
for (const phrase of bannedFormulations) {
  if (textNorm.includes(normalize(phrase))) {
    foundBanned.push(phrase);
  }
}

addCheck('banned_formulations', foundBanned.length === 0,
  foundBanned.length === 0
    ? 'Aucune formulation bannie detectee'
    : `${foundBanned.length} formulation(s) bannie(s): "${foundBanned.join('", "')}"`);

// =================================================================
// FRENCH LANGUAGE ERRORS
// =================================================================
const languageErrors = [
  { pattern: "malgre que", fix: "bien que + subjonctif" },
  { pattern: "au final", fix: "finalement, au bout du compte" },
  { pattern: "quelque soit", fix: "quel que soit" },
  { pattern: "pallier a ce", fix: "pallier ce (transitif direct)" },
  { pattern: "pallier a la", fix: "pallier la (transitif direct)" },
  { pattern: "pallier a l'", fix: "pallier l' (transitif direct)" },
  { pattern: "pallier au ", fix: "pallier le (transitif direct)" },
  { pattern: "pallier aux", fix: "pallier les (transitif direct)" },
  { pattern: "voire meme", fix: "voire seul ou même seul" },
  { pattern: "s'averer faux", fix: "se révéler faux (s'avérer = se révéler vrai)" },
  { pattern: "s'avere faux", fix: "se révèle faux" },
  { pattern: "s'averer fausse", fix: "se révéler fausse" },
  { pattern: "s'avere fausse", fix: "se révèle fausse" },
  { pattern: "au jour d'aujourd'hui", fix: "aujourd'hui (triple pléonasme)" },
  { pattern: "autant pour moi", fix: "au temps pour moi" },
  { pattern: "comme meme", fix: "quand même" },
  { pattern: "adresser un probleme", fix: "traiter/résoudre un problème (calque anglais)" },
  { pattern: "adresser le probleme", fix: "traiter/résoudre le problème (calque anglais)" },
  { pattern: "adresser ce probleme", fix: "traiter/résoudre ce problème (calque anglais)" },
  { pattern: "adresser une question", fix: "aborder/traiter une question (calque anglais)" },
  { pattern: "adresser la question", fix: "aborder/traiter la question (calque anglais)" },
];

const foundLangErrors = [];
for (const { pattern, fix } of languageErrors) {
  if (textNorm.includes(normalize(pattern))) {
    foundLangErrors.push(`"${pattern}" → ${fix}`);
  }
}

addCheck('language_errors', foundLangErrors.length === 0,
  foundLangErrors.length === 0
    ? 'Aucune erreur de langue IA typique detectee'
    : `${foundLangErrors.length} erreur(s): ${foundLangErrors.join('; ')}`);

// =================================================================
// READABILITY SCORE (Flesch-Kincaid adapted for French)
// =================================================================
if (sentences.length >= 5 && wordCount >= 100) {
  function countSyllables(word) {
    const w = word.toLowerCase().replace(/[^a-zà-öø-ÿœæ]/g, '');
    if (w.length <= 2) return 1;
    const vowelGroups = w.match(/[aeiouyàâéèêëîïôùûüÿœæ]+/gi) || [];
    let count = vowelGroups.length;
    if (w.endsWith('e') && !w.endsWith('ée') && !w.endsWith('ie') && !w.endsWith('ue') && count > 1) count--;
    if (w.endsWith('es') && count > 1) count--;
    if (w.endsWith('ent') && count > 1 && w.length > 4) count--;
    return Math.max(1, count);
  }

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = wordCount / sentences.length;
  const avgSyllablesPerWord = totalSyllables / wordCount;

  // Formule Flesch adaptée au français (Kandel & Moles)
  const fleschScore = 207 - (1.015 * avgWordsPerSentence) - (73.6 * avgSyllablesPerWord);
  const fleschRounded = Math.round(fleschScore);

  let readabilityLevel;
  if (fleschRounded >= 80) readabilityLevel = 'tres facile';
  else if (fleschRounded >= 60) readabilityLevel = 'facile';
  else if (fleschRounded >= 40) readabilityLevel = 'standard';
  else if (fleschRounded >= 20) readabilityLevel = 'difficile';
  else readabilityLevel = 'tres difficile';

  addCheck('readability_score', fleschRounded >= 30,
    `Score Flesch-Kincaid FR: ${fleschRounded}/100 (${readabilityLevel}) — moy. ${avgWordsPerSentence.toFixed(1)} mots/phrase, ${avgSyllablesPerWord.toFixed(1)} syllabes/mot`);

  // Voix passive (heuristique)
  const passivePatterns = /(?<![\p{L}\p{N}_])(est|sont|a ete|ont ete|sera|seront|etait|etaient|fut|furent)\s+[\p{L}\p{N}_]+(e|es|i|is|it|ite|ites|u|us|ue|ues)(?![\p{L}\p{N}_])/giu;
  const passiveMatches = textNorm.match(passivePatterns) || [];
  const passiveRatio = sentences.length > 0 ? (passiveMatches.length / sentences.length) * 100 : 0;

  addCheck('passive_voice', passiveRatio <= 15,
    `Voix passive estimee: ${passiveRatio.toFixed(0)}% des phrases (max recommande: 15%)`);
}

// =================================================================
// SEMANTIC ENTITY COVERAGE
// =================================================================
if (semanticEntities.length > 0) {
  const found = [];
  const missing = [];

  for (const entity of semanticEntities) {
    if (textIncludesKeyword(plainText, entity)) {
      found.push(entity);
    } else {
      missing.push(entity);
    }
  }

  const coverage = (found.length / semanticEntities.length) * 100;
  addCheck('entity_coverage', coverage >= 80,
    `Couverture entites semantiques: ${found.length}/${semanticEntities.length} (${coverage.toFixed(0)}%)${missing.length > 0 ? ` — manquantes: ${missing.slice(0, 5).join(', ')}` : ''}`);
}

// =================================================================
// NUMBER FORMATTING (French conventions)
// =================================================================
const englishThousands = plainText.match(/\b\d{1,3},\d{3}\b/g) || [];
const realThousands = englishThousands.filter(n => parseInt(n.replace(',', '')) >= 1000);

const englishDecimals = plainText.match(/\d+\.\d+\s*(?:€|euros?|kWh?|m[²³]|cm|mm|km|kg|g|L|ha|MW|GW|%|°C|°)/g) || [];

const numberIssues = [
  ...realThousands.map(n => `"${n}" → "${n.replace(/,(\d{3})/, ' $1')}"`),
  ...englishDecimals.map(n => `"${n.trim()}" → virgule decimale`)
];

addCheck('number_format_french', numberIssues.length === 0,
  numberIssues.length === 0
    ? 'Formatage des nombres conforme au francais'
    : `${numberIssues.length} nombre(s) au format anglais: ${numberIssues.slice(0, 3).join('; ')}${numberIssues.length > 3 ? '...' : ''}`);

// =================================================================
// BRAND NAME (config.project.brand) — nom complet, jamais en adjectif
// =================================================================
// Retour client 2026-11-21 : « Oteria » seul et « les services Oteria Conseil »
// ont été jugés ni naturels ni professionnels. Voir content-guidelines.md,
// « Nom de l'entreprise et sujet des verbes ».
let brandName = '';
if (configPath) {
  try {
    const cfgBrand = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    brandName = String(cfgBrand.project?.brand || cfgBrand.project?.name || '').trim();
  } catch (e) { /* déjà signalé plus haut */ }
}
if (brandName && siteLanguage === 'fr') {
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const brandWords = brandName.split(/\s+/);
  // 1. Troncature : premier mot de la marque sans la suite (« Oteria » pour « Oteria Conseil »)
  const truncated = [];
  if (brandWords.length > 1) {
    const rest = brandWords.slice(1).join('\\s+');
    const re = new RegExp(`(?<![\\p{L}\\p{N}@./-])${esc(brandWords[0])}(?![\\p{L}\\p{N}-])(?!\\s+${rest})`, 'gu');
    let m;
    while ((m = re.exec(plainText)) !== null) {
      truncated.push(plainText.slice(Math.max(0, m.index - 30), m.index + brandWords[0].length + 25).trim());
    }
  }
  addCheck('brand_truncated', truncated.length === 0,
    truncated.length === 0
      ? `Nom de marque complet (« ${brandName} »)`
      : `${truncated.length} occurrence(s) de « ${brandWords[0]} » sans « ${brandWords.slice(1).join(' ')} » : « …${truncated.slice(0, 3).join(' … ')}… » → écrire « ${brandName} »`);

  // 2. Marque employée comme adjectif après un nom (« les services Oteria Conseil »)
  const nouns = 'services?|équipes?|experts?|accompagnements?|offres?|conseillers?|méthodes?|solutions?|prestations?|consultants?|interventions?|missions?';
  const adjRe = new RegExp(`\\b(?:les?|la|l'|nos|vos|des|du|ces?|cette)\\s*(?:${nouns})\\s+${esc(brandName).replace(/\\s+|\s+/g, '\\s+')}`, 'giu');
  const adjHits = plainText.match(adjRe) || [];
  addCheck('brand_as_adjective', adjHits.length === 0,
    adjHits.length === 0
      ? 'Marque jamais employée comme adjectif'
      : `${adjHits.length} tournure(s) « nom + marque » : « ${adjHits.slice(0, 3).join(' », « ')} » → « les services d'${brandName} » ou, mieux, « ${brandName} + verbe »`);
}

// =================================================================
// OUTPUT
// =================================================================
const hasFail = checks.some(c => c.status === 'fail');
const result = {
  validator: 'validate-writing',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  keyword_analyzed: primaryKeyword || '(non defini)',
  paragraphs_count: paragraphs.length,
  sentences_count: sentences.length,
  checks,
  ...(warnings.length > 0 ? { warnings } : {})
};

console.log(JSON.stringify(result, null, 2));
// exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
process.exitCode = hasFail ? 1 : 0;
