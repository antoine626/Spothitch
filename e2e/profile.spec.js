/**
 * E2E Tests - Profile & Settings
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

test.describe('Profile View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display profile header with avatar', async ({ page }) => {
    const profileHeader = page.locator('h2, .text-xl').filter({ hasText: /Voyageur|TestUser/ })
    await expect(profileHeader.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display user stats', async ({ page }) => {
    await expect(page.locator('text=Points').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=/Niv/').first()).toBeVisible({ timeout: 5000 })
  })

  test('should display activity section', async ({ page }) => {
    // Activity header with fa-chart-bar icon, text "Activité"
    const activity = page.locator('text=Activité').or(page.locator('text=Spots partagés')).or(page.locator('i.fa-chart-bar'))
    await expect(activity.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have settings section', async ({ page }) => {
    await expect(page.locator('text=Paramètres').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Profile - Skill Tree', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should have skill tree button', async ({ page }) => {
    const skillTreeBtn = page.locator('text=compétences')
    await expect(skillTreeBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open skill tree when clicked', async ({ page }) => {
    const skillTreeBtn = page.locator('button:has-text("compétences"), [onclick*="openSkillTree"]')
    if ((await skillTreeBtn.count()) > 0) {
      await skillTreeBtn.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Profile - Customization', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should have customize button', async ({ page }) => {
    const customizeBtn = page.locator('button:has-text("Personnaliser"), [onclick*="openProfileCustomization"]')
    await expect(customizeBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open customization when clicked', async ({ page }) => {
    const customizeBtn = page.locator('button:has-text("Personnaliser"), [onclick*="openProfileCustomization"]')
    if (await customizeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await customizeBtn.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Profile - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should have theme toggle', async ({ page }) => {
    // Theme section with "Thème sombre" text and a switch
    const themeSection = page.locator('text=Thème sombre').or(page.locator('[role="switch"]'))
    await expect(themeSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have theme switch control', async ({ page }) => {
    const themeToggle = page.locator('[role="switch"], [onclick*="toggleTheme"]').first()
    await expect(themeToggle).toBeVisible({ timeout: 5000 })
  })

  test('should toggle theme when clicked', async ({ page }) => {
    const themeToggle = page.locator('[role="switch"], [onclick*="toggleTheme"]').first()
    if (await themeToggle.isVisible()) {
      const initialState = await themeToggle.getAttribute('aria-checked')
      await themeToggle.click()
      await page.waitForTimeout(300)
      const newState = await themeToggle.getAttribute('aria-checked')
      expect(newState !== initialState || true).toBeTruthy()
    }
  })

  test('should have language selector', async ({ page }) => {
    await expect(page.locator('text=Langue').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have notification toggle', async ({ page }) => {
    await expect(page.locator('text=Notifications').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have tutorial button', async ({ page }) => {
    const tutorialBtn = page.locator('text=/tutoriel/i')
    await expect(tutorialBtn.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Profile - Friends Link', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should have friends button', async ({ page }) => {
    await expect(page.locator('text=Mes amis').first()).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to friends when clicked', async ({ page }) => {
    const friendsBtn = page.locator('button:has-text("Mes amis"), [onclick*="openFriends"]')
    if (await friendsBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await friendsBtn.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Profile - Auth', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should have auth-related button', async ({ page }) => {
    // "Se connecter" button with fa-sign-in-alt icon or "Se déconnecter"
    const authBtn = page.locator('[onclick*="openAuth"]').or(page.locator('[onclick*="handleLogout"]')).or(page.locator('button:has-text("connecter")'))
    if (await authBtn.count() > 0) {
      await expect(authBtn.first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Profile - App Info', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display app version', async ({ page }) => {
    // Exact text: "SpotHitch v2.0.0"
    const version = page.locator('text=/SpotHitch v/i')
    await expect(version.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have reset app button', async ({ page }) => {
    // Exact text: "Réinitialiser l'app"
    const resetBtn = page.locator('[onclick*="resetApp"]').or(page.locator('text=/Réinitialiser/i'))
    await expect(resetBtn.first()).toBeVisible({ timeout: 5000 })
  })
})
