#!/usr/bin/env node
// Garde-fous « spam policies » Google, page par page (voir references/spam-policies.md).
// scaled content abuse · thin affiliation · fausse expérience/E-E-A-T · fausse fraîcheur ·
// title stuffing · données structurées trompeuses · texte caché · schémas de liens (sites liés).
// Sites Astro/MDX et HTML : la page est lue par spam-utils.pageModel (title, H1, H2, publication, texte principal).

const fs = require('fs');
const path = require('path');
const { parseArgs, normalize } = require('./utils');
const S = require('./spam-utils');

const args = parseArgs();
const filePath = args.file;
const projectRoot = path.resolve(args.root || '.');
if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-spam.js --file <path> [--config <path>] [--root <path>]' }));
  process.exit(2);
}

const { cfg, spam, configError } = S.loadSpamConfig(args.config);
if (configError) {
  console.log(JSON.stringify({ validator: 'validate-spam', file: filePath, status: 'error', checks: [{ name: 'config_readable', status: 'fail', message: configError }] }, null, 2));
  process.exit(2);
}
let raw;
try { raw = fs.readFileSync(filePath, 'utf-8'); } catch (e) {
  console.log(JSON.stringify({ validator: 'validate-spam', file: filePath, status: 'error', checks: [{ name: 'file_readable', status: 'fail', message: e.message }] }, null, 2));
  process.exit(2);
}

const checks = [];
const warnings = [];
const add = (name, pass, message) => checks.push({ name, status: pass ? 'pass' : 'fail', message });

const page = S.pageModel(filePath, raw);
const fm = page.fm;
const template = page.template;
// URL de la page : depuis pages_dir pour une page statique Astro, depuis content_dir pour une collection, depuis la racine en HTML.
const pagesDirAbs = path.resolve(projectRoot, cfg.paths?.pages_dir || 'src/pages');
const isStaticAstro = S.isAstroProject(cfg) && path.resolve(filePath).startsWith(pagesDirAbs + path.sep);
// Page construite (dist/, build/ ou paths.build_dir) : son URL part du dossier de build. Sans cela, la page du build
// n'était pas reconnue et se comparait à son propre fichier source (src/pages/x/index.astro) : 50 à 74 % de « similarité ».
const buildDirs = [...new Set([cfg.paths?.build_dir, cfg.paths?.dist_dir, 'dist', 'build'].filter(Boolean))]
  .map((d) => path.resolve(projectRoot, d));
const buildDirOf = (f) => buildDirs.find((d) => path.resolve(f).startsWith(d + path.sep));
const myBuildDir = buildDirOf(filePath);
const myUrl = S.urlFromRel(path.relative(
  myBuildDir || (!S.isAstroProject(cfg) ? projectRoot : isStaticAstro ? pagesDirAbs : path.join(projectRoot, cfg.paths?.content_dir || 'src/content')),
  path.resolve(filePath)));
// URL servie d'une page listée (fichier source ou page construite), pour reconnaître la même page sous une autre forme.
const servedUrl = (p) => { const b = buildDirOf(p.file); return b ? S.urlFromRel(path.relative(b, path.resolve(p.file))) : p.url; };
const utility = S.isUtility(page, myUrl, spam);
const body = page.body;
const nbWords = S.words(body).length;
// Code de la page sans frontmatter (Astro : le script de frontmatter n'est pas du contenu).
const source = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

// Une page draft / noindex est contrôlée comme les autres (elle sera publiée plus tard, et passer en draft ne doit pas
// servir à contourner le contrôle) ; seules la similarité et la minceur, qui n'ont de sens qu'une fois publiée, sont sautées.
if (!page.published) warnings.push('Page draft/noindex : similarité et minceur non contrôlées');

