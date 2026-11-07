#!/usr/bin/env node
// Relecture du français par LanguageTool local + lexique et règles du secteur (voir language-check.js).
// Bloquant : fautes d'orthographe hors lexique, règles « error » du secteur, formulations interdites du site.
// Alertes : grammaire, typographie, style, anglicismes (taux de fausses alertes trop élevé pour bloquer).
// Sans serveur LanguageTool, seules les règles du secteur et du site s'appliquent (avertissement, pas d'échec).

const fs = require('fs');
const { parseArgs } = require('./utils');
const { checkFile } = require('./language-check');

const args = parseArgs();
const filePath = args.file;
if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-language.js --file <path> [--config <path>] [--root <path>]' }));
  process.exit(2);
}

let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(args.config, 'utf-8')); } catch (e) {}

(async () => {
  const checks = [];
  const warnings = [];
  let result;
  try {
    result = await checkFile(filePath, { cfg, root: args.root, autostart: cfg.language?.autostart !== false });
  } catch (e) {
    console.log(JSON.stringify({ validator: 'validate-language', file: filePath, status: 'error', checks: [{ name: 'language_check', status: 'fail', message: e.message }] }, null, 2));
    process.exitCode = 2;
    return;
  }
  if (!result.available) warnings.push('LanguageTool indisponible (brew install languagetool) : seules les règles du secteur et du site ont été appliquées');
  warnings.push(...(result.warnings || []));

  const fmt = (i) => `l.${i.line} « ${i.found} »${i.replacements.length ? ` → « ${i.replacements[0]} »` : ''} : ${i.message}`;
  const errors = result.issues.filter((i) => i.severity === 'error');
  const alerts = result.issues.filter((i) => i.severity === 'warning');
  checks.push({
    name: 'language_errors',
    status: errors.length ? 'fail' : 'pass',
    message: errors.length ? `${errors.length} faute(s) : ${errors.slice(0, 15).map(fmt).join(' ; ')}${errors.length > 15 ? ' ; …' : ''}` : `Aucune faute bloquante (${result.words} mots relus)`,
  });
  if (alerts.length) warnings.push(...alerts.slice(0, 30).map((i) => `[${i.rule}] ${fmt(i)}`));

  const status = errors.length ? 'fail' : 'pass';
  // Sortie plafonnée (une page très fautive ne doit pas produire des centaines de Ko de JSON) ; exitCode plutôt que
  // process.exit, qui tronque la sortie au-delà de 64 Ko sur un pipe.
  const issues = [...errors, ...alerts].slice(0, 200);
  console.log(JSON.stringify({ validator: 'validate-language', file: filePath, status, words: result.words, checks, issues, ...(result.issues.length > issues.length ? { issues_truncated: result.issues.length } : {}), ...(warnings.length ? { warnings } : {}) }, null, 2));
  process.exitCode = status === 'pass' ? 0 : 1;
})();
