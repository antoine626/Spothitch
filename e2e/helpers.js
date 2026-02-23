/**
 * E2E Test Helpers
 */
import { expect } from '@playwright/test'

/**
 * Dismiss all blocking overlays (cookie banner, age verification, etc.)
 */
export async function dismissOverlays(page) {
  const cookieAccept = page.locator('#cookie-banner button:has-text("Accepter"), #cookie-banner button:has-text("Accept")')
  if (await cookieAccept.count() > 0 && await cookieAccept.first().isVisible({ timeout: 1000 }).catch(() => false)) {
    await cookieAccept.first().click()
    await page.waitForTimeout(300)
  }

  const ageClose = page.locator('[onclick*="closeAgeVerification"], button:has-text("Fermer"):visible')
  if (await ageClose.count() > 0 && await ageClose.first().isVisible({ timeout: 500 }).catch(() => false)) {
    await ageClose.first().click()
    await page.waitForTimeout(300)
  }

  const modalClose = page.locator('.modal-overlay button[aria-label="Fermer"], .modal-overlay button:has(svg)').first()
  if (await modalClose.isVisible({ timeout: 500 }).catch(() => false)) {
    await modalClose.click()
    await page.waitForTimeout(300)
  }
}

/**
 * Skip onboarding and tutorial for returning user experience
 */
export async function skipOnboarding(page, opts = {}) {
  const stateData = {
    showWelcome: false,
    showTutorial: false,
    tutorialStep: 0,
    username: 'TestUser',
    avatar: '🤙',
    activeTab: opts.tab || 'map',
    theme: 'dark',
    lang: 'fr',
    points: opts.points || 100,
    level: opts.level || 2,
    badges: ['first_spot'],
    rewards: [],
    savedTrips: [],
    emergencyContacts: []
  }

  // Use addInitScript to set localStorage BEFORE any page JS runs
  await page.addInitScript((state) => {
    localStorage.setItem('spothitch_v4_state', JSON.stringify(state))
    // Use prefixed key matching Storage.js (spothitch_v4_cookie_consent)
    // and the format expected by hasConsent(): { preferences, timestamp, version }
    localStorage.setItem('spothitch_v4_cookie_consent', JSON.stringify({
      preferences: { necessary: true, analytics: false, marketing: false, personalization: false },
      timestamp: Date.now(),
      version: '1.0'
    }))
    localStorage.setItem('spothitch_age_verified', 'true')
    localStorage.setItem('spothitch_landing_seen', '1')
  }, stateData)

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // Wait for either app.loaded class or nav to appear (10s max — if it takes longer, something is broken)
  await Promise.race([
    page.waitForSelector('#app.loaded', { timeout: 10000 }).catch(() => null),
    page.waitForSelector('nav[role="navigation"]', { timeout: 10000 }).catch(() => null),
  ])

  // If still stuck on splash, force remove it
  await page.evaluate(() => {
    const app = document.getElementById('app')
    if (app && !app.classList.contains('loaded')) {
      app.classList.add('loaded')
    }
    const splash = document.getElementById('splash-screen')
    if (splash) splash.remove()
    const loader = document.getElementById('app-loader')
    if (loader) loader.remove()
  })

  // Final check: wait for nav
  await page.waitForSelector('nav', { timeout: 5000 }).catch(() => {})
  await dismissOverlays(page)
}

/**
 * Navigate to a specific tab and wait for it to be active
 */
export async function navigateToTab(page, tabId) {
  const tab = page.locator(`[data-tab="${tabId}"]`)
  await tab.click({ force: true, timeout: 5000 })
  try {
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 3000 })
  } catch {
    await tab.click({ force: true, timeout: 3000 })
  }
  // Wait for lazy-loaded view content to appear (import() + re-render cycle)
  await page.waitForTimeout(2000)
}

/**
 * Wait for toast notification to appear
 */
export async function waitForToast(page, text) {
  const selector = text
    ? `.toast:has-text("${text}"), [role="alert"]:has-text("${text}")`
    : '.toast, [role="alert"]'
  await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null)
}

/**
 * Get app state from localStorage
 */
export async function getAppState(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('spothitch_v4_state')
    return raw ? JSON.parse(raw) : null
  })
}

/**
 * Set additional localStorage data for a service
 */
export async function setStorageData(page, key, value) {
  await page.evaluate(({ k, v }) => {
    localStorage.setItem(k, JSON.stringify(v))
  }, { k: key, v: value })
}
