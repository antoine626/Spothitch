# Exemple d'Intégration Infinite Scroll

Ce document montre comment intégrer le service infinite scroll dans les composants réels de SpotHitch.

## Exemple 1 : Liste de Spots avec Pagination

### Structure HTML

```html
<!-- Dans src/components/views/Spots.js -->
<div id="spots-list-container" class="space-y-3" role="list">
  <!-- Les spots seront ajoutés ici dynamiquement -->
</div>
```

### Code d'Intégration

```javascript
// Dans src/main.js ou au démarrage de la vue
import { initInfiniteScroll, setHasMore } from '../services/infiniteScroll.js';
import { getState } from '../stores/state.js';

let spotPage = 1;
const SPOTS_PER_PAGE = 20;

function initSpotsInfiniteScroll() {
  const container = document.querySelector('#spots-list-container');
  if (!container) return;

  initInfiniteScroll(
    container,
    async (instance) => {
      try {
        // Récupérer l'état actuel
        const state = getState();

        // Charger les spots de la page actuelle
        const response = await fetchSpotsPage(
          spotPage,
          SPOTS_PER_PAGE,
          state.activeFilter
        );

        if (!response || !response.spots) {
          setHasMore(container, false);
          return;
        }

        // Ajouter les spots au DOM
        const html = response.spots
          .map(spot => renderSpotCard(spot))
          .join('');

        container.insertAdjacentHTML('beforeend', html);

        // Vérifier s'il y a d'autres pages
        if (response.spots.length < SPOTS_PER_PAGE) {
          setHasMore(container, false);
        } else {
          spotPage++;
        }
      } catch (error) {
        console.error('Erreur chargement spots:', error);
        setHasMore(container, false);
      }
    },
    {
      threshold: 300,      // Charger 300px avant le bas
      initialLoad: true    // Charger au démarrage
    }
  );
}

// Appeler au changement d'onglet vers Spots
window.onSpotsTabOpen = () => {
  spotPage = 1;  // Réinitialiser la page
  initSpotsInfiniteScroll();
};

// Nettoyer au changement d'onglet
window.onSpotsTabClose = () => {
  destroyInfiniteScroll('#spots-list-container');
};
```

### Handler de Filtre

```javascript
// Quand l'utilisateur change de filtre
window.setFilter = (filterId) => {
  const state = getState();
  state.activeFilter = filterId;

  // Réinitialiser la liste
  const container = document.querySelector('#spots-list-container');
  container.innerHTML = '';
  spotPage = 1;

  // Relancer infinite scroll
  destroyInfiniteScroll(container);
  initSpotsInfiniteScroll();
};
```

## Exemple 2 : Chat avec Messages Infinis

### Structure HTML

```html
<!-- Dans src/components/views/Chat.js -->
<div id="chat-messages-container" class="flex-1 overflow-y-auto p-4 space-y-3" role="log">
  <!-- Les messages seront ajoutés ici -->
</div>
```

### Code d'Intégration

```javascript
import { initInfiniteScroll, setHasMore } from '../services/infiniteScroll.js';

let messageOffset = 0;
let currentChatRoom = 'general';
const MESSAGES_PER_LOAD = 15;

function initChatInfiniteScroll() {
  const container = document.querySelector('#chat-messages-container');
  if (!container) return;

  messageOffset = 0; // Réinitialiser

  initInfiniteScroll(
    container,
    async (instance) => {
      try {
        // Charger les messages pour le salon actuel
        const messages = await fetchChatMessages(
          currentChatRoom,
          messageOffset,
          MESSAGES_PER_LOAD
        );

        if (!messages || messages.length === 0) {
          setHasMore(container, false);
          return;
        }

        // Ajouter les messages au DOM
        const html = messages
          .map(msg => renderMessage(msg))
          .join('');

        container.insertAdjacentHTML('beforeend', html);

        // Vérifier s'il y a d'autres messages
        if (messages.length < MESSAGES_PER_LOAD) {
          setHasMore(container, false);
        } else {
          messageOffset += messages.length;
        }
      } catch (error) {
        console.error('Erreur chargement messages:', error);
        setHasMore(container, false);
      }
    },
    {
      threshold: 100,      // Charger tôt pour le chat
      initialLoad: false   // Pas de chargement auto
    }
  );

  // Charger manuellement les premiers messages
  container.innerHTML = '';
  const initialMessages = await fetchChatMessages(
    currentChatRoom,
    0,
    MESSAGES_PER_LOAD
  );
  const html = initialMessages
    .map(msg => renderMessage(msg))
    .join('');
  container.innerHTML = html;
  messageOffset = initialMessages.length;
}

// Quand l'utilisateur change de salon
window.setChatRoom = (roomId) => {
  currentChatRoom = roomId;
  destroyInfiniteScroll('#chat-messages-container');
  initChatInfiniteScroll();
};
```

## Exemple 3 : Feed Activité avec Recherche

### Structure HTML

```html
<div id="activity-feed" class="space-y-4" role="list">
  <!-- Les éléments du feed seront ajoutés ici -->
</div>
```

### Code d'Intégration avec Recherche

