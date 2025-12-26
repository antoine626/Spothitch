# 📋 Changelog - SpotHitch

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.3.0] - 2025-12-26

### 🔍 Audits Externes
Cette version intègre les recommandations de **5 audits QA externes** couvrant :
- Architecture & Code
- Performance
- Sécurité
- Accessibilité
- UX/UI
- PWA
- SEO
- i18n
- Tests
- Analytics
- DevOps

### ✨ Ajouté

#### Sécurité 🔒
- **Content Security Policy (CSP)** : Protection contre XSS et injection
- **DOMPurify** : Librairie de sanitisation professionnelle
- **Fonction sanitize()** : Wrapper intelligent utilisant DOMPurify

#### Accessibilité ♿
- **ARIA Live Regions** : Annonces pour lecteurs d'écran
- **FocusManager** : Gestion du focus pour les modales (trap focus)
- **Fonction announce()** : Annonce les actions aux utilisateurs aveugles
- **Navigation clavier** : Escape ferme les modales, Ctrl+K pour recherche

#### UX/Onboarding 📱
- **Système d'Onboarding** : Tutoriel interactif pour nouveaux utilisateurs (4 étapes)
- **États vides** : Messages et actions pour les listes vides
- **Skeletons améliorés** : Animations de chargement plus fluides
- **OfflineManager** : Bannière et gestion intelligente du mode hors-ligne

#### Analytics 📊
- **Système Analytics** : Tracking d'événements RGPD-friendly
- **Template Sentry** : Prêt à activer pour monitoring d'erreurs

#### Internationalisation 🌍
- **i18nLoader** : Système de chargement asynchrone des traductions
- **Fichiers i18n/** : fr.json, en.json, es.json externalisés
- **Détection automatique** de la langue du navigateur

#### Documentation 📚
- **MIGRATION.md** : Guide complet de migration vers architecture modulaire
- **Fichiers i18n** : Templates de traduction structurés

### 🔧 Technique
- Raccourcis clavier globaux (Escape, Ctrl+K)
- Gestion des événements améliorée avec CleanupManager
- Préparation pour CI/CD

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

### 🔒 Sécurité
- Application de `escapeHtml()` sur toutes les entrées utilisateur
- Subresource Integrity (SRI) sur les CDN
- Firestore Security Rules

---

## [1.0.0] - 2025-12-23

### ✨ Ajouté
- **Carte interactive** avec Leaflet.js et clustering
- **40+ spots** d'autostop en Europe (basés sur Hitchwiki)
- **Système de gamification** : Points, niveaux, badges, ligues
- **Planificateur de voyage** avec routing OSRM
- **Chat communautaire** en temps réel
- **Guides par pays** (légalité, conseils, urgences)
- **Mode SOS** avec partage de position
- **Internationalisation** : FR, EN, ES
- **Thème sombre/clair**
- **Firebase** : Auth, Firestore, Storage

---

## [Unreleased]

### 🔜 Prévu
- [ ] **Migration Architecture** : Modules ES6 + Vite (voir MIGRATION.md)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Background sync complet
- [ ] Tests automatisés (Jest, Cypress)
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Publication stores (Play Store, App Store)

---

## Scores Audits Externes

| Domaine | Score Initial | Score Actuel | Objectif |
|---------|---------------|--------------|----------|
| Architecture | 2-4/10 | 4/10 | 7/10 (après migration) |
| Performance | 3-5/10 | 5/10 | 8/10 |
| Sécurité | 4-5/10 | 7/10 ✅ | 8/10 |
| Accessibilité | 2-4/10 | 6/10 | 9/10 |
| UX/UI | 4-6/10 | 7/10 | 8/10 |
| PWA | 6-7/10 | 8/10 ✅ | 9/10 |
| SEO | 2-4/10 | 5/10 | 8/10 |
| i18n | 2-5/10 | 6/10 | 8/10 |
| Tests | 0-3/10 | 3/10 | 8/10 |
| Analytics | 1-3/10 | 5/10 | 7/10 |

---

## Légende

- ✨ `Ajouté` : Nouvelles fonctionnalités
- 🔄 `Modifié` : Changements
- 🗑️ `Supprimé` : Fonctionnalités retirées
- 🐛 `Corrigé` : Corrections de bugs
- 🔒 `Sécurité` : Corrections de vulnérabilités
- 🔧 `Technique` : Changements internes
