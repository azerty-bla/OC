# Ralph Fix Plan

## Objectif
Produire les 36 pages SEO de la phase 2 définies dans `.seo-engine/state/queue.json`.
Chaque loop traite un cluster complet (pillar + satellites).

## Progression
- Cluster 1 — Osmose inverse : ✅ 6/6 pages créées (2026-06-25)
- Cluster 2 — Froid commercial : ⏳ 0/9 pages
- Cluster 3 — Récupération de chaleur : ⏳ 0/8 pages
- Cluster 4 — Audit énergétique : ⏳ 0/8 pages
- Cluster 5 — Achat énergie : ⏳ 0/5 pages

## Prochaine tâche (loop 2)
Créer le cluster **Froid commercial** (9 pages) :
- `src/pages/expertises/froid-commercial/index.astro` (pillar)
- `src/pages/expertises/froid-commercial/prime-cee/index.astro`
- `src/pages/expertises/froid-commercial/tarifs/index.astro`
- `src/pages/expertises/froid-commercial/faq/index.astro`
- `src/pages/expertises/froid-commercial/grande-distribution/index.astro`
- `src/pages/expertises/froid-commercial/restauration/index.astro`
- `src/pages/expertises/froid-commercial/logistique/index.astro`
- `src/pages/expertises/froid-commercial/agriculture/index.astro`
- `src/pages/expertises/froid-commercial/projets/index.astro`

Référence : `docs/clusters/cluster-p2-02-froid-commercial.yaml`
Maillage croisé fort avec `/expertises/hp-bp-flottante/` (déjà en V1).

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
