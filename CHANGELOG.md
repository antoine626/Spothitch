# 📋 Changelog - SpotHitch

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.1.0] - 2025-12-26

### ✨ Ajouté
- **PWA complète** : Icônes pour toutes les tailles (72-512px)
- **Mode offline** : Service Worker v2 avec fallback vers offline.html
- **Screenshots** : Images pour l'installation PWA (mobile + desktop)
- **IndexedDB** : Cache avancé pour les spots (pas de limite 5MB)
- **Compression d'images** : Réduction automatique avant upload
- **Debounce OSRM** : Rate limiting pour éviter les blocages API
- **SEO** : robots.txt, sitemap.xml, meta tags Open Graph
- **Documentation** : CONTRIBUTING.md, CHANGELOG.md

### 🔒 Sécurité
- Application de `escapeHtml()` sur toutes les entrées utilisateur
- Ajout de `rel="noopener noreferrer"` sur les liens externes
- Firestore Security Rules pour la protection des données

### 🐛 Corrigé
- Chemins du manifest.json pour GitHub Pages (`/Spothitch/`)
- Enregistrement du Service Worker dans index.html
- Scope et start_url pour installation PWA correcte

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
- [ ] Publication Google Play Store
- [ ] Publication Apple App Store

---

## Légende

- ✨ `Ajouté` : Nouvelles fonctionnalités
- 🔄 `Modifié` : Changements de fonctionnalités existantes
- 🗑️ `Supprimé` : Fonctionnalités retirées
- 🐛 `Corrigé` : Corrections de bugs
- 🔒 `Sécurité` : Corrections de vulnérabilités
- ⚠️ `Déprécié` : Fonctionnalités bientôt supprimées
