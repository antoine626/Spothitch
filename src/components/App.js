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
// renderMap and initMainMap available in Map.js but not used directly here
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
import { trapFocus } from '../utils/a11y.js'

// Store active focus trap cleanup function
let _activeFocusTrapCleanup = null

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
              ${icon('x', 'w-5 h-5')}
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
                ${icon('x', 'w-5 h-5')}
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
                  ${icon('book-open', 'w-4 h-4 mr-1.5')}${t('guides') || 'Guides'}
                </button>
              </div>
              <button onclick="closeTripPlanner();closeGuidesOverlay()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="${t('close') || 'Fermer'}">
                ${icon('x', 'w-5 h-5')}
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
 * Post-render hook to initialize map and focus traps
 */
export function afterRender(state) {
  const isMapTab = ['map', 'fullmap', 'home', 'travel', 'planner'].includes(state.activeTab)
  if (isMapTab) {
    setTimeout(() => initHomeMap(state), 100)
  }
  // Trip map can be in overlay (showTripPlanner) regardless of activeTab
  if (state.showTripMap && (isMapTab || state.showTripPlanner)) {
    // Only init if not already preserved from previous render
    const tripContainer = document.getElementById('trip-map')
    if (tripContainer && tripContainer.dataset.initialized !== 'true') {
      setTimeout(() => initTripMap(state), 100)
    }
  }

  // Focus trap: clean up previous trap
  if (_activeFocusTrapCleanup) {
    _activeFocusTrapCleanup()
    _activeFocusTrapCleanup = null
  }

  // Activate focus trap on the topmost open modal (role="dialog")
  requestAnimationFrame(() => {
    const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
    if (dialogs.length > 0) {
      const topModal = dialogs[dialogs.length - 1]
      _activeFocusTrapCleanup = trapFocus(topModal)
    }
  })
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
    const {
      addCountryBubbleLayers, updateCountryBubbleData,
      createBubblePopup, setBubbleLayersVisibility, setSpotLayersVisibility,
    } = await import('../services/countryBubbles.js')

    const hasGps = !!state.userLocation
    const center = hasGps
      ? [state.userLocation.lng, state.userLocation.lat]
      : [2.3, 46.6] // France center as fallback [lng, lat]

    const zoom = hasGps ? 13 : 5

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

    // User position marker + GPS centering
    let userMarker = null
    const showUserPosition = (lat, lng) => {
      if (userMarker) userMarker.remove()
      const el = document.createElement('div')
      el.innerHTML = `
        <div class="relative">
          <div class="w-4 h-4 bg-amber-400 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-50"></div>
        </div>
      `
      userMarker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)
    }

    if (state.userLocation) {
      showUserPosition(state.userLocation.lat, state.userLocation.lng)
    } else if (navigator.geolocation) {
      // Request GPS and center map when available
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          showUserPosition(latitude, longitude)
          map.flyTo({ center: [longitude, latitude], zoom: 13, duration: 1200 })
          // Update global state
          if (window.setState) window.setState({ userLocation: { lat: latitude, lng: longitude }, gpsEnabled: true })
          // Load spots in 50km radius once GPS is acquired
          if (spotLoader) {
            try {
              const radiusSpots = await spotLoader.loadSpotsInRadius(latitude, longitude, 50)
              updateSpotsOnMap(radiusSpots)
              if (window._refreshCountryBubbles) window._refreshCountryBubbles()
              // Prefetch nearby countries in background for faster browsing
              spotLoader.prefetchNearbyCountries(latitude, longitude, 800)
            } catch { /* no-op */ }
          }
        },
        () => { /* silently fail — user denied GPS */ },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      )
    }

    // spotLoader module reference (loaded once, reused)
    let spotLoader = null
    let spotIndex = null
    let countryCenters = null
    let activePopup = null

    // Track which spot IDs are already added to avoid duplicates
    const addedSpotIds = new Set()

    // Helper: convert spots array to GeoJSON
    const spotsToGeoJSON = (spots) => {
      let favIds = []
      try { favIds = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]') } catch { /* no-op */ }
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
          'text-font': ['Noto Sans Bold'],
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

    // Haversine distance in km
    const haversineKm = (lat1, lng1, lat2, lng2) => {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    // Populate split view with nearest spots + distances
    const populateSplitView = async (allSpots) => {
      const splitEl = document.getElementById('split-spots-list')
      if (!splitEl) return

      const currentState = getState()
      const userLoc = currentState.userLocation
      const bounds = map.getBounds()

      // Filter visible spots only
      const visibleSpots = allSpots.filter(s => {
        const lat = s.coordinates?.lat || s.lat
        const lng = s.coordinates?.lng || s.lng
        if (!lat || !lng) return false
        return bounds.contains([lng, lat])
      })

      // Calculate distances if GPS available, then sort
      const spotsWithDist = visibleSpots.map(s => {
        const lat = s.coordinates?.lat || s.lat
        const lng = s.coordinates?.lng || s.lng
        const dist = userLoc ? haversineKm(userLoc.lat, userLoc.lng, lat, lng) : null
        return { ...s, _dist: dist }
      })

      if (userLoc) {
        spotsWithDist.sort((a, b) => (a._dist || 999) - (b._dist || 999))
      }

      const nearest = spotsWithDist.slice(0, 15)
      if (nearest.length === 0) return

      // Format distance
      const fmtDist = (km) => {
        if (km === null || km === undefined) return ''
        if (km < 1) return `${Math.round(km * 1000)} m`
        return `${km.toFixed(1)} km`
      }

      // List cards for split view
      if (splitEl) {
        splitEl.innerHTML = nearest.slice(0, 20).map(s => {
          const rating = s.globalRating?.toFixed(1) || '—'
          const distLabel = s._dist !== null ? fmtDist(s._dist) : ''
          const dir = s.to || s.from || ''
          return `
            <button onclick="selectSpot(${typeof s.id === 'string' ? "'" + s.id + "'" : s.id})"
              class="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
              <div class="text-amber-400 text-sm font-bold shrink-0">${rating}</div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-sm font-medium truncate">${dir || 'Spot'}</div>
                <div class="text-slate-400 text-xs truncate">${s.from || ''}</div>
              </div>
              ${distLabel ? `<span class="text-xs text-primary-400 font-medium shrink-0">${distLabel}</span>` : ''}
            </button>`
        }).join('')
      }
    }

    // Gather all spots and push to source
    const updateSpotsOnMap = (spots) => {
      const geojson = spotsToGeoJSON(spots)
      if (geojson.features.length === 0 && spotsSourceAdded) return
      addSpotsSource(geojson)

      // Update badge count
      const badge = document.querySelector('#home-map-container .text-primary-400.font-semibold')
      if (badge) badge.textContent = addedSpotIds.size

      // Populate bottom sheet with nearest spots
      populateSplitView(spots)
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

    // Update layer visibility based on zoom level
    const updateLayerVisibility = () => {
      const z = map.getZoom()
      if (z < 7) {
        setBubbleLayersVisibility(map, true)
        setSpotLayersVisibility(map, false)
      } else {
        setBubbleLayersVisibility(map, false)
        setSpotLayersVisibility(map, true)
      }
    }

    // Refresh bubble data (downloaded/loaded states)
    const refreshBubbles = () => {
      if (!spotIndex || !countryCenters) return
      let downloadedCodes = new Set()
      try {
        const dl = JSON.parse(localStorage.getItem('spothitch_offline_countries') || '[]')
        downloadedCodes = new Set(dl.map(c => c.code))
      } catch { /* no-op */ }
      const loadedCodes = spotLoader ? spotLoader.getLoadedCountryCodes() : new Set()
      updateCountryBubbleData(map, spotIndex, countryCenters, loadedCodes, downloadedCodes)
    }

    map.on('load', async () => {
      // Add country bubble layers
      addCountryBubbleLayers(map)

      // Load spotLoader + index
      try {
        const mod = await import('../services/spotLoader.js')
        spotLoader = mod
        spotIndex = await mod.loadSpotIndex()
        countryCenters = mod.getCountryCenters()
      } catch { /* no-op */ }

      // Initial bubble data
      refreshBubbles()

      // Click on country bubble → popup (use generic click + queryRenderedFeatures)
      map.on('click', (e) => {
        if (map.getZoom() >= 7) return // bubbles hidden at zoom >= 7
        const features = map.queryRenderedFeatures(e.point, { layers: ['country-bubble-circles'] })
        if (!features?.length) return
        if (activePopup) { activePopup.remove(); activePopup = null }
        activePopup = createBubblePopup(maplibregl, features[0], e.lngLat)
        activePopup.addTo(map)
      })
      map.on('mouseenter', 'country-bubble-circles', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'country-bubble-circles', () => { map.getCanvas().style.cursor = '' })

      // Initial load strategy
      const currentZoom = map.getZoom()
      if (hasGps && spotLoader) {
        // GPS: load spots in 50km radius
        const radiusSpots = await spotLoader.loadSpotsInRadius(
          state.userLocation.lat, state.userLocation.lng, 50
        )
        updateSpotsOnMap(radiusSpots)
        refreshBubbles()
      } else if (currentZoom >= 7) {
        loadSpotsForView()
      } else {
        // No GPS, zoomed out: load spots for visible area anyway
        // so the map isn't empty while bubbles also show
        loadSpotsForView()
      }

      updateLayerVisibility()
    })

    // Debounce spot loading on map move (1500ms to avoid excessive re-renders)
    let moveTimer = null
    let lastBounds = null
    map.on('moveend', () => {
      updateLayerVisibility()
      clearTimeout(moveTimer)

      // Refresh bubbles at any zoom
      refreshBubbles()

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

    // Expose refreshBubbles for main.js handlers
    window._refreshCountryBubbles = refreshBubbles

    // Resize
    setTimeout(() => map.resize(), 200)
  }).catch((err) => {
    console.warn('Home map init failed:', err)
  })
}

/**
 * Initialize trip map (MapLibre GL — shows only trip spots along route)
 */
// Trip map instance + state (module-level for dynamic updates)
let tripMapInstance = null
let tripMaplibregl = null
let tripAmenityMarkers = []
let tripGpsMarker = null
let tripGpsWatchId = null

function initTripMap(state) {
  const container = document.getElementById('trip-map')
  if (!container || container.dataset.initialized === 'true') return
  if (!state.tripResults) return

  import('maplibre-gl').then((maplibreModule) => {
    if (container.dataset.initialized === 'true') return
    container.dataset.initialized = 'true'

    const maplibregl = maplibreModule.default || maplibreModule
    tripMaplibregl = maplibregl

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
    tripMapInstance = map
    window._tripMapInstance = map

    map.on('load', () => {
      try {
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
      try { favIds = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]') } catch { /* no-op */ }
      const favSet = new Set(favIds)

      const spots = results.spots || []
      const spotFeatures = []
      spots.forEach((spot, i) => {
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        if (!lat || !lng) return
        const isFav = favSet.has(spot.id)
        spotFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            id: spot.id,
            index: i + 1,
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
        // Spot number labels
        map.addLayer({
          id: 'trip-spot-labels',
          type: 'symbol',
          source: 'trip-spots',
          layout: {
            'text-field': ['to-string', ['get', 'index']],
            'text-size': 10,
            'text-font': ['Noto Sans Bold'],
            'text-allow-overlap': true,
          },
          paint: { 'text-color': '#ffffff' },
        })
        map.on('click', 'trip-spot-points', (e) => {
          if (e.features?.length > 0) window.selectSpot?.(e.features[0].properties.id)
        })
        map.on('mouseenter', 'trip-spot-points', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'trip-spot-points', () => { map.getCanvas().style.cursor = '' })
      }

      // Start/End markers
      const startEl = document.createElement('div')
      startEl.style.cssText = 'width:28px;height:28px;border-radius:50%;background:#22c55e;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3)'
      startEl.textContent = 'A'
      new maplibregl.Marker({ element: startEl }).setLngLat([from[1], from[0]]).addTo(map)

      const endEl = document.createElement('div')
      endEl.style.cssText = 'width:28px;height:28px;border-radius:50%;background:#f59e0b;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3)'
      endEl.textContent = 'B'
      new maplibregl.Marker({ element: endEl }).setLngLat([to[1], to[0]]).addTo(map)

      // Amenity markers if already loaded
      if (state.showRouteAmenities && state.routeAmenities?.length > 0) {
        addAmenityMarkers(state.routeAmenities)
      }

      // Fit bounds to show everything
      const allCoords = [[from[1], from[0]], [to[1], to[0]]]
      spots.forEach(s => {
        const lat = s.coordinates?.lat || s.lat
        const lng = s.coordinates?.lng || s.lng
        if (lat && lng) allCoords.push([lng, lat])
      })

      if (allCoords.length >= 2) {
        const bounds = allCoords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
        )
        map.fitBounds(bounds, { padding: 50 })
      }

      // Start GPS tracking
      startTripGpsTracking()
      } catch (err) {
        console.error('[TripMap] Error in load callback:', err?.message || err, err?.stack || '')
      }
    })

    setTimeout(() => map.resize(), 200)
    setTimeout(() => map.resize(), 500)
  }).catch(err => {
    console.warn('Trip map init failed:', err)
  })
}

// Add amenity markers dynamically to the existing trip map
function addAmenityMarkers(amenities) {
  if (!tripMapInstance || !tripMaplibregl) return
  // Remove old markers first
  removeAmenityMarkers()
  amenities.forEach(poi => {
    if (!poi.lat || !poi.lng) return
    const isFuel = poi.type === 'fuel'
    const label = isFuel ? '⛽' : '🅿️'
    const stationName = poi.name || poi.brand || (isFuel ? (t('gasStation') || 'Gas station') : (t('restArea') || 'Rest area'))
    const areaName = poi.serviceArea || ''

    const el = document.createElement('div')
    el.style.cssText = 'font-size:22px;text-align:center;line-height:1;cursor:pointer;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));transition:transform 0.15s'
    el.textContent = label
    el.title = areaName ? `${stationName} — ${areaName}` : stationName

    const marker = new tripMaplibregl.Marker({ element: el })
      .setLngLat([poi.lng, poi.lat])
      .addTo(tripMapInstance)

    // Popup on click with station name + service area
    let popupHTML = `<div style="padding:6px 10px;font-family:system-ui;font-size:13px;color:#1e293b">`
    popupHTML += `<div style="font-weight:600">${label} ${stationName}</div>`
    if (areaName) {
      popupHTML += `<div style="font-size:11px;color:#64748b;margin-top:2px">📍 ${areaName}</div>`
    }
    popupHTML += `</div>`
    const popup = new tripMaplibregl.Popup({ offset: 25, closeButton: false, maxWidth: '220px' })
      .setHTML(popupHTML)

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      // Close any other open popup
      tripAmenityMarkers.forEach(m => { if (m._popup?.isOpen()) m._popup.remove() })
      popup.setLngLat([poi.lng, poi.lat]).addTo(tripMapInstance)
      marker._popup = popup
    })

    marker._popup = popup
    tripAmenityMarkers.push(marker)
  })
}

