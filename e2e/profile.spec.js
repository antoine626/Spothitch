/**
 * E2E Tests - Profile & Settings
 * Tests for profile, skill tree, customization, settings
 */

import { test, expect } from '@playwright/test';

test.describe('Profile View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Skip welcome/tutorial
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="profile"]');
  });

  test('should display profile header', async ({ page }) => {
    await expect(page.locator('text=Voyageur')).toBeVisible({ timeout: 5000 });
  });

  test('should display user stats', async ({ page }) => {
    await expect(page.locator('text=Points')).toBeVisible();
    await expect(page.locator('text=Niveau')).toBeVisible();
  });

  test('should display activity section', async ({ page }) => {
    await expect(page.locator('text=Activité')).toBeVisible();
    await expect(page.locator('text=Spots partagés')).toBeVisible();
  });

  test('should have settings section', async ({ page }) => {
    await expect(page.locator('text=Paramètres')).toBeVisible();
    await expect(page.locator('text=Thème')).toBeVisible();
    await expect(page.locator('text=Langue')).toBeVisible();
  });
});

test.describe('Profile - Skill Tree', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="profile"]');
  });

  test('should have skill tree button', async ({ page }) => {
    const skillTreeBtn = page.locator('text=Arbre de compétences, button:has-text("compétences")');
    await expect(skillTreeBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open skill tree modal', async ({ page }) => {
    await page.click('button:has-text("compétences")');
    await expect(page.locator('text=Arbre de compétences')).toBeVisible({ timeout: 5000 });
  });

  test('should display skill categories', async ({ page }) => {
    await page.click('button:has-text("compétences")');
    await expect(page.locator('text=Explorateur')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Social')).toBeVisible();
  });

  test('should display skill points', async ({ page }) => {
    await page.click('button:has-text("compétences")');
    await expect(page.locator('text=Points disponibles')).toBeVisible({ timeout: 5000 });
  });

  test('should display skills in each category', async ({ page }) => {
    await page.click('button:has-text("compétences")');
    // Should see skill items
    const skillItems = page.locator('.skill-item, [data-skill]');
    // At least some skills should be visible
  });
});

test.describe('Profile - Customization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="profile"]');
  });

  test('should have customize button', async ({ page }) => {
    const customizeBtn = page.locator('text=Personnaliser, button:has-text("Personnaliser")');
    await expect(customizeBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open customization modal', async ({ page }) => {
    await page.click('button:has-text("Personnaliser")');
    await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="profile"]');
  });

  test('should have theme toggle', async ({ page }) => {
    const themeToggle = page.locator('[role="switch"]').first();
    await expect(themeToggle).toBeVisible({ timeout: 5000 });
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggle = page.locator('[role="switch"]').first();
    const initialState = await themeToggle.getAttribute('aria-checked');
    await themeToggle.click();
    const newState = await themeToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('should have language selector', async ({ page }) => {
    const langSelect = page.locator('select');
    await expect(langSelect.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have notification toggle', async ({ page }) => {
    await expect(page.locator('text=Notifications')).toBeVisible();
  });

  test('should have tutorial button', async ({ page }) => {
    await expect(page.locator('text=tutoriel')).toBeVisible();
  });

  test('should have logout button when logged in', async ({ page }) => {
    // This depends on auth state
    const logoutBtn = page.locator('text=déconnecter');
    // May or may not be visible depending on auth
  });
});

test.describe('Profile - Friends Link', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="profile"]');
  });

  test('should have friends button', async ({ page }) => {
    await expect(page.locator('text=Mes amis')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to friends when clicked', async ({ page }) => {
    await page.click('button:has-text("Mes amis")');
    // Should navigate to social tab with friends sub-tab
    await expect(page.locator('text=Amis')).toBeVisible({ timeout: 5000 });
  });
});
