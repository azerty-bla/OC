# Regles SEO universelles (maj 2025-2026)

Ces regles s'appliquent a TOUS les projets, quelle que soit la stack ou la thematique.

---

## Meta tags

- **Title** : 50-60 caracteres. Contient le mot-cle primaire, idealement en debut. Unique sur le site.
- **Alignement H1/Title** : Google reecrit les titles dans >30% des cas en utilisant le H1. Le title et le H1 doivent etre coherents (meme mot-cle, formulation proche mais pas identique).
- **Description** : 150-160 caracteres. Contient le mot-cle. Incite au clic (valeur + action). Google l'ignore pour le ranking mais l'utilise pour l'affichage ~40% du temps.
- **Canonical** : auto-referente sur chaque page, pointe vers l'URL propre avec trailing slash coherent.
- **Lang** : defini sur `<html lang="fr">`.
- **Open Graph** : `og:title`, `og:description`, `og:type`, `og:image` sur chaque page.
- **Robots** : utiliser `<meta name="robots">` pour le controle d'indexation. Ne PAS utiliser `noindex` dans robots.txt (directive non officielle que Google peut ignorer).

## Structure Hn

- **Un seul H1 par page**, contient le mot-cle primaire.
- **Pas de saut de niveau** : H1 → H2 → H3. Jamais H1 → H3.
- **H2** : 6-15 par page. Chaque H2 couvre un sous-sujet distinct.
- **H3** : sous-sections facultatives. Utiles pour details, exemples, listes.
- Le mot-cle primaire apparait dans au moins 1 H2.
- Les mots-cles secondaires repartis dans les H2/H3.
- **Featured snippets** : structurer les H2 comme des questions et y repondre dans le paragraphe immediatement apres (2-3 phrases directes).

## Maillage interne

- **Chaque page a minimum 2 liens internes sortants.**
- Pages satellites → lien vers le pillar + 2-3 soeurs.
- Pages pillar → lien vers TOUTES les satellites du cluster.
- **Ancres optimisees** : descriptives, contiennent le mot-cle de la cible. Pas de "cliquez ici", "en savoir plus", "ici".
- **Repartition** : liens places dans le corps du texte, pas regroupes en bas.
- **Regle absolue** : ne JAMAIS linker vers une page qui n'existe pas sur disque.
- **Profondeur max** : chaque page importante accessible en 3 clics max depuis l'accueil.
- **Breadcrumbs** : sur chaque page, avec schema BreadcrumbList.

## Liens externes — Securite

- **`target="_blank"`** : tout lien externe s'ouvre dans un nouvel onglet. L'utilisateur ne doit pas quitter le site involontairement.
- **`rel="noopener noreferrer"`** : obligatoire sur tout lien externe.
  - `noopener` : empeche la page cible d'acceder a `window.opener` (securite).
  - `noreferrer` : empeche la transmission du referrer (vie privee utilisateur).
- **HTML** : `<a href="https://..." target="_blank" rel="noopener noreferrer">texte</a>`.
- **MDX/Markdown** : la syntaxe `[texte](url)` ne supporte pas les attributs. Deux options :
  1. Utiliser la syntaxe HTML `<a>` directement dans le MDX.
  2. Configurer le plugin `rehype-external-links` dans Astro (`target: '_blank'`, `rel: ['noopener', 'noreferrer']`). C'est la methode recommandee pour les projets Astro.
- **Pas de `nofollow` systematique** : reserver `nofollow` aux liens sponsorises (`rel="sponsored"`) ou au contenu genere par les utilisateurs (`rel="ugc"`). Les liens editoriaux vers des sources de qualite transmettent du link juice — c'est voulu.

## Duplicate content

