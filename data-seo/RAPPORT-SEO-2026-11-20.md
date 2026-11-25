# Bilan SEO — oteria-conseil.fr — 20 novembre 2026

> Première analyse avec des données **Google** (export manuel Search Console du 12/11/2026 : 3 mois, 28 jours, Indexation). Bing par l'API jusqu'au 19/11. Session précédente : 10/10/2026, Bing seul.
> Branche vérifiée : `main`. Aucune modification du site pendant cette session (livrables dans `data-seo/` uniquement).

## 1. Verdict en une page

**Le site plafonne dans Google parce que Google n'indexe que les pages de premier niveau.** 31 pages sur 89 du sitemap sont indexées (35 %). Les 25 hubs, pages dispositifs et pages institutionnelles le sont toutes. Sur les **64 sous-pages** (déclinaisons techno × secteur, FAQ, tarifs, prime CEE, fiches par secteur), **6 seulement** sont indexées (9 %). 37 n'ont **jamais été explorées** depuis la mise en ligne. 21 ont été explorées, puis écartées en deux vagues, le 22/09 (+9) et le 05/10 (+9).

**Conséquence directe sur les optimisations du 10/10 :** dans Google, elles n'ont eu presque aucun effet. Les sous-pages ciblées par les quickwins (HP/BP prime et HP flottante, VMC tertiaire, GTB tarifs, destratificateur tertiaire, fiches par secteur) ne sont pas dans l'index. Depuis le déploiement, Google n'a relu qu'une seule des 21 pages écartées (`gtb-gtc/faq`, le 20/10). Les 19 autres ont été jugées sur leur version **d'avant correction** (dernier crawl du 03/08 au 08/10), celle qui contenait des codes de fiches faux.

**Dans Bing, en revanche, l'effet est net** : clics +62 %, impressions +81 % (27 j avant/après). Bing indexe **89 pages sur 89** et classe 19 des pages refusées par Google en positions 1 à 10. Exemples : `gtb-gtc/tarifs` (4 clics, position 3,7), `fiches-cee/agriculture`, catalogue entièrement refait le 10/10 (4 clics sur « fiche cee agriculture » en 28 j). Le contenu corrigé a donc de la valeur. **Il manque à Google de le lire.**

### Ce qui va bien
- Trajectoire Google saine sur les pages indexées : la position moyenne passe de 34,8 (août) à 17,3 (novembre) ; ~75 clics/mois depuis septembre.
- Bing, le canal en croissance : 4 → 15 → 21 clics par mois d'août à octobre, puis 18 clics sur les 18 premiers jours de novembre. Bing fait aujourd'hui autant de clics hors marque que Google sur les sous-pages.
- Sur le hub VMC (seule page VMC indexée), les requêtes ciblées progressent après le 10/10 : « vmc double flux tertiaire » passe de la position 23,5 à 13,3, « vmc double flux industrielle » de 16,0 à 11,8 et « cee vmc double flux » de 77,6 à 35,5. Sur la même période, la position moyenne du site ne gagne que 0,6 place.
- Technique saine : HTTP 200, `index, follow`, canonical autoréférent, Googlebot servi normalement (contrôlé sur 5 pages non indexées).

### Ce qui inquiète
1. **Indexation Google en baisse** : 55 pages le 14/08, 33 le 09/11. Le compteur de pages « détectées, jamais explorées » est figé à 37 depuis 3 mois.
2. **Hors marque Google quasi nul sur les requêtes visibles** : 2 clics hors marque sur 3 mois parmi les requêtes non anonymisées, alors que la marque en fait 117. Les pages autres que l'accueil font environ 27 clics par 28 j, presque tous sur des requêtes anonymisées.
3. **Véracité en production** : la prod sert encore les fiches supprimées le 29/10 (IND-UT-104 visible sur `/dispositifs/fiches-cee/industrie/`). La correction existe en local (lot ⏳ du 07/11).

### Ce qui est normal (à ne pas toucher)
- 2 « pages avec redirection » (variantes http/www) : volontaire.
- 12 % d'impressions hors France (Belgique, Maroc…) : volume marginal, rien à corriger.
- Requêtes sur des fiches abrogées (« bat-th-155 », 64 impressions) : le site a eu raison de les retirer, ne pas les recréer.

## 2. Méthodologie et limites

| Source | Fenêtre | Usage |
|---|---|---|
| GSC export manuel `perf:2026-11-12:3m` | 11/08 → 10/11/2026 | série journalière, territoires, période A par soustraction |
| GSC export manuel `perf:2026-11-12:28j` | 14/10 → 10/11/2026 | période B (après le déploiement du 10/10) |
| GSC Indexation + 2 listes d'URL (détectée / explorée) | 14/08 → 09/11/2026 | trajectoire, URL par motif, dernière exploration |
| Bing API (`bing-api-2026-11-20-28j/3m/6m`) | 08/07 → 19/11/2026 | contre-test, pages, index Bing |

