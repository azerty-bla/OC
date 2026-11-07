# Gate : Publication

Tous les criteres doivent etre PASS pour marquer la page "completed" et passer a la suivante.

## Validators (scripts — verite terrain)

- [ ] `validate-meta` : PASS (title 50-60 chars, description 150-160 chars, champs requis)
- [ ] `validate-structure` : PASS (H1 unique, Hn sans saut, word count dans la cible)
- [ ] `validate-links` : PASS (liens internes vers fichiers existants, minimum 2 liens externes pour E-E-A-T, attributs securite rel/target)
- [ ] `validate-schema` : PASS (JSON-LD ou schema frontmatter, images alt)
- [ ] `validate-duplicates` : PASS (title/description/H1 uniques, pas de blocs de contenu dupliques, pas de boilerplate)
- [ ] `validate-writing` : PASS (keyword stuffing, formulations bannies, erreurs de langue, nombres au format francais)
- [ ] `validate-language` : PASS (relecture LanguageTool locale + lexique et règles du secteur CEE/énergie + formulations propres au site ; les alertes de grammaire, typographie et style sont à traiter mais ne bloquent pas — voir `scripts/language-check.js`)
- [ ] `validate-spam` : PASS (spam policies Google : similarite avec les autres pages, densite et qualification des liens affilies, fausse experience, title stuffing, dates, donnees structurees trompeuses, texte cache, usurpation, avis sans chiffres/limites/methodologie — voir `references/spam-policies.md`)
- [ ] `validate-facts` : PASS — **a lancer en plus de validate-all** : `node .seo-engine/scripts/validate-facts.js --file [fichier] --sidecar .seo-engine/state/pages/[slug].json --config .seo-engine/config.json --root .`. Les sources des faits sont relues (au-dela de 24 h) : une offre changee depuis la recherche fait echouer la page. Chiffres, dates et references prouves par un fait verifie ou un calcul refait, qualificatifs repris, aucun marqueur. Missions `audit-fix` et `improve` : seuls les chiffres ajoutes ou modifies depuis la version commitee sont exiges ; ceux deja publies qu'il signale en avertissement sont a confier au skill verif-faits

## Audit LLM

- [ ] Qualite editoriale : 0 erreur CRITIQUE, 0 erreur IMPORTANT
- [ ] SEO on-page : 0 erreur CRITIQUE, 0 erreur IMPORTANT
- [ ] **Keyword stuffing** : 0 erreur CRITIQUE, 0 erreur IMPORTANT (audit B2 du pole-audit)
- [ ] **Qualite redactionnelle et naturalite** : 0 erreur CRITIQUE, 0 erreur IMPORTANT (audit F0 du pole-audit — langue, mots inventes, collocations, naturalite)
- [ ] E-E-A-T : 0 erreur CRITIQUE, 0 erreur IMPORTANT
- [ ] Coherence strategie : 0 erreur CRITIQUE, 0 erreur IMPORTANT

## Technique (Astro uniquement)

- [ ] `astro build` : PASS (ou non applicable si projet HTML)

## Integration (mission produce uniquement)

- [ ] La page parent/hub du cluster est mise a jour avec un lien vers cette page
- N/A pour les missions `audit-fix` et `improve` (la page existe deja dans le site)

## Pas de passage force

Il n'existe **aucun** passage force : une page dont un critere est FAIL n'est jamais `completed`. Apres 3 iterations d'audit sans PASS, la page passe en `status: "blocked"` (`audit.blocked_reason`, `audit.errors_remaining`) et attend l'arbitrage humain. Le batch continue avec la page suivante, mais une page `blocked` n'est ni publiee, ni comptee comme terminee.

Chaque echec restant est classe dans le side-car (`audit.errors_remaining[].cause`) :
- `page` : defaut du contenu → a corriger, la page reste bloquee ;
- `validator_bug` : le script se trompe (preuve : controle, entree, sortie attendue / obtenue) → a signaler pour correction dans SEOWK. **Ne jamais modifier un validateur dans la copie d'un projet** ;
- `exception` : derogation justifiee → seulement avec l'accord explicite de l'utilisateur, consigne dans `audit.exceptions[]` (`check`, `raison`, `accord`, `date`). Sans accord ecrit, ce n'est pas une exception.

Les validateurs tournent toujours sur la **page complete construite** (fichier source ou `dist/`), jamais sur un extrait recopie ou tronque.

**Jamais pour les faits** : `validate-facts` et les erreurs d'exactitude (chiffre, date, reference, contexte d'un chiffre) ne sont jamais forcees. Un chiffre non prouve se remplace par le chiffre exact d'un fait ou se reformule sans chiffre — c'est toujours possible, la page n'est donc jamais bloquee pour cette raison.

## En cas d'echec

L'orchestrateur identifie les criteres echoues et renvoie au pole audit pour correction. La boucle continue jusqu'a ce que TOUS les criteres soient PASS (ou que la page passe en `blocked`).
