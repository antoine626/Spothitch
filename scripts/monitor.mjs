#!/usr/bin/env node
/**
 * Production Monitor
 * Health checks for spothitch.com
 *
 * Checks:
 *   1. HTTP 200 on main page
 *   2. version.json loads and has valid format
 *   3. Security headers present
 *   4. Spots data loads (FR.json)
 *
 * Usage: node scripts/monitor.mjs
 */

const SITE_URL = 'https://spothitch.com'
const TIMEOUT = 15000

async function fetchWithTimeout(url, timeout = TIMEOUT) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

async function checkMainPage() {
  try {
    const res = await fetchWithTimeout(SITE_URL)
    if (res.status !== 200) {
      return { name: 'Main Page', ok: false, error: `HTTP ${res.status}` }
    }
    const text = await res.text()
    if (!text.includes('<div id="app"')) {
      return { name: 'Main Page', ok: false, error: 'Missing #app div' }
    }
    return { name: 'Main Page', ok: true, detail: `HTTP 200, ${Math.round(text.length / 1024)}KB` }
  } catch (err) {
    return { name: 'Main Page', ok: false, error: err.message }
  }
}

async function checkVersionJson() {
  try {
    const res = await fetchWithTimeout(`${SITE_URL}/version.json`)
    if (res.status !== 200) {
      return { name: 'version.json', ok: false, error: `HTTP ${res.status}` }
    }
    const data = await res.json()
    if (!data.version && !data.commit && !data.buildTime) {
      return { name: 'version.json', ok: false, error: 'Invalid format (no version/commit/buildTime)' }
    }
    return { name: 'version.json', ok: true, detail: `v${data.version || 'unknown'}, built ${data.buildTime || 'unknown'}` }
  } catch (err) {
    return { name: 'version.json', ok: false, error: err.message }
  }
}

async function checkSecurityHeaders() {
  try {
    const res = await fetchWithTimeout(SITE_URL)
    const headers = res.headers
    const checks = []

    // Check important security headers
    const secHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': null, // just needs to exist
    }

    for (const [header, expectedValue] of Object.entries(secHeaders)) {
      const value = headers.get(header)
      if (!value) {
        checks.push(`Missing: ${header}`)
      } else if (expectedValue && !value.toLowerCase().includes(expectedValue.toLowerCase())) {
        checks.push(`${header}: expected ${expectedValue}, got ${value}`)
      }
    }

    // CSP is optional but recommended
    if (!headers.get('content-security-policy')) {
      checks.push('Missing: content-security-policy (recommended)')
    }

    if (checks.length === 0) {
      return { name: 'Security Headers', ok: true, detail: 'All present' }
    }
    // Missing CSP alone is a warning, not a failure
    const criticalMissing = checks.filter(c => !c.includes('recommended'))
    return {
      name: 'Security Headers',
      ok: criticalMissing.length === 0,
      detail: checks.join('; '),
      warnings: checks,
    }
  } catch (err) {
    return { name: 'Security Headers', ok: false, error: err.message }
  }
}

async function checkSpotsData() {
  try {
    const res = await fetchWithTimeout(`${SITE_URL}/data/spots/FR.json`)
    if (res.status !== 200) {
      return { name: 'Spots Data (FR)', ok: false, error: `HTTP ${res.status}` }
    }
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      return { name: 'Spots Data (FR)', ok: false, error: 'Empty or invalid JSON' }
    }
    return { name: 'Spots Data (FR)', ok: true, detail: `${data.length} spots loaded` }
  } catch (err) {
    return { name: 'Spots Data (FR)', ok: false, error: err.message }
  }
}

// Main
console.log('\n=== SpotHitch Production Monitor ===')
console.log(`Target: ${SITE_URL}`)
console.log(`Time: ${new Date().toISOString()}\n`)

const checks = await Promise.all([
  checkMainPage(),
  checkVersionJson(),
  checkSecurityHeaders(),
  checkSpotsData(),
])

let allOk = true
for (const check of checks) {
  const icon = check.ok ? '✓' : '✗'
  const detail = check.ok ? check.detail : check.error
  console.log(`${icon} ${check.name}: ${detail}`)
  if (check.warnings) {
    check.warnings.forEach(w => console.log(`  ⚠ ${w}`))
  }
  if (!check.ok) allOk = false
}

console.log(`\n${allOk ? '✓ All checks passed' : '✗ Some checks failed'}`)
process.exit(allOk ? 0 : 1)
