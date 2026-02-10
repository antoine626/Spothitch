#!/usr/bin/env node
/**
 * RGPD Audit Script
 * Detects localStorage/sessionStorage usage not registered in storageRegistry.js
 * Run: node scripts/audit-rgpd.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const SRC_PATH = join(import.meta.dirname, '..', 'src')
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

// Extract registered keys from storageRegistry.js
function getRegisteredKeys() {
  const content = readFileSync(REGISTRY_PATH, 'utf-8')
  const keys = new Set()
  const regex = /key:\s*['"]([^'"]+)['"]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1])
  }
  return keys
}

// Find all localStorage/sessionStorage usage in source
function findStorageUsage(dir) {
  const usages = []
  const files = getAllJsFiles(dir)

  for (const file of files) {
    if (file.includes('storageRegistry.js')) continue
    if (file.includes('storage.js') && file.includes('utils')) continue

    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, idx) => {
      // Match direct localStorage/sessionStorage setItem/getItem with spothitch_ prefix
      const setMatch = line.match(/localStorage\.setItem\(\s*['"]([^'"]+)['"]/)
      const getMatch = line.match(/localStorage\.getItem\(\s*['"]([^'"]+)['"]/)
      const removeMatch = line.match(/localStorage\.removeItem\(\s*['"]([^'"]+)['"]/)
      // sessionStorage is auto-cleared on browser close, no RGPD concern
      const matches = [setMatch, getMatch, removeMatch].filter(Boolean)
      for (const m of matches) {
        if (m[1].startsWith('spothitch_')) {
          usages.push({
            file: file.replace(SRC_PATH + '/', ''),
            line: idx + 1,
            key: m[1],
            type: line.includes('setItem') ? 'SET' : line.includes('removeItem') ? 'REMOVE' : 'GET'
          })
        }
      }
    })
  }

  return usages
}

// Main
const registeredKeys = getRegisteredKeys()
const usages = findStorageUsage(SRC_PATH)

// Find unique keys used directly
const directKeys = new Set(usages.map(u => u.key))
const unregistered = [...directKeys].filter(k => !registeredKeys.has(k))

console.log('=== RGPD Storage Audit ===\n')
console.log(`Registered keys in storageRegistry.js: ${registeredKeys.size}`)
console.log(`Direct localStorage usages found: ${usages.length}`)
console.log(`Unique direct keys: ${directKeys.size}`)
console.log()

if (unregistered.length > 0) {
  console.log(`--- UNREGISTERED KEYS (${unregistered.length}) ---`)
  console.log('These keys use localStorage directly but are NOT in storageRegistry.js:')
  for (const key of unregistered) {
    const files = usages.filter(u => u.key === key).map(u => `  ${u.file}:${u.line} (${u.type})`)
    console.log(`\n  ${key}:`)
    files.forEach(f => console.log(`    ${f}`))
  }
  console.log()
}

// Summary
if (unregistered.length === 0) {
  console.log('All localStorage keys are registered. RGPD compliant!')
  process.exit(0)
} else {
  console.log(`WARNING: ${unregistered.length} unregistered key(s) found.`)
  console.log('Add them to src/services/storageRegistry.js for RGPD compliance.')
  process.exit(1)
}
