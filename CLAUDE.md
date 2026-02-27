# CLAUDE.md - Guide de développement SpotHitch

> **RÈGLE #0 — AUCUNE PERMISSION** : NE JAMAIS demander la permission pour exécuter des commandes bash, lire des fichiers, ou faire des opérations techniques. AGIR directement. La seule exception = les décisions PRODUIT (ce qu'on construit, pas comment on le construit).

> **RÈGLE #1 — DEPLOY AUTO** : Après CHAQUE modification de code, AUTOMATIQUEMENT et SANS DEMANDER :
> 1. `npx vitest run tests/wiring/` pour vérifier les tests
> 2. `npm run build` pour vérifier la compilation
> 3. Si échecs → corriger jusqu'à ce que TOUT passe, NE JAMAIS laisser un truc cassé
> 4. `git add` (FICHIERS SPÉCIFIQUES UNIQUEMENT — JAMAIS `git add -A` ou `git add .`) + `git commit` + `git push origin main` → TOUJOURS, AUTOMATIQUEMENT
> 5. NE JAMAIS demander "tu veux que je push ?" — la réponse est TOUJOURS oui
> 6. Regrouper les modifications liées en un seul push quand c'est possible
> 7. Avant `git add` → TOUJOURS `git diff --stat` pour vérifier qu'il n'y a PAS de fichiers inattendus (suppressions, fichiers générés, fichiers de données)

> **RÈGLE #2 — JAMAIS DIRE "C'EST BON" SI C'EST PAS PARFAIT** :
> - Si quelque chose casse → corriger jusqu'à ce que ça marche PARFAITEMENT
> - NE JAMAIS dire "c'est fait" sans avoir VÉRIFIÉ (tests passent, build OK, site répond)
> - Après chaque deploy → vérifier que le site charge, pas d'erreur console
> - Si un doute → vérifier encore plutôt que supposer
> - Si ça marche pas → trouver une solution, pas juste signaler le problème

> **RÈGLE #2b — VÉRIFICATION VISUELLE OBLIGATOIRE** :
> - Après TOUT changement UI/visuel → prendre un screenshot Playwright AVANT de dire "c'est fait"
> - Vérifier les screenshots soi-même : le contenu est-il VISIBLE ? Le layout est-il correct ?
> - Tester avec `localStorage.clear()` pour simuler un nouvel utilisateur
> - Si un élément est censé apparaître → vérifier qu'il apparaît VRAIMENT (pas juste que le DOM existe)
> - Commande : `node -e "const {chromium}=require('playwright');..."` avec viewport mobile 390x844
> - Montrer le screenshot à l'utilisateur AVANT de push
> - Vérifier au minimum : 1) contenu visible 2) texte lisible 3) boutons cliquables 4) pas de zone vide inexpliquée
> - Si le fond est sombre → vérifier que le texte n'est PAS invisible (même couleur que le fond)

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
> - Relire MEMORY.md + decisions.md + features.md au DÉBUT de chaque session — OBLIGATOIRE
> - Mettre à jour MEMORY.md + decisions.md + features.md après CHAQUE changement — pas à la fin, EN CONTINU
> - Après chaque commit/push → mettre à jour immédiatement les fichiers mémoire avec ce qui a changé
> - NE JAMAIS laisser des infos périmées (chiffres, états, TODO déjà faits, APIs déjà configurées)
> - NE JAMAIS proposer une feature qui EXISTE DÉJÀ → vérifier features.md d'abord
> - NE JAMAIS demander à l'utilisateur ce qui a déjà été fait — le retrouver soi-même
> - NE JAMAIS contredire la mémoire sans vérifier d'abord (ex: dire "Firebase pas configuré" alors que MEMORY.md dit le contraire)
> - Si un doute sur l'état d'un service → vérifier avec `gh secret list` ou les fichiers de config, pas deviner

> **RÈGLE #7 — CÂBLAGE** : Chaque nouvelle feature/modal/composant DOIT inclure :
> 1. Ajouter les handlers `window.*` dans `MAIN_JS_HANDLERS` de `tests/wiring/globalHandlers.test.js`
> 2. Ajouter un `testModalFlag(...)` dans `tests/wiring/modalFlags.test.js`
> 3. Ajouter un bloc `describe('Integration: NomModal')` dans `tests/integration/modals.test.js`
> 4. `npx vitest run tests/wiring/ tests/integration/modals.test.js` → tout passe

