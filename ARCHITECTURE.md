# Architecture — oteria-conseil.fr

## 1. Positionnement

| Élément | Valeur |
|---|---|
| **Domaine** | oteria-conseil.fr |
| **Marque** | Oteria Conseil |
| **Baseline** | Conseil en performance énergétique et dispositifs CEE pour les professionnels |
| **Angle éditorial** | Pédagogique et opérationnel. Chaque page répond : comment ça marche, comment en bénéficier, quelles sont les étapes concrètes. |
| **Ton** | Expert accessible, orienté action. Ni institutionnel, ni commercial, ni encyclopédique — pragmatique et guidant. |
| **Cible** | Responsables énergie, directeurs techniques, directeurs de site, syndics, gestionnaires de patrimoine, exploitants agricoles |
| **Différenciateur clé** | Organisation par EXPERTISE opérationnelle (même logique cluster que réseau-CEE, couverture large à la ECO Perf) avec ton pédagogique "on vous guide" |
| **Gros focus** | Certificats d'Économie d'Énergie (CEE) + Courtage énergie + Mobilité électrique (bornes IRVE) |
| **Nature** | **Société réelle** (SIRET, adresse physique, équipe identifiable) — signaux E-E-A-T maximaux |

---

## 1b. Signaux de réassurance (E-E-A-T)

**Ce site représente une vraie société.** Contrairement à d'autres projets du portfolio, Oteria Conseil bénéficie de signaux de confiance concrets que Google valorise fortement.

### Éléments à intégrer dès que disponibles

| Signal | Emplacement | Statut |
|---|---|---|
| **Adresse physique** | Footer, page contact, JSON-LD Organization | ⏳ À fournir |
| **Numéro de téléphone** | Header, footer, pages CTA, JSON-LD | ⏳ À fournir |
| **SIRET / RCS** | Mentions légales, footer | ⏳ À fournir |
| **LinkedIn entreprise** | Footer, JSON-LD sameAs | ⏳ À fournir |
| **LinkedIn dirigeant(s)** | Page "Qui sommes-nous", auteur articles | ⏳ À fournir |
| **Email professionnel** | contact@oteria-conseil.fr | ✓ Prévu |
| **Logo officiel** | Header, JSON-LD, og:image | ⏳ À créer |
| **Photos équipe** | Page "Qui sommes-nous" | ⏳ À fournir |
| **Certifications / qualifications** | Footer badge, page dédiée | ⏳ À définir |
| **Avis clients (Google Business)** | Widget ou lien, JSON-LD AggregateRating | ⏳ Post-lancement |
| **Mentions presse / partenaires** | Page dédiée ou section accueil | ⏳ Post-lancement |

