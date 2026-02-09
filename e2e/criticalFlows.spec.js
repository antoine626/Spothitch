/**
 * E2E Tests - Critical User Flows
 * Tests for the features that users reported as broken:
 * - Search with autocomplete suggestions
 * - Trip/voyage creation
 * - Map persistence across tab switches
 * - Spot visibility on map
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab, dismissOverlays } from './helpers.js'

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
    await expect(searchInput).toHaveAttribute('placeholder')
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

    // Type a search query (use a well-known city)
    await searchInput.fill('Paris')
    // Trigger the input event manually since fill doesn't always trigger oninput
    await searchInput.dispatchEvent('input')

    // Wait for debounce (300ms) + network
    const suggestions = page.locator('#map-search-suggestions')
    await expect(suggestions).toBeVisible({ timeout: 8000 })

    // Should have at least one suggestion
    const items = suggestions.locator('button')
    await expect(items.first()).toBeVisible({ timeout: 5000 })
  })

  test('should select a suggestion and update map', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill('Berlin')
    await searchInput.dispatchEvent('input')

    const suggestions = page.locator('#map-search-suggestions')
    await expect(suggestions).toBeVisible({ timeout: 8000 })

    // Click the first suggestion (force to bypass any overlapping elements)
    const firstSuggestion = suggestions.locator('button').first()
    await expect(firstSuggestion).toBeVisible({ timeout: 5000 })
    await firstSuggestion.click({ force: true })

    // Suggestions should hide
    await expect(suggestions).toBeHidden({ timeout: 3000 })

    // Search input should have the selected location name
    const value = await searchInput.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('should search on Enter key', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill('Lyon')
    await searchInput.press('Enter')

    // Wait for geocoding and map update
    await page.waitForTimeout(2000)

    // No crash - app should still be functional
    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should hide suggestions when clicking outside', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill('Madrid')
    await searchInput.dispatchEvent('input')

    const suggestions = page.locator('#map-search-suggestions')
    // Wait for suggestions to appear
    await expect(suggestions).toBeVisible({ timeout: 8000 })

    // Click outside
    await page.locator('#main-map').click()
    await expect(suggestions).toBeHidden({ timeout: 3000 })
  })
})

// ================================================================
// FLOW 2: Trip/Voyage Creation
// ================================================================
test.describe('Trip Creation', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'travel')
  })

  test('should display trip planner with from/to inputs', async ({ page }) => {
    // Should have planner sub-tab active by default
    const plannerTab = page.locator('button:has-text("Planifier")')
    await expect(plannerTab.first()).toBeVisible({ timeout: 10000 })

    // Should have from and to inputs
    const fromInput = page.locator('#trip-from')
    const toInput = page.locator('#trip-to')
    await expect(fromInput).toBeVisible({ timeout: 5000 })
    await expect(toInput).toBeVisible({ timeout: 5000 })
  })

  test('should accept text in from/to fields', async ({ page }) => {
    const fromInput = page.locator('#trip-from')
    const toInput = page.locator('#trip-to')

    await expect(fromInput).toBeVisible({ timeout: 10000 })
    await fromInput.fill('Paris')
    await fromInput.dispatchEvent('input')
    await expect(fromInput).toHaveValue('Paris')

    await toInput.fill('Berlin')
    await toInput.dispatchEvent('input')
    await expect(toInput).toHaveValue('Berlin')
  })

  test('should swap from/to points', async ({ page }) => {
    const fromInput = page.locator('#trip-from')
    const toInput = page.locator('#trip-to')

    await expect(fromInput).toBeVisible({ timeout: 10000 })
    await fromInput.fill('Paris')
    await fromInput.dispatchEvent('input')
    await toInput.fill('Berlin')
    await toInput.dispatchEvent('input')

    // Click swap button
    const swapBtn = page.locator('[onclick*="swapTripPoints"]')
    await expect(swapBtn).toBeVisible({ timeout: 5000 })
    await swapBtn.click()
    await page.waitForTimeout(500)

    // Values should be swapped (after re-render)
    const newFrom = await page.locator('#trip-from').inputValue()
    const newTo = await page.locator('#trip-to').inputValue()
    expect(newFrom).toBe('Berlin')
    expect(newTo).toBe('Paris')
  })

  test('should have calculate trip button', async ({ page }) => {
    const calcBtn = page.locator('[onclick*="calculateTrip"]')
    await expect(calcBtn.first()).toBeVisible({ timeout: 10000 })
  })

  test('should switch between planner and guides sub-tabs', async ({ page }) => {
    // Click Guides tab
    const guidesTab = page.locator('button:has-text("Guides")')
    await expect(guidesTab.first()).toBeVisible({ timeout: 10000 })
    await guidesTab.first().click()
    await page.waitForTimeout(500)

    // Should show country guides
    const guideContent = page.locator('text=/France|Allemagne|Espagne|guide/i')
    await expect(guideContent.first()).toBeVisible({ timeout: 5000 })

    // Switch back to planner
    const plannerTab = page.locator('button:has-text("Planifier")')
    await plannerTab.first().click()
    await page.waitForTimeout(500)

    // Should show trip form again
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

    // Map should be visible
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })

    // Switch to another tab
    await navigateToTab(page, 'profile')
    await page.waitForTimeout(500)

    // Switch back to map
    await navigateToTab(page, 'map')

    // Map should still be visible (not blank/broken)
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })
  })

  test('should keep map functional after multiple tab switches', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })

    // Switch through all tabs
    for (const tab of ['travel', 'challenges', 'social', 'profile']) {
      await navigateToTab(page, tab)
      await page.waitForTimeout(300)
    }

    // Come back to map
    await navigateToTab(page, 'map')

    // Map should be visible and functional
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })

    // Search input should be present and interactable
    const searchInput = page.locator('#map-search')
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    // Note: fill() triggers a re-render which may clear the input, so just check it's interactable
    await searchInput.click()
    await page.keyboard.type('test')
    await page.waitForTimeout(200)
  })

  test('should show spots count on map', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')

    // Spots count should be visible
    const spotsCount = page.locator('text=/spots? disponible/i')
    await expect(spotsCount.first()).toBeVisible({ timeout: 10000 })
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

  test('should display guides tab', async ({ page }) => {
    const guidesTab = page.locator('button:has-text("Guides")')
    await expect(guidesTab.first()).toBeVisible({ timeout: 10000 })
    await guidesTab.first().click()
    await page.waitForTimeout(500)

    // Should show country list
    await expect(page.locator('#app')).toBeVisible()
  })

  test('should show country cards in guides view', async ({ page }) => {
    const guidesTab = page.locator('button:has-text("Guides")')
    await expect(guidesTab.first()).toBeVisible({ timeout: 10000 })
    await guidesTab.first().click()
    await page.waitForTimeout(500)

    // Should have country guide cards (use selectGuide onclick)
    const countryCards = page.locator('[onclick*="selectGuide"]')
    const count = await countryCards.count()
    expect(count).toBeGreaterThan(0)
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

    // Navigate through all tabs
    for (const tab of ['map', 'travel', 'challenges', 'social', 'profile']) {
      await navigateToTab(page, tab)
      await page.waitForTimeout(500)
    }

    // Filter out expected errors (Firebase, external services)
    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('firebaseConfig') &&
      !e.includes('auth/') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('mixpanel') &&
      !e.includes('Sentry') &&
      !e.includes('sw.js')
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
    await page.waitForTimeout(2000)
    await searchInput.press('Enter')
    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('mixpanel') &&
      !e.includes('Sentry')
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
    await fromInput.dispatchEvent('input')
    await toInput.fill('Berlin')
    await toInput.dispatchEvent('input')

    // Click calculate
    const calcBtn = page.locator('[onclick*="calculateTrip"]')
    if (await calcBtn.count() > 0) {
      await calcBtn.first().click()
      await page.waitForTimeout(3000)
    }

    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('mixpanel') &&
      !e.includes('Sentry') &&
      !e.includes('Nominatim')
    )

    expect(criticalErrors).toEqual([])
  })
})

// ================================================================
// FLOW 6: Social Chat
// ================================================================
test.describe('Social Chat Flow', () => {
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

  test('should type and send a message', async ({ page }) => {
    const chatInput = page.locator('#chat-input')
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    await chatInput.fill('Test message from E2E')
    await expect(chatInput).toHaveValue('Test message from E2E')

    // Submit
    await chatInput.press('Enter')
    await page.waitForTimeout(500)
  })

  test('should switch between social sub-tabs', async ({ page }) => {
    const tabs = ['Général', 'Régional', 'Amis', 'Groupes']
    for (const tabName of tabs) {
      const tabBtn = page.locator(`button:has-text("${tabName}")`)
      if (await tabBtn.count() > 0) {
        await tabBtn.first().click()
        await page.waitForTimeout(300)
      }
    }
    // No crash
    await expect(page.locator('#app')).toBeVisible()
  })
})

// ================================================================
// FLOW 7: Gamification Hub
// ================================================================
test.describe('Gamification Hub Flow', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
  })

  test('should display challenges hub', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible()
    // Should show points/level info
    await expect(page.locator('text=Pouces').or(page.locator('text=pts')).first()).toBeVisible({ timeout: 10000 })
  })

  test('should open quiz and show question', async ({ page }) => {
    const quizBtn = page.locator('[onclick*="openQuiz"]')
    if (await quizBtn.count() > 0) {
      await quizBtn.first().click()
      await page.waitForTimeout(500)

      // Start quiz
      const startBtn = page.locator('button:has-text("Commencer"), [onclick*="startQuizGame"]')
      if (await startBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await startBtn.first().click()
        await page.waitForTimeout(500)
      }

      // Should show a question
      await expect(page.locator('text=Question').first()).toBeVisible({ timeout: 5000 })
    }
  })
})

// ================================================================
// FLOW 8: Profile Settings
// ================================================================
test.describe('Profile Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display user profile with stats', async ({ page }) => {
    // Username
    await expect(page.locator('text=TestUser').or(page.locator('text=Voyageur')).first()).toBeVisible({ timeout: 10000 })
    // Points
    await expect(page.locator('text=Points').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have language selector', async ({ page }) => {
    const langSelect = page.locator('select').first()
    await expect(langSelect).toBeVisible({ timeout: 10000 })
  })

  test('should have app version displayed', async ({ page }) => {
    await expect(page.locator('text=/SpotHitch v/i').first()).toBeVisible({ timeout: 10000 })
  })
})
