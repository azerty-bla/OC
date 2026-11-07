#!/usr/bin/env node
// Audit anti-spam à l'échelle du site (avant chaque mise en ligne de lot), sites Astro/MDX et HTML.
// Complète validate-spam.js (page par page) avec les signaux que seule une vue globale révèle :
// volume publié d'un coup, pages quasi identiques (y compris « à entité près » = doorways),
// FAQ recyclées, fausse fraîcheur (git), fiches auteur non vérifiées, pages de confiance,
// code de cloaking / redirections trompeuses / back button hijacking, liens vers des pages non publiées.
// Usage : node .seo-engine/scripts/audit-spam.js [--config .seo-engine/config.json] [--root .] [--out docs/AUDIT-SPAM.md]
// Réf. : .seo-engine/references/spam-policies.md

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { normalize } = require('./utils');
const S = require('./spam-utils');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const root = path.resolve(arg('--root', '.'));
const configPath = arg('--config', path.join(root, '.seo-engine/config.json'));
const outPath = path.resolve(arg('--out', path.join(root, 'docs/AUDIT-SPAM.md')));
const { cfg, spam, configError } = S.loadSpamConfig(configPath);
if (configError) {
  console.log(JSON.stringify({ validator: 'audit-spam', status: 'error', message: configError }, null, 2));
  process.exit(2);
}
const astro = S.isAstroProject(cfg);

const unreadable = [];
const all = S.listPages(root, cfg, spam)
  .filter((p) => path.resolve(p.file) !== outPath)
  .map((p) => {
    let raw;
    try { raw = fs.readFileSync(p.file, 'utf-8'); } catch (e) { unreadable.push(`${p.rel} : ${e.message}`); return null; }
    const m = S.pageModel(p.file, raw);
    return { ...p, f: p.file, raw, ...m, words: S.words(m.body).length };
  })
  .filter(Boolean);
// Pages éditoriales : collections Astro, pages HTML, et pages statiques Astro qui portent du contenu (hors accueil,
// pages utilitaires et pages de moins de 150 mots).
const pub = all.filter((p) => p.published);
const editorial = pub.filter((p) => !S.isUtility(p, p.url, spam) && (p.source !== 'pages' || (p.url !== '/' && p.words >= 150)));

const results = [];
const res = (id, level, titre, lignes) => { results.push({ id, level, titre, lignes }); };

// 1. Volume publié d'un coup (vélocité)
const pubContent = editorial;
res('release_volume', pubContent.length > spam.max_pages_per_release ? 'warn' : 'pass',
  `Volume de la mise en ligne : ${pubContent.length} pages publiées (${all.filter((p) => !p.published).length} draft/noindex)`,
  pubContent.length > spam.max_pages_per_release ? [`Au-delà de ${spam.max_pages_per_release} pages : étaler la publication (domaine neuf = confiance à construire).`] : []);

// 2. Pages quasi identiques : corps brut + corps « à entité près » (doorways / variantes par ville, statut, marque)
const mask = (text, own) => S.words(text).map((w) => (own.has(w) ? '§' : w)).join(' ');
const ownWords = (p, extra = []) => new Set([...p.keywords, p.title, p.h1, S.fmField(p.fm, 'marque'), ...extra].flatMap((k) => S.words(k || '')).filter((w) => w.length > 3));
const sh = editorial.filter((p) => p.words >= 50).map((p) => ({ p, raw: S.shingles(p.body, spam.shingle_size), masked: S.shingles(mask(p.body, ownWords(p)), spam.shingle_size) }));
const pairs = [];
for (let i = 0; i < sh.length; i++) for (let j = i + 1; j < sh.length; j++) {
  const a = S.jaccard(sh[i].raw, sh[j].raw);
  const b = S.jaccard(sh[i].masked, sh[j].masked);
  const m = Math.max(a, b);
  if (m > spam.warn_body_similarity) pairs.push({ a: sh[i].p.url, b: sh[j].p.url, raw: a, masked: b, fail: m > spam.max_body_similarity });
}
pairs.sort((x, y) => Math.max(y.raw, y.masked) - Math.max(x.raw, x.masked));
res('near_duplicates', pairs.some((x) => x.fail) ? 'fail' : pairs.length ? 'warn' : 'pass',
  `Pages quasi identiques (seuil ${Math.round(spam.max_body_similarity * 100)} %, alerte ${Math.round(spam.warn_body_similarity * 100)} %)`,
  pairs.slice(0, 25).map((x) => `${x.fail ? '❌' : '⚠️'} ${x.a} ↔ ${x.b} : ${Math.round(x.raw * 100)} % brut, ${Math.round(x.masked * 100)} % à entité près`));