Limites :
- **Pas d'accès API Google** pour cette propriété : aucun des 5 comptes connectés au skill ne la détient. Il manque donc le croisement requête × page de Google (la cannibalisation reste une hypothèse) et l'URL Inspection API (état de chaque URL, canonical choisi par Google).
- **Pas de période A propre** : A = 3 mois − 28 jours (64 j contre 28 j), comparée en impressions par jour. A inclut le démarrage du site en août, où les positions sont gonflées par l'extension d'exposition (L19). Les gains de position page par page sont donc en partie dus à l'âge du site.
- **Anonymisation** : les requêtes visibles couvrent 119 des 209 clics sur 3 mois (57 %), mais presque tous les clics hors marque sont anonymisés.
- **Pas de statistiques d'exploration** (export manuel uniquement).
- Les fenêtres de Bing et de Google ne s'arrêtent pas le même jour (19/11 contre 10/11).
- Formulaires (7.2) : non testés en envoi réel cette session. Le dernier test date du 04/10 et le code n'a pas changé depuis.

## 3. Chronologie

| Date | Événement | Source |
|---|---|---|
| 30/07/2026 | Mise en ligne du build (OVH) | tracking, rapport du 10/10 |
| 14/08 | 1er relevé d'indexation Google : 55 indexées, 37 détectées non explorées | export Indexation |
| 22/09 | +9 pages « explorées, non indexées » (2 → 11) | export Indexation (drilldown) |
| 24/09 → 08/10 | September 2026 spam update (confirmé) | `google-updates.md` |
| 05/10 | +9 pages « explorées, non indexées » (11 → 20) | export Indexation |
| **10/10 (12 h 13 GMT)** | **Déploiement `e9b53a5`** : fiches CEE, montants, quickwins, maillage, `lastmod`, clé IndexNow, formulaires | `curl -I` (Last-Modified de la clé IndexNow et du sitemap) |
| 16/10 et 20-21/10 | Volatilité Google non confirmée | `google-updates.md` |
| 07/11 | Lot local ⏳ : arrêté du 26/10 (8 fiches supprimées), `og:updated_time` — **non déployé** (vérifié : IND-UT-104 encore servie) | tracking, `curl` |

## 4. Évolution depuis la mise en ligne

| Mois | Clics Google | Impr. Google | Position | Clics Bing | Impr. Bing |
|---|---|---|---|---|---|
| Juillet | — | — | — | 0 | 2 |
| Août (à partir du 11/08) | 35 | 1 781 | 34,8 | 4 | 46 |
| Septembre | 77 | 3 748 | 20,0 | 15 | 331 |
| Octobre | 73 | 3 975 | 17,4 | 21 | 725 |
| Novembre (partiel) | 24 (10 j) | 1 470 | 17,3 | 18 (18 j) | 620 |

Google : les impressions plafonnent depuis septembre et la position s'améliore, ce qui correspond au plafond d'un index limité aux pages de premier niveau. Bing : croissance continue.

## 5. Avant / après le 10/10 (27 j de chaque côté, transition exclue)

|  | Clics | Impressions | CTR | Position |
|---|---|---|---|---|
| Google, tous jours | 67 → 67 (0 %) | 3 365 → 3 604 (+7 %) | 1,99 % → 1,86 % | 17,2 → 16,6 |
| Google, jours ouvrés | 61 → 63 (+3 %) | 2 814 → 2 951 (+5 %) | 2,17 % → 2,13 % | 14,9 → 15,2 |
| Bing | 16 → 26 (+62 %) | 431 → 779 (+81 %) | 3,71 % → 3,34 % | — |

Pages (impressions par jour, A = 11/08→13/10, B = 14/10→10/11) : `destratificateur` 4,4 → 12,2 ; `dispositifs/demarches` 0,8 → 4,8 ; `dispositifs/faq` 7,5 → 12,4 ; `calcul-prime` 4,2 → 7,0 ; `gtb-gtc` 23,0 → 26,3. Aucune page indexée ne recule nettement en impressions.

## 6. Impact des mises à jour du site

| Changement | Pages | Effet attendu | Observé | Verdict | Re-contrôle |
|---|---|---|---|---|---|
| 10/10 : corrections des fiches (-15, -06, -07, -11) | catalogue + sous-pages | crédibilité, indexation des sous-pages | Google : 1 seule page écartée relue depuis (`gtb-gtc/faq`) ; Bing : `fiches-cee/agriculture` 4 clics, `gtb-gtc/tarifs` 4 clics | **Google : trop tôt / bloqué par le crawl** · **Bing : amélioration confirmée** | 10/12 |
| 10/10 : titles et renforcement on-page (-08 à -12) | hubs + sous-pages | positions des 17 mots-clés | hub VMC : 23,5 → 13,3 (« vmc double flux tertiaire ») ; « gtb classe c » 25,5 → 28,5 (4 impressions, non significatif) ; sous-pages ciblées non indexées | **Amélioration probable sur les hubs**, rien de mesurable sur les sous-pages | 10/12 |
| 10/10 : maillage (-16) | sous-pages cibles | exploration des sous-pages | 37 « détectées » le 14/08 → 37 le 09/11, inchangé | **Sans effet mesurable sur l'exploration** à 30 j | 10/12 |
| 10/10 : `lastmod` réel, clé IndexNow (-05) | tout le site | relecture rapide par Bing | Bing : 12 pages explorées le 10/10, puis 2 à 6 par jour | **Indéterminé** : le ping `npm run indexnow` n'a sans doute pas été lancé | prochain déploiement |
| 07/11 (⏳) | 6 pages | — | non en ligne | aucun effet possible | — |