// 1. Scaled content abuse : similarité du corps avec les autres pages publiées (collections et pages statiques)
if (page.published && !utility && nbWords >= 50) {
  const me = S.shingles(body, spam.shingle_size);
  let worst = { sim: 0, file: '' };
  for (const p of S.listPages(projectRoot, cfg, spam)) {
    if (path.resolve(p.file) === path.resolve(filePath) || (p.source === 'pages' && p.url === '/')) continue;
    // Même page sous une autre forme (build ↔ source) : jamais comparée à elle-même. Ne vaut que lorsque l'une des
    // deux est une page construite : deux sources distinctes de même URL restent comparées.
    if ((myBuildDir || buildDirOf(p.file)) && servedUrl(p) === myUrl) continue;
    let other;
    try { other = S.pageModel(p.file, fs.readFileSync(p.file, 'utf-8')); } catch (e) { continue; }
    if (!other.published || S.isUtility(other, p.url, spam) || S.words(other.body).length < 50) continue;
    const sim = S.jaccard(me, S.shingles(other.body, spam.shingle_size));
    if (sim > worst.sim) worst = { sim, file: p.rel };
  }
  const pct = Math.round(worst.sim * 100);
  add('scaled_content_similarity', worst.sim <= spam.max_body_similarity,
    `Similarité max du corps : ${pct} % avec ${worst.file || '—'} (seuil ${Math.round(spam.max_body_similarity * 100)} %)`);
  if (worst.sim > spam.warn_body_similarity && worst.sim <= spam.max_body_similarity)
    warnings.push(`Corps proche de ${worst.file} (${pct} %) : vérifier que la page apporte une information propre`);
}

// 2. Affiliation : densité de liens partenaires + page mince monétisée
const affRe = new RegExp(S.anyOf(spam.affiliate_patterns), 'gi');
const nbAff = (source.match(affRe) || []).length;
const perK = nbWords ? (nbAff * 1000) / nbWords : 0;
add('affiliate_density', perK <= spam.max_affiliate_per_1000_words,
  `${nbAff} lien(s) partenaire(s) dans le corps, ${perK.toFixed(1)} / 1 000 mots (max ${spam.max_affiliate_per_1000_words})`);
if (nbAff > 0 && !utility && page.published)
  add('thin_affiliate', nbWords >= spam.min_words_money_page,
    `${nbWords} mots de corps sur une page monétisée (min ${spam.min_words_money_page})`);

// 3. Fausse expérience (E-E-A-T) : « nous avons testé » sans preuve.
// Une affirmation niée (« nous n'avons pas testé », « has not completed a hands-on test ») ou citée n'en est pas une.
const nb = S.plain(body);
const claimRe = new RegExp(S.anyOf(spam.experience_claims.map(c => S.plain(c))), 'gi');
let claim = null;
for (const m of nb.matchAll(claimRe)) {
  if (!S.negatedOrQuoted(nb, m.index)) { claim = m; break; }
}
const proof = page.experienceProof;
const proofHow = page.kind === 'html' ? '<meta name="experience-proof" content="…">' : 'experience_proof dans le frontmatter';
add('experience_claims', !claim || !!proof,
  claim ? (proof ? `Expérience revendiquée (« ${claim[0]} »), preuve : ${proof}` : `Affirmation d'expérience sans preuve : « ${claim[0]} » (déclarer la preuve : ${proofHow}, ou reformuler)`) : 'Aucune affirmation d\'expérience vécue non prouvée');

// 4. Personnes non vérifiées
const unverified = page.people.filter(p => spam.unverified_people.includes(p));
if (['auteur', 'author', 'profile'].includes(template)) {
  add('author_identity', !unverified.length,
    unverified.length ? `Fiche auteur publiée pour une identité non vérifiée (${unverified.join(', ')}) : passer en draft tant que l'identité réelle n'est pas publiée` : 'Fiche auteur : identité vérifiée');
} else if (unverified.length) {
  warnings.push(`Auteur/relecteur sans identité vérifiée : ${unverified.join(', ')} (le gabarit ne doit pas le présenter comme expert)`);
}