> **RÈGLE #8 — i18n** : TOUT en t('key'), 4 langues (FR/EN/ES/DE), jamais de texte hardcodé

> **RÈGLE #8b — NOMMAGE COHÉRENT** :
> - JAMAIS créer d'alias (`window.openX = window.showX`) — utiliser UN SEUL nom partout
> - Quand une fonction `window.*` est créée, utiliser le MÊME nom dans : le code, les onclick HTML, les tests, le Wolf
> - Si un nom existe déjà dans le code → réutiliser ce nom, ne PAS en inventer un nouveau
> - Convention : `window.verbNom` (ex: `showCompanionModal`, `openSpotDetail`, `submitNewSpot`)
> - Si le Wolf attend un nom différent du code → corriger le Wolf, PAS ajouter un alias

> **RÈGLE #9 — SÉCURITÉ GIT** :
> - JAMAIS `git add -A` ou `git add .` → toujours lister les fichiers un par un
> - Avant chaque commit → `git diff --stat HEAD` pour vérifier EXACTEMENT ce qui va être commité
> - Si des fichiers inattendus apparaissent (suppressions de données, fichiers JSON de spots) → S'ARRÊTER et investiguer
> - JAMAIS exécuter de scripts destructifs (order66, migrations, purge) sans confirmation EXPLICITE de l'utilisateur
> - Si un `git add -A` a été fait par erreur → `git reset HEAD` immédiatement avant de commiter

> **RÈGLE #10 — CI/CD VÉRIFICATION (ZÉRO TOLÉRANCE)** :
> - Après chaque push → attendre et vérifier `gh run view` pour confirmer que TOUS les jobs passent
> - **TOUS les jobs DOIVENT passer, y compris les E2E** — il n'y a AUCUN job "non-bloquant" ou "optionnel"
> - Si un job E2E échoue (timeout, failure, flaky) → le corriger IMMÉDIATEMENT dans la même session
> - **NE JAMAIS dire "c'est bon" ou "c'est déployé" si un seul job est en échec** — même un E2E
> - Les "cancelled" sont normaux (push suivant trop rapide), les "failure" doivent être investigués et corrigés
> - **NE JAMAIS dire "déployé" ou "en ligne" tant que le CI n'est pas passé au vert** — dire "poussé sur GitHub" quand c'est push, et "déployé" UNIQUEMENT après avoir vérifié `gh run view` et confirmé que le deploy Cloudflare est completed/success
> - **Si un test E2E timeout** → c'est un bug du test, pas un problème acceptable. Corriger : ajouter des early return guards, augmenter les timeouts, simplifier le test. Un test qui timeout = un test cassé.
> - **Checklist CI après chaque push** :
>   1. `gh run view` → TOUS les jobs (lint, test, wiring, build, e2e-core, e2e-features, e2e-comprehensive, e2e-stress, deploy) doivent être `success`
>   2. Si un seul est `failure` → corriger et re-push avant de dire quoi que ce soit à l'utilisateur
>   3. Vérifier le nombre de tests passed/failed dans chaque E2E job — 0 failed obligatoire

