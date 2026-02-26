#!/usr/bin/env node
/**
 * Visual Regression Comparison System
 * Takes screenshots of key screens and compares them with stored baselines.
 *
 * Usage:
 *   node scripts/visual-regression.mjs                  # Compare against baselines
 *   node scripts/visual-regression.mjs --update-baselines  # Save current as new baselines
 *
 * Screenshots are taken at 390x844 (iPhone 14) viewport.
 * Baselines stored in visual-baselines/ (hashes in visual-baselines/hashes.json).
 * Diff output stored in visual-regression-output/.
 *
 * Exit code 0: no changes or changes below threshold (5% file-size diff).
 * Exit code 1: major changes detected above threshold.
 *
 * Dependencies: playwright (already installed)
 */

import { createHash } from 'crypto'
import { spawn } from 'child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  rmSync,
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BASELINES_DIR = join(ROOT, 'visual-baselines')
const OUTPUT_DIR = join(ROOT, 'visual-regression-output')
const HASHES_FILE = join(BASELINES_DIR, 'hashes.json')
const VIEWPORT = { width: 390, height: 844 }
const BASE_URL = 'http://localhost:4173'
const SIZE_DIFF_THRESHOLD = 5 // percent — above this, flag as major change

// CLI args
const args = process.argv.slice(2)
const UPDATE_BASELINES = args.includes('--update-baselines')

// Helper: switch to a main tab
const goTab = (tabId) => async (page) => {
  const tab = await page.$(`[data-tab="${tabId}"]`)
  if (tab) { await tab.click(); await page.waitForTimeout(1500) }
}

// Helper: switch to a sub-tab within the current view
const goSubTab = (parentTabId, subTabFn) => async (page) => {
  await goTab(parentTabId)(page)
  await page.evaluate(subTabFn)
  await page.waitForTimeout(1000)
}

// Helper: close modals and open a specific one
const openModal = (openFn) => async (page) => {
  await page.evaluate(() => window.closeAllModals?.())
  await page.waitForTimeout(300)
  await page.evaluate(openFn)
  await page.waitForTimeout(1500)
}

// Screens to capture — ALL possible screens in the app
const SCREENS = [
  // ===== MAIN TABS =====
  { name: 'tab-map', description: 'Carte (onglet principal)', setup: null },
  { name: 'tab-voyage', description: 'Voyage (onglet principal)', setup: goTab('challenges') },
  { name: 'tab-social', description: 'Social (onglet principal)', setup: goTab('social') },
  { name: 'tab-profile', description: 'Profil (onglet principal)', setup: goTab('profile') },

  // ===== SOUS-ONGLETS VOYAGE =====
  { name: 'voyage-voyage', description: 'Voyage > Mon Voyage', setup: goSubTab('challenges', () => window.setVoyageTab?.('voyage')) },
  { name: 'voyage-guides', description: 'Voyage > Guides', setup: goSubTab('challenges', () => window.setVoyageTab?.('guides')) },
  { name: 'voyage-journal', description: 'Voyage > Journal', setup: goSubTab('challenges', () => window.setVoyageTab?.('journal')) },

  // ===== SOUS-ONGLETS SOCIAL =====
  { name: 'social-conversations', description: 'Social > Conversations', setup: goSubTab('social', () => window.setSocialTab?.('conversations')) },
  { name: 'social-friends', description: 'Social > Amis', setup: goSubTab('social', () => window.setSocialTab?.('friends')) },
  { name: 'social-feed', description: 'Social > Feed', setup: goSubTab('social', () => window.setSocialTab?.('feed')) },
  { name: 'social-groups', description: 'Social > Groupes', setup: goSubTab('social', () => window.setSocialTab?.('groups')) },

  // ===== SOUS-ONGLETS PROFIL =====
  { name: 'profile-profil', description: 'Profil > Mon Profil', setup: goSubTab('profile', () => window.setProfileSubTab?.('profil')) },
  { name: 'profile-roadmap', description: 'Profil > Roadmap', setup: goSubTab('profile', () => window.setProfileSubTab?.('roadmap')) },
  { name: 'profile-reglages', description: 'Profil > Réglages', setup: goSubTab('profile', () => window.setProfileSubTab?.('reglages')) },

  // ===== MODALES =====
  { name: 'modal-addspot', description: 'Modal AddSpot', setup: openModal(() => window.openAddSpot?.()) },
  { name: 'modal-sos', description: 'Modal SOS', setup: openModal(() => window.openSOS?.()) },
  { name: 'modal-companion', description: 'Modal Compagnon', setup: openModal(() => window.showCompanionModal?.()) },
  { name: 'modal-auth', description: 'Modal Auth', setup: openModal(() => window.openAuth?.()) },
  { name: 'modal-filters', description: 'Modal Filtres', setup: openModal(() => window.openFilters?.()) },
  { name: 'modal-badges', description: 'Modal Badges', setup: openModal(() => window.openBadges?.()) },
  { name: 'modal-challenges', description: 'Modal Défis', setup: openModal(() => window.openChallenges?.()) },
  { name: 'modal-quiz', description: 'Modal Quiz', setup: openModal(() => window.openQuiz?.()) },
  { name: 'modal-shop', description: 'Modal Boutique', setup: openModal(() => window.openShop?.()) },
  { name: 'modal-stats', description: 'Modal Stats', setup: openModal(() => window.openStats?.()) },
  { name: 'modal-dailyreward', description: 'Modal Récompense', setup: openModal(() => window.openDailyReward?.()) },
  { name: 'modal-titles', description: 'Modal Titres', setup: openModal(() => window.openTitles?.()) },
  { name: 'modal-contact', description: 'Modal Contact', setup: openModal(() => window.openContactForm?.()) },
  { name: 'modal-faq', description: 'Modal FAQ', setup: openModal(() => window.openFAQ?.()) },
  { name: 'modal-accessibility', description: 'Modal Accessibilité', setup: openModal(() => window.openAccessibilityHelp?.()) },
  { name: 'modal-teamchallenges', description: 'Modal Défis Équipe', setup: openModal(() => window.openTeamChallenges?.()) },
  { name: 'modal-identity', description: 'Modal Vérification Identité', setup: openModal(() => window.openIdentityVerification?.()) },
  { name: 'modal-customization', description: 'Modal Personnalisation', setup: openModal(() => window.openProfileCustomization?.()) },
  { name: 'modal-nearbyfriends', description: 'Modal Amis Proches', setup: openModal(() => window.openNearbyFriends?.()) },
  { name: 'modal-triphistory', description: 'Modal Historique Voyages', setup: openModal(() => window.openTripHistory?.()) },
]

