# Oteria Conseil — règles projet

## Composant "hero form" (HubPage.astro)

Le layout `src/layouts/HubPage.astro` contient une carte de formulaire dans le hero (`id="hero-form"`, badge "Gratuit · 2 min" / "Votre étude CEE" / CTA "Obtenir mon diagnostic").

- Ce composant est **masqué sur `/dispositifs/`** via le prop `showHeroForm={false}` (passé dans `src/pages/dispositifs/index.astro`), à la demande explicite de l'utilisateur.
- Le composant n'est **pas supprimé** : il reste dans `HubPage.astro`, prêt à être réactivé (ou réutilisé ailleurs) en omettant le prop ou en le passant à `true` (valeur par défaut).
- Les autres pages utilisant `HubPage` (`/dispositifs/calcul-prime/`, `/dispositifs/demarches/`, `/expertises/`, `/achat-energie/`) continuent d'afficher ce hero form normalement.
