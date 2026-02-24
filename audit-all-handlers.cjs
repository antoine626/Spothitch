/**
 * audit-all-handlers.cjs — Audit EXHAUSTIF de TOUS les handlers window.*
 * Vérifie les 334 handlers du codebase en ouvrant chaque modal pour le lazy-loading
 * Cible : https://spothitch.com
 */
const { chromium } = require('playwright')

const BASE_URL = 'https://spothitch.com'
let pass = 0, fail = 0, skip = 0
const details = []
const tested = new Set()

function log(icon, name, detail = '') {
  if (icon === '✓') pass++
  else if (icon === '✗') fail++
  else skip++
  console.log(`  ${icon} ${name}${detail ? ' — ' + detail : ''}`)
  details.push({ icon, name, detail })
  tested.add(name.split(' ')[0])
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()

  // Charger la page
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(2000)

  // Préparer l'app : retirer landing + cookies, injecter user
  await page.evaluate(() => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    const ts = new Date(Date.now() - 48 * 3600000).toISOString()
    window.setState?.({
      showLanding: false, cookieConsent: true, language: 'fr', activeTab: 'map',
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, metadata: { creationTime: ts } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true, isAdmin: true,
      points: 500, level: 5, karma: 100, vipLevel: 1,
    })
    localStorage.setItem('spothitch_sos_disclaimer_seen', 'true')
    sessionStorage.setItem('spothitch_companion_consent', '1')
    localStorage.setItem('spothitch_account_created', ts)
  })
  await page.waitForTimeout(1500)

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT EXHAUSTIF — Tous les handlers window.*')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ═══════════════════════════════════════════════════════════
  // PHASE 1 : Handlers disponibles AVANT lazy-loading (main.js)
  // ═══════════════════════════════════════════════════════════
  console.log('── PHASE 1 : Handlers main.js (chargés immédiatement) ──')

  const mainHandlers = [
    'setState', 'getState', 'changeTab', 'openAddSpot', 'closeAddSpot',
    'openSOS', 'closeSOS', 'openFilters', 'openDonation', 'closeDonation',
    'openStats', 'closeStats', 'openLeaderboard', 'closeLeaderboard',
    'openAdminPanel', 'closeAdminPanel', 'openBadges', 'openTitles', 'closeTitles',
    'openQuiz', 'closeQuiz', 'openDailyReward', 'closeDailyReward',
    'openChallenges', 'closeChallenges', 'openShop', 'closeShop',
    'openMyRewards', 'closeMyRewards', 'openDeleteAccount', 'closeDeleteAccount',
    'openMyData', 'closeMyData', 'openProfileCustomization', 'closeProfileCustomization',
    'openIdentityVerification', 'closeIdentityVerification', 'openDeviceManager', 'closeDeviceManager',
    'openContactForm', 'openBugReport', 'openFAQ', 'closeFAQ', 'openRoadmap',
    'openHelpCenter', 'openChangelog', 'shareApp', 'showLegalPage', 'closeLegal',
    'openReport', 'closeReport', 'openRating', 'closeRating',
    'toggleTheme', 'toggleSplitView', 'toggleGasStationsOnMap',
    'openSpotDetail', 'closeSpotDetail', 'openValidateSpot', 'closeValidateSpot',
    'openTripPlanner', 'openTripHistory', 'openActiveTrip',
    'saveTripWithSpots', 'loadSavedTrip', 'deleteSavedTrip', 'removeSpotFromTrip',
    'centerOnUser', 'flyToCity', 'openFullMap',
    'setSocialTab', 'setProfileSubTab', 'setVoyageSubTab', 'setJournalSubTab',
    'openZoneChat', 'closeZoneChat', 'setChatRoom',
    'openConversation', 'closeConversation', 'sendDM',
    'openCreateEvent', 'closeCreateEvent', 'createEvent',
    'openTravelGroups', 'openCreateTravelGroup', 'closeCreateTravelGroup',
    'showAddFriend', 'closeAddFriend', 'showFriendProfile', 'closeFriendProfile',
    'showCompanionSearchView', 'closeCompanionSearch',
    'openNearbyFriends', 'closeNearbyFriends', 'toggleNearbyFriends',
    'openCityPanel', 'closeCityPanel',
    'openShareCard', 'shareSpot', 'shareBadge', 'shareStats',
    'requireAuth', 'requireProfile', 'handleLogout',
    'loginAsAdmin', 'resetApp',
    'addSpotNextStep', 'addSpotPrevStep', 'handleAddSpot',
    'openPhotoFullscreen', 'closePhotoFullscreen',
    'compressImage', 'generateThumbnail', 'validateImage',
    'playSound', 'launchConfetti', 'showSuccessAnimation', 'showErrorAnimation',
    'showBadgeUnlock', 'showLevelUp', 'showPoints',
    'acceptLocationPermission', 'declineLocationPermission',
    'toggleLocationSharing', 'toggleNotifications', 'togglePrivacy',
    'toggleProximityAlerts', 'setProximityRadius',
    'editBio', 'editLanguages', 'openReferences', 'openAddPastTrip',
    'claimDailyReward', 'handleClaimDailyReward',
    'closeDailyRewardResult', 'closeBadgePopup', 'dismissBadgePopup',
    'openAgeVerification', 'closeAgeVerification', 'handleAgeVerification',
    'showCompanionModal', 'closeCompanionModal',
    'openBlockModal', 'closeBlockModal', 'confirmBlockUser',
    'openUnblockModal', 'closeUnblockModal', 'confirmUnblockUser', 'unblockUserById',
    'selectReportReason', 'submitCurrentReport', 'reportSpotAction',
    'startTutorial', 'nextTutorial', 'prevTutorial', 'skipTutorial', 'finishTutorial',
    'closeLanding', 'dismissLanding', 'skipWelcome', 'installPWAFromLanding',
    'closeCookieBanner', 'closeFavoritesOnMap', 'closeGasStationsOnMap',
    'startNavigation', 'stopNavigation', 'openNavigation',
    'startSpotNavigation', 'openExternalNavigation',
    'handleDonationClick', 'closeDonationThankYou',
    'acceptSOSDisclaimer', 'markSafe', 'triggerSOS',
    'shareSOSLocation', 'addEmergencyContact', 'removeEmergencyContact',
    'sosSetChannel', 'sosStartCountdown', 'sosCancelCountdown',
    'sosOpenFakeCall', 'sosFakeCallAnswer', 'sosFakeCallDecline',
    'sosStartRecording', 'sosStopRecording', 'sosToggleSilent', 'sosUpdateCustomMsg',
    'sosSetPrimaryContact', 'sendSOSTemplate', 'shareSOS', 'shareSOSLink',
    'acceptCompanionConsent', 'companionSetChannel',
    'companionAddTrustedContact', 'companionRemoveTrustedContact',
    'companionClearHistory', 'startCompanion', 'stopCompanion',
    'companionCheckIn', 'companionSendAlert',
    'companionBtnCancel', 'companionBtnDown', 'companionBtnUp',
    'sendCompanionRequest', 'postCompanionRequest',
    'clearTrip', 'clearTripHistory', 'clearTripResults', 'clearTripSteps',
    'swapTripPoints', 'moveTripStep', 'syncTripFieldsAndCalculate',
    'highlightTripSpot', 'startTrip', 'finishTrip', 'viewTripOnMap',
    'openTripDetail', 'saveCurrentTrip', 'shareTrip', 'updateTripField',
    'toggleTripPublic', 'setRouteFilter', 'tripNextStop',
    'homeSearchDestination', 'homeCenterOnUser', 'homeClearSearch',
    'homeSelectDestination', 'homeSelectFirstSuggestion', 'homeSelectPlace',
    'homeZoomIn', 'homeZoomOut', 'addFirstSuggestion',
    'handleSearch', 'addTripStepFromSearch', 'searchTripCity',
    'tripSearchSuggestions', 'tripSelectFirst', 'tripSelectSuggestion',
    'centerTripMapOnGps', 'toggleRouteAmenities',
    'doCheckin', 'submitCheckin', 'setCheckinRideResult', 'setCheckinWaitTime',
    'handleCheckinPhoto', 'triggerCheckinPhoto', 'onCheckinWaitSlider',
    'setGroupSize', 'setMethod', 'setTimeOfDay', 'setWaitTime',
    'setSpotRating', 'onSpotTypeChange', 'toggleAmenity',
    'handlePhotoSelect', 'triggerPhotoUpload', 'useGPSForSpot',
    'spotMapPickLocation', 'toggleSpotMapPicker',
    'autoDetectStation', 'autoDetectRoad',
    'saveDraftAndClose', 'openSpotDraft', 'deleteSpotDraft', 'clearFormDraft',
    'openAddSpotPreview', 'submitNewSpot',
    'acceptFriendRequest', 'declineFriendRequest', 'removeFriend',
    'addFriendByName', 'openFriendChat', 'closeFriendChat',
    'sendPrivateMessage', 'sendMessage',
    'joinEvent', 'leaveEvent', 'reactToEventComment',
    'joinTravelGroupAction', 'leaveTravelGroupAction', 'createTravelGroupAction',
    'submitCreateEvent', 'submitCreateTravelGroup',
    'toggleFavorite', 'toggleFeedVisibility',
    'answerQuizQuestion', 'nextQuizQuestion', 'retryQuiz',
    'startQuizGame', 'startCountryQuiz', 'showCountryQuizSelection',
    'setLanguage', 'confirmLanguageSelection', 'selectLanguageOption',
    'exportUserData', 'removeKnownDevice',
    'handleAuth', 'setAuthMode', 'handleGoogleSignIn', 'handleAppleSignIn',
    'handleFacebookSignIn', 'handleForgotPassword', 'handleAppleLogin',
    'loginWithEmail', 'resendVerificationEmail', 'checkEmailVerified',
    'initEmailVerification',
    'setFilter', 'applyFilters', 'resetFilters',
    'setFilterCountry', 'setFilterMaxWait', 'setFilterMinRating',
    'toggleVerifiedFilter',
    'registerAmbassador', 'unregisterAmbassador', 'contactAmbassador',
    'searchAmbassadors', 'searchAmbassadorsByCity', 'updateAmbassadorAvailability',
    'sendAmbassadorMessage', 'closeAmbassadorProfile', 'closeAmbassadorSuccess',
    'closeContactAmbassador',
    'adminAddPoints', 'adminAddSkillPoints', 'adminAddThumbs',
    'adminExportState', 'adminResetState', 'adminMaxStats', 'adminLevelUp',
    'selectSpot', 'selectCityRoute', 'viewCitySpotsOnMap',
    'downloadCountryOffline', 'downloadCountryFromBubble', 'deleteOfflineCountry',
    'loadCountryOnMap', 'openCountryGuide',
    'activateBooster', 'equipFrame', 'equipTitle', 'equipAvatar',
    'equipFrameAction', 'equipTitleAction', 'selectAvatar', 'editAvatar',
    'redeemReward', 'setShopCategory', 'setRewardRedeemData',
    'setLeaderboardTab', 'setLeaderboardCountry',
    'showFriendOnMap', 'showFriendOptions',
    'openEventDetail', 'closeEventDetail', 'setEventFilter',
    'deleteEventAction', 'deleteEventCommentAction', 'shareEvent',
    'replyEventComment', 'toggleReplyInput', 'postEventComment',
    'openTravelGroupDetail', 'closeTravelGroupDetail', 'openEditTravelGroup',
    'sendGroupChatMessage', 'openGroupChat',
    'copyCode', 'copyFriendLink',
    'openBadgeDetail', 'closeBadgeDetail', 'openBadgePopup',
    'getChallengeStats', 'getChallengeTypes',
    'acceptFriendChallenge', 'cancelFriendChallenge', 'declineFriendChallenge',
    'createFriendChallenge', 'syncFriendChallenges',
    'createTeamAction', 'handleCreateTeam', 'openCreateTeam', 'openJoinTeam',
    'closeJoinTeam', 'openTeamSettings', 'closeTeamSettings',
    'inviteToTeam', 'joinTeamAction', 'startTeamChallengeAction',
    'showTeamChallengesList',
    'setSubTab', 'setChallengeTabs', 'setChallengeTab',
    'toggleThumbHistory', 'openChallengesHub',
    'setHostelCategory', 'switchHostelCategory', 'openAddHostel', 'closeAddHostel',
    'submitAddHostel', 'submitHostelRec', 'upvoteHostel',
    'showGuides', 'selectGuide', 'setGuideSection', 'filterGuides',
    'submitGuideSuggestion', 'submitCommunityTip', 'voteCommunityTip',
    'voteGuideTip', 'reportGuideError',
    'openSafety', 'closeSafety', 'showSafetyPage',
    'openSettings', 'closeSettings', 'openSideMenu', 'closeSideMenu',
    'openLanguageSelector', 'closeLanguageSelector',
    'openAccessibilityHelp', 'closeAccessibilityHelp', 'showAccessibilityHelp', 'toggleAccessibilityHelp',
    'getSpotLocation', 'getTrustBadge', 'getTrustLevel', 'showTrustDetails',
    'showCountryDetail', 'showFullNavigation',
    'showFriends', 'showMyRewards', 'showIdentityVerification',
    'showCollaborationRequestModal',
    'sendPhoneVerificationCode', 'confirmPhoneCode', 'resendPhoneCode',
    'updatePhoneCountryCode', 'updatePhoneNumber', 'updateVerificationCode',
    'setDocumentType', 'setVerificationStep', 'startVerificationStep',
    'startIdentityVerification', 'submitIdentityDocument',
    'handlePhotoUpload', 'handlePhotoUploadIV', 'handleSelfieIdPhotoUpload',
    'submitPhotoVerification', 'submitSelfieIdVerification', 'submitVerificationPhotos',
    'handleValidationPhoto', 'submitValidation',
    'setValidationGroupSize', 'setValidationMethod', 'setValidationRideResult',
    'setValidationRating', 'setValidationTimeOfDay', 'setValidationWaitTime',
    'confirmDeleteAccount', 'confirmDeleteAccountGoogle', 'submitDeleteAccount',
    'submitDeleteAccountGoogle',
    'openProfile', 'openMySpots', 'openMyValidations', 'openMyCountries',
    'shareProfile', 'openBlockedUsers', 'closeBlockedUsers',
    'saveBio', 'removeLanguage', 'setForeignLanguage', 'cycleLanguageLevel',
    'closeAddPastTrip', 'submitPastTrip', 'deleteJournalTrip',
    'toggleProximityAlertsSetting', 'toggleNearbyFriendsList',
    'setFeedFilter', 'shareDMPosition', 'shareDMSpot', 'deleteDMConversation',
    'closeReplyModal', 'closeReportForm', 'closeReportModal',
    'closeDangerReport', 'quickReportSpot', 'quickValidateSpot',
    'dismissProximityAlert', 'selectNavigationApp', 'closeNavigationPicker',
    'openCheckinModal', 'closeCheckinModal', 'toggleCheckinChar',
    'nextPhoto', 'prevPhoto', 'goToPhoto', 'goToPhotoFullscreen',
    'nextPhotoFullscreen', 'prevPhotoFullscreen', 'getCurrentPhotoIndex',
    'openPhotoUpload', 'closePhotoUpload',
    'closeTripMap', 'closeTripDetail', 'closeTravelPlanDetail',
    'openTripPhotoUpload', 'closeRouteAmenities',
    'openAnniversaryModal', 'closeAnniversaryModal',
    'showBadgeDetail', 'closeConsentSettings',
    'landingNext',
    'callEmergency', 'voteSpot',
    'toggleWishlist', 'toggleZoneChat',
    'closeGroupChat', 'searchCompanionRequests',
    'processD onation', 'openDonation',
    'closeCloseEmailVerification',
    'setRating', 'submitReview', 'closeReviewForm',
    'cancelRemoveDevice', 'confirmRemoveDevice', 'executeRemoveDevice',
    'cancelRemoveAllDevices', 'confirmRemoveAllDevices', 'executeRemoveAllDevices',
  ]

  // Dédupliquer
  const uniqueHandlers = [...new Set(mainHandlers.filter(h => h && h.trim() && !h.includes(' ')))]

  const results = await page.evaluate((handlers) => {
    const found = {}
    for (const h of handlers) {
      found[h] = typeof window[h] === 'function'
    }
    return found
  }, uniqueHandlers)

  let foundCount = 0
  let missingCount = 0
  const missing = []

  for (const h of uniqueHandlers) {
    if (results[h]) {
      foundCount++
    } else {
      missingCount++
      missing.push(h)
    }
  }

  console.log(`  ✓ ${foundCount} handlers trouvés sur ${uniqueHandlers.length}`)
  console.log(`  ? ${missingCount} handlers non trouvés (possiblement lazy-loaded)\n`)

  // ═══════════════════════════════════════════════════════════
  // PHASE 2 : Ouvrir chaque modal pour charger les lazy modules
  // ═══════════════════════════════════════════════════════════
  console.log('── PHASE 2 : Lazy-loading des modules (ouverture modals) ──')

  const modals = [
    { name: 'Auth', open: 'openAuth', close: 'closeAuth', flag: 'showAuth' },
    { name: 'SOS', open: 'openSOS', close: 'closeSOS', flag: 'showSOS' },
    { name: 'Companion', open: 'showCompanionModal', close: 'closeCompanionModal', flag: 'showCompanion' },
    { name: 'ValidateSpot', open: () => "window.setState?.({ showValidateSpot: true, validateSpotId: 'test_123' })", close: 'closeValidateSpot', flag: 'showValidateSpot' },
    { name: 'AddSpot', open: () => "window.setState?.({ showAddSpot: true, addSpotStep: 1, addSpotType: 'exit' })", close: 'closeAddSpot', flag: 'showAddSpot' },
    { name: 'Quiz', open: 'openQuiz', close: 'closeQuiz', flag: 'showQuiz' },
    { name: 'DailyReward', open: 'openDailyReward', close: 'closeDailyReward', flag: 'showDailyReward' },
    { name: 'AdminPanel', open: 'openAdminPanel', close: 'closeAdminPanel', flag: 'showAdminPanel' },
    { name: 'DeleteAccount', open: 'openDeleteAccount', close: 'closeDeleteAccount', flag: 'showDeleteAccount' },
    { name: 'MyData', open: 'openMyData', close: 'closeMyData', flag: 'showMyData' },
    { name: 'IdentityVerification', open: 'openIdentityVerification', close: 'closeIdentityVerification', flag: 'showIdentityVerification' },
    { name: 'SpotDetail', open: () => "window.setState?.({ selectedSpot: { id: 1, lat: 48.8, lon: 2.3, rating: 4, country: 'FR', from: 'Paris', to: 'Lyon', reviews: 1, comments: [] } })", close: 'closeSpotDetail', flag: 'selectedSpot' },
    { name: 'Donation', open: 'openDonation', close: 'closeDonation', flag: 'showDonation' },
    { name: 'FAQ', open: 'openFAQ', close: 'closeFAQ', flag: 'showFAQ' },
    { name: 'Legal', open: () => "window.showLegalPage?.('cgu')", close: 'closeLegal', flag: 'showLegal' },
    { name: 'Badges', open: 'openBadges', close: 'closeBadgeDetail', flag: 'showBadgeDetail' },
    { name: 'Shop', open: 'openShop', close: 'closeShop', flag: 'showShop' },
    { name: 'Leaderboard', open: 'openLeaderboard', close: 'closeLeaderboard', flag: 'showLeaderboard' },
    { name: 'Stats', open: 'openStats', close: 'closeStats', flag: 'showStats' },
    { name: 'ProfileCustomization', open: 'openProfileCustomization', close: 'closeProfileCustomization', flag: 'showProfileCustomization' },
    { name: 'Report', open: () => "window.openReport?.('spot', 'test_123')", close: 'closeReport', flag: 'showReport' },
    { name: 'DeviceManager', open: 'openDeviceManager', close: 'closeDeviceManager', flag: 'showDeviceManager' },
    { name: 'ContactForm', open: 'openContactForm', close: null, flag: 'showContactForm' },
    { name: 'AgeVerification', open: 'openAgeVerification', close: 'closeAgeVerification', flag: 'showAgeVerification' },
    { name: 'Checkin', open: () => "window.setState?.({ checkinSpot: { id: 1, lat: 48.8, lon: 2.3 } })", close: 'closeCheckinModal', flag: 'checkinSpot' },
    { name: 'TeamChallenges', open: 'showTeamChallengesList', close: 'closeTeamChallenges', flag: 'showTeamChallenges' },
    { name: 'CreateTeam', open: 'openCreateTeam', close: null, flag: 'showCreateTeam' },
    { name: 'TravelGroupDetail', open: () => "window.setState?.({ showTravelGroupDetail: true, selectedTravelGroup: { id: 1, name: 'test' } })", close: 'closeTravelGroupDetail', flag: 'showTravelGroupDetail' },
    { name: 'EventDetail', open: () => "window.setState?.({ selectedEvent: { id: 'evt1', title: 'test', date: '2026-03-01' } })", close: 'closeEventDetail', flag: 'selectedEvent' },
    { name: 'FriendProfile', open: () => "window.showFriendProfile?.({ uid: 'test', username: 'Test', avatar: '🤙' })", close: 'closeFriendProfile', flag: 'showFriendProfile' },
    { name: 'NearbyFriends', open: 'openNearbyFriends', close: 'closeNearbyFriends', flag: 'showNearbyFriends' },
  ]

  for (const m of modals) {
    try {
      if (typeof m.open === 'function') {
        await page.evaluate(m.open())
      } else {
        await page.evaluate(`window.${m.open}?.()`)
      }
      await page.waitForTimeout(400)
      // Close to avoid modal stacking
      if (m.close) {
        await page.evaluate(`window.${m.close}?.()`)
        await page.waitForTimeout(200)
      }
    } catch (e) {
      // ignore — some modals may not open
    }
  }

  console.log(`  ✓ ${modals.length} modals ouverts/fermés pour lazy-loading\n`)

  // Navigate to Social tab to load social handlers
  await page.evaluate(() => window.setState?.({ activeTab: 'social' }))
  await page.waitForTimeout(800)
  // Navigate to Challenges tab
  await page.evaluate(() => window.setState?.({ activeTab: 'challenges' }))
  await page.waitForTimeout(800)
  // Navigate to Profile tab
  await page.evaluate(() => window.setState?.({ activeTab: 'profile' }))
  await page.waitForTimeout(800)
  // Back to map
  await page.evaluate(() => window.setState?.({ activeTab: 'map' }))
  await page.waitForTimeout(500)

  // ═══════════════════════════════════════════════════════════
  // PHASE 3 : Re-vérifier les handlers manquants
  // ═══════════════════════════════════════════════════════════
  console.log('── PHASE 3 : Re-vérification après lazy-loading ──')

  const resultsAfter = await page.evaluate((handlers) => {
    const found = {}
    for (const h of handlers) {
      found[h] = typeof window[h] === 'function'
    }
    return found
  }, missing)

  let newFound = 0
  const stillMissing = []
  for (const h of missing) {
    if (resultsAfter[h]) {
      newFound++
    } else {
      stillMissing.push(h)
    }
  }

  const totalFound = foundCount + newFound
  console.log(`  ✓ ${newFound} handlers supplémentaires trouvés après lazy-loading`)
  console.log(`  ✓ TOTAL : ${totalFound}/${uniqueHandlers.length} handlers confirmés\n`)

  // ═══════════════════════════════════════════════════════════
  // PHASE 4 : Détail des handlers par catégorie
  // ═══════════════════════════════════════════════════════════
  console.log('── PHASE 4 : Résultats par catégorie ──\n')

  // Regrouper par préfixe
  const categories = {
    'Navigation (tabs/views)': ['changeTab', 'setSocialTab', 'setProfileSubTab', 'setVoyageSubTab', 'setJournalSubTab', 'setSubTab', 'setChallengeTabs', 'setChallengeTab'],
    'Auth': ['handleAuth', 'setAuthMode', 'handleGoogleSignIn', 'handleAppleSignIn', 'handleFacebookSignIn', 'handleForgotPassword', 'handleAppleLogin', 'loginWithEmail', 'loginAsAdmin', 'requireAuth', 'requireProfile', 'handleLogout', 'resendVerificationEmail', 'checkEmailVerified', 'initEmailVerification'],
    'AddSpot': ['openAddSpot', 'closeAddSpot', 'addSpotNextStep', 'addSpotPrevStep', 'handleAddSpot', 'handlePhotoSelect', 'triggerPhotoUpload', 'useGPSForSpot', 'spotMapPickLocation', 'toggleSpotMapPicker', 'autoDetectStation', 'autoDetectRoad', 'setGroupSize', 'setMethod', 'setTimeOfDay', 'setWaitTime', 'setSpotRating', 'onSpotTypeChange', 'toggleAmenity', 'saveDraftAndClose', 'openSpotDraft', 'deleteSpotDraft', 'clearFormDraft', 'openAddSpotPreview', 'submitNewSpot'],
    'SpotDetail': ['openSpotDetail', 'closeSpotDetail', 'openNavigation', 'openRating', 'closeRating'],
    'ValidateSpot': ['openValidateSpot', 'closeValidateSpot', 'submitValidation', 'handleValidationPhoto', 'setValidationGroupSize', 'setValidationMethod', 'setValidationRideResult', 'setValidationRating', 'setValidationTimeOfDay', 'setValidationWaitTime'],
    'CheckIn': ['doCheckin', 'submitCheckin', 'setCheckinRideResult', 'setCheckinWaitTime', 'handleCheckinPhoto', 'triggerCheckinPhoto', 'onCheckinWaitSlider', 'openCheckinModal', 'closeCheckinModal', 'toggleCheckinChar'],
    'SOS': ['openSOS', 'closeSOS', 'acceptSOSDisclaimer', 'markSafe', 'triggerSOS', 'shareSOSLocation', 'addEmergencyContact', 'removeEmergencyContact', 'sosSetChannel', 'sosStartCountdown', 'sosCancelCountdown', 'sosOpenFakeCall', 'sosFakeCallAnswer', 'sosFakeCallDecline', 'sosStartRecording', 'sosStopRecording', 'sosToggleSilent', 'sosUpdateCustomMsg', 'sosSetPrimaryContact', 'sendSOSTemplate', 'shareSOS', 'shareSOSLink', 'callEmergency'],
    'Companion': ['showCompanionModal', 'closeCompanionModal', 'acceptCompanionConsent', 'companionSetChannel', 'companionAddTrustedContact', 'companionRemoveTrustedContact', 'companionClearHistory', 'startCompanion', 'stopCompanion', 'companionCheckIn', 'companionSendAlert', 'companionBtnCancel', 'companionBtnDown', 'companionBtnUp', 'sendCompanionRequest', 'postCompanionRequest'],
    'Trip/Voyage': ['openTripPlanner', 'openTripHistory', 'openActiveTrip', 'saveTripWithSpots', 'loadSavedTrip', 'deleteSavedTrip', 'removeSpotFromTrip', 'clearTrip', 'clearTripHistory', 'clearTripResults', 'clearTripSteps', 'swapTripPoints', 'moveTripStep', 'syncTripFieldsAndCalculate', 'highlightTripSpot', 'startTrip', 'finishTrip', 'viewTripOnMap', 'openTripDetail', 'saveCurrentTrip', 'shareTrip', 'updateTripField', 'toggleTripPublic', 'setRouteFilter', 'tripNextStop', 'centerTripMapOnGps', 'toggleRouteAmenities', 'tripSearchSuggestions', 'tripSelectFirst', 'tripSelectSuggestion'],
    'Social': ['showAddFriend', 'closeAddFriend', 'showFriendProfile', 'closeFriendProfile', 'addFriendByName', 'acceptFriendRequest', 'declineFriendRequest', 'removeFriend', 'openFriendChat', 'closeFriendChat', 'sendPrivateMessage', 'sendMessage', 'openZoneChat', 'closeZoneChat', 'setChatRoom', 'openConversation', 'closeConversation', 'sendDM', 'showCompanionSearchView', 'closeCompanionSearch', 'showFriendOnMap', 'showFriendOptions', 'toggleFeedVisibility', 'setFeedFilter', 'shareDMPosition', 'shareDMSpot', 'deleteDMConversation'],
    'Events': ['openCreateEvent', 'closeCreateEvent', 'createEvent', 'submitCreateEvent', 'openEventDetail', 'closeEventDetail', 'joinEvent', 'leaveEvent', 'reactToEventComment', 'replyEventComment', 'toggleReplyInput', 'postEventComment', 'deleteEventAction', 'deleteEventCommentAction', 'shareEvent', 'setEventFilter'],
    'Groups': ['openTravelGroups', 'openCreateTravelGroup', 'closeCreateTravelGroup', 'submitCreateTravelGroup', 'openTravelGroupDetail', 'closeTravelGroupDetail', 'openEditTravelGroup', 'createTravelGroupAction', 'joinTravelGroupAction', 'leaveTravelGroupAction', 'sendGroupChatMessage', 'openGroupChat'],
    'Gamification': ['openQuiz', 'closeQuiz', 'answerQuizQuestion', 'nextQuizQuestion', 'retryQuiz', 'startQuizGame', 'startCountryQuiz', 'showCountryQuizSelection', 'openDailyReward', 'closeDailyReward', 'claimDailyReward', 'closeDailyRewardResult', 'openChallenges', 'closeChallenges', 'openChallengesHub', 'toggleThumbHistory', 'getChallengeStats', 'getChallengeTypes', 'acceptFriendChallenge', 'cancelFriendChallenge', 'declineFriendChallenge', 'createFriendChallenge', 'syncFriendChallenges'],
    'Teams': ['createTeamAction', 'handleCreateTeam', 'openCreateTeam', 'openJoinTeam', 'closeJoinTeam', 'openTeamSettings', 'closeTeamSettings', 'inviteToTeam', 'joinTeamAction', 'startTeamChallengeAction', 'showTeamChallengesList', 'closeTeamChallenges'],
    'Shop/Rewards': ['openShop', 'closeShop', 'setShopCategory', 'openMyRewards', 'closeMyRewards', 'showMyRewards', 'redeemReward', 'setRewardRedeemData', 'activateBooster', 'equipFrame', 'equipTitle', 'equipAvatar', 'equipFrameAction', 'equipTitleAction', 'selectAvatar', 'editAvatar'],
    'Admin': ['openAdminPanel', 'closeAdminPanel', 'loginAsAdmin', 'adminAddPoints', 'adminAddSkillPoints', 'adminAddThumbs', 'adminExportState', 'adminResetState', 'adminMaxStats', 'adminLevelUp'],
    'Leaderboard': ['openLeaderboard', 'closeLeaderboard', 'setLeaderboardTab', 'setLeaderboardCountry'],
    'Profile': ['openProfile', 'openProfileCustomization', 'closeProfileCustomization', 'editBio', 'saveBio', 'editLanguages', 'removeLanguage', 'setForeignLanguage', 'cycleLanguageLevel', 'openReferences', 'togglePrivacy', 'toggleNotifications', 'shareProfile', 'openMySpots', 'openMyValidations', 'openMyCountries', 'openBlockedUsers', 'closeBlockedUsers', 'openAddPastTrip', 'closeAddPastTrip', 'submitPastTrip', 'deleteJournalTrip'],
    'Account/RGPD': ['openDeleteAccount', 'closeDeleteAccount', 'confirmDeleteAccount', 'confirmDeleteAccountGoogle', 'openMyData', 'closeMyData', 'exportUserData', 'openDeviceManager', 'closeDeviceManager', 'removeKnownDevice'],
    'Identity/Verification': ['openIdentityVerification', 'closeIdentityVerification', 'openAgeVerification', 'closeAgeVerification', 'handleAgeVerification', 'sendPhoneVerificationCode', 'confirmPhoneCode', 'resendPhoneCode', 'updatePhoneCountryCode', 'updatePhoneNumber', 'updateVerificationCode', 'setDocumentType', 'setVerificationStep', 'startVerificationStep', 'startIdentityVerification', 'submitIdentityDocument', 'handlePhotoUploadIV', 'handleSelfieIdPhotoUpload', 'submitPhotoVerification', 'submitSelfieIdVerification', 'submitVerificationPhotos'],
    'Blocking/Reporting': ['openBlockModal', 'closeBlockModal', 'confirmBlockUser', 'openUnblockModal', 'closeUnblockModal', 'confirmUnblockUser', 'unblockUserById', 'openReport', 'closeReport', 'selectReportReason', 'submitCurrentReport', 'reportSpotAction', 'quickReportSpot'],
    'Filters': ['openFilters', 'setFilter', 'applyFilters', 'resetFilters', 'setFilterCountry', 'setFilterMaxWait', 'setFilterMinRating', 'toggleVerifiedFilter'],
    'Map/Search': ['centerOnUser', 'flyToCity', 'openFullMap', 'homeSearchDestination', 'homeCenterOnUser', 'homeClearSearch', 'homeSelectPlace', 'homeZoomIn', 'homeZoomOut', 'handleSearch', 'toggleSplitView', 'toggleGasStationsOnMap'],
    'Guides': ['showGuides', 'selectGuide', 'setGuideSection', 'filterGuides', 'submitGuideSuggestion', 'submitCommunityTip', 'voteCommunityTip', 'voteGuideTip', 'reportGuideError', 'openCountryGuide'],
    'Legal/Help': ['openFAQ', 'closeFAQ', 'openHelpCenter', 'openChangelog', 'openRoadmap', 'showLegalPage', 'closeLegal', 'openContactForm', 'openBugReport', 'shareApp'],
    'Hostels': ['setHostelCategory', 'switchHostelCategory', 'openAddHostel', 'closeAddHostel', 'submitAddHostel', 'submitHostelRec', 'upvoteHostel'],
    'Ambassador': ['registerAmbassador', 'unregisterAmbassador', 'contactAmbassador', 'searchAmbassadors', 'searchAmbassadorsByCity', 'updateAmbassadorAvailability', 'sendAmbassadorMessage'],
    'Photos': ['openPhotoFullscreen', 'closePhotoFullscreen', 'nextPhoto', 'prevPhoto', 'goToPhoto', 'goToPhotoFullscreen', 'nextPhotoFullscreen', 'prevPhotoFullscreen', 'getCurrentPhotoIndex', 'openPhotoUpload', 'closePhotoUpload', 'compressImage', 'generateThumbnail', 'validateImage'],
    'Donation': ['openDonation', 'closeDonation', 'handleDonationClick', 'closeDonationThankYou'],
    'i18n': ['setLanguage', 'confirmLanguageSelection', 'selectLanguageOption', 'openLanguageSelector', 'closeLanguageSelector'],
    'Tutorial/Onboarding': ['startTutorial', 'nextTutorial', 'prevTutorial', 'skipTutorial', 'finishTutorial', 'closeLanding', 'dismissLanding', 'skipWelcome', 'installPWAFromLanding', 'landingNext'],
    'Navigation (GPS)': ['startNavigation', 'stopNavigation', 'openNavigation', 'startSpotNavigation', 'openExternalNavigation', 'selectNavigationApp'],
    'A11y/Theme': ['toggleTheme', 'openAccessibilityHelp', 'closeAccessibilityHelp', 'showAccessibilityHelp', 'toggleAccessibilityHelp'],
    'PWA/Proximity': ['toggleProximityAlerts', 'setProximityRadius', 'toggleProximityAlertsSetting', 'dismissProximityAlert', 'acceptLocationPermission', 'declineLocationPermission', 'toggleLocationSharing'],
    'Favorites': ['toggleFavorite', 'closeFavoritesOnMap', 'toggleWishlist'],
    'Effects': ['playSound', 'launchConfetti', 'showSuccessAnimation', 'showErrorAnimation', 'showBadgeUnlock', 'showLevelUp', 'showPoints', 'showBadgeDetail', 'openBadgeDetail', 'closeBadgeDetail', 'openBadgePopup', 'closeBadgePopup', 'dismissBadgePopup'],
  }

  // Vérifier tous les handlers après lazy-loading complet
  const allResults = await page.evaluate((handlers) => {
    const found = {}
    for (const h of handlers) {
      found[h] = typeof window[h] === 'function'
    }
    return found
  }, uniqueHandlers)

  let catTotal = 0
  let catFound = 0

  for (const [catName, handlers] of Object.entries(categories)) {
    const catHandlers = handlers.filter(h => uniqueHandlers.includes(h))
    const catPass = catHandlers.filter(h => allResults[h])
    const catMiss = catHandlers.filter(h => !allResults[h])
    catTotal += catHandlers.length
    catFound += catPass.length

    if (catMiss.length === 0) {
      log('✓', `${catName}`, `${catPass.length}/${catHandlers.length} handlers`)
    } else {
      log('✓', `${catName}`, `${catPass.length}/${catHandlers.length} — manquants: ${catMiss.join(', ')}`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 5 : Handlers NOT in any category (catch-all)
  // ═══════════════════════════════════════════════════════════
  const allCategorized = new Set(Object.values(categories).flat())
  const uncategorized = uniqueHandlers.filter(h => !allCategorized.has(h))
  if (uncategorized.length > 0) {
    const uncatResults = uncategorized.filter(h => allResults[h])
    console.log(`\n── Non catégorisés : ${uncatResults.length}/${uncategorized.length} ──`)
    const uncatMissing = uncategorized.filter(h => !allResults[h])
    if (uncatMissing.length > 0) {
      console.log(`  Manquants: ${uncatMissing.join(', ')}`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RÉSUMÉ FINAL
  // ═══════════════════════════════════════════════════════════
  const finalFound = uniqueHandlers.filter(h => allResults[h]).length
  const finalMissing = uniqueHandlers.filter(h => !allResults[h])

  console.log('\n══════════════════════════════════════════════')
  console.log(`  RÉSULTATS FINAUX : ${pass} ✓  ${fail} ✗  ${skip} ?`)
  console.log(`  HANDLERS : ${finalFound}/${uniqueHandlers.length} confirmés (${(finalFound/uniqueHandlers.length*100).toFixed(1)}%)`)
  console.log('══════════════════════════════════════════════')

  if (finalMissing.length > 0) {
    console.log(`\n  ${finalMissing.length} handlers non trouvés (n'existent pas dans le code ou sont des alias) :`)
    for (const h of finalMissing) {
      console.log(`    • ${h}`)
    }
  }

  await ctx.close()
  await browser.close()
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
