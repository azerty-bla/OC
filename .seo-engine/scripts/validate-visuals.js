#!/usr/bin/env node
// Images de la page : fichiers présents, dimensions, poids, SVG accessibles, image principale non différée,
// visuels intégrés par le pôle visuels bien présents. Les visuels du pôle (<figure data-visual>) sont bloquants ;
// les autres images de la page ne donnent que des avertissements (sites existants).

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./utils');
const V = require('./visuals-lib');

const args = parseArgs();
const filePath = args.file;
if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-visuals.js --file <path> [--config <path>] [--root <dir>] [--sidecar <path>]' }));
  process.exit(2);
}

let config = {};
try { config = V.readConfig(args.config); } catch (e) {}
const s = V.settings(config);
const root = args.root || '.';
let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({ validator: 'validate-visuals', file: filePath, status: 'error', checks: [{ name: 'file_readable', status: 'fail', message: e.message }] }));
  process.exit(2);
}

const checks = [];
const warnings = [];
const add = (name, problems, message) => checks.push({ name, status: problems.length ? 'fail' : 'pass', message: problems.length ? `${message} : ${problems.join(' ; ')}` : message });

// Fichier local d'une URL d'image : racine du site, ou public/ (Astro), ou relatif à la page (Markdown).
function localFile(src) {
  if (!src || /^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('{')) return null;
  const clean = decodeURI(src.split(/[?#]/)[0]);
  const candidates = clean.startsWith('/')
    ? [path.join(root, clean), path.join(root, 'public', clean)]
    : [path.resolve(path.dirname(filePath), clean)];
  return candidates.find((c) => fs.existsSync(c)) || candidates[0];
}

const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i')) || tag.match(new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, 'i')) || [])[1];

// Images de la page, avec l'information « dans une figure du pôle visuels ».
const figures = [...content.matchAll(/<figure\b[^>]*data-visual="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g)];
const inFigure = (index) => figures.some((f) => index >= f.index && index < f.index + f[0].length);
const imgs = [...content.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ tag: m[0], src: attr(m[0], 'src'), pole: inFigure(m.index) }));
const sources = [...content.matchAll(/<source\b[^>]*>/gi)].flatMap((m) => (attr(m[0], 'srcset') || '').split(',').map((x) => ({ src: x.trim().split(/\s+/)[0], pole: inFigure(m.index) })));
const md = /\.mdx?$/.test(filePath) ? [...content.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => ({ src: m[1], pole: false })) : [];
const all = [...imgs, ...sources, ...md].filter((i) => localFile(i.src));

const missing = all.filter((i) => !fs.existsSync(localFile(i.src)));
add('visual_files_exist', missing.filter((i) => i.pole).map((i) => i.src), 'Fichiers des visuels présents');
missing.filter((i) => !i.pole).forEach((i) => warnings.push(`image introuvable : ${i.src}`));

const noSize = imgs.filter((i) => !attr(i.tag, 'width') || !attr(i.tag, 'height'));
add('visual_dimensions', noSize.filter((i) => i.pole).map((i) => i.src), 'width et height sur les visuels');
noSize.filter((i) => !i.pole).forEach((i) => warnings.push(`image sans width/height (décalage de mise en page) : ${i.src}`));

const heavy = all.filter((i) => fs.existsSync(localFile(i.src)) && !/\.svg$/i.test(i.src) && fs.statSync(localFile(i.src)).size > s.output.max_kb * 1024);
add('visual_weight', heavy.filter((i) => i.pole).map((i) => `${i.src} (${Math.round(fs.statSync(localFile(i.src)).size / 1024)} Ko)`), `Poids des visuels ≤ ${s.output.max_kb} Ko`);
heavy.filter((i) => !i.pole).forEach((i) => warnings.push(`image de plus de ${s.output.max_kb} Ko : ${i.src}`));

const svgProblems = [];
for (const i of all.filter((x) => /\.svg$/i.test(x.src) && x.pole && fs.existsSync(localFile(x.src)))) {
  const svg = fs.readFileSync(localFile(i.src), 'utf-8');
  if (!/<title\b/.test(svg)) svgProblems.push(`${i.src} sans <title>`);
  if (/(?:href|src)\s*=\s*"(https?:)?\/\//.test(svg) || /@import|url\(\s*['"]?https?:/.test(svg)) svgProblems.push(`${i.src} charge une ressource externe`);
}
add('svg_accessible', svgProblems, 'Schémas SVG avec <title> et sans ressource externe');

const lazyLcp = imgs.filter((i) => /fetchpriority\s*=\s*"high"/i.test(i.tag) && /loading\s*=\s*"lazy"/i.test(i.tag));
add('visual_lcp_not_lazy', lazyLcp.map((i) => i.src), 'Image principale (fetchpriority="high") chargée sans différé');

// Visuels marqués intégrés dans l'état du site (state/visuals/visuals.json) pour cette page : ils doivent y être.
const statePath = (() => { const i = process.argv.indexOf('--visuals-state'); return i > 0 ? process.argv[i + 1] : path.join(root, '.seo-engine/state/visuals'); })();
if (fs.existsSync(path.join(statePath, 'visuals.json'))) {
  try {
    const rel = path.relative(root, filePath);
    const items = V.load(statePath).data.items.filter((it) => it.page?.file && path.normalize(it.page.file) === rel);
    const absent = items.filter((it) => it.status === 'integrated' && !content.includes(`data-visual="${it.id}"`)).map((it) => it.id);
    add('visuals_state_sync', absent, 'Visuels intégrés présents dans la page');
  } catch (e) {
    warnings.push(`état des visuels illisible : ${e.message}`);
  }
}

const status = checks.some((c) => c.status === 'fail') ? 'fail' : 'pass';
console.log(JSON.stringify({ validator: 'validate-visuals', file: filePath, status, images: { total: all.length, pole: figures.length }, checks, ...(warnings.length ? { warnings } : {}) }, null, 2));
process.exitCode = status === 'pass' ? 0 : 1;
