# CLAUDE.md - Guide de développement SpotHitch

> **INSTRUCTION OBLIGATOIRE** : Ce fichier DOIT être mis à jour à la fin de chaque session Claude avec : ce qui a été fait, les décisions prises, et les TODO restants.

---

## Vue du Projet

### Description
**SpotHitch v2.0** - La communauté des autostoppeurs. Application PWA permettant de trouver et partager les meilleurs spots d'auto-stop en Europe (94+ spots dans 12 pays).

### Stack Technique
| Catégorie | Technologie |
|-----------|-------------|
| Build | Vite 5.x |
| Langage | JavaScript (ES Modules) |
| Style | Tailwind CSS 3.4 + PostCSS |
| Carte | Leaflet + MarkerCluster |
| Backend | Firebase (Auth, Firestore) |
| Tests unitaires | Vitest |
| Tests E2E | Playwright |
| Monitoring | Sentry |
| PWA | vite-plugin-pwa |
| CI/CD | GitHub Actions |
| Linting | ESLint + Prettier |

### Structure des Dossiers
```
Spothitch/
├── src/
│   ├── components/          # Composants UI
│   │   ├── App.js           # Composant racine
│   │   ├── Header.js        # En-tête
│   │   ├── Navigation.js    # Navigation principale
│   │   ├── SpotCard.js      # Carte de spot
│   │   ├── views/           # Pages principales
│   │   │   ├── Home.js      # Accueil avec carte
│   │   │   ├── Spots.js     # Liste des spots
│   │   │   ├── Chat.js      # Chat communautaire
│   │   │   └── Profile.js   # Profil utilisateur
│   │   └── modals/          # Modales/Popups
│   │       ├── AddSpot.js   # Ajout de spot
│   │       ├── Auth.js      # Connexion/Inscription
│   │       ├── SOS.js       # Mode urgence
│   │       ├── SpotDetail.js # Détail d'un spot
│   │       ├── Tutorial.js  # Tutoriel
│   │       └── Welcome.js   # Bienvenue
│   ├── services/            # Services externes
│   │   ├── firebase.js      # Firebase Auth/Firestore
│   │   ├── notifications.js # Notifications push
│   │   ├── osrm.js          # Calcul d'itinéraires
│   │   └── sentry.js        # Monitoring erreurs
│   ├── stores/
│   │   └── state.js         # État global de l'app
│   ├── i18n/
│   │   └── index.js         # Traductions (FR, EN, ES)
│   ├── utils/               # Utilitaires
│   │   ├── a11y.js          # Accessibilité
│   │   ├── image.js         # Traitement images
│   │   ├── seo.js           # SEO
│   │   └── storage.js       # LocalStorage
│   ├── styles/
│   │   └── main.css         # Styles Tailwind
│   ├── data/
│   │   └── spots.js         # Données des spots
│   └── main.js              # Point d'entrée
├── public/                  # Assets statiques
│   └── manifest.json        # PWA manifest
├── tests/                   # Tests unitaires
│   ├── setup.js
│   ├── i18n.test.js
│   ├── state.test.js
│   └── storage.test.js
├── e2e/                     # Tests E2E Playwright
│   ├── accessibility.spec.js
│   ├── navigation.spec.js
│   └── pwa.spec.js
├── dist/                    # Build de production
├── vite.config.js           # Config Vite
├── tailwind.config.js       # Config Tailwind
├── vitest.config.js         # Config Vitest
└── playwright.config.js     # Config Playwright
```

### Commandes Utiles
```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run preview      # Prévisualiser le build
npm test             # Tests unitaires (watch)
npm run test:run     # Tests unitaires (une fois)
npm run test:e2e     # Tests E2E
npm run lint         # Vérifier le code
npm run lint:fix     # Corriger automatiquement
```

---

## TODO

### Terminé
- [x] Configurer Firebase avec les vraies clés → Template `.env.example` créé
- [x] Configurer Sentry pour le monitoring → Template dans `.env.example`
- [x] Ajouter les assets manquants (icons, images) → 10 icônes PNG générées
- [x] Configurer GitHub Actions CI/CD → `.github/workflows/ci.yml`
- [x] Restaurer les fichiers légaux → LICENSE, PRIVACY.md, TERMS.md créés
- [x] Ajouter plus de tests unitaires → Couverture ~85% sur modules testables
- [x] Optimiser les performances Lighthouse → CSS optimisé, preconnect, etc.
- [x] Implémenter le mode hors-ligne complet → Service `offline.js` créé
- [x] Améliorer l'accessibilité (WCAG 2.1 AA) → Focus visible, ARIA, reduced motion
- [x] Ajouter des animations/transitions → Keyframes complets dans CSS
- [x] Corriger vulnérabilités npm → 18 → 4 failles (Firebase/happy-dom mis à jour)