/**
 * Compute SHA-256 hash of a file
 */
function hashFile(filePath) {
  const buffer = readFileSync(filePath)
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Get file size in bytes
 */
function fileSize(filePath) {
  return statSync(filePath).size
}

/**
 * Calculate file size difference percentage between two files
 */
function sizeDiffPercent(fileA, fileB) {
  const sizeA = fileSize(fileA)
  const sizeB = fileSize(fileB)
  if (sizeA === 0 && sizeB === 0) return 0
  const avg = (sizeA + sizeB) / 2
  return Math.abs(sizeA - sizeB) / avg * 100
}

/**
 * Start the preview server and wait until it responds
 */
function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
      cwd: ROOT,
      stdio: 'pipe',
      detached: true,
    })

    let started = false
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Preview server failed to start within 30s'))
      }
    }, 30000)

    // Listen for server ready message
    server.stdout.on('data', (data) => {
      const msg = data.toString()
      if (msg.includes('Local:') || msg.includes('4173')) {
        started = true
        clearTimeout(timeout)
        // Give it an extra second to be fully ready
        setTimeout(() => resolve(server), 1000)
      }
    })

    server.stderr.on('data', (data) => {
      const msg = data.toString()
      // Vite sometimes writes to stderr for info messages
      if (msg.includes('Local:') || msg.includes('4173')) {
        started = true
        clearTimeout(timeout)
        setTimeout(() => resolve(server), 1000)
      }
    })

    server.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    // Fallback: just wait 5 seconds if no output detected
    setTimeout(() => {
      if (!started) {
        started = true
        clearTimeout(timeout)
        resolve(server)
      }
    }, 6000)
  })
}

/**
 * Kill a server process and its children
 */
function killServer(server) {
  if (server && server.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM')
    } catch {
      try {
        server.kill('SIGTERM')
      } catch {
        // Already dead
      }
    }
  }
}

