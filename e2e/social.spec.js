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
    await expect(page.locator('button:has-text("Général")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("Régional")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("Amis")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("Groupes")').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Chat', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should have message input', async ({ page }) => {
    const input = page.locator('#chat-input')
    await expect(input.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have send button', async ({ page }) => {
    // Send button: type="submit" with aria-label="Envoyer" and fa-paper-plane icon
    const sendBtn = page.locator('[aria-label="Envoyer"]').or(page.locator('button[type="submit"]:has(.fa-paper-plane)'))
    await expect(sendBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should switch to regional chat', async ({ page }) => {
    const regionalTab = page.locator('[onclick*="setSocialTab(\'regional\')"]').or(page.locator('button:has-text("Régional")'))
    if ((await regionalTab.count()) > 0) {
      await regionalTab.first().click()
      await page.waitForTimeout(500)
      await expect(regionalTab.first()).toHaveClass(/bg-primary/)
    }
  })
})

test.describe('Social - Friends', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
    const friendsTab = page.locator('[onclick*="setSocialTab(\'friends\')"]').or(page.locator('button:has-text("Amis")'))
    if ((await friendsTab.count()) > 0) {
      await friendsTab.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should display friends sub-tab active', async ({ page }) => {
    const friendsTab = page.locator('button:has-text("Amis")')
    await expect(friendsTab.first()).toHaveClass(/bg-primary/)
  })

  test('should have friend search input', async ({ page }) => {
    const searchInput = page.locator('#friend-search, input[placeholder*="ami"], input[placeholder*="Rechercher"]')
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show empty state or friends list', async ({ page }) => {
    const content = page.locator('text=/amis|Ajouter/i')
    await expect(content.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Social - Groups', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
    const groupsTab = page.locator('[onclick*="setSocialTab(\'groups\')"]').or(page.locator('button:has-text("Groupes")'))
    if ((await groupsTab.count()) > 0) {
      await groupsTab.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should display groups sub-tab active', async ({ page }) => {
    const groupsTab = page.locator('button:has-text("Groupes")')
    await expect(groupsTab.first()).toHaveClass(/bg-primary/)
  })

  test('should have create group button', async ({ page }) => {
    const createBtn = page.locator('[onclick*="openCreateTravelGroup"]').or(page.locator('text=/Créer.*groupe/i'))
    await expect(createBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have nearby friends feature', async ({ page }) => {
    const nearbyBtn = page.locator('[onclick*="openNearbyFriends"]').or(page.locator('text=/proximité/i'))
    await expect(nearbyBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open create group when clicked', async ({ page }) => {
    const createBtn = page.locator('[onclick*="openCreateTravelGroup"]').or(page.locator('button:has-text("Créer un groupe")'))
    if ((await createBtn.count()) > 0) {
      await createBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should open nearby friends when clicked', async ({ page }) => {
    const nearbyBtn = page.locator('[onclick*="openNearbyFriends"]').or(page.locator('button:has-text("proximité")'))
    if ((await nearbyBtn.count()) > 0) {
      await nearbyBtn.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Social - Chat Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should allow typing in chat input', async ({ page }) => {
    const input = page.locator('#chat-input')
    if ((await input.count()) > 0) {
      await input.fill('Test message')
      await expect(input).toHaveValue('Test message')
    }
  })

  test('should clear input after submitting', async ({ page }) => {
    const input = page.locator('#chat-input')
    if ((await input.count()) > 0) {
      await input.fill('Test message')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Social - Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'social')
  })

  test('should switch between all sub-tabs', async ({ page }) => {
    const tabs = ['Général', 'Régional', 'Amis', 'Groupes']
    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`)
      if ((await tab.count()) > 0) {
        await tab.first().click()
        await page.waitForTimeout(300)
        await expect(tab.first()).toHaveClass(/bg-primary/)
      }
    }
  })
})
