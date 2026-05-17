#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-links.js <file> [project-root] [config]' }));
  process.exit(1);
}

const projectRoot = process.argv[3] || '.';
const configPath = process.argv[4] || '.seo-engine/config.json';

let minInternalLinks = 2;
let contentDir = 'src/content';
let pagesDir = 'src/pages';
try {
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  minInternalLinks = cfg.seo?.min_internal_links ?? 2;
  contentDir = cfg.paths?.content_dir || 'src/content';
  pagesDir = cfg.paths?.pages_dir || 'src/pages';
} catch (e) {}

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({ validator: 'validate-links', file: filePath, status: 'error', internal_links_count: 0, external_links_count: 0, broken_links: [], checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }] }, null, 2));
  process.exit(1);
}
const ext = path.extname(filePath).toLowerCase();
const checks = [];
const internalLinks = [];
const externalLinks = [];

function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

if (ext === '.mdx' || ext === '.md') {
  const linkRegex = /\[([^\]]*)\]\(([^)]*(?:\([^)]*\))*[^)]*)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const anchor = match[1];
    const href = match[2].replace(/\s+["'][^"']*["']\s*$/, '').trim();
    if (href.startsWith('/') || (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:'))) {
      internalLinks.push({ anchor, href });
    } else if (href.startsWith('http')) {
      externalLinks.push({ anchor, href });
    }
  }
} else if (ext === '.html' || ext === '.htm') {
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    const anchor = match[2].replace(/<[^>]+>/g, '').trim();
    if (href.startsWith('/') || (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:'))) {
      internalLinks.push({ anchor, href });
    } else if (href.startsWith('http')) {
      externalLinks.push({ anchor, href });
    }
  }
}

addCheck('has_internal_links', internalLinks.length > 0,
  internalLinks.length > 0 ? `${internalLinks.length} liens internes trouves` : 'Aucun lien interne trouve');

addCheck('min_internal_links', internalLinks.length >= minInternalLinks,
  `${internalLinks.length} liens internes (minimum requis: ${minInternalLinks})`);

const brokenLinks = [];
const validLinks = [];
const checkedHrefs = new Map();

const emptyAnchors = internalLinks.filter(l => !l.anchor || !l.anchor.trim());
if (emptyAnchors.length > 0) {
  addCheck('no_empty_anchors', false,
    `${emptyAnchors.length} lien(s) avec ancre vide: ${emptyAnchors.map(l => l.href).join(', ')}`);
}

for (const link of internalLinks) {
  let cleanHref = link.href.replace(/#.*$/, '').replace(/\?.*$/, '');
  if (cleanHref.endsWith('/')) cleanHref = cleanHref.slice(0, -1);
  if (!cleanHref) continue;

  if (checkedHrefs.has(cleanHref)) {
    if (checkedHrefs.get(cleanHref)) validLinks.push(link);
    else brokenLinks.push(link);
    continue;
  }

  let candidates;
  if (cleanHref.startsWith('/')) {
    candidates = [
      path.join(projectRoot, contentDir, cleanHref + '.mdx'),
      path.join(projectRoot, contentDir, cleanHref + '.md'),
      path.join(projectRoot, contentDir, cleanHref, 'index.mdx'),
      path.join(projectRoot, contentDir, cleanHref, 'index.md'),
      path.join(projectRoot, pagesDir, cleanHref + '.astro'),
      path.join(projectRoot, pagesDir, cleanHref, 'index.astro'),
      path.join(projectRoot, cleanHref + '.html'),
      path.join(projectRoot, cleanHref, 'index.html'),
    ];
  } else {
    const basePath = path.resolve(path.dirname(path.resolve(projectRoot, filePath)), cleanHref);
    candidates = [
      basePath + '.mdx', basePath + '.md',
      basePath + '/index.mdx', basePath + '/index.md',
      basePath + '.astro', basePath + '/index.astro',
      basePath + '.html', basePath + '/index.html',
    ];
  }

  let found = false;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      found = true;
      break;
    }
  }

  checkedHrefs.set(cleanHref, found);
  if (found) {
    validLinks.push(link);
  } else {
    brokenLinks.push(link);
  }
}