## 6 bis. Inventaire de la demande par territoire (Google 3 mois, requêtes visibles)

| Territoire | Requêtes | Impressions | Position | Pages qui servent (indexées Google) | Impr./page indexée |
|---|---|---|---|---|---|
| **kWh cumac / prix du kWh cumac** | 18 | **895** | 47,9 | `kwh-cumac` (25,3), `barometre-prix-cee` (37,4) | **448** |
| GTB / GTC / BACS | 95 | 854 | 32,6 | hub `gtb-gtc` (`tarifs` et `prime-cee` non indexées) | 854 |
| Fiches CEE | 31 | 566 | 35,3 | hub `fiches-cee` (les 5 fiches par secteur ne sont pas indexées) | 566 |
| FAQ / questions CEE | 5 | 541 | 9,0 | `dispositifs/faq` | 541 |
| VMC | 12 | 456 | 23,6 | hub `vmc-double-flux` (`tertiaire`, `industrie`, `prime-cee` non indexées) | 228 |
| Obligés | 9 | 278 | 18,9 | `dispositifs/obliges` | 278 |
| Destratificateur | 22 | 243 | 27,3 | hub (+ `industrie`) ; `tertiaire`, `tarifs`, `prime-cee` non indexées | 122 |
| HP/BP flottante | 11 | 194 | 53,1 | hub seul (les 4 sous-pages ne sont pas indexées) | 194 |
| Air comprimé | 13 | 163 | 68,9 | hub + `prime-cee` | 82 |
| Calcul / montant prime | 23 | 146 | 28,6 | `calcul-prime` | 146 |
| PAC · isolation · variateur | 28 | 142 | 46-83 | hubs | < 50 |
| Marque | 3 | 283 | 2,8 | accueil | — |

**Lecture.** Tous les territoires à demande sont servis par **une seule page indexée**, le hub, en positions 18 à 50. La page dédiée existe, mais Google ne l'a pas indexée. Le premier gisement hors marque reste le **prix du kWh cumac** : 895 impressions et 2 pages, dont aucune n'a « prix » ni « euros » dans son title (`kwh-cumac` : « définition, calcul et conversion »). Ce sont des planchers : en position 48, la demande réelle est bien plus forte (L36).

**Gisement « à consolider » (position ≤ 20)** : « faq cee » (194 impressions, position 10), « question réponse cee » (156 + 137, position 8), « obligés cee » (166, position 16), « vmc double flux tertiaire » (221, position 19,6), « vmc double flux industrielle » (64, position 14,7), « catalogue fiches produits » (35, position 10,6), « aide financière gtb » (18, position 12,7).
**Gisement « bloqué » (position > 20)** : prix et kWh cumac (~650 impressions, positions 27 à 64), fiche(s) CEE tertiaire (113 + 61 + 88, positions 31 à 43), « hp flottante » (79, position 59), « cee gtb » (55, position 56), « air comprimé industriel » (44, position 85), « formation gtb gtc » (108, position 42, voir « Ne pas toucher »).

## 6 quater. Table des mots-clés : potentiel, tendance, régressions (ajout du 20/11, à la demande de l'utilisateur)

Table complète : `data-seo/MOTS-CLES-2026-11-20.md` (script `keyword_table.py` du skill). A = 11/08 → 13/10, B = 14/10 → 10/11.
**Dérive du site : −5,5 places** (médiane de 83 requêtes présentes dans les deux fenêtres). Un gain inférieur à 5,5 places ne prouve rien à lui seul.

**Bonnes positions (≤ 10), 0 clic** : « question réponse cee » (156 + 137 impressions, position 7-8), « faq pncee » (52, position 9,5), « catalogue fiches produits » (35, position 10), « hpbp » (14, position 9). → title de la FAQ refait le 20/11.

**Atteignables vite (position 11-20)** :

