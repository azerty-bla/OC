# Gate : Mise en ligne d'un lot (release)

A passer une fois toutes les pages du batch `completed`, **avant** EXIT_SIGNAL et avant tout deploiement.

## Script (verite terrain)

```
node .seo-engine/scripts/audit-spam.js --config .seo-engine/config.json --root .
```
Rapport : `docs/AUDIT-SPAM.md`.

- [ ] `near_duplicates` : aucune paire de pages au-dela de `spam.max_body_similarity` (brut ou « a entite pres »)
- [ ] `same_outline` : aucune paire de pages avec plus de `spam.max_outline_similarity` de H2 identiques a entite pres ET un texte similaire (au-dela de `spam.warn_body_similarity`) ; un meme plan avec des textes propres est une simple alerte (fiches d'une meme serie)
- [ ] `faq_recycled` : aucune question de FAQ sur plus de `spam.max_faq_repeat` pages
- [ ] `fake_freshness` : aucun commit recent (depuis `spam.last_release`) qui ne change que des dates de mise a jour ; un commit examine et justifie va dans `spam.freshness_ignore_commits`
- [ ] `unverified_authors` : aucune fiche auteur publiee pour une identite non verifiee
- [ ] `trust_pages` : pages de confiance publiees (`seo.trust_pages`) ; une page qui explique comment les contenus sont produits est recommandee (alerte si absente)
- [ ] `links_to_drafts` : aucune page publiee ne lie une page non publiee (`draft` / noindex) ni une page planifiee (`state/planned-urls.json`) jamais produite
- [ ] `deceptive_code` : aucun cloaking, redirection conditionnelle, back button hijacking, meta refresh
- [ ] `related_sites` : aucun lien ni mention des sites lies du portefeuille

## Alertes a arbitrer (non bloquantes, a justifier dans le rapport de lot)

- `release_volume` : plus de `spam.max_pages_per_release` pages publiees d'un coup → etaler (pages restantes en `draft: true`)
- `title_templates` : 4 pages ou plus dont le title suit le meme gabarit → varier les formulations
- `thin_pages` : pages editoriales sous `spam.min_words_money_page` mots → enrichir, fusionner ou passer en draft

## En cas d'echec

Corriger la cause (reecrire, fusionner, differencier) ou retirer la page du lot : `draft: true` (Astro) ou `<meta name="robots" content="noindex">` + retrait du sitemap (HTML), et retrait des liens entrants. Apres la mise en ligne, renseigner `spam.last_release` (date du jour) pour que le controle de fraicheur reparte de cette date. **Ne jamais** contourner un controle en modifiant les seuils de `config.json` sans validation humaine.
