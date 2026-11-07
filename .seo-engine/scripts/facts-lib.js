// Contrôle des faits par script, partagé par SEOWK (validate-facts.js) et local-engine (recherche, correction, rapport).
//
// Règles :
// - un fait n'est accepté que si la phrase qui le porte (« extrait ») est retrouvée telle quelle dans le texte
//   réellement lu, avec les chiffres du fait et les qualificatifs que la source leur attache (« jusqu'à », HT…) ;
// - un chiffre calculé n'est accepté que si chaque entrée est sourcée, ou déclarée et présentée comme hypothèse
//   d'exemple, et si le résultat, refait ici, est le bon ;
// - sur une page, tout chiffre doit venir d'un fait vérifié ou d'un calcul vérifié.
//
// Limite assumée : le contrôle prouve que le chiffre est sur la page source, dans la phrase citée. Il ne prouve ni que
// la source dit vrai (choix de la source), ni que le rédacteur emploie le chiffre à bon escient (relecture).
//
// Espaces : \s couvre en JavaScript l'insécable et la fine insécable ; [^\S\n\r\t\f\v] = espace d'une même ligne.

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Normalisation du texte (avec correspondance des positions vers le texte d'origine)
// ---------------------------------------------------------------------------

const DROP_RX = /["«»“”„;:!?()[\]{}…*_#|<>]/;
const APOS_RX = /[‘’ʼ´`]/;
const DASH_RX = /[\p{Pd}−]/u;
const ALNUM_RX = /[\p{L}\d]/u;
const SOFT_HYPHEN = '\xad';
const isDigit = (c) => c >= '0' && c <= '9';

/**
 * Forme de comparaison : minuscules, espaces et apostrophes unifiés, guillemets, astérisques et ponctuation retirés,
 * sauf la virgule ou le point entre deux chiffres ; l'espace des milliers disparaît (« 1 500 » vaut « 1500 »).
 * map[i] = position dans src du caractère i de norm.
 */
function indexText(text) {
  const src = String(text || '').normalize('NFC');
  let norm = '';
  const map = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === SOFT_HYPHEN) continue;
    const between = isDigit(src[i - 1] || '') && isDigit(src[i + 1] || '');
    let out;
    if (/\s/.test(c)) {
      if (between) continue;
      out = ' ';
    } else if (c === '.' || c === ',') out = between ? c : ' ';
    else if (DROP_RX.test(c)) out = ' ';
    else if (APOS_RX.test(c)) out = "'";
    else if (DASH_RX.test(c)) out = '-';
    else out = c.toLowerCase();
    for (const ch of out) {
      if (ch === ' ' && (!norm || norm.endsWith(' '))) continue;
      norm += ch;
      map.push(i);
    }
  }
  while (norm.endsWith(' ')) {
    norm = norm.slice(0, -1);
    map.pop();
  }
  return { src, norm, map };
}

const normalize = (s) => indexText(s).norm;

// ---------------------------------------------------------------------------
// Nombres, unités, identifiants
// ---------------------------------------------------------------------------

// « 1 500 » (espace simple, insécable ou fine), « 1.500 », « 2,5 », « 0.90 » ; pas de signe (les tirets sont des
// intervalles).
const NUM_RX = /(?<![\d,.])\d{1,3}(?:[^\S\n\r\t\f\v]\d{3}|\.\d{3})+(?:,\d+)?(?!\d)|(?<![\d,.])\d+(?:[.,]\d+)?(?!\d)/g;
const GROUPED_RX = /^\d{1,3}(?:[^\S\n\r\t\f\v]\d{3}|\.\d{3})+(?:,\d+)?$/;

function numValue(token) {
  const t = GROUPED_RX.test(token) ? token.replace(/[^\S\n\r\t\f\v]|\./g, '') : token;
  return Number(t.replace(',', '.'));
}

/**
 * Nombres d'un texte : [{ token, value, index, end }]. Un chiffre seul collé à une lettre est un exposant ou une
 * formule (« m2 », « CO2 », « P6 »), pas un nombre ; un code plus long (« N26 », « IND-UT-104 ») reste repéré.
 */
function numbersIn(text) {
  const s = String(text || '').normalize('NFC');
  return [...s.matchAll(NUM_RX)]
    .filter((m) => !(m[0].length === 1 && /\p{L}/u.test(s[m.index - 1] || '')))
    .map((m) => ({ token: m[0], value: numValue(m[0]), index: m.index, end: m.index + m[0].length }));
}

const isYear = (n) => /^\d{4}$/.test(n.token) && n.value >= 1900 && n.value <= 2100;

// Unité qui suit un nombre, ramenée à une forme unique (« euros » → « € », « années » → « an »…). Les multiplicateurs
// (« 4 millions de clients ») et les mois (« jusqu'au 4 novembre ») en font partie : sans eux, un petit nombre passait
// pour un simple dénombrement et échappait au contrôle.
const UNIT_RX = /^\s?(%|pour ?cent|€|euros?|k€|M€|Md€|kWh|MWh|GWh|TWh|kWc|Wc|kW|MW|GW|W|m²|m2|m³|m3|ha|°C|kg|tonnes?|t|km|cm|mm|m|litres?|l|ans?|années?|mois|jours?|semaines?|heures?|h|minutes?|min|fois|points?|millions?|milliards?|mille|janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)(?![\p{L}\d²³])/iu;
const UNIT_ALIASES = { euro: '€', euros: '€', 'pour cent': '%', pourcent: '%', ans: 'an', année: 'an', années: 'an', heures: 'h', heure: 'h', minutes: 'min', minute: 'min', jours: 'jour', semaines: 'semaine', m2: 'm²', m3: 'm³', litre: 'l', litres: 'l', tonne: 't', tonnes: 't', points: 'point', millions: 'million', milliards: 'milliard', fevrier: 'février', aout: 'août', decembre: 'décembre' };

function unitAfter(text, end) {
  const m = String(text).slice(end, end + 14).match(UNIT_RX);
  if (!m) return '';
  const u = m[1].toLowerCase();
  return UNIT_ALIASES[u] || u;
}

// Dates : un fragment de date numérique (« 04/11/2026 ») a l'unité « date ». Une date ne justifie qu'une date : le
// « 04/11 » d'une source n'autorise ni « 4 millions », ni « 11 % », ni « 11 banques ».
const MONTH_UNITS = new Set(['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']);
const DATE_RX = /(?<![\d/])\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?![\d/])/g;
const isDateUnit = (u) => u === 'date' || MONTH_UNITS.has(u);
const dateSpans = (s) => [...s.matchAll(DATE_RX)].map((m) => [m.index, m.index + m[0].length]);

/** Unité d'un nombre dans son texte : « date » dans une date numérique, sinon l'unité qui le suit. */
function unitIn(s, n, spans) {
  return spans.some(([a, b]) => n.index >= a && n.end <= b) ? 'date' : unitAfter(s, n.end);
}

/** Un chiffre de la page (unité unit) est-il couvert par les unités autorisées pour sa valeur ? */
function unitMatches(unit, units) {
  const all = [...units];
  if (isDateUnit(unit)) return all.some((u) => u === '' || isDateUnit(u));
  const plain = all.filter((u) => !isDateUnit(u));
  return unit ? plain.includes(unit) || plain.includes('') : plain.length > 0;
}

// Codes et noms qui contiennent un chiffre (« N26 », « IND-UT-104 », « BBKOPE180 », « 4G ») : des identifiants,
// contrôlés comme un tout et non comme des quantités. Les ordinaux (« 1er », « 3e ») restent des nombres.
const TOKEN_RX = /[\p{L}\d]+(?:[-_][\p{L}\d]+)*/gu;
const ORDINAL_RX = /^\d+(?:er|re|e|è|ème|eme|nd|nde)$/i;

function identifiersIn(text) {
  const s = String(text || '').normalize('NFC');
  return [...s.matchAll(TOKEN_RX)]
    .filter((m) => /\d/.test(m[0]) && /\p{L}/u.test(m[0]) && !ORDINAL_RX.test(m[0]))
    .map((m) => ({ token: m[0], key: m[0].toUpperCase(), index: m.index, end: m.index + m[0].length }));
}

/** Ce qu'une liste de textes autorise : { values: Map valeur → Set d'unités ('' = sans unité), ids: Set }. */
function allowedFrom(texts) {
  const allowed = { values: new Map(), ids: new Set() };
  for (const t of texts) {
    const s = String(t || '').normalize('NFC');
    const spans = dateSpans(s);
    for (const n of numbersIn(s)) addAllowed(allowed, n.value, unitIn(s, n, spans));
    for (const id of identifiersIn(s)) allowed.ids.add(id.key);
  }
  return allowed;
}

function addAllowed(allowed, value, unit = '') {
  if (!allowed.values.has(value)) allowed.values.set(value, new Set());
  allowed.values.get(value).add(unit);
}

/** Noms connus (titres des pages du site, marques) : ils autorisent des identifiants (« N26 »), jamais une quantité. */
function addNames(allowed, texts) {
  for (const t of texts) for (const id of identifiersIn(t)) allowed.ids.add(id.key);
}

// ---------------------------------------------------------------------------
// Citation exacte et contexte
// ---------------------------------------------------------------------------

const ELLIPSIS_RX = /\s*(?:\[\s*(?:…|\.\.\.)\s*\]|\(\s*(?:…|\.\.\.)\s*\)|…|\.\.\.)\s*/;

// Un morceau de citation commence et finit sur une limite de mot : « 500 kWh » ne se trouve pas dans « 1 500 kWh ».
function bounded(norm, at, end) {
  const first = norm[at];
  const last = norm[end - 1];
  const glued = (c, d) => ALNUM_RX.test(c || '') || (isDigit(d) && /[.,]/.test(c || ''));
  if (ALNUM_RX.test(first) && at > 0 && glued(norm[at - 1], first)) return false;
  if (ALNUM_RX.test(last) && end < norm.length && glued(norm[end], last)) return false;
  return true;
}

/**
 * Cherche une citation dans un texte indexé. Les coupes « … » sont permises : chaque morceau doit être retrouvé,
 * dans l'ordre, à moins de maxGap caractères du précédent. Renvoie { start, end } dans le texte d'origine, ou null.
 */
function findQuote(index, quote, { maxGap = 600 } = {}) {
  const parts = String(quote || '').split(ELLIPSIS_RX).map(normalize).filter((p) => p.length >= 8);
  if (!parts.length) return null;
  const { norm, map } = index;
  const next = (p, from) => {
    for (let at = norm.indexOf(p, from); at >= 0; at = norm.indexOf(p, at + 1)) if (bounded(norm, at, at + p.length)) return at;
    return -1;
  };
  for (let at = next(parts[0], 0); at >= 0; at = next(parts[0], at + 1)) {
    let end = at + parts[0].length;
    let ok = true;
    for (const p of parts.slice(1)) {
      const k = next(p, end);
      if (k < 0 || k - end > maxGap) {
        ok = false;
        break;
      }
      end = k + p.length;
    }
    if (ok) return { start: map[at], end: map[end - 1] + 1 };
  }
  return null;
}

/** Passage autour de [start, end[ (radius caractères de chaque côté, sans couper de mot). */
function contextAround(src, start, end, radius = 300) {
  let a = Math.max(0, start - radius);
  let b = Math.min(src.length, end + radius);
  for (let k = 0; k < 40 && a > 0 && !/\s/.test(src[a - 1]); k++) a--;
  for (let k = 0; k < 40 && b < src.length && !/\s/.test(src[b]); k++) b++;
  return `${a > 0 ? '…' : ''}${src.slice(a, b).replace(/\s+/g, ' ').trim()}${b < src.length ? '…' : ''}`;
}

/** Phrase (ou ligne de tableau) qui contient le passage [index, end[. */
function sentenceAround(s, index, end) {
  const seps = ['\n', '. ', '! ', '? '];
  const start = Math.max(0, ...seps.map((p) => {
    const i = s.lastIndexOf(p, index - 1);
    return i < 0 ? 0 : i + p.length;
  }));
  const ends = seps.map((p) => s.indexOf(p, end)).filter((i) => i >= 0);
  return s.slice(start, ends.length ? Math.min(...ends) + 1 : s.length);
}

/**
 * Passages d'une page autour d'un mot ou d'un chiffre (outil « find » des modèles) : c'est le contexte qui dit ce que
 * le chiffre désigne, ses conditions et sa date. Un chiffre est cherché par sa valeur (« 1 500 » = « 1500 »).
 */
function findPassages(text, query, { radius = 350, max = 6 } = {}) {
  const index = typeof text === 'string' ? indexText(text) : text;
  const q = String(query || '').trim();
  const hits = [];
  const asNumber = /^\d/.test(q) ? numbersIn(q)[0] : null;
  if (asNumber) {
    for (const n of numbersIn(index.src)) if (n.value === asNumber.value) hits.push([n.index, n.end]);
  } else {
    const qn = normalize(q);
    if (qn.length < 2) return { total: 0, passages: [] };
    for (let at = index.norm.indexOf(qn); at >= 0; at = index.norm.indexOf(qn, at + qn.length)) {
      hits.push([index.map[at], index.map[at + qn.length - 1] + 1]);
    }
  }
  const merged = [];
  for (const [s, e] of hits) {
    const last = merged.at(-1);
    if (last && s - last[1] <= 2 * radius) last[1] = e;
    else merged.push([s, e]);
  }
  return { total: hits.length, passages: merged.slice(0, max).map(([s, e]) => contextAround(index.src, s, e, radius)) };
}

// ---------------------------------------------------------------------------
// Qualificatifs : « jusqu'à 180 € » n'est pas « 180 € »
// ---------------------------------------------------------------------------

// Bornes et approximations, cherchées dans le membre de phrase qui précède le chiffre ; HT et TTC, juste après.
// rx sert aussi à reconnaître le qualificatif n'importe où dans la phrase qui reprend le chiffre.
const QUALIFIERS = {
  plafond: { label: '« jusqu’à » (plafond)', rx: /jusqu['’]?\s?[àa](?!\p{L})|maxima|maximu|au plus(?!\p{L})|plafon|dans la limite|pouvant atteindre|peut atteindre|n['’]exc[eè]d|ne d[ée]pass/iu },
  plancher: { label: '« à partir de » (minimum)', rx: /à partir d|(?<!\p{L})dès(?!\p{L})|au moins(?!\p{L})|minima|minimu|plus de(?!\p{L})|supérieur|au-delà/iu },
  environ: { label: '« environ » (approximation)', rx: /environ|(?<!\p{L})moyen(?!nant)|près de(?!\p{L})|autour de(?!\p{L})|de l['’]ordre|approximati|~/iu },
  HT: { label: 'HT', rx: /(?<!\p{L})HT(?!\p{L})|H\.T\.|hors tax/iu, after: /^\s*(?:€|euros?|k€)?\s*(?:HT(?!\p{L})|H\.T\.|hors tax)/iu },
  TTC: { label: 'TTC', rx: /(?<!\p{L})TTC(?!\p{L})|T\.T\.C\.|toutes taxes/iu, after: /^\s*(?:€|euros?|k€)?\s*(?:TTC(?!\p{L})|T\.T\.C\.|toutes taxes)/iu },
};

// Membre de phrase qui précède un chiffre : 32 caractères au plus, coupés à la virgule ou à la ponctuation forte.
// Un saut de ligne ne coupe pas : une page HTML met souvent « Jusqu'à » et « 180€ » dans deux blocs distincts.
function clauseBefore(s, index) {
  const before = s.slice(Math.max(0, index - 32), index);
  const cut = Math.max(...[',', ';', '.', '!', '?', '(', ')', '|'].map((c) => before.lastIndexOf(c)));
  return before.slice(cut + 1);
}

/** Qualificatifs du chiffre { index, end } dans le texte s : Set parmi plafond, plancher, environ, HT, TTC. */
function qualifiersAt(s, n) {
  const out = new Set();
  const before = clauseBefore(s, n.index);
  const after = s.slice(n.end, n.end + 16);
  for (const [key, q] of Object.entries(QUALIFIERS)) if (q.after ? q.after.test(after) : q.rx.test(before)) out.add(key);
  return out;
}

/**
 * Chiffres d'un texte qui perdent le qualificatif que leur fait source leur attache (même valeur, même unité) :
 * [{ token, qualifier, context }]. Le qualificatif doit figurer dans la phrase du chiffre (« la prime peut atteindre
 * 180 € » vaut « jusqu'à 180 € »). Un chiffre commun à plusieurs faits n'exige que les qualificatifs qu'ils partagent.
 */
function lostQualifiers(text, facts) {
  const s = String(text || '').normalize('NFC');
  const sources = facts.map((f) => String(f.extrait || '').normalize('NFC'));
  const out = [];
  const seen = new Set();
  for (const n of numbersIn(s)) {
    if (isYear(n)) continue;
    const unit = unitAfter(s, n.end);
    let required = null;
    for (const src of sources) {
      for (const m of numbersIn(src)) {
        if (m.value !== n.value) continue;
        const u = unitAfter(src, m.end);
        if (unit && u && u !== unit) continue;
        const q = qualifiersAt(src, m);
        required = required ? new Set([...required].filter((k) => q.has(k))) : q;
      }
    }
    if (!required?.size) continue;
    const sentence = sentenceAround(s, n.index, n.end);
    for (const k of required) {
      if (QUALIFIERS[k].rx.test(sentence) || seen.has(`${n.value}|${k}`)) continue;
      seen.add(`${n.value}|${k}`);
      out.push({ token: n.token, qualifier: QUALIFIERS[k].label, context: contextAround(s, n.index, n.end, 70) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Vérification d'un fait
// ---------------------------------------------------------------------------

/** Clé d'adresse : sans « www. », sans ancre, sans barre finale. */
function urlKey(u) {
  try {
    const x = new URL(String(u).trim());
    return `${x.hostname.toLowerCase().replace(/^www\./, '')}${x.pathname.replace(/\/+$/, '') || '/'}${x.search}`;
  } catch {
    return String(u || '').trim().toLowerCase();
  }
}

/**
 * Vérifie un fait { fact, source_url, extrait } contre les pages lues (Map urlKey → { ok, text, status, error }) :
 * page lue avec succès, extrait retrouvé, chiffres du fait présents dans l'extrait, qualificatifs de la page repris
 * par le fait. Renvoie { ok: true, context } ou { ok: false, reason }.
 */
function verifyFact(f, pages) {
  const page = pages.get(urlKey(f.source_url));
  if (!page) return { ok: false, reason: "page jamais lue : l'adresse ne correspond à aucune lecture" };
  if (!page.ok) return { ok: false, reason: `lecture en échec (${page.status || page.error || 'erreur'}) : la page n'a pas été lue` };
  const quote = String(f.extrait || '').trim();
  const qn = normalize(quote.replace(ELLIPSIS_RX, ' '));
  if (qn.length < 20 || qn.split(' ').length < 4) return { ok: false, reason: 'extrait absent ou trop court : une phrase entière de la page est exigée' };
  if (!page.index) page.index = indexText(page.text);
  const hit = findQuote(page.index, quote);
  if (!hit) return { ok: false, reason: 'extrait introuvable dans le texte lu : citation inexacte ou reformulée' };
  const src = page.index.src;
  const context = contextAround(src, hit.start, hit.end, 300);
  const inQuote = new Set(numbersIn(quote).map((n) => n.value));
  const inContext = new Set(numbersIn(context).map((n) => n.value));
  const region = numbersIn(src.slice(hit.start, hit.end));
  for (const n of numbersIn(f.fact)) {
    if (!inQuote.has(n.value)) {
      // Une année peut venir du passage (titre de section, date de la page) plutôt que de la phrase elle-même.
      if (isYear(n) && inContext.has(n.value)) continue;
      return { ok: false, reason: `chiffre « ${n.token} » absent de l'extrait cité` };
    }
    if (isYear(n)) continue;
    // Les qualificatifs sont lus sur la page elle-même : une coupe « … » ne peut pas retirer un « jusqu'à ».
    for (const m of region.filter((x) => x.value === n.value)) {
      for (const k of qualifiersAt(src, { index: hit.start + m.index, end: hit.start + m.end })) {
        if (!QUALIFIERS[k].rx.test(f.fact)) return { ok: false, reason: `qualificatif ${QUALIFIERS[k].label} de la source absent du fait, devant « ${n.token} »` };
      }
    }
  }
  return { ok: true, context };
}

/** Vérifie une liste de faits : les acceptés reçoivent un identifiant (F1, F2…), les autres sont rejetés avec la raison. */
function verifyFacts(facts, pages) {
  const accepted = [];
  const rejected = [];
  for (const f of facts || []) {
    const r = verifyFact(f, pages);
    if (r.ok) accepted.push({ id: `F${accepted.length + 1}`, fact: f.fact, source_url: f.source_url, extrait: f.extrait, contexte: r.context, verified: true });
    else rejected.push({ fact: f.fact, source_url: f.source_url, extrait: f.extrait, reason: r.reason });
  }
  return { accepted, rejected };
}

// ---------------------------------------------------------------------------
// Calculs
// ---------------------------------------------------------------------------

/** Évalue une formule simple (+ − × ÷, parenthèses, % suffixe) sans eval. Les unités sont ignorées. */
function evalFormula(formula) {
  // × et ✕ sont toujours des multiplications ; « x » seulement isolé (« 200 x 12 »), pas dans un mot (« taux »).
  // Les unités écrites dans la formule (« 1 000 m² × 8 € ») sont retirées.
  const s = String(formula || '')
    .normalize('NFC')
    .replace(/[×✕]/g, '*')
    .replace(/(^|[\s\d)])[xX](?=[\s\d(])/g, '$1*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/[^\d\s,.%+\-*/()]/g, ' ');
  const tokens = [];
  const re = new RegExp(NUM_RX.source, 'y');
  for (let i = 0; i < s.length; ) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (isDigit(c)) {
      re.lastIndex = i;
      const m = re.exec(s);
      if (!m) throw new Error(`nombre illisible à la position ${i}`);
      tokens.push({ n: numValue(m[0]) });
      i += m[0].length;
      continue;
    }
    if ('+-*/()%'.includes(c)) {
      tokens.push({ op: c });
      i++;
      continue;
    }
    throw new Error(`caractère inattendu « ${c} »`);
  }
  let k = 0;
  const peek = () => tokens[k];
  const take = () => tokens[k++];
  function primary() {
    const t = take();
    if (!t) throw new Error('formule incomplète');
    if (t.n !== undefined) return t.n;
    if (t.op === '(') {
      const v = expr();
      if (take()?.op !== ')') throw new Error('parenthèse non fermée');
      return v;
    }
    if (t.op === '-') return -factor();
    throw new Error(`opérateur inattendu « ${t.op} »`);
  }
  function factor() {
    let v = primary();
    while (peek()?.op === '%') {
      take();
      v /= 100;
    }
    return v;
  }
  function term() {
    let v = factor();
    while (peek()?.op === '*' || peek()?.op === '/') {
      const op = take().op;
      const r = factor();
      if (op === '/' && r === 0) throw new Error('division par zéro');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function expr() {
    let v = term();
    while (peek()?.op === '+' || peek()?.op === '-') v = take().op === '+' ? v + term() : v - term();
    return v;
  }
  if (!tokens.length) throw new Error('formule vide');
  const v = expr();
  if (k < tokens.length) throw new Error('formule mal formée');
  return v;
}

/** Précision affichée d'un résultat : « 2 400 » → 100, « 2 376 » → 1, « 12,5 » → 0,1. */
function precisionOf(token) {
  const t = token.replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})+$/.test(t)) {
    const dec = t.match(/[.,](\d+)$/);
    if (dec) return 10 ** -dec[1].length;
  }
  const int = t.replace(/[.,]\d+$/, '').replace(/\./g, '');
  return 10 ** Math.min(int.match(/0*$/)[0].length, Math.max(0, int.length - 1));
}

/** Le résultat affiché correspond-il au calcul ? Tolérance : l'arrondi affiché, plafonné à 2,5 % de la valeur. */
function matchesComputed(token, value, computed, unit = '') {
  const tol = Math.min(precisionOf(token) / 2, Math.abs(value) * 0.025) + 1e-9;
  return Math.abs(computed - value) <= tol || (unit === '%' && Math.abs(computed * 100 - value) <= tol);
}

// Conversions admises sans source (mois par an, pour cent, kilo, jours, semaines, heures, minutes), seulement écrites
// sans unité ou avec l'unité de la conversion : « 1 000 m² » est une quantité, pas une conversion. Les chiffres du
// texte restent contrôlés à part (unjustifiedNumbers) : une constante ne justifie jamais un chiffre affiché.
const CONSTANTS = new Set([12, 100, 1000, 365, 52, 24, 60]);
const CONVERSION_UNITS = new Set(['', 'mois', 'an', 'jour', 'semaine', 'h', 'min', '%']);
const EXAMPLE_RX = /exemple|pour (?:un|une|des|le cas)\b|prenons|imaginons|supposons|hypoth[eè]se|cas d['’]une?\b|si (?:vous|le|la|l['’]|un|une|votre)\b/i;

