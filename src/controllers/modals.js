/**
 * Modals Controllers
 * Handles opening and closing of all modal dialogs
 */

import { setState, getState } from '../stores/state.js'

// Modal state handlers
export const openAddSpot = () => setState({ showAddSpot: true })
export const closeAddSpot = () => setState({ showAddSpot: false })

export const openSOS = () => setState({ showSOS: true })
export const closeSOS = () => setState({ showSOS: false })

export const openSettings = () => setState({ showSettings: true })
export const closeSettings = () => setState({ showSettings: false })

export const openQuiz = () => setState({ showQuiz: true })
export const closeQuiz = () => setState({ showQuiz: false })

export const openFilters = () => setState({ showFilters: true })
export const closeFilters = () => setState({ showFilters: false })

export const openStats = () => setState({ showStats: true })
export const closeStats = () => setState({ showStats: false })

export const openBadges = () => setState({ showBadges: true })
export const closeBadges = () => setState({ showBadges: false })

export const openChallenges = () => setState({ showChallenges: true })
export const closeChallenges = () => setState({ showChallenges: false })

export const openShop = () => setState({ showShop: true })
export const closeShop = () => setState({ showShop: false })

export const openMyRewards = () => setState({ showShop: false, showMyRewards: true })
export const showMyRewards = () => setState({ showShop: false, showMyRewards: true })
export const closeMyRewards = () => setState({ showMyRewards: false })

export const openTripPlanner = () => setState({ showTripPlanner: true })
export const closeTripPlanner = () => setState({ showTripPlanner: false })

export const openSideMenu = () => setState({ showSideMenu: true })
export const closeSideMenu = () => setState({ showSideMenu: false })

/**
 * Close all modals at once
 */
export function closeAllModals() {
  setState({
    showAddSpot: false,
    showSOS: false,
    showSettings: false,
    showQuiz: false,
    showFilters: false,
    showStats: false,
    showBadges: false,
    showChallenges: false,
    showShop: false,
    showMyRewards: false,
    showTripPlanner: false,
    showSideMenu: false,
    showRating: false,
    showAuth: false,
    selectedSpot: null,
  })
}

// Register global handlers
export function registerModalsHandlers() {
  window.openAddSpot = openAddSpot
  window.closeAddSpot = closeAddSpot
  window.openSOS = openSOS
  window.closeSOS = closeSOS
  window.openSettings = openSettings
  window.closeSettings = closeSettings
  window.openQuiz = openQuiz
  window.closeQuiz = closeQuiz
  window.openFilters = openFilters
  window.closeFilters = closeFilters
  window.openStats = openStats
  window.closeStats = closeStats
  window.openBadges = openBadges
  window.closeBadges = closeBadges
  window.openChallenges = openChallenges
  window.closeChallenges = closeChallenges
  window.openShop = openShop
  window.closeShop = closeShop
  window.openMyRewards = openMyRewards
  window.showMyRewards = showMyRewards
  window.closeMyRewards = closeMyRewards
  window.openTripPlanner = openTripPlanner
  window.closeTripPlanner = closeTripPlanner
  window.openSideMenu = openSideMenu
  window.closeSideMenu = closeSideMenu
  window.closeAllModals = closeAllModals
}

export default {
  openAddSpot,
  closeAddSpot,
  openSOS,
  closeSOS,
  openSettings,
  closeSettings,
  openQuiz,
  closeQuiz,
  openFilters,
  closeFilters,
  openStats,
  closeStats,
  openBadges,
  closeBadges,
  openChallenges,
  closeChallenges,
  openShop,
  closeShop,
  openMyRewards,
  showMyRewards,
  closeMyRewards,
  openTripPlanner,
  closeTripPlanner,
  openSideMenu,
  closeSideMenu,
  closeAllModals,
  registerModalsHandlers,
}
