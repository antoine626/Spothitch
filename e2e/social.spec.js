/**
 * E2E Tests - Social Features
 * Tests for chat, friends, groups
 */

import { test, expect } from '@playwright/test';

test.describe('Social - Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="social"]');
  });

  test('should display social view', async ({ page }) => {
    await expect(page.locator('[data-tab="social"]')).toHaveAttribute('aria-selected', 'true');
  });

  test('should have chat sub-tabs', async ({ page }) => {
    await expect(page.locator('text=Général')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Régional')).toBeVisible();
    await expect(page.locator('text=Amis')).toBeVisible();
  });

  test('should switch between chat rooms', async ({ page }) => {
    // Click on Regional
    await page.click('button:has-text("Régional")');
    await expect(page.locator('button:has-text("Régional")')).toHaveClass(/bg-primary/);
  });

  test('should have message input', async ({ page }) => {
    const input = page.locator('input[placeholder*="message"], #chat-input');
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test('should have send button', async ({ page }) => {
    const sendBtn = page.locator('button[type="submit"], button:has(.fa-paper-plane)');
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Social - Friends', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="social"]');
    await page.click('button:has-text("Amis")');
  });

  test('should display friends tab', async ({ page }) => {
    await expect(page.locator('button:has-text("Amis")')).toHaveClass(/bg-primary/);
  });

  test('should have friend search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="ami"], #friend-search');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state or friends list', async ({ page }) => {
    // Either shows "Pas encore d'amis" or a list of friends
    const content = page.locator('text=amis, text=Ajouter');
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Social - Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.locator('text=Passer');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }
    await page.click('[data-tab="social"]');
  });

  test('should have groups tab', async ({ page }) => {
    const groupsTab = page.locator('button:has-text("Groupes")');
    await expect(groupsTab).toBeVisible({ timeout: 5000 });
  });

  test('should switch to groups tab', async ({ page }) => {
    await page.click('button:has-text("Groupes")');
    await expect(page.locator('button:has-text("Groupes")')).toHaveClass(/bg-primary/);
  });

  test('should have create group button', async ({ page }) => {
    await page.click('button:has-text("Groupes")');
    await expect(page.locator('text=Créer un groupe')).toBeVisible({ timeout: 5000 });
  });

  test('should have nearby friends button', async ({ page }) => {
    await page.click('button:has-text("Groupes")');
    await expect(page.locator('text=proximité')).toBeVisible({ timeout: 5000 });
  });

  test('should open create group modal', async ({ page }) => {
    await page.click('button:has-text("Groupes")');
    await page.click('button:has-text("Créer un groupe")');
    // Modal should open
    await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('should open nearby friends', async ({ page }) => {
    await page.click('button:has-text("Groupes")');
    await page.click('button:has-text("proximité")');
    await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeVisible({ timeout: 5000 });
  });
});
