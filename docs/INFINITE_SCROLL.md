# Service Infinite Scroll

Service performant pour implémenter le chargement infini (infinite scroll) dans les listes. Utilise l'Intersection Observer API pour une performance optimale.

## Installation

Le service est déjà inclus dans le projet. Importez-le dans vos fichiers :

```javascript
import {
  initInfiniteScroll,
  destroyInfiniteScroll,
  setLoading,
  hasMoreItems,
  setHasMore,
  isLoading,
  resetScroll,
  manualLoadMore
} from '../services/infiniteScroll.js';
```

## API Reference

### `initInfiniteScroll(container, loadMoreFn, options)`

Initialise l'infinite scroll sur un conteneur.

**Paramètres** :
- `container` (string|HTMLElement) : Sélecteur CSS ou élément DOM du conteneur scrollable
- `loadMoreFn` (async Function) : Fonction appelée pour charger plus d'items
  - Reçoit l'instance comme paramètre
  - Doit être async
  - À la fin, appeler `setHasMore(container, false)` si pas plus d'items
- `options` (Object) : Configuration optionnelle
  - `threshold` (number, défaut: 100) : pixels du bas avant de charger
  - `initialLoad` (boolean, défaut: true) : charger au démarrage

**Retour** : Instance du scroll ou `null` si erreur

**Exemple** :
```javascript
// Dans un composant
const container = document.querySelector('#spots-list');

const instance = initInfiniteScroll(
  container,
  async (instance) => {
    // Charger plus de spots depuis l'API
    const newSpots = await fetchSpots();

    // Ajouter les spots au DOM
    container.innerHTML += newSpots.map(renderSpot).join('');

    // Si pas plus d'items
    if (newSpots.length < 20) {
      setHasMore(container, false);
    }
  },
  { threshold: 200, initialLoad: true }
);
```

### `destroyInfiniteScroll(container)`

Nettoie l'instance et les listeners.

**Paramètres** :
- `container` (string|HTMLElement) : Conteneur à nettoyer

**Exemple** :
```javascript
// Avant de changer de vue
destroyInfiniteScroll('#spots-list');
```

### `setLoading(container, isLoading)`

Affiche ou masque le loader de chargement.

**Paramètres** :
- `container` (string|HTMLElement) : Conteneur
- `isLoading` (boolean) : État du chargement

**Automatique** : Cette fonction est appelée automatiquement par `initInfiniteScroll`.

**Exemple** :
```javascript
setLoading('#spots-list', true);  // Affiche le loader
setLoading('#spots-list', false); // Cache le loader
```

### `hasMoreItems(container)`

Vérifie s'il y a d'autres items à charger.

**Paramètres** :
- `container` (string|HTMLElement) : Conteneur

**Retour** : `true` s'il y a plus d'items, `false` sinon

**Exemple** :
```javascript
if (hasMoreItems('#spots-list')) {
  console.log('Il y a d\'autres spots!');
}
```

### `setHasMore(container, hasMore)`

Définit s'il y a d'autres items à charger.

**Paramètres** :
- `container` (string|HTMLElement) : Conteneur
- `hasMore` (boolean) : État

**Exemple** :
```javascript
// Dans loadMoreFn
if (newSpots.length < ITEMS_PER_PAGE) {
  setHasMore('#spots-list', false); // Fin de la liste
}
```

### `isLoading(container)`

Vérifie l'état du chargement.

**Paramètres** :
- `container` (string|HTMLElement) : Conteneur

**Retour** : `true` si en cours de chargement, `false` sinon

**Exemple** :
```javascript
if (!isLoading('#spots-list')) {
  // Peut charger
}
```

### `resetScroll(container)`

Réinitialise l'état du chargement sans perdre `hasMore`.

**Paramètres** :
- `container` (string|HTMLElement) : Conteneur

**Exemple** :
```javascript
resetScroll('#spots-list'); // Masque le loader si visible
```

### `manualLoadMore(container)`

Déclenche le chargement manuellement (non automatique via scroll).

**Paramètres** :
- `container` (string|HTMLElement) : Conteneur

**Retour** : Promise

**Exemple** :
```javascript
// Bouton "Charger plus"
document.querySelector('#load-more-btn').onclick = () => {
  manualLoadMore('#spots-list');
};
```

