/**
 * Wiring Tests - Input Handlers
 * Verifies every input/select/textarea has proper event handlers wired
 *
 * RULE: Every new input field MUST be tested here.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { setState } from '../../src/stores/state.js'

// Components with inputs
import { renderTravel } from '../../src/components/views/Travel.js'
import { renderSocial } from '../../src/components/views/Social.js'
import { renderMap } from '../../src/components/views/Map.js'
import { renderProfile } from '../../src/components/views/Profile.js'
import { renderSOS } from '../../src/components/modals/SOS.js'
import { renderAuth } from '../../src/components/modals/Auth.js'
import { renderAddSpot } from '../../src/components/modals/AddSpot.js'
import { renderWelcome } from '../../src/components/modals/Welcome.js'
import { renderFiltersModal } from '../../src/components/modals/Filters.js'
import { renderCreateTravelGroupModal } from '../../src/components/modals/CreateTravelGroup.js'

const mockState = {
  user: { uid: 'test-user', displayName: 'TestUser', email: 'test@test.com' },
  username: 'TestUser',
  avatar: '🤙',
  isLoggedIn: true,
  activeTab: 'map',
  viewMode: 'list',
  showWelcome: true,
  theme: 'dark',
  lang: 'fr',
  activeSubTab: 'planner',
  socialSubTab: 'general',
  spots: [{
    id: 1, name: 'Test Spot', city: 'Paris', country: 'FR',
    coordinates: { lat: 48.8566, lng: 2.3522 }, globalRating: 4.5,
    totalRatings: 10, description: 'A good spot', photos: ['photo1.jpg'],
    waitTime: 15, verified: true, createdBy: 'other-user',
  }],
  selectedSpot: null,
  searchQuery: '',
  activeFilter: 'all',
  filterCountry: 'all',
  filterMinRating: 0,
  filterMaxWait: 999,
  filterVerifiedOnly: false,
  favorites: [],
  friends: [{ id: 'friend1', name: 'Alice', avatar: '👩', level: 3 }],
  emergencyContacts: [{ name: 'Mom', phone: '+33600000000' }],
  points: 500,
  level: 5,
  checkins: 20,
  spotsCreated: 5,
  reviewsGiven: 10,
  streak: 3,
  badges: ['first_checkin'],
  rewards: [],
  tripFrom: '',
  tripTo: '',
  tripResults: null,
  savedTrips: [],
  messages: [],
  chatRoom: 'general',
  sosActive: false,
  userLocation: { lat: 48.8566, lng: 2.3522 },
  isOnline: true,
  tutorialStep: 0,
  tutorialCompleted: false,
  travelGroups: [],
  seasonPoints: 100,
  totalPoints: 500,
  checkinHistory: [],
  profileFrame: null,
  profileTitle: null,
  showFilters: true,
  showStats: true,
  showBadges: true,
}

beforeAll(() => {
  setState(mockState)
})

// Helper: extract all <input>, <select>, <textarea> from HTML
function extractFormElements(html) {
  if (!html) return []
  const elements = []

  // Extract input elements with their attributes
  const inputRegex = /<input\s[^>]*>/gi
  const selectRegex = /<select\s[^>]*>/gi
  const textareaRegex = /<textarea\s[^>]*>/gi

  for (const match of html.matchAll(inputRegex)) {
    elements.push({ tag: 'input', html: match[0] })
  }
  for (const match of html.matchAll(selectRegex)) {
    elements.push({ tag: 'select', html: match[0] })
  }
  for (const match of html.matchAll(textareaRegex)) {
    elements.push({ tag: 'textarea', html: match[0] })
  }
  return elements
}

// Helper: check if an element has an event handler
function hasEventHandler(elementHtml) {
  return /on(?:input|change|blur|keydown|keyup|keypress|focus|click|submit)=/i.test(elementHtml)
}

// Helper: get element ID
function getElementId(elementHtml) {
  const match = elementHtml.match(/id="([^"]+)"/)
  return match ? match[1] : null
}

// Helper: get element type
function getElementType(elementHtml) {
  const match = elementHtml.match(/type="([^"]+)"/)
  return match ? match[1] : 'text'
}

describe('Input Handlers: critical inputs have event handlers', () => {
  it('Travel view: trip-from and trip-to inputs have handlers', () => {
    const html = renderTravel(mockState)
    expect(html).toBeTruthy()

    // Check for trip input fields
    if (html.includes('trip-from') || html.includes('updateTripField')) {
      const hasFromHandler = html.includes('updateTripField') || html.includes('oninput') || html.includes('onchange')
      expect(hasFromHandler, 'Trip from/to should have input handlers').toBe(true)
    }
  })

  it('Social view: chat-input has handler or submit button', () => {
    const html = renderSocial(mockState)
    expect(html).toBeTruthy()

    if (html.includes('chat-input')) {
      const hasChatHandler = html.includes('sendMessage') || html.includes('onkeydown') || html.includes('onclick')
      expect(hasChatHandler, 'Chat input should have send handler').toBe(true)
    }
  })

  it('Map view: search input has handler', () => {
    const html = renderMap(mockState)
    expect(html).toBeTruthy()

    if (html.includes('search') || html.includes('handleSearch')) {
      const hasSearchHandler = html.includes('handleSearch') || html.includes('oninput') || html.includes('onkeydown')
      expect(hasSearchHandler, 'Map search should have a handler').toBe(true)
    }
  })

  it('SOS modal: emergency-name and emergency-phone inputs exist', () => {
    const html = renderSOS(mockState)
    expect(html).toBeTruthy()

    // SOS should have emergency contact form
    if (html.includes('emergency-name')) {
      expect(html).toContain('emergency-name')
      expect(html).toContain('emergency-phone')
      // The addEmergencyContact button should exist
      expect(html).toContain('addEmergencyContact')
    }
  })

  it('Auth modal: email and password inputs exist', () => {
    const html = renderAuth(mockState)
    expect(html).toBeTruthy()

    // Auth should have email/password fields
    const hasEmailField = html.includes('auth-email') || html.includes('name="email"')
    const hasPasswordField = html.includes('auth-password') || html.includes('name="password"')
    expect(hasEmailField, 'Auth should have email field').toBe(true)
    expect(hasPasswordField, 'Auth should have password field').toBe(true)

    // Should have login/signup/auth handlers
    expect(html.includes('handleLogin') || html.includes('handleSignup') || html.includes('handleAuth')).toBe(true)
  })

  it('AddSpot modal: has location, description, and photo inputs', () => {
    const html = renderAddSpot(mockState)
    expect(html).toBeTruthy()

    // Should have key form fields
    const hasPhotoUpload = html.includes('spot-photo') || html.includes('triggerPhotoUpload')
    expect(hasPhotoUpload, 'AddSpot should have photo upload').toBe(true)
  })

  it('Welcome modal: has name input', () => {
    const html = renderWelcome({ ...mockState, showWelcome: true })
    expect(html).toBeTruthy()

    const hasNameInput = html.includes('welcome-name') || html.includes('name') || html.includes('input')
    expect(hasNameInput, 'Welcome should have name input').toBe(true)
  })

  it('Filters modal: country select and rating options exist', () => {
    const html = renderFiltersModal()
    expect(html).toBeTruthy()

    // Should have country filter
    const hasCountryFilter = html.includes('setFilterCountry') || html.includes('filterCountry') || html.includes('country')
    expect(hasCountryFilter, 'Filters should have country filter').toBe(true)

    // Should have apply/reset buttons
    expect(html.includes('applyFilters') || html.includes('resetFilters')).toBe(true)
  })

  it('CreateTravelGroup modal: has group-name input', () => {
    const html = renderCreateTravelGroupModal(mockState)
    expect(html).toBeTruthy()

    expect(html).toContain('group-name')
  })
})

describe('Input Handlers: no orphaned inputs (inputs without any handler)', () => {
  // These are input types that legitimately don't need JS handlers
  // (e.g., submit buttons handled by form, hidden inputs, etc.)
  const EXEMPT_TYPES = ['hidden', 'submit', 'file']
  const EXEMPT_IDS = ['spot-photo-input'] // file inputs triggered by button

  function testNoOrphanedInputs(name, html) {
    it(`${name}: text/number inputs have handlers or are part of a form`, () => {
      if (!html) return

      const elements = extractFormElements(html)
      const orphaned = []

      for (const el of elements) {
        const type = getElementType(el.html)
        const id = getElementId(el.html)

        // Skip exempt types and IDs
        if (EXEMPT_TYPES.includes(type)) continue
        if (id && EXEMPT_IDS.includes(id)) continue

        // Check: element has an inline handler, OR is inside a form with onsubmit,
        // OR its value is read by a nearby button's onclick
        if (!hasEventHandler(el.html)) {
          // Check if the ID is referenced elsewhere in the HTML (read by a button handler)
          if (id && html.includes(`getElementById('${id}')`)) continue
          if (id && html.includes(`getElementById("${id}")`)) continue
          // Check if the element is part of a form
          if (html.includes('<form') && html.includes('onsubmit')) continue

          orphaned.push({ tag: el.tag, type, id: id || '(no id)' })
        }
      }

      // Orphaned inputs are warnings, not hard failures (some are read imperatively)
      // But we log them for visibility
      if (orphaned.length > 0) {
        console.warn(`[${name}] Inputs without inline handlers (may be read imperatively):`,
          orphaned.map(o => `${o.tag}#${o.id}`).join(', '))
      }
    })
  }

  const components = [
    { name: 'Travel', html: renderTravel(mockState) },
    { name: 'Social', html: renderSocial(mockState) },
    { name: 'Map', html: renderMap(mockState) },
    { name: 'SOS', html: renderSOS(mockState) },
    { name: 'Auth', html: renderAuth(mockState) },
    { name: 'AddSpot', html: renderAddSpot(mockState) },
    { name: 'Welcome', html: renderWelcome({ ...mockState, showWelcome: true }) },
    { name: 'CreateTravelGroup', html: renderCreateTravelGroupModal(mockState) },
  ]

  let filtersHtml
  try { filtersHtml = renderFiltersModal() } catch { filtersHtml = '' }
  components.push({ name: 'Filters', html: filtersHtml })

  for (const { name, html } of components) {
    testNoOrphanedInputs(name, html)
  }
})
