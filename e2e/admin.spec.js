/**
 * E2E Tests - Admin Panel
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding } from './helpers.js'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('should have admin button visible', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await expect(adminBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open admin panel', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    await expect(page.locator('text=Panneau Admin').first()).toBeVisible({ timeout: 5000 })
  })

  test('should close admin panel', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    await expect(page.locator('text=Panneau Admin').first()).toBeVisible()

    const closeBtn = page.locator('[onclick*="closeAdminPanel"]')
    await closeBtn.first().click()
    await expect(page.locator('text=Panneau Admin')).not.toBeVisible({ timeout: 3000 })
  })

  test('should have resource buttons', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    await expect(page.locator('[onclick*="adminAddPoints(100)"]').first()).toBeVisible()
    await expect(page.locator('text=MAX ALL').first()).toBeVisible()
  })

  test('should add points when clicking +100', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()

    // Get points before
    const pointsBefore = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
      return s.points || 0
    })

    await page.locator('[onclick*="adminAddPoints(100)"]').first().click()
    await page.waitForTimeout(500)

    // Verify points increased
    const pointsAfter = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
      return s.points || 0
    })
    expect(pointsAfter).toBeGreaterThan(pointsBefore)
  })

  test('should have gamification section', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    await expect(page.locator('text=Gamification').first()).toBeVisible()
    await expect(page.locator('text=Badges').first()).toBeVisible()
    await expect(page.locator('text=Skill Tree').first()).toBeVisible()
  })

  test('should have social section', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    await expect(page.locator('text=Social').first()).toBeVisible()
  })

  test('should have system section', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    await expect(page.locator('text=Système').first()).toBeVisible()
    await expect(page.locator('text=Export').first()).toBeVisible()
  })

  test('should open chat from admin social section', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    // Admin has a "Chat" button in Social section
    const chatBtn = page.locator('.admin-btn:has-text("Chat"), button:has-text("Chat")')
    if (await chatBtn.count() > 0) {
      await chatBtn.first().click()
      await page.waitForTimeout(500)
      // Should navigate to social tab
      await expect(page.locator('[data-tab="social"]')).toHaveAttribute('aria-selected', 'true', { timeout: 5000 })
    }
  })

  test('should open badges from admin', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    const badgesBtn = page.locator('.admin-btn:has-text("Badges"), button:has-text("Badges")')
    await badgesBtn.first().click()
    await expect(page.locator('text=badge').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open skill tree from admin', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    await adminBtn.first().click()
    const skillBtn = page.locator('.admin-btn:has-text("Skill Tree"), button:has-text("Skill Tree")')
    await skillBtn.first().click()
    await expect(page.locator('text=compétences').first()).toBeVisible({ timeout: 5000 })
  })
})
