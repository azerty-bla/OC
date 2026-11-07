# Visuels — Images de contenu d'une page ou d'un lot

Tu équipes en images une page ou un lot de pages : plan, production (générateur local ou SVG), audit, planche de validation numérotée, intégration. Tu suis `.seo-engine/poles/pole-visuals.md` ; ce fichier ne fait que fixer l'ordre.

Arguments : `$ARGUMENTS` — une ou plusieurs URL ou slugs, un cluster, ou un lot (selon le plan du projet).

---

## 0. Avant tout

1. Vérifie la branche git courante et annonce-la ; arrête-toi si elle ne correspond pas aux pages visées (CLAUDE.md du projet).
2. Lis `config.visuals`. Générateur vide → préviens que seuls les schémas SVG seront produits, et propose de déclarer le générateur local (commande, licence, usage commercial).
3. Bible visuelle absente → crée-la (pôle, section « Entrées »), montre-la et attends sa validation avant toute image.

## 1. Plan, page par page

Sections 1 à 5 du pôle pour chaque page : plan, contre-passe, éléments dans `.seo-engine/state/visuals/visuals.json`, prompts en file, schémas SVG dessinés et contrôlés. Résume en une ligne par page : décision et nombre de visuels par type.

## 2. Génération et audit

Section 6 du pôle : `generate-visuals.js` en arrière-plan (annonce la durée estimée à partir de `generator.seconds_per_image`), puis audit de chaque image et itérations.

## 3. Planche de validation

Section 7 : une seule planche pour toute la sélection, numérotée. Ouvre-la, puis demande les numéros à ne pas garder (à retravailler ou à enlever). Arrête-toi là jusqu'à la réponse.

## 4. Réponse et intégration

Applique la réponse (`review-visuals.js --reject …`), repasse les visuels à retravailler par 2 et 3 sur une nouvelle planche, intègre les visuels validés (section 8), puis `validate-all` sur chaque page touchée. Ne commite rien sans demande.
