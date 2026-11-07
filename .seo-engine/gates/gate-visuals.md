# Gate : Visuels

Deux passages : après le plan (phase `visuals` d'une page), puis avant intégration (mission `visuals`).

## Après le plan

- [ ] La bible visuelle du site existe et a été validée par l'utilisateur
- [ ] `visuals.decision` vaut `none` ou `planned`, avec `visuals.rationale` en une ligne (`none` justifié est un PASS)
- [ ] La contre-passe a été faite : aucun doublon dans la page, réutilisation vérifiée dans `visuals.json`
- [ ] Chaque élément cite un `criterion` et ne tombe sous aucune exclusion du pôle
- [ ] Texte, chiffres et proportions sont en `schema` (SVG), jamais en image générée
- [ ] Chaque élément a `purpose`, `alt`, `slot` (sauf hero et `og`), `must_show`
- [ ] Prompts : en anglais, descriptions canoniques de la bible, aucune comparaison de taille, aucune marque
- [ ] Schémas : chaque chiffre est dans la page ou dans `research.verified_facts` ; rendu contrôlé à 1200 et 360 px

## Avant intégration

- [ ] Chaque élément généré est `ready` (score ≥ `min_score`), `failed` avec motif, ou `to-source`
- [ ] La planche numérotée a été soumise et la réponse de l'utilisateur appliquée (`review-visuals.js --reject`)
- [ ] Seuls des éléments `approved` sont intégrés
- [ ] `validate-visuals` PASS sur chaque page touchée
- [ ] Aucune mention d'image générée (légende, `alt`, métadonnée)

## En cas d'échec

Plan : retour au pôle visuels avec les critères échoués. Intégration : rien n'est intégré tant que la validation humaine manque.