function sentencesWith(text, value) {
  return String(text || '').split(/(?<=[.!?])\s+|\n+/).filter((s) => numbersIn(s).some((n) => n.value === value));
}

/**
 * Vérifie un calcul { resultat, formule, hypotheses: [] } : entrées sourcées (factValues), constantes de conversion,
 * ou hypothèses d'exemple déclarées ET présentées comme telles dans le texte ; puis résultat refait.
 * Renvoie { ok, reason?, computed?, inputsOk?, value?, unit?, hypotheses: [{ value, unit }] }.
 */
function checkCalc(calc, { factValues, text }) {
  let computed;
  try {
    computed = evalFormula(calc.formule);
  } catch (e) {
    return { ok: false, reason: `formule illisible « ${calc.formule} » (${e.message})` };
  }
  const hypotheses = [];
  for (const n of numbersIn(calc.formule)) {
    const hyp = (calc.hypotheses || []).map((h) => ({ h, m: numbersIn(h).find((m) => m.value === n.value) })).find((x) => x.m);
    const unit = hyp ? unitAfter(hyp.h, hyp.m.end) : unitAfter(calc.formule, n.end);
    const conversion = CONSTANTS.has(n.value) && CONVERSION_UNITS.has(unit);
    if (hyp && !conversion) {
      // Hypothèse d'exemple : elle doit être écrite comme telle dans le texte (« pour un bâtiment de 1 000 m² »).
      if (!sentencesWith(text, n.value).some((s) => EXAMPLE_RX.test(s))) {
        return { ok: false, computed, reason: `hypothèse « ${n.token} » non présentée comme exemple dans le texte (« pour un… », « par exemple… »)` };
      }
      hypotheses.push({ value: n.value, unit });
      continue;
    }
    if (factValues.has(n.value) || conversion) continue;
    return { ok: false, computed, reason: `entrée « ${n.token} » ni sourcée ni déclarée comme hypothèse d'exemple` };
  }
  const res = numbersIn(calc.resultat)[0];
  if (!res) return { ok: false, inputsOk: true, computed, hypotheses, reason: `résultat sans chiffre « ${calc.resultat} »` };
  const unit = unitAfter(calc.resultat, res.end);
  if (!matchesComputed(res.token, res.value, computed, unit)) {
    const shown = computed.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    return { ok: false, inputsOk: true, computed, hypotheses, reason: `résultat faux : ${calc.formule} = ${shown}, pas ${res.token}` };
  }
  return { ok: true, inputsOk: true, computed, value: res.value, unit, hypotheses };
}

