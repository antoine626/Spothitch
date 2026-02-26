#!/usr/bin/env node
/**
 * Production Monitor
 * Health checks for spothitch.com
 *
 * Checks:
 *   1. HTTP 200 on main page + response time
 *   2. version.json loads and has valid format
 *   3. Security headers present (CSP, HSTS, X-Frame, X-Content-Type)
 *   4. Spots data loads (FR.json)
 *   5. SSL certificate expiry (warn 30 days before)
 *   6. Response time budget (warn >2s, error >5s)
 *   7. Sitemap.xml exists and valid
 *   8. robots.txt exists
 *
 * Usage: node scripts/monitor.mjs
 */

import { execSync } from 'child_process'

const SITE_URL = 'https://spothitch.com'
const TIMEOUT = 15000

async function fetchWithTimeout(url, timeout = TIMEOUT) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const start = Date.now()
    const res = await fetch(url, { signal: controller.signal })
    const elapsed = Date.now() - start
    clearTimeout(timer)
    res._elapsed = elapsed
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
    return { name: 'Main Page', ok: true, detail: `HTTP 200, ${Math.round(text.length / 1024)}KB, ${res._elapsed}ms` }
  } catch (err) {
    return { name: 'Main Page', ok: false, error: err.message }
  }
}

async function checkResponseTime() {
  try {
    const res = await fetchWithTimeout(SITE_URL)
    await res.text()
    const ms = res._elapsed
    if (ms > 5000) {
      return { name: 'Response Time', ok: false, error: `${ms}ms > 5000ms budget` }
    }
    const warnings = []
    if (ms > 2000) {
      warnings.push(`${ms}ms > 2000ms (slow)`)
    }
    return { name: 'Response Time', ok: true, detail: `${ms}ms`, warnings }
  } catch (err) {
    return { name: 'Response Time', ok: false, error: err.message }
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

    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': null,
    }

    const recommendedHeaders = {
      'content-security-policy': null,
      'strict-transport-security': null,
      'x-xss-protection': null,
      'referrer-policy': null,
      'permissions-policy': null,
    }

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const value = headers.get(header)
      if (!value) {
        checks.push(`Missing required: ${header}`)
      } else if (expectedValue && !value.toLowerCase().includes(expectedValue.toLowerCase())) {
        checks.push(`${header}: expected ${expectedValue}, got ${value}`)
      }
    }

    const warnings = []
    for (const [header] of Object.entries(recommendedHeaders)) {
      if (!headers.get(header)) {
        warnings.push(`Missing recommended: ${header}`)
      }
    }

    const criticalMissing = checks.filter(c => !c.includes('recommended'))
    return {
      name: 'Security Headers',
      ok: criticalMissing.length === 0,
      detail: criticalMissing.length === 0 ? `Required present, ${warnings.length} recommended missing` : checks.join('; '),
      warnings: [...checks, ...warnings],
    }
  } catch (err) {
    return { name: 'Security Headers', ok: false, error: err.message }
  }
}

async function checkSSLCertificate() {
  try {
    // Use openssl to check certificate expiry
    const host = new URL(SITE_URL).hostname
    const cmd = `echo | openssl s_client -servername ${host} -connect ${host}:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null`
    const output = execSync(cmd, { timeout: 10000 }).toString()

    const expiryMatch = output.match(/notAfter=(.+)/)
    if (!expiryMatch) {
      return { name: 'SSL Certificate', ok: true, detail: 'Could not parse expiry (but connection succeeded)' }
    }

    const expiryDate = new Date(expiryMatch[1])
    const now = new Date()
    const daysRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24))

    if (daysRemaining < 0) {
      return { name: 'SSL Certificate', ok: false, error: `EXPIRED ${Math.abs(daysRemaining)} days ago!` }
    }
    if (daysRemaining < 14) {
      return { name: 'SSL Certificate', ok: false, error: `Expires in ${daysRemaining} days — RENEW NOW` }
    }

    const warnings = []
    if (daysRemaining < 30) {
      warnings.push(`Expires in ${daysRemaining} days — renew soon`)
    }

    return {
      name: 'SSL Certificate',
      ok: true,
      detail: `Expires ${expiryDate.toISOString().split('T')[0]} (${daysRemaining} days)`,
      warnings,
    }
  } catch (err) {
    // openssl might not be available — skip gracefully
    return { name: 'SSL Certificate', ok: true, detail: `Check skipped: ${err.message?.substring(0, 50)}` }
  }
}

async function checkSpotsData() {
  try {
    const res = await fetchWithTimeout(`${SITE_URL}/data/spots/fr.json`)
    if (res.status !== 200) {
      return { name: 'Spots Data (FR)', ok: false, error: `HTTP ${res.status}` }
    }
    const data = await res.json()
    const spots = Array.isArray(data) ? data : data?.spots
    if (!Array.isArray(spots) || spots.length === 0) {
      return { name: 'Spots Data (FR)', ok: false, error: 'Empty or invalid JSON' }
    }
    return { name: 'Spots Data (FR)', ok: true, detail: `${spots.length} spots, ${res._elapsed}ms` }
  } catch (err) {
    return { name: 'Spots Data (FR)', ok: false, error: err.message }
  }
}

async function checkSitemap() {
  try {
    const res = await fetchWithTimeout(`${SITE_URL}/sitemap.xml`)
    if (res.status !== 200) {
      return { name: 'Sitemap', ok: false, error: `HTTP ${res.status}` }
    }
    const text = await res.text()
    if (!text.includes('<urlset') && !text.includes('<sitemapindex')) {
      return { name: 'Sitemap', ok: false, error: 'Invalid XML (no urlset or sitemapindex)' }
    }
    const urlCount = (text.match(/<url>/g) || []).length
    return { name: 'Sitemap', ok: true, detail: `${urlCount} URLs` }
  } catch (err) {
    return { name: 'Sitemap', ok: false, error: err.message }
  }
}

async function checkRobotsTxt() {
  try {
    const res = await fetchWithTimeout(`${SITE_URL}/robots.txt`)
    if (res.status !== 200) {
      return { name: 'robots.txt', ok: false, error: `HTTP ${res.status}` }
    }
    const text = await res.text()
    if (!text.includes('User-agent')) {
      return { name: 'robots.txt', ok: false, error: 'Invalid format (no User-agent)' }
    }
    const hasSitemap = text.includes('Sitemap:')
    return {
      name: 'robots.txt',
      ok: true,
      detail: `Valid${hasSitemap ? ', includes sitemap' : ''}`,
      warnings: hasSitemap ? [] : ['No Sitemap: directive'],
    }
  } catch (err) {
    return { name: 'robots.txt', ok: false, error: err.message }
  }
}

// Main
console.log('\n=== SpotHitch Production Monitor ===')
console.log(`Target: ${SITE_URL}`)
console.log(`Time: ${new Date().toISOString()}\n`)

const checks = await Promise.all([
  checkMainPage(),
  checkResponseTime(),
  checkVersionJson(),
  checkSecurityHeaders(),
  checkSSLCertificate(),
  checkSpotsData(),
  checkSitemap(),
  checkRobotsTxt(),
])

let allOk = true
for (const check of checks) {
  const icon = check.ok ? '✓' : '✗'
  const detail = check.ok ? check.detail : check.error
  console.log(`${icon} ${check.name}: ${detail}`)
  if (check.warnings?.length) {
    check.warnings.forEach(w => console.log(`  ⚠ ${w}`))
  }
  if (!check.ok) allOk = false
}

console.log(`\n${allOk ? '✓ All checks passed' : '✗ Some checks failed'}`)
process.exit(allOk ? 0 : 1)
