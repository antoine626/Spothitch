/**
 * E2E Tests - Voyage Tab (formerly Gamification / Challenges Hub)
 * The "challenges" navigation tab now renders the Voyage 4-tab component
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

test.describe('Voyage Tab', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
  })

  test('should display voyage tab with planner', async ({ page }) => {
    // Default sub-tab is "Planifier" — trip form visible
    const form = page.locator('input#trip-from, input#trip-to').first()
    await expect(form).toBeVisible({ timeout: 8000 })
  })

  test('should show 4 sub-tabs', async ({ page }) => {
    // At least 4 sub-tab buttons
    const subTabs = page.locator('[onclick*="setVoyageSubTab"]')
    await expect(subTabs.first()).toBeVisible({ timeout: 5000 })
    expect(await subTabs.count()).toBeGreaterThanOrEqual(4)
  })

  test('should switch to Guides sub-tab', async ({ page }) => {
    await page.evaluate(() => window.setVoyageSubTab?.('guides'))
    await page.waitForTimeout(500)
    // Guides tab shows country search input or guide cards
    const guidesContent = page.locator('input[oninput*="filterGuides"], .guide-card, text=/Guides/i').first()
    await expect(guidesContent).toBeVisible({ timeout: 5000 })
  })

  test('should switch to En route sub-tab', async ({ page }) => {
    await page.evaluate(() => window.setVoyageSubTab?.('enroute'))
    await page.waitForTimeout(500)
    // En route shows "no active trip" message or trip progress
    const enRouteContent = page.locator('text=/Aucun voyage|No active|Planifier|On the road/i').first()
    await expect(enRouteContent).toBeVisible({ timeout: 5000 })
  })

  test('should switch to Historique sub-tab', async ({ page }) => {
    await page.evaluate(() => window.setVoyageSubTab?.('historique'))
    await page.waitForTimeout(500)
    // Historique shows saved trips or empty state
    const histContent = page.locator('text=/Voyages|History|sauvegardé|No trips/i').first()
    await expect(histContent).toBeVisible({ timeout: 5000 })
  })

  test('should have trip search inputs', async ({ page }) => {
    const fromInput = page.locator('input#trip-from')
    const toInput = page.locator('input#trip-to')
    await expect(fromInput).toBeVisible({ timeout: 5000 })
    await expect(toInput).toBeVisible({ timeout: 5000 })
  })

  test('should have find spots button', async ({ page }) => {
    const findBtn = page.locator('[onclick*="syncTripFieldsAndCalculate"]').first()
    await expect(findBtn).toBeVisible({ timeout: 5000 })
  })
})