// Plans identiques (mêmes H2 à entité près) : signature du contenu produit en série sur un modèle
const outline = (p) => {
  const own = new Set([...ownWords(p, [S.fmField(p.fm, 'fil')])].filter((w) => w.length > 2));
  return new Set(p.h2s.map((h) => S.words(h).map((w) => (own.has(w) || /^\d+$/.test(w) ? '§' : w)).join(' ')));
};
// Un même plan seul est normal pour des fiches d'une même série (avis, fiches CEE) : il ne bloque que si le texte
// se ressemble aussi (au-delà du seuil d'alerte de similarité), signature des pages produites en série sans contenu propre.
const outlines = editorial.map((p) => ({ p, o: outline(p) })).filter((x) => x.o.size >= 3);
const bodySim = new Map(pairs.map((x) => [`${x.a}|${x.b}`, Math.max(x.raw, x.masked)]));
const outPairs = [];
let outFails = 0;
for (let i = 0; i < outlines.length; i++) for (let j = i + 1; j < outlines.length; j++) {
  const s = S.jaccard(outlines[i].o, outlines[j].o);
  if (s < spam.max_outline_similarity) continue;
  const a = outlines[i].p.url, b = outlines[j].p.url;
  const sim = bodySim.get(`${a}|${b}`) ?? bodySim.get(`${b}|${a}`) ?? 0;
  const fail = sim > spam.warn_body_similarity;
  if (fail) outFails++;
  outPairs.push(`${fail ? '❌' : '⚠️'} ${a} ↔ ${b} : ${Math.round(s * 100)} % de H2 identiques à entité près, texte ${sim ? `similaire à ${Math.round(sim * 100)} %` : `similaire à moins de ${Math.round(spam.warn_body_similarity * 100)} %`}`);
}
outPairs.sort((x, y) => (y.startsWith('❌') ? 1 : 0) - (x.startsWith('❌') ? 1 : 0));
res('same_outline', outFails ? 'fail' : outPairs.length ? 'warn' : 'pass', `Plans H2 identiques (seuil ${Math.round(spam.max_outline_similarity * 100)} %) ; bloquant si le texte se ressemble aussi`, outPairs.slice(0, 25));

// Squelettes de title identiques (même phrase, seule l'entité change) ; les pages sans title sont signalées à part
const skel = {};
const noTitle = [];
for (const p of editorial) {
  if (!p.title) { noTitle.push(p.url); continue; }
  const own = new Set([...p.keywords.slice(1), S.fmField(p.fm, 'marque'), S.fmField(p.fm, 'fil')].flatMap((k) => S.words(k || '')).filter((w) => w.length > 2));
  const k = S.words(p.title).map((w) => (own.has(w) || /^\d+$/.test(w) ? '§' : w)).join(' ');
  (skel[k] ??= []).push(p.url);
}
const bigSkel = Object.entries(skel).filter(([, u]) => u.length >= 4);
res('title_templates', bigSkel.length || noTitle.length ? 'warn' : 'pass', 'Titles construits sur le même gabarit (≥ 4 pages)',
  [...bigSkel.map(([k, u]) => `⚠️ « ${k} » × ${u.length} : ${u.slice(0, 6).join(', ')}${u.length > 6 ? '…' : ''}`),
    ...(noTitle.length ? [`⚠️ ${noTitle.length} page(s) sans title : ${noTitle.slice(0, 6).join(', ')}${noTitle.length > 6 ? '…' : ''}`] : [])]);

