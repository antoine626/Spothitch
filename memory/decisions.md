# decisions.md - Historique des décisions SpotHitch

> Dernière mise à jour : 2026-02-26

---

## Architecture & Build

| Décision | Choix | Raison | Date |
|----------|-------|--------|------|
| Build system | Vite 7.x | Build rapide, HMR, ES Modules natifs, code splitting | 2025-12-27 |
| CSS | Tailwind CSS 4 compilé local | Pas de CDN, performance, contrôle total | 2025-12-27 |
| Carte | MapLibre GL JS 5 + OpenFreeMap | Gratuit, pas d'API key, WebGL, remplace Leaflet | 2026-01 |
| Backend | Firebase (Auth, Firestore, Storage) | Pas d'infra serveur, pay-as-you-go, auto-scaling | 2025-12-23 |
| Hosting | GitHub Pages | Gratuit, deploy auto via GitHub Actions | 2025-12-23 |
| Monitoring erreurs | Sentry (optionnel) | Chunk isolé, ne bloque pas si pas configuré | 2026-02 |
| PWA | vite-plugin-pwa (Workbox) | Offline-first, installable, auto-update | 2025-12-27 |
| Tests | Vitest + Playwright | Rapide, compatible Jest, E2E navigateur réel | 2025-12-27 |
| Linting | ESLint + Prettier | No semicolons, 2 espaces, camelCase | 2025-12-27 |
| Rendering | Dirty-checking + fingerprint | Pas de virtual DOM, mais skip renders si rien ne change visuellement | 2026-02-24 |
| MutationObservers | afterRender hooks ciblés | Les MO globaux sur body/subtree déclenchaient à chaque render, gaspillage CPU | 2026-02-24 |
| CSS transitions | transition-colors au lieu de transition-all | transition-all force le navigateur à vérifier toutes les propriétés CSS | 2026-02-24 |
| persistState | Debounce 500ms | Sérialisation JSON à chaque setState était coûteux, 500ms suffit | 2026-02-24 |

## Données

| Décision | Choix | Raison | Date |
|----------|-------|--------|------|
| Source spots | Hitchmap/Hitchwiki ODBL | 14 669 spots, 137 pays, données communautaires | 2025-12-23 |
| Stockage spots | JSON par pays dans public/data/spots/ | Chargement lazy par pays, pas de backend | 2026-01 |
| Cache client | IndexedDB + localStorage | Offline, pas de limite 5MB (IndexedDB) | 2025-12-26 |
| Nettoyage données | Suppression 3642 spots dangereux/peu fiables | Qualité > quantité | 2026-02 |
| Kill switch Hitchmap | VITE_HITCHMAP_ENABLED env var | Pouvoir couper les données Hitchmap si besoin légal | 2026-02 |

## UX / Produit

