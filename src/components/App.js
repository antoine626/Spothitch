/**
 * Main App Component
 * Orchestrates all views and modals
 *
 * New Structure:
 * - Map (Carte): Full map with search, scores, add spot button
 * - Travel (Voyage): Planner + Country Guides
 * - Challenges (Défis): Gamification hub
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
import { renderAgeVerification, initAgeVerification } from './modals/AgeVerification.js';
import { renderIdentityVerification } from './modals/IdentityVerification.js';

// Landing
import { renderLanding } from './Landing.js';

// UI Components
import { renderNavigationOverlay } from './ui/NavigationOverlay.js';
import { renderDonationModal } from './ui/DonationCard.js';

// New Feature Modals
import { renderSkillTree } from '../services/skillTree.js';
import { renderTravelGroupDetail, renderTravelGroupsList } from '../services/travelGroups.js';
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
import { renderTripHistory } from '../services/tripHistory.js';

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

    <main id="main-content" class="pb-20 pt-16 min-h-screen" role="main" tabindex="-1">
      ${renderActiveView(state)}
    </main>

    ${renderNavigation(state)}

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
    ${state.showSkillTree ? renderSkillTree(state) : ''}
    ${state.showProfileCustomization ? renderCustomizationModal(state) : ''}
    ${state.showNearbyFriends ? renderNearbyFriendsList(state) : ''}
    ${state.showReport ? renderReportModal(state) : ''}
    ${state.showAccessibilityHelp ? renderAccessibilityHelp(state) : ''}
    ${state.showTravelGroupDetail ? renderTravelGroupDetail(state) : ''}
    ${state.showTeamChallenges ? `
      <div class="fixed inset-0 z-50 bg-black/90 overflow-y-auto" onclick="if(event.target===this)closeTeamChallenges()">
        <div class="min-h-screen pb-20">
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-dark-primary/95 backdrop-blur border-b border-white/10">
            <h2 class="text-lg font-bold"><i class="fas fa-users mr-2 text-orange-400"></i>${t('teamChallenges') || "Défis d'équipe"}</h2>
            <button onclick="closeTeamChallenges()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="${t('close') || 'Fermer'}">
              <i class="fas fa-times"></i>
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

    <!-- Trip History Modal -->
    ${state.showTripHistory ? `
      <div class="fixed inset-0 z-50 bg-black/90 overflow-y-auto" onclick="if(event.target===this)closeTripHistory()">
        <div class="min-h-screen pb-20">
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-dark-primary/95 backdrop-blur border-b border-white/10">
            <h2 class="text-lg font-bold"><i class="fas fa-clipboard-list mr-2 text-emerald-400"></i>${t('tripHistory') || 'Historique de voyage'}</h2>
            <div class="flex items-center gap-2">
              <button onclick="clearTripHistory()" class="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-all" aria-label="${t('clearHistory') || "Effacer l'historique"}">
                <i class="fas fa-trash mr-1"></i>${t('clear') || 'Effacer'}
              </button>
              <button onclick="closeTripHistory()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="${t('close') || 'Fermer'}">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="p-4">
            ${renderTripHistory()}
          </div>
        </div>
      </div>
    ` : ''}


    <!-- Cookie Banner (RGPD) - hidden during tutorial/welcome -->
    ${!state.showTutorial && !state.showWelcome ? renderCookieBanner() : ''}
  `;
}

/**
 * Render the active view based on current tab
 */
function renderActiveView(state) {
  switch (state.activeTab) {
    // New structure
    case 'map':
      return renderHome(state);
    case 'fullmap':
      return renderMap(state);
    case 'travel':
      return renderTravel(state);
    case 'challenges':
      return renderChallengesHub(state);
    case 'social':
      return renderSocial(state);
    case 'profile':
      return renderProfile(state);

    // Old structure (backward compatibility)
    case 'home':
      return renderHome(state);
    case 'spots':
      return renderSpots(state);
    case 'planner':
      return renderTravel(state); // Redirect to new travel
    case 'chat':
      return renderSocial(state); // Redirect to new social

    default:
      return renderHome(state);
  }
}

/**
 * Post-render hook to initialize map
 */
export function afterRender(state) {
  if (state.activeTab === 'fullmap') {
    setTimeout(() => initMainMap(state), 100)
  }
  if (state.activeTab === 'map' || state.activeTab === 'home') {
    setTimeout(() => initHomeMap(state), 100)
  }
  if (state.activeTab === 'travel' && state.showTripMap) {
    setTimeout(() => initTripMap(state), 100)
  }
}

/**
 * Get tile URL based on app language (FR/DE have localized labels)
 */
function getMapTileConfig(lang) {
  // Use localized tile servers where available
  // FR/DE tiles show city names in French/German for European cities
  // Standard OSM for EN/ES (shows local language names which are mostly readable)
  switch (lang) {
    case 'fr': return {
      url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      options: { maxZoom: 19 }
    }
    case 'de': return {
      url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
      options: { maxZoom: 18 }
    }
    default: return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: { maxZoom: 19 }
    }
  }
}

