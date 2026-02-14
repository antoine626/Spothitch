/**
 * Main App Component
 * Orchestrates all views and modals
 *
 * Structure:
 * - Map (Carte): Full map with search, trip planner, guides, add spot
 * - Activities (Activités): Gamification hub
 * - Social: Chat + Friends
 * - Profile: User info + Settings
 */

import { renderHeader } from './Header.js';
import { renderNavigation } from './Navigation.js';
import { getState } from '../stores/state.js';
import { t } from '../i18n/index.js';

// Views
import { renderHome } from './views/Home.js';
import { renderMap, initMainMap } from './views/Map.js';
import { renderTravel } from './views/Travel.js';
import { renderGuides as renderGuidesView } from './views/Guides.js';
import { renderChallengesHub } from './views/ChallengesHub.js';
import { renderSocial } from './views/Social.js';
import { renderProfile } from './views/Profile.js';

// Keep old views for backward compatibility
import { renderSpots } from './views/Spots.js';

// Modals
import { renderWelcome } from './modals/Welcome.js';
import { renderSpotDetail } from './modals/SpotDetail.js';
import { renderAddSpot } from './modals/AddSpot.js';
import { renderSOS } from './modals/SOS.js';
import { renderTutorial } from './modals/Tutorial.js';
import { renderAuth } from './modals/Auth.js';
import { renderFiltersModal } from './modals/Filters.js';
import { renderStatsModal } from './modals/Stats.js';
import { renderBadgesModal, renderBadgePopup } from './modals/Badges.js';
import { renderChallengesModal } from './modals/Challenges.js';
import { renderShopModal, renderMyRewardsModal } from './modals/Shop.js';
import { renderQuiz } from './modals/Quiz.js';
import { renderLeaderboardModal } from './modals/Leaderboard.js';
import { renderCheckinModal } from './modals/CheckinModal.js';
import { renderAgeVerification } from './modals/AgeVerification.js';
import { renderIdentityVerification } from './modals/IdentityVerification.js';

// Landing
import { renderLanding } from './Landing.js';

// UI Components
import { renderNavigationOverlay } from './ui/NavigationOverlay.js';
import { renderDonationModal } from './ui/DonationCard.js';

// New Feature Modals
import { renderTravelGroupDetail } from '../services/travelGroups.js';
import { renderNearbyFriendsWidget, renderNearbyFriendsList } from '../services/nearbyFriends.js';
import { renderCustomizationModal } from '../services/profileCustomization.js';
import { renderAccessibilityHelp } from '../services/screenReader.js';
import { renderReportModal } from '../services/moderation.js';
import { renderSOSTrackingWidget } from '../services/sosTracking.js';
import { renderTeamDashboard } from '../services/teamChallenges.js';
import { renderAdminPanel } from './modals/AdminPanel.js';
import { renderCookieBanner } from './modals/CookieBanner.js';
import { renderMyDataModal } from './modals/MyData.js';
import { renderTitlesModal } from './modals/TitlesModal.js';
import { renderCreateTravelGroupModal } from './modals/CreateTravelGroup.js';
import { renderFriendProfileModal } from './modals/FriendProfile.js';
import { renderContactFormModal } from './modals/ContactForm.js';
import { renderCompanionModal } from './modals/Companion.js';
import { renderTripHistory } from '../services/tripHistory.js';
import { icon } from '../utils/icons.js'

/**
 * Render the complete application
 */
