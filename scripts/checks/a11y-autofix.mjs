#!/usr/bin/env node
/**
 * Quality Gate Check: Accessibility (a11y)
 * Detects <div onclick="..."> without role="button" tabindex="0" in HTML templates.
 *
 * --fix mode: adds missing role="button" tabindex="0" to interactive divs.
 *
 * Exceptions (not touched):
 *   - onclick="event.stopPropagation()" → event delegation, not a button
 *   - onclick="if(event.target===this)closeX()" → modal overlay backdrop
 *   - Elements that already have role= and tabindex=
 *   - <button>, <a>, <input>, <select>, <textarea> (natively interactive)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
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

/**
 * Check if an onclick handler is an exception (not a real button)
 */
function isExceptionOnclick(onclickValue) {
  if (!onclickValue) return true
  // Modal overlays: if(event.target===this)
  if (/if\s*\(\s*event\.target\s*===?\s*this\s*\)/.test(onclickValue)) return true
  // Event delegation: event.stopPropagation() only
  if (/^\s*event\.stopPropagation\(\)\s*;?\s*$/.test(onclickValue)) return true
  return false
}

export default function checkA11y(opts = {}) {
  const fix = opts.fix || false
  const files = getAllJsFiles(SRC_PATH)
  const violations = []
  let totalFixed = 0

  for (const file of files) {
    const relPath = relative(SRC_PATH, file)
    let content = readFileSync(file, 'utf-8')
    let modified = false

    // Find all HTML template strings containing <div onclick="...">
    // We need to find divs with onclick but without role="button" and tabindex="0"
    // Pattern: <div ... onclick="..." ...> where there's no role= or tabindex=

    // Match <div with onclick= in HTML templates (backtick strings or quote strings)
    const divOnclickRegex = /<div\b([^>]*?)onclick="([^"]*?)"([^>]*?)>/g
    let match

    const replacements = []

    while ((match = divOnclickRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      const beforeOnclick = match[1]
      const onclickValue = match[2]
      const afterOnclick = match[3]
      const fullAttrs = beforeOnclick + afterOnclick

      // Skip exceptions
      if (isExceptionOnclick(onclickValue)) continue

      // Check if already has role and tabindex
      const hasRole = /role\s*=/.test(fullAttrs)
      const hasTabindex = /tabindex\s*=/.test(fullAttrs)

      if (hasRole && hasTabindex) continue

      violations.push({
        file: relPath,
        onclick: onclickValue.substring(0, 50),
        hasRole,
        hasTabindex,
        offset: match.index,
      })

      if (fix) {
        let additions = ''
        if (!hasRole) additions += ' role="button"'
        if (!hasTabindex) additions += ' tabindex="0"'

        // Insert additions right before the closing >
        const newTag = fullMatch.replace(/>$/, `${additions}>`)
        replacements.push({ from: fullMatch, to: newTag, offset: match.index })
      }
    }

    // Also check <span onclick="..."> patterns
    const spanOnclickRegex = /<span\b([^>]*?)onclick="([^"]*?)"([^>]*?)>/g
    while ((match = spanOnclickRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      const beforeOnclick = match[1]
      const onclickValue = match[2]
      const afterOnclick = match[3]
      const fullAttrs = beforeOnclick + afterOnclick

      if (isExceptionOnclick(onclickValue)) continue

      const hasRole = /role\s*=/.test(fullAttrs)
      const hasTabindex = /tabindex\s*=/.test(fullAttrs)

      if (hasRole && hasTabindex) continue

      violations.push({
        file: relPath,
        onclick: onclickValue.substring(0, 50),
        hasRole,
        hasTabindex,
        offset: match.index,
      })

      if (fix) {
        let additions = ''
        if (!hasRole) additions += ' role="button"'
        if (!hasTabindex) additions += ' tabindex="0"'
        const newTag = fullMatch.replace(/>$/, `${additions}>`)
        replacements.push({ from: fullMatch, to: newTag, offset: match.index })
      }
    }

    // Apply replacements in reverse order to maintain offsets
    if (fix && replacements.length > 0) {
      // Simple string replacement (each match is unique enough)
      for (const r of replacements) {
        content = content.replace(r.from, r.to)
        totalFixed++
        modified = true
      }

      if (modified) {
        writeFileSync(file, content)
      }
    }
  }

  const warnings = []
  const remainingViolations = fix ? 0 : violations.length

  if (remainingViolations > 0) {
    warnings.push(`${remainingViolations} interactive element(s) missing a11y attributes:`)
    violations.slice(0, 10).forEach(v => {
      const missing = []
      if (!v.hasRole) missing.push('role="button"')
      if (!v.hasTabindex) missing.push('tabindex="0"')
      warnings.push(`  - ${v.file}: onclick="${v.onclick}" — missing ${missing.join(', ')}`)
    })
    if (violations.length > 10) {
      warnings.push(`  ... and ${violations.length - 10} more`)
    }
  }

  const score = Math.max(0, 100 - Math.min(50, remainingViolations * 3))

  return {
    name: 'Accessibility',
    score: fix ? 100 : score,
    maxScore: 100,
    errors: [],
    warnings: fix ? (totalFixed > 0 ? [`Fixed ${totalFixed} a11y violation(s)`] : []) : warnings,
    stats: {
      violations: violations.length,
      fixed: totalFixed,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('a11y-autofix.mjs')) {
  const fix = process.argv.includes('--fix')
  const result = checkA11y({ fix })
  console.log(`\n=== ${result.name} ===`)
  console.log(`Violations: ${result.stats.violations}`)
  if (fix) console.log(`Fixed: ${result.stats.fixed}`)
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
}