### Impact sur le JSON-LD Organization (accueil)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Oteria Conseil",
  "url": "https://oteria-conseil.fr",
  "logo": "https://oteria-conseil.fr/logo.svg",
  "description": "Conseil en performance énergétique et dispositifs CEE",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "À COMPLÉTER",
    "addressLocality": "À COMPLÉTER",
    "postalCode": "À COMPLÉTER",
    "addressCountry": "FR"
  },
  "telephone": "À COMPLÉTER",
  "email": "contact@oteria-conseil.fr",
  "sameAs": [
    "https://www.linkedin.com/company/oteria-conseil/"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "À COMPLÉTER",
    "contactType": "customer service",
    "availableLanguage": "French"
  }
}
```

### Intégration dans le design

- **Header** : Logo + téléphone cliquable (click-to-call) + CTA "Diagnostic gratuit"
- **Footer** : Adresse complète, téléphone, email, liens réseaux sociaux, SIRET, mention RCS
- **Page "Qui sommes-nous"** : Photos, parcours, certifications, valeurs, LinkedIn individuels
- **Chaque page expertise** : Encart "Besoin d'un accompagnement ?" avec téléphone + formulaire
- **Pages projets** : Noms de villes réelles, secteurs réels (crédibilité terrain)

### Avantage concurrentiel E-E-A-T

Une société réelle avec adresse + téléphone + profils LinkedIn vérifiables donne un avantage SEO significatif par rapport aux sites "vitrine sans entité" :
- Google Knowledge Panel possible à terme
- Éligibilité aux rich snippets LocalBusiness
- Confiance utilisateur → meilleur CTR → meilleur ranking
- Signaux d'autorité pour les requêtes YMYL (investissements, aides financières)

---

## 2. Différenciation anti-duplication

### Résumé des marqueurs d'isolation

| Marqueur | Oteria Conseil |
|---|---|
| **IP/Hébergeur** | IP dédiée E – o2switch |
| **Stack** | Astro 5 + Tailwind CSS 4 (Vite) — ≠ Praxis (TW4 mais config différente), ≠ Valtherm (TW3) |
| **CSS** | Tailwind 4 via `@tailwindcss/vite` + design tokens custom (≠ Praxis config) |
| **Fonts** | **Satoshi + Inter** (self-hosted) — ≠ tous les autres |
| **Icônes** | **Lucide Icons** (SVG inline) — ≠ FontAwesome/Phosphor/Tabler |
| **Images** | WebP, nommage `ot-{slug}-{description}.webp` (préfixe ot-) |
| **Formulaires** | ⏳ À définir (Supabase et/ou Strapi) |
| **Déploiement** | Build Astro → SFTP → o2switch |
| **URL** | Trailing slash (`trailingSlash: 'always'`) |
| **Sitemap** | Plugin Astro auto + filtre custom |
| **Favicon** | `.svg` (unique, géométrique) |
| **Analytics** | Plausible (self-hosted) — ≠ GA4 des autres |
| **Robots.txt** | Standard Astro + commentaires personnalisés |

### Séparateur title

`[Keyword descriptif] – Oteria Conseil` (en dash `–`)

≠ Réseau CEE (`|` ou `-`), ECO Perf (`:`), Praxis (`|` + `--`), Valtherm (`·`), Wattium (`—`)

### Schema.org

| Page | @type |
|---|---|
| Accueil | Organization + WebSite |
| Pages expertise | WebPage + BreadcrumbList + **ProfessionalService** |
| FAQ | FAQPage + BreadcrumbList |
| Guides | **HowTo** + BreadcrumbList |
| Projets | Article + BreadcrumbList |

> **ProfessionalService** est UNIQUE à Oteria (aucun autre site ne l'utilise). HowTo est partagé avec Praxis mais dans un contexte différent (guides opérationnels vs deep-dives techniques).

### Vocabulaire spécifique Oteria

| Concept | Réseau CEE | ECO Perf | Praxis | Valtherm É. | Wattium | **Oteria Conseil** |
|---|---|---|---|---|---|---|
| PAC | Pompe à chaleur | Pompe à chaleur | Pompes à chaleur | Chauffage thermodynamique | Thermopompe | **PAC / Pompe à chaleur** |
| Calorifugeage | Isolation | Calorifugeage & isolation | Calorifugeage & isolation réseaux | Protection thermique réseau | Isolation de réseau | **Calorifugeage** |
| Chaleur fatale | Récupération chaleur | Chaleur fatale | Chaleur fatale | Énergie récupérable | Rejets thermiques valorisables | **Récupération d'énergie** |
| GTB/GTC | GTB/GTC | GTB/GTC | GTB/GTC | Pilotage intelligent | Régulation technique bâtiment | **Gestion technique du bâtiment** |
| Prime CEE | Prime CEE | Prime CEE | Prime CEE | Subvention CEE | Incitation CEE | **Aide CEE** |
| Installateur | — | — | Intégrateur | Partenaire agréé | Bureau d'études | **Professionnel qualifié** |
| Devis | Contact / Devis | Devis | Contact | Analyse de rentabilité | Étude technique | **Diagnostic gratuit** |
| ~~Éclairage~~ | ~~LED / Relamping~~ | — | — | — | — | ~~RETIRÉ (fiche abrogée)~~ |
| VMC | VMC double flux | VMC double flux | VMC double flux | Ventilation haut rendement | Double flux professionnel | **Ventilation mécanique** |
| VEV | Variateurs de vitesse | Variateurs vitesse | Moteurs & variateurs | Entraînement variable | Variation électronique | **Variateurs & moteurs** |

### Ton éditorial

**Phrases types Oteria :**
> "Voici comment en bénéficier concrètement…"
> "Les étapes pour déclencher votre aide CEE…"
> "Ce que vous devez vérifier avant de lancer les travaux…"
> "Notre équipe vous accompagne de A à Z…"

### Patterns H2 autorisés (Oteria)

- "Comment ça fonctionne"
- "À qui s'adresse cette expertise"
- "Les étapes pour en bénéficier"
- "Ce que vous pouvez financer"
- "Résultats concrets sur le terrain"
- "Vos questions, nos réponses"
- "Choisir le bon équipement"
- "Notre accompagnement"
- "Ce qu'il faut retenir"
- "Les erreurs à éviter"
- "Conditions et critères"
- "Budget et aides disponibles"
- "Témoignages et retours d'expérience"

### Patterns H2 INTERDITS (déjà utilisés par d'autres sites)

Voir STRATEGIE-ANTI-DUPLICATION.md §12 pour la liste complète.

---

## 3. Stack technique

| Composant | Choix |
|---|---|
| **Framework** | Astro 5.x (SSG, output static) |
| **CSS** | Tailwind CSS 4 via `@tailwindcss/vite` (≠ Valtherm TW3, ≠ Praxis config) |
| **Plugins** | `@tailwindcss/typography` |
| **Fonts** | Satoshi (titres) + Inter (corps) — self-hosted WOFF2 |
| **Icônes** | Lucide Icons (SVG inline) |
| **Images** | WebP, `<picture>` avec fallback, lazy loading |
| **Formulaires** | ⏳ À définir (Supabase et/ou Strapi) |
| **Déploiement** | `astro build` → SFTP → o2switch (IP dédiée) |
| **URL** | Trailing slash (trailingSlash: 'always') |

---

## 4. Architecture du site

### Logique : CLUSTERS PAR EXPERTISE + SOUS-PAGES OPÉRATIONNELLES

Même modèle que réseau-CEE (clusters de solutions avec sous-pages dédiées) mais :
- Section parent = `/expertises/` (≠ /solutions/)
- Sous-pages nommées différemment (voir pattern ci-dessous)
- Couverture large (35+ clusters, similaire ECO Performance)
- Sections spéciales : Dispositifs CEE, Achat énergie, Mobilité électrique

### Pattern de sous-pages par cluster

Chaque cluster possède un hub + sous-pages variables selon pertinence :

```
/expertises/{solution}/                     Hub (page pilier)
/expertises/{solution}/prime-cee/           Aide CEE & éligibilité
/expertises/{solution}/tarifs/              Coûts & rentabilité
/expertises/{solution}/faq/                 FAQ
/expertises/{solution}/projets/             Cas concrets
/expertises/{solution}/industrie/           Application industrielle
/expertises/{solution}/tertiaire/           Application tertiaire
/expertises/{solution}/collectivites/       Application collectivités
/expertises/{solution}/agriculture/         Application agricole
```

> **Variable** : certains clusters n'ont pas toutes les sous-pages (ex: un cluster purement industriel n'aura pas /agriculture/). D'autres en auront plus (applications spécifiques comme /data-centers/, /hotellerie/, etc.)

### Arborescence complète

```
/                                                        Accueil
│
├── /expertises/                                         Hub : toutes les expertises
│   │
│   │  ─── CHAUFFAGE & ECS ───
│   ├── /pompe-a-chaleur/                               PAC (pompe à chaleur)
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   ├── /agriculture/
│   │   ├── /air-eau/
│   │   ├── /air-air/
│   │   ├── /geothermie/
│   │   ├── /haute-temperature/
│   │   └── /chaleur-fatale/
│   │
│   ├── /chaudiere-condensation/                        Chaudière condensation
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /agriculture/
│   │
│   ├── /chaudiere-biomasse/                            Biomasse
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /agriculture/
│   │
│   ├── /reseau-chaleur/                                Raccordement réseau de chaleur
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /tertiaire/
│   │   └── /collectivites/
│   │
│   ├── /regulation-chauffage/                          Régulation & ECS
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /tertiaire/
│   │   └── /collectivites/
│   │
│   │  ─── FROID & CLIMATISATION ───
│   ├── /froid-commercial/                              Froid commercial CO₂
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /grande-distribution/
│   │   ├── /restauration/
│   │   ├── /logistique/
│   │   └── /agriculture/
│   │
│   ├── /froid-industriel/                              Froid industriel
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   └── /industrie/
│   │
│   ├── /climatisation-performante/                     Climatisation
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /tertiaire/
│   │   └── /collectivites/
│   │
│   ├── /free-cooling/                                  Free cooling
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /industrie/
│   │   └── /data-centers/
│   │
│   │  ─── ISOLATION & ENVELOPPE ───
│   ├── /isolation-thermique/                           Isolation bâtiment
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   ├── /toiture/
│   │   ├── /murs/
│   │   └── /planchers/
│   │
│   ├── /calorifugeage/                                 Isolation réseaux
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   └── /collectivites/
│   │
│   ├── /matelas-isolants/                              Matelas amovibles
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   └── /industrie/
│   │
│   │  ─── ÉCLAIRAGE ───
│   │  ⚠️ Cluster LED/relamping RETIRÉ (fiche CEE BAT-EQ-111 abrogée)
│   │  Conserver uniquement si opportunité hors-CEE identifiée ultérieurement
│   │
│   │  ─── VENTILATION ───
│   ├── /vmc-double-flux/                               VMC double flux
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /agriculture/
│   │
│   ├── /destratificateur/                              Destratificateurs
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /agriculture/
│   │
│   ├── /deshumidificateur/                             Déshumidificateurs
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   └── /agriculture/
│   │
│   │  ─── RÉGULATION & HYDRAULIQUE ───
│   ├── /regulation-chauffage/                          Régulation & optimisation chauffage
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /loi-de-chauffe/
│   │   ├── /robinets-thermostatiques/                  (sous-page, pas un cluster)
│   │   ├── /tertiaire/
│   │   └── /collectivites/
│   │
│   │  ⚠️ Cluster désembouage RETIRÉ (fiche CEE BAR-TH-171 abrogée)
│   │
│   ├── /equilibrage-hydraulique/                       Équilibrage
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /tertiaire/
│   │   └── /collectivites/
│   │
│   │  ─── AIR COMPRIMÉ & PNEUMATIQUE ───
│   ├── /air-comprime/                                  Air comprimé
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /audit/
│   │   └── /agriculture/
│   │
│   │  ─── MOTORISATION & ENTRAÎNEMENT ───
│   ├── /variateur-de-vitesse/                          Variateurs de vitesse
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   └── /industrie/
│   │
│   ├── /moteur-ie4/                                    Moteurs haute efficacité (IE4+)
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   └── /industrie/
│   │
│   │  ─── PILOTAGE & MONITORING ───
│   ├── /gtb-gtc/                                       GTB/GTC
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   ├── /decret-bacs/
│   │   └── /classes-gtb/
│   │
│   ├── /monitoring-energetique/                        Suivi & comptage
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /industrie/
│   │   └── /tertiaire/
│   │
│   │  ─── RÉCUPÉRATION D'ÉNERGIE ───
│   ├── /recuperation-chaleur/                          Chaleur fatale
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   └── /data-centers/
│   │
│   │  ─── CONTRATS & PERFORMANCE ───
│   ├── /cpe/                                           CPE (Contrat de Performance Énergétique)
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /projets/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /coproprietes/
│   │
│   │  ─── AUDIT & DIAGNOSTIC ───
│   ├── /audit-energetique/                             Audit énergétique
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /reglementaire/
│   │
│   │  ─── RÉNOVATION GLOBALE ───
│   ├── /renovation-globale/                            Rénovation globale
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /coproprietes/
│   │
│   │  ─── PROCESS INDUSTRIELS ───
│   ├── /osmose-inverse/                                Osmose inverse (4 400 vol, KD 20) — cluster dédié
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /industrie/
│   │   └── /agroalimentaire/
│   │
│   ├── /process-industriels/                           Fours, séchage…
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /fours/
│   │   └── /sechage/
│   │
│   │  ─── SOLAIRE & AUTOCONSOMMATION ───
│   ├── /photovoltaique/                                PV autoconsommation
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /faq/
│   │   ├── /industrie/
│   │   ├── /tertiaire/
│   │   ├── /collectivites/
│   │   └── /agriculture/
│   │
│   │  ─── SPÉCIFIQUE AGRICULTURE ───
│   ├── /serres-agricoles/                              Écrans, ventilation serres…
│   │   ├── /prime-cee/
│   │   ├── /tarifs/
│   │   ├── /ecrans-thermiques/
│   │   ├── /double-paroi/
│   │   └── /deshumidification-serres/
│   │
│   └── /pre-refroidisseurs-lait/                       Pré-refroidisseurs lait
│       ├── /prime-cee/
│       └── /tarifs/
│
├── /dispositifs/                                        Hub : tout sur les CEE
│   ├── /comprendre-les-cee/                            Guide complet dispositif
│   ├── /fiches-operations/                             Index fiches standardisées
│   │   ├── /bat-th-116/                               Fiche GTB tertiaire
│   │   ├── /bat-th-113/                               Fiche PAC tertiaire
│   │   ├── /bat-th-140/                               Fiche PAC air-air
│   │   ├── /bat-th-142/                               Fiche chaudière condensation
│   │   ├── /ind-ut-117/                               Fiche variateurs industrie
│   │   ├── /ind-ut-137/                               Fiche récup chaleur
│   │   ├── /ind-ba-110/                               Fiche isolation industrie
│   │   ├── /res-ch-104/                               Fiche réseau de chaleur
│   │   ├── /bar-th-159/                               Fiche PAC résidentiel
│   │   └── /…/                                        (30+ fiches à terme)
│   ├── /calcul-prime-cee/                              Calculer sa prime
│   ├── /kwh-cumac/                                     Comprendre les kWh cumac
│   ├── /obliges-cee/                                   Qui sont les obligés
│   ├── /demarches-dossier/                             Monter un dossier
│   ├── /cumul-aides/                                   Cumuler CEE + autres aides
│   ├── /fonds-chaleur-ademe/                           Fonds Chaleur ADEME
│   ├── /delegataire-cee/                               Délégataires CEE (390 vol, KD 11)
│   ├── /mandataire-cee/                                Mandataires CEE (320 vol, KD 13)
│   ├── /legislation-cee/                               Législation & 6ᵉ période
│   ├── /glossaire-cee/                                 Glossaire
│   └── /faq-cee/                                       FAQ CEE globale
│
├── /achat-energie/                                     Hub : courtage énergie
│   ├── /courtier-electricite/                          Courtier électricité
│   ├── /courtier-gaz/                                  Courtier gaz
│   ├── /fournisseurs-electricite/                      Comparatif fournisseurs élec
│   ├── /fournisseurs-gaz/                              Comparatif fournisseurs gaz
│   ├── /contrat-energie-pro/                           Comprendre son contrat
│   ├── /negociation-contrat/                           Renégociation
│   ├── /offre-fixe-vs-indexee/                         Fixe vs indexé
│   ├── /achat-groupe/                                  Achat groupé
│   ├── /ppa-entreprise/                                PPA
│   ├── /autoconsommation/                              Autoconsommation & courtage
│   ├── /optimisation-puissance/                        Puissance souscrite
│   ├── /facture-electricite/                           Lire sa facture élec
│   ├── /facture-gaz/                                   Lire sa facture gaz
│   ├── /taxes-energie/                                 Taxes, TURPE (2 400 vol), TICFE (1 300 vol), accise
│   ├── /prix-electricite-professionnel/                Prix élec pro (CPC 7.74€)
│   ├── /prix-gaz-professionnel/                        Prix gaz pro (CPC 4.78€)
│   ├── /energie-verte-entreprise/                      Énergie verte & garanties d'origine
│   ├── /industrie/                                     Courtage industrie
│   ├── /tertiaire/                                     Courtage tertiaire
│   ├── /collectivites/                                 Courtage collectivités
│   ├── /agriculture/                                   Courtage agriculture
│   ├── /multi-sites/                                   Multi-sites / contrat cadre
│   ├── /calendrier-achat/                              Calendrier optimal
│   ├── /faq/                                           FAQ courtage
│   └── /projets/                                       Cas courtage
│
├── /mobilite-electrique/                               Hub : bornes IRVE
│   ├── /entreprises/                                   Bornes en entreprise
│   ├── /collectivites/                                 Bornes collectivités
│   ├── /coproprietes/                                  Bornes copropriétés
│   ├── /commerce-restauration/                         Bornes commerce & restaurants
│   ├── /hotellerie/                                    Bornes hôtellerie
│   ├── /logistique/                                    Flottes & logistique
│   ├── /parking-public/                                Parkings publics
│   ├── /prime-advenir/                                 Programme ADVENIR
│   ├── /tarifs/                                        Coûts installation
│   ├── /faq/                                           FAQ bornes
│   └── /projets/                                       Cas bornes
│
├── /secteurs/                                           Hub : secteurs d'activité
│   ├── /industrie/                                     Industrie
│   ├── /tertiaire/                                     Tertiaire (bureaux, commerces)
│   ├── /collectivites/                                 Collectivités
│   ├── /agriculture/                                   Agriculture
│   ├── /hotellerie-restauration/                       Hôtellerie & restauration
│   ├── /sante/                                         Santé (hôpitaux, cliniques)
│   ├── /logistique/                                    Logistique & entrepôts
│   ├── /grande-distribution/                           Grande distribution
│   ├── /enseignement/                                  Enseignement
│   └── /coproprietes/                                  Copropriétés & bailleurs
│
├── /reglementation/                                    Hub : obligations & normes
│   ├── /decret-tertiaire/                              Décret tertiaire (5 400 vol, KD 55)
│   ├── /decret-bacs/                                   Décret BACS (3 600 vol, KD 34)
│   ├── /iso-50001/                                     ISO 50001 (3 600 vol, KD 43)
│   ├── /beges/                                         Bilan GES / BEGES (1 900 vol, KD 27)
│   ├── /bilan-carbone-entreprise/                      Bilan carbone (1 300 vol, CPC 5.19€)
│   ├── /taxonomie-verte/                               Taxonomie européenne (880 vol)
│   ├── /operat/                                        Plateforme OPERAT (480 vol)
│   └── /faq/                                           FAQ réglementation
│
├── /guides/                                            Hub : ressources éditoriales
│   ├── /reduire-facture-energie-entreprise/            Guide réduction conso
│   ├── /financer-travaux-economie-energie/             Guide financement
│   ├── /plan-sobriete-energetique/                     Guide sobriété
│   ├── /transition-energetique-entreprise/             Guide transition (320 vol)
│   ├── /efficacite-energetique-entreprise/             Guide efficacité (140 vol, CPC 2.52€)
│   └── /glossaire/                                     Glossaire général
│
├── /diagnostic-gratuit/                                Formulaire principal (CTA)
├── /qui-sommes-nous/                                   Présentation
├── /mentions-legales/                                  Légal
└── /politique-confidentialite/                         RGPD
```

---

## 5. Comptage des pages (estimation)

| Section | Pages estimées |
|---|---|
| /expertises/ (35 clusters × ~8 pages moy. + ~12 comparatives) | ~292 |
| /dispositifs/ (hub + fiches + guides CEE) | ~44 |
| /achat-energie/ (courtage + pages CPC + comparatives) | ~30 |
| /mobilite-electrique/ (bornes IRVE) | ~12 |
| /reglementation/ (décrets, normes, obligations) | ~9 |
| /secteurs/ (secteurs d'activité) | ~11 |
| /guides/ (informationnels top-funnel) | ~7 |
| /zones-intervention/ (SEO local) | ~8 |
| Pages utilitaires (accueil, contact, légal…) | ~5 |
| **TOTAL** | **~418** |

> Augmentation vs. estimation précédente : +2 clusters (Régulation, Osmose inverse dédiée), section /reglementation/ extraite des guides, pages CPC courtage ajoutées. La couche /zones-intervention/ dépend de la zone géographique réelle d'Oteria.

---

## 6. Stratégie de publication (modulaire)

### Principe : chaque cluster = unité autonome publiable

Un cluster est publié EN ENTIER (hub + toutes ses sous-pages) sur une période de 1-2 semaines max. Ne jamais publier un hub sans ses sous-pages — l'autorité topicale se construit sur la profondeur.

### Calendrier indicatif (18 mois)

| Phase | Mois | Contenu | Pages estimées |
|---|---|---|---|
| **P1 — Socle** | M1-M2 | Accueil, légal, /secteurs/ (10 pages), /dispositifs/ socle (comprendre-les-cee, calcul-prime, kwh-cumac, obliges, demarches, legislation, glossaire, FAQ = 8 pages) + **2 clusters prioritaires** (à définir) | ~35-40 |
| **P2 — Premiers clusters** | M3-M4 | **3-4 clusters** (à définir selon priorités) + fiches CEE associées (5-6 fiches) | ~40-50 |
| **P3 — Croissance** | M5-M6 | **3-4 clusters** + /achat-energie/ socle (hub + 8 pages core) + fiches CEE | ~45-55 |
| **P4 — Expansion** | M7-M8 | **3-4 clusters** + /mobilite-electrique/ complet + fiches CEE | ~45-55 |
| **P5 — Densification** | M9-M10 | **3-4 clusters** + /achat-energie/ suite + /guides/ | ~45-55 |
| **P6 — Maturation** | M11-M12 | **3-4 clusters** + /dispositifs/ suite (fiches additionnelles) | ~40-50 |
| **P7 — Couverture large** | M13-M14 | **3-4 clusters** (niches, process, spécifique agriculture) | ~35-45 |
| **P8 — Finition** | M15-M18 | Derniers clusters + pages manquantes + optimisations (enrichissement des clusters P1-P2 après données GSC) | ~35-45 |

### Flexibilité des phases

> ⚠️ Les clusters sont assignés aux phases par priorité SEO (volume de recherche, potentiel business). Cette assignation sera finalisée ultérieurement. Chaque cluster peut être déplacé d'une phase à l'autre sans impacter l'architecture globale.

### Priorités SEO — classement data-driven (SEMrush mai 2025)

Classement par **score d'opportunité** = Volume ÷ KD. Un cluster facile avec bon volume passe devant un cluster à fort volume mais KD élevé.

#### P1 — Quick wins à fort volume (M1-M3)

| Cluster | Keyword principal | Volume | KD | CPC | Score |
|---|---|---|---|---|---|
| **VMC** | vmc double flux | 27 100 | 27 | 0.26€ | ★★★★★ |
| **Variateurs** | variateur de vitesse | 2 400 | 14 | 0.28€ | ★★★★★ |
| **Destratificateur** | destratificateur | 3 600 | 15 | 0.72€ | ★★★★★ |
| **Air comprimé** | air comprimé | 2 400 | 19 | 0.54€ | ★★★★☆ |
| **Courtage énergie** | courtier énergie | 720 | 37 | 4.09€ | ★★★★☆ (CPC!) |

> Rationale P1 : VMC est le meilleur ratio volume/KD de tout le dataset. Destratificateur et Variateurs ont des KD < 15 = positionnement rapide garanti. Le courtage entre en P1 pour le CPC (10-22€ par clic, revenu lead-gen maximal).

#### P2 — Piliers à volume (M3-M5)

| Cluster | Keyword principal | Volume | KD | CPC | Score |
|---|---|---|---|---|---|
| **PAC** | pompe a chaleur | 60 500 | 39 | 1.94€ | ★★★★☆ |
| **GTB/GTC** | gtb | 5 400 | 33 | 0.90€ | ★★★★☆ |
| **Osmose inverse** | osmose inverse | 4 400 | 20 | 0.43€ | ★★★★☆ |
| **Calorifugeage** | calorifugeage | 3 600 | 28 | 0.45€ | ★★★☆☆ |
| **Isolation** | isolation thermique | 9 900 | 37 | 0.61€ | ★★★☆☆ |

> Rationale P2 : PAC doit mûrir (KD 39 = 3-4 mois avant résultats). GTB = actualité décret BACS. Osmose inverse = KD 20, cluster dédi�� facile. Isolation = gros volume transactionnel B2B (industrie + tertiaire + collectivités).

#### P3 — Volume + Autorité thématique (M5-M7)

| Cluster | Keyword principal | Volume | KD | CPC | Score |
|---|---|---|---|---|---|
| **Climatisation** | climatisation | 27 100 | 49 | 1.09€ | ★★★☆☆ |
| **Audit énergétique** | audit énergétique | 9 900 | 54 | 1.30€ | ★★☆☆☆ |
| **CPE** | cpe | 14 800 | 34 | 0.47€ | ★★★☆☆ |
| **Bornes IRVE** | borne de recharge | 22 200 | 41 | 1.06€ | ★★★☆☆ |
| **Chaudière** | chaudière biomasse | 2 900 | 19 | 0.49€ | ★★★★☆ |

> Rationale P3 : Climatisation (27K vol) est énorme mais KD 49. L'audit a un KD 54 mais des CPC high-value en B2B. IRVE = marché ultra-concurrentiel (pure-players installateurs). Chaudière biomasse = KD 19, facile.

#### P4 — Densification CEE + Réglementation (M7-M9)

| Cluster | Keyword principal | Volume | KD | CPC | Score |
|---|---|---|---|---|---|
| **CEE (dispositifs)** | prime cee | 12 100 | 54 | 1.80€ | ★★☆☆☆ |
| **Décret tertiaire** | décret tertiaire | 5 400 | 55 | 0.67€ | ★★☆☆☆ |
| **Free cooling** | free cooling | 1 000 | 26 | 1.68€ | ★★★☆☆ |
| **Froid** | froid commercial | 590 | 10 | 1.52€ | ★★★★☆ |
| **Régulation** | régulation chauffage | 140 | 11 | 0.58€ | ★★★☆☆ |

> Rationale P4 : CEE et décret tertiaire ont des KD élevés mais sont stratégiques (cœur de métier Oteria). Free cooling et Froid sont faciles mais volumes modérés. Régulation = secondaire (robinet thermostatique surtout B2C/résidentiel, peu de valeur lead-gen).

#### P5 — Autorité complète (M9-M11)

| Cluster | Keyword principal | Volume | KD | CPC | Score |
|---|---|---|---|---|---|
| **Récupération chaleur** | chaleur fatale | 140 | 28 | — | ★★☆☆☆ |
| **Déshumidification** | déshumidificateur pro | 1 300 | 15 | 0.84€ | ★★★☆☆ |
| **Monitoring** | monitoring énergétique | 140 | 9 | 1.48€ | ★★★☆☆ |
| **Moteurs HE** | moteur ie5 | 110 | 9 | 1.18€ | ★★★☆☆ |
| **Hydraulique** | équilibrage hydraulique | 70 | 18 | — | ★★☆☆☆ |

> Note : "déshumidificateur" générique (27K) est majoritairement B2C. Seul "déshumidificateur professionnel" (1 300) et "industriel" (320) sont B2B pertinents.

#### P6-P8 — Niches & long tail (M11-M18)

| Cluster | Keyword principal | Volume | KD |
|---|---|---|---|
| Photovoltaïque | photovoltaique | 9 900 | 63 |
| Réseau de chaleur | réseau de chaleur | 1 600 | 41 |
| Rénovation globale | rénovation globale | 1 000 | 50 |
| Process industriels | process industriel | 260 | 15 |
| Serres agricoles | serre agricole | 1 000 | 20 |
| Pré-refroidisseurs lait | tank à lait | 1 000 | 14 |
| Décarbonation | décarbonation industrie | 390 | 20 |
| Échangeurs | échangeur thermique | 40 | — |
| Matelas isolants | matelas isolant | 260 | 15 |

> Rationale P6-P8 : Photovoltaïque a un gros volume mais KD 63 = attendre l'autorité du site. Serres/lait/process = niches B2B faciles mais volumes faibles. Décarbonation = futur poids lourd, construire l'autorité tôt.

---

### Goldmines CPC — Pages monétisation prioritaires

Ces keywords ont des CPC exceptionnels → pages à optimiser pour la conversion lead-gen :

| Keyword | CPC | Volume | Page cible |
|---|---|---|---|
| fournisseur électricité professionnel | **21.86€** | 320 | /achat-energie/fournisseurs-electricite/ |
| contrat gaz entreprise | **20.48€** | 50 | /achat-energie/contrat-energie-pro/ |
| courtier électricité professionnel | **19.18€** | 50 | /achat-energie/courtier-electricite/ |
| fournisseur gaz professionnel | **13.99€** | 260 | /achat-energie/fournisseurs-gaz/ |
| contrat énergie professionnel | **10.84€** | 40 | /achat-energie/contrat-energie-pro/ |
| tarif gaz entreprise | **7.29€** | 40 | /achat-energie/courtier-gaz/ |
| bilan carbone entreprise | **5.19€** | 1 300 | /guides/bilan-carbone-entreprise/ |
| courtage énergie | **4.09€** | 170-720 | /achat-energie/ (hub) |
| photovoltaïque professionnel | **3.91€** | 140 | /expertises/photovoltaique/ |
| audit énergétique industriel | **3.63€** | 390 | /expertises/audit-energetique/industrie/ |

> Le courtage énergie génère des leads à 10-22€/clic en AdWords. En SEO organique, chaque position gagnée sur ces requêtes = ROI massif.

---

## 7. Maillage interne (stratégie)

### Intra-cluster
- Chaque sous-page lie vers le hub et vers 3-4 autres sous-pages du même cluster
- Le hub lie vers TOUTES les sous-pages

### Inter-cluster (cross-linking)
- Chaque page de cluster lie vers 2-3 clusters sémantiquement proches
- Exemples de liens sémantiques naturels :
  - PAC ↔ isolation, VMC, récupération chaleur, équilibrage hydraulique
  - GTB ↔ monitoring, régulation, CPE, variateurs
  - Air comprimé ↔ variateurs, récupération chaleur, motorisation
  - Isolation ↔ VMC, PAC, audit, enveloppe bâtiment
  - Froid ↔ free cooling, récupération chaleur, GTB

### Depuis /secteurs/ (pages secteurs)
- Chaque page secteur lie vers 5-8 clusters pertinents pour ce secteur
- Ex: /secteurs/industrie/ → PAC, air comprimé, variateurs, récupération chaleur, process, GTB, monitoring, froid industriel

### Depuis /dispositifs/ (pages CEE)
- Chaque fiche CEE lie vers le cluster expertise correspondant
- Les pages dispositifs transversales (calcul-prime, kwh-cumac) lient vers 5-6 clusters

---

## 8. SEO technique

### Canonicals
- `<link rel="canonical" href="https://oteria-conseil.fr/{path}/">` (avec trailing slash)
- Aucun canonical cross-domain

### Sitemap
- Généré par le plugin Astro sitemap
- `<changefreq>` et `<priority>` configurés par section
- Soumis à la Search Console dès Phase 1

### Robots.txt
```
User-agent: *
Allow: /
Sitemap: https://oteria-conseil.fr/sitemap-index.xml
```

### Performance
- Score Lighthouse > 95 (SSG + Astro = facile)
- Images optimisées WebP, lazy-loaded
- Critical CSS inline
- 0 JS bloquant (Astro islands seulement pour interactivité formulaires)

### Meta tags par page
- `<title>` < 60 chars, mot-clé en premier
- `<meta description>` < 155 chars, incitative
- `og:title` + `og:description` synchronisés avec title/meta
- `<link rel="canonical">`
- BreadcrumbList JSON-LD sur toutes les pages

---

## 9. Corrections & itérations SEO (audit interne v2)

### 9.1 CRITIQUE — Slugs clusters non alignés sur les requêtes réelles

**Problème** : `/pac-chauffage/` ne correspond à AUCUNE requête réelle. Personne ne tape "pac chauffage". Les gens cherchent "pompe à chaleur", "pac", "pompe à chaleur professionnelle".

**Règle SEO** : le slug DOIT contenir le mot-clé principal. L'anti-duplication est déjà assurée par le chemin parent `/expertises/` (unique à Oteria). Le slug enfant peut donc être keyword-rich.

**Corrections slugs :**

| Ancien slug | Nouveau slug | Justification |
|---|---|---|
| `/pac-chauffage/` | `/pompe-a-chaleur/` | Keyword exact. Le full path `/expertises/pompe-a-chaleur/` est unique (≠ `/solutions/pompe-a-chaleur/` de réseau-CEE) |
| `/chaudiere-haut-rendement/` | `/chaudiere-condensation/` | C'est le terme recherché, pas "haut rendement" |
| `/reseau-air-comprime/` | `/air-comprime/` | Personne ne cherche "réseau air comprimé" — ils cherchent "air comprimé" |
| `/variateurs-moteurs/` | `/variateur-de-vitesse/` | Requête exacte (singulier = plus recherché) |
| `/gestion-technique-batiment/` | `/gtb-gtc/` | Les pros cherchent "GTB", "GTC", "GTB GTC" — pas le mot complet |
| `/recuperation-energie/` | `/recuperation-chaleur/` | "Récupération chaleur" >> "récupération énergie" en volume |
| `/brassage-air/` | `/destratificateur/` | C'est LE terme recherché |
| `/ventilation-mecanique/` | `/vmc-double-flux/` | "VMC double flux" = la requête exacte |
| `/equilibrage-hydraulique/` | OK tel quel | Requête correcte |
| `/motorisation-efficace/` | `/moteur-ie4/` | Les pros cherchent "moteur IE4" ou "moteur IE5" |
| `/contrat-performance-energetique/` | `/cpe/` | Le sigle est 10× plus recherché que le terme complet |
| `/audit-energie/` | `/audit-energetique/` | "Audit énergétique" = requête exacte |
| `/deshumidification/` | `/deshumidificateur/` | Le nom de l'équipement, pas le processus |

> **Principe** : le slug = la requête que les gens tapent dans Google, pas un synonyme créatif. L'anti-duplication se joue sur le chemin parent, le ton, le contenu — PAS sur les slugs enfants.

### 9.2 CRITIQUE — Sous-pages "/questions-frequentes/" trop long

**Problème** : `/questions-frequentes/` = 21 caractères. `/faq/` = 4 caractères. Google comprend "/faq/" universellement. Des millions de sites l'utilisent — ce n'est PAS un signal de réseau.

**Correction** : utiliser `/faq/` au lieu de `/questions-frequentes/`.

De même, `/prime-cee/` est correct (c'est une requête réelle). Mais attention à la confusion d'intent :
- "prime CEE pompe à chaleur" = montant de la prime → page `/prime-cee/`
- "éligibilité CEE pompe à chaleur" = conditions pour y avoir droit → même page ou page distincte ?

**Recommandation** : garder UNE page `/prime-cee/` qui couvre montant + éligibilité + démarches pour ce cluster. Si le volume le justifie (données SEMrush à venir), splitter en deux pages.

### 9.3 IMPORTANT — Cannibalization /dispositifs/ vs /expertises/

**Risque** : `/dispositifs/fiches-operations/bat-th-113/` et `/expertises/pompe-a-chaleur/prime-cee/` vont se battre pour les mêmes requêtes ("prime cee pompe à chaleur", "bat-th-113 conditions").

**Solution — répartition d'intent claire :**

| Intent | Page qui cible | Contenu |
|---|---|---|
| "prime cee pompe à chaleur" (transactionnel) | `/expertises/pompe-a-chaleur/prime-cee/` | Montant, conditions spécifiques PAC, comment en bénéficier, CTA |
| "bat-th-113" (informationnel technique) | `/dispositifs/fiches-operations/bat-th-113/` | Détail technique de la fiche, critères normatifs, zonage climatique, calcul kWhc |
| "fiches cee tertiaire" (navigational) | `/dispositifs/fiches-operations/` | Index de toutes les fiches, filtrées par secteur |

**Maillage anti-cannibalization :**
- `/expertises/pompe-a-chaleur/prime-cee/` → lien vers fiche technique : "Consultez le détail de la fiche BAT-TH-113"
- `/dispositifs/fiches-operations/bat-th-113/` → lien vers usage : "Voir comment bénéficier de cette prime pour votre PAC"
- Le canonical de chaque page reste sur elle-même (pas de canonical croisé)

### 9.4 IMPORTANT — Page d'accueil = page la plus puissante

**Manque actuel** : aucune spécification du contenu d'accueil.

**Structure recommandée pour la homepage :**

```
H1: Oteria Conseil – Performance énergétique et aides CEE pour les professionnels

