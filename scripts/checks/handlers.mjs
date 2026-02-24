#!/usr/bin/env node
/**
 * Quality Gate Check: Handlers
 * Verifies that MAIN_JS_HANDLERS in tests/wiring matches actual window.* in source code
 * and vice-versa.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
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

  // Match quoted strings inside the MAIN_JS_HANDLERS array
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
 * Filters out non-handler properties (map instances, state objects, internals)
 */
function extractCodeHandlers() {
  const handlers = new Set()
  const files = getAllJsFiles(SRC_PATH)

  // Properties that are NOT onclick handlers — skip these
  const SKIP_PROPERTIES = new Set([
    // Browser/DOM globals
    'addEventListener', 'removeEventListener', 'location', 'innerWidth',
    'innerHeight', 'scrollTo', 'scrollBy', 'open', 'close', 'alert',
    'confirm', 'prompt', 'onerror', 'onload', 'onunload', 'onresize',
    'onhashchange', 'onpopstate', 'onunhandledrejection',
    // App state/data
    'spotFormData', 'setState', 'getState',
    '_lazyLoaders', '_loadedModules', '__SPOTHITCH_VERSION__',
    'maplibregl', 'matchMedia',
    // Map instances (not handlers)
    'homeMapInstance', 'mapInstance', 'spotHitchMap',
    '_tripMapInstance', '_tripMapAddAmenities', '_tripMapRemoveAmenities',
    '_tripMapFlyTo', '_tripMapResize', '_tripMapCleanup',
    // Internal state objects (not callable handlers)
    'deviceManagerState', 'emailVerificationState', 'identityVerificationState',
    'authMode', 'selectedLanguageCode', 'validateFormData',
    '_splashMessageInterval', '_locationPermissionCallbacks',
    '_refreshCountryBubbles', '_refreshMapSpots',
    // Audio/media context
    'audioContext',
    // Data properties (not handlers)
    'timestamps', 'blocked',
  ])

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Match: window.functionName = (function/arrow/value)
      const regex = /window\.(\w+)\s*=/g
      let match
      while ((match = regex.exec(line)) !== null) {
        const name = match[1]
        if (SKIP_PROPERTIES.has(name)) continue
        // Skip private/internal (prefixed with _)
        if (name.startsWith('_')) continue
        handlers.add(name)
      }
    }
  }

  return handlers
}

export default function checkHandlers() {
  const declared = extractDeclaredHandlers()
  const inCode = extractCodeHandlers()

  const inTestsNotCode = [...declared].filter(h => !inCode.has(h))
  const inCodeNotTests = [...inCode].filter(h => !declared.has(h))

  // Some handlers are from libraries or dynamically generated - filter noise
  const IGNORE_IN_CODE = new Set([
    // Global utility functions attached to window for templates
    't', 'setState', 'getState',
  ])

  const realMissing = inCodeNotTests.filter(h => !IGNORE_IN_CODE.has(h))

  const errors = []
  const warnings = []

  if (inTestsNotCode.length > 0) {
    warnings.push(`${inTestsNotCode.length} handler(s) in MAIN_JS_HANDLERS but not found as window.* in source:`)
    inTestsNotCode.forEach(h => warnings.push(`  - ${h}`))
  }

  if (realMissing.length > 0) {
    errors.push(`${realMissing.length} handler(s) in source (window.*) but NOT in MAIN_JS_HANDLERS:`)
    realMissing.forEach(h => errors.push(`  - ${h}`))
  }

  const score = Math.max(0, 100 - (errors.length > 0 ? 30 : 0) - (warnings.length > 0 ? 10 : 0))

  return {
    name: 'Handlers Wiring',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      declaredHandlers: declared.size,
      codeHandlers: inCode.size,
      missingFromTests: realMissing.length,
      missingFromCode: inTestsNotCode.length,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('handlers.mjs')) {
  const result = checkHandlers()
  console.log(`\n=== ${result.name} ===`)
  console.log(`Declared in tests: ${result.stats.declaredHandlers}`)
  console.log(`Found in code: ${result.stats.codeHandlers}`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