/**
 * Chiffres autorisés sur une page : faits vérifiés (fait et phrase source), noms connus (identifiants seulement) et
 * calculs déclarés, refaits par le script. Un calcul faux dont les entrées sont sourcées autorise sa valeur exacte si
 * le texte l'écrit : c'est la correction attendue. calcs = [{ calc, text, part }], text = passage où le calcul figure.
 * Renvoie { allowed, calcs: [{ part, calc, ok, reason, inputsOk, computed… }] }.
 */
// Termes courants qui contiennent un chiffre sans être une référence à prouver.
const GENERIC_NAMES = ['3D Secure', '4G', '5G', 'B2B', 'B2C', 'P2P', 'H24', 'COVID-19', 'Web3'];

function pageAllowed({ facts = [], names = [], calcs = [] }) {
  const allowed = allowedFrom(facts.flatMap((f) => [f.fact, f.extrait]));
  addNames(allowed, [...GENERIC_NAMES, ...names.filter(Boolean)]);
  const factValues = new Set(allowed.values.keys());
  const checked = [];
  for (const { calc, text, part } of calcs) {
    const r = checkCalc(calc, { factValues, text });
    checked.push({ part, calc, ...r });
    if (!r.inputsOk) continue;
    for (const h of r.hypotheses) addAllowed(allowed, h.value, h.unit);
    if (r.ok) addAllowed(allowed, r.value, r.unit);
    else {
      for (const n of numbersIn(text)) {
        const unit = unitAfter(text, n.end);
        if (matchesComputed(n.token, n.value, r.computed, unit)) addAllowed(allowed, n.value, unit);
      }
    }
  }
  return { allowed, calcs: checked };
}

