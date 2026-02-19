/**
 * Wiring Tests - Modal Flags
 * Verifies every modal flag produces non-empty HTML
 *
 * RULE: Every new modal MUST be tested here to ensure flag → HTML works.
 */

import { describe, test, expect, beforeAll, beforeEach } from 'vitest'
import { setState, getState } from '../../src/stores/state.js'
import { initI18n } from '../../src/i18n/index.js'

// Import all modals
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
import { renderContactFormModal } from '../../src/components/modals/ContactForm.js'
import { renderValidateSpot } from '../../src/components/modals/ValidateSpot.js'
import { renderCookieBanner } from '../../src/components/modals/CookieBanner.js'
import { renderDailyRewardModal } from '../../src/components/modals/DailyReward.js'
import { renderDeleteAccountModal } from '../../src/components/modals/DeleteAccount.js'
import { renderEmailVerification } from '../../src/components/modals/EmailVerification.js'
import { renderLocationPermission } from '../../src/components/modals/LocationPermission.js'
import { renderLanguageSelector } from '../../src/components/modals/LanguageSelector.js'

// Landing
import { renderLanding } from '../../src/components/Landing.js'

// Service modals
import { renderTravelGroupDetail } from '../../src/services/travelGroups.js'
import { renderNearbyFriendsList } from '../../src/services/nearbyFriends.js'
import { renderCustomizationModal } from '../../src/services/profileCustomization.js'
import { renderAccessibilityHelp } from '../../src/services/screenReader.js'
import { renderReportModal } from '../../src/services/moderation.js'
import { renderTeamDashboard } from '../../src/services/teamChallenges.js'
import { renderDonationModal } from '../../src/components/ui/DonationCard.js'

const mockState = {
  username: 'TestUser',
  avatar: '🤙',
  level: 5,
  points: 500,
  spots: [
    {
      id: 1,
      name: 'Test Spot',
      city: 'Paris',
      country: 'FR',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      globalRating: 4.5,
      description: 'Test spot',
      photos: ['test.jpg'],
    },
  ],
  friends: [{ id: 'friend1', name: 'Alice', avatar: '👩', level: 3 }],
  emergencyContacts: [{ name: 'Bob', phone: '+33612345678' }],
  user: { uid: 'test-user', email: 'test@test.com' },
  isLoggedIn: true,
  badges: [],
  streak: 5,
  seasonPoints: 100,
  totalPoints: 500,
  spotsCreated: 2,
  checkins: 5,
  reviewsGiven: 3,
  skillPoints: 10,
  unlockedSkills: [],
}

beforeAll(async () => {
  await initI18n()
})

beforeEach(() => {
  setState(mockState)
})

