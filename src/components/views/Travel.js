/**
 * Travel View Component
 * Trip Planner with route-based spot discovery + Country Guides
 */

import { t } from '../../i18n/index.js'
import { countryGuides, getGuideByCode } from '../../data/guides.js'
import { renderCommunityTips } from '../../services/communityTips.js'
import { renderHostelSection } from '../../services/hostelRecommendations.js'
import { escapeHTML } from '../../utils/sanitize.js'
import { icon } from '../../utils/icons.js'

const SAVED_TRIPS_KEY = 'spothitch_saved_trips'
const FAVORITES_KEY = 'spothitch_favorites'

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function renderTravel(state) {
  // Trip map view takes over the ENTIRE tab (no sub-tabs visible)
  if (state.showTripMap && state.tripResults) {
    return renderTripMapView(state.tripResults)
  }

  const activeSubTab = state.activeSubTab || 'planner'
  const selectedGuide = state.selectedCountryGuide ? getGuideByCode(state.selectedCountryGuide) : null

  return `
    <div class="p-4 space-y-4">
      <!-- Sub-tabs -->
      <div class="flex gap-2 p-1 bg-dark-secondary rounded-xl">
        <button
          onclick="setSubTab('planner')"
          class="flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
  activeSubTab === 'planner'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
          aria-selected="${activeSubTab === 'planner'}"
        >
          ${icon('route', 'w-5 h-5 mr-2')}
          ${t('plan') || 'Planifier'}
        </button>
        <button
          onclick="setSubTab('guides')"
          class="flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
  activeSubTab === 'guides'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
          aria-selected="${activeSubTab === 'guides'}"
        >
          ${icon('book', 'w-5 h-5 mr-2')}
          ${t('guides') || 'Guides'}
        </button>
      </div>

      <!-- Content -->
      ${activeSubTab === 'planner' ? renderPlanner(state) : renderGuides(state, selectedGuide)}
    </div>
  `
}

// ==================== PLANNER ====================

function renderPlanner(state) {
  // Trip map view (full screen with trip spots only)
  if (state.showTripMap && state.tripResults) {
    return renderTripMapView(state.tripResults)
  }

  const savedTrips = getSavedTrips(state)

  return `
    <div class="space-y-4">
      <!-- New Trip Form -->
      <div class="card p-4 space-y-4">
        <h3 class="font-bold text-lg flex items-center gap-2">
          ${icon('signpost', 'w-5 h-5 text-primary-400')}
          ${t('newTrip') || 'Nouveau voyage'}
        </h3>

        <div class="space-y-3">
          <div class="relative">
            <label for="trip-from" class="block text-xs text-slate-400 mb-1 uppercase tracking-wider">${t('departure') || 'Départ'}</label>
            <div class="relative">
              <input
                type="text"
                id="trip-from"
                placeholder="${t('searchCity') || 'Ex: Paris, Lyon...'}"
                class="input-field w-full"
                value="${state.tripFrom || ''}"
                oninput="tripSearchSuggestions('from', this.value)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();tripSelectFirst('from')}"
                autocomplete="off"
              />
            </div>
            <div id="trip-from-suggestions" class="absolute top-full left-0 right-0 mt-1 z-50 hidden"></div>
          </div>

          <div class="flex justify-center -my-1">
            <button
              onclick="swapTripPoints()"
              class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="${t('swap') || 'Inverser'}"
            >
              ${icon('arrow-right-left', 'w-5 h-5 rotate-90')}
            </button>
          </div>

          <div class="relative">
            <label for="trip-to" class="block text-xs text-slate-400 mb-1 uppercase tracking-wider">${t('destination') || 'Destination'}</label>
            <div class="relative">
              <input
                type="text"
                id="trip-to"
                placeholder="${t('searchCity') || 'Ex: Berlin, Barcelone...'}"
                class="input-field w-full"
                value="${state.tripTo || ''}"
                oninput="tripSearchSuggestions('to', this.value)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();tripSelectFirst('to')}"
                autocomplete="off"
              />
            </div>
            <div id="trip-to-suggestions" class="absolute top-full left-0 right-0 mt-1 z-50 hidden"></div>
          </div>
        </div>

        <button
          onclick="syncTripFieldsAndCalculate()"
          class="btn-primary w-full py-3"
          ${state.tripLoading ? 'disabled' : ''}
        >
          ${state.tripLoading
            ? icon('loader-circle', 'w-5 h-5 animate-spin mr-2') + (t('calculating') || 'Calcul en cours...')
            : icon('route', 'w-5 h-5 mr-2') + (t('findSpotsOnRoute') || 'Trouver les spots sur le trajet')
          }
        </button>
      </div>

      <!-- Trip Results -->
      ${state.tripResults ? renderTripResults(state.tripResults) : ''}

      <!-- Saved Trips -->
      ${renderSavedTrips(savedTrips)}
    </div>
  `
}

function getSavedTrips(state) {
  if (state.savedTrips) return state.savedTrips
  try {
    return JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]')
  } catch (e) { return [] }
}

