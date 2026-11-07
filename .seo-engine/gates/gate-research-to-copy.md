# Gate : Recherche → Redaction

Tous les criteres doivent etre PASS pour autoriser le passage au pole copy.

## Checklist — Faits (script, bloquant)

Lance : `node .seo-engine/scripts/validate-facts.js --phase research --sidecar .seo-engine/state/pages/[slug].json --config .seo-engine/config.json --root .`

- [ ] `sources_read` : PASS — chaque source de fait a ete lue (une lecture en echec n'est jamais une lecture)
- [ ] `facts_verified` : PASS — chaque fait de `verified_facts` (et de `price_ranges` / `regulations` s'ils sont remplis) a sa phrase exacte retrouvee sur sa page, tous ses chiffres dans cette phrase et les qualificatifs de la source repris ; aucune source du site lui-meme
- [ ] `facts_ids_unique` : PASS
- [ ] `facts_count` : PASS — au moins 5 faits verifies par script (autre minimum : `config.facts.min_verified`)
- [ ] `external_sources_read` : PASS — chaque adresse de `verified_external_sources` existe (une adresse inventee ou un lien de suivi echoue ; un refus aux robots n'est qu'un avertissement)
- [ ] Le script fait foi : un fait qu'il rejette ne se garde pas « a verifier » ; il se corrige ou part dans `unverified_data`

## Checklist — Choix des sources et contexte (relecture)

- [ ] Chaque offre, prix ou condition d'une entite vient de l'entite elle-meme (page officielle ou conditions de l'offre), sur le bon canal (bienvenue, parrainage, lien affilie)
- [ ] Chaque regle, montant legal ou statut vient d'un texte ou d'un site officiel en vigueur (ni un projet publie depuis, ni un texte abroge)
- [ ] Aucun fait ne repose seul sur une source de score ≤ 2 (hors entite elle-meme pour ses propres offres) ; aucune comparaison (« la moins chere », « n°1 ») ne vient de l'entite comparee
- [ ] Chaque fait reprend le contexte de son extrait : public, canal, periode, conditions ; offre temporaire → dates de debut et de fin dans le fait
- [ ] `research.verified_external_sources` contient au moins 2 sources lues par script (`verified: true`) d'autorite ≥ 3

## Checklist — Volume et couverture

- [ ] `research.queries_executed` >= 8 requetes de recherche distinctes
- [ ] `research.sites_consulted` >= 50 sites differents consultes
- [ ] `research.sites_deeply_read` >= 5 pages lues en entier par `source-check.js`
- [ ] `research.authority_distribution.score_5` + `research.authority_distribution.score_4` >= 3 (au moins 3 sources de haute autorite)

## Checklist — Analyse concurrentielle

- [ ] `research.competitor_analysis.top_results_analyzed` >= 5 pages concurrentes analysees
- [ ] `research.competitor_analysis.gaps_identified` contient au moins 1 lacune identifiee (opportunite d'information gain)

## Checklist — Journal de recherche

- [ ] `research.search_log` existe et contient au moins 8 entrees (une par requete executee)
- [ ] Chaque entree de `search_log` a `query`, `timestamp`, `results_count`
- [ ] Les compteurs `queries_executed` et `sites_consulted` correspondent aux entrees du `search_log` (tolerance ±10%)
- [ ] Les donnees non verifiees sont listees dans `research.unverified_data` avec leur raison : elles ne seront pas redigees

## Checklist — Qualite de la recherche

- [ ] **Fraicheur des sources** : pour les donnees qui changent vite (offres, prix, reglementations, aides), les dates declarees par la page source (affichees par `source-check.js`) ou la date de lecture montrent une information en vigueur. Exception documentee si la donnee est stable (normes techniques, principes physiques)
- [ ] **Densite informationnelle** : nombre de faits verifies par script / `queries_executed` >= 0.5 (au moins 1 fait verifie pour 2 requetes — empeche la recherche superficielle)
- [ ] Si le sujet est YMYL (sante, finance, juridique) : `research.sites_consulted` >= 100 ET au moins 5 sources de score 5

## Checklist — PAA et recherches associees

- [ ] `research.paa_questions` est rempli (peut etre vide si pas de PAA trouvees, mais le champ doit exister avec une note)
- [ ] `research.related_searches` est rempli (peut etre vide si non disponibles)

## Pas d'exception

Sans lecture possible des sources (WebSearch absent, pages illisibles, reseau coupe), le gate echoue : aucun fait n'est prouve. L'utilisateur est prevenu ; s'il maintient la redaction, la page ne contient aucun chiffre, aucune date ni aucune reference (`validate-facts.js` les bloque aux gates suivants). Jamais de donnee de memoire marquee `[A VERIFIER]`.

## En cas d'echec

L'orchestrateur identifie les criteres echoues et demande au pole research de completer ses recherches. Typiquement :
- Fait rejete → recopier l'extrait depuis la sortie de `source-check.js --find`, reprendre le qualificatif signale, ou deplacer le fait dans `unverified_data`
- Source illisible → autre page de l'emetteur ou source officielle ; texte copie depuis un navigateur (`source-check.js --file … --source-url …`) si disponible
- Pas assez de faits verifies → lire d'autres pages de l'emetteur ou des sources officielles
- Pas assez de sites → executer des requetes supplementaires
- Pas assez de sources officielles → ajouter des requetes "site:gouv.fr", "site:*.edu"
- Pas d'analyse concurrentielle → analyser les 10 premiers resultats de la SERP principale
- search_log manquant → reconstituer le log depuis les recherches effectuees
- Densite informationnelle faible → approfondir les recherches, pas juste les elargir

Apres 3 tentatives, la page passe en copy avec les seuls faits acceptes par le script : `sources_read`, `facts_verified` et `facts_ids_unique` restent obligatoires (la liste ne garde aucun fait rejete), les autres criteres manquants sont notes dans le side-car. Aucun autre chiffre ne pourra etre publie.
