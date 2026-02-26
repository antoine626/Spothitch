#!/usr/bin/env node
/**
 * Quality Gate Check: Import Cycles
 * Detects circular imports in src/ using DFS.
 * Circular imports cause undefined values at load time.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative, resolve, dirname } from 'path'

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

function getImports(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const imports = []
  // Static imports: import { x } from './path'
  const importRegex = /import\s+(?:[\s\S]*?)\s+from\s+['"](\.[^'"]+)['"]/g
  let match
  while ((match = importRegex.exec(content)) !== null) {
    const resolved = resolveImport(filePath, match[1])
    if (resolved) imports.push(resolved)
  }
  return imports
}

function resolveImport(fromFile, importPath) {
  const dir = dirname(fromFile)
  let resolved = resolve(dir, importPath)

  // Try exact path
  if (existsFile(resolved)) return resolved
  // Try .js extension
  if (existsFile(resolved + '.js')) return resolved + '.js'
  // Try index.js
  if (existsFile(join(resolved, 'index.js'))) return join(resolved, 'index.js')

  return null
}

function existsFile(p) {
  try {
    return statSync(p).isFile()
  } catch {
    return false
  }
}

function findCycles(files) {
  const graph = new Map()

  // Build adjacency list
  for (const file of files) {
    const imports = getImports(file)
    graph.set(file, imports.filter(i => files.includes(i)))
  }

  const cycles = []
  const visited = new Set()
  const inStack = new Set()

  function dfs(node, path) {
    if (inStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node)
      const cycle = path.slice(cycleStart).map(f => relative(SRC_PATH, f))
      cycles.push(cycle)
      return
    }
    if (visited.has(node)) return

    visited.add(node)
    inStack.add(node)
    path.push(node)

    for (const neighbor of (graph.get(node) || [])) {
      dfs(neighbor, [...path])
    }

    inStack.delete(node)
  }

  for (const file of files) {
    if (!visited.has(file)) {
      dfs(file, [])
    }
  }

  // Deduplicate cycles (same cycle can be found starting from different nodes)
  const unique = new Map()
  for (const cycle of cycles) {
    const key = [...cycle].sort().join('|')
    if (!unique.has(key)) {
      unique.set(key, cycle)
    }
  }

  return [...unique.values()]
}

export default function checkImportCycles(opts = {}) {
  const files = getAllJsFiles(SRC_PATH)
  const cycles = findCycles(files)
  const errors = []
  const warnings = []

  for (const cycle of cycles) {
    if (cycle.length === 2) {
      // Direct circular import — serious
      errors.push(`Circular: ${cycle.join(' → ')} → ${cycle[0]}`)
    } else {
      // Indirect cycle — warning
      warnings.push(`Cycle (${cycle.length} files): ${cycle.join(' → ')} → ${cycle[0]}`)
    }
  }

  const score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))

  return {
    name: 'Import Cycles',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      filesScanned: files.length,
      directCycles: errors.length,
      indirectCycles: warnings.length,
    },
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('import-cycles.mjs')) {
  const result = checkImportCycles()
  console.log(`\n=== ${result.name} ===`)
  console.log(`Scanned ${result.stats.filesScanned} files`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
