// Outils partagés par validate-spam.js (page) et audit-spam.js (site).
// Réf. : references/spam-policies.md (Google Search spam policies + spam updates).
//
// Un même « modèle de page » pour les sites Astro/MDX et les sites HTML statiques : title, H1, H2, FAQ,
// publication (draft / noindex), texte principal (sans en-tête, menu ni pied de page communs à tout le site).

const fs = require('fs');
const path = require('path');
const { normalize, htmlTitle, metaContent } = require('./utils');

const DEFAULTS = {
  // Similarité de corps (Jaccard sur shingles de 5 mots) entre deux pages publiées
  max_body_similarity: 0.35,
  warn_body_similarity: 0.25,
  // Part de H2 identiques (à entité près) entre deux pages
  max_outline_similarity: 0.5,
  shingle_size: 5,
  // Liens / boutons d'affiliation pour 1 000 mots de corps
  max_affiliate_per_1000_words: 4,
  affiliate_patterns: ['rel=["\'][^"\']*sponsored', '<BoutonPartenaire\\b', '<AffiliateButton\\b', '<CtaPartenaire\\b'],
  // Affirmations d'expérience vécue qui exigent une preuve (frontmatter experience_proof)
  experience_claims: [
    'nous avons test', 'nous l\'avons test', 'apr[eè]s avoir test', 'test[ée]s? par nos soins', '(lors de|dans) notre test', 'nos tests (montrent|ont)',
    'nous avons ouvert (un|notre) compte', 'j\'ai ouvert (un|mon) compte', 'j\'ai test', 'nous avons utilis[ée] .{0,30} pendant',
    // « hands-on testing » seul décrit souvent une méthode ; seule la revendication à la 1re personne compte
    'we (have )?tested', 'our hands-on test', 'in our (hands-on )?tests?', 'after testing (it|them|this|these|the)',
  ],
  // Personnes (slugs auteur/relecteur) sans identité réelle vérifiable
  unverified_people: [],
  // Nombre max de pages publiées d'un coup (au-delà : étaler la mise en ligne)
  max_pages_per_release: 40,
  // Une même question de FAQ ne doit pas se répéter sur plus de N pages (1 : jamais deux fois sur le site)
  max_faq_repeat: 1,
  // Pages exclues des contrôles de similarité / minceur : gabarits (Astro) ou chemins (HTML)
  utility_templates: ['texte', 'contact', 'auteur', 'auteurs', 'legal', 'utilitaire'],
  utility_paths: ['^/(mentions-legales|politique-de-confidentialite|confidentialite|donnees-personnelles|cgu|cgv|cookies|contact|merci|plan-du-site|404)(/|$)'],
  min_words_money_page: 700,
  // Pages d'avis / classements (Google « write high quality reviews » + thin affiliation)
  review_templates: ['avis', 'classement', 'review', 'comparison', 'best'],
  min_numbers_per_1000_words: 8,
  drawback_patterns: ['limite', 'inconv[ée]nient', '[àa] [ée]viter', 'd[ée]faut', 'point faible', 'moins bon', 'contre', 'drawback', 'downside', 'cons\\b'],
  // Paramètres d'URL typiques d'un lien affilié (doivent porter rel="sponsored" ou nofollow)
  affiliate_url_params: ['ref', 'aff', 'affiliate', 'affid', 'partner', 'via', 'utm_medium=affil', 'clickid', 'irclickid', 'subid'],
  // Usurpation : le SITE se présente lui-même comme le canal officiel d'une marque ou d'un organisme tiers.
  // À la 1re personne uniquement : « rappelez le numéro officiel de la CPAM » est un conseil, pas une usurpation.
  impersonation_patterns: [
    '(ce site|notre site|nous) (est|sommes) (le|la|l\') ?(site|service|plateforme|num[ée]ro|espace) officiel',
    'bienvenue sur (le|la) (site|plateforme|espace) officiel',
    'notre (num[ée]ro|service client|ligne) officiel',
    '(appelez|contactez)[- ]nous au num[ée]ro officiel',
    'this is the official (site|website)', 'we are the official',
  ],
  // Lien vers la méthodologie : chemin attendu, HTML construit à inspecter, gabarits qui le rendent eux-mêmes
  methodology_path: '',
  // Divulgation d'affiliation attendue sur toute page qui contient un lien partenaire (source ou HTML construit)
  disclosure_patterns: ['data-affiliate-disclosure', 'liens? partenaires?', 'lien affili', 'commission', 'affiliate link', 'we may earn'],
  // Gabarits qui affichent eux-mêmes la mention d'affiliation ; true = le layout commun l'affiche sur toutes les pages
  templates_with_disclosure: [],
  disclosure_in_layout: false,
  // Énumérations façon « keyword stuffing » (villes, régions, variantes) : alerte, puis blocage au-delà du second seuil
  max_list_items_inline: 12,
  max_list_items_inline_fail: 20,
  // Même ancre exacte vers la même URL, répétée sur le site
  max_exact_anchor_repeat: 6,
  built_dir: '',
  templates_with_methodology_link: [],
  // Texte masqué : nombre de mots à partir duquel un bloc masqué non interactif fait échouer la page
  hidden_text_min_words: 30,
  // Fausse fraîcheur : fenêtre d'analyse de l'historique git (jours) ; les commits plus anciens sont ignorés
  freshness_window_days: 120,
  // Dossiers jamais considérés comme des pages (en plus des dossiers cachés)
  exclude_dirs: [],
};

