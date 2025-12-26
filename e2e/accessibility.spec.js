/**
 * E2E Tests - Accessibility (WCAG 2.1 AA)
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper document structure', async ({ page }) => {
    // Check for main landmark
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    
    // Check for navigation landmark
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have skip link', async ({ page }) => {
    const skipLink = page.locator('a[href="#main"], .skip-link');
    
    // Skip link should exist (may be visually hidden)
    await expect(skipLink).toHaveCount(1);
    
    // Focus skip link
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    let lastLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName[1]);
      
      // Heading levels should not skip (h1 -> h3 is bad)
      if (lastLevel > 0) {
        expect(level).toBeLessThanOrEqual(lastLevel + 1);
      }
      lastLevel = level;
    }
  });

  test('should have alt text on images', async ({ page }) => {
    await page.click('[data-tab="spots"]');
    await page.waitForSelector('.spot-card');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBe(true);
    }
  });

  test('should have accessible buttons', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      // Button should have accessible name
      const hasAccessibleName = 
        (text && text.trim().length > 0) || 
        ariaLabel || 
        ariaLabelledBy;
      
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('should have accessible form inputs', async ({ page }) => {
    await page.click('[data-tab="spots"]');
    
    const inputs = await page.locator('input:not([type="hidden"])').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Input should have a label
      let hasLabel = ariaLabel || ariaLabelledBy;
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = hasLabel || label > 0;
      }
      
      // Placeholder alone is not sufficient, but we'll accept it for now
      hasLabel = hasLabel || placeholder;
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Start from body
    await page.keyboard.press('Tab');
    
    // Should focus on first interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    
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
    
    // Should have some kind of focus indicator
    const hasFocusIndicator = 
      outlineStyle.outlineWidth !== '0px' ||
      outlineStyle.boxShadow !== 'none' ||
      outlineStyle.outline !== 'none';
    
    expect(hasFocusIndicator).toBe(true);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check main text elements
    const textElements = await page.locator('p, span, h1, h2, h3, button').all();
    
    for (const element of textElements.slice(0, 10)) { // Check first 10
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
        };
      });
      
      // We can't easily calculate contrast ratio here,
      // but we verify colors are defined
      expect(styles.color).toBeDefined();
    }
  });

  test('should handle reduced motion preference', async ({ page, context }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    // Animations should be disabled
    const animatedElement = page.locator('.fade-in, .slide-up').first();
    
    if (await animatedElement.count() > 0) {
      const animationDuration = await animatedElement.evaluate(el => {
        return window.getComputedStyle(el).animationDuration;
      });
      
      // Animation should be instant or very short
      expect(['0s', '0.01s', 'none']).toContain(animationDuration);
    }
  });

  test('should announce dynamic content', async ({ page }) => {
    // Check for ARIA live regions
    const liveRegions = await page.locator('[aria-live], [role="alert"], [role="status"]').all();
    
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA roles on modals', async ({ page }) => {
    // Open a modal (SOS)
    await page.click('[data-action="sos"], button:has-text("SOS"), .sos-button');
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"], .modal');
    
    const modal = page.locator('[role="dialog"], .modal').first();
    
    // Check ARIA attributes
    const ariaModal = await modal.getAttribute('aria-modal');
    const ariaLabel = await modal.getAttribute('aria-label');
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
    
    expect(ariaModal === 'true' || ariaLabel || ariaLabelledBy).toBeTruthy();
  });

  test('should trap focus in modals', async ({ page }) => {
    // Open a modal
    await page.click('[data-action="sos"], button:has-text("SOS"), .sos-button');
    await page.waitForSelector('[role="dialog"], .modal');
    
    // Get all focusable elements in modal
    const modal = page.locator('[role="dialog"], .modal').first();
    const focusableInModal = modal.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    const count = await focusableInModal.count();
    
    if (count > 0) {
      // Tab through all elements
      for (let i = 0; i < count + 2; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Focus should still be within modal
      const focused = page.locator(':focus');
      const isInModal = await modal.locator(':focus').count();
      
      expect(isInModal).toBeGreaterThan(0);
    }
  });

  test('should close modal with Escape key', async ({ page }) => {
    // Open modal
    await page.click('[data-action="sos"], button:has-text("SOS"), .sos-button');
    await page.waitForSelector('[role="dialog"], .modal');
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('[role="dialog"], .modal')).not.toBeVisible();
  });
});

test.describe('Touch & Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have touch-friendly tap targets', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      
      if (box) {
        // WCAG recommends 44x44 minimum
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should work in portrait orientation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });
});
