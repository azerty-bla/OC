#!/usr/bin/env node
// Intègre les visuels validés par l'utilisateur (status "approved") : fichiers finaux (WebP aux largeurs du projet + JPEG
// de repli, ou SVG), puis <figure> insérée dans la page, après l'intertitre prévu. Hero et image de partage : fichiers
// produits, placement laissé au gabarit (status "exported").
// Usage : node integrate-visuals.js --state <dossier visuals> [--config .seo-engine/config.json] [--root .] [--dry-run]

const fs = require('fs');
const path = require('path');
const V = require('./visuals-lib');
const { normalize } = require('./utils');

const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };
const stateDir = arg('state');
const configPath = arg('config') || '.seo-engine/config.json';
const root = arg('root') || '.';
const dryRun = argv.includes('--dry-run');
if (!stateDir) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node integrate-visuals.js --state <dossier> [--config <path>] [--root <dir>] [--dry-run]' }));
  process.exit(2);
}

const s = V.settings(V.readConfig(configPath));
const state = V.load(stateDir);
const outDir = path.join(root, s.output.dir);
const url = (name) => `${s.output.url_prefix.replace(/\/$/, '')}/${name}`;
const result = { integrated: [], exported: [], errors: [] };

function exportRaster(it, name) {
  const src = path.join(stateDir, V.lastAttempt(it).file);
  const { w: srcW } = V.dimensions(src);
  const widths = [...new Set(s.output.widths.map((w) => Math.min(w, srcW)))].sort((a, b) => a - b);
  const largest = widths[widths.length - 1];
  const webp = widths.map((w) => ({ width: w, file: w === largest ? `${name}.webp` : `${name}-${w}.webp` }));
  if (!dryRun) {
    for (const v of webp) V.resizeWebp(src, path.join(outDir, v.file), v.width, s.output.quality);
    // JPEG de repli (navigateurs sans WebP) : une seule taille, plafonnée.
    V.resizeJpeg(src, path.join(outDir, `${name}.jpg`), Math.min(largest, s.output.jpeg_width), s.output.quality);
  }
  // width/height = proportions de la plus grande version (réserve la place, évite le décalage de mise en page).
  const { w, h } = { w: largest, h: Math.round((largest * V.dimensions(src).h) / srcW) };
  return { url: url(`${name}.jpg`), width: w, height: h, webp: webp.map((v) => ({ url: url(v.file), width: v.width })), files: [...webp.map((v) => v.file), `${name}.jpg`] };
}

function viewBox(file, fallback) {
  const vb = fs.readFileSync(file, 'utf-8').match(/viewBox="\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/);
  return vb ? { width: Math.round(+vb[1]), height: Math.round(+vb[2]) } : fallback;
}

// Schéma SVG, et sa version mobile éventuelle (svg_mobile_file) publiée en <nom>-mobile.svg.
function exportSvg(it, name) {
  const src = path.join(stateDir, it.svg_file);
  const files = [`${name}.svg`];
  if (!dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.copyFileSync(src, path.join(outDir, `${name}.svg`));
  }
  const out = { url: url(`${name}.svg`), ...viewBox(src, { width: it.width, height: it.height }), files };
  if (it.svg_mobile_file) {
    const msrc = path.join(stateDir, it.svg_mobile_file);
    if (!dryRun) fs.copyFileSync(msrc, path.join(outDir, `${name}-mobile.svg`));
    out.mobile = { url: url(`${name}-mobile.svg`), ...viewBox(msrc, { width: 400, height: 600 }) };
    files.push(`${name}-mobile.svg`);
  }
  return out;
}

const text = (html) => normalize(html.replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim());

// Position d'insertion : après le bloc (paragraphe, liste, tableau) qui contient slot.after_text dans la section,
// sinon après le premier paragraphe qui suit l'intertitre (ou juste après l'intertitre).
function insertHtml(page, it, figure) {
  const want = normalize(it.slot.after_heading.trim());
  const heads = [...page.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/g)];
  const h = heads.find((m) => text(m[2]) === want) || heads.find((m) => text(m[2]).includes(want));
  if (!h) throw new Error(`intertitre introuvable : « ${it.slot.after_heading} »`);
  const headEnd = h.index + h[0].length;
  const next = heads.find((m) => m.index > h.index);
  const limit = next ? next.index : page.length;
  let at = headEnd;
  if (it.slot.after_text) {
    const t = page.indexOf(it.slot.after_text, headEnd);
    if (t < 0 || t > limit) throw new Error(`texte de repère introuvable dans la section : « ${it.slot.after_text} »`);
    const ends = ['</p>', '</ul>', '</ol>', '</table>'].map((c) => [page.indexOf(c, t), c.length]).filter(([i]) => i >= 0 && i < limit);
    if (!ends.length) throw new Error(`aucun bloc fermé après « ${it.slot.after_text} »`);
    const [i, len] = ends.sort((a, b) => a[0] - b[0])[0];
    at = i + len;
  } else if (it.slot.position !== 'after-heading') {
    const p = page.indexOf('</p>', headEnd);
    if (p >= 0 && p < limit) at = p + 4;
  }
  const indent = (page.slice(0, h.index).match(/[ \t]*$/) || [''])[0];
  return `${page.slice(0, at)}\n${figure.replace(/^/gm, indent)}${page.slice(at)}`;
}