// Dossiers qui ne contiennent jamais de pages publiées (outils, sources, documentation, ressources).
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'docs', 'doc', 'partials', 'includes', '_includes', 'components', 'layouts',
  'templates', 'template', 'scripts', 'scss', 'sass', 'css', 'js', 'img', 'images', 'assets', 'fonts', 'vendor', 'hors_prod', 'hors-prod',
  'archives', 'archive', 'v1', 'backup', 'backups', 'test', 'tests', 'coverage', 'tmp', 'offline', 'blog-offline', 'brouillons',
  'drafts', 'draft', 'staging', 'old', 'playwright-report', 'test-results', 'storybook-static']);

/** Config du projet ; une config illisible est signalée (configError) au lieu de passer silencieusement en mode HTML. */
function loadSpamConfig(configPath) {
  let cfg = {};
  let configError = null;
  try { cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8').replace(/^\uFEFF/, '')); } catch (e) { configError = `config illisible (${configPath}) : ${e.message}`; }
  return { cfg, spam: { ...DEFAULTS, ...(cfg.spam || {}) }, configError };
}

/** Alternative regex d'une liste de motifs ; une liste vide ne correspond à rien (et non à tout). */
function anyOf(list) {
  const parts = (list || []).filter((x) => typeof x === 'string' && x.length);
  return parts.length ? parts.join('|') : '(?!)';
}

/** Texte comparable : minuscules, sans accents, apostrophes typographiques ramenées à l'apostrophe droite. */
function plain(text) {
  return normalize(String(text).replace(/[’‘ʼ]/g, "'"));
}

const isAstroProject = (cfg) => /astro|mdx/i.test(String(cfg.project?.type || ''));

function frontmatter(raw) {
  return raw.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

function fmField(fm, key) {
  return fm.match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, 'm'))?.[1]?.trim() ?? '';
}

