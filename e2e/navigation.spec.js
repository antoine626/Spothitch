/**
 * E2E Tests - Navigation & Core Flows
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/SpotHitch/);
    await expect(page.locator('text=SpotHitch')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Navigate to Spots
    await page.click('[data-tab="spots"]');
    await expect(page.locator('text=Rechercher')).toBeVisible();

    // Navigate to Chat
    await page.click('[data-tab="chat"]');
    await expect(page.locator('text=général')).toBeVisible();

    // Navigate to Profile
    await page.click('[data-tab="profile"]');
    await expect(page.locator('text=Niveau')).toBeVisible();

    // Back to Home
    await page.click('[data-tab="home"]');
    await expect(page.locator('text=Bienvenue')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('aria-label');
    
    const navButtons = page.locator('nav button');
    const count = await navButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);
      await expect(button).toHaveAttribute('aria-label');
    }
  });
});

test.describe('Spots View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-tab="spots"]');
  });

  test('should display spot list', async ({ page }) => {
    await expect(page.locator('.spot-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('should toggle between list and map view', async ({ page }) => {
    // Click map view button
    await page.click('[data-view="map"]');
    await expect(page.locator('#map-container')).toBeVisible();

    // Click list view button
    await page.click('[data-view="list"]');
    await expect(page.locator('.spot-card').first()).toBeVisible();
  });

  test('should filter spots', async ({ page }) => {
    // Click on "Top" filter
    await page.click('[data-filter="top"]');
    await page.waitForTimeout(300);
    
    // Verify filter is active
    await expect(page.locator('[data-filter="top"]')).toHaveClass(/active/);
  });

  test('should search spots', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Rechercher"]');
    await searchInput.fill('Paris');
    await page.waitForTimeout(500);
    
    // Should show Paris-related spots
    await expect(page.locator('.spot-card:has-text("Paris")').first()).toBeVisible();
  });
});

test.describe('Spot Detail', () => {
  test('should open spot detail modal', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-tab="spots"]');
    
    // Wait for spots to load and click first one
    await page.waitForSelector('.spot-card');
    await page.click('.spot-card >> nth=0');
    
    // Modal should be visible
    await expect(page.locator('[role="dialog"], .modal, .slide-up')).toBeVisible();
  });

  test('should close spot detail modal', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-tab="spots"]');
    await page.waitForSelector('.spot-card');
    await page.click('.spot-card >> nth=0');
    
    // Close modal
    await page.click('[aria-label="Fermer"], button:has-text("×")');
    
    // Modal should be hidden
    await expect(page.locator('[role="dialog"], .modal')).not.toBeVisible();
  });
});

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-tab="profile"]');
  });

  test('should display user stats', async ({ page }) => {
    await expect(page.locator('text=Spots')).toBeVisible();
    await expect(page.locator('text=Check-ins')).toBeVisible();
    await expect(page.locator('text=Points')).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggle = page.locator('[data-action="toggle-theme"], button:has-text("Thème")');
    
    // Get initial theme
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('class');
    
    // Toggle theme
    await themeToggle.click();
    
    // Theme should change
    const newTheme = await html.getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should change language', async ({ page }) => {
    const langSelect = page.locator('select[name="language"], [data-action="change-language"]');
    
    if (await langSelect.isVisible()) {
      await langSelect.selectOption('en');
      await page.waitForTimeout(300);
      
      // UI should update to English
      await expect(page.locator('text=Level')).toBeVisible();
    }
  });
});

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-tab="chat"]');
  });

  test('should display chat rooms', async ({ page }) => {
    await expect(page.locator('text=général')).toBeVisible();
    await expect(page.locator('text=aide')).toBeVisible();
  });

  test('should switch chat rooms', async ({ page }) => {
    await page.click('button:has-text("aide")');
    await expect(page.locator('button:has-text("aide")')).toHaveClass(/active|selected/);
  });

  test('should have message input', async ({ page }) => {
    const input = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });
});

test.describe('SOS Mode', () => {
  test('should open SOS modal', async ({ page }) => {
    await page.goto('/');
    
    // Find and click SOS button
    const sosButton = page.locator('[data-action="sos"], button:has-text("SOS"), .sos-button');
    await sosButton.click();
    
    // SOS modal should appear
    await expect(page.locator('text=Urgence')).toBeVisible();
  });
});

test.describe('Add Spot', () => {
  test('should open add spot modal from home', async ({ page }) => {
    await page.goto('/');
    
    // Click add spot button
    const addButton = page.locator('[data-action="add-spot"], button:has-text("Ajouter")');
    await addButton.click();
    
    // Modal should appear
    await expect(page.locator('text=Nouveau spot')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="add-spot"], button:has-text("Ajouter")');
    
    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Publier")');
    
    // Should show validation error or required attribute
    const fromInput = page.locator('input[name="from"]');
    const isInvalid = await fromInput.evaluate(el => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });
});
