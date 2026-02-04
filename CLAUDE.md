# CLAUDE.md - Guide de développement SpotHitch

> **INSTRUCTION OBLIGATOIRE** : Ce fichier DOIT être mis à jour à la fin de chaque session Claude avec : ce qui a été fait, les décisions prises, et les TODO restants.

> **RÈGLE DE TEST OBLIGATOIRE** : Après CHAQUE modification de code, Claude DOIT :
> 1. Exécuter `npm run test:run` pour vérifier les tests unitaires
> 2. Exécuter `npm run build` pour vérifier la compilation
> 3. Si des tests échouent → corriger AVANT de commit
> 4. Ne JAMAIS commit du code qui ne passe pas les tests
>
> Cette règle est NON NÉGOCIABLE et s'applique à TOUTES les modifications.

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
- [ ] Tests E2E pour les nouvelles fonctionnalités

---

## Historique des Sessions

### 2026-02-04 - Ajout fonctionnalités avancées et panneau admin
**Résumé** : Ajout de nombreuses fonctionnalités de gamification, panneau admin, et améliorations UX.

**Actions réalisées** :

1. **Panneau Admin** (`src/components/modals/AdminPanel.js`)
   - Bouton flottant orange en bas à droite
   - Accès rapide à toutes les fonctionnalités
   - Gestion des ressources (ajouter points, skill points, level up, MAX ALL)
   - Navigation rapide entre les onglets
   - Export/Reset de l'état

2. **Contrôles de carte améliorés** (`src/components/views/Map.js`)
   - Nouveaux boutons zoom (+/-) sur le côté gauche
   - Bouton "Ma position" (GPS)
   - Design cohérent avec l'application
   - Suppression des contrôles Leaflet par défaut

3. **Tutoriel interactif** (`src/components/modals/Tutorial.js`)
   - Réécriture complète pour expérience interactive
   - L'utilisateur doit cliquer sur les vrais éléments
   - Spotlight sur les éléments cibles
   - Types d'étapes : modal, click, highlight
   - Barre de progression en haut
   - +10 points par étape, +100 bonus à la fin

4. **Boutons d'accès aux nouvelles fonctionnalités**
   - Profile : Arbre de compétences, Personnalisation
   - ChallengesHub : Défis d'équipe
   - Social : Onglet Groupes, Amis à proximité

5. **Tests unitaires** (71 nouveaux tests)
   - `tests/gamification.test.js` - Service gamification
   - `tests/skillTree.test.js` - Arbre de compétences
   - `tests/tutorial.test.js` - Tutoriel interactif
   - `tests/adminPanel.test.js` - Panneau admin
   - `tests/navigation.test.js` - Composant navigation
   - `tests/mapControls.test.js` - Contrôles carte

**Fichiers créés** :
- `src/components/modals/AdminPanel.js`
- `tests/gamification.test.js`
- `tests/skillTree.test.js`
- `tests/tutorial.test.js`
- `tests/adminPanel.test.js`
- `tests/navigation.test.js`
- `tests/mapControls.test.js`

**Fichiers modifiés** :
- `src/components/views/Map.js` - Nouveaux contrôles zoom
- `src/components/views/Profile.js` - Boutons skill tree et customization
- `src/components/views/ChallengesHub.js` - Bouton défis d'équipe
- `src/components/views/Social.js` - Onglet groupes
- `src/components/modals/Tutorial.js` - Réécriture interactive
- `src/components/Navigation.js` - Attributs data-tab
- `src/components/App.js` - Import admin panel
- `src/services/map.js` - Suppression zoom control par défaut
- `src/main.js` - Nouveaux handlers globaux

**Statistiques tests** :
- 14 fichiers de tests
- 215 tests passent
- Couverture services : ~90%

---

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

### 2025-12-27 - Correction des handlers globaux manquants
**Résumé** : Restauration de toutes les fonctionnalités onclick après le déploiement.

**Problème résolu** : L'application ne fonctionnait pas sur GitHub Pages car de nombreux handlers globaux onclick étaient manquants dans main.js.

**Actions réalisées** :
1. Audit complet de tous les onclick dans les composants
2. Ajout de 20+ handlers globaux manquants dans main.js :
   - **Auth** : `setAuthMode`, `handleLogin`, `handleSignup`, `handleGoogleSignIn`, `handleForgotPassword`, `handleLogout`
   - **Welcome** : `selectAvatar`, `completeWelcome`, `skipWelcome`
   - **Spots** : `openRating`, `closeRating`, `openNavigation`, `getSpotLocation`, `triggerPhotoUpload`
   - **Chat** : `setChatRoom`, `sendMessage`
   - **SOS** : `shareSOSLocation`, `markSafe`, `addEmergencyContact`, `removeEmergencyContact`
   - **Tutorial** : `startTutorial`
3. Import des fonctions Firebase nécessaires (`signIn`, `signUp`, `signInWithGoogle`, `logOut`, `resetPassword`, `sendChatMessage`)
4. Build et déploiement réussis

**Commit** : `fix: add all missing global window handlers for full functionality`

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
| #1 | Assets manquants (icons, images) | Résolu | - |
| #2 | Firebase non configuré (pas de .env.local) | Config GitHub Secrets | Moyenne |
| #3 | Warnings Vite sur imports dynamiques vs statiques | Mineur | Basse |
| #4 | Vulnérabilités npm | Réduit à 4 | Basse |

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

*Dernière mise à jour : 2026-02-04 (Session 4 - Fonctionnalités avancées et tests)*
