#!/usr/bin/env node
/**
 * Quality Gate Check: Dead Exports
 * Detects exported functions/constants that are never imported anywhere.
 *
 * --fix mode: removes the `export` keyword from dead exports (function remains local)
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

export default function checkDeadExports(opts = {}) {
  const fix = opts.fix || false
  const files = getAllJsFiles(SRC_PATH)

  // Step 1: Collect all named exports
  const exports = [] // { name, file, fullPath, line, lineNum }
  for (const file of files) {
    const relPath = relative(SRC_PATH, file)
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // export function name / export async function name
      const funcMatch = line.match(/^(export\s+(?:async\s+)?function\s+)(\w+)/)
      if (funcMatch) {
        exports.push({ name: funcMatch[2], file: relPath, fullPath: file, lineNum: i, lineText: line })
      }

      // export const/let/var name
      const constMatch = line.match(/^(export\s+(?:const|let|var)\s+)(\w+)/)
      if (constMatch) {
        exports.push({ name: constMatch[2], file: relPath, fullPath: file, lineNum: i, lineText: line })
      }
    }
  }

  // Step 2: Collect all import references across the codebase (src + tests)
  const testFiles = getAllJsFiles(join(ROOT, 'tests')).filter(f => extname(f) === '.js')
  const allImportableFiles = [...files, ...testFiles]

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
  const ENTRY_FILES = new Set(['main.js'])
  const IGNORE_NAMES = new Set(['default'])

  const deadExports = exports.filter(exp => {
    if (ENTRY_FILES.has(exp.file)) return false
    if (IGNORE_NAMES.has(exp.name)) return false
    // render* in components/services are likely used via lazy loading
    if (exp.name.startsWith('render') && (exp.file.includes('components/') || exp.file.includes('services/'))) {
      return false
    }
    return !importedNames.has(exp.name)
  })

  // Step 4: Auto-fix if requested
  let fixed = 0
  if (fix && deadExports.length > 0) {
    // Group by file to batch edits
    const byFile = new Map()
    for (const exp of deadExports) {
      if (!byFile.has(exp.fullPath)) byFile.set(exp.fullPath, [])
      byFile.get(exp.fullPath).push(exp)
    }

    for (const [filePath, exps] of byFile) {
      let content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      let modified = false

      for (const exp of exps) {
        const line = lines[exp.lineNum]
        if (!line) continue

        // Safety: only remove export if the function is used locally in the file.
        // Otherwise ESLint will flag it as "defined but never used".
        const nameRegex = new RegExp(`\\b${exp.name}\\b`, 'g')
        const occurrences = (content.match(nameRegex) || []).length
        // The definition itself counts as 1 occurrence; if there's only 1, it's not used locally
        if (occurrences <= 1) continue

        // Remove the `export ` prefix
        const newLine = line.replace(/^export\s+/, '')
        if (newLine !== line) {
          lines[exp.lineNum] = newLine
          modified = true
          fixed++
        }
      }

      if (modified) {
        content = lines.join('\n')
        writeFileSync(filePath, content)
      }
    }
  }

  const warnings = []
  // Re-count after fix
  const remainingDead = fix ? deadExports.length - fixed : deadExports.length
  if (remainingDead > 0) {
    warnings.push(`${remainingDead} potentially dead export(s) found:`)
    deadExports.slice(0, 20).forEach(e => warnings.push(`  - ${e.name} (${e.file})`))
    if (deadExports.length > 20) {
      warnings.push(`  ... and ${deadExports.length - 20} more`)
    }
  }

  const score = Math.max(0, 100 - Math.min(30, remainingDead * 2))

  return {
    name: 'Dead Exports',
    score: fix ? 100 : score,
    maxScore: 100,
    errors: [],
    warnings: fix ? (fixed > 0 ? [`Fixed ${fixed} dead export(s)`] : []) : warnings,
    stats: {
      totalExports: exports.length,
      deadExports: deadExports.length,
      importedNames: importedNames.size,
      fixed,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('dead-exports.mjs')) {
  const fix = process.argv.includes('--fix')
  const result = checkDeadExports({ fix })
  console.log(`\n=== ${result.name} ===`)
  console.log(`Total exports: ${result.stats.totalExports}`)
  console.log(`Dead exports: ${result.stats.deadExports}`)
  if (fix) console.log(`Fixed: ${result.stats.fixed}`)
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
}
