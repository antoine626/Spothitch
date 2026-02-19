#!/usr/bin/env node
/**
 * i18n Lint Script
 * Compares translation keys between FR/EN/ES/DE and reports missing/extra keys
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const LANG_DIR = join(import.meta.dirname, '..', 'src', 'i18n', 'lang')
const SRC_PATH = join(import.meta.dirname, '..', 'src')

function extractTranslationKeys(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const keys = new Set()

  // Match key: 'value' or key: "value" patterns (top-level keys in the default export)
  const keyRegex = /^\s+(\w+)\s*:/gm
  let keyMatch
  while ((keyMatch = keyRegex.exec(content)) !== null) {
    keys.add(keyMatch[1])
  }

  return keys
}

function findUsedKeys(dir) {
  const keys = new Set()
  const files = getAllJsFiles(dir)

  for (const file of files) {
    if (file.includes('i18n/lang/') || file.includes('i18n/index.js')) continue
    const content = readFileSync(file, 'utf-8')
    const regex = /\bt\(\s*['"](\w+)['"]\s*\)/g
    let match
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1])
    }
  }
  return keys
}

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

// Main
const languages = ['fr', 'en', 'es', 'de']
const keysByLang = {}

for (const lang of languages) {
  keysByLang[lang] = extractTranslationKeys(join(LANG_DIR, `${lang}.js`))
}

const refKeys = keysByLang.fr
const usedKeys = findUsedKeys(SRC_PATH)

console.log('=== i18n Lint Report ===\n')
console.log(`Reference language (FR): ${refKeys.size} keys`)
for (const lang of ['en', 'es', 'de']) {
  console.log(`  ${lang.toUpperCase()}: ${keysByLang[lang].size} keys`)
}
console.log(`Keys used in source code: ${usedKeys.size} keys\n`)

let totalMissing = 0
for (const lang of languages) {
  if (lang === 'fr') continue

  const langKeys = keysByLang[lang]
  const missing = [...refKeys].filter(k => !langKeys.has(k))
  const extra = [...langKeys].filter(k => !refKeys.has(k))

  if (missing.length > 0 || extra.length > 0) {
    console.log(`--- ${lang.toUpperCase()} ---`)
  }

  if (missing.length > 0) {
    totalMissing += missing.length
    console.log(`  MISSING (${missing.length}):`)
    missing.forEach(k => console.log(`    - ${k}`))
  }

  if (extra.length > 0) {
    console.log(`  EXTRA (${extra.length}):`)
    extra.forEach(k => console.log(`    - ${k}`))
  }

  if (missing.length > 0 || extra.length > 0) console.log()
}

// Keys in code not in translations
const missingInTranslations = [...usedKeys].filter(k => !refKeys.has(k))
if (missingInTranslations.length > 0) {
  console.log(`--- Keys in code but NOT in any translation (${missingInTranslations.length}) ---`)
  missingInTranslations.slice(0, 20).forEach(k => console.log(`  - ${k}`))
  if (missingInTranslations.length > 20) console.log(`  ... and ${missingInTranslations.length - 20} more`)
  console.log()
}

// Summary
console.log('=== Summary ===')
console.log(`Total missing translations across EN/ES/DE: ${totalMissing}`)
if (totalMissing === 0) {
  console.log('All translation keys are consistent!')
}

process.exit(totalMissing > 0 ? 1 : 0)
