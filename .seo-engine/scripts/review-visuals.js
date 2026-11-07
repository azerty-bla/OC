#!/usr/bin/env node
// Planche de validation humaine des visuels : chaque image prête (status "ready") reçoit un numéro définitif,
// avec la page, l'emplacement, à quoi elle sert et l'image à côté. L'utilisateur répond par les numéros qu'il ne garde pas.
//
//   node review-visuals.js --state <dossier visuals> [--title "Lot 2"]      → écrit <state>/review.html
//   node review-visuals.js --state <dossier visuals> --reject 3,7           → 3 et 7 refusés, les autres numéros prêts validés
//   node review-visuals.js --state <dossier visuals> --reject none          → tout est validé
//
// La planche reste dans le dossier d'état (jamais servie par le site). Ouvrir avec : open <state>/review.html

const fs = require('fs');
const path = require('path');
const V = require('./visuals-lib');

const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };
const stateDir = arg('state');
if (!stateDir) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node review-visuals.js --state <dossier> [--title <titre>] [--reject 3,7|none]' }));
  process.exit(2);
}
const state = V.load(stateDir);
const items = state.data.items;

// ---------- Décision de l'utilisateur ----------
if (arg('reject') !== undefined) {
  const raw = arg('reject');
  const rejected = raw === 'none' ? [] : raw.split(',').map((n) => Number(n.trim())).filter(Number.isInteger);
  const ready = items.filter((it) => it.status === 'ready' && it.number);
  const unknown = rejected.filter((n) => !ready.some((it) => it.number === n));
  if (unknown.length) {
    console.log(JSON.stringify({ status: 'error', message: `Numéros absents de la planche en cours : ${unknown.join(', ')}` }));
    process.exit(1);
  }
  for (const it of ready) it.status = rejected.includes(it.number) ? 'rejected' : 'approved';
  state.data.reviews.push({ at: new Date().toISOString(), numbers: ready.map((it) => it.number), rejected });
  V.save(state);
  console.log(JSON.stringify({ status: 'pass', approved: ready.filter((it) => it.status === 'approved').map((it) => `${it.number} ${it.id}`), rejected: ready.filter((it) => it.status === 'rejected').map((it) => `${it.number} ${it.id}`) }, null, 2));
  process.exit(0);
}

// ---------- Planche ----------
const ready = items.filter((it) => it.status === 'ready');
// Nouveaux numéros dans l'ordre d'affichage : page par page (ordre de première apparition), puis ordre du plan.
const pageKey = (it) => it.page?.url_path || it.page?.slug || '—';
const pageOrder = [...new Set(ready.map(pageKey))];
ready
  .filter((it) => !it.number)
  .sort((a, b) => pageOrder.indexOf(pageKey(a)) - pageOrder.indexOf(pageKey(b)) || items.indexOf(a) - items.indexOf(b))
  .forEach((it) => { it.number = state.data.next_number++; });
const reviewDir = path.join(stateDir, 'review');
fs.mkdirSync(reviewDir, { recursive: true });

function preview(it) {
  if (it.type === 'schema') {
    const dst = path.join(reviewDir, `${it.id}.svg`);
    fs.copyFileSync(path.join(stateDir, it.svg_file), dst);
    return `review/${it.id}.svg`;
  }
  const src = path.join(stateDir, V.lastAttempt(it).file);
  const dst = path.join(reviewDir, `${it.id}.jpg`);
  if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) V.resizeJpeg(src, dst, 1400, 85);
  return `review/${it.id}.jpg`;
}

function mobilePreview(it) {
  const dst = path.join(reviewDir, `${it.id}-mobile.svg`);
  fs.copyFileSync(path.join(stateDir, it.svg_mobile_file), dst);
  return `review/${it.id}-mobile.svg`;
}

const TYPES = { photo: 'Photo', hero: 'Hero', illustration: 'Illustration', schema: 'Schéma', og: 'Image de partage' };
const CRIT = { voir: 'faire voir', comprendre: 'faire comprendre', 'se-reconnaitre': 'situer son cas', gabarit: 'gabarit' };
const e = V.esc;

const byPage = new Map();
for (const it of ready.sort((a, b) => a.number - b.number)) {
  const key = it.page?.url_path || it.page?.slug || '—';
  if (!byPage.has(key)) byPage.set(key, []);
  byPage.get(key).push(it);
}

