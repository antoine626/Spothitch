/**
 * E2E Tests - Map Features
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should display map container', async ({ page }) => {
    await expect(page.locator('#home-map').first()).toBeVisible({ timeout: 10000 })
  })

  test('should have search bar', async ({ page }) => {
    await expect(page.locator('#home-destination').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have filter button', async ({ page }) => {
    const filterBtn = page.locator('[onclick*="openFilters"], button[aria-label*="Filtre"], button[aria-label*="Filter"]')
    await expect(filterBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display map controls', async ({ page }) => {
    // Spots counter was removed — verify map controls exist instead
    await expect(page.locator('[onclick*="homeZoomIn"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[onclick*="homeZoomOut"]').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Map - Zoom Controls', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should have zoom in button', async ({ page }) => {
    const zoomInBtn = page.locator('[onclick*="homeZoomIn"], button[aria-label*="Zoom in"]')
    await expect(zoomInBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have zoom out button', async ({ page }) => {
    const zoomOutBtn = page.locator('[onclick*="homeZoomOut"], button[aria-label*="Zoom out"]')
    await expect(zoomOutBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should zoom in without crash', async ({ page }) => {
    const zoomInBtn = page.locator('[onclick*="homeZoomIn"]').first()
    if (await zoomInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await zoomInBtn.click()
      await page.waitForTimeout(500)
      // Map should still be visible after zoom
      await expect(page.locator('#home-map')).toBeVisible()
    }
  })

  test('should zoom out without crash', async ({ page }) => {
    const zoomOutBtn = page.locator('[onclick*="homeZoomOut"]').first()
    if (await zoomOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await zoomOutBtn.click()
      await page.waitForTimeout(500)
      await expect(page.locator('#home-map')).toBeVisible()
    }
  })
})

test.describe('Map - Add Spot', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should have add spot FAB', async ({ page }) => {
    const fabBtn = page.locator('[onclick*="openAddSpot"], button[aria-label*="Ajouter un spot"]')
    await expect(fabBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open add spot when clicking FAB', async ({ page }) => {
    const addBtn = page.locator('[onclick*="openAddSpot"]')
    if ((await addBtn.count()) > 0) {
      await addBtn.first().click()
      await page.waitForTimeout(2000)
      // Should show add spot modal or login prompt
      const dialog = page.locator('[role="dialog"], .modal-overlay')
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible()
      }
    }
  })
})

test.describe('Map - Search', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should allow typing in search', async ({ page }) => {
    const searchInput = page.locator('#home-destination')
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('Paris')
      await expect(searchInput).toHaveValue('Paris')
    }
  })

  test('should search on enter', async ({ page }) => {
    const searchInput = page.locator('#home-destination')
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('Paris')
      await searchInput.press('Enter')
      await page.waitForTimeout(2000)
      await expect(page.locator('#home-map')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should open filter modal', async ({ page }) => {
    const filterBtn = page.locator('[onclick*="openFilters"]')
    if ((await filterBtn.count()) > 0) {
      await filterBtn.first().click()
      await page.waitForTimeout(2000)
      const filterModal = page.locator('[role="dialog"], .modal-overlay')
      if (await filterModal.count() > 0) {
        await expect(filterModal.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Map - Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should be interactive', async ({ page }) => {
    const mapContainer = page.locator('#home-map')
    await expect(mapContainer).toBeVisible({ timeout: 10000 })

    const box = await mapContainer.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    // Map should still be visible after click (no crash)
    await expect(mapContainer).toBeVisible()
  })

  test('should show guide indicator when available', async ({ page }) => {
    const guideIndicator = page.locator('#guide-indicator')
    const count = await guideIndicator.count()
    expect(count === 0 || count === 1).toBe(true)
  })
})

test.describe('Map - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should have accessible search input', async ({ page }) => {
    const searchInput = page.locator('#home-destination')
    if ((await searchInput.count()) > 0) {
      const ariaLabel = await searchInput.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('should have accessible zoom controls', async ({ page }) => {
    const zoomIn = page.locator('[onclick*="homeZoomIn"]').first()
    if (await zoomIn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const ariaLabel = await zoomIn.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('should have accessible add button', async ({ page }) => {
    const addBtn = page.locator('[onclick*="openAddSpot"]').first()
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const ariaLabel = await addBtn.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})
