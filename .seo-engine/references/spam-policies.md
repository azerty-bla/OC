# Spam policies Google — garde-fous du moteur

Référence de travail pour les pôles strat, copy et audit, et pour les validateurs `validate-spam.js` (page par page) et `audit-spam.js` (site entier, avant chaque mise en ligne de lot).

Les spam updates sont appliquées par SpamBrain : ce sont des effets algorithmiques, pas des pénalités manuelles. Corriger un site ne garantit pas une reprise rapide, et le bénéfice de liens neutralisés ne revient pas. Principe : **prévenir plutôt que corriger**.

## 1. Les règles, et ce que le moteur contrôle

Légende : « page » = `validate-spam.js`, « site » = `audit-spam.js`.

| Règle Google | Ce qui est sanctionné | Contrôle du moteur |
|---|---|---|
| **Scaled content abuse** | Beaucoup de pages sans valeur ajoutée, qu'elles viennent d'une IA, d'un scraping, d'un assemblage ou d'une variation de mots-clés, avec ou sans IA. | **page** : similarité du corps (shingles de 5 mots).<br>**site** : quasi-doublons, y compris quand seul un mot-clé change ; plans H2 identiques ; titles sur le même gabarit ; FAQ recyclées ; volume publié d'un coup. |
| **Doorway abuse** | Pages par ville, statut ou variante qui mènent toutes au même endroit. | **site** : similarité quand seul le mot-clé change, plans identiques, liens vers des brouillons. |
| **Thin affiliation** | Contenu d'affiliation copié ou sur un gabarit identique, sans valeur originale. | **page** : densité de liens partenaires, page monétisée trop courte, données chiffrées, limites exposées, méthodologie liée, divulgation présente (`affiliate_disclosure`). |
| **Link spam** | Liens payants ou d'affiliation sans `rel="sponsored"` ou `nofollow` ; échanges de liens et pages partenaires. | **page** : liens à paramètres d'affiliation non qualifiés ; liens vers les sites liés.<br>**site** : liens vers les sites liés du portefeuille. |
| **Keyword stuffing** | Répétitions, listes de villes ou de numéros. | **page** : bourrage du title et du H1, énumérations de mots-clés (`no_keyword_lists`), en plus de la densité contrôlée par `validate-writing`.<br>**site** : ancres exactes répétées (`exact_anchors`, alerte). |
| **Hidden text & links** | Texte blanc sur blanc, `display:none`, `font-size:0`, texte hors écran. Accordéons, onglets et `sr-only` restent autorisés. | **page** : styles de masquage dans le contenu. |
| **Cloaking / sneaky redirects** | Contenu ou redirection différents pour Googlebot, selon le référent ou selon l'appareil. | **site** : scan du code (`userAgent`, bot, `referrer`, redirection, meta refresh). |
| **Back button hijacking** | Manipuler l'historique pour empêcher le retour arrière. | **site** : `pushState`/`replaceState` combiné à `popstate`. |
| **Scam and fraud** | Se faire passer pour une marque ou son service client. | **page** : formulations d'usurpation. |
| **Site reputation abuse** | Contenu de tiers hébergé pour profiter de l'autorité d'un site. | Règle éditoriale : pas de page sponsorisée rédigée par un tiers ; le contenu est produit et contrôlé par l'éditeur. |
| **Expired domain abuse** | Racheter un domaine expiré pour y publier un autre sujet. | Règle projet : domaine neuf, ou historique vérifié avant usage. |
| **Scraping** | Republier en modifiant à peine. | Pôle research : toujours reformuler et ajouter une analyse ; jamais de copie. |
| **Policy circumvention** | Recommencer sur un sous-domaine ou un autre site. | Règle portefeuille : pas de clonage entre les sites du même éditeur. |

## 2. Signaux de qualité que les spam updates et les core updates croisent

