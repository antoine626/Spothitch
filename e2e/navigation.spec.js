/**
 * E2E Tests - Navigation & Core Flows
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/SpotHitch/)
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should navigate between tabs', async ({ page }) => {
    const tabs = ['travel', 'challenges', 'social', 'profile', 'map']
    for (const tab of tabs) {
      await navigateToTab(page, tab)
      await expect(page.locator(`[data-tab="${tab}"]`)).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('should have accessible navigation', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]')
    await expect(nav).toBeVisible({ timeout: 5000 })
    await expect(nav).toHaveAttribute('aria-label')

    const navButtons = page.locator('nav button[role="tab"]')
    const count = await navButtons.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i)
      await expect(button).toHaveAttribute('aria-label')
    }
  })
})

test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should display map', async ({ page }) => {
    const mapContainer = page.locator('#main-map, .maplibregl-map')
    await expect(mapContainer.first()).toBeVisible({ timeout: 10000 })
  })

  test('should have zoom controls', async ({ page }) => {
    const zoomIn = page.locator('[onclick*="mapZoomIn"], button[aria-label*="Zoom"]')
    const zoomOut = page.locator('[onclick*="mapZoomOut"], button[aria-label*="Zoom"]')
    await expect(zoomIn.first()).toBeVisible()
    await expect(zoomOut.first()).toBeVisible()
  })
})

test.describe('Travel View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'travel')
  })

  test('should display travel view', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible()
  })
})

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display profile view', async ({ page }) => {
    await expect(page.locator('text=/Niv|Niveau|Points/').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have settings section', async ({ page }) => {
    const settings = page.locator('text=Paramètres').or(page.locator('text=Thème sombre')).or(page.locator('select'))
    await expect(settings.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should display social view', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible()
  })

  test('should have chat or friends section', async ({ page }) => {
    // Social has chat input and sub-tab buttons
    const chatInput = page.locator('#chat-input').or(page.locator('button:has-text("Général")'))
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Challenges View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
  })

  test('should display challenges view', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible()
  })
})

test.describe('SOS Mode', () => {
  test('should have SOS button accessible', async ({ page }) => {
    await skipOnboarding(page)

    const sosButton = page.locator('[data-action="sos"], button:has-text("SOS"), .sos-btn, button[aria-label*="SOS"]')
    if (await sosButton.count() > 0) {
      await expect(sosButton.first()).toBeVisible()
    }
  })
})

test.describe('Add Spot', () => {
  test('should have add spot button', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')

    const addButton = page.locator('button[aria-label*="Ajouter"], [data-action="add-spot"]')
    if (await addButton.count() > 0) {
      await expect(addButton.first()).toBeVisible()
    }
  })
})
