#!/usr/bin/env node
/**
 * Visual Check Script
 * Takes automated screenshots of key app screens at mobile viewport (390x844)
 * Used as part of the pre-push quality checklist (CLAUDE.md Rule #14)
 *
 * Usage: node scripts/visual-check.mjs [--serve]
 *   --serve: Start a dev server automatically (otherwise expects localhost:5173)
 *
 * Output: Screenshots saved to audit-screenshots/visual-check-*.png
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SCREENSHOT_DIR = join(ROOT, 'audit-screenshots')
const VIEWPORT = { width: 390, height: 844 }
const BASE_URL = 'http://localhost:5173'

// Ensure screenshot directory exists
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true })

// Screens to capture
const SCREENS = [
  { name: 'home-map', actions: [] },
  { name: 'voyage', actions: [{ click: '[data-tab="voyage"]' }] },
  { name: 'social', actions: [{ click: '[data-tab="social"]' }] },
  { name: 'profile', actions: [{ click: '[data-tab="profile"]' }] },
  { name: 'profile-settings', actions: [
    { click: '[data-tab="profile"]' },
    { click: '[data-subtab="settings"]' },
  ] },
]

async function run() {
  let chromium
  try {
    const pw = await import('playwright')
    chromium = pw.chromium
  } catch {
    console.error('Playwright not installed. Run: npm install -D playwright')
    process.exit(1)
  }

  // Check if server is running
  let serverProcess = null
  const shouldServe = process.argv.includes('--serve')
  if (shouldServe) {
    console.log('Starting dev server...')
    serverProcess = spawn('npx', ['vite', '--port', '5173'], {
      cwd: ROOT,
      stdio: 'ignore',
      detached: true,
    })
    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 5000))
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  })

  // Set localStorage to skip onboarding
  await context.addInitScript(() => {
    localStorage.setItem('spothitch_onboarding_complete', 'true')
    localStorage.setItem('spothitch_cookie_consent', JSON.stringify({ essential: true, analytics: true }))
    localStorage.setItem('spothitch_v4_state', JSON.stringify({
      showLanding: false,
      theme: 'dark',
      lang: 'fr',
      activeTab: 'home',
    }))
  })

  const page = await context.newPage()
  let passed = 0
  let failed = 0

  try {
    console.log(`Navigating to ${BASE_URL}...`)
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000) // Let app render

    for (const screen of SCREENS) {
      try {
        for (const action of screen.actions) {
          if (action.click) {
            const el = await page.$(action.click)
            if (el) {
              await el.click()
              await page.waitForTimeout(800)
            }
          }
        }

        const path = join(SCREENSHOT_DIR, `visual-check-${screen.name}.png`)
        await page.screenshot({ path, fullPage: false })
        console.log(`  [OK] ${screen.name} -> ${path}`)
        passed++
      } catch (err) {
        console.error(`  [FAIL] ${screen.name}: ${err.message}`)
        failed++
      }
    }
  } catch (err) {
    console.error(`Failed to load app: ${err.message}`)
    failed++
  }

  await browser.close()
  if (serverProcess) {
    process.kill(-serverProcess.pid)
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
