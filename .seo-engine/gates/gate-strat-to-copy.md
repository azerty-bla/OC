# Gate : Strategie → Redaction

Tous les criteres doivent etre PASS pour autoriser le passage au pole copy.

## Checklist

- [ ] `strat.primary_keyword` est defini et non vide
- [ ] `strat.search_intent` est classifie (informationnel / commercial / transactionnel / navigationnel)
- [ ] `strat.content_type` est selectionne
- [ ] `strat.word_count_target` est defini et compris entre `config.seo.min_word_count` et `config.seo.max_word_count`
- [ ] `strat.hn_structure` contient au moins 1 H1 et 3 H2
- [ ] `strat.hn_structure` ne saute aucun niveau (pas de H1 → H3 sans H2)
- [ ] `strat.internal_links_targets` contient au moins `config.seo.min_internal_links` liens (defaut: 2)
- [ ] Chaque lien dans `strat.internal_links_targets` a `verified_exists: true`
- [ ] `strat.secondary_keywords` contient au moins 2 mots-cles secondaires
- [ ] `strat.angle` est defini et non vide
- [ ] `strat.information_gain` est defini et non vide
- [ ] `strat.schema_types` est defini et contient au moins un type de page ("Article" ou "BlogPosting") et "BreadcrumbList"
- [ ] `strat.external_sources` contient au moins 2 sources (champ `label` obligatoire, champ `url` rempli ou `[URL A VERIFIER]`)
- [ ] `strat.title_draft` est defini et non vide (50-60 caracteres, contient le mot-cle primaire)
- [ ] `strat.cannibalization_risk` n'est PAS "flagged" (si flagged, attendre validation humaine)

## En cas d'echec

L'orchestrateur identifie quel critere echoue et demande au pole strat de corriger avant de re-verifier.