/**
 * Initialize the home map (full-size, shows spots in visible area)
 */
function initHomeMap(state) {
  const container = document.getElementById('home-map')
  if (!container || container.dataset.initialized === 'true') return

  import('leaflet').then(async (leafletModule) => {
    if (container.dataset.initialized === 'true') return
    container.dataset.initialized = 'true'

    const L = leafletModule.default || leafletModule
    // Expose L globally so plugins (markercluster) can attach to it
    window.L = L

    const center = state.userLocation
      ? [state.userLocation.lat, state.userLocation.lng]
      : [30, 0] // World center fallback

    const zoom = state.userLocation ? 13 : 3

    const map = L.map(container, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    })

    const tileConfig = getMapTileConfig(getState().lang || 'en')
    L.tileLayer(tileConfig.url, {
      ...tileConfig.options,
      updateWhenZooming: false,  // Don't load tiles during zoom animation (prevents pixelation)
      updateWhenIdle: true,      // Load tiles only when map stops moving
      keepBuffer: 4,             // Keep more tiles around viewport cached
    }).addTo(map)

    window.homeMapInstance = map
    window.homeLeaflet = L
    window.homeSpotMarkers = []

    // User position marker
    if (state.userLocation) {
      L.circleMarker([state.userLocation.lat, state.userLocation.lng], {
        radius: 10,
        fillColor: '#0ea5e9',
        color: '#fff',
        weight: 3,
        fillOpacity: 1,
      }).addTo(map).bindTooltip(t('myPosition') || 'Ma position', { permanent: false })
    }

    // spotLoader module reference (loaded once, reused)
    let spotLoader = null
    import('../services/spotLoader.js').then(mod => { spotLoader = mod }).catch(() => {})

    // MarkerCluster group - await to ensure it's ready
    let clusterGroup = null
    try {
      await import('leaflet.markercluster')
      clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        chunkedLoading: true,
        disableClusteringAtZoom: 15,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount()
          let px = 36
          if (count > 100) px = 48
          else if (count > 20) px = 42
          return L.divIcon({
            html: `<div style="background:rgba(14,165,233,0.85);color:#fff;border-radius:50%;width:${px}px;height:${px}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${count > 100 ? 14 : 12}px;border:2px solid rgba(255,255,255,0.6);box-shadow:0 2px 8px rgba(0,0,0,0.3)">${count}</div>`,
            className: '',
            iconSize: L.point(px, px),
          })
        },
      })
      map.addLayer(clusterGroup)
    } catch (e) {
      console.warn('MarkerCluster failed to load:', e)
    }

    // Track which spot IDs are already in the cluster to avoid duplicates
    const addedSpotIds = new Set()

    // Add NEW spots to cluster (never clear, only append)
    const addSpotsToCluster = (spots) => {
      let favIds = []
      try { favIds = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]') } catch (e) {}
      const favSet = new Set(favIds)

      const newMarkers = []
      spots.forEach(spot => {
        if (addedSpotIds.has(spot.id)) return
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        if (!lat || !lng) return
        addedSpotIds.add(spot.id)
        const isFav = favSet.has(spot.id)

        const marker = L.circleMarker([lat, lng], {
          radius: isFav ? 8 : 5,
          fillColor: isFav ? '#f59e0b' : '#22c55e',
          color: isFav ? '#fbbf24' : '#fff',
          weight: isFav ? 2 : 1,
          fillOpacity: 0.85,
        }).on('click', () => window.selectSpot?.(spot.id))

        newMarkers.push(marker)
      })

      if (newMarkers.length === 0) return

      if (clusterGroup) {
        clusterGroup.addLayers(newMarkers)
      } else {
        newMarkers.forEach(m => m.addTo(map))
        window.homeSpotMarkers.push(...newMarkers)
      }

      // Update badge count
      const badge = document.querySelector('#home-map-container .text-primary-400.font-semibold')
      if (badge) badge.textContent = addedSpotIds.size
    }

    // Load spots for visible area and add new ones
    let isLoadingSpots = false
    const loadSpotsForView = async () => {
      // Add already-loaded spots first
      const currentState = getState()
      const stateSpots = currentState.spots || []
      const existing = spotLoader ? spotLoader.getAllLoadedSpots() : []
      const spotsMap = new Map()
      stateSpots.forEach(s => spotsMap.set(s.id, s))
      existing.forEach(s => spotsMap.set(s.id, s))
      addSpotsToCluster(Array.from(spotsMap.values()))

      // Then load new spots for visible bounds
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
        // Add only the newly loaded spots
        const allLoaded = spotLoader.getAllLoadedSpots()
        addSpotsToCluster(allLoaded)
      } catch (e) {
        console.warn('Spot loading failed:', e)
      } finally {
        isLoadingSpots = false
      }
    }

    // Debounce spot loading on map move (500ms) — no instant rebuild
    let moveTimer = null
    map.on('moveend', () => {
      clearTimeout(moveTimer)
      moveTimer = setTimeout(loadSpotsForView, 500)
    })

    // Initial load
    setTimeout(loadSpotsForView, 300)

    // Fix map size (container may have changed)
    setTimeout(() => map.invalidateSize(), 200)
  }).catch((err) => {
    console.warn('Home map init failed:', err)
  })
}

