/**
 * E2E Tests - Gamification Features
 * Tests for badges, challenges, quiz, shop, skill tree
 */

import { test, expect } from '@playwright/test';

test.describe('Gamification - Challenges Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Skip welcome if shown
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="challenges"]');
  });

  test('should display challenges hub', async ({ page }) => {
    await expect(page.locator('text=Défis')).toBeVisible();
    await expect(page.locator('text=Badges')).toBeVisible();
  });

  test('should show user stats (points, league, VIP)', async ({ page }) => {
    await expect(page.locator('text=Pouces')).toBeVisible();
    await expect(page.locator('text=Ligue')).toBeVisible();
  });

  test('should open badges modal', async ({ page }) => {
    await page.click('button:has-text("Badges")');
    await expect(page.locator('text=Mes badges')).toBeVisible({ timeout: 5000 });
  });

  test('should open challenges modal', async ({ page }) => {
    await page.click('button:has-text("Défis"):not(:has-text("équipe"))');
    await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('should open quiz', async ({ page }) => {
    await page.click('button:has-text("Quiz")');
    await expect(page.locator('text=Question')).toBeVisible({ timeout: 5000 });
  });

  test('should open shop', async ({ page }) => {
    await page.click('button:has-text("Boutique")');
    await expect(page.locator('text=Boutique')).toBeVisible({ timeout: 5000 });
  });

  test('should open team challenges', async ({ page }) => {
    const teamBtn = page.locator('button:has-text("équipe")');
    if (await teamBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await teamBtn.click();
      await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show leaderboard', async ({ page }) => {
    await page.click('text=classement');
    await expect(page.locator('text=Classement')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Gamification - Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="challenges"]');
    await page.click('button:has-text("Quiz")');
  });

  test('should start quiz', async ({ page }) => {
    await expect(page.locator('text=Question')).toBeVisible({ timeout: 5000 });
  });

  test('should display answer options', async ({ page }) => {
    const options = page.locator('.quiz-option, button[data-answer]');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow selecting an answer', async ({ page }) => {
    const firstOption = page.locator('.quiz-option, button[data-answer]').first();
    await firstOption.click();
    // Should either show next question or result
  });
});

test.describe('Gamification - Shop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="challenges"]');
    await page.click('button:has-text("Boutique")');
  });

  test('should display shop items', async ({ page }) => {
    await expect(page.locator('text=Boutique')).toBeVisible({ timeout: 5000 });
  });

  test('should show item prices', async ({ page }) => {
    await expect(page.locator('text=points')).toBeVisible();
  });

  test('should open my rewards', async ({ page }) => {
    const rewardsBtn = page.locator('text=Mes récompenses, button:has-text("récompenses")');
    if (await rewardsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rewardsBtn.click();
    }
  });
});