| Décision | Choix | Raison | Date |
|----------|-------|--------|------|
| Auth | Progressive (anonyme → email → social → vérifié) | Friction minimale, on montre la valeur d'abord | 2026-02 |
| Auth obligatoire AddSpot | Firebase Auth requis pour créer un spot (+ mode test localStorage) | Empêcher les données poubelle, garantir traçabilité | 2026-02-20 |
| SW denylist city/guides | /city/* et /guides/* exclus du navigateFallback SW | Pages SEO statiques ne doivent pas être interceptées par le SPA | 2026-02-20 |
| Onboarding | Carousel 5 slides puis carte directe | Map-first, montrer la valeur immédiatement | 2026-02 |
| Spots : 3 critères | Sécurité, trafic, accessibilité (1-5 étoiles) | Simple et suffisant pour évaluer un spot | 2025-12-23 |
| Direction obligatoire | Toujours indiquer la destination | Le coeur de l'app = trouver un spot VERS une destination | 2025-12-23 |
| 4 types de spots | Sortie de ville, station, bord de route, autre | Couvre tous les cas réels | 2025-12-23 |
| Photo obligatoire | Requise à la création de spot | Qualité des données, preuve visuelle | 2025-12-23 |
| Pas de paywall | Gratuit pour tous | Les autostoppeurs sont fauchés | 2025-12-23 |
| 4 langues | FR, EN, ES, DE | Couverture Europe principale | 2025-12-23 |
| Pages SEO villes | 428 pages générées auto depuis les spots | Google indexe, trafic organique | 2026-02 |
| Voyage carte totale | Carte plein écran + bottom sheet 3 états | Map-first UX, comme Google Maps | 2026-02-26 |
| Compagnon app-only | Supprimé SMS/WhatsApp, notifications push uniquement | Plus simple, pas de numéro requis, in-app | 2026-02-26 |
| SOS triple envoi | Push + SMS + appel en parallèle (Promise.allSettled) | Maximise les chances d'alerte en urgence | 2026-02-26 |
| Profil Firestore sync | Bio, réseaux sociaux, langues dans Firestore + localStorage | Visible par les autres, persiste entre appareils | 2026-02-26 |
| Firebase plan Spark | Rester gratuit pour maintenant, Blaze plus tard | Pas de coût tant que pas de notifs entre utilisateurs | 2026-02-26 |
| Proximité spots | 500m rayon, 1 vote/an, pas de popup permanente | Non-intrusif, anti-spam | 2026-02-26 |
| Mode En Route | Point bleu GPS live, pause/arrêt, pas de barre progression | Simple, réaliste (pas de progression linéaire en stop) | 2026-02-26 |

## Performance

| Décision | Choix | Raison | Date |
|----------|-------|--------|------|
| E2E CI speed | 2 workers, 1 retry, 30s timeout, no video, 60s webServer timeout | CI 2x plus rapide, réduit les timeouts | 2026-02-20 |
| Code splitting | Chunks manuels (maplibre, firebase, sentry, gamification) | Bundle initial minimal | 2026-02 |
| i18n lazy | 1 langue chargée à la fois | ~20KB au lieu de 80KB | 2026-02 |
| MapLibre lazy | Chargé uniquement quand la carte est affichée | 277KB économisés au premier chargement | 2026-02 |
| Images | Compression WebP 128/256px | Chargement rapide, surtout sur mobile | 2026-02 |
| Auto-update | Polling version.json + SW listener | L'utilisateur voit toujours la dernière version | 2026-01 |
| Lazy-load modales/vues | ~30 composants lazy dans App.js | Bundle 785KB → 200KB (-75%) | 2026-02-22 |
| Nommage cohérent | Règle #8b — 1 nom unique par handler, jamais d'alias | Éviter confusion rejectFriendRequest/declineFriendRequest | 2026-02-22 |

## Sécurité

| Décision | Choix | Raison | Date |
|----------|-------|--------|------|
| Sanitisation | DOMPurify | Protection XSS professionnelle | 2025-12-26 |
| CSP | Content Security Policy header | Anti-injection | 2025-12-26 |
| RGPD | Cookie banner + data export + audit script | Conformité EU | 2026-02 |
| CCPA | Opt-out California | Conformité US | 2026-02 |
| Git sécurité | Jamais git add -A, fichiers listés 1 par 1 | Éviter commits accidentels de données | 2026-02 |

## Composant / Rendering

| Décision | Choix | Raison | Date |
|----------|-------|--------|------|
| Framework | Aucun (vanilla JS) | Zéro dépendance runtime, rendu rapide | 2025-12-23 |
| Rendu | String-based (innerHTML) | Pas de virtual DOM, simple et performant | 2025-12-23 |
| Handlers | window.* globaux | Compatible avec innerHTML onclick="..." | 2025-12-23 |
| État | Store réactif custom (state.js) | Pub/sub simple, pas de Redux overhead | 2025-12-27 |
| Persistence état | localStorage sélectif | Certaines clés persistent, d'autres non | 2025-12-27 |

## APIs externes

| Service | Usage | Limite | Coût |
|---------|-------|--------|------|
| Firebase | Auth, DB, Storage, Push | Free tier: 50K docs/jour | Gratuit (tier gratuit) |
| OSRM | Routing itinéraires | 50 req/min par IP | Gratuit |
| Nominatim | Géocodage (nom → coords) | 1 req/sec | Gratuit |
| Overpass | Stations-service sur carte | 5 concurrent | Gratuit |
| OpenFreeMap | Tuiles carte | Illimité | Gratuit |
| MyMemory | Traduction in-app | 5000 mots/jour | Gratuit |
| Sentry | Monitoring erreurs | 5K events/mois (free) | Gratuit |
