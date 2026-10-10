// IndexNow — signale à Bing (et Yandex, Seznam…) les URL à relire, juste APRÈS le déploiement en ligne.
// Usage : `npm run indexnow` (toutes les URL de dist/sitemap-*.xml, donc build préalable requis)
//         `npm run indexnow -- https://oteria-conseil.fr/expertises/gtb-gtc/ /dispositifs/kwh-cumac/` (URL choisies) ; `--dry-run` pour lister sans envoyer.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const HOST = "oteria-conseil.fr";
const SITE = `https://${HOST}`;
const KEY = "b20164630311bdc7232b5d1f56f7099b";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const DIST = path.resolve("dist");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const explicit = args.filter((a) => !a.startsWith("--"));

function urlsFromSitemaps() {
  if (!existsSync(DIST)) throw new Error("dist/ absent : lancer `npm run build` d'abord.");
  const files = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f));
  if (!files.length) throw new Error("Aucun dist/sitemap-N.xml trouvé.");
  return files.flatMap((f) =>
    [...readFileSync(path.join(DIST, f), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  );
}

const urls = [
  ...new Set(
    (explicit.length ? explicit : urlsFromSitemaps()).map((u) => (u.startsWith("http") ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`))
  ),
].filter((u) => new URL(u).host === HOST);

if (!urls.length) {
  console.error("Aucune URL à soumettre.");
  process.exit(1);
}

console.log(`${urls.length} URL${urls.length > 1 ? "s" : ""} → ${ENDPOINT}`);
if (dryRun) {
  urls.forEach((u) => console.log("  " + u));
  process.exit(0);
}

// L'API accepte jusqu'à 10 000 URL par requête.
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
  });
  console.log(`Lot ${i / 10000 + 1} : HTTP ${res.status} ${res.statusText}`);
  // 200 = reçu, 202 = reçu (clé en cours de validation) ; 403 = clé introuvable en ligne ; 422 = URL hors host
  if (![200, 202].includes(res.status)) {
    console.error(await res.text());
    process.exitCode = 1;
  }
}
