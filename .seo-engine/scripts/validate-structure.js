#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { normalize, countKeyword, textIncludesKeyword, parseArgs, decodeEntities, mainHtml, markSentenceBreaks, splitSentences } = require('./utils');

const args = parseArgs();
const filePath = args.file;
const sidecarPath = args.sidecar;
const configPath = args.config;

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-structure.js --file <path> [--sidecar <path>] [--config <path>]' }));
  process.exit(2);
}

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({ validator: 'validate-structure', file: filePath, status: 'error', word_count: 0, heading_count: 0, checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }] }, null, 2));
  process.exit(2);
}
const ext = path.extname(filePath).toLowerCase();
const checks = [];
const warnings = [];

let targetWordCount = null;
let primaryKeyword = null;
if (sidecarPath) {
  try {
    const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    targetWordCount = sidecar.strat?.word_count_target;
    primaryKeyword = sidecar.strat?.primary_keyword || sidecar.analysis?.current_keyword || null;
  } catch (e) {
    warnings.push(`Sidecar illisible: ${e.message}`);
  }
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
  } catch (e) {
    warnings.push(`Config illisible: ${e.message}`);
  }
}

function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

let headings = [];
let bodyContent = '';
// Zone analysée pour le texte (mots, phrases, sections, paragraphes) : en HTML, le contenu principal seulement (<main>,
// sinon <article>, sinon <body> sans en-tête, menu ni pied) — le menu n'est pas une phrase de la page.
let textZone = '';
const isHtml = ext === '.html' || ext === '.htm';

