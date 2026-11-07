// Fonctions communes du pôle visuels : état (visuals.json), réglages, conversion des images, balisage des figures.
// Utilisées par generate-visuals, review-visuals, integrate-visuals et validate-visuals, depuis SEOWK comme depuis local-engine.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RASTER = ['photo', 'hero', 'illustration'];
const DEFAULTS = {
  enabled: true,
  bible: 'docs/VISUAL_BIBLE.md',
  generation_mode: 'batch',
  max_iterations: 3,
  min_score: 4,
  allow_people: false,
  generator: { command: [], flags: { prompt: '--prompt', width: '--width', height: '--height', seed: '--seed', output: '--output' }, license: '', commercial_use: false, seconds_per_image: 0, preflight: [] },
  output: { dir: 'img', url_prefix: '/img', widths: [640, 960, 1600], quality: 72, jpeg_width: 1200, max_kb: 250, figure_class: 'content-figure', sizes: '(max-width: 960px) 100vw, 860px', mobile_media: '(max-width: 600px)' },
  seed_base: 1000,
};

function settings(config) {
  const v = config.visuals || {};
  return { ...DEFAULTS, ...v, generator: { ...DEFAULTS.generator, ...v.generator, flags: { ...DEFAULTS.generator.flags, ...v.generator?.flags } }, output: { ...DEFAULTS.output, ...v.output } };
}

function readConfig(configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// État des visuels d'un site : une seule liste d'éléments, du plan à l'intégration (sert aussi de registre).
function load(stateDir) {
  const file = path.join(stateDir, 'visuals.json');
  if (!fs.existsSync(file)) return { file, data: { items: [], next_number: 1, reviews: [] } };
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf-8')) };
}

function save({ file, data }) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
  // Les PNG bruts et la planche de validation sont lourds et propres à la machine : jamais dans git.
  const ignore = path.join(path.dirname(file), '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, 'raw/\nreview/\nreview.html\n');
}

const lastAttempt = (item) => (item.attempts || []).at(-1);
const isRaster = (item) => RASTER.includes(item.type);

function has(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function dimensions(file) {
  const out = execFileSync('magick', ['identify', '-format', '%w %h', `${file}[0]`], { encoding: 'utf-8' });
  const [w, h] = out.trim().split(' ').map(Number);
  return { w, h };
}

// JPEG progressif, sous-échantillonnage 4:2:0, sans métadonnées.
function resizeJpeg(src, dst, width, quality = 82) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  execFileSync('magick', [src, '-resize', `${width}x>`, '-strip', '-interlace', 'Plane', '-sampling-factor', '4:2:0', '-quality', String(quality), dst]);
}

function resizeWebp(src, dst, width, quality = 80) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  // -m 6 : compression la plus poussée ; -sharp_yuv : contours nets malgré le sous-échantillonnage des couleurs.
  execFileSync('cwebp', ['-quiet', '-q', String(quality), '-m', '6', '-sharp_yuv', '-resize', String(width), '0', '-metadata', 'none', src, '-o', dst]);
}

// Rendu d'un SVG en PNG (contrôle visuel des schémas) : rsvg-convert si présent, sinon ImageMagick.
function renderSvg(svg, png, width = 1200) {
  fs.mkdirSync(path.dirname(png), { recursive: true });
  if (has('rsvg-convert')) execFileSync('rsvg-convert', ['-w', String(width), '-b', 'white', svg, '-o', png]);
  else execFileSync('magick', ['-density', '150', '-background', 'white', svg, '-resize', `${width}x`, png]);
  return png;
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Figure insérée dans la page. Balises auto-fermantes : le même balisage passe en HTML et en MDX.
function figureHtml(item, s) {
  const f = item.final;
  const cls = `${s.output.figure_class}${item.type === 'schema' ? ` ${s.output.figure_class}--schema` : ''}`;
  const caption = item.caption ? `\n  <figcaption>${esc(item.caption)}</figcaption>` : '';
  if (item.type === 'schema') {
    const img = `<img src="${f.url}" alt="${esc(item.alt)}" width="${f.width}" height="${f.height}" loading="lazy" decoding="async" />`;
    // Version mobile (mise en page verticale, texte lisible sur téléphone) : choisie par le navigateur selon la largeur d'écran.
    if (f.mobile) return `<figure class="${cls}" data-visual="${item.id}">\n  <picture>\n    <source media="${s.output.mobile_media}" srcset="${f.mobile.url}" width="${f.mobile.width}" height="${f.mobile.height}" />\n    ${img}\n  </picture>${caption}\n</figure>`;
    return `<figure class="${cls}" data-visual="${item.id}">\n  ${img}${caption}\n</figure>`;
  }
  const srcset = f.webp.map((v) => `${v.url} ${v.width}w`).join(', ');
  return `<figure class="${cls}" data-visual="${item.id}">\n  <picture>\n    <source type="image/webp" srcset="${srcset}" sizes="${s.output.sizes}" />\n    <img src="${f.url}" alt="${esc(item.alt)}" width="${f.width}" height="${f.height}" loading="lazy" decoding="async" />\n  </picture>${caption}\n</figure>`;
}

module.exports = { RASTER, DEFAULTS, settings, readConfig, load, save, lastAttempt, isRaster, has, dimensions, resizeJpeg, resizeWebp, renderSvg, esc, figureHtml };
