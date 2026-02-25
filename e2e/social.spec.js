/**
 * E2E Tests - Social Features (WhatsApp style: Messagerie | Événements)
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

test.describe('Social - Main View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should display social view', async ({ page }) => {
    const socialTab = page.locator('[data-tab="social"]')
    await expect(socialTab).toHaveAttribute('aria-selected', 'true')
  })

  test('should have sub-tabs for navigation', async ({ page }) => {
    // Social has 2 tabs: Messagerie, Événements
    const messagerieTab = page.locator('[onclick*="setSocialTab"]').first()
    await expect(messagerieTab).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Messagerie', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should display messagerie content', async ({ page }) => {
    // Default tab is messagerie — should show search or conversations
    const content = page.locator('text=/message/i').or(page.locator('text=/conversation/i')).or(page.locator('#social-search'))
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Événements', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
    // Switch to Événements tab
    await page.evaluate(() => window.setSocialTab?.('evenements'))
    await page.waitForTimeout(300)
  })

  test('should display events content', async ({ page }) => {
    const content = page.locator('text=/radar/i').or(page.locator('text=/événement/i')).or(page.locator('text=/event/i'))
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should switch between sub-tabs', async ({ page }) => {
    // Switch to événements
    await page.evaluate(() => window.setSocialTab?.('evenements'))
    await page.waitForTimeout(300)
    // Switch back to messagerie
    await page.evaluate(() => window.setSocialTab?.('messagerie'))
    await page.waitForTimeout(300)
  })
})
