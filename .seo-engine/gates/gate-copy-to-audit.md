# Gate : Redaction → Audit

Tous les criteres doivent etre PASS pour autoriser le passage au pole audit.

## Checklist

- [ ] Le fichier existe sur disque au chemin `copy.file_path`
- [ ] `copy.word_count` est dans la fourchette ±10% de `strat.word_count_target`
- [ ] Le fichier a un frontmatter valide (MDX) ou un `<head>` complet (HTML)
- [ ] Le H1 est present et unique
- [ ] Toutes les sections H2 prevues dans `strat.hn_structure` sont presentes
- [ ] Aucune section vide ou contenant des placeholders ("[a completer]", "TODO", "...")
- [ ] Tous les liens internes de `strat.internal_links_targets` sont places dans le contenu
- [ ] Le mot-cle primaire apparait dans les 100 premiers mots
- [ ] Au moins 2 liens externes places dans le contenu (sources de `strat.external_sources` ou equivalentes)
- [ ] Attribution auteur presente (frontmatter `author` ou byline)
- [ ] Pas de keyword stuffing evident : max 1 occurrence du mot-cle par paragraphe (sauf intro), pas de juxtaposition de mots-cles sans liaison grammaticale
- [ ] Auto-relecture qualite effectuee : pas de mot invente, pas de faute d'orthographe grossiere, phrases naturelles

## En cas d'echec

L'orchestrateur renvoie au pole copy avec le detail des criteres echoues.
