/**
 * E2E Tests - Social Features
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
    // Social has tabs: Fil (Feed), Messages, Amis (Friends)
    const feedTab = page.locator('button:has-text("Fil")')
    const messagesTab = page.locator('button:has-text("Messages")')
    const friendsTab = page.locator('button:has-text("Amis")')
    await expect(feedTab.first()).toBeVisible({ timeout: 5000 })
    await expect(messagesTab.first()).toBeVisible({ timeout: 5000 })
    await expect(friendsTab.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Feed', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should have feed filter buttons', async ({ page }) => {
    // Feed has filter buttons: Tout, Amis, Événements, Proches
    const allFilter = page.locator('button:has-text("Tout")')
    await expect(allFilter.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have proximity radar toggle', async ({ page }) => {
    const radar = page.locator('text=Radar de proximité').or(page.locator('text=proximité'))
    await expect(radar.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Friends', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
    const friendsTab = page.locator('button:has-text("Amis")')
    if ((await friendsTab.count()) > 0) {
      await friendsTab.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test('should display friends section', async ({ page }) => {
    // Friends tab should be active or show friends-related content
    const content = page.locator('text=/ami/i')
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Messages', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
    const messagesTab = page.locator('button:has-text("Messages")')
    if ((await messagesTab.count()) > 0) {
      await messagesTab.first().click()
      await page.waitForTimeout(1000)
    }
  })

  test('should display messages section', async ({ page }) => {
    const content = page.locator('text=/message/i').or(page.locator('text=/conversation/i'))
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should switch between sub-tabs', async ({ page }) => {
    const tabs = ['Fil', 'Messages', 'Amis']
    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`)
      if ((await tab.count()) > 0) {
        await tab.first().click()
        await page.waitForTimeout(500)
      }
    }
  })
})
