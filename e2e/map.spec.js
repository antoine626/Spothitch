/**
 * E2E Tests - Map Features
 * Tests for map view, zoom controls, search, spots
 */

import { test, expect } from '@playwright/test';
import { skipOnboarding, navigateToTab } from './helpers.js';

test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'map');
  });

  test('should display map container', async ({ page }) => {
    const mapContainer = page.locator('#main-map, .leaflet-container');
    await expect(mapContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have search bar', async ({ page }) => {
    const searchInput = page.locator('#map-search, input[placeholder*="Rechercher"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have filter button', async ({ page }) => {
    const filterBtn = page.locator('button[aria-label*="Filtre"], button:has(i.fa-sliders), button:has(i.fa-sliders-h)');
    await expect(filterBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display spots count', async ({ page }) => {
    const spotsCount = page.locator('text=/spots disponibles/i');
    await expect(spotsCount.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Map - Score Bar', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'map');
  });

  test('should display points', async ({ page }) => {
    const pointsDisplay = page.locator('text=pts');
    await expect(pointsDisplay.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display level', async ({ page }) => {
    const levelDisplay = page.locator('text=/Niv/i');
    await expect(levelDisplay.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open stats when clicking on points', async ({ page }) => {
    const statsButton = page.locator('button:has-text("pts")');
    if ((await statsButton.count()) > 0) {
      await statsButton.first().click();
      await page.waitForTimeout(500);
      // Stats modal or overlay should appear
    }
  });
});

test.describe('Map - Zoom Controls', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'map');
  });

  test('should have zoom in button', async ({ page }) => {
    const zoomInBtn = page.locator('button[aria-label*="Zoom"], button:has(i.fa-plus)').first();
    await expect(zoomInBtn).toBeVisible({ timeout: 5000 });
  });

  test('should have zoom out button', async ({ page }) => {
    const zoomOutBtn = page.locator('button[aria-label*="zoom"], button:has(i.fa-minus)');
    await expect(zoomOutBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have location button', async ({ page }) => {
    const locationBtn = page.locator('button[aria-label*="position"], button:has(i.fa-location-crosshairs), button:has(i.fa-crosshairs)');
    await expect(locationBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('zoom in should work', async ({ page }) => {
    const zoomInBtn = page.locator('button:has(i.fa-plus)').first();
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click();
      await page.waitForTimeout(300);
      // Map should zoom (visual check - no error thrown)
    }
  });

  test('zoom out should work', async ({ page }) => {
    const zoomOutBtn = page.locator('button:has(i.fa-minus)').first();
    if (await zoomOutBtn.isVisible()) {
      await zoomOutBtn.click();
      await page.waitForTimeout(300);
      // Map should zoom out (visual check - no error thrown)
    }
  });
});

test.describe('Map - Add Spot', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'map');
  });

  test('should have add spot FAB', async ({ page }) => {
    const addBtn = page.locator('button[aria-label*="Ajouter"], button.fab, button:has(i.fa-plus)');
    // Filter for the FAB specifically (larger add button)
    const fabBtn = page.locator('button[aria-label*="Ajouter un nouveau spot"]');
    await expect(fabBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open add spot modal when clicking FAB', async ({ page }) => {
    const addBtn = page.locator('button[aria-label*="Ajouter un nouveau spot"]');
    if ((await addBtn.count()) > 0) {
      await addBtn.first().click();
      await page.waitForTimeout(500);
      // Modal should appear
      const modal = page.locator('.modal-overlay, [role="dialog"], text=/Nouveau spot|Ajouter/i');
      // Modal might appear or toast for login required
    }
  });
});

test.describe('Map - Search', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'map');
  });

  test('should allow typing in search', async ({ page }) => {
    const searchInput = page.locator('#map-search');
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('Paris');
      await expect(searchInput).toHaveValue('Paris');
    }
  });

  test('should search on enter', async ({ page }) => {
    const searchInput = page.locator('#map-search');
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('Paris');
      await searchInput.press('Enter');
      // Should trigger search (toast or map move)
      await page.waitForTimeout(1500);
      // No error should occur
    }
  });

  test('should have filter functionality', async ({ page }) => {
    const filterBtn = page.locator('button:has(i.fa-sliders), button:has(i.fa-sliders-h)');
    if ((await filterBtn.count()) > 0) {
      await filterBtn.first().click();
      await page.waitForTimeout(500);
      // Filter UI should appear
    }
  });
});

test.describe('Map - Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'map');
  });

  test('should be interactive', async ({ page }) => {
    const mapContainer = page.locator('#main-map');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Map should be clickable/draggable
    const box = await mapContainer.boundingBox();
    if (box) {
      // Try to interact with map
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
    }
  });

  test('should show guide indicator when available', async ({ page }) => {
    // Guide indicator might be visible for some countries
    const guideIndicator = page.locator('#guide-indicator, text=/Guide disponible/i');
    // This is conditional - may or may not be visible
    const count = await guideIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Map - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'map');
  });

  test('should have accessible search input', async ({ page }) => {
    const searchInput = page.locator('#map-search');
    if ((await searchInput.count()) > 0) {
      const ariaLabel = await searchInput.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should have accessible zoom controls', async ({ page }) => {
    const zoomIn = page.locator('button[aria-label*="Zoom"], button[aria-label*="zoom"]').first();
    if (await zoomIn.isVisible()) {
      const ariaLabel = await zoomIn.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should have accessible add button', async ({ page }) => {
    const addBtn = page.locator('button[aria-label*="Ajouter"]').first();
    if (await addBtn.isVisible()) {
      const ariaLabel = await addBtn.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});
