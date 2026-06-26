# Ralph Fix Plan

Source de vérité unique : `.seo-engine/state/queue.json` (mission: produce, 22 pages phase 5).
Clusters YAML dans `docs/clusters/` (cluster-p5-*).
Quand stats.completed == stats.total → EXIT_SIGNAL: true, arrêt immédiat. Ne pas improviser de tâches hors-queue.
