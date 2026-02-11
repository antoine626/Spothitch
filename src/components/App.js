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
import { renderTripHistory } from '../services/tripHistory.js';

/**
 * Render the complete application
 */
export function renderApp(state) {
  // Show welcome screen for new users
  if (state.showWelcome && !state.username) {
    return renderWelcome(state);
  }

  // Main app content
  return `
    <!-- Skip Link for Accessibility -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
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
            <h2 class="text-lg font-bold"><i class="fas fa-users mr-2 text-orange-400"></i>Defis d'equipe</h2>
            <button onclick="closeTeamChallenges()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Fermer">
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

    <!-- Trip History Modal -->
    ${state.showTripHistory ? `
      <div class="fixed inset-0 z-50 bg-black/90 overflow-y-auto" onclick="if(event.target===this)closeTripHistory()">
        <div class="min-h-screen pb-20">
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-dark-primary/95 backdrop-blur border-b border-white/10">
            <h2 class="text-lg font-bold"><i class="fas fa-clipboard-list mr-2 text-emerald-400"></i>Historique de voyage</h2>
            <div class="flex items-center gap-2">
              <button onclick="clearTripHistory()" class="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-all" aria-label="Effacer l'historique">
                <i class="fas fa-trash mr-1"></i>Effacer
              </button>
              <button onclick="closeTripHistory()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Fermer">
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

  import('leaflet').then((L) => {
    if (container.dataset.initialized === 'true') return
    container.dataset.initialized = 'true'

    const center = state.userLocation
      ? [state.userLocation.lat, state.userLocation.lng]
      : [30, 0] // World center fallback

    const zoom = state.userLocation ? 13 : 3

    const map = L.map(container, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true, // Canvas renderer = much faster with many markers
    })

    const tileConfig = getMapTileConfig(getState().lang || 'fr')
    L.tileLayer(tileConfig.url, tileConfig.options).addTo(map)

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
      }).addTo(map).bindTooltip('Ma position', { permanent: false })
    }

    // spotLoader module reference (loaded once, reused)
    let spotLoader = null
    import('../services/spotLoader.js').then(mod => { spotLoader = mod }).catch(() => {})

    // Display spots currently available on the visible map area
    const displayVisibleSpots = () => {
      const bounds = map.getBounds()
      const currentState = getState()
      const stateSpots = currentState.spots || []

      // Merge state spots + spotLoader spots (deduplicate by id)
      const spotsMap = new Map()
      stateSpots.forEach(s => spotsMap.set(s.id, s))
      if (spotLoader) {
        spotLoader.getAllLoadedSpots().forEach(s => spotsMap.set(s.id, s))
      }
      const allSpots = Array.from(spotsMap.values())

      // Clear old markers
      window.homeSpotMarkers.forEach(m => map.removeLayer(m))
      window.homeSpotMarkers = []

      // Add spots in visible bounds (favorites shown differently, max 500)
      let favIds = []
      try { favIds = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]') } catch (e) {}
      const favSet = new Set(favIds)
      let count = 0
      const MAX_MARKERS = 500
      const visibleSpots = []
      allSpots.forEach(spot => {
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        if (!lat || !lng) return
        if (!bounds.contains([lat, lng])) return
        visibleSpots.push(spot)
      })
      // Prioritize favorites, then take first MAX_MARKERS
      visibleSpots.sort((a, b) => (favSet.has(b.id) ? 1 : 0) - (favSet.has(a.id) ? 1 : 0))
      const toShow = visibleSpots.slice(0, MAX_MARKERS)
      toShow.forEach(spot => {
        const lat = spot.coordinates?.lat || spot.lat
        const lng = spot.coordinates?.lng || spot.lng
        const isFav = favSet.has(spot.id)

        const marker = L.circleMarker([lat, lng], {
          radius: isFav ? 8 : 5,
          fillColor: isFav ? '#f59e0b' : '#22c55e',
          color: isFav ? '#fbbf24' : '#fff',
          weight: isFav ? 2 : 1,
          fillOpacity: 0.85,
        }).addTo(map).on('click', () => window.selectSpot?.(spot.id))

        window.homeSpotMarkers.push(marker)
        count++
      })

      // Update badge count
      const badge = document.querySelector('#home-map-container .text-primary-400.font-semibold')
      if (badge) badge.textContent = count
    }

    // Load spots from spotLoader for visible bounds, then redisplay
    let isLoadingSpots = false
    const loadAndDisplaySpots = async () => {
      // Show already-loaded spots immediately
      displayVisibleSpots()

      // Then trigger loading for visible countries
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
        // Redisplay with newly loaded spots
        displayVisibleSpots()
      } catch (e) {
        console.warn('Spot loading failed:', e)
      } finally {
        isLoadingSpots = false
      }
    }

    // Debounce spot loading on map move (300ms)
    let moveTimer = null
    const onMapMove = () => {
      displayVisibleSpots() // instant display of cached spots
      clearTimeout(moveTimer)
      moveTimer = setTimeout(loadAndDisplaySpots, 300)
    }

    map.on('moveend', onMapMove)

    // Initial load
    setTimeout(loadAndDisplaySpots, 300)

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

    const tileConfig = getMapTileConfig(state.lang || 'fr')
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView(from, 7)
    L.tileLayer(tileConfig.url, { ...tileConfig.options, attribution: '' }).addTo(map)

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

    // Start marker (green)
    L.circleMarker(from, {
      radius: 12, fillColor: '#22c55e', color: '#fff', weight: 3, fillOpacity: 1
    }).addTo(map).bindTooltip(results.from?.split(',')[0] || 'A', {
      permanent: true, direction: 'top', offset: [0, -14]
    })

    // End marker (red)
    L.circleMarker(to, {
      radius: 12, fillColor: '#ef4444', color: '#fff', weight: 3, fillOpacity: 1
    }).addTo(map).bindTooltip(results.to?.split(',')[0] || 'B', {
      permanent: true, direction: 'top', offset: [0, -14]
    })

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
        const tooltipText = poi.name || (isFuel ? 'Station-service' : 'Aire de repos')

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
          <div style="margin-bottom:4px">\u26FD Station-service</div>
          <div>\uD83C\uDD7F\uFE0F Aire de repos</div>
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
