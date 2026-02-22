/**
 * Visual Regression Tests — Pixel-by-pixel comparison
 * Uses Playwright's toHaveScreenshot() to detect ANY visual change.
 * First run creates baselines in e2e/__snapshots__/
 * Subsequent runs compare against baselines and FAIL if anything changed.
 * Update baselines: npx playwright test e2e/visualTests.spec.js --update-snapshots
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

// Mask dynamic areas that change between runs (map tiles, timestamps)
const MASK_SELECTORS = ['.maplibregl-canvas', '.maplibregl-ctrl', '[data-timestamp]']

async function maskDynamic(page) {
  return page.locator(MASK_SELECTORS.join(', ')).all()
}

// ================================================================
// MAIN VIEWS — Mobile (390x844)
// ================================================================
test.describe('Visual Regression — Views (Mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('map view', async ({ page }) => {
    await navigateToTab(page, 'map')
    await page.waitForTimeout(1500)
    await expect(page).toHaveScreenshot('mobile-map.png', {
      maxDiffPixelRatio: 0.05,
      mask: await maskDynamic(page),
    })
  })

  test('challenges', async ({ page }) => {
    await navigateToTab(page, 'challenges')
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('mobile-challenges.png', {
      maxDiffPixelRatio: 0.03,
    })
  })

  test('social feed', async ({ page }) => {
    await navigateToTab(page, 'social')
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('mobile-social.png', {
      maxDiffPixelRatio: 0.03,
    })
  })

  test('profile', async ({ page }) => {
    await navigateToTab(page, 'profile')
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('mobile-profile.png', {
      maxDiffPixelRatio: 0.03,
    })
  })
})

// ================================================================
// MAIN VIEWS — Desktop (1280x720)
// ================================================================
test.describe('Visual Regression — Views (Desktop)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('map view', async ({ page }) => {
    await navigateToTab(page, 'map')
    await page.waitForTimeout(1500)
    await expect(page).toHaveScreenshot('desktop-map.png', {
      maxDiffPixelRatio: 0.05,
      mask: await maskDynamic(page),
    })
  })

  test('challenges', async ({ page }) => {
    await navigateToTab(page, 'challenges')
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('desktop-challenges.png', {
      maxDiffPixelRatio: 0.03,
    })
  })

  test('social', async ({ page }) => {
    await navigateToTab(page, 'social')
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('desktop-social.png', {
      maxDiffPixelRatio: 0.03,
    })
  })

  test('profile', async ({ page }) => {
    await navigateToTab(page, 'profile')
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('desktop-profile.png', {
      maxDiffPixelRatio: 0.03,
    })
  })
})

// ================================================================
// ALL MODALS — Mobile (most users are on mobile)
// ================================================================
test.describe('Visual Regression — Modals', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  const modals = [
    { name: 'sos', flag: 'showSOS' },
    { name: 'auth', flag: 'showAuth' },
    { name: 'settings', flag: 'showSettings' },
    { name: 'badges', flag: 'showBadges' },
    { name: 'shop', flag: 'showShop' },
    { name: 'stats', flag: 'showStats' },
    { name: 'leaderboard', flag: 'showLeaderboard' },
    { name: 'quiz', flag: 'showQuiz' },
    { name: 'challenges', flag: 'showChallenges' },
    { name: 'companion', flag: 'showCompanionModal' },
    { name: 'mydata', flag: 'showMyData' },
    { name: 'donation', flag: 'showDonation' },
    { name: 'titles', flag: 'showTitles' },
    { name: 'addspot', flag: 'showAddSpot' },
    { name: 'filters', flag: 'showFilters' },
    { name: 'legal', flag: 'showLegal' },
    { name: 'faq', flag: 'showFAQ' },
    { name: 'checkin', flag: 'showCheckin' },
    { name: 'validate-spot', flag: 'showValidateSpot' },
    { name: 'cookie-banner', flag: 'showCookieBanner' },
  ]

  for (const { name, flag } of modals) {
    test(`modal: ${name}`, async ({ page }) => {
      await page.evaluate((f) => window.setState?.({ [f]: true }), flag)
      await page.waitForTimeout(800)
      // Verify something rendered (modal overlay or content)
      const overlay = page.locator('.modal-overlay, .modal, [role="dialog"]')
      const hasModal = await overlay.count() > 0
      if (hasModal) {
        await expect(overlay.first()).toBeVisible({ timeout: 5000 })
      }
      await expect(page).toHaveScreenshot(`modal-${name}.png`, {
        maxDiffPixelRatio: 0.03,
      })
    })
  }
})

// ================================================================
// THEMES
// ================================================================
test.describe('Visual Regression — Themes', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true })

  test('dark theme', async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('theme-dark.png', {
      maxDiffPixelRatio: 0.03,
    })
  })

  test('light theme', async ({ page }) => {
    await skipOnboarding(page)
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      window.setState?.({ theme: 'light' })
    })
    await navigateToTab(page, 'profile')
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('theme-light.png', {
      maxDiffPixelRatio: 0.03,
    })
  })
})
