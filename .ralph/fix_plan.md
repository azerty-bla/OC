# Ralph Fix Plan

## Objectif
Produire les 36 pages SEO de la phase 2 définies dans `.seo-engine/state/queue.json`.
Chaque loop traite un cluster complet (pillar + satellites).

## Progression
- Cluster 1 — Osmose inverse : ✅ 6/6 pages créées (2026-06-25)
- Cluster 2 — Froid commercial : ✅ 9/9 pages créées (2026-06-25)
- Cluster 3 — Récupération de chaleur : ✅ 8/8 pages créées (2026-06-25)
- Cluster 4 — Audit énergétique : ⏳ 0/8 pages
- Cluster 5 — Achat énergie : ⏳ 0/5 pages

## Prochaine tâche (loop 4)
Créer le cluster **Audit énergétique** (8 pages) — voir `docs/clusters/cluster-p2-04-audit-energetique.yaml` (si existant) ou créer selon le pattern établi :
- `src/pages/expertises/audit-energetique/index.astro` (pillar)
- 7 pages satellite à définir (prime-cee, tarifs, faq, industrie, tertiaire, réglementaire, projets)

Référence : cluster YAML P2-04 (à créer si absent).

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
