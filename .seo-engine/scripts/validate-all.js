#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');

const filePath = process.argv[2];
function getFlagValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  return (val && !val.startsWith('--')) ? val : fallback;
}

const configPath = getFlagValue('--config', '.seo-engine/config.json');
const sidecarPath = getFlagValue('--sidecar', null);
const projectRoot = getFlagValue('--root', '.');

if (!filePath) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node validate-all.js <file> [--config path] [--sidecar path] [--root path]' }));
  process.exit(1);
}

const scriptsDir = __dirname;
const validators = [
  { name: 'meta', script: 'validate-meta.js', args: sidecarPath ? [filePath, configPath, '--sidecar', sidecarPath] : [filePath, configPath] },
  { name: 'structure', script: 'validate-structure.js', args: sidecarPath ? [filePath, sidecarPath, '--config', configPath] : [filePath, '--config', configPath] },
  { name: 'links', script: 'validate-links.js', args: [filePath, projectRoot, configPath] },
  { name: 'schema', script: 'validate-schema.js', args: [filePath, '--config', configPath] },
  { name: 'duplicates', script: 'validate-duplicates.js', args: [filePath, projectRoot, configPath] },
  { name: 'writing', script: 'validate-writing.js', args: sidecarPath ? [filePath, sidecarPath, '--config', configPath] : [filePath, '--config', configPath] },
];

const results = {};
let globalStatus = 'pass';

for (const v of validators) {
  const scriptPath = path.join(scriptsDir, v.script);
  try {
    const output = execFileSync('node', [scriptPath, ...v.args], {
      encoding: 'utf-8',
      timeout: 30000
    });
    results[v.name] = JSON.parse(output);
  } catch (e) {
    if (e.stdout) {
      try {
        results[v.name] = JSON.parse(e.stdout);
      } catch {
        results[v.name] = { status: 'fail', error: e.stdout.trim() };
      }
    } else {
      results[v.name] = { status: 'error', error: e.message };
    }
  }

  if (results[v.name].status !== 'pass') {
    globalStatus = 'fail';
  }
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
  summary: {
    total: allChecks.length,
    passed: passedChecks.length,
    failed: failedChecks.length
  },
  validators: Object.fromEntries(
    Object.entries(results).map(([name, r]) => [name, r.status])
  ),
  failed_checks: failedChecks,
  all_checks: allChecks
};

console.log(JSON.stringify(report, null, 2));
process.exit(globalStatus === 'pass' ? 0 : 1);
