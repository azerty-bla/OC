#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { normalize, textIncludesKeyword, parseArgs, htmlTitle, metaContent, linkHref } = require('./utils');

const args = parseArgs();
const filePath = args.file;
const sidecarPath = args.sidecar;
const configPath = args.config;

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-meta.js --file <path> [--sidecar <path>] [--config <path>]' }));
  process.exit(2);
}

let sidecarKeyword = null;
if (sidecarPath) {
  try {
    const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    sidecarKeyword = sidecar.strat?.primary_keyword || sidecar.analysis?.current_keyword || null;
  } catch (e) {}
}

let config = { seo: { title_length: [50, 60], description_length: [150, 160] } };
if (configPath) {
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
  process.exit(2);
}
const ext = path.extname(filePath).toLowerCase();
const checks = [];
const warnings = [];

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
    // YAML : '' vaut une apostrophe entre apostrophes, \" un guillemet entre guillemets.
    if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).replace(/\\"/g, '"');
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
      const kwInTitle = textIncludesKeyword(title, keywords[0]);
      addCheck('keyword_in_title', kwInTitle,
        kwInTitle ? 'Mot-cle primaire present dans le title' : `Mot-cle primaire ("${keywords[0]}") absent du title`);
    }

    const slug = fmSlug || path.basename(filePath, ext);
    if (slug && keywords && keywords.length > 0) {
      const kw = normalize(keywords[0]);
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
  // Lecture par attributs (valeur lue jusqu'au guillemet qui l'ouvre, entités décodées) : une apostrophe dans la
  // description (« barres d'appui ») ne la coupe plus, et &#39; / &rsquo; comptent pour un caractère.
  const title = htmlTitle(content);
  if (!title) {
    addCheck('title_exists', false, 'Balise <title> manquante ou vide');
  } else {
    addCheck('title_exists', true, `Title: "${title}"`);
    addCheck('title_length', title.length >= titleMin && title.length <= titleMax,
      `Title: ${title.length} caracteres (cible: ${titleMin}-${titleMax})`);
  }

  const descRaw = metaContent(content, 'description');
  const desc = descRaw == null ? '' : descRaw.replace(/\s+/g, ' ').trim();
  if (!desc) {
    addCheck('description_exists', false, 'Meta description manquante ou vide');
  } else {
    addCheck('description_exists', true, `Description: "${desc.substring(0, 50)}..."`);
    addCheck('description_length', desc.length >= descMin && desc.length <= descMax,
      `Description: ${desc.length} caracteres (cible: ${descMin}-${descMax})`);
  }

  const canonical = linkHref(content, 'canonical');
  addCheck('canonical_exists', !!canonical,
    canonical ? `Canonical: ${canonical}` : 'Balise canonical manquante');

  if (canonical && config.project?.domain) {
    const validDomain = canonical.includes(config.project.domain);
    addCheck('canonical_domain', validDomain,
      validDomain ? 'Canonical sur le bon domaine' : `Canonical "${canonical}" ne correspond pas au domaine "${config.project.domain}"`);
  }

  if (sidecarKeyword && title) {
    const kwInTitle = textIncludesKeyword(title, sidecarKeyword);
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
  checks,
  ...(warnings.length > 0 ? { warnings } : {})
};

console.log(JSON.stringify(result, null, 2));
// exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
process.exitCode = hasFail ? 1 : 0;
