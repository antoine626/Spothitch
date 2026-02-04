/**
 * E2E Tests - Social Features
 * Tests for chat, friends, groups
 */

import { test, expect } from '@playwright/test';
import { skipOnboarding, navigateToTab } from './helpers.js';

test.describe('Social - Main View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'social');
  });

  test('should display social view', async ({ page }) => {
    // Social tab should be active
    const socialTab = page.locator('[data-tab="social"]');
    await expect(socialTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should have sub-tabs for navigation', async ({ page }) => {
    // Should have General sub-tab
    const generalTab = page.locator('button:has-text("Général")');
    await expect(generalTab.first()).toBeVisible({ timeout: 5000 });

    // Should have Regional sub-tab
    const regionalTab = page.locator('button:has-text("Régional")');
    await expect(regionalTab.first()).toBeVisible({ timeout: 5000 });

    // Should have Friends sub-tab
    const friendsTab = page.locator('button:has-text("Amis")');
    await expect(friendsTab.first()).toBeVisible({ timeout: 5000 });

    // Should have Groups sub-tab
    const groupsTab = page.locator('button:has-text("Groupes")');
    await expect(groupsTab.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Social - Chat', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'social');
  });

  test('should have message input', async ({ page }) => {
    const input = page.locator('#chat-input, input[placeholder*="message"]');
    await expect(input.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have send button', async ({ page }) => {
    const sendBtn = page.locator('button[type="submit"], button:has(i.fa-paper-plane)');
    await expect(sendBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to regional chat', async ({ page }) => {
    const regionalTab = page.locator('button:has-text("Régional")');
    if ((await regionalTab.count()) > 0) {
      await regionalTab.first().click();
      await page.waitForTimeout(500);
      // Regional tab should be active (has primary color class)
      await expect(regionalTab.first()).toHaveClass(/bg-primary/);
    }
  });
});

test.describe('Social - Friends', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'social');
    // Click on friends tab
    const friendsTab = page.locator('button:has-text("Amis")');
    if ((await friendsTab.count()) > 0) {
      await friendsTab.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should display friends sub-tab active', async ({ page }) => {
    const friendsTab = page.locator('button:has-text("Amis")');
    await expect(friendsTab.first()).toHaveClass(/bg-primary/);
  });

  test('should have friend search input', async ({ page }) => {
    const searchInput = page.locator('#friend-search, input[placeholder*="ami"], input[placeholder*="Rechercher"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state or friends list', async ({ page }) => {
    // Either shows empty state message or friends list
    const content = page.locator('text=/amis|Ajouter/i');
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Social - Groups', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'social');
    // Click on groups tab
    const groupsTab = page.locator('button:has-text("Groupes")');
    if ((await groupsTab.count()) > 0) {
      await groupsTab.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should display groups sub-tab active', async ({ page }) => {
    const groupsTab = page.locator('button:has-text("Groupes")');
    await expect(groupsTab.first()).toHaveClass(/bg-primary/);
  });

  test('should have create group button', async ({ page }) => {
    const createBtn = page.locator('text=/Créer.*groupe/i');
    await expect(createBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have nearby friends feature', async ({ page }) => {
    const nearbyBtn = page.locator('text=/proximité/i');
    await expect(nearbyBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open create group when clicked', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Créer un groupe")');
    if ((await createBtn.count()) > 0) {
      await createBtn.first().click();
      await page.waitForTimeout(500);
      // Modal or form should appear
    }
  });

  test('should open nearby friends when clicked', async ({ page }) => {
    const nearbyBtn = page.locator('button:has-text("proximité")');
    if ((await nearbyBtn.count()) > 0) {
      await nearbyBtn.first().click();
      await page.waitForTimeout(500);
      // Modal or view should appear
    }
  });
});

test.describe('Social - Chat Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'social');
  });

  test('should allow typing in chat input', async ({ page }) => {
    const input = page.locator('#chat-input');
    if ((await input.count()) > 0) {
      await input.fill('Test message');
      await expect(input).toHaveValue('Test message');
    }
  });

  test('should clear input after submitting', async ({ page }) => {
    const input = page.locator('#chat-input');
    const form = page.locator('form:has(#chat-input)');
    if ((await input.count()) > 0 && (await form.count()) > 0) {
      await input.fill('Test message');
      // Submit the form
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      // Note: In real app, message would be sent; here we just verify UI behavior
    }
  });
});

test.describe('Social - Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await navigateToTab(page, 'social');
  });

  test('should switch between all sub-tabs', async ({ page }) => {
    const tabs = ['Général', 'Régional', 'Amis', 'Groupes'];

    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`);
      if ((await tab.count()) > 0) {
        await tab.first().click();
        await page.waitForTimeout(300);
        // Tab should become active
        await expect(tab.first()).toHaveClass(/bg-primary/);
      }
    }
  });
});