function insertMdx(page, it, figure) {
  const want = normalize(it.slot.after_heading.trim());
  const lines = page.split('\n');
  let i = lines.findIndex((l) => /^#{2,4}\s/.test(l) && normalize(l.replace(/^#+\s*/, '').trim()) === want);
  if (i < 0) i = lines.findIndex((l) => /^#{2,4}\s/.test(l) && normalize(l).includes(want));
  if (i < 0) throw new Error(`intertitre introuvable : « ${it.slot.after_heading} »`);
  let at = i + 1;
  if (it.slot.after_text) {
    at = lines.findIndex((l, k) => k > i && l.includes(it.slot.after_text));
    if (at < 0) throw new Error(`texte de repère introuvable : « ${it.slot.after_text} »`);
    while (at < lines.length && lines[at].trim() && !/^#{1,6}\s/.test(lines[at])) at++;
  } else if (it.slot.position !== 'after-heading') {
    while (at < lines.length && !lines[at].trim()) at++;
    while (at < lines.length && lines[at].trim() && !/^#{1,6}\s/.test(lines[at])) at++;
  }
  lines.splice(at, 0, '', figure, '');
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

for (const it of state.data.items.filter((x) => x.status === 'approved')) {
  try {
    const name = it.file_name || it.id;
    it.final = it.type === 'schema' ? exportSvg(it, name) : exportRaster(it, name);
    if (['hero', 'og'].includes(it.type)) {
      it.status = dryRun ? it.status : 'exported';
      result.exported.push({ id: it.id, files: it.final.files });
      continue;
    }
    const file = path.join(root, it.page.file);
    const page = fs.readFileSync(file, 'utf-8');
    const figure = V.figureHtml(it, s);
    // Figure déjà présente : remplacée sur place (nouvelles tailles, nouveau texte), sinon insérée.
    const existing = new RegExp(`([ \\t]*)<figure\\b[^>]*data-visual="${it.id}"[\\s\\S]*?<\\/figure>`);
    const updated = existing.test(page)
      ? page.replace(existing, (m, indent) => figure.replace(/^/gm, indent))
      : /\.mdx?$/.test(file) ? insertMdx(page, it, figure) : insertHtml(page, it, figure);
    if (!dryRun && updated !== page) fs.writeFileSync(file, updated);
    if (!dryRun) it.status = 'integrated';
    result.integrated.push({ id: it.id, page: it.page.file, files: it.final.files });
  } catch (e) {
    it.integration_error = e.message;
    result.errors.push({ id: it.id, message: e.message });
  }
}
if (!dryRun) V.save(state);
console.log(JSON.stringify({ status: result.errors.length ? 'fail' : 'pass', dry_run: dryRun, ...result }, null, 2));
process.exitCode = result.errors.length ? 1 : 0;
