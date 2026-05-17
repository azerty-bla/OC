import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// Génère un fichier ICO valide (format ICONDIR + PNG blobs)
function createIcoBuffer(entries) {
  // entries: [{ size, data: Buffer }, ...]
  const count = entries.length;
  const headerSize = 6;
  const dirSize = count * 16;
  let dataOffset = headerSize + dirSize;
  const offsets = [];
  for (const e of entries) { offsets.push(dataOffset); dataOffset += e.data.length; }
  const ico = Buffer.alloc(dataOffset);
  ico.writeUInt16LE(0, 0);      // Reserved
  ico.writeUInt16LE(1, 2);      // Type: ICO
  ico.writeUInt16LE(count, 4);  // Count
  for (let i = 0; i < count; i++) {
    const { size, data } = entries[i];
    const base = 6 + i * 16;
    ico.writeUInt8(size >= 256 ? 0 : size, base + 0);
    ico.writeUInt8(size >= 256 ? 0 : size, base + 1);
    ico.writeUInt8(0, base + 2);
    ico.writeUInt8(0, base + 3);
    ico.writeUInt16LE(0, base + 4);
    ico.writeUInt16LE(32, base + 6);
    ico.writeUInt32LE(data.length, base + 8);
    ico.writeUInt32LE(offsets[i], base + 12);
    data.copy(ico, offsets[i]);
  }
  return ico;
}
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public', 'logos', 'icons');

mkdirSync(outDir, { recursive: true });

const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024];

function generateMarkSvg(size, variant = 'light') {
  const isLight = variant === 'light';
  const leftFill = isLight ? '#102a43' : '#ffffff';
  const rightFill = '#d4a024';
  const bg = isLight ? '' : `<rect width="${size}" height="${size}" rx="${Math.round(size * 0.125)}" fill="#102a43"/>`;
  const half = size / 2;
  const fontSize = Math.round(size * 0.8);
  const y = Math.round(size * 0.78);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <defs>
    <clipPath id="l"><rect x="0" y="0" width="${half}" height="${size}"/></clipPath>
    <clipPath id="r"><rect x="${half}" y="0" width="${half}" height="${size}"/></clipPath>
  </defs>
  <text x="${half}" y="${y}" text-anchor="middle" font-family="'Futura','Century Gothic',sans-serif" font-size="${fontSize}" font-weight="800" fill="${leftFill}" clip-path="url(#l)">O</text>
  <text x="${half}" y="${y}" text-anchor="middle" font-family="'Futura','Century Gothic',sans-serif" font-size="${fontSize}" font-weight="800" fill="${rightFill}" clip-path="url(#r)">O</text>
</svg>`;
}

async function main() {
  let resvg;
  try {
    resvg = await import('@resvg/resvg-js');
  } catch {
    console.log('⚠️  @resvg/resvg-js non installé. Installation...');
    const { execSync } = await import('child_process');
    execSync('npm install --save-dev @resvg/resvg-js', { cwd: root, stdio: 'inherit' });
    resvg = await import('@resvg/resvg-js');
  }

  const { Resvg } = resvg;

  console.log('Génération des icônes PNG...\n');

  for (const size of sizes) {
    const svg = generateMarkSvg(size, size <= 64 ? 'light' : 'dark');
    const renderer = new Resvg(svg, {
      fitTo: { mode: 'width', value: size },
      font: { defaultFontFamily: 'Century Gothic' }
    });
    const png = renderer.render().asPng();
    const filename = `icon-${size}.png`;
    writeFileSync(join(outDir, filename), png);
    console.log(`  ✓ ${filename} (${size}×${size})`);
  }

  // Apple touch icon (180x180) — copie dans public/
  const appleSvg = generateMarkSvg(180, 'dark');
  const appleRenderer = new Resvg(appleSvg, {
    fitTo: { mode: 'width', value: 180 },
    font: { defaultFontFamily: 'Century Gothic' }
  });
  const applePng = appleRenderer.render().asPng();
  writeFileSync(join(root, 'public', 'apple-touch-icon.png'), applePng);
  console.log('  ✓ apple-touch-icon.png (180×180)');

  // OG image PNG (1200x630)
  const ogSvg = readFileSync(join(root, 'public', 'og-image.svg'), 'utf-8');
  const ogRenderer = new Resvg(ogSvg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { defaultFontFamily: 'Century Gothic' }
  });
  const ogPng = ogRenderer.render().asPng();
  writeFileSync(join(root, 'public', 'og-image.png'), ogPng);
  console.log('  ✓ og-image.png (1200×630)');

  // favicon.ico — multi-taille (16, 32, 48) avec PNG blobs
  const icoEntries = [];
  for (const sz of [16, 32, 48]) {
    const svgStr = generateMarkSvg(sz, 'light');
    const renderer = new Resvg(svgStr, { fitTo: { mode: 'width', value: sz } });
    icoEntries.push({ size: sz, data: renderer.render().asPng() });
  }
  writeFileSync(join(root, 'public', 'favicon.ico'), createIcoBuffer(icoEntries));
  console.log('  ✓ favicon.ico (16+32+48px, format ICO valide)');

  console.log('\n✅ Toutes les icônes générées avec succès !');
}

main().catch(console.error);