| Requête | Impressions | Position B | Page qui la porte | Quick win |
|---|---|---|---|---|
| vmc double flux tertiaire | 221 | 13,3 | hub VMC (la page `tertiaire` n'est pas indexée) | QW1 |
| vmc double flux pour locaux tertiaires | 108 | 17,4 | hub VMC | QW1 |
| vmc double flux industrielle | 64 | 11,8 | hub VMC | QW1 |
| obligés cee / liste des obligés cee | 166 + 18 + 17 | 13,7-17 | `obliges` | QW3 |
| gtb ou gtc / différence gtb gtc / gtb et gtc | 49 + 32 + 16 + 19 | 14,7-18,2 | hub GTB | QW2 |
| aide financière gtb / prime énergie gtb / calcul prime cee gtb | 18 + 21 + 33 | 11-17,3 | hub GTB (`prime-cee` n'est pas indexée) | QW2 |
| cours du cee / cours des cee | 35 + 14 | 14,8-15 | baromètre | QW4 |
| destratificateur entrepôt / destratification | 22 + 26 | 16,1-17,2 | hub destratificateur | QW5 |

**Tendance + (au-delà de la dérive), à relier aux actions du 10/10** :
- **-02, cours et exemples recalculés sur `kwh-cumac`** : tout le territoire kWh cumac progresse. « prix du kwh cumac » passe de 55,9 à 29,1 (−21 places relatives), « kwh cumac » de 71,6 à 34,7, « montant kwh cumac » de 64,5 à 22,0 et « prix kwhcumac » de 49,7 à 31,1. **C'est l'action la plus rentable du 10/10.** Le title a été complété le 20/11.
- **-15, catalogue des fiches** : « fiches standardisées cee » passe de 52,1 à 20,8, « fiche cee » de 44,9 à 25,2 et « fiches cee » de 49,6 à 27,9.
- **-07/-11, VMC (hub)** : « cee vmc double flux » passe de 77,6 à 35,5 et « vmc double flux tertiaire » de 23,5 à 13,3.
- **-12, destratificateur** : « destratificateur entrepôt » passe de 72,7 à 16,1, effet de la mention de l'exclusion des entrepôts.
- **-06, HP/BP** : « hp flottante cee » passe de 69,1 à 50,5. La progression reste faible parce que les sous-pages ne sont pas indexées.

**Régressions et leur cause** :

| Requête | A → B | Cause probable | Action |
|---|---|---|---|
| fiche(s) cee tertiaire | 37,5 → 43,1 ; 29,9 → 37,4 | la page `fiches-cee/tertiaire` n'a jamais été explorée ; le hub régénéré le 10/10 n'a pas de section « tertiaire » | QW6 + indexation (01) |
| bat-en-101/102/103/107 | 35-54 → 64-85 | `isolation-thermique/prime-cee` désindexée (2,2 → 0 impression par jour) | indexation (01) |
| centrale d'air comprimé, air comprimé industriel | disparues | `air-comprime/reseau` désindexée (0,5 → 0 impression par jour) | indexation (01) |
| prix gtb | 15,2 → absente | le hub tenait la requête ; -08/-09 ont orienté le prix vers `gtb-gtc/tarifs`, que Google n'a jamais explorée (L91) | indexation de `tarifs` en premier (01) ; sinon, remettre un paragraphe prix sur le hub |
| destratificateur tertiaire | 25,3 → 71,2 (4 impressions en B) | sous-page non indexée ; trop peu de volume pour conclure | — |
| bat-th-155, bar-th-161, « bar en 101 » | disparues | fiches abrogées retirées le 10/10 | **normal** |
| destratificateur | 6,7 → 26,7 | 2 impressions en A, 71 en B : extension d'exposition, pas un recul | — |

**Prospects : les requêtes qui en ont amené depuis le lancement** :
- Google : la marque mise à part, **2 clics visibles en 3 mois**. Les autres clics hors marque (≈ 25-30 par mois) sont anonymisés par Google, on ne peut pas les attribuer à des requêtes.
- Bing, clics hors marque à intention commerciale : « prix gtb hotel 85chambres », « c'est quoi environ le prix d'une solution de supervision multi-marques (gtb/gtc…) », « comparatif offre gtb pac », « consultant cee en paca », « opex gtb gtc », « fiche cee agriculture » (4), « conditions d'attribution d'une prime c2e pour isolation plafond bas », « ou déposer sa fiche cee pour obtenir une convention ».
- **Requêtes qui peuvent en amener** (intention commerciale et impressions réelles) : prix et montant du kWh cumac (~550 impressions), VMC double flux tertiaire et industrielle (~390), prime et aide GTB (~70), calcul prime CEE et calculette (~115), « pompe à chaleur pour entreprise » (15, position 26,5).

## 6 ter. Architecture face au référentiel de mots-clés

Le croisement a été fait par un sous-agent sur le référentiel `datas/cee-b2b/` (volumes Semrush), puis contre-vérifié sur 3 lignes de B et 2 de C. Détail dans le scratchpad de la session (`archi/`).

**A. Couverture (extrait).** Tous les groupes à volume qui ont une page dédiée sont servis dans Google par **le hub** ou par une page dispositif :
- VMC/CTA double flux (1 640) : la page `tertiaire` n'est pas indexée.
- Fiches CEE tertiaire (740) : la page dédiée n'est pas indexée.
- Prime CEE GTB (630) : `gtb-gtc/prime-cee` n'est pas indexée. Elle avait pourtant 79 impressions avant sa sortie d'index.
- Prix CEE / kWh cumac (1 830) : la demande est partagée entre `barometre-prix-cee` (943 impressions, position 41,5) et `kwh-cumac` (808 impressions, position 37,5). C'est la cannibalisation probable déjà relevée au §10.

**B. Trous applicables.** La règle de cohérence s'applique : le profil « contenu produit en série » est établi (§7 bis), donc **pas de vague de créations**.
- **B1 · Décret tertiaire** (13 900 de volume, intention informationnelle) : 0 impression alors que le terme est cité sur 26 pages (vérifié). C'est la seule candidate, pour une page de test **après** le re-contrôle du 10/12, en réaffectant de préférence `/secteurs/tertiaire/` (non indexée, 0 impression) plutôt qu'en créant une URL.
- **B2 · Chaleur fatale industrielle** (5 670) : fiches IND-UT-103 et suivantes en vigueur, IND-UT-117 abrogée (vérifié). À instruire après B1.
- ~~B3 · Calorifugeage~~ : **écarté**, le portefeuille a déjà des sites dédiés (`france-calorifugeage`, `isolation-tuyauterie`), ce qui créerait une cannibalisation entre sites.

**C. Pages sans demande** (candidates à la fusion au re-contrôle du 10/02/2027, pas avant, cf. Ne pas toucher) :
- 6 pages techno × agriculture. Garder la section « ordinateur climatique » de `gtb-gtc/agriculture`, qui a 1 clic Bing en position 1.
- 8 FAQ par techno (1 à 11 impressions Google en 3 mois, vérifié).
- techno × tertiaire et × industrie sans volume : `air-comprime/{tertiaire,industrie,tarifs}`, `variateur-de-vitesse/{tertiaire,industrie,ventilation}`, `gtb-gtc/industrie`.
- `hp-bp-flottante/bp-flottante`, `fiches-cee/{residentiel,transport}`.
- **À ne pas fusionner** : les pages secteurs tertiaire, collectivités, habitat collectif et agriculture. La demande existe (décret tertiaire, éclairage public, copropriété) : il faut les retitrer.

**D. Écarts de vocabulaire, sur des pages DÉJÀ indexées (applicables tout de suite)** :

| Page | Terme absent du title ou du H1 | Volume |
|---|---|---|
| `/dispositifs/obliges/` | délégataire, mandataire CEE | 720 + 480 |
| `/dispositifs/calcul-prime/` | simulation / simulateur prime CEE | 590 + 480 |
| `/dispositifs/fiches-cee/` | fiche(s) standardisée(s) | 390 |
| hub `/expertises/vmc-double-flux/` | CTA double flux | 720 |
| hub `/expertises/air-comprime/` | compresseur, centrale d'air comprimé | 590 + 390 |
| hub `/expertises/isolation-thermique/` | calorifugeage | 2 900 (attention à la concurrence avec les sites du portefeuille) |
| `/dispositifs/legislation/` | 6e période (P6) | 170 |

## 7 bis. Indexation complète et formulaires

Indexation par type de page (sitemap × listes GSC du 12/11 ; « indexée » = ni détectée, ni explorée non indexée) :

| Type | Pages | Détectée, jamais explorée | Explorée, non indexée | Indexée |
|---|---|---|---|---|
| Accueil, hub `/expertises/`, 8 hubs techno | 10 | 0 | 0 | **10** |
| Dispositifs (dont hub fiches-cee) | 11 | 0 | 0 | **11** |
| Institutionnel (contact, diagnostic, qui-sommes-nous, parcours) | 4 | 0 | 0 | **4** |
| Techno × FAQ / tarifs / prime CEE | 23 | 9 | 12 | 2 |
| Techno × secteur | 22 | 15 | 5 | 2 |
| Techno × autre (HP flottante, BP, planchers, combles, réseau…) | 7 | 4 | 3 | 0 |
| Secteurs | 7 | 4 | 1 | 2 |
| Fiches CEE par secteur | 5 | 5 | 0 | 0 |
| **Total** | **89** | **37** | **21** | **31** |

Lecture :
- **37 « détectées, jamais explorées »** : le compteur reste figé à 37 du 14/08 au 09/11. C'est la signature de L21 : Google n'a jamais téléchargé ces pages, il n'a donc pas pu juger leur contenu. Les liens internes sont en place : `vmc-double-flux/tertiaire` reçoit des liens de 12 pages, `gtb-gtc/tarifs` de 9, `fiches-cee/tertiaire` de 7. Ce qui manque, c'est le **volume d'exploration** d'un domaine de 4 mois sans lien externe.
- **21 « explorées, non indexées »** : Google les a refusées les 22/09 et 05/10, après des crawls d'août et de septembre, donc sur la version **d'avant** les corrections du 10/10. Seule `gtb-gtc/faq` a été relue après (le 20/10). La sortie d'index coïncide avec la fenêtre du spam update de septembre (24/09 → 08/10) et ne touche qu'une seule famille de pages. Bing n'a pas bougé. L'imputation à l'update reste **probable, sans certitude** : la première marche (22/09) précède de 2 jours le début annoncé.
- **Contre-test Bing (L73, L64)** : 19 pages refusées par Google sont dans le top 10 Bing, ce qui interdit de les supprimer ou de les fusionner aujourd'hui.

Formulaires : non retestés (voir limites).

## 8. Technique

Échantillon de 5 pages non indexées contrôlé en production : HTTP 200, `<meta name="robots" content="index, follow">`, canonical autoréférent, 1 500 à 2 700 mots, Googlebot servi en 200. Sitemap de 89 URL, Last-Modified au 10/10. **Rien de technique n'explique la non-indexation.**

## 9. Contre-test Bing

| | Google | Bing |
|---|---|---|
| Pages indexées | 31/89 | 89/89 (`Bing_Crawl.csv`, 19/11) |
| Avant → après le 10/10 | clics stables | clics +62 % |
| Part de la marque dans les clics ventilés | 117/119 (requêtes visibles, 3 m) | 21/49 (3 m) |
| Pages non indexées par Google qui ont des impressions | 0 | 19 pages, 253 impressions, 7 clics (3 m) |

Bing confirme que la cause est propre à Google (indexation), pas à la demande ni au contenu.

## 10. Dangers et alertes

| Danger | Test | Résultat |
|---|---|---|
| Chute d'indexation | trajectoire 14/08 → 09/11 | **55 → 33, concentrée sur les sous-pages** |
| Fiches supprimées présentées comme actives en production | `curl` sur `/dispositifs/fiches-cee/industrie/` | **IND-UT-104 encore servie** (supprimée le 29/10) ; correction prête en local (⏳ 07/11) |
| Fichiers de travail servis en production | pas testé cette session (testé le 10/10 : RAS) | — |
| Erreurs 404 / 5xx | export Indexation : aucun motif 404 ou 5xx | RAS |
| Cannibalisation | prix du kWh cumac : `kwh-cumac` (25,3) et `barometre-prix-cee` (37,4) ; le title du baromètre contient « (kWh cumac) » | **hypothèse** : pas de croisement requête × page côté Google |
| Contenu produit en série | 64 sous-pages déclinées, 9 % indexées | **risque réel** : signature L07/L64 ; c'est le gabarit que Google refuse |

**Ce qui n'est PAS en cause (vérifié)** : robots, `noindex`, canonical, codes HTTP, sitemap, maillage interne (≥ 7 pages liantes par page cible), demande (Bing classe ces pages).

## 11. Suivi des actions de la session précédente

| ID | État au 20/11 | Preuve | Effet mesuré | Décision |
|---|---|---|---|---|
| -01 déployer HEAD | ✅ 10/10 | Last-Modified 10/10 12:13 GMT ; md5 non recalculé | — | clore |
| -02 baromètre | ✅ 10/10 | déployé avec `e9b53a5` | page : 10,5 → 9,6 impressions/jour, position 37,4 | clore ; le title reste à revoir (cf. -03 bis) |
| -03 convertisseur kWh cumac | ⏸️ | — | territoire n° 1 : 895 impressions Google, position 48 | **reformuler** → 2026-11-20-04 |
| -05 IndexNow + lastmod | 🔄 | `lastmod` et clé en ligne ; ping non vérifié | Bing : pas de pic d'exploration après le 10/10 | garder : lancer `npm run indexnow` à chaque déploiement |
| -06 HP/BP | ✅ déployé | BAT-TH-134 ×17 sur `prime-cee` en prod | sous-pages non indexées Google ; Bing : `hp-bp-flottante/prime-cee` en position 8 | effet bloqué par l'indexation → 2026-11-20-01 |
| -07 VMC | ✅ déployé | — | hub : « vmc double flux tertiaire » 23,5 → 13,3 | amélioration probable ; `tertiaire` non indexée |
| -08 GTB classes | ✅ déployé | — | « gtb classe c » 4 impressions en 28 j : non mesurable | re-contrôle 10/12 |
| -09 prix GTB | ✅ déployé | — | `gtb-gtc/tarifs` : Bing 4 clics, position 3,7 ; Google : jamais explorée | → 2026-11-20-01 |
| -10 CEE GTB / usine | ✅ déployé | — | « cee gtb » 57,5 → 25,0 (2 impressions en B) ; `gtb-gtc/industrie` écartée (crawl du 03/08) | → 2026-11-20-01 |
| -11 VMC tertiaire / industrie | ✅ déployé | — | « vmc double flux industrielle » 16,0 → 11,8 (hub) | les sous-pages ne sont pas indexées |
| -12 destrat / variateur | ✅ déployé | — | « destratificateur tertiaire » 25,3 → 71,2 (4 impressions, non significatif) | re-contrôle |
| -13 air comprimé | ⏸️ | — | seul le hub est indexé (position 50,8) ; `industrie` jamais explorée | le hub est de fait la cible ; ne rien changer |
| -14 prime CEE générique | 🔄 | — | « prime cee » : 1 impression | garder (horizon long) |
| -15 audit des fiches | ✅ déployé, puis lot ⏳ du 07/11 | — | Bing : `fiches-cee/agriculture` 4 clics | clore ; le lot du 07/11 part au prochain déploiement |
| -16 maillage | ✅ déployé | 7 à 12 pages liantes | aucune exploration nouvelle en 30 j | clore ; insuffisant seul |
| -17 Search Console | **✅ propriété créée** (export du 12/11) | export manuel | — | **reformuler** → 2026-11-20-02 (accès API) |
| -18 signaux externes | ⏳ | aucune preuve | — | **remonter en P1** (2026-11-20-03) : seul levier connu du volume d'exploration |

## 12 bis. Catalogue d'améliorations par type

**1. Corrections**
- C1 · `/dispositifs/fiches-cee/industrie/`, `/agriculture/`, `/secteurs/{agriculture,industrie,logistique}/`, `pompe-a-chaleur/industrie` · 8 fiches supprimées le 29/10 encore servies (curl) · déjà corrigées en local (⏳ 07/11), partent au prochain déploiement · 0 · `curl … | grep -c IND-UT-104` = 0
- C2 · `/dispositifs/barometre-prix-cee/` · cours d'octobre ; nous sommes le 20/11 · cours de novembre (EMMY) avant le prochain déploiement · 20 min · date du cours = mois − 1

**2. Quick wins**
- Q1 · `/dispositifs/kwh-cumac/` · « prix kwh cumac » et ses variantes : ~650 impressions en position 27 à 64 ; le title ne contient ni « prix » ni « euros » · title « kWh cumac : définition, prix en euros et conversion » (52 caractères) + H2 « Prix du kWh cumac aujourd'hui » · 20 min · position < 25 sur « prix kwh cumac »
- Q2 · `/dispositifs/faq/` · « faq cee » + « question(s) réponse(s) cee » + « faq pncee » : 539 impressions en position 8 à 10, 1 clic · title « FAQ CEE : questions-réponses sur les certificats d'économies » (60 caractères) · 10 min · CTR > 1 %
- Q3 · `/dispositifs/obliges/` · « obligés cee » 166 impressions en position 16 ; « liste (des) obligés cee » 35 impressions en position 20 ; la page ne contient aucune liste · H2 « Liste des principaux obligés CEE », à partir de la source officielle (DGEC / registre EMMY), sans liste inventée · 45 min · position < 12
- Q5 · `/dispositifs/calcul-prime/` · « simulation / simulateur prime cee » (1 070 de volume) absent du title · ajouter « simulation » au title · 5 min · impressions de la page
- Q6 · `/dispositifs/fiches-cee/`, hubs VMC et air comprimé, `/dispositifs/legislation/` · écarts de vocabulaire (§6 ter D) · retitrage · 20 min · impressions des hubs
- Q4 · `/dispositifs/barometre-prix-cee/` · title « … (kWh cumac) » concurrent de `kwh-cumac` sur le prix · retirer « (kWh cumac) » du title au profit de « €/MWhc » · 5 min · une seule page du site sur « prix kwh cumac » (à vérifier dès l'accès API)

**3. Retravail de page** : rien tant que les pages ne sont pas relues. Les 19 pages refusées l'ont été sur une version déjà corrigée depuis (vérifié par `lastCrawlTime` < 10/10).

**4. Améliorations de fond**
- F1 · `/dispositifs/kwh-cumac/` · territoire n° 1, 448 impressions par page · convertisseur d'unités kWh → MWh → GWh cumac, avec la valeur de marché affichée comme telle (« cours du marché, pas le montant reversé au bénéficiaire »). Cela lève le blocage de -03 · 2 h · ≥ 3 clics Google par mois
- F2 · hors site · 0 lien externe connu · signaux externes (-18) : Google Business Profile, LinkedIn de l'entreprise, partenaires installateurs et fabricants, annuaires CEE · au fil de l'eau · domaines référents (Bing → Backlinks)

- F3 · `/secteurs/tertiaire/` · décret tertiaire, 13 900 de volume, 0 impression (§6 ter B1) · réaffecter la page au décret tertiaire, **après le 10/12** et seulement si l'indexation repart · 2 h · impressions « décret tertiaire »

**5. Architecture** : candidates à la fusion listées au §6 ter C. Aucune fusion ni 301 tant que Google n'a pas relu les pages (la condition de 7.1, « explorée non indexée sur la version actuelle », n'est pas remplie). À rouvrir au 10/02/2027 si les déclinaisons techno × secteur sans demande Bing restent refusées après relecture.

**6. Indexation**
- I1 · 19 pages explorées, non indexées (version d'avant le 10/10) + 37 détectées · demandes d'indexation manuelles, par ordre de demande (2026-11-20-01)
- I2 · propriété GSC · donner l'accès à un compte connecté au skill → URL Inspection API sur les 89 URL, `Requetes_x_Pages.csv` (2026-11-20-02)

**7. Conversion** : rien de détecté (formulaires corrigés et testés le 04/10, déployés le 10/10 ; pas de nouveau test cette session).

## 12. Plan d'action de cette session

| ID | Prio | Action | Effort | Indicateur | Re-contrôle |
|---|---|---|---|---|---|
| 2026-11-20-01 | 🔴 P0 | **Demandes d'indexation dans GSC** (Inspection de l'URL → Demander l'indexation, ~10 par jour). Jour 1, pages déjà corrigées et en ligne : `vmc-double-flux/tertiaire`, `gtb-gtc/tarifs`, `hp-bp-flottante/hp-flottante`, `hp-bp-flottante/prime-cee`, `vmc-double-flux/industrie`, `destratificateur/tertiaire`, `isolation-thermique/planchers`, `gtb-gtc/prime-cee`, `fiches-cee/tertiaire`, `gtb-gtc/industrie`. Jour 2 : `destratificateur/tarifs`, `destratificateur/prime-cee`, `variateur-de-vitesse/tarifs`, `variateur-de-vitesse/prime-cee`, `isolation-thermique/prime-cee`, `air-comprime/reseau`, `pompe-a-chaleur/prime-cee`, `pompe-a-chaleur/tertiaire`, `vmc-double-flux/prime-cee`, `hp-bp-flottante/faq`. **Attendre le prochain déploiement** pour les pages du lot du 07/11 (`fiches-cee/industrie`, `fiches-cee/agriculture`, `secteurs/agriculture`), sinon Google lira les fiches supprimées | 15 min/jour pendant 2 jours | pages indexées ≥ 45 au 10/12 (export Indexation) | 10/12 |
| 2026-11-20-02 | 🔴 P0 | **Accès API Google** : GSC → Paramètres → Utilisateurs et autorisations → ajouter un des comptes Google connectés au skill avec l'accès « Complet », puis `gsc_fetch.py --site oteria-conseil.fr`. Débloque l'URL Inspection de tout le sitemap, le croisement requête × page (cannibalisation du kWh cumac, -13) et la période A pour la prochaine session. En plus : exporter « Statistiques sur l'exploration » | 5 min | `gsc_fetch.py --list` affiche oteria-conseil.fr | prochaine session |
| 2026-11-20-03 | 🟠 P1 | **Signaux externes (-18 remontée)** : fiche Google Business Profile, page LinkedIn de l'entreprise avec lien, 3 à 5 liens de partenaires réels. C'est le seul levier connu du volume d'exploration d'un domaine jeune | au fil de l'eau | ≥ 3 domaines référents au 10/01 | 10/01/2027 |
| 2026-11-20-04 | 🟠 P1 (3 bis) | **kWh cumac, territoire n° 1** : Q1 (title et H2 « prix »), Q4 (désambiguïser le baromètre), puis F1 (convertisseur d'unités, valeur de marché affichée comme telle) | 20 min + 2 h | « prix kwh cumac » < 25 ; ≥ 3 clics/mois sur la page | 15/01/2027 |
| 2026-11-20-05 | 🟡 P2 | Q2 (title FAQ), Q3 (liste officielle des obligés, avec « délégataires et mandataires » dans le title) et retitrages des pages indexées Q5-Q6 (§6 ter D) | 1 h 30 | CTR FAQ > 1 % ; « obligés cee » < 12 | 15/01/2027 |
| 2026-11-20-06 | 🟡 P2 | **IndexNow** : `npm run indexnow` juste après chaque upload (vérifier que le script soumet bien les 89 URL) | 2 min | `Bing_Crawl.csv` : pic d'exploration dans les 3 jours | prochain déploiement |

À quoi s'attendre dans GSC après 01 : le compteur « Détectée » baisse avant celui des pages indexées (les pages passent d'abord par « Explorée »). Un passage temporaire de « détectée » à « explorée, non indexée » est normal.

### Ne pas toucher
- **Aucune suppression, fusion, 301 ni `noindex` sur les sous-pages** avant le 10/02/2027 : Bing en classe 19 dans le top 10 (L64), et Google ne les a pas relues depuis les corrections.
- **Aucune nouvelle page** dans les silos d'expertise : Google n'indexe déjà pas les sous-pages existantes.
- **« formation gtb gtc »** (108 impressions, position 42) : le seuil de réouverture fixé le 10/10 (≥ 10 impressions par trimestre) est franchi, mais l'offre n'existe pas. Pas de page, sauf si Oteria propose une formation.
- Hubs et pages dispositifs : indexés et en progression, ne pas changer leurs URL.

### Vérifications à faire dans GSC (10 min)
1. Inspection de l'URL de `vmc-double-flux/tertiaire` : sitemap « lu le » (date), page « découverte via » ?
2. Paramètres → Statistiques sur l'exploration : requêtes par jour, part de « découverte ».
3. Sitemaps : `sitemap-index.xml` soumis et état « Opération réussie » ?
4. Sécurité et actions manuelles : RAS ?

## 13. Journal d'itération

- **Passe 1** : hypothèses sur le plat de Google après le 10/10. H1 : les quickwins n'ont pas porté (contenu insuffisant). H2 : les pages ciblées ne sont pas lues par Google (indexation). H3 : effet trop tôt (< 6 semaines).
- **Passe 2 (tests)** : listes d'URL par motif × sitemap → 58/64 sous-pages hors index, 0/25 pages de premier niveau ; `lastCrawlTime` des 21 pages écartées < 10/10 sauf une ; contrôle technique en production RAS ; Bing page par page : 19 pages refusées par Google dans le top 10 Bing. **H2 confirmée, H1 infirmée** (Bing valide le contenu), **H3 partielle** (vraie pour Google, fausse pour Bing, où l'effet est déjà mesurable).
- **Passe 3 (révision)** : le verdict « les optis n'ont pas marché » est remplacé par « les optis marchent là où elles sont lues (Bing, hubs Google) et sont bloquées par l'indexation ailleurs ». Une erreur de lecture du fichier (ligne fusionnée en fin de CSV) cachait `fiches-cee/agriculture` parmi les non-indexées : corrigée, total 58.
- **Passe 4 (contre-vérification et angle mort)** : (1) le plan ne parle-t-il que du dernier lot ? Non : 04 sort de l'inventaire 3 bis (kWh cumac, déjà premier territoire le 10/10), 03 vise le crawl. (2) Un classement sur une seule dimension ? Les silos d'expertise ne sont pas jugés « sans demande » : leurs pages ne sont pas indexées, ce n'est pas une mesure de la demande. (3) Un verdict de fermeture ? Aucun. (4) Sans la mise à jour du 10/10, que recommanderais-je ? La même chose : indexation, kWh cumac, signaux externes. Le plan n'est donc pas un simple rapport d'impact.

## 14. Ce qu'il faut retenir

1. Les optimisations du 10/10 sont **en ligne et efficaces dans Bing** (+62 % de clics). Dans Google, elles sont **invisibles** parce que les pages ciblées ne sont pas indexées.
2. Le problème du site n'est pas le contenu, c'est **l'indexation des sous-pages**. Le remède : demandes d'indexation, accès API, liens externes. Pas de nouvelles pages.
3. Le premier gisement hors marque reste le **prix du kWh cumac**, à traiter sur la page existante.

Prochain contrôle : **10/12/2026**, avec l'export Indexation (ou l'API si 02 est fait) et `bing_fetch.py --window 28j --window 3m`.
