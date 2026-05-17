#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const configPath = process.argv[3] || '.seo-engine/config.json';
const sidecarFlag = process.argv.indexOf('--sidecar');
const sidecarPath = sidecarFlag !== -1 ? process.argv[sidecarFlag + 1] : null;

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-meta.js <file> [config] [--sidecar path]' }));
  process.exit(1);
}

let sidecarKeyword = null;
if (sidecarPath) {
  try {
    const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    sidecarKeyword = sidecar.strat?.primary_keyword || sidecar.analysis?.current_keyword || null;
  } catch (e) {}
}

let config = { seo: { title_length: [50, 60], description_length: [150, 160] } };
if (configPath && !configPath.startsWith('--')) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {}
}

const [titleMin, titleMax] = config.seo?.title_length || [50, 60];
const [descMin, descMax] = config.seo?.description_length || [150, 160];

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({ validator: 'validate-meta', file: filePath, status: 'error', checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }] }, null, 2));
  process.exit(1);
}
const ext = path.extname(filePath).toLowerCase();
const checks = [];

function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

function parseFrontmatterField(fm, key) {
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = lines[i].match(new RegExp('^' + escaped + ':\\s*(.*)'));
    if (!match) continue;
    let value = match[1].trim();
    if (value === '>' || value === '|') {
      const parts = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (/^\s+/.test(lines[j])) parts.push(lines[j].trim());
        else break;
      }
      return parts.join(value === '>' ? ' ' : '\n');
    }
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  }
  return null;
}