- **Title unique** : aucun title ne doit etre identique a celui d'une autre page du site. Google penalise les titles dupliques.
- **Description unique** : meme regle. Une description dupliquee ne penalise pas le ranking mais gaspille l'opportunite de CTR.
- **H1 unique** : chaque page doit avoir un H1 distinct.
- **Pas de blocs de contenu copie-colle** entre pages. Si deux pages partagent un paragraphe quasi-identique (>80% de similarite), reformuler ou fusionner.
- **Canonical** : chaque page a une balise canonical auto-referente. Si du contenu est volontairement duplique (pagination, parametres URL), pointer le canonical vers la version de reference.
- **Contenu boilerplate** : les blocs repetes sur 3+ pages (disclaimers, CTAs, formules d'intro) diluent la valeur unique de chaque page. Varier les formulations.
- **Cannibalisation** : deux pages ne doivent pas cibler le meme mot-cle primaire avec le meme intent. Differencier par l'angle, le type de contenu ou le mot-cle.

## Mot-cle et densite

- Le mot-cle primaire apparait dans : H1, premier paragraphe (100 premiers mots), 1+ H2, conclusion. Ces 4 emplacements sont les seuls obligatoires.
- **Densite globale** : 1-2%, jamais au-dessus de 2.5%.
- **Densite locale** : jamais au-dessus de 3% dans une section individuelle (entre deux sous-titres).
- **Strong** : 2-3 occurrences strategiques en gras, pas plus.
- Les mots-cles secondaires apparaissent naturellement — ne pas les forcer.
- **Entites semantiques** : utiliser le vocabulaire et les concepts lies au sujet (co-occurrences naturelles), pas seulement le mot-cle exact. Les entites semantiques couvrent le SEO la ou le mot-cle exact n'est pas necessaire.
- **Maximum 1 occurrence du mot-cle exact par paragraphe** (sauf le paragraphe d'introduction qui presente le sujet).
- **Jamais 3 phrases consecutives contenant le meme mot-cle exact.**
- **Variation lexicale obligatoire** : apres la premiere mention du mot-cle dans une section, utiliser des synonymes, pronoms, periphrases, ou termes du champ semantique.
- **Pas de keyword stuffing.** La lisibilite prime TOUJOURS. Un texte que le lecteur humain trouve repetitif est un texte sur-optimise, quelle que soit la densite calculee. Voir `references/content-guidelines.md` section "Keyword stuffing" pour la definition detaillee des patterns a eviter.

## Contenu

- **Minimum 800 mots** pour toute page indexable.
- **Pas de contenu duplique** entre pages du meme site.
- **Pas de contenu creux** : chaque phrase apporte de l'information.
- **Information gain** : chaque page doit apporter quelque chose que les pages concurrentes n'ont pas — donnees originales, experience terrain, angle unique, cas pratiques specifiques.
- **Donnees factuelles** : ne jamais inventer de chiffres, prix ou statistiques. Citer les sources.
- **FAQ** : si pertinent, ajouter une section FAQ. Note : les rich results FAQ sont limites depuis aout 2023 (reserves aux sites gouvernementaux/sante), mais la FAQ reste utile pour le contenu et les entites.
- **Fraicheur** : indiquer les dates de publication et de mise a jour. Mettre a jour le contenu perime.
- **AI Overviews** : Google affiche des reponses generees par IA en haut des SERP (surtout informationnelles, deploye mondialement 2024-2025). Structurer chaque page avec une reponse directe et concise (40-60 mots) apres l'intro, suivie du developpement. Listes, tableaux et donnees factuelles verifiables augmentent les chances d'etre cite comme source.
- **Reponse directe** : apres l'intro, fournir 2-3 phrases factuelles qui repondent directement a la requete. Ceci optimise aussi pour les featured snippets.

## Schema markup (donnees structurees)

Priorite par type :

| Priorite | Schema | Usage |
|----------|--------|-------|
| Obligatoire | `Article` / `BlogPosting` | Chaque page de contenu |
| Obligatoire | `BreadcrumbList` | Chaque page |
| Obligatoire | `Organization` | Page d'accueil |
| Important | `Person` | Pages auteur (E-E-A-T) |
| Important | `Product` + `Review` | Pages affiliation/comparatif |
| Deprecie | `FAQPage` | Rich results retires (sauf gov/sante). Ne PAS inclure sauf pour la valeur semantique interne |
| Deprecie | `HowTo` | Rich results completement retires en 2024. Ne PAS inclure |
| Optionnel | `ItemList` | Pages comparatifs, top-X, listings (rich results actifs) |
| Recommande | `ProfilePage` | Pages auteur (renforce l'identification entite auteur) |
| Optionnel | `SiteNavigationElement` | Navigation |

Chaque Article/BlogPosting DOIT avoir : `author`, `datePublished`, `dateModified`, `headline`, `description`.

Pour les pages **affiliation/produit** : le schema `Product` doit inclure `offers` (avec `price`, `priceCurrency`, `availability`) et `review`/`aggregateRating` si applicable. Google exige des donnees Product completes pour les rich results shopping (renforce en 2024-2025).

## Technique

- **Images** : attribut alt descriptif sur chaque image. Format WebP prefere. Dimensions explicites (width/height) pour eviter le CLS.
- **URLs** : courtes, minuscules, tirets. Contiennent le mot-cle si possible.
- **Sitemap XML** : chaque page indexable dans le sitemap. Soumettre via Search Console.
- **Robots.txt** : doit exister, pointer vers le sitemap, ne pas bloquer de ressources CSS/JS essentielles.
- **Mobile** : toutes les pages responsive. Google utilise l'indexation mobile-first exclusivement.
- **Core Web Vitals** (seuils 2025) :
  - LCP (Largest Contentful Paint) : < 2.5s
  - INP (Interaction to Next Paint, remplace FID depuis mars 2024) : < 200ms
  - CLS (Cumulative Layout Shift) : < 0.1
- **HTTPS** : obligatoire. Non-HTTPS = penalite.
- **SSG/SSR** : le rendu statique (Astro SSG) est ideal pour le SEO. Eviter le CSR pur.
- **Discover** : utiliser `<meta name="robots" content="max-image-preview:large">` et des images d'au moins 1200px de large pour etre eligible a Google Discover.
- **Passage Ranking** : Google indexe et classe des passages specifiques au sein des pages. Structurer chaque section H2/H3 comme une reponse autonome et complete a une question specifique.
- **CTR / NavBoost** : Google utilise les donnees de clics reels pour ajuster le ranking (confirme lors du proces DOJ 2024). Optimiser les titles et meta descriptions pour le taux de clic : chiffres, power words, promesse de valeur claire. Le CTR influence directement le positionnement.

## E-E-A-T (Experience, Expertise, Autorite, Fiabilite)

- **Experience** : montrer une connaissance concrete et pratique du sujet. Experiences first-hand, cas reels, photos originales.
- **Expertise** : vocabulaire technique juste, sources citees, profondeur d'analyse.
- **Autorite** : attribution auteur avec biographie, liens vers profils professionnels, page "A propos" detaillee.
- **Fiabilite (Trust)** : element central. Informations a jour, sources fiables, mentions legales completes, politique de confidentialite.
- **Auteur** : chaque page de contenu doit attribuer un auteur. Utiliser le schema Person. L'auteur doit avoir une page auteur sur le site.
- **Author Entity** : le schema Person de l'auteur doit inclure `sameAs` avec des liens vers ses profils professionnels verifiables (LinkedIn, publications). Google renforce la correlation entre entites auteurs et E-E-A-T. Le schema `ProfilePage` peut etre utilise sur les pages auteur.
- **Pages Trust** obligatoires : Mentions legales, Politique de confidentialite, Page A propos, Page Contact.
- **E-E-A-T etendu** : depuis decembre 2025, Google applique l'E-E-A-T a TOUTES les niches competitives, plus seulement YMYL. L'auteur, les sources et l'experience first-hand sont des signaux forts dans toutes les thematiques.

## Multilinguisme (hreflang)

- Si le site a des versions dans plusieurs langues, chaque page doit avoir `<link rel="alternate" hreflang="fr" href="...">` et `hreflang="en"` (ou autre langue cible).
- Ajouter `hreflang="x-default"` pour la version par defaut.
- **Reciprocite obligatoire** : chaque version linguistique doit pointer vers TOUTES les autres (y compris elle-meme).
- Le `/translate` doit generer les balises hreflang des deux cotes.

## Autorite topique (clusters)

- **Taille minimum** : un cluster doit avoir au moins 5-8 pages pour demontrer une couverture suffisante.
- **Couverture complete** : couvrir toutes les facettes d'un sujet (definitions, cas d'usage, comparatifs, prix, reglementation, FAQ).
- **Relations semantiques** : le maillage interne definit l'autorite topique, pas la structure des URLs.
- **Consolidation** : mieux vaut 10 pages exhaustives que 30 pages minces. Fusionner le contenu faible.
- **Mise a jour du pillar** : mettre a jour la page pillar a chaque ajout de satellite.
- **Qualite au niveau du site** : Google evalue la qualite globale du site, pas seulement page par page. Un site avec beaucoup de pages faibles tire l'ensemble vers le bas.
- **Elagage** : supprimer ou consolider les pages de faible qualite (<500 mots sans justification, contenu generique sans information gain). Mieux vaut 50 pages excellentes que 200 mediocres.

## Contenu IA

- Le contenu assiste par IA est accepte par Google s'il apporte de la valeur.
- **Interdit** : generation massive de contenu faible pour manipuler les rankings ("scaled content abuse").
- **Obligatoire** : chaque page doit etre revisee et enrichie avec de l'expertise humaine.
- **Markers de qualite** : ajouter des elements que l'IA ne peut pas generer seule — experience terrain, donnees proprietaires, avis d'expert, photos originales.
- **Moteurs IA** (ChatGPT Search, Perplexity, Bing Copilot) : sources de trafic croissantes en 2025. Ces moteurs favorisent le contenu avec citations claires, donnees factuelles datees, et auteurs identifiables. Le contenu bien structure (faits + sources + dates) augmente les chances d'etre cite.