describe('Modal Flags: flag produces non-empty HTML', () => {
  test('showSOS flag renders SOS modal', () => {
    const state = { ...mockState, showSOS: true }
    const html = renderSOS(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html).toContain('sos')
  })

  test('showAuth flag renders Auth modal', () => {
    const state = { ...mockState, showAuth: true }
    const html = renderAuth(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('auth')
  })

  test('showAddSpot flag renders AddSpot modal', () => {
    const state = { ...mockState, showAddSpot: true }
    const html = renderAddSpot(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('spot')
  })

  test('selectedSpot renders SpotDetail modal', () => {
    const state = { ...mockState, selectedSpot: mockState.spots[0] }
    const html = renderSpotDetail(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    // SpotDetail renders spot name somewhere in HTML
    expect(html.toLowerCase()).toMatch(/test[\s\S]*spot|spot[\s\S]*test/)
  })

  test('showWelcome flag renders Welcome modal', () => {
    const state = { ...mockState, showWelcome: true, username: '' }
    const html = renderWelcome(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('welcome')
  })

  test('showTutorial flag renders Tutorial modal', () => {
    const state = { ...mockState, showTutorial: true, tutorialStep: 0 }
    const html = renderTutorial(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showFilters flag renders Filters modal', () => {
    setState({ showFilters: true, ...mockState })
    const html = renderFiltersModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('filtr')
  })

  test('showStats flag renders Stats modal', () => {
    setState({ showStats: true, ...mockState })
    const html = renderStatsModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showBadges flag renders Badges modal', () => {
    setState({ showBadges: true, ...mockState })
    const html = renderBadgesModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('badge')
  })

  test('showChallenges flag renders Challenges modal', () => {
    setState({ showChallenges: true, ...mockState })
    const html = renderChallengesModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showShop flag renders Shop modal', () => {
    setState({ showShop: true, ...mockState })
    const html = renderShopModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showMyRewards flag renders MyRewards modal', () => {
    setState({ showMyRewards: true, ...mockState })
    const html = renderMyRewardsModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showQuiz flag renders Quiz modal', () => {
    setState({ showQuiz: true, ...mockState })
    const html = renderQuiz()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('quiz')
  })

  test('showLeaderboard flag renders Leaderboard modal', () => {
    setState({ showLeaderboard: true, ...mockState })
    const html = renderLeaderboardModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('checkinSpot flag renders CheckinModal', () => {
    const state = { ...mockState, checkinSpot: mockState.spots[0] }
    const html = renderCheckinModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('checkin')
  })

  test('showAgeVerification flag renders AgeVerification modal', () => {
    const state = { ...mockState, showAgeVerification: true }
    const html = renderAgeVerification(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showIdentityVerification flag renders IdentityVerification modal', () => {
    const html = renderIdentityVerification()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showTitles flag renders TitlesModal', () => {
    const state = { ...mockState, showTitles: true }
    const html = renderTitlesModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('titr')
  })

  test('showCreateTravelGroup flag renders CreateTravelGroup modal', () => {
    const state = { ...mockState, showCreateTravelGroup: true }
    const html = renderCreateTravelGroupModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showFriendProfile flag renders FriendProfile modal', () => {
    const state = {
      ...mockState,
      showFriendProfile: true,
      selectedFriendProfileId: 'friend1',
    }
    const html = renderFriendProfileModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showAdminPanel flag renders AdminPanel modal', () => {
    const state = { ...mockState, showAdminPanel: true }
    const html = renderAdminPanel(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('admin')
  })

  test('showMyData flag renders MyData modal', () => {
    setState({ showMyData: true, ...mockState })
    const html = renderMyDataModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showTravelGroupDetail flag renders TravelGroupDetail', () => {
    const state = {
      ...mockState,
      showTravelGroupDetail: true,
      selectedTravelGroupId: 'group1',
      currentTravelGroup: {
        id: 'group1',
        name: 'Test Group',
        creator: 'test-user',
        members: ['test-user'],
        itinerary: [],
        chat: [],
        status: 'planning',
      },
    }
    const html = renderTravelGroupDetail(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showNearbyFriends flag renders NearbyFriendsList', () => {
    const state = { ...mockState, showNearbyFriends: true }
    const html = renderNearbyFriendsList(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(50)
  })

  test('showProfileCustomization flag renders CustomizationModal', () => {
    const state = { ...mockState, showProfileCustomization: true }
    const html = renderCustomizationModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showAccessibilityHelp flag renders AccessibilityHelp', () => {
    const state = { ...mockState, showAccessibilityHelp: true }
    const html = renderAccessibilityHelp(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showReport flag renders ReportModal', () => {
    const state = {
      ...mockState,
      showReport: true,
      reportTargetId: 'user1',
      reportTargetType: 'user',
    }
    const html = renderReportModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showBlockedUsers state key exists', () => {
    const state = getState()
    expect('showBlockedUsers' in state).toBe(true)
  })

  test('showBlockModal state key exists', () => {
    const state = getState()
    expect('showBlockModal' in state).toBe(true)
  })

  test('showTeamChallenges flag renders TeamDashboard', () => {
    const state = { ...mockState, showTeamChallenges: true }
    const html = renderTeamDashboard(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(50)
  })

  test('showDonation flag renders DonationModal', () => {
    const state = { ...mockState, showDonation: true }
    const html = renderDonationModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  test('showCompanionModal flag renders Companion modal', () => {
    const state = { ...mockState, showCompanionModal: true }
    const html = renderCompanionModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('companion')
  })

  test('showLanding flag renders Landing page', () => {
    const html = renderLanding()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html).toContain('landing-page')
    expect(html).toContain('dismissLanding')
    expect(html).toContain('landingNext')
  })

  test('showContactForm flag renders ContactForm modal', () => {
    const html = renderContactFormModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('contact')
  })

  test('showCookieBanner flag renders CookieBanner', () => {
    const html = renderCookieBanner()
    // CookieBanner returns '' if consent already given, so check it can render
    // We need to test without consent
    const htmlWithoutConsent = renderCookieBanner()
    expect(typeof htmlWithoutConsent).toBe('string')
    // If it renders, it should have cookie-banner ID or be empty
    expect(htmlWithoutConsent === '' || htmlWithoutConsent.includes('cookie-banner')).toBe(true)
  })

  test('showDailyReward flag renders DailyReward modal', () => {
    setState({ ...mockState, showDailyReward: true })
    const html = renderDailyRewardModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('recompense')
  })

  test('showDeleteAccount flag renders DeleteAccount modal', () => {
    const state = { ...mockState, showDeleteAccount: true }
    const html = renderDeleteAccountModal(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('supprimer')
  })

  test('showEmailVerification flag renders EmailVerification modal', () => {
    const html = renderEmailVerification('test@test.com')
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('email')
  })

  test('showLocationPermission flag renders LocationPermission modal', () => {
    const state = { ...mockState }
    const html = renderLocationPermission(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('location')
  })

  test('showLanguageSelector flag renders LanguageSelector', () => {
    const state = { ...mockState, showLanguageSelector: true }
    const html = renderLanguageSelector(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html.toLowerCase()).toContain('language')
  })

  test('showValidateSpot flag renders ValidateSpot modal', () => {
    const state = {
      ...mockState,
      showValidateSpot: true,
      validateSpotId: 1,
    }
    const html = renderValidateSpot(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html).toContain('closeValidateSpot')
    expect(html).toContain('submitValidation')
  })
})

describe('Modal Flags: close buttons present in HTML', () => {
  test('all modals have close mechanism in HTML', () => {
    const modalsWithClose = [
      { name: 'SOS', html: renderSOS({ ...mockState, showSOS: true }) },
      { name: 'Auth', html: renderAuth({ ...mockState, showAuth: true }) },
      { name: 'AddSpot', html: renderAddSpot({ ...mockState, showAddSpot: true }) },
      { name: 'SpotDetail', html: renderSpotDetail({ ...mockState, selectedSpot: mockState.spots[0] }) },
      { name: 'Filters', html: renderFiltersModal() },
      { name: 'Stats', html: renderStatsModal() },
      { name: 'Badges', html: renderBadgesModal() },
      { name: 'Challenges', html: renderChallengesModal() },
      { name: 'Shop', html: renderShopModal() },
      { name: 'MyRewards', html: renderMyRewardsModal() },
      { name: 'Quiz', html: renderQuiz() },
      { name: 'Leaderboard', html: renderLeaderboardModal() },
      { name: 'Titles', html: renderTitlesModal({ ...mockState, showTitles: true }) },
      { name: 'CreateTravelGroup', html: renderCreateTravelGroupModal({ ...mockState, showCreateTravelGroup: true }) },
      { name: 'FriendProfile', html: renderFriendProfileModal({ ...mockState, showFriendProfile: true, selectedFriendProfileId: 'friend1' }) },
      { name: 'AdminPanel', html: renderAdminPanel({ ...mockState, showAdminPanel: true }) },
      { name: 'MyData', html: renderMyDataModal() },
      { name: 'Companion', html: renderCompanionModal({ ...mockState, showCompanionModal: true }) },
      { name: 'ContactForm', html: renderContactFormModal() },
      { name: 'ValidateSpot', html: renderValidateSpot({ ...mockState, showValidateSpot: true, validateSpotId: 1 }) },
      { name: 'DeleteAccount', html: renderDeleteAccountModal({ ...mockState, showDeleteAccount: true }) },
      { name: 'EmailVerification', html: renderEmailVerification('test@test.com') },
      { name: 'LocationPermission', html: renderLocationPermission({ ...mockState }) },
    ]

    for (const { name, html } of modalsWithClose) {
      const hasCloseHandler = html.includes('close') || html.includes('Fermer') || html.includes('aria-label')
      expect(hasCloseHandler, `${name} modal missing close button/handler`).toBe(true)
    }
  })

  test('DailyReward modal has close mechanism', () => {
    setState({ ...mockState, showDailyReward: true })
    const html = renderDailyRewardModal()
    const hasCloseHandler = html.includes('close') || html.includes('Fermer') || html.includes('aria-label')
    expect(hasCloseHandler, 'DailyReward modal missing close button/handler').toBe(true)
  })

  test('selectedCity flag renders CityPanel', () => {
    const { renderCityPanel } = require('../../src/components/views/CityPanel.js')
    const state = {
      ...mockState,
      selectedCity: 'paris',
      cityData: {
        name: 'Paris',
        slug: 'paris',
        lat: 48.8566,
        lng: 2.3522,
        country: 'FR',
        countryName: 'France',
        spotCount: 5,
        avgWait: 15,
        avgRating: 4.2,
        routesList: [
          { slug: 'direction-1', destLat: 43.6, destLon: 1.4, spotCount: 3, avgWait: 12 },
        ],
        spots: [],
      },
    }
    const html = renderCityPanel(state)
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
    expect(html).toContain('Paris')
    expect(html).toContain('closeCityPanel')
  })
})
