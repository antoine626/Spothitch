/**
 * Android Back Button Handler
 * Uses History API + popstate to handle hardware/gesture back button in PWA.
 *
 * Strategy:
 * - Push a history entry when opening modals, switching tabs, expanding sheets
 * - On popstate (back button), close the most recent overlay/modal/tab
 * - If nothing is open on the home tab, let the browser handle it (exit app)
 */

import { getState, setState } from '../stores/state.js'

// Track whether we pushed a state (avoid double-pop)
let _historyDepth = 0

/**
 * All modal state keys that can be "open" (boolean flags).
 * Ordered by priority — first match gets closed first.
 */
const MODAL_KEYS = [
  // Popups / small overlays (close first)
  'showBadgePopup',
  'showTitlePopup',
  'showSeasonRewards',
  'showAnniversaryModal',
  'showAmbassadorSuccess',
  'showAmbassadorProfile',
  'showContactAmbassador',
  'showReviewForm',
  'showReplyModal',
  'showAddForbiddenWordModal',
  'showRouteAmenities',
  'showPostTravelPlan',
  'showPhotoUpload',
  'showDonationThankYou',
  'showLocationPermission',

  // Detail modals
  'showBadgeDetail',
  'showFriendProfile',
  'showReport',
  'showBlockModal',

  // Full-screen modals
  'showAddSpot',
  'showSOS',
  'showAuth',
  'showQuiz',
  'showFilters',
  'showStats',
  'showBadges',
  'showChallenges',
  'showShop',
  'showMyRewards',
  'showWelcome',
  'showTutorial',
  'showAgeVerification',
  'showIdentityVerification',
  'showCompanionModal',
  'showGuidesOverlay',
  'showDailyReward',
  'showSafety',
  'showBlockedUsers',
  'showConsentSettings',
  'showDeleteAccount',
  'showMyData',
  'showDonation',
  'showTitles',
  'showTeamChallenges',
  'showCreateTeam',
  'showJoinTeam',
  'showTeamSettings',
  'showCreateTravelGroup',
  'showTravelGroupDetail',
  'showNearbyFriends',
  'showProfileCustomization',
  'showTripHistory',
  'showTravelPlanDetail',
  'showContactForm',
  'showLeaderboard',
  'showAdminPanel',
  'showAdminModeration',
  'showAccessibilityHelp',
  'showAddFriend',
  'showInstallBanner',
  'showFAQ',
  'showLegal',
  'showRating',
  'showValidateSpot',
  'showCheckinModal',
  'showCreateEvent',
  'showLanding',

  // Side menu
  'showSideMenu',
]

/**
 * Push a history state so the back button can intercept.
 * Call this when opening a modal, switching tab, etc.
 */
export function pushBackState(reason) {
  // Only push if we're in a browser context with history
  if (typeof window === 'undefined' || !window.history) return
  _historyDepth++
  window.history.pushState({ spothitch: true, reason, depth: _historyDepth }, '')
}

/**
 * Handle the back button press.
 * Returns true if we handled it (closed something), false if browser should handle.
 */
