// Relecture du français : LanguageTool local, lexique et règles du secteur (CEE, énergie), formulations propres au site.
// Utilisé par validate-language.js (page par page) ; réutilisable par d'autres outils (require).
//
// Le fichier source (MDX, Markdown, HTML, Astro) est envoyé tel quel à LanguageTool sous forme de texte annoté :
// balises, code, frontmatter et composants sont marqués comme « markup », seul le texte visible est relu.
// Les positions renvoyées correspondent donc au fichier d'origine (ligne et colonne exactes).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const LT_URL = process.env.LANGUAGETOOL_URL || 'http://localhost:8081';
// Homebrew Apple Silicon, puis Intel
const LT_BIN = process.env.LANGUAGETOOL_BIN || ['/opt/homebrew/opt/languagetool/bin/languagetool-server', '/usr/local/opt/languagetool/bin/languagetool-server'].find((f) => fs.existsSync(f)) || '';

const BLOCK_TAGS = new Set(['p', 'div', 'section', 'article', 'aside', 'main', 'header', 'footer', 'nav', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figure', 'figcaption', 'details', 'summary', 'br', 'hr', 'form', 'label', 'button', 'option', 'select', 'textarea', 'fieldset', 'legend', 'title']);
const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', euro: '€', deg: '°', times: '×', thinsp: ' ', nnbsp: ' ', middot: '·', rarr: '→', larr: '←', ge: '≥', le: '≤', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', ocirc: 'ô', icirc: 'î', ucirc: 'û', acirc: 'â', Eacute: 'É', oelig: 'œ', sup2: '²', sup3: '³', check: '✓' };

// ---------- Données : lexique, anglicismes, règles ----------

function readList(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf-8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
}

/**
 * Dossier des données communes (lexique.txt, anglicismes.txt, regles.json), premier trouvé parmi :
 * config.language.data_dir (relatif à la racine du projet), $LANGUAGETOOL_CEE_DIR, ../languagetool-cee à côté du projet,
 * et le dossier voisin de SEOWK (le projet peut être une copie ou un worktree ailleurs).
 */
function loadLanguageData(cfg = {}, root = '.') {
  const lang = cfg.language || {};
  const candidates = [
    lang.data_dir && path.resolve(root, lang.data_dir),
    process.env.LANGUAGETOOL_CEE_DIR,
    path.resolve(root, '../languagetool-cee'),
    path.resolve(__dirname, '../../../languagetool-cee'),
  ].filter(Boolean);
  const dir = candidates.find((d) => fs.existsSync(path.join(d, 'lexique.txt'))) || candidates[0];
  let rules = {};
  const ruleErrors = [];
  try {
    if (fs.existsSync(path.join(dir, 'regles.json'))) rules = JSON.parse(fs.readFileSync(path.join(dir, 'regles.json'), 'utf-8'));
  } catch (e) {
    ruleErrors.push(`regles.json illisible : ${e.message}`);
  }
  const lexicon = new Set([...readList(path.join(dir, 'lexique.txt')), ...readList(path.resolve(root, lang.project_lexicon || '.seo-engine/lexique-projet.txt'))]);
  // Noms du projet (marque, auteur) : jamais signalés.
  const names = [cfg.project?.brand, cfg.project?.name, cfg.project?.author?.name].filter(Boolean).join(' ');
  for (const w of names.split(/[\s.,/()'’-]+/)) if (w) lexicon.add(w);
  return {
    dir,
    found: fs.existsSync(path.join(dir, 'lexique.txt')),
    lexicon,
    anglicisms: new Set(readList(path.join(dir, 'anglicismes.txt'))),
    disabled: rules.desactivees || [],
    blocking: new Set(rules.bloquantes || ['FR_SPELLING_RULE']),
    // Règles propres à un secteur (secteurs: ["cee"]) : seulement pour les sites qui le déclarent (language.sector)
    sector: (rules.secteur || []).filter((r) => !r.secteurs || r.secteurs.includes(lang.sector || 'general')),
    site: lang.site_rules || [],
    ruleErrors,
  };
}

// ---------- Texte annoté ----------

/** Plages de markup [début, fin, interprétation] pour un fichier source. */
function markupRanges(src, ext) {
  const r = [];
  const add = (re, interpretAs = '', group) => {
    for (const m of src.matchAll(re)) {
      const start = m.index + (group ? m[0].indexOf(m[group]) : 0);
      r.push([start, start + (group ? m[group].length : m[0].length), typeof interpretAs === 'function' ? interpretAs(m) : interpretAs]);
    }
  };
  const fm = src.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (fm) {
    // Frontmatter : seules les valeurs title / description / h1 sont relues.
    let pos = 0;
    for (const line of fm[0].split('\n')) {
      const v = line.match(/^(title|description|h1|excerpt|summary):\s*(["']?)(.+?)\2\s*$/);
      if (v) {
        const vs = pos + line.indexOf(v[3], v[1].length + 1);
        r.push([pos, vs, '\n\n'], [vs + v[3].length, pos + line.length + 1, '\n\n']);
      } else r.push([pos, pos + line.length + 1, '\n\n']);
      pos += line.length + 1;
    }
  }
  add(/<!--[\s\S]*?-->/g, '\n\n');
  add(/<![A-Za-z][^>]*>/g, '\n\n'); // <!DOCTYPE html>
  add(/<(script|style|svg|noscript|template|code|pre)\b[\s\S]*?<\/\1>/gi, '\n\n');
  if (ext === '.html' || ext === '.astro') {
    add(/<head\b[\s\S]*?<\/head>/gi, '\n\n');
    // Parties communes à tout le site : relues une fois, pas à chaque page. Un <header> d'article (sans menu) reste relu.
    add(/<(nav|footer)\b[\s\S]*?<\/\1>/gi, '\n\n');
    add(/<header\b(?:(?!<\/header>)[\s\S])*?<nav\b[\s\S]*?<\/header>/gi, '\n\n');
  }
  if (ext === '.md' || ext === '.mdx') {
    add(/^```[\s\S]*?^```/gm, '\n\n');
    add(/^(import|export)\s[\s\S]*?(?=\n\s*\n|$(?![\s\S]))/gm, '\n\n');
    add(/\{\/\*[\s\S]*?\*\/\}/g, '');
    add(/`[^`\n]+`/g, 'code');
    add(/!\[[^\]]*\]\([^)]*\)/g, '');
    add(/\]\([^)]*\)/g, '');
    add(/(?<!\\)\[(?=[^\]]*\]\()/g, '');
    add(/^\s{0,3}#{1,6}\s+/gm, '');
    add(/^\s*(?:[-*+]|\d+\.)\s+/gm, '');
    add(/^\s*>\s?/gm, '');
    add(/^\s*\|?(?:\s*:?-{2,}:?\s*\|)+\s*:?-*:?\s*\|?\s*$/gm, '\n\n');
    add(/\|/g, '\n\n');
    add(/\*\*|__|(?<![\p{L}\d])[*_](?=\S)|(?<=\S)[*_](?![\p{L}\d])/gu, '');
  }
  // Expressions JSX / Astro entre accolades (imbrication gérée), hors frontmatter.
  if (ext === '.mdx' || ext === '.astro') {
    const from = fm ? fm[0].length : 0;
    for (let i = from; i < src.length; i++) {
      if (src[i] !== '{') continue;
      let depth = 0;
      let j = i;
      for (; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}' && --depth === 0) break;
      }
      r.push([i, j + 1, '']);
      i = j;
    }
  }
  // Balises HTML et composants (les « > » entre guillemets ou accolades ne ferment pas la balise).
  for (const m of src.matchAll(/<\/?([A-Za-z][\w.:-]*)(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*\/?>/g)) {
    const name = m[1];
    const end = m.index + m[0].length;
    let as = '';
    if (BLOCK_TAGS.has(name.toLowerCase()) || /^[A-Z]/.test(name)) as = '\n\n';
    // Balise en ligne retirée avec une espace quand elle sépare deux éléments (</span><span>, </a><a>) ou qu'elle est
    // vide (img, input) : « Chauffage</span><span>Éligible » ne doit pas devenir « ChauffageÉligible ». Une balise
    // collée à un mot (l'<strong>aide</strong>, n<sup>o</sup>) reste retirée sans espace.
    else if ((m[0][1] === '/' && /^<[A-Za-z]/.test(src.slice(end, end + 2))) || /^(img|input|wbr|embed|object|iframe|video|audio|canvas|picture)$/i.test(name)) as = ' ';
    r.push([m.index, end, as]);
  }
  add(/&(#x?[0-9a-f]+|\w+);/gi, (m) => {
    const e = m[1];
    if (e[0] === '#') return String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? ENTITIES[e.toLowerCase()] ?? ' ';
  });
  // Retours à la ligne : fin de paragraphe en Markdown, simple espace en HTML.
  add(/[ \t]*\r?\n\s*/g, ext === '.md' || ext === '.mdx' ? '\n\n' : ' ');
  return r;
}

/** Découpe le source en segments { text } / { markup, interpretAs } et construit le texte visible avec sa table de positions. */
function annotate(src, ext) {
  const ranges = markupRanges(src, ext).sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const annotation = [];
  const map = []; // [début visible, début source, longueur] pour chaque segment de texte
  let visible = '';
  let pos = 0;
  const text = (end) => {
    if (end <= pos) return;
    map.push([visible.length, pos, end - pos]);
    annotation.push({ text: src.slice(pos, end) });
    visible += src.slice(pos, end);
    pos = end;
  };
  for (const [s, e, interpretAs] of ranges) {
    if (e <= pos) continue; // plage incluse dans une précédente
    text(s);
    const start = Math.max(s, pos);
    annotation.push({ markup: src.slice(start, e), interpretAs });
    visible += interpretAs;
    pos = e;
  }
  text(src.length);
  return { annotation, visible, map };
}

/** Position source d'une position du texte visible ; dans du markup (entité, balise), le texte suivant le plus proche. */
function toSource(map, vOffset, end = false) {
  for (const [v, s, len] of map) if (vOffset >= v && vOffset < v + len) return s + (vOffset - v);
  if (end) {
    for (let i = map.length - 1; i >= 0; i--) if (map[i][0] + map[i][2] <= vOffset) return map[i][1] + map[i][2] - 1;
  } else {
    for (const [v, s] of map) if (v >= vOffset) return s;
  }
  return -1;
}

function lineCol(src, offset) {
  const before = src.slice(0, offset);
  const line = before.split('\n').length;
  return { line, col: offset - before.lastIndexOf('\n') };
}

// ---------- Serveur LanguageTool ----------

async function serverUp(url = LT_URL) {
  try {
    return (await fetch(`${url}/v2/languages`, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
}

/**
 * Démarre le serveur local s'il est installé et arrêté. Il reste ensuite disponible pour les pages suivantes
 * (environ 800 Mo ; l'arrêter avec : pkill -f org.languagetool.server.HTTPServer). Un verrou évite que des validations
 * simultanées le démarrent chacune.
 */
async function ensureServer(url = LT_URL) {
  if (await serverUp(url)) return true;
  if (!LT_BIN) return false;
  const port = new URL(url).port || '8081';
  const lock = path.join(os.tmpdir(), `languagetool-${port}.lock`);
  let owner = false;
  try {
    fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
    owner = true;
  } catch {
    // Verrou d'un démarrage en cours (ou abandonné il y a plus de 2 minutes)
    try { if (Date.now() - fs.statSync(lock).mtimeMs > 120000) { fs.rmSync(lock); return ensureServer(url); } } catch {}
  }
  if (owner) spawn(LT_BIN, ['--port', port], { detached: true, stdio: 'ignore' }).unref();
  try {
    for (let i = 0; i < 40; i++) {
      await new Promise((res) => setTimeout(res, 1000));
      if (await serverUp(url)) return true;
    }
    return false;
  } finally {
    if (owner) try { fs.rmSync(lock); } catch {}
  }
}

// ---------- Contrôle ----------

const ACRONYM = /^[A-Z0-9][A-Z0-9&+.'’/-]*$/;
// Mots anglais : dictionnaire du système s'il existe (macOS), pour classer un mot inconnu en anglicisme plutôt qu'en faute.
let english = null;
function isEnglish(word) {
  if (english === null) {
    try {
      english = new Set(fs.readFileSync('/usr/share/dict/words', 'utf-8').split('\n').map((w) => w.toLowerCase()));
    } catch {
      english = new Set();
    }
  }
  const w = word.toLowerCase();
  return /^[a-z]+$/.test(w) && w.length > 2 && (english.has(w) || english.has(w.replace(/(s|es|ed|ing)$/, '')));
}
const UNIT_TYPOS = new Set(['KW', 'KWH', 'KWh', 'Kwh', 'Kw', 'MWH', 'Mwh', 'GWH']);

function ruleMatches(list, id) {
  return list.some((r) => (r.endsWith('*') ? id.startsWith(r.slice(0, -1)) : r === id));
}

/**
 * Remplacement d'une règle : $1…$9 et $& développés à partir de la correspondance.
 * keepCase : majuscule initiale conservée (formulations du site en début de phrase), jamais pour les unités et sigles.
 */
function expand(template, m, keepCase) {
  const out = template.replace(/\$(\d|&)/g, (x, k) => (k === '&' ? m[0] : m[Number(k)] ?? ''));
  return keepCase && /^\p{Lu}/u.test(m[0]) && /^\p{Ll}/u.test(out) ? out[0].toUpperCase() + out.slice(1) : out;
}

// Caractères de balisage : une correction qui les traverse n'est jamais appliquée automatiquement.
const MARKUP_CHARS = /[*_[\]<>&`{}|]/;

function acceptedWord(word, data) {
  if (data.lexicon.has(word) || data.lexicon.has(word.toLowerCase()) || data.lexicon.has(word[0].toLowerCase() + word.slice(1))) return true;
  if (ACRONYM.test(word) && /[A-Z]/.test(word) && !UNIT_TYPOS.has(word)) return true; // sigles, codes de fiche (BAR-TH-104)
  return false;
}

/**
 * Relit un fichier. Renvoie { available, issues, words } ; chaque issue :
 * { severity: 'error'|'warning', source, rule, message, line, col, found, replacements, context }.
 */
async function checkFile(filePath, opts = {}) {
  return checkSource(fs.readFileSync(filePath, 'utf-8'), path.extname(filePath).toLowerCase(), opts);
}

/** Même contrôle sur un texte en mémoire (ext : '.md', '.mdx', '.html', '.astro'). */
async function checkSource(src, ext, { cfg = {}, root = '.', url = LT_URL, autostart = true } = {}) {
  const data = loadLanguageData(cfg, root);
  src = src.replace(/^\uFEFF/, '');
  const { annotation, visible, map } = annotate(src, ext);
  const issues = [];
  const warnings = [...data.ruleErrors];
  const fr = (cfg.project?.language || 'fr') === 'fr';
  const push = (sev, source, rule, message, offset, length, replacements = [], auto = false) => {
    if (offset < 0 || length <= 0) return;
    const { line, col } = lineCol(src, offset);
    const found = src.slice(offset, offset + length);
    replacements = replacements.filter((x) => x !== found);
    if (source !== 'languagetool' && source !== 'anglicisme' && !replacements.length && auto) return; // « correction » identique : pas de faute
    const ctx = src.slice(Math.max(0, offset - 40), offset + length + 40).replace(/\s+/g, ' ');
    // auto : correction sûre, applicable sans relecture (règle marquée auto, bloquante, sans balisage traversé)
    const safe = auto && sev === 'error' && replacements.length === 1 && !MARKUP_CHARS.test(found);
    issues.push({ severity: sev, source, rule, message, line, col, offset, length, found, replacements: replacements.slice(0, 3), context: ctx, auto: safe });
  };

  // 1. LanguageTool
  const available = (autostart ? await ensureServer(url) : await serverUp(url));
  if (available) {
    const language = cfg.language?.variant || (fr ? 'fr' : cfg.project?.language === 'en' ? 'en-US' : cfg.project?.language || 'fr');
    const body = new URLSearchParams({ data: JSON.stringify({ annotation }), language, level: 'picky' });
    const fixed = data.disabled.filter((r) => !r.endsWith('*'));
    if (fixed.length) body.set('disabledRules', fixed.join(','));
    const res = await fetch(`${url}/v2/check`, { method: 'POST', body, signal: AbortSignal.timeout(120000) });
    if (!res.ok) throw new Error(`LanguageTool ${res.status}`);
    for (const m of (await res.json()).matches) {
      const id = m.rule.id;
      if (ruleMatches(data.disabled, id)) continue;
      const word = src.slice(m.offset, m.offset + m.length).replace(/&(#x?[0-9a-f]+|\w+);/gi, (e, n) => ENTITIES[n] || ' ');
      const repl = m.replacements.map((x) => x.value);
      if (id === 'FR_SPELLING_RULE' || id.startsWith('MORFOLOGIK')) {
        if (acceptedWord(word, data)) continue;
        if (/^[\w.-]*\.(fr|com|io|eu|org|net|gouv)\b/.test(src.slice(m.offset, m.offset + m.length + 30))) continue; // nom de domaine cité
        if (/[\d_]/.test(word)) continue; // versions, codes, notations (v1.6, E_élec) ; unités collées : règle du secteur
        if (data.anglicisms.has(word.toLowerCase()) || word.split(/\s+/).every(isEnglish)) {
          push('warning', 'anglicisme', 'ANGLICISME', 'Mot anglais : préférer un équivalent français s’il existe', m.offset, m.length);
          continue;
        }
        if (/\p{Ll}\p{Lu}|\p{Lu}{2}\p{Ll}/u.test(word)) continue; // identifiants et marques en casse mixte (myWallbox, JPMorgan)
        const strip = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const accentOnly = repl.some((x) => x !== word && strip(x) === strip(word));
        // Bloquant : mot courant mal orthographié, sur un site français avec lexique. Alerte : nom propre inconnu
        // (majuscule sans variante accentuée), mot composé ou à apostrophe, site non français, lexique absent.
        const doubtful = (/^\p{Lu}\p{Ll}+$/u.test(word) && !accentOnly) || /['’-]/.test(word) || !fr || !data.found;
        const sev = doubtful ? 'warning' : 'error';
        push(sev, 'languagetool', id, `${m.message} Si le mot est juste (nom propre, terme technique), l’ajouter à .seo-engine/lexique-projet.txt`, m.offset, m.length, repl);
        continue;
      }
      push(data.blocking.has(id) ? 'error' : 'warning', 'languagetool', id, m.message, m.offset, m.length, repl);
    }
  }

  // 2. Règles du secteur et du site, appliquées au texte visible
  const rules = [
    ...data.sector.map((r) => ({ ...r, source: 'secteur' })),
    // Formulations du site : bloquantes ; corrigées automatiquement seulement si la règle le dit (auto: true)
    ...data.site.map((r) => ({ id: `SITE_${r.find}`, motif: r.regex ? r.find : r.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags: r.case_sensitive ? '' : 'i', remplacement: r.replace, message: r.message || `Formulation propre au site : « ${r.replace} » plutôt que « ${r.find} »`, gravite: 'error', source: 'site', auto: r.auto === true })),
  ];
  for (const r of rules) {
    let re;
    try {
      const flags = [...new Set(`gu${(r.flags || '').replace(/[gu]/g, '')}`)].join('');
      re = new RegExp(r.bornes === false ? r.motif : `(?<![\\p{L}\\d])(?:${r.motif})(?![\\p{L}\\d])`, flags);
    } catch (e) {
      warnings.push(`Règle ${r.id} ignorée (motif invalide : ${e.message})`);
      continue;
    }
    for (const m of visible.matchAll(re)) {
      // Jamais à l'intérieur d'une adresse e-mail, d'une URL ou d'un nom de domaine (contact@desembouage-collectif.fr)
      const prev = visible.slice(Math.max(0, m.index - 2), m.index);
      const after = visible.slice(m.index + m[0].length, m.index + m[0].length + 60);
      if (/[@/:]$|[\w-]\.$/.test(prev) || /^[\w.-]*@/.test(after) || /^[\w-]*\.[a-z]{2,6}(?![\p{L}\d])/iu.test(after)) continue;
      const off = toSource(map, m.index);
      const end = toSource(map, m.index + m[0].length - 1, true) + 1; // fin dans le source (entités, balises traversées)
      const replacement = r.remplacement ? expand(r.remplacement, m, r.source === 'site' || r.casse === true) : null;
      push(r.gravite === 'error' ? 'error' : 'warning', r.source, r.id, r.message, off, end > off ? end - off : m[0].length, replacement ? [replacement] : [], r.auto === true);
    }
  }
  // Une même faute vue par plusieurs contrôles : on garde le plus précis (site, puis secteur, puis LanguageTool),
  // et, à précision égale, la correspondance la plus longue (« kwh cumac » plutôt que « 50 kwh »).
  const rank = { site: 0, secteur: 1, languagetool: 2, anglicisme: 3 };
  issues.sort((a, b) => a.offset - b.offset || rank[a.source] - rank[b.source] || b.length - a.length);
  const overlap = (x, y) => y.offset < x.offset + x.length && x.offset < y.offset + y.length;
  const kept = issues.filter((x) => !issues.some((y) => y !== x && overlap(x, y) && (rank[y.source] < rank[x.source] || (rank[y.source] === rank[x.source] && (y.length > x.length || (y.length === x.length && issues.indexOf(y) < issues.indexOf(x)))))));
  if (!data.found) warnings.push(`Lexique commun introuvable (${data.dir}) : orthographe en alerte seulement`);
  return { available, lexicon: data.found, issues: kept, warnings, words: visible.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length };
}

module.exports = { checkFile, checkSource, annotate, loadLanguageData, ensureServer, serverUp };
