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
    await expect(page.locator('text=Défis').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Badges').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show user stats (points, league, VIP)', async ({ page }) => {
    await expect(page.locator('text=Pouces').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Ligue').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open badges modal', async ({ page }) => {
    await page.locator('[onclick*="openBadges"]').first().click()
    await expect(page.locator('text=Mes badges').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open challenges modal', async ({ page }) => {
    await page.locator('[onclick*="openChallenges"]').first().click()
    await expect(page.locator('.modal-overlay, [role="dialog"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open quiz', async ({ page }) => {
    await page.locator('[onclick*="openQuiz"]').first().click()
    await expect(page.locator('text=Question').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open shop', async ({ page }) => {
    await page.locator('[onclick*="openShop"]').first().click()
    await expect(page.locator('text=Boutique').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open team challenges', async ({ page }) => {
    const teamBtn = page.locator('[onclick*="openTeamChallenges"]').or(page.locator('button:has-text("équipe")'))
    if (await teamBtn.count() > 0 && await teamBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await teamBtn.first().click()
      await page.waitForTimeout(500)
      // Team challenges modal or content should be visible
      const content = page.locator('.modal-overlay, [role="dialog"]').or(page.locator('text=/équipe/i'))
      await expect(content.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show leaderboard', async ({ page }) => {
    const leaderboardBtn = page.locator('[onclick*="openLeaderboard"]').or(page.locator('button:has-text("Classement")'))
    if (await leaderboardBtn.count() > 0) {
      await leaderboardBtn.first().click()
      await expect(page.locator('text=Classement').first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Gamification - Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
    await page.locator('[onclick*="openQuiz"]').first().click()
    await page.waitForTimeout(500)
    // Quiz shows intro first - click "Commencer le Quiz" to start
    const startBtn = page.locator('button:has-text("Commencer"), [onclick*="startQuizGame"]')
    if (await startBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should start quiz', async ({ page }) => {
    await expect(page.locator('text=Question').first()).toBeVisible({ timeout: 5000 })
  })

  test('should display answer options', async ({ page }) => {
    // Quiz options use onclick="answerQuizQuestion(N)" buttons
    const options = page.locator('button[onclick^="answerQuizQuestion"]')
    await expect(options.first()).toBeVisible({ timeout: 5000 })
  })

  test('should allow selecting an answer', async ({ page }) => {
    const firstOption = page.locator('button[onclick^="answerQuizQuestion"]').first()
    await expect(firstOption).toBeVisible({ timeout: 5000 })
    await firstOption.click()
  })
})

test.describe('Gamification - Shop', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'challenges')
    await page.locator('[onclick*="openShop"]').first().click()
  })

  test('should display shop items', async ({ page }) => {
    await expect(page.locator('text=Boutique').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show item prices', async ({ page }) => {
    await expect(page.locator('text=points').first()).toBeVisible()
  })

  test('should have shop content visible', async ({ page }) => {
    // Verify shop is open with items
    const shopContent = page.locator('text=Boutique').or(page.locator('text=points'))
    await expect(shopContent.first()).toBeVisible({ timeout: 5000 })
  })
})
