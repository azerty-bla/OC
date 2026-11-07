#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./utils');

const args = parseArgs();
const filePath = args.file;
const sidecarPath = args.sidecar;
const configPath = args.config;

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-schema.js --file <path> [--sidecar <path>] [--config <path>]' }));
  process.exit(2);
}

let requiredSchema = [];
try {
  if (configPath) {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    requiredSchema = cfg.seo?.required_schema || [];
  }
} catch (e) {}

let content;
try {
  content = fs.readFileSync(filePath, 'utf-8');
} catch (e) {
  console.log(JSON.stringify({ validator: 'validate-schema', file: filePath, status: 'error', schema_types: [], images: { total: 0, missing_alt: 0 }, checks: [{ name: 'file_readable', status: 'fail', message: `Fichier illisible: ${e.message}` }] }, null, 2));
  process.exit(2);
}
const ext = path.extname(filePath).toLowerCase();
const checks = [];

function addCheck(name, pass, message) {
  checks.push({ name, status: pass ? 'pass' : 'fail', message });
}

let jsonLdBlocks = [];

const scriptRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRegex.exec(content)) !== null) {
  try {
    const parsed = JSON.parse(match[1].trim());
    jsonLdBlocks.push(parsed);
  } catch (e) {
    addCheck('json_ld_valid_json', false, `JSON-LD invalide : ${e.message.substring(0, 80)}`);
  }
}

if (ext === '.mdx' || ext === '.md') {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    const schemaField = fm.match(/^schema:/m);
    if (schemaField) {
      addCheck('frontmatter_schema', true, 'Champ schema present dans le frontmatter (genere par le layout)');
    }
  }
}

addCheck('json_ld_exists', jsonLdBlocks.length > 0 || checks.some(c => c.name === 'frontmatter_schema'),
  jsonLdBlocks.length > 0
    ? `${jsonLdBlocks.length} bloc(s) JSON-LD trouve(s)`
    : checks.some(c => c.name === 'frontmatter_schema')
      ? 'Schema gere via frontmatter/layout'
      : 'Aucun JSON-LD ni champ schema trouve — la page n\'a pas de donnees structurees');

const allTypes = [];
function extractTypes(obj) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(extractTypes);
    return;
  }
  if (obj['@type']) {
    const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
    allTypes.push(...types);
  }
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    obj['@graph'].forEach(extractTypes);
  }
}
jsonLdBlocks.forEach(extractTypes);

if (requiredSchema.length > 0 && allTypes.length > 0) {
  for (const req of requiredSchema) {
    const articleAliases = ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'];
    const found = req === 'Article'
      ? allTypes.some(t => articleAliases.includes(t))
      : allTypes.includes(req);
    addCheck(`required_schema_${req.toLowerCase()}`, found,
      found ? `Schema requis "${req}" present` : `Schema requis "${req}" manquant (defini dans config.seo.required_schema)`);
  }
}

