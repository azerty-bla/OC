const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Expression d'un mot ou d'une expression entière, avec des limites Unicode : `\b` de JavaScript ne connaît que [A-Za-z0-9_],
 * si bien que `\btres\b` trouvait « tres » dans « Fenêtres » (ê n'est pas une lettre pour \b). `pattern` est une source
 * d'expression régulière (déjà échappée si besoin).
 */
function wordRegex(pattern, flags = '') {
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${pattern})(?![\\p{L}\\p{N}_])`, flags.includes('u') ? flags : `${flags}u`);
}

function countKeyword(text, keyword) {
  const matches = normalize(text).match(wordRegex(escapeRe(normalize(keyword)), 'g'));
  return matches ? matches.length : 0;
}

function textIncludesKeyword(text, keyword) {
  return wordRegex(escapeRe(normalize(keyword))).test(normalize(text));
}

// ---------- HTML : attributs, entités, contenu principal ----------

const ENTITIES = {
  nbsp: '\u00a0', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', euro: '€', deg: '°', sup2: '²', sup3: '³', times: '×',
  thinsp: '\u2009', nnbsp: '\u202f', shy: '', middot: '·', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à',
  acirc: 'â', ccedil: 'ç', ocirc: 'ô', ouml: 'ö', ucirc: 'û', ugrave: 'ù', uuml: 'ü', icirc: 'î', iuml: 'ï', oelig: 'œ',
  aelig: 'æ', Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Agrave: 'À', Acirc: 'Â', Ccedil: 'Ç', Ocirc: 'Ô', Icirc: 'Î', OElig: 'Œ',
};

/** Décode les entités HTML (&#39; &rsquo; &#x2019; &amp;…) ; une entité inconnue est laissée telle quelle. */
function decodeEntities(s) {
  return String(s ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e] ?? ENTITIES[e.toLowerCase()] ?? m;
  });
}

// Une balise ouvrante entière : les « > » et les apostrophes à l'intérieur d'une valeur entre guillemets n'arrêtent rien.
// Les expressions Astro/JSX entre accolades ({a > b}) sont sautées de même.
const TAG_BODY = `(?:[^>"'{]|"[^"]*"|'[^']*'|\\{[^}]*\\})*`;

/**
 * Attributs d'une balise ouvrante, valeurs décodées, noms en minuscules. Chaque valeur est lue jusqu'au guillemet qui
 * l'a ouverte : content="barres d'appui" donne « barres d'appui » (l'ancienne lecture ["'](.*?)["'] s'arrêtait à l'apostrophe).
 */
function parseAttrs(tag) {
  const out = {};
  const inner = String(tag).replace(/^<[^\s>/]+/, '').replace(/\/?>$/, '');
  for (const m of inner.matchAll(/([^\s"'>\/={}]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{[^}]*\})|([^\s"'=<>`{]+)))?|\{[^}]*\}/g)) {
    if (!m[1]) continue; // {...spread} Astro/JSX
    const name = m[1].toLowerCase();
    if (name in out) continue; // HTML : le premier attribut du même nom l'emporte
    // Valeur calculée ({expression} Astro/JSX) : inconnue avant le build, lue comme vide.
    out[name] = m[4] !== undefined ? '' : decodeEntities(m[2] ?? m[3] ?? m[5] ?? '');
  }
  return out;
}

/** Balises ouvrantes `name` d'un document HTML : [{ tag, index, attrs }]. */
function findTags(html, name) {
  return [...String(html).matchAll(new RegExp(`<${name}(?=[\\s/>])${TAG_BODY}>`, 'gi'))]
    .map((m) => ({ tag: m[0], index: m.index, attrs: parseAttrs(m[0]) }));
}

/** content d'une balise <meta name|property="…">, décodé ; null si absente. */
function metaContent(html, name) {
  const t = findTags(html, 'meta').find((x) => (x.attrs.name || x.attrs.property || '').toLowerCase() === name.toLowerCase());
  return t ? (t.attrs.content ?? '') : null;
}

/** href de la première balise <link rel="…"> (rel peut contenir plusieurs valeurs) ; null si absente. */
function linkHref(html, rel) {
  const t = findTags(html, 'link').find((x) => (x.attrs.rel || '').toLowerCase().split(/\s+/).includes(rel.toLowerCase()));
  return t ? (t.attrs.href ?? '') : null;
}

/** Texte du <title> (hors SVG), entités décodées et espaces réduits ; null si absent. */
function htmlTitle(html) {
  const head = String(html).replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ');
  const m = head.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : null;
}

/**
 * Zone de contenu éditorial d'une page HTML construite : <main> (du premier <main> au dernier </main>), sinon <article>,
 * sinon <body> sans <header>, <nav> ni <footer>. En-tête, menu et pied, communs à tout le site, ne sont pas le texte de la page.
 */
function mainHtml(html) {
  const h = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  const main = h.match(/<main(?=[\s>])[^>]*>([\s\S]*)<\/main>/i);
  if (main) return main[1];
  const article = h.match(/<article(?=[\s>])[^>]*>([\s\S]*)<\/article>/i);
  if (article) return article[1];
  const body = (h.match(/<body(?=[\s>])[^>]*>([\s\S]*)<\/body>/i) || [])[1] ?? h;
  return body.replace(/<(header|nav|footer)(?=[\s>])[\s\S]*?<\/\1>/gi, ' ');
}

// Séparateur de phrase posé à la fermeture des blocs sans ponctuation finale (titres, cellules, éléments de liste…).
const SENTENCE_BREAK = '\u2029';
/**
 * Pose une fin de phrase à la fermeture des blocs : titres, li, td, th, dt, dd, summary, p, div, section… et <br>, ainsi
 * qu'entre deux éléments en ligne accolés (</span><span> : badges, ligne d'auteur), qui s'affichent séparés.
 */
function markSentenceBreaks(html) {
  return String(html)
    .replace(/<\/(h[1-6]|li|td|th|dt|dd|summary|caption|figcaption|p|div|section|article|aside|header|footer|nav|blockquote|figure|tr|table|ul|ol|dl|details|button|label)\s*>/gi, `$&${SENTENCE_BREAK}`)
    .replace(/<br\s*\/?>/gi, `$&${SENTENCE_BREAK}`)
    .replace(/(<\/[a-z][\w-]*\s*>)(?=<[a-z])/gi, `$1${SENTENCE_BREAK}`);
}
/** Découpe en phrases : ponctuation finale suivie d'un espace, ou fin de bloc (SENTENCE_BREAK). */
function splitSentences(text) {
  return String(text).split(/(?<=[.!?…])\s+|\s*\u2029\s*/);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const result = {
    file: null,
    sidecar: null,
    config: '.seo-engine/config.json',
    root: '.',
    dryRun: false,
  };

  const positional = [];
  const named = new Set();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case '--file': result.file = next; i++; break;
      case '--sidecar': result.sidecar = next; named.add('sidecar'); i++; break;
      case '--config': result.config = next; named.add('config'); i++; break;
      case '--root': result.root = next; named.add('root'); i++; break;
      case '--dry-run': result.dryRun = true; break;
      default:
        if (!arg.startsWith('--')) positional.push(arg);
        break;
    }
  }
  // Appels de l'ancienne génération (un validate-all personnalisé peut encore les utiliser) : arguments positionnels,
  // propres à chaque validateur. Les options nommées gardent la priorité.
  const LEGACY = {
    'validate-meta.js': ['file', 'config'],
    'validate-structure.js': ['file', 'sidecar'],
    'validate-links.js': ['file', 'root', 'config'],
    'validate-duplicates.js': ['file', 'root', 'config'],
  };
  const order = LEGACY[require('path').basename(process.argv[1] || '')] || ['file'];
  order.forEach((key, i) => {
    if (positional[i] === undefined) return;
    if (key === 'file' && !result.file) result.file = positional[i];
    else if (key !== 'file' && !named.has(key)) result[key] = positional[i];
  });

  return result;
}

module.exports = {
  normalize, countKeyword, textIncludesKeyword, parseArgs, wordRegex, escapeRe,
  decodeEntities, parseAttrs, findTags, metaContent, linkHref, htmlTitle, mainHtml, markSentenceBreaks, splitSentences, SENTENCE_BREAK,
};
