/**
 * Monkey Testing with Gremlins.js
 * Randomly clicks, types, scrolls in each tab to catch unhandled errors
 *
 * Run: npx playwright test e2e/monkeyTest.spec.js --project=chromium
 */

import { test, expect } from '@playwright/test'

const GREMLIN_DURATION = 5000 // 5 seconds per tab (reduced for CI speed)
const GREMLIN_COUNT = 200

// Errors to ignore (expected in dev/demo mode)
const IGNORED_PATTERNS = [
  'Firebase',
  'firebase',
  'Sentry',
  'sentry',
  'ServiceWorker',
  'sw.js',
  'ResizeObserver',
  'Script error',
  'Non-Error promise rejection',
  'Failed to fetch',
  'NetworkError',
  'Load failed',
  'ChunkLoadError',
  'net::ERR_',
  'AbortError',
  'TimeoutError',
  'Navigation timeout',
  'Execution context was destroyed',
  'navigation',
]

function isCriticalError(msg) {
  return !IGNORED_PATTERNS.some(pattern => msg.includes(pattern))
}

// Inject gremlins.js into page and unleash
async function unleashGremlins(page) {
  await page.evaluate(({ count, duration }) => {
    return new Promise((resolve) => {
      // Minimal gremlins implementation (in case CDN fails)
      // We create random clickers, typers, and scrollers
      const errors = []
      const startTime = Date.now()

      function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
      }

      function randomClick() {
        const x = randomInt(0, window.innerWidth)
        const y = randomInt(0, window.innerHeight)
        const el = document.elementFromPoint(x, y)
        if (el) {
          try {
            el.click()
          } catch (e) {
            errors.push(e.message)
          }
        }
      }

      function randomType() {
        const inputs = document.querySelectorAll('input, textarea, select')
        if (inputs.length === 0) return
        const input = inputs[randomInt(0, inputs.length - 1)]
        try {
          input.focus()
          if (input.tagName === 'SELECT') {
            const options = input.querySelectorAll('option')
            if (options.length > 0) {
              input.selectedIndex = randomInt(0, options.length - 1)
              input.dispatchEvent(new Event('change', { bubbles: true }))
            }
          } else {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 '
            const text = Array.from({ length: randomInt(1, 10) }, () => chars[randomInt(0, chars.length - 1)]).join('')
            input.value = text
            input.dispatchEvent(new Event('input', { bubbles: true }))
          }
        } catch (e) {
          errors.push(e.message)
        }
      }

      function randomScroll() {
        try {
          window.scrollTo(randomInt(0, 1000), randomInt(0, 5000))
          const scrollables = document.querySelectorAll('[class*="overflow"]')
          if (scrollables.length > 0) {
            const el = scrollables[randomInt(0, scrollables.length - 1)]
            el.scrollTop = randomInt(0, el.scrollHeight)
          }
        } catch (e) {
          errors.push(e.message)
        }
      }

      let actionsPerformed = 0
      const interval = setInterval(() => {
        if (Date.now() - startTime > duration || actionsPerformed >= count) {
          clearInterval(interval)
          resolve(errors)
          return
        }

        const action = randomInt(0, 2)
        if (action === 0) randomClick()
        else if (action === 1) randomType()
        else randomScroll()

        actionsPerformed++
      }, Math.max(50, Math.floor(duration / count)))
    })
  }, { count: GREMLIN_COUNT, duration: GREMLIN_DURATION })
}

// Navigate to a specific tab
async function navigateToTab(page, tabName) {
  // Click the navigation button for the tab
  const tabSelectors = {
    map: '[data-tab="map"], button:has-text("Carte")',
    travel: '[data-tab="travel"], button:has-text("Voyage")',
    challenges: '[data-tab="challenges"], button:has-text("Défis")',
    social: '[data-tab="social"], button:has-text("Social")',
    profile: '[data-tab="profile"], button:has-text("Profil")',
  }

  const selector = tabSelectors[tabName]
  if (selector) {
    try {
      await page.click(selector, { timeout: 5000 })
      await page.waitForTimeout(500) // Let the view render
    } catch {
      // Tab might use onclick="changeTab('...')"
      await page.evaluate((tab) => {
        if (window.changeTab) window.changeTab(tab)
      }, tabName)
      await page.waitForTimeout(500)
    }
  }
}

// Dismiss welcome/tutorial if shown
async function dismissOnboarding(page) {
  try {
    // Skip welcome
    const skipWelcome = page.locator('text=Passer')
    if (await skipWelcome.isVisible({ timeout: 2000 })) {
      await skipWelcome.click()
      await page.waitForTimeout(300)
    }
  } catch {
    // No welcome screen
  }

  try {
    // Skip tutorial
    const skipTutorial = page.locator('text=Passer')
    if (await skipTutorial.isVisible({ timeout: 1000 })) {
      await skipTutorial.click()
      await page.waitForTimeout(300)
    }
  } catch {
    // No tutorial
  }

  try {
    // Accept cookies
    const acceptCookies = page.locator('text=Accepter')
    if (await acceptCookies.isVisible({ timeout: 1000 })) {
      await acceptCookies.click()
      await page.waitForTimeout(300)
    }
  } catch {
    // No cookie banner
  }
}

const tabs = ['map', 'travel', 'challenges', 'social', 'profile']

for (const tab of tabs) {
  test(`${tab} tab survives monkey testing (${GREMLIN_DURATION / 1000}s)`, async ({ page }) => {
    const criticalErrors = []

    // Capture page errors
    page.on('pageerror', (error) => {
      if (isCriticalError(error.message)) {
        criticalErrors.push(error.message)
      }
    })

    // Navigate to app
    await page.goto('/')
    await page.waitForTimeout(1000)

    // Dismiss onboarding
    await dismissOnboarding(page)

    // Navigate to target tab
    await navigateToTab(page, tab)
    await page.waitForTimeout(500)

    // Unleash the gremlins (may cause navigation which destroys context)
    try {
      await unleashGremlins(page)
    } catch (e) {
      // Navigation during monkey testing is expected (gremlins click links/buttons)
      // This is NOT an app error — just context destruction from page navigation
      if (!e.message.includes('Execution context was destroyed') &&
          !e.message.includes('navigation')) {
        throw e
      }
    }

    // Wait for any async errors
    await page.waitForTimeout(2000)

    // Assert no critical JS errors
    expect(
      criticalErrors,
      `Critical JS errors on ${tab} tab:\n${criticalErrors.join('\n')}`
    ).toEqual([])
  })
}
