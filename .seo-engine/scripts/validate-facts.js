#!/usr/bin/env node
// Contrôle des faits par script, pour les portes research → copy, copy → audit et publication. Règles communes :
// facts-lib.js (les mêmes que local-engine et que le skill verif-faits). Aucun chiffre n'est cru sur parole : ni ceux
// du side-car, ni ceux de la page.
//
// --phase research : chaque fait de la recherche (research.verified_facts, et price_ranges / regulations s'ils sont
//   remplis) porte l'adresse de sa source et une phrase exacte de celle-ci (extrait) ; la page est lue (lectures de
//   source-check.js gardées 24 h dans le cache, sinon nouvelle lecture), la phrase y est retrouvée, les chiffres du fait
//   y figurent et ses qualificatifs (« jusqu'à », « à partir de », HT, TTC…) sont repris.
// --phase page (par défaut) : tout chiffre et toute référence affichés (title, description, H1, texte, FAQ) viennent
//   d'un fait vérifié (relu à chaque contrôle) ou d'un calcul déclaré dans copy.calculations et refait par le script ;
//   les qualificatifs des sources sont repris ; aucun marqueur « à vérifier ». Missions audit-fix et improve : seuls
//   les chiffres absents de la version commitée (git HEAD) sont exigés ; les autres sont signalés (skill verif-faits).
//
// Usage : node validate-facts.js --phase research --sidecar <side-car> [--config <config>] [--root .] [--cache <dossier>]
//         node validate-facts.js --file <page> --sidecar <side-car> [--config <config>] [--root .] [--cache <dossier>]
// Cache par défaut : dossier temporaire propre au projet (--root), hors git, partagé avec source-check.js. Un lien
// affilié ou de suivi n'est jamais lu. Sortie JSON { validator, phase, file, status, checks, … } ; code 0 = pass,
// 1 = fail, 2 = erreur d'exécution.
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const F = require('./facts-lib');
const { parseArgs } = require('./utils');

const args = parseArgs();
const argv = process.argv.slice(2);
const option = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const phase = option('--phase') || 'page';
const cacheDir = option('--cache') || F.defaultCacheDir(args.root);
// parseArgs range les valeurs inconnues (« research », dossier du cache) en positionnel : seul --file compte ici.
const filePath = argv.includes('--file') ? args.file : null;

const checks = [];
const warnings = [];
function addCheck(name, pass, message, details) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message, ...(details?.length ? { details } : {}) });
}
function output(status, extra = {}) {
  console.log(JSON.stringify({ validator: 'validate-facts', phase, file: filePath || args.sidecar, status, checks, ...(warnings.length ? { warnings } : {}), ...extra }, null, 2));
  // exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
  process.exitCode = status === 'pass' ? 0 : status === 'fail' ? 1 : 2;
}

// ---------------------------------------------------------------------------
// Faits de la recherche
// ---------------------------------------------------------------------------

// Toutes les listes de faits, y compris les anciennes (price_ranges, regulations) : aucune ne sert de raccourci.
function researchFacts(research) {
  const out = [];
  (research?.verified_facts || []).forEach((f, i) => out.push({ list: 'verified_facts', id: f.id || `F${i + 1}`, fact: f.fact, source_url: f.source_url, extrait: f.extrait }));
  (research?.price_ranges || []).forEach((p, i) => out.push({ list: 'price_ranges', id: p.id || `P${i + 1}`, fact: p.fact || [p.item, p.range].filter(Boolean).join(' : '), source_url: p.source_url || p.url, extrait: p.extrait }));
  (research?.regulations || []).forEach((r, i) => out.push({ list: 'regulations', id: r.id || `R${i + 1}`, fact: r.fact || [r.name, r.summary].filter(Boolean).join(' : '), source_url: r.source_url || r.url, extrait: r.extrait }));
  return out;
}

const hostOf = (u) => {
  try {
    return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
};

// Lecture des sources, quatre à la fois ; une lecture réussie de moins de 24 h est reprise du cache.
async function readAll(urls) {
  const pages = new Map();
  const queue = [...new Set(urls)];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      pages.set(F.urlKey(url), await F.readSource(url, { cacheDir }));
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));
  return pages;
}

