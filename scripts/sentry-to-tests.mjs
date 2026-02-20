#!/usr/bin/env node
/**
 * Sentry → Test Generator
 * Fetches unresolved Sentry issues and generates regression test skeletons.
 * Maintains an error-registry.json that tracks known errors and their tests.
 *
 * Usage:
 *   node scripts/sentry-to-tests.mjs          # Check for new errors
 *   node scripts/sentry-to-tests.mjs --audit   # Verify all registered errors have tests
 *
 * The error registry ensures: every bug found = a test written = never happens again.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const SENTRY_TOKEN = process.env.SENTRY_TOKEN
if (!SENTRY_TOKEN && !process.argv.includes('--audit')) {
  console.error('Missing SENTRY_TOKEN env variable. Set it to run Sentry fetch.')
  console.error('Usage: SENTRY_TOKEN=sntryu_xxx node scripts/sentry-to-tests.mjs')
  process.exit(1)
}
const SENTRY_ORG = 'spothitch'
const SENTRY_PROJECT = 'javascript'
const SENTRY_BASE = 'https://de.sentry.io/api/0'

const REGISTRY_PATH = join(import.meta.dirname, '..', 'tests', 'error-registry.json')
const REGRESSION_DIR = join(import.meta.dirname, '..', 'tests', 'regression')

// ---- Helpers ----

async function fetchSentryIssues(limit = 25) {
  const url = `${SENTRY_BASE}/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?query=is:unresolved&limit=${limit}&sort=date`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SENTRY_TOKEN}` },
  })
  if (!res.ok) {
    console.error(`Sentry API error: ${res.status} ${res.statusText}`)
    return []
  }
  return res.json()
}

function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) return { errors: [], meta: { lastCheck: null, totalFixed: 0 } }
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
}

function saveRegistry(registry) {
  registry.meta.lastCheck = new Date().toISOString()
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n')
}

function generateTestSkeleton(issue) {
  const safeTitle = issue.title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-').toLowerCase()
  const testFile = `sentry-${issue.shortId}-${safeTitle.slice(0, 40)}.test.js`

  // Extract file path from stacktrace if available
  const fileHint = issue.metadata?.filename || 'unknown'
  const functionHint = issue.metadata?.function || 'unknown'

  const content = `/**
 * Regression test for Sentry issue ${issue.shortId}
 * Error: ${issue.title}
 * File: ${fileHint}
 * Function: ${functionHint}
 * First seen: ${issue.firstSeen}
 * Events: ${issue.count}
 * URL: https://de.sentry.io/issues/${issue.id}/
 *
 * AUTO-GENERATED — Review and complete this test to prevent this error from recurring.
 */

import { describe, it, expect } from 'vitest'

describe('Regression: ${issue.shortId} — ${issue.title.replace(/'/g, "\\'")}', () => {
  it('should not throw the error that caused this issue', () => {
    // TODO: Import the affected module and reproduce the error conditions
    // File: ${fileHint}
    // Function: ${functionHint}
    //
    // Example:
    // import { someFunction } from '../../src/path/to/module.js'
    // expect(() => someFunction(badInput)).not.toThrow()

    expect(true).toBe(true) // Replace with real test
  })
})
`

  return { testFile, content }
}

// ---- Main ----

const isAudit = process.argv.includes('--audit')
const registry = loadRegistry()
const knownIds = new Set(registry.errors.map(e => e.sentryId))

if (isAudit) {
  // Audit mode: verify all registered errors have test files
  console.log('=== Error Registry Audit ===')
  let missing = 0
  for (const entry of registry.errors) {
    const testPath = join(REGRESSION_DIR, entry.testFile)
    if (!existsSync(testPath)) {
      console.error(`MISSING TEST: ${entry.sentryId} — ${entry.title}`)
      console.error(`  Expected: ${testPath}`)
      missing++
    } else {
      // Check if test still has the placeholder
      const content = readFileSync(testPath, 'utf-8')
      if (content.includes("expect(true).toBe(true) // Replace with real test")) {
        console.warn(`PLACEHOLDER: ${entry.sentryId} — ${entry.title} (test not yet implemented)`)
      }
    }
  }
  console.log(`\nTotal registered errors: ${registry.errors.length}`)
  console.log(`Total fixed (with real tests): ${registry.meta.totalFixed}`)
  if (missing > 0) {
    console.error(`\n${missing} error(s) have no test file!`)
    process.exit(1)
  }
  console.log('All registered errors have test files.')
  process.exit(0)
}

// Fetch mode: get new Sentry issues
console.log('Fetching Sentry issues...')
const issues = await fetchSentryIssues()

if (issues.length === 0) {
  console.log('No unresolved Sentry issues found.')
  saveRegistry(registry)
  process.exit(0)
}

console.log(`Found ${issues.length} unresolved issues.`)

// Ensure regression test directory exists
if (!existsSync(REGRESSION_DIR)) mkdirSync(REGRESSION_DIR, { recursive: true })

let newCount = 0
for (const issue of issues) {
  if (knownIds.has(issue.shortId)) continue

  const { testFile, content } = generateTestSkeleton(issue)
  const testPath = join(REGRESSION_DIR, testFile)

  // Write test skeleton
  writeFileSync(testPath, content)

  // Add to registry
  registry.errors.push({
    sentryId: issue.shortId,
    sentryUrl: `https://de.sentry.io/issues/${issue.id}/`,
    title: issue.title,
    file: issue.metadata?.filename || null,
    function: issue.metadata?.function || null,
    firstSeen: issue.firstSeen,
    events: issue.count,
    testFile,
    dateRegistered: new Date().toISOString(),
    status: 'skeleton', // skeleton → implemented → verified
  })

  console.log(`NEW: ${issue.shortId} — ${issue.title}`)
  console.log(`  → Generated: tests/regression/${testFile}`)
  newCount++
}

saveRegistry(registry)
console.log(`\nDone. ${newCount} new test skeleton(s) generated.`)
console.log(`Total in registry: ${registry.errors.length}`)
