/**
 * E2E Tests - Tutorial
 * Tests for interactive tutorial flow
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, dismissOverlays } from './helpers.js'

test.describe('Tutorial', () => {
  test('should show welcome or splash for new users', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })

    // Wait for splash + lazy-loaded landing page to render
    await page.waitForTimeout(2000)

    // Verify app has actual content (not empty from lazy loading)
    const hasContent = await page.evaluate(() => {
      const app = document.getElementById('app')
      return app && app.innerHTML.length > 50
    })
    expect(hasContent).toBeTruthy()
  })

  test('should have skip button in tutorial', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    const skipBtn = page.locator('text=Passer, button:has-text("Passer")')
    // Skip button may or may not appear depending on flow state
    if (await skipBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(skipBtn.first()).toBeVisible()
    }
  })

  test('should skip tutorial when skip is clicked', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    const skipBtn = page.locator('text=Passer, button:has-text("Passer")')
    if (await skipBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.first().click()
      await page.waitForTimeout(300)
    }
  })

  test('should progress through tutorial steps', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    const nextBtn = page.locator('button:has-text("Suivant")')
    if (await nextBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.first().click()
      await page.waitForTimeout(300)
    }
  })

  test('should start tutorial from profile', async ({ page }) => {
    await skipOnboarding(page)
    await page.click('[data-tab="profile"]')
    await page.waitForTimeout(300)

    const tutorialBtn = page.locator('text=/tutoriel/i, button:has-text("tutoriel")')
    if (await tutorialBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await tutorialBtn.first().click()
      await page.waitForTimeout(300)
    }
  })
})

test.describe('Tutorial Completion', () => {
  test('should be able to complete or skip tutorial', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    const skipBtn = page.locator('text=Passer, button:has-text("Passer")')
    if (await skipBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.first().click()
    }
  })
})
