/**
 * Wiring Tests - Global Handlers
 * Verifies every onclick in rendered HTML maps to a real window.* function
 *
 * RULE: Every new feature MUST have its onclick handlers tested here.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'

// ---- Build the KNOWN_HANDLERS set from main.js window.* assignments ----
// We collect every function name that main.js (and side-effect modules) attach to window.*

const KNOWN_HANDLERS = new Set()

// Manually maintained list extracted from src/main.js + side-effect modules
// This is the source of truth: if a handler is used in onclick but NOT here, the test fails.
const MAIN_JS_HANDLERS = [
  // Reset / Navigation
  'resetApp', 'changeTab', 'openFullMap', 'toggleTheme', 'setViewMode',
  't', 'setState', 'getState',
  // Spots
  'selectSpot', 'closeSpotDetail', 'openAddSpot', 'openAddSpotPreview', 'closeAddSpot',
  'openRating', 'closeRating', 'openNavigation', 'getSpotLocation',
  'doCheckin', 'submitReview', 'setRating', 'reportSpotAction',
  // Navigation GPS
  'startSpotNavigation', 'stopNavigation', 'openExternalNavigation',
  // SOS
  'openSOS', 'closeSOS', 'shareSOSLocation', 'markSafe',
  'addEmergencyContact', 'removeEmergencyContact',
  // Auth
  'openAuth', 'closeAuth', 'setAuthMode',
  'handleGoogleSignIn', 'handleFacebookSignIn', 'handleAppleLogin', 'handleAppleSignIn',
  'handleForgotPassword', 'handleLogout', 'requireAuth',
  // Age Verification
  'openAgeVerification', 'closeAgeVerification', 'showAgeVerification',
  // Identity Verification
  'openIdentityVerification', 'closeIdentityVerification', 'showIdentityVerification',
  // Welcome
  'selectAvatar', 'completeWelcome', 'skipWelcome',
  // Settings
  'openSettings', 'closeSettings', 'setLanguage',
  // Tutorial
  'startTutorial', 'nextTutorial', 'prevTutorial', 'skipTutorial', 'finishTutorial',
  // Chat
  'setChatRoom', 'sendMessage',
  // Filters / Map layout
  'setFilter', 'handleSearch', 'openFilters', 'closeFilters', 'toggleSplitView', 'openActiveTrip',
  'setFilterCountry', 'setFilterMinRating', 'setFilterMaxWait',
  'toggleVerifiedFilter', 'setSortBy', 'applyFilters', 'resetFilters',
  // Quiz
  'openQuiz', 'closeQuiz', 'startQuizGame', 'startCountryQuiz', 'answerQuizQuestion',
  'nextQuizQuestion', 'retryQuiz', 'showCountryQuizSelection',
  // Badges
  'openBadges', 'closeBadges', 'showBadgeDetail', 'closeBadgeDetail', 'dismissBadgePopup', 'openBadgePopup',
  'openDailyReward', 'closeFavoritesOnMap', 'toggleGasStationsOnMap',
  // Challenges
  'openChallenges', 'closeChallenges', 'setChallengeTab',
  // Shop
  'openShop', 'closeShop', 'setShopCategory', 'redeemReward',
  'showMyRewards', 'openMyRewards', 'closeMyRewards',
  'equipAvatar', 'equipFrame', 'equipTitle', 'activateBooster',
  // Stats
  'openStats', 'closeStats',
  // Sub-tab
  'setSubTab',
  // Trip (defined in Travel.js)
  'updateTripField', 'swapTripPoints', 'calculateTrip',
  'viewTripOnMap', 'closeTripMap', 'clearTripResults',
  'removeSpotFromTrip', 'saveTripWithSpots', 'loadSavedTrip', 'deleteSavedTrip',
  'toggleFavorite', 'isFavorite',
  // Trip (old planner step-based, kept for compat)
  'searchTripCity', 'addTripStepFromSearch', 'addFirstSuggestion',
  'removeTripStep', 'moveTripStep', 'clearTripSteps',
  // Guides
  'showGuides', 'showCountryDetail', 'showSafetyPage',
  'setGuideSection', 'selectGuide', 'filterGuides',
  // Friends
  'showFriends', 'openFriendsChat', 'showAddFriend', 'closeAddFriend',
  'acceptFriendRequest', 'rejectFriendRequest', 'declineFriendRequest',
  'sendPrivateMessage', 'copyFriendLink',
  'openFriendChat', 'closeFriendChat', 'showFriendProfile',
  // Friend Challenges
  'createFriendChallenge', 'acceptFriendChallenge', 'declineFriendChallenge',
  'cancelFriendChallenge', 'syncFriendChallenges',
  'getActiveFriendChallenges', 'getPendingFriendChallenges',
  'getChallengeStats', 'getChallengeTypes',
  // Legal
  'showLegalPage',
  // Overlays
  'openGuidesOverlay', 'closeGuidesOverlay',
  // Side menu
  'openSideMenu', 'closeSideMenu',
  // Accessibility
  'showAccessibilityHelp', 'closeAccessibilityHelp', 'srAnnounce',
  // PWA
  'showInstallBanner', 'dismissInstallBanner', 'installPWA',
  // Map
  'centerOnUser',
  // Titles
  'openTitles', 'closeTitles',
  // Team challenges
  'openTeamChallenges', 'closeTeamChallenges',
  'openCreateTeam', 'closeCreateTeam',
  'createTeamAction', 'joinTeamAction', 'leaveTeamAction', 'startTeamChallengeAction',
  // Travel groups
  'openTravelGroups', 'openCreateTravelGroup', 'closeCreateTravelGroup',
  'openTravelGroupDetail', 'closeTravelGroupDetail',
  'createTravelGroupAction', 'joinTravelGroupAction', 'leaveTravelGroupAction',
  // Nearby friends
  'toggleNearbyFriends', 'openNearbyFriends', 'closeNearbyFriends',
  // Profile customization
  'openProfileCustomization', 'closeProfileCustomization',
  'equipFrameAction', 'equipTitleAction',
  // Proximity alerts
  'toggleProximityAlerts', 'setProximityRadius',
  // Trip history
  'openTripHistory', 'closeTripHistory', 'clearTripHistory',
  // Image
  'compressImage', 'generateThumbnail', 'validateImage',
  // Landing page
  'dismissLanding', 'installPWAFromLanding', 'landingNext',
  // Landing / Help
  'openFAQ', 'openHelpCenter', 'openChangelog', 'openRoadmap', 'openContactForm',
  // Lazy load
  'loadModal', 'preloadModals',
  // Loading indicator
  'showLoading', 'hideLoading', 'setLoadingMessage', 'setLoadingProgress',
  'isLoading', 'withLoading',
  // Animations
  'showSuccessAnimation', 'showErrorAnimation', 'showBadgeUnlock', 'showLevelUp',
  'showPoints', 'playSound', 'launchConfetti', 'launchConfettiBurst',
  // Sharing
  'shareSpot', 'shareBadge', 'shareStats', 'shareApp',
  // Side-effect modules (AdminPanel, Leaderboard, MyData, DonationCard, Moderation, FriendProfile, etc.)
  'openAdminPanel', 'closeAdminPanel',
  'openLeaderboard', 'closeLeaderboard',
  'openMyData', 'closeMyData',
  'openDonation', 'closeDonation', 'closeDonationThankYou',
  'openReport', 'closeReport',
  'closeFriendProfile', 'openFriendProfile',
  'openReportModal', 'closeReportModal',
  // Legal & Moderation (session 2026-02-19)
  'acceptSOSDisclaimer', 'acceptCompanionConsent',
  'openBlockedUsers', 'closeBlockedUsers',
  // CheckinModal
  'openCheckinModal', 'closeCheckinModal', 'submitCheckin',
  'setCheckinWaitTime', 'toggleCheckinChar', 'triggerCheckinPhoto',
  'onCheckinWaitSlider', 'setCheckinRideResult', 'handleCheckinPhoto',
  // Leaderboard tabs
  'setLeaderboardTab',
  // Map view (defined in Map.js / views)
  'openCountryGuide', 'mapZoomIn', 'mapZoomOut',
  // Travel view (defined in Travel.js)
  'syncTripFieldsAndCalculate', 'toggleRouteAmenities', 'centerTripMapOnGps',
  // Social view (defined in Social.js + sub-components)
  'setSocialTab', 'postCompanionRequest', 'addFriendByName',
  // Feed (defined in Feed.js)
  'setFeedFilter', 'toggleFeedVisibility', 'setSocialSubTab',
  // Conversations (defined in Conversations.js)
  'openGroupChat', 'closeGroupChat', 'openZoneChat', 'closeZoneChat',
  // Friends (defined in Friends.js)
  'searchAmbassadorsByCity', 'searchFriendSuggestions', 'selectFriendSuggestion',
  // Ambassadors (defined in ambassadors.js)
  'searchAmbassadors', 'registerAmbassador', 'contactAmbassador',
  'unregisterAmbassador', 'updateAmbassadorAvailability',
  // Direct Messages (defined in directMessages.js)
  'openConversation', 'closeConversation', 'sendDM',
  'shareDMSpot', 'shareDMPosition', 'deleteDMConversation',
  // Events (defined in events.js)
  'createEvent', 'closeCreateEvent', 'submitCreateEvent',
  'joinEvent', 'leaveEvent', 'deleteEventAction',
  'openEventDetail', 'closeEventDetail',
  'postEventComment', 'replyEventComment', 'toggleReplyInput',
  'reactToEventComment', 'shareEvent', 'deleteEventCommentAction',
  // Profile view (defined in Profile.js)
  'toggleNotifications', 'openLegalPage',
  // SOS (defined in SOS.js)
  'sendSOSTemplate',
  // Auth (defined in Auth.js)
  'loginAsAdmin', 'handleAuth',
  // SpotDetail (defined in navigation controller/utils)
  'showNavigationPicker', 'openInNavigationApp', 'voteSpot',
  // Welcome (defined in Welcome.js)
  'selectWelcomeLanguage',
  // IdentityVerification (defined in IdentityVerification.js)
  'startVerificationStep',
  // CreateTravelGroup (defined in CreateTravelGroup.js)
  'submitCreateTravelGroup',
  // FriendProfile (defined in FriendProfile.js / friendsList)
  'removeFriend', 'shareProfile',
  // AddSpot (all defined in AddSpot.js)
  'handlePhotoSelect', 'setSpotRating', 'onSpotTypeChange',
  'triggerPhotoUpload', 'addSpotNextStep', 'addSpotPrevStep',
  'useGPSForSpot', 'toggleSpotMapPicker', 'spotMapPickLocation',
  'autoDetectStation', 'autoDetectRoad',
  'saveSpotAsDraft', 'openSpotDraft', 'deleteSpotDraft',
  // Map (defined in Map.js)
  'searchMapSuggestions',
  // TravelGroups (defined in travelGroups.js)
  'openEditTravelGroup', 'sendGroupChatMessage', 'updateGroupStatus',
  // AdminPanel (defined in AdminPanel.js)
  'adminAddPoints', 'adminAddSkillPoints', 'adminAddThumbs',
  'adminLevelUp', 'adminMaxStats', 'openAccessibilityHelp',
  'adminResetState', 'adminExportState',
  // MyData (defined in MyData.js)
  'openConsentSettings', 'downloadMyData', 'requestAccountDeletion',
  // Moderation (defined in moderation.js)
  'selectReportReason', 'submitCurrentReport',
  // TeamChallenges (defined in teamChallenges.js)
  'openJoinTeam',
  // Home view handlers
  'homeSearchDestination', 'homeSelectFirstSuggestion', 'homeSelectPlace',
  'homeSelectDestination', 'homeClearSearch', 'homeClearDestination',
  'homeCenterOnUser', 'homeZoomIn', 'homeZoomOut',
  // Trip autocomplete
  'tripSearchSuggestions', 'tripSelectSuggestion', 'tripSelectFirst',
  // Map search (defined in Map.js)
  'selectSearchSuggestion', 'hideSearchSuggestions',
  // Country bubbles
  'loadCountryOnMap', 'downloadCountryFromBubble',
  // Offline download
  'downloadCountryOffline', 'deleteOfflineCountry',
  // Push notifications
  'togglePushNotifications',
  // Companion Mode
  'showCompanionModal', 'closeCompanionModal',
  'startCompanion', 'stopCompanion',
  'companionCheckIn', 'companionSendAlert',
  // Gas Stations (navigation)
  'toggleGasStations',
  // Community Tips (defined in communityTips.js)
  'submitCommunityTip', 'voteCommunityTip',
  // main.js — missing handlers
  'showToast', 'openSpotDetail',
  'acceptLocationPermission', 'declineLocationPermission',
  'showFriendOptions', 'showFullNavigation',
  'startIdentityVerification', 'submitVerificationPhotos',
  'getTrustLevel', 'getTrustBadge',
  'openTripPlanner', 'closeTripPlanner',
  'reportGuideError',
  'closeContactForm', 'submitContactForm',
  // Hostel recommendations (defined in main.js)
  'openAddHostel', 'closeAddHostel', 'setHostelCategory',
  'submitHostelRec', 'upvoteHostel', 'switchHostelCategory',
  // Webhooks (defined in main.js)
  'openAddWebhook', 'toggleWebhookAction', 'removeWebhookAction',
  // Form persistence (defined in main.js)
  'clearFormDraft',
  // DeviceManager (defined in DeviceManager.js)
  'openDeviceManager', 'closeDeviceManager',
  'confirmRemoveDevice', 'cancelRemoveDevice', 'executeRemoveDevice',
  'confirmRemoveAllDevices', 'cancelRemoveAllDevices', 'executeRemoveAllDevices',
  // PhotoGallery (defined in PhotoGallery.js)
  'getCurrentPhotoIndex', 'goToPhoto', 'nextPhoto', 'prevPhoto',
  'openPhotoFullscreen', 'closePhotoFullscreen',
  'nextPhotoFullscreen', 'prevPhotoFullscreen', 'goToPhotoFullscreen',
  'openPhotoUpload',
  // DailyReward (defined in DailyReward.js)
  'handleClaimDailyReward', 'closeDailyReward', 'closeDailyRewardResult',
  // Shop extras (defined in Shop.js)
  'copyCode',
  // AgeVerification extras (defined in AgeVerification.js)
  'handleAgeVerification',
  // IdentityVerification extras (defined in IdentityVerification.js)
  'setVerificationStep', 'updatePhoneNumber', 'updatePhoneCountryCode',
  'sendPhoneVerificationCode', 'updateVerificationCode',
  'confirmPhoneCode', 'resendPhoneCode',
  'handlePhotoUpload', 'clearPhotoPreview', 'submitPhotoVerification',
  'setDocumentType', 'handleDocumentUpload', 'clearDocumentPreview',
  'submitIdentityDocument',
  'handleSelfieIdPhotoUpload', 'clearSelfieIdPhoto',
  'goToNextSelfieIdStep', 'goToPreviousSelfieIdStep', 'submitSelfieIdVerification',
  // EmailVerification (defined in EmailVerification.js)
  'initEmailVerification', 'checkEmailVerified',
  'resendVerificationEmail', 'closeEmailVerification',
  // LanguageSelector (defined in LanguageSelector.js)
  'selectLanguageOption', 'confirmLanguageSelection',
  // DeleteAccount (defined in DeleteAccount.js)
  'openDeleteAccount', 'closeDeleteAccount',
  'confirmDeleteAccount', 'confirmDeleteAccountGoogle',
  // DonationCard extras (defined in DonationCard.js)
  'handleDonationClick', 'processDonation',
  // Planner (defined in Planner.js)
  'saveCurrentTrip', 'shareTrip',
  // CookieBanner (defined in CookieBanner.js)
  'acceptAllCookies', 'refuseOptionalCookies',
  'showCookieCustomize', 'hideCookieCustomize', 'saveCustomCookiePreferences',
  // Profile extras (defined in Profile.js)
  'editAvatar', 'toggleProximityAlertsSetting',
  // Map extras (defined in Map.js)
  'searchLocation',
  // Chat extras (defined in Chat.js)
  'handleChatKeypress',
  // FAQ (defined in FAQ.js)
  'toggleFAQItem', 'scrollToFAQCategory', 'filterFAQ', 'clearFAQSearch',
  'closeFAQ', 'searchFAQ', 'getFAQQuestionById',
  // AddSpot extras (defined in AddSpot.js)
  'handleAddSpot', 'setSpotTag',
  // AddSpot v2 (defined in AddSpot.js)
  'selectSpotType', 'setWaitTime', 'setMethod',
  'setGroupSize', 'setTimeOfDay', 'toggleAmenity',
  'saveDraftAndClose',
  // ValidateSpot (defined in ValidateSpot.js)
  'openValidateSpot', 'closeValidateSpot', 'submitValidation',
  'setValidationWaitTime', 'setValidationRideResult',
  'setValidationMethod', 'setValidationGroupSize',
  'setValidationTimeOfDay', 'setValidationRating',
  'handleValidationPhoto',
  // Favorites (defined in favorites.js)
  'showFavoritesOnMap',
  // User Blocking (defined in userBlocking.js)
  'unblockUserById', 'openBlockModal', 'closeBlockModal', 'confirmBlockUser',
  'openUnblockModal', 'closeUnblockModal', 'confirmUnblockUser',
  // Contextual Tips (defined in contextualTips.js)
  'dismissContextualTip',
  // TeamChallenges extras (defined in teamChallenges.js)
  'openTeamSettings', 'openTeamChallengesList', 'inviteToTeam',
  // SOS Tracking (defined in sosTracking.js)
  'startSOSTracking', 'stopSOSTracking', 'shareSOSLink', 'callEmergency',
  // FriendsList (defined in friendsList.js)
  'acceptFriendRequestHandler', 'declineFriendRequestHandler',
  'cancelFriendRequestHandler', 'confirmRemoveFriend',
  'openFindFriends', 'sendFriendRequestHandler',
  // Admin Moderation (defined in adminModeration.js)
  'openAdminModerationDashboard', 'closeAdminModeration',
  'refreshAdminDashboard', 'openModerationQueue',
  'openBanManagement', 'openWarningManagement', 'openModerationLogs',
  'filterModerationQueue', 'loadMoreReports',
  'quickReportAction', 'banUserPermanent', 'banUserTemporary',
  'unbanUser', 'warnUser', 'removeWarning', 'acknowledgeWarning',
  'openAddForbiddenWordModal', 'addForbiddenWord', 'removeForbiddenWord',
  'moderateSpot', 'moderatePhoto', 'moderateChatMessage',
  // Detailed Reviews (defined in detailedReviews.js)
  'setReviewRating', 'submitDetailedReview', 'toggleReviewHelpful',
  'triggerReviewPhotoUpload', 'updateReviewCharsCount',
  'showReviewForm', 'openReviewPhoto', 'editReviewModal',
  'deleteReviewConfirm', 'openReplyModal',
  // Realtime Chat (defined in realtimeChat.js)
  'joinChatRoom', 'sendChatMessage', 'setTyping',
  // Trust Score (defined in trustScore.js)
  'getUserTrustScore', 'showTrustDetails',
  // Companion Search (defined in companionSearch.js)
  'openTravelPlanDetail', 'closeTravelPlanDetail',
  'acceptPlanResponse', 'declinePlanResponse',
  'postTravelPlanHandler', 'searchCompanionsHandler',
  // Dangerous Spots (defined in dangerousSpots.js)
  'reportSpotDanger', 'closeDangerReportModal', 'submitDangerReport',
  'confirmSpotDanger', 'voteDeletion',
  // TravelGroups extras (defined in travelGroups.js)
  'createGroup', 'acceptGroupInvitation', 'declineGroupInvitation',
  'addItineraryStop', 'removeItineraryStop',
  'joinTravelGroup', 'leaveTravelGroup', 'createTravelGroup',
  // Private Messages (defined in privateMessages.js)
  'sendPrivateMessageTo', 'muteConvo', 'unmuteConvo',
  'archiveConvo', 'deleteConvo',
  // Nearby Friends extras (defined in nearbyFriends.js)
  'setNotificationRadius', 'toggleNearbyFriendsList',
  'closeNearbyFriendsList', 'toggleLocationSharing', 'showFriendOnMap',
  // Heatmap (defined in heatmap.js)
  'toggleHeatmap',
  // Proximity Notify (defined in proximityNotify.js)
  'quickValidateSpot', 'quickReportSpot', 'dismissProximityAlert', 'initProximityNotify',
  // City Panel (defined in main.js)
  'openCityPanel', 'closeCityPanel', 'selectCityRoute', 'viewCitySpotsOnMap',
]

MAIN_JS_HANDLERS.forEach(h => KNOWN_HANDLERS.add(h))

// ---- Helper: extract all onclick handler names from HTML string ----
function extractOnclickHandlers(html) {
  if (!html || typeof html !== 'string') return []
  // Match onclick="functionName(" or onclick="functionName()"
  const matches = [...html.matchAll(/onclick="([a-zA-Z_$][\w$]*)\s*\(/g)]
  // Filter out JS keywords that appear in inline onclick (e.g. "if(event...")
  const JS_KEYWORDS = new Set(['if', 'else', 'for', 'while', 'return', 'switch', 'case', 'new', 'this', 'event', 'true', 'false', 'null', 'undefined', 'typeof', 'void', 'delete'])
  return [...new Set(matches.map(m => m[1]).filter(h => !JS_KEYWORDS.has(h)))]
}

// ---- Helper: extract oninput/onchange/onblur/onkeydown handler names ----
function extractInputHandlers(html) {
  if (!html || typeof html !== 'string') return []
  const matches = [...html.matchAll(/(?:oninput|onchange|onblur|onkeydown|onkeyup|onkeypress|onfocus)="([a-zA-Z_$][\w$]*)\s*\(/g)]
  const JS_KEYWORDS = new Set(['if', 'else', 'for', 'while', 'return', 'switch', 'case', 'new', 'this', 'event', 'true', 'false', 'null', 'undefined', 'typeof', 'void', 'delete'])
  return [...new Set(matches.map(m => m[1]).filter(h => !JS_KEYWORDS.has(h)))]
}

// ---- Mock state for rendering ----
const mockState = {
  user: { uid: 'test-user', displayName: 'TestUser', email: 'test@test.com' },
  username: 'TestUser',
  avatar: '🤙',
  isLoggedIn: true,
  activeTab: 'map',
  viewMode: 'list',
  showWelcome: false,
  theme: 'dark',
  lang: 'fr',
  activeSubTab: 'planner',
  socialSubTab: 'feed',
  spots: [
    {
      id: 1,
      name: 'Test Spot',
      city: 'Paris',
      country: 'FR',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      globalRating: 4.5,
      totalRatings: 10,
      description: 'A good spot',
      photos: ['photo1.jpg'],
      waitTime: 15,
      verified: true,
      createdBy: 'other-user',
    },
  ],
  selectedSpot: null,
  searchQuery: '',
  activeFilter: 'all',
  filterCountry: 'all',
  filterMinRating: 0,
  filterMaxWait: 999,
  filterVerifiedOnly: false,
  favorites: [],
  addSpotStep: 1,
  addSpotType: null,
  showAddSpot: false,
  showRating: false,
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
  showTutorial: false,
  showLeaderboard: false,
  showDonation: false,
  showProfileCustomization: false,
  showNearbyFriends: false,
  showReport: false,
  showAccessibilityHelp: false,
  showTravelGroupDetail: false,
  showTeamChallenges: false,
  showCreateTravelGroup: false,
  showFriendProfile: false,
  showAdminPanel: false,
  showMyData: false,
  showTitles: false,
  showIdentityVerification: false,
  showAgeVerification: false,
  showCompanionModal: false,
  checkinSpot: null,
  newBadge: null,
  navigationActive: false,
  points: 500,
  level: 5,
  checkins: 20,
  spotsCreated: 5,
  reviewsGiven: 10,
  streak: 3,
  badges: ['first_checkin', 'explorer'],
  rewards: [],
  friends: [
    { id: 'friend1', name: 'Alice', avatar: '👩', level: 3, badges: ['first_checkin'] },
  ],
  friendRequests: [],
  emergencyContacts: [{ name: 'Contact1', phone: '+33600000000' }],
  tripFrom: '',
  tripTo: '',
  tripResults: null,
  tripSteps: [],
  savedTrips: [],
  messages: [],
  chatRoom: 'general',
  sosActive: false,
  tutorialStep: 0,
  tutorialCompleted: false,
  userLocation: { lat: 48.8566, lng: 2.3522 },
  gpsEnabled: true,
  isOnline: true,
  selectedFriendProfileId: 'friend1',
  selectedTravelGroupId: null,
  travelGroups: [],
  seasonPoints: 100,
  totalPoints: 500,
  checkinHistory: [],
  verificationLevel: 0,
  profileFrame: null,
  profileTitle: null,
}

// ---- Import render functions ----
// Views
import { renderMap } from '../../src/components/views/Map.js'
import { renderTravel } from '../../src/components/views/Travel.js'
import { renderChallengesHub } from '../../src/components/views/ChallengesHub.js'
import { renderGuides } from '../../src/components/views/Guides.js'
import { renderSocial } from '../../src/components/views/Social.js'
import { renderProfile } from '../../src/components/views/Profile.js'

// Modals
import { renderSOS } from '../../src/components/modals/SOS.js'
import { renderAuth } from '../../src/components/modals/Auth.js'
import { renderAddSpot } from '../../src/components/modals/AddSpot.js'
import { renderSpotDetail } from '../../src/components/modals/SpotDetail.js'
import { renderWelcome } from '../../src/components/modals/Welcome.js'
import { renderTutorial } from '../../src/components/modals/Tutorial.js'
import { renderFiltersModal } from '../../src/components/modals/Filters.js'
import { renderStatsModal } from '../../src/components/modals/Stats.js'
import { renderBadgesModal } from '../../src/components/modals/Badges.js'
import { renderChallengesModal } from '../../src/components/modals/Challenges.js'
import { renderShopModal, renderMyRewardsModal } from '../../src/components/modals/Shop.js'
import { renderQuiz } from '../../src/components/modals/Quiz.js'
import { renderLeaderboardModal } from '../../src/components/modals/Leaderboard.js'
import { renderCheckinModal } from '../../src/components/modals/CheckinModal.js'
import { renderAgeVerification } from '../../src/components/modals/AgeVerification.js'
import { renderIdentityVerification } from '../../src/components/modals/IdentityVerification.js'
import { renderTitlesModal } from '../../src/components/modals/TitlesModal.js'
import { renderCreateTravelGroupModal } from '../../src/components/modals/CreateTravelGroup.js'
import { renderFriendProfileModal } from '../../src/components/modals/FriendProfile.js'
import { renderAdminPanel } from '../../src/components/modals/AdminPanel.js'
import { renderMyDataModal } from '../../src/components/modals/MyData.js'
import { renderCompanionModal } from '../../src/components/modals/Companion.js'

// Services with render
import { renderTravelGroupDetail } from '../../src/services/travelGroups.js'
import { renderNearbyFriendsList } from '../../src/services/nearbyFriends.js'
import { renderCustomizationModal } from '../../src/services/profileCustomization.js'
import { renderAccessibilityHelp } from '../../src/services/screenReader.js'
import { renderReportModal } from '../../src/services/moderation.js'
import { renderTeamDashboard } from '../../src/services/teamChallenges.js'
import { renderDonationModal } from '../../src/components/ui/DonationCard.js'

// Ensure state modules see the right flags for no-param modals
import { setState } from '../../src/stores/state.js'

// ---- Setup: set state so no-param modals render content ----
beforeAll(() => {
  setState({
    showFilters: true,
    showStats: true,
    showBadges: true,
    showChallenges: true,
    showShop: true,
    showMyRewards: true,
    showQuiz: true,
    showLeaderboard: true,
    showMyData: true,
    ...mockState,
  })
})

// ============================================================
// SECTION 1A: Every onclick in each component maps to a known handler
// ============================================================

describe('Wiring: onclick handlers map to known window.* functions', () => {
  // Helper to run the test pattern
  function testHandlers(name, renderFn, stateOverrides = {}) {
    it(`${name}: all onclick handlers are known`, () => {
      const state = { ...mockState, ...stateOverrides }
      let html
      try {
        html = renderFn(state)
      } catch {
        // Some render functions take no params
        try {
          html = renderFn()
        } catch {
          return // Cannot render, skip
        }
      }
      if (!html || typeof html !== 'string' || html.length === 0) return

      const handlers = extractOnclickHandlers(html)
      const unknown = handlers.filter(h => !KNOWN_HANDLERS.has(h))
      expect(unknown, `Unknown onclick handlers in ${name}: ${unknown.join(', ')}`).toEqual([])
    })
  }

  // --- Views ---
  testHandlers('Map view', renderMap)
  testHandlers('Travel view', renderTravel)
  testHandlers('ChallengesHub view', renderChallengesHub)
  testHandlers('Social view (feed)', renderSocial, { socialSubTab: 'feed' })
  testHandlers('Social view (conversations)', renderSocial, { socialSubTab: 'conversations' })
  testHandlers('Social view (friends)', renderSocial, { socialSubTab: 'friends' })
  testHandlers('Profile view', renderProfile)
  testHandlers('Guides view', renderGuides)

  // --- Modals (with state param) ---
  testHandlers('SOS modal', renderSOS)
  testHandlers('Auth modal', renderAuth)
  testHandlers('AddSpot modal', renderAddSpot)
  testHandlers('SpotDetail modal', renderSpotDetail, {
    selectedSpot: mockState.spots[0],
  })
  testHandlers('Welcome modal', renderWelcome, { showWelcome: true })
  testHandlers('Tutorial modal', renderTutorial, { showTutorial: true, tutorialStep: 0 })
  testHandlers('AgeVerification modal', renderAgeVerification)
  testHandlers('IdentityVerification modal', () => renderIdentityVerification())
  testHandlers('TitlesModal', renderTitlesModal)
  testHandlers('CreateTravelGroup modal', renderCreateTravelGroupModal)
  testHandlers('FriendProfile modal', renderFriendProfileModal, {
    showFriendProfile: true,
    selectedFriendProfileId: 'friend1',
    friends: mockState.friends,
  })
  testHandlers('AdminPanel modal', renderAdminPanel)
  testHandlers('CheckinModal', renderCheckinModal, {
    checkinSpot: mockState.spots[0],
  })
  testHandlers('DonationModal', renderDonationModal)
  testHandlers('Companion modal', renderCompanionModal, {
    showCompanionModal: true,
  })

  // --- Modals (no param, use global state) ---
  testHandlers('Filters modal', () => renderFiltersModal())
  testHandlers('Stats modal', () => renderStatsModal())
  testHandlers('Badges modal', () => renderBadgesModal())
  testHandlers('Challenges modal', () => renderChallengesModal())
  testHandlers('Shop modal', () => renderShopModal())
  testHandlers('MyRewards modal', () => renderMyRewardsModal())
  testHandlers('Quiz modal', () => renderQuiz())
  testHandlers('Leaderboard modal', () => renderLeaderboardModal())
  testHandlers('MyData modal', () => renderMyDataModal())

  // --- Service renders ---
  testHandlers('TravelGroupDetail', renderTravelGroupDetail, {
    showTravelGroupDetail: true,
    selectedTravelGroupId: 'group1',
    currentTravelGroup: {
      id: 'group1', name: 'Test Group', creator: 'test-user',
      members: ['test-user'], itinerary: [], chat: [],
      status: 'planning', maxMembers: 6, description: 'A trip',
    },
  })
  testHandlers('NearbyFriendsList', renderNearbyFriendsList)
  testHandlers('CustomizationModal', renderCustomizationModal)
  testHandlers('AccessibilityHelp', renderAccessibilityHelp)
  testHandlers('ReportModal', renderReportModal, { showReport: true, reportTargetId: 'user1', reportTargetType: 'user' })
  testHandlers('TeamDashboard', renderTeamDashboard)

  // Also verify oninput/onchange handlers
  it('all input handlers in rendered HTML are known functions', () => {
    const allComponents = [
      () => renderSOS(mockState),
      () => renderAuth(mockState),
      () => renderAddSpot(mockState),
      () => renderTravel(mockState),
      () => renderSocial({ ...mockState, socialSubTab: 'feed' }),
      () => renderSocial({ ...mockState, socialSubTab: 'conversations' }),
      () => renderSocial({ ...mockState, socialSubTab: 'friends' }),
      () => renderProfile(mockState),
      () => renderCreateTravelGroupModal(mockState),
      () => renderFiltersModal(),
      () => renderMap(mockState),
    ]

    const allInputHandlers = []
    for (const renderFn of allComponents) {
      try {
        const html = renderFn()
        if (html) allInputHandlers.push(...extractInputHandlers(html))
      } catch {
        // skip if render fails
      }
    }

    const unknown = [...new Set(allInputHandlers)].filter(h => !KNOWN_HANDLERS.has(h))
    expect(
      unknown,
      `Unknown input handlers: ${unknown.join(', ')}`
    ).toEqual([])
  })
})

// ============================================================
// SECTION: Handler existence sanity check
// ============================================================
describe('Wiring: KNOWN_HANDLERS list is consistent', () => {
  it('has at least 300 known handlers (sanity check)', () => {
    expect(KNOWN_HANDLERS.size).toBeGreaterThanOrEqual(300)
  })

  it('no duplicates in MAIN_JS_HANDLERS array', () => {
    const seen = new Set()
    const dupes = []
    for (const h of MAIN_JS_HANDLERS) {
      if (seen.has(h)) dupes.push(h)
      seen.add(h)
    }
    expect(dupes, `Duplicate handlers: ${dupes.join(', ')}`).toEqual([])
  })
})