if (allTypes.length > 0) {
  addCheck('schema_types', true, `Types trouves : ${[...new Set(allTypes)].join(', ')}`);

  const hasArticle = allTypes.some(t => ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'WebPage'].includes(t));
  addCheck('has_page_type', hasArticle,
    hasArticle ? 'Type de page present (Article/BlogPosting/WebPage)' : 'Aucun type de page (Article, BlogPosting, WebPage) — recommande');

  const hasBreadcrumb = allTypes.includes('BreadcrumbList');
  addCheck('has_breadcrumb', hasBreadcrumb,
    hasBreadcrumb ? 'BreadcrumbList present' : 'BreadcrumbList manquant — recommande pour la navigation');

  // --- FAQPage detection ---
  const hasFAQ = allTypes.includes('FAQPage');
  // --- HowTo detection ---
  const hasHowTo = allTypes.includes('HowTo');

  // Check if content has question-like H2/H3 (suggesting FAQ schema would be beneficial)
  let hasQuestionHeadings = false;
  let hasProceduralContent = false;
  if (ext === '.mdx' || ext === '.md') {
    const headingMatches = content.match(/^#{2,3}\s+.+/gm) || [];
    hasQuestionHeadings = headingMatches.some(h => /\?\s*$/.test(h) || /^#{2,3}\s+(comment|pourquoi|quand|quel|quelle|quels|quelles|combien|est-ce que|faut-il|peut-on|doit-on)\b/i.test(h));
    hasProceduralContent = headingMatches.some(h => /^#{2,3}\s+(etape|step|\d+[\.\)]\s)/i.test(h)) || /^#{2,3}\s+comment\s/im.test(content);
  } else {
    const headingMatches = content.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/gi) || [];
    const headingTexts = headingMatches.map(h => h.replace(/<[^>]+>/g, '').trim());
    hasQuestionHeadings = headingTexts.some(t => /\?\s*$/.test(t) || /^(comment|pourquoi|quand|quel|quelle|quels|quelles|combien|est-ce que|faut-il|peut-on|doit-on)\b/i.test(t));
    hasProceduralContent = headingTexts.some(t => /^(etape|step|\d+[\.\)]\s)/i.test(t));
  }

  if (hasQuestionHeadings && !hasFAQ) {
    addCheck('faq_schema_opportunity', false,
      'H2/H3 contiennent des questions mais pas de schema FAQPage — opportunite de donnees structurees');
  }
  if (hasProceduralContent && !hasHowTo) {
    addCheck('howto_schema_opportunity', false,
      'Contenu procedural detecte mais pas de schema HowTo — opportunite de donnees structurees');
  }

  for (const block of jsonLdBlocks) {
    const items = block['@graph'] || [block];
    for (const item of (Array.isArray(items) ? items : [items])) {
      const itemTypes = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      if (itemTypes.some(t => ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'].includes(t))) {
        const hasAuthor = !!item.author;
        const authorValid = hasAuthor && (typeof item.author === 'string' || !!item.author.name);
        addCheck('article_has_author', authorValid,
          authorValid ? 'Article a un author avec name' : 'Article sans author ou author.name manquant — important pour E-E-A-T');

        if (authorValid && typeof item.author === 'object') {
          const hasSameAs = !!(item.author.sameAs && (Array.isArray(item.author.sameAs) ? item.author.sameAs.length > 0 : true));
          // Auteur collectif (Organization, rédaction) : sameAs sert à relier une personne à ses profils publics ; pour une
          // organisation, son identité est portée par sa page « qui sommes-nous » (url). Exiger un profil externe pousserait
          // à en inventer un. Organization + url → passe ; Organization sans url ni sameAs → échec ; Person → sameAs exigé.
          const authorTypes = [].concat(item.author['@type'] || []);
          const isOrg = authorTypes.some(t => /Organization$|^(NewsMediaOrganization|Corporation|GovernmentOrganization|NGO)$/.test(t));
          const orgUrl = isOrg && typeof item.author.url === 'string' && item.author.url.trim() ? item.author.url.trim() : '';
          if (hasSameAs) addCheck('author_has_sameas', true, 'Author avec sameAs (profils professionnels)');
          else if (orgUrl) addCheck('author_has_sameas', true, `Auteur collectif (${authorTypes.join(', ')}) identifié par sa page ${orgUrl} — sameAs non exigé`);
          else if (isOrg) addCheck('author_has_sameas', false, 'Auteur collectif (Organization) sans url ni sameAs — ajouter url vers la page « qui sommes-nous »');
          // Rédaction déclarée en Person : reste en échec (une équipe n'est pas une personne), avec la correction à faire.
          else if (/[ée]quipe|r[ée]daction|editorial|[ée]ditorial|team|staff/i.test(String(item.author.name || ''))) addCheck('author_has_sameas', false, `Auteur collectif « ${item.author.name} » déclaré en Person — le typer Organization avec url vers la page « qui sommes-nous » (ou nommer une personne réelle avec sameAs)`);
          else addCheck('author_has_sameas', false, 'Author sans sameAs — recommande pour E-E-A-T (LinkedIn, site perso)');
        }

        const hasDatePublished = !!item.datePublished;
        addCheck('article_has_date', hasDatePublished,
          hasDatePublished ? `datePublished: ${item.datePublished}` : 'Article sans datePublished');

        const hasDateModified = !!item.dateModified;
        addCheck('article_has_modified', hasDateModified,
          hasDateModified ? `dateModified: ${item.dateModified}` : 'Article sans dateModified — recommande pour la fraicheur');
      }

      // JAMAIS de schema Product — on ne vend rien
      if (itemTypes.includes('Product')) {
        addCheck('no_product_schema', false,
          'Schema Product detecte — ce site ne vend rien, supprimer le schema Product');
      }
    }
  }
}

if (ext === '.html' || ext === '.htm') {
  const hasOgTitle = /<meta\s+property=["']og:title["']/i.test(content);
  const hasOgDesc = /<meta\s+property=["']og:description["']/i.test(content);
  const hasOgType = /<meta\s+property=["']og:type["']/i.test(content);
  const hasOgImage = /<meta\s+property=["']og:image["']/i.test(content);
  addCheck('open_graph', hasOgTitle && hasOgDesc,
    (hasOgTitle && hasOgDesc) ? 'Open Graph (og:title, og:description) present' : 'Meta Open Graph manquantes (og:title, og:description)');
  addCheck('og_image', hasOgImage,
    hasOgImage ? 'og:image present' : 'og:image manquant — important pour partage social et Discover');
}

const imgRegex = ext === '.html' || ext === '.htm'
  ? /<img\s+[^>]*>/gi
  : /!\[([^\]]*)\]\([^)]+\)/g;

let totalImages = 0;
let missingAlts = 0;

if (ext === '.html' || ext === '.htm') {
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    totalImages++;
    const tag = imgMatch[0];
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (!altMatch || altMatch[1].trim() === '') missingAlts++;
  }
} else {
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    totalImages++;
    if (imgMatch[1].trim() === '') missingAlts++;
  }
  const astroImgRegex = /<Image\s+[^>]*>/gi;
  let astroMatch;
  while ((astroMatch = astroImgRegex.exec(content)) !== null) {
    totalImages++;
    const tag = astroMatch[0];
    const altMatch = tag.match(/alt=["']([^"']*)["']/i) || tag.match(/alt=\{([^}]*)\}/i);
    if (!altMatch || altMatch[1].trim() === '' || altMatch[1].trim() === '""') missingAlts++;
  }
}

if (totalImages > 0) {
  addCheck('images_alt', missingAlts === 0,
    missingAlts === 0
      ? `${totalImages} image(s) — toutes avec alt`
      : `${missingAlts}/${totalImages} image(s) sans attribut alt`);
}

const hasFail = checks.some(c => c.status === 'fail');
const result = {
  validator: 'validate-schema',
  file: filePath,
  status: hasFail ? 'fail' : 'pass',
  schema_types: [...new Set(allTypes)],
  images: { total: totalImages, missing_alt: missingAlts },
  checks
};

console.log(JSON.stringify(result, null, 2));
// exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
process.exitCode = hasFail ? 1 : 0;
