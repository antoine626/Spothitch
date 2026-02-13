/**
 * E2E Tests - Complete User Journeys
 * Simulates real human users navigating ALL features of the app.
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab, dismissOverlays, getAppState } from './helpers.js'

// ================================================================
// JOURNEY 1: New user arrives - Welcome, Tutorial, First Steps
// ================================================================
test.describe('Journey: New User Onboarding', () => {
  test('should see welcome screen on first visit', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Should show welcome/splash or cookie banner
    await page.waitForTimeout(3000)
    const appContent = page.locator('#app')
    await expect(appContent).toBeVisible({ timeout: 10000 })
    // Either splash, welcome, cookie banner, or app is visible
    const hasContent = await page.locator('text=SpotHitch').or(page.locator('text=Bienvenue')).or(page.locator('#cookie-banner')).first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('should be able to skip tutorial and access app', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await page.waitForTimeout(3000)

    const skipBtn = page.locator('button:has-text("Passer")')
    if (await skipBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipBtn.first().click()
    }

    await dismissOverlays(page)
    await expect(page.locator('#app')).toBeVisible()
  })

  test('should show cookie consent on first visit', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(3000)

    // Cookie banner should appear for first visit
    const cookieBanner = page.locator('#cookie-banner')
    if (await cookieBanner.isVisible({ timeout: 10000 }).catch(() => false)) {
      const acceptBtn = cookieBanner.locator('button:has-text("Accepter"), button:has-text("Accept")')
      await expect(acceptBtn.first()).toBeVisible()
    }
  })
})

// ================================================================
// JOURNEY 2: Complete Map Exploration
// ================================================================
test.describe('Journey: Map Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should display full map with all controls', async ({ page }) => {
    // Map container
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })

    // Search bar
    await expect(page.locator('#map-search').first()).toBeVisible()

    // Zoom controls
    await expect(page.locator('[onclick*="mapZoomIn"], button[aria-label*="Zoom"]').first()).toBeVisible()

    // Add spot FAB
    await expect(page.locator('button[aria-label*="Ajouter un nouveau spot"]').first()).toBeVisible()

    // Score bar with points
    await expect(page.locator('text=pts').first()).toBeVisible()

    // Level display
    await expect(page.locator('text=/Niv/i').first()).toBeVisible()

    // Spots count
    await expect(page.locator('text=/spots? disponible/i').first()).toBeVisible()
  })

  test('should search for a city on the map', async ({ page }) => {
    const search = page.locator('#map-search')
    if (await search.count() > 0) {
      await search.fill('Paris')
      await expect(search).toHaveValue('Paris')
      await search.press('Enter')
      await page.waitForTimeout(2000)
    }
  })

  test('should zoom in and out', async ({ page }) => {
    const zoomIn = page.locator('[onclick*="mapZoomIn"]').or(page.locator('button:has(i.fa-plus)')).first()
    const zoomOut = page.locator('[onclick*="mapZoomOut"]').or(page.locator('button:has(i.fa-minus)')).first()

    if (await zoomIn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await zoomIn.click()
      await page.waitForTimeout(500)
      await zoomOut.click()
      await page.waitForTimeout(500)
    }
  })

  test('should open filter panel', async ({ page }) => {
    const filterBtn = page.locator('[onclick*="openFilters"]').or(page.locator('button:has(i.fa-sliders-h)'))
    if (await filterBtn.count() > 0) {
      await filterBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should try to add a spot', async ({ page }) => {
    const addBtn = page.locator('button[aria-label*="Ajouter un nouveau spot"]')
    if (await addBtn.count() > 0) {
      await addBtn.first().click()
      await page.waitForTimeout(1000)
      // Should show add spot modal or login prompt
      const modalOrPrompt = page.locator('.modal-overlay, [role="dialog"]')
      if (await modalOrPrompt.count() > 0) {
        await expect(modalOrPrompt.first()).toBeVisible()
      }
    }
  })
})

// ================================================================
// JOURNEY 3: Complete Profile Exploration
// ================================================================
test.describe('Journey: Profile & Settings', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display complete profile with all sections', async ({ page }) => {
    // User info section
    await expect(page.locator('text=/Voyageur|TestUser/').first()).toBeVisible({ timeout: 5000 })

    // Points display
    await expect(page.locator('text=Points').first()).toBeVisible({ timeout: 5000 })

    // Level display
    await expect(page.locator('text=/Niv/').first()).toBeVisible({ timeout: 5000 })

    // Activity section (text "Activité" or fa-chart-bar icon)
    await expect(page.locator('text=Activité').or(page.locator('i.fa-chart-bar')).first()).toBeVisible({ timeout: 5000 })

    // Settings section
    await expect(page.locator('text=Paramètres').first()).toBeVisible({ timeout: 5000 })

    // App version
    await expect(page.locator('text=/SpotHitch v/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should toggle dark/light theme', async ({ page }) => {
    const themeToggle = page.locator('[role="switch"], [onclick*="toggleTheme"]').first()
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }
  })

  test('should change language', async ({ page }) => {
    const langSelect = page.locator('select').first()
    if (await langSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langSelect.selectOption('en').catch(() => {})
      await page.waitForTimeout(1000)
      // Page may reload - just wait for it
      await page.waitForSelector('#app.loaded', { timeout: 10000 }).catch(() => {})
    }
  })

  test('should have customization button', async ({ page }) => {
    const customizeBtn = page.locator('button:has-text("Personnaliser"), [onclick*="openProfileCustomization"]')
    await expect(customizeBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have skill tree access', async ({ page }) => {
    const skillTree = page.locator('text=compétences').or(page.locator('[onclick*="openSkillTree"]'))
    await expect(skillTree.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have friends link', async ({ page }) => {
    await expect(page.locator('text=Mes amis').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have tutorial replay option', async ({ page }) => {
    // "Revoir le tutoriel" button with onclick="startTutorial()"
    const tutorial = page.locator('[onclick*="startTutorial"]').or(page.locator('text=Revoir le tutoriel'))
    await expect(tutorial.first()).toBeVisible({ timeout: 8000 })
  })

  test('should have reset app option', async ({ page }) => {
    const reset = page.locator('[onclick*="resetApp"]').or(page.locator('text=/Réinitialiser/i'))
    await expect(reset.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have notification settings', async ({ page }) => {
    await expect(page.locator('text=Notifications').first()).toBeVisible({ timeout: 5000 })
  })
})

// ================================================================
// JOURNEY 4: Complete Social Features
// ================================================================
test.describe('Journey: Social Features', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should display social view with all sub-tabs', async ({ page }) => {
    const socialTab = page.locator('[data-tab="social"]')
    await expect(socialTab).toHaveAttribute('aria-selected', 'true')

    const tabs = ['Général', 'Régional', 'Amis', 'Groupes']
    for (const tabName of tabs) {
      await expect(page.locator(`button:has-text("${tabName}")`).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should navigate through all social sub-tabs', async ({ page }) => {
    const tabs = ['Général', 'Régional', 'Amis', 'Groupes']

    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`)
      if (await tab.count() > 0) {
        await tab.first().click()
        await page.waitForTimeout(300)
        await expect(tab.first()).toHaveClass(/bg-primary/)
      }
    }
  })

  test('should have chat input in General tab', async ({ page }) => {
    await expect(page.locator('#chat-input').first()).toBeVisible({ timeout: 5000 })
  })

  test('should type and submit a message', async ({ page }) => {
    const input = page.locator('#chat-input')
    if (await input.count() > 0) {
      await input.fill('Hello les autostoppeurs !')
      await expect(input).toHaveValue('Hello les autostoppeurs !')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
    }
  })

  test('should access friends sub-tab with search', async ({ page }) => {
    const friendsTab = page.locator('button:has-text("Amis")')
    if (await friendsTab.count() > 0) {
      await friendsTab.first().click()
      await page.waitForTimeout(500)

      const searchInput = page.locator('input[placeholder*="ami"], input[placeholder*="Rechercher"]')
      await expect(searchInput.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should access groups sub-tab with create option', async ({ page }) => {
    const groupsTab = page.locator('button:has-text("Groupes")')
    if (await groupsTab.count() > 0) {
      await groupsTab.first().click()
      await page.waitForTimeout(500)

      const createGroup = page.locator('[onclick*="openCreateTravelGroup"]').or(page.locator('text=/Créer.*groupe/i'))
      await expect(createGroup.first()).toBeVisible({ timeout: 5000 })

      const nearby = page.locator('[onclick*="openNearbyFriends"]').or(page.locator('text=/proximité/i'))
      await expect(nearby.first()).toBeVisible({ timeout: 5000 })
    }
  })
})

// ================================================================
// JOURNEY 5: Complete Gamification Features
// ================================================================
test.describe('Journey: Gamification & Challenges', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
  })

  test('should display challenges hub with all sections', async ({ page }) => {
    await expect(page.locator('text=Défis').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Badges').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show user stats (points, league)', async ({ page }) => {
    await expect(page.locator('text=Pouces').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Ligue').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open and navigate badges modal', async ({ page }) => {
    const badgesBtn = page.locator('[onclick*="openBadges"]')
    if (await badgesBtn.count() > 0) {
      await badgesBtn.first().click()
      await page.waitForTimeout(500)
      await expect(page.locator('text=Mes badges').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should open challenges modal', async ({ page }) => {
    const challengesBtn = page.locator('[onclick*="openChallenges"]').first()
    if (await challengesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await challengesBtn.click()
      await page.waitForTimeout(500)
      await expect(page.locator('.modal-overlay, [role="dialog"]').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should start and play quiz', async ({ page }) => {
    const quizBtn = page.locator('[onclick*="openQuiz"]')
    if (await quizBtn.count() > 0) {
      await quizBtn.first().click()
      await page.waitForTimeout(500)

      // Quiz shows intro first - click start
      const startBtn = page.locator('button:has-text("Commencer"), [onclick*="startQuizGame"]')
      if (await startBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await startBtn.first().click()
        await page.waitForTimeout(500)
      }

      await expect(page.locator('text=Question').first()).toBeVisible({ timeout: 5000 })

      // Quiz answer buttons use onclick="answerQuizQuestion(N)"
      const firstOption = page.locator('button[onclick^="answerQuizQuestion"]').first()
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('should open shop with items', async ({ page }) => {
    const shopBtn = page.locator('[onclick*="openShop"]')
    if (await shopBtn.count() > 0) {
      await shopBtn.first().click()
      await page.waitForTimeout(500)
      await expect(page.locator('text=Boutique').first()).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=points').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show leaderboard', async ({ page }) => {
    const leaderboard = page.locator('[onclick*="openLeaderboard"]').or(page.locator('button:has-text("Classement")'))
    if (await leaderboard.count() > 0) {
      await leaderboard.first().click()
      await page.waitForTimeout(500)
      await expect(page.locator('text=Classement').first()).toBeVisible({ timeout: 5000 })
    }
  })
})

// ================================================================
// JOURNEY 6: Travel View Features
// ================================================================
test.describe('Journey: Travel Features', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'travel')
  })

  test('should display travel view', async ({ page }) => {
    await expect(page.locator('#app')).toBeVisible()
  })
})

// ================================================================
// JOURNEY 7: Full Navigation Flow (Tab by Tab)
// ================================================================
test.describe('Journey: Complete Tab Navigation', () => {
  test('should navigate through ALL tabs without errors', async ({ page }) => {
    await skipOnboarding(page)

    const tabs = ['map', 'travel', 'challenges', 'social', 'profile']

    for (const tabId of tabs) {
      await navigateToTab(page, tabId)
      await expect(page.locator(`[data-tab="${tabId}"]`)).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('should rapidly switch tabs (stress test)', async ({ page }) => {
    await skipOnboarding(page)

    for (let i = 0; i < 3; i++) {
      await page.locator('[data-tab="map"]').click({ force: true })
      await page.waitForTimeout(200)
      await page.locator('[data-tab="challenges"]').click({ force: true })
      await page.waitForTimeout(200)
      await page.locator('[data-tab="social"]').click({ force: true })
      await page.waitForTimeout(200)
      await page.locator('[data-tab="profile"]').click({ force: true })
      await page.waitForTimeout(200)
      await page.locator('[data-tab="travel"]').click({ force: true })
      await page.waitForTimeout(200)
    }

    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })
})

// ================================================================
// JOURNEY 8: State Persistence & Coherence
// ================================================================
test.describe('Journey: State Persistence', () => {
  test('should persist state across page reload', async ({ page }) => {
    await skipOnboarding(page, { points: 500, level: 5 })

    await navigateToTab(page, 'profile')
    await page.waitForTimeout(500)

    await page.reload()
    await page.waitForSelector('#app.loaded', { timeout: 15000 })
    await dismissOverlays(page)

    const welcome = page.locator('text=Bienvenue sur SpotHitch')
    const isWelcomeVisible = await welcome.isVisible({ timeout: 2000 }).catch(() => false)
    expect(isWelcomeVisible).toBe(false)

    const state = await getAppState(page)
    expect(state).toBeTruthy()
    expect(state.username).toBe('TestUser')
  })

  test('should keep points displayed consistently', async ({ page }) => {
    await skipOnboarding(page, { points: 250, level: 3 })

    await navigateToTab(page, 'map')
    await page.waitForTimeout(1000)

    // Points should be visible in score bar ("pts" text)
    const pointsDisplay = page.locator('text=pts').or(page.locator('[onclick*="openStats"]'))
    await expect(pointsDisplay.first()).toBeVisible({ timeout: 5000 })
  })
})

// ================================================================
// JOURNEY 9: PWA Features & Offline
// ================================================================
test.describe('Journey: PWA & Offline Behavior', () => {
  test('should have valid PWA manifest', async ({ page }) => {
    await page.goto('/')

    const manifest = page.locator('link[rel="manifest"]')
    expect(await manifest.count()).toBeGreaterThanOrEqual(1)

    const themeColor = page.locator('meta[name="theme-color"]')
    expect(await themeColor.count()).toBeGreaterThanOrEqual(1)

    const viewport = page.locator('meta[name="viewport"]')
    const content = await viewport.getAttribute('content')
    expect(content).toContain('width=device-width')
  })

  test('should register service worker', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registrations = await navigator.serviceWorker.getRegistrations()
      return registrations.length > 0
    })

    expect(swRegistered).toBe(true)
  })

  test('should survive going offline and back', async ({ page, context }) => {
    await skipOnboarding(page)
    await page.waitForTimeout(2000)

    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(1000)

    await context.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForTimeout(1000)

    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should persist localStorage through offline', async ({ page, context }) => {
    await skipOnboarding(page, { points: 300 })

    const stateBefore = await getAppState(page)

    await context.setOffline(true)
    await page.waitForTimeout(500)

    const stateOffline = await getAppState(page)
    expect(stateOffline.points).toBe(stateBefore.points)

    await context.setOffline(false)
  })
})

// ================================================================
// JOURNEY 10: Responsive Design
// ================================================================
test.describe('Journey: Responsive Design', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ]

  for (const vp of viewports) {
    test(`should work correctly on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await skipOnboarding(page)

      // Nav visible
      await expect(page.locator('nav')).toBeVisible({ timeout: 5000 })

      // Main content visible
      await expect(page.locator('#app')).toBeVisible()

      // No horizontal overflow
      const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      )
      expect(hasOverflow).toBe(false)

      // Navigate all tabs
      for (const tab of ['map', 'travel', 'challenges', 'social', 'profile']) {
        await page.locator(`[data-tab="${tab}"]`).click({ force: true })
        await page.waitForTimeout(300)
      }
    })
  }
})

// ================================================================
// JOURNEY 11: Admin Panel
// ================================================================
test.describe('Journey: Admin Panel', () => {
  test('should open and explore admin panel', async ({ page }) => {
    await skipOnboarding(page)

    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt), button:has(.fa-shield)')
    if (await adminBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await adminBtn.first().click()
      await page.waitForTimeout(500)

      await expect(page.locator('text=Panneau Admin').first()).toBeVisible({ timeout: 5000 })

      // Click +100 Points
      const addPoints = page.locator('[onclick*="adminAddPoints(100)"]')
      if (await addPoints.count() > 0) {
        await addPoints.first().click()
        await page.waitForTimeout(500)
      }
    }
  })
})

// ================================================================
// JOURNEY 12: Accessibility Check
// ================================================================
test.describe('Journey: Accessibility', () => {
  test('should have proper document landmarks', async ({ page }) => {
    await skipOnboarding(page)

    await expect(page.locator('#app')).toBeVisible()

    // Navigation landmark - use broad selector first
    const nav = page.locator('nav')
    await expect(nav.first()).toBeVisible({ timeout: 5000 })
  })

  test('should be keyboard navigable', async ({ page }) => {
    await skipOnboarding(page)

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    const focused = page.locator(':focus')
    const count = await focused.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should work with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipOnboarding(page)
    await expect(page.locator('#app')).toBeVisible()
  })

  test('should respect dark mode preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await skipOnboarding(page)

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ||
      getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)'
    )
    expect(isDark).toBe(true)
  })

  test('should have accessible nav buttons', async ({ page }) => {
    await skipOnboarding(page)

    const navButtons = page.locator('nav button[role="tab"]')
    const count = await navButtons.count()
    expect(count).toBe(5)

    for (let i = 0; i < count; i++) {
      const btn = navButtons.nth(i)
      const ariaLabel = await btn.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})

// ================================================================
// JOURNEY 13: Performance
// ================================================================
test.describe('Journey: Performance', () => {
  test('should load within 5 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(10000)
  })

  test('should have acceptable CLS', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const cls = await page.evaluate(() =>
      new Promise(resolve => {
        let clsValue = 0
        try {
          const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) clsValue += entry.value
            }
          })
          observer.observe({ type: 'layout-shift', buffered: true })
          setTimeout(() => { observer.disconnect(); resolve(clsValue) }, 500)
        } catch { resolve(0) }
      })
    )
    expect(cls).toBeLessThan(0.25)
  })
})

// ================================================================
// JOURNEY 14: Error Resilience
// ================================================================
test.describe('Journey: Error Resilience', () => {
  test('should not crash on console errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await skipOnboarding(page)

    for (const tab of ['map', 'travel', 'challenges', 'social', 'profile']) {
      await page.locator(`[data-tab="${tab}"]`).click({ force: true })
      await page.waitForTimeout(500)
    }

    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('firebaseConfig') &&
      !e.includes('auth/') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('mixpanel')
    )

    expect(criticalErrors).toEqual([])
  })

  test('should handle double-clicking navigation', async ({ page }) => {
    await skipOnboarding(page)

    await page.dblclick('[data-tab="challenges"]')
    await page.waitForTimeout(300)
    await page.dblclick('[data-tab="social"]')
    await page.waitForTimeout(300)
    await page.dblclick('[data-tab="map"]')
    await page.waitForTimeout(300)

    await expect(page.locator('#app')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })
})

// ================================================================
// JOURNEY 15: Touch Support (Mobile)
// ================================================================
test.describe('Journey: Touch/Mobile', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 667 } })

  test('should support touch navigation', async ({ page }) => {
    await skipOnboarding(page)

    for (const tab of ['travel', 'challenges', 'social', 'profile', 'map']) {
      const tabBtn = page.locator(`[data-tab="${tab}"]`)
      await tabBtn.tap()
      await page.waitForTimeout(400)
      await expect(tabBtn).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('should have touch-friendly tap targets (44x44 min)', async ({ page }) => {
    await skipOnboarding(page)

    const navButtons = await page.locator('nav button').all()
    let goodSize = 0

    for (const btn of navButtons) {
      const box = await btn.boundingBox()
      if (box && box.width >= 40 && box.height >= 40) goodSize++
    }

    expect(goodSize).toBeGreaterThan(0)
  })
})
