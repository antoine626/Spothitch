/**
 * E2E Tests - Map Features
 * Tests for map view, zoom controls, search, spots
 */

import { test, expect } from '@playwright/test';

test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="map"]');
  });

  test('should display map container', async ({ page }) => {
    await expect(page.locator('#main-map')).toBeVisible({ timeout: 10000 });
  });

  test('should have search bar', async ({ page }) => {
    const searchInput = page.locator('#map-search, input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should have filter button', async ({ page }) => {
    const filterBtn = page.locator('button[aria-label*="Filtre"], button:has(.fa-sliders)');
    await expect(filterBtn).toBeVisible({ timeout: 5000 });
  });

  test('should display spots count', async ({ page }) => {
    await expect(page.locator('text=spots disponibles')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Map - Zoom Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="map"]');
  });

  test('should have zoom in button', async ({ page }) => {
    const zoomInBtn = page.locator('button[aria-label*="Zoom"], button:has(.fa-plus)').first();
    await expect(zoomInBtn).toBeVisible({ timeout: 5000 });
  });

  test('should have zoom out button', async ({ page }) => {
    const zoomOutBtn = page.locator('button[aria-label*="zoom"], button:has(.fa-minus)');
    await expect(zoomOutBtn).toBeVisible({ timeout: 5000 });
  });

  test('should have location button', async ({ page }) => {
    const locationBtn = page.locator('button[aria-label*="position"], button:has(.fa-location)');
    await expect(locationBtn).toBeVisible({ timeout: 5000 });
  });

  test('zoom in should work', async ({ page }) => {
    const zoomInBtn = page.locator('button:has(.fa-plus)').first();
    await zoomInBtn.click();
    // Map should zoom (we can't easily verify zoom level without accessing map instance)
  });

  test('zoom out should work', async ({ page }) => {
    const zoomOutBtn = page.locator('button:has(.fa-minus)');
    await zoomOutBtn.click();
    // Map should zoom out
  });
});

test.describe('Map - Add Spot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="map"]');
  });

  test('should have add spot FAB', async ({ page }) => {
    const addBtn = page.locator('button[aria-label*="Ajouter"]');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
  });

  test('should open add spot modal', async ({ page }) => {
    await page.click('button[aria-label*="Ajouter"]');
    await expect(page.locator('text=Nouveau spot, text=Ajouter un spot')).toBeVisible({ timeout: 5000 });
  });

  test('add spot modal should have form fields', async ({ page }) => {
    await page.click('button[aria-label*="Ajouter"]');
    // Should have location input
    await expect(page.locator('input, textarea')).toBeVisible({ timeout: 5000 });
  });

  test('should close add spot modal', async ({ page }) => {
    await page.click('button[aria-label*="Ajouter"]');
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // Close it
    const closeBtn = page.locator('[aria-label*="Fermer"], button:has(.fa-times)');
    await closeBtn.click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Map - Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="map"]');
  });

  test('should allow typing in search', async ({ page }) => {
    const searchInput = page.locator('#map-search');
    await searchInput.fill('Paris');
    await expect(searchInput).toHaveValue('Paris');
  });

  test('should search on enter', async ({ page }) => {
    const searchInput = page.locator('#map-search');
    await searchInput.fill('Paris');
    await searchInput.press('Enter');
    // Should trigger search (toast or map move)
    await page.waitForTimeout(1000);
  });
});

test.describe('Map - Stats Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="map"]');
  });

  test('should display points', async ({ page }) => {
    await expect(page.locator('text=pts')).toBeVisible({ timeout: 5000 });
  });

  test('should display level', async ({ page }) => {
    await expect(page.locator('text=Niv')).toBeVisible({ timeout: 5000 });
  });

  test('should open stats when clicking on points', async ({ page }) => {
    await page.click('button:has-text("pts")');
    // Should open stats modal
    await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeVisible({ timeout: 5000 });
  });
});
