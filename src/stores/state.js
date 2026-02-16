/**
 * SpotHitch State Management
 * Reactive state store with localStorage persistence
 */

import { Storage } from '../utils/storage.js';

// Initial state
const initialState = {
  // User
  user: null,
  username: '',
  avatar: '🤙',
  isLoggedIn: false,

  // UI
  activeTab: 'map',
  viewMode: 'list',
  showWelcome: true,
  theme: 'dark',
  lang: 'fr',
  activeSubTab: 'planner',
  socialSubTab: 'feed',
  chatSubTab: 'zones',
  groupSubTab: 'mine',
  eventSubTab: 'upcoming',
  feedFilter: 'all',
  activeGroupChat: null,
  showZoneChat: false,
  ambassadorSearchQuery: '',
  companionRequests: [],

  // Spots
  spots: [],
  selectedSpot: null,
  searchQuery: '',
  activeFilter: 'all',
  filterCountry: 'all',
  filterMinRating: 0,
  filterMaxWait: 999,

  // Favorites
  favorites: [],
  favoritesSort: 'date',
  showFavoritesOnMap: false,

  // Map layout
  splitView: false,

  // Modals
  showAddSpot: false,
  showRating: false,
  showTripPlanner: false,
  showSOS: false,
  showSettings: false,
  showQuiz: false,
  showAuth: false,
  showFilters: false,
  showStats: false,
  showBadges: false,
  showChallenges: false,
  showShop: false,
  showMyRewards: false,
  showSideMenu: false,
  showIdentityVerification: false,
  showCompanionModal: false,
  showGuidesOverlay: false,
  guideSection: 'start',

  // Checkin Modal
  checkinSpot: null,
  checkinWaitTime: null,
  checkinChars: {},
  checkinPhotoData: null,

  // New badges/challenges
  newBadge: null,
  selectedCountryGuide: null,
  selectedFriendChat: null,

  // Trip Planner
  tripSteps: [],
  activeTrip: null,
  savedTrips: [],
  tripRoute: null,
  tripFrom: '',
  tripTo: '',
  tripResults: null,
  showTripMap: false,
  tripLoading: false,
  showRouteAmenities: false,
  routeAmenities: [],
  loadingRouteAmenities: false,
  searchCountry: null,

  // Gamification
  points: 0,
  level: 1,
  checkins: 0,
  spotsCreated: 0,
  reviewsGiven: 0,
  badges: [],
  rewards: [],

  // Chat & Social
  chatRoom: 'general',
  messages: [],
  friends: [],
  friendRequests: [],
  privateMessages: {},
  unreadFriendMessages: 0,

  // Friend Challenges (#157)
  friendChallenges: [],
  activeChallenges: [],
  pendingChallenges: [],

  // Guilds (#162)
  guilds: [],
  myGuildId: null,

  // Season/Leagues
  seasonPoints: 0,
  totalPoints: 0,

  // SOS
  sosActive: false,
  emergencyContacts: [],

  // Location
  userLocation: null,
  gpsEnabled: false,
  showLocationPermission: false,
  locationPermissionChoice: 'unknown', // 'granted' | 'denied' | 'unknown'

  // Tutorial
  showTutorial: false, // Will be set true only if tutorialCompleted is false on first load
  tutorialStep: 0,
  tutorialCompleted: false,

  // Check-in history
  checkinHistory: [],
  checkinHistoryFilter: 'all',
  checkinDisplayLimit: 20,

  // Identity Verification (#190) - Progressive Trust System (0-5)
  verificationLevel: 0, // 0: unverified, 1: email, 2: phone, 3: selfie+ID submitted, 4: ID verified, 5: trusted member
  trustLevel: 0, // Alias for verificationLevel
  pendingPhoneVerification: null,
  pendingPhotoVerification: null,
  pendingIdentityVerification: null,
  pendingSelfieIdVerification: null,
  verifiedPhone: null,
  verifiedPhotoUrl: null,
  identityVerifiedAt: null,
  selfieIdVerifiedAt: null,

  // GPS Navigation
  gasStations: [],
  showGasStationsOnMap: false,

  // Loading states
  isLoading: false,
  isLoadingSpots: false,
  isOnline: navigator.onLine,
};

// State subscribers
const subscribers = new Set();

// Create reactive state
let state = { ...initialState };

// Load persisted state from storage
function loadPersistedState() {
  const persisted = Storage.get('state');
  if (persisted) {
    // Merge persisted state with initial state (to add any new properties)
    state = { ...initialState, ...persisted };

    // For new users who haven't completed the tutorial, show it automatically
    // But only if they haven't explicitly skipped it (showTutorial would be false in that case)
    if (!state.tutorialCompleted && state.showWelcome) {
      state.showTutorial = true;
    }
  } else {
    // Brand new user - show tutorial
    state.showTutorial = true;
  }
}

