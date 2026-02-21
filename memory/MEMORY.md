# MEMORY.md - Mémoire de session SpotHitch

> Dernière mise à jour : 2026-02-21

---

## État du projet

- **Version** : 2.0.0
- **Commits** : 381
- **Premier commit** : 2025-12-23
- **Site live** : spothitch.com (GitHub Pages, HTTPS actif, cert expire 2026-05-13)
- **Spots** : 14 669 spots dans 137 pays (source Hitchmap/Hitchwiki ODBL)
- **Langues** : FR, EN, ES, DE
- **Tests** : 104 tests wiring, tests integration, E2E Playwright

---

## Ce qui est configuré et marche

- Build Vite + deploy GitHub Pages automatique (GitHub Actions)
- Carte MapLibre GL JS avec clustering + OpenFreeMap
- Chargement lazy des spots par pays (JSON dans public/data/spots/)
- PWA installable avec Service Worker (vite-plugin-pwa)
- Système i18n lazy-loaded par langue
- Gamification complète (points, badges, niveaux, leagues, VIP, quizz, défis)
- Social (amis, chat, messages privés, réactions, groupes)
- SOS v2 (SMS/WhatsApp, offline, countdown, alarme silencieuse, faux appel, enregistrement, contacts primaires, message perso)
- Companion v2 (SMS/WhatsApp, GPS breadcrumb, arrivée/départ notif, batterie, ETA, rappel check-in, contacts multiples, historique)
- Système d'auth progressif (Firebase Auth - Google, Facebook, Apple, email)
- Onboarding carousel 5 slides pour nouveaux visiteurs
- Pages SEO par ville (428 villes générées)
- Notifications de proximité
- Vérification d'identité progressive (5 niveaux)
- Report/Block/Modération
- Conformité RGPD + CCPA + Community Guidelines
- Auto-update via version.json
- Plan Wolf (commande test complète)
- Visual regression testing + Lighthouse CI

## Ce qui est configuré en prod (GitHub Secrets)

- **Firebase** : TOUTES les clés VITE_FIREBASE_* configurées depuis 2025-12-26 (Auth, Firestore, Storage, Messaging)
- **Sentry** : VITE_SENTRY_DSN configuré depuis 2026-02-17
- **Cloudflare** : Account ID + API Token configurés depuis 2026-02-16

## Ce qui est PAS encore configuré

- **Affiliés** : pas inscrit sur Hostelworld/Booking → pas de monétisation

---

## Infos utilisateur

- Antoine ne code pas — tout expliquer simplement
- Chromebook comme machine principale
- Ne JAMAIS demander permission pour les commandes bash
- Ne JAMAIS demander "tu veux que je push ?" — toujours push
- Tout doit TOUJOURS être sauvegardé sur GitHub (push systématique)

---

## Dernières sessions (reconstitué depuis git log)

### Session ~2026-02-21 (session 7 — MASSIVE UPDATE)
- Plan Wolf v4 : upgrade v3→v4, 16 phases, recherche web compétitive, audit boutons/liens, 2x attention fichiers modifiés
- Suppression rapport HTML Wolf (plus de wolf-report.html)
- Fix bugs : detectSeason supprimé de AddSpot.js, 15 href="#" corrigés, liens sociaux placeholder supprimés
- Suppression src/controllers/ entier (code mort, jamais importé)
- Déduplication handlers : gardes if(!window.xxx) ajoutées aux fallbacks main.js
- Sécurité : npm audit fix (2 vulns corrigées), CSP renforcé (object-src, base-uri, form-action), DOMPurify vérifié (20+ fichiers)
- **SOS v2** : choix SMS/WhatsApp, mode offline, countdown 5s, alarme silencieuse, faux appel, enregistrement audio/vidéo, contact principal, message personnalisable
- **Companion v2** : choix SMS/WhatsApp, fil GPS, notification arrivée/départ, alerte batterie faible, estimation ETA, rappel check-in, contacts de confiance multiples (5 max), historique voyages
- **Profil enrichi** : carte voyages (pays visités), références utilisateurs, langues parlées, bio personnalisable, contrôles vie privée, voyages partagés
- **Guides enrichis** : étiquette culturelle, info visa, info devise pour 20 pays
- Suppression 28 services orphelins (~22 500 lignes de code mort)
- Vérification cartes offline : déjà fonctionnel via Service Worker (CacheFirst tiles OpenFreeMap)
- **PWA** : 4 shortcuts app, share target, Badging API, optimisations Lighthouse (preconnect, dns-prefetch, fetchpriority)
- i18n : ~140 nouvelles clés en 4 langues
- 104 tests passent, build OK, tout pushé

