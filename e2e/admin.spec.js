/**
 * E2E Tests - Admin Panel
 * Tests for admin panel functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Skip welcome if shown
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
  });

  test('should have admin button visible', async ({ page }) => {
    const adminBtn = page.locator('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await expect(adminBtn).toBeVisible({ timeout: 5000 });
  });

  test('should open admin panel', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await expect(page.locator('text=Panneau Admin')).toBeVisible({ timeout: 5000 });
  });

  test('should close admin panel', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await expect(page.locator('text=Panneau Admin')).toBeVisible();

    await page.click('[onclick*="closeAdminPanel"], .modal-overlay');
    await expect(page.locator('text=Panneau Admin')).not.toBeVisible({ timeout: 3000 });
  });

  test('should have resource buttons', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await expect(page.locator('text=+100 Points')).toBeVisible();
    await expect(page.locator('text=MAX ALL')).toBeVisible();
  });

  test('should add points when clicking +100', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');

    // Get initial points (if visible)
    const pointsDisplay = page.locator('text=Points').first();

    // Click +100 Points
    await page.click('button:has-text("+100 Points")');

    // Toast should appear
    await expect(page.locator('text=points ajoutés')).toBeVisible({ timeout: 3000 });
  });

  test('should have gamification section', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await expect(page.locator('text=Gamification')).toBeVisible();
    await expect(page.locator('text=Badges')).toBeVisible();
    await expect(page.locator('text=Skill Tree')).toBeVisible();
  });

  test('should have social section', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await expect(page.locator('text=Social')).toBeVisible();
  });

  test('should have system section', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await expect(page.locator('text=Système')).toBeVisible();
    await expect(page.locator('text=Export')).toBeVisible();
  });

  test('should navigate to map via quick nav', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await page.click('button:has-text("Carte"):not(:has(.fa))');

    // Admin panel should close and map should be visible
    await expect(page.locator('#main-map')).toBeVisible({ timeout: 5000 });
  });

  test('should open badges from admin', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await page.click('.admin-btn:has-text("Badges")');

    await expect(page.locator('text=badge')).toBeVisible({ timeout: 5000 });
  });

  test('should open skill tree from admin', async ({ page }) => {
    await page.click('[aria-label*="Admin"], button:has(.fa-shield-alt)');
    await page.click('.admin-btn:has-text("Skill Tree")');

    await expect(page.locator('text=compétences')).toBeVisible({ timeout: 5000 });
  });
});
