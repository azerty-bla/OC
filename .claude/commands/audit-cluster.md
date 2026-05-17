# Audit de cluster — Verification cross-pages

Tu es l'auditeur global. Tu verifies la coherence d'un cluster entier : cannibalization, orphelins, maillage, completude.

Cet audit se fait APRES que toutes les pages d'un cluster sont produites.

---

## Entrees

1. Le **cluster YAML** (dans `config.paths.clusters_dir`, par defaut `docs/clusters/cluster-XX.yaml`)
2. Tous les **fichiers de contenu** des pages du cluster
3. Les **side-cars** de chaque page (`.seo-engine/state/pages/`)
4. Le **config.json** du projet

## Checks

### 1. Completude

- [ ] Toutes les pages prevues dans le cluster YAML existent sur disque
- [ ] Toutes les pages ont un side-car avec `status: "completed"`
- [ ] Le pillar existe et est publie

### 2. Cannibalization intra-cluster

Pour chaque paire de pages du cluster :
- Comparer les mots-cles primaires → doivent etre differents
- Comparer les titles → ne doivent pas etre trop similaires (>80% de mots communs)
- Comparer les H1 → doivent etre distincts
- Comparer les meta descriptions → doivent etre distinctes
- Comparer `search_intent` et `content_type` (depuis les side-cars) → deux pages ne doivent pas viser le meme intent avec le meme type de contenu. Ex: deux pages "informationnelle/guide" sur des mots-cles proches = cannibalization probable
- Si meme intent + type similaire : verifier que les angles sont suffisamment distincts

Si cannibalization detectee : proposer une differenciation (angle, mot-cle, intent cible, reformulation).

### 3. Maillage interne

- [ ] Le pillar contient un lien vers CHAQUE satellite du cluster
- [ ] Chaque satellite contient un lien vers le pillar
- [ ] Chaque satellite contient au moins 1 lien vers une autre satellite du cluster
- [ ] Pas de liens vers des pages inexistantes
- [ ] Les ancres sont variees (pas la meme ancre pour tous les liens vers le pillar)

### 4. Pages orphelines

Scanner toutes les pages du site. Identifier les pages qui :
- Ne recoivent aucun lien interne d'aucune autre page
- Ne sont referencees dans aucun cluster YAML

### 5. Contenu mince

Identifier les pages de moins de 500 mots :
- Si le type le justifie (landing, page produit) : acceptable
- Sinon : proposer de fusionner avec une page parente ou d'enrichir le contenu
- Un site avec trop de pages minces est penalise au niveau global (site-level quality)

### 6. Coherence des meta

- Aucun title duplique sur le site
- Aucune description dupliquee sur le site
- Tous les titles sont dans la plage 50-60 caracteres
- Toutes les descriptions sont dans la plage 150-160 caracteres

## Sortie

Produis un rapport structure :

```markdown
# Audit Cluster [XX] — [Nom]

## Resultats

| Check | Status | Details |
|-------|--------|---------|
| Completude | PASS/FAIL | ... |
| Cannibalization | PASS/FAIL | ... |
| Maillage | PASS/FAIL | ... |
| Orphelins | PASS/FAIL | ... |
| Meta | PASS/FAIL | ... |

## Actions requises
- [ ] ...

## Suggestions
- ...
```

Ecris le rapport dans `docs/audit-cluster-XX-[date].md`.

Mets a jour le cluster YAML : `status: reviewed` si tout est PASS, `status: needs-fix` sinon.
