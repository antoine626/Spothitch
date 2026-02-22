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
    const profileHeader = page.locator('h2').filter({ hasText: /Voyageur|TestUser/ })
    await expect(profileHeader.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display user stats', async ({ page }) => {
    await expect(page.locator('text=Spots créés').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Score de confiance').first()).toBeVisible({ timeout: 5000 })
  })

  test('should display trust score section', async ({ page }) => {
    const trustScore = page.locator('text=Détail du score').or(page.locator('text=Améliore ton score'))
    await expect(trustScore.first()).toBeVisible({ timeout: 5000 })
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

  test('should have customize or edit button', async ({ page }) => {
    const customizeBtn = page.locator('button:has-text("Personnaliser")').or(page.locator('button:has-text("Modifier")')).or(page.locator('[onclick*="openProfileCustomization"]'))
    await expect(customizeBtn.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Profile - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should have theme toggle', async ({ page }) => {
    const themeSection = page.locator('text=Mode sombre').or(page.locator('[role="switch"]'))
    await expect(themeSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have theme switch control', async ({ page }) => {
    const themeToggle = page.locator('[role="switch"]').first()
    await expect(themeToggle).toBeVisible({ timeout: 5000 })
  })

  test('should toggle theme when clicked', async ({ page }) => {
    const themeToggle = page.locator('[role="switch"]').first()
    if (await themeToggle.isVisible()) {
      const initialState = await themeToggle.getAttribute('aria-checked')
      await themeToggle.click()
      await page.waitForTimeout(500)
      const newState = await themeToggle.getAttribute('aria-checked')
      if (initialState !== null) {
        expect(newState).not.toBe(initialState)
      }
    }
  })

  test('should have language selector', async ({ page }) => {
    await expect(page.locator('text=Langue').first()).toBeVisible({ timeout: 5000 })
    // Language is now a radiogroup, not a select
    const langSelector = page.locator('[role="radiogroup"]').or(page.locator('text=FR'))
    await expect(langSelector.first()).toBeVisible({ timeout: 5000 })
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
})

test.describe('Profile - Auth', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should have auth-related button', async ({ page }) => {
    const authBtn = page.locator('button:has-text("Connexion")')
    await expect(authBtn.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Profile - App Info', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'profile')
  })

  test('should display app version', async ({ page }) => {
    const version = page.locator('text=/SpotHitch v/i')
    await expect(version.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have reset app button', async ({ page }) => {
    const resetBtn = page.locator('text=/Réinitialiser/i')
    await expect(resetBtn.first()).toBeVisible({ timeout: 5000 })
  })
})
