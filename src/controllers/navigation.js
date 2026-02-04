/**
 * Navigation Controllers
 * Handles tab changes, view modes, and page navigation
 */

import { setState, getState, actions } from '../stores/state.js';
import { trackPageView } from '../utils/seo.js';
import { announce } from '../utils/a11y.js';
import { destroyMaps, initMap } from '../services/map.js';

// Store scroll positions for each tab
const scrollPositions = new Map();

/**
 * Change active tab with cleanup and scroll restoration
 */
export function changeTab(tab) {
  const state = getState();
  const previousTab = state.activeTab;

  // Save current scroll position
  saveScrollPosition(previousTab);

  // Clean up maps when leaving map-related tabs
  if (previousTab !== tab) {
    if (previousTab === 'map' || previousTab === 'spots' || previousTab === 'travel') {
      setTimeout(() => destroyMaps(), 500);
    }
  }

  actions.changeTab(tab);
  trackPageView(tab);
  announce(`Navigation vers ${tab}`);

  // Restore scroll position after render
  setTimeout(() => restoreScrollPosition(tab), 100);
}

/**
 * Save scroll position for a tab
 */
function saveScrollPosition(tab) {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    scrollPositions.set(tab, mainContent.scrollTop);
  }
}

/**
 * Restore scroll position for a tab
 */
function restoreScrollPosition(tab) {
  const mainContent = document.getElementById('main-content');
  const savedPosition = scrollPositions.get(tab);
  if (mainContent && savedPosition !== undefined) {
    mainContent.scrollTop = savedPosition;
  }
}

/**
 * Open full map view
 */
export function openFullMap() {
  console.log('🗺️ openFullMap called');
  setState({ activeTab: 'spots', viewMode: 'map' });
  trackPageView('spots-map');
  setTimeout(() => initMap(), 200);
}

/**
 * Toggle theme
 */
export function toggleTheme() {
  actions.toggleTheme();
}

/**
 * Set view mode (list or map)
 */
export function setViewMode(mode) {
  setState({ viewMode: mode });
  if (mode === 'map') {
    setTimeout(() => initMap(), 100);
  }
}

/**
 * Set sub-tab for views with sub-navigation
 */
export function setSubTab(tab) {
  setState({ activeSubTab: tab });
}

/**
 * Set social sub-tab
 */
export function setSocialTab(tab) {
  setState({ socialSubTab: tab });
}

// Register global handlers
export function registerNavigationHandlers() {
  window.changeTab = changeTab;
  window.openFullMap = openFullMap;
  window.toggleTheme = toggleTheme;
  window.setViewMode = setViewMode;
  window.setSubTab = setSubTab;
  window.setSocialTab = setSocialTab;
}

export default {
  changeTab,
  openFullMap,
  toggleTheme,
  setViewMode,
  setSubTab,
  setSocialTab,
  registerNavigationHandlers,
};
