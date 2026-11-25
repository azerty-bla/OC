# Bilan SEO — oteria-conseil.fr — 10 octobre 2026

> **Source unique : Bing Webmaster Tools (API)**, extraction du 10/10/2026 → `data-seo/bing-api-2026-10-10-6m/` et `bing-api-2026-10-10-3m/` (contenus identiques : aucune donnée avant le 08/07/2026). **Pas de propriété Google Search Console** pour ce site (choix assumé) : aucun chiffre Google dans ce rapport.
> Période observée : 08/07 → 09/10/2026 (94 jours). Pas de période A (première analyse, « point zéro »).
> Mise en production réelle : **build du 30/07/2026** (voir §3). Rapport précédent : aucun.

## 1. Verdict en une page

| # | Constat | Verdict |
|---|---|---|
| 1 | Bing : **23 clics, 535 impressions** sur la période ; 13 impressions la semaine du 17/08, **111 à 124/semaine** depuis le 21/09 | Démarrage normal d'un site neuf, porté par l'indexation (certain : courbe d'index Bing 3 → 82 pages sur la même période) |
| 2 | **17 clics sur 23 viennent de requêtes de marque** (« oteria conseil », « oteria cee », fautes de frappe) | Le site est surtout trouvé par des gens qui le connaissent déjà. Le hors-marque démarre : 0 → ~30 impressions/semaine, 1 clic/semaine depuis mi-septembre |
| 3 | La production sert le **build du 30/07** ; les correctifs formulaires du 04/10 (`f07ce04`, `472d2e4`, `d4f9c65`) **ne sont pas en ligne** | 🔴 Risque de leads perdus (la validation ne bloquait pas l'envoi d'un formulaire invalide, que le CRM refuse). Certain : deux sources (md5 accueil prod = `dist/` du 30/07 ; fonctions `phoneDigits`/`checkPhone` absentes du HTML servi) |
| 4 | Premier territoire hors marque : **kWh cumac** (33 requêtes, 48 impressions ventilées, page `/dispositifs/kwh-cumac/` 76 impressions en position 5,9 pour 1 clic) | Gisement : intention de **calcul/conversion** (« conversion kwh cumac », « comment calculer », « combien représente 1 178 016 kWh cumac en MWh ») que la page sert en texte, sans outil |
| 5 | `/dispositifs/barometre-prix-cee/` affiche « Données actualisées » avec un voyant animé et « cours mis à jour — juin 2026 » | 🟠 Contenu chiffré périmé de 4 mois sur une page prix (YMYL, L15) — 24 impressions en position 7,5 |

**En une phrase :** le site s'indexe correctement sur Bing et commence à capter de la demande hors marque sur le kWh cumac, mais la priorité de la session est de **mettre en ligne le code d'octobre** (formulaires) et de **dater honnêtement le baromètre**.

### Ce qui va bien
- Indexation Bing : 82 pages en index au 03/10 pour 89 URL au sitemap (92 %).
- Positions hors marque bonnes pour un site de 2 mois : 4 à 9 sur la quasi-totalité des requêtes ventilées.
- Technique de production propre : sitemap 89 URL sans doublon, identique au build ; `robots.txt` correct ; canonical présent ; HTTPS + HSTS.

### Ce qui inquiète
- Correctifs formulaires non déployés (site de génération de leads).
- Baromètre présenté comme « actualisé » avec des cours de juin.

### Ce qui est normal (à ne pas toucher)
- 60 pages sur 89 sans impression : la moitié de l'index Bing date de moins de 4 semaines (47 pages au 12/09, 82 au 03/10). Trop tôt pour juger un silo.
- La requête « certification gtb gtc bacs décret tertiaire formation » : 1 impression, appariement lexical de `/expertises/gtb-gtc/` (cf. analyse du jour), pas une demande à servir.

## 2. Méthodologie et limites

| Fichier | Contenu | Couverture |
|---|---|---|
| `…_SearchPerformanceOverview_All_10_10_2026.csv` | série **journalière** clics / impressions | 535 impressions, 23 clics (total exact) |
| `Bing_Requetes.csv`, `Bing_Pages.csv`, `*_hebdo.csv` | agrégats par **semaine** | **307 impressions sur 535 (57 %)**, 23 clics sur 23 côté requêtes ; 20 clics côté pages |
| `Bing_Requetes_x_Pages.csv` | requêtes principales × pages | marque + 1 requête hors marque seulement |
| `Bing_Crawl.csv` | pages explorées, en index, codes HTTP par jour | 10/07 → 03/10 |

Limites : pas de pays ni d'appareil chez Bing ; requêtes rares anonymisées (43 % des impressions non ventilées) ; volumes très faibles (< 100 clics) → raisonnement en valeurs absolues et en positions, jamais en %. Sans Google, aucun contre-test moteur : les contre-tests de ce rapport sont la production (`curl`), git et la courbe d'index Bing.

## 3. Chronologie

| Date | Événement | Source | Effet attendu |
|---|---|---|---|
| 25/06 | Déploiement GitHub Pages (`/OC/`) | tracking ✅ | — (hors domaine) |
| 30/07 18:24 | **Build actuellement en production** (`dist/index.html`, md5 identique à l'accueil servi ; `last-modified` du favicon 30/07 16:25 GMT) | prod + `dist/` | mise en ligne réelle sur oteria-conseil.fr : contient les lignes de tracking ⏳ du 25/06 au 30/07 (OVH, Ahrefs, logo, favicon, titles) |
| 04/10 | Correctifs formulaires `f07ce04`, `472d2e4`, `d4f9c65` | git, tracking ⏳ | **non déployés** |
| 05/10 | `eee2fe5` : chantier de juillet commité (`base: "/"`, `site: oteria-conseil.fr`) | git | HEAD constructible tel quel pour la production |

Les lignes ⏳ du tracking antérieures au 30/07 sont en réalité en ligne (le tracking est en retard sur la prod, L28) ; celles du 04/10 ne le sont pas.

## 4. Évolution (série journalière, par semaine)

| Semaine (lundi) | Clics | Impressions | Pages en index Bing (fin de semaine) |
|---|---|---|---|
| 06/07 – 27/07 | 0 | 2 | 1 → 3 |
| 03/08 | 0 | 3 | 7 |
| 10/08 | 0 | 0 | 13 |
| 17/08 | 4 | 13 | 21 |
| 24/08 | 0 | 22 | 35 |
| 31/08 | 0 | 35 | 41 |
| 07/09 | 3 | 52 | 47 |
| 14/09 | 4 | 57 | 62 |
| 21/09 | 5 | 124 | 74 |
| 28/09 | 4 | 116 | 82 |
| 05/10 (4 j) | 3 | 111 | — |

Lecture : impressions et index montent ensemble. Le palier depuis le 21/09 (~115/semaine) correspond à l'index presque complet. La semaine du 05/10 (111 en 4 jours) prolonge la hausse.

Marque / hors marque (agrégats hebdo ventilés) : marque 2 → 39 impressions/semaine (pic S39), hors marque 0 → 33. Clics hors marque : 1 par semaine depuis le 18/09.

## 5. Fenêtre A → B
Sans objet (première analyse, pas de données antérieures au 08/07).

## 6. Impact des mises à jour du site

| Changement | Verdict |
|---|---|
| Mise en production du 30/07 (OVH, sitemap, titles 30-60 car., corrections Ahrefs) | **Correction efficace** côté indexation : index Bing 3 → 82 pages en 9 semaines, 0 erreur 5xx, 4xx ponctuel (1 URL les 29/08 et 12/09) |
| Correctifs formulaires du 04/10 | **Sans effet possible** : non déployés |

## 6 bis. Inventaire de la demande par territoire

Requêtes regroupées par vocabulaire (307 impressions ventilées) :

| Territoire | Requêtes | Clics | Impressions | Position pondérée | Pages en ligne | Impr./page |
|---|---|---|---|---|---|---|
| Marque (oteria…) | 12 | 17 | 137 | 4,8 | — | — |
| **kWh cumac / calcul / conversion** | 33 | 1 | 48 | 6,9 | **1** (`/dispositifs/kwh-cumac/`) | **48** |
| Dispositif CEE, obligés, fiches | 30 | 1 | 42 | 6,0 | ~10 (`/dispositifs/…`) | ~4 |
| GTB / GTC / BACS | 24 | 1 | 25 | 5,0 | 7 | 3,6 |
| HP/BP flottante, froid | 5 | 0 | 23 | 4,5 | 5 | 4,6 |
| Autres technologies (destrat, air comprimé, VMC, PAC, isolation) | 12 | 1 | 17 | 6,5 | 48 | 0,4 |
| Prix / baromètre CEE | 3 | 0 | 4 | 5,8 | 1 | 4 |

Par silo (pages Bing, 307 impressions) :

| Silo | Pages au sitemap | Pages vues | Clics | Impressions | Position pondérée | Impr./page |
|---|---|---|---|---|---|---|
| Accueil | 1 | 1 | 16 | 84 | 3,7 | 84 |
| `/dispositifs/kwh-cumac/` | 1 | 1 | 1 | 76 | 5,9 | **76** |
| `/expertises/gtb-gtc/` | 7 | 2 | 1 | 33 | 4,3 | 4,7 |
| `/dispositifs/barometre-prix-cee/` | 1 | 1 | 0 | 24 | 7,5 | 24 |
| `/expertises/hp-bp-flottante/` | 5 | 2 | 0 | 21 | 4,2 | 4,2 |
| `/dispositifs/calcul-prime/` | 1 | 1 | 0 | 11 | 6,4 | 11 |
| `/dispositifs/fiches-cee/` | 6 | 3 | 0 | 11 | 7,1 | 1,8 |
| `/expertises/destratificateur/` | 6 | 2 | 0 | 8 | 7,6 | 1,3 |
| `/expertises/air-comprime/` | 8 | 1 | 0 | 5 | 8,0 | 0,6 |
| `/expertises/isolation-thermique/` | 11 | 2 | 0 | 2 | 4,5 | 0,2 |
| `/expertises/pompe-a-chaleur/` | 8 | 1 | 0 | 1 | 7,0 | 0,1 |
| `/expertises/variateur-de-vitesse/` | 8 | 0 | 0 | 0 | — | 0 |

Lecture :
1. **Territoire sous-servi : le kWh cumac et le calcul de prime** (`kwh-cumac` 76 impressions, `calcul-prime` 11, baromètre 24 — trois pages « outils » du dispositif = 111 impressions, plus que tous les silos d'expertise réunis : 70 sur 60 pages). Les requêtes sont des questions de calcul précises : la page y répond en texte, sans calculatrice.
2. **Silos d'expertise** (isolation, PAC, variateur, air comprimé) : 0 à 5 impressions pour 8 à 11 pages chacun. Verdict **indéterminé, trop tôt** : la moitié de l'index Bing a moins de 4 semaines. Ne pas étoffer, ne pas supprimer ; re-contrôle le 10/12.
3. Les impressions sont un plancher, mais ici les positions sont bonnes (4-9) : c'est le volume Bing qui est faible, pas le classement.

## 7. Ce qui gagne, ce qui perd
- Gagnent : accueil (marque, 69 % de CTR sur « oteria conseil » en position 1), `/dispositifs/kwh-cumac/` (6 → 32 impressions/semaine entre le 04/09 et le 25/09).
- Anomalie 1 : « oteria » seul — 45 impressions en position 4,3, 1 clic. **Hypothèse** (non vérifiée) : homonymie avec une autre marque « Oteria » qui capte cette requête ; rien à corriger côté site.
- Anomalie 2 : « oteria conseil dijon » — 12 impressions, 0 clic ; aucune mention de Dijon dans le dépôt (siège à Meximieux, 01). Recherche probable d'un prospect ou partenaire bourguignon ; à garder en tête pour la page `/qui-sommes-nous/` (zone d'intervention).
- Anomalie 3 : « hp flottante et detendeur thermostatique » — 19 impressions en position 4, 0 clic, servie par `/expertises/hp-bp-flottante/hp-flottante/`. La page traite le sujet en une phrase (« les détendeurs électroniques sont recommandés… ») : intention précise, réponse diluée.

## 8. Indexation, exploration, technique (contrôles du 10/10)
- Sitemap production : 89 `<loc>`, 0 doublon, **identique** au `dist/` local ; aucun `lastmod` (L79 : prive Bing et Google d'un signal de relecture).
- `robots.txt` : `Allow: /` + sitemap. `/OC/` → 404 (ancienne base GitHub Pages, normal).
- Pas d'en-tête `last-modified` sur le HTML (seulement sur les fichiers statiques) : dater les déploiements via le favicon ou le md5 de l'accueil.
- Bing crawl : 0 erreur 5xx, 1 redirection 301 constante, « autres codes » 1-3 (non détaillés par l'API).
- **IndexNow** : absent du dépôt (aucune clé dans `public/`, aucune mention dans le code).
- Ce qui n'est PAS en cause (vérifié) : sitemap, robots, canonical de l'accueil, base Astro (`/` dans HEAD), pages hors sitemap (0).

## 9. Contre-test Bing
Sans objet : Bing est la seule source.

## 10. Dangers et alertes

| Danger | Preuve | Gravité | Action | Échéance |
|---|---|---|---|---|
| Correctifs formulaires absents de la prod | md5 accueil prod = `dist/` du 30/07 ; `phoneDigits` absent du HTML servi | 🔴 | 2026-10-10-01 | cette session |
| Baromètre « actualisé » avec cours de juin 2026 | `barometre-prix-cee/index.astro` l. 61, 67, 77, 171, 238 | 🟠 | 2026-10-10-02 | cette session |
| Tracking de déploiement en retard sur la prod | lignes ⏳ du 25/06 au 30/07 en ligne | 🟡 | passer ces lignes en ✅ (30/07) après confirmation | à confirmer |
| Aucun suivi Google | choix assumé | — | aucune (voir §12, question ouverte) | — |

## 11. Suivi des actions de la session précédente
Première analyse : aucune.

## 12. Plan d'action de cette session
Voir `data-seo/PLAN-ACTION.md` (IDs 2026-10-10-01 à -05).

Vérifications à faire dans Bing Webmaster Tools (10 min) :
- Sitemaps : le sitemap `sitemap-index.xml` est-il soumis et lu ?
- Recherche de mots clés : volume Bing réel de « kwh cumac », « calcul kwh cumac », « conversion kwh cumac » (pour chiffrer l'action -03).

## 13. Journal d'itération

| Passe | Ce qui a changé | Pourquoi |
|---|---|---|
| 1 | Lecture : site jeune, marque dominante, kWh cumac en tête du hors marque | séries et tableaux |
| 2 | Le tracking (tout en ⏳) laissait croire le site non déployé depuis juin → **production = build du 30/07** ; les correctifs d'octobre ne sont pas en ligne (P0 ajouté) | md5 + grep des fonctions du commit |
| 3 | Les silos d'expertise à 0-5 impressions ne sont pas des échecs : la moitié de l'index Bing a < 4 semaines → verdict « trop tôt » | courbe `InIndex` |
| 4 | Angle mort : sans la mise à jour, l'action recommandée resterait l'outil kWh cumac (stock existant, demande mesurée) → le plan n'est pas qu'un rapport d'impact | contrôle d'angle mort |

## 14. Ce qu'il faut retenir
1. Le site est indexé à 92 % sur Bing en 9 semaines ; impressions ×9 entre fin août et fin septembre.
2. 17 clics sur 23 sont de marque : le SEO hors marque commence à peine (1 clic/semaine).
3. La production date du 30/07 ; les correctifs formulaires du 04/10 ne sont pas en ligne.
4. Le premier gisement hors marque est le calcul du kWh cumac (76 impressions sur une seule page).
5. Le baromètre des prix CEE se dit « actualisé » avec des cours de juin.
6. Les silos d'expertise sont trop jeunes pour être jugés : re-contrôle le 10/12/2026.

---
*Sources : Bing Webmaster API (extraction du 10/10/2026, `bing-api-2026-10-10-6m` et `-3m`), dépôt git (`main`, `dcd8315` → `eee2fe5`), contrôles en production du 10/10/2026 (`curl` sitemap, accueil, `/diagnostic-gratuit/`, en-têtes).*
