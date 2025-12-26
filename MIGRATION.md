# 🔄 Guide de Migration SpotHitch v1 → v2

Ce document détaille les changements architecturaux entre la version monolithique (v1) et la version modulaire (v2).

## 📋 Résumé des changements

| Aspect | v1 (Monolithique) | v2 (Modulaire) |
|--------|-------------------|----------------|
| Structure | 1 fichier (~8000 lignes) | ~40 fichiers modulaires |
| CSS | Tailwind CDN | Tailwind compilé localement |
| Build | Aucun | Vite |
| Tests | Aucun | Vitest avec couverture |
| CI/CD | Aucun | GitHub Actions |
| Monitoring | Console.log | Sentry |
| State | Variables globales | Store réactif |

## 🏗️ Nouvelle Structure

```
src/
├── main.js              # Point d'entrée
├── components/          # Composants UI
│   ├── App.js          # Composant principal
│   ├── Header.js       # En-tête
│   ├── Navigation.js   # Navigation basse
│   ├── SpotCard.js     # Carte de spot
│   ├── views/          # Pages
│   │   ├── Home.js
│   │   ├── Spots.js
│   │   ├── Chat.js
│   │   └── Profile.js
│   └── modals/         # Modales
│       ├── Welcome.js
│       ├── SpotDetail.js
│       ├── AddSpot.js
│       ├── SOS.js
│       ├── Tutorial.js
│       └── Auth.js
├── services/           # Logique métier
│   ├── firebase.js     # Auth + Firestore
│   ├── osrm.js         # Routing
│   ├── sentry.js       # Error monitoring
│   └── notifications.js # Push + Toasts
├── stores/             # État global
│   └── state.js        # Store réactif
├── i18n/               # Traductions
│   └── index.js
├── utils/              # Utilitaires
│   ├── storage.js      # LocalStorage + IndexedDB
│   └── image.js        # Compression d'images
├── styles/             # CSS
│   └── main.css        # Tailwind + custom
└── data/               # Données
    └── spots.js        # Spots de démo
```

## 🔀 Correspondances v1 → v2

### État Global

**v1:**
```javascript
// Variables globales dans le scope principal
let state = {
    activeTab: 'home',
    spots: [],
    // ...
};
```

**v2:**
```javascript
// src/stores/state.js
import { getState, setState, subscribe, actions } from './stores/state.js';

// Lecture
const currentState = getState();

// Mise à jour
setState({ activeTab: 'spots' });

// Écoute des changements
subscribe((state) => render(state));
```

### Traductions

**v1:**
```javascript
const translations = { fr: {...}, en: {...} };
function t(key) { return translations[state.lang][key]; }
```

**v2:**
```javascript
// src/i18n/index.js
import { t, setLanguage } from './i18n/index.js';

t('addSpot'); // "Ajouter un spot"
setLanguage('en');
```

### Firebase

**v1:**
```javascript
// Global firebase object
firebase.initializeApp(config);
const db = firebase.firestore();
```

**v2:**
```javascript
// src/services/firebase.js
import { initializeFirebase, getSpots, addSpot } from './services/firebase.js';

initializeFirebase();
const spots = await getSpots();
```

### Composants UI

**v1:**
```javascript
function renderSpotCard(spot) {
    return `<div class="card">...</div>`;
}
```

**v2:**
```javascript
// src/components/SpotCard.js
export function renderSpotCard(spot, variant = 'default') {
    // ...
}

// Import ailleurs
import { renderSpotCard } from '../components/SpotCard.js';
```

## 🚀 Déploiement

### v1 (GitHub Pages manuel)
```bash
# Push du fichier index.html directement
git push origin main
```

### v2 (CI/CD automatisé)
```bash
# Push déclenche automatiquement:
# 1. Tests
# 2. Build
# 3. Lighthouse audit
# 4. Deploy

git push origin main
# → GitHub Actions s'occupe du reste
```

## ✅ Checklist de migration

- [ ] Cloner le nouveau repo
- [ ] Copier les icônes PWA dans `/public/`
- [ ] Mettre à jour les clés Firebase dans `.env.local`
- [ ] Configurer Sentry (optionnel)
- [ ] Exécuter `npm run test` pour vérifier
- [ ] Exécuter `npm run build` pour tester le build
- [ ] Pousser sur GitHub pour déclencher le déploiement

## 🔧 Variables d'environnement

Créer un fichier `.env.local` :

```env
# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=spothitch.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=spothitch
VITE_FIREBASE_STORAGE_BUCKET=spothitch.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Sentry (optionnel)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# App
VITE_APP_VERSION=2.0.0
```

## 📊 Améliorations de performance

| Métrique | v1 | v2 (cible) |
|----------|----|----|
| Bundle size | 550KB | ~150KB |
| FCP | ~3s | <1.5s |
| LCP | ~4s | <2.5s |
| TTI | ~5s | <3s |
| CLS | 0.2 | <0.1 |

## 🆘 Support

En cas de problème lors de la migration :
1. Vérifier les logs de GitHub Actions
2. Lancer `npm run test` localement
3. Consulter les issues du repo
