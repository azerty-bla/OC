#!/usr/bin/env node
// Lecture d'une source, en lecture seule : texte complet de la page (HTML ou PDF), dates déclarées, passages autour
// d'un mot ou d'un chiffre (--find), citation exacte contrôlée par script (--quote) et comparaison avec la phrase à
// publier (--claim : chiffres présents dans la citation, qualificatifs « jusqu'à », HT, TTC… repris).
// Outil du pôle research de SEOWK et du skill verif-faits ; règles communes : facts-lib.js (mêmes règles que
// validate-facts.js et que local-engine).
//
// Usage :
//   node source-check.js --url <adresse> [--cache <dossier>] [--fresh] [--find <mot ou chiffre>]… [--quote <phrase>]… [--claim <phrase>] [--radius 350] [--json]
//   node source-check.js --file <texte.txt | page.html> --source-url <adresse> [--cache <dossier>] [mêmes options]
// --cache : lectures gardées (texte visible seulement), reprises pendant 24 h par ce script et par validate-facts.js.
//   Par défaut : dossier temporaire propre au projet (dossier courant), hors git, le même que celui de validate-facts.js.
// --file : texte copié depuis un navigateur quand la lecture directe échoue (403, page rendue en JavaScript) ;
//   enregistré dans le cache pour l'adresse --source-url et signalé comme lu par navigateur.
// Un lien affilié ou de suivi n'est jamais lu (ce n'est pas une source, et la lecture compterait un clic).
// Sortie : 0 = page lue, citations retrouvées, phrase confirmée ; 1 = lecture en échec ; 2 = citation introuvable
// ou phrase non confirmée.
'use strict';

const fs = require('fs');
const { parseArgs } = require('util');
const F = require('./facts-lib');

const { values: o } = parseArgs({
  options: {
    url: { type: 'string' },
    file: { type: 'string' },
    'source-url': { type: 'string' },
    cache: { type: 'string' },
    fresh: { type: 'boolean', default: false },
    find: { type: 'string', multiple: true, default: [] },
    quote: { type: 'string', multiple: true, default: [] },
    claim: { type: 'string' },
    radius: { type: 'string', default: '350' },
    json: { type: 'boolean', default: false },
  },
});

const cacheDir = o.cache || F.defaultCacheDir();

async function load() {
  if (!o.file) return F.readSource(o.url, { cacheDir, fresh: o.fresh });
  const raw = fs.readFileSync(o.file, 'utf-8');
  const isHtml = /<(html|body|div|p)[\s>]/i.test(raw);
  const text = isHtml ? F.visibleText(raw) : raw;
  const ok = text.replace(/\s/g, '').length >= 200;
  const page = { ok, url: o['source-url'] || o.file, text, dates: F.pageDates(isHtml ? raw : '', text), readAt: new Date().toISOString(), via: `navigateur (fichier ${o.file})`, error: ok ? undefined : 'texte vide ou trop court' };
  if (ok && o['source-url']) F.saveSource(cacheDir, page);
  return page;
}

const localTime = (iso) => (iso ? new Date(iso).toLocaleString('sv-SE').slice(0, 16) : '');

function print(out) {
  if (o.json) return console.log(JSON.stringify(out, null, 2));
  const L = [];
  L.push(`Source : ${out.url}`);
  const hint = F.isTrackingUrl(out.url) ? '' : ' ; essayer un navigateur puis --file';
  L.push(out.lue ? `Lue (${out.via}${out.cache ? ', depuis le cache' : ''}, ${out.caracteres} caractères, le ${localTime(out.lu_le)})` : `ÉCHEC DE LECTURE : ${out.erreur} — rien de cette page ne peut servir de preuve${hint}`);
  if (out.dates.length || out.derniere_modification) {
    L.push(`Dates déclarées : ${[...out.dates.map((d) => `${d.kind} ${d.value}`), ...(out.derniere_modification ? [`Last-Modified ${out.derniere_modification}`] : [])].join(' · ')}`);
  }
  for (const r of out.recherches) {
    L.push('', `Recherche « ${r.requete} » : ${r.total} occurrence(s)${r.total > r.passages.length ? `, ${r.passages.length} passages montrés` : ''}`);
    r.passages.forEach((p, i) => L.push(`  [${i + 1}] ${p}`));
  }
  for (const c of out.citations) {
    L.push('', `Citation « ${c.citation} » : ${c.trouvee ? 'RETROUVÉE' : 'INTROUVABLE (inexacte, reformulée ou absente de la page)'}`);
    if (c.contexte) L.push(`  Contexte : ${c.contexte}`);
    if (c.phrase) L.push(`  Phrase : ${c.phrase}`);
  }
  console.log(L.join('\n'));
}

(async () => {
  if (!o.url && !o.file) {
    console.error('--url ou --file requis (voir l’en-tête du script)');
    process.exit(1);
  }
  const page = await load();
  const out = {
    url: page.url,
    lue: Boolean(page.ok),
    via: page.via,
    cache: Boolean(page.cached),
    erreur: page.ok ? undefined : page.error || `HTTP ${page.status}`,
    caracteres: page.text?.length || 0,
    dates: page.dates || [],
    derniere_modification: page.lastModified,
    lu_le: page.readAt,
    recherches: [],
    citations: [],
  };
  if (!page.ok) {
    print(out);
    process.exit(1);
  }
  const index = F.indexText(page.text);
  const radius = Number(o.radius) || 350;
  // Sans citation, la phrase à publier sert de point de départ : passages de chacun de ses chiffres et de ses codes
  // (« BBKOPE180 » se cherche entier, pas comme le nombre 180).
  const auto = [];
  if (o.claim && !o.quote.length) {
    const ids = F.identifiersIn(o.claim);
    const inId = (n) => ids.some((t) => n.index >= t.index && n.end <= t.end);
    auto.push(...F.numbersIn(o.claim).filter((n) => !F.isYear(n) && !inId(n)).map((n) => n.token), ...ids.map((t) => t.token));
  }
  for (const q of [...new Set([...o.find, ...auto])]) out.recherches.push({ requete: q, ...F.findPassages(index, q, { radius }) });
  const pages = new Map([[F.urlKey(page.url), { ok: true, text: page.text, index }]]);
  let bad = false;
  for (const q of o.quote) {
    const hit = F.findQuote(index, q);
    const c = { citation: q, trouvee: Boolean(hit) };
    if (hit) c.contexte = F.contextAround(index.src, hit.start, hit.end, 300);
    else bad = true;
    if (o.claim) {
      const r = F.verifyFact({ fact: o.claim, source_url: page.url, extrait: q }, pages);
      c.phrase = r.ok ? 'confirmée (chiffres dans la citation, qualificatifs repris)' : `NON CONFIRMÉE — ${r.reason}`;
      if (!r.ok) bad = true;
    }
    out.citations.push(c);
  }
  print(out);
  process.exit(bad ? 2 : 0);
})();
