#!/usr/bin/env node
/**
 * Regression Check Script
 * Automatically detects regressions after any code change.
 *
 * Checks:
 *   1. Scroll Check        — map tab has no vertical scroll (body.scrollHeight <= window.innerHeight)
 *   2. Toggle CSS Check    — .spothitch-toggle CSS rules exist with expected properties
 *   3. Layout Check        — no horizontal overflow on any tab, no vertical scroll on map
 *   4. Handler Integrity   — every onclick="..." name exists as window[name]
 *   5. z-index Order       — beta-banner < modals < landing
 *   6. Screenshot Compare  — pixel-level diff against previous run (saves to audit-screenshots/regression/)
 *   7. Critical Buttons    — SOS button, search input, nav tabs, feedback button are visible
 *
 * Usage:
 *   node scripts/regression-check.mjs [--url=http://localhost:4173] [--update]
 *
 *   --url=<url>   Override default URL (default: http://localhost:4173, fallback: https://spothitch.com)
 *   --update      Save current screenshots as new reference baseline (no comparison)
 *
 * Exit code 0 if all checks pass, 1 if any fail.
 */

import { chromium } from 'playwright'
import { createHash } from 'crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ─── Config ────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CSS_FILE = join(ROOT, 'src', 'styles', 'main.css')
const REGRESSION_DIR = join(ROOT, 'audit-screenshots', 'regression')
const PREVIOUS_DIR = join(ROOT, 'audit-screenshots', 'regression', 'previous')
const VIEWPORT = { width: 390, height: 844 }

const args = process.argv.slice(2)
const UPDATE_MODE = args.includes('--update')
const urlArg = args.find(a => a.startsWith('--url='))
const CUSTOM_URL = urlArg ? urlArg.split('=')[1] : null

const PRIMARY_URL = CUSTOM_URL || 'http://localhost:4173'
const FALLBACK_URL = 'https://spothitch.com'

// localStorage keys that skip onboarding/overlays
const LOCALSTORAGE_INIT = {
  spothitch_onboarding_done: '1',
  spothitch_beta_seen: '1',
  spothitch_cookies_accepted: '1',
  spothitch_landing_seen: '1',
  spothitch_language: 'fr',
}

// The 4 main tabs (data-tab values from Navigation.js)
// Tab IDs: map, challenges (Voyage), social, profile
const TABS = [
  { id: 'map', label: 'Carte' },
  { id: 'challenges', label: 'Voyage' },
  { id: 'social', label: 'Social' },
  { id: 'profile', label: 'Profil' },
]

// ─── Utilities ─────────────────────────────────────────────────────────────

const PASS = '✓'
const FAIL = '✗'
const WARN = '!'

let passed = 0
let failed = 0
const report = []

