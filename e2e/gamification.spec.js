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
    // Guides tab shows guide cards or a country/region heading
    const guidesContent = page
      .locator('.guide-card')
      .or(page.locator('text=/Pays|Country|Pais|Land|Guides/i'))
      .first()
    await expect(guidesContent).toBeVisible({ timeout: 5000 })
  })

  test('should switch to Voyage sub-tab (trip planner)', async ({ page }) => {
    await page.evaluate(() => window.setVoyageSubTab?.('voyage'))
    await page.waitForTimeout(500)
    // Voyage tab shows trip planner form
    const voyageContent = page.locator('input#trip-from, text=/Nouveau voyage|New trip|Planifier/i').first()
    await expect(voyageContent).toBeVisible({ timeout: 5000 })
  })

  test('should switch to Journal sub-tab', async ({ page }) => {
    await page.evaluate(() => window.setVoyageSubTab?.('journal'))
    await page.waitForTimeout(500)
    // Journal shows bilan or empty state
    const journalContent = page.locator('text=/bilan|Journal|voyages|trips|Aucun/i').first()
    await expect(journalContent).toBeVisible({ timeout: 5000 })
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