if (internalLinks.length > 0) {
  addCheck('no_broken_links', brokenLinks.length === 0,
    brokenLinks.length === 0
      ? `${validLinks.length}/${internalLinks.length} liens internes valides`
      : `${brokenLinks.length} lien(s) casse(s): ${brokenLinks.map(l => l.href).join(', ')}`);
}

addCheck('min_external_links', externalLinks.length >= 2,
  `${externalLinks.length} lien(s) externe(s) (minimum recommande: 2 pour E-E-A-T)`);

const genericAnchors = ['cliquez ici', 'ici', 'lire la suite', 'en savoir plus', 'click here', 'read more', 'lien'];
const badAnchors = internalLinks.filter(l => genericAnchors.includes(l.anchor.toLowerCase().trim()));
addCheck('optimized_anchors', badAnchors.length === 0,
  badAnchors.length === 0
    ? 'Toutes les ancres sont optimisees'
    : `${badAnchors.length} ancre(s) generique(s): ${badAnchors.map(l => `"${l.anchor}"`).join(', ')}`);

const externalLinkAttrIssues = [];

const htmlATagRegex = /<a\s+([^>]*)>/gi;
let aTagMatch;
while ((aTagMatch = htmlATagRegex.exec(content)) !== null) {
  const attrs = aTagMatch[1];
  const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
  if (!hrefMatch || !hrefMatch[1].startsWith('http')) continue;

  const href = hrefMatch[1];
  const hasTargetBlank = /target=["']_blank["']/i.test(attrs);
  const relMatch = attrs.match(/rel=["']([^"']+)["']/i);
  const relValue = relMatch ? relMatch[1].toLowerCase() : '';
  const hasNoopener = relValue.includes('noopener');
  const hasNoreferrer = relValue.includes('noreferrer');

  const missing = [];
  if (!hasTargetBlank) missing.push('target="_blank"');
  if (!hasNoopener) missing.push('noopener');
  if (!hasNoreferrer) missing.push('noreferrer');
  if (missing.length > 0) {
    externalLinkAttrIssues.push({ href, missing });
  }
}

let mdSyntaxExternalCount = 0;
if (ext === '.mdx' || ext === '.md') {
  const htmlExternalHrefs = new Set();
  const htmlHrefScan = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let hm;
  while ((hm = htmlHrefScan.exec(content)) !== null) {
    if (hm[1].startsWith('http')) htmlExternalHrefs.add(hm[1]);
  }
  mdSyntaxExternalCount = externalLinks.filter(l => !htmlExternalHrefs.has(l.href)).length;
}

if (ext === '.html' || ext === '.htm') {
  addCheck('external_links_security', externalLinkAttrIssues.length === 0,
    externalLinkAttrIssues.length === 0
      ? 'Tous les liens externes ont target="_blank" et rel="noopener noreferrer"'
      : `${externalLinkAttrIssues.length} lien(s) externe(s) sans attributs de securite: ${externalLinkAttrIssues.map(l => `${l.href} (manque: ${l.missing.join(', ')})`).join('; ')}`);
} else if (ext === '.mdx' || ext === '.md') {
  if (externalLinkAttrIssues.length > 0) {
    addCheck('external_links_html_security', false,
      `${externalLinkAttrIssues.length} lien(s) externe(s) HTML sans attributs de securite: ${externalLinkAttrIssues.map(l => `${l.href} (manque: ${l.missing.join(', ')})`).join('; ')}`);
  }
  if (mdSyntaxExternalCount > 0) {
    addCheck('external_links_md_needs_config', false,
      `${mdSyntaxExternalCount} lien(s) externe(s) en syntaxe Markdown — impossible d'ajouter rel/target. Utiliser <a> HTML ou configurer rehype-external-links`);
  }
  if (externalLinkAttrIssues.length === 0 && mdSyntaxExternalCount === 0 && externalLinks.length > 0) {
    addCheck('external_links_security', true,
      'Tous les liens externes ont les attributs de securite requis');
  }
}

const hasFail = checks.some(c => c.status === 'fail');
const result = {
  validator: 'validate-links',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  internal_links_count: internalLinks.length,
  external_links_count: externalLinks.length,
  broken_links: brokenLinks,
  checks
};

console.log(JSON.stringify(result, null, 2));
process.exit(hasFail ? 1 : 0);
