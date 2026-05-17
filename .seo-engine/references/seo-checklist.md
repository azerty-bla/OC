# Checklist SEO unifiee (maj 2025-2026)

Checklist unique pour la validation de toute page. Utilisee par le pole audit et les quality gates.

---

## Meta (script + LLM)

- [ ] Title present, 50-60 caracteres, contient le mot-cle primaire
- [ ] Title aligne avec le H1 (meme mot-cle, formulations coherentes)
- [ ] Description presente, 150-160 caracteres, contient le mot-cle, incite au clic
- [ ] Canonical defini, auto-referent, URL propre
- [ ] Slug propre (minuscules, tirets, pas de caracteres speciaux, contient le mot-cle)
- [ ] Open Graph meta presentes (og:title, og:description)

## Structure (script)

- [ ] H1 present et unique
- [ ] Hierarchie Hn sans saut de niveau
- [ ] Minimum 3 H2
- [ ] Nombre de mots dans la cible ±10%
- [ ] Paragraphes de 5 phrases max
- [ ] Mot-cle primaire dans les 100 premiers mots

## Maillage interne (script + LLM)

- [ ] Au moins 2 liens internes sortants
- [ ] Tous les liens pointent vers des pages existantes (verifie par script)
- [ ] Ancres optimisees (pas de "cliquez ici", "ici", "en savoir plus")
- [ ] Liens repartis dans le contenu (pas regroupes)
- [ ] Lien vers le pillar du cluster (si page satellite)
- [ ] Breadcrumbs presents

## Liens externes — Securite (script + LLM)

- [ ] Liens externes avec `target="_blank"` (ouverture nouvel onglet)
- [ ] Liens externes avec `rel="noopener noreferrer"` (securite + vie privee)
- [ ] Si MDX : liens en syntaxe HTML `<a>` ou config `rehype-external-links` active
- [ ] Liens externes vers des sources de qualite (pas de concurrents directs)
- [ ] Domaines credibles (officiels, institutions, etudes)

## Duplicate content (script + LLM)

- [ ] Title unique sur l'ensemble du site (script)
- [ ] Meta description unique sur l'ensemble du site (script)
- [ ] H1 unique sur l'ensemble du site (script)
- [ ] Aucun bloc de contenu copie ou quasi-copie d'une autre page (script + LLM)
- [ ] Introductions et conclusions uniques (pas de template identique entre pages) (LLM)
- [ ] Pas de cannibalisation de mot-cle (LLM)
- [ ] Canonical auto-referente, pas de conflit (LLM)
- [ ] Pas de contenu boilerplate repete sur 3+ pages (script)

## SEO on-page (LLM)

- [ ] Mot-cle primaire dans H1, intro (100 premiers mots), 1+ H2, conclusion
- [ ] Mots-cles secondaires presents naturellement
- [ ] Entites semantiques liees au sujet presentes
- [ ] Densite mot-cle globale < `config.seo.max_keyword_density_percent` (defaut 2.5%)
- [ ] 2-3 balises strong strategiques

## Keyword stuffing (LLM — audit detaille)

- [ ] Max 1 occurrence du mot-cle exact par paragraphe (sauf intro)
- [ ] Pas de 3 phrases consecutives contenant le mot-cle
- [ ] Densite mot-cle < 3% dans chaque section individuelle (entre deux titres)
- [ ] Mot-cle pas repete 2 fois dans le title ou la meta description
- [ ] Pas de H2/H3 qui repete inutilement le mot-cle
- [ ] Pas de juxtaposition de mots-cles sans liaison grammaticale (CRITIQUE)
- [ ] Pas de listes dont chaque item repete le mot-cle
- [ ] Ancres de liens pas reduites au mot-cle exact
- [ ] Variation lexicale : synonymes, pronoms, periphrases utilises apres la 1re mention
- [ ] Mot-cle present dans moins de 50% des paragraphes

## Schema markup (script)

- [ ] JSON-LD present (ou gere par layout/frontmatter)
- [ ] Type Article/BlogPosting avec author, datePublished, dateModified
- [ ] BreadcrumbList present
- [ ] Schema supplementaire si pertinent (Product avec offers/price si affiliation, ItemList si comparatif, Person/ProfilePage)
- [ ] Author sameAs present (liens profils professionnels) (script)

## Images (script + LLM)

- [ ] Attribut alt present et descriptif sur chaque image
- [ ] Format WebP prefere
- [ ] Dimensions explicites (width/height) pour eviter CLS

## Editorial (LLM)