## Cas d'Usage

### 1. Liste de Spots avec Pagination

```javascript
// Dans src/components/views/Spots.js
import { initInfiniteScroll, setHasMore } from '../../services/infiniteScroll.js';

let currentPage = 1;
const SPOTS_PER_PAGE = 20;

function initSpotsList() {
  initInfiniteScroll(
    '#spots-container',
    async (instance) => {
      const response = await fetchSpots(currentPage, SPOTS_PER_PAGE);

      // Ajouter les spots
      const container = document.querySelector('#spots-container');
      response.spots.forEach(spot => {
        container.appendChild(renderSpotCard(spot));
      });

      // Vérifier s'il y a plus
      if (response.spots.length < SPOTS_PER_PAGE) {
        setHasMore('#spots-container', false);
      }

      currentPage++;
    },
    { threshold: 300 }
  );
}
```

### 2. Chat avec Messages Infinis

```javascript
// Dans src/components/views/Chat.js
let messageOffset = 0;

function initChatScroll() {
  initInfiniteScroll(
    '#chat-messages',
    async (instance) => {
      const newMessages = await fetchMessages(messageOffset, 15);

      // Insérer en bas
      const container = document.querySelector('#chat-messages');
      newMessages.forEach(msg => {
        const element = renderMessage(msg);
        container.appendChild(element);
      });

      if (newMessages.length < 15) {
        setHasMore('#chat-messages', false);
      }

      messageOffset += newMessages.length;
    },
    { initialLoad: false } // Pas de chargement au démarrage
  );
}
```

### 3. Destruction Propre

```javascript
// Quand l'utilisateur change d'onglet
function switchToProfile() {
  // Nettoyer infinite scroll de spots
  destroyInfiniteScroll('#spots-container');

  // Nettoyer infinite scroll de chat
  destroyInfiniteScroll('#chat-messages');

  // Afficher le profil
  showProfile();
}
```

## Performance

L'Intersection Observer API est utilisée pour détecter quand l'utilisateur scrolle près du bas de la liste. C'est beaucoup plus performant qu'écouter les événements `scroll` car :

- ✅ Pas de polling constant
- ✅ Pas de calculs pendant le scroll
- ✅ Vraiment asynchrone et off-thread
- ✅ Fonctionne même si le conteneur est invisible

## Configuration Recommandée

### Pour Listes Légères (chat, notifications)
```javascript
initInfiniteScroll(container, loadMoreFn, {
  threshold: 100,  // Charger tôt
  initialLoad: true
});
```

### Pour Listes Lourdes (spots avec images)
```javascript
initInfiniteScroll(container, loadMoreFn, {
  threshold: 300,  // Charger plus tard
  initialLoad: false  // Pas de charge au démarrage
});
```

## Gestion d'Erreurs

```javascript
initInfiniteScroll(
  '#spots-list',
  async (instance) => {
    try {
      const spots = await fetchSpots();
      // Ajouter au DOM

      if (spots.length === 0) {
        setHasMore('#spots-list', false); // Fin
      }
    } catch (error) {
      console.error('Erreur chargement spots:', error);
      // setHasMore devient false automatiquement en cas d'erreur
    }
  }
);
```

## Débogage

Le service log les messages de debug avec le préfixe `[InfiniteScroll]` :

```
[InfiniteScroll] Container not found
[InfiniteScroll] Instance already exists for this container
[InfiniteScroll] No instance found for this container
[InfiniteScroll] Error loading more items: ...
```

Ouvrez la console du navigateur (F12) pour voir ces messages.

## Compatibilité

- ✅ Tous les navigateurs modernes (Intersection Observer est supporté depuis 2018)
- ✅ Chrome/Edge 51+
- ✅ Firefox 55+
- ✅ Safari 12.1+
- ✅ iOS Safari 12.2+
- ✅ Android Chrome

Pour les anciens navigateurs, vous devez ajouter un polyfill (non inclus).

## Tests

Le service a 52 tests unitaires couvrant tous les cas :

```bash
npm run test:run -- tests/infiniteScroll.test.js
```

Voir `/home/antoine626/Spothitch/tests/infiniteScroll.test.js` pour les détails.
