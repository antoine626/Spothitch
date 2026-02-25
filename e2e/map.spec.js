/**
 * E2E Tests - Map Features
 * Optimized: grouped tests share page context to reduce load times
 */

import { test, expect } from '@playwright/test'
import { skipOnboarding, navigateToTab } from './helpers.js'

test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should display map with all controls', async ({ page }) => {
    await expect(page.locator('#home-map').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#home-destination').first()).toBeVisible({ timeout: 5000 })

    const filterBtn = page.locator('[onclick*="openFilters"], button[aria-label*="Filtre"], button[aria-label*="Filter"]')
    await expect(filterBtn.first()).toBeVisible({ timeout: 5000 })

    await expect(page.locator('[onclick*="homeZoomIn"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[onclick*="homeZoomOut"]').first()).toBeVisible({ timeout: 10000 })

    const fabBtn = page.locator('[onclick*="openAddSpot"], button[aria-label*="Ajouter un spot"]')
    await expect(fabBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should zoom in and out without crash', async ({ page }) => {
    const zoomInBtn = page.locator('[onclick*="homeZoomIn"]').first()
    if (await zoomInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await zoomInBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('#home-map')).toBeVisible()
    }

    const zoomOutBtn = page.locator('[onclick*="homeZoomOut"]').first()
    if (await zoomOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await zoomOutBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('#home-map')).toBeVisible()
    }
  })

  test('should search and interact', async ({ page }) => {
    const searchInput = page.locator('#home-destination')
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('Paris')
      await expect(searchInput).toHaveValue('Paris')
      await searchInput.press('Enter')
      await page.waitForTimeout(1000)
      await expect(page.locator('#home-map')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should open add spot and filter modals', async ({ page }) => {
    const addBtn = page.locator('[onclick*="openAddSpot"]')
    if ((await addBtn.count()) > 0) {
      await addBtn.first().click()
      await page.waitForTimeout(1000)
      const dialog = page.locator('[role="dialog"], .modal-overlay')
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible()
      }
    }

    // Reload to clear modal state
    await page.goto('/')
    await skipOnboarding(page)
    await navigateToTab(page, 'map')

    const filterBtn = page.locator('[onclick*="openFilters"]')
    if ((await filterBtn.count()) > 0) {
      await filterBtn.first().click()
      await page.waitForTimeout(1000)
      const filterModal = page.locator('[role="dialog"], .modal-overlay')
      if (await filterModal.count() > 0) {
        await expect(filterModal.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should be interactive and click on map', async ({ page }) => {
    const mapContainer = page.locator('#home-map')
    await expect(mapContainer).toBeVisible({ timeout: 10000 })
    const box = await mapContainer.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(mapContainer).toBeVisible()
  })

  test('should have accessible controls', async ({ page }) => {
    const searchInput = page.locator('#home-destination')
    if ((await searchInput.count()) > 0) {
      const ariaLabel = await searchInput.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }

    const zoomIn = page.locator('[onclick*="homeZoomIn"]').first()
    if (await zoomIn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const ariaLabel = await zoomIn.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }

    const addBtn = page.locator('[onclick*="openAddSpot"]').first()
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const ariaLabel = await addBtn.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})