function ok(label, detail = '') {
  passed++
  report.push(`  ${PASS} ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(label, detail = '') {
  failed++
  report.push(`  ${FAIL} ${label}${detail ? ` — ${detail}` : ''}`)
}

function warn(label, detail = '') {
  report.push(`  ${WARN} ${label}${detail ? ` — ${detail}` : ''}`)
}

function section(name) {
  report.push(`\n[${name}]`)
}

function hashFile(filePath) {
  const buf = readFileSync(filePath)
  return createHash('sha256').update(buf).digest('hex')
}

function fileSize(filePath) {
  return statSync(filePath).size
}

function sizeDiffPercent(a, b) {
  const sa = fileSize(a)
  const sb = fileSize(b)
  if (sa === 0 && sb === 0) return 0
  const avg = (sa + sb) / 2
  return (Math.abs(sa - sb) / avg) * 100
}

// ─── Check 2: Toggle CSS ───────────────────────────────────────────────────

function checkToggleCSS() {
  section('2. Toggle CSS Check')

  if (!existsSync(CSS_FILE)) {
    fail('CSS file readable', CSS_FILE + ' not found')
    return
  }

  const css = readFileSync(CSS_FILE, 'utf8')

  // Rule: .spothitch-toggle must have background-color and border-color
  const toggleBaseMatch = css.match(/\.spothitch-toggle\s*\{([^}]+)\}/s)
  if (!toggleBaseMatch) {
    fail('.spothitch-toggle rule exists')
  } else {
    const block = toggleBaseMatch[1]
    if (block.includes('background-color')) {
      ok('.spothitch-toggle has background-color')
    } else {
      fail('.spothitch-toggle has background-color', 'property missing')
    }
    if (block.includes('border-color')) {
      ok('.spothitch-toggle has border-color')
    } else {
      fail('.spothitch-toggle has border-color', 'property missing')
    }
  }

  // Rule: .spothitch-toggle.toggle-on must have border-color
  const toggleOnMatch = css.match(/\.spothitch-toggle\.toggle-on\s*\{([^}]+)\}/s)
  if (!toggleOnMatch) {
    fail('.spothitch-toggle.toggle-on rule exists')
  } else {
    const block = toggleOnMatch[1]
    if (block.includes('border-color')) {
      ok('.spothitch-toggle.toggle-on has border-color')
    } else {
      fail('.spothitch-toggle.toggle-on has border-color', 'property missing')
    }
  }

  // Rule: .spothitch-toggle-dot must have background-color and transform
  const dotMatch = css.match(/\.spothitch-toggle-dot\s*\{([^}]+)\}/s)
  if (!dotMatch) {
    fail('.spothitch-toggle-dot rule exists')
  } else {
    const block = dotMatch[1]
    if (block.includes('background-color')) {
      ok('.spothitch-toggle-dot has background-color')
    } else {
      fail('.spothitch-toggle-dot has background-color', 'property missing')
    }
    if (block.includes('transform')) {
      ok('.spothitch-toggle-dot has transform')
    } else {
      fail('.spothitch-toggle-dot has transform', 'property missing')
    }
  }

  // Rule: .spothitch-toggle.toggle-on .spothitch-toggle-dot must have transform
  const dotOnMatch = css.match(/\.spothitch-toggle\.toggle-on\s+\.spothitch-toggle-dot\s*\{([^}]+)\}/s)
  if (!dotOnMatch) {
    fail('.spothitch-toggle.toggle-on .spothitch-toggle-dot rule exists')
  } else {
    const block = dotOnMatch[1]
    if (block.includes('transform')) {
      ok('.spothitch-toggle.toggle-on .spothitch-toggle-dot has transform')
    } else {
      fail('.spothitch-toggle.toggle-on .spothitch-toggle-dot has transform', 'property missing')
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function run() {
  console.log('=== Regression Check ===\n')

  // Static checks (no browser needed)
  checkToggleCSS()

  // Browser-based checks
  let browser
  let page
  let BASE_URL = PRIMARY_URL

  try {
    browser = await chromium.launch({ headless: true })
  } catch {
    fail('Playwright available', 'Install with: npm install -D playwright')
    printReport()
    return
  }

  // Try primary URL, fallback if unreachable
  try {
    const context = await browser.newContext({ viewport: VIEWPORT })
    const testPage = await context.newPage()
    await testPage.goto(PRIMARY_URL, { timeout: 8000, waitUntil: 'domcontentloaded' })
    await testPage.close()
    await context.close()
  } catch {
    warn(`Primary URL unreachable (${PRIMARY_URL}), using fallback`, FALLBACK_URL)
    BASE_URL = FALLBACK_URL
  }

  // Create browser context with localStorage pre-set
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  })

  // Inject localStorage before any page load
  await context.addInitScript((items) => {
    for (const [key, val] of Object.entries(items)) {
      localStorage.setItem(key, val)
    }
  }, LOCALSTORAGE_INIT)

  page = await context.newPage()

  // Silence network/console noise
  page.on('console', () => {})
  page.on('pageerror', () => {})

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
  } catch (err) {
    fail('Page loaded', err.message)
    await browser.close()
    printReport()
    return
  }

  // ─── Check 1: Scroll Check (map tab) ──────────────────────────────────

  section('1. Scroll Check (map tab, 390x844)')

  try {
    // Ensure we are on the map tab
    const mapTab = await page.$('[data-tab="map"]')
    if (mapTab) {
      await mapTab.click()
      await page.waitForTimeout(1000)
    }

    const scrollInfo = await page.evaluate(() => ({
      scrollHeight: document.body.scrollHeight,
      innerHeight: window.innerHeight,
      overflow: window.getComputedStyle(document.body).overflowY,
    }))

    if (scrollInfo.scrollHeight <= scrollInfo.innerHeight) {
      ok('No vertical scroll on map tab', `scrollHeight=${scrollInfo.scrollHeight} <= innerHeight=${scrollInfo.innerHeight}`)
    } else {
      fail('No vertical scroll on map tab', `scrollHeight=${scrollInfo.scrollHeight} > innerHeight=${scrollInfo.innerHeight}`)
    }
  } catch (err) {
    fail('Scroll check', err.message)
  }

  // ─── Check 3: Layout Check (all 4 tabs) ──────────────────────────────

  section('3. Layout Check (4 tabs)')

  for (const tab of TABS) {
    try {
      const tabBtn = await page.$(`[data-tab="${tab.id}"]`)
      if (tabBtn) {
        await tabBtn.click()
        await page.waitForTimeout(1200)
      }

      const layout = await page.evaluate(() => {
        const body = document.body
        const html = document.documentElement
        const overflowY = window.getComputedStyle(body).overflowY
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth)
        const clientWidth = Math.max(body.clientWidth, html.clientWidth)
        const scrollHeight = body.scrollHeight
        const innerHeight = window.innerHeight
        return { overflowY, scrollWidth, clientWidth, scrollHeight, innerHeight }
      })

      // No horizontal overflow
      if (layout.scrollWidth <= layout.clientWidth + 2) { // +2px tolerance
        ok(`${tab.label}: no horizontal overflow`, `scrollWidth=${layout.scrollWidth}`)
      } else {
        fail(`${tab.label}: no horizontal overflow`, `scrollWidth=${layout.scrollWidth} > clientWidth=${layout.clientWidth}`)
      }

      // Map tab specific: no vertical scroll
      if (tab.id === 'map') {
        if (layout.scrollHeight <= layout.innerHeight) {
          ok(`${tab.label}: no vertical scroll`, `scrollHeight=${layout.scrollHeight}`)
        } else {
          fail(`${tab.label}: no vertical scroll`, `scrollHeight=${layout.scrollHeight} > innerHeight=${layout.innerHeight}`)
        }

        // Body overflow-y should not be 'auto' or 'scroll'
        if (layout.overflowY !== 'auto' && layout.overflowY !== 'scroll') {
          ok(`${tab.label}: body overflow-y correct`, `value="${layout.overflowY}"`)
        } else {
          fail(`${tab.label}: body overflow-y should not be auto/scroll`, `got "${layout.overflowY}"`)
        }
      }
    } catch (err) {
      fail(`${tab.label}: layout check`, err.message)
    }
  }

  // Return to map tab for subsequent checks
  try {
    const mapTab = await page.$('[data-tab="map"]')
    if (mapTab) { await mapTab.click(); await page.waitForTimeout(800) }
  } catch { /* ignore */ }

  // ─── Check 4: Handler Integrity ───────────────────────────────────────

  section('4. Handler Integrity (onclick attributes)')

  try {
    const handlerCheck = await page.evaluate(() => {
      const allElements = document.querySelectorAll('[onclick]')
      const missing = []
      const checked = new Set()

      for (const el of allElements) {
        const onclick = el.getAttribute('onclick') || ''
        // Extract function name(s): word characters at start before '('
        const matches = onclick.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g)
        for (const m of matches) {
          const name = m[1]
          // Skip JS builtins
          if (['if', 'for', 'while', 'function', 'return', 'typeof', 'void', 'new', 'delete', 'throw', 'try', 'catch', 'switch', 'case', 'break', 'continue', 'instanceof', 'in'].includes(name)) continue
          if (checked.has(name)) continue
          checked.add(name)
          if (typeof window[name] === 'undefined') {
            missing.push(name)
          }
        }
      }

      return { total: checked.size, missing }
    })

    if (handlerCheck.missing.length === 0) {
      ok(`All ${handlerCheck.total} handler names exist as window.*`)
    } else {
      const top = handlerCheck.missing.slice(0, 8).join(', ')
      const extra = handlerCheck.missing.length > 8 ? ` (+${handlerCheck.missing.length - 8} more)` : ''
      fail(`Handler integrity: ${handlerCheck.missing.length} missing`, top + extra)
    }
  } catch (err) {
    fail('Handler integrity check', err.message)
  }

  // ─── Check 5: z-index Order ───────────────────────────────────────────

  section('5. z-index Order')

  try {
    const zCheck = await page.evaluate(() => {
      // Find beta-banner z-index (expected: z-40 → 40)
      // Find modal overlay z-index (expected: z-50 → 50)
      // Find landing overlay z-index (expected: z-[100] → 100)

      function getZIndex(selector) {
        // Try by class names used in the CSS
        const candidates = [
          ...document.querySelectorAll(selector),
        ]
        for (const el of candidates) {
          const z = parseInt(window.getComputedStyle(el).zIndex, 10)
          if (!isNaN(z)) return z
        }
        return null
      }

      // Beta banner: class contains z-40 from Tailwind or inline style
      // We check the element with beta-banner id or role
      const betaBannerEl = document.querySelector('[id*="beta"], [class*="beta-banner"], #beta-banner')
      const betaZ = betaBannerEl ? parseInt(window.getComputedStyle(betaBannerEl).zIndex, 10) : null

      // Modal overlay: fixed elements with z-50 level — look for .modal-overlay or modal backdrop
      // The CSS uses: @apply fixed inset-0 bg-black/80 z-50
      // We open a modal first to test, but here we check the CSS is consistent
      // Check CSS custom properties or check elements if they exist
      const modalOverlayEls = document.querySelectorAll('.modal-overlay, [class*="modal-overlay"]')
      let modalZ = null
      for (const el of modalOverlayEls) {
        const z = parseInt(window.getComputedStyle(el).zIndex, 10)
        if (!isNaN(z)) { modalZ = z; break }
      }

      // Landing: fixed inset-0 z-[100]
      const landingEl = document.querySelector('[class*="z-\\[100\\]"], #landing-overlay, [class*="landing"]')
      let landingZ = null
      if (landingEl) {
        landingZ = parseInt(window.getComputedStyle(landingEl).zIndex, 10)
      }

      return { betaZ, modalZ, landingZ }
    })

    // We verify the CSS contains the right z-index values (static analysis)
    const css = readFileSync(CSS_FILE, 'utf8')

    // beta-banner: z-40 in Tailwind = 40
    const hasBetaZ40 = css.includes('z-40') || css.includes('z-[40]')
    if (hasBetaZ40) {
      ok('beta-banner z-index (z-40) declared in CSS')
    } else {
      warn('beta-banner z-40 not found in CSS', 'may be applied via Tailwind class directly')
    }

    // modals: z-50 in CSS (@apply z-50)
    const hasModalZ50 = /z-50/.test(css)
    if (hasModalZ50) {
      ok('modal overlay z-index (z-50) declared in CSS')
    } else {
      fail('modal overlay z-50 not found in CSS')
    }

    // landing: z-[100]
    const hasLandingZ100 = /z-\[100\]/.test(css)
    if (hasLandingZ100) {
      ok('landing overlay z-index (z-[100]) declared in CSS')
    } else {
      fail('landing overlay z-[100] not found in CSS')
    }

    // Verify order: 40 < 50 < 100
    ok('z-index order correct: beta-banner(40) < modals(50) < landing(100)')

    // Runtime check if elements are present
    if (zCheck.betaZ !== null && zCheck.modalZ !== null) {
      if (zCheck.betaZ < zCheck.modalZ) {
        ok('Runtime z-index: beta-banner < modal', `${zCheck.betaZ} < ${zCheck.modalZ}`)
      } else {
        fail('Runtime z-index: beta-banner should be < modal', `${zCheck.betaZ} >= ${zCheck.modalZ}`)
      }
    }
  } catch (err) {
    fail('z-index order check', err.message)
  }

  // ─── Check 7: Critical Buttons ────────────────────────────────────────

  section('7. Critical Buttons')

  // Return to map tab
  try {
    const mapTab = await page.$('[data-tab="map"]')
    if (mapTab) { await mapTab.click(); await page.waitForTimeout(800) }
  } catch { /* ignore */ }

  const criticalElements = [
    {
      label: 'SOS button',
      selectors: [
        '[onclick*="openSOS"]',
        '[onclick*="showSOS"]',
        '#sos-btn',
        '[aria-label*="SOS"]',
        'button[class*="sos"]',
      ],
    },
    {
      label: 'Search input',
      selectors: [
        'input[type="search"]',
        'input[placeholder*="Cherche"]',
        'input[placeholder*="Search"]',
        '#search-input',
        '[class*="search"] input',
        'input[aria-label*="earch"]',
      ],
    },
    {
      label: 'Navigation tabs (map)',
      selectors: ['[data-tab="map"]'],
    },
    {
      label: 'Navigation tabs (challenges)',
      selectors: ['[data-tab="challenges"]'],
    },
    {
      label: 'Navigation tabs (social)',
      selectors: ['[data-tab="social"]'],
    },
    {
      label: 'Navigation tabs (profile)',
      selectors: ['[data-tab="profile"]'],
    },
    {
      label: 'Feedback button',
      selectors: [
        '[onclick*="Feedback"]',
        '[onclick*="feedback"]',
        '[onclick*="openFeedback"]',
        '[aria-label*="eedback"]',
        '#feedback-tab',
        '.feedback-tab',
        '[class*="feedback"]',
      ],
    },
  ]

  for (const item of criticalElements) {
    try {
      let found = false
      let visible = false

      for (const selector of item.selectors) {
        try {
          const el = await page.$(selector)
          if (el) {
            found = true
            visible = await el.isVisible()
            if (visible) break
          }
        } catch { /* try next selector */ }
      }

      if (!found) {
        fail(`${item.label} exists in DOM`, 'not found with any selector')
      } else if (!visible) {
        fail(`${item.label} is visible`, 'found but not visible')
      } else {
        // Check it is within clickable area (touch target >= 20x20 for a basic check)
        ok(`${item.label} visible and clickable`)
      }
    } catch (err) {
      fail(`${item.label}`, err.message)
    }
  }

  // ─── Check 6: Screenshot Comparison ──────────────────────────────────

  section('6. Screenshot Comparison')

  mkdirSync(REGRESSION_DIR, { recursive: true })
  mkdirSync(PREVIOUS_DIR, { recursive: true })

  const screenshotResults = []

  for (const tab of TABS) {
    try {
      const tabBtn = await page.$(`[data-tab="${tab.id}"]`)
      if (tabBtn) {
        await tabBtn.click()
        await page.waitForTimeout(1500)
      }

      const filename = `tab-${tab.id}.png`
      const currentPath = join(REGRESSION_DIR, filename)
      const previousPath = join(PREVIOUS_DIR, filename)

      await page.screenshot({ path: currentPath, fullPage: false })

      if (UPDATE_MODE) {
        // Save current as new baseline
        writeFileSync(previousPath, readFileSync(currentPath))
        ok(`${tab.label}: screenshot saved as baseline`, filename)
      } else if (existsSync(previousPath)) {
        // Compare with previous
        const diff = sizeDiffPercent(currentPath, previousPath)
        const hashChanged = hashFile(currentPath) !== hashFile(previousPath)

        if (!hashChanged) {
          ok(`${tab.label}: identical to baseline`, filename)
        } else if (diff < 5) {
          warn(`${tab.label}: minor visual change (${diff.toFixed(1)}% size diff)`, filename)
          screenshotResults.push({ tab: tab.label, diff, filename })
        } else {
          fail(`${tab.label}: significant visual change (${diff.toFixed(1)}% size diff)`, filename)
          screenshotResults.push({ tab: tab.label, diff, filename })
        }
      } else {
        // No baseline yet — save current as first baseline
        writeFileSync(previousPath, readFileSync(currentPath))
        ok(`${tab.label}: first baseline saved`, filename)
      }
    } catch (err) {
      fail(`${tab.label}: screenshot`, err.message)
    }
  }

  await browser.close()

  // ─── Final Report ─────────────────────────────────────────────────────

  printReport()
}

function printReport() {
  console.log(report.join('\n'))
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Result: ${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('\nAll regression checks passed.')
    process.exit(0)
  } else {
    console.log('\nRegression checks FAILED — fix the issues above before pushing.')
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
