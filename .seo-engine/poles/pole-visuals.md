# Pôle Visuels — Images de contenu

Tu décides si une page a besoin d'images, lesquelles, tu les produis (générateur local ou SVG), tu les audites, tu itères, puis tu les fais valider par l'utilisateur avant de les intégrer. Ces consignes valent pour tout site, tout secteur : ce qui est propre au site est dans sa **bible visuelle** et dans `config.visuals`.

**Principe directeur : zéro image par défaut.** Une image doit gagner sa place. Une page sans image est un résultat normal.

---

## Entrées

- La page rédigée (`copy.file_path` ou fichier existant) et son side-car
- `config.visuals` (générateur, sorties, seuils) : réglages par défaut dans `scripts/visuals-lib.js`
- La bible visuelle du site (`config.visuals.bible`, par défaut `docs/VISUAL_BIBLE.md`)
- L'état des visuels du site : `.seo-engine/state/visuals/visuals.json` (tous les visuels, de leur plan à leur intégration ; sert aussi de registre)
- `research.verified_facts` du side-car (seule source des chiffres d'un schéma)

**Bible absente** : crée-la à partir de `references/visual-bible.template.md`, en la remplissant depuis la charte du site (variables SCSS/CSS, couleurs, police), `CONTENT_GUIDELINES.md` et le sujet du site. Arrête-toi ensuite et demande à l'utilisateur de la valider : aucune image ne se produit sans bible validée.

---

## 1. Plan (par page)

Lis la page entière. Pour chaque idée d'image, vérifie qu'elle remplit au moins un critère :

| `criterion` | L'image… |
|---|---|
| `voir` | montre un objet, un lieu ou un geste que le lecteur n'a probablement jamais vu et doit se représenter |
| `comprendre` | explique un processus, une relation ou une proportion plus vite qu'un paragraphe |
| `se-reconnaitre` | aide le lecteur à situer son cas (arbre de décision, typologie) |
| `gabarit` | est exigée par le gabarit (hero, image de partage) |

**Exclusions, quel que soit le critère :**
- image décorative ou d'ambiance sans information ;
- doublon d'un tableau ou d'une liste de la page ;
- toute image qui laisserait croire à une réalisation, une équipe, un client, un local ou un témoignage réels (`references/spam-policies.md`, fausse expérience) ;
- sujet où une erreur visuelle tromperait le lecteur (symptôme, maladie, défaut technique précis, consigne de sécurité, document officiel) → type `a-sourcer` (photo réelle sous licence) ou abandon ;
- marque, logo, produit commercial réel ; visage reconnaissable sauf `config.visuals.allow_people`.

**Nombre d'images : pas de plafond fixe.** Il suit le contenu : une page courte peut n'en avoir aucune, une longue page de comparaison ou de méthode peut en porter beaucoup. Chaque image doit tenir son critère, c'est la seule règle.

**Choix du type :**

| `type` | Production | Pour |
|---|---|---|
| `photo` | générateur | matériel, lieu, situation générique |
| `hero` | générateur | fond de bandeau, sans texte, zone vide pour le titre (côté et proportion donnés par le gabarit) |
| `illustration` | générateur | rare ; jamais pour porter une information exacte |
| `schema` | **SVG écrit par toi** | schéma, diagramme, infographie, frise, arbre de décision, carte simple, comparatif chiffré |
| `og` | composition | recadrage du hero + calque SVG (titre, accroche) → 1200 × 630 |
| `a-sourcer` | aucune | photo réelle nécessaire : signalée à l'utilisateur |

**Règle ferme : texte, chiffres, étiquettes et proportions → SVG.** Les générateurs écrivent parfois juste mais inventent les proportions et la cohérence technique.

## 2. Contre-passe (obligatoire)

Relis ton plan en relecteur hostile :
- chaque image tient-elle vraiment son critère, ou la page fonctionne-t-elle aussi bien sans ?
- deux images de la page disent-elles la même chose ? → fusionner ;
- `visuals.json` contient-il déjà une image du site qui fait l'affaire ? → la réutiliser (`reused_from`) au lieu d'en créer une proche ;
- une image ne contredit-elle rien de ce que dit le texte ?

Écris la décision dans le side-car : `visuals.decision` (`none` ou `planned`), `visuals.rationale` (une ligne), `visuals.item_ids`.

## 3. Éléments du plan

Ajoute chaque image retenue à `visuals.json` (`items[]`) :

```json
{
  "id": "photo-equipement-exterieur",
  "file_name": "equipement_exterieur",
  "type": "photo",
  "criterion": "voir",
  "page": { "slug": "", "url_path": "/…/", "file": "chemin/relatif/de/la/page", "title": "" },
  "slot": { "after_heading": "Texte exact de l'intertitre", "position": "after-first-paragraph" },
  "purpose": "Une ou deux phrases : ce que l'image apporte au lecteur à cet endroit.",
  "must_show": ["élément obligatoire 1", "élément obligatoire 2"],
  "must_not": ["erreur probable à surveiller"],
  "prompt": "",
  "width": 1344,
  "height": 768,
  "seed": 1000,
  "alt": "Ce que montre l'image, en une phrase.",
  "caption": "",
  "status": "planned"
}
```

- `file_name` suit la convention de nommage du projet (CLAUDE.md, `CONTENT_GUIDELINES.md`).
- `slot.position` : `after-first-paragraph` (défaut) ou `after-heading`. Pour un autre endroit de la section, `slot.after_text` : un extrait exact du paragraphe, de la liste ou du tableau après lequel placer l'image (jamais au milieu d'une phrase qui introduit une liste). Hero et `og` : pas d'emplacement dans le texte.
- `purpose` est lu par l'utilisateur sur la planche de validation : bref, concret, sans jargon.
- `alt` décrit ce que montre l'image ; une entité de la page si elle y est naturellement ; jamais de bourrage de mots-clés.
- Graine : `config.visuals.seed_base` + rang de l'image dans le site.

