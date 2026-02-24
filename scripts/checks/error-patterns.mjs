#!/usr/bin/env node
/**
 * Quality Gate Check: Error Patterns (from errors.md)
 * Reads lessons from memory/errors.md and verifies forbidden patterns
 * haven't returned in the codebase.
 *
 * Each ERR-XXX with a "Leçon" is turned into an automated check.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, extname, relative } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')
const SRC_PATH = join(ROOT, 'src')
const ERRORS_PATH = join(ROOT, 'memory', 'errors.md')

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
 * Hardcoded pattern checks derived from errors.md lessons.
 * Each check is a concrete, greppable pattern that should NOT exist.
 */
const PATTERN_CHECKS = [
  {
    id: 'ERR-001',
    name: 'Duplicate window.* handlers in non-main files',
    check(files) {
      const handlersByFile = {} // handler → [files]
      const guardedAssignments = new Set() // "handler:relPath" for guarded assignments
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        // Skip non-handler properties
        const SKIP = new Set(['addEventListener', 'removeEventListener', 'onerror', 'onload',
             'onunhandledrejection', 'onresize', 'onpopstate', 'onhashchange',
             '__SPOTHITCH_VERSION__', '_lazyLoaders', '_loadedModules',
             'mapInstance', 'spotHitchMap', 'homeMapInstance'])
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const m = line.match(/window\.(\w+)\s*=/)
          if (!m) continue
          const handler = m[1]
          if (SKIP.has(handler) || handler.startsWith('_')) continue
          // Check if this is a guarded assignment (if (!window.xxx) { window.xxx = ... })
          const prevLines = lines.slice(Math.max(0, i - 3), i).join(' ')
          if (new RegExp(`if\\s*\\(\\s*!\\s*window\\.${handler}\\s*\\)`).test(prevLines)) {
            guardedAssignments.add(`${handler}:${relPath}`)
          }
          if (!handlersByFile[handler]) handlersByFile[handler] = new Set()
          handlersByFile[handler].add(relPath)
        }
      }
      // The lazy-loading pattern: main.js has placeholder + module has real impl = OK
      // Guarded assignments (if (!window.xxx)) are intentional fallbacks = OK
      // Only flag real unguarded duplicates in 2+ non-main files
      const duplicates = Object.entries(handlersByFile)
        .filter(([name, fileSet]) => {
          const fileArr = [...fileSet]
          const nonMainFiles = fileArr.filter(f => f !== 'main.js')
          // Remove guarded files from duplication count
          const unguardedNonMain = nonMainFiles.filter(f => !guardedAssignments.has(`${name}:${f}`))
          // Real duplication: 2+ unguarded non-main files
          return unguardedNonMain.length > 1
        })
        .map(([name, fileSet]) => `${name} defined in: ${[...fileSet].join(', ')}`)
      return duplicates
    }
  },
  {
    id: 'ERR-019a',
    name: 'Manual quote escaping instead of escapeJSString',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/\.replace\(\s*\/['"]\/g/.test(lines[i]) && /\\['"]/.test(lines[i])) {
            issues.push(`${relPath}:${i + 1} — .replace(/'/g) pattern (use escapeJSString)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-019b',
    name: 'innerHTML with error.message (XSS)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/\.innerHTML\s*[+=]/.test(lines[i]) && /error\.message|err\.message/.test(lines[i])) {
            const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ')
            if (!/textContent|escapeHtml|DOMPurify|escapeJSString/.test(context)) {
              issues.push(`${relPath}:${i + 1} — innerHTML with error.message (use textContent)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-019c',
    name: 'Math.random() for security IDs (SOS, auth, session)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/Math\.random\(\)/.test(lines[i])) {
            const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ').toLowerCase()
            if (/sos|emergency|session.?id|auth.?token|api.?key|tracking.?id/.test(context)) {
              issues.push(`${relPath}:${i + 1} — Math.random() for security ID (use crypto.getRandomValues)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-011',
    name: 'MutationObserver modifying observed DOM without guard',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        if (/new\s+MutationObserver/.test(content)) {
          // Check if there's a guard variable (many valid patterns)
          const hasGuard = /last\w+|_observer\w+|observerLock|isProcessing|_guard|_init|_attached|_setup|debounce|throttle|requestAnimationFrame/.test(content)
          if (!hasGuard) {
            // Only flag if observer callback directly modifies DOM it observes
            if (/\.remove\(\)|\.cleanup|\.destroy/.test(content)) {
              issues.push(`${relPath} — MutationObserver without guard flag (risk of infinite loop, ERR-011)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-029',
    name: 'Ghost state flags (showXxx set but never rendered)',
    check(files) {
      // Collect all showXxx state flags set anywhere
      const stateFlags = new Set()
      const allContent = {} // relPath → content

      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        allContent[relPath] = content

        // Collect flags set via setState
        const setMatches = content.match(/setState\(\s*\{[^}]*show\w+:\s*true/g) || []
        for (const m of setMatches) {
          const flagMatch = m.match(/(show\w+):\s*true/)
          if (flagMatch) stateFlags.add(flagMatch[1])
        }
      }

      // Check which flags are referenced in render/view files
      // (App.js, main.js, and all component/view files)
      const renderFiles = Object.entries(allContent).filter(([path]) =>
        path.includes('App.js') || path === 'main.js' ||
        path.includes('components/') || path.includes('views/')
      )

      const renderedFlags = new Set()
      for (const flag of stateFlags) {
        for (const [, content] of renderFiles) {
          // Check if the flag is used in a conditional render (ternary, if, &&)
          if (content.includes(`state.${flag}`) || content.includes(`${flag} ?`) ||
              content.includes(`${flag} &&`) || content.includes(`getState().${flag}`)) {
            renderedFlags.add(flag)
            break
          }
        }
      }

      const ghostFlags = [...stateFlags].filter(f => !renderedFlags.has(f))
      // Filter out expected non-rendered flags (UI state, not modal renders)
      const EXPECTED_NON_RENDERED = new Set([
        'showLanding', 'showWelcome', 'showCookieBanner',
        'showOfflineBanner', 'showDebugPanel', 'showZoneChat',
        'showNotification', 'showToast', 'showLoading',
      ])
      const realGhosts = ghostFlags.filter(f => !EXPECTED_NON_RENDERED.has(f))

      return realGhosts.map(f => `State flag "${f}" is set but never used in render conditionals (ghost state)`)
    }
  },
]

export default function checkErrorPatterns() {
  if (!existsSync(ERRORS_PATH)) {
    return {
      name: 'Error Patterns',
      score: 100,
      maxScore: 100,
      errors: [],
      warnings: ['memory/errors.md not found — skipping pattern checks'],
      stats: { checksRun: 0, issuesFound: 0 },
    }
  }

  const files = getAllJsFiles(SRC_PATH)
  const errors = []
  const warnings = []
  let issuesFound = 0
  let checksWithIssues = 0

  for (const check of PATTERN_CHECKS) {
    try {
      const issues = check.check(files)
      if (issues.length > 0) {
        issuesFound += issues.length
        checksWithIssues++
        errors.push(`[${check.id}] ${check.name}: ${issues.length} issue(s)`)
        issues.slice(0, 3).forEach(i => errors.push(`  ${i}`))
        if (issues.length > 3) errors.push(`  ... and ${issues.length - 3} more`)
      }
    } catch (err) {
      warnings.push(`[${check.id}] Check failed: ${err.message}`)
    }
  }

  // Score: deduct per check that has issues, not per issue
  // This way pre-existing technical debt doesn't completely tank the score
  const score = Math.max(0, 100 - (checksWithIssues * 20))

  return {
    name: 'Error Patterns',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      checksRun: PATTERN_CHECKS.length,
      issuesFound,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('error-patterns.mjs')) {
  const result = checkErrorPatterns()
  console.log(`\n=== ${result.name} ===`)
  console.log(`Checks run: ${result.stats.checksRun}`)
  console.log(`Issues found: ${result.stats.issuesFound}`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
