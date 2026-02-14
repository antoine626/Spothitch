/**
 * Integration Tests - All Modals
 * Tests the complete lifecycle: open → content → close → action
 *
 * RULE: Every new modal MUST have its integration test here.
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { getState, setState, resetState } from '../../src/stores/state.js'

// ---- Modal renders ----
import { renderSOS } from '../../src/components/modals/SOS.js'
import { renderAuth } from '../../src/components/modals/Auth.js'
import { renderAddSpot } from '../../src/components/modals/AddSpot.js'
import { renderSpotDetail } from '../../src/components/modals/SpotDetail.js'
import { renderWelcome } from '../../src/components/modals/Welcome.js'
import { renderTutorial } from '../../src/components/modals/Tutorial.js'
import { renderAgeVerification } from '../../src/components/modals/AgeVerification.js'
import { renderIdentityVerification } from '../../src/components/modals/IdentityVerification.js'
import { renderTitlesModal } from '../../src/components/modals/TitlesModal.js'
import { renderCreateTravelGroupModal } from '../../src/components/modals/CreateTravelGroup.js'
import { renderFriendProfileModal } from '../../src/components/modals/FriendProfile.js'
import { renderAdminPanel } from '../../src/components/modals/AdminPanel.js'
import { renderCheckinModal } from '../../src/components/modals/CheckinModal.js'
import { renderFiltersModal } from '../../src/components/modals/Filters.js'
import { renderStatsModal } from '../../src/components/modals/Stats.js'
import { renderBadgesModal, renderBadgePopup } from '../../src/components/modals/Badges.js'
import { renderChallengesModal } from '../../src/components/modals/Challenges.js'
import { renderShopModal, renderMyRewardsModal } from '../../src/components/modals/Shop.js'
import { renderQuiz } from '../../src/components/modals/Quiz.js'
import { renderLeaderboardModal } from '../../src/components/modals/Leaderboard.js'
import { renderMyDataModal } from '../../src/components/modals/MyData.js'
import { renderTravelGroupDetail } from '../../src/services/travelGroups.js'
import { renderNearbyFriendsList } from '../../src/services/nearbyFriends.js'
import { renderCustomizationModal } from '../../src/services/profileCustomization.js'
import { renderAccessibilityHelp } from '../../src/services/screenReader.js'
import { renderReportModal } from '../../src/services/moderation.js'
import { renderTeamDashboard } from '../../src/services/teamChallenges.js'
import { renderDonationModal } from '../../src/components/ui/DonationCard.js'

// ---- Test data ----
const mockSpot = {
  id: 1,
  name: 'Test Spot Paris',
  from: 'Paris Porte de Bagnolet',
  to: 'Lyon',
  city: 'Paris',
  country: 'FR',
  coordinates: { lat: 48.8566, lng: 2.3522 },
  globalRating: 4.5,
  totalRatings: 10,
  totalReviews: 10,
  avgWaitTime: 15,
  description: 'Un bon spot de test',
  photoUrl: 'photo1.jpg',
  photos: ['photo1.jpg'],
  waitTime: 15,
  verified: true,
  createdBy: 'other-user',
}

const baseState = {
  user: { uid: 'test-user', displayName: 'TestUser', email: 'test@test.com' },
  username: 'TestUser',
  avatar: '🤙',
  isLoggedIn: true,
  activeTab: 'map',
  theme: 'dark',
  lang: 'fr',
  points: 500,
  level: 5,
  checkins: 20,
  spotsCreated: 5,
  reviewsGiven: 10,
  streak: 3,
  badges: ['first_checkin', 'explorer'],
  rewards: [],
  spots: [mockSpot],
  friends: [
    { id: 'friend1', name: 'Alice', avatar: '👩', level: 3, badges: ['first_checkin'] },
    { id: 'friend2', name: 'Bob', avatar: '🧑', level: 7, badges: [] },
  ],
  emergencyContacts: [{ name: 'Mom', phone: '+33600000000' }],
  travelGroups: [],
  seasonPoints: 100,
  totalPoints: 500,
  userLocation: { lat: 48.8566, lng: 2.3522 },
  isOnline: true,
  sosActive: false,
  checkinHistory: [],
  verificationLevel: 0,
  profileFrame: null,
  profileTitle: null,
  tripFrom: '',
  tripTo: '',
  tripResults: null,
  savedTrips: [],
  messages: [],
  chatRoom: 'general',
  tutorialStep: 0,
  tutorialCompleted: false,
  selectedFriendProfileId: 'friend1',
}

beforeEach(() => {
  setState(baseState)
})

// ===============================================================
// 1. SOS Modal
// ===============================================================
describe('Integration: SOS Modal', () => {
  it('opens with showSOS flag', () => {
    setState({ showSOS: true })
    const html = renderSOS(getState())
    expect(html).toBeTruthy()
    expect(html).toContain('sos-modal-title')
  })

  it('contains share location button', () => {
    const html = renderSOS({ ...baseState, showSOS: true })
    expect(html).toContain('shareSOSLocation')
    expect(html).toContain('sos-share-btn')
  })

  it('contains emergency contact form', () => {
    const html = renderSOS({ ...baseState, showSOS: true })
    expect(html).toContain('emergency-name')
    expect(html).toContain('emergency-phone')
    expect(html).toContain('addEmergencyContact')
  })

  it('shows existing emergency contacts', () => {
    const html = renderSOS({ ...baseState, showSOS: true })
    expect(html).toContain('Mom')
    expect(html).toContain('+33600000000')
  })

  it('contains SOS templates', () => {
    const html = renderSOS({ ...baseState, showSOS: true })
    expect(html).toContain('sendSOSTemplate')
  })

  it('closes with closeSOS', () => {
    setState({ showSOS: true })
    expect(getState().showSOS).toBe(true)
    setState({ showSOS: false })
    expect(getState().showSOS).toBe(false)
  })
})

// ===============================================================
// 2. Auth Modal
// ===============================================================
describe('Integration: Auth Modal', () => {
  it('opens with showAuth flag', () => {
    setState({ showAuth: true })
    const html = renderAuth(getState())
    expect(html).toBeTruthy()
    expect(html).toContain('auth-modal-title')
  })

  it('has login and register tabs', () => {
    const html = renderAuth({ ...baseState, showAuth: true })
    expect(html).toContain('setAuthMode')
    expect(html).toContain('auth-tab-login')
    expect(html).toContain('auth-tab-register')
  })

  it('has email and password fields', () => {
    const html = renderAuth({ ...baseState, showAuth: true })
    expect(html).toContain('auth-email')
    expect(html).toContain('auth-password')
  })

  it('has Google sign-in option', () => {
    const html = renderAuth({ ...baseState, showAuth: true })
    expect(html).toContain('Google')
  })

  it('has close button', () => {
    const html = renderAuth({ ...baseState, showAuth: true })
    expect(html).toContain('closeAuth')
  })

  it('closes with closeAuth', () => {
    setState({ showAuth: true })
    setState({ showAuth: false })
    expect(getState().showAuth).toBe(false)
  })
})

// ===============================================================
// 3. Filters Modal
// ===============================================================
describe('Integration: Filters Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showFilters: true })
  })

  it('renders when showFilters is true', () => {
    const html = renderFiltersModal()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(100)
  })

  it('has rating filter options', () => {
    const html = renderFiltersModal()
    expect(html).toContain('setFilterMinRating')
    expect(html).toContain('setFilterMaxWait')
  })

  it('has apply and reset buttons', () => {
    const html = renderFiltersModal()
    expect(html).toContain('applyFilters')
    expect(html).toContain('resetFilters')
  })

  it('has rating filter', () => {
    const html = renderFiltersModal()
    expect(html).toContain('setFilterMinRating')
  })

  it('has verified toggle', () => {
    const html = renderFiltersModal()
    expect(html).toContain('toggleVerifiedFilter')
  })

  it('closes with closeFilters', () => {
    setState({ showFilters: false })
    const html = renderFiltersModal()
    expect(html).toBe('')
  })
})

// ===============================================================
// 4. AddSpot Modal
// ===============================================================
describe('Integration: AddSpot Modal', () => {
  it('opens with showAddSpot flag', () => {
    const html = renderAddSpot({ ...baseState, showAddSpot: true })
    expect(html).toBeTruthy()
    expect(html).toContain('addspot-modal-title')
  })

  it('has photo upload trigger', () => {
    const html = renderAddSpot({ ...baseState, showAddSpot: true })
    expect(html).toContain('triggerPhotoUpload')
  })

  it('has location button', () => {
    const html = renderAddSpot({ ...baseState, showAddSpot: true })
    expect(html).toContain('getSpotLocation')
  })

  it('has close button', () => {
    const html = renderAddSpot({ ...baseState, showAddSpot: true })
    expect(html).toContain('closeAddSpot')
  })
})

// ===============================================================
// 5. SpotDetail Modal
// ===============================================================
describe('Integration: SpotDetail Modal', () => {
  const stateWithSpot = { ...baseState, selectedSpot: mockSpot }

  it('opens when selectedSpot is set', () => {
    const html = renderSpotDetail(stateWithSpot)
    expect(html).toBeTruthy()
  })

  it('shows spot from/to', () => {
    const html = renderSpotDetail(stateWithSpot)
    expect(html).toContain('Paris Porte de Bagnolet')
    expect(html).toContain('Lyon')
  })

  it('shows rating', () => {
    const html = renderSpotDetail(stateWithSpot)
    expect(html).toContain('4.5')
  })

  it('has close button', () => {
    const html = renderSpotDetail(stateWithSpot)
    expect(html).toContain('closeSpotDetail')
  })

  it('has checkin button', () => {
    const html = renderSpotDetail(stateWithSpot)
    expect(html).toContain('openCheckinModal')
  })
})

// ===============================================================
// 6. Badges Modal
// ===============================================================
describe('Integration: Badges Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showBadges: true })
  })

  it('renders when showBadges is true', () => {
    const html = renderBadgesModal()
    expect(html).toBeTruthy()
  })

  it('shows badge categories', () => {
    const html = renderBadgesModal()
    expect(html.length).toBeGreaterThan(200)
  })

  it('has close button', () => {
    const html = renderBadgesModal()
    expect(html).toContain('closeBadges')
  })

  it('returns empty when showBadges is false', () => {
    setState({ showBadges: false })
    const html = renderBadgesModal()
    expect(html).toBe('')
  })
})

// ===============================================================
// 7. Challenges Modal
// ===============================================================
describe('Integration: Challenges Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showChallenges: true })
  })

  it('renders when showChallenges is true', () => {
    const html = renderChallengesModal()
    expect(html).toBeTruthy()
  })

  it('has challenge tabs', () => {
    const html = renderChallengesModal()
    expect(html).toContain('setChallengeTab')
  })

  it('has close button', () => {
    const html = renderChallengesModal()
    expect(html).toContain('closeChallenges')
  })
})

// ===============================================================
// 8. Shop Modal
// ===============================================================
describe('Integration: Shop Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showShop: true })
  })

  it('renders when showShop is true', () => {
    const html = renderShopModal()
    expect(html).toBeTruthy()
  })

  it('has shop categories', () => {
    const html = renderShopModal()
    expect(html).toContain('setShopCategory')
  })

  it('has close button', () => {
    const html = renderShopModal()
    expect(html).toContain('closeShop')
  })

  it('shows user points', () => {
    const html = renderShopModal()
    expect(html).toContain('500')
  })
})

// ===============================================================
// 9. MyRewards Modal
// ===============================================================
describe('Integration: MyRewards Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showMyRewards: true })
  })

  it('renders when showMyRewards is true', () => {
    const html = renderMyRewardsModal()
    expect(html).toBeTruthy()
  })

  it('has close button', () => {
    const html = renderMyRewardsModal()
    expect(html).toContain('closeMyRewards')
  })
})

// ===============================================================
// 10. Quiz Modal
// ===============================================================
describe('Integration: Quiz Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showQuiz: true })
  })

  it('renders when showQuiz is true', () => {
    const html = renderQuiz()
    expect(html).toBeTruthy()
    expect(html).toContain('quiz')
  })

  it('has start button or question', () => {
    const html = renderQuiz()
    expect(html).toContain('startQuizGame') || expect(html).toContain('answerQuizQuestion')
  })

  it('has close button', () => {
    const html = renderQuiz()
    expect(html).toContain('closeQuiz')
  })
})

// ===============================================================
// 11. Leaderboard Modal
// ===============================================================
describe('Integration: Leaderboard Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showLeaderboard: true })
  })

  it('renders when showLeaderboard is true', () => {
    const html = renderLeaderboardModal()
    expect(html).toBeTruthy()
  })

  it('has close button', () => {
    const html = renderLeaderboardModal()
    expect(html).toContain('closeLeaderboard')
  })
})

// ===============================================================
// 12. Stats Modal
// ===============================================================
describe('Integration: Stats Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showStats: true })
  })

  it('renders when showStats is true', () => {
    const html = renderStatsModal()
    expect(html).toBeTruthy()
  })

  it('shows user stats', () => {
    const html = renderStatsModal()
    expect(html).toContain('500') // points
  })

  it('has close button', () => {
    const html = renderStatsModal()
    expect(html).toContain('closeStats')
  })
})

// ===============================================================
// 13. Welcome Modal
// ===============================================================
describe('Integration: Welcome Modal', () => {
  it('renders for new users', () => {
    const html = renderWelcome({ ...baseState, showWelcome: true, username: '' })
    expect(html).toBeTruthy()
  })

  it('has avatar selection', () => {
    const html = renderWelcome({ ...baseState, showWelcome: true, username: '' })
    expect(html).toContain('selectAvatar') || expect(html).toContain('avatar')
  })

  it('has complete/skip buttons', () => {
    const html = renderWelcome({ ...baseState, showWelcome: true, username: '' })
    const hasComplete = html.includes('completeWelcome') || html.includes('skipWelcome')
    expect(hasComplete).toBe(true)
  })
})

// ===============================================================
// 14. Tutorial Modal
// ===============================================================
describe('Integration: Tutorial Modal', () => {
  it('renders at step 0', () => {
    const html = renderTutorial({ ...baseState, showTutorial: true, tutorialStep: 0 })
    expect(html).toBeTruthy()
  })

  it('has navigation buttons', () => {
    const html = renderTutorial({ ...baseState, showTutorial: true, tutorialStep: 1 })
    const hasNav = html.includes('nextTutorial') || html.includes('prevTutorial') || html.includes('skipTutorial')
    expect(hasNav).toBe(true)
  })

  it('has skip button', () => {
    const html = renderTutorial({ ...baseState, showTutorial: true, tutorialStep: 0 })
    expect(html).toContain('skipTutorial')
  })
})

// ===============================================================
// 15. TitlesModal
// ===============================================================
describe('Integration: TitlesModal', () => {
  it('renders with level', () => {
    const html = renderTitlesModal({ ...baseState, showTitles: true })
    expect(html).toBeTruthy()
    expect(html).toContain('titles-modal-title')
  })

  it('shows current title for level 5', () => {
    const html = renderTitlesModal({ ...baseState, level: 5, showTitles: true })
    expect(html).toContain('Niveau 5')
  })

  it('has close button', () => {
    const html = renderTitlesModal({ ...baseState, showTitles: true })
    expect(html).toContain('closeTitles')
  })
})

// ===============================================================
// 16. CreateTravelGroup Modal
// ===============================================================
describe('Integration: CreateTravelGroup Modal', () => {
  it('renders with form', () => {
    const html = renderCreateTravelGroupModal({ ...baseState, showCreateTravelGroup: true })
    expect(html).toBeTruthy()
    expect(html).toContain('create-group-title')
  })

  it('has group name input', () => {
    const html = renderCreateTravelGroupModal(baseState)
    expect(html).toContain('group-name')
  })

  it('has submit button', () => {
    const html = renderCreateTravelGroupModal(baseState)
    expect(html).toContain('submitCreateTravelGroup')
  })

  it('has close button', () => {
    const html = renderCreateTravelGroupModal(baseState)
    expect(html).toContain('closeCreateTravelGroup')
  })
})

// ===============================================================
// 17. FriendProfile Modal
// ===============================================================
describe('Integration: FriendProfile Modal', () => {
  const friendState = {
    ...baseState,
    showFriendProfile: true,
    selectedFriendProfileId: 'friend1',
  }

  it('renders friend info', () => {
    const html = renderFriendProfileModal(friendState)
    expect(html).toBeTruthy()
    expect(html).toContain('Alice')
  })

  it('shows friend avatar', () => {
    const html = renderFriendProfileModal(friendState)
    expect(html).toContain('👩')
  })

  it('has close button', () => {
    const html = renderFriendProfileModal(friendState)
    expect(html).toContain('closeFriendProfile')
  })

  it('returns empty for unknown friend', () => {
    const html = renderFriendProfileModal({
      ...friendState,
      selectedFriendProfileId: 'nonexistent',
    })
    expect(html).toBe('')
  })
})

// ===============================================================
// 18. AdminPanel Modal
// ===============================================================
describe('Integration: AdminPanel Modal', () => {
  it('renders admin panel', () => {
    const html = renderAdminPanel({ ...baseState, showAdminPanel: true })
    expect(html).toBeTruthy()
    expect(html).toContain('Panneau Admin')
  })

  it('shows user points in admin', () => {
    const html = renderAdminPanel({ ...baseState, showAdminPanel: true, points: 500 })
    expect(html).toContain('500')
  })

  it('has close button', () => {
    const html = renderAdminPanel(baseState)
    expect(html).toContain('closeAdminPanel')
  })

  it('has admin action buttons', () => {
    const html = renderAdminPanel(baseState)
    expect(html).toContain('adminAddPoints')
  })
})

// ===============================================================
// 19. AgeVerification Modal
// ===============================================================
describe('Integration: AgeVerification Modal', () => {
  it('renders age verification form', () => {
    const html = renderAgeVerification({ ...baseState, showAgeVerification: true })
    expect(html).toBeTruthy()
  })

  it('has date input', () => {
    const html = renderAgeVerification(baseState)
    expect(html).toContain('date') || expect(html).toContain('age')
  })
})

// ===============================================================
// 20. IdentityVerification Modal
// ===============================================================
describe('Integration: IdentityVerification Modal', () => {
  it('renders identity verification', () => {
    const html = renderIdentityVerification()
    expect(html).toBeTruthy()
  })

  it('has step navigation', () => {
    const html = renderIdentityVerification()
    expect(html).toContain('startVerificationStep') || expect(html).toContain('verification')
  })

  it('has close button', () => {
    const html = renderIdentityVerification()
    expect(html).toContain('closeIdentityVerification')
  })
})

// ===============================================================
// 21. MyData Modal (RGPD)
// ===============================================================
describe('Integration: MyData Modal', () => {
  beforeEach(() => {
    setState({ ...baseState, showMyData: true })
  })

  it('renders RGPD data view', () => {
    const html = renderMyDataModal()
    expect(html).toBeTruthy()
  })

  it('has download data button', () => {
    const html = renderMyDataModal()
    expect(html).toContain('downloadMyData')
  })

  it('has delete account option', () => {
    const html = renderMyDataModal()
    expect(html).toContain('requestAccountDeletion')
  })

  it('has close button', () => {
    const html = renderMyDataModal()
    expect(html).toContain('closeMyData')
  })
})

// ===============================================================
// 22. ProfileCustomization Modal (was 23)
// ===============================================================
describe('Integration: ProfileCustomization Modal', () => {
  it('renders customization options', () => {
    const html = renderCustomizationModal({ ...baseState, showProfileCustomization: true })
    expect(html).toBeTruthy()
  })

  it('has frame and title sections', () => {
    const html = renderCustomizationModal({ ...baseState, showProfileCustomization: true })
    const hasCustomization = html.includes('equipFrameAction') || html.includes('equipTitleAction') || html.includes('frame') || html.includes('title') || html.includes('Cadre') || html.includes('Titre')
    expect(hasCustomization).toBe(true)
  })
})

// ===============================================================
// 24. NearbyFriends Modal
// ===============================================================
describe('Integration: NearbyFriends Modal', () => {
  it('renders nearby friends list', () => {
    const html = renderNearbyFriendsList({ ...baseState, showNearbyFriends: true })
    expect(html).toBeTruthy()
  })
})

// ===============================================================
// 25. ReportModal
// ===============================================================
describe('Integration: ReportModal', () => {
  it('renders report reasons', () => {
    const html = renderReportModal({
      ...baseState,
      showReport: true,
      reportTargetId: 'user1',
      reportTargetType: 'user',
    })
    expect(html).toBeTruthy()
  })

  it('has submit button', () => {
    const html = renderReportModal({
      ...baseState,
      showReport: true,
      reportTargetId: 'user1',
      reportTargetType: 'user',
    })
    expect(html).toContain('submitCurrentReport') || expect(html).toContain('selectReportReason')
  })

  it('has close button', () => {
    const html = renderReportModal({
      ...baseState,
      showReport: true,
      reportTargetId: 'user1',
      reportTargetType: 'user',
    })
    expect(html).toContain('closeReport')
  })
})

// ===============================================================
// 26. AccessibilityHelp Modal
// ===============================================================
describe('Integration: AccessibilityHelp Modal', () => {
  it('renders accessibility help', () => {
    const html = renderAccessibilityHelp({ ...baseState, showAccessibilityHelp: true })
    expect(html).toBeTruthy()
  })

  it('has keyboard shortcuts info', () => {
    const html = renderAccessibilityHelp({ ...baseState, showAccessibilityHelp: true })
    const hasA11y = html.includes('clavier') || html.includes('keyboard') || html.includes('raccourci') || html.includes('Escape') || html.includes('accessib')
    expect(hasA11y).toBe(true)
  })

  it('has close button', () => {
    const html = renderAccessibilityHelp({ ...baseState, showAccessibilityHelp: true })
    expect(html).toContain('closeAccessibilityHelp')
  })
})

// ===============================================================
// 27. TeamDashboard
// ===============================================================
describe('Integration: TeamDashboard', () => {
  it('renders team dashboard', () => {
    const html = renderTeamDashboard({ ...baseState, showTeamChallenges: true })
    expect(html).toBeTruthy()
  })

  it('shows create/join team option when no team', () => {
    const html = renderTeamDashboard({ ...baseState, myTeam: null })
    const hasTeamAction = html.includes('createTeam') || html.includes('joinTeam') || html.includes('openCreateTeam') || html.includes('openJoinTeam')
    expect(hasTeamAction).toBe(true)
  })
})

// ===============================================================
// 28. DonationModal
// ===============================================================
describe('Integration: DonationModal', () => {
  it('renders donation modal', () => {
    const html = renderDonationModal({ ...baseState, showDonation: true })
    expect(html).toBeTruthy()
  })

  it('has close button', () => {
    const html = renderDonationModal({ ...baseState, showDonation: true })
    expect(html).toContain('closeDonation')
  })
})

// ===============================================================
// 29. CheckinModal
// ===============================================================
describe('Integration: CheckinModal', () => {
  const checkinState = { ...baseState, checkinSpot: mockSpot }

  it('renders checkin form', () => {
    const html = renderCheckinModal(checkinState)
    expect(html).toBeTruthy()
  })

  it('shows spot from/to', () => {
    const html = renderCheckinModal(checkinState)
    expect(html).toContain('Paris Porte de Bagnolet')
    expect(html).toContain('Lyon')
  })

  it('has submit button', () => {
    const html = renderCheckinModal(checkinState)
    expect(html).toContain('submitCheckin') || expect(html).toContain('checkin')
  })
})

// ===============================================================
// 30. State flag toggle tests (cross-cutting)
// ===============================================================
describe('Integration: State flag toggles', () => {
  const flags = [
    'showSOS', 'showAuth', 'showAddSpot', 'showFilters', 'showStats',
    'showBadges', 'showChallenges', 'showShop', 'showMyRewards', 'showQuiz',
    'showLeaderboard', 'showTitles', 'showTeamChallenges',
    'showCreateTravelGroup', 'showFriendProfile', 'showAdminPanel',
    'showMyData', 'showDonation', 'showNearbyFriends', 'showAccessibilityHelp',
    'showProfileCustomization', 'showReport', 'showTravelGroupDetail',
    'showAgeVerification', 'showIdentityVerification',
  ]

  for (const flag of flags) {
    it(`${flag}: can be toggled on and off`, () => {
      setState({ [flag]: true })
      expect(getState()[flag]).toBe(true)
      setState({ [flag]: false })
      expect(getState()[flag]).toBe(false)
    })
  }
})