### Session ~2026-02-21 (session 6)
- Plan Wolf v3 : upgrade majeur de v2 à v3, 14 phases au lieu de 10
- Nouvelles phases : Dead Code detection (exports/fonctions mortes), Lighthouse CI, Playwright screenshots, Feature Scores (score par feature)
- Améliorations : imports circulaires (DFS), scan ALL-files handlers dupliqués, onclick verification, memory accuracy check, image size audit
- Recommandations enrichies pour toutes les nouvelles catégories (dead code, circular imports, onclick, handlers dupliqués, images, Lighthouse, mémoire périmée)
- Score Wolf v3 : 70/100 (baisse attendue car plus de checks = plus de problèmes détectés)
- Détection : 399 exports morts, 36 fonctions mortes, 100 handlers dupliqués, 22 services orphelins, 1 onclick dangling

### Session ~2026-02-20 (session 5)
- Analyse des 9 points d'amélioration remontés par l'utilisateur
- Nettoyage carte : suppression bouton guide clignotant, compteur spots, bouton spots proches
- Recherche ville : force-load les spots du pays, affiche panneau même avec 0 spots
- Progression : capitalise "Pouces", historique pouces cliquable, boutons action défis, classement avec filtre pays, récompenses mensuelles
- Profil : stats renommées (Spots créés, Spots validés), couleurs alignées, footer (FAQ, À propos, Mentions légales, Inviter, Crédits)
- Filtres route : 7 filtres chips (tous, station, note 4+, attente <20min, vérifié, récent, abri)
- Labels spots carte trip : halo + collision detection (plus de chevauchement)
- Guide feedback : votes utile/pas utile sur chaque conseil, formulaire suggestion par section
- feedbackService.js centralisé (localStorage)
- Barre recherche carte : padding pl-12 + icône left-4 (plus de chevauchement)
- Mockups HTML : itinéraire (10), compagnon (20), radar (20), social (20), profil (20)
- i18n : ~30 nouvelles clés en 4 langues
- 104 tests wiring passent, build OK, déployé Cloudflare

### Session ~2026-02-20 (session 4)
- Mini-carte toujours visible dans AddSpot étape 1 (plus cachée derrière un bouton)
- Carte s'auto-initialise avec la position connue de l'utilisateur
- GPS centre et zoome la mini-carte quand activé
- Texte d'aide clair "Touche la carte pour placer ton spot" en ambre
- Carte plus grande (h-56 au lieu de h-48) avec bordure ambre
- i18n tapToPlaceSpot ajouté en 4 langues

### Session ~2026-02-20 (session 3)
- Fix MutationObserver boucle infinie dans AddSpot autocomplete (ERR-011) : flag de garde lastAutocompleteStep
- Retiré cleanupAutocompletes() des fonctions init (le cleanup est géré par l'Observer)
- Retiré l'affichage saison de l'étape 2 (la date est dans createdAt)
- Renforcé CLAUDE.md Règle #12 : apprentissage continu obligatoire + checklist erreurs connues avant chaque commit
- Ajouté décision E2E CI (2 workers, 1 retry, 30s timeout, no video)

### Session ~2026-02-20 (suite)
- Fix Service Worker interceptant les pages SEO : /city/* et /guides/* exclus du navigateFallback
- Fix formulaire AddSpot cassé : suppression 11 handlers en double dans main.js qui écrasaient la validation d'AddSpot.js
- Auth obligatoire pour créer un spot (Firebase Auth) + mode test (localStorage spothitch_test_mode)
- Validation étoiles obligatoire (sécurité, trafic, accessibilité) avant soumission
- Fix bugs badge popup + daily reward (close handlers manquants)
- Plan Wolf v2 : recommandations humaines en français (titre/explication/action/impact)
- Mise à jour CLAUDE.md Règle #6 : mémoire mise à jour en CONTINU (pas juste en fin de session)
- Correction MEMORY.md : Firebase configuré depuis 2025-12-26, Sentry depuis 2026-02-17

### Session ~2026-02-20 (début)
- Fix CHROME_PATH pour Plan Wolf + Lighthouse CI
- Ajout Plan Wolf (master test command)
- Infrastructure de tests complète (visual regression, Lighthouse CI, Sentry error learning)
- Fix tests pour lazy-loaded i18n
- Perf: split i18n par langue + defer non-critical init

### Session ~2026-02-19
- Perf: lazy-load MapLibre + compress images WebP
- Isolation chunk Sentry
- Audit fixes (16 clés i18n, 4 handlers manquants)
- Ajout 56 state keys manquants pour gamification/modération

### Session ~2026-02-18
- Fix carousel slides invisibles
- Suppression 20 clés i18n dupliquées
- SOS integration tests + RGPD storage
- Features légales (Report, Block, SOS disclaimer, Companion consent, CCPA)
- Onboarding carousel 5 slides
- Système auth progressif + social login

### Sessions antérieures
- Order 66 script (suppression données Hitchmap)
- Kill switch VITE_HITCHMAP_ENABLED
- Pages SEO par ville (852 villes)
- Refonte AddSpot + ValidateSpot modal
- Filtres carte fonctionnels
- Notifications de proximité
- Tags enrichis + check-in temporels
- Nettoyage 3642 spots dangereux
- Traduction in-app (MyMemory API)
- Stations-service sur la carte (Overpass API)