/**
 * Initialize trip map (shows only trip spots along route)
 */
function initTripMap(state) {
  const container = document.getElementById('trip-map')
  if (!container || container.dataset.initialized === 'true') return
  if (!state.tripResults) return

  import('leaflet').then((L) => {
    if (container.dataset.initialized === 'true') return
    container.dataset.initialized = 'true'

    const results = state.tripResults
    const from = results.fromCoords // [lat, lng]
    const to = results.toCoords     // [lat, lng]
    if (!from || !to) return

    const tileConfig = getMapTileConfig(getState().lang || 'en')
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView(from, 7)
    L.tileLayer(tileConfig.url, {
      ...tileConfig.options,
      attribution: '',
      updateWhenZooming: false,
      updateWhenIdle: true,
      keepBuffer: 4,
    }).addTo(map)

    // Route line from OSRM geometry
    if (results.routeGeometry && results.routeGeometry.length > 0) {
      const routeLatLngs = results.routeGeometry.map(([lng, lat]) => [lat, lng])
      L.polyline(routeLatLngs, {
        color: '#0ea5e9', weight: 4, opacity: 0.8
      }).addTo(map)
    } else {
      L.polyline([from, to], {
        color: '#0ea5e9', weight: 3, opacity: 0.6, dashArray: '8, 8'
      }).addTo(map)
    }

    // Route endpoints shown via the route line itself (no separate markers)

    // Trip spot markers (ONLY trip spots, not all)
    // Check favorites from localStorage
    let favIds = []
    try { favIds = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]') } catch (e) {}
    const favSet = new Set(favIds)

    const spots = results.spots || []
    spots.forEach(spot => {
      const lat = spot.coordinates?.lat || spot.lat
      const lng = spot.coordinates?.lng || spot.lng
      if (!lat || !lng) return
      const isFav = favSet.has(spot.id)
      L.circleMarker([lat, lng], {
        radius: isFav ? 9 : 7,
        fillColor: isFav ? '#f59e0b' : '#22c55e',
        color: isFav ? '#fbbf24' : '#fff',
        weight: isFav ? 3 : 2,
        fillOpacity: 0.9
      }).addTo(map).on('click', () => window.selectSpot?.(spot.id))
    })

    // Amenity markers (gas stations / rest areas)
    if (state.showRouteAmenities && state.routeAmenities?.length > 0) {
      state.routeAmenities.forEach(poi => {
        if (!poi.lat || !poi.lng) return
        const isFuel = poi.type === 'fuel'
        const fillColor = isFuel ? '#10b981' : '#0ea5e9'
        const label = isFuel ? '\u26FD' : '\uD83C\uDD7F\uFE0F'
        const tooltipText = poi.name || (isFuel ? (t('gasStation') || 'Station-service') : (t('restArea') || 'Aire de repos'))

        // Use a div icon for emoji markers
        const icon = L.divIcon({
          html: `<div style="font-size:18px;text-align:center;line-height:1">${label}</div>`,
          className: 'amenity-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        L.marker([poi.lat, poi.lng], { icon })
          .addTo(map)
          .bindTooltip(tooltipText, { direction: 'top', offset: [0, -12] })
      })

      // Map legend
      const legendHtml = `
        <div style="background:rgba(15,23,42,0.9);padding:8px 12px;border-radius:8px;font-size:11px;color:#cbd5e1;border:1px solid rgba(255,255,255,0.1)">
          <div style="margin-bottom:4px"><span style="color:#22c55e">\u25CF</span> Spots</div>
          <div style="margin-bottom:4px">\u26FD ${t('gasStation') || 'Station-service'}</div>
          <div>\uD83C\uDD7F\uFE0F ${t('restArea') || 'Aire de repos'}</div>
        </div>
      `
      const LegendControl = L.Control.extend({
        onAdd() {
          const div = L.DomUtil.create('div')
          div.innerHTML = legendHtml
          return div
        },
      })
      new LegendControl({ position: 'bottomleft' }).addTo(map)
    }

    // Fit bounds to show everything
    const allPoints = [from, to]
    spots.forEach(s => {
      const lat = s.coordinates?.lat || s.lat
      const lng = s.coordinates?.lng || s.lng
      if (lat && lng) allPoints.push([lat, lng])
    })
    if (state.routeAmenities?.length > 0) {
      state.routeAmenities.forEach(poi => {
        if (poi.lat && poi.lng) allPoints.push([poi.lat, poi.lng])
      })
    }

    if (allPoints.length >= 2) {
      map.fitBounds(allPoints, { padding: [40, 40] })
    }
    // Multiple invalidateSize calls to handle timing issues
    setTimeout(() => { map.invalidateSize(); map.fitBounds(allPoints, { padding: [40, 40] }) }, 100)
    setTimeout(() => map.invalidateSize(), 500)
  }).catch(err => {
    console.warn('Trip map init failed:', err)
  })
}

export default { renderApp, afterRender };
