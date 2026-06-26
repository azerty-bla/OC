# Ralph Fix Plan

Source de vérité unique : `.seo-engine/state/queue.json` (mission: produce, 24 pages phase 4).
Clusters YAML dans `docs/clusters/` (cluster-p4-*).
Quand stats.completed == stats.total → EXIT_SIGNAL: true, arrêt immédiat. Ne pas improviser de tâches hors-queue.