const cards = [...byPage].map(([url, list]) => `
  <section class="page">
    <h2>${e(url)}${list[0].page?.title ? ` <span>${e(list[0].page.title)}</span>` : ''}</h2>
    ${list.map((it) => `
    <article class="card" id="n${it.number}">
      <div class="info">
        <div class="num">${it.number}</div>
        <p class="tags"><span>${TYPES[it.type] || it.type}</span><span>${CRIT[it.criterion] || it.criterion || ''}</span>${it.attempts?.length > 1 ? `<span>${it.attempts.length} essais</span>` : ''}${it.score ? `<span class="score">auto ${it.score}/5</span>` : ''}</p>
        <p class="where">Emplacement : ${it.slot?.after_heading ? `après « ${e(it.slot.after_heading)} »` : e(it.slot?.position || 'gabarit')}</p>
        <p class="why">${e(it.purpose)}</p>
        <p class="alt"><b>alt</b> ${e(it.alt)}</p>
        ${it.issues?.length ? `<p class="issues">Audit : ${e(it.issues.join(' ; '))}</p>` : ''}
        ${it.prompt ? `<details><summary>Prompt</summary><p>${e(it.prompt)}</p></details>` : ''}
      </div>
      <div class="img"><a href="${preview(it)}" target="_blank"><img src="${preview(it)}" alt="" loading="lazy"></a>${it.svg_mobile_file ? `<p class="mob">Version mobile</p><a href="${mobilePreview(it)}" target="_blank"><img class="m" src="${mobilePreview(it)}" alt="" loading="lazy"></a>` : ''}</div>
    </article>`).join('')}
  </section>`).join('');

const failed = items.filter((it) => ['failed', 'to-source'].includes(it.status));
const aside = failed.length ? `
  <section class="page off">
    <h2>Non proposées <span>${failed.length}</span></h2>
    <ul>${failed.map((it) => `<li><b>${e(it.page?.url_path || '')}</b> — ${e(it.purpose)} : ${it.status === 'to-source' ? 'photo réelle à fournir' : e(it.reject_reason || 'échec après les essais autorisés')}</li>`).join('')}</ul>
  </section>` : '';

const title = arg('title') || 'Validation des visuels';
const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${e(title)}</title>
<style>
:root{--ink:#222;--muted:#666;--line:#e5e7e5;--bg:#f5f6f5;--card:#fff;--accent:#0c7a35}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--bg)}
header{padding:28px 20px 8px;max-width:1500px;margin:auto}h1{margin:0 0 6px;font-size:26px}header p{margin:4px 0;color:var(--muted)}
header .how{color:var(--ink);background:#fff;border-left:4px solid var(--accent);padding:10px 14px;border-radius:6px;margin-top:12px}
main{max-width:1500px;margin:auto;padding:8px 20px 60px}.page h2{font-size:17px;margin:28px 0 10px}.page h2 span{font-weight:400;color:var(--muted)}
.card{display:grid;grid-template-columns:minmax(260px,1fr) 2fr;gap:20px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:14px}
.num{font-size:34px;font-weight:800;color:var(--accent);line-height:1}.tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.tags span{font-size:12px;background:#eef2ee;padding:2px 8px;border-radius:99px}.tags .score{background:#e2f3e7}
.where{font-size:13px;color:var(--muted);margin:0 0 8px}.why{margin:0 0 10px}.alt,.issues{font-size:13px;color:var(--muted);margin:0 0 6px}
.alt b{color:var(--ink);font-weight:600;margin-right:4px}.issues{color:#9a4b00}details{font-size:12px;color:var(--muted)}summary{cursor:pointer}
.img img{width:100%;height:auto;display:block;border-radius:6px;background:#fff;border:1px solid var(--line)}.img img.m{width:342px;max-width:100%}.mob{font-size:12px;color:var(--muted);margin:10px 0 4px}
.off ul{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px 30px;font-size:14px}
@media (max-width:820px){.card{grid-template-columns:1fr}.img{order:-1}}
</style></head><body>
<header><h1>${e(title)}</h1>
<p>${ready.length} visuel(s) à valider sur ${byPage.size} page(s) — ${new Date().toLocaleString('fr-FR')}</p>
<p class="how">Réponds uniquement par les <b>numéros que tu ne gardes pas</b> (ex. « 3, 7 »), et pour chacun : à retravailler ou à enlever. Tous les autres sont validés.</p></header>
<main>${cards || '<p>Aucun visuel en attente de validation.</p>'}${aside}</main>
</body></html>`;

fs.writeFileSync(path.join(stateDir, 'review.html'), html);
V.save(state);
console.log(JSON.stringify({ status: 'pass', file: path.join(stateDir, 'review.html'), count: ready.length, numbers: ready.map((it) => it.number) }, null, 2));
