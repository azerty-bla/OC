// Dates réelles de publication / mise à jour d'une page, tirées de git au build.
// Utilisé par les layouts (schema dateModified + mention visible) et par le sitemap (lastmod).
// Fichier modifié non commité ou non suivi → date du jour. Git indisponible → null (rien n'est affiché).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const cache = new Map();

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** URL ou pathname ("/expertises/gtb-gtc/") → fichier source ("src/pages/expertises/gtb-gtc/index.astro"). */
export function sourceFileForPath(urlOrPath) {
  const p = String(urlOrPath)
    .replace(/^https?:\/\/[^/]+/, "")
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, "");
  const candidates = p
    ? [`src/pages/${p}/index.astro`, `src/pages/${p}.astro`, `src/pages/${p}/index.md`, `src/pages/${p}.md`]
    : ["src/pages/index.astro"];
  return candidates.find((f) => existsSync(path.join(ROOT, f))) ?? null;
}

/** { modified, published } au format ISO 8601, ou null si indéterminable. */
export function getPageDates(urlOrPath) {
  const file = sourceFileForPath(urlOrPath);
  if (!file) return null;
  if (cache.has(file)) return cache.get(file);

  let result = null;
  const last = git(["log", "-1", "--format=%cI", "--", file]);
  const status = git(["status", "--porcelain", "--", file]);
  const now = new Date().toISOString();
  if (last || status) {
    const first = git(["log", "--follow", "--diff-filter=A", "--format=%cI", "--", file])
      .split("\n")
      .filter(Boolean)
      .pop();
    result = {
      modified: status ? now : last,
      published: first || last || now,
    };
  }
  cache.set(file, result);
  return result;
}

/** "2026-10-10T…" → "10 octobre 2026" (« 1er » pour le premier du mois). */
export function formatDateFr(iso) {
  const d = new Date(iso);
  const s = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(d);
  return s.replace(/^1 /, "1er ");
}
