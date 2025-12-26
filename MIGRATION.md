# 🏗️ Guide de Migration - Architecture Modulaire

Ce guide décrit comment migrer SpotHitch vers une architecture modulaire, comme recommandé par tous les audits externes.

## 📊 Problème Actuel

| Métrique | État Actuel | Objectif |
|----------|-------------|----------|
| Fichiers JS | 1 (monolithe) | 10-15 modules |
| Taille index.html | ~550 KB | ~50 KB |
| Testabilité | 0% | 80%+ |
| Code coupling | Très élevé | Faible |

## 🎯 Architecture Cible

```
/src
├── /core
│   ├── state.js          # State management centralisé
│   ├── storage.js        # LocalStorage + IndexedDB
│   └── router.js         # Navigation SPA
│
├── /services
│   ├── firebase.js       # Firebase Auth, Firestore, Storage
│   ├── map.js            # Leaflet + clustering
│   ├── osrm.js           # Routing OSRM
│   ├── geolocation.js    # GPS + validation
│   └── analytics.js      # Tracking événements
│
├── /components
│   ├── spot-card.js      # Carte de spot
│   ├── spot-details.js   # Modal détails spot
│   ├── map-view.js       # Vue carte
│   ├── trip-planner.js   # Planificateur
│   ├── chat.js           # Chat communautaire
│   ├── profile.js        # Profil utilisateur
│   └── onboarding.js     # Tutoriel
│
├── /utils
│   ├── sanitize.js       # XSS protection
│   ├── i18n.js           # Internationalisation
│   ├── format.js         # Formatage dates, nombres
│   └── validators.js     # Validation formulaires
│
├── /styles
│   ├── tailwind.config.js
│   └── custom.css
│
├── main.js               # Point d'entrée
└── index.html            # Shell HTML minimal
```

## 🔧 Étapes de Migration

### Phase 1 : Setup Build System (Vite)

```bash
# Initialiser le projet
npm init -y
npm install -D vite

# Structure initiale
mkdir -p src/{core,services,components,utils,styles}
```

**vite.config.js**
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: '/Spothitch/',
  build: {
    outDir: '../dist',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
})
```

### Phase 2 : Extraire le State Management

**src/core/state.js**
```javascript
// State centralisé avec observateurs
const state = {
  user: null,
  spots: [],
  trips: [],
  settings: {
    lang: 'fr',
    theme: 'dark'
  },
  ui: {
    activeTab: 'map',
    isLoading: false,
    selectedSpot: null
  }
};

const observers = new Set();

export function getState() {
  return { ...state };
}

export function setState(updates) {
  Object.assign(state, updates);
  notifyObservers();
}

export function subscribe(callback) {
  observers.add(callback);
  return () => observers.delete(callback);
}

function notifyObservers() {
  observers.forEach(cb => cb(getState()));
}
```

### Phase 3 : Extraire les Services

**src/services/firebase.js**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  // Config from environment or hardcoded for now
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function getSpots() {
  const snapshot = await getDocs(collection(db, 'spots'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

**src/services/map.js**
```javascript
import L from 'leaflet';
import 'leaflet.markercluster';

let map = null;
let markers = null;

export function initMap(containerId) {
  map = L.map(containerId).setView([46.5, 2.5], 6);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
  
  markers = L.markerClusterGroup();
  map.addLayer(markers);
  
  return map;
}

export function addSpotMarker(spot) {
  const marker = L.marker([spot.lat, spot.lng]);
  marker.bindPopup(createPopupContent(spot));
  markers.addLayer(marker);
  return marker;
}

export function clearMarkers() {
  markers.clearLayers();
}
```

### Phase 4 : Créer les Composants

**src/components/spot-card.js**
```javascript
import { sanitize } from '../utils/sanitize.js';
import { t } from '../utils/i18n.js';

export function SpotCard(spot) {
  return `
    <article class="spot-card" data-spot-id="${spot.id}">
      <img 
        src="${spot.photoUrl}" 
        alt="${t('spots.photo')} ${sanitize(spot.from)}"
        loading="lazy"
      >
      <div class="spot-card-content">
        <h3>${sanitize(spot.from)} → ${sanitize(spot.to)}</h3>
        <div class="rating">⭐ ${spot.rating.toFixed(1)}</div>
        <p>${sanitize(spot.description.substring(0, 100))}...</p>
      </div>
    </article>
  `;
}
```

### Phase 5 : Tailwind Local

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js**
```javascript
module.exports = {
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        dark: '#0f172a'
      }
    }
  },
  plugins: []
}
```

**src/styles/main.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
```

### Phase 6 : Point d'Entrée

**src/main.js**
```javascript
import { initMap, addSpotMarker } from './services/map.js';
import { getSpots, auth } from './services/firebase.js';
import { getState, setState, subscribe } from './core/state.js';
import { SpotCard } from './components/spot-card.js';
import './styles/main.css';

// Initialize
async function init() {
  // Setup map
  initMap('map-container');
  
  // Load spots
  const spots = await getSpots();
  setState({ spots });
  
  // Render spots on map
  spots.forEach(addSpotMarker);
  
  // Subscribe to state changes
  subscribe(render);
  
  // Initial render
  render();
}

function render() {
  const state = getState();
  // Render UI based on state
}

// Start app
init();
```

## 📦 Scripts NPM

**package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

## 🧪 Ajouter des Tests

```bash
npm install -D vitest @testing-library/dom
```

**src/utils/sanitize.test.js**
```javascript
import { describe, it, expect } from 'vitest';
import { sanitize } from './sanitize.js';

describe('sanitize', () => {
  it('should escape HTML entities', () => {
    expect(sanitize('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
  
  it('should handle null/undefined', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
  });
});
```

## ⏱️ Timeline Estimée

| Phase | Durée | Dépendances |
|-------|-------|-------------|
| Phase 1 (Vite) | 2h | Aucune |
| Phase 2 (State) | 4h | Phase 1 |
| Phase 3 (Services) | 8h | Phase 2 |
| Phase 4 (Composants) | 8h | Phase 3 |
| Phase 5 (Tailwind) | 2h | Phase 1 |
| Phase 6 (Intégration) | 4h | Toutes |
| Tests | 4h | Phase 4 |

**Total estimé : 32 heures de travail**

## 🚀 Bénéfices Attendus

| Métrique | Avant | Après |
|----------|-------|-------|
| Temps de chargement | ~4s | ~1.5s |
| Lighthouse Performance | ~60 | ~85 |
| Maintenabilité | ❌ | ✅ |
| Testabilité | ❌ | ✅ |
| Hot Reload dev | ❌ | ✅ |
| Tree Shaking | ❌ | ✅ |

## 📚 Ressources

- [Vite Documentation](https://vitejs.dev/)
- [ES Modules Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Tailwind CLI](https://tailwindcss.com/docs/installation)
- [Vitest](https://vitest.dev/)

---

*Ce guide sera mis à jour au fur et à mesure de la migration.*
