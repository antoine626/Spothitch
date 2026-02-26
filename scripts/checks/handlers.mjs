#!/usr/bin/env node
/**
 * Quality Gate Check: Handlers
 * Verifies that MAIN_JS_HANDLERS in tests/wiring matches actual window.* in source code
 * and vice-versa.
 *
 * --fix mode: removes phantom entries from MAIN_JS_HANDLERS that don't exist in source
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')
const WIRING_TEST = join(ROOT, 'tests', 'wiring', 'globalHandlers.test.js')
const SRC_PATH = join(ROOT, 'src')

function getAllJsFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      files.push(...getAllJsFiles(fullPath))
    } else if (extname(entry) === '.js') {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Extract MAIN_JS_HANDLERS array from globalHandlers.test.js
 */
function extractDeclaredHandlers() {
  const content = readFileSync(WIRING_TEST, 'utf-8')
  const handlers = new Set()

  const arrayMatch = content.match(/const MAIN_JS_HANDLERS\s*=\s*\[([\s\S]*?)\]\s*\n/)
  if (!arrayMatch) {
    throw new Error('Could not find MAIN_JS_HANDLERS array in globalHandlers.test.js')
  }

  const arrayContent = arrayMatch[1]
  const stringRegex = /['"](\w+)['"]/g
  let match
  while ((match = stringRegex.exec(arrayContent)) !== null) {
    handlers.add(match[1])
  }

  return handlers
}

/**
 * Scan source code for window.XXX = function assignments (onclick handlers)
 */
function extractCodeHandlers() {
  const handlers = new Set()
  const files = getAllJsFiles(SRC_PATH)

  const SKIP_PROPERTIES = new Set([
    'addEventListener', 'removeEventListener', 'location', 'innerWidth',
    'innerHeight', 'scrollTo', 'scrollBy', 'open', 'close', 'alert',
    'confirm', 'prompt', 'onerror', 'onload', 'onunload', 'onresize',
    'onhashchange', 'onpopstate', 'onunhandledrejection',
    'spotFormData', 'setState', 'getState',
    '_lazyLoaders', '_loadedModules', '__SPOTHITCH_VERSION__',
    'maplibregl', 'matchMedia',
    'homeMapInstance', 'mapInstance', 'spotHitchMap',
    '_tripMapInstance', '_tripMapAddAmenities', '_tripMapRemoveAmenities',
    '_tripMapFlyTo', '_tripMapResize', '_tripMapCleanup',
    'deviceManagerState', 'emailVerificationState', 'identityVerificationState',
    'authMode', 'selectedLanguageCode', 'validateFormData',
    '_splashMessageInterval', '_locationPermissionCallbacks',
    '_refreshCountryBubbles', '_refreshMapSpots',
    'audioContext',
    'timestamps', 'blocked',
  ])

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const regex = /window\.(\w+)\s*=/g
      let match
      while ((match = regex.exec(line)) !== null) {
        const name = match[1]
        if (SKIP_PROPERTIES.has(name)) continue
        if (name.startsWith('_')) continue
        handlers.add(name)
      }
    }
  }

  return handlers
}

/**
 * Remove phantom handlers from MAIN_JS_HANDLERS array in globalHandlers.test.js
 */
function removePhantomHandlers(phantoms) {
  if (phantoms.length === 0) return 0

  let content = readFileSync(WIRING_TEST, 'utf-8')
  const phantomSet = new Set(phantoms)
  let removed = 0

  // Remove each phantom entry from the array
  for (const name of phantomSet) {
    // Match 'name' or "name" possibly followed by comma, with optional surrounding whitespace
    const patterns = [
      new RegExp(`\\s*'${name}',?`, 'g'),
      new RegExp(`\\s*"${name}",?`, 'g'),
    ]
    for (const pattern of patterns) {
      const before = content
      content = content.replace(pattern, (match) => {
        removed++
        return ''
      })
      if (content !== before) break
    }
  }

  // Clean up: remove empty lines left behind (multiple consecutive newlines → single)
  content = content.replace(/\n{3,}/g, '\n\n')

  writeFileSync(WIRING_TEST, content)
  return removed
}

export default function checkHandlers(opts = {}) {
  const fix = opts.fix || false
  const declared = extractDeclaredHandlers()
  const inCode = extractCodeHandlers()

  const inTestsNotCode = [...declared].filter(h => !inCode.has(h))
  const inCodeNotTests = [...inCode].filter(h => !declared.has(h))

  const IGNORE_IN_CODE = new Set(['t', 'setState', 'getState'])
  const realMissing = inCodeNotTests.filter(h => !IGNORE_IN_CODE.has(h))

  // Fix: remove phantom handlers from test file
  let fixed = 0
  if (fix && inTestsNotCode.length > 0) {
    fixed = removePhantomHandlers(inTestsNotCode)
  }

  const errors = []
  const warnings = []

  if (!fix && inTestsNotCode.length > 0) {
    warnings.push(`${inTestsNotCode.length} handler(s) in MAIN_JS_HANDLERS but not found as window.* in source:`)
    inTestsNotCode.forEach(h => warnings.push(`  - ${h}`))
  }

  if (realMissing.length > 0) {
    errors.push(`${realMissing.length} handler(s) in source (window.*) but NOT in MAIN_JS_HANDLERS:`)
    realMissing.forEach(h => errors.push(`  - ${h}`))
  }

  const score = fix
    ? Math.max(0, 100 - (errors.length > 0 ? 30 : 0))
    : Math.max(0, 100 - (errors.length > 0 ? 30 : 0) - (warnings.length > 0 ? 10 : 0))

  return {
    name: 'Handlers Wiring',
    score,
    maxScore: 100,
    errors: fix ? (fixed > 0 ? [`Removed ${fixed} phantom handler(s) from MAIN_JS_HANDLERS`] : errors) : errors,
    warnings: fix ? [] : warnings,
    stats: {
      declaredHandlers: declared.size,
      codeHandlers: inCode.size,
      missingFromTests: realMissing.length,
      missingFromCode: inTestsNotCode.length,
      fixed,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('handlers.mjs')) {
  const fix = process.argv.includes('--fix')
  const result = checkHandlers({ fix })
  console.log(`\n=== ${result.name} ===`)
  console.log(`Declared in tests: ${result.stats.declaredHandlers}`)
  console.log(`Found in code: ${result.stats.codeHandlers}`)
  if (fix) console.log(`Fixed: ${result.stats.fixed}`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 && !fix ? 1 : 0)
}