```javascript
import { initInfiniteScroll, setHasMore, destroyInfiniteScroll } from '../services/infiniteScroll.js';

let feedPage = 1;
let searchQuery = '';
const FEED_ITEMS_PER_PAGE = 15;

function initActivityFeed() {
  const container = document.querySelector('#activity-feed');
  if (!container) return;

  feedPage = 1;
  container.innerHTML = '';

  initInfiniteScroll(
    container,
    async (instance) => {
      try {
        const response = await fetchActivityFeed(
          feedPage,
          FEED_ITEMS_PER_PAGE,
          searchQuery
        );

        const html = response.items
          .map(item => renderActivityItem(item))
          .join('');

        container.insertAdjacentHTML('beforeend', html);

        if (response.items.length < FEED_ITEMS_PER_PAGE) {
          setHasMore(container, false);
        } else {
          feedPage++;
        }
      } catch (error) {
        console.error('Feed error:', error);
        setHasMore(container, false);
      }
    },
    { threshold: 200, initialLoad: true }
  );
}

// Quand l'utilisateur tape dans la recherche
window.onFeedSearch = (query) => {
  searchQuery = query;
  feedPage = 1;

  // Réinitialiser le feed
  const container = document.querySelector('#activity-feed');
  container.innerHTML = '';
  destroyInfiniteScroll(container);

  // Relancer
  initActivityFeed();
};

// Au démarrage
initActivityFeed();
```

## Exemple 4 : Gestion Avancée avec État

### Code Complet avec Gestion d'État

```javascript
import { initInfiniteScroll, setHasMore, destroyInfiniteScroll, isLoading } from '../services/infiniteScroll.js';
import { setState, getState } from '../stores/state.js';

class SpotsListManager {
  constructor() {
    this.page = 1;
    this.container = null;
    this.isInitialized = false;
  }

  init(containerId) {
    this.container = document.querySelector(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    this.page = 1;
    initInfiniteScroll(
      this.container,
      this.loadMore.bind(this),
      { threshold: 300, initialLoad: true }
    );
    this.isInitialized = true;
  }

  async loadMore(instance) {
    try {
      const state = getState();
      const response = await fetchSpots(this.page, 20, state.filters);

      // Ajouter au DOM
      const html = response.spots
        .map(s => renderSpotCard(s))
        .join('');
      this.container.insertAdjacentHTML('beforeend', html);

      // Mettre à jour l'état
      setState({
        spots: [...state.spots, ...response.spots],
        spotCount: state.spotCount + response.spots.length
      });

      // Vérifier fin
      if (response.hasMore) {
        this.page++;
      } else {
        setHasMore(this.container, false);
      }
    } catch (error) {
      console.error('Load error:', error);
      setHasMore(this.container, false);

      // Notifier l'utilisateur
      setState({ error: 'Impossible de charger les spots' });
    }
  }

  reset() {
    this.page = 1;
    this.container.innerHTML = '';
    if (this.isInitialized) {
      destroyInfiniteScroll(this.container);
    }
    this.init('#spots-list');
  }

  destroy() {
    if (this.isInitialized) {
      destroyInfiniteScroll(this.container);
      this.isInitialized = false;
    }
  }
}

// Utilisation
const spotsList = new SpotsListManager();

// Initialiser au chargement de la vue
window.onSpotsViewLoad = () => {
  spotsList.init('#spots-list');
};

// Réinitialiser au changement de filtre
window.onFilterChange = (filter) => {
  setState({ filters: filter });
  spotsList.reset();
};

// Nettoyer au changement d'onglet
window.onViewChange = (newView) => {
  if (newView !== 'spots') {
    spotsList.destroy();
  }
};
```

## Considérations Importantes

### 1. Nettoyage Propre

```javascript
// IMPORTANT: Toujours nettoyer les instances
window.addEventListener('beforeunload', () => {
  destroyInfiniteScroll('#spots-list');
  destroyInfiniteScroll('#chat-messages');
});
```

### 2. Éviter les Chargements en Double

```javascript
// ❌ MAUVAIS: Le service empêche les doublons, mais mieux vaut être sûr
async function manualLoadMore() {
  // Ne pas appeler si déjà en chargement
  if (!isLoading('#spots-list')) {
    await manualLoadMore('#spots-list');
  }
}

// ✅ BON: Laisser le service gérer
async function manualLoadMore() {
  await manualLoadMore('#spots-list');
  // Le service s'en charge
}
```

### 3. Pagination vs Offset

```javascript
// Avec pagination (page number)
let page = 1;
// Dans loadMore: spotPage++;

// Avec offset
let offset = 0;
// Dans loadMore: offset += itemsLoaded;

// Les deux fonctionnent bien!
```

### 4. Gestion du Cache

```javascript
// Cacher les résultats pour éviter les rechargements
const spotCache = new Map();

async function loadSpots(page) {
  const cacheKey = `spots-page-${page}`;

  if (spotCache.has(cacheKey)) {
    return spotCache.get(cacheKey);
  }

  const spots = await fetchSpots(page);
  spotCache.set(cacheKey, spots);
  return spots;
}
```

## Tests

```bash
# Tester le service uniquement
npm run test:run -- tests/infiniteScroll.test.js

# Tester tout
npm run test:run

# En mode watch
npm run test
```

## Performance Tips

1. **Lazy Load les Images** : Les images des spots/messages doivent être lazy-loadées
2. **Virtualisation** : Pour très longues listes (1000+), considérer la virtualisation
3. **Debounce la Recherche** : Si intégré avec recherche
4. **Service Worker** : Cacher les réponses API
5. **Pagination Curseur** : Plus rapide que l'offset pour grandes données

## Débogage

```javascript
// Voir les logs de debug
localStorage.debug = 'infiniteScroll*';

// Vérifier l'état
console.log('Loading:', isLoading('#spots-list'));
console.log('Has more:', hasMoreItems('#spots-list'));

// Forcer un chargement
manualLoadMore('#spots-list');

// Réinitialiser
resetScroll('#spots-list');
```
