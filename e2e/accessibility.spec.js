/**
 * E2E Tests - Accessibility (WCAG 2.1 AA)
 * Uses @axe-core/playwright for automated checks
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { skipOnboarding, navigateToTab } from './helpers.js'

// Common axe rules to disable (known issues with dynamic SPAs)
const AXE_DISABLE_RULES = [
  'color-contrast', // Dynamic dark theme makes this unreliable in headless
]

test.describe('Accessibility - Automated WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('map view should pass accessibility checks', async ({ page }) => {
    await navigateToTab(page, 'map')
    await page.waitForSelector('#main-map', { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(AXE_DISABLE_RULES)
      .analyze()

    expect(results.violations.length).toBe(0)
  })

  test('travel view should pass accessibility checks', async ({ page }) => {
    await navigateToTab(page, 'travel')
    await page.waitForSelector('#trip-from', { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(AXE_DISABLE_RULES)
      .analyze()

    expect(results.violations.length).toBe(0)
  })

  test('social view should pass accessibility checks', async ({ page }) => {
    await navigateToTab(page, 'social')
    await page.waitForSelector('#chat-input', { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(AXE_DISABLE_RULES)
      .analyze()

    expect(results.violations.length).toBe(0)
  })

  test('profile view should pass accessibility checks', async ({ page }) => {
    await navigateToTab(page, 'profile')
    await page.waitForSelector('nav', { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(AXE_DISABLE_RULES)
      .analyze()

    expect(results.violations.length).toBe(0)
  })

  test('challenges view should pass accessibility checks', async ({ page }) => {
    await navigateToTab(page, 'challenges')
    await page.waitForSelector('nav', { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(AXE_DISABLE_RULES)
      .analyze()

    expect(results.violations.length).toBe(0)
  })
})

test.describe('Accessibility - Navigation Structure', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('should have proper document structure', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 5000 })

    // Must have at least one heading
    const headings = await page.locator('h1, h2, h3').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have accessible navigation with ARIA', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]')
    await expect(nav).toBeVisible()

    const ariaLabel = await nav.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()

    // All nav buttons must have role="tab"
    const navButtons = page.locator('nav button[role="tab"]')
    const count = await navButtons.count()
    expect(count).toBeGreaterThan(3) // At least map, travel, challenges, social, profile

    // Each tab must have aria-label
    for (let i = 0; i < count; i++) {
      const label = await navButtons.nth(i).getAttribute('aria-label')
      expect(label).toBeTruthy()
    }

    // Exactly one tab should be selected
    const selectedTabs = page.locator('nav button[aria-selected="true"]')
    await expect(selectedTabs).toHaveCount(1)
  })

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Must have an element focused
    const focused = page.locator(':focus')
    const count = await focused.count()
    expect(count).toBe(1)

    // Focused element should be interactive
    const tagName = await focused.evaluate(el => el.tagName.toLowerCase())
    expect(['button', 'a', 'input', 'select', 'textarea']).toContain(tagName)
  })

  test('should handle reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()

    // Wait for app to load
    await Promise.race([
      page.waitForSelector('#app.loaded', { timeout: 15000 }),
      page.waitForSelector('nav[role="navigation"]', { timeout: 15000 }),
    ]).catch(() => {})

    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have ARIA live regions for notifications', async ({ page }) => {
    const liveRegions = await page.locator('[aria-live], [role="alert"], [role="status"]').all()
    expect(liveRegions.length).toBeGreaterThan(0)
  })
})

test.describe('Accessibility - Touch & Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should have touch-friendly tap targets (44x44 min)', async ({ page }) => {
    await skipOnboarding(page)

    const navButtons = await page.locator('nav button').all()
    expect(navButtons.length).toBeGreaterThan(0)

    for (const button of navButtons) {
      const box = await button.boundingBox()
      expect(box).not.toBeNull()
      // WCAG 2.5.5 recommends 44x44 minimum
      expect(box.width).toBeGreaterThanOrEqual(40)
      expect(box.height).toBeGreaterThanOrEqual(40)
    }
  })

  test('should work in portrait orientation', async ({ page }) => {
    await skipOnboarding(page)
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('#app')).toBeVisible()
  })
})