// 5. Title / H1 stuffing
const stuffing = (t) => {
  if (!t) return null;
  // Une plage d'années (« 2026-2030 », « 2026 à 2030 ») compte pour une seule mention
  const years = t.replace(/\b(20\d\d)\s*(?:[-–—/]|à|au|to)\s*20\d\d\b/g, '$1').match(/\b20\d\d\b/g) || [];
  if (new Set(years).size < years.length) return `année répétée (${years.join(', ')})`;
  const seps = (t.match(/\s[|–—-]\s|\|/g) || []).length;
  if (seps >= 3) return `${seps} séparateurs (liste de mots-clés)`;
  const stop = new Set(['le', 'la', 'les', 'de', 'des', 'du', 'et', 'en', 'un', 'une', 'pour', 'a', 'au', 'aux', 'vs', 'the', 'and', 'for', 'of', 'd', 'l']);
  const counts = {};
  // « air/eau ou eau/eau », « eau-eau, sol-eau » : un couple technique compte pour un seul terme ; codes de fiche
  // (BAT-TH-113) et références (n° 2026-123) ignorés.
  const prepared = t
    .replace(/\b[A-Z]{2,5}-[A-Z]{2,3}-\d{2,4}\b/g, ' ')
    .replace(/(\p{L}+)\s*[/-]\s*(\p{L}+)/gu, '$1$2');
  for (const w of S.words(prepared)) if (!stop.has(w) && w.length > 2) counts[w] = (counts[w] || 0) + 1;
  const rep = Object.entries(counts).find(([, n]) => n >= 3);
  return rep ? `« ${rep[0]} » répété ${rep[1]} fois` : null;
};
const ts = stuffing(page.title), hs = stuffing(page.h1);
add('title_stuffing', !ts && !hs, ts || hs ? `Bourrage : ${[ts && 'title ' + ts, hs && 'H1 ' + hs].filter(Boolean).join(' ; ')}` : 'Title et H1 sans bourrage');

// 6. Fraîcheur : dates cohérentes, comparées en jour local (la vérification git est faite par audit-spam.js)
const day = (d) => String(d || '').slice(0, 10);
const pub = day(page.dates.published), upd = day(page.dates.updated);
const today = S.localToday();
const dateIssues = [];
if (upd && upd > today) dateIssues.push(`date de mise à jour dans le futur (${upd})`);
if (pub && pub > today) dateIssues.push(`date de publication dans le futur (${pub})`);
if (pub && upd && upd < pub) dateIssues.push(`mise à jour (${upd}) antérieure à la publication (${pub})`);
add('dates_coherent', !dateIssues.length, dateIssues.length ? dateIssues.join(' ; ') : 'Dates cohérentes');

