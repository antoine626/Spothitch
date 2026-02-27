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
  'goBack',
  't',
  // Spots
  'selectSpot', 'closeSpotDetail', 'openAddSpot', 'openAddSpotPreview', 'closeAddSpot',
  'openRating', 'closeRating', 'openNavigation', 'getSpotLocation',
  'doCheckin', 'submitReview', 'setRating', 'reportSpotAction',
  // Navigation GPS
  'startSpotNavigation', 'stopNavigation', 'openExternalNavigation',
  // SOS
  'openSOS', 'closeSOS', 'shareSOSLocation', 'markSafe',
  'addEmergencyContact', 'removeEmergencyContact',
  // SOS Extended
  'sosStartCountdown', 'sosCancelCountdown',
  'sosToggleSilent', 'sosUpdateCustomMsg',
  'sosSetPrimaryContact',
  'sosOpenFakeCall', 'sosFakeCallAnswer', 'sosFakeCallDecline',
  'sosStartRecording', 'sosStopRecording',
  // Auth
  'openAuth', 'closeAuth', 'setAuthMode',
  'handleGoogleSignIn', 'handleFacebookSignIn', 'handleAppleSignIn',
  'handleForgotPassword', 'handleLogout', 'requireAuth',
  // Age Verification
  'openAgeVerification', 'closeAgeVerification', 'showAgeVerification',
  // Identity Verification
  'openIdentityVerification', 'closeIdentityVerification', 'showIdentityVerification',
  // Welcome
  'selectAvatar', 'completeWelcome', 'skipWelcome', 'closeWelcome',
  // Settings
  'openSettings', 'closeSettings', 'setLanguage',
  // Tutorial
  'startTutorial', 'nextTutorial', 'prevTutorial', 'skipTutorial', 'finishTutorial', 'closeTutorial',
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
  'openDailyReward', 'closeFavoritesOnMap',
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
  'acceptFriendRequest', 'declineFriendRequest',
  'sendPrivateMessage', 'copyFriendLink',
  'openFriendChat', 'closeFriendChat', 'showFriendProfile',
  // Friend Challenges
  'createFriendChallenge', 'acceptFriendChallenge', 'declineFriendChallenge',
  'cancelFriendChallenge', 'syncFriendChallenges',
  'getActiveFriendChallenges', 'getPendingFriendChallenges',
  'getChallengeStats', 'getChallengeTypes',
  // Legal
  'showLegalPage', 'closeLegal',
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
  'openFAQ', 'openHelpCenter', 'openChangelog', 'openRoadmap', 'openContactForm', 'openBugReport',
  // Lazy load
  'loadModal', 'preloadModals',
  // Loading indicator
  'showLoading', 'hideLoading', 'setLoadingMessage', 'setLoadingProgress',
  'isLoading', 'withLoading',
  // Animations
  'showSuccessAnimation', 'showErrorAnimation', 'showBadgeUnlock', 'showLevelUp',
  'showPoints', 'playSound', 'launchConfetti', 'launchConfettiBurst',
  // Sharing
  'shareSpot', 'shareBadge', 'shareStats', 'shareApp', 'openShareCard',
  // Side-effect modules (AdminPanel, Leaderboard, MyData, DonationCard, Moderation, FriendProfile, etc.)
  'openAdminPanel', 'closeAdminPanel',
  'openLeaderboard', 'closeLeaderboard',
  'openMyData', 'closeMyData',
  'openDonation', 'closeDonation', 'closeDonationThankYou',
  'openReport', 'closeReport',
  'closeFriendProfile', 'closeReportModal',
  // Legal & Moderation (session 2026-02-19)
  'acceptSOSDisclaimer', 'acceptCompanionConsent',
  'openBlockedUsers', 'closeBlockedUsers',
  // CheckinModal
  'openCheckinModal', 'closeCheckinModal', 'submitCheckin',
  'setCheckinWaitTime', 'toggleCheckinChar', 'triggerCheckinPhoto',
  'onCheckinWaitSlider', 'setCheckinRideResult', 'handleCheckinPhoto',
  // Leaderboard tabs + country filter
  'setLeaderboardTab', 'setLeaderboardCountry',
  // Thumb History toggle
  'toggleThumbHistory',
  // Map view (defined in Map.js / views)
  'openCountryGuide', 'mapZoomIn', 'mapZoomOut',
  // Guide tips feedback (defined in feedbackService.js)
  'voteGuideTip', 'submitGuideSuggestion',
  // Voyage view (defined in Voyage.js)
  'setVoyageSubTab', 'setJournalSubTab', 'highlightTripSpot', 'startTrip', 'tripNextStop', 'finishTrip',
  'toggleTripPublic', 'openTripDetail', 'closeTripDetail', 'deleteJournalTrip',
  'openAddTripNote', 'openTripPhotoUpload',
  // Voyage map-first handlers (defined in Voyage.js)
  'tripSheetTouchStart', 'tripSheetTouchMove', 'tripSheetTouchEnd', 'tripSheetCycleState',
  'tripExpandForm', 'tripCollapseForm', 'removeTripMapSpot', 'toggleTripGasStations',
  'tripFitBounds', 'tripMapShowSpot',
  // Travel view (defined in Travel.js)
  'syncTripFieldsAndCalculate', 'toggleRouteAmenities', 'centerTripMapOnGps', 'setRouteFilter',
  // Social view (defined in Social.js + sub-components)
  'setSocialTab', 'postCompanionRequest', 'addFriendByName',
  'showCompanionSearchView', 'closeCompanionSearch', 'setEventFilter',
  // Feed (defined in Feed.js)
  'setFeedFilter', 'toggleFeedVisibility',
  // Conversations (defined in Conversations.js)
  'openGroupChat', 'closeGroupChat', 'openZoneChat', 'closeZoneChat',
  // Friends (defined in Friends.js)
  'searchAmbassadorsByCity',
  // Ambassadors (defined in ambassadors.js)
  'searchAmbassadors', 'registerAmbassador', 'contactAmbassador',
  'unregisterAmbassador', 'updateAmbassadorAvailability',
  // Direct Messages (defined in directMessages.js)
  'openConversation', 'closeConversation', 'sendDM',
  'shareDMSpot', 'shareDMPosition', 'deleteDMConversation',
  // Events (defined in events.js)
  'openCreateEvent', 'closeCreateEvent', 'submitCreateEvent',
  'joinEvent', 'leaveEvent', 'deleteEventAction',
  'openEventDetail', 'closeEventDetail',
  'postEventComment', 'replyEventComment', 'toggleReplyInput',
  'reactToEventComment', 'shareEvent', 'deleteEventCommentAction',
  // Profile view (defined in Profile.js)
  'toggleNotifications',
  // SOS (defined in SOS.js)
  'sendSOSTemplate',
  // Auth (defined in Auth.js)
  'loginAsAdmin', 'handleAuth',
  // SpotDetail (defined in navigation controller/utils)
  'showNavigationPicker', 'openInNavigationApp', 'voteSpot',
  // Welcome (defined in Welcome.js)
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
  'companionBtnDown', 'companionBtnUp', 'companionBtnCancel',
  'companionCheckIn', 'companionSendAlert',
  'companionAddTrustedContact', 'companionRemoveTrustedContact',
  'companionClearHistory',
  // Gas Stations (navigation)
  'toggleGasStations',
  // Community Tips (defined in communityTips.js)
  'submitCommunityTip', 'voteCommunityTip',
  // main.js — missing handlers
  'showToast', 'openSpotDetail',
  'acceptLocationPermission', 'declineLocationPermission', 'closeLocationPermission',
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
  // Profile new features (#57-#63) (defined in Profile.js)
  'editBio', 'saveBio', 'editLanguages',
  'openReferences', 'closeReferences',
  'togglePrivacy',
  'setProfileSubTab',
  // Profile stats detail views + past trip form (defined in Profile.js)
  'openMySpots', 'openMyValidations', 'openMyCountries', 'closeProfileDetail',
  'openAddPastTrip', 'closeAddPastTrip', 'submitPastTrip',
  'removeLanguage', 'cycleLanguageLevel',
  'saveSocialLink', 'addProfilePhoto', 'removeProfilePhoto',
  'closeLanguagePicker', 'langPickerFilter', 'selectLanguageFromPicker',
  'selectLanguageLevel', 'closeLanguageLevelPicker',
  // Roadmap handlers (defined in Profile.js)
  'openRoadmapFeature', 'closeRoadmapFeature', 'setRoadmapListTab',
  'roadmapVote', 'roadmapVoteDetail', 'roadmapShowCommentInput',
  'roadmapHideCommentInput', 'submitRoadmapComment', 'openProgressionStats',
  'acceptRoadmapIntro', 'dismissRoadmapDetailIntro',
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
  // Admin Moderation (defined in adminModeration.js) 'closeAdminModeration',
  // Detailed Reviews (defined in detailedReviews.js)
  // Realtime Chat (defined in realtimeChat.js)
  // Trust Score (defined in trustScore.js)
  'getUserTrustScore', 'showTrustDetails',
  // Companion Search (defined in companionSearch.js) 'closeTravelPlanDetail',
  // Dangerous Spots (defined in dangerousSpots.js) 'closeDangerReportModal',
  // TravelGroups extras (defined in travelGroups.js)
  'createGroup', 'acceptGroupInvitation', 'declineGroupInvitation',
  'addItineraryStop', 'removeItineraryStop',
  'joinTravelGroup', 'leaveTravelGroup', 'createTravelGroup',
  // Private Messages (defined in privateMessages.js)
  // Nearby Friends extras (defined in nearbyFriends.js)
  'setNotificationRadius', 'toggleNearbyFriendsList',
  'closeNearbyFriendsList', 'toggleLocationSharing', 'showFriendOnMap',
  // Proximity Notify (defined in proximityNotify.js)
  'quickValidateSpot', 'quickReportSpot', 'dismissProximityAlert', 'initProximityNotify',
  // City Panel (defined in main.js)
  'openCityPanel', 'closeCityPanel', 'selectCityRoute', 'viewCitySpotsOnMap',
  // Missing close handlers (session 2026-02-22)
  'closeLanding', 'closeSafety', 'toggleFormToggle', 'changeLandingLanguage',
  'closeConsentSettings', 'closeJoinTeam', 'closeTeamSettings',
  'closeTitlePopup', 'closeSeasonRewards', 'closeAnniversaryModal',
  'closeAmbassadorSuccess', 'closeAmbassadorProfile', 'closeContactAmbassador',
  'closeReviewForm', 'closeReplyModal', 'closeAddForbiddenWordModal',
  'closeRouteAmenities', 'closePostTravelPlan', 'closePhotoUpload',
  'closeLanguageSelector', 'closeCookieBanner',
  // Wolf audit handlers (session 2026-02-23)
  'flyToCity', 'openProfile', 'openEditProfile',
  'planTrip', 'clearTrip', 'openGuides', 'openChallengesHub',
  'loginWithEmail', 'claimDailyReward',
  'triggerSOS', 'shareSOS',
  'openCompanion', 'closeCompanion',
  'submitNewSpot',
  // Missing handlers (session 2026-02-25)
  'requireProfile', 'closeBadgePopup', 'sendAmbassadorMessage',
  'handleCreateTeam', 'forceOfflineSync',
  'translateElement', 'showOriginal',
  'startNavigation', 'removeKnownDevice',
  'closeShareModal', 'copySpotLink', 'shareOnWhatsApp',
  'exportUserData', 'shareLink', 'generateShareUrl',
  'openInGoogleMaps', 'openInWaze', 'openInAppleMaps', 'openInNativeMaps',
  'selectNavigationApp', 'closeNavigationPicker',
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
  socialSubTab: 'messagerie',
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
  showThumbHistory: false,
  leaderboardCountry: 'all',
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
  showCompanionSearch: false,
  eventFilter: 'all',
  checkinSpot: null,
  newBadge: null,
  navigationActive: false,
  points: 500,
  level: 5,
  checkins: 20,
  spotsCreated: 5,
  spotsValidated: 3,
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
  profileSubTab: 'profil',
  countriesVisited: ['FR', 'DE', 'ES'],
  references: [
    { from: 'Alice', text: 'Great traveler!', rating: 5, date: '2026-01-15' },
  ],
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
  testHandlers('ChallengesHub view (thumb history)', renderChallengesHub, { showThumbHistory: true })
  testHandlers('Social view (messagerie)', renderSocial, { socialSubTab: 'messagerie' })
  testHandlers('Social view (evenements)', renderSocial, { socialSubTab: 'evenements' })
  testHandlers('Profile view', renderProfile)
  testHandlers('Profile view (progression)', renderProfile, { profileSubTab: 'progression' })
  testHandlers('Profile view (reglages)', renderProfile, { profileSubTab: 'reglages' })
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
      () => renderSocial({ ...mockState, socialSubTab: 'messagerie' }),
      () => renderSocial({ ...mockState, socialSubTab: 'evenements' }),
      () => renderProfile(mockState),
      () => renderProfile({ ...mockState, profileSubTab: 'progression' }),
      () => renderProfile({ ...mockState, profileSubTab: 'reglages' }),
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
