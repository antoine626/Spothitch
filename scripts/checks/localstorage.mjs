#!/usr/bin/env node
/**
 * Quality Gate Check: localStorage RGPD Compliance
 * Verifies all localStorage keys are registered in storageRegistry.js
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')
const SRC_PATH = join(ROOT, 'src')
const REGISTRY_PATH = join(SRC_PATH, 'services', 'storageRegistry.js')

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
 * Extract registered keys from storageRegistry.js
 */
function getRegisteredKeys() {
  try {
    const content = readFileSync(REGISTRY_PATH, 'utf-8')
    const keys = new Set()
    const regex = /key:\s*['"]([^'"]+)['"]/g
    let match
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1])
    }
    return keys
  } catch {
    return new Set()
  }
}

/**
 * Find all localStorage key usages in source
 */
function findStorageKeys(dir) {
  const keys = new Map() // key -> [{ file, line, type }]
  const files = getAllJsFiles(dir)

  for (const file of files) {
    if (file.includes('storageRegistry.js')) continue
    if (file.includes('storage.js') && file.includes('utils')) continue

    const relPath = relative(SRC_PATH, file)
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const patterns = [
        /localStorage\.setItem\(\s*['"]([^'"]+)['"]/,
        /localStorage\.getItem\(\s*['"]([^'"]+)['"]/,
        /localStorage\.removeItem\(\s*['"]([^'"]+)['"]/,
      ]
      for (const pattern of patterns) {
        const match = line.match(pattern)
        if (match && match[1].startsWith('spothitch_')) {
          if (!keys.has(match[1])) keys.set(match[1], [])
          keys.get(match[1]).push({ file: relPath, line: i + 1 })
        }
      }
    }
  }

  return keys
}

export default function checkLocalStorage(opts = {}) {
  const registeredKeys = getRegisteredKeys()
  const usedKeys = findStorageKeys(SRC_PATH)

  const unregistered = [...usedKeys.keys()].filter(k => !registeredKeys.has(k))

  const errors = []
  const warnings = []

  if (unregistered.length > 0) {
    errors.push(`${unregistered.length} localStorage key(s) NOT registered in storageRegistry.js:`)
    unregistered.forEach(k => {
      const locations = usedKeys.get(k)
      errors.push(`  - ${k} (used in ${locations.map(l => `${l.file}:${l.line}`).join(', ')})`)
    })
  }

  // Check for registered keys no longer used
  const unusedRegistered = [...registeredKeys].filter(k => !usedKeys.has(k))
  if (unusedRegistered.length > 0) {
    warnings.push(`${unusedRegistered.length} key(s) registered but not found in source (may be used dynamically):`)
    unusedRegistered.slice(0, 10).forEach(k => warnings.push(`  - ${k}`))
  }

  const score = Math.max(0, 100 - (unregistered.length * 25))

  return {
    name: 'localStorage RGPD',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      registeredKeys: registeredKeys.size,
      usedKeys: usedKeys.size,
      unregistered: unregistered.length,
      unusedRegistered: unusedRegistered.length,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('localstorage.mjs')) {
  const result = checkLocalStorage()
  console.log(`\n=== ${result.name} ===`)
  console.log(`Registered: ${result.stats.registeredKeys} | Used: ${result.stats.usedKeys}`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
