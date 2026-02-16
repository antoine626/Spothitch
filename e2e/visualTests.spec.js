/**
 * Visual Screenshot Tests — All Views & Modals
 * Takes screenshots of every major view and modal to verify rendering.
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab, dismissOverlays } from './helpers.js'

test.describe('Visual Tests — Main Views', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('Home / Map view renders', async ({ page }) => {
    await navigateToTab(page, 'map')
    await page.waitForTimeout(1500) // Map tiles load
    const content = page.locator('#app')
    await expect(content).toBeVisible()
    await page.screenshot({ path: 'screenshots/01-home-map.png', fullPage: false })
  })

  test('Travel / Planner overlay renders', async ({ page }) => {
    await navigateToTab(page, 'map')
    await page.waitForTimeout(500)
    // Open trip planner overlay
    await page.evaluate(() => window.openTripPlanner?.())
    await page.waitForTimeout(800)
    const plannerForm = page.locator('#trip-from')
    await expect(plannerForm).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'screenshots/02-travel-planner.png', fullPage: false })
  })

  test('Travel / Guides overlay renders', async ({ page }) => {
    await navigateToTab(page, 'map')
    await page.waitForTimeout(500)
    // Open guides overlay
    await page.evaluate(() => window.openGuidesOverlay?.())
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/03-travel-guides.png', fullPage: false })
  })

  test('Challenges / Activities view renders', async ({ page }) => {
    await navigateToTab(page, 'challenges')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/04-challenges.png', fullPage: false })
  })

  test('Social / Feed tab renders', async ({ page }) => {
    await navigateToTab(page, 'social')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/05-social-feed.png', fullPage: false })
  })

  test('Social / Conversations tab renders', async ({ page }) => {
    await navigateToTab(page, 'social')
    await page.waitForTimeout(300)
    await page.evaluate(() => window.setSocialSubTab?.('conversations'))
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/06-social-conversations.png', fullPage: false })
  })

  test('Social / Friends tab renders', async ({ page }) => {
    await navigateToTab(page, 'social')
    await page.waitForTimeout(300)
    await page.evaluate(() => window.setSocialSubTab?.('friends'))
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/07-social-friends.png', fullPage: false })
  })

  test('Profile view renders', async ({ page }) => {
    await navigateToTab(page, 'profile')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/08-profile.png', fullPage: false })
  })
})

test.describe('Visual Tests — Modals', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
  })

  test('SOS modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showSOS: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/10-modal-sos.png', fullPage: false })
  })

  test('Auth modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showAuth: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/11-modal-auth.png', fullPage: false })
  })

  test('Settings modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showSettings: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/12-modal-settings.png', fullPage: false })
  })

  test('Badges modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showBadges: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/13-modal-badges.png', fullPage: false })
  })

  test('Shop modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showShop: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/14-modal-shop.png', fullPage: false })
  })

  test('Stats modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showStats: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/15-modal-stats.png', fullPage: false })
  })

  test('Leaderboard modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showLeaderboard: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/16-modal-leaderboard.png', fullPage: false })
  })

  test('Quiz modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showQuiz: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/17-modal-quiz.png', fullPage: false })
  })

  test('Challenges modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showChallenges: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/18-modal-challenges.png', fullPage: false })
  })

  test('Companion modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showCompanionModal: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/19-modal-companion.png', fullPage: false })
  })

  test('MyData modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showMyData: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/20-modal-mydata.png', fullPage: false })
  })

  test('Donation modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showDonation: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/21-modal-donation.png', fullPage: false })
  })

  test('Titles modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showTitles: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/22-modal-titles.png', fullPage: false })
  })

  test('AddSpot modal renders', async ({ page }) => {
    await page.evaluate(() => window.setState?.({ showAddSpot: true }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/23-modal-addspot.png', fullPage: false })
  })

  test('FAQ page renders', async ({ page }) => {
    await page.evaluate(() => window.openFAQ?.())
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'screenshots/24-modal-faq.png', fullPage: false })
  })
})

test.describe('Visual Tests — Theme', () => {
  test('Dark theme renders correctly', async ({ page }) => {
    await skipOnboarding(page)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'screenshots/30-theme-dark.png', fullPage: false })
  })

  test('Light theme renders correctly', async ({ page }) => {
    await skipOnboarding(page)
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      window.setState?.({ theme: 'light' })
    })
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/31-theme-light.png', fullPage: false })
  })
})

test.describe('Visual Tests — Responsive', () => {
  test('Mobile viewport (iPhone 12)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    })
    const page = await context.newPage()
    await skipOnboarding(page)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/40-mobile-home.png', fullPage: false })

    // Navigate to Profile on mobile
    await navigateToTab(page, 'profile')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/41-mobile-profile.png', fullPage: false })

    // Navigate to Social on mobile
    await navigateToTab(page, 'social')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/42-mobile-social.png', fullPage: false })

    await context.close()
  })

  test('Desktop viewport (1920x1080)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    })
    const page = await context.newPage()
    await skipOnboarding(page)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/43-desktop-home.png', fullPage: false })
    await context.close()
  })
})
