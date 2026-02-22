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
    const tabs = ['challenges', 'social', 'profile', 'map']
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

  test('should display map container', async ({ page }) => {
    const mapContainer = page.locator('#home-map, .maplibregl-map')
    await expect(mapContainer.first()).toBeVisible({ timeout: 10000 })
  })

  test('should have search bar', async ({ page }) => {
    const search = page.locator('#map-search, input[placeholder*="Search"], input[placeholder*="Chercher"], input[placeholder*="lieu"]')
    await expect(search.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display profile view', async ({ page }) => {
    const profileContent = page.locator('text=Score de confiance').or(page.locator('text=Paramètres'))
    await expect(profileContent.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have settings section', async ({ page }) => {
    const settings = page.locator('text=Paramètres').or(page.locator('text=Mode sombre'))
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

  test('should have feed or chat content', async ({ page }) => {
    const content = page.locator('text=Feed').or(page.locator('text=Messages')).or(page.locator('text=Friends'))
    await expect(content.first()).toBeVisible({ timeout: 5000 })
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
    const sosButton = page.locator('button:has-text("SOS")')
    if (await sosButton.count() > 0) {
      await expect(sosButton.first()).toBeVisible()
    }
  })
})