export function renderApp(state) {
  // Show landing page for first-time visitors
  if (state.showLanding) {
    return renderLanding()
  }

  // Show welcome screen for new users
  if (state.showWelcome && !state.username) {
    return renderWelcome(state);
  }

  // Main app content
  return `
    <!-- Skip Link for Accessibility -->
    <a href="#main-content" class="skip-link">
      ${t('skipToContent') || 'Aller au contenu principal'}
    </a>

    ${renderHeader(state)}

    <main id="main-content" class="pb-28 pt-[4.5rem] min-h-screen overflow-x-hidden" role="main" tabindex="-1">
      ${renderActiveView(state)}
    </main>

    ${renderNavigation(state)}

    <!-- Active Trip Bar (like Spotify "Now Playing") -->
    ${state.tripResults ? `
      <div class="fixed bottom-[4.5rem] left-4 right-4 z-30 px-4 py-2.5 rounded-xl bg-primary-500/90 backdrop-blur-xl border border-primary-400/30 shadow-lg shadow-primary-500/20 cursor-pointer" onclick="openActiveTrip()">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            ${icon('route', 'w-5 h-5 text-white/80')}
            <div class="min-w-0">
              <div class="text-xs text-white/70">${t('tripInProgress')}</div>
              <div class="text-sm font-semibold text-white truncate">
                ${state.tripResults.from?.split(',')[0] || '?'} → ${state.tripResults.to?.split(',')[0] || '?'}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-white/70">${state.tripResults.spots?.length || 0} spots</span>
            ${icon('chevron-up', 'w-3 h-3 text-white/60')}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Modals -->
    ${state.showAgeVerification ? renderAgeVerification(state) : ''}
    ${state.showIdentityVerification ? renderIdentityVerification() : ''}
    ${state.selectedSpot ? renderSpotDetail(state) : ''}
    ${state.showAddSpot ? renderAddSpot(state) : ''}
    ${state.showSOS ? renderSOS(state) : ''}
    ${state.showAuth ? renderAuth(state) : ''}
    ${state.showTutorial ? renderTutorial(state) : ''}
    ${state.showFilters ? renderFiltersModal() : ''}
    ${state.showStats ? renderStatsModal() : ''}
    ${state.showBadges ? renderBadgesModal() : ''}
    ${state.showChallenges ? renderChallengesModal() : ''}
    ${state.showShop ? renderShopModal() : ''}
    ${state.showMyRewards ? renderMyRewardsModal() : ''}
    ${state.showQuiz ? renderQuiz() : ''}
    ${state.showLeaderboard ? renderLeaderboardModal() : ''}
    ${state.checkinSpot ? renderCheckinModal(state) : ''}
    ${state.newBadge ? renderBadgePopup(state.newBadge) : ''}

    <!-- Navigation Overlay -->
    ${state.navigationActive ? renderNavigationOverlay(state) : ''}

    <!-- Donation Modal -->
    ${state.showDonation ? renderDonationModal(state) : ''}

    <!-- New Feature Modals -->
    ${state.showProfileCustomization ? renderCustomizationModal(state) : ''}
    ${state.showNearbyFriends ? renderNearbyFriendsList(state) : ''}
    ${state.showReport ? renderReportModal(state) : ''}
    ${state.showAccessibilityHelp ? renderAccessibilityHelp(state) : ''}
    ${state.showTravelGroupDetail ? renderTravelGroupDetail(state) : ''}
    ${state.showTeamChallenges ? `
      <div class="fixed inset-0 z-50 bg-black/90 overflow-y-auto" onclick="if(event.target===this)closeTeamChallenges()">
        <div class="min-h-screen pb-20">
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-dark-primary/80 backdrop-blur-xl border-b border-white/5">
            <h2 class="text-lg font-bold">${icon('users', 'w-5 h-5 mr-2 text-orange-400')}${t('teamChallenges') || "Défis d'équipe"}</h2>
            <button onclick="closeTeamChallenges()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="${t('close') || 'Fermer'}">
              ${icon('times', 'w-5 h-5')}
            </button>
          </div>
          ${renderTeamDashboard(state)}
        </div>
      </div>
    ` : ''}
    ${state.showCreateTravelGroup ? renderCreateTravelGroupModal(state) : ''}

    <!-- Floating Widgets -->
    ${renderNearbyFriendsWidget(state)}
    ${renderSOSTrackingWidget(state)}

    <!-- Admin Panel -->
    ${state.showAdminPanel ? renderAdminPanel(state) : ''}

    <!-- GDPR My Data Modal -->
    ${state.showMyData ? renderMyDataModal() : ''}

    <!-- Titles Modal -->
    ${state.showTitles ? renderTitlesModal(state) : ''}

    <!-- Friend Profile Modal -->
    ${state.showFriendProfile ? renderFriendProfileModal(state) : ''}

    <!-- Contact Form Modal -->
    ${state.showContactForm ? renderContactFormModal() : ''}

    <!-- Companion Mode Modal -->
    ${state.showCompanionModal ? renderCompanionModal(state) : ''}

    <!-- Trip History Modal -->
    ${state.showTripHistory ? `
      <div class="fixed inset-0 z-50 bg-black/90 overflow-y-auto" onclick="if(event.target===this)closeTripHistory()">
        <div class="min-h-screen pb-20">
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-dark-primary/80 backdrop-blur-xl border-b border-white/5">
            <h2 class="text-lg font-bold">${icon('clipboard-list', 'w-5 h-5 mr-2 text-emerald-400')}${t('tripHistory') || 'Historique de voyage'}</h2>
            <div class="flex items-center gap-2">
              <button onclick="clearTripHistory()" class="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-all" aria-label="${t('clearHistory') || "Effacer l'historique"}">
                ${icon('trash', 'w-5 h-5 mr-1')}${t('clear') || 'Effacer'}
              </button>
              <button onclick="closeTripHistory()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="${t('close') || 'Fermer'}">
                ${icon('times', 'w-5 h-5')}
              </button>
            </div>
          </div>
          <div class="p-4">
            ${renderTripHistory()}
          </div>
        </div>
      </div>
    ` : ''}


    <!-- Trip Planner / Guides Overlay (unified with tabs) -->
    ${state.showTripPlanner || state.showGuidesOverlay ? (() => {
      const activeOverlayTab = state.showTripPlanner ? 'planner' : 'guides'
      return `
      <div class="fixed inset-0 z-50 bg-black/90 overflow-y-auto" onclick="if(event.target===this){closeTripPlanner();closeGuidesOverlay()}">
        <div class="min-h-screen pb-20">
          <!-- Header with tabs -->
          <div class="sticky top-0 z-10 bg-dark-primary/80 backdrop-blur-xl border-b border-white/5">
            <div class="flex items-center justify-between p-4">
              <div class="flex items-center gap-2">
                <button
                  onclick="openTripPlanner();setState({showGuidesOverlay:false})"
                  class="px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeOverlayTab === 'planner' ? 'bg-primary-500 text-white' : 'bg-white/10 text-slate-400 hover:text-white'}"
                >
                  ${icon('route', 'w-4 h-4 mr-1.5')}${t('planTrip') || 'Itinéraire'}
                </button>
                <button
                  onclick="openGuidesOverlay();setState({showTripPlanner:false})"
                  class="px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeOverlayTab === 'guides' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400 hover:text-white'}"
                >
                  ${icon('book-atlas', 'w-4 h-4 mr-1.5')}${t('guides') || 'Guides'}
                </button>
              </div>
              <button onclick="closeTripPlanner();closeGuidesOverlay()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="${t('close') || 'Fermer'}">
                ${icon('times', 'w-5 h-5')}
              </button>
            </div>
          </div>
          ${activeOverlayTab === 'guides' ? renderGuidesView(state) : renderTravel({ ...state, activeSubTab: activeOverlayTab })}
        </div>
      </div>
      `
    })() : ''}

    <!-- Cookie Banner (RGPD) - hidden during tutorial/welcome -->
    ${!state.showTutorial && !state.showWelcome ? renderCookieBanner() : ''}
  `;
}

/**
 * Render the active view based on current tab
 */
function renderActiveView(state) {
  switch (state.activeTab) {
    case 'map':
    case 'fullmap':
    case 'home':
      return renderHome(state);
    case 'travel':
    case 'planner':
      return renderHome(state); // Travel merged into map — redirect
    case 'challenges':
      return renderChallengesHub(state);
    case 'social':
    case 'chat':
      return renderSocial(state);
    case 'profile':
      return renderProfile(state);
    case 'spots':
      return renderSpots(state);
    default:
      return renderHome(state);
  }
}

/**
 * Post-render hook to initialize map
 */
export function afterRender(state) {
  const isMapTab = ['map', 'fullmap', 'home', 'travel', 'planner'].includes(state.activeTab)
  if (isMapTab) {
    setTimeout(() => initHomeMap(state), 100)
  }
  if (isMapTab && state.showTripMap) {
    setTimeout(() => initTripMap(state), 100)
  }
}

/**
 * Initialize the home map (full-size MapLibre GL, shows spots in visible area)
 */
function initHomeMap(state) {
  const container = document.getElementById('home-map')
  if (!container || container.dataset.initialized === 'true') return

  import('maplibre-gl').then(async (maplibreModule) => {
    if (container.dataset.initialized === 'true') return
    container.dataset.initialized = 'true'

    const maplibregl = maplibreModule.default || maplibreModule
    const { getFreshnessColor } = await import('../services/spotFreshness.js')

    const center = state.userLocation
      ? [state.userLocation.lng, state.userLocation.lat]
      : [2.3, 46.6] // France center as fallback [lng, lat]

    const zoom = state.userLocation ? 15 : 5

    const map = new maplibregl.Map({
      container,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center,
      zoom,
      attributionControl: false,
    })

    // Compat methods for external callers (Map.js, main.js)
    map.setView = function (latLng, z) {
      const lat = Array.isArray(latLng) ? latLng[0] : latLng.lat
      const lng = Array.isArray(latLng) ? latLng[1] : latLng.lng
      this.flyTo({ center: [lng, lat], zoom: z, duration: 800 })
    }
    map.invalidateSize = function () { this.resize() }

    window.homeMapInstance = map
    window.mapInstance = map

    // User position marker
    if (state.userLocation) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div class="relative">
          <div class="w-4 h-4 bg-amber-400 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-50"></div>
        </div>
      `
      new maplibregl.Marker({ element: el })
        .setLngLat([state.userLocation.lng, state.userLocation.lat])
        .addTo(map)
    }

    // spotLoader module reference (loaded once, reused)
    let spotLoader = null
    import('../services/spotLoader.js').then(mod => { spotLoader = mod }).catch(() => {})

    // Track which spot IDs are already added to avoid duplicates
    const addedSpotIds = new Set()

    // Helper: convert spots array to GeoJSON
    const spotsToGeoJSON = (spots) => {
      let favIds = []
      try { favIds = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]') } catch (e) { /* no-op */ }
      const favSet = new Set(favIds)
      const features = []
      spots.forEach(spot => {
        if (addedSpotIds.has(spot.id)) return
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        if (!lat || !lng) return
        addedSpotIds.add(spot.id)
        const isFav = favSet.has(spot.id)
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id: spot.id,
            isFav: isFav ? 1 : 0,
            color: isFav ? '#f59e0b' : (getFreshnessColor(spot) || '#22c55e'),
            strokeColor: isFav ? '#fbbf24' : '#ffffff',
            radius: isFav ? 10 : 7,
            strokeWidth: isFav ? 2 : 1.5,
          },
        })
      })
      return { type: 'FeatureCollection', features }
    }

    // Add spots layers once map is loaded
    let spotsSourceAdded = false

    const addSpotsSource = (geojson) => {
      if (spotsSourceAdded) {
        // Update existing source data
        const source = map.getSource('home-spots')
        if (source) source.setData(geojson)
        return
      }
      spotsSourceAdded = true

      map.addSource('home-spots', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      // Cluster circles (amber)
      map.addLayer({
        id: 'home-clusters',
        type: 'circle',
        source: 'home-spots',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(245, 158, 11, 0.85)',
          'circle-radius': ['step', ['get', 'point_count'], 18, 20, 21, 100, 24],
          'circle-stroke-color': 'rgba(255, 255, 255, 0.6)',
          'circle-stroke-width': 2,
        },
      })

      // Cluster count labels
      map.addLayer({
        id: 'home-cluster-count',
        type: 'symbol',
        source: 'home-spots',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })

      // Individual spot dots
      map.addLayer({
        id: 'home-spot-points',
        type: 'circle',
        source: 'home-spots',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['get', 'radius'],
          'circle-stroke-color': ['get', 'strokeColor'],
          'circle-stroke-width': ['get', 'strokeWidth'],
          'circle-opacity': 0.85,
        },
      })

      // Click handlers
      map.on('click', 'home-spot-points', (e) => {
        if (e.features?.length > 0) window.selectSpot?.(e.features[0].properties.id)
      })
      map.on('click', 'home-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['home-clusters'] })
        if (!features.length) return
        const clusterId = features[0].properties.cluster_id
        map.getSource('home-spots').getClusterExpansionZoom(clusterId, (err, z) => {
          if (err) return
          map.easeTo({ center: features[0].geometry.coordinates, zoom: z })
        })
      })
      map.on('mouseenter', 'home-spot-points', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'home-spot-points', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'home-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'home-clusters', () => { map.getCanvas().style.cursor = '' })
    }

    // Gather all spots and push to source
    const updateSpotsOnMap = (spots) => {
      const geojson = spotsToGeoJSON(spots)
      if (geojson.features.length === 0 && spotsSourceAdded) return
      addSpotsSource(geojson)

      // Update badge count
      const badge = document.querySelector('#home-map-container .text-primary-400.font-semibold')
      if (badge) badge.textContent = addedSpotIds.size
    }

    // Load spots for visible area
    let isLoadingSpots = false
    const loadSpotsForView = async () => {
      const currentState = getState()
      const stateSpots = currentState.spots || []
      const existing = spotLoader ? spotLoader.getAllLoadedSpots() : []
      const spotsMap = new Map()
      stateSpots.forEach(s => spotsMap.set(s.id, s))
      existing.forEach(s => spotsMap.set(s.id, s))
      updateSpotsOnMap(Array.from(spotsMap.values()))

      if (!spotLoader || isLoadingSpots) return
      isLoadingSpots = true
      try {
        const bounds = map.getBounds()
        await spotLoader.loadSpotsInBounds({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        })
        const allLoaded = spotLoader.getAllLoadedSpots()
        updateSpotsOnMap(allLoaded)
      } catch (e) {
        // silently fail
      } finally {
        isLoadingSpots = false
      }
    }

    map.on('load', () => {
      loadSpotsForView()
    })

    // Debounce spot loading on map move (1500ms to avoid excessive re-renders)
    let moveTimer = null
    let lastBounds = null
    map.on('moveend', () => {
      clearTimeout(moveTimer)
      // Skip reload if bounds barely changed
      const bounds = map.getBounds()
      if (lastBounds) {
        const dLat = Math.abs(bounds.getNorth() - lastBounds.getNorth())
        const dLng = Math.abs(bounds.getEast() - lastBounds.getEast())
        if (dLat < 0.01 && dLng < 0.01) return // ignore micro-movements
      }
      lastBounds = bounds
      moveTimer = setTimeout(loadSpotsForView, 1500)
    })

    // Resize
    setTimeout(() => map.resize(), 200)
  }).catch((err) => {
    console.warn('Home map init failed:', err)
  })
}

