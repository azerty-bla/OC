# Ralph Fix Plan

## Objectif
Produire les 36 pages SEO de la phase 2 définies dans `.seo-engine/state/queue.json`.
Chaque loop traite un cluster complet (pillar + satellites).

## Progression
- Cluster 1 — Osmose inverse : ✅ 6/6 pages créées (2026-06-25)
- Cluster 2 — Froid commercial : ✅ 9/9 pages créées (2026-06-25)
- Cluster 3 — Récupération de chaleur : ✅ 8/8 pages créées (2026-06-25)
- Cluster 4 — Audit énergétique : ✅ 8/8 pages créées (2026-06-25)
- Cluster 5 — Achat énergie : ⏳ 0/5 pages

## Prochaine tâche (loop 5)
Créer le cluster **Achat énergie** (5 pages) :
- `src/pages/achat-energie/index.astro` (pillar — courtage en énergie)
- `src/pages/achat-energie/courtier-electricite/index.astro`
- `src/pages/achat-energie/courtier-gaz/index.astro`
- `src/pages/achat-energie/prix-electricite-professionnel/index.astro`
- `src/pages/achat-energie/prix-gaz-professionnel/index.astro`

Note : ces pages sont sous `/achat-energie/` (pas `/expertises/achat-energie/`). Vérifier le layout utilisé (HubPage ou ExpertisePage).

## Notes techniques
- Pattern de page : `ExpertisePage` layout (`src/layouts/ExpertisePage.astro`)
- Import : `import ExpertisePage from "../../../layouts/ExpertisePage.astro";`
- Pages FAQ : utiliser le composant `FaqAccordion`
- Maillage interne : respecter `internal_links` dans le YAML de cluster
- Pas de test à écrire (pages de contenu statique)

## Completed
- [x] Project enabled for Ralph
- [x] Review codebase et architecture (2026-06-25)
- [x] Cluster Osmose inverse — 6 pages créées (2026-06-25)
- [x] Cluster Froid commercial — 9 pages créées (2026-06-25)
- [x] Cluster Récupération de chaleur — 8 pages créées (2026-06-25)
