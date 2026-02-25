/**
 * Spots View Component
 * List and map view of spots
 */

import { t } from '../../i18n/index.js';
import { renderSpotCard } from '../SpotCard.js';
import { renderSkeletonSpotList } from '../ui/Skeleton.js';
import { icon } from '../../utils/icons.js'

export function renderSpots(state) {
  const filteredSpots = filterSpots(state);

  return `
    <div class="p-4 overflow-x-hidden" role="tabpanel" id="panel-spots" aria-labelledby="tab-spots">
      <!-- Search & View Toggle -->
      <div class="flex gap-2 mb-4">
        <div class="flex-1 relative">
          ${icon('search', 'w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400')}
          <label for="search-input" class="sr-only">${t('searchSpot')}</label>
          <input
            id="search-input"
            type="search"
            class="input-modern pl-12"
            placeholder="${t('searchSpot')}"
            value="${state.searchQuery || ''}"
            oninput="handleSearch(this.value)"
            aria-describedby="search-results-count"
          />
        </div>

        <div class="flex gap-1 bg-white/5 rounded-xl p-1" role="group" aria-label="Mode d'affichage">
          <button
            onclick="setViewMode('list')"
            class="p-3 rounded-xl ${state.viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-400'}"
            aria-label="Vue liste"
            aria-pressed="${state.viewMode === 'list' ? 'true' : 'false'}"
            type="button"
          >
            ${icon('list', 'w-5 h-5')}
          </button>
          <button
            onclick="setViewMode('map')"
            class="p-3 rounded-xl ${state.viewMode === 'map' ? 'bg-primary-500 text-white' : 'text-slate-400'}"
            aria-label="Vue carte"
            aria-pressed="${state.viewMode === 'map' ? 'true' : 'false'}"
            type="button"
          >
            ${icon('map', 'w-5 h-5')}
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        ${renderFilterButtons(state)}
        <button
          onclick="openFilters()"
          class="badge bg-white/5 text-slate-400 whitespace-nowrap hover:bg-white/10"
        >
          ${icon('sliders-horizontal', 'w-5 h-5')}
          Plus
        </button>
      </div>
      
      <!-- Content -->
      ${state.spotsLoading
    ? (state.viewMode === 'list' ? renderSkeletonSpotList(5) : renderSpotsMapLoading())
    : (state.viewMode === 'list' ? renderSpotsList(filteredSpots) : renderSpotsMap())
}
    </div>
  `;
}

function renderFilterButtons(state) {
  const filters = [
    { id: 'all', label: t('filterAll'), icon: 'globe' },
    { id: 'top', label: t('filterTop'), icon: 'star' },
    { id: 'recent', label: t('filterRecent'), icon: 'clock' },
  ];

  return filters.map(filter => `
    <button
      onclick="setFilter('${filter.id}')"
      class="badge ${state.activeFilter === filter.id ? 'badge-primary' : 'bg-white/5 text-slate-400'} whitespace-nowrap"
      aria-pressed="${state.activeFilter === filter.id ? 'true' : 'false'}"
      type="button"
    >
      ${icon(filter.icon, 'w-5 h-5')}
      ${filter.label}
    </button>
  `).join('');
}

function renderSpotsList(spots) {
  if (spots.length === 0) {
    return `
      <div class="text-center py-12" role="status">
        ${icon('map-pin', 'w-5 h-5 text-5xl text-slate-600 mb-4')}
        <h3 class="text-lg font-bold mb-2">${t('noSpots')}</h3>
        <p class="text-slate-400 mb-4">${t('beFirst')}</p>
        <button onclick="openAddSpot()" class="btn btn-primary" type="button">
          ${icon('plus', 'w-5 h-5 mr-2')}
          ${t('addSpot')}
        </button>
      </div>
    `;
  }

  return `
    <div class="space-y-3" role="list" aria-label="Liste des spots d'autostop">
      ${spots.map(spot => renderSpotCard(spot)).join('')}
    </div>

    <div class="text-center text-slate-400 text-sm mt-6" id="search-results-count" role="status" aria-live="polite">
      ${spots.length} spot${spots.length > 1 ? 's' : ''} affiche${spots.length > 1 ? 's' : ''}
    </div>
  `;
}

function renderSpotsMap() {
  return `
    <div
      id="map"
      class="h-[calc(100vh-280px)] min-h-[400px] rounded-2xl overflow-hidden"
      role="application"
      aria-label="Carte des spots d'autostop"
    >
      <div class="flex items-center justify-center h-full bg-slate-800">
        <div class="text-center">
          ${icon('loader-circle', 'w-8 h-8 animate-spin text-primary-400 mb-3')}
          <p class="text-slate-400">${t('mapLoading') || 'Chargement de la carte...'}</p>
        </div>
      </div>
    </div>
  `;
}

function renderSpotsMapLoading() {
  return `
    <div
      class="h-[calc(100vh-280px)] min-h-[400px] rounded-2xl overflow-hidden relative"
      role="status"
      aria-label="${t('mapLoading')}"
    >
      <div class="absolute inset-0 bg-slate-800 animate-pulse">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center space-y-4">
            <div class="skeleton w-20 h-20 rounded-full mx-auto"></div>
            <div class="skeleton h-4 w-40 rounded mx-auto"></div>
            <div class="skeleton h-3 w-32 rounded mx-auto"></div>
          </div>
        </div>
        <!-- Fake map markers -->
        <div class="skeleton w-8 h-8 rounded-full absolute top-1/4 left-1/4"></div>
        <div class="skeleton w-8 h-8 rounded-full absolute top-1/3 right-1/3"></div>
        <div class="skeleton w-8 h-8 rounded-full absolute bottom-1/3 left-1/2"></div>
        <div class="skeleton w-8 h-8 rounded-full absolute top-1/2 right-1/4"></div>
      </div>
    </div>
  `;
}

function filterSpots(state) {
  let spots = [...state.spots];

  // Search filter
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    spots = spots.filter(s =>
      s.from.toLowerCase().includes(query) ||
      s.to.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    );
  }

  // Type filter
  switch (state.activeFilter) {
    case 'top':
      spots = spots.filter(s => s.globalRating >= 4.5);
      break;
    case 'recent':
      spots = spots.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
      break;
    case 'nearby':
      if (state.userLocation) {
        spots = spots
          .map(s => ({
            ...s,
            distance: calculateDistance(
              state.userLocation.lat,
              state.userLocation.lng,
              s.coordinates?.lat,
              s.coordinates?.lng
            )
          }))
          .filter(s => s.distance < 500) // Within 500km
          .sort((a, b) => a.distance - b.distance);
      }
      break;
  }

  // Country filter
  if (state.filterCountry !== 'all') {
    spots = spots.filter(s => s.country === state.filterCountry);
  }

  // Rating filter
  if (state.filterMinRating > 0) {
    spots = spots.filter(s => s.globalRating >= state.filterMinRating);
  }

  // Wait time filter
  if (state.filterMaxWait < 999) {
    spots = spots.filter(s => s.avgWaitTime <= state.filterMaxWait);
  }

  return spots;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default { renderSpots };
