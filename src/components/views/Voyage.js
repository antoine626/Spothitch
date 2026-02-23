/**
 * Voyage View Component
 * 3 sub-tabs: Voyage (planifier + radar en route) | Guides | Journal
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
// Use the full Guides.js component (6 sections with vote/suggest)
import { renderGuides } from './Guides.js'

const SAVED_TRIPS_KEY = 'spothitch_saved_trips'
const ACTIVE_TRIP_KEY = 'spothitch_active_trip'
const HIGHLIGHTED_SPOTS_KEY = 'spothitch_highlighted_trip_spots'

// ==================== MAIN RENDER ====================

export function renderVoyage(state) {
  const subTab = state.voyageSubTab || 'voyage'
  const activeTrip = getActiveTrip()

  return `
    <div class="flex flex-col min-h-[calc(100vh-140px)] pb-28 overflow-x-hidden">
      ${renderVoyageSubTabs(subTab, activeTrip)}
      <div class="flex-1 p-4 space-y-4">
        ${subTab === 'voyage' ? renderVoyageTab(state, activeTrip) : ''}
        ${subTab === 'guides' ? renderVoyageGuidesTab(state) : ''}
        ${subTab === 'journal' ? renderJournalTab(state) : ''}
      </div>
    </div>
  `
}

// ==================== SUB-TABS BAR ====================

function renderVoyageSubTabs(active, activeTrip) {
  const tabs = [
    { id: 'voyage', icon: 'route', label: t('voyageTabVoyage') || 'Voyage', dot: !!activeTrip },
    { id: 'guides', icon: 'book-open', label: t('voyageTabGuides') || 'Guides' },
    { id: 'journal', icon: 'notebook-pen', label: t('voyageTabJournal') || 'Journal' },
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
          ${tab.dot ? `<span class="absolute top-1.5 right-[22%] w-2 h-2 bg-emerald-500 rounded-full border border-dark-primary"></span>` : ''}
        </button>
      `).join('')}
    </div>
  `
}

// ==================== TAB 1: VOYAGE (planifier + radar) ====================

function renderVoyageTab(state, activeTrip) {
  if (activeTrip) {
    return renderEnRouteRadar(state, activeTrip)
  }

  // Full-screen trip map view
  if (state.showTripMap && state.tripResults) {
    return renderTripMapView(state.tripResults)
  }

  return `
    <div class="space-y-4">
      ${renderTripForm(state)}
      ${state.tripResults ? renderTripResults(state) : ''}
      ${!state.tripResults ? renderSavedTripsPreview(state) : ''}
    </div>
  `
}

// ==================== EN ROUTE: RADAR DE ROUTE ====================

function renderEnRouteRadar(_state, activeTrip) {
  const spots = activeTrip.spots || []
  const totalKm = parseInt(activeTrip.distance) || 0
  const closestSpot = spots[0] // First spot = closest ahead
  const remaining = spots.length

  return `
    <div class="space-y-4">
      <!-- Route header -->
      <div class="card p-4 border-emerald-500/30 bg-emerald-500/5">
        <div class="flex items-center gap-2 mb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">${t('activeTrip') || 'Voyage en cours'}</span>
        </div>
        <div class="font-bold text-base mb-3">
          ${activeTrip.from?.split(',')[0] || '?'} → ${activeTrip.to?.split(',')[0] || '?'}
        </div>

        <!-- Route strip with spots -->
        <div class="relative flex items-center gap-1 mb-1">
          <!-- Start dot -->
          <span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0 z-10"></span>
          <!-- Line + spot dots -->
          <div class="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-visible">
            <div class="absolute inset-y-0 left-0 bg-emerald-500/50 rounded-full" style="width: 30%"></div>
            ${spots.slice(0, 8).map((_, i) => {
              const pct = Math.round(((i + 1) / (spots.length + 1)) * 100)
              return `<span class="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-dark-primary z-10 ${
                i === 0 ? 'bg-amber-400' : 'bg-slate-500'
              }" style="left: ${pct}%"></span>`
            }).join('')}
          </div>
          <!-- End dot -->
          <span class="w-3 h-3 rounded-full bg-primary-500 shrink-0 z-10"></span>
        </div>
        <div class="flex justify-between text-[10px] text-slate-500">
          <span>${activeTrip.from?.split(',')[0] || '?'}</span>
          <span class="text-amber-400">${remaining} ${t('voyageRadarSpots') || 'spots devant toi'}</span>
          <span>${activeTrip.to?.split(',')[0] || '?'}</span>
        </div>
      </div>

      <!-- Closest spot card -->
      ${closestSpot ? `
        <div class="card p-4 border-amber-500/30 bg-amber-500/5">
          <div class="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
            📍 ${t('voyageClosestSpot') || 'Spot le plus proche devant toi'}
          </div>
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              ⭐
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">${closestSpot.from || closestSpot.city || closestSpot.stationName || 'Spot'}</div>
              <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                ${closestSpot.spotType ? `<span>${closestSpot.spotType}</span>` : ''}
                ${(closestSpot.avgWaitTime || closestSpot.avgWait) ? `<span>${icon('clock', 'w-3 h-3 inline')} ~${closestSpot.avgWaitTime || closestSpot.avgWait}min</span>` : ''}
              </div>
            </div>
          </div>
          <button
            onclick="selectSpot(${closestSpot.id})"
            class="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all"
          >
            ${icon('map-pin', 'w-4 h-4')}
            ${t('voyageSeeSpot') || 'Voir ce spot'}
          </button>
        </div>
      ` : `
        <div class="card p-4 text-center border-amber-500/30 bg-amber-500/5">
          <p class="text-amber-400 font-semibold">🎉 ${t('voyageAlmostThere') || 'Presque arrivé !'}</p>
        </div>
      `}

      <!-- All spots ahead -->
      ${spots.length > 1 ? `
        <div class="card p-4">
          <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            📍 ${t('voyageAllSpotsAhead') || 'Tous les spots devant toi'} (${spots.length})
          </div>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            ${spots.map((spot, i) => {
              const sLat = spot.coordinates?.lat || spot.lat
              const sLng = spot.coordinates?.lng || spot.lng
              const distFromStart = (sLat && sLng && activeTrip.fromCoords)
                ? Math.round(haversine(activeTrip.fromCoords[0], activeTrip.fromCoords[1], sLat, sLng))
                : null
              return `
                <button
                  onclick="selectSpot(${spot.id})"
                  class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                  ${distFromStart !== null
                    ? `<span class="text-[10px] font-bold text-slate-500 w-10 shrink-0 text-right">+${distFromStart}km</span>`
                    : `<span class="text-[10px] font-bold text-slate-500 w-10 shrink-0 text-center">#${i + 1}</span>`
                  }
                  <span class="w-2.5 h-2.5 rounded-full shrink-0 ${i === 0 ? 'bg-amber-400' : 'bg-slate-600'}"></span>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">${spot.from || spot.city || spot.stationName || 'Spot'}</div>
                    <div class="text-[10px] text-slate-500">${spot.spotType || ''} ${spot.userValidations ? `· ✓${spot.userValidations}` : ''}</div>
                  </div>
                  ${icon('chevron-right', 'w-3.5 h-3.5 text-slate-600 shrink-0')}
                </button>
              `
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Route stats + finish button -->
      <div class="flex gap-3">
        <div class="flex-1 card p-3 text-center">
          <div class="text-lg font-bold">${totalKm || '?'}</div>
          <div class="text-[10px] text-slate-400">km</div>
        </div>
        <div class="flex-1 card p-3 text-center">
          <div class="text-lg font-bold text-amber-400">${remaining}</div>
          <div class="text-[10px] text-slate-400">spots</div>
        </div>
        <div class="flex-1 card p-3 text-center">
          <div class="text-lg font-bold">${activeTrip.estimatedTime || '?'}</div>
          <div class="text-[10px] text-slate-400">trajet</div>
        </div>
      </div>

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

// ==================== PLANIFIER FORM ====================

function renderTripForm(state) {
  return `
    <div class="card p-4 space-y-4">
      <h3 class="font-bold text-base flex items-center gap-2">
        ${icon('signpost', 'w-5 h-5 text-primary-400')}
        ${t('newTrip') || 'Nouveau voyage'}
      </h3>

      <div class="space-y-3">
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

        <div class="flex justify-center -my-1">
          <button
            onclick="swapTripPoints()"
            class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="${t('swap') || 'Inverser'}"
          >
            ${icon('arrow-right-left', 'w-5 h-5 rotate-90')}
          </button>
        </div>

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
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-base truncate pr-2">
          ${results.from?.split(',')[0] || '?'} → ${results.to?.split(',')[0] || '?'}
        </h4>
        <button onclick="clearTripResults()" class="text-slate-400 hover:text-white transition-colors" aria-label="${t('close') || 'Fermer'}">
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>

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

      <button
        onclick="startTrip()"
        class="w-full py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/25 transition-all"
      >
        ${icon('navigation', 'w-4 h-4')}
        ${t('voyageStartTrip') || 'Démarrer ce voyage'}
      </button>

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

      ${loadingAmenities ? `
        <div class="flex items-center gap-2 text-sm text-slate-400 px-1">
          ${icon('loader-circle', 'w-4 h-4 animate-spin')}
          <span>${t('travel_loading_stations') || 'Chargement des stations...'}</span>
        </div>
      ` : ''}

      ${showAmenities && !loadingAmenities && amenities.length > 0 ? `
        <div class="space-y-1 max-h-40 overflow-y-auto">
          <div class="text-xs text-slate-400 mb-1">${amenities.length} ${t('travel_stations_count') || 'stations trouvées'}</div>
          ${amenities.map(poi => renderAmenityChip(poi)).join('')}
        </div>
      ` : ''}
      ${showAmenities && !loadingAmenities && amenities.length === 0 ? `
        <p class="text-xs text-slate-400 text-center py-1">${t('travel_no_stations') || 'Aucune station trouvée'}</p>
      ` : ''}

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
      <div class="absolute left-[13px] top-3 bottom-3 w-0.5 bg-white/10"></div>

      <div class="relative flex items-start gap-3 pb-4">
        <div class="absolute left-[-18px] w-7 h-7 rounded-full bg-emerald-500 border-2 border-dark-primary flex items-center justify-center z-10">
          ${icon('flag', 'w-4 h-4 text-white')}
        </div>
        <div class="pt-0.5">
          <div class="text-sm font-semibold">${results.from?.split(',')[0] || '?'}</div>
          <div class="text-xs text-slate-400">${t('departure') || 'Départ'}</div>
        </div>
      </div>

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
            <div class="flex items-center gap-1 mt-1 flex-shrink-0">
              <button
                onclick="event.stopPropagation();highlightTripSpot(${spot.id})"
                class="w-6 h-6 rounded-full flex items-center justify-center transition-all ${isHighlighted ? 'text-amber-400 bg-amber-500/20' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'}"
                aria-label="${t('highlightSpot') || 'Mettre en avant'}"
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
  const notCompleted = savedTrips.filter(t => !t.completed)
  if (notCompleted.length === 0) {
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
      ${notCompleted.slice(0, 3).map((trip, _i) => {
        const idx = savedTrips.indexOf(trip)
        return `
        <div class="card p-3 flex items-center gap-3">
          <button onclick="loadSavedTrip(${idx})" class="flex-1 flex items-center gap-3 text-left">
            <div class="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              ${icon('route', 'w-4 h-4 text-primary-400')}
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">${trip.from?.split(',')[0] || '?'} → ${trip.to?.split(',')[0] || '?'}</div>
              <div class="text-xs text-slate-500">${trip.spots?.length || 0} spots · ${trip.distance || '?'} km</div>
            </div>
          </button>
          <button onclick="startTrip(${idx})" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all flex-shrink-0">
            ${icon('navigation', 'w-3.5 h-3.5')}
          </button>
          <button onclick="deleteSavedTrip(${idx})" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all flex-shrink-0">
            ${icon('trash', 'w-3.5 h-3.5')}
          </button>
        </div>
      `}).join('')}
      ${notCompleted.length > 3 ? `
        <button onclick="setVoyageSubTab('journal')" class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 mx-auto">
          ${t('seeAll') || 'Voir tout'} (${notCompleted.length}) ${icon('chevron-right', 'w-3 h-3')}
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

// ==================== TAB 2: GUIDES ====================

function renderVoyageGuidesTab(state) {
  return renderGuides(state)
}

// ==================== TAB 3: JOURNAL ====================

function renderJournalTab(state) {
  const tripDetailIndex = state.tripDetailIndex
  if (tripDetailIndex !== null && tripDetailIndex !== undefined) {
    return renderTripDetail(state, tripDetailIndex)
  }

  const journalSubTab = state.journalSubTab || 'mes-voyages'
  const bilan = computeBilan()

  return `
    <div class="space-y-4">
      <!-- Bilan total -->
      <div class="card p-4">
        <div class="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          🏆 ${t('voyageJournalBilan') || 'Mon bilan total'}
        </div>
        <div class="grid grid-cols-4 gap-2 text-center">
          <div>
            <div class="text-xl font-bold text-primary-400">${bilan.voyages}</div>
            <div class="text-[10px] text-slate-500">${t('voyageJournalVoyages') || 'voyages'}</div>
          </div>
          <div>
            <div class="text-xl font-bold text-emerald-400">${bilan.km > 999 ? Math.round(bilan.km / 100) / 10 + 'k' : bilan.km}</div>
            <div class="text-[10px] text-slate-500">km</div>
          </div>
          <div>
            <div class="text-xl font-bold text-amber-400">${bilan.lifts}</div>
            <div class="text-[10px] text-slate-500">lifts</div>
          </div>
          <div>
            <div class="text-xl font-bold text-purple-400">${bilan.hours}</div>
            <div class="text-[10px] text-slate-500">${t('voyageJournalHours') || 'h en stop'}</div>
          </div>
        </div>
      </div>

      <!-- Sub-tab switcher: Mes voyages / Amis -->
      <div class="flex gap-2">
        <button
          onclick="setJournalSubTab('mes-voyages')"
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
            journalSubTab === 'mes-voyages'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }"
        >
          📒 ${t('voyageMesVoyages') || 'Mes voyages'}
          <span class="ml-1 text-xs opacity-70">(${getSavedTrips().filter(t => t.completed).length})</span>
        </button>
        <button
          onclick="setJournalSubTab('amis')"
          class="flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
            journalSubTab === 'amis'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }"
        >
          👥 ${t('voyageAmis') || 'Amis'}
        </button>
      </div>

      <!-- Content -->
      ${journalSubTab === 'mes-voyages' ? renderMesVoyages() : renderAmisTab()}
    </div>
  `
}

function renderMesVoyages() {
  const savedTrips = getSavedTrips()
  const completedTrips = savedTrips.filter(t => t.completed)

  if (completedTrips.length === 0) {
    return `
      <div class="card p-8 text-center">
        ${icon('route', 'w-12 h-12 text-slate-700 mb-3')}
        <p class="text-slate-400">${t('voyageNoPastTrips') || 'Aucun voyage terminé'}</p>
        <button onclick="setVoyageSubTab('voyage')" class="mt-4 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 mx-auto">
          ${icon('plus', 'w-4 h-4')} ${t('planTrip') || 'Planifier un voyage'}
        </button>
      </div>
    `
  }

  return `
    <div class="space-y-3">
      ${completedTrips.map(trip => {
        const globalIdx = savedTrips.indexOf(trip)
        const isPublic = trip.public || false
        const hasPhoto = trip.photos && trip.photos.length > 0
        const photoCount = trip.photos?.length || 0
        const date = trip.finishedAt || trip.savedAt
          ? new Date(trip.finishedAt || trip.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : null

        return `
          <div class="card p-4 space-y-3 ${isPublic ? 'border-emerald-500/20' : ''}">
            <!-- Photo + public badge -->
            <div class="relative h-28 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
              ${hasPhoto
                ? `<img src="${trip.photos[0]}" alt="photo voyage" class="w-full h-full object-cover" />`
                : `<div class="text-slate-600 text-3xl">🛣️</div>`
              }
              ${isPublic ? `<span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold">✓ ${t('voyagePublicLabel') || 'Public'}</span>` : ''}
              ${photoCount > 0 ? `<span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px]">📸 ${photoCount}</span>` : ''}
            </div>

            <!-- Trip info -->
            <div>
              <div class="font-bold text-base">${trip.from?.split(',')[0] || '?'} → ${trip.to?.split(',')[0] || '?'}</div>
              <div class="flex items-center gap-3 text-xs text-slate-400 mt-1">
                ${date ? `<span>📅 ${date}</span>` : ''}
                ${trip.distance ? `<span>📍 ${trip.distance} km</span>` : ''}
                ${trip.spots?.length ? `<span>✋ ${trip.spots.length} lifts</span>` : ''}
                ${trip.durationHours ? `<span>⏱ ${trip.durationHours}h</span>` : ''}
              </div>
            </div>

            <!-- Note preview -->
            ${trip.notes ? `
              <div class="p-2.5 rounded-xl bg-white/5 text-sm text-slate-300 italic line-clamp-2">
                "${trip.notes}"
              </div>
            ` : `
              <button
                onclick="openAddTripNote(${globalIdx})"
                class="w-full p-2.5 rounded-xl bg-white/5 text-slate-500 text-sm italic text-left hover:bg-white/10 transition-all"
              >
                + ${t('voyageAddNote') || 'Ajouter une note...'}
              </button>
            `}

            <!-- Actions row -->
            <div class="flex items-center gap-2">
              <!-- Toggle public -->
              <div class="flex items-center gap-2 flex-1">
                <button
                  onclick="toggleTripPublic(${globalIdx})"
                  class="relative w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-slate-600'}"
                  role="switch"
                  aria-checked="${isPublic}"
                >
                  <span class="absolute top-0.5 ${isPublic ? 'left-5' : 'left-0.5'} w-4 h-4 rounded-full bg-white shadow transition-all"></span>
                </button>
                <span class="text-xs text-slate-400">${isPublic ? (t('voyageVisibleAmis') || 'Visible par mes amis') : (t('voyagePrivateLabel') || 'Privé')}</span>
              </div>
              <!-- View details button -->
              <button
                onclick="openTripDetail(${globalIdx})"
                class="px-3 py-1.5 rounded-lg bg-primary-500/15 text-primary-400 text-xs font-semibold hover:bg-primary-500/25 transition-all flex items-center gap-1.5"
              >
                ${icon('search', 'w-3.5 h-3.5')}
                ${t('voyageVoirDetails') || 'Voir détails'}
              </button>
              <!-- Delete -->
              <button
                onclick="deleteJournalTrip(${globalIdx})"
                class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
              >
                ${icon('trash', 'w-3.5 h-3.5')}
              </button>
            </div>
          </div>
        `
      }).join('')}
    </div>
  `
}

function renderAmisTab() {
  // For now, show empty state — real friend trips would require social features
  return `
    <div class="card p-8 text-center">
      ${icon('users', 'w-12 h-12 text-slate-700 mb-3')}
      <p class="text-slate-400 font-medium">${t('voyageNoFriendTrips') || "Aucun ami n'a partagé de voyage"}</p>
      <p class="text-xs text-slate-500 mt-1 max-w-xs mx-auto">${t('voyageNoFriendTripsHint') || "Quand tes amis rendront leur voyage public, tu pourras le voir ici."}</p>
    </div>
  `
}

function renderTripDetail(state, tripIndex) {
  const savedTrips = getSavedTrips()
  const trip = savedTrips[tripIndex]
  if (!trip) {
    return `
      <div class="card p-8 text-center">
        <p class="text-slate-400">${t('notFound') || 'Voyage introuvable'}</p>
        <button onclick="closeTripDetail()" class="mt-4 btn-primary px-4 py-2">${t('back') || 'Retour'}</button>
      </div>
    `
  }

  const isPublic = trip.public || false
  const date = trip.finishedAt || trip.savedAt
    ? new Date(trip.finishedAt || trip.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const photos = trip.photos || []
  const spots = trip.spots || []

  return `
    <div class="space-y-4">
      <!-- Back button -->
      <div class="flex items-center justify-between">
        <button
          onclick="closeTripDetail()"
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-all"
        >
          ${icon('arrow-left', 'w-5 h-5')}
          ${t('back') || 'Retour'}
        </button>
        <span class="text-sm font-semibold">${trip.from?.split(',')[0] || '?'} → ${trip.to?.split(',')[0] || '?'}</span>
        <span class="text-xs px-2 py-1 rounded-full ${isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}">
          ${isPublic ? '🌍 ' + (t('voyagePublicLabel') || 'Public') : '🔒 ' + (t('voyagePrivateLabel') || 'Privé')}
        </span>
      </div>

      <!-- Main photo -->
      <div class="relative h-48 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
        ${photos.length > 0
          ? `<img src="${photos[0]}" alt="photo principale" class="w-full h-full object-cover" />`
          : `<div class="text-5xl">🛣️</div>`
        }
        ${photos.length > 0 ? `<span class="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px]">📸 ${photos.length}</span>` : ''}
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center">
          <div class="text-xl font-bold">${trip.distance || '?'}</div>
          <div class="text-[10px] text-slate-400">km</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-xl font-bold text-amber-400">${trip.spots?.length || '?'}</div>
          <div class="text-[10px] text-slate-400">lifts</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-xl font-bold text-purple-400">${trip.durationHours || trip.estimatedTime || '?'}</div>
          <div class="text-[10px] text-slate-400">${trip.durationHours ? 'h' : ''}</div>
        </div>
      </div>

      <!-- Note -->
      <div class="card p-4">
        <div class="text-[10px] font-bold text-primary-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          📝 ${t('voyageMaNote') || 'Ma note'}
        </div>
        ${trip.notes
          ? `<p class="text-slate-300 text-sm italic leading-relaxed">"${trip.notes}"</p>`
          : `<button onclick="openAddTripNote(${tripIndex})" class="text-slate-500 text-sm italic hover:text-slate-300 transition-all">+ ${t('voyageAddNote') || 'Ajouter une note...'}</button>`
        }
      </div>

      <!-- Photos row -->
      ${photos.length > 0 ? `
        <div class="card p-4">
          <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            📸 ${t('voyagePhotos') || 'Photos'} (${photos.length})
          </div>
          <div class="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            ${photos.map((photo, i) => `
              <div class="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5">
                <img src="${photo}" alt="photo ${i + 1}" class="w-full h-full object-cover" />
              </div>
            `).join('')}
            <button onclick="openTripPhotoUpload(${tripIndex})" class="w-20 h-20 rounded-xl shrink-0 bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-white/40 transition-all">
              ${icon('plus', 'w-6 h-6')}
            </button>
          </div>
        </div>
      ` : `
        <button onclick="openTripPhotoUpload(${tripIndex})" class="w-full card p-4 text-center text-slate-500 hover:text-slate-300 border-dashed hover:border-white/20 transition-all">
          ${icon('camera', 'w-6 h-6 mx-auto mb-1')}
          <div class="text-sm">${t('voyageAddPhoto') || 'Ajouter des photos'}</div>
        </button>
      `}

      <!-- Infos -->
      <div class="card p-4">
        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">ℹ️ Infos</div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          ${date ? `<div class="flex items-center gap-2 text-slate-400"><span>📅</span><span>${date}</span></div>` : ''}
          <div class="flex items-center gap-2 text-slate-400"><span>🛣️</span><span>${trip.from?.split(',')[0] || '?'} → ${trip.to?.split(',')[0] || '?'}</span></div>
        </div>
      </div>

      <!-- Spots list -->
      ${spots.length > 0 ? `
        <div class="card p-4">
          <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            📍 ${t('voyageSpotsUsed') || 'Spots du trajet'} (${spots.length})
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            ${spots.map((spot, i) => `
              <button onclick="selectSpot(${spot.id})" class="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all text-left">
                <span class="text-xs font-bold text-slate-600 w-5">${i + 1}</span>
                <span class="flex-1 text-sm truncate">${spot.from || spot.city || spot.stationName || 'Spot'}</span>
                ${icon('chevron-right', 'w-3 h-3 text-slate-600 shrink-0')}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Public toggle -->
      <div class="card p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-sm">${t('voyageVisibleAmis') || 'Visible par mes amis'}</div>
            <div class="text-xs text-slate-500 mt-0.5">${isPublic ? (t('voyagePublicHint') || 'Tes amis peuvent voir ce voyage') : (t('voyagePrivateHint') || 'Seulement toi')}</div>
          </div>
          <button
            onclick="toggleTripPublic(${tripIndex})"
            class="relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-slate-600'}"
            role="switch"
            aria-checked="${isPublic}"
          >
            <span class="absolute top-0.5 ${isPublic ? 'left-6' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all"></span>
          </button>
        </div>
      </div>

      <!-- Delete -->
      <button onclick="deleteJournalTrip(${tripIndex});closeTripDetail()" class="w-full py-3 rounded-xl bg-danger-500/10 text-danger-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-danger-500/20 transition-all">
        ${icon('trash', 'w-4 h-4')}
        ${t('delete') || 'Supprimer ce voyage'}
      </button>
    </div>
  `
}

// ==================== HELPERS ====================

function computeBilan() {
  const trips = getSavedTrips().filter(t => t.completed)
  return {
    voyages: trips.length,
    km: trips.reduce((acc, trip) => acc + (parseInt(trip.distance) || 0), 0),
    lifts: trips.reduce((acc, trip) => acc + (trip.spots?.length || 0), 0),
    hours: trips.reduce((acc, trip) => acc + (parseInt(trip.durationHours) || 0), 0),
  }
}

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
  window.setState?.({ voyageSubTab: tab })
}

window.setJournalSubTab = (tab) => {
  window.setState?.({ journalSubTab: tab })
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
    window.setState?.({ voyageSubTab: 'voyage' })
    window.showToast?.(t('activeTrip') || 'Voyage démarré !', 'success')
  } catch (e) {
    console.error('startTrip error:', e)
  }
}

// Kept for backward compatibility (wiring tests)
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

    // Save as completed in journal
    const savedTrips = getSavedTrips()
    const now = new Date().toISOString()
    const completedTrip = {
      ...active,
      completed: true,
      finishedAt: now,
      notes: active.notes || '',
      photos: active.photos || [],
      public: active.public || false,
    }

    const idx = savedTrips.findIndex(t => t.from === active.from && t.to === active.to && !t.completed)
    if (idx >= 0) {
      savedTrips[idx] = completedTrip
    } else {
      savedTrips.push(completedTrip)
    }
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(savedTrips))
    localStorage.removeItem(ACTIVE_TRIP_KEY)
    window.setState?.({ voyageSubTab: 'journal', journalSubTab: 'mes-voyages' })
    window.showToast?.(t('voyageTripFinished') || 'Voyage terminé ! 🎉', 'success')
  } catch (e) {
    console.error('finishTrip error:', e)
  }
}

window.toggleTripPublic = (tripIndex) => {
  try {
    const savedTrips = getSavedTrips()
    if (!savedTrips[tripIndex]) return
    savedTrips[tripIndex].public = !savedTrips[tripIndex].public
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(savedTrips))
    window.setState?.({})
  } catch (e) {
    console.error('toggleTripPublic error:', e)
  }
}

window.openTripDetail = (tripIndex) => {
  window.setState?.({ tripDetailIndex: tripIndex })
}

window.closeTripDetail = () => {
  window.setState?.({ tripDetailIndex: null })
}

window.deleteJournalTrip = (tripIndex) => {
  try {
    const savedTrips = getSavedTrips()
    savedTrips.splice(tripIndex, 1)
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(savedTrips))
    window.setState?.({ tripDetailIndex: null })
    window.showToast?.('Voyage supprimé', 'success')
  } catch (e) {
    console.error('deleteJournalTrip error:', e)
  }
}

window.openAddTripNote = (tripIndex) => {
  const savedTrips = getSavedTrips()
  const trip = savedTrips[tripIndex]
  if (!trip) return
  const note = prompt(t('voyageAddNote') || 'Ajouter une note...', trip.notes || '')
  if (note === null) return // cancelled
  savedTrips[tripIndex].notes = note
  localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(savedTrips))
  window.setState?.({})
}

window.openTripPhotoUpload = (tripIndex) => {
  // Create a file input and trigger it
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const savedTrips = getSavedTrips()
    if (!savedTrips[tripIndex]) return
    if (!savedTrips[tripIndex].photos) savedTrips[tripIndex].photos = []
    for (const file of files.slice(0, 5)) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        savedTrips[tripIndex].photos.push(dataUrl)
      } catch (err) {
        console.error('photo read error', err)
      }
    }
    localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(savedTrips))
    window.setState?.({})
  }
  input.click()
}

// tripSearchSuggestions — lazy delegate to Travel.js's full implementation.
// If Travel.js isn't loaded yet, do a minimal autocomplete via Nominatim.
if (!window.tripSearchSuggestions) {
  let voyageDebounce = null
  window.tripSearchSuggestions = (field, query) => {
    clearTimeout(voyageDebounce)
    const container = document.getElementById(`trip-${field}-suggestions`)
    if (!container) return
    if (!query || query.trim().length < 2) {
      container.classList.add('hidden')
      return
    }
    voyageDebounce = setTimeout(async () => {
      try {
        const { searchLocation } = await import('../../services/osrm.js')
        const results = await searchLocation(query)
        const currentInput = document.getElementById(`trip-${field}`)
        if (!currentInput || currentInput.value.trim() !== query.trim()) return
        if (results?.length > 0) {
          const names = results.slice(0, 5).map(r => r.name)
          container.classList.remove('hidden')
          container.innerHTML = `<div class="bg-slate-800/95 backdrop-blur rounded-xl border border-white/10 overflow-hidden shadow-xl">
            ${names.map(name => {
              const safe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;')
              return `<button onmousedown="event.preventDefault();(window.tripSelectSuggestion||function(f,n){var i=document.getElementById('trip-'+f);if(i)i.value=n;document.getElementById('trip-from-suggestions')?.classList.add('hidden');document.getElementById('trip-to-suggestions')?.classList.add('hidden')})('${field}','${safe}')" class="w-full px-3 py-2.5 text-left text-white hover:bg-white/10 border-b border-white/5 last:border-0 transition-all"><div class="font-medium text-sm truncate">${safe}</div></button>`
            }).join('')}
          </div>`
        } else {
          container.classList.add('hidden')
        }
      } catch { container.classList.add('hidden') }
    }, 300)
  }
}