function parseFrontmatterList(fm, key) {
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = lines[i].match(new RegExp('^' + escaped + ':\\s*(.*)'));
    if (!match) continue;
    const inline = match[1].trim();
    if (inline.startsWith('[')) {
      const arrayMatch = inline.match(/^\[(.*)\]$/);
      if (arrayMatch) {
        return arrayMatch[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      }
    }
    if (inline && !inline.startsWith('[')) {
      if ((inline.startsWith('"') && inline.endsWith('"')) ||
          (inline.startsWith("'") && inline.endsWith("'"))) {
        return [inline.slice(1, -1)];
      }
      return [inline];
    }
    const items = [];
    for (let j = i + 1; j < lines.length; j++) {
      const itemMatch = lines[j].match(/^\s+-\s+["']?(.*?)["']?\s*$/);
      if (itemMatch) items.push(itemMatch[1]);
      else if (/^\s+/.test(lines[j])) continue;
      else break;
    }
    return items.length > 0 ? items : null;
  }
  return null;
}

if (ext === '.mdx' || ext === '.md') {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    addCheck('frontmatter_exists', false, 'Pas de frontmatter YAML detecte');
  } else {
    const fm = frontmatterMatch[1];

    const title = parseFrontmatterField(fm, 'title');
    if (!title) {
      addCheck('title_exists', false, 'Champ title manquant dans le frontmatter');
    } else {
      addCheck('title_exists', true, `Title: "${title}"`);
      addCheck('title_length', title.length >= titleMin && title.length <= titleMax,
        `Title: ${title.length} caracteres (cible: ${titleMin}-${titleMax})`);
    }

    const desc = parseFrontmatterField(fm, 'description');
    if (!desc) {
      addCheck('description_exists', false, 'Champ description manquant dans le frontmatter');
    } else {
      addCheck('description_exists', true, `Description: "${desc.substring(0, 50)}..."`);
      addCheck('description_length', desc.length >= descMin && desc.length <= descMax,
        `Description: ${desc.length} caracteres (cible: ${descMin}-${descMax})`);
    }

    const fmSlug = parseFrontmatterField(fm, 'slug');
    addCheck('slug_exists', !!fmSlug, fmSlug ? `Slug: ${fmSlug}` : 'Champ slug manquant dans le frontmatter');

    const keywords = parseFrontmatterList(fm, 'keywords');
    addCheck('keywords_exists', !!(keywords && keywords.length > 0),
      (keywords && keywords.length > 0)
        ? `${keywords.length} keyword(s): ${keywords.slice(0, 3).join(', ')}`
        : 'Champ keywords manquant ou vide');

    if (title && keywords && keywords.length > 0) {
      const kwLower = keywords[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const titleLower = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const kwInTitle = titleLower.includes(kwLower);
      addCheck('keyword_in_title', kwInTitle,
        kwInTitle ? 'Mot-cle primaire present dans le title' : `Mot-cle primaire ("${keywords[0]}") absent du title`);
    }

    const slug = fmSlug || path.basename(filePath, ext);
    if (slug && keywords && keywords.length > 0) {
      const kw = keywords[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const slugNorm = slug.toLowerCase();
      const kwWords = kw.split(/\s+/).filter(w => w.length > 3);
      const kwInSlug = kwWords.length > 0 && kwWords.some(w => slugNorm.includes(w));
      addCheck('keyword_in_slug', kwInSlug,
        kwInSlug ? 'Mot-cle primaire present dans le slug' : `Mot-cle primaire ("${keywords[0]}") absent du slug ("${slug}")`);
    }

    const draftMatch = fm.match(/^draft:\s*(true|false)$/m);
    addCheck('draft_field', !!draftMatch, draftMatch ? `Draft: ${draftMatch[1]}` : 'Champ draft manquant');
    if (draftMatch && draftMatch[1] === 'true') {
      addCheck('draft_is_false', false, 'draft: true — la page ne sera pas publiee ni indexee');
    }
  }

} else if (ext === '.html' || ext === '.htm') {
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    addCheck('title_exists', false, 'Balise <title> manquante ou vide');
  } else {
    const title = titleMatch[1].trim();
    addCheck('title_exists', true, `Title: "${title}"`);
    addCheck('title_length', title.length >= titleMin && title.length <= titleMax,
      `Title: ${title.length} caracteres (cible: ${titleMin}-${titleMax})`);
  }

  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)
    || content.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    addCheck('description_exists', false, 'Meta description manquante ou vide');
  } else {
    const desc = descMatch[1].trim();
    addCheck('description_exists', true, `Description: "${desc.substring(0, 50)}..."`);
    addCheck('description_length', desc.length >= descMin && desc.length <= descMax,
      `Description: ${desc.length} caracteres (cible: ${descMin}-${descMax})`);
  }

  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i)
    || content.match(/<link\s+href=["'](.*?)["']\s+rel=["']canonical["']/i);
  addCheck('canonical_exists', !!canonicalMatch,
    canonicalMatch ? `Canonical: ${canonicalMatch[1]}` : 'Balise canonical manquante');

  if (canonicalMatch && config.project?.domain) {
    const validDomain = canonicalMatch[1].includes(config.project.domain);
    addCheck('canonical_domain', validDomain,
      validDomain ? 'Canonical sur le bon domaine' : `Canonical "${canonicalMatch[1]}" ne correspond pas au domaine "${config.project.domain}"`);
  }

  if (sidecarKeyword && titleMatch && titleMatch[1].trim()) {
    const title = titleMatch[1].trim();
    const kwLower = sidecarKeyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const titleLower = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const kwInTitle = titleLower.includes(kwLower);
    addCheck('keyword_in_title', kwInTitle,
      kwInTitle ? 'Mot-cle primaire present dans le title' : `Mot-cle primaire ("${sidecarKeyword}") absent du title`);
  }

  const slug = path.basename(filePath, ext);
  if (slug && slug !== 'index') {
    addCheck('slug_seo', !/[A-Z_]/.test(slug) && !slug.includes(' '),
      !/[A-Z_]/.test(slug) ? 'Slug en minuscules avec tirets' : `Slug "${slug}" contient des majuscules ou underscores`);
  }

} else {
  addCheck('file_type', false, `Extension non supportee: ${ext}`);
}

const hasFail = checks.some(c => c.status === 'fail');
const result = {
  validator: 'validate-meta',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  checks
};

console.log(JSON.stringify(result, null, 2));
process.exit(hasFail ? 1 : 0);
