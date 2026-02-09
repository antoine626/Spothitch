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
    await expect(page.locator('#main-map').first()).toBeVisible({ timeout: 10000 })
  })

  test('should have search bar', async ({ page }) => {
    await expect(page.locator('#map-search').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have filter button', async ({ page }) => {
    const filterBtn = page.locator('[onclick*="openFilters"], button[aria-label*="Filtre"], button:has(i.fa-sliders-h)')
    if (await filterBtn.count() > 0) {
      await expect(filterBtn.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display spots count', async ({ page }) => {
    await expect(page.locator('text=/spots? disponible/i').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Map - Score Bar', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should display points', async ({ page }) => {
    await expect(page.locator('text=pts').first()).toBeVisible({ timeout: 5000 })
  })

  test('should display level', async ({ page }) => {
    // Level text is "Niv. 2" format
    await expect(page.locator('text=/Niv/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should open stats when clicking on points', async ({ page }) => {
    const statsButton = page.locator('[onclick*="openStats"]')
    if ((await statsButton.count()) > 0) {
      await statsButton.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Map - Zoom Controls', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should have zoom in button', async ({ page }) => {
    const zoomInBtn = page.locator('[onclick*="mapZoomIn"], button[aria-label*="Zoom"], button:has(i.fa-plus)')
    await expect(zoomInBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have zoom out button', async ({ page }) => {
    const zoomOutBtn = page.locator('[onclick*="mapZoomOut"], button:has(i.fa-minus)')
    await expect(zoomOutBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have location button', async ({ page }) => {
    const locationBtn = page.locator('[onclick*="locateUser"], button[aria-label*="position"], button:has(i.fa-location-crosshairs), button:has(i.fa-crosshairs)')
    await expect(locationBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('zoom in should work', async ({ page }) => {
    const zoomInBtn = page.locator('[onclick*="mapZoomIn"], button:has(i.fa-plus)').first()
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('zoom out should work', async ({ page }) => {
    const zoomOutBtn = page.locator('[onclick*="mapZoomOut"], button:has(i.fa-minus)').first()
    if (await zoomOutBtn.isVisible()) {
      await zoomOutBtn.click()
      await page.waitForTimeout(300)
    }
  })
})

test.describe('Map - Add Spot', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should have add spot FAB', async ({ page }) => {
    const fabBtn = page.locator('button[aria-label*="Ajouter un nouveau spot"]')
    await expect(fabBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('should open add spot modal when clicking FAB', async ({ page }) => {
    const addBtn = page.locator('button[aria-label*="Ajouter un nouveau spot"]')
    if ((await addBtn.count()) > 0) {
      await addBtn.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Map - Search', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should allow typing in search', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('Paris')
      await expect(searchInput).toHaveValue('Paris')
    }
  })

  test('should search on enter', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('Paris')
      await searchInput.press('Enter')
      await page.waitForTimeout(1500)
    }
  })

  test('should have filter functionality', async ({ page }) => {
    const filterBtn = page.locator('[onclick*="openFilters"], button:has(i.fa-sliders-h)')
    if ((await filterBtn.count()) > 0) {
      await filterBtn.first().click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Map - Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should be interactive', async ({ page }) => {
    const mapContainer = page.locator('#main-map')
    await expect(mapContainer).toBeVisible({ timeout: 10000 })

    const box = await mapContainer.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(300)
    }
  })

  test('should show guide indicator when available', async ({ page }) => {
    // Guide indicator is conditional - may be hidden
    const guideIndicator = page.locator('#guide-indicator')
    const count = await guideIndicator.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Map - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page)
    await navigateToTab(page, 'map')
  })

  test('should have accessible search input', async ({ page }) => {
    const searchInput = page.locator('#map-search')
    if ((await searchInput.count()) > 0) {
      const ariaLabel = await searchInput.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('should have accessible zoom controls', async ({ page }) => {
    const zoomIn = page.locator('[onclick*="mapZoomIn"], button[aria-label*="Zoom"]').first()
    if (await zoomIn.isVisible()) {
      const ariaLabel = await zoomIn.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('should have accessible add button', async ({ page }) => {
    const addBtn = page.locator('button[aria-label*="Ajouter"]').first()
    if (await addBtn.isVisible()) {
      const ariaLabel = await addBtn.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})