### Contenu utile (« helpful content »)
Signaux d'un contenu pensé d'abord pour le moteur :
- produire beaucoup de pages sur beaucoup de sujets « pour voir ce qui ranke » ;
- recourir massivement à l'automatisation ;
- résumer d'autres sources sans rien apporter ;
- écrire pour atteindre un nombre de mots ;
- promettre une réponse sans la donner ;
- **changer la date d'une page pour la faire paraître fraîche sans modifier le fond** ;
- ajouter ou retirer du contenu seulement pour paraître frais.

Contrôles :
- **site** : `fake_freshness` repère un commit git qui ne modifie que `updatedDate`.
- **page** : `dates_coherent` repère une date dans le futur ou une mise à jour antérieure à la publication.

### Qui, comment, pourquoi (Who / How / Why)
- **Who** : l'auteur doit être évident, avec une signature et une biographie.
  - **site** : une fiche auteur publiée pour une identité non vérifiée est bloquante ; les pages qui créditent un profil non vérifié sont signalées.
- **How** : expliquer comment le contenu est produit (automatisation, IA, méthode de test).
  - **site** : une page publiée qui décrit le mode de production (`process_disclosure_path`) est recommandée ; son absence est une alerte, pas un blocage.
- **Why** : aider le lecteur. Produire avec l'IA « pour manipuler le classement » relève du spam.

### Avis et comparatifs
Consignes de Google (« write high quality reviews » et reviews system) :
- des preuves d'expérience ;
- des **mesures quantitatives** ;
- ce qui distingue l'offre de ses concurrents ;
- **plusieurs vendeurs** ou alternatives ;
- **pourquoi c'est le meilleur, preuves à l'appui** ;
- **avantages et inconvénients** tirés d'une recherche originale ;
- la divulgation de l'affiliation ;
- la qualité compte plus que la longueur.

Contrôles **page** : `review_quantitative`, `review_drawbacks`, `review_ranking_justified`, `experience_claims`. Écrire « nous avons testé » exige une preuve déclarée dans le frontmatter (`experience_proof`) ; sans preuve, il faut décrire les sources réellement consultées.

### Données structurées
- Un avis sur soi-même n'est pas éligible aux étoiles, et est trompeur.
- Pas d'avis inventé ni incité sans le dire.
- Pas d'`AggregateRating` sans avis réels d'utilisateurs.

Contrôles **page** : `no_self_serving_review`, `no_fake_aggregate_rating`.

### SEO programmatique
Des pages générées en série à partir d'un gabarit et d'une liste de variantes mènent souvent à un site jugé spam ou de faible qualité. La perte de confiance vise **le site entier**, pas seulement les pages fautives : une forte proportion de pages faibles fait baisser l'ensemble.

## 3. Règles de production qui en découlent (obligatoires)

1. **Pas plus de pages que la demande réelle ne le justifie.** Une page n'existe que si elle apporte une information que les autres pages du site n'ont pas : calcul, tableau de conditions, cas chiffré, arbre de décision, fait réglementaire. Sinon, on la fusionne avec une autre ou on ne la crée pas.
2. **Pas de pages en série par entité** (ville, statut, marque) sans contenu propre. L'audit la repère quand seul le mot-clé change : même plan, mêmes paragraphes.
3. **Publication étalée** sur un domaine neuf (`max_pages_per_release`). Les pages reportées restent en `draft: true` : ni construites, ni dans le sitemap, ni liées.
4. **Une identité réelle ou rien.** Aucune fiche auteur ni relecteur publiée sans vraie personne. Le gabarit masque les profils non vérifiés (`unverified_people`).
5. **Transparence sur la production** : une page publique décrit le processus (sources, outils, IA éventuelle, relecture, fréquence de mise à jour, politique de correction).
6. **Une vraie mise à jour, ou aucun changement de date.** Changer `updatedDate` exige une modification réelle du contenu, datée dans le changelog si le projet en tient un.
7. **Affiliation** : tous les liens tracés portent `rel="sponsored noopener"`. Au plus environ 4 boutons partenaires pour 1 000 mots. Divulgation visible sur chaque page monétisée. Plusieurs alternatives proposées. Limites de chaque offre exposées.
8. **Aucun lien, identifiant ni gabarit commun entre les sites d'un même portefeuille** (`portfolio.related_sites`).
9. **Aucun code qui traite Googlebot différemment de l'utilisateur**, ni aucune manipulation de l'historique du navigateur.
10. **Aucune FAQ recyclée** : une même question n'apparaît que sur une page du site (`max_faq_repeat: 1`) ; ailleurs, elle est reformulée selon l'angle propre à la page, ou remplacée. Les questions presque identiques (même sens) sont signalées par l'audit.

