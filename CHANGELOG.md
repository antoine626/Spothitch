# 📋 Changelog - SpotHitch

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.2.0] - 2025-12-26

### ✨ Ajouté
- **Audit QA complet** : Analyse exhaustive du code avec corrections automatiques
- **PWA Install Prompt** : Bannière d'installation élégante après 30s d'utilisation
- **Network Status Indicator** : Indicateur visuel du mode hors-ligne
- **CleanupManager** : Gestionnaire de ressources pour éviter les fuites mémoire
- **Debug Wrapper** : Désactivation automatique des console.log en production
- **Focus Styles** : Styles de focus accessibles sur tous les éléments interactifs
- **Responsive CSS** : Améliorations pour mobile et touch devices
- **Reduced Motion** : Support pour les utilisateurs sensibles aux animations
- **Privacy Policy** : Politique de confidentialité RGPD (PRIVACY.md)
- **Terms of Service** : Conditions d'utilisation (TERMS.md)
- **Audit Report** : Rapport d'audit QA détaillé (AUDIT-REPORT.md)

### 🔒 Sécurité
- **Images alt** : Attribut alt ajouté à toutes les images
- **Lazy Loading** : Images chargées en différé pour la performance
- **Form Validation** : Validation HTML5 (required, minlength, pattern)
- **Error Handling** : Tous les catch blocks loggent maintenant les erreurs
- **Aria Labels** : Labels d'accessibilité sur les boutons icônes

### 🐛 Corrigé
- Catch blocks vides qui avalaient les erreurs silencieusement
- Loader en français uniquement → maintenant multilingue
- États de chargement manquants dans le state
- Styles de focus insuffisants pour la navigation clavier

### 🔧 Technique
- Messages d'erreur système ajoutés aux traductions (FR/EN/ES)
- SEO meta tags supplémentaires (og:image:width, twitter:creator)
- Touch targets minimum 44px pour les appareils tactiles

---

## [1.1.0] - 2025-12-26

### ✨ Ajouté
- **PWA complète** : Icônes pour toutes les tailles (72-512px)
- **Mode offline** : Service Worker v3 avec stratégies optimisées
- **Screenshots** : Images pour l'installation PWA (mobile + desktop)
- **IndexedDB** : Cache avancé pour les spots (pas de limite 5MB)
- **Compression d'images** : Réduction automatique avant upload
- **Debounce OSRM** : Rate limiting pour éviter les blocages API
- **SEO** : robots.txt, sitemap.xml, meta tags Open Graph
- **Documentation** : CONTRIBUTING.md, CHANGELOG.md, SECURITY.md, PUBLISHING.md

### 🔒 Sécurité
- Application de `escapeHtml()` sur toutes les entrées utilisateur
- Ajout de `rel="noopener noreferrer"` sur les liens externes
- Subresource Integrity (SRI) sur les CDN
- Firestore Security Rules pour la protection des données

### 🐛 Corrigé
- Chemins du manifest.json pour GitHub Pages (`/Spothitch/`)
- Enregistrement du Service Worker dans index.html
- Scope et start_url pour installation PWA correcte

### 🔧 Technique
- Service Worker v3 avec Stale-While-Revalidate
- Critical CSS inline pour le premier rendu
- Preload/defer des ressources
- Web Vitals monitoring (LCP, FID, CLS)

---

## [1.0.0] - 2025-12-23

### ✨ Ajouté
- **Carte interactive** avec Leaflet.js et clustering
- **40+ spots** d'autostop en Europe (basés sur Hitchwiki)
- **Système de gamification** :
  - Points et niveaux (Novice → Légende)
  - 20+ badges à débloquer
  - Ligues compétitives (Bronze → Diamant)
  - Missions quotidiennes/hebdomadaires
- **Planificateur de voyage** avec routing OSRM
- **Chat communautaire** en temps réel
- **Guides par pays** (légalité, conseils, urgences)
- **Mode SOS** avec partage de position
- **Internationalisation** : FR, EN, ES
- **Thème sombre/clair**
- **Firebase** : Auth, Firestore, Storage (optionnel)

### 🛠️ Technique
- Application SPA monofichier (~7200 lignes)
- State management vanilla JS
- LocalStorage pour persistance offline
- Responsive design avec Tailwind CSS

---

## [Unreleased]

### 🔜 Prévu
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Background sync pour les ajouts offline
- [ ] Leaderboard Firebase temps réel
- [ ] Export GPX des itinéraires
- [ ] Tests automatisés (Jest, Cypress)
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Monitoring erreurs (Sentry)
- [ ] Publication Google Play Store
- [ ] Publication Apple App Store

---

## Légende

- ✨ `Ajouté` : Nouvelles fonctionnalités
- 🔄 `Modifié` : Changements de fonctionnalités existantes
- 🗑️ `Supprimé` : Fonctionnalités retirées
- 🐛 `Corrigé` : Corrections de bugs
- 🔒 `Sécurité` : Corrections de vulnérabilités
- 🔧 `Technique` : Changements techniques internes
- ⚠️ `Déprécié` : Fonctionnalités bientôt supprimées
