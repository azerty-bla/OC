# Gate : Publication

Tous les criteres doivent etre PASS pour marquer la page "completed" et passer a la suivante.

## Validators (scripts — verite terrain)

- [ ] `validate-meta` : PASS (title 50-60 chars, description 150-160 chars, champs requis)
- [ ] `validate-structure` : PASS (H1 unique, Hn sans saut, word count dans la cible)
- [ ] `validate-links` : PASS (liens internes vers fichiers existants, minimum 2 liens externes pour E-E-A-T, attributs securite rel/target)
- [ ] `validate-schema` : PASS (JSON-LD ou schema frontmatter, images alt)
- [ ] `validate-duplicates` : PASS (title/description/H1 uniques, pas de blocs de contenu dupliques, pas de boilerplate)
- [ ] `validate-writing` : PASS (keyword stuffing, formulations bannies, erreurs de langue, nombres au format francais)

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

## Exception : forced_pass

Si `audit.forced_pass == true` et `audit.iteration >= 3`, le gate est considere PASS avec avertissement. Les erreurs restantes sont documentees dans `audit.errors_remaining` et `audit.suggestions`. Cela evite de bloquer le batch sur une page difficile.

## En cas d'echec

L'orchestrateur identifie les criteres echoues et renvoie au pole audit pour correction. La boucle continue jusqu'a ce que TOUS les criteres soient PASS (ou que forced_pass s'applique).