// 7. Données structurées trompeuses
const schemaTypes = S.fmList(fm, 'schema');
const ldTypes = [...raw.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
const hasAggregate = [...schemaTypes, ...ldTypes].includes('AggregateRating');
// Données structurées FAQPage : chaque question déclarée doit être affichée sur la page (règle Google des données structurées).
if (page.faqSchema?.length) {
  const flat = (t) => S.plain ? S.plain(t) : t;
  const key = (t) => normalize(flat(t).replace(/[’‘]/g, "'")).replace(/[^a-z0-9]/g, '');
  const visible = key(page.visibleText || page.body);
  const hiddenQs = page.faqSchema.filter((q) => !visible.includes(key(q)));
  add('faq_schema_visible', !hiddenQs.length, hiddenQs.length ? `${hiddenQs.length} question(s) du FAQPage absentes du texte affiché : ${hiddenQs.slice(0, 5).map((q) => `« ${q} »`).join(', ')}` : 'Questions du FAQPage toutes affichées');
}

add('no_fake_aggregate_rating', !hasAggregate || !!S.fmField(fm, 'aggregate_rating_source'),
  hasAggregate ? 'AggregateRating sans source d\'avis réels (aggregate_rating_source)' : 'Pas de note agrégée');
const brand = normalize(cfg.project?.brand || cfg.project?.name || '');
const reviewed = normalize(S.fmField(fm, 'marque') || S.fmField(fm, 'itemReviewed') || '');
const selfReview = !!(brand && reviewed && reviewed === brand);
add('no_self_serving_review', !selfReview,
  selfReview ? 'Review auto-promotionnelle : l\'entité notée est le site lui-même' : 'Review : l\'entité notée n\'est pas le site lui-même');

// 8. Texte caché : un bloc masqué n'est suspect que s'il contient des liens ou un vrai texte ET qu'aucun script
//    ni contrôle ne l'affiche (résultat de calculateur, message d'erreur, onglet, accordéon sont légitimes).
const HIDE = /display\s*:\s*['"]?none|visibility\s*:\s*['"]?hidden|font-size\s*:\s*['"]?0(?:\.0+)?(?:px|em|rem|pt|%)?\s*(?:['";,}!]|$)|text-indent\s*:\s*-\d{3,}|(?:left|top)\s*:\s*-\d{4,}px|opacity\s*:\s*['"]?0(?![.\d])/i;
function innerOf(src, start, tag) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'gi');
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m[2]) continue; // auto-fermante
    depth += m[1] ? -1 : 1;
    if (depth === 0) return src.slice(start, m.index);
  }
  return '';
}
// Scripts de la page (en ligne et fichiers locaux référencés) : un bloc dont l'id ou une classe y figure est interactif.
let pageScripts = [...raw.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
for (const m of raw.matchAll(/<script\b[^>]*\bsrc=["']([^"':]+)["']/gi)) {
  const ref = m[1].split('?')[0];
  const file = ref.startsWith('/') ? path.join(projectRoot, ref) : path.resolve(path.dirname(filePath), ref);
  try { if (file.startsWith(projectRoot)) pageScripts += `\n${fs.readFileSync(file, 'utf-8')}`; } catch (e) {}
}
const hiddenFails = [];
const hiddenWarns = [];
for (const m of source.matchAll(/<([a-zA-Z][\w.-]*)\b([^>]*?)\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\{([^}]*)\}\})([^>]*)>/g)) {
  const style = m[3] ?? m[4] ?? m[5] ?? '';
  if (!HIDE.test(style)) continue;
  const tag = m[1];
  const attrs = `${m[2]} ${m[6]}`;
  const inner = /\/\s*$/.test(m[6]) ? '' : innerOf(source, m.index, tag);
  const text = S.stripTags(inner);
  const nWords = text ? text.split(/\s+/).length : 0;
  const hasLinks = /<a\s[^>]*href|\]\(https?:/i.test(inner);
  const id = attrs.match(/\bid\s*=\s*["']([^"']+)["']/)?.[1];
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const classes = (attrs.match(/\bclass(?:Name)?\s*=\s*["']([^"']+)["']/)?.[1] || '').split(/\s+/).filter((c) => c.length > 2);
  // Interactif = un script ou un contrôle l'affiche : id ou classe utilisés par un script, aria-controls, rôle d'onglet
  // ou de dialogue, directive x-show / v-show. Ni data-*, ni aria-hidden, ni une classe « visually-hidden » ne suffisent.
  const interactive = (id && new RegExp(`['"#]${esc(id)}['"\\s.:\\[]|aria-controls=["']${esc(id)}|for=["']${esc(id)}`).test(`${raw.replace(m[0], '')}\n${pageScripts}`))
    || classes.some((c) => !/hidden|sr-only|invisible/i.test(c) && new RegExp(`['".]${esc(c)}\\b`).test(pageScripts))
    || /\srole=["'](tabpanel|dialog|alertdialog|alert|status|tooltip|menu)["']|\s(x-show|v-show|x-cloak)\b/i.test(attrs);
  const label = `<${tag}${id ? ` id="${id}"` : ''}> (${nWords} mots${hasLinks ? ', liens' : ''})`;
  if (!nWords && !hasLinks) continue; // conteneur vide rempli par script (résultat, erreur)
  if (!interactive && (hasLinks || nWords >= spam.hidden_text_min_words)) hiddenFails.push(label);
  else if (!interactive) hiddenWarns.push(label);
}
add('no_hidden_text', !hiddenFails.length, hiddenFails.length ? `Bloc masqué sans mécanisme d'affichage : ${hiddenFails.slice(0, 3).join(', ')}` : 'Aucun texte masqué suspect');
if (hiddenWarns.length) warnings.push(`Court texte masqué sans script identifié (vérifier qu'il s'affiche pour l'utilisateur) : ${hiddenWarns.slice(0, 3).join(', ')}`);

// 9. Schémas de liens : liens vers les sites liés du même éditeur
const related = [...(cfg.portfolio?.related_sites || []), ...(spam.forbidden_domains || [])]
  .map(d => String(d).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')).filter(Boolean);
// Borne finale stricte : « praxis-energie » ne doit pas correspondre à « praxis-energie-industrie »
const relHits = related.filter(d => new RegExp(`(^|[^\\w.-])(www\\.)?${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'i').test(source));
add('no_related_site_links', !relHits.length,
  relHits.length ? `Mention/lien vers un site lié du portefeuille : ${relHits.join(', ')}` : 'Aucun lien vers les sites liés');

// HTML construit (spam.built_dir) : pour les éléments rendus par le gabarit (méthodologie, mention d'affiliation)
function renderedHtml() {
  if (!spam.built_dir) return null;
  const rel = myUrl.replace(/^\/|\/$/g, '');
  for (const cand of [path.join(projectRoot, spam.built_dir, rel, 'index.html'), path.join(projectRoot, spam.built_dir, `${rel || 'index'}.html`)]) {
    try { return fs.readFileSync(cand, 'utf-8'); } catch (e) {}
  }
  return null;
}

// 10. Avis / classements : preuves quantitatives, limites, alternatives, justification
//     (Google « How to write high quality reviews » ; thin affiliation)
if (spam.review_templates.includes(template)) {
  const nums = (body.match(/\d+(?:[.,]\d+)?\s?(?:%|€|\$|£|\/10|\/5|€\/mois|mois|jours?|h\b)?/g) || []).length;
  const numsPerK = nbWords ? (nums * 1000) / nbWords : 0;
  add('review_quantitative', numsPerK >= spam.min_numbers_per_1000_words,
    `${nums} données chiffrées (${numsPerK.toFixed(1)} / 1 000 mots, min ${spam.min_numbers_per_1000_words})`);
  const drawRe = new RegExp(S.anyOf(spam.drawback_patterns), 'i');
  const hasDrawbacks = drawRe.test(body) || S.fmList(fm, 'contre').length > 0 || S.fmList(fm, 'a_eviter_si').length > 0 || S.fmList(fm, 'cons').length > 0;
  add('review_drawbacks', hasDrawbacks, hasDrawbacks ? 'Limites / inconvénients exposés' : 'Aucune limite ni inconvénient exposé (avis promotionnel)');
  const methodoRe = new RegExp(spam.methodology_path ? spam.methodology_path.replace(/\//g, '\\/') : 'm[ée]thodolog|methodology|comment nous (notons|classons|testons)|how we (rate|rank|test)', 'i');
  const methodo = methodoRe.test(raw) || methodoRe.test(renderedHtml() || '') || (spam.templates_with_methodology_link || []).includes(template);
  add('review_ranking_justified', methodo, methodo ? 'Classement/note rattaché à une méthodologie' : 'Note ou classement sans lien vers la méthodologie');
}

// 11. Liens affiliés non qualifiés (link spam : rel="sponsored" ou nofollow obligatoire)
// Un paramètre peut être donné avec sa valeur (« utm_medium=affil ») : on n'ajoute alors pas de « = ».
const paramRe = new RegExp(`[?&](?:${S.anyOf(spam.affiliate_url_params.map((x) => (x.includes('=') ? x : `${x}=`)))})`, 'i');
const unqualified = [];
for (const m of source.matchAll(/<a\s[^>]*href=["'](https?:[^"']+)["'][^>]*>/gi))
  if (paramRe.test(m[1]) && !/rel=["'][^"']*(sponsored|nofollow)/i.test(m[0])) unqualified.push(m[1]);
for (const m of source.matchAll(/\]\((https?:[^)\s]+)\)/g))
  if (paramRe.test(m[1])) unqualified.push(m[1]);
add('affiliate_links_qualified', !unqualified.length,
  unqualified.length ? `Lien(s) d'affiliation sans rel="sponsored" : ${unqualified.slice(0, 3).join(', ')}` : 'Liens d\'affiliation qualifiés');

// 12. Divulgation d'affiliation : dans la page, dans le HTML construit, ou déclarée rendue par le gabarit.
//     Sans HTML construit, une absence n'est pas vérifiable : alerte au lieu d'un échec.
if (nbAff > 0) {
  const discRe = new RegExp(S.anyOf(spam.disclosure_patterns), 'i');
  const built = renderedHtml();
  const byTemplate = spam.disclosure_in_layout === true || (spam.templates_with_disclosure || []).includes(template);
  const disclosed = discRe.test(raw) || (built && discRe.test(built)) || byTemplate;
  if (disclosed || built !== null) {
    add('affiliate_disclosure', !!disclosed, disclosed ? 'Divulgation d\'affiliation présente' : 'Liens partenaires sans divulgation visible, y compris dans le HTML construit (ajouter une mention d\'affiliation)');
  } else {
    warnings.push('Liens partenaires sans mention d\'affiliation dans la source : vérifier que le gabarit l\'affiche (déclarer spam.templates_with_disclosure ou spam.disclosure_in_layout, ou renseigner spam.built_dir)');
  }
}

// 13. Énumérations de mots-clés (villes, régions, variantes) — exemple cité par Google.
//     Analysées sur le texte visible ligne par ligne : ni imports, ni données, ni nombres.
let longest = 0;
let longestLine = '';
for (const line of page.lines) {
  const parts = line.split(/\s*[,;]\s*/).filter(Boolean);
  const items = parts.filter(x => x.split(/\s+/).length <= 3 && /\p{L}{3}/u.test(x) && !/^\d/.test(x));
  const run = items.length >= 3 && items.length >= parts.length * 0.8 ? items.length : 0;
  if (run > longest) { longest = run; longestLine = line; }
}
add('no_keyword_lists', longest <= spam.max_list_items_inline_fail,
  longest > spam.max_list_items_inline_fail ? `Énumération de ${longest} termes courts sur une ligne (liste de mots-clés) : « ${longestLine.slice(0, 120)}… »` : 'Pas d\'énumération de mots-clés');
if (longest > spam.max_list_items_inline && longest <= spam.max_list_items_inline_fail)
  warnings.push(`Énumération de ${longest} termes courts sur une ligne : vérifier qu'il ne s'agit pas d'une liste de mots-clés (« ${longestLine.slice(0, 80)}… »)`);

// 14. Usurpation (scam and fraud) : le site se présente lui-même comme le canal officiel d'un tiers.
const impRe = new RegExp(S.anyOf(spam.impersonation_patterns.map((x) => S.plain(x))), 'gi');
let imp = null;
for (const m of nb.matchAll(impRe)) if (!S.negatedOrQuoted(nb, m.index)) { imp = m; break; }
add('no_impersonation', !imp, imp ? `Formulation d'usurpation possible : « ${imp[0]} »` : 'Aucune formulation d\'usurpation');

const failed = checks.filter(c => c.status === 'fail').length;
console.log(JSON.stringify({
  validator: 'validate-spam', file: filePath, status: failed ? 'fail' : 'pass',
  words: nbWords, affiliate_links: nbAff,
  ...(warnings.length ? { warnings } : {}), checks,
}, null, 2));
// exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
process.exitCode = failed ? 1 : 0;
