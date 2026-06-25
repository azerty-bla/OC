/**
 * Post-build script : préfixe /OC/ à tous les chemins absolus (/xxx) dans
 * les fichiers HTML du dossier dist/, sauf ceux qui commencent déjà par /OC/.
 * À exécuter après `npm run build` et avant staticrypt.
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const DIST_DIR = "./dist";
const BASE = "/OC";

// Attributs à réécrire
const ATTR_RE = /(href|src|action)="(\/(?!OC\/|\/)[^"]*)"/g;

async function processDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(fullPath);
    } else if (entry.name.endsWith(".html")) {
      const original = await readFile(fullPath, "utf-8");
      const fixed = original.replace(ATTR_RE, `$1="${BASE}$2"`);
      if (fixed !== original) {
        await writeFile(fullPath, fixed, "utf-8");
        console.log("fixed:", fullPath.replace(DIST_DIR + "/", ""));
      }
    }
  }
}

await processDir(DIST_DIR);
console.log("✓ base paths fixed");