function applyRouteFilter(spots, filter) {
  if (!filter || filter === 'all') return spots
  switch (filter) {
    case 'station': return spots.filter(s => (s.spotType || '').toLowerCase().includes('station') || (s.description || '').toLowerCase().includes('station'))
    case 'rating4': return spots.filter(s => (s.globalRating || 0) >= 4 || (s._hitchwikiRating || 0) >= 4)
    case 'wait20': return spots.filter(s => s.avgWaitTime && s.avgWaitTime <= 20)
    case 'verified': return spots.filter(s => s.userValidations > 0 || s.verified)
    case 'recent': return spots.filter(s => {
      if (!s.lastUsed) return false
      const oneYear = Date.now() - 365 * 24 * 60 * 60 * 1000
      return new Date(s.lastUsed).getTime() > oneYear
    })
    case 'shelter': return spots.filter(s => {
      const desc = (s.description || '').toLowerCase()
      return desc.includes('shelter') || desc.includes('abri') || desc.includes('roof') || desc.includes('toit') || desc.includes('covered') || desc.includes('couvert')
    })
    default: return spots
  }
}

function renderTripResults(results) {
  const allSpots = results.spots || []
  const state = window.getState?.() || {}
  const spots = applyRouteFilter(allSpots, state.routeFilter)
  const showAmenities = state.showRouteAmenities || false
  const amenities = state.routeAmenities || []
  const loadingAmenities = state.loadingRouteAmenities || false

  return `
    <div class="card p-4 space-y-4 border-primary-500/30">
      <!-- Route header -->
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-lg truncate pr-2">
          ${results.from?.split(',')[0] || '?'} → ${results.to?.split(',')[0] || '?'}
        </h4>
        <button onclick="clearTripResults()" class="text-slate-400 hover:text-white transition-colors" aria-label="${t('close') || 'Fermer'}">
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>

      <!-- Stats -->
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-2">
          ${icon('milestone', 'w-5 h-5 text-slate-400')}
          <span>${results.distance || '?'} km</span>
        </div>
        <div class="flex items-center gap-2">
          ${icon('clock', 'w-5 h-5 text-slate-400')}
          <span>~${results.estimatedTime || '?'}</span>
        </div>
        <div class="flex items-center gap-2">
          ${icon('map-pin', 'w-5 h-5 text-primary-400')}
          <span class="text-primary-400 font-semibold">${spots.length} spots</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="grid grid-cols-2 gap-2">
        <button onclick="viewTripOnMap()" class="btn-primary py-3">
          ${icon('map', 'w-5 h-5 mr-2')}
          ${t('viewOnMap') || 'Voir sur la carte'}
        </button>
        <button onclick="saveTripWithSpots()" class="btn-secondary py-3 font-bold">
          ${icon('bookmark', 'w-5 h-5 mr-2')}
          ${t('saveTrip') || 'Sauvegarder ce trajet'}
        </button>
      </div>

      <!-- Amenities toggle -->
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
        <span class="text-sm font-medium">${t('travel_show_stations') || '\u26FD Stations & aires de repos'}</span>
        <button
          onclick="toggleRouteAmenities()"
          class="relative w-11 h-6 rounded-full transition-colors ${showAmenities ? 'bg-emerald-500' : 'bg-slate-600'}"
          role="switch"
          aria-checked="${showAmenities}"
          aria-label="${t('travel_show_stations') || 'Stations & aires de repos'}"
        >
          <span class="absolute top-0.5 ${showAmenities ? 'left-5.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow transition-colors ${showAmenities ? 'translate-x-0' : ''}"></span>
        </button>
      </div>

      <!-- Loading amenities indicator -->
      ${loadingAmenities ? `
        <div class="flex items-center gap-2 text-sm text-slate-400 px-1">
          ${icon('loader-circle', 'w-5 h-5 animate-spin')}
          <span>${t('travel_loading_stations') || 'Chargement des stations...'}</span>
        </div>
      ` : ''}

      <!-- Amenities list -->
      ${showAmenities && !loadingAmenities && amenities.length > 0 ? `
        <div class="space-y-1">
          <div class="text-xs text-slate-400 px-1 mb-1">${amenities.length} ${t('travel_stations_count') || 'stations trouvees'}</div>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            ${amenities.map(poi => renderAmenityItem(poi)).join('')}
          </div>
        </div>
      ` : ''}
      ${showAmenities && !loadingAmenities && amenities.length === 0 && !loadingAmenities ? `
        <div class="text-center py-2">
          <p class="text-slate-400 text-xs">${t('travel_no_stations') || 'Aucune station trouvee le long du trajet'}</p>
        </div>
      ` : ''}

      <!-- Route Filters -->
      ${spots.length > 0 ? `
        <div class="flex flex-wrap gap-1.5 px-1">
          <button onclick="setRouteFilter('all')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!state.routeFilter || state.routeFilter === 'all' ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">${t('filterAll') || 'Tous'} (${spots.length})</button>
          <button onclick="setRouteFilter('station')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${state.routeFilter === 'station' ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">⛽ ${t('filterStation') || 'Station'}</button>
          <button onclick="setRouteFilter('rating4')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${state.routeFilter === 'rating4' ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">⭐ 4+</button>
          <button onclick="setRouteFilter('wait20')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${state.routeFilter === 'wait20' ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">⏱️ &lt;20min</button>
          <button onclick="setRouteFilter('verified')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${state.routeFilter === 'verified' ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">✓ ${t('filterVerified') || 'Vérifié'}</button>
          <button onclick="setRouteFilter('recent')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${state.routeFilter === 'recent' ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">🕐 ${t('filterRecent') || 'Récent'}</button>
          <button onclick="setRouteFilter('shelter')" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${state.routeFilter === 'shelter' ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}">🏠 ${t('filterShelter') || 'Abri'}</button>
        </div>
      ` : ''}

      <!-- Trip Timeline -->
      ${spots.length > 0 ? `
        <div class="relative pl-8 space-y-0 max-h-96 overflow-y-auto">
          <!-- Vertical line -->
          <div class="absolute left-[13px] top-3 bottom-3 w-0.5 bg-white/10"></div>

          <!-- Departure -->
          <div class="relative flex items-start gap-3 pb-4">
            <div class="absolute left-[-18px] w-7 h-7 rounded-full bg-emerald-500 border-2 border-dark-primary flex items-center justify-center z-10">
              ${icon('flag', 'w-5 h-5 text-[8px] text-white')}
            </div>
            <div class="pt-0.5">
              <div class="text-sm font-semibold">${results.from?.split(',')[0] || '?'}</div>
              <div class="text-xs text-slate-400">${t('departure') || 'Depart'}</div>
            </div>
          </div>

          <!-- Spots as timeline nodes -->
          ${spots.map((spot, i) => {
            const sLat = spot.coordinates?.lat || spot.lat
            const sLng = spot.coordinates?.lng || spot.lng
            const distFromStart = (sLat && sLng && results.fromCoords)
              ? Math.round(haversine(results.fromCoords[0], results.fromCoords[1], sLat, sLng))
              : null
            return `
            <div class="relative flex items-start gap-3 pb-4 cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-xl transition-colors" onclick="selectSpot(${spot.id})">
              <div class="absolute left-[-18px] w-7 h-7 rounded-full bg-primary-500/80 border-2 border-dark-primary flex items-center justify-center z-10 shadow-lg shadow-primary-500/20">
                <span class="text-[9px] font-bold text-white">${i + 1}</span>
              </div>
              <div class="pt-0.5 flex-1 min-w-0">
                <div class="text-sm font-medium truncate">${spot.from || spot.city || spot.stationName || (distFromStart !== null ? `${t('hitchhikingSpot') || 'Spot'} — ${distFromStart} km` : (t('hitchhikingSpot') || 'Spot d\'autostop'))}</div>
                <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  ${distFromStart !== null ? `<span class="text-slate-400">${distFromStart} km</span>` : ''}
                  ${spot.type ? `<span class="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">${spot.type}</span>` : ''}
                  ${spot.userValidations ? `<span class="text-emerald-400">${icon('circle-check', 'w-3 h-3 mr-0.5')}${spot.userValidations}</span>` : ''}
                  ${(spot.avgWaitTime || spot.avgWait) ? `<span>${icon('clock', 'w-3 h-3 mr-0.5')}${spot.avgWaitTime || spot.avgWait} min</span>` : ''}
                </div>
              </div>
              <button onclick="event.stopPropagation();removeSpotFromTrip(${spot.id})" class="text-slate-600 hover:text-danger-400 transition-colors mt-1" aria-label="${t('remove') || 'Retirer'}">
                ${icon('x', 'w-3 h-3')}
              </button>
            </div>
          `}).join('')}

          <!-- Arrival -->
          <div class="relative flex items-start gap-3">
            <div class="absolute left-[-18px] w-7 h-7 rounded-full bg-primary-500 border-2 border-dark-primary flex items-center justify-center z-10">
              ${icon('map-pin', 'w-5 h-5 text-[8px] text-white')}
            </div>
            <div class="pt-0.5">
              <div class="text-sm font-semibold">${results.to?.split(',')[0] || '?'}</div>
              <div class="text-xs text-slate-400">${t('arrival') || 'Arrivee'}</div>
            </div>
          </div>
        </div>
      ` : `
        <div class="text-center py-4">
          ${icon('search', 'w-8 h-8 text-slate-600 mb-2')}
          <p class="text-slate-400 text-sm">${t('noSpotsFound') || 'Aucun spot trouve sur ce trajet'}</p>
        </div>
      `}
    </div>

    <!-- Hostel Recommendations -->
    ${results.to ? renderHostelSection(results.to.split(',')[0]) : ''}
  `
}

