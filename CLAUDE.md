# CLAUDE.md - Guide de développement SpotHitch

> **RÈGLE #1 — DEPLOY AUTO** : Après CHAQUE modification de code, AUTOMATIQUEMENT et SANS DEMANDER :
> 1. `npx vitest run tests/wiring/` pour vérifier les tests
> 2. `npm run build` pour vérifier la compilation
> 3. Si échecs → corriger jusqu'à ce que TOUT passe, NE JAMAIS laisser un truc cassé
> 4. `git add` + `git commit` + `git push origin main` → TOUJOURS, AUTOMATIQUEMENT
> 5. NE JAMAIS demander "tu veux que je push ?" — la réponse est TOUJOURS oui
> 6. Regrouper les modifications liées en un seul push quand c'est possible

> **RÈGLE #2 — JAMAIS DIRE "C'EST BON" SI C'EST PAS PARFAIT** :
> - Si quelque chose casse → corriger jusqu'à ce que ça marche PARFAITEMENT
> - NE JAMAIS dire "c'est fait" sans avoir VÉRIFIÉ (tests passent, build OK, site répond)
> - Après chaque deploy → vérifier que le site charge, pas d'erreur console
> - Si un doute → vérifier encore plutôt que supposer
> - Si ça marche pas → trouver une solution, pas juste signaler le problème

> **RÈGLE #3 — PARLER SIMPLE** :
> - L'utilisateur ne code PAS. Tout expliquer simplement.
> - Pas de jargon sans explication ("push" = envoyer le code sur le site)
> - Quand je pose une question : expliquer les options ET ce que je recommande, avec pourquoi
> - Après un changement visuel : décrire ce que l'user VERRA sur son téléphone
> - Donner l'URL ou la manip exacte pour voir le résultat

> **RÈGLE #4 — AGIR, PAS DEMANDER** :
> - Si la règle dit de le faire → le faire sans demander
> - Poser des questions uniquement pour les VRAIES décisions produit (pas les décisions techniques)
> - Ne jamais demander confirmation pour quelque chose de technique que l'user ne peut pas juger

> **RÈGLE #5 — CHECKLIST QUALITÉ À CHAQUE CHANGEMENT** :
> À chaque modification, se poser TOUTES ces questions :
> - L'utilisateur va comprendre et aimer ?
> - Un débutant qui ouvre l'app pour la 1ère fois va s'y retrouver ?
> - Une fille seule la nuit se sentirait en sécurité avec cette feature ?
> - Ça marche sans internet ou avec une connexion lente ?
> - Ça marche sur un vieux téléphone pas cher ?
> - C'est traduit dans les 4 langues (FR/EN/ES/DE) ?
> - Les données sont protégées (RGPD, vie privée) ?
> - Google va trouver le site (SEO) ?
> - C'est légal partout ?
> - Ça peut rapporter de l'argent un jour ?
> - Ça tiendra avec 100 000 utilisateurs ?
> - Ça donne envie de revenir et d'inviter ses potes ?
> - C'est mieux que Hitchwiki et les autres ?
> - Les données seront fiables et utiles ?
> - Ça coûte combien à faire tourner ?
> - C'est facile à maintenir et faire évoluer ?
> - Tout le monde peut l'utiliser (handicap, daltonien) ?
> - La communauté va bien réagir ?
> - C'est la solution la plus SIMPLE qui marche ?

> **RÈGLE #6 — MÉMOIRE** :
> - Relire MEMORY.md + decisions.md au DÉBUT de chaque session
> - Mettre à jour MEMORY.md + decisions.md + features.md après chaque changement
> - NE JAMAIS laisser des infos périmées (chiffres, états, TODO déjà faits)
> - NE JAMAIS proposer une feature qui EXISTE DÉJÀ → vérifier features.md d'abord
> - NE JAMAIS demander à l'utilisateur ce qui a déjà été fait — le retrouver soi-même

> **RÈGLE #7 — CÂBLAGE** : Chaque nouvelle feature/modal/composant DOIT inclure :
> 1. Ajouter les handlers `window.*` dans `MAIN_JS_HANDLERS` de `tests/wiring/globalHandlers.test.js`
> 2. Ajouter un `testModalFlag(...)` dans `tests/wiring/modalFlags.test.js`
> 3. Ajouter un bloc `describe('Integration: NomModal')` dans `tests/integration/modals.test.js`
> 4. `npx vitest run tests/wiring/ tests/integration/modals.test.js` → tout passe

> **RÈGLE #8 — i18n** : TOUT en t('key'), 4 langues (FR/EN/ES/DE), jamais de texte hardcodé

---

## Vue du Projet

**SpotHitch v2.0** - La communauté des autostoppeurs. PWA pour trouver et partager les meilleurs spots d'auto-stop (14 669 spots, 137 pays).

Site : **spothitch.com** (GitHub Pages, auto-deploy via GitHub Actions)

### Stack Technique
Vite 5.x | JavaScript ES Modules | Tailwind CSS 4 | MapLibre GL JS + OpenFreeMap | Firebase (Auth, Firestore) | Vitest | Playwright | Sentry | vite-plugin-pwa | GitHub Actions | ESLint + Prettier

### Structure
```
src/
├── components/          # UI (App.js, Header.js, Navigation.js, SpotCard.js)
│   ├── views/           # Home.js, Spots.js, Chat.js, Profile.js
│   └── modals/          # AddSpot.js, Auth.js, SOS.js, SpotDetail.js, Tutorial.js, Welcome.js
├── services/            # firebase.js, notifications.js, osrm.js, sentry.js + services
├── stores/state.js      # État global
├── i18n/index.js        # Traductions FR/EN/ES/DE
├── utils/               # a11y.js, image.js, seo.js, storage.js, prefetch.js
├── styles/main.css      # Tailwind
├── data/spots.js        # Vide (spots chargés dynamiquement via spotLoader.js)
└── main.js              # Point d'entrée + auto-reload (version.json)
public/data/spots/       # 137 fichiers JSON pays (source Hitchmap ODBL)
tests/                   # Tests unitaires Vitest (88 tests wiring)
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
VITE_UMAMI_ID (optionnel — Umami Cloud website ID, privacy-friendly analytics)
```

---

## TODO actuel

- [x] ~~HTTPS~~ : Certificat SSL actif, HTTPS forcé (2026-02-12)
- [ ] Sentry : créer compte sentry.io → DSN → GitHub Secret `VITE_SENTRY_DSN`
- [ ] Affiliés : s'inscrire Hostelworld + Booking (action user manuelle)

---

## Décisions Importantes

Voir `/memory/decisions.md` pour l'historique complet.

| Décision | Raison |
|----------|--------|
| Vite | Build rapide, HMR, ES Modules natifs |
| Tailwind CSS local | Performance, pas de CDN |
| 3 critères spots (sécurité, trafic, accessibilité) | Simple et suffisant |
| Direction toujours obligatoire | Le coeur de l'app = trouver un spot VERS une destination |
| 4 types de spots | Sortie de ville, station, bord de route, autre |
| Photo obligatoire création spot | Qualité des données |
| Auto-reload via version.json | L'user voit les changements sans vider le cache |
| Pas de paywall | Les autostoppeurs sont fauchés |

---

## Problèmes Connus

| Problème | Statut |
|----------|--------|
| ~~HTTPS pas encore actif~~ | RÉSOLU — HTTPS actif + forcé (cert expire 2026-05-13) |
| Firebase non configuré | Config GitHub Secrets nécessaire |

---

## Services — voir features.md pour l'inventaire complet
