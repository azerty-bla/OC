# Gate : Redaction → Audit

Tous les criteres doivent etre PASS pour autoriser le passage au pole audit.

## Checklist

### Fichier et structure
- [ ] Le fichier existe sur disque au chemin `copy.file_path`
- [ ] `copy.word_count` est dans la fourchette ±10% de `strat.word_count_target`
- [ ] Le fichier a un frontmatter valide (MDX) ou un `<head>` complet (HTML)
- [ ] Le H1 est present et unique
- [ ] Toutes les sections H2 prevues dans `strat.hn_structure` sont presentes
- [ ] Aucune section vide ou contenant des placeholders ("[a completer]", "TODO", "...")

### Meta et SEO
- [ ] Le title est present dans le frontmatter/head (50-60 caracteres, contient le mot-cle primaire)
- [ ] La meta description est presente (150-160 caracteres)
- [ ] Le mot-cle primaire apparait dans les 100 premiers mots

### Faits (script, bloquant)
Lance : `node .seo-engine/scripts/validate-facts.js --file [fichier] --sidecar .seo-engine/state/pages/[slug].json --config .seo-engine/config.json --root .`
- [ ] `numbers_justified` : PASS — chaque chiffre, date et reference affiches (title, description, H1, texte, FAQ) vient d'un fait verifie par script ou d'un calcul declare dans `copy.calculations`
- [ ] `calculations` : PASS — chaque calcul refait par le script (entrees sourcees ou hypotheses ecrites comme exemples)
- [ ] `qualifiers` : PASS — « jusqu'a », « a partir de », « environ », HT, TTC repris de la source
- [ ] `no_markers` : PASS — aucun `[A VERIFIER]`, `[DONNEE A VERIFIER]`, `URL A VERIFIER`, `X €`, TODO, y compris en commentaire
- [ ] `no_fake_links` : PASS — aucune adresse fictive laissee a la place d'un vrai lien (`amzn.to/PLACEHOLDER`, `amzn.to/` suivi d'un mot, fiche Amazon sans ASIN ou a ASIN de remplissage, `example.com`, `.test`), ni lien sponsorise sans adresse, frontmatter compris
- [ ] Chaque chiffre est employe dans le contexte de son extrait : meme public, meme canal, meme periode, memes conditions (relecture : le script ne juge pas le sens)

### Liens et sources
- [ ] Tous les liens internes de `strat.internal_links_targets` sont places dans le contenu
- [ ] Au moins 2 liens externes places dans le contenu, vers des adresses lues par script (`research.verified_external_sources` ou sources des faits)
- [ ] Aucune ancre de lien interne generique ("cliquez ici", "ici", "en savoir plus", "lire la suite", "lien")

### Entites semantiques
- [ ] Au moins 80% des entites de `strat.semantic_entities` sont presentes dans le contenu (couverture minimale du champ thematique)

### Qualite editoriale
- [ ] Attribution auteur presente (frontmatter `author` ou byline)
- [ ] Pas de keyword stuffing evident : max 1 occurrence du mot-cle par paragraphe (sauf intro), pas de juxtaposition de mots-cles sans liaison grammaticale
- [ ] Auto-relecture qualite effectuee : pas de mot invente, pas de faute d'orthographe grossiere, phrases naturelles

## En cas d'echec

L'orchestrateur renvoie au pole copy avec le detail des criteres echoues.