/**
 * Initialize trip map (MapLibre GL — shows only trip spots along route)
 */
function initTripMap(state) {
  const container = document.getElementById('trip-map')
  if (!container || container.dataset.initialized === 'true') return
  if (!state.tripResults) return

  import('maplibre-gl').then((maplibreModule) => {
    if (container.dataset.initialized === 'true') return
    container.dataset.initialized = 'true'

    const maplibregl = maplibreModule.default || maplibreModule

    const results = state.tripResults
    const from = results.fromCoords // [lat, lng]
    const to = results.toCoords     // [lat, lng]
    if (!from || !to) return

    const map = new maplibregl.Map({
      container,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [from[1], from[0]], // [lng, lat]
      zoom: 7,
      attributionControl: false,
    })

    // Compat
    map.setView = function (latLng, z) {
      const lat = Array.isArray(latLng) ? latLng[0] : latLng.lat
      const lng = Array.isArray(latLng) ? latLng[1] : latLng.lng
      this.flyTo({ center: [lng, lat], zoom: z, duration: 800 })
    }
    map.invalidateSize = function () { this.resize() }

    map.on('load', () => {
      // Route line from OSRM geometry
      if (results.routeGeometry && results.routeGeometry.length > 0) {
        map.addSource('trip-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: results.routeGeometry },
          },
        })
        map.addLayer({
          id: 'trip-route-line',
          type: 'line',
          source: 'trip-route',
          paint: { 'line-color': '#f59e0b', 'line-width': 6, 'line-opacity': 0.9 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
      } else {
        // Dashed fallback line
        map.addSource('trip-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[from[1], from[0]], [to[1], to[0]]] },
          },
        })
        map.addLayer({
          id: 'trip-route-line',
          type: 'line',
          source: 'trip-route',
          paint: { 'line-color': '#f59e0b', 'line-width': 5, 'line-opacity': 0.7, 'line-dasharray': [2, 2] },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
      }

      // Trip spot dots
      let favIds = []
      try { favIds = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]') } catch (e) { /* no-op */ }
      const favSet = new Set(favIds)

      const spots = results.spots || []
      const spotFeatures = []
      spots.forEach(spot => {
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        if (!lat || !lng) return
        const isFav = favSet.has(spot.id)
        spotFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id: spot.id,
            color: isFav ? '#f59e0b' : '#22c55e',
            strokeColor: isFav ? '#fbbf24' : '#ffffff',
            radius: isFav ? 12 : 10,
            strokeWidth: isFav ? 3 : 2,
          },
        })
      })

      if (spotFeatures.length > 0) {
        map.addSource('trip-spots', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: spotFeatures },
        })
        map.addLayer({
          id: 'trip-spot-points',
          type: 'circle',
          source: 'trip-spots',
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['get', 'radius'],
            'circle-stroke-color': ['get', 'strokeColor'],
            'circle-stroke-width': ['get', 'strokeWidth'],
            'circle-opacity': 0.9,
          },
        })
        map.on('click', 'trip-spot-points', (e) => {
          if (e.features?.length > 0) window.selectSpot?.(e.features[0].properties.id)
        })
        map.on('mouseenter', 'trip-spot-points', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'trip-spot-points', () => { map.getCanvas().style.cursor = '' })
      }

      // Amenity markers (gas stations / rest areas)
      if (state.showRouteAmenities && state.routeAmenities?.length > 0) {
        state.routeAmenities.forEach(poi => {
          if (!poi.lat || !poi.lng) return
          const isFuel = poi.type === 'fuel'
          const label = isFuel ? '\u26FD' : '\uD83C\uDD7F\uFE0F'
          const tooltipText = poi.name || (isFuel ? (t('gasStation') || 'Station-service') : (t('restArea') || 'Aire de repos'))

          const el = document.createElement('div')
          el.style.cssText = 'font-size:18px;text-align:center;line-height:1;cursor:pointer'
          el.textContent = label
          el.title = tooltipText

          new maplibregl.Marker({ element: el })
            .setLngLat([poi.lng, poi.lat])
            .addTo(map)
        })
      }

      // Fit bounds to show everything — collect all [lng, lat] coords
      const allCoords = [
        [from[1], from[0]],
        [to[1], to[0]],
      ]
      spots.forEach(s => {
        const lat = s.coordinates?.lat || s.lat
        const lng = s.coordinates?.lng || s.lng
        if (lat && lng) allCoords.push([lng, lat])
      })
      if (state.routeAmenities?.length > 0) {
        state.routeAmenities.forEach(poi => {
          if (poi.lat && poi.lng) allCoords.push([poi.lng, poi.lat])
        })
      }

      if (allCoords.length >= 2) {
        const bounds = allCoords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
        )
        map.fitBounds(bounds, { padding: 40 })
      }
    })

    setTimeout(() => map.resize(), 200)
    setTimeout(() => map.resize(), 500)
  }).catch(err => {
    console.warn('Trip map init failed:', err)
  })
}

export default { renderApp, afterRender };
