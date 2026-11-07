#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('./utils');

const args = parseArgs();
const filePath = args.file;
const configPath = args.config;
const sidecarPath = args.sidecar;
const projectRoot = args.root;
const dryRun = args.dryRun;

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-all.js --file <path> [--config <path>] [--sidecar <path>] [--root <path>] [--dry-run]' }));
  process.exit(2);
}

const scriptsDir = __dirname;

// Anciennes versions des validateurs (fichier en 1er argument, conventions propres à chacun) : un projet peut avoir
// gardé un validateur personnalisé de cette génération ; il doit continuer à être appelé correctement.
const LEGACY_ARGS = {
  'validate-meta.js': () => (sidecarPath ? [filePath, configPath, '--sidecar', sidecarPath] : [filePath, configPath]),
  'validate-structure.js': () => (sidecarPath ? [filePath, sidecarPath, '--config', configPath] : [filePath, '--config', configPath]),
  'validate-links.js': () => [filePath, projectRoot, configPath],
  'validate-schema.js': () => [filePath, '--config', configPath],
  'validate-duplicates.js': () => [filePath, projectRoot, configPath],
};
function argsFor(script) {
  let src = '';
  try { src = fs.readFileSync(path.join(scriptsDir, script), 'utf-8'); } catch (e) {}
  const modern = /parseArgs\(|args\.file\b|'--file'/.test(src);
  return !modern && LEGACY_ARGS[script] ? LEGACY_ARGS[script]() : baseArgs;
}

const baseArgs = [
  '--file', filePath,
  '--config', configPath,
  '--root', projectRoot,
];
if (sidecarPath) baseArgs.push('--sidecar', sidecarPath);

const validators = [
  { name: 'meta', script: 'validate-meta.js' },
  { name: 'structure', script: 'validate-structure.js' },
  { name: 'links', script: 'validate-links.js' },
  { name: 'schema', script: 'validate-schema.js' },
  { name: 'duplicates', script: 'validate-duplicates.js' },
  { name: 'writing', script: 'validate-writing.js' },
  { name: 'spam', script: 'validate-spam.js' },
  { name: 'visuals', script: 'validate-visuals.js' },
  // Démarrage éventuel du serveur LanguageTool (environ 15 s) + relecture : délai plus long que les autres.
  { name: 'language', script: 'validate-language.js', timeout: 90000 },
].filter((v) => fs.existsSync(path.join(scriptsDir, v.script)));

const results = {};
const allWarnings = [];
let globalStatus = 'pass';

for (const v of validators) {
  const scriptPath = path.join(scriptsDir, v.script);
  try {
    const output = execFileSync('node', [scriptPath, ...argsFor(v.script)], {
      encoding: 'utf-8',
      maxBuffer: 32 * 1024 * 1024,
      timeout: v.timeout || 30000
    });
    results[v.name] = JSON.parse(output);
  } catch (e) {
    let parsed = false;
    if (e.stdout) {
      try {
        results[v.name] = JSON.parse(e.stdout);
        parsed = true;
      } catch {}
    }
    if (!parsed) {
      results[v.name] = { status: 'error', error: (e.stderr?.trim() || e.message).substring(0, 200) };
    }
    if (e.status === 2) {
      allWarnings.push(`${v.name}: erreur runtime (exit 2) — ${(e.stderr?.trim() || e.message).substring(0, 100)}`);
    } else if (!parsed) {
      allWarnings.push(`${v.name}: echec inattendu — ${e.message.substring(0, 100)}`);
    }
  }

  if (results[v.name].warnings) {
    allWarnings.push(...results[v.name].warnings.map(w => `${v.name}: ${w}`));
  }

  // Une erreur d'exécution prime sur un échec de contenu : elle ne doit jamais être lue comme une faute à réécrire.
  if (results[v.name].status === 'error') globalStatus = 'error';
  else if (results[v.name].status !== 'pass' && globalStatus !== 'error') globalStatus = 'fail';
}

const allChecks = [];
for (const [name, result] of Object.entries(results)) {
  if (result.checks) {
    for (const check of result.checks) {
      allChecks.push({ validator: name, ...check });
    }
  }
}

const failedChecks = allChecks.filter(c => c.status === 'fail');
const passedChecks = allChecks.filter(c => c.status === 'pass');

const report = {
  file: filePath,
  timestamp: new Date().toISOString(),
  status: globalStatus,
  dry_run: dryRun || false,
  summary: {
    total: allChecks.length,
    passed: passedChecks.length,
    failed: failedChecks.length
  },
  validators: Object.fromEntries(
    Object.entries(results).map(([name, r]) => [name, r.status])
  ),
  failed_checks: failedChecks,
  ...(allWarnings.length > 0 ? { warnings: allWarnings } : {}),
  all_checks: allChecks
};

console.log(JSON.stringify(report, null, 2));

// exitCode plutôt que process.exit : une sortie de plus de 64 Ko serait tronquée sur un pipe.
process.exitCode = globalStatus === 'error' ? 2 : globalStatus === 'pass' ? 0 : 1;