// 3. FAQ recyclées
const faqMap = {};
// Une question présente deux fois sur la même page (frontmatter et corps) ne compte qu'une fois pour cette page.
const faqKey = (q) => normalize(q.replace(/[’‘]/g, "'")).replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const faqText = {};
for (const p of editorial) for (const q of p.faq) {
  const k = faqKey(q);
  if (!k) continue;
  faqText[k] ??= q;
  if (!(faqMap[k] ??= []).includes(p.url)) faqMap[k].push(p.url);
}
const faqDup = Object.entries(faqMap).filter(([q, u]) => q && u.length > spam.max_faq_repeat);
// Quasi-doublons : même question à quelques mots près, sur deux pages différentes (alerte : un modèle ou l'éditeur juge).
const FAQ_STOP = new Set('les des une est que qui quoi quel quelle quels quelles pour par sur dans avec sans aux son ses leur leurs elle elles ils peut peuton faut fautil estce cest quoi comment combien pourquoi quand vous votre vos nous notre mon mes ton tes cette ces tout tous toute toutes plus moins bien tre etre avoir sontelles sontils estil estelle aton y en du de la le un et ou au a il on ne pas'.split(' '));
// Élisions détachées (« d'Intercom » → « intercom ») pour comparer les mots eux-mêmes.
const faqTokens = (q) => new Set(normalize(q.replace(/[’‘]/g, "'")).replace(/\b(?:[dljmnst]|qu|jusqu|lorsqu|puisqu)'/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !FAQ_STOP.has(w) && (w.length > 2 || /\d/.test(w))).map((w) => w.replace(/(?<=..)[sx]$/, '')));
const faqItems = Object.entries(faqMap).map(([k, urls]) => ({ q: faqText[k] || k, urls, t: faqTokens(faqText[k] || k) })).filter((x) => x.t.size >= 2);
const byToken = {};
faqItems.forEach((x, i) => x.t.forEach((w) => (byToken[w] ??= []).push(i)));
const faqNear = [];
faqItems.forEach((a, i) => {
  const seen = new Set();
  for (const w of a.t) for (const j of byToken[w]) {
    if (j <= i || seen.has(j)) continue;
    seen.add(j);
    const b = faqItems[j];
    if (a.urls.every((u) => b.urls.includes(u)) && b.urls.every((u) => a.urls.includes(u))) continue; // même page
    const inter = [...a.t].filter((x) => b.t.has(x)).length;
    const jac = inter / (a.t.size + b.t.size - inter);
    // Une question qui ne diffère que par l'entité de sa page (banque, produit, code de fiche présent dans son URL) n'est
    // pas un doublon : « ouverture d'un compte BforBank » / « … Hello bank » ont chacune leur contenu.
    const covered = (w, set) => [...set].some((y) => y === w || y.startsWith(w) || w.startsWith(y));
    const parts = (urls) => urls.join('/').toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 3);
    const inUrl = (w, urls) => urls.join('').toLowerCase().replace(/[^a-z0-9]/g, '').includes(w) || parts(urls).some((x) => x.length >= 4 && w.startsWith(x));
    const entity = (x, other) => [...x.t].some((w) => !covered(w, other.t) && inUrl(w, x.urls));
    if (inter >= 2 && jac >= 0.6 && !entity(a, b) && !entity(b, a)) faqNear.push(`⚠ « ${a.q} » (${a.urls.join(', ')}) ≈ « ${b.q} » (${b.urls.join(', ')})`);
  }
});
res('faq_recycled', faqDup.length ? 'fail' : faqNear.length ? 'warn' : 'pass', `Questions de FAQ répétées sur plus de ${spam.max_faq_repeat} page(s)${faqNear.length ? `, ${faqNear.length} paire(s) de questions presque identiques à revoir` : ''}`,
  [...faqDup.map(([q, u]) => `❌ « ${q} » : ${u.join(', ')}`), ...faqNear.slice(0, 200)]);

// 4. Pages minces publiées
const thin = editorial.filter((p) => p.words < spam.min_words_money_page);
res('thin_pages', thin.length ? 'warn' : 'pass', `Pages éditoriales sous ${spam.min_words_money_page} mots`,
  thin.map((p) => `⚠️ ${p.url} : ${p.words} mots`));

// 5. Fausse fraîcheur : une page dont un commit récent ne change QUE des dates (frontmatter, JSON-LD, sitemap de la
//    page, date visible « mis à jour le … »), y compris sur une ligne minifiée : les lignes sont comparées dates retirées.
//    Site Astro : un commit qui modifie aussi des données ou des composants (contenu rendu ailleurs) n'est pas compté.
//    Point de départ : spam.last_release (date de la dernière mise en ligne), sinon spam.freshness_window_days.
const MONTHS = 'janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre|january|february|march|april|may|june|july|august|september|october|november|december';
const DATES = new RegExp(`\\d{4}-\\d{2}-\\d{2}(?:[T ][\\d:.]+(?:Z|[+-]\\d{2}:?\\d{2})?)?|\\d{1,2}/\\d{1,2}/\\d{2,4}|\\b\\d{1,2}(?:er)? (?:${MONTHS}) \\d{4}\\b|\\b(?:${MONTHS}) \\d{4}\\b`, 'gi');
const stripDates = (l) => l.slice(1).replace(DATES, '§').replace(/\s+/g, ' ').trim();
const pageRels = new Set(all.map((p) => p.rel.split(path.sep).join('/')));
const freshness = [];
let gitOk = true;
try { execFileSync('git', ['-C', root, 'rev-parse'], { stdio: 'ignore' }); } catch (e) { gitOk = false; }
if (gitOk) {
  const since = spam.last_release && /^\d{4}-\d{2}-\d{2}$/.test(spam.last_release) ? spam.last_release : `${spam.freshness_window_days} days ago`;
  const ignored = new Set((spam.freshness_ignore_commits || []).map((x) => String(x).slice(0, 7)));
  // Chemins git relatifs à la racine du dépôt (le projet peut être un sous-dossier d'un dépôt)
  let prefix = '';
  try { prefix = execFileSync('git', ['-C', root, 'rev-parse', '--show-prefix'], { encoding: 'utf-8' }).trim(); } catch (e) {}
  let shas = [];
  try {
    shas = execFileSync('git', ['-C', root, 'log', `--since=${since}`, '--format=%h %cs'], { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
  } catch (e) {}
  for (const line of shas) {
    const [sha, date] = line.split(' ');
    if (ignored.has(sha.slice(0, 7))) continue; // commit déjà examiné et justifié (spam.freshness_ignore_commits)
    let diff = '';
    try { diff = execFileSync('git', ['-C', root, 'show', '--format=', '--unified=0', '--no-color', sha], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }); } catch (e) { continue; }
    const files = diff.split(/^diff --git /m).slice(1).map((chunk) => {
      const file = (chunk.match(/^\+\+\+ b\/(.+)$/m)?.[1] || chunk.match(/^a\/(\S+)/)?.[1] || '').replace(prefix, '');
      const lines = chunk.split('\n').filter((l) => /^[+-](?![+-]{2} )/.test(l) && !/^(\+\+\+|---) /.test(l));
      return { file, removed: lines.filter((l) => l[0] === '-').map(stripDates).filter(Boolean).sort(), added: lines.filter((l) => l[0] === '+').map(stripDates).filter(Boolean).sort(), changed: lines.length };
    });
    // Données ou composants modifiés dans le même commit (site Astro) : le contenu rendu peut avoir changé
    const dataChanged = astro && files.some((f) => !pageRels.has(f.file) && !/^\.seo-engine\/|sitemap|\.md$/.test(f.file) && /\.(json|ya?ml|ts|js|mjs|astro|csv)$/.test(f.file));
    if (dataChanged) continue;
    const dateOnly = files.filter((f) => pageRels.has(f.file) && f.changed && JSON.stringify(f.removed) === JSON.stringify(f.added));
    if (dateOnly.length) freshness.push(`❌ commit ${sha} (${date}) ne change que des dates sur : ${dateOnly.slice(0, 5).map((f) => f.file).join(', ')}${dateOnly.length > 5 ? '…' : ''}`);
  }
}
res('fake_freshness', freshness.length ? 'fail' : gitOk ? 'pass' : 'warn', `Fausse fraîcheur : date modifiée sans changement de contenu (depuis ${spam.last_release || `${spam.freshness_window_days} jours`})`,
  gitOk ? freshness : ['⚠️ Pas de dépôt git : contrôle impossible']);

// 6. E-E-A-T : fiches auteur publiées pour des identités non vérifiées ; pages créditant un inconnu
const fakeAuthors = pub.filter((p) => ['auteur', 'author', 'profile'].includes(p.template) && p.people.some((x) => spam.unverified_people.includes(x)));
const credited = pub.filter((p) => !['auteur', 'author', 'profile'].includes(p.template) && p.people.some((x) => spam.unverified_people.includes(x)));
res('unverified_authors', fakeAuthors.length ? 'fail' : credited.length ? 'warn' : 'pass', 'Auteurs / relecteurs sans identité vérifiée',
  [...fakeAuthors.map((p) => `❌ fiche publiée : ${p.url}`),
    ...(credited.length ? [`⚠️ ${credited.length} page(s) créditent un profil non vérifié (le gabarit doit le masquer) : ${credited.slice(0, 5).map((p) => p.url).join(', ')}${credited.length > 5 ? '…' : ''}`] : [])]);

// 7. Pages de confiance (bloquant) + transparence sur le mode de production (alerte : recommandé par Google, pas exigé)
const urls = new Set(pub.map((p) => p.url));
// Pages servies : tout sauf les brouillons Astro (draft: true, non construits). Une page en noindex est servie
// (pages légales souvent en noindex) : elle compte comme page de confiance et peut être liée.
const served = new Set(all.filter((p) => !(p.kind === 'mdx' && p.draft)).flatMap((p) => {
  // Une collection Astro peut être servie à la racine ([trust].astro, [slug].astro) : on retient aussi /slug/.
  const slug = p.url.split('/').filter(Boolean).pop();
  return p.source === 'content' && slug ? [p.url, `/${slug}/`] : [p.url];
}));
const norm = (u) => `/${String(u).replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
// Page de confiance sous un autre nom (« politique-de-confidentialite » pour « politique-confidentialite ») : trouvée,
// mais la configuration est à corriger (alerte).
// Synonymes français / anglais des pages de confiance courantes
const SYNONYMS = [
  ['confidentialite', 'privacy', 'donnees', 'rgpd', 'politique'],
  ['mentions', 'legales', 'legal', 'notice', 'imprint'],
  ['propos', 'about', 'qui', 'sommes', 'equipe', 'demarche', 'expertise'],
  ['contact', 'contacter'],
  ['cgu', 'cgv', 'conditions', 'generales', 'terms'],
  ['plan', 'site', 'sitemap'],
];
const slugWords = (u) => normalize(u).split(/[^a-z0-9]+/).filter((w) => w.length > 2 || w === 'cgu' || w === 'cgv');
const group = (w) => SYNONYMS.findIndex((g) => g.includes(w));
const variant = (t) => {
  const need = slugWords(t);
  if (!need.length) return undefined;
  const exact = [...served].find((u) => { const w = new Set(slugWords(u)); return need.every((x) => w.has(x)); });
  if (exact) return exact;
  // Même famille de synonymes pour tous les mots significatifs (« politique-confidentialite » ↔ « privacy_policy »)
  const groups = new Set(need.map(group).filter((g) => g >= 0));
  if (groups.size !== 1) return undefined;
  const [g] = groups;
  return [...served].find((u) => { const w = slugWords(u); return w.length && w.length <= 4 && w.every((x) => group(x) === g || ['policy', 'page', 'nous'].includes(x)) && w.some((x) => group(x) === g); });
};
const trustVariants = [];
const trust = (cfg.seo?.trust_pages || []).filter((t) => {
  if (served.has(norm(t))) return false;
  const v = variant(t);
  if (v) { trustVariants.push(`⚠️ ${norm(t)} introuvable, mais ${v} existe : corriger seo.trust_pages`); return false; }
  return true;
});
const processPage = spam.process_disclosure_path;
const processOk = processPage ? urls.has(norm(processPage)) : pub.some((p) => /intelligence artificielle|\bIA\b|automatis|generative AI|AI-assisted/i.test(p.body) && /m[ée]thod|charte|about|a-propos|qui-sommes-nous|notre-demarche/i.test(p.url));
res('trust_pages', trust.length ? 'fail' : !processOk || trustVariants.length ? 'warn' : 'pass', 'Pages de confiance et transparence sur la production (Who/How/Why)',
  [...trust.map((t) => `❌ page de confiance absente : ${norm(t)}`), ...trustVariants,
    ...(!processOk ? [`⚠️ Aucune page publiée n'explique comment les contenus sont produits (outils, IA, relecture)${processPage ? ` : ${processPage}` : ''} — recommandé par Google (Who/How/Why)`] : [])]);

// 8. Liens de pages publiées vers des pages non publiées (draft / noindex), et vers des pages planifiées jamais produites
const unpublished = new Set(all.filter((p) => p.kind === 'mdx' && p.draft).map((p) => p.url));
let planned = [];
try { planned = JSON.parse(fs.readFileSync(path.join(root, '.seo-engine/state/planned-urls.json'), 'utf-8')).urls || []; } catch (e) {}
const toDraft = [];
for (const p of pub) {
  const hrefs = [...p.raw.matchAll(/\]\((\/[^)#?\s]*)[^)]*\)|href\s*=\s*["'](\/[^"'#?\s]*)/g)].map((m) => m[1] || m[2]);
  for (const h of new Set(hrefs)) {
    const u = norm(h.replace(/\.html?$/, '').replace(/\/index$/, ''));
    if (unpublished.has(u)) toDraft.push(`❌ ${p.url} → ${u} (brouillon, non construit)`);
    else if (!served.has(u) && planned.map(norm).includes(u)) toDraft.push(`❌ ${p.url} → ${u} (planifiée, jamais produite)`);
  }
}
res('links_to_drafts', toDraft.length ? 'fail' : 'pass', 'Liens de pages publiées vers des brouillons ou des pages planifiées non produites', toDraft);

// 9. Code : cloaking, redirections trompeuses, back button hijacking
//    Astro : src et public ; HTML : tout le projet (scripts js/ compris), hors dépendances et outils.
const codeExts = ['.astro', '.js', '.mjs', '.ts', '.tsx', '.jsx', '.html', '.vue', '.svelte', '.php'];
// Dossiers d'outils exclus, mais pas ceux qui contiennent le code servi (js, scripts, assets, partials…)
const CODE_DIRS = new Set(['js', 'scripts', 'assets', 'includes', '_includes', 'partials', 'templates', 'template', 'components', 'layouts', 'public']);
const codeSkip = [...S.SKIP_DIRS].filter((d) => !CODE_DIRS.has(d)).concat(['.seo-engine']);
const codeFiles = spam.code_dirs
  ? spam.code_dirs.flatMap((d) => S.findContentFiles(path.join(root, d), codeExts, [], true))
  : astro
    ? ['src', 'public'].flatMap((d) => S.findContentFiles(path.join(root, d), codeExts, [], true))
    : S.findContentFiles(root, codeExts, codeSkip, true).filter((f) => !/\.min\.js$/.test(f) && !/playwright-report|test-results/.test(f));
const codeHits = [];
const rules = [
  [/navigator\.userAgent[\s\S]{0,200}(googlebot|bingbot|bot\b|crawler)|(googlebot|bingbot)[\s\S]{0,200}(location(\.href)?\s*=|location\.(replace|assign)\(|display\s*=|innerHTML\s*=)/i, 'cloaking : contenu ou redirection conditionnés au robot'],
  [/document\.referrer[\s\S]{0,200}(location(\.href)?\s*=(?!=)|location\.(replace|assign)\()/i, 'redirection trompeuse conditionnée au référent'],
  [/history\.(pushState|replaceState)[\s\S]{0,400}(popstate|onpopstate)|(popstate|onpopstate)[\s\S]{0,400}history\.(pushState|go|forward)/i, 'back button hijacking (politique Google, appliquée depuis le 15/06/2026)'],
  [/<meta[^>]+http-equiv=["']refresh["'][^>]+url=/i, 'meta refresh vers une autre URL'],
];
for (const f of codeFiles) {
  let src;
  try { src = fs.readFileSync(f, 'utf-8'); } catch (e) { continue; }
  for (const [re, label] of rules) if (re.test(src)) codeHits.push(`❌ ${path.relative(root, f)} : ${label}`);
}
res('deceptive_code', codeHits.length ? 'fail' : 'pass', `Code trompeur (cloaking, redirections, historique) — ${codeFiles.length} fichiers analysés`, codeHits);

// 9b. Ancres exactes répétées (sur-optimisation du maillage interne), Markdown et HTML
const anchors = {};
for (const p of pub) {
  const src = p.kind === 'html' ? S.htmlMain(p.raw) : p.raw; // menus et pieds de page communs exclus
  const links = [...src.matchAll(/\[([^\]]{3,80})\]\((\/[^)\s#?]*)[^)]*\)/g)].map((m) => [m[1], m[2]])
    .concat([...src.matchAll(/<a\s[^>]*href=["'](\/[^"'#?]*)["'][^>]*>([\s\S]{3,120}?)<\/a>/gi)].map((m) => [S.stripTags(m[2]), m[1]]));
  for (const [text, href] of links) {
    if (!text || text.length < 3 || norm(href) === '/' || /^(accueil|home)$/i.test(text.trim())) continue; // fil d'Ariane
    const k = `${normalize(text).trim()} → ${norm(href)}`;
    (anchors[k] ??= new Set()).add(p.url);
  }
}
const overAnch = Object.entries(anchors).filter(([, s]) => s.size > spam.max_exact_anchor_repeat).sort((a, b) => b[1].size - a[1].size);
res('exact_anchors', overAnch.length ? 'warn' : 'pass', `Même ancre exacte vers la même page sur plus de ${spam.max_exact_anchor_repeat} pages (hors menus et pieds de page communs)`,
  overAnch.slice(0, 15).map(([k, s]) => `⚠️ « ${k} » sur ${s.size} pages`));

// 10. Sites liés du même éditeur (réseau de liens) : pages et code, hors documentation interne
const related = [...(cfg.portfolio?.related_sites || []), ...(spam.forbidden_domains || [])].map((d) => String(d).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')).filter(Boolean);
const relHits = [];
for (const f of new Set([...all.map((p) => p.f), ...codeFiles])) {
  let src;
  try { src = fs.readFileSync(f, 'utf-8'); } catch (e) { continue; }
  for (const d of related) if (new RegExp(`(^|[^\\w.-])(www\\.)?${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'i').test(src)) relHits.push(`❌ ${path.relative(root, f)} → ${d}`);
}
res('related_sites', relHits.length ? 'fail' : 'pass', 'Liens ou mentions de sites liés du portefeuille', relHits);

// Rapport
const icon = { pass: '✅', warn: '⚠️', fail: '❌' };
const out = [`# Audit anti-spam — ${S.localToday()}`, '',
  `${pub.length} pages publiées sur ${all.length}, dont ${editorial.length} pages éditoriales comparées (${astro ? 'site Astro' : 'site HTML'}). Référence : \`.seo-engine/references/spam-policies.md\`.`, '',
  ...(unreadable.length ? ['**Fichiers illisibles, non analysés :**', ...unreadable.map((u) => `- ${u}`), ''] : [])];
for (const r of results) {
  out.push(`## ${icon[r.level]} ${r.titre}`, '');
  out.push(r.lignes.length ? r.lignes.map((l) => `- ${l}`).join('\n') : '- RAS', '');
}
const fails = results.filter((r) => r.level === 'fail').length;
const warns = results.filter((r) => r.level === 'warn').length;
out.push(`---`, `**Verdict : ${fails ? `❌ ${fails} contrôle(s) bloquant(s)` : '✅ aucun blocage'}${warns ? `, ${warns} alerte(s)` : ''}.**`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out.join('\n') + '\n');
console.log(JSON.stringify({ validator: 'audit-spam', status: fails ? 'fail' : 'pass', published: pub.length, fails, warns, report: path.relative(root, outPath), results: results.map(({ id, level, lignes }) => ({ id, level, count: lignes.length })) }, null, 2));
// exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
process.exitCode = fails ? 1 : 0;
