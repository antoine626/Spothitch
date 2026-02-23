/**
 * Voyage View Component
 * 4 sub-tabs: Planifier | En route | Guides | Historique
 * Replaces the old ChallengesHub as the main "challenges" tab
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
// Side-effect import: registers all Travel.js window handlers
import { renderGuides } from './Travel.js'
import { getGuideByCode } from '../../data/guides.js'

const SAVED_TRIPS_KEY = 'spothitch_saved_trips'
const ACTIVE_TRIP_KEY = 'spothitch_active_trip'
const HIGHLIGHTED_SPOTS_KEY = 'spothitch_highlighted_trip_spots'

// ==================== MAIN RENDER ====================

export function renderVoyage(state) {
  const subTab = state.voyageSubTab || 'planifier'

  return `
    <div class="flex flex-col min-h-[calc(100vh-140px)] pb-28 overflow-x-hidden">
      ${renderVoyageSubTabs(subTab)}
      <div class="flex-1 p-4 space-y-4">
        ${subTab === 'planifier' ? renderPlanifierTab(state) : ''}
        ${subTab === 'enroute' ? renderEnRouteTab(state) : ''}
        ${subTab === 'guides' ? renderVoyageGuidesTab(state) : ''}
        ${subTab === 'historique' ? renderHistoriqueTab(state) : ''}
      </div>
    </div>
  `
}

// ==================== SUB-TABS BAR ====================

function renderVoyageSubTabs(active) {
  const tabs = [
    { id: 'planifier', icon: 'route', label: t('voyageTabPlanifier') || 'Planifier' },
    { id: 'enroute', icon: 'navigation', label: t('voyageTabEnRoute') || 'En route' },
    { id: 'guides', icon: 'book-open', label: t('voyageTabGuides') || 'Guides' },
    { id: 'historique', icon: 'history', label: t('voyageTabHistorique') || 'Historique' },
  ]
  return `
    <div class="flex bg-dark-secondary/50 border-b border-white/5">
      ${tabs.map(tab => `
        <button
          onclick="setVoyageSubTab('${tab.id}')"
          class="flex-1 py-3 px-1 font-medium text-xs transition-all relative border-b-2 flex flex-col items-center gap-1 ${
            active === tab.id
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }"
          aria-selected="${active === tab.id}"
        >
          ${icon(tab.icon, 'w-4 h-4')}
          <span>${tab.label}</span>
        </button>
      `).join('')}
    </div>
  `
}

// ==================== TAB 1: PLANIFIER ====================

function renderPlanifierTab(state) {
  // Full-screen trip map view
  if (state.showTripMap && state.tripResults) {
    return renderTripMapView(state.tripResults)
  }

  return `
    <div class="space-y-4">
      <!-- Trip form -->
      ${renderTripForm(state)}

      <!-- Results with filters + spots -->
      ${state.tripResults ? renderTripResults(state) : ''}

      <!-- Saved trips (if no results) -->
      ${!state.tripResults ? renderSavedTripsPreview(state) : ''}
    </div>
  `
}

function renderTripForm(state) {
  return `
    <div class="card p-4 space-y-4">
      <h3 class="font-bold text-base flex items-center gap-2">
        ${icon('signpost', 'w-5 h-5 text-primary-400')}
        ${t('newTrip') || 'Nouveau voyage'}
      </h3>

      <div class="space-y-3">
        <!-- From -->
        <div class="relative">
          <label for="trip-from" class="block text-xs text-slate-400 mb-1 uppercase tracking-wider">${t('departure') || 'Départ'}</label>
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
          <div id="trip-from-suggestions" class="absolute top-full left-0 right-0 mt-1 z-50 hidden"></div>
        </div>

        <!-- Swap button -->
        <div class="flex justify-center -my-1">
          <button
            onclick="swapTripPoints()"
            class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="${t('swap') || 'Inverser'}"
          >
            ${icon('arrow-right-left', 'w-5 h-5 rotate-90')}
          </button>
        </div>

        <!-- To -->
        <div class="relative">
          <label for="trip-to" class="block text-xs text-slate-400 mb-1 uppercase tracking-wider">${t('destination') || 'Destination'}</label>
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
  `
}

function renderTripResults(state) {
  const results = state.tripResults
  const allSpots = results.spots || []
  const highlighted = getHighlightedSpots()
  const routeFilter = state.routeFilter
  const spots = applyVoyageFilter(allSpots, routeFilter)
  const showAmenities = state.showRouteAmenities || false
  const amenities = state.routeAmenities || []
  const loadingAmenities = state.loadingRouteAmenities || false

  return `
    <div class="card p-4 space-y-4 border-primary-500/30">
      <!-- Route header -->
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-base truncate pr-2">
          ${results.from?.split(',')[0] || '?'} → ${results.to?.split(',')[0] || '?'}
        </h4>
        <button onclick="clearTripResults()" class="text-slate-400 hover:text-white transition-colors" aria-label="${t('close') || 'Fermer'}">
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>

      <!-- Stats row -->
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-2">
          ${icon('milestone', 'w-4 h-4 text-slate-400')}
          <span>${results.distance || '?'} km</span>
        </div>
        <div class="flex items-center gap-2">
          ${icon('clock', 'w-4 h-4 text-slate-400')}
          <span>~${results.estimatedTime || '?'}</span>
        </div>
        <div class="flex items-center gap-2">
          ${icon('map-pin', 'w-4 h-4 text-primary-400')}
          <span class="text-primary-400 font-semibold">${spots.length} spots</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="grid grid-cols-2 gap-2">
        <button onclick="viewTripOnMap()" class="btn-primary py-2.5 text-sm">
          ${icon('map', 'w-4 h-4 mr-1.5')}
          ${t('viewOnMap') || 'Voir sur la carte'}
        </button>
        <button onclick="saveTripWithSpots()" class="btn-secondary py-2.5 text-sm">
          ${icon('bookmark', 'w-4 h-4 mr-1.5')}
          ${t('saveTrip') || 'Sauvegarder'}
        </button>
      </div>

      <!-- Start trip button -->
      <button
        onclick="startTrip()"
        class="w-full py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/25 transition-all"
      >
        ${icon('navigation', 'w-4 h-4')}
        ${t('voyageStartTrip') || 'Démarrer ce voyage'}
      </button>

      <!-- Gas stations toggle -->
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
        <span class="text-sm font-medium">⛽ ${t('travel_show_stations') || 'Stations & aires de repos'}</span>
        <button
          onclick="toggleRouteAmenities()"
          class="relative w-11 h-6 rounded-full transition-colors ${showAmenities ? 'bg-emerald-500' : 'bg-slate-600'}"
          role="switch"
          aria-checked="${showAmenities}"
        >
          <span class="absolute top-0.5 ${showAmenities ? 'left-5.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all"></span>
        </button>
      </div>

      <!-- Loading amenities -->
      ${loadingAmenities ? `
        <div class="flex items-center gap-2 text-sm text-slate-400 px-1">
          ${icon('loader-circle', 'w-4 h-4 animate-spin')}
          <span>${t('travel_loading_stations') || 'Chargement des stations...'}</span>
        </div>
      ` : ''}

      <!-- Amenities list -->
      ${showAmenities && !loadingAmenities && amenities.length > 0 ? `
        <div class="space-y-1 max-h-40 overflow-y-auto">
          <div class="text-xs text-slate-400 mb-1">${amenities.length} ${t('travel_stations_count') || 'stations trouvées'}</div>
          ${amenities.map(poi => renderAmenityChip(poi)).join('')}
        </div>
      ` : ''}
      ${showAmenities && !loadingAmenities && amenities.length === 0 ? `
        <p class="text-xs text-slate-400 text-center py-1">${t('travel_no_stations') || 'Aucune station trouvée'}</p>
      ` : ''}

      <!-- Spot filters -->
      ${allSpots.length > 0 ? `
        <div class="flex flex-wrap gap-1.5">
          ${renderFilterChip('all', `${t('filterAll') || 'Tous'} (${allSpots.length})`, !routeFilter || routeFilter === 'all')}
          ${renderFilterChip('rating4', `⭐ 4+`, routeFilter === 'rating4')}
          ${renderFilterChip('wait20', `⏱ <20min`, routeFilter === 'wait20')}
          ${renderFilterChip('station', `⛽ ${t('filterStation') || 'Station'}`, routeFilter === 'station')}
          ${renderFilterChip('verified', `✓ ${t('filterVerified') || 'Vérifié'}`, routeFilter === 'verified')}
          ${renderFilterChip('recent', `🕐 ${t('filterRecent') || 'Récent'}`, routeFilter === 'recent')}
          ${renderFilterChip('shelter', `🏠 ${t('filterShelter') || 'Abri'}`, routeFilter === 'shelter')}
          ${highlighted.size > 0 ? renderFilterChip('highlighted', `⭐ ${t('filterHighlighted') || 'Mis en avant'} (${highlighted.size})`, routeFilter === 'highlighted') : ''}
        </div>
      ` : ''}

      <!-- Spots timeline -->
      ${spots.length > 0 ? renderSpotsTimeline(spots, results, highlighted) : `
        <div class="text-center py-4">
          ${icon('search', 'w-8 h-8 text-slate-600 mb-2')}
          <p class="text-slate-400 text-sm">${t('noSpotsFound') || 'Aucun spot trouvé sur ce trajet'}</p>
        </div>
      `}
    </div>
  `
}

function renderFilterChip(filter, label, active) {
  return `
    <button
      onclick="setRouteFilter('${filter}')"
      class="px-2.5 py-1 rounded-full text-xs font-medium transition-all ${active ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}"
    >${label}</button>
  `
}

function renderAmenityChip(poi) {
  const poiIcon = poi.type === 'fuel' ? '⛽' : '🅿️'
  const typeLabel = poi.type === 'fuel'
    ? (t('travel_fuel_station') || 'Station-service')
    : (t('travel_rest_area') || 'Aire de repos')
  return `
    <div class="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
      <span class="text-sm">${poiIcon}</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate">${poi.name || typeLabel}${poi.brand ? ` · ${poi.brand}` : ''}</div>
        <div class="text-[10px] text-slate-500">${typeLabel}</div>
      </div>
    </div>
  `
}

function renderSpotsTimeline(spots, results, highlighted) {
  return `
    <div class="relative pl-8 space-y-0 max-h-96 overflow-y-auto">
      <!-- Vertical line -->
      <div class="absolute left-[13px] top-3 bottom-3 w-0.5 bg-white/10"></div>

      <!-- Departure -->
      <div class="relative flex items-start gap-3 pb-4">
        <div class="absolute left-[-18px] w-7 h-7 rounded-full bg-emerald-500 border-2 border-dark-primary flex items-center justify-center z-10">
          ${icon('flag', 'w-4 h-4 text-white')}
        </div>
        <div class="pt-0.5">
          <div class="text-sm font-semibold">${results.from?.split(',')[0] || '?'}</div>
          <div class="text-xs text-slate-400">${t('departure') || 'Départ'}</div>
        </div>
      </div>

      <!-- Spot nodes -->
      ${spots.map((spot, i) => {
        const sLat = spot.coordinates?.lat || spot.lat
        const sLng = spot.coordinates?.lng || spot.lng
        const distFromStart = (sLat && sLng && results.fromCoords)
          ? Math.round(haversine(results.fromCoords[0], results.fromCoords[1], sLat, sLng))
          : null
        const isHighlighted = highlighted.has(String(spot.id))
        return `
          <div class="relative flex items-start gap-3 pb-4 group">
            <div class="absolute left-[-18px] w-7 h-7 rounded-full ${isHighlighted ? 'bg-amber-500 border-amber-400' : 'bg-primary-500/80 border-primary-500/40'} border-2 border-dark-primary flex items-center justify-center z-10 shadow-lg transition-all">
              ${isHighlighted ? icon('star', 'w-4 h-4 text-white') : `<span class="text-[9px] font-bold text-white">${i + 1}</span>`}
            </div>
            <div
              class="flex-1 min-w-0 cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-xl transition-colors py-0.5 ${isHighlighted ? 'bg-amber-500/5 border-l-2 border-amber-500/40 pl-2' : ''}"
              onclick="selectSpot(${spot.id})"
            >
              <div class="text-sm font-medium truncate">${spot.from || spot.city || spot.stationName || (distFromStart !== null ? `Spot · ${distFromStart} km` : 'Spot')}</div>
              <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                ${distFromStart !== null ? `<span>${distFromStart} km</span>` : ''}
                ${spot.userValidations ? `<span class="text-emerald-400">${icon('circle-check', 'w-3 h-3 mr-0.5 inline-block')}${spot.userValidations}</span>` : ''}
                ${(spot.avgWaitTime || spot.avgWait) ? `<span>${icon('clock', 'w-3 h-3 mr-0.5 inline-block')}${spot.avgWaitTime || spot.avgWait}min</span>` : ''}
              </div>
            </div>
            <!-- Action buttons -->
            <div class="flex items-center gap-1 mt-1 flex-shrink-0">
              <button
                onclick="event.stopPropagation();highlightTripSpot(${spot.id})"
                class="w-6 h-6 rounded-full flex items-center justify-center transition-all ${isHighlighted ? 'text-amber-400 bg-amber-500/20' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'}"
                aria-label="${t('highlightSpot') || 'Mettre en avant'}"
                title="${t('highlightSpot') || 'Mettre en avant'}"
              >
                ${icon('star', 'w-3 h-3')}
              </button>
              <button
                onclick="event.stopPropagation();removeSpotFromTrip(${spot.id})"
                class="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
                aria-label="${t('remove') || 'Retirer'}"
              >
                ${icon('x', 'w-3 h-3')}
              </button>
            </div>
          </div>
        `
      }).join('')}

      <!-- Arrival -->
      <div class="relative flex items-start gap-3">
        <div class="absolute left-[-18px] w-7 h-7 rounded-full bg-primary-500 border-2 border-dark-primary flex items-center justify-center z-10">
          ${icon('map-pin', 'w-4 h-4 text-white')}
        </div>
        <div class="pt-0.5">
          <div class="text-sm font-semibold">${results.to?.split(',')[0] || '?'}</div>
          <div class="text-xs text-slate-400">${t('arrival') || 'Arrivée'}</div>
        </div>
      </div>
    </div>
  `
}

function renderSavedTripsPreview(_state) {
  const savedTrips = getSavedTrips()
  if (savedTrips.length === 0) {
    return `
    <div class="card p-6 text-center">
      ${icon('route', 'w-10 h-10 text-slate-600 mb-3')}
      <p class="text-slate-400">${t('noSavedTrips') || 'Aucun voyage sauvegardé'}</p>
      <p class="text-sm text-slate-400 mt-1">${t('planFirstTrip') || 'Planifie ton premier voyage !'}</p>
    </div>
  `
  }
  return `
    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
        ${icon('bookmark', 'w-4 h-4 text-amber-400')}
        ${t('savedTrips') || 'Voyages sauvegardés'}
      </h3>
      ${savedTrips.slice(0, 3).map((trip, i) => `
        <div class="card p-3 flex items-center gap-3">
          <button onclick="loadSavedTrip(${i})" class="flex-1 flex items-center gap-3 text-left">
            <div class="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              ${icon('route', 'w-4 h-4 text-primary-400')}
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">${trip.from?.split(',')[0] || '?'} → ${trip.to?.split(',')[0] || '?'}</div>
              <div class="text-xs text-slate-500">${trip.spots?.length || 0} spots · ${trip.distance || '?'} km</div>
            </div>
          </button>
          <button onclick="startTrip(${i})" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all flex-shrink-0">
            ${icon('navigation', 'w-3.5 h-3.5')}
          </button>
          <button onclick="deleteSavedTrip(${i})" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all flex-shrink-0">
            ${icon('trash', 'w-3.5 h-3.5')}
          </button>
        </div>
      `).join('')}
      ${savedTrips.length > 3 ? `
        <button onclick="setVoyageSubTab('historique')" class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 mx-auto">
          ${t('seeAll') || 'Voir tout'} (${savedTrips.length}) ${icon('chevron-right', 'w-3 h-3')}
        </button>
      ` : ''}
    </div>
  `
}

function renderTripMapView(results) {
  const spots = results.spots || []
  return `
    <div class="relative" style="height:calc(100dvh - 8rem)">
      <div id="trip-map" class="w-full h-full rounded-xl overflow-hidden"></div>
      <button
        onclick="closeTripMap()"
        class="absolute top-3 left-3 z-[1000] px-4 py-2 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-white flex items-center gap-2 hover:bg-dark-secondary transition-all"
      >
        ${icon('arrow-left', 'w-5 h-5')}
        <span>${t('back') || 'Retour'}</span>
      </button>
      <div class="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          onclick="centerTripMapOnGps()"
          class="w-10 h-10 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors"
          aria-label="${t('myPosition') || 'Ma position'}"
        >
          ${icon('crosshair', 'w-5 h-5')}
        </button>
        <div class="px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm">
          <span class="text-primary-400 font-semibold">${spots.length}</span>
          <span class="text-slate-400 ml-1">${t('spotsOnRoute') || 'spots'}</span>
        </div>
      </div>
      <div class="absolute bottom-3 left-3 right-3 z-[1000] px-4 py-3 rounded-xl bg-dark-secondary/90 backdrop-blur border border-white/10">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium truncate">${results.from?.split(',')[0] || '?'} → ${results.to?.split(',')[0] || '?'}</span>
          <span class="text-slate-400 shrink-0 ml-2">${results.distance} km · ~${results.estimatedTime}</span>
        </div>
      </div>
    </div>
  `
}

// ==================== TAB 2: EN ROUTE ====================

function renderEnRouteTab(_state) {
  const activeTrip = getActiveTrip()

  if (!activeTrip) {
    return `
      <div class="flex flex-col items-center justify-center py-16 text-center space-y-4">
        ${icon('navigation', 'w-16 h-16 text-slate-700 mb-2')}
        <h3 class="text-lg font-bold text-slate-300">${t('noActiveTrip') || 'Aucun voyage en cours'}</h3>
        <p class="text-sm text-slate-500 max-w-xs">${t('noActiveTripHint') || 'Planifie un voyage et démarre-le pour voir ta progression ici'}</p>
        <button
          onclick="setVoyageSubTab('planifier')"
          class="btn-primary px-6 py-3 flex items-center gap-2"
        >
          ${icon('route', 'w-5 h-5')}
          ${t('voyagePlanNew') || 'Planifier un voyage'}
        </button>
      </div>
    `
  }

  const currentStop = activeTrip.spots?.[activeTrip.currentStopIndex || 0]
  const nextStop = activeTrip.spots?.[(activeTrip.currentStopIndex || 0) + 1]
  const totalStops = activeTrip.spots?.length || 0
  const progress = totalStops > 0
    ? Math.round(((activeTrip.currentStopIndex || 0) / totalStops) * 100)
    : 0

  return `
    <div class="space-y-4">
      <!-- Trip header -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-base">${activeTrip.from?.split(',')[0] || '?'} → ${activeTrip.to?.split(',')[0] || '?'}</h3>
            <p class="text-xs text-slate-400">${t('activeTrip') || 'Voyage en cours'} · ${activeTrip.distance || '?'} km</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
            ${icon('navigation', 'w-6 h-6 text-emerald-400')}
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mb-3">
          <div class="flex justify-between text-xs text-slate-400 mb-1">
            <span>${t('tripProgress') || 'Progression'}</span>
            <span>${activeTrip.currentStopIndex || 0}/${totalStops} stops · ${progress}%</span>
          </div>
          <div class="h-2 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all" style="width:${progress}%"></div>
          </div>
        </div>
      </div>

      <!-- Current stop -->
      ${currentStop ? `
        <div class="card p-4 border-emerald-500/30 bg-emerald-500/5">
          <div class="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-2">${t('nextStop') || 'Prochain arrêt'}</div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              ${icon('map-pin', 'w-5 h-5 text-emerald-400')}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold">${currentStop.from || currentStop.city || currentStop.stationName || 'Spot'}</div>
              ${(currentStop.avgWaitTime || currentStop.avgWait) ? `<div class="text-xs text-slate-400">${icon('clock', 'w-3 h-3 inline-block mr-0.5')}${currentStop.avgWaitTime || currentStop.avgWait} min d'attente</div>` : ''}
            </div>
            <button
              onclick="selectSpot(${currentStop.id})"
              class="text-xs text-primary-400 hover:text-primary-300 flex-shrink-0"
            >
              ${icon('info', 'w-4 h-4')}
            </button>
          </div>

          <!-- I got a lift button -->
          <button
            onclick="tripNextStop()"
            class="w-full mt-3 py-3 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all"
          >
            ${icon('thumbs-up', 'w-5 h-5')}
            ${t('voyageGotLift') || "J'ai eu un lift !"}
          </button>
        </div>
      ` : `
        <div class="card p-4 border-amber-500/30 bg-amber-500/5 text-center">
          <p class="text-amber-400 font-semibold">${t('voyageAlmostThere') || 'Presque arrivé ! 🎉'}</p>
        </div>
      `}

      <!-- Next stop preview -->
      ${nextStop ? `
        <div class="card p-3 opacity-60">
          <div class="text-xs text-slate-500 mb-1">${t('voyageAfterThat') || 'Ensuite'}</div>
          <div class="flex items-center gap-2">
            ${icon('map-pin', 'w-4 h-4 text-slate-500')}
            <span class="text-sm text-slate-400">${nextStop.from || nextStop.city || 'Spot'}</span>
          </div>
        </div>
      ` : ''}

      <!-- Finish trip -->
      <button
        onclick="finishTrip()"
        class="w-full py-3 rounded-xl bg-white/5 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
      >
        ${icon('flag', 'w-4 h-4')}
        ${t('voyageFinishTrip') || 'Terminer le voyage'}
      </button>
    </div>
  `
}

// ==================== TAB 3: GUIDES ====================

function renderVoyageGuidesTab(state) {
  const selectedGuide = state.selectedCountryGuide ? getGuideByCode(state.selectedCountryGuide) : null
  return renderGuides(state, selectedGuide)
}

// ==================== TAB 4: HISTORIQUE ====================

function renderHistoriqueTab(_state) {
  const savedTrips = getSavedTrips()

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-base flex items-center gap-2">
          ${icon('history', 'w-5 h-5 text-primary-400')}
          ${t('savedTrips') || 'Voyages sauvegardés'}
          <span class="text-xs text-slate-500 font-normal">(${savedTrips.length})</span>
        </h3>
      </div>

      ${savedTrips.length === 0 ? `
        <div class="card p-8 text-center">
          ${icon('route', 'w-12 h-12 text-slate-700 mb-3')}
          <p class="text-slate-400">${t('noSavedTrips') || 'Aucun voyage sauvegardé'}</p>
          <button onclick="setVoyageSubTab('planifier')" class="mt-4 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 mx-auto">
            ${icon('plus', 'w-4 h-4')} ${t('planTrip') || 'Planifier un voyage'}
          </button>
        </div>
      ` : `
        <div class="space-y-2">
          ${savedTrips.map((trip, i) => `
            <div class="card p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${trip.completed ? 'bg-emerald-500/15' : 'bg-primary-500/15'} flex items-center justify-center flex-shrink-0">
                  ${icon(trip.completed ? 'circle-check' : 'route', `w-5 h-5 ${trip.completed ? 'text-emerald-400' : 'text-primary-400'}`)}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm truncate">${trip.from?.split(',')[0] || '?'} → ${trip.to?.split(',')[0] || '?'}</div>
                  <div class="text-xs text-slate-500">${trip.spots?.length || 0} spots · ${trip.distance || '?'} km</div>
                  ${trip.savedAt ? `<div class="text-[10px] text-slate-600">${new Date(trip.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>` : ''}
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <!-- Load trip -->
                  <button
                    onclick="loadSavedTrip(${i});setVoyageSubTab('planifier')"
                    class="w-8 h-8 rounded-full bg-primary-500/15 text-primary-400 flex items-center justify-center hover:bg-primary-500/25 transition-all"
                    aria-label="${t('openTrip') || 'Ouvrir'}"
                    title="${t('openTrip') || 'Recharger ce trajet'}"
                  >
                    ${icon('route', 'w-4 h-4')}
                  </button>
                  <!-- Start trip -->
                  <button
                    onclick="startTrip(${i})"
                    class="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 transition-all"
                    aria-label="${t('voyageStartTrip') || 'Démarrer'}"
                    title="${t('voyageStartTrip') || 'Démarrer ce voyage'}"
                  >
                    ${icon('navigation', 'w-4 h-4')}
                  </button>
                  <!-- Delete -->
                  <button
                    onclick="deleteSavedTrip(${i})"
                    class="w-8 h-8 rounded-full bg-white/5 text-slate-400 flex items-center justify-center hover:bg-danger-500/10 hover:text-danger-400 transition-all"
                    aria-label="${t('delete') || 'Supprimer'}"
                  >
                    ${icon('trash', 'w-4 h-4')}
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `
}

// ==================== HELPERS ====================

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

function applyVoyageFilter(spots, filter) {
  const highlighted = getHighlightedSpots()
  if (!filter || filter === 'all') return spots
  switch (filter) {
    case 'station': return spots.filter(s => (s.spotType || '').toLowerCase().includes('station') || (s.description || '').toLowerCase().includes('station'))
    case 'rating4': return spots.filter(s => (s.globalRating || 0) >= 4 || (s._hitchwikiRating || 0) >= 4)
    case 'wait20': return spots.filter(s => s.avgWaitTime && s.avgWaitTime <= 20)
    case 'verified': return spots.filter(s => s.userValidations > 0 || s.verified)
    case 'recent': return spots.filter(s => {
      if (!s.lastUsed) return false
      return new Date(s.lastUsed).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000
    })
    case 'shelter': return spots.filter(s => {
      const desc = (s.description || '').toLowerCase()
      return desc.includes('shelter') || desc.includes('abri') || desc.includes('covered') || desc.includes('couvert')
    })
    case 'highlighted': return spots.filter(s => highlighted.has(String(s.id)))
    default: return spots
  }
}

function getSavedTrips() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]')
  } catch { return [] }
}

function getActiveTrip() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_TRIP_KEY) || 'null')
  } catch { return null }
}

function getHighlightedSpots() {
  try {
    const ids = JSON.parse(localStorage.getItem(HIGHLIGHTED_SPOTS_KEY) || '[]')
    return new Set(ids.map(String))
  } catch { return new Set() }
}

// ==================== WINDOW HANDLERS ====================

window.setVoyageSubTab = (tab) => {
  const { setState } = window
  setState?.({ voyageSubTab: tab })
}

window.highlightTripSpot = (spotId) => {
  try {
    const ids = JSON.parse(localStorage.getItem(HIGHLIGHTED_SPOTS_KEY) || '[]')
    const strId = String(spotId)
    const idx = ids.indexOf(strId)
    if (idx === -1) {
      ids.push(strId)
    } else {
      ids.splice(idx, 1)
    }
    localStorage.setItem(HIGHLIGHTED_SPOTS_KEY, JSON.stringify(ids))
    // Re-render
    window.setState?.({})
  } catch (e) {
    console.error('highlightTripSpot error:', e)
  }
}

window.startTrip = (savedTripIndex) => {
  try {
    let tripData = null
    if (savedTripIndex !== undefined) {
      const savedTrips = getSavedTrips()
      tripData = savedTrips[savedTripIndex] || null
    } else {
      // Use current trip results
      const state = window.getState?.() || {}
      if (state.tripResults) {
        tripData = { ...state.tripResults, savedAt: new Date().toISOString() }
      }
    }
    if (!tripData) {
      window.showToast?.('Aucun voyage à démarrer', 'warning')
      return
    }
    const activeTrip = {
      ...tripData,
      currentStopIndex: 0,
      startedAt: new Date().toISOString(),
    }
    localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(activeTrip))
    window.setState?.({ voyageSubTab: 'enroute' })
    window.showToast?.(t('activeTrip') || 'Voyage démarré !', 'success')
  } catch (e) {
    console.error('startTrip error:', e)
  }
}

window.tripNextStop = () => {
  try {
    const active = getActiveTrip()
    if (!active) return
    const next = { ...active, currentStopIndex: (active.currentStopIndex || 0) + 1 }
    localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(next))
    window.setState?.({})
  } catch (e) {
    console.error('tripNextStop error:', e)
  }
}

window.finishTrip = () => {
  try {
    const active = getActiveTrip()
    if (!active) return

    // Mark as completed in saved trips
    const savedTrips = getSavedTrips()
    const idx = savedTrips.findIndex(t => t.from === active.from && t.to === active.to)
    if (idx >= 0) {
      savedTrips[idx].completed = true
      localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(savedTrips))
    }

    localStorage.removeItem(ACTIVE_TRIP_KEY)
    window.setState?.({ voyageSubTab: 'historique' })
    window.showToast?.(t('voyageTripFinished') || 'Voyage terminé ! 🎉', 'success')
  } catch (e) {
    console.error('finishTrip error:', e)
  }
}
