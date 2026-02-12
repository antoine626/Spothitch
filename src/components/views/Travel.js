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

// Country code → flag emoji
function countryFlag(code) {
  if (!code || code.length !== 2) return '📍'
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

const FAVORITES_KEY = 'spothitch_favorites'

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch (e) { return [] }
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
          class="flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
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
          class="flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
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
          ${icon('map-signs', 'w-5 h-5 text-primary-400')}
          ${t('newTrip') || 'Nouveau voyage'}
        </h3>

        <div class="space-y-3">
          <div class="relative">
            <label for="trip-from" class="block text-xs text-slate-500 mb-1 uppercase tracking-wider">${t('departure') || 'Départ'}</label>
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
              class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="${t('swap') || 'Inverser'}"
            >
              ${icon('exchange-alt', 'w-5 h-5 rotate-90')}
            </button>
          </div>

          <div class="relative">
            <label for="trip-to" class="block text-xs text-slate-500 mb-1 uppercase tracking-wider">${t('destination') || 'Destination'}</label>
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
            ? icon('spinner', 'w-5 h-5 animate-spin mr-2') + (t('calculating') || 'Calcul en cours...')
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

function renderTripResults(results) {
  const spots = results.spots || []
  const state = window.getState?.() || {}
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
          ${icon('times', 'w-5 h-5')}
        </button>
      </div>

      <!-- Stats -->
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-2">
          ${icon('road', 'w-5 h-5 text-slate-400')}
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
          <span class="absolute top-0.5 ${showAmenities ? 'left-5.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all ${showAmenities ? 'translate-x-0' : ''}"></span>
        </button>
      </div>

      <!-- Loading amenities indicator -->
      ${loadingAmenities ? `
        <div class="flex items-center gap-2 text-sm text-slate-400 px-1">
          ${icon('spinner', 'w-5 h-5 animate-spin')}
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
          <p class="text-slate-500 text-xs">${t('travel_no_stations') || 'Aucune station trouvee le long du trajet'}</p>
        </div>
      ` : ''}

      <!-- Trip Timeline -->
      ${spots.length > 0 ? `
        <div class="relative pl-6 space-y-0 max-h-96 overflow-y-auto">
          <!-- Vertical line -->
          <div class="absolute left-[11px] top-3 bottom-3 w-0.5 bg-white/10"></div>

          <!-- Departure -->
          <div class="relative flex items-start gap-3 pb-4">
            <div class="absolute left-[-13px] w-6 h-6 rounded-full bg-emerald-500 border-2 border-dark-primary flex items-center justify-center z-10">
              ${icon('flag', 'w-5 h-5 text-[8px] text-white')}
            </div>
            <div class="pt-0.5">
              <div class="text-sm font-semibold">${results.from?.split(',')[0] || '?'}</div>
              <div class="text-xs text-slate-500">${t('departure') || 'Depart'}</div>
            </div>
          </div>

          <!-- Spots as timeline nodes -->
          ${spots.map((spot, i) => `
            <div class="relative flex items-start gap-3 pb-4 cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors" onclick="selectSpot(${spot.id})">
              <div class="absolute left-[-13px] w-6 h-6 rounded-full bg-primary-500/80 border-2 border-dark-primary flex items-center justify-center z-10 shadow-lg shadow-primary-500/20">
                <span class="text-[9px] font-bold text-white">${i + 1}</span>
              </div>
              <div class="pt-0.5 flex-1 min-w-0">
                <div class="text-sm font-medium truncate">${spot.from || ''} → ${spot.to || ''}</div>
                <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  ${spot.type ? `<span class="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">${spot.type}</span>` : ''}
                  ${spot.globalRating ? `<span class="text-primary-400">★ ${spot.globalRating.toFixed(1)}</span>` : ''}
                  ${spot.avgWait ? `<span>${icon('clock', 'w-5 h-5 mr-0.5')}${spot.avgWait} min</span>` : ''}
                </div>
              </div>
              <button onclick="event.stopPropagation();removeSpotFromTrip(${spot.id})" class="text-slate-600 hover:text-danger-400 transition-colors mt-1" aria-label="${t('remove') || 'Retirer'}">
                ${icon('times', 'w-3 h-3')}
              </button>
            </div>
          `).join('')}

          <!-- Arrival -->
          <div class="relative flex items-start gap-3">
            <div class="absolute left-[-13px] w-6 h-6 rounded-full bg-primary-500 border-2 border-dark-primary flex items-center justify-center z-10">
              ${icon('map-marker-alt', 'w-5 h-5 text-[8px] text-white')}
            </div>
            <div class="pt-0.5">
              <div class="text-sm font-semibold">${results.to?.split(',')[0] || '?'}</div>
              <div class="text-xs text-slate-500">${t('arrival') || 'Arrivee'}</div>
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
  const icon = poi.type === 'fuel' ? '\u26FD' : '\uD83C\uDD7F\uFE0F'
  const typeLabel = poi.type === 'fuel'
    ? (t('travel_fuel_station') || 'Station-service')
    : (t('travel_rest_area') || 'Aire de repos')
  const name = poi.name || typeLabel
  const colorClass = poi.type === 'fuel' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'

  return `
    <div class="card p-3 flex items-center gap-3">
      <div class="shrink-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-sm">
        ${icon}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate">${name}</div>
        <div class="text-xs text-slate-500">${typeLabel}${poi.brand ? ` \u2022 ${poi.brand}` : ''}</div>
      </div>
    </div>
  `
}

function renderTripSpot(spot, index) {
  const rating = spot.globalRating?.toFixed?.(1) || spot.rating?.toFixed?.(1) || '?'
  const wait = spot.avgWaitTime ? `~${spot.avgWaitTime}min` : ''
  const desc = (spot.description || '').slice(0, 60) + ((spot.description?.length > 60) ? '...' : '')
  const country = spot.country || ''
  const flag = countryFlag(country)
  const favs = getFavorites()
  const isFav = favs.includes(spot.id)

  return `
    <div class="card p-3 flex items-center gap-3 ${isFav ? 'border-amber-500/30' : ''}">
      <div class="shrink-0 w-8 h-8 rounded-full ${isFav ? 'bg-amber-500/20' : 'bg-primary-500/20'} flex items-center justify-center text-sm font-bold ${isFav ? 'text-amber-400' : 'text-primary-400'}">
        ${isFav ? icon('star', 'w-3 h-3') : (index + 1)}
      </div>
      <button onclick="openSpotDetail('${spot.id}')" class="flex-1 min-w-0 text-left">
        <div class="flex items-center gap-2">
          <span class="text-sm">${flag}</span>
          ${rating !== '?' ? `<span class="flex items-center gap-1 text-xs text-amber-400">${icon('star', 'w-5 h-5')}${rating}</span>` : ''}
          ${wait ? `<span class="text-xs text-slate-500">${wait}</span>` : ''}
        </div>
        <div class="text-sm text-slate-300 truncate mt-0.5">${desc || t('hitchhikingSpot') || 'Spot d\'autostop'}</div>
      </button>
      <button
        onclick="toggleFavorite('${spot.id}')"
        class="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${isFav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'} hover:bg-amber-500/10 transition-all"
        aria-label="${isFav ? (t('removeFromFavorites') || 'Retirer des favoris') : (t('addToFavorites') || 'Ajouter aux favoris')}"
        title="${isFav ? (t('removeFromFavorites') || 'Retirer des favoris') : (t('addToFavorites') || 'Ajouter aux favoris')}"
      >
        ${icon('heart', 'w-3 h-3')}
      </button>
      <button
        onclick="removeSpotFromTrip(${index})"
        class="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        aria-label="${t('remove') || 'Retirer'}"
      >
        ${icon('times', 'w-3 h-3')}
      </button>
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
        class="absolute top-3 left-3 z-[1000] px-4 py-2 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-white flex items-center gap-2 hover:bg-dark-secondary transition-all"
      >
        ${icon('arrow-left', 'w-5 h-5')}
        <span>${t('back') || 'Retour'}</span>
      </button>

      <!-- Spot count badge -->
      <div class="absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm">
        <span class="text-primary-400 font-semibold">${spots.length}</span>
        <span class="text-slate-400 ml-1">${t('spotsOnRoute') || 'spots'}</span>
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
        <p class="text-sm text-slate-500 mt-1">${t('planFirstTrip') || 'Planifiez votre premier voyage !'}</p>
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
              class="shrink-0 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-2"
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

function renderGuides(state, selectedGuide) {
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
            class="card p-4 text-left hover:border-primary-500/50 transition-all guide-card"
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
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-all"
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
          ${icon('gavel', 'w-5 h-5 text-primary-400')}
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
    : 'bg-white/5 text-slate-500'
}">${month}</span>
          `).join('')}
        </div>
      </div>

      ${guide.bestSpots && guide.bestSpots.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            ${icon('map-marker-alt', 'w-5 h-5 text-danger-400')}
            ${t('bestSpots') || 'Meilleurs spots'}
          </h3>
          <div class="space-y-2">
            ${guide.bestSpots.map(spot => `
              <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                ${icon('thumbs-up', 'w-5 h-5 text-primary-400')}
                <span class="text-slate-300">${spot}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="card p-4 border-danger-500/30">
        <h3 class="font-bold mb-3 flex items-center gap-2 text-danger-400">
          ${icon('phone-alt', 'w-5 h-5')}
          ${t('emergencyNumbers') || "Numéros d'urgence"}
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="text-center p-3 rounded-lg bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Police</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.police}</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Ambulance</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.ambulance}</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">${t('fire') || 'Pompiers'}</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.fire}</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-emerald-500/10">
            <div class="text-xs text-slate-400 mb-1">${t('worldwide') || 'Monde'}</div>
            <div class="font-bold text-lg text-emerald-400">${guide.emergencyNumbers.universal}</div>
          </div>
        </div>
      </div>

      ${guide.events && guide.events.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            ${icon('calendar-alt', 'w-5 h-5 text-pink-400')}
            ${t('eventsAndFestivals') || 'Evenements & festivals'}
          </h3>
          <div class="space-y-3">
            ${guide.events.map(event => {
              const lang = window.getState?.()?.lang || 'fr'
              const isEn = lang === 'en'
              const eventName = (isEn && event.nameEn) ? event.nameEn : event.name
              const eventDate = (isEn && event.dateEn) ? event.dateEn : event.date
              const eventDesc = (isEn && event.descriptionEn) ? event.descriptionEn : event.description
              const typeIcon = event.type === 'festival' ? 'fa-music' : event.type === 'gathering' ? 'fa-users' : 'fa-flag'
              const typeColor = event.type === 'festival' ? 'text-pink-400 bg-pink-500/20' : event.type === 'gathering' ? 'text-cyan-400 bg-cyan-500/20' : 'text-amber-400 bg-amber-500/20'
              return `
              <div class="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <div class="shrink-0 w-9 h-9 rounded-full ${typeColor} flex items-center justify-center">
                  ${icon(typeIcon, 'w-4 h-4')}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm">${eventName}</span>
                    <span class="text-xs text-slate-500">${eventDate}</span>
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

  // Also fetch from Nominatim (but don't block on it)
  tripDebounce = setTimeout(async () => {
    try {
      const { searchLocation } = await import('../../services/osrm.js')
      const results = await searchLocation(query)
      // Only update if input still has same value (user hasn't changed it)
      const currentInput = document.getElementById(`trip-${field}`)
      if (!currentInput || currentInput.value.trim() !== query.trim()) return

      if (results && results.length > 0) {
        // Merge: local matches first, then API results (deduplicated)
        const apiNames = results.map(r => r.name)
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
  }, 200)
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
          class="w-full px-3 py-2.5 text-left text-white hover:bg-white/10 border-b border-white/5 last:border-0 transition-all"
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
      // OSRM route failed, using straight line fallback
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
      // Fallback: bounding box with tighter margins
      const bboxPad = 0.5
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

    // Sort by rating
    routeSpots.sort((a, b) => (b.globalRating || 0) - (a.globalRating || 0))

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
      showTripMap: true,  // Show map directly with route
      tripLoading: false,
    })

    window.showToast?.(`${routeSpots.length} ${t('spotsFound') || 'spots trouvés !'}`, 'success')
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

window.closeTripMap = () => {
  window.setState?.({ showTripMap: false })
}

window.clearTripResults = () => {
  window.setState?.({ tripResults: null, showTripMap: false })
}

// Remove a spot from trip results
window.removeSpotFromTrip = (index) => {
  const state = window.getState?.() || {}
  if (!state.tripResults?.spots) return
  const newSpots = [...state.tripResults.spots]
  newSpots.splice(index, 1)
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
      globalRating: s.globalRating,
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
      btn.className = btn.className.replace(/text-(amber|slate)-\d+/g, isFav ? 'text-amber-400' : 'text-slate-500')
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
    // Turning off - clear amenities and reset trip map
    const tripMapEl = document.getElementById('trip-map')
    if (tripMapEl) tripMapEl.dataset.initialized = ''
    window.setState?.({ showRouteAmenities: false, routeAmenities: [], loadingRouteAmenities: false })
    return
  }

  // Turning on - fetch amenities if we have a route
  if (!state.tripResults?.routeGeometry) {
    window.setState?.({ showRouteAmenities: true, routeAmenities: [] })
    return
  }

  window.setState?.({ showRouteAmenities: true, loadingRouteAmenities: true, routeAmenities: [] })

  try {
    const { getAmenitiesAlongRoute } = await import('../../services/overpass.js')
    const amenities = await getAmenitiesAlongRoute(
      state.tripResults.routeGeometry,
      2,
      { showFuel: true, showRestAreas: true }
    )
    // Reset trip map so it re-initializes with amenity markers
    const tripMapEl = document.getElementById('trip-map')
    if (tripMapEl) tripMapEl.dataset.initialized = ''
    window.setState?.({ routeAmenities: amenities, loadingRouteAmenities: false })
  } catch (error) {
    console.error('Failed to fetch route amenities:', error)
    window.setState?.({ routeAmenities: [], loadingRouteAmenities: false })
    window.showToast?.(t('travel_loading_error') || 'Erreur de chargement des stations', 'error')
  }
}

export default { renderTravel }