// ---------------------------------------------------------------------------
// Chiffres d'une page sans justification
// ---------------------------------------------------------------------------

/**
 * Chiffres et identifiants d'un texte Markdown qui ne viennent ni d'un fait vérifié, ni d'un calcul vérifié, ni d'une
 * hypothèse d'exemple, ni (pour un identifiant) d'un nom connu : [{ token, unit, kind, context }], kind = 'chiffre'
 * ou 'identifiant'. Ignorés : années, petits dénombrements sans unité (« 3 étapes »), numéros de liste et de titre,
 * adresses des liens. allowed : résultat de allowedFrom, complété par addAllowed et addNames.
 */
function unjustifiedNumbers(markdown, allowed) {
  const body = String(markdown || '')
    .normalize('NFC')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/^([ \t]*(?:#{1,6}[ \t]+)?)\d+[.)][ \t]/gm, '$1');
  const ids = identifiersIn(body);
  const spans = dateSpans(body);
  const out = [];
  const seen = new Set();
  for (const n of numbersIn(body)) {
    if (isYear(n)) continue;
    const unit = unitIn(body, n, spans);
    const id = unit ? null : ids.find((t) => n.index >= t.index && n.end <= t.end);
    if (id) {
      if (!allowed.ids.has(id.key) && !seen.has(id.key)) {
        seen.add(id.key);
        out.push({ token: id.token, unit: '', kind: 'identifiant', context: contextAround(body, id.index, id.end, 70) });
      }
      continue;
    }
    if (!unit && Number.isInteger(n.value) && n.value < 10) continue;
    const units = allowed.values.get(n.value);
    if (units && unitMatches(unit, units)) continue;
    const key = `${n.value}|${unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ token: n.token, unit, kind: 'chiffre', context: contextAround(body, n.index, n.end, 70) });
  }
  return out;
}

// Marqueurs qui ne se publient jamais : « [À VÉRIFIER] », « [DONNEE A VERIFIER] », « URL A VERIFIER », « [à compléter] »,
// TODO, valeur fictive « X € » / « XX % ».
const MARKER_RX = /\[\s*(?:DONN[ÉE]ES?\s+)?[AÀ]\s+V[ÉE]RIFIER[^\]]*\]|URL\s+[AÀ]\s+V[ÉE]RIFIER|\[\s*[àa]\s+compl[ée]ter\s*\]|\bTODO\b|(?<![\p{L}\d])X{1,3}\s?(?:€|%|euros?)(?!\p{L})/giu;

/** Marqueurs d'un texte, commentaires compris : [{ marker, line }]. */
function markersIn(text) {
  const out = [];
  String(text || '').split(/\r?\n/).forEach((l, i) => {
    for (const m of l.matchAll(MARKER_RX)) out.push({ marker: m[0], line: i + 1 });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Lecture d'une page (texte visible complet, PDF compris)
// ---------------------------------------------------------------------------

const ENTITIES = {
  nbsp: '\xa0', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', euro: '€', deg: '°', sup2: '²', sup3: '³',
  thinsp: String.fromCharCode(0x2009), shy: '',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â', ccedil: 'ç', ocirc: 'ô', ouml: 'ö',
  ucirc: 'û', ugrave: 'ù', uuml: 'ü', icirc: 'î', iuml: 'ï', oelig: 'œ', aelig: 'æ', Eacute: 'É', Egrave: 'È',
  Ecirc: 'Ê', Agrave: 'À', Acirc: 'Â', Ccedil: 'Ç', Ocirc: 'Ô', Icirc: 'Î', OElig: 'Œ',
};

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

/** Texte visible d'une page HTML, en entier (en-tête et pied compris : les conditions d'une offre y sont souvent). */
function visibleText(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|td|th|section|article|table|ul|ol|dd|dt|blockquote|header|footer|nav|main)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/** Dates qu'une page déclare (publication, mise à jour) : elles datent la lecture du fait, pas sa validité. */
function pageDates(html, text) {
  const out = [];
  const push = (kind, value) => {
    const v = String(value || '').trim();
    if (v && !out.some((d) => d.kind === kind && d.value === v)) out.push({ kind, value: v });
  };
  const h = String(html || '');
  for (const m of h.matchAll(/<meta\b[^>]*(?:property|name|itemprop)\s*=\s*["'](article:modified_time|article:published_time|og:updated_time|last-modified|dateModified|datePublished|dc\.date(?:\.modified)?)["'][^>]*>/gi)) {
    push(m[1], (m[0].match(/content\s*=\s*["']([^"']+)/i) || [])[1]);
  }
  for (const m of h.matchAll(/"(dateModified|datePublished)"\s*:\s*"([^"]+)"/g)) push(m[1], m[2]);
  for (const m of h.matchAll(/<time\b[^>]*datetime\s*=\s*["']([^"']+)["']/gi)) push('time', m[1]);
  for (const m of String(text || '').matchAll(/(mis à jour|mise à jour|actualisé|publié)[^\n\d]{0,12}(\d{1,2}(?:er)?\s+\p{L}+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/giu)) {
    push(m[1].toLowerCase(), m[2]);
  }
  return out.slice(0, 10);
}

function pdfText(buf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'facts-pdf-'));
  const file = path.join(dir, 'source.pdf');
  try {
    fs.writeFileSync(file, buf);
    return execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, '-'], { encoding: 'utf-8', timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Liens affiliés et de suivi : jamais lus. Ce ne sont pas des sources, et les lire compterait un clic chez le
// partenaire. Réseaux d'affiliation courants, et paramètres de suivi de clic dans l'adresse.
const TRACKING_HOST_RX = /(?:^|\.)(?:awin1\.com|awin\.com|tradedoubler\.com|effiliation\.com|kwanko\.com|netaffiliation\.com|anrdoezrs\.net|dpbolvw\.net|jdoqocy\.com|kqzyfj\.com|tkqlhce\.com|linksynergy\.com|impact\.com|sjv\.io|prf\.hn|tradetracker\.net|shareasale\.com|skimresources\.com|clickfunnels\.com|go2cloud\.org|affiliatly\.com|timeone\.io|ftjcfx\.com|ad\.doubleclick\.net)$/i;
const TRACKING_PARAM_RX = /[?&](?:aff|affid|aff_id|affiliate|affiliate_id|clickid|click_id|subid|sub_id|awc|tduid|irclickid|ranMID|ranEAID|ranSiteID|cjevent|partner_id)=/i;

/** Adresse d'un lien affilié ou de suivi de clic ? */
function isTrackingUrl(url) {
  try {
    const u = new URL(String(url));
    return TRACKING_HOST_RX.test(u.hostname) || TRACKING_PARAM_RX.test(u.search);
  } catch {
    return false;
  }
}

// Adresses fictives : bouche-trou laissé à la rédaction à la place du vrai lien (thermostats-connectes, 10/2026 :
// « amzn.to/thermostat-connecte », « amzn.to/PLACEHOLDER », « amazon.fr/dp/B08XYZ1234 »). Publiée, elle mène à une
// page d'erreur : ni vente ni commission, et une page qui paraît cassée. Règle commune, lue aussi par le skill
// affiliate-links-control (linklib.py) : une expression par ligne, compatible avec Python (ni \p{…}, ni drapeau autre que i).
const FAKE_HOST_RX = /(?:^|\.)(?:example\.(?:com|org|net|fr)|exemple\.(?:com|fr|org)|localhost|[\w-]*placeholder[\w-]*\.[a-z]{2,}|[\w.-]+\.(?:test|invalid|example|localhost))$/i;
const FAKE_URL_RX = /\btodo\b|a[-_ ]remplacer|à[-_ ]remplacer|lien[-_ ]affili[ée][-_ ]ici|\bxxx+\b|your[-_]?(?:affiliate[-_]?)?link|votre[-_]lien|placeholder|dummy/i;
// Lien court Amazon : un code donné par Amazon (« amzn.to/4u9mD6j », « amzn.eu/d/… ») ; un mot ou un slug est inventé.
const AMAZON_SHORT_HOST_RX = /^(?:amzn\.to|amzn\.eu|a\.co)$/i;
const AMAZON_SHORT_CODE_RX = /^\/(?:d\/)?[A-Za-z0-9]{5,12}\/?$/;
// Fiche produit : un ASIN de 10 caractères avec au moins un chiffre ; un nom (« dp/Mitsubishi-MELCloud ») ou un
// remplissage (« dp/B08XYZ1234 ») est inventé. Pas « 0000 » ni « 1234 » : les ASIN anciens commencent par B0000.
const AMAZON_HOST_RX = /(?:^|\.)amazon\.(?:fr|com|de|it|es|nl|be|se|pl|ca|com\.be|co\.uk|com\.tr|co\.jp)$/i;
const AMAZON_PRODUCT_PATH_RX = /\/(?:dp|gp\/product|gp\/aw\/d)\//i;
const ASIN_RX = /\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})(?:[\/?]|$)/i;
const FILLER_ASIN_RX = /XYZ|XXXX/i;

/** Raison pour laquelle une adresse est fictive, ou '' si elle ne l'est pas. L'adresse n'est jamais ouverte. */
function fakeLinkReason(url) {
  const raw = String(url);
  let u;
  try {
    u = new URL(raw);
  } catch {
    return '';
  }
  if (!/^https?:$/.test(u.protocol)) return '';
  const host = u.hostname.toLowerCase();
  if (FAKE_HOST_RX.test(host) || FAKE_URL_RX.test(raw)) return 'adresse de remplissage';
  if (AMAZON_SHORT_HOST_RX.test(host)) return AMAZON_SHORT_CODE_RX.test(u.pathname) ? '' : 'lien court Amazon sans code (inventé)';
  if (AMAZON_HOST_RX.test(host) && AMAZON_PRODUCT_PATH_RX.test(u.pathname)) {
    const asin = (u.pathname.match(ASIN_RX) || [])[1] || '';
    if (!asin || !/\d/.test(asin)) return 'fiche Amazon sans numéro de produit (ASIN) valide';
    if (FILLER_ASIN_RX.test(asin)) return 'numéro de produit Amazon de remplissage';
  }
  return '';
}

const URL_IN_TEXT_RX = /https?:\/\/[^\s"'<>`)\]]+/g;

/** Adresses fictives d'une page brute (frontmatter, Markdown, HTML) et liens sponsorisés sans adresse : { line, url, reason }. */
function fakeLinksIn(text) {
  const found = [];
  String(text).split(/\r?\n/).forEach((l, i) => {
    for (const m of l.matchAll(URL_IN_TEXT_RX)) {
      const url = m[0].replace(/[.,;:!?]+$/, '');
      const reason = fakeLinkReason(url);
      if (reason) found.push({ line: i + 1, url, reason });
    }
    for (const m of l.matchAll(/<a\b[^>]*>/gi)) {
      if (/\brel\s*=\s*["'][^"']*\bsponsored\b/i.test(m[0]) && /\bhref\s*=\s*["']\s*#?\s*["']/i.test(m[0])) found.push({ line: i + 1, url: '(vide)', reason: 'lien sponsorisé sans adresse' });
    }
  });
  return found;
}

/** Dossier du cache des lectures d'un projet : dossier temporaire, hors git, partagé par source-check.js et validate-facts.js. */
function defaultCacheDir(root = process.cwd()) {
  return path.join(os.tmpdir(), 'seowk-sources', crypto.createHash('sha1').update(path.resolve(root)).digest('hex').slice(0, 12));
}

/**
 * Lit une page : { ok, url, finalUrl, status, text, dates, lastModified } ou { ok: false, url, status?, error }.
 * Le texte est complet (pas de coupe) : c'est sur lui que les citations sont vérifiées.
 */
async function fetchPageText(url, { timeoutMs = 20000 } = {}) {
  if (isTrackingUrl(url)) return { ok: false, url, error: 'lien affilié ou de suivi : non lu (la lecture compterait un clic) — citer la page officielle de l’entité' };
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, 'accept-language': 'fr-FR,fr;q=0.9,en;q=0.5' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, url, status: res.status, error: `HTTP ${res.status}` };
    const type = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    let text;
    let html = '';
    if (/pdf/i.test(type) || buf.subarray(0, 5).toString('latin1') === '%PDF-') {
      text = pdfText(buf);
      if (text === null) return { ok: false, url, status: res.status, error: 'PDF illisible (pdftotext absent ou en échec)' };
    } else {
      const charset = (type.match(/charset=([\w-]+)/i) || [])[1] || 'utf-8';
      try {
        html = new TextDecoder(charset).decode(buf);
      } catch {
        html = buf.toString('utf-8');
      }
      text = visibleText(html);
    }
    if (text.replace(/\s/g, '').length < 200) return { ok: false, url, status: res.status, error: 'page vide ou rendue par JavaScript', text };
    const lastModified = res.headers.get('last-modified') || undefined;
    return { ok: true, url, finalUrl: res.url, status: res.status, text, dates: pageDates(html, text), lastModified };
  } catch (e) {
    return { ok: false, url, error: e.name === 'TimeoutError' ? 'délai dépassé' : e.message };
  }
}