function renderAmenityItem(poi) {
  const poiIcon = poi.type === 'fuel' ? '\u26FD' : '\uD83C\uDD7F\uFE0F'
  const typeLabel = poi.type === 'fuel'
    ? (t('travel_fuel_station') || 'Station-service')
    : (t('travel_rest_area') || 'Aire de repos')
  const name = poi.name || typeLabel
  const colorClass = poi.type === 'fuel' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'

  return `
    <div class="card p-3 flex items-center gap-3">
      <div class="shrink-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-sm">
        ${poiIcon}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate">${name}</div>
        <div class="text-xs text-slate-400">${typeLabel}${poi.brand ? ` \u2022 ${poi.brand}` : ''}</div>
      </div>
    </div>
  `
}

function renderTripMapView(results) {
  const spots = results.spots || []

  return `
    <div class="relative" style="height:calc(100dvh - 8rem)">
      <div id="trip-map" class="w-full h-full rounded-xl overflow-hidden"></div>

      <!-- Back button -->
      <button
        onclick="closeTripMap()"
        class="absolute top-3 left-3 z-[1000] px-4 py-2 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-white flex items-center gap-2 hover:bg-dark-secondary transition-colors"
      >
        ${icon('arrow-left', 'w-5 h-5')}
        <span>${t('back') || 'Retour'}</span>
      </button>

      <!-- Spot count badge + GPS button -->
      <div class="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          onclick="centerTripMapOnGps()"
          class="w-10 h-10 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors"
          aria-label="${t('myPosition') || 'Ma position'}"
          title="${t('myPosition') || 'Ma position'}"
        >
          ${icon('crosshair', 'w-5 h-5')}
        </button>
        <div class="px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm">
          <span class="text-primary-400 font-semibold">${spots.length}</span>
          <span class="text-slate-400 ml-1">${t('spotsOnRoute') || 'spots'}</span>
        </div>
      </div>

      <!-- Route info bar -->
      <div class="absolute bottom-3 left-3 right-3 z-[1000] px-4 py-3 rounded-xl bg-dark-secondary/90 backdrop-blur border border-white/10">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium truncate">${results.from?.split(',')[0] || '?'} → ${results.to?.split(',')[0] || '?'}</span>
          <span class="text-slate-400 shrink-0 ml-2">${results.distance} km • ~${results.estimatedTime}</span>
        </div>
      </div>
    </div>
  `
}

