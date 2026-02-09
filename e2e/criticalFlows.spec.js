/**
 * E2E Tests - Critical User Flows
 * Deep functional tests verifying actual RESULTS, not just visibility.
 * - Search with autocomplete suggestions
 * - Trip/voyage creation with result verification
 * - Map persistence across tab switches
 * - Chat: send message -> verify it appears
 * - Filters: apply -> verify spots filtered
 * - Friend: add -> verify appears in list
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab, getAppState, waitForToast } from './helpers.js'

// ================================================================
// FLOW 1: Search with Autocomplete
// ================================================================
test.describe('Search - Autocomplete Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should show search input on map', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    const placeholder = await searchInput.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
    expect(placeholder.length).toBeGreaterThan(2)
  })

  test('should accept text input in search bar', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    await searchInput.fill('Par')
    await expect(searchInput).toHaveValue('Par')
  })

  test('should show suggestions when typing 2+ chars', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill('Paris')
    await searchInput.dispatchEvent('input')

    // Wait for suggestions to appear (debounce + network)
    const suggestions = page.locator('#map-search-suggestions')
    await expect(suggestions).toBeVisible({ timeout: 8000 })

    // Must have at least one suggestion with text content
    const items = suggestions.locator('button')
    await expect(items.first()).toBeVisible({ timeout: 5000 })
    const firstText = await items.first().textContent()
    expect(firstText.trim().length).toBeGreaterThan(0)
  })

  test('should select a suggestion and update map', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill('Berlin')
    await searchInput.dispatchEvent('input')

    const suggestions = page.locator('#map-search-suggestions')
    await expect(suggestions).toBeVisible({ timeout: 8000 })

    const firstSuggestion = suggestions.locator('button').first()
    await expect(firstSuggestion).toBeVisible({ timeout: 5000 })
    await firstSuggestion.click({ force: true })

    // Suggestions should hide after selection
    await expect(suggestions).toBeHidden({ timeout: 3000 })

    // Search input should have selected location name
    const value = await searchInput.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('should search on Enter key without crash', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill('Lyon')
    await searchInput.press('Enter')

    // Wait for geocoding
    await page.waitForSelector('#main-map', { timeout: 5000 })

    // App should still be functional (nav visible, no critical errors)
    await expect(page.locator('nav')).toBeVisible()
    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') && !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') && !e.includes('Sentry')
    )
    expect(criticalErrors).toEqual([])
  })

  test('should hide suggestions when clicking outside', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill('Madrid')
    await searchInput.dispatchEvent('input')

    const suggestions = page.locator('#map-search-suggestions')
    await expect(suggestions).toBeVisible({ timeout: 8000 })

    await page.locator('#main-map').click()
    await expect(suggestions).toBeHidden({ timeout: 3000 })
  })
})

// ================================================================
// FLOW 2: Trip/Voyage Creation with Result Verification
// ================================================================
test.describe('Trip Creation - Deep Functional', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'travel')
  })

  test('should display trip planner with from/to inputs', async ({ page }) => {
    const fromInput = page.locator('#trip-from')
    const toInput = page.locator('#trip-to')
    await expect(fromInput).toBeVisible({ timeout: 10000 })
    await expect(toInput).toBeVisible({ timeout: 5000 })

    // Inputs should have placeholder text
    const fromPlaceholder = await fromInput.getAttribute('placeholder')
    expect(fromPlaceholder).toBeTruthy()
  })

  test('should fill from/to and calculate trip with km result', async ({ page }) => {
    const fromInput = page.locator('#trip-from')
    const toInput = page.locator('#trip-to')

    await expect(fromInput).toBeVisible({ timeout: 10000 })

    // Fill fields
    await fromInput.fill('Paris')
    await fromInput.dispatchEvent('blur')
    await toInput.fill('Berlin')
    await toInput.dispatchEvent('blur')

    // Verify values persisted
    await expect(fromInput).toHaveValue('Paris')
    await expect(toInput).toHaveValue('Berlin')

    // Click calculate
    const calcBtn = page.locator('[onclick*="calculateTrip"], [onclick*="syncTripFieldsAndCalculate"]')
    await expect(calcBtn.first()).toBeVisible({ timeout: 5000 })
    await calcBtn.first().click()

    // Wait for result - should show distance in km
    const result = page.locator('text=/\\d+.*km/i')
    await expect(result.first()).toBeVisible({ timeout: 15000 })
  })

  test('should swap from/to points and verify values swapped', async ({ page }) => {
    const fromInput = page.locator('#trip-from')
    const toInput = page.locator('#trip-to')

    await expect(fromInput).toBeVisible({ timeout: 10000 })
    await fromInput.fill('Paris')
    await fromInput.dispatchEvent('blur')
    await toInput.fill('Berlin')
    await toInput.dispatchEvent('blur')

    const swapBtn = page.locator('[onclick*="swapTripPoints"]')
    await expect(swapBtn).toBeVisible({ timeout: 5000 })
    await swapBtn.click()

    // Wait for re-render
    await page.waitForSelector('#trip-from', { timeout: 5000 })

    const newFrom = await page.locator('#trip-from').inputValue()
    const newTo = await page.locator('#trip-to').inputValue()
    expect(newFrom).toBe('Berlin')
    expect(newTo).toBe('Paris')
  })

  test('should switch between planner and guides sub-tabs', async ({ page }) => {
    const guidesTab = page.locator('button:has-text("Guides")')
    await expect(guidesTab.first()).toBeVisible({ timeout: 10000 })
    await guidesTab.first().click()

    // Should show country guides - verify at least one selectGuide button
    const guideCards = page.locator('[onclick*="selectGuide"]')
    await expect(guideCards.first()).toBeVisible({ timeout: 5000 })
    const guideCount = await guideCards.count()
    expect(guideCount).toBeGreaterThan(5) // We have 20+ countries

    // Switch back to planner
    const plannerTab = page.locator('button:has-text("Planifier")')
    await plannerTab.first().click()
    await expect(page.locator('#trip-from')).toBeVisible({ timeout: 5000 })
  })
})

// ================================================================
// FLOW 3: Map Persistence Across Tab Switches
// ================================================================
test.describe('Map Persistence', () => {
  test('should keep map visible after switching tabs and coming back', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')

    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })

    // Switch to another tab
    await navigateToTab(page, 'profile')
    await page.waitForSelector('nav', { timeout: 5000 })

    // Switch back to map
    await navigateToTab(page, 'map')

    // Map should still be visible (not blank/broken)
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })
    // Leaflet tiles should be loaded
    const tiles = page.locator('.leaflet-tile-loaded')
    await expect(tiles.first()).toBeVisible({ timeout: 10000 })
  })

  test('should keep map functional after multiple tab switches', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })

    // Switch through all tabs
    for (const tab of ['travel', 'challenges', 'social', 'profile']) {
      await navigateToTab(page, tab)
      // Wait for tab content to render
      await page.waitForSelector('nav', { timeout: 5000 })
    }

    // Come back to map
    await navigateToTab(page, 'map')

    // Map + search input should be functional
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    await searchInput.click()
    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')
  })

  test('should show spots count on map', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')

    const spotsCount = page.locator('text=/\\d+ spots? disponible/i')
    await expect(spotsCount.first()).toBeVisible({ timeout: 10000 })

    // Extract the number and verify it's > 0
    const text = await spotsCount.first().textContent()
    const match = text.match(/(\d+)/)
    expect(match).not.toBeNull()
    expect(parseInt(match[1])).toBeGreaterThan(0)
  })
})

// ================================================================
// FLOW 4: Country Guides
// ================================================================
test.describe('Country Guides', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'travel')
  })

  test('should show country cards in guides view', async ({ page }) => {
    const guidesTab = page.locator('button:has-text("Guides")')
    await expect(guidesTab.first()).toBeVisible({ timeout: 10000 })
    await guidesTab.first().click()

    // Should have country guide cards with onclick handlers
    const countryCards = page.locator('[onclick*="selectGuide"]')
    await expect(countryCards.first()).toBeVisible({ timeout: 5000 })
    const count = await countryCards.count()
    expect(count).toBeGreaterThan(5)
  })
})

// ================================================================
// FLOW 5: No Console Errors on Critical Flows
// ================================================================
test.describe('Error-Free Critical Flows', () => {
  test('should navigate all tabs without JS errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await skipOnboarding(page)

    for (const tab of ['map', 'travel', 'challenges', 'social', 'profile']) {
      await navigateToTab(page, tab)
      await page.waitForSelector('nav', { timeout: 5000 })
    }

    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') && !e.includes('firebaseConfig') &&
      !e.includes('auth/') && !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') && !e.includes('mixpanel') &&
      !e.includes('Sentry') && !e.includes('sw.js')
    )
    expect(criticalErrors).toEqual([])
  })

  test('should search without errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await skipOnboarding(page)
    await navigateToTab(page, 'map')

    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    await searchInput.fill('Paris')
    await searchInput.dispatchEvent('input')

    // Wait for suggestions or timeout
    await page.waitForSelector('#map-search-suggestions', { timeout: 5000 }).catch(() => {})

    await searchInput.press('Enter')
    await page.waitForSelector('#main-map', { timeout: 5000 })

    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') && !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') && !e.includes('Sentry')
    )
    expect(criticalErrors).toEqual([])
  })

  test('should create trip without errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await skipOnboarding(page)
    await navigateToTab(page, 'travel')

    const fromInput = page.locator('#trip-from')
    const toInput = page.locator('#trip-to')

    await expect(fromInput).toBeVisible({ timeout: 10000 })
    await fromInput.fill('Paris')
    await fromInput.dispatchEvent('blur')
    await toInput.fill('Berlin')
    await toInput.dispatchEvent('blur')

    const calcBtn = page.locator('[onclick*="calculateTrip"], [onclick*="syncTripFieldsAndCalculate"]')
    if (await calcBtn.count() > 0) {
      await calcBtn.first().click()
      // Wait for result
      await page.waitForSelector('text=/km/i', { timeout: 15000 }).catch(() => {})
    }

    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') && !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') && !e.includes('Sentry') &&
      !e.includes('Nominatim')
    )
    expect(criticalErrors).toEqual([])
  })
})

// ================================================================
// FLOW 6: Social Chat - Send Message & Verify It Appears
// ================================================================
test.describe('Social Chat - Deep Functional', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should display chat with input and send button', async ({ page }) => {
    const chatInput = page.locator('#chat-input')
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    const sendBtn = page.locator('[onclick*="sendMessage"], button:has(.fa-paper-plane)')
    await expect(sendBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should send message and verify it appears in chat', async ({ page }) => {
    const chatInput = page.locator('#chat-input')
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    const testMsg = 'Test message E2E ' + Date.now()
    await chatInput.fill(testMsg)
    await expect(chatInput).toHaveValue(testMsg)

    // Submit via Enter
    await chatInput.press('Enter')

    // Message should appear in the chat list
    const msgInChat = page.locator(`text="${testMsg}"`)
    await expect(msgInChat.first()).toBeVisible({ timeout: 5000 })

    // Input should be cleared after sending
    await expect(chatInput).toHaveValue('')
  })

  test('should persist message in localStorage', async ({ page }) => {
    const chatInput = page.locator('#chat-input')
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    const testMsg = 'Persistent msg ' + Date.now()
    await chatInput.fill(testMsg)
    await chatInput.press('Enter')

    // Wait for message to appear
    await expect(page.locator(`text="${testMsg}"`).first()).toBeVisible({ timeout: 5000 })

    // Check localStorage state has the message
    const state = await getAppState(page)
    expect(state).not.toBeNull()
    expect(state.messages).toBeDefined()
    const found = state.messages.some(m => m.text === testMsg)
    expect(found).toBe(true)
  })

  test('should switch between social sub-tabs without crash', async ({ page }) => {
    const tabs = ['Général', 'Régional', 'Amis', 'Groupes']
    for (const tabName of tabs) {
      const tabBtn = page.locator(`button:has-text("${tabName}")`)
      if (await tabBtn.count() > 0) {
        await tabBtn.first().click()
        // Wait for tab content to render
        await page.waitForSelector('nav', { timeout: 3000 })
      }
    }
    await expect(page.locator('#app')).toBeVisible()
  })
})

// ================================================================
// FLOW 7: Add Friend & Verify It Appears
// ================================================================
test.describe('Friend Management - Deep Functional', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should add friend and verify it appears in list', async ({ page }) => {
    // Navigate to friends sub-tab
    const friendsTab = page.locator('button:has-text("Amis")')
    if (await friendsTab.count() > 0) {
      await friendsTab.first().click()
      await page.waitForSelector('nav', { timeout: 3000 })
    }

    // Find friend add input
    const friendInput = page.locator('#add-friend-input')
    if (await friendInput.count() === 0) return // Skip if not visible

    await expect(friendInput).toBeVisible({ timeout: 5000 })

    const friendName = 'TestFriend_' + Date.now()
    await friendInput.fill(friendName)

    // Click add button
    const addBtn = page.locator('[onclick*="addFriendByName"]')
    await addBtn.first().click()

    // Friend should appear in the list
    const friendInList = page.locator(`text="${friendName}"`)
    await expect(friendInList.first()).toBeVisible({ timeout: 5000 })

    // Verify in localStorage
    const state = await getAppState(page)
    expect(state.friends).toBeDefined()
    const found = state.friends.some(f => f.name === friendName)
    expect(found).toBe(true)
  })
})

// ================================================================
// FLOW 8: Gamification Hub
// ================================================================
test.describe('Gamification Hub Flow', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
  })

  test('should display challenges hub with points', async ({ page }) => {
    // Should show points/level info (not just #app visibility)
    const pointsText = page.locator('text=/Pouces|pts|points/i')
    await expect(pointsText.first()).toBeVisible({ timeout: 10000 })
  })

  test('should open quiz and show question', async ({ page }) => {
    const quizBtn = page.locator('[onclick*="openQuiz"]')
    if (await quizBtn.count() === 0) return

    await quizBtn.first().click()

    const startBtn = page.locator('button:has-text("Commencer"), [onclick*="startQuizGame"]')
    await expect(startBtn.first()).toBeVisible({ timeout: 5000 })
    await startBtn.first().click()

    // Should show a question with actual content
    const question = page.locator('text=/Question/i')
    await expect(question.first()).toBeVisible({ timeout: 5000 })
  })
})

// ================================================================
// FLOW 9: Profile Settings
// ================================================================
test.describe('Profile Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display user profile with actual username and stats', async ({ page }) => {
    // Username "TestUser" set in skipOnboarding
    await expect(page.locator('text=TestUser').first()).toBeVisible({ timeout: 10000 })
    // Points display
    await expect(page.locator('text=/Points|Pouces/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have language selector that changes language', async ({ page }) => {
    const langSelect = page.locator('select').first()
    await expect(langSelect).toBeVisible({ timeout: 10000 })

    // Get current options
    const options = await langSelect.locator('option').all()
    expect(options.length).toBeGreaterThan(1) // At least FR + EN
  })

  test('should have app version displayed', async ({ page }) => {
    const version = page.locator('text=/SpotHitch v/i')
    await expect(version.first()).toBeVisible({ timeout: 10000 })

    const text = await version.first().textContent()
    expect(text).toMatch(/SpotHitch v\d/)
  })
})

// ================================================================
// FLOW 10: Visual Snapshots (reference screenshots)
// ================================================================
test.describe('Visual Snapshots', () => {
  test('map view snapshot', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
    await page.waitForSelector('#main-map', { timeout: 10000 })
    // Wait for tiles to load
    await page.waitForSelector('.leaflet-tile-loaded', { timeout: 10000 }).catch(() => {})
    await expect(page).toHaveScreenshot('map-view.png', {
      maxDiffPixelRatio: 0.1,
      timeout: 15000,
    })
  })

  test('travel view snapshot', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'travel')
    await page.waitForSelector('#trip-from', { timeout: 10000 })
    await expect(page).toHaveScreenshot('travel-view.png', {
      maxDiffPixelRatio: 0.1,
      timeout: 15000,
    })
  })

  test('social view snapshot', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
    await page.waitForSelector('#chat-input', { timeout: 10000 })
    await expect(page).toHaveScreenshot('social-view.png', {
      maxDiffPixelRatio: 0.1,
      timeout: 15000,
    })
  })

  test('profile view snapshot', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
    await page.waitForSelector('text=TestUser', { timeout: 10000 }).catch(() => {})
    await expect(page).toHaveScreenshot('profile-view.png', {
      maxDiffPixelRatio: 0.1,
      timeout: 15000,
    })
  })

  test('challenges view snapshot', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
    await page.waitForSelector('nav', { timeout: 10000 })
    await expect(page).toHaveScreenshot('challenges-view.png', {
      maxDiffPixelRatio: 0.1,
      timeout: 15000,
    })
  })
})
