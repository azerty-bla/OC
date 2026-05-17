#!/usr/bin/env node

/**
 * validate-writing.js
 * Keyword stuffing detection, banned formulations, common French language
 * errors, and number formatting. Deterministic checks that complement the
 * LLM-based audit (pole-audit B2, F0).
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const sidecarPath = process.argv[3];
const configFlag = process.argv.indexOf('--config');
const configPath = configFlag !== -1 ? process.argv[configFlag + 1] : null;

if (!filePath) {
  console.error(JSON.stringify({
    status: 'error',
    message: 'Usage: node validate-writing.js <file> [sidecar] [--config path]'
  }));
  process.exit(1);
}

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({
    validator: 'validate-writing',
    file: filePath,
    status: 'error',
    checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }]
  }, null, 2));
  process.exit(1);
}

const ext = path.extname(filePath).toLowerCase();
const checks = [];

let primaryKeyword = null;
if (sidecarPath && !sidecarPath.startsWith('--')) {
  try {
    const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    primaryKeyword = sidecar.strat?.primary_keyword || sidecar.analysis?.current_keyword || null;
  } catch (e) {}
}

let maxSectionDensity = 3;
if (configPath) {
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    maxSectionDensity = cfg.seo?.max_section_keyword_density_percent ?? 3;
  } catch (e) {}
}

function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

let bodyContent = '';
let headings = [];

if (ext === '.mdx' || ext === '.md') {
  bodyContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(bodyContent)) !== null) {
    headings.push({ level: match[1].length, text: match[2].trim(), index: match.index });
  }
} else if (ext === '.html' || ext === '.htm') {
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  bodyContent = bodyMatch ? bodyMatch[1] : content;
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(bodyContent)) !== null) {
    headings.push({ level: parseInt(match[1]), text: match[2].replace(/<[^>]+>/g, '').trim(), index: match.index });
  }
}

const plainText = bodyContent
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
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
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('#') && !p.startsWith('```') &&
      !p.startsWith('import') && !p.startsWith('export') && !p.startsWith('<'));
}

const sentences = plainText.split(/(?<=[.!?])\s+/)
  .filter(s => s.trim().length > 5)
  .filter(s => s.split(/\s+/).filter(w => w.length > 0).length >= 3);

// =================================================================
// KEYWORD STUFFING CHECKS
// =================================================================
if (primaryKeyword && primaryKeyword.length > 0) {
  const kwNorm = normalize(primaryKeyword);

  // Keyword per paragraph: max 1 (except intro paragraph)
  if (paragraphs.length > 0) {
    let stuffedParagraphs = 0;
    const stuffedDetails = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const pNorm = normalize(paragraphs[i]);
      let count = 0;
      let pos = 0;
      while ((pos = pNorm.indexOf(kwNorm, pos)) !== -1) {
        count++;
        pos += kwNorm.length;
      }
      if (i > 0 && count >= 2) {
        stuffedParagraphs++;
        stuffedDetails.push(`P${i + 1}: ${count}x`);
      }
    }

    addCheck('keyword_per_paragraph', stuffedParagraphs === 0,
      stuffedParagraphs === 0
        ? 'Max 1 occurrence du mot-cle par paragraphe (hors intro)'
        : `${stuffedParagraphs} paragraphe(s) avec 2+ occurrences: ${stuffedDetails.slice(0, 5).join(', ')}`);
  }

  // Consecutive sentences: max 2 in a row
  if (sentences.length > 2) {
    let maxConsecutive = 0;
    let current = 0;

    for (const s of sentences) {
      if (normalize(s).includes(kwNorm)) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }

    addCheck('keyword_consecutive_sentences', maxConsecutive < 3,
      maxConsecutive < 3
        ? `Max ${maxConsecutive} phrase(s) consecutive(s) avec le mot-cle`
        : `${maxConsecutive} phrases consecutives contiennent "${primaryKeyword}" (max: 2)`);
  }

  // Section density: max 3% per section
  if (headings.length > 0) {
    const contentForSections = ext === '.html' || ext === '.htm'
      ? bodyContent
      : bodyContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

    const headingLineRegex = ext === '.html' || ext === '.htm'
      ? /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi
      : /^#{1,6}\s+.+$/gm;

    const headingPositions = [];
    let hm;
    while ((hm = headingLineRegex.exec(contentForSections)) !== null) {
      headingPositions.push(hm.index);
    }

    let highDensitySections = 0;
    const highDensityDetails = [];

    for (let i = 0; i < headingPositions.length; i++) {
      const start = headingPositions[i];
      const end = i + 1 < headingPositions.length ? headingPositions[i + 1] : contentForSections.length;
      const sectionText = contentForSections.substring(start, end)
        .replace(/<[^>]+>/g, ' ')
        .replace(/^#{1,6}\s+.*$/gm, '')
        .replace(/[#*_`~\[\](){}|>]/g, '')
        .replace(/\s+/g, ' ').trim();

      const sectionWords = sectionText.split(/\s+/).filter(w => w.length > 0);
      if (sectionWords.length < 20) continue;

      const sectionNorm = normalize(sectionText);
      let kwCount = 0;
      let pos = 0;
      while ((pos = sectionNorm.indexOf(kwNorm, pos)) !== -1) {
        kwCount++;
        pos += kwNorm.length;
      }

      const density = (kwCount / sectionWords.length) * 100;
      if (density > maxSectionDensity) {
        highDensitySections++;
        const headingText = headings[i]?.text || `Section ${i + 1}`;
        highDensityDetails.push(`"${headingText.substring(0, 40)}": ${density.toFixed(1)}%`);
      }
    }

    addCheck('keyword_section_density', highDensitySections === 0,
      highDensitySections === 0
        ? `Densite mot-cle < ${maxSectionDensity}% dans toutes les sections`
        : `${highDensitySections} section(s) > ${maxSectionDensity}%: ${highDensityDetails.join('; ')}`);
  }

  // Keyword in >50% of paragraphs
  if (paragraphs.length >= 4) {
    let paraWithKw = 0;
    for (const p of paragraphs) {
      if (normalize(p).includes(kwNorm)) paraWithKw++;
    }
    const ratio = paraWithKw / paragraphs.length;
    addCheck('keyword_paragraph_ratio', ratio <= 0.5,
      `Mot-cle dans ${paraWithKw}/${paragraphs.length} paragraphes (${(ratio * 100).toFixed(0)}%${ratio > 0.5 ? ' — max: 50%' : ''})`);
  }
} else {
  addCheck('keyword_stuffing_skipped', true,
    'Checks keyword stuffing non executes (mot-cle primaire non defini dans le side-car)');
}

// =================================================================
// BANNED FORMULATIONS
// =================================================================
const bannedFormulations = [
  "dans cet article",
  "il est important de noter",
  "n'hesitez pas",
  "force est de constater",
  "il convient de souligner",
  "comme son nom l'indique",
  "il est a noter",
  "vous l'aurez compris",
  "sans plus attendre",
  "dans le monde d'aujourd'hui",
  "il va sans dire",
  "a l'heure actuelle",
  "d'ores et deja",
  "il existe de nombreux",
  "il existe de nombreuses",
  "il existe plusieurs",
  "que vous soyez",
  "il est essentiel de",
  "il est crucial de",
  "il est primordial de",
  "comme nous l'avons vu",
  "en ce qui concerne",
  "en d'autres termes",
  "au fil des ans",
  "de nos jours",
  "pour conclure",
];

const textNorm = normalize(plainText);
const foundBanned = [];
for (const phrase of bannedFormulations) {
  if (textNorm.includes(normalize(phrase))) {
    foundBanned.push(phrase);
  }
}

addCheck('banned_formulations', foundBanned.length === 0,
  foundBanned.length === 0
    ? 'Aucune formulation bannie detectee'
    : `${foundBanned.length} formulation(s) bannie(s): "${foundBanned.join('", "')}"`);

// =================================================================
// FRENCH LANGUAGE ERRORS (deterministic subset)
// =================================================================
const languageErrors = [
  { pattern: "malgre que", fix: "bien que + subjonctif" },
  { pattern: "au final", fix: "finalement, au bout du compte" },
  { pattern: "quelque soit", fix: "quel que soit" },
  { pattern: "pallier a ce", fix: "pallier ce (transitif direct)" },
  { pattern: "pallier a la", fix: "pallier la (transitif direct)" },
  { pattern: "pallier a l'", fix: "pallier l' (transitif direct)" },
  { pattern: "pallier au ", fix: "pallier le (transitif direct)" },
  { pattern: "pallier aux", fix: "pallier les (transitif direct)" },
  { pattern: "voire meme", fix: "voire seul ou meme seul" },
];

const foundLangErrors = [];
for (const { pattern, fix } of languageErrors) {
  if (textNorm.includes(normalize(pattern))) {
    foundLangErrors.push(`"${pattern}" → ${fix}`);
  }
}

addCheck('language_errors', foundLangErrors.length === 0,
  foundLangErrors.length === 0
    ? 'Aucune erreur de langue IA typique detectee'
    : `${foundLangErrors.length} erreur(s): ${foundLangErrors.join('; ')}`);

// =================================================================
// NUMBER FORMATTING (French conventions)
// =================================================================
const englishThousands = plainText.match(/\b\d{1,3},\d{3}\b/g) || [];
const realThousands = englishThousands.filter(n => parseInt(n.replace(',', '')) >= 1000);

const englishDecimals = plainText.match(/\d+\.\d+\s*(?:€|euros?|kWh?|m[²³]|cm|mm|km|kg|g|L|ha|MW|GW|%|°C|°)/g) || [];

const numberIssues = [
  ...realThousands.map(n => `"${n}" → "${n.replace(/,(\d{3})/, ' $1')}"`),
  ...englishDecimals.map(n => `"${n.trim()}" → virgule decimale`)
];

addCheck('number_format_french', numberIssues.length === 0,
  numberIssues.length === 0
    ? 'Formatage des nombres conforme au francais'
    : `${numberIssues.length} nombre(s) au format anglais: ${numberIssues.slice(0, 3).join('; ')}${numberIssues.length > 3 ? '...' : ''}`);

// =================================================================
// OUTPUT
// =================================================================
const hasFail = checks.some(c => c.status === 'fail');
const result = {
  validator: 'validate-writing',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  keyword_analyzed: primaryKeyword || '(non defini)',
  paragraphs_count: paragraphs.length,
  sentences_count: sentences.length,
  checks
};

console.log(JSON.stringify(result, null, 2));
process.exit(hasFail ? 1 : 0);