function fmList(fm, key) {
  const inline = fm.match(new RegExp(`^${key}:\\s*\\[(.*)\\]`, 'm'));
  if (inline) return inline[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  const bloc = fm.match(new RegExp(`^${key}:\\s*\\n((?:[ \\t]+-.*\\n?)+)`, 'm'));
  return bloc ? bloc[1].split('\n').map(l => l.replace(/^\s*-\s*/, '').replace(/^["']|["']$/g, '').trim()).filter(Boolean) : [];
}

function faqQuestions(fm) {
  return [...fm.matchAll(/^\s*-?\s*(?:q|question):\s*["']?(.+?)["']?\s*$/gm)].map(m => m[1]);
}

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', euro: '€', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return ENTITIES[e.toLowerCase()] ?? ' ';
});
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Corps lisible d'un fichier MDX/Markdown (sans frontmatter, imports, balises, composants). */
function bodyText(raw) {
  return raw
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .replace(/^(import|export)\s+.*$/gm, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_~`>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Contenu principal d'une page HTML : <main> s'il existe, sinon <body> sans en-tête, menu, pied de page ni scripts. */
function htmlMain(raw) {
  let h = raw.replace(/<!--[\s\S]*?-->/g, ' ');
  const main = h.match(/<main\b[\s\S]*<\/main>/i)?.[0] || h.match(/<body\b[\s\S]*<\/body>/i)?.[0] || h;
  return main.replace(/<(script|style|noscript|svg|template|header|nav|footer)\b[\s\S]*?<\/\1>/gi, ' ');
}

/**
 * Questions de FAQ d'une page HTML : <summary>, et intertitres H3/H4 situés dans un bloc FAQ (classe ou id « faq »)
 * ou sous un H2 « FAQ / Questions fréquentes ». Un encart « Besoin d'aide ? » n'est pas une FAQ.
 */
function htmlFaq(main) {
  const zones = [];
  for (const m of main.matchAll(/<(section|div|ul|dl|article)\b[^>]*(?:class|id)=["'][^"']*\bfaq[^"']*["'][^>]*>/gi)) {
    const close = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, 'gi');
    close.lastIndex = m.index;
    let depth = 0;
    for (let c = close.exec(main); c; c = close.exec(main)) {
      depth += c[1] ? -1 : 1;
      if (depth === 0) { zones.push(main.slice(m.index, c.index)); break; }
    }
  }
  for (const m of main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/gi)) {
    if (/faq|questions?\s+(fr[ée]quentes|courantes)|vos questions/i.test(stripTags(m[1]))) zones.push(m[2]);
  }
  const qs = [...main.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi)].map((m) => stripTags(m[1]));
  // Accordéons de questions n'importe où dans la page : <button class="accordion__header">…?</button>
  qs.push(...[...main.matchAll(/<button\b[^>]*class=["'][^"']*(?:accordion|faq|question)[^"']*["'][^>]*>([\s\S]*?)<\/button>/gi)].map((m) => stripTags(m[1])));
  for (const z of zones) qs.push(...[...z.matchAll(/<(h3|h4|dt|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => stripTags(m[2])));
  return [...new Set(qs)].filter((q) => q.endsWith('?') && q.split(/\s+/).length >= 4);
}

/** Questions déclarées dans les données structurées FAQPage écrites en dur (JSON-LD), visibles ou non. */
function schemaFaq(src) {
  const out = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    if (n['@type'] === 'Question' && typeof n.name === 'string') out.push(stripTags(n.name));
    Object.values(n).forEach(walk);
  };
  for (const m of src.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1])); } catch (e) { /* JSON-LD généré ou invalide : ignoré ici */ }
  }
  return out;
}

/** Questions de FAQ écrites dans le corps d'un MDX : H3/H4 ou <summary> sous un H2 « FAQ / Questions fréquentes ». */
function mdxFaq(content) {
  const out = [];
  for (const m of content.matchAll(/^##\s+(.+)$([\s\S]*?)(?=^##\s|(?![\s\S]))/gm)) {
    if (!/faq|questions?\s+(fr[ée]quentes|courantes)|vos questions/i.test(m[1])) continue;
    for (const q of m[2].matchAll(/^#{3,4}\s+(.+?)\s*$|<summary[^>]*>([\s\S]*?)<\/summary>|(?:question|q)=["']([^"']+)["']/gim)) out.push(stripTags(q[1] || q[2] || q[3]).replace(/[*_`]/g, ''));
  }
  // Composants de FAQ n'importe où dans la page : <FAQ question="…">, <FaqItem q="…">, <AccordionItem title="…?">
  for (const q of content.matchAll(/<(?:Faq|FAQ|Question|Accordion)\w*\b[^>]*?\b(?:question|q|title)=["']([^"']+)["']/g)) out.push(q[1]);
  return [...new Set(out.map((q) => q.trim()))].filter((q) => q.endsWith('?') && q.split(/\s+/).length >= 4);
}

/**
 * Modèle de page commun aux sites Astro/MDX et HTML.
 * { kind, fm, title, h1, h2s, description, published, draft, template, body, lines, faq, people, keywords, dates }
 */
function pageModel(file, raw) {
  raw = raw.replace(/^\uFEFF/, '');
  const ext = path.extname(file).toLowerCase();
  if (ext === '.html' || ext === '.htm' || ext === '.astro') {
    const src = ext === '.astro' ? raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') : raw;
    const main = htmlMain(src);
    const noindex = /noindex/i.test(metaContent(src, 'robots') || '');
    const blocks = main.replace(/<\/?(p|div|section|article|li|ul|ol|h[1-6]|tr|td|th|table|br|blockquote|figcaption|dt|dd|summary|details)\b[^>]*>/gi, '\n');
    return {
      kind: 'html', fm: '',
      title: htmlTitle(src) || '',
      h1: stripTags(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ''),
      h2s: [...main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => stripTags(m[1])),
      description: (metaContent(src, 'description') || '').replace(/\s+/g, ' ').trim(),
      published: !noindex, draft: noindex, template: '',
      // Preuve d'expérience déclarée dans une page HTML : <meta name="experience-proof" content="…">
      experienceProof: metaContent(src, 'experience-proof') || '',
      body: stripTags(main),
      lines: blocks.split('\n').map(stripTags).filter(Boolean),
      // Questions affichées + questions des FAQPage écrites en dur (Google lit les deux)
      faq: [...new Set([...htmlFaq(main), ...schemaFaq(src)])],
      faqSchema: schemaFaq(src),
      visibleText: stripTags(src.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<head\b[\s\S]*?<\/head>/gi, ' ')),
      people: [], keywords: [],
      dates: {
        published: src.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] || '',
        updated: src.match(/"dateModified"\s*:\s*"([^"]+)"/)?.[1] || '',
      },
    };
  }
  const fm = frontmatter(raw);
  const content = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const prose = content.replace(/^(import|export)\s[\s\S]*?(?=\n\s*\n|$(?![\s\S]))/gm, '').replace(/```[\s\S]*?```/g, ' ');
  return {
    kind: 'mdx', fm,
    title: fmField(fm, 'title'),
    h1: fmField(fm, 'h1') || (content.match(/^#\s+(.+)$/m)?.[1] || '').replace(/[*_`]/g, '').trim(),
    h2s: [...content.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].replace(/\s*\{#[^}]*\}\s*$/, '').trim()),
    description: fmField(fm, 'description'),
    published: isPublished(fm), draft: /^draft:\s*true/m.test(fm),
    template: fmField(fm, 'template') || fmField(fm, 'layout'),
    experienceProof: fmField(fm, 'experience_proof'),
    body: bodyText(raw),
    lines: prose.split('\n').map((l) => bodyText(l)).filter(Boolean),
    // FAQ : déclarée dans le frontmatter (- q: …) ou écrite dans le corps (intertitres en question sous un H2 « FAQ »)
    faq: [...new Set([...faqQuestions(fm), ...mdxFaq(content)])],
    people: ['auteur', 'relecteur', 'author', 'reviewer', 'personne'].map((k) => fmField(fm, k)).filter(Boolean),
    keywords: fmList(fm, 'keywords'),
    dates: {
      published: fmField(fm, 'publishedDate') || fmField(fm, 'datePublished') || fmField(fm, 'pubDate') || fmField(fm, 'date'),
      updated: fmField(fm, 'updatedDate') || fmField(fm, 'dateModified'),
    },
  };
}

/** Page utilitaire (légal, contact…) : exclue des contrôles de similarité et de minceur. */
function isUtility(model, url, spam) {
  if (model.template && spam.utility_templates.includes(model.template)) return true;
  return spam.utility_paths.some((re) => new RegExp(re, 'i').test(url || ''));
}

function walk(dir, exts, skip, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const e of entries) {
    if (e.name.startsWith('.') || skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, skip, acc);
    else if (exts.includes(path.extname(e.name).toLowerCase())) acc.push(p);
  }
  return acc;
}

/** Fichiers d'un dossier (compatibilité) : dossiers cachés et dossiers d'outils exclus. */
// minimal = true : seuls node_modules, dist et les dossiers cachés sont exclus (collections Astro nommées « docs », « components »…).
function findContentFiles(dir, exts = ['.mdx', '.md', '.html', '.htm'], extraSkip = [], minimal = false) {
  return walk(dir, exts, new Set([...(minimal ? ['node_modules', 'dist'] : SKIP_DIRS), ...extraSkip]));
}

const urlFromRel = (rel) => {
  const u = rel.split(path.sep).join('/').replace(/\.(mdx?|html?|astro)$/, '').replace(/(^|\/)index$/, '');
  return u ? `/${u}/` : '/';
};

/**
 * Pages du site, pour les sites Astro comme HTML.
 * Astro : collections de contenu (content_dir) + pages statiques (pages_dir, hors routes dynamiques [x]).
 * HTML : fichiers .html du projet (hors dossiers d'outils), 404 exclue.
 * Chaque entrée : { file, rel, url, source: 'content' | 'pages' | 'html' }.
 */
function listPages(root, cfg, spam = DEFAULTS) {
  const skip = [...(spam.exclude_dirs || [])];
  const out = [];
  if (isAstroProject(cfg)) {
    const contentDir = path.resolve(root, cfg.paths?.content_dir || 'src/content');
    const pagesDir = path.resolve(root, cfg.paths?.pages_dir || 'src/pages');
    // content_dir peut être un sous-dossier de pages_dir (ex. src/pages/blog) : ses fichiers sont alors des routes,
    // dont l'URL part de pages_dir ; chaque fichier n'est lu qu'une fois.
    const inPages = (d) => d === pagesDir || d.startsWith(pagesDir + path.sep);
    const seen = new Set();
    for (const f of findContentFiles(contentDir, ['.md', '.mdx'], skip, true)) {
      if (inPages(contentDir) && /\[.*\]/.test(path.relative(pagesDir, f))) continue;
      seen.add(f);
      out.push({ file: f, rel: path.relative(root, f), url: urlFromRel(path.relative(inPages(contentDir) ? pagesDir : contentDir, f)), source: inPages(contentDir) ? 'pages' : 'content' });
    }
    for (const f of findContentFiles(pagesDir, ['.astro', '.md', '.mdx', '.html'], skip, true)) {
      if (seen.has(f) || /\[.*\]/.test(path.relative(pagesDir, f))) continue;
      out.push({ file: f, rel: path.relative(root, f), url: urlFromRel(path.relative(pagesDir, f)), source: 'pages' });
    }
  } else {
    // Site HTML : les pages servies sont sous pages_dir (en principe la racine). content_dir peut désigner un dossier
    // de préparation (hors-prod…) : il n'est lu que s'il est sous pages_dir et hors des dossiers exclus.
    const pagesBase = path.join(root, cfg.paths?.pages_dir && cfg.paths.pages_dir !== '.' ? cfg.paths.pages_dir : '.');
    for (const f of findContentFiles(pagesBase, ['.html', '.htm'], skip)) {
      const rel = path.relative(root, f);
      if (/(^|\/)(404|template|_template|modele|gabarit)\.html?$/.test(rel)) continue;
      out.push({ file: f, rel, url: urlFromRel(rel), source: 'html' });
    }
  }
  return out;
}

function words(text) {
  return normalize(text).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function shingles(text, k) {
  const w = words(text);
  const set = new Set();
  for (let i = 0; i + k <= w.length; i++) set.add(w.slice(i, i + k).join(' '));
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const s of small) if (big.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Pages réellement publiées : ni draft, ni noindex. */
function isPublished(fm) {
  return !/^draft:\s*true/m.test(fm) && !/^noindex:\s*true/m.test(fm);
}

/** Date du jour au format AAAA-MM-JJ, en heure locale (et non UTC). */
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Négation ou citation portant sur l'expression : guillemet juste avant, ou négation dans les 3 mots qui précèdent
 * (« has not completed a hands-on test », « jamais "nous avons testé" »). Une négation plus haut dans la phrase
 * (« Sans surprise, nous avons testé… ») ne compte pas.
 */
function negatedOrQuoted(text, index) {
  const before = text.slice(Math.max(0, index - 80), index);
  if (/[«"“]\s*$/.test(before)) return true;
  const lastWords = before.split(/[.!?;:,]\s/).pop().trim().split(/\s+/).slice(-3).join(' ');
  return /\b(jamais|ni|ne|pas|never|not|no|without)\b|n['’]t\b|\bn['’]/i.test(lastWords);
}

module.exports = {
  anyOf, plain, htmlFaq,
  DEFAULTS, SKIP_DIRS, loadSpamConfig, isAstroProject, frontmatter, fmField, fmList, faqQuestions, schemaFaq,
  bodyText, htmlMain, stripTags, pageModel, isUtility, listPages, words, shingles, jaccard,
  findContentFiles, isPublished, localToday, negatedOrQuoted, urlFromRel,
};
