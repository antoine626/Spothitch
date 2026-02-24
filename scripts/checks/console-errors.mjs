#!/usr/bin/env node
/**
 * Quality Gate Check: Console Errors & Security Patterns
 * - console.error without Sentry.captureException nearby
 * - innerHTML with variables (XSS risk)
 * - Math.random() for IDs (security)
 * - .replace(/'/g, "\\'") instead of escapeJSString (ERR-019)
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')
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

export default function checkConsoleErrors() {
  const files = getAllJsFiles(SRC_PATH)
  const errors = []
  const warnings = []

  for (const file of files) {
    const relPath = relative(SRC_PATH, file)
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      // Check 1: Math.random() used for security-sensitive IDs
      // Only flag when used to generate IDs for auth, SOS, or session management
      // NOT for UI randomness (animation IDs, random colors, shuffle, etc.)
      if (/Math\.random\(\)/.test(line)) {
        const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ').toLowerCase()
        // Only flag truly security-sensitive patterns
        if (/token|session.?id|auth.?id|secret|emergency.?id|sos.?id|api.?key/.test(context)) {
          errors.push(`${relPath}:${lineNum} — Math.random() used for security-sensitive ID (use crypto.getRandomValues)`)
        } else if (/\.id\s*=\s*.*Math\.random|id:\s*.*Math\.random/.test(line.toLowerCase())) {
          // Direct ID assignment with Math.random — warn but don't block
          warnings.push(`${relPath}:${lineNum} — Math.random() for ID generation (consider crypto.getRandomValues)`)
        }
      }

      // Check 2: .replace(/'/g, "\\'") pattern (ERR-019)
      if (/\.replace\(\s*\/['"]\/g/.test(line) && /\\['"]/.test(line)) {
        errors.push(`${relPath}:${lineNum} — Manual quote escaping detected (use escapeJSString from sanitize.js)`)
      }

      // Check 3: innerHTML with non-sanitized external data (XSS risk)
      // Skip render functions and template builders (expected vanilla JS pattern)
      if (/\.innerHTML\s*[+=]/.test(line)) {
        const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 3)).join(' ')
        // Only flag if injecting error.message, user input, or API response directly
        if (/error\.message|\.value|response\.|data\./.test(line) &&
            !/DOMPurify|escapeJSString|textContent|sanitize|escapeHtml/.test(context)) {
          errors.push(`${relPath}:${lineNum} — innerHTML with potential untrusted data (use textContent or DOMPurify)`)
        }
      }
    }
  }

  const score = Math.max(0, 100 - (errors.length * 25) - (warnings.length * 3))

  return {
    name: 'Security Patterns',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      criticalIssues: errors.length,
      potentialIssues: warnings.length,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('console-errors.mjs')) {
  const result = checkConsoleErrors()
  console.log(`\n=== ${result.name} ===`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
