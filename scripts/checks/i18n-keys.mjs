#!/usr/bin/env node
/**
 * Quality Gate Check: i18n Keys
 * Verifies that every t('key') call in source code has translations in FR/EN/ES/DE
 * Extends the logic of scripts/lint-i18n.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')
const LANG_DIR = join(ROOT, 'src', 'i18n', 'lang')
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
 * Extract translation keys from a lang file
 */
function extractTranslationKeys(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const keys = new Set()
  const keyRegex = /^\s+(\w+)\s*:/gm
  let match
  while ((match = keyRegex.exec(content)) !== null) {
    keys.add(match[1])
  }
  return keys
}

/**
 * Find all t('key') calls in source code
 */
function findUsedKeys(dir) {
  const keys = new Set()
  const files = getAllJsFiles(dir)

  for (const file of files) {
    if (file.includes('i18n/lang/') || file.includes('i18n/index.js')) continue
    const content = readFileSync(file, 'utf-8')
    // Match t('key'), t("key"), t('key', ...), t("key", ...)
    const regex = /\bt\(\s*['"](\w+)['"]/g
    let match
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1])
    }
  }
  return keys
}

export default function checkI18nKeys() {
  const languages = ['fr', 'en', 'es', 'de']
  const keysByLang = {}

  for (const lang of languages) {
    keysByLang[lang] = extractTranslationKeys(join(LANG_DIR, `${lang}.js`))
  }

  const refKeys = keysByLang.fr
  const usedKeys = findUsedKeys(SRC_PATH)

  const errors = []
  const warnings = []

  // Check cross-language consistency (FR as reference)
  let totalMissing = 0
  for (const lang of ['en', 'es', 'de']) {
    const langKeys = keysByLang[lang]
    const missing = [...refKeys].filter(k => !langKeys.has(k))
    if (missing.length > 0) {
      totalMissing += missing.length
      errors.push(`${lang.toUpperCase()}: ${missing.length} key(s) missing vs FR`)
      if (missing.length <= 5) {
        missing.forEach(k => errors.push(`  - ${k}`))
      } else {
        missing.slice(0, 5).forEach(k => errors.push(`  - ${k}`))
        errors.push(`  ... and ${missing.length - 5} more`)
      }
    }
  }

  // Check keys used in code but not in any translation
  const missingInTranslations = [...usedKeys].filter(k => !refKeys.has(k))
  if (missingInTranslations.length > 0) {
    warnings.push(`${missingInTranslations.length} key(s) used in code but not in FR translations:`)
    missingInTranslations.slice(0, 10).forEach(k => warnings.push(`  - ${k}`))
    if (missingInTranslations.length > 10) {
      warnings.push(`  ... and ${missingInTranslations.length - 10} more`)
    }
  }

  // Score: full marks if all langs consistent, deduct for missing keys
  const score = Math.max(0, 100 - (totalMissing > 0 ? 30 : 0) - (missingInTranslations.length > 0 ? 15 : 0))

  return {
    name: 'i18n Keys',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      frKeys: refKeys.size,
      enKeys: keysByLang.en.size,
      esKeys: keysByLang.es.size,
      deKeys: keysByLang.de.size,
      usedInCode: usedKeys.size,
      missingCrossLang: totalMissing,
      missingFromTranslations: missingInTranslations.length,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('i18n-keys.mjs')) {
  const result = checkI18nKeys()
  console.log(`\n=== ${result.name} ===`)
  console.log(`FR: ${result.stats.frKeys} | EN: ${result.stats.enKeys} | ES: ${result.stats.esKeys} | DE: ${result.stats.deKeys}`)
  console.log(`Used in code: ${result.stats.usedInCode}`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
