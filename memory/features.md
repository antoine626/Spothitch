# features.md - Inventaire complet des fonctionnalités SpotHitch

> Dernière mise à jour : 2026-02-20
> IMPORTANT : Vérifier ce fichier AVANT de proposer une feature — elle existe peut-être déjà !

---

## Carte & Navigation

- [x] Carte interactive MapLibre GL JS avec tuiles OpenFreeMap
- [x] Clustering dynamique des spots (dé-cluster au zoom)
- [x] Couleurs de fraîcheur (vert=récent, jaune=ancien, gris=très vieux)
- [x] Centrage GPS sur position utilisateur
- [x] Split view (carte + liste côte à côte)
- [x] Affichage stations-service (toggle, via Overpass API)
- [x] Heatmap densité des spots
- [x] Filtres carte (type de spot, note, fraîcheur)
- [x] Panneau ville (infos + routes depuis une ville, affichage même avec 0 spots)
- [x] Style carte clair/sombre selon thème
- [x] Compteur de spots supprimé (nettoyage UI)
- [x] Bouton guide clignotant supprimé (nettoyage UI)

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
- [x] Personnalisation profil (cadres, titres, avatars)
- [x] Fil d'activité amis

## Sécurité & Vérification

- [x] Mode SOS : partage position d'urgence avec contacts
- [x] Mode Compagnon : check-in régulier pour voyageur solo, alertes temporelles, SMS
- [x] Vérification identité progressive (0-5 : non vérifié → email → téléphone → selfie+ID → vérifié)
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

- [x] Pages SEO par ville (852 villes auto-générées)
- [x] Routes populaires entre villes
- [x] robots.txt + sitemap.xml
- [x] Meta tags Open Graph
- [x] JSON-LD structured data

## PWA

- [x] Installable (manifest.json, icônes toutes tailles)
- [x] Offline complet
- [x] Push notifications (Firebase Messaging)
- [x] Bannière d'installation après 30s
- [x] Screenshots pour install prompt

## Monitoring & Tests

- [x] Sentry error tracking (optionnel, chunk isolé)
- [x] 88+ tests wiring (handlers + modal flags)
- [x] Tests integration modales
- [x] E2E Playwright
- [x] Visual regression (screenshots)
- [x] Lighthouse CI
- [x] Plan Wolf (commande master qui lance tous les checks)
- [x] Audit RGPD automatisé
- [x] ESLint + Prettier + Husky pre-commit

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
