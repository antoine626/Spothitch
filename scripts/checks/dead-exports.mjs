#!/usr/bin/env node
/**
 * Quality Gate Check: Dead Exports
 * Detects exported functions/constants that are never imported anywhere
 * Warning only (not blocking)
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

export default function checkDeadExports() {
  const files = getAllJsFiles(SRC_PATH)

  // Step 1: Collect all named exports
  const exports = [] // { name, file }
  for (const file of files) {
    const relPath = relative(SRC_PATH, file)
    const content = readFileSync(file, 'utf-8')

    // export function name
    const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g
    let match
    while ((match = funcRegex.exec(content)) !== null) {
      exports.push({ name: match[1], file: relPath })
    }

    // export const/let/var name
    const constRegex = /export\s+(?:const|let|var)\s+(\w+)/g
    while ((match = constRegex.exec(content)) !== null) {
      exports.push({ name: match[1], file: relPath })
    }
  }

  // Step 2: Collect all import references across the codebase (src + tests)
  const allImportableFiles = [
    ...files,
    ...getAllJsFiles(join(ROOT, 'tests')).filter(f => extname(f) === '.js'),
  ]

  const importedNames = new Set()
  for (const file of allImportableFiles) {
    const content = readFileSync(file, 'utf-8')

    // import { name1, name2 } from '...'
    const importRegex = /import\s*\{([^}]+)\}\s*from/g
    let match
    while ((match = importRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim())
      names.forEach(n => { if (n) importedNames.add(n) })
    }

    // Dynamic import usage: .then(m => m.name) or mod.name
    const dotAccessRegex = /\.\s*(\w+)/g
    while ((match = dotAccessRegex.exec(content)) !== null) {
      importedNames.add(match[1])
    }
  }

  // Step 3: Find dead exports
  // Ignore entry points and window.* handlers (they're the public API)
  const ENTRY_FILES = new Set(['main.js'])
  const IGNORE_NAMES = new Set([
    'default', // default exports
  ])

  const deadExports = exports.filter(exp => {
    if (ENTRY_FILES.has(exp.file)) return false
    if (IGNORE_NAMES.has(exp.name)) return false
    // If it starts with render and is in a component, it's likely used via lazy loading
    if (exp.name.startsWith('render') && (exp.file.includes('components/') || exp.file.includes('services/'))) {
      return false
    }
    return !importedNames.has(exp.name)
  })

  const warnings = []
  if (deadExports.length > 0) {
    warnings.push(`${deadExports.length} potentially dead export(s) found:`)
    deadExports.slice(0, 20).forEach(e => warnings.push(`  - ${e.name} (${e.file})`))
    if (deadExports.length > 20) {
      warnings.push(`  ... and ${deadExports.length - 20} more`)
    }
  }

  // Score: warnings only, light deduction
  const score = Math.max(0, 100 - Math.min(30, deadExports.length * 2))

  return {
    name: 'Dead Exports',
    score,
    maxScore: 100,
    errors: [], // Never blocking
    warnings,
    stats: {
      totalExports: exports.length,
      deadExports: deadExports.length,
      importedNames: importedNames.size,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('dead-exports.mjs')) {
  const result = checkDeadExports()
  console.log(`\n=== ${result.name} ===`)
  console.log(`Total exports: ${result.stats.totalExports}`)
  console.log(`Dead exports: ${result.stats.deadExports}`)
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
}
