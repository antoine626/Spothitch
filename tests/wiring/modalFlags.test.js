/**
 * Wiring Tests - Modal Flags
 * Verifies each state flag produces non-empty HTML with expected elements
 *
 * RULE: Every new modal MUST have its flag tested here.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { setState, getState } from '../../src/stores/state.js'

// Modals that take state param
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

// Modals that use getState() internally (no param)
import { renderFiltersModal } from '../../src/components/modals/Filters.js'
import { renderStatsModal } from '../../src/components/modals/Stats.js'
import { renderBadgesModal } from '../../src/components/modals/Badges.js'
import { renderChallengesModal } from '../../src/components/modals/Challenges.js'
import { renderShopModal, renderMyRewardsModal } from '../../src/components/modals/Shop.js'
import { renderQuiz } from '../../src/components/modals/Quiz.js'
import { renderLeaderboardModal } from '../../src/components/modals/Leaderboard.js'
import { renderMyDataModal } from '../../src/components/modals/MyData.js'

// Service renders
import { renderSkillTree } from '../../src/services/skillTree.js'
import { renderTravelGroupDetail } from '../../src/services/travelGroups.js'
import { renderNearbyFriendsList } from '../../src/services/nearbyFriends.js'
import { renderCustomizationModal } from '../../src/services/profileCustomization.js'
import { renderAccessibilityHelp } from '../../src/services/screenReader.js'
import { renderReportModal } from '../../src/services/moderation.js'
import { renderTeamDashboard } from '../../src/services/teamChallenges.js'
import { renderDonationModal } from '../../src/components/ui/DonationCard.js'

const mockSpot = {
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
  badges: ['first_checkin'],
  rewards: [],
  spots: [mockSpot],
  friends: [
    { id: 'friend1', name: 'Alice', avatar: '👩', level: 3, badges: ['first_checkin'] },
  ],
  emergencyContacts: [{ name: 'Mom', phone: '+33600000000' }],
  travelGroups: [
    { id: 'group1', name: 'Europe Trip', members: ['test-user'], itinerary: [], chat: [] },
  ],
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
  selectedTravelGroupId: 'group1',
  reportTargetId: 'user1',
  reportTargetType: 'user',
}

// Set global state for no-param modals
beforeAll(() => {
  setState({
    ...baseState,
    showFilters: true,
    showStats: true,
    showBadges: true,
    showChallenges: true,
    showShop: true,
    showMyRewards: true,
    showQuiz: true,
    showLeaderboard: true,
    showMyData: true,
  })
})

describe('Modal Flags: each flag produces non-empty HTML', () => {
  // Helper: test a modal renders non-empty HTML with close button
  function testModalFlag(name, renderFn, stateOverrides = {}, { hasCloseButton = true, hasTitle = true } = {}) {
    it(`${name}: renders non-empty HTML`, () => {
      const state = { ...baseState, ...stateOverrides }
      let html
      try {
        html = typeof renderFn === 'function' && renderFn.length === 0
          ? renderFn()
          : renderFn(state)
      } catch {
        try {
          html = renderFn()
        } catch {
          // If it genuinely can't render, that's a real failure
          expect.fail(`${name} render function threw an error`)
        }
      }

      // HTML must be non-empty
      expect(html, `${name} returned empty/falsy HTML`).toBeTruthy()
      expect(typeof html).toBe('string')
      expect(html.length, `${name} HTML is too short`).toBeGreaterThan(50)
    })

    if (hasCloseButton) {
      it(`${name}: has a close button or backdrop close`, () => {
        const state = { ...baseState, ...stateOverrides }
        let html
        try {
          html = typeof renderFn === 'function' && renderFn.length === 0
            ? renderFn()
            : renderFn(state)
        } catch {
          html = renderFn()
        }
        if (!html) return

        // Check for close handler (closeX, fa-times icon, or backdrop onclick)
        const hasClose = html.includes('close') || html.includes('fa-times') || html.includes('Fermer')
        expect(hasClose, `${name} has no close mechanism`).toBe(true)
      })
    }
  }

  // ---- Modals with state param ----
  testModalFlag('showSOS → SOS', renderSOS, { showSOS: true })
  testModalFlag('showAuth → Auth', renderAuth, { showAuth: true })
  testModalFlag('showAddSpot → AddSpot', renderAddSpot, { showAddSpot: true })
  testModalFlag('selectedSpot → SpotDetail', renderSpotDetail, { selectedSpot: mockSpot })
  testModalFlag('showWelcome → Welcome', renderWelcome, { showWelcome: true }, { hasCloseButton: false })
  testModalFlag('showTutorial → Tutorial', renderTutorial, { showTutorial: true, tutorialStep: 0 }, { hasCloseButton: false })
  testModalFlag('showAgeVerification → AgeVerification', renderAgeVerification, { showAgeVerification: true }, { hasCloseButton: false })
  testModalFlag('showIdentityVerification → IdentityVerification', () => renderIdentityVerification(), {}, { hasCloseButton: true })
  testModalFlag('showTitles → TitlesModal', renderTitlesModal, { showTitles: true })
  testModalFlag('showCreateTravelGroup → CreateTravelGroup', renderCreateTravelGroupModal, { showCreateTravelGroup: true })
  testModalFlag('showFriendProfile → FriendProfile', renderFriendProfileModal, {
    showFriendProfile: true,
    selectedFriendProfileId: 'friend1',
    friends: baseState.friends,
  })
  testModalFlag('showAdminPanel → AdminPanel', renderAdminPanel, { showAdminPanel: true })
  testModalFlag('checkinSpot → CheckinModal', renderCheckinModal, { checkinSpot: mockSpot })

  // ---- Modals without param (use getState()) ----
  testModalFlag('showFilters → Filters', renderFiltersModal)
  testModalFlag('showStats → Stats', renderStatsModal)
  testModalFlag('showBadges → Badges', renderBadgesModal)
  testModalFlag('showChallenges → Challenges', renderChallengesModal)
  testModalFlag('showShop → Shop', renderShopModal)
  testModalFlag('showMyRewards → MyRewards', renderMyRewardsModal)
  testModalFlag('showQuiz → Quiz', renderQuiz)
  testModalFlag('showLeaderboard → Leaderboard', renderLeaderboardModal)
  testModalFlag('showMyData → MyData', renderMyDataModal)

  // ---- Service renders ----
  testModalFlag('showSkillTree → SkillTree', renderSkillTree, { showSkillTree: true }, { hasCloseButton: false })
  testModalFlag('showTravelGroupDetail → TravelGroupDetail', renderTravelGroupDetail, {
    showTravelGroupDetail: true,
    selectedTravelGroupId: 'group1',
    currentTravelGroup: {
      id: 'group1',
      name: 'Europe Trip',
      creator: 'test-user',
      members: ['test-user'],
      itinerary: [],
      chat: [],
      status: 'planning',
      maxMembers: 6,
      description: 'A fun trip',
    },
  })
  testModalFlag('showNearbyFriends → NearbyFriendsList', renderNearbyFriendsList, { showNearbyFriends: true })
  testModalFlag('showProfileCustomization → CustomizationModal', renderCustomizationModal, { showProfileCustomization: true })
  testModalFlag('showAccessibilityHelp → AccessibilityHelp', renderAccessibilityHelp, { showAccessibilityHelp: true })
  testModalFlag('showReport → ReportModal', renderReportModal, {
    showReport: true,
    reportTargetId: 'user1',
    reportTargetType: 'user',
  })
  testModalFlag('showTeamChallenges → TeamDashboard', renderTeamDashboard, { showTeamChallenges: true }, { hasCloseButton: false })
  testModalFlag('showDonation → DonationModal', renderDonationModal, { showDonation: true })
})

describe('Modal Flags: accessibility attributes', () => {
  const accessibleModals = [
    { name: 'SOS', fn: renderSOS, state: { showSOS: true }, roleOverride: 'alertdialog' },
    { name: 'Auth', fn: renderAuth, state: { showAuth: true } },
    { name: 'AddSpot', fn: renderAddSpot, state: { showAddSpot: true } },
    { name: 'TitlesModal', fn: renderTitlesModal, state: { showTitles: true } },
    { name: 'CreateTravelGroup', fn: renderCreateTravelGroupModal, state: { showCreateTravelGroup: true } },
  ]

  for (const { name, fn, state: overrides, roleOverride } of accessibleModals) {
    it(`${name} has role="${roleOverride || 'dialog'}" and aria-modal="true"`, () => {
      const state = { ...baseState, ...overrides }
      let html
      try {
        html = fn(state)
      } catch {
        html = fn()
      }
      if (!html) return

      const expectedRole = roleOverride || 'dialog'
      expect(html).toContain(`role="${expectedRole}"`)
      expect(html).toContain('aria-modal="true"')
    })
  }
})