// Save state to storage
function persistState() {
  const stateToPersist = {
    username: state.username,
    avatar: state.avatar,
    theme: state.theme,
    lang: state.lang,
    showWelcome: state.showWelcome,
    showTutorial: state.showTutorial,
    tutorialCompleted: state.tutorialCompleted,
    points: state.points,
    level: state.level,
    checkins: state.checkins,
    spotsCreated: state.spotsCreated,
    reviewsGiven: state.reviewsGiven,
    badges: state.badges,
    rewards: state.rewards,
    savedTrips: state.savedTrips,
    emergencyContacts: state.emergencyContacts,
    favorites: state.favorites,
    favoritesSort: state.favoritesSort,
    checkinHistory: state.checkinHistory,
    verificationLevel: state.verificationLevel,
    trustLevel: state.trustLevel || state.verificationLevel,
    verifiedPhone: state.verifiedPhone,
    identityVerifiedAt: state.identityVerifiedAt,
    selfieIdVerifiedAt: state.selfieIdVerifiedAt,
    messages: (state.messages || []).slice(-100),
    privateMessages: state.privateMessages || {},
    friends: state.friends || [],
    travelGroups: state.travelGroups || [],
  };
  Storage.set('state', stateToPersist);
}

// Notify all subscribers of state change
function notifySubscribers() {
  subscribers.forEach(callback => {
    try {
      callback(state);
    } catch (error) {
      console.error('Subscriber error:', error);
    }
  });
}

/**
 * Get current state (read-only snapshot)
 */
export function getState() {
  return { ...state };
}

/**
 * Update state with partial updates
 * @param {Partial<typeof initialState>} updates - State updates
 */
export function setState(updates) {
  state = { ...state, ...updates };
  notifySubscribers();
  persistState();
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Called when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.add(callback);
  // Call immediately with current state
  callback(state);
  // Return unsubscribe function
  return () => subscribers.delete(callback);
}

/**
 * Reset state to initial values
 */
export function resetState() {
  state = { ...initialState };
  Storage.remove('state');
  notifySubscribers();
}

// Actions
export const actions = {
  // Navigation
  changeTab(tab) {
    setState({ activeTab: tab, selectedSpot: null });
  },

  // Theme
  toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setState({ theme: newTheme });
    document.body.classList.toggle('light-theme', newTheme === 'light');
  },

  // Language
  setLanguage(lang) {
    setState({ lang });
  },

  // Spots
  setSpots(spots) {
    setState({ spots, isLoadingSpots: false });
  },

  selectSpot(spot) {
    setState({ selectedSpot: spot });
  },

  setFilter(filter) {
    setState({ activeFilter: filter });
  },

  setSearchQuery(query) {
    setState({ searchQuery: query });
  },

  // User
  setUser(user) {
    setState({
      user,
      isLoggedIn: !!user,
      username: user?.displayName || state.username,
    });
  },

  updateProfile(updates) {
    setState({
      username: updates.username || state.username,
      avatar: updates.avatar || state.avatar,
      showWelcome: false,
    });
  },

  // Gamification
  addPoints(amount) {
    const newPoints = state.points + amount;
    const newLevel = Math.floor(newPoints / 100) + 1;
    setState({
      points: newPoints,
      level: Math.max(state.level, newLevel),
    });
  },

  incrementCheckins() {
    setState({
      checkins: state.checkins + 1,
    });
    actions.addPoints(5);
  },

  incrementSpotsCreated() {
    setState({
      spotsCreated: state.spotsCreated + 1,
    });
    actions.addPoints(20);
  },

  incrementReviews() {
    setState({
      reviewsGiven: state.reviewsGiven + 1,
    });
    actions.addPoints(10);
  },

  addBadge(badge) {
    if (!state.badges.includes(badge)) {
      setState({
        badges: [...state.badges, badge],
      });
      actions.addPoints(50);
    }
  },

  // Trips
  setTripSteps(steps) {
    setState({ tripSteps: steps });
  },

  saveTrip(trip) {
    setState({
      savedTrips: [...state.savedTrips, trip],
    });
  },

  // SOS
  toggleSOS() {
    setState({ sosActive: !state.sosActive });
  },

  addEmergencyContact(contact) {
    setState({
      emergencyContacts: [...state.emergencyContacts, contact],
    });
  },

  // Tutorial
  nextTutorialStep() {
    if (state.tutorialStep < 7) {
      setState({ tutorialStep: state.tutorialStep + 1 });
    } else {
      setState({ showTutorial: false, tutorialStep: 0 });
    }
  },

  prevTutorialStep() {
    if (state.tutorialStep > 0) {
      setState({ tutorialStep: state.tutorialStep - 1 });
    }
  },

  skipTutorial() {
    setState({ showTutorial: false, tutorialStep: 0 });
  },

  // Location
  setUserLocation(location) {
    setState({
      userLocation: location,
      gpsEnabled: !!location,
    });
    // Record in location history for proximity verification
    if (location?.lat && location?.lng) {
      import('../services/proximityVerification.js').then(({ recordLocation }) => {
        recordLocation(location)
      }).catch(() => {})
    }
  },

  // Online status
  setOnlineStatus(isOnline) {
    setState({ isOnline });
  },

  // Check-in history
  addCheckinToHistory(checkinData) {
    const checkinHistory = state.checkinHistory || [];
    const newCheckin = {
      id: `checkin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...checkinData,
      timestamp: checkinData.timestamp || new Date().toISOString(),
    };
    setState({
      checkinHistory: [newCheckin, ...checkinHistory],
    });
    return newCheckin;
  },
};

// Initialize state on load
loadPersistedState();

// Apply theme on load
if (state.theme === 'light') {
  document.body.classList.add('light-theme');
}

// Listen to online/offline events
window.addEventListener('online', () => actions.setOnlineStatus(true));
window.addEventListener('offline', () => actions.setOnlineStatus(false));

// Export default state object for backward compatibility
export default state;
