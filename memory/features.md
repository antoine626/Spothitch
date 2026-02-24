# features.md - Inventaire complet des fonctionnalités SpotHitch

> Dernière mise à jour : 2026-02-24
> IMPORTANT : Vérifier ce fichier AVANT de proposer une feature — elle existe peut-être déjà !

---

## Carte & Navigation

- [x] Carte interactive MapLibre GL JS avec tuiles OpenFreeMap
- [x] Clustering dynamique des spots (dé-cluster au zoom)
- [x] Couleurs de fraîcheur (vert=récent, jaune=ancien, gris=très vieux)
- [x] Centrage GPS sur position utilisateur
- [x] Split view (carte + liste côte à côte)
- [x] Affichage stations-service (toggle, via Overpass API)
- [ ] ~~Heatmap densité des spots~~ (supprimé session 11 — code fantôme sans UI)
- [x] Filtres carte (type de spot, note, fraîcheur)
- [x] Panneau ville (infos + routes depuis une ville, affichage même avec 0 spots)
- [x] Style carte clair/sombre selon thème
- [x] Compteur de spots supprimé (nettoyage UI)
- [x] Bouton guide clignotant supprimé (nettoyage UI)
- [x] Bouton itinéraire supprimé de la carte (déjà dans Voyage)
- [x] Bouton guide redirige vers Voyage > Guides (raccourci)
- [x] Bouton stations-service toggle sur la carte (⛽)
- [x] Scroll vertical bloqué sur onglet carte (touch-action: none)
- [x] Focus orange/ambre supprimé au touch (conservé clavier)
- [x] Carte persistante entre onglets (display:none au lieu de destruction DOM)
- [x] Carte initialisée au lancement de l'app (pas seulement quand onglet carte affiché)

## Spots

- [x] 14 669 spots dans 137 pays (Hitchmap/Hitchwiki ODBL)
- [x] Chargement lazy par pays (JSON)
- [x] Création spot : wizard 3 étapes (Photo+Type → Expérience → Détails)
- [x] Mini-carte toujours visible à l'étape 1 (tap pour placer le spot, GPS en raccourci)
- [x] Photo obligatoire (compression + preview)
- [x] 4 types : sortie ville, station-service, bord de route, autre
- [x] 3 critères notation : sécurité, trafic, accessibilité (1-5 étoiles)
- [x] Tags enrichis : abri, visibilité, parking, commodités, méthode signalisation
- [x] Direction/destination obligatoire
- [x] Détail spot : stats, badges, reviews, navigation
- [x] Validation spot (modal dédiée)
- [x] Check-in : temps d'attente, résultat, photo, tracker "personnages"
- [x] Favoris : sauvegarder/retirer, tri par date/note, affichage sur carte
- [x] Export favoris
- [x] Badges de vérification (ambassadeur, validé par utilisateur)

## Voyage / Trip

- [x] Planificateur de voyage multi-villes (OSRM routing)
- [x] Analyse de route (distance, durée, spots le long du trajet)
- [x] Historique des voyages (sauvegarder/charger)
- [x] Commodités le long de la route
- [x] Barre de voyage active (indicateur flottant pendant planification)
- [x] Suggestions de spots le long de l'itinéraire
- [x] Filtres route (station, note 4+, attente <20min, vérifié, récent, abri)
- [x] Labels spots sans overlap sur carte trip (halo + collision detection)
- [x] Nommage spots par distance au lieu de commentaires

## Guides pays

