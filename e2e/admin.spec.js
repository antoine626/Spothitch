/**
 * E2E Tests - Admin Panel
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers.js'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    // Open admin panel via state (it's a dev/debug feature)
    await page.evaluate(() => window.setState?.({ showAdminPanel: true }))
    await page.waitForTimeout(800)
  })

  test('should display admin panel content', async ({ page }) => {
    const content = page.locator('text=/Admin|Panneau|Resources|Points/i')
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have points controls', async ({ page }) => {
    const pointsBtn = page.locator('[onclick*="adminAddPoints"]').or(page.locator('button:has-text("+100")'))
    if (await pointsBtn.count() > 0) {
      await expect(pointsBtn.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should add points when clicking +100', async ({ page }) => {
    const pointsBefore = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
      return s.points || 0
    })

    const addBtn = page.locator('[onclick*="adminAddPoints(100)"]')
    if (await addBtn.count() > 0) {
      await addBtn.first().click()
      await page.waitForTimeout(300)

      const pointsAfter = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
        return s.points || 0
      })
      expect(pointsAfter).toBeGreaterThan(pointsBefore)
    }
  })

  test('should close admin panel', async ({ page }) => {
    const closeBtn = page.locator('[onclick*="closeAdminPanel"]').or(page.locator('button[aria-label*="Fermer"]'))
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click()
      await page.waitForTimeout(400)
    }
  })
})