/** Fichier de cache d'une adresse (clé urlKey : « www. » et barre finale ne font pas deux lectures). */
const cacheFile = (cacheDir, url) => path.join(cacheDir, `${crypto.createHash('sha1').update(urlKey(url)).digest('hex').slice(0, 16)}.json`);

/**
 * Lecture d'une source avec cache disque (texte visible seulement, jamais exécuté) : une lecture réussie de moins de
 * maxAgeHours est reprise telle quelle, pour que le chercheur et les portes citent le même texte ; au-delà, la page
 * est relue (une offre change). Renvoie le résultat de fetchPageText, plus readAt (ISO), via et cached.
 */
async function readSource(url, { cacheDir, maxAgeHours = 24, fresh = false } = {}) {
  const file = cacheDir && cacheFile(cacheDir, url);
  if (file && !fresh && fs.existsSync(file)) {
    try {
      const page = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const age = Date.now() - Date.parse(page.readAt);
      if (page.ok && age >= 0 && age < maxAgeHours * 3600e3) return { ...page, cached: true };
    } catch {}
  }
  const page = { ...(await fetchPageText(url)), readAt: new Date().toISOString(), via: 'lecture directe' };
  if (file && page.ok) saveSource(cacheDir, page);
  return { ...page, cached: false };
}

/** Enregistre une lecture dans le cache (lecture directe, ou texte copié depuis un navigateur : via = 'navigateur …'). */
function saveSource(cacheDir, page) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFile(cacheDir, page.url), JSON.stringify(page));
}

module.exports = {
  indexText,
  normalize,
  numbersIn,
  isYear,
  unitAfter,
  identifiersIn,
  allowedFrom,
  addAllowed,
  addNames,
  findQuote,
  contextAround,
  sentenceAround,
  findPassages,
  QUALIFIERS,
  qualifiersAt,
  lostQualifiers,
  urlKey,
  verifyFact,
  verifyFacts,
  evalFormula,
  precisionOf,
  matchesComputed,
  checkCalc,
  pageAllowed,
  unjustifiedNumbers,
  markersIn,
  visibleText,
  pageDates,
  isTrackingUrl,
  fakeLinkReason,
  fakeLinksIn,
  defaultCacheDir,
  fetchPageText,
  readSource,
  saveSource,
};