function renderSavedTrips(savedTrips) {
  if (!savedTrips || savedTrips.length === 0) {
    return `
      <div class="card p-6 text-center">
        ${icon('route', 'w-10 h-10 text-slate-600 mb-3')}
        <p class="text-slate-400">${t('noSavedTrips') || 'Aucun voyage sauvegardé'}</p>
        <p class="text-sm text-slate-400 mt-1">${t('planFirstTrip') || 'Planifiez votre premier voyage !'}</p>
      </div>
    `
  }

  return `
    <div class="space-y-3">
      <h3 class="font-bold text-lg flex items-center gap-2">
        ${icon('bookmark', 'w-5 h-5 text-amber-400')}
        ${t('savedTrips') || 'Voyages sauvegardés'}
      </h3>

      ${savedTrips.map((trip, index) => `
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <button onclick="loadSavedTrip(${index})" class="flex-1 text-left flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                ${icon('route', 'w-5 h-5 text-primary-400')}
              </div>
              <div class="min-w-0">
                <div class="font-medium truncate">${trip.from?.split(',')[0] || '?'} → ${trip.to?.split(',')[0] || '?'}</div>
                <div class="text-sm text-slate-400">${trip.spots?.length || 0} spots • ${trip.distance || '?'} km</div>
              </div>
            </button>
            <button
              onclick="deleteSavedTrip(${index})"
              class="shrink-0 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-2"
              aria-label="${t('delete') || 'Supprimer'}"
            >
              ${icon('trash', 'w-3 h-3')}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

// ==================== GUIDES (unchanged) ====================

export function renderGuides(state, selectedGuide) {
  if (selectedGuide) {
    return renderGuideDetail(selectedGuide)
  }

  const sortedGuides = [...countryGuides].sort((a, b) => a.difficulty - b.difficulty)

  return `
    <div class="space-y-4">
      <div class="relative">
        <input
          type="text"
          placeholder="${t('searchCountry') || 'Rechercher un pays...'}"
          class="input-field w-full pl-10"
          oninput="filterGuides(this.value)"
          aria-label="${t('searchCountry') || 'Rechercher un pays'}"
        />
        ${icon('search', 'w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400')}
      </div>

      <div class="flex flex-wrap gap-2 text-xs">
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
          ${icon('smile', 'w-5 h-5')} ${t('veryEasy') || 'Très facile'}
        </span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/20 text-primary-400">
          ${icon('meh', 'w-5 h-5')} ${t('easy') || 'Facile'}
        </span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
          ${icon('frown', 'w-5 h-5')} ${t('medium') || 'Moyen'}
        </span>
      </div>

      <div id="guides-list" class="grid grid-cols-2 gap-3">
        ${sortedGuides.map(guide => `
          <button
            onclick="selectGuide('${guide.code}')"
            class="card p-4 text-left hover:border-primary-500/50 transition-colors guide-card"
            data-country="${guide.name.toLowerCase()} ${(guide.nameEn || '').toLowerCase()}"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">${guide.flag}</span>
              <div>
                <div class="font-bold">${guide.name}</div>
                <div class="text-xs ${
  guide.difficulty === 1 ? 'text-emerald-400' :
    guide.difficulty === 2 ? 'text-primary-400' : 'text-amber-400'
}">${guide.difficultyText}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-400">
              ${icon('clock', 'w-5 h-5')}
              <span>~${guide.avgWaitTime} min</span>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `
}

function renderGuideDetail(guide) {
  const difficultyColors = {
    1: 'text-emerald-400 bg-emerald-500/20',
    2: 'text-primary-400 bg-primary-500/20',
    3: 'text-amber-400 bg-amber-500/20',
  }

  return `
    <div class="space-y-4">
      <button
        onclick="selectGuide(null)"
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        ${icon('arrow-left', 'w-5 h-5')}
        ${t('backToGuides') || 'Retour aux guides'}
      </button>

      <div class="card p-6 text-center">
        <span class="text-6xl mb-4 block">${guide.flag}</span>
        <h2 class="text-2xl font-bold mb-2">${guide.name}</h2>
        <div class="flex justify-center gap-3">
          <span class="px-3 py-1 rounded-full text-sm ${difficultyColors[guide.difficulty]}">
            ${guide.difficultyText}
          </span>
          <span class="px-3 py-1 rounded-full text-sm bg-white/10 text-slate-300">
            ~${guide.avgWaitTime} ${t('minWait') || "min d'attente"}
          </span>
        </div>
      </div>

      <div class="card p-4">
        <h3 class="font-bold mb-2 flex items-center gap-2">
          ${icon('scale', 'w-5 h-5 text-primary-400')}
          ${t('legality') || 'Légalité'}
        </h3>
        <p class="text-slate-300">${guide.legalityText}</p>
      </div>

      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('lightbulb', 'w-5 h-5 text-amber-400')}
          ${t('tips') || 'Conseils'}
        </h3>
        <ul class="space-y-2">
          ${guide.tips.map(tip => `
            <li class="flex items-start gap-2">
              ${icon('check', 'w-5 h-5 text-emerald-400 mt-1')}
              <span class="text-slate-300">${tip}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('calendar', 'w-5 h-5 text-purple-400')}
          ${t('bestMonths') || 'Meilleurs mois'}
        </h3>
        <div class="flex flex-wrap gap-2">
          ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, i) => `
            <span class="px-3 py-1 rounded-full text-sm ${
  guide.bestMonths.includes(i + 1)
    ? 'bg-emerald-500/20 text-emerald-400'
    : 'bg-white/5 text-slate-400'
}">${month}</span>
          `).join('')}
        </div>
      </div>

      ${guide.bestSpots && guide.bestSpots.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            ${icon('map-pin', 'w-5 h-5 text-danger-400')}
            ${t('bestSpots') || 'Meilleurs spots'}
          </h3>
          <div class="space-y-2">
            ${guide.bestSpots.map(spot => `
              <div class="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                ${icon('thumbs-up', 'w-5 h-5 text-primary-400')}
                <span class="text-slate-300">${spot}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="card p-4 border-danger-500/30">
        <h3 class="font-bold mb-3 flex items-center gap-2 text-danger-400">
          ${icon('phone', 'w-5 h-5')}
          ${t('emergencyNumbers') || "Numéros d'urgence"}
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="text-center p-3 rounded-xl bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Police</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.police}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Ambulance</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.ambulance}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">${t('fire') || 'Pompiers'}</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.fire}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-emerald-500/10">
            <div class="text-xs text-slate-400 mb-1">${t('worldwide') || 'Monde'}</div>
            <div class="font-bold text-lg text-emerald-400">${guide.emergencyNumbers.universal}</div>
          </div>
        </div>
      </div>

      ${guide.events && guide.events.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            ${icon('calendar-days', 'w-5 h-5 text-pink-400')}
            ${t('eventsAndFestivals') || 'Evenements & festivals'}
          </h3>
          <div class="space-y-3">
            ${guide.events.map(event => {
              const lang = window.getState?.()?.lang || 'fr'
              const isEn = lang === 'en'
              const eventName = (isEn && event.nameEn) ? event.nameEn : event.name
              const eventDate = (isEn && event.dateEn) ? event.dateEn : event.date
              const eventDesc = (isEn && event.descriptionEn) ? event.descriptionEn : event.description
              const typeIcon = event.type === 'festival' ? 'music' : event.type === 'gathering' ? 'users' : 'flag'
              const typeColor = event.type === 'festival' ? 'text-pink-400 bg-pink-500/20' : event.type === 'gathering' ? 'text-cyan-400 bg-cyan-500/20' : 'text-amber-400 bg-amber-500/20'
              return `
              <div class="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <div class="shrink-0 w-9 h-9 rounded-full ${typeColor} flex items-center justify-center">
                  ${icon(typeIcon, 'w-4 h-4')}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm">${eventName}</span>
                    <span class="text-xs text-slate-400">${eventDate}</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">${eventDesc}</p>
                </div>
              </div>
            `}).join('')}
          </div>
        </div>
      ` : ''}

      ${renderCommunityTips(guide.code)}
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

window.setSubTab = (tab) => {
  window.setState?.({ activeSubTab: tab })
}

window.selectGuide = (code) => {
  window.setState?.({ selectedCountryGuide: code })
}

window.filterGuides = (query) => {
  const cards = document.querySelectorAll('.guide-card')
  const lowerQuery = query.toLowerCase()
  cards.forEach(card => {
    const country = card.dataset.country || ''
    card.style.display = country.includes(lowerQuery) ? '' : 'none'
  })
}

// Popular cities for instant local suggestions (no API call needed)
const POPULAR_CITIES = [
  'Paris, France', 'London, United Kingdom', 'Berlin, Germany', 'Barcelona, Spain',
  'Amsterdam, Netherlands', 'Rome, Italy', 'Prague, Czech Republic', 'Vienna, Austria',
  'Lisbon, Portugal', 'Brussels, Belgium', 'Budapest, Hungary', 'Warsaw, Poland',
  'Copenhagen, Denmark', 'Stockholm, Sweden', 'Oslo, Norway', 'Helsinki, Finland',
  'Dublin, Ireland', 'Zurich, Switzerland', 'Munich, Germany', 'Hamburg, Germany',
  'Lyon, France', 'Marseille, France', 'Bordeaux, France', 'Nice, France',
  'Toulouse, France', 'Nantes, France', 'Strasbourg, France', 'Lille, France',
  'Milan, Italy', 'Florence, Italy', 'Naples, Italy', 'Venice, Italy',
  'Madrid, Spain', 'Valencia, Spain', 'Seville, Spain', 'Malaga, Spain',
  'Porto, Portugal', 'Krakow, Poland', 'Gdansk, Poland', 'Zagreb, Croatia',
  'Ljubljana, Slovenia', 'Bratislava, Slovakia', 'Bucharest, Romania',
  'Sofia, Bulgaria', 'Athens, Greece', 'Istanbul, Turkey', 'Marrakech, Morocco',
  'Casablanca, Morocco', 'Tbilisi, Georgia', 'Tallinn, Estonia', 'Riga, Latvia',
  'Vilnius, Lithuania', 'Edinburgh, United Kingdom', 'Manchester, United Kingdom',
  'Cologne, Germany', 'Frankfurt, Germany', 'Dresden, Germany',
  'Montpellier, France', 'Grenoble, France', 'Rennes, France',
]

// Trip autocomplete suggestions
let tripDebounce = null
let tripSearchSuppressed = false  // Suppress search after selection

window.tripSearchSuggestions = (field, query) => {
  clearTimeout(tripDebounce)
  const container = document.getElementById(`trip-${field}-suggestions`)
  if (!container) return

  // If search was suppressed (just selected a suggestion), skip
  if (tripSearchSuppressed) {
    tripSearchSuppressed = false
    return
  }

  if (!query || query.trim().length < 2) {
    container.classList.add('hidden')
    return
  }

  const q = query.trim().toLowerCase()

  // Instant local matches from popular cities
  const localMatches = POPULAR_CITIES
    .filter(c => c.toLowerCase().includes(q))
    .slice(0, 5)

  if (localMatches.length > 0) {
    container.classList.remove('hidden')
    container.innerHTML = renderSuggestions(field, localMatches)
  }

  // Also fetch from Photon API (faster than Nominatim, ~50-100ms)
  tripDebounce = setTimeout(async () => {
    try {
      const { searchPhoton } = await import('../../services/osrm.js')
      const results = await searchPhoton(query)
      // Only update if input still has same value (user hasn't changed it)
      const currentInput = document.getElementById(`trip-${field}`)
      if (!currentInput || currentInput.value.trim() !== query.trim()) return

      if (results && results.length > 0) {
        // Merge: local matches first, then API results (deduplicated)
        const apiNames = results.map(r => r.fullName || r.name)
        const merged = [...new Set([...localMatches, ...apiNames])].slice(0, 5)
        container.classList.remove('hidden')
        container.innerHTML = renderSuggestions(field, merged)
      } else if (localMatches.length === 0) {
        container.classList.add('hidden')
      }
    } catch (e) {
      // Keep local results if they exist
      if (localMatches.length === 0) container.classList.add('hidden')
    }
  }, 100)
}

function renderSuggestions(field, names) {
  return `
    <div class="bg-slate-800/95 backdrop-blur rounded-xl border border-white/10 overflow-hidden shadow-xl">
      ${names.map((name, i) => {
        const safeName = escapeHTML(name)
        const safeField = escapeHTML(field)
        return `
        <button
          onmousedown="event.preventDefault(); tripSelectSuggestion('${safeField}', '${safeName.replace(/'/g, '&#39;')}')"
          class="w-full px-3 py-2.5 text-left text-white hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors"
          data-trip-${safeField}-suggestion="${i}"
        >
          <div class="font-medium text-sm truncate">${safeName}</div>
        </button>
      `}).join('')}
    </div>
  `
}

window.tripSelectSuggestion = (field, name) => {
  // Cancel any pending search
  clearTimeout(tripDebounce)
  tripSearchSuppressed = true  // Suppress next oninput search

  const input = document.getElementById(`trip-${field}`)
  if (input) input.value = name

  // Hide BOTH suggestion containers
  document.getElementById('trip-from-suggestions')?.classList.add('hidden')
  document.getElementById('trip-to-suggestions')?.classList.add('hidden')

  // Auto-focus next field or calculate
  if (field === 'from') {
    document.getElementById('trip-to')?.focus()
  }
}

window.tripSelectFirst = (field) => {
  const btn = document.querySelector(`[data-trip-${field}-suggestion="0"]`)
  if (btn) btn.click()
  else {
    if (field === 'from') document.getElementById('trip-to')?.focus()
    else window.syncTripFieldsAndCalculate?.()
  }
}

window.syncTripFieldsAndCalculate = () => {
  const fromInput = document.getElementById('trip-from')
  const toInput = document.getElementById('trip-to')
  const from = fromInput?.value?.trim() || ''
  const to = toInput?.value?.trim() || ''
  if (!from || !to) {
    window.showToast?.(t('fillDepartureAndDestination') || 'Remplis le départ et la destination', 'warning')
    return
  }
  // Set state and trigger calculation in one go (single re-render)
  window.setState?.({ tripFrom: from, tripTo: to, tripLoading: true })
  window.calculateTrip?.()
}

window.updateTripField = (field, value) => {
  if (field === 'from') window.setState?.({ tripFrom: value })
  else window.setState?.({ tripTo: value })
}

window.swapTripPoints = () => {
  const fromInput = document.getElementById('trip-from')
  const toInput = document.getElementById('trip-to')
  const newFrom = toInput?.value || ''
  const newTo = fromInput?.value || ''
  // Swap DOM values directly (no re-render)
  if (fromInput) fromInput.value = newFrom
  if (toInput) toInput.value = newTo
}

// Main trip calculation — uses OSRM route + spotLoader (37K spots)
window.calculateTrip = async () => {
  const state = window.getState?.() || {}
  if (!state.tripFrom || !state.tripTo) return

  // Show loading state immediately
  window.setState?.({ tripLoading: true })

  try {
    const { searchLocation, getRoute } = await import('../../services/osrm.js')

    // 1. Geocode from and to
    const [fromResults, toResults] = await Promise.all([
      searchLocation(state.tripFrom),
      searchLocation(state.tripTo)
    ])

    if (!fromResults[0] || !toResults[0]) {
      window.showToast?.(t('locationNotFound') || 'Lieu non trouvé', 'error')
      return
    }

    const from = fromResults[0]
    const to = toResults[0]

    // 2. Get OSRM route for actual road geometry
    let routeGeometry = null
    let routeDistance = 0
    let routeDuration = 0
    try {
      const route = await getRoute([
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng }
      ])
      routeGeometry = route.geometry // [[lng, lat], ...]
      routeDistance = route.distance  // meters
      routeDuration = route.duration  // seconds
    } catch (e) {
      console.warn('OSRM route failed, using straight line fallback:', e.message)
      // Build a simple straight line geometry as fallback
      routeGeometry = [[from.lng, from.lat], [to.lng, to.lat]]
    }

    // 3. Load spots along the route via spotLoader
    const { loadSpotsInBounds, getAllLoadedSpots } = await import('../../services/spotLoader.js')

    const minLat = Math.min(from.lat, to.lat) - 1
    const maxLat = Math.max(from.lat, to.lat) + 1
    const minLng = Math.min(from.lng, to.lng) - 1
    const maxLng = Math.max(from.lng, to.lng) + 1

    await loadSpotsInBounds({
      north: maxLat, south: minLat,
      east: maxLng, west: minLng,
    })

    // Merge all spot sources (spotLoader + state)
    const loaderSpots = getAllLoadedSpots()
    const stateSpots = state.spots || []
    const spotsMap = new Map()
    loaderSpots.forEach(s => spotsMap.set(s.id, s))
    stateSpots.forEach(s => spotsMap.set(s.id, s))
    const allSpots = Array.from(spotsMap.values())

    // 4. Filter spots near the route (5km corridor)
    const corridorKm = 5
    let routeSpots = []

    if (routeGeometry && routeGeometry.length > 0) {
      // Sample polyline points for performance
      const step = Math.max(1, Math.floor(routeGeometry.length / 200))
      const sampledPoints = routeGeometry.filter((_, i) => i % step === 0)

      routeSpots = allSpots.filter(spot => {
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        if (!lat || !lng) return false
        if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) return false
        for (const [pLng, pLat] of sampledPoints) {
          if (haversine(lat, lng, pLat, pLng) < corridorKm) return true
        }
        return false
      })
    } else {
      // Fallback: bounding box with wider margins
      const bboxPad = 2
      routeSpots = allSpots.filter(spot => {
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        if (!lat || !lng) return false
        return lat >= Math.min(from.lat, to.lat) - bboxPad &&
               lat <= Math.max(from.lat, to.lat) + bboxPad &&
               lng >= Math.min(from.lng, to.lng) - bboxPad &&
               lng <= Math.max(from.lng, to.lng) + bboxPad
      })
    }

    // Sort by distance from departure (along route order)
    routeSpots.sort((a, b) => {
      const aLat = a.coordinates?.lat || a.lat
      const aLng = a.coordinates?.lng || a.lng
      const bLat = b.coordinates?.lat || b.lat
      const bLng = b.coordinates?.lng || b.lng
      const aDist = haversine(from.lat, from.lng, aLat, aLng)
      const bDist = haversine(from.lat, from.lng, bLat, bLng)
      return aDist - bDist
    })

    // 5. Format results
    const distanceKm = routeDistance
      ? Math.round(routeDistance / 1000)
      : Math.round(haversine(from.lat, from.lng, to.lat, to.lng))
    const durationHours = routeDuration
      ? Math.round(routeDuration / 3600)
      : Math.ceil(distanceKm / 60)
    const estimatedTime = durationHours > 24
      ? `${Math.ceil(durationHours / 24)} jours`
      : `${durationHours}h`

    // Downsample route geometry for storage (max 300 points)
    let storedGeometry = routeGeometry
    if (routeGeometry && routeGeometry.length > 300) {
      const s = Math.ceil(routeGeometry.length / 300)
      storedGeometry = routeGeometry.filter((_, i) => i % s === 0)
    }

    window.setState?.({
      tripResults: {
        from: state.tripFrom,
        to: state.tripTo,
        fromCoords: [from.lat, from.lng],
        toCoords: [to.lat, to.lng],
        routeGeometry: storedGeometry,
        spots: routeSpots,
        distance: distanceKm,
        estimatedTime,
      },
      showTripMap: false,  // Show results first, user clicks "view on map"
      tripLoading: false,
    })

    window.showToast?.(`${routeSpots.length} ${t('spotsFound') || 'spots trouvés !'}`, 'success')

    // Pre-fetch gas stations in background (so they're instant when user toggles)
    if (storedGeometry?.length > 1) {
      import('../../services/overpass.js').then(({ getAmenitiesAlongRoute }) => {
        getAmenitiesAlongRoute(storedGeometry, 2, { showFuel: true, showRestAreas: true })
      }).catch(() => {})
    }
  } catch (error) {
    console.error('Trip calculation failed:', error)
    window.setState?.({ tripLoading: false })
    window.showToast?.(t('tripCalculationError') || 'Erreur de calcul du trajet', 'error')
  }
}

// View trip on map (within Travel tab)
window.viewTripOnMap = () => {
  const state = window.getState?.() || {}
  if (!state.tripResults) return
  window.setState?.({ showTripMap: true })
}

// Center trip map on user's GPS position
window.centerTripMapOnGps = () => {
  if (!navigator.geolocation) {
    window.showToast?.(t('gpsNotAvailable') || 'GPS non disponible', 'warning')
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lng = pos.coords.longitude
      const lat = pos.coords.latitude
      // Use the exposed tripMapInstance via a flyTo
      if (window._tripMapFlyTo) {
        window._tripMapFlyTo(lng, lat)
      }
    },
    () => {
      window.showToast?.(t('gpsError') || 'Impossible d\'obtenir la position', 'error')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

window.closeTripMap = () => {
  window._tripMapCleanup?.()
  window.setState?.({ showTripMap: false, showRouteAmenities: false, routeAmenities: [], loadingRouteAmenities: false })
}

window.clearTripResults = () => {
  window._tripMapCleanup?.()
  window.setState?.({
    tripResults: null, showTripMap: false,
    showRouteAmenities: false, routeAmenities: [],
    loadingRouteAmenities: false,
  })
}

// Remove a spot from trip results (by spot ID)
window.removeSpotFromTrip = (spotId) => {
  const state = window.getState?.() || {}
  if (!state.tripResults?.spots) return
  const newSpots = state.tripResults.spots.filter(s => s.id !== spotId)
  window.setState?.({
    tripResults: { ...state.tripResults, spots: newSpots }
  })
}

// Save trip with spots to localStorage
window.saveTripWithSpots = () => {
  const state = window.getState?.() || {}
  if (!state.tripResults) return

  const trip = {
    from: state.tripResults.from,
    to: state.tripResults.to,
    fromCoords: state.tripResults.fromCoords,
    toCoords: state.tripResults.toCoords,
    routeGeometry: state.tripResults.routeGeometry,
    distance: state.tripResults.distance,
    estimatedTime: state.tripResults.estimatedTime,
    spots: (state.tripResults.spots || []).map(s => ({
      id: s.id,
      coordinates: s.coordinates,
      lat: s.lat,
      lng: s.lng,
      userValidations: s.userValidations || 0,
      country: s.country,
      description: (s.description || '').slice(0, 80),
      avgWaitTime: s.avgWaitTime,
    })),
    savedAt: new Date().toISOString(),
  }

  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]')
    saved.push(trip)
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(saved))
    window.setState?.({ savedTrips: saved })
    window.showToast?.(t('tripSaved') || 'Voyage sauvegardé !', 'success')
  } catch (e) {
    console.error('Failed to save trip:', e)
    window.showToast?.(t('saveError') || 'Erreur de sauvegarde', 'error')
  }
}

// Load a saved trip
window.loadSavedTrip = (index) => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]')
    const trip = saved[index]
    if (!trip) return
    window.setState?.({
      tripFrom: trip.from,
      tripTo: trip.to,
      tripResults: trip,
      showTripMap: false,
    })
  } catch (e) {
    console.error('Failed to load saved trip:', e)
  }
}

// Delete a saved trip
window.deleteSavedTrip = (index) => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]')
    saved.splice(index, 1)
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(saved))
    window.setState?.({ savedTrips: saved })
    window.showToast?.(t('tripDeleted') || 'Voyage supprimé', 'success')
  } catch (e) { /* localStorage parse error */ }
}

// Toggle favorite spot
window.toggleFavorite = (spotId) => {
  if (!spotId) return
  try {
    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    const idx = favs.indexOf(spotId)
    if (idx >= 0) {
      favs.splice(idx, 1)
      window.showToast?.(t('removeFromFavorites') || 'Retiré des favoris', 'success')
    } else {
      favs.push(spotId)
      window.showToast?.(t('addToFavorites') || 'Ajouté aux favoris', 'success')
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
    // Update heart icon directly in DOM (no full re-render)
    const btn = document.querySelector(`[onclick="toggleFavorite('${spotId}')"]`)
    if (btn) {
      const isFav = favs.includes(spotId)
      btn.className = btn.className.replace(/text-(amber|slate)-\d+/g, isFav ? 'text-amber-400' : 'text-slate-400')
    }
  } catch (e) {
    console.error('toggleFavorite failed:', e)
  }
}

// Check if spot is favorite
window.isFavorite = (spotId) => {
  try {
    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    return favs.includes(spotId)
  } catch (e) { return false }
}

// Toggle route amenities (gas stations / rest areas)
window.toggleRouteAmenities = async () => {
  const state = window.getState?.() || {}
  const newValue = !state.showRouteAmenities

  if (!newValue) {
    // Turning off
    window._tripMapRemoveAmenities?.()
    window.setState?.({ showRouteAmenities: false, routeAmenities: [], loadingRouteAmenities: false })
    return
  }

  // Turning on - fetch amenities if we have a route
  if (!state.tripResults?.routeGeometry) {
    window.setState?.({ showRouteAmenities: true, routeAmenities: [] })
    return
  }

  // Show toggle ON immediately via DOM (no full re-render)
  const toggle = document.querySelector('[onclick="toggleRouteAmenities()"]')
  if (toggle) toggle.classList.add('bg-primary-500')

  // Show loading indicator via DOM manipulation (avoid re-render)
  window.showToast?.('⏳ ' + (t('travel_loading_stations') || 'Loading stations...'), 'info')

  try {
    const { getAmenitiesAlongRoute } = await import('../../services/overpass.js')
    const amenities = await getAmenitiesAlongRoute(
      state.tripResults.routeGeometry,
      3,
      { showFuel: true, showRestAreas: true }
    )
    // Add markers dynamically to existing map (no re-init needed)
    window._tripMapAddAmenities?.(amenities)
    // Single setState at the end (one re-render instead of two)
    window.setState?.({ showRouteAmenities: true, routeAmenities: amenities, loadingRouteAmenities: false })
    if (amenities.length === 0) {
      window.showToast?.(t('noStationsFound') || 'No stations found, try again', 'info')
    }
  } catch (error) {
    console.error('Failed to fetch route amenities:', error)
    window.setState?.({ showRouteAmenities: true, routeAmenities: [], loadingRouteAmenities: false })
    window.showToast?.(t('noStationsFound') || 'No stations found, try again', 'info')
  }
}

// Route filter handler
window.setRouteFilter = (filter) => {
  window.setState?.({ routeFilter: filter })
}

export default { renderTravel }
