#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const sidecarPath = process.argv[3];
const configFlag = process.argv.indexOf('--config');
const configPath = configFlag !== -1 ? process.argv[configFlag + 1] : null;

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-structure.js <file> [sidecar] [--config path]' }));
  process.exit(1);
}

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({ validator: 'validate-structure', file: filePath, status: 'error', word_count: 0, heading_count: 0, checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }] }, null, 2));
  process.exit(1);
}
const ext = path.extname(filePath).toLowerCase();
const checks = [];

let targetWordCount = null;
let primaryKeyword = null;
if (sidecarPath && !sidecarPath.startsWith('--')) {
  try {
    const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    targetWordCount = sidecar.strat?.word_count_target;
    primaryKeyword = sidecar.strat?.primary_keyword;
  } catch (e) {}
}

let maxDensity = 2.5;
let maxSentenceWords = 35;
let maxWordsBetweenHeadings = 300;
if (configPath) {
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    maxDensity = cfg.seo?.max_keyword_density_percent ?? 2.5;
    maxSentenceWords = cfg.seo?.max_sentence_words ?? 35;
    maxWordsBetweenHeadings = cfg.seo?.max_words_between_headings ?? 300;
  } catch (e) {}
}

function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

let headings = [];
let bodyContent = '';

if (ext === '.mdx' || ext === '.md') {
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  bodyContent = withoutFrontmatter;

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(withoutFrontmatter)) !== null) {
    headings.push({ level: match[1].length, text: match[2].replace(/\s*\{#[^}]*\}\s*$/, '').trim() });
  }

} else if (ext === '.html' || ext === '.htm') {
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  bodyContent = bodyMatch ? bodyMatch[1] : content;

  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(bodyContent)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    headings.push({ level: parseInt(match[1]), text });
  }
}

const h1s = headings.filter(h => h.level === 1);
addCheck('h1_exists', h1s.length >= 1, h1s.length >= 1 ? `H1: "${h1s[0].text}"` : 'Pas de H1 trouve');
addCheck('h1_unique', h1s.length === 1,
  h1s.length === 1 ? 'H1 unique' : `${h1s.length} H1 trouves (doit etre unique)`);

let hierarchyValid = true;
let hierarchyIssue = '';
for (let i = 1; i < headings.length; i++) {
  const prev = headings[i - 1].level;
  const curr = headings[i].level;
  if (curr > prev + 1) {
    hierarchyValid = false;
    hierarchyIssue = `Saut de H${prev} a H${curr} ("${headings[i].text}")`;
    break;
  }
}
addCheck('heading_hierarchy', hierarchyValid,
  hierarchyValid ? `Hierarchie Hn correcte (${headings.length} titres)` : hierarchyIssue);

const h2Count = headings.filter(h => h.level === 2).length;
addCheck('h2_minimum', h2Count >= 3,
  `${h2Count} H2 trouves (minimum: 3)`);

const h2Texts = headings.filter(h => h.level === 2).map(h => h.text.toLowerCase().trim());
const duplicateH2 = h2Texts.filter((t, i) => h2Texts.indexOf(t) !== i);
if (duplicateH2.length > 0) {
  addCheck('h2_unique_text', false, `H2 duplique(s): "${[...new Set(duplicateH2)].join('", "')}"`);
}

const plainText = bodyContent
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/!\[.*?\]\(.*?\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[#*_`~\[\](){}|>]/g, '')
  .replace(/import\s+.*?from\s+['"].*?['"]/g, '')
  .replace(/export\s+.*?;/g, '')
  .replace(/<[A-Z]\w+[^>]*\/>/g, '')
  .replace(/<[A-Z]\w+[^>]*>[\s\S]*?<\/[A-Z]\w+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const words = plainText.split(/\s+/).filter(w => w.length > 0);
const wordCount = words.length;

addCheck('word_count_value', true, `${wordCount} mots`);

if (targetWordCount) {
  const tolerance = targetWordCount * 0.1;
  const min = Math.floor(targetWordCount - tolerance);
  const max = Math.ceil(targetWordCount + tolerance);
  addCheck('word_count_target', wordCount >= min && wordCount <= max,
    `${wordCount} mots (cible: ${targetWordCount}, fourchette: ${min}-${max})`);
}

if (primaryKeyword && wordCount > 0) {
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const kwNorm = normalize(primaryKeyword);
  const textNorm = normalize(plainText);
  let kwCount = 0;
  let pos = 0;
  while ((pos = textNorm.indexOf(kwNorm, pos)) !== -1) {
    kwCount++;
    pos += kwNorm.length;
  }
  const density = (kwCount / wordCount) * 100;
  addCheck('keyword_density', density <= maxDensity,
    `Densite mot-cle "${primaryKeyword}": ${density.toFixed(1)}% (max: ${maxDensity}%)`);

  const first100 = normalize(words.slice(0, 100).join(' '));
  const kwInFirst100 = first100.includes(kwNorm);
  addCheck('keyword_in_first_100_words', kwInFirst100,
    kwInFirst100 ? 'Mot-cle primaire present dans les 100 premiers mots' : `Mot-cle primaire "${primaryKeyword}" absent des 100 premiers mots`);
}

let paragraphs;
if (ext === '.html' || ext === '.htm') {
  paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = pRegex.exec(bodyContent)) !== null) {
    const text = pm[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0) paragraphs.push(text);
  }
} else {
  paragraphs = bodyContent
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0 && !p.trim().startsWith('#') && !p.trim().startsWith('<') && !p.trim().startsWith('import'));
}

let longParagraphs = 0;
for (const p of paragraphs) {
  const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length > 5) longParagraphs++;
}
addCheck('paragraph_length', longParagraphs === 0,
  longParagraphs === 0 ? 'Tous les paragraphes ont 5 phrases ou moins' : `${longParagraphs} paragraphe(s) trop long(s) (>5 phrases)`);

const allSentences = plainText.split(/(?<=[.!?])\s+/)
  .filter(s => s.trim().length > 5)
  .filter(s => s.split(/\s+/).filter(w => w.length > 0).length >= 3);
if (allSentences.length > 2) {
  const sentenceWordCounts = allSentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);
  const avgSentenceLen = Math.round(sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length);
  const maxSentenceLen = Math.max(...sentenceWordCounts);
  addCheck('avg_sentence_length', avgSentenceLen <= 25,
    `Longueur moyenne des phrases : ${avgSentenceLen} mots (cible : 20-25)`);
  addCheck('max_sentence_length', maxSentenceLen <= maxSentenceWords,
    maxSentenceLen <= maxSentenceWords
      ? `Phrase la plus longue : ${maxSentenceLen} mots (max : ${maxSentenceWords})`
      : `Phrase trop longue : ${maxSentenceLen} mots (max : ${maxSentenceWords})`);
}

if (headings.length > 1) {
  let headingPositions = [];
  const headingLineRegex = ext === '.html' || ext === '.htm'
    ? /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi
    : /^#{1,6}\s+.+$/gm;
  let hm;
  const contentForSections = ext === '.html' || ext === '.htm' ? bodyContent : bodyContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  while ((hm = headingLineRegex.exec(contentForSections)) !== null) {
    headingPositions.push(hm.index);
  }
  let longSections = 0;
  for (let i = 0; i < headingPositions.length; i++) {
    const start = headingPositions[i];
    const end = i + 1 < headingPositions.length ? headingPositions[i + 1] : contentForSections.length;
    const sectionText = contentForSections.substring(start, end)
      .replace(/<[^>]+>/g, ' ')
      .replace(/^#{1,6}\s+.*$/gm, '')
      .replace(/\s+/g, ' ').trim();
    const sectionWords = sectionText.split(/\s+/).filter(w => w.length > 0).length;
    if (sectionWords > maxWordsBetweenHeadings) longSections++;
  }
  addCheck('section_length', longSections === 0,
    longSections === 0
      ? `Toutes les sections ont ${maxWordsBetweenHeadings} mots ou moins`
      : `${longSections} section(s) trop longue(s) (>${maxWordsBetweenHeadings} mots entre titres)`);
}

const hasFail = checks.some(c => c.status === 'fail');
const result = {
  validator: 'validate-structure',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  word_count: wordCount,
  heading_count: headings.length,
  checks
};

console.log(JSON.stringify(result, null, 2));
process.exit(hasFail ? 1 : 0);