## 4. Configuration (`config.json` → `spam`)

```json
"spam": {
  "max_body_similarity": 0.35,
  "warn_body_similarity": 0.25,
  "max_outline_similarity": 0.5,
  "max_affiliate_per_1000_words": 4,
  "min_words_money_page": 700,
  "min_numbers_per_1000_words": 8,
  "max_pages_per_release": 40,
  "max_faq_repeat": 1,
  "max_list_items_inline": 12,
  "max_list_items_inline_fail": 20,
  "hidden_text_min_words": 30,
  "unverified_people": [],
  "utility_templates": ["texte", "contact", "auteur", "auteurs", "legal", "utilitaire"],
  "utility_paths": ["^/(mentions-legales|politique-de-confidentialite|confidentialite|cgu|cgv|cookies|contact|merci|plan-du-site|404)(/|$)"],
  "review_templates": ["avis", "classement", "review", "comparison", "best"],
  "templates_with_methodology_link": [],
  "templates_with_disclosure": [],
  "disclosure_in_layout": false,
  "methodology_path": "",
  "built_dir": "",
  "process_disclosure_path": "",
  "forbidden_domains": [],
  "exclude_dirs": [],
  "freshness_window_days": 120,
  "last_release": "",
  "freshness_ignore_commits": []
}
```
- **Sites HTML** : les pages sont les fichiers `.html` du projet, hors dossiers d'outils (`node_modules`, `docs`, `partials`, `includes`, `scss`, `css`, `js`, `img`, `assets`, `hors_prod`, `v1`… et `exclude_dirs`). Title, H1, H2, FAQ (`<summary>`, H3 en question) et noindex (`<meta name="robots">`) sont lus dans le HTML ; le texte comparé est le contenu principal (`<main>`, sinon `<body>` sans en-tête, menu ni pied de page). Les pages utilitaires sont reconnues par leur chemin (`utility_paths`). Pour retirer une page d'un lot : `<meta name="robots" content="noindex">` et retrait du sitemap et des liens entrants.
- **Sites Astro** : collections de `paths.content_dir` + pages statiques de `paths.pages_dir` (routes dynamiques `[x]` exclues). Les pages statiques de plus de 150 mots (hors accueil et pages utilitaires) sont comparées comme les autres ; toutes comptent pour les pages de confiance. Pour retirer une page : `draft: true` (une page en draft reste contrôlée, sauf similarité et minceur).
- **Code trompeur** : `code_dirs` si renseigné ; sinon `src` et `public` (Astro) ou tout le projet hors dépendances (HTML).
- **Fausse fraîcheur** : seuls les commits depuis `last_release` (date de la dernière mise en ligne), sinon des `freshness_window_days` derniers jours, sont examinés ; un commit ne compte que s'il ne change **que** des dates dans tout le dépôt. Un commit examiné et justifié va dans `freshness_ignore_commits`, avec la justification dans le rapport de lot.
- **Mention d'affiliation rendue par le gabarit** : `templates_with_disclosure` ou `disclosure_in_layout: true`, sinon `built_dir` pour vérifier le HTML construit. Sans aucun des trois, l'absence de mention dans la source n'est qu'une alerte.

Les valeurs par défaut sont dans `scripts/spam-utils.js`. `portfolio.related_sites` est lu automatiquement.

## 5. Sources de référence

- Google, Spam policies for Google web search : https://developers.google.com/search/docs/essentials/spam-policies
- Google, Creating helpful, reliable, people-first content : https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google, Guidance on using generative AI content : https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google, How to write high quality reviews : https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews
- Google, Review snippet structured data : https://developers.google.com/search/docs/appearance/structured-data/review-snippet