## 4. Prompts (images générées)

Règles indépendantes du modèle :
- en anglais, une seule scène ;
- ordre : type de prise de vue → composition (angle, cadrage, place du sujet, zone vide) → objets avec leur **description canonique** de la bible, reprise mot pour mot → décor → lumière → rendu → interdits (`no text, no logo, no readable signs`, et `no people` selon la bible) ;
- **dimensions en mesures, jamais par comparaison** : « about six meters long », pas « as big as a truck » (la comparaison est prise au pied de la lettre et dessine l'objet comparé) ;
- disposition spatiale explicite (« from the left edge to the right edge », « in the right third of the foreground ») ;
- aucun nom de marque ni de personne réelle ;
- format déduit de l'emplacement : hero 2:1, contenu 16:9 ou 4:3, multiples de 16.

Une fois le prompt écrit : `status = "queued"`.

## 5. Schémas SVG

Écris le fichier dans `.seo-engine/state/visuals/svg/<id>.svg` et renseigne `svg_file` (`svg/<id>.svg`).
- charte de la bible : couleurs avec leur sens, police, épaisseurs, pictogrammes partagés ;
- `viewBox`, `<title>` et `<desc>`, textes en `<text>` (pas de texte vectorisé), aucune ressource externe (ni police distante, ni image) ;
- lisible à 360 px de large : peu de texte, corps de texte ≥ 14 unités pour une largeur de 800 ;
- **chaque chiffre du SVG figure dans la page ou dans `research.verified_facts`**. Aucun chiffre inventé, aucune proportion approximative : les longueurs des barres sont calculées.

**Version mobile** : sur un téléphone, le schéma s'affiche sur environ 340 px de large. Si son plus petit texte y tombe sous 12 px (taille × 340 / largeur du viewBox), dessine aussi `svg/<id>-mobile.svg` (renseigné dans `svg_mobile_file`) : même information, viewBox de 400 de large, mise en page verticale (blocs empilés, libellés au-dessus des barres, frise verticale), texte de 15 au moins. L'intégration la sert par `<picture>` sous `config.visuals.output.mobile_media`.

Contrôle : `rsvg-convert -w 1200 -b white <svg> -o <png>` (ou ImageMagick), puis à 360 px (version mobile : à 342 px), et lis les rendus. Chevauchements, débordements, contraste, cohérence avec le texte. Corrige jusqu'à ce que ce soit propre, puis `status = "ready"`, `score`, `issues` (réserves éventuelles).

## 6. Génération et audit (mission `visuals`)

1. `node .seo-engine/scripts/generate-visuals.js --state .seo-engine/state/visuals --config .seo-engine/config.json` — en arrière-plan : une image prend de quelques secondes à quelques minutes. Le script refuse un générateur sans licence déclarée, ou sans usage commercial sur un site monétisé.
2. Pour chaque élément `generated`, lis la dernière image (`attempts[-1].file`) et note de 1 à 5 :
   1. chaque `must_show` est présent et reconnaissable ;
   2. aucun `must_not`, aucun texte parasite, logo, membre ou objet déformé ;
   3. échelle et cohérence physique (ce qui doit être relié l'est, objets posés, perspective) ;
   4. rien ne contredit la page ;
   5. adapté à l'emplacement (zone vide du hero, lisibilité à 360 px).
   Écris `score`, `issues`, et dans l'essai : `attempts[-1].score`, `attempts[-1].issues`.
3. Score ≥ `config.visuals.min_score` → `status = "ready"`. Sinon, diagnostic :
   - **défaut de prompt** (élément ambigu, comparaison prise au pied de la lettre) → réécris la partie fautive ;
   - **mauvais tirage** (bon prompt) → garde le prompt : le script changera la graine ;
   - **limite du modèle** (même défaut à chaque essai) → simplifie la composition, ou passe en `schema` ou `a-sourcer`.
   Puis `status = "queued"` et relance l'étape 1 pour les seuls éléments en file.
4. Après `config.visuals.max_iterations` essais sans réussite : `status = "failed"`, `reject_reason`. **Jamais d'image forcée.**
5. Les leçons utiles aux prochains prompts (formulation piégeuse, description canonique à corriger) vont dans `.seo-engine/state/visuals/lessons.md`. Tu ne modifies pas la bible : l'utilisateur reporte.

## 7. Validation humaine (toujours, toutes les images)

1. `node .seo-engine/scripts/review-visuals.js --state .seo-engine/state/visuals --title "<page ou lot>"` : planche numérotée de tous les éléments `ready` (photos et schémas), avec page, emplacement, rôle de l'image et l'image à côté. Numéros définitifs, continus d'une planche à l'autre.
2. Ouvre-la (servie par un serveur local lancé à la racine du projet (`python3 -m http.server 8765`, puis `open http://localhost:8765/<chemin de la planche>`) : ouverte en `file://`, Chrome n'affiche pas les images) et demande à l'utilisateur **uniquement les numéros qu'il ne garde pas**, et pour chacun : à retravailler ou à enlever.
3. Réponse reçue : `node .seo-engine/scripts/review-visuals.js --state .seo-engine/state/visuals --reject 3,7` (ou `--reject none`). Les autres numéros de la planche passent en `approved`.
4. À retravailler → corrige le prompt ou le SVG selon la remarque, `status = "queued"` (ou `ready` pour un SVG), et le visuel repassera sur la prochaine planche. À enlever → `status = "removed"`.

Dans une boucle Ralph, la planche est un point d'arrêt : `EXIT_SIGNAL: false` et le résumé indique qu'une validation est attendue.

## 8. Intégration

`node .seo-engine/scripts/integrate-visuals.js --state .seo-engine/state/visuals --config .seo-engine/config.json --root .`
- photos et schémas validés : fichiers finaux (WebP aux largeurs de `config.visuals.output.widths` + JPEG de repli, ou SVG) et `<figure data-visual="…">` insérée après l'intertitre prévu ; relancer sans risque, une figure déjà présente n'est pas dupliquée ;
- hero et image de partage : fichiers produits (`status = "exported"`), placement à faire dans le gabarit (hero : sans `loading="lazy"`, avec `fetchpriority="high"` ; `og:image` des pages concernées) ;
- si le site n'a pas de style pour `.content-figure`, signale-le : le style se crée une fois dans la feuille du site, jamais en ligne.

Puis `validate-all` sur chaque page touchée. Aucune mention « image générée » nulle part (ni légende, ni métadonnée, ni `alt`).

Fraîcheur : un schéma qui ajoute une information est un changement de fond (`dateModified` mis à jour) ; une photo seule ne l'est pas.
