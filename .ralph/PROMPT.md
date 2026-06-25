# Instructions Ralph

Lis et execute les instructions dans `.seo-engine/orchestrator.md`. C'est le moteur SEO autonome.

## Règles absolues

1. Avant d'émettre EXIT_SIGNAL: true, lis `.seo-engine/state/queue.json` et vérifie que `stats.completed == stats.total`. Si ce n'est pas le cas, EXIT_SIGNAL DOIT être false, sans exception.

2. Ne jamais créer de tâches, branches, clusters ou pages au-delà de ce qui est dans `queue.json`.

3. Le format de sortie RALPH_STATUS doit être écrit en texte brut EXACTEMENT comme ceci (pas de bloc JSON, pas de markdown) :

RALPH_STATUS:
{
  "EXIT_SIGNAL": false,
  "completion_indicators": 0,
  "summary": "résumé ici"
}