async function run() {
  // Import playwright
  let chromium
  try {
    const pw = await import('playwright')
    chromium = pw.chromium
  } catch {
    console.error('ERROR: Playwright not installed. Run: npm install -D playwright')
    process.exit(1)
  }

  // Ensure directories exist
  mkdirSync(BASELINES_DIR, { recursive: true })
  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true, force: true })
  }
  mkdirSync(OUTPUT_DIR, { recursive: true })

  // Check that dist/ exists (need a build first)
  if (!existsSync(join(ROOT, 'dist'))) {
    console.error('ERROR: dist/ not found. Run "npm run build" first.')
    process.exit(1)
  }

  // Start preview server
  console.log('Starting preview server on port 4173...')
  let server
  try {
    server = await startPreviewServer()
  } catch (err) {
    console.error(`ERROR: Could not start preview server: ${err.message}`)
    process.exit(1)
  }

  console.log('Preview server running.\n')

  // Load existing baselines
  let baselineHashes = {}
  if (existsSync(HASHES_FILE)) {
    try {
      baselineHashes = JSON.parse(readFileSync(HASHES_FILE, 'utf-8'))
    } catch {
      baselineHashes = {}
    }
  }

  // Launch browser
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  })

  // Skip onboarding/welcome/landing and set French locale
  await context.addInitScript(() => {
    localStorage.setItem('spothitch_onboarding_complete', 'true')
    localStorage.setItem('spothitch_landing_seen', '1')
    localStorage.setItem(
      'spothitch_cookie_consent',
      JSON.stringify({ essential: true, analytics: true })
    )
    localStorage.setItem(
      'spothitch_v4_state',
      JSON.stringify({
        showLanding: false,
        theme: 'dark',
        lang: 'fr',
        activeTab: 'home',
      })
    )
  })

  const page = await context.newPage()

  const results = []
  let hasFailure = false

  try {
    // Navigate to the app
    console.log(`Navigating to ${BASE_URL}...`)
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000) // Let the app fully render (map tiles, etc.)

    for (const screen of SCREENS) {
      const screenshotPath = join(OUTPUT_DIR, `${screen.name}.png`)
      const baselinePath = join(BASELINES_DIR, `${screen.name}.png`)

      try {
        // Execute screen-specific setup
        if (screen.setup) {
          await screen.setup(page)
        }

        // Take screenshot
        await page.screenshot({ path: screenshotPath, fullPage: false })
        console.log(`  [CAPTURED] ${screen.name} — ${screen.description}`)

        // Compute hash of the new screenshot
        const newHash = hashFile(screenshotPath)
        const newSize = fileSize(screenshotPath)

        if (UPDATE_BASELINES) {
          // Save as new baseline
          const baselineBuffer = readFileSync(screenshotPath)
          writeFileSync(baselinePath, baselineBuffer)
          baselineHashes[screen.name] = {
            hash: newHash,
            size: newSize,
            updatedAt: new Date().toISOString(),
          }
          results.push({
            screen: screen.name,
            description: screen.description,
            status: 'BASELINE_UPDATED',
            hash: newHash,
            size: newSize,
          })
          console.log(`  [BASELINE] ${screen.name} — saved as new baseline`)
        } else {
          // Compare with baseline
          const baseline = baselineHashes[screen.name]

          if (!baseline) {
            results.push({
              screen: screen.name,
              description: screen.description,
              status: 'NO_BASELINE',
              hash: newHash,
              size: newSize,
              message: 'No baseline found. Run with --update-baselines to create one.',
            })
            console.log(
              `  [WARN] ${screen.name} — no baseline found, skipping comparison`
            )
            continue
          }

          if (baseline.hash === newHash) {
            // Identical
            results.push({
              screen: screen.name,
              description: screen.description,
              status: 'UNCHANGED',
              hash: newHash,
              size: newSize,
            })
            console.log(`  [OK] ${screen.name} — unchanged`)
          } else {
            // Changed — compute size difference as a proxy for change magnitude
            const baselineSize = baseline.size || 0
            const avgSize = (baselineSize + newSize) / 2
            const sizeDiff =
              avgSize > 0
                ? (Math.abs(baselineSize - newSize) / avgSize) * 100
                : 100
            const isMajor = sizeDiff > SIZE_DIFF_THRESHOLD

            results.push({
              screen: screen.name,
              description: screen.description,
              status: isMajor ? 'MAJOR_CHANGE' : 'MINOR_CHANGE',
              hash: newHash,
              baselineHash: baseline.hash,
              size: newSize,
              baselineSize: baselineSize,
              sizeDiffPercent: Math.round(sizeDiff * 100) / 100,
            })

            if (isMajor) {
              hasFailure = true
              console.log(
                `  [FAIL] ${screen.name} — MAJOR change detected (${sizeDiff.toFixed(1)}% size diff)`
              )
            } else {
              console.log(
                `  [WARN] ${screen.name} — minor change detected (${sizeDiff.toFixed(1)}% size diff)`
              )
            }

            // If baseline PNG exists, keep it for manual comparison
            if (existsSync(baselinePath)) {
              const diffReportPath = join(
                OUTPUT_DIR,
                `${screen.name}-diff-report.txt`
              )
              writeFileSync(
                diffReportPath,
                [
                  `Visual Regression Report: ${screen.name}`,
                  `Description: ${screen.description}`,
                  `Timestamp: ${new Date().toISOString()}`,
                  ``,
                  `Baseline hash: ${baseline.hash}`,
                  `Current hash:  ${newHash}`,
                  `Baseline size: ${baselineSize} bytes`,
                  `Current size:  ${newSize} bytes`,
                  `Size diff:     ${sizeDiff.toFixed(2)}%`,
                  `Status:        ${isMajor ? 'MAJOR CHANGE' : 'MINOR CHANGE'}`,
                  ``,
                  `Baseline file: ${baselinePath}`,
                  `Current file:  ${screenshotPath}`,
                  ``,
                  `To update baselines: node scripts/visual-regression.mjs --update-baselines`,
                ].join('\n')
              )
              console.log(`  [REPORT] Diff report: ${diffReportPath}`)
            }
          }
        }
      } catch (err) {
        results.push({
          screen: screen.name,
          description: screen.description,
          status: 'ERROR',
          error: err.message,
        })
        console.error(`  [ERROR] ${screen.name} — ${err.message}`)
      }
    }
  } catch (err) {
    console.error(`\nFATAL: Failed to load app: ${err.message}`)
    await browser.close()
    killServer(server)
    process.exit(1)
  }

  // Save updated baselines hashes
  if (UPDATE_BASELINES) {
    writeFileSync(HASHES_FILE, JSON.stringify(baselineHashes, null, 2))
    console.log(`\nBaseline hashes saved to ${HASHES_FILE}`)
  }

  // Save results report
  const reportPath = join(OUTPUT_DIR, 'report.json')
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        mode: UPDATE_BASELINES ? 'update-baselines' : 'compare',
        threshold: SIZE_DIFF_THRESHOLD,
        viewport: VIEWPORT,
        results,
      },
      null,
      2
    )
  )

  // Cleanup
  await browser.close()
  killServer(server)

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('VISUAL REGRESSION SUMMARY')
  console.log('='.repeat(60))

  if (UPDATE_BASELINES) {
    const updated = results.filter((r) => r.status === 'BASELINE_UPDATED').length
    const errors = results.filter((r) => r.status === 'ERROR').length
    console.log(`Baselines updated: ${updated}/${SCREENS.length}`)
    if (errors > 0) console.log(`Errors: ${errors}`)
    console.log(`Report: ${reportPath}`)
    process.exit(errors > 0 ? 1 : 0)
  } else {
    const unchanged = results.filter((r) => r.status === 'UNCHANGED').length
    const minor = results.filter((r) => r.status === 'MINOR_CHANGE').length
    const major = results.filter((r) => r.status === 'MAJOR_CHANGE').length
    const noBaseline = results.filter((r) => r.status === 'NO_BASELINE').length
    const errors = results.filter((r) => r.status === 'ERROR').length

    console.log(`Unchanged:    ${unchanged}`)
    console.log(`Minor change: ${minor} (below ${SIZE_DIFF_THRESHOLD}% threshold)`)
    console.log(`Major change: ${major} (above ${SIZE_DIFF_THRESHOLD}% threshold)`)
    if (noBaseline > 0) console.log(`No baseline:  ${noBaseline}`)
    if (errors > 0) console.log(`Errors:       ${errors}`)
    console.log(`Report:       ${reportPath}`)

    if (major > 0) {
      console.log(
        `\nFAILED: ${major} screen(s) have major visual changes above ${SIZE_DIFF_THRESHOLD}% threshold.`
      )
      console.log(
        'Review the screenshots in visual-regression-output/ and update baselines if changes are intentional:'
      )
      console.log('  node scripts/visual-regression.mjs --update-baselines')
    } else if (noBaseline > 0) {
      console.log(
        '\nWARN: Some screens have no baseline. Run with --update-baselines to create them.'
      )
    } else {
      console.log('\nPASSED: No major visual regressions detected.')
    }

    process.exit(hasFailure ? 1 : 0)
  }
}

run().catch((err) => {
  console.error(`\nFATAL: ${err.message}`)
  process.exit(1)
})