Section 1: Hero + proposition de valeur + CTA "Diagnostic gratuit"
Section 2: Chiffres clés (X projets, X€ de primes obtenues, X% d'économies moyennes)
Section 3: Nos expertises (cards vers les 6-8 clusters principaux) ← DISTRIBUE LE LINK JUICE
Section 4: Comment ça marche (3 étapes : diagnostic → travaux → prime)
Section 5: Secteurs accompagnés (liens vers /secteurs/)
Section 6: Témoignages / logos clients
Section 7: Derniers projets (liens vers cas concrets)
Section 8: CTA final + téléphone + formulaire
```

**SEO accueil** :
- Title : `Oteria Conseil – Aides CEE et performance énergétique professionnelle`
- La homepage doit lier vers CHAQUE section de niveau 1 (/expertises/, /dispositifs/, /achat-energie/, /mobilite-electrique/, /secteurs/)
- Les clusters prioritaires doivent être liés DIRECTEMENT depuis l'accueil (pas juste via /expertises/)

### 9.5 IMPORTANT — Densité de maillage interne insuffisante

**Problème actuel** : "2-3 clusters" en cross-linking. L'audit de réseau-CEE montre que 6+ liens intra-cluster + 4+ liens cross-cluster par page = minimum pour ranker.

**Nouvelles règles de maillage :**

| Type | Minimum par page | Exemple |
|---|---|---|
| Lien vers le hub du cluster | 1 (obligatoire) | /pompe-a-chaleur/ depuis chaque sous-page |
| Liens intra-cluster (autres sous-pages) | 4 minimum | /prime-cee/ → /tarifs/, /industrie/, /faq/, /projets/ |
| Liens cross-cluster (autres expertises) | 3 minimum | PAC → isolation, VMC, récupération chaleur |
| Liens vers /dispositifs/ | 1 minimum | Vers la fiche CEE correspondante |
| Liens vers /secteurs/ | 1 si pertinent | Vers le secteur principal |
| Lien CTA | 1 (obligatoire) | /diagnostic-gratuit/ |

**Total minimum : 10 liens internes par page.**

### 9.6 IMPORTANT — Templates de contenu manquants

Chaque type de page doit suivre un template structurel :

**Template HUB cluster** (~1500-2000 mots) :
```
H1: [Keyword principal] – Oteria Conseil
├── Intro (définition rapide + promesse + CTA inline)
├── H2: Comment ça fonctionne
├── H2: À qui s'adresse cette expertise
├── H2: Les avantages concrets
├── H2: Aides et financements disponibles (résumé + lien /prime-cee/)
├── H2: Notre accompagnement (processus en étapes)
├── H2: Résultats concrets sur le terrain (extrait + lien /projets/)
├── H2: Vos questions, nos réponses (3-5 FAQ inline + lien /faq/ pour le reste)
└── CTA final + téléphone
```

**Template sous-page /prime-cee/** (~1000-1500 mots) :
```
H1: Aide CEE [solution] : montant, conditions et démarches
├── Intro (combien vous pouvez toucher + lien fiche)
├── H2: Montant de la prime CEE [solution] (tableau par type/puissance)
├── H2: Conditions d'éligibilité
├── H2: Les étapes pour en bénéficier
├── H2: Cumul avec d'autres aides
├── H2: Les erreurs à éviter
└── CTA: "Estimez votre prime"
```

**Template sous-page /tarifs/** (~1000-1500 mots) :
```
H1: Prix [solution] : coûts, rentabilité et retour sur investissement
├── Intro (fourchette rapide)
├── H2: Tarifs par type/puissance (tableau)
├── H2: Ce qui influence le prix
├── H2: Rentabilité et temps de retour
├── H2: Budget et aides disponibles (lien /prime-cee/)
└── CTA: "Obtenez un chiffrage personnalisé"
```

**Template sous-page sectorielle** (~1000-1400 mots) :
```
H1: [Solution] pour [secteur] : guide complet
├── Intro (pourquoi ce secteur est concerné)
├── H2: Applications spécifiques [secteur]
├── H2: Contraintes et solutions adaptées
├── H2: Aides spécifiques (lien /prime-cee/)
├── H2: Exemple de projet (lien /projets/)
└── CTA sectoriel
```

### 9.7 MOYEN — Stratégie de fraîcheur du contenu

Les CEE évoluent constamment (abrogations, nouvelles fiches, changements de barème). Plan :

| Événement | Action | Délai |
|---|---|---|
| Fiche CEE abrogée | Retirer le cluster ou pivoter vers contenu hors-CEE | < 2 semaines |
| Nouveau barème kWhc | Mettre à jour /dispositifs/ + toutes les /prime-cee/ | < 1 semaine |
| Nouvelle fiche publiée | Créer la page fiche + évaluer la création d'un cluster | < 1 mois |
| Changement décret tertiaire/BACS | MAJ pages concernées + article dans /guides/ | < 2 semaines |
| Données GSC à 3 mois | Audit positions + enrichissement pages sous-performantes | Trimestriel |

### 9.8 MOYEN — Architecture de conversion (funnel)

Chaque page doit avoir un chemin vers la conversion :

```
[Page expertise/dispositif/courtage]
    ↓ CTA contextuel ("Estimez votre prime" / "Diagnostic gratuit")
    ↓
/diagnostic-gratuit/  (formulaire qualifié)
    ↓ Champs : type de projet, secteur, surface/puissance, coordonnées
    ↓
Confirmation + suivi (backend à définir : Supabase ou Strapi)
```

**Placement des CTA :**
- Sticky CTA mobile (bouton flottant "Appeler" ou "Diagnostic")
- CTA inline après le 2ᵉ H2 de chaque page
- CTA en fin de page (toujours)
- Encart latéral sur desktop (formulaire court)
- Header : téléphone + bouton CTA

### 9.9 ✅ Nettoyage maillage §7

Corrigé : LED et désembouage supprimés des exemples cross-cluster §7. Nouveaux liens :
- PAC ↔ isolation, VMC, récupération chaleur, équilibrage hydraulique
- GTB ↔ monitoring, régulation, CPE, variateurs
- Air comprimé ↔ variateurs, récupération chaleur, motorisation
- Isolation ↔ VMC, PAC, audit, enveloppe bâtiment
- Froid ↔ free cooling, récupération chaleur, GTB

### 9.10 IMPORTANT — Pages comparatives (vs concurrents indirects)

**Constat** : Les requêtes "X vs Y" et "alternative à X" sont transactionnelles avec KD faible. Les comparateurs/courtiers énergie les ignorent souvent.

**Pages à prévoir dans /achat-energie/ :**
```
/achat-energie/comparatif-courtiers-energie/
/achat-energie/courtier-vs-direct-fournisseur/
/achat-energie/selectra-vs-courtier/
```

**Pages à prévoir dans /expertises/ (niveau cluster) :**
```
/expertises/pompe-a-chaleur/pac-vs-chaudiere-gaz/
/expertises/gtb-gtc/gtb-vs-automate-classique/
/expertises/vmc-double-flux/simple-flux-vs-double-flux/
```

**Règle** : max 1-2 pages comparatives par cluster. Pas de diffamation, toujours neutre et factuel. Ces pages capturent du trafic bottom-funnel avec un CTA "besoin d'aide pour choisir ?".

### 9.11 MOYEN — Couche locale (SEO géographique)

**Constat** : Une vraie société = possibilité de capter des requêtes locales ("courtier énergie [ville]", "audit énergétique [région]"). La plupart des sites du portfolio n'ont pas d'entité locale, Oteria oui.

**Approche** :
- NE PAS créer de doorway pages (spam geo). Google les pénalise.
- CRÉER une page /zones-intervention/ qui liste les zones couvertes
- Intégrer la dimension locale dans les pages /secteurs/ existantes via des sections "Nos interventions en [région]"
- Google Business Profile → déclenche le Knowledge Panel local
- JSON-LD LocalBusiness (ou ProfessionalService + areaServed) sur les pages pertinentes

**Structure :**
```
/zones-intervention/                    Hub zones
├── /ile-de-france/                     Zone IDF
├── /hauts-de-france/                   Zone HdF
├── /auvergne-rhone-alpes/             Zone ARA
└── /…/                                 (selon zone réelle d'activité)
```

**Impact estimé** : +15-25 pages à terme (dépend de la zone réelle couverte par Oteria Conseil). À confirmer quand l'adresse est connue.

### 9.12 IMPORTANT — Stratégie de contenu /guides/ (informationnel pur)

**Constat** : Les guides capturent du trafic top-funnel et construisent l'autorité thématique. Ils ne sont pas liés à un cluster spécifique mais au domaine global.

**Pages prévues :**
```
/guides/comment-reduire-facture-energie-entreprise/
/guides/obligations-energetiques-entreprises-2025/
/guides/plan-sobriete-energetique/
/guides/financer-travaux-economie-energie/
/guides/decret-tertiaire-guide-complet/
/guides/choisir-fournisseur-energie-professionnel/
```

**Règle** : chaque guide lie vers 3-5 clusters pertinents + 1 CTA diagnostic. Format long (1500-2500 mots). Mise à jour annuelle (freshness signal). Pas de duplication avec les pages /dispositifs/ — le guide explique le "pourquoi", le dispositif explique le "comment administratif".

### 9.13 CRITIQUE — Insights data SEMrush (itération v3)

**Source** : `data/keywords_seo_consolide_v2.csv` — 401 keywords, mai 2025.

#### Découvertes clés qui ont modifié l'architecture :

1. **VMC double flux (27 100 vol, KD 27) est le meilleur ratio du dataset.** Anciennement en P3, remis en P1. C'est plus facile à ranker que PAC (KD 39) avec un volume comparable à climatisation.

2. **Robinet thermostatique (9 900 vol, KD 25) = volume trompeur.** Intent majoritairement résidentiel/B2C. Rétrogradé en sous-page de /regulation-chauffage/ — pas de cluster dédié.

3. **Osmose inverse (4 400 vol, KD 20) mérite un cluster dédié.** Enterré sous Process industriels, son volume et sa facilité justifient une page hub autonome.

4. **Le courtage a les CPC les plus élevés du dataset (10-22€/clic).** La section /achat-energie/ est la machine à leads n°1. Pages prix, contrats et comparatifs ajoutées.

5. **"Déshumidificateur" (27 100 vol) est un piège.** L'intent est 95% B2C (particuliers qui achètent un appareil 200€). Seuls "professionnel" (1 300) et "industriel" (320) sont B2B. Le cluster reste mais ciblé B2B uniquement.

6. **Décret tertiaire + ISO 50001 + BEGES forment un cluster Réglementation** distinct des /dispositifs/ CEE. Section /reglementation/ créée avec 9 pages.

7. **Les brand keywords (edf pro 60.5K, engie pro 60.5K) sont un levier indirect.** Pages comparatives "/achat-energie/comparatif-fournisseurs-*" pour capter une fraction de ce trafic sans attaquer les marques frontalement.

8. **CPE = 14 800 vol mais KD 34.** Volume trompeur car "CPE" = polysémie (Compte Personnel d'Épargne, Centre de Production d'Énergie…). Cibler "contrat performance énergétique" (140 vol) comme intent précis, en H1 de la page.

#### Résumé : modifications arborescence v3

| Action | Détail |
|---|---|
| ✅ Nouveau cluster | /expertises/regulation-chauffage/ (robinet thermostatique = sous-page) |
| ✅ Cluster promu | /expertises/osmose-inverse/ (sorti de Process) |
| ✅ Nouvelle section | /reglementation/ (7 pages : décret tertiaire, BACS, ISO 50001, BEGES, bilan carbone, taxonomie, OPERAT) |
| ✅ Pages CPC ajoutées | /achat-energie/prix-electricite-professionnel/, /prix-gaz-professionnel/, /energie-verte-entreprise/ |
| ✅ Guides enrichis | 6 guides data-driven basés sur les keywords informationnels à volume |
| ✅ Priorités refondues | Classement Vol÷KD au lieu du simple volume brut |
| ✅ Décompte | ~418 pages (vs ~389 précédent) |

### 9.14 CRITIQUE — Keyword-to-URL mapping (anti-cannibalization definitive)

Un site de 418 pages sur la thématique CEE/énergie CANNIBALISERA sans une matrice keyword → URL stricte. Chaque keyword cible UNE page et une seule.

**Règle absolue** : si deux pages pourraient ranker sur le même keyword, une seule le cible dans son title/H1. L'autre utilise le keyword en variante longue-traîne ou en lien contextuel.

**Mapping des requêtes à risque :**

| Keyword | Volume | Page UNIQUE qui cible | Pages qui NE ciblent PAS (mais lient) |
|---|---|---|---|
| prime cee | 12 100 | /dispositifs/ (hub) | /expertises/*/prime-cee/ (ciblent "prime cee + [solution]") |
| pompe à chaleur | 60 500 | /expertises/pompe-a-chaleur/ | /dispositifs/fiches-operations/bat-th-113/ |
| décret bacs | 3 600 | /reglementation/decret-bacs/ | /expertises/gtb-gtc/decret-bacs/ (cible "gtb décret bacs") |
| courtier énergie | 720 | /achat-energie/ (hub) | /achat-energie/courtier-electricite/ (cible "courtier électricité") |
| audit énergétique | 9 900 | /expertises/audit-energetique/ | /reglementation/ pages (ciblent "obligation audit") |
| cee | 27 100 | /dispositifs/ (hub, title : "CEE : tout sur les Certificats d'Économie d'Énergie") | tout le reste |
| borne de recharge | 22 200 | /mobilite-electrique/ (hub) | sous-pages ciblent "borne recharge + [secteur]" |
| décret tertiaire | 5 400 | /reglementation/decret-tertiaire/ | /guides/ (cible "comprendre décret tertiaire") |
| vmc double flux | 27 100 | /expertises/vmc-double-flux/ | aucune autre page ne cible ce keyword |
| robinet thermostatique | 9 900 | /expertises/regulation-chauffage/robinets-thermostatiques/ | — (sous-page, pas cluster — intent résidentiel, secondaire) |
| froid commercial | 590 | /expertises/froid-commercial/ | /expertises/free-cooling/ (cible "free cooling" uniquement) |

**Title tag formula par type de page :**

| Type | Template title | Exemple |
|---|---|---|
| Hub cluster | `[Keyword exact] – Oteria Conseil` | `Pompe à chaleur – Oteria Conseil` |
| Sous-page /prime-cee/ | `Prime CEE [solution] : montant et conditions` | `Prime CEE pompe à chaleur : montant et conditions` |
| Sous-page /tarifs/ | `[Solution] : prix, coûts et rentabilité` | `Air comprimé : prix, coûts et rentabilité` |
| Sous-page /faq/ | `[Solution] : questions fréquentes` | `VMC double flux : questions fréquentes` |
| Sous-page /[secteur]/ | `[Solution] pour [secteur] : guide complet` | `GTB pour l'industrie : guide complet` |
| Page /dispositifs/ fiche | `Fiche CEE [code] : [intitulé court]` | `Fiche CEE BAT-TH-116 : GTB tertiaire` |
| Page /reglementation/ | `[Réglementation] : obligations et échéances` | `Décret BACS : obligations et échéances` |
| Page /achat-energie/ | `[Keyword] – Oteria Conseil` | `Courtier électricité professionnel – Oteria Conseil` |
| Page /secteurs/ | `Performance énergétique [secteur] : solutions et aides` | `Performance énergétique industrie : solutions et aides` |

### 9.15 CRITIQUE — Crawl budget & indexation progressive

**Problème** : un site neuf avec 0 backlinks ne fera PAS indexer 418 pages en 3 mois. Google alloue un crawl budget limité aux nouveaux domaines.

**Stratégie d'indexation progressive :**

| Phase | Pages à indexer | Action |
|---|---|---|
| Semaine 1-2 | ~15 pages | Homepage + hubs (/expertises/, /dispositifs/, /achat-energie/, /mobilite-electrique/, /secteurs/, /reglementation/) + pages trust (légal, confidentialité, qui-sommes-nous) + premiers clusters P1 (hubs uniquement) |
| Mois 1 | ~50 pages | Clusters P1 complets (VMC, Variateurs, Destratificateur, Air comprimé, Courtage) avec toutes leurs sous-pages |
| Mois 2-3 | ~120 pages | Clusters P2 + fiches CEE principales + pages /reglementation/ |
| Mois 4+ | +50/mois | Publication continue selon phases |

**Techniques d'accélération du crawl :**

1. **Sitemap dynamique** — Soumettre un sitemap ne contenant QUE les pages publiées (pas de 404, pas de pages futures)
2. **IndexNow** — Ping Bing/Yandex à chaque publication (plugin Astro ou post-build hook)
3. **Google Indexing API** — via Search Console, request indexation manuelle des 20 premières pages
4. **Maillage interne dense dès J1** — les pages publiées doivent s'inter-lier immédiatement (pas de pages orphelines)
5. **Backlinks d'amorce** — LinkedIn Oteria Conseil → lien vers le site. Google Business Profile. Annuaires pro (Pages Jaunes, Societe.com, Infogreffe)
6. **0 pages noindex parmi les 50 premières** — toutes indexables. Le noindex ne sert qu'aux pages de pagination ou utilitaires

**Pages à NE JAMAIS noindexer :**
- Hubs de clusters
- Pages /prime-cee/ (intent transactionnel)
- Pages /reglementation/ (volumes propres)

**Pages à noindexer à terme (si > 500 pages) :**
- Pages /projets/ individuelles si thin (< 500 mots)
- Pages de pagination (/page/2/, /page/3/...)
- Tags/catégories auto-générés (si utilisés)

### 9.16 IMPORTANT — Thin content risk & minimum viable page

**Problème** : 35 clusters × sous-pages /prime-cee/, /tarifs/, /faq/ = potentiellement 105 pages quasi-identiques ("La prime CEE pour [X] est de...").

**Règle anti-thin :**

| Type de sous-page | Minimum | Ce qui la différencie |
|---|---|---|
| /prime-cee/ | 800 mots | Montant précis, fiches CEE associées, conditions SPÉCIFIQUES à cette solution, simulateur, exemple chiffré, démarches pas-à-pas |
| /tarifs/ | 600 mots | Fourchettes de prix RÉELLES pour cette solution, ROI, temps de retour, comparaison ancienne vs nouvelle solution, facteurs de coût |
| /faq/ | 500 mots (5 questions min.) | Questions UNIQUES à ce cluster. Si la question est identique à un autre cluster → ne pas la dupliquer |
| /[secteur]/ | 1 000 mots | Contraintes SPÉCIFIQUES au secteur, exemples réels, normes sectorielles, cas concrets |

**Test anti-thin** : si tu peux remplacer le nom de la solution dans le texte par un autre et que ça reste vrai → c'est du thin content. Chaque page doit contenir des informations IMPOSSIBLES à déduire des autres pages.

**Solution programmatique** : pour les /prime-cee/ et /tarifs/, créer un template MDX avec des variables (montant, fiches, conditions) mais OBLIGER un bloc éditorial de 300+ mots minimum unique par page.

### 9.17 IMPORTANT — Link bait & contenu attractif pour backlinks

**Problème** : 418 pages informatives mais aucune n'attire des backlinks naturels. Sans backlinks, KD > 30 est inatteignable.

**Pages link bait à intégrer :**

| Page | Type | Pourquoi ça attire des liens |
|---|---|---|
| /dispositifs/calcul-prime-cee/ | Outil/calculateur | Les blogs énergie lient vers les calculateurs. Formulaire interactif avec résultat personnalisé |
| /reglementation/decret-tertiaire/ | Référence complète | Si c'est LA page la plus complète du web FR sur le décret tertiaire, les bureaux d'études la citent |
| /guides/obligations-energetiques-entreprises-2025/ | Actualité annuelle | MAJ chaque année, les médias spécialisés reprennent |
| /dispositifs/kwh-cumac/ | Définition de référence | Wikipedia-like mais mieux — les articles de presse linkent quand ils expliquent les CEE |
| Infographies (à intégrer dans les hubs) | Visuel partageble | "Parcours CEE en 5 étapes" → repris par les partenaires, installateurs |

**Stratégie backlinks proactive (hors contenu) :**
- Partenariats installateurs : ils lient vers Oteria Conseil depuis leur page "nos partenaires"
- Associations professionnelles : ATEE, FEDENE, AICVF → annuaires membres
- Communiqués sur mesures CEE (nouvelle fiche, changement de barème) → reprise presse spécialisée
- LinkedIn Oteria : articles réguliers avec liens vers les guides

### 9.18 MOYEN — Schema markup avancé (au-delà du basique)

**Actuel** : WebPage + BreadcrumbList + ProfessionalService. C'est le minimum.

**Schema enrichi par type de page :**

| Page type | Schema supplémentaire | Rich result possible |
|---|---|---|
| /faq/ (toutes) | FAQPage | ✅ Rich snippets FAQ dans les SERP |
| /expertises/*/tarifs/ | Product ou Service + AggregateRating (à terme) | ✅ Prix dans les SERP |
| /guides/ | Article + author (Organization) | ✅ Breadcrumb enrichi |
| /achat-energie/ | Service + areaServed | Meilleur Knowledge Graph local |
| /reglementation/ | Article + dateModified | ✅ "Mis à jour le..." dans les SERP |
| /dispositifs/calcul-prime-cee/ | WebApplication | Indique à Google que c'est un outil interactif |
| Homepage | Organization + LocalBusiness (dual-type) | ✅ Knowledge Panel |
| /secteurs/[secteur]/ | Service + audience | Segmentation intention |

**FAQPage = quick win n°1** : chaque page /faq/ (25+ pages) peut trigger des rich snippets FAQ. C'est +20-30% de visibilité SERP sans effort.

### 9.19 MOYEN — Vitesse de publication réaliste

**418 pages ÷ 18 mois = 23 pages/mois = ~5-6 pages/semaine.**

C'est faisable avec du contenu MDX assisté IA + relecture humaine. Mais la qualité ne doit pas baisser.

**Cadence recommandée :**

| Phase | Durée | Pages/mois | Focus |
|---|---|---|---|
| P1 (Quick wins) | M1-M3 | 25 | 5 clusters (VMC, Variateurs, Destrat, Air comprimé, Courtage) + pages structurelles |
| P2 (Piliers) | M3-M5 | 25 | PAC, GTB, Osmose, Calorifugeage, Isolation |
| P3 (Volume) | M5-M8 | 20 | Climatisation, Audit, CPE, IRVE, Chaudière |
| P4 (CEE + Réglementation) | M8-M10 | 20 | /dispositifs/ complet, /reglementation/, Free cooling, Froid |
| P5 (Densification) | M10-M13 | 15 | Récup chaleur, Déshumidification, Monitoring, Moteurs, Régulation, Hydraulique |
| P6-P8 (Long tail) | M13-M18 | 10-15 | PV, Réseau chaleur, Process, Serres, Décarbonation + enrichissement P1-P2 |

**Règle** : un cluster est publié EN ENTIER ou pas du tout. Pas de hub sans sous-pages — ça envoie un signal de thin content à Google. Minimum : hub + /prime-cee/ + /tarifs/ + 2 sous-pages = 5 pages avant publication.

### 9.20 CRITIQUE — Différenciation intent /reglementation/ vs /dispositifs/ vs /guides/

**Risque** : 3 sections traitent de sujets proches (décret tertiaire apparaît potentiellement dans les 3). Clarification :

| Section | Intent cible | Ce qu'on y trouve | Ce qu'on n'y trouve PAS |
|---|---|---|---|
| **/reglementation/** | "C'est quoi ? Suis-je concerné ? Quelles échéances ?" | Obligations légales, calendrier, sanctions, seuils, qui est concerné | Comment obtenir une prime, accompagnement commercial |
| **/dispositifs/** | "Comment financer ? Combien je touche ?" | Mécanismes d'aide (CEE, Fonds Chaleur), montants, démarches administratives, éligibilité | Explications réglementaires de fond |
| **/guides/** | "Comment faire concrètement ?" | Méthodologie, étapes, checklists, retours d'expérience | Détails administratifs, obligations légales |

**Maillage triangulaire obligatoire** : chaque page de ces 3 sections DOIT lier vers les 2 autres sur le même sujet.

Exemple pour le décret tertiaire :
```
/reglementation/decret-tertiaire/ 
  → "Financez votre mise en conformité avec les CEE" → /dispositifs/comprendre-les-cee/
  → "Guide pas-à-pas pour atteindre vos objectifs" → /guides/obligations-energetiques-2025/

/dispositifs/comprendre-les-cee/
  → "Vérifiez vos obligations réglementaires" → /reglementation/decret-tertiaire/
  
/guides/obligations-energetiques-2025/
  → "Détail des échéances légales" → /reglementation/decret-tertiaire/
  → "Financement disponible" → /dispositifs/cumul-aides/
```

---

## 10. Métriques de suivi

### KPI globaux (calibrés sur les données SEMrush)

| Métrique | Objectif 6m | Objectif 12m | Objectif 18m |
|---|---|---|---|
| Pages indexées | 100+ | 250+ | 400+ |
| Impressions/mois (GSC) | 10 000 | 50 000 | 150 000 |
| Clics/mois | 200 | 2 000 | 8 000 |
| Position moyenne | < 45 | < 25 | < 18 |
| Clusters complets publiés | 5 (P1) | 15 (P1-P3) | 30+ |
| Leads/mois (diagnostic-gratuit) | 5 | 30 | 80+ |
| Pages en top 10 | 5 | 30 | 80+ |

### Benchmarks par cluster (basés sur KD mesuré)

| Cluster | Objectif position à 6m | Objectif position à 12m |
|---|---|---|
| VMC (KD 27) | Top 20 | Top 10 |
| Variateurs (KD 14) | Top 10 | Top 5 |
| Destratificateur (KD 15) | Top 10 | Top 5 |
| Air comprimé (KD 19) | Top 15 | Top 8 |
| PAC (KD 39) | Top 50 | Top 20 |
| GTB (KD 33) | Top 30 | Top 15 |
| Osmose inverse (KD 20) | Top 15 | Top 8 |

### Par cluster — métriques à suivre
- Position sur keyword principal (GSC)
- Impressions cluster (somme de toutes les pages du cluster)
- CTR moyen
- Ratio indexation (pages indexées / publiées) — alerte si < 80%
- Conversions attribuées (diagnostic-gratuit avec source cluster)

### Signaux d'alerte

| Signal | Seuil | Action |
|---|---|---|
| Page publiée non indexée à J+14 | > 3 pages | Vérifier maillage + request indexation manuelle |
| Cluster entier sous position 80 à M+3 | — | Audit contenu + ajout backlinks + enrichissement |
| CTR < 2% sur top 20 | — | Réécrire title + meta description |
| Cannibalization détectée (2 URLs rankent) | — | Fusionner ou différencier intent + canonical |
| Ratio indexation < 80% | — | Vérifier thin content + crawl errors |

---

## 11. Itération finale — audit expert v5

### 11.1 CRITIQUE — SERP features targeting (Featured Snippets + PAA)

Google affiche des featured snippets (position 0) et People Also Ask sur la majorité des requêtes informationnelles. Un site neuf peut les atteindre AVANT d'être top 5 en résultat classique.

**Keywords déclenchant un featured snippet (à cibler structurellement) :**

| Keyword | Type de snippet | Structure de contenu requise |
|---|---|---|
| cpe définition | Paragraphe | Définition en 40-60 mots immédiatement après le H2, commençant par "Un CPE est…" |
| kwh cumac | Paragraphe | "Le kWh cumac est une unité qui…" — réponse directe sous le H1 |
| différence gtb gtc | Tableau | Tableau comparatif `GTB vs GTC` en 4-5 lignes |
| cop pompe à chaleur | Paragraphe + nombre | "Le COP d'une pompe à chaleur est de X à Y…" |
| décret bacs | Liste numérotée | "Les obligations du décret BACS : 1. … 2. … 3. …" |
| fonctionnement cee | Liste ordonnée | "Les CEE fonctionnent en 5 étapes : 1. L'obligé… 2. Le bénéficiaire…" |
| offre fixe vs indexée | Tableau | Tableau comparatif 2 colonnes avec avantages/inconvénients |
| robinet thermostatique | Paragraphe | "Un robinet thermostatique permet de…" — définition courte |

**Règle structurelle pour le snippet :**
- Le H2 qui cible le snippet DOIT formuler la question exacte ("Qu'est-ce qu'un CPE ?", "Quelle est la différence entre GTB et GTC ?")
- La réponse doit commencer IMMÉDIATEMENT après le H2 (pas d'introduction)
- Format paragraphe : 40-60 mots max, autonomes
- Format liste : `<ol>` ou `<ul>` avec 3-7 items, chacun < 15 mots
- Format tableau : `<table>` HTML propre, header row, 3-6 lignes de données

**People Also Ask — questions à intégrer dans les /faq/ :**

Chaque page /faq/ doit cibler 5-8 questions PAA. Structure :
```html
<details>
  <summary>Question exacte telle que Google l'affiche ?</summary>
  <p>Réponse directe en 2-3 phrases. Puis développement.</p>
</details>
```

En Astro/MDX, le composant `<FAQ>` doit générer du JSON-LD FAQPage ET le balisage sémantique.

### 11.2 CRITIQUE — Topical Authority Model (seuil de couverture)

Google évalue l'autorité topique par la DENSITÉ de couverture d'un sujet. Un hub avec 2 sous-pages ne fait pas autorité. La question : combien de pages minimum par cluster pour que Google reconnaisse l'autorité ?

**Seuils basés sur l'analyse des top 3 concurrents par thématique :**

| Profondeur cluster | Autorité perçue | Benchmark |
|---|---|---|
| Hub seul (1 page) | ❌ Aucune | Ne jamais publier un hub seul |
| Hub + 3-4 pages | ⚠️ Faible | Suffisant pour KD < 15 (destrat, variateurs) |
| Hub + 5-7 pages | ✅ Correcte | Standard pour KD 15-30 (air comprimé, VMC) |
| Hub + 8-12 pages | ✅✅ Forte | Nécessaire pour KD 30-50 (PAC, GTB, isolation) |
| Hub + 12+ pages | ✅✅✅ Dominante | Pour les KD > 50 si on veut top 5 (CEE, audit) |

**Application par cluster P1-P2 :**

| Cluster | Pages actuelles dans l'arborescence | Suffisant ? | Action |
|---|---|---|---|
| VMC (KD 27) | Hub + 8 sous-pages | ✅ OK | — |
| Variateurs (KD 14) | Hub + 5 sous-pages | ✅ OK (KD faible) | — |
| Destratificateur (KD 15) | Hub + 7 sous-pages | ✅ OK | — |
| Air comprimé (KD 19) | Hub + 7 sous-pages | ✅ OK | — |
| PAC (KD 39) | Hub + 13 sous-pages | ✅✅ Fort | — |
| GTB/GTC (KD 33) | Hub + 8 sous-pages | ✅ Correct | Ajouter 2-3 pages si stagne à M+6 |
| Isolation (KD 37) | Hub + 10 sous-pages | ✅✅ Fort | — |
| Osmose inverse (KD 20) | Hub + 5 sous-pages | ✅ OK | — |

**Règle de publication** : NE PAS publier un cluster pour un keyword KD > 30 avec moins de 8 pages. Attendre d'avoir le contenu suffisant plutôt que de publier un cluster incomplet qui stagnera en position 50+.

### 11.3 IMPORTANT — Internal PageRank sculpting

Toutes les pages ne méritent pas la même quantité de "link juice". Les pages à fort potentiel de conversion ou de trafic doivent recevoir PLUS de liens internes.

**Hiérarchie de distribution du PageRank interne :**

```
Tier 1 (max liens entrants internes) :
├── / (homepage) — reçoit des liens de TOUTES les pages (logo, breadcrumb)
├── /expertises/pompe-a-chaleur/ — cluster à plus fort volume
├── /achat-energie/ — hub CPC goldmine
├── /expertises/vmc-double-flux/ — meilleur ratio vol/KD
├── /dispositifs/ — cœur de métier
└── /diagnostic-gratuit/ — page conversion

Tier 2 (liens depuis section + cross-links) :
├── /expertises/gtb-gtc/
├── /expertises/robinet-thermostatique/
├── /expertises/air-comprime/
├── /reglementation/decret-tertiaire/
├── /reglementation/decret-bacs/
└── Hubs de tous les clusters P1-P3

Tier 3 (liens depuis cluster + 1-2 cross) :
├── Sous-pages /prime-cee/, /tarifs/
├── Pages /secteurs/
└── Pages /dispositifs/ individuelles

Tier 4 (liens depuis cluster uniquement) :
├── Sous-pages /faq/, /projets/
├── Pages /guides/
└── Pages /zones-intervention/
```

**Implémentation concrète :**
- Header navigation → lie vers Tier 1 uniquement (ne pas diluer)
- Footer → lie vers Tier 1 + Tier 2 (sections principales + clusters prioritaires)
- Sidebar (desktop) → lie vers les 3-4 clusters les plus proches sémantiquement (contextuel)
- Breadcrumb → distribue naturellement vers les niveaux supérieurs
- Contenu éditorial → minimum 3 liens vers des pages Tier 1-2 par article

**Ce qu'on NE fait PAS :**
- Pas de mega-menu listant toutes les pages (dilution massive)
- Pas de footer avec 100 liens (Google les ignore au-delà de ~50)
- Pas de "articles similaires" aléatoires — les liens doivent être CHOISIS sémantiquement

### 11.4 IMPORTANT — Analyse concurrentielle SERP (positionnement différentiel)

**Les vrais concurrents dans les SERP pour Oteria ne sont PAS les autres sites du portfolio.** Ce sont :

| Requête | Concurrents top 5 actuels | Faiblesse exploitable |
|---|---|---|
| pompe à chaleur | QuelleEnergie, EDF, Engie | Contenu B2C, pas de focus B2B/industrie |
| prime cee | service-public.fr, QuelleEnergie | Génériques, pas d'accompagnement métier |
| vmc double flux | fabricants (Aldes, Atlantic) | Pages produit, pas de contenu décisionnel |
| courtier énergie | Selectra, Opéra Énergie | SEA dépendants, contenu fin |
| décret tertiaire | consultants individuels, BET | Pages datées, pas de MAJ régulière |
| air comprimé | fabricants (Atlas Copco, Kaeser) | Pages produit, pas d'angle CEE/aide financière |
| destratificateur | Airsun, revendeurs | Pages produit ultra-thin, 0 contenu informatif |

**Angle différenciateur Oteria dans les SERP :**

1. **B2B + accompagnement complet** : là où les concurrents font du contenu générique grand public (QuelleEnergie) ou des fiches produit (fabricants), Oteria fait du contenu **décisionnel professionnel** avec angle financier (ROI, prime, démarches)
2. **Fraîcheur + MAJ réglementaire** : là où les consultants publient un article en 2022 et l'oublient, Oteria met à jour systématiquement (décret tertiaire, barèmes CEE)
3. **Profondeur technique + accessibilité** : ni trop technique (pure ingénierie) ni trop vulgarisé (grand public). Le sweet spot "responsable énergie qui doit prendre une décision"

**Comment le refléter dans le contenu :**
- Chaque hub commence par "Pour les professionnels" ou "Pour votre entreprise" (intent signal B2B)
- Chaque page /prime-cee/ inclut un calcul ROI chiffré (pas juste "vous pouvez bénéficier de…")
- Datemodified visible + "Mis à jour [mois année]" en haut de page (signal fraîcheur)
- CTA "Diagnostic gratuit" = différenciateur vs contenu informatif passif des concurrents

### 11.5 IMPORTANT — Stratégie temporelle & saisonnalité

Certaines requêtes ont des pics saisonniers. Publier au BON moment = ranker AVANT le pic.

**Calendrier de publication aligné sur la saisonnalité :**

| Mois de publication | Pic de recherche | Keywords | Rationale |
|---|---|---|---|
| Septembre-Octobre | Novembre-Janvier | PAC, isolation, chauffage, VMC | Saison de chauffe : les pros planifient les travaux en amont |
| Mars-Avril | Mai-Juillet | Climatisation, free cooling, bornes IRVE | Saison chaude : demandes de devis clim + projets été |
| Janvier | Mars-Avril | Audit énergétique, décret tertiaire | Début fiscal : budgets validés, obligations annuelles |
| Toute l'année | Stable | CEE, courtage énergie, variateurs, GTB | Pas de saisonnalité marquée (flux B2B continu) |

**Règle** : publier un cluster 2-3 mois AVANT son pic saisonnier pour que Google ait le temps d'indexer et de ranker.

**Impact sur le planning P1 :**
- Si on lance en M1 = juin 2025 → publier VMC, destrat, air comprimé (stables) + courtage (stable)
- Septembre 2025 : lancer PAC, isolation (pic hivernal)
- Mars 2026 : lancer climatisation, free cooling, IRVE (pic estival)

### 11.6 MOYEN — Content pruning & consolidation prévisionnelle

À 12 mois, certaines pages ne performeront pas. Plan de pruning :

**Critères de pruning (à appliquer à M+12) :**

| Signal | Seuil | Action |
|---|---|---|
| 0 impressions à 6 mois post-indexation | — | Analyser : crawlée ? Indexée ? Si oui → contenu trop faible → fusionner avec le hub |
| < 10 clics/mois malgré top 20 | — | Problème CTR → réécrire title/meta |
| 2 pages du même cluster sur le même keyword | — | 301 redirect de la plus faible vers la plus forte |
| Page /projets/ sans cas réel documenté | — | Supprimer (thin) ou étoffer avec un vrai cas |
| Page /[secteur]/ identique à 80% au hub | — | Fusionner dans le hub avec une section dédiée |

**Règle de consolidation** : mieux vaut 6 pages fortes par cluster que 12 pages moyennes. Si une sous-page n'a pas de contenu UNIQUE à 500+ mots, elle ne devrait pas exister.

### 11.7 CRITIQUE — Architecture de navigation (UX × SEO)

La navigation impacte directement le crawl, la distribution de PageRank, et l'expérience utilisateur. Pour 418 pages, il faut une navigation à 3 niveaux max.

**Navigation principale (header) :**

```
Expertises ▾          Dispositifs ▾       Courtage énergie     Bornes IRVE     Réglementation
├── Chauffage         ��── CEE             (lien direct)        (lien direct)   (lien direct)  
│   ├── PAC           ├── Fiches CEE
│   ├── Chaudière     ├── Calcul prime
│   └── Régulation    └── Démarches
├── Ventilation
│   ├── VMC
│   ├── Destrat
│   └── Déshumid.
├── Isolation
├── Air & Moteurs
│   ├── Air comprimé
│   ├── Variateurs
│   └── Moteurs IE4
├── Froid & Clim
├── Pilotage
│   ├── GTB/GTC
│   └── Monitoring
└── Voir toutes →
```

**Règles de navigation :**
- Maximum 7 items en nav principale (cognitive load)
- Le mega-menu ne liste PAS toutes les 35 clusters — seulement les top 12-15 prioritaires
- "Voir toutes les expertises →" lie vers /expertises/ (hub qui liste tout)
- Mobile : menu hamburger avec accordéon 2 niveaux max
- Breadcrumb sur CHAQUE page (sauf homepage)
- Fil d'Ariane = signal de structure pour Googlebot

**Depth analysis (click distance depuis homepage) :**

| Profondeur | Pages | Acceptable ? |
|---|---|---|
| 0 clics | Homepage | ✅ |
| 1 clic | Hubs (/expertises/, /dispositifs/, /achat-energie/, /mobilite/, /reglementation/, /secteurs/, /guides/) | ✅ |
| 2 clics | Hubs clusters (/expertises/pompe-a-chaleur/) + pages /dispositifs/ principales | ✅ |
| 3 clics | Sous-pages cluster (/expertises/pompe-a-chaleur/prime-cee/) + fiches CEE | ✅ max acceptable |
| 4 clics | �� AUCUNE page à cette profondeur | Restructurer si ça arrive |

**Vérification** : dans l'arborescence actuelle, la profondeur max est :
`/ → /expertises/ → /pompe-a-chaleur/ → /haute-temperature/` = 3 clics ✅

### 11.8 MOYEN — Stratégie de contenu multiformat

Google valorise les pages qui répondent à PLUSIEURS formats de consommation (texte + visuel + vidéo).

**Par type de page :**

| Type | Formats à intégrer | Impact SERP |
|---|---|---|
| Hub cluster | Texte + infographie résumé + tableau comparatif + vidéo embed (YouTube optionnel) | Image pack + vidéo carousel |
| /prime-cee/ | Texte + tableau montants + simulateur inline (formulaire) | Rich results "prix" |
| /tarifs/ | Texte + tableau prix + graphique ROI (SVG) | Knowledge panel |
| /faq/ | Texte structuré + FAQ JSON-LD + volet dépliable | FAQ rich snippets |
| /dispositifs/fiches/ | Texte + PDF téléchargeable de la fiche officielle + schéma résumé | — |
| /secteurs/[secteur]/ | Texte + cas client illustré + chiffres clés (bandeau) | — |

**Assets visuels prioritaires (P1) :**
- Infographie "Parcours CEE en 5 étapes" → réutilisable sur multiple pages
- Tableau comparatif "PAC air-eau vs air-air vs géothermie"
- Schéma "Comment fonctionne un variateur de vitesse" (SVG animé)
- Graphique "ROI type d'une VMC double flux sur 5 ans"
- Infographie "Décret BACS : qui est concerné, quelles échéances"

**Format images :**
- WebP, nommage `ot-{cluster}-{description}.webp`
- Alt text = keyword secondaire (pas de bourrage)
- Width/height explicites (CLS = 0)
- Lazy-load sauf above-the-fold

### 11.9 IMPORTANT — Stratégie People Also Ask (PAA) systématique

Les PAA sont le moyen le PLUS rapide d'obtenir du trafic sur un site neuf. Google affiche les PAA avant même le top 10.

**Process :**
1. Pour chaque keyword Tier 1-2, relever les 4-8 questions PAA affichées dans Google
2. Chaque question = un H2 ou une entrée FAQ sur la page cible
3. La réponse doit commencer par une phrase complète de 40-60 mots (format snippet)
4. Puis développer en 100-200 mots supplémentaires

**PAA probable par cluster (à valider en SERP réelle) :**

| Cluster | Questions PAA attendues |
|---|---|
| PAC | "Quel est le prix d'une pompe à chaleur ?", "Est-ce que la pompe à chaleur est rentable ?", "Quelle est la durée de vie d'une PAC ?" |
| VMC | "Quelle est la différence entre simple flux et double flux ?", "Combien coûte une VMC double flux ?", "Est-ce obligatoire ?" |
| CEE | "Comment obtenir la prime CEE ?", "Qui verse les primes CEE ?", "Quel est le montant de la prime CEE ?" |
| GTB | "Qu'est-ce qu'une GTB ?", "Quelle différence entre GTB et GTC ?", "Est-ce obligatoire ?" |
| Courtage | "Qu'est-ce qu'un courtier en énergie ?", "Combien coûte un courtier ?", "Est-ce gratuit ?" |
| Décret BACS | "Qui est concerné par le décret BACS ?", "Quelle est la date limite ?", "Quelles sanctions ?" |

**Template PAA dans le MDX :**
```mdx
## Quel est le prix d'une pompe à chaleur professionnelle ?

Le prix d'une pompe à chaleur pour un bâtiment professionnel se situe entre 15 000 € et 80 000 € selon la puissance, le type (air-eau, géothermie) et la complexité de l'installation. Ce montant inclut la fourniture et la pose.

[Développement 150 mots avec tableau de prix par type et puissance]
```

### 11.10 IMPORTANT — Audit final de cohérence URL

Vérification que CHAQUE URL de l'arborescence suit les règles :

| Règle | Statut |
|---|---|
| Slug = keyword exact le plus recherché | ✅ Vérifié §9.1 |
| Trailing slash sur toutes les URLs | ✅ Config Astro |
| Max 3 niveaux de profondeur | ✅ Vérifié §11.7 |
| Pas de caractères spéciaux/accents dans les slugs | ⚠️ À vérifier |
| Slug < 50 caractères | ✅ (max = "prix-electricite-professionnel" = 33) |
| Pas de stop words inutiles ("le", "de", "en") | ⚠️ À vérifier |

**Slugs à surveiller (stop words) :**
- `/variateur-de-vitesse/` → "de" est inclus car "variateur vitesse" n'est pas la requête tapée (2 400 vol pour "variateur de vitesse" vs 170 pour "variateurs de vitesse" sans article). ✅ Conserver.
- `/regulation-chauffage/` → OK, pas d'article ✅
- `/robinet-thermostatique/` → OK ✅
- `/contrat-energie-pro/` → Raccourci de "contrat énergie professionnel". OK car slug court ✅
- `/pre-refroidisseurs-lait/` → OK, c'est la requête exacte ✅

**Aucune correction nécessaire.** Les slugs sont alignés sur les requêtes SEMrush.

---

## 12. Checklist pré-développement

Avant de coder la première ligne, v��rifier que :

- [ ] Domaine oteria-conseil.fr acheté et DNS configuré
- [ ] Hébergement o2switch commandé (IP dédiée E)
- [ ] GitHub repo créé (privé)
- [ ] Netlify connecté pour staging (password-protected)
- [ ] Google Search Console vérifiée sur le domaine
- [ ] Google Business Profile créé (dès que adresse connue)
- [ ] LinkedIn entreprise créé
- [ ] Backend formulaires choisi et configuré (Supabase et/ou Strapi)
- [ ] Assets visuels : logo, favicon, og:image par défaut
- [ ] Fonts : Satoshi + Inter téléchargées (self-hosted)
- [ ] Premier batch de contenu P1 rédigé (5 clusters × 5 pages min = 25 pages)
- [ ] Sitemap soumis à GSC
- [ ] IndexNow API key générée
- [ ] robots.txt déployé
- [ ] Redirections 301 configurées (si ancien contenu sur ce domaine)
- [ ] Schema Organization JSON-LD complété (adresse, téléphone, SIRET)
- [ ] HTTPS forcé + HSTS header
