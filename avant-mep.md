# À vérifier avant la mise en production (MEP)

## ⚠️ Liens internes codés en dur (`href="/..."`, `src="/..."`)

Le site contient des liens internes écrits en dur dans le markup (`<a href="/expertises/...">`, `<link href="/favicon.svg">`,
`<img src="/logos/...">`, etc.) plutôt que via `import.meta.env.BASE_URL`. Astro ne préfixe **automatiquement** que les
assets qu'il bundle lui-même (CSS/JS dans `_astro/`) — pas ces attributs codés en dur.

Tant que `astro.config.mjs` a `base: "/"` (racine, cas normal pour `oteria-conseil.fr`), **ça ne pose aucun problème** :
les liens en `/...` pointent correctement vers la racine du domaine.

### Le cas particulier : déploiement GitHub Pages sous `/OC/`

Pour le déploiement de prévisualisation sur `https://azerty-bla.github.io/OC/`, `astro.config.mjs` utilise `base: "/OC"`.
Dans ce cas, **tous les liens codés en dur restent en `/...` au lieu de `/OC/...`**, ce qui casse la navigation
(404 "There isn't a GitHub Pages site here" en cliquant sur n'importe quel lien du menu).

**Fix appliqué (uniquement pour ce déploiement GitHub Pages `/OC/`)** : un script de post-traitement
(`/tmp/fix-base-links.js`, non versionné) réécrit le HTML déjà buildé dans `dist/` pour ajouter le préfixe `/OC` sur les
attributs `href`/`src`/`action` commençant par `/` (hors liens déjà préfixés, hors `//`, hors `mailto:`/`tel:`).

```js
const fs = require("fs");
const path = require("path");

const DIST = process.argv[2];
const BASE = "/OC";

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) fixFile(full);
  }
}

function fixFile(file) {
  let html = fs.readFileSync(file, "utf8");
  let changed = 0;
  html = html.replace(/(href|src|action)="\/(?!OC\/|\/)([^"]*)"/g, (match, attr, rest) => {
    changed++;
    return `${attr}="${BASE}/${rest}"`;
  });
  if (changed > 0) fs.writeFileSync(file, html);
}

walk(DIST);
```

Usage : `node fix-base-links.js dist` (à exécuter sur le `dist/` généré avec `base: "/OC"`, **avant** chiffrement staticrypt).

## ✅ Ce qu'il faut vérifier avant la vraie MEP (déploiement sur `oteria-conseil.fr`)

- **Ne PAS appliquer ce script de post-traitement** sur le build destiné à `oteria-conseil.fr`. Avec `base: "/"`,
  les liens codés en dur sont déjà corrects — appliquer le script casserait les liens (double préfixe ou préfixe `/OC`
  indu).
- Vérifier que `astro.config.mjs` repasse bien sur `base: "/"` (ou que le `base: "/OC"` est conditionné uniquement
  au build GitHub Pages, ex. via une variable d'env) avant de builder pour la production.
- Idéalement, corriger la cause racine dans le code source (87 fichiers, ~603 occurrences de `href="/..."` /
  `src="/..."` codés en dur) en utilisant `import.meta.env.BASE_URL` ou un helper de lien centralisé, pour ne plus
  dépendre d'un script de post-traitement à chaque déploiement sous sous-chemin. Non fait à ce jour — purement
  un correctif ponctuel sur le `dist/` du déploiement GitHub Pages `/OC/`.

## 🔐 Rappel sécurité (en cours, séparé de ce sujet)

`STATICRYPT_PASSWORD` a été exposé en clair dans `.claude/settings.local.json`, commité sur les branches `main`,
`staticrypt` et historiquement sur `gh-pages`. Purge de l'historique sur les 3 branches autorisée par l'utilisateur,
**pas encore effectuée**. À faire avant MEP définitive, et changer ce mot de passe par précaution.
