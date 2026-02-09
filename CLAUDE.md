# CLAUDE.md - Guide de développement SpotHitch

> **RÈGLE CRITIQUE** : NE JAMAIS ajouter d'historique de session détaillé dans ce fichier. Mettre à jour UNIQUEMENT SUIVI.md pour le suivi des tâches. Ce fichier est un guide statique, pas un journal.

> **RÈGLE DE TEST** : Après CHAQUE modification de code :
> 1. `npx vitest run tests/X.test.js` pour vérifier les tests
> 2. `npm run build` pour vérifier la compilation
> 3. Si échecs → corriger AVANT de continuer

---

## Vue du Projet

**SpotHitch v2.0** - La communauté des autostoppeurs. PWA pour trouver et partager les meilleurs spots d'auto-stop en Europe (94+ spots, 12 pays).

### Stack Technique
Vite 5.x | JavaScript ES Modules | Tailwind CSS 3.4 | Leaflet + MarkerCluster | Firebase (Auth, Firestore) | Vitest | Playwright | Sentry | vite-plugin-pwa | GitHub Actions | ESLint + Prettier

### Structure
```
src/
├── components/          # UI (App.js, Header.js, Navigation.js, SpotCard.js)
│   ├── views/           # Home.js, Spots.js, Chat.js, Profile.js
│   └── modals/          # AddSpot.js, Auth.js, SOS.js, SpotDetail.js, Tutorial.js, Welcome.js
├── services/            # firebase.js, notifications.js, osrm.js, sentry.js + 80+ services
├── stores/state.js      # État global
├── i18n/index.js        # Traductions FR/EN/ES/DE
├── utils/               # a11y.js, image.js, seo.js, storage.js
├── styles/main.css      # Tailwind
├── data/spots.js        # Données spots
└── main.js              # Point d'entrée
tests/                   # Tests unitaires Vitest
e2e/                     # Tests E2E Playwright
```

### Commandes
```bash
npm run dev          # Dev server
npm run build        # Build production
npm run test:run     # Tests unitaires (une fois)
npm run test:e2e     # Tests E2E
npm run lint         # Linting
```

### Conventions
- ES Modules (import/export), pas de point-virgule (Prettier), 2 espaces, camelCase (vars), PascalCase (composants)
- localStorage pour persistence services, clés préfixées `spothitch_`

### Variables d'environnement (.env.local)
```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
VITE_SENTRY_DSN (optionnel)
```

---

## TODO

### Reste à faire
- [ ] Configurer Firebase avec vraies clés (.env.local)
- [ ] Configurer Sentry avec vrai DSN
- [ ] Tests E2E pour les nouvelles fonctionnalités
- [ ] Voir SUIVI.md pour la liste complète des 286 tâches

---

## Décisions Importantes

| Décision | Raison |
|----------|--------|
| Vite | Build rapide, HMR, ES Modules natifs |
| Tailwind CSS local | Performance, pas de CDN |
| Vitest | Intégration native Vite |
| 7 jours session timeout | PWA pour voyageurs, bon compromis sécurité/UX |
| Age min 16 ans | RGPD article 8 |
| Photo obligatoire création spot | Qualité des données |
| Spot vérifié niveau 15+ | Anti-abus gamification |

---

## Problèmes Connus

| Problème | Statut |
|----------|--------|
| Firebase non configuré (pas de .env.local) | Config GitHub Secrets nécessaire |
| Warnings Vite imports dynamiques | Mineur, ignorable |
| 4 vulnérabilités npm restantes | Basse priorité |

---

## Services complétés (référence rapide)
> Voir SUIVI.md pour l'historique détaillé des sessions et le statut de chaque tâche.

RGPD: actionLogs, cookieBanner, deleteAccount, dataExport, locationPermission, myData, consentHistory, legal, ageVerification, rateLimiting, loginProtection, sessionTimeout, newDeviceNotification, DeviceManager, emailVerification, twoFactorAuth, dataEncryption, suspiciousAccountDetection

UX: contextualTip, emptyState, splashScreen, featureUnlocking, swipeNavigation, pullToRefresh, infiniteScroll, loadingIndicator, errorMessages, destructiveConfirmation, bigTextMode, reducedAnimations

Spots: photoCheckin, spotOfTheDay, travelModeNotifications, streetView, favorites, checkinHistory, statsCalculator, recommendedHours, vehicleTypes, alternativeSpots, detailedReviews, reviewReplies, reviewReporting, spotVerification, dangerousSpots, closedSpots, spotCorrections, spotMerge, spotShareCode, navigation, offlineMap, routeSearch, distanceCalculator, travelTimeEstimation, notificationBadge, pointsOfInterest, amenityFilters

Gamification: weeklyLeaderboard, titles, dailyReward, friendChallenges, exponentialProgression, seasons, guilds, temporaryEvents, anniversaryRewards, secretBadges, geographicAchievements, europeanCountries, friendComparison, profileFrames, customTitles

Social: realtimeChat, privateMessages, messageReactions, messageReplies, chatSpotShare, chatPositionShare, travelGroups, companionSearch, detailedProfiles, identityVerification, reputationSystem, userBlocking, userReporting, friendsList, friendSuggestions, userFollow, socialSharing, inviteFriends, referralProgram

Admin: adminModeration, moderatorRoles

Notifications: enhancedNotifications, notificationPreferences

PWA/Offline: offlineQueue, backgroundSync, dataSaver, smartPreload, offlineIndicator, autoSync

Marketing: faqService, helpCenter, contactForm, publicChangelog, publicRoadmap, coreWebVitals, imageOptimizer, imageCompression, seo, inAppFeedback

Recherche: searchHistory, searchSuggestions, savedFilters

Monétisation: donationCard, localSponsors, targetedAds

Autres: featureFlags, photoGallery, landing, webShare, countryBorders, antiScraping