function handleBack() {
  const state = getState()

  // 1. If a spot detail is open → close it
  if (state.selectedSpot) {
    setState({ selectedSpot: null })
    return true
  }

  // 2. If any modal is open → close the first one found
  for (const key of MODAL_KEYS) {
    if (state[key]) {
      // Build the close update — most modals just need the flag set to false
      const updates = { [key]: false }

      // Some modals have associated state to clean up
      if (key === 'showAddSpot') {
        updates.addSpotPreview = false
        updates.addSpotStep = 1
        updates.addSpotType = null
      } else if (key === 'showAuth') {
        updates.authPendingAction = null
        updates.showAuthReason = null
      } else if (key === 'showBadgeDetail') {
        updates.selectedBadgeId = null
      } else if (key === 'showBadgePopup') {
        updates.newBadge = null
      } else if (key === 'showTitlePopup') {
        updates.newTitle = null
      } else if (key === 'showRating') {
        updates.ratingSpotId = null
      } else if (key === 'showQuiz') {
        updates.quizActive = false
        updates.quizResult = null
      } else if (key === 'showReport') {
        updates.reportType = null
        updates.reportTargetId = null
      } else if (key === 'showPhotoUpload') {
        updates.photoUploadSpotId = null
      } else if (key === 'showFriendProfile') {
        updates.selectedFriendProfileId = null
      } else if (key === 'showBlockModal') {
        updates.blockTargetId = null
        updates.blockTargetName = null
      } else if (key === 'showTutorial') {
        updates.tutorialStep = 0
      } else if (key === 'showCheckinModal') {
        updates.checkinSpot = null
      }

      setState(updates)
      return true
    }
  }

  // 3. If trip bottom sheet is expanded → collapse it
  if (state.tripBottomSheetState === 'expanded' || state.tripBottomSheetState === 'half') {
    setState({ tripBottomSheetState: 'collapsed' })
    return true
  }

  // 4. If in a sub-view (guides, journal, etc.) → go back to default sub-tab
  if (state.activeTab === 'challenges') {
    // Voyage tab has sub-tabs: planner, guides, journal
    const voyageSubTab = state.voyageSubTab || state.activeSubTab
    if (voyageSubTab && voyageSubTab !== 'planner') {
      setState({ voyageSubTab: 'planner', activeSubTab: 'planner' })
      return true
    }
  }

  // 5. If on settings sub-tab in profile → go back to profile main
  if (state.activeTab === 'profile' && state.profileSubTab && state.profileSubTab !== 'profil') {
    setState({ profileSubTab: 'profil' })
    return true
  }

  // 6. If social sub-tab is not default → go back to default
  if (state.activeTab === 'social' && state.socialSubTab && state.socialSubTab !== 'messagerie') {
    setState({ socialSubTab: 'messagerie' })
    return true
  }

  // 7. If friend chat or group chat is open → close it
  if (state.selectedFriendChat || state.activeDMConversation) {
    setState({ selectedFriendChat: null, activeDMConversation: null })
    return true
  }

  if (state.activeGroupChat || state.showZoneChat) {
    setState({ activeGroupChat: null, showZoneChat: false })
    return true
  }

  // 8. If search query is active → clear it
  if (state.searchQuery) {
    setState({ searchQuery: '' })
    return true
  }

  // 9. If on a non-default tab → go back to map (home)
  if (state.activeTab !== 'map') {
    setState({ activeTab: 'map', selectedSpot: null })
    return true
  }

  // 10. Nothing to close — let the browser handle (exit app or navigate back)
  return false
}

// Track previous state for auto-push detection
const _prevModalState = {}
let _prevTab = 'map'
let _prevSpot = null
let _isHandlingBack = false

/**
 * Initialize the back button handler.
 * Call once during app init.
 *
 * Also subscribes to state changes to auto-push history entries
 * when modals open, tabs change, or spot detail opens.
 */
export function initBackButton() {
  if (typeof window === 'undefined') return

  // Snapshot initial modal states
  const state = getState()
  for (const key of MODAL_KEYS) {
    _prevModalState[key] = !!state[key]
  }
  _prevTab = state.activeTab || 'map'
  _prevSpot = state.selectedSpot

  // Push an initial state so we have something to pop
  window.history.replaceState({ spothitch: true, reason: 'init', depth: 0 }, '')

  window.addEventListener('popstate', () => {
    _isHandlingBack = true
    const handled = handleBack()

    if (handled) {
      // We handled the back action — push a new state to keep intercepting
      // Use a microtask to avoid interfering with the current popstate event
      queueMicrotask(() => {
        _isHandlingBack = false
        pushBackState('after-back')
      })
    } else {
      _isHandlingBack = false
    }
    // If not handled, the browser navigates back naturally (exits PWA)
  })

  // Push initial interceptor state
  pushBackState('init')

  // Auto-push history when modals open or tab changes
  // This uses dynamic import to avoid circular dependency with state.js subscribe
  import('../stores/state.js').then(({ subscribe: sub }) => {
    sub((newState) => {
      // Don't push while handling back button (would create loops)
      if (_isHandlingBack) return

      // Check if any modal just opened
      for (const key of MODAL_KEYS) {
        const wasOpen = _prevModalState[key]
        const isOpen = !!newState[key]
        if (!wasOpen && isOpen) {
          pushBackState(key)
        }
        _prevModalState[key] = isOpen
      }

      // Check if spot detail just opened
      if (!_prevSpot && newState.selectedSpot) {
        pushBackState('selectedSpot')
      }
      _prevSpot = newState.selectedSpot

      // Check if tab just changed (away from home)
      if (newState.activeTab !== _prevTab && newState.activeTab !== 'map') {
        pushBackState('tab-' + newState.activeTab)
      }
      _prevTab = newState.activeTab
    })
  }).catch(() => {
    // Fallback: no auto-push, manual pushBackState still works
  })
}

/**
 * Manually trigger back navigation (same as pressing back button).
 * Useful for UI "back" buttons.
 */
export function goBack() {
  const handled = handleBack()
  if (!handled) {
    window.history.back()
  }
}