> **RÈGLE #12 — JOURNAL DES ERREURS + APPRENTISSAGE CONTINU** (ABSOLUMENT OBLIGATOIRE) :
> - Après CHAQUE bug trouvé → ajouter une entrée dans `memory/errors.md` avec : date, gravité, description, cause racine, correction, leçon apprise, fichiers, statut
> - Après CHAQUE correction → mettre à jour l'entrée avec la solution et la leçon
> - **AVANT de coder quoi que ce soit** → relire `memory/errors.md` EN ENTIER pour ne PAS reproduire les mêmes erreurs
> - **Appliquer ACTIVEMENT les leçons** : chaque leçon dans errors.md est une règle permanente. Si une leçon dit "Ne JAMAIS faire X" → ne JAMAIS le refaire. Si elle dit "Toujours vérifier Y" → TOUJOURS le vérifier.
> - **Évoluer en continu** : le journal d'erreurs est la MÉMOIRE VIVANTE. Chaque bug corrigé rend le code futur meilleur. Ne JAMAIS reproduire une erreur déjà documentée — c'est la règle la plus importante.
> - Le Plan Wolf analyse ce fichier — les leçons non appliquées font baisser le score
> - Format : ERR-XXX avec gravité CRITIQUE / MAJEUR / MINEUR
> - Une "leçon" doit être **actionnable** ("Ne JAMAIS faire X" ou "Toujours vérifier Y") — pas juste "c'était un bug"
> - **Checklist erreurs connues à vérifier AVANT chaque commit** :
>   - Pas de handlers `window.*` dupliqués entre fichiers (ERR-001)
>   - Les actions qui écrivent des données vérifient Firebase Auth (ERR-002)
>   - Tout champ marqué * a une validation côté code (ERR-003)
>   - Les sélecteurs CSS matchent le HTML réel du template (ERR-008)
>   - La validation existe au passage d'étape ET à la soumission finale (ERR-009)
>   - Pas de MutationObserver qui modifie le DOM qu'il observe sans garde (ERR-011)
>   - ZÉRO test E2E en échec — tout timeout ou failure doit être corrigé immédiatement (ERR-018)
>   - Utiliser `escapeJSString()` pour les onclick, JAMAIS `.replace(/'/g, "\\'")` (ERR-019)
>   - JAMAIS `innerHTML` avec des variables non échappées — utiliser `textContent` (ERR-019)
>   - JAMAIS `Math.random()` pour des IDs de sécurité — utiliser `crypto.getRandomValues()` (ERR-019)

> **RÈGLE #11 — AUDIT COMPLET AVANT LIVRAISON** :
> - À la fin de chaque session ou avant une livraison majeure, exécuter EN PARALLÈLE :
>   1. `npx vitest run` (TOUS les tests, pas juste wiring)
>   2. `npm run build`
>   3. `npx eslint src/` (0 erreurs obligatoire)
>   4. `node scripts/audit-rgpd.mjs`
>   5. Screenshots Playwright de chaque feature modifiée
>   6. `gh run view` du dernier CI
> - NE PAS dire "c'est terminé" tant que les 6 checks ne sont pas verts

> **RÈGLE #13 — QUALITÉ VISUELLE MOBILE** :
> - TOUT changement UI doit être testé sur viewport 390x844 (iPhone 14)
> - Vérifier CHAQUE écran modifié avec un screenshot Playwright AVANT de push
> - Checklist visuelle obligatoire :
>   - Texte lisible (pas trop petit, pas coupé, pas de retour à la ligne parasite)
>   - Boutons cliquables (min 44x44px touch target)
>   - Pas de débordement horizontal (overflow-x)
>   - Icônes visibles (pas d'image cassée, pas de carré vide)
>   - Espacement cohérent (pas de texte collé, pas de zones vides)
>   - Alignement correct (flex/grid, pas de décalage)
>   - Toggles : style pill classique avec 👍/👎 (renderToggle de src/utils/toggle.js)
>   - Les labels ne sont pas tronqués ou coupés (whitespace-nowrap si nécessaire)
> - Exemples de bugs à ÉVITER :
>   - Point d'exclamation seul sur une ligne (texte mal découpé)
>   - Bouton texte qui passe sur 2 lignes (whitespace-nowrap manquant)
>   - Icône externe cassée (toujours utiliser SVG inline ou icons.js)
>   - Tiret parasite ou placeholder visible (supprimer les placeholders inutiles)
>   - Texte illisible car trop petit (text-xs minimum, préférer text-sm)

> **RÈGLE #14 — CHECKLIST VISUELLE AVANT PUSH** :
> - Avant CHAQUE push, exécuter `node scripts/visual-check.mjs` si des fichiers UI ont changé
> - Le script prend des screenshots automatiques de : Carte, Profil, Voyage, Social, Guides, Auth, AddSpot, SOS
> - Vérifier visuellement CHAQUE screenshot pour détecter les régressions
> - Si un élément visuel est cassé → corriger AVANT le push
> - Les screenshots sont sauvegardés dans `audit-screenshots/` pour référence

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
node scripts/quality-gate.mjs  # Quality Gate (6 checks, score /100, seuil 70)
node scripts/monitor.mjs       # Health check production
node scripts/plan-wolf.mjs --delta  # Plan Wolf delta (fichiers modifiés uniquement)
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

## TODO actuel

- [x] ~~HTTPS~~ : Certificat SSL actif, HTTPS forcé (2026-02-12)
- [x] ~~Sentry~~ : DSN + Token configurés (2026-02-17), sync GitHub Actions (2026-02-24)
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