### Reste à faire
- [ ] Configurer Firebase avec vraies clés (remplir `.env.local`)
- [ ] Configurer Sentry avec vrai DSN
- [ ] Ajouter plus de langues (DE, IT, PT)
- [ ] Documentation API

---

## Historique des Sessions

### 2025-12-26 - Amélioration globale de l'application
**Résumé** : Amélioration complète de l'application sur tous les aspects (sécurité, tests, accessibilité, performances).

**Actions réalisées** :
1. **Sécurité** : Vulnérabilités npm réduites de 18 à 4 (mise à jour Firebase et happy-dom)
2. **Assets** : Génération de 10 icônes PWA (72-512px) + favicon + apple-touch-icon
3. **CI/CD** : Workflow GitHub Actions complet (lint, test, build, e2e, deploy)
4. **Légal** : LICENSE MIT, PRIVACY.md, TERMS.md créés
5. **Tests** : 5 nouveaux fichiers de tests (a11y, seo, osrm, spots, notifications)
6. **Couverture** : ~85% sur les modules testables (excluant composants UI)
7. **Accessibilité** : CSS WCAG 2.1 AA complet (focus-visible, reduced-motion, high-contrast)
8. **Animations** : 10+ keyframes CSS (fadeIn/Out, slide, bounce, scale, shake)
9. **Offline** : Nouveau service `offline.js` avec indicateur UI et sync des actions
10. **Config** : Template `.env.example` avec toutes les variables requises

**Fichiers créés** :
- `.github/workflows/ci.yml`
- `LICENSE`, `PRIVACY.md`, `TERMS.md`
- `.env.example`
- `scripts/generate-icons.js`
- `public/icon.svg`, `public/favicon.svg`
- `public/icon-{72,96,128,144,152,192,384,512}.png`
- `tests/a11y.test.js`, `tests/seo.test.js`, `tests/osrm.test.js`
- `tests/spots.test.js`, `tests/notifications.test.js`
- `src/services/offline.js`

---

### 2025-12-26 - Migration ES Modules v2.0
**Résumé** : Migration complète du projet vers ES Modules avec Vite.

**Actions réalisées** :
1. Création branche `feature/es-modules-v2`
2. Remplacement complet du code par la nouvelle architecture
3. Installation des dépendances (711 packages)
4. Build réussi avec Vite (23.89s)
5. Commit : `feat: ES Modules migration v2.0 with Vite, tests, CI/CD`
6. Merge dans `main` et push

**Fichiers modifiés** : 81 fichiers (+18,680 / -11,105 lignes)

**Nouvelle stack** :
- Vite comme bundler (remplace l'ancien monolithe HTML)
- Tailwind CSS compilé localement
- Tests avec Vitest + Playwright
- Structure modulaire ES Modules

---

## Décisions Importantes

| Date | Décision | Raison | Alternative rejetée |
|------|----------|--------|---------------------|
| 2025-12-26 | Migration vers Vite | Build rapide, HMR, ES Modules natifs | Webpack (trop lourd), Parcel |
| 2025-12-26 | Tailwind CSS local | Performance, pas de CDN externe | CSS-in-JS, SCSS |
| 2025-12-26 | Vitest pour tests | Intégration native Vite, rapide | Jest |
| 2025-12-26 | Structure modulaire | Maintenabilité, séparation des responsabilités | Monolithe |

---

## Problèmes Connus

| ID | Problème | Statut | Priorité |
|----|----------|--------|----------|
| #1 | Assets manquants (icons, images) | Ouvert | Haute |
| #2 | Firebase non configuré (pas de .env.local) | Ouvert | Haute |
| #3 | Warnings Vite sur imports dynamiques vs statiques | Mineur | Basse |
| #4 | 18 vulnérabilités npm (17 moderate, 1 critical) | Ouvert | Moyenne |

---

## Notes de Développement

### Variables d'environnement requises
Créer `.env.local` à la racine :
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_SENTRY_DSN=xxx (optionnel)
```

### Conventions de code
- ES Modules (`import`/`export`)
- Pas de point-virgule (Prettier)
- Indentation : 2 espaces
- Nommage : camelCase (variables), PascalCase (composants)

---

*Dernière mise à jour : 2025-12-26 (Session 2 - Améliorations)*