if (ext === '.mdx' || ext === '.md') {
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  bodyContent = withoutFrontmatter;
  textZone = withoutFrontmatter;

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(withoutFrontmatter)) !== null) {
    headings.push({ level: match[1].length, text: match[2].replace(/\s*\{#[^}]*\}\s*$/, '').trim() });
  }

  // config.seo.h1_from_frontmatter = true : le H1 est rendu par le layout depuis le champ frontmatter `h1`
  let h1FromFm = false;
  try { h1FromFm = !!JSON.parse(fs.readFileSync(configPath, 'utf-8')).seo?.h1_from_frontmatter; } catch (e) {}
  if (h1FromFm && !headings.some(h => h.level === 1)) {
    const fmH1 = content.match(/^h1:\s*["']?(.+?)["']?\s*$/m);
    if (fmH1) headings.unshift({ level: 1, text: fmH1[1].trim() });
  }

} else if (ext === '.html' || ext === '.htm') {
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  bodyContent = bodyMatch ? bodyMatch[1] : content;
  textZone = mainHtml(content).replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ');

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

// Fin de bloc = fin de phrase : fermeture des titres, li, td, th, dt, dd… en HTML ; titres, éléments de liste, lignes de
// tableau et fins de paragraphe en Markdown. Sans cela, un menu ou un tableau sans point final formait une « phrase » géante.
const withBreaks = isHtml
  ? markSentenceBreaks(textZone)
  : textZone.replace(/^(\s*(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|\|).*)$/gm, '$1\u2029').replace(/\n[ \t]*\n/g, '\n\u2029\n');
let cleanText = withBreaks
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/!\[.*?\]\(.*?\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[#*_`~\[\](){}|>]/g, '')
  .replace(/import\s+.*?from\s+['"].*?['"]/g, '')
  .replace(/export\s+.*?;/g, '')
  .replace(/<[A-Z]\w+[^>]*\/>/g, '')
  .replace(/<[A-Z]\w+[^>]*>[\s\S]*?<\/[A-Z]\w+>/g, '');
if (isHtml) cleanText = decodeEntities(cleanText);
const sentenceText = cleanText.replace(/[^\S\u2029]+/g, ' ');
const plainText = cleanText.replace(/\s+/g, ' ').trim();

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
  const kwCount = countKeyword(plainText, primaryKeyword);
  const density = (kwCount / wordCount) * 100;
  addCheck('keyword_density', density <= maxDensity,
    `Densite mot-cle "${primaryKeyword}": ${density.toFixed(1)}% (max: ${maxDensity}%)`);

  const first100 = words.slice(0, 100).join(' ');
  const kwInFirst100 = textIncludesKeyword(first100, primaryKeyword);
  addCheck('keyword_in_first_100_words', kwInFirst100,
    kwInFirst100 ? 'Mot-cle primaire present dans les 100 premiers mots' : `Mot-cle primaire "${primaryKeyword}" absent des 100 premiers mots`);
}

// --- AI Overviews: quotable statements per H2 ---
if (headings.length > 1) {
  const contentForSections = textZone;

  // Une question de FAQ en accordéon (<details><summary>, ou bouton d'accordéon aria-expanded / aria-controls / classe
  // accordion|faq|question) ouvre sa propre section : les réponses ne gonflent plus la section du titre précédent. Une
  // section de question est mesurée (section_length) mais n'est pas une section H2 (ai_overviews_quotable).
  const accordion = '<summary\\b[^>]*>[\\s\\S]*?<\\/summary>|<button\\b(?=[^>]*(?:aria-expanded|aria-controls|class=["\'][^"\']*(?:accordion|faq|question)))[^>]*>[\\s\\S]*?<\\/button>';
  const headingLineRegex = isHtml
    ? new RegExp(`<h[1-6]\\b[^>]*>[\\s\\S]*?<\\/h[1-6]>|${accordion}`, 'gi')
    : new RegExp(`^#{1,6}\\s+.+$|${accordion}`, 'gm');

  const headingPositions = [];
  let hm;
  while ((hm = headingLineRegex.exec(contentForSections)) !== null) {
    headingPositions.push({ index: hm.index, text: hm[0] });
  }

  let h2WithoutQuotable = 0;
  const h2MissingQuotable = [];
  let longSections = 0;

  for (let i = 0; i < headingPositions.length; i++) {
    const start = headingPositions[i].index;
    const end = i + 1 < headingPositions.length ? headingPositions[i + 1].index : contentForSections.length;
    const sectionText = contentForSections.substring(start, end);
    const sectionClean = sectionText
      .replace(/<[^>]+>/g, ' ')
      .replace(/^#{1,6}\s+.*$/gm, '')
      .replace(/[#*_`~\[\](){}|>]/g, '')
      .replace(/\s+/g, ' ').trim();
    const sectionWords = sectionClean.split(/\s+/).filter(w => w.length > 0).length;

    if (sectionWords > maxWordsBetweenHeadings) longSections++;

    const isH2 = ext === '.html' || ext === '.htm'
      ? /^<h2/i.test(headingPositions[i].text)
      : /^##\s/.test(headingPositions[i].text) && !/^###/.test(headingPositions[i].text);

    if (isH2 && sectionWords > 30) {
      const sentences = splitSentences(markSentenceBreaks(sectionText).replace(/<[^>]+>/g, ' ').replace(/[^\S\u2029]+/g, ' ')).filter(s => s.trim().length > 10);
      const hasDefinition = sentences.some(s => /\b(est|sont|designe|signifie|correspond|consiste)\b/i.test(s) && s.split(/\s+/).length <= 30);
      const hasNumber = sentences.some(s => /\d/.test(s) && s.split(/\s+/).length <= 25);
      // <ul data-astro-cid-…>, <ol class="…"> : la balise peut porter des attributs.
      const hasList = /^[-•*]\s/m.test(sectionText) || /<[ou]l[\s>]/i.test(sectionText);

      if (!hasDefinition && !hasNumber && !hasList) {
        h2WithoutQuotable++;
        const headingText = headings.find(h => h.level === 2 && sectionText.includes(h.text))?.text || `Section ${i + 1}`;
        h2MissingQuotable.push(headingText.substring(0, 40));
      }
    }
  }

  addCheck('section_length', longSections === 0,
    longSections === 0
      ? `Toutes les sections ont ${maxWordsBetweenHeadings} mots ou moins`
      : `${longSections} section(s) trop longue(s) (>${maxWordsBetweenHeadings} mots entre titres)`);

  addCheck('ai_overviews_quotable', h2WithoutQuotable === 0,
    h2WithoutQuotable === 0
      ? 'Chaque section H2 contient au moins un element citable (definition, chiffre ou liste)'
      : `${h2WithoutQuotable} section(s) H2 sans element citable pour AI Overviews: ${h2MissingQuotable.slice(0, 3).join(', ')}`);
}

let paragraphs;
if (isHtml) {
  paragraphs = [];
  const pRegex = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = pRegex.exec(textZone)) !== null) {
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

const allSentences = splitSentences(sentenceText)
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

const hasFail = checks.some(c => c.status === 'fail');
const result = {
  validator: 'validate-structure',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  word_count: wordCount,
  heading_count: headings.length,
  checks,
  ...(warnings.length > 0 ? { warnings } : {})
};

console.log(JSON.stringify(result, null, 2));
// exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
process.exitCode = hasFail ? 1 : 0;
