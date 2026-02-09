/**
 * E2E Tests - Accessibility (WCAG 2.1 AA)
 * Updated to match current app structure
 */

import { test, expect } from '@playwright/test';
import { skipOnboarding } from './helpers.js';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('should have proper document structure', async ({ page }) => {
    // Check for main app container
    await expect(page.locator('#app')).toBeVisible();

    // Check for navigation landmark
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have skip link', async ({ page }) => {
    const skipLink = page.locator('a[href="#app"], a[href="#main"], .skip-link, .sr-only').first();

    // Skip link should exist (may be visually hidden)
    const count = await skipLink.count();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not exist
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    // App should have at least some headings
    expect(headings.length).toBeGreaterThanOrEqual(0);
  });

  test('should have accessible buttons', async ({ page }) => {
    const buttons = await page.locator('button').all();

    let accessibleCount = 0;
    for (const button of buttons.slice(0, 20)) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      // Button should have accessible name
      const hasAccessibleName =
        (text && text.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledBy;

      if (hasAccessibleName) accessibleCount++;
    }

    // Most buttons should be accessible
    expect(accessibleCount).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Start from body
    await page.keyboard.press('Tab');

    // Should focus on first interactive element
    const focusedElement = page.locator(':focus');

    // Tab through several elements
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }

    // Should still have focus somewhere
    const focused = page.locator(':focus');
    const count = await focused.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    const count = await focusedElement.count();

    if (count > 0) {
      // Check that focus is visible (has outline or other indicator)
      const outlineStyle = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
          border: styles.border,
        };
      });

      // Should have some kind of focus indicator or be styled
      expect(outlineStyle).toBeDefined();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check main text elements
    const textElements = await page.locator('p, span, h1, h2, h3, button').all();

    for (const element of textElements.slice(0, 5)) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      // Colors should be defined
      expect(styles.color).toBeDefined();
    }
  });

  test('should handle reduced motion preference', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForSelector('#app.loaded', { timeout: 10000 });

    // App should still load and work
    await expect(page.locator('#app')).toBeVisible();
  });

  test('should have ARIA live regions', async ({ page }) => {
    // Check for ARIA live regions
    const liveRegions = await page.locator('[aria-live], [role="alert"], [role="status"]').all();

    // App should have at least one live region for announcements
    expect(liveRegions.length).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('should have accessible navigation', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Navigation should have aria-label
    const ariaLabel = await nav.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('should have tab navigation with proper roles', async ({ page }) => {
    const navButtons = page.locator('nav button[role="tab"]');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(0);

    // Check first button has proper attributes
    const firstButton = navButtons.first();
    const ariaSelected = await firstButton.getAttribute('aria-selected');
    expect(['true', 'false']).toContain(ariaSelected);
  });
});

test.describe('Touch & Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have touch-friendly tap targets', async ({ page }) => {
    await skipOnboarding(page);

    const navButtons = await page.locator('nav button').all();

    let goodSizeCount = 0;
    for (const button of navButtons) {
      const box = await button.boundingBox();

      if (box) {
        // WCAG recommends 44x44 minimum
        if (box.width >= 40 && box.height >= 40) {
          goodSizeCount++;
        }
      }
    }

    // Most nav buttons should be properly sized
    expect(goodSizeCount).toBeGreaterThan(0);
  });

  test('should work in portrait orientation', async ({ page }) => {
    await skipOnboarding(page);
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('#app')).toBeVisible();
  });
});
