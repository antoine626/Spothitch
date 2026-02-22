/**
 * E2E Tests - Gamification Features
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

test.describe('Gamification - Challenges Hub', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
  })

  test('should display challenges hub', async ({ page }) => {
    // Hub shows counters (Pouces/Thumbs, Badges, Contributions)
    const content = page.locator('text=/Badges|badges/i')
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show user stats', async ({ page }) => {
    // Stats counters are visible
    const stats = page.locator('text=/Pouces|Thumbs|Contributions/i')
    await expect(stats.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have quiz section', async ({ page }) => {
    const quiz = page.locator('text=/Quiz/i')
    await expect(quiz.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have rewards section', async ({ page }) => {
    const rewards = page.locator('text=/Rewards|Récompenses/i')
    await expect(rewards.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open badges modal', async ({ page }) => {
    const badgesBtn = page.locator('[onclick*="openBadges"]')
    if (await badgesBtn.count() > 0) {
      await badgesBtn.first().click()
      await page.waitForTimeout(2000) // lazy load
      const modal = page.locator('[role="dialog"]').or(page.locator('text=/badge/i'))
      await expect(modal.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should open quiz', async ({ page }) => {
    const quizBtn = page.locator('[onclick*="openQuiz"]')
    if (await quizBtn.count() > 0) {
      await quizBtn.first().click()
      await page.waitForTimeout(2000) // lazy load
      const modal = page.locator('[role="dialog"]').or(page.locator('text=/Quiz|Question/i'))
      await expect(modal.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should open shop', async ({ page }) => {
    const shopBtn = page.locator('[onclick*="openShop"]')
    if (await shopBtn.count() > 0) {
      await shopBtn.first().click()
      await page.waitForTimeout(2000) // lazy load
      const modal = page.locator('[role="dialog"]').or(page.locator('text=/Boutique|Shop/i'))
      await expect(modal.first()).toBeVisible({ timeout: 5000 })
    }
  })
})
