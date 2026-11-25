# Journal SEO — oteria-conseil.fr

## 2026-11-20 — premier bilan Google (export GSC du 12/11) + Bing 134 j (rapport : `RAPPORT-SEO-2026-11-20.md`)
- **Données** : GSC export manuel du 12/11 (3 m 11/08→10/11, 28 j, Indexation + listes d'URL), copié tel quel dans `data-seo/gsc-2026-11-12/` ; Bing API 08/07→19/11 (`bing-api-2026-11-20-*`). Pas d'accès API Google (aucun compte connecté ne détient la propriété).
- **Mise en production** : `e9b53a5` en ligne le 10/10 12:13 GMT (Last-Modified). Lot du 07/11 (arrêté du 26/10) **non en ligne** : IND-UT-104 encore servie.
- **KPI** : Google 28 j 73 clics · 3 801 impr. · position 16,8 · marque 38/39 clics des requêtes visibles ; avant/après 10/10 (27 j) clics 67 → 67, impr. +7 % ; **indexation 55 (14/08) → 33 (09/11)** ; Bing 28 j 32 clics · 883 impr., avant/après +62 % clics ; index Bing 89/89.
- **Verdict** : Google n'indexe que les pages de premier niveau (25/25) et 6/64 sous-pages (37 jamais explorées, 21 écartées les 22/09 et 05/10 sur leur version d'avant correction). Les optis du 10/10 marchent là où elles sont lues (Bing +62 %, hub VMC 23,5 → 13,3) et sont invisibles ailleurs dans Google.
- **Causes retenues** : volume de crawl insuffisant d'un domaine jeune sans lien (certain pour les 37 « détectées », plateau plat 3 mois, maillage OK) ; jugement sur version erronée pour les 21 écartées (probable, `lastCrawlTime` < 10/10) ; coïncidence avec le spam update de septembre (probable, non imputable avec certitude).
- **Actions décidées** : 2026-11-20-01 (demandes d'indexation, P0), -02 (accès API GSC, P0), -03 (signaux externes, P1), -04 (kWh cumac, P1), -05 (FAQ + obligés, P2), -06 (IndexNow, P2).
- **Ne pas toucher** : aucune suppression/fusion/301/noindex de sous-pages ni nouvelle page de silo avant le 10/02/2027 ; formation GTB (seuil franchi, offre inexistante).
- **Prochain contrôle** : 2026-12-10 — export Indexation (ou API) + `bing_fetch.py --window 28j --window 3m` ; attendu : indexées ≥ 45, « détectée » < 30.
- **KPI JSON** : `{"date":"2026-11-20","source":"gsc+bing","gsc_window":"28j","clics":73,"impressions":3801,"position":16.8,"indexees":33,"non_indexees":60,"sous_pages_indexees":"6/64","bing_clics_28j":32,"bing_impr_28j":883,"index_bing":89,"prepost_gsc_clics":[67,67],"prepost_bing_clics":[16,26]}`

### Suivi (à remplir le 2026-12-10)

## 2026-10-10 — bilan Bing 94 j, point zéro (rapport : `RAPPORT-SEO-2026-10-10.md`)
- **Données** : Bing uniquement (`bing-api-2026-10-10-6m`, `-3m` identiques), 08/07 → 09/10/2026. Pas de GSC. Pas de période A.
- **Mise en production réelle** : build du 30/07/2026 (md5 accueil = `dist/` local ; favicon `last-modified` 30/07). Correctifs formulaires du 04/10 **non en ligne**.
- **KPI** : Bing 23 clics · 535 impressions · 127 requêtes · 29 pages vues sur 89 · index Bing 82/89 au 03/10 · marque 17 clics sur 23 · impressions hebdo 13 (S34) → 124 (S39).
- **Verdict** : démarrage normal d'un site neuf porté par l'indexation ; hors marque naissant, premier gisement = kWh cumac.
- **Causes retenues** : hausse des impressions = indexation (certain, courbe InIndex) ; silos d'expertise muets = trop tôt (probable).
- **Actions décidées** : 2026-10-10-01 (déploiement HEAD, P0), -02 (baromètre périmé, P0), -03 (convertisseur kWh cumac, P1), -04 (HP flottante × détendeur, P2), -05 (IndexNow + lastmod, P2).
- **Ne pas toucher** : silos d'expertise jusqu'au 10/12 ; pas de page formation GTB.
- **Prochain contrôle** : 2026-11-10 — `bing_fetch.py --window 28j --window 3m` ; attendu : `kwh-cumac` ≥ 3 clics/mois si -03 déployé.
- **KPI JSON** : `{"date":"2026-10-10","source":"bing","clics":23,"impressions":535,"requetes":127,"pages_vues":29,"pages_sitemap":89,"index_bing":82,"clics_marque":17}`

## 2026-10-10 (suite) — quickwins de l'utilisateur (17 mots clés Google et Bing)
- **Confronté à Bing** : la GTB (classes et prix) concorde nettement. Destratificateur et HP flottante : même thème, mais Bing montre des requêtes différentes. VMC, variateur, air comprimé, « gtb usine », « cee gtb » : aucune donnée Bing. Les positions Google (« hpbp position 8 ») viennent de l'utilisateur, non vérifiables ici.
- **Erreurs trouvées** : HP/BP flottante cite des fiches « IND-FR / BAT-FR » inexistantes (vraies fiches : BAT-TH-134, IND-UT-116, BAT-TH-145, IND-UT-115) ; la page prime VMC cite RES-EC-104, qui est l'éclairage extérieur (bonne fiche : BAR-TH-125) ; 4 titles datés de 2024.
- **Actions** : 2026-10-10-06 à -14 (cf. plan). -04 est intégrée à -06.

## 2026-10-10 (itération du plan des quickwins, à la demande de l'utilisateur)
- **Contrôles effectués** : liste officielle des fiches (ecologie.gouv.fr) comparée aux 90 codes cités sur le site ; liens entrants dans `<main>` des 18 pages cibles ; schema, dates et mentions de 2024 ; contenu actuel des pages GTB hub et tarifs ; section fiches des pages HP/BP prime et VMC industrie ; longueur des titles proposés.
- **Changements de verdict** :
  - -08 : nouvelle page classes → **renforcer le hub** (le hub vise déjà les classes, avec tableau et H3 classe C ; une nouvelle URL partirait de zéro).
  - -09 : rétrogradée en 🟡 (grille et exemples déjà présents ; FAQPage retiré, sans effet dans Google ; « 0 clic sur 11 impressions » n'est pas significatif).
  - -13 : passée en conditionnelle (dépend de l'URL classée dans Google).
- **Ajouts** :
  - -15 : audit des fiches. Au moins 23 codes inexistants ou abrogés, environ 30 intitulés faux, catalogue agriculture presque entièrement faux.
  - -16 : maillage. Les sous-pages cibles ont 2 à 5 liens entrants.
  - -17 : Search Console, à décider par l'utilisateur.
  - -18 : signaux externes.
  - -05 étendue (date réelle de mise à jour visible et en `dateModified`).
- **Confirmés sans changement** : -06 (étendue à 6 fiches dont AGRI-UT-103/104), -07, -10 (BAT-TH-116 v A62-6 en vigueur), -11 (+ erreurs IND-BA-110 et montant de 38 k€), -12, -14.
- **Titles proposés** : tous ≤ 60 caractères.

## 2026-10-10 (exécution du plan des quickwins, local, non déployé)
- **Fait** : -05 (sauf le ping IndexNow), -06 à -12, -15, -16 ; -14 en partie. Build OK (91 pages), JSON-LD valide, 1 seul H1 par page, aucun title de plus de 60 caractères.
- **Source de vérité des fiches** : `../referentiel-cee/fiches-cee.json` et `audit-site.py`. La page du ministère est en retard sur les abrogations : AGRI-TH-117/119 abrogées le 03/06/2026, AGRI-EQ-108/112 le 24/06/2026. Audit final : 0 code inexistant, 0 abrogée active sur les pages publiées (9 restent dans `ARCHITECTURE.md` et `sujets-blog/`, non publiés).
- **Erreurs de fond corrigées au-delà du plan** :
  - montants de prime surévalués presque partout (facteur 2 à 15), recalculés sur les forfaits officiels au cours de 8,7 €/MWhc ;
  - destratificateur : exclusion des entrepôts et locaux de stockage depuis le 01/08/2025 (y compris sur la page secteur logistique) ;
  - BACS : 70 kW au 01/01/2030 (décret n° 2025-1343) et non 2027 ;
  - décret BACS = classe C (et non B) ;
  - BAT-EN-101 : R ≥ 6 ;
  - VMC : rendement de 75 % et non 85 % ;
  - fiches IND appliquées au tertiaire sur les pages air comprimé.
- **Laissé en l'état (non vérifié)** : coefficients Coup de pouce et dates des PAC (BAT-TH-163/164) ; « 19 ans d'expertise » (affirmation de l'entreprise, 10 occurrences) ; chiffres d'économies génériques (« 10 à 25 % » pour la HP flottante, etc.).
- **Les deux vagues partent ensemble** : pas d'attribution action par action possible.

### Suivi (rempli le 2026-11-20)
- Déployé le 10/10 12:13 GMT (vagues 1 et 2 + -01, -02, -05). Bing : clics 16 → 26 (+62 %) sur 27 j ; `gtb-gtc/tarifs` 4 clics position 3,7 ; `fiches-cee/agriculture` 4 clics. Google : clics stables (67 → 67) ; hub VMC « vmc double flux tertiaire » 23,5 → 13,3.
- **Angle mort de cette session** : le plan a visé des sous-pages que Google n'avait jamais explorées (37) ou déjà écartées (21) — invisible sans GSC. Les quickwins ne pouvaient agir dans Google que sur les hubs.
- -03 toujours en pause, reformulée en 2026-11-20-04 ; -17 faite (propriété) ; -18 non commencée, remontée en P1.

### 2026-11-23 — Retours d'Oteria Conseil sur l'artefact de revue (10 notes)
- CORRECTION (relecteur Oteria) : H1/intro mandataire-cee et financement-operations repositionnés (Oteria Conseil mandataire, montage financier avec CEE comme 1er levier) ; rôle bénéficiaire + installateur déplacé en tête ; « Deux exemples » au lieu de « Deux cas » ; FAQ « dépose elle-même » supprimée ; FAQ préfinancement réécrite (côté installateur) ; menu « Opérations CEE » / « Le dispositif CEE ».
- DÉCISION : « viser » (décret BACS) non modifié, phrase correcte. Encart 100 % retiré de /expertises/isolation-thermique/exterieur/ (BAT-EN-102 H1 4 800 kWhc/m² ≈ 42 €/m², incompatible avec 100 % d'une ITE).
- CHANGEMENT : nav desktop passée de md à lg (libellés plus longs). Side-car financement-operations : calcul « 100 % » déclaré comme condition commerciale du propriétaire. Validateurs : writing (déballé), language, facts OK.
- À arbitrer : fils d'Ariane « Expertises »/« Dispositifs CEE », engagements côté installateur à confirmer, mention « hors ITE » sur les autres encarts isolation.
- 2026-11-23 (suite) CORRECTION (utilisateur) : « gratuitement pour elle » retiré de l'intro mandataire-cee. CHANGEMENT : ITE — encadré « le financement CEE ne peut couvrir qu'une partie du coût de l'opération » ; encarts isolation Financement100 — note « Hors isolation des murs par l'extérieur ». Artefact : boutons Valider/commentaire (collection `validations`), fiche 11 = question fil d'Ariane posée à Oteria Conseil.
