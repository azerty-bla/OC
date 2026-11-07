#!/usr/bin/env node
// Génère les images raster en file d'attente (status "queued") avec le générateur local déclaré dans config.visuals.generator.
// Usage : node generate-visuals.js --state <dossier visuals> [--config .seo-engine/config.json] [--ids a,b]
// Chaque passage ajoute un essai (attempts[]) : le prompt et la graine courants de l'élément. Même prompt et même graine
// que l'essai précédent → graine suivante, sinon l'image serait identique.

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const V = require('./visuals-lib');

const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };
const stateDir = arg('state');
const configPath = arg('config') || '.seo-engine/config.json';
const ids = arg('ids') ? new Set(arg('ids').split(',')) : null;

if (!stateDir) {
  console.error(JSON.stringify({ status: 'error', message: 'Usage: node generate-visuals.js --state <dossier> [--config <path>] [--ids a,b]' }));
  process.exit(2);
}

const config = V.readConfig(configPath);
const s = V.settings(config);
const g = s.generator;
if (!g.command?.length) {
  console.log(JSON.stringify({ status: 'error', message: 'config.visuals.generator.command est vide : renseigner le générateur local avant de lancer la génération.' }));
  process.exit(2);
}
if (!g.license) {
  console.log(JSON.stringify({ status: 'error', message: 'config.visuals.generator.license est vide : la licence du modèle doit être déclarée.' }));
  process.exit(2);
}
if ((config.project?.monetization || 'none') !== 'none' && g.commercial_use !== true) {
  console.log(JSON.stringify({ status: 'error', message: `Site monétisé (${config.project.monetization}) et générateur sans usage commercial autorisé (commercial_use: false, licence « ${g.license} »).` }));
  process.exit(2);
}

const state = V.load(stateDir);
const todo = state.data.items.filter((it) => it.status === 'queued' && V.isRaster(it) && (!ids || ids.has(it.id)));
const done = [];
const errors = [];

// Commandes préalables (ex. libérer la mémoire occupée par une autre application), propres à la machine.
for (const cmd of g.preflight || []) spawnSync('/bin/sh', ['-c', cmd], { stdio: 'ignore' });

for (const item of todo) {
  const prev = V.lastAttempt(item);
  let seed = Number.isInteger(item.seed) ? item.seed : s.seed_base;
  if (prev && prev.prompt === item.prompt && prev.seed === seed) seed = prev.seed + 1;
  item.seed = seed;
  const n = (item.attempts || []).length + 1;
  const rel = path.join('raw', `${item.id}--a${n}.png`);
  const out = path.join(stateDir, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const attempt = { n, prompt: item.prompt, seed, file: rel, width: item.width, height: item.height, at: new Date().toISOString() };
  const f = g.flags;
  const cmdArgs = [...g.command.slice(1), f.prompt, item.prompt, f.width, String(item.width), f.height, String(item.height), f.seed, String(seed), f.output, out];
  const started = Date.now();
  try {
    execFileSync(g.command[0], cmdArgs, { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
    attempt.seconds = Math.round((Date.now() - started) / 1000);
    if (!fs.existsSync(out)) throw new Error('aucun fichier produit');
    item.attempts = [...(item.attempts || []), attempt];
    item.status = 'generated';
    done.push({ id: item.id, attempt: n, seconds: attempt.seconds });
  } catch (e) {
    const msg = (e.stderr?.toString() || e.message).trim().split('\n').slice(-3).join(' ').slice(0, 300);
    item.generation_error = msg;
    errors.push({ id: item.id, message: msg });
  }
  V.save(state); // après chaque image : une génération interrompue reprend là où elle s'est arrêtée
}

console.log(JSON.stringify({ status: errors.length ? 'partial' : 'pass', generated: done, errors, remaining: state.data.items.filter((it) => it.status === 'queued').length }, null, 2));
process.exitCode = errors.length && !done.length ? 1 : 0;
