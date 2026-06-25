# Ralph Fix Plan

## Objectif
Produire les 36 pages SEO de la phase 2 définies dans `.seo-engine/state/queue.json`.
Chaque loop traite un cluster complet (pillar + satellites).

## Progression
- Cluster 1 — Osmose inverse : ✅ 6/6 pages créées (2026-06-25)
- Cluster 2 — Froid commercial : ✅ 9/9 pages créées (2026-06-25)
- Cluster 3 — Récupération de chaleur : ✅ 8/8 pages créées (2026-06-25)
- Cluster 4 — Audit énergétique : ✅ 8/8 pages créées (2026-06-25)
- Cluster 5 — Achat énergie : ✅ 5/5 pages créées (2026-06-25)

## Prochaine tâche (loop 6)
Tous les clusters phase 2 sont terminés. Passer en revue la qualité du maillage interne :
- Vérifier que chaque page pillar est bien liée depuis les pages satellites
- Vérifier les liens vers /achat-energie/ dans les pages existantes
- Ou démarrer la phase 3 selon le plan général

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
