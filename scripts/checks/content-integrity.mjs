#!/usr/bin/env node
/**
 * Quality Gate Check: Content Integrity
 * Detects misleading content in the codebase:
 * - Hardcoded fake vote counts (deterministic seed hashes)
 * - Fake promo codes / offers / timers
 * - Features displayed as active but without real backend
 * - Hardcoded user counts ("X utilisateurs" with hardcoded X)
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

const CHECKS = [
  {
    id: 'FAKE_VOTES',
    name: 'Fake vote counts with seed/hash',
    pattern: /seed\s*%\s*\d+|baseUp|baseDown|Math\.abs\(seed/,
    description: 'Deterministic fake vote counts that simulate community engagement',
  },
  {
    id: 'FAKE_PROMO',
    name: 'Hardcoded fake promo codes',
    pattern: /SPOT\d+BOOK|SPOT\d+HOST|code\s*class=".*font-mono.*>.*[A-Z]{4,}/,
    description: 'Fake promotional codes that mislead users',
  },
  {
    id: 'FAKE_TIMER',
    name: 'Hardcoded fake countdown timer',
    pattern: /Expire dans \d+:\d+:\d+|23:45:12|countdown.*hardcoded/i,
    description: 'Fake countdown timers that create false urgency',
  },
  {
    id: 'FAKE_USER_COUNT',
    name: 'Hardcoded user counts',
    pattern: /\+\d{3,}\s+inscrits|>\d{3,}\s*<\/span>\s*<span[^>]*>.*(?:users|joueurs|inscrits)/i,
    description: 'Hardcoded user counts that falsely imply an active userbase',
  },
  {
    id: 'FREE_FOREVER',
    name: 'Promise of "free forever"',
    pattern: /gratuit et le restera|free and will stay free|gratuito y lo seguir|kostenlos und bleibt es/i,
    description: 'Making promises about future pricing that may not be kept',
  },
]

export default function check() {
  const files = getAllJsFiles(SRC_PATH)
  const errors = []
  let totalChecked = 0

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const relPath = relative(ROOT, file)
    const lines = content.split('\n')

    for (const c of CHECKS) {
      for (let i = 0; i < lines.length; i++) {
        if (c.pattern.test(lines[i])) {
          errors.push({
            file: relPath,
            line: i + 1,
            check: c.id,
            name: c.name,
            description: c.description,
            snippet: lines[i].trim().substring(0, 80),
          })
        }
      }
      totalChecked++
    }
  }

  // Score: 100 if 0 errors, -10 per error, min 0
  const score = Math.max(0, 100 - errors.length * 10)

  return {
    name: 'Content Integrity',
    score,
    maxScore: 100,
    errors: errors.map(e => `[${e.check}] ${e.file}:${e.line} — ${e.name}: ${e.snippet}`),
    warnings: [],
    stats: { totalChecked, issueCount: errors.length },
  }
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = check()
  console.log(`\n📋 Content Integrity Check`)
  console.log(`Score: ${result.score}/100`)
  console.log(`Errors: ${result.errors.length}`)
  if (result.errors.length > 0) {
    console.log('\nIssues found:')
    result.errors.forEach(d => console.log(`  ⚠ ${d}`))
  } else {
    console.log('✅ No misleading content found')
  }
}
