#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-duplicates.js <file> [project-root] [config]' }));
  process.exit(1);
}

const projectRoot = process.argv[3] || '.';
const configPath = process.argv[4] || '.seo-engine/config.json';

let contentDir = 'src/content';
let pagesDir = 'src/pages';
let similarityThreshold = 0.8;
try {
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  contentDir = cfg.paths?.content_dir || 'src/content';
  pagesDir = cfg.paths?.pages_dir || 'src/pages';
  similarityThreshold = cfg.seo?.duplicate_similarity_threshold ?? 0.8;
} catch (e) {}

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({
    validator: 'validate-duplicates', file: filePath, status: 'error',
    checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }]
  }, null, 2));
  process.exit(1);
}

const checks = [];
function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

function normalize(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(raw, ext) {
  const meta = { title: '', description: '', h1: '' };
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const t = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (t) meta.title = t[1];
    const d = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m);
    if (d) meta.description = d[1];
  }
  if (ext === '.mdx' || ext === '.md') {
    const h = raw.match(/^#\s+(.+)$/m);
    if (h) meta.h1 = h[1].replace(/[*_`]/g, '').trim();
  } else {
    const h = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h) meta.h1 = h[1].replace(/<[^>]+>/g, '').trim();
    if (!meta.title) {
      const t = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (t) meta.title = t[1].trim();
    }
    if (!meta.description) {
      const d = raw.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      if (d) meta.description = d[1];
    }
  }
  return meta;
}

function extractParagraphs(raw, ext) {
  let text = raw.replace(/^---[\s\S]*?---\n?/, '');
  if (ext === '.mdx' || ext === '.md') {
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/^import\s+.*$/gm, '');
    return text.split(/\n\s*\n/).map(p => {
      p = p.replace(/!\[.*?\]\(.*?\)/g, '');
      p = p.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      p = p.replace(/[#*_~`>|]/g, '');
      p = p.replace(/<[^>]+>/g, '');
      return p.replace(/\s+/g, ' ').trim();
    }).filter(p => p.length > 80);
  }
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRegex.exec(text)) !== null) {
    const clean = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (clean.length > 80) paragraphs.push(clean);
  }
  if (paragraphs.length > 0) return paragraphs;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<[^>]+>/g, '\n');
  return text.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p.length > 80);
}

function trigramSimilarity(a, b) {
  function trigrams(s) {
    const n = normalize(s);
    const set = new Set();
    for (let i = 0; i <= n.length - 3; i++) set.add(n.substring(i, i + 3));
    return set;
  }
  const t1 = trigrams(a);
  const t2 = trigrams(b);
  if (t1.size === 0 || t2.size === 0) return 0;
  let intersection = 0;
  for (const g of t1) { if (t2.has(g)) intersection++; }
  return intersection / (t1.size + t2.size - intersection);
}

function findContentFiles(dir, validExts) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findContentFiles(fullPath, validExts));
      else if (validExts.includes(path.extname(entry.name).toLowerCase())) results.push(fullPath);
    }
  } catch (e) {}
  return results;
}

const FILE_LIMIT = 200;
const validExts = ['.mdx', '.md', '.html', '.htm'];
const targetAbs = path.resolve(filePath);
const allFiles = [...new Set([
  ...findContentFiles(path.join(projectRoot, contentDir), validExts),
  ...findContentFiles(path.join(projectRoot, pagesDir), validExts),
].map(f => path.resolve(f)))].filter(f => f !== targetAbs).slice(0, FILE_LIMIT);

const targetExt = path.extname(filePath).toLowerCase();
const targetMeta = extractMeta(content, targetExt);
const targetParagraphs = extractParagraphs(content, targetExt);

const duplicates = { title: [], description: [], h1: [], content_blocks: [], common_blocks: [] };
const paragraphMatchFiles = new Map();
targetParagraphs.forEach(p => paragraphMatchFiles.set(p, []));

for (const otherFile of allFiles) {
  try {
    const otherRaw = fs.readFileSync(otherFile, 'utf-8');
    const otherExt = path.extname(otherFile).toLowerCase();
    const otherMeta = extractMeta(otherRaw, otherExt);
    const otherParagraphs = extractParagraphs(otherRaw, otherExt);
    const rel = path.relative(projectRoot, otherFile);

    if (targetMeta.title && otherMeta.title &&
        normalize(targetMeta.title) === normalize(otherMeta.title)) {
      duplicates.title.push({ file: rel, value: otherMeta.title });
    }
    if (targetMeta.description && otherMeta.description &&
        normalize(targetMeta.description) === normalize(otherMeta.description)) {
      duplicates.description.push({ file: rel, value: otherMeta.description });
    }
    if (targetMeta.h1 && otherMeta.h1 &&
        normalize(targetMeta.h1) === normalize(otherMeta.h1)) {
      duplicates.h1.push({ file: rel, value: otherMeta.h1 });
    }

    for (const tp of targetParagraphs) {
      for (const op of otherParagraphs) {
        const sim = trigramSimilarity(tp, op);
        if (sim > similarityThreshold) {
          duplicates.content_blocks.push({
            file: rel,
            target_excerpt: tp.substring(0, 120),
            other_excerpt: op.substring(0, 120),
            similarity: Math.round(sim * 100)
          });
          const matches = paragraphMatchFiles.get(tp);
          if (matches && !matches.includes(rel)) matches.push(rel);
          break;
        }
      }
    }
  } catch (e) {}
}

for (const [paragraph, files] of paragraphMatchFiles) {
  if (files.length >= 3) {
    duplicates.common_blocks.push({
      excerpt: paragraph.substring(0, 120),
      found_in: files.length,
      files: files.slice(0, 5)
    });
  }
}

addCheck('unique_title', duplicates.title.length === 0,
  duplicates.title.length === 0
    ? 'Title unique sur le site'
    : `Title duplique avec: ${duplicates.title.map(d => d.file).join(', ')}`);

addCheck('unique_description', duplicates.description.length === 0,
  duplicates.description.length === 0
    ? 'Meta description unique sur le site'
    : `Description dupliquee avec: ${duplicates.description.map(d => d.file).join(', ')}`);

addCheck('unique_h1', duplicates.h1.length === 0,
  duplicates.h1.length === 0
    ? 'H1 unique sur le site'
    : `H1 duplique avec: ${duplicates.h1.map(d => d.file).join(', ')}`);

addCheck('no_duplicate_blocks', duplicates.content_blocks.length === 0,
  duplicates.content_blocks.length === 0
    ? 'Aucun bloc de contenu duplique detecte'
    : `${duplicates.content_blocks.length} bloc(s) de contenu duplique(s): ${[...new Set(duplicates.content_blocks.map(d => d.file))].join(', ')}`);

addCheck('no_common_blocks', duplicates.common_blocks.length === 0,
  duplicates.common_blocks.length === 0
    ? 'Aucun contenu boilerplate detecte'
    : `${duplicates.common_blocks.length} bloc(s) repete(s) sur 3+ pages (contenu commun/boilerplate)`);

const hasFail = checks.some(c => c.status === 'fail');
console.log(JSON.stringify({
  validator: 'validate-duplicates',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  duplicates,
  checks
}, null, 2));
process.exit(hasFail ? 1 : 0);
