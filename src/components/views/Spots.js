/**
 * Spots View Component
 * List and map view of spots
 */

import { t } from '../../i18n/index.js';
import { renderSpotCard } from '../SpotCard.js';

export function renderSpots(state) {
  const filteredSpots = filterSpots(state);
  
  return `
    <div class="p-4">
      <!-- Search & View Toggle -->
      <div class="flex gap-2 mb-4">
        <div class="flex-1 relative">
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            id="search-input"
            type="text"
            class="input-modern pl-12"
            placeholder="${t('searchSpot')}"
            value="${state.searchQuery}"
            oninput="handleSearch(this.value)"
          />
        </div>
        
        <div class="flex gap-1 bg-white/5 rounded-xl p-1">
          <button 
            onclick="setViewMode('list')"
            class="p-3 rounded-lg ${state.viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-400'}"
            aria-label="Vue liste"
          >
            <i class="fas fa-list"></i>
          </button>
          <button 
            onclick="setViewMode('map')"
            class="p-3 rounded-lg ${state.viewMode === 'map' ? 'bg-primary-500 text-white' : 'text-slate-400'}"
            aria-label="Vue carte"
          >
            <i class="fas fa-map"></i>
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        ${renderFilterButtons(state)}
      </div>
      
      <!-- Content -->
      ${state.viewMode === 'list' 
        ? renderSpotsList(filteredSpots)
        : renderSpotsMap()
      }
    </div>
  `;
}

function renderFilterButtons(state) {
  const filters = [
    { id: 'all', label: t('filterAll'), icon: 'fa-globe' },
    { id: 'top', label: t('filterTop'), icon: 'fa-star' },
    { id: 'recent', label: t('filterRecent'), icon: 'fa-clock' },
    { id: 'nearby', label: t('filterNearby'), icon: 'fa-location-arrow' },
  ];
  
  return filters.map(filter => `
    <button 
      onclick="setFilter('${filter.id}')"
      class="badge ${state.activeFilter === filter.id ? 'badge-primary' : 'bg-white/5 text-slate-400'} whitespace-nowrap"
    >
      <i class="fas ${filter.icon}"></i>
      ${filter.label}
    </button>
  `).join('');
}

function renderSpotsList(spots) {
  if (spots.length === 0) {
    return `
      <div class="text-center py-12">
        <i class="fas fa-map-marker-alt text-5xl text-slate-600 mb-4"></i>
        <h3 class="text-lg font-bold mb-2">${t('noSpots')}</h3>
        <p class="text-slate-400 mb-4">${t('beFirst')}</p>
        <button onclick="openAddSpot()" class="btn btn-primary">
          <i class="fas fa-plus mr-2"></i>
          ${t('addSpot')}
        </button>
      </div>
    `;
  }
  
  return `
    <div class="space-y-3">
      ${spots.map(spot => renderSpotCard(spot)).join('')}
    </div>
    
    <div class="text-center text-slate-500 text-sm mt-6">
      ${spots.length} spots affichés
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
          <i class="fas fa-spinner fa-spin text-3xl text-primary-400 mb-3"></i>
          <p class="text-slate-400">Chargement de la carte...</p>
        </div>
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