- [ ] Pas de phrases bannies IA (voir content-guidelines.md)
- [ ] Ton expert mais accessible
- [ ] Pas de contenu creux ou de remplissage
- [ ] Introduction avec accroche + promesse (100 premiers mots)
- [ ] Reponse directe apres l'intro (40-60 mots factuels) pour AI Overviews / featured snippets
- [ ] Conclusion avec synthese + CTA adapte au type de monetisation
- [ ] Pas de donnees inventees — sources citees si chiffres avances
- [ ] Transitions naturelles entre sections
- [ ] Information gain : contenu qui apporte quelque chose de nouveau

## Lisibilite et langue (LLM)

- [ ] Phrases : 20-25 mots en moyenne, jamais plus de 35 mots
- [ ] Paragraphes : 3-5 phrases max, max 300 mots entre deux sous-titres
- [ ] Phrases passives < 10%
- [ ] Mots longs (4+ syllabes) < 20% du texte
- [ ] Orthographe et accents corrects (pas d'accent manquant) (CRITIQUE)
- [ ] Homophones grammaticaux corrects : a/à, ce/se, ces/ses/c'est/s'est, on/ont, son/sont, et/est (CRITIQUE)
- [ ] Accords grammaire : participe passe (avoir/etre), adjectifs, pluriels irreguliers
- [ ] Conjugaison : subjonctif apres "il faut que/pour que/bien que", futur irregulier, conditionnel
- [ ] Typographie francaise (espaces insecables, guillemets)
- [ ] Pas d'erreurs IA typiques ("malgre que", "au final", "quelque soit", "pallier a", "s'averer faux", "apres que" + subjonctif, "suite a", "voire meme", "au niveau de" hors sens spatial)
- [ ] Chaque phrase a un verbe conjugue (sauf listes a puces)
- [ ] Accord sujet-verbe verifie meme quand le sujet est eloigne
- [ ] Nombres au format francais : virgule decimale ("1,5" pas "1.5"), espace milliers ("12 000"), symbole € apres montant
- [ ] Dates au format francais : pas de majuscule aux mois, JJ/MM/AAAA, heures en "14 h 30"

## Naturalite et qualite redactionnelle (LLM)

- [ ] Pas de mot invente ou inexistant en francais (CRITIQUE)
- [ ] Pas de calque anglais non etabli ("solutionner", "adresser un probleme") ; preferer les alternatives a "impacter" en redaction experte
- [ ] Collocations naturelles en francais (pas de combinaisons artificielles)
- [ ] Structures de paragraphes variees (pas tous le meme patron syntaxique)
- [ ] Pas de phrases creuses, tautologies ou evidences inutiles
- [ ] Pas de faux enrichissements (adjectifs generiques non etayes : optimal, performant, essentiel, incontournable)
- [ ] Coherence du registre et du vouvoiement/tutoiement
- [ ] Transitions logiques entre sections (pas de connecteurs plaques)
- [ ] Pas de structures repetitives mecaniques (question/reponse systematique, listes identiques)
- [ ] Chaque phrase apporte une information concrete ou un avis expert etaye
- [ ] Pas de repetition du meme mot de contenu 3+ fois dans un paragraphe (reformuler avec synonymes/pronoms)

## E-E-A-T (LLM)

- [ ] Expertise demontree (vocabulaire technique juste, profondeur)
- [ ] Sources citees pour les faits et donnees
- [ ] Attribution auteur (nom + credentials si YMYL)
- [ ] Author entity : schema Person avec `sameAs` vers profils professionnels (si page auteur disponible)
- [ ] Experience first-hand visible (cas reels, exemples concrets, terrain)
- [ ] Pas de promesses non tenues ou d'affirmations gratuites
- [ ] Contenu qui repond a l'intention de recherche ciblee
- [ ] Au moins 2 liens externes vers des sources de qualite (pas de concurrents directs) (script + LLM)

## Technique

- [ ] Build Astro reussi (si applicable)
- [ ] Fichier complet (pas de placeholders, TODO, "[a completer]")
- [ ] Page parent/hub mise a jour avec lien (si applicable, mission produce)
- [ ] Page accessible en 3 clics max depuis l'accueil
- [ ] Core Web Vitals : LCP < 2.5s, INP < 200ms (remplace FID depuis mars 2024), CLS < 0.1
- [ ] `<meta name="robots" content="max-image-preview:large">` pour eligibilite Google Discover
- [ ] Images avec dimensions explicites (width/height) pour eviter le CLS
- [ ] Balises hreflang presentes si le site a des versions multilingues
- [ ] og:image presente (HTML — verifie par script)