- [x] 53 guides pays (difficulté, légalité, phrases, événements, numéros d'urgence)
- [x] Conseils communautaires (ajout + vote up/down)
- [x] Vote utile/pas utile sur chaque conseil guide (sections Débuter, Sécurité, Pays)
- [x] Formulaire de suggestion de conseils par section
- [x] Service feedback centralisé (feedbackService.js, localStorage)
- [x] Barre de recherche carte avec padding corrigé (plus de chevauchement icône)
- [x] Étiquette culturelle par pays (salutations, pourboire, do's/don'ts — 20 pays)
- [x] Informations visa par pays (EU/US, durée, visa à l'arrivée — 20 pays)
- [x] Informations devise par pays (monnaie, taux, paiement, budget — 20 pays)
- [x] Détail pays en 3 sous-onglets : Info, Culture, Pratique
- [x] Suggestions villes Photon API (plus rapide que Nominatim, 100ms debounce)

## Gamification

- [x] Points & XP (100 XP par niveau)
- [x] 50+ badges (Safety Scout, Jet Setter, Local Expert...)
- [x] Titres débloquables par progression
- [x] Boutique (cadres avatar, titres, boosters)
- [x] Récompense quotidienne avec streak
- [x] Leaderboard (hebdo/all-time, par points/saison)
- [x] 10+ niveaux VIP avec multiplicateurs XP
- [x] Système de ligues (Bronze → Diamond)
- [x] Défis équipe, défis amis, défis personnels
- [x] Quiz géographique interactif
- [x] Hub de défis (actifs/en attente)
- [x] Modal historique des Pouces (toggle dans ChallengesHub)
- [x] Badges/défis cliquables (cursor-pointer, z-index)
- [x] Boutons d'action sur les défis (challenges)
- [x] Leaderboard activé avec filtre pays/région
- [x] Récompenses mensuelles dans le leaderboard

## Social

- [x] Système d'amis (ajout, demandes, liste)
- [x] Messages privés 1-on-1 avec tracking non-lus
- [x] Chat par zone / salons
- [x] Réactions emoji sur messages (10+ emojis)
- [x] Groupes de voyage (création/rejoindre)
- [x] Amis à proximité (avec contrôles vie privée)
- [x] Profils utilisateurs (stats, badges, titres)
- [x] ~~Personnalisation profil (cadres, titres, avatars)~~ (bouton palette supprimé, emoji avatar conservé)
- [x] Fil d'activité amis
- [x] Profil enrichi : bio, langues parlées, carte pays visités, références, voyages partagés, contrôles vie privée
- [x] Mini-galerie photos profil (6 photos max, compression WebP, localStorage)
- [x] Liens réseaux sociaux (Instagram, TikTok, Facebook) dans profil
- [x] Formulaire voyage passé amélioré (dates début/fin, layout 2 colonnes)
- [x] Sélecteur de langues in-app (modal au lieu de prompt())
- [x] Vérification identité déplacée dans Réglages
- [x] Carte donation dans Profil et Progression (pas seulement Réglages)
- [x] Toggles 👍/👎 emoji au lieu de switches classiques

## Sécurité & Vérification

- [x] Mode SOS v2 : partage position, choix SMS/WhatsApp, mode offline, countdown 5s, alarme silencieuse, faux appel, enregistrement audio/vidéo, contact principal, message personnalisable, auto-détection pays urgence
- [x] Mode Compagnon v2 : check-in régulier, choix SMS/WhatsApp, GPS breadcrumb, notification arrivée/départ, alerte batterie faible, estimation ETA, rappel check-in, contacts multiples (5 max), historique voyages
- [x] Vérification identité progressive (0-5 : non vérifié → email → téléphone → selfie+ID → vérifié)
- [x] Score de confiance 11 facteurs : ancienneté, spots, vérifications, avis, identité, votes, photos profil, réseaux sociaux, bio, langues, check-ins
- [x] Vérification d'âge (modal confirmation)
- [x] Blocage utilisateur (bloquer/débloquer, liste)
- [x] Système de signalement (spots, utilisateurs, contenu + raison)
- [x] Disclaimer SOS
- [x] Consentement compagnon

## Auth

- [x] Login email/mot de passe (Firebase Auth)
- [x] Login social : Google, Facebook, Apple
- [x] Réinitialisation mot de passe par email
- [x] Sessions persistantes (auto-restore)
- [x] Auth progressive (anonyme d'abord, login quand nécessaire)
- [x] Auth gate (certaines actions demandent login)

## i18n & Localisation

- [x] 4 langues : Français, English, Español, Deutsch
- [x] Lazy-loading par langue (1 seule en mémoire)
- [x] Pluralisation correcte par langue
- [x] Détection auto langue navigateur
- [x] Switch de langue instantané (pas de reload)
- [x] Traduction in-app des descriptions (MyMemory API)

## Onboarding & UX

- [x] Carousel d'accueil 5 slides (nouveaux visiteurs)
- [x] Map-first : montrer la carte immédiatement
- [x] États vides avec messages et actions
- [x] Skeletons de chargement animés
- [x] Loading indicator avec progression
- [x] Toast notifications (info, succès, erreur, warning)
- [x] Dialogues de confirmation (actions destructives)
- [x] Tooltips
- [x] Thème clair/sombre
- [x] Profile footer reorganized: Help (FAQ, Contact, Bug Report), Legal (Privacy, CGU, Guidelines), About (Changelog, Invite, Social, Credits)
- [x] FAQ opens as fullscreen overlay (not broken tab navigation)
- [x] Legal pages open as fullscreen overlay (not broken tab navigation)
- [x] Bug report button in profile footer
- [x] Social links (Instagram, TikTok, Discord) in profile footer

## Accessibilité

- [x] Navigation clavier + focus trap dans modales
- [x] Support lecteur d'écran (ARIA, live regions, annonces)
- [x] Respect prefers-reduced-motion
- [x] Contraste couleurs WCAG AA
- [x] Alt text sur toutes les images
- [x] ARIA landmarks (structure sémantique)
- [x] Raccourcis clavier (Escape ferme modales, Ctrl+K recherche)

## Performance & Offline

- [x] Code splitting (chunks : maplibre, firebase, sentry, gamification, social, admin, guides)
- [x] Lazy-loading images (IntersectionObserver)
- [x] Compression images WebP (128/256px)
- [x] Service Worker offline-first (Workbox)
- [x] Cache tuiles carte pour offline
- [x] IndexedDB pour spots offline
- [x] localStorage pour préférences
- [x] Sync en arrière-plan quand retour online
- [x] Auto-update silencieux (version.json polling + SW)
- [x] Preloading carte pendant idle time
- [x] setState() dirty-checking (skip render si aucune valeur ne change)
- [x] Render fingerprint (skip DOM rebuild si état visuel identique)
- [x] persistState() debounce 500ms (moins d'écritures localStorage)
- [x] MutationObservers ciblés (plus de subtree:true sur body)
- [x] transition-colors au lieu de transition-all (352 occurrences, 61 fichiers)
- [x] MapLibre CSS lazy-loaded (50KB différé)
- [x] Widgets conditionnels (nearbyFriends, SOS tracking)
- [x] window.__renderStats() monitoring dev

## Légal & Conformité

- [x] Cookie banner RGPD + préférences
- [x] Export données personnelles (RGPD)
- [x] Audit RGPD automatisé (script)
- [x] CCPA (opt-out Californie)
- [x] Community Guidelines
- [x] Politique de confidentialité (PRIVACY.md)
- [x] Conditions d'utilisation (TERMS.md)

## Admin & Modération

- [x] Panneau admin (file modération, propositions suppression, warnings/bans)
- [x] Modération contenu

## SEO

- [x] Pages SEO par ville (428 villes auto-générées)
- [x] Routes populaires entre villes
- [x] robots.txt + sitemap.xml
- [x] Meta tags Open Graph
- [x] JSON-LD structured data

## PWA

- [x] Installable (manifest.json, icônes toutes tailles)
- [x] Offline complet
- [x] Push notifications (Firebase Messaging) — toggle UI branché session 11
- [x] Bannière d'installation après 30s
- [x] Screenshots pour install prompt
- [x] App shortcuts (Add Spot, SOS, Trip Planner, Profile)
- [x] Share Target API (recevoir des partages d'autres apps)
- [x] Carte de partage visuelle (WhatsApp, lien, screenshot) — branchée session 11
- [x] Alertes de proximité spots (GPS, rayon configurable) — toggle branché session 11
- [x] Badging API (badge compteur messages non-lus)
- [x] Optimisations Lighthouse (preconnect, dns-prefetch, fetchpriority)

## Monitoring & Tests

- [x] Sentry error tracking (optionnel, chunk isolé)
- [x] 123 tests wiring + impact analysis (handlers, modal flags, structure App/state/main)
- [x] Tests integration modales
- [x] E2E Playwright
- [x] Visual regression (screenshots)
- [x] Lighthouse CI
- [x] ~~Plan Wolf v4~~ → v5 (16 phases, mode --delta, intégration Quality Gate, tracking tendances QG)
- [x] Audit RGPD automatisé
- [x] ESLint + Prettier + Husky pre-commit
- [x] Quality Gate CI (6 checks automatiques : handlers, i18n, dead exports, security patterns, localStorage RGPD, error patterns — score /100, bloque le deploy si < 70)
- [x] Production Monitor (health check toutes les 6h + alerte GitHub issue automatique si échec)
- [x] Plan Wolf v5 (mode --delta, intégration Quality Gate, tracking tendances QG)

## Monétisation (préparé mais pas activé)

- [ ] Affiliés Hostelworld/Booking (pas encore inscrit)
- [x] Contenu sponsorisé (hostels/hébergements recommandés — code prêt)
- [x] Modal donation

## Configuré en prod

- [x] Firebase : GitHub Secrets configurés depuis 2025-12-26
- [x] Sentry : DSN configuré depuis 2026-02-17
- [x] Cloudflare : configuré depuis 2026-02-16

## Pas encore configuré en prod

- [ ] Affiliés : inscription manuelle nécessaire