async function verifyResearch(research, ownHost) {
  const facts = researchFacts(research);
  const urls = facts.map((f) => f.source_url).filter((u) => /^https?:\/\//i.test(u || ''));
  const pages = await readAll(urls);
  const verified = [];
  const rejected = [];
  for (const f of facts) {
    let reason;
    if (!f.fact || !f.source_url || !f.extrait) reason = 'fait incomplet : fact, source_url et extrait (phrase exacte de la source) sont exigés';
    else if (!/^https?:\/\//i.test(f.source_url)) reason = `adresse de source invalide « ${f.source_url} »`;
    else if (ownHost && (hostOf(f.source_url) === ownHost || hostOf(f.source_url).endsWith(`.${ownHost}`))) reason = 'page du site lui-même : elle ne prouve rien';
    else {
      const r = F.verifyFact(f, pages);
      if (r.ok) {
        verified.push({ ...f, contexte: r.context });
        continue;
      }
      reason = r.reason;
    }
    rejected.push({ ...f, reason });
  }
  const ids = facts.map((f) => f.id);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const sources = [...pages.values()].map((p) => ({ url: p.url, ok: Boolean(p.ok), via: p.via, cached: p.cached, readAt: p.readAt, dates: p.dates, error: p.ok ? undefined : p.error || `HTTP ${p.status}` }));
  for (const s of sources.filter((x) => x.ok && /^navigateur/.test(x.via || ''))) warnings.push(`source lue par un navigateur (texte copié) : ${s.url}`);
  return { facts, verified, rejected, duplicates, sources };
}

const factLine = (f) => `${f.id} (${f.list}) « ${String(f.fact || '').slice(0, 120)} » — ${f.source_url || 'sans adresse'} : ${f.reason}`;

// ---------------------------------------------------------------------------
// Texte affiché d'une page
// ---------------------------------------------------------------------------

// Champs du frontmatter qui s'affichent (title, description, H1, FAQ…) ; pas les dates ni les réglages.
const DISPLAY_KEY_RX = /^(\s*(?:-\s+)?)(title|description|h1|subtitle|excerpt|summary|intro|lead|question|answer|q|a|text|label|caption|alt)\s*:\s*(.*)$/i;

function frontmatterText(fm) {
  const out = [];
  const lines = fm.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(DISPLAY_KEY_RX);
    if (!m) continue;
    let v = m[3].trim();
    if (/^[>|][-+]?$/.test(v)) {
      const indent = m[1].length;
      const parts = [];
      while (i + 1 < lines.length && (lines[i + 1].trim() === '' || lines[i + 1].match(/^\s*/)[0].length > indent)) parts.push(lines[++i].trim());
      v = parts.join(' ');
    }
    out.push(v.replace(/^(["'])([\s\S]*)\1$/, '$2'));
  }
  return out;
}

// Texte affiché : { display (title, description et champs affichés), body (Markdown nettoyé ou texte visible), counts }.
function pageText(content, ext) {
  if (ext === '.html' || ext === '.htm') {
    const title = (content.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
    const metaTag = (content.match(/<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i) || [''])[0];
    const description = (metaTag.match(/content\s*=\s*"([^"]*)"/i) || metaTag.match(/content\s*=\s*'([^']*)'/i) || [])[1] || '';
    let main = (content.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || content.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || [])[1];
    if (!main) main = ((content.match(/<body\b[^>]*>([\s\S]*)<\/body>/i) || [])[1] || content).replace(/<(header|nav|footer)\b[\s\S]*?<\/\1>/gi, ' ');
    const counts = [(main.match(/<h2\b/gi) || []).length, (main.match(/<h3\b/gi) || []).length];
    for (const t of main.match(/<table\b[\s\S]*?<\/table>/gi) || []) counts.push((t.match(/<tr\b[^>]*>(?:(?!<\/tr>)[\s\S])*?<td\b/gi) || []).length);
    for (const l of main.match(/<(ul|ol)\b[\s\S]*?<\/\1>/gi) || []) counts.push((l.match(/<li\b/gi) || []).length);
    return { display: [title, description].map((s) => F.visibleText(s)), body: F.visibleText(main), counts };
  }
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  // .astro : le bloc --- est du code, pas du contenu.
  const display = fmMatch && ext !== '.astro' ? frontmatterText(fmMatch[1]) : [];
  const body = (fmMatch ? content.slice(fmMatch[0].length) : content)
    .replace(/^```[\s\S]*?^```/gm, ' ')
    .replace(/^(?:import|export)\s.*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}|<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^{}\n]*\}/g, ' ');
  return { display, body, counts: markdownCounts(body) };
}

// Dénombrements de la page elle-même (H2, H3, lignes de tableau, éléments de liste) : « 12 banques comparées » est
// justifié si la page en présente bien 12.
function markdownCounts(md) {
  const lines = md.split(/\r?\n/);
  const counts = [lines.filter((l) => /^##\s/.test(l)).length, lines.filter((l) => /^###\s/.test(l)).length];
  let kind = null;
  let run = 0;
  const flush = () => {
    if (run) counts.push(kind === 'table' ? run - 2 : run);
    kind = null;
    run = 0;
  };
  for (const l of lines) {
    if (kind === 'list' && /^\s+(?:[-*+]|\d+[.)])\s/.test(l)) continue;
    const k = /^\s*\|/.test(l) ? 'table' : /^(?:[-*+]|\d+[.)])\s/.test(l) ? 'list' : null;
    if (k !== kind) flush();
    if (k) {
      kind = k;
      run++;
    }
  }
  flush();
  return counts;
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const monthIndex = (name) => MONTHS.indexOf(name.toLowerCase().replace('fevrier', 'février').replace('aout', 'août').replace('decembre', 'décembre')) + 1;
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const localDay = (date) => new Date(date).toLocaleDateString('sv-SE');

// Dates de la page elle-même (jour du contrôle, lectures des sources, dates du side-car et du frontmatter) : « vérifié
// le 29 octobre 2026 » ne demande pas d'autre preuve. Les autres dates restent des faits à justifier.
function dropOwnDates(text, own) {
  return text
    .replace(/(?<!\d)(\d{1,2})(?:er)?\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})(?!\d)/giu, (m, d, mo, y) => (own.has(iso(y, monthIndex(mo), d)) ? ' ' : m))
    .replace(/(?<![\d/])(\d{1,2})\/(\d{1,2})\/(\d{4})(?![\d/])/g, (m, d, mo, y) => (own.has(iso(y, mo, d)) ? ' ' : m));
}

// Version commitée de la page (git HEAD), pour les missions sur des pages existantes ; null si absente.
function committedVersion(file) {
  try {
    return execFileSync('git', ['show', `HEAD:./${path.basename(file)}`], { cwd: path.dirname(path.resolve(file)), encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function withBaseline(allowed, text) {
  const base = F.allowedFrom([text]);
  const merged = { values: new Map([...allowed.values].map(([v, u]) => [v, new Set(u)])), ids: new Set([...allowed.ids, ...base.ids]) };
  for (const [v, units] of base.values) for (const u of units) F.addAllowed(merged, v, u);
  return merged;
}

const numberLabel = (n) => `${n.kind === 'identifiant' ? 'référence' : 'chiffre'} « ${n.token}${n.unit && n.unit !== 'date' ? ` ${n.unit}` : ''} » — …${n.context}…`;

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

async function researchPhase(sidecar, config) {
  const r = await verifyResearch(sidecar.research, hostOf(config.project?.domain || ''));
  const failed = r.sources.filter((s) => !s.ok);
  addCheck('sources_read', failed.length === 0, failed.length ? `${failed.length} source(s) illisible(s) : leurs faits ne sont pas prouvés (autre page de l'émetteur ou source officielle, ou texte copié depuis un navigateur avec source-check.js --file --cache)` : `${r.sources.length} source(s) lue(s)`, failed.map((s) => `${s.url} : ${s.error}`));
  addCheck('facts_verified', r.rejected.length === 0, r.rejected.length ? `${r.rejected.length} fait(s) rejeté(s) : recopier la phrase exacte depuis source-check.js (--find), reprendre les qualificatifs de la source, ou déplacer le fait dans unverified_data` : `${r.verified.length} fait(s) vérifié(s) sur leur source`, r.rejected.map(factLine));
  addCheck('facts_ids_unique', r.duplicates.length === 0, r.duplicates.length ? `identifiants en double : ${r.duplicates.join(', ')}` : 'identifiants uniques');
  const min = Number.isInteger(config.facts?.min_verified) ? config.facts.min_verified : 5;
  addCheck('facts_count', r.verified.length >= min, `${r.verified.length} fait(s) vérifié(s) par script (minimum ${min})`);

  // Sources des liens externes : une adresse fausse ou inventée (404, domaine inexistant) échoue ; un refus aux robots
  // (401, 403, 429) n'est qu'un avertissement, la page existe.
  const external = sidecar.research?.verified_external_sources || [];
  const extUrls = external.map((s) => s.url).filter((u) => /^https?:\/\//i.test(u || ''));
  const extPages = await readAll(extUrls);
  const dead = external.filter((s) => s.verified && !/^https?:\/\//i.test(s.url || '')).map((s) => `${s.label || '?'} : adresse absente (« ${s.url || ''} »)`);
  for (const u of new Set(extUrls)) {
    const p = extPages.get(F.urlKey(u));
    if (p.ok || (p.status === 200 && /JavaScript|vide/.test(p.error || ''))) continue;
    if ([401, 403, 429].includes(p.status)) warnings.push(`lien externe non lisible par script (HTTP ${p.status}), à ouvrir dans un navigateur : ${u}`);
    else dead.push(`${u} : ${p.error || `HTTP ${p.status}`}`);
  }
  addCheck('external_sources_read', dead.length === 0, dead.length ? `${dead.length} source(s) de lien externe introuvable(s) : adresse fausse, inventée ou de suivi — la retirer ou la remplacer par une adresse lue` : `${new Set(extUrls).size} source(s) de lien externe trouvée(s)`, dead);
  output(checks.some((c) => c.status === 'fail') ? 'fail' : 'pass', {
    facts: { total: r.facts.length, verified: r.verified.length, rejected: r.rejected.length },
    verified: r.verified.map((f) => ({ id: f.id, list: f.list, fact: f.fact, source_url: f.source_url })),
    rejected: r.rejected.map((f) => ({ id: f.id, list: f.list, fact: f.fact, source_url: f.source_url, reason: f.reason })),
    sources: r.sources,
  });
}

async function pagePhase(sidecar, config) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return output('error', { message: `Fichier illisible : ${e.message}` });
  }
  const ext = path.extname(filePath).toLowerCase();
  const mission = sidecar.mission || 'produce';
  const r = await verifyResearch(sidecar.research, hostOf(config.project?.domain || ''));

  // Marqueurs : sur le fichier brut (commentaires compris).
  const markers = F.markersIn(content).map((m) => `ligne ${m.line} : « ${m.marker} »`);
  addCheck('no_markers', markers.length === 0, markers.length ? `${markers.length} marqueur(s) « à vérifier » ou valeur fictive : une donnée non vérifiée ne se publie pas, même signalée — la sourcer ou la retirer` : 'aucun marqueur', markers);
  // Adresses fictives (bouche-trou de la rédaction) et liens sponsorisés vides : sur le fichier brut, frontmatter compris.
  const fakes = F.fakeLinksIn(content).map((f) => `ligne ${f.line} : ${f.url} — ${f.reason}`);
  addCheck('no_fake_links', fakes.length === 0, fakes.length ? `${fakes.length} adresse(s) fictive(s) : le lien ne mène nulle part — mettre la vraie adresse ou retirer le lien` : 'aucune adresse fictive', fakes);

  const { display, body, counts } = pageText(content, ext);
  const text = [...display, body].join('\n\n');

  // Noms connus : projet, mot-clé de la page, liste de config.facts.names, et pages du site visées par les liens
  // internes (« /n26/avis/ » autorise la référence « N26 »).
  const links = [...content.matchAll(/\]\((\/[^)\s]*)\)|href\s*=\s*["'](\/[^"']*)["']/g)].map((m) => (m[1] || m[2]).replace(/[/.#?=&]+/g, ' '));
  const names = [config.project?.name, config.project?.brand, sidecar.strat?.primary_keyword, ...(config.facts?.names || []), ...links];
  const calcs = (sidecar.copy?.calculations || []).map((calc) => ({ calc, text, part: calc.section || '' }));
  const { allowed, calcs: checked } = F.pageAllowed({ facts: r.verified, names, calcs });
  for (const c of counts.filter((n) => n >= 10)) F.addAllowed(allowed, c, 'éléments de la page');

  const fm = (content.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
  const fmDates = [...fm.matchAll(/^\s*(?:updatedDate|updated|pubDate|publishDate|date|lastmod|dateModified|datePublished)\s*:\s*["']?(\d{4}-\d{2}-\d{2})/gim)].map((m) => m[1]);
  // HTML : dates déclarées dans les métadonnées (JSON-LD, article:modified_time, <time datetime>), pas dans le texte.
  const htmlDates = ext === '.html' || ext === '.htm' ? F.pageDates(content, '').map((d) => d.value.slice(0, 10)).filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)) : [];
  const own = new Set([localDay(Date.now()), ...r.sources.filter((s) => s.readAt).map((s) => localDay(s.readAt)), sidecar.created, sidecar.updated, ...fmDates, ...htmlDates].filter(Boolean));
  const checkedText = dropOwnDates(text, own);

  const all = F.unjustifiedNumbers(checkedText, allowed);
  let fresh = all;
  let preexisting = [];
  if (mission === 'audit-fix' || mission === 'improve') {
    const before = committedVersion(filePath);
    if (before !== null) {
      const b = pageText(before, ext);
      fresh = F.unjustifiedNumbers(checkedText, withBaseline(allowed, [...b.display, b.body].join('\n\n')));
      preexisting = all.filter((n) => !fresh.some((x) => x.token === n.token && x.unit === n.unit && x.kind === n.kind));
      if (preexisting.length) warnings.push(`${preexisting.length} chiffre(s) ou référence(s) déjà publiés et non vérifiés par script : à confier au skill verif-faits`);
    }
  }
  addCheck('numbers_justified', fresh.length === 0, fresh.length ? `${fresh.length} chiffre(s) ou référence(s) sans fait vérifié ni calcul déclaré : écrire le chiffre exact d'un fait (avec ses qualificatifs), déclarer le calcul dans copy.calculations, ou reformuler sans chiffre — jamais un autre chiffre de mémoire` : 'chaque chiffre affiché vient d’un fait vérifié ou d’un calcul vérifié', fresh.map(numberLabel));

  const badCalcs = checked.filter((c) => !c.ok);
  addCheck('calculations', badCalcs.length === 0, badCalcs.length ? `${badCalcs.length} calcul(s) rejeté(s) par le script` : `${checked.length} calcul(s) refait(s) par le script`, badCalcs.map((c) => `« ${c.calc.resultat} = ${c.calc.formule} » : ${c.reason}${c.inputsOk ? ' — écrire le résultat exact' : ''}`));

  const lost = F.lostQualifiers(checkedText, r.verified);
  addCheck('qualifiers', lost.length === 0, lost.length ? `${lost.length} qualificatif(s) de la source perdu(s) : un « jusqu'à » ou un « à partir de » omis rend le chiffre faux` : 'qualificatifs des sources repris', lost.map((l) => `${l.qualifier} absent devant « ${l.token} » — …${l.context}…`));

  if (r.rejected.length) warnings.push(`${r.rejected.length} fait(s) de la recherche rejeté(s) à la relecture (source changée ou fait invalide) : ils ne justifient aucun chiffre — ${r.rejected.map((f) => `${f.id} : ${f.reason}`).join(' ; ')}`);
  output(checks.some((c) => c.status === 'fail') ? 'fail' : 'pass', {
    mission,
    facts: { verified: r.verified.length, rejected: r.rejected.length },
    numbers: { unjustified: fresh.length, preexisting: preexisting.map(numberLabel) },
  });
}

(async () => {
  if (!args.sidecar) return output('error', { message: 'Usage : node validate-facts.js [--phase research] --sidecar <side-car> [--file <page>] [--config <config>] [--root .] [--cache <dossier>]' });
  let sidecar;
  try {
    sidecar = JSON.parse(fs.readFileSync(args.sidecar, 'utf-8'));
  } catch (e) {
    return output('error', { message: `Side-car illisible : ${e.message}` });
  }
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(args.config, 'utf-8'));
  } catch {}
  if (phase === 'research') return researchPhase(sidecar, config);
  if (phase !== 'page') return output('error', { message: `phase inconnue « ${phase} » (research ou page)` });
  if (!filePath) return output('error', { message: '--file requis pour le contrôle d’une page' });
  return pagePhase(sidecar, config);
})().catch((e) => output('error', { message: e.stack || e.message }));
