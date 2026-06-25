# Ralph Fix Plan

## Objectif
Produire les 36 pages SEO de la phase 2 définies dans `.seo-engine/state/queue.json`.
Chaque loop traite un cluster complet (pillar + satellites).

## Progression
- Cluster 1 — Osmose inverse : ✅ 6/6 pages créées (2026-06-25)
- Cluster 2 — Froid commercial : ✅ 9/9 pages créées (2026-06-25)
- Cluster 3 — Récupération de chaleur : ⏳ 0/8 pages
- Cluster 4 — Audit énergétique : ⏳ 0/8 pages
- Cluster 5 — Achat énergie : ⏳ 0/5 pages

## Prochaine tâche (loop 3)
Créer le cluster **Récupération de chaleur** (8 pages) :
- `src/pages/expertises/recuperation-chaleur/index.astro` (pillar)
- `src/pages/expertises/recuperation-chaleur/prime-cee/index.astro`
- `src/pages/expertises/recuperation-chaleur/tarifs/index.astro`
- `src/pages/expertises/recuperation-chaleur/faq/index.astro`
- `src/pages/expertises/recuperation-chaleur/industrie/index.astro`
- `src/pages/expertises/recuperation-chaleur/agroalimentaire/index.astro`
- `src/pages/expertises/recuperation-chaleur/tertiaire/index.astro`
- `src/pages/expertises/recuperation-chaleur/projets/index.astro`

Référence : `docs/clusters/cluster-p2-03-recuperation-chaleur.yaml`
Maillage croisé fort avec froid commercial (chaleur de condensation).

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