// Remove all amenity markers from trip map
function removeAmenityMarkers() {
  tripAmenityMarkers.forEach(m => m.remove())
  tripAmenityMarkers = []
}

// GPS tracking on trip map
function startTripGpsTracking() {
  if (!tripMapInstance || !tripMaplibregl || !navigator.geolocation) return
  // Remove previous watch
  stopTripGpsTracking()

  tripGpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lng = pos.coords.longitude
      const lat = pos.coords.latitude
      if (tripGpsMarker) {
        tripGpsMarker.setLngLat([lng, lat])
      } else {
        const el = document.createElement('div')
        el.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 10px rgba(59,130,246,0.6)'
        tripGpsMarker = new tripMaplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(tripMapInstance)
      }
    },
    () => { /* geolocation error — silent */ },
    { enableHighAccuracy: true, maximumAge: 10000 }
  )
}

function stopTripGpsTracking() {
  if (tripGpsWatchId !== null) {
    navigator.geolocation.clearWatch(tripGpsWatchId)
    tripGpsWatchId = null
  }
  if (tripGpsMarker) {
    tripGpsMarker.remove()
    tripGpsMarker = null
  }
}

// Expose for Travel.js to call dynamically
window._tripMapAddAmenities = addAmenityMarkers
window._tripMapRemoveAmenities = removeAmenityMarkers
window._tripMapFlyTo = (lng, lat) => {
  if (tripMapInstance) tripMapInstance.flyTo({ center: [lng, lat], zoom: 13, duration: 800 })
}
window._tripMapResize = () => {
  if (tripMapInstance) {
    tripMapInstance.resize()
    tripMapInstance.triggerRepaint()
  }
}
window._tripMapCleanup = () => {
  stopTripGpsTracking()
  removeAmenityMarkers()
  if (tripMapInstance) {
    try { tripMapInstance.remove() } catch { /* ignore */ }
  }
  const container = document.getElementById('trip-map')
  if (container) container.dataset.initialized = ''
  tripMapInstance = null
  tripMaplibregl = null
}

export default { renderApp, afterRender };
