#!/usr/bin/env node
/**
 * Migration script: Font Awesome → Lucide (icon() helper)
 * Run: node scripts/migrate-icons.js
 *
 * This script:
 * 1. Replaces <i class="fas/fab/far fa-NAME ..."> with ${icon('NAME', 'CLASSES')}
 * 2. Adds import { icon } from '../utils/icons.js' where needed
 * 3. Handles fa-spin → animate-spin
 * 4. Maps text-* sizes to w-N h-N
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'
import { relative, dirname } from 'path'

const SIZE_MAP = {
  'text-xs': 'w-3 h-3',
  'text-sm': 'w-4 h-4',
  'text-base': 'w-5 h-5',
  'text-lg': 'w-5 h-5',
  'text-xl': 'w-6 h-6',
  'text-2xl': 'w-7 h-7',
  'text-3xl': 'w-8 h-8',
  'text-4xl': 'w-10 h-10',
}

// Regex to match <i class="fas/fab/far fa-NAME [CLASSES]" aria-hidden="true"></i>
// Handles both static and dynamic class patterns
const FA_STATIC = /<i\s+class="(?:fas|fab|far|fa)\s+fa-([\w-]+)([^"]*?)"\s*(?:aria-hidden="true")?\s*><\/i>/g
// Dynamic: <i class="fas ${var} CLASS" aria-hidden="true"></i>
const FA_DYNAMIC = /<i\s+class="(?:fas|fab|far|fa)\s+\$\{([^}]+)\}([^"]*?)"\s*(?:aria-hidden="true")?\s*><\/i>/g

function extractClasses(extraClasses) {
  const classes = extraClasses.trim().split(/\s+/).filter(Boolean)
  let sizeClass = 'w-5 h-5' // default
  const keepClasses = []

  for (const cls of classes) {
    if (SIZE_MAP[cls]) {
      sizeClass = SIZE_MAP[cls]
    } else if (cls === 'fa-spin') {
      keepClasses.push('animate-spin')
    } else if (cls === 'mr-1' || cls === 'mr-2' || cls === 'ml-1' || cls === 'ml-2' || cls === 'mr-1.5' || cls === 'ml-1.5') {
      // margin classes — we'll wrap in span
      keepClasses.push(cls)
    } else if (!cls.startsWith('fa-') && !cls.startsWith('fas') && !cls.startsWith('fab') && !cls.startsWith('far')) {
      keepClasses.push(cls)
    }
  }

  return { sizeClass, keepClasses }
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8')
  const original = content
  let changed = false
  let needsImport = false

  // Replace static FA icons
  content = content.replace(FA_STATIC, (match, iconName, extra) => {
    changed = true
    needsImport = true
    const { sizeClass, keepClasses } = extractClasses(extra)
    const allClasses = [sizeClass, ...keepClasses].join(' ')
    return `\${icon('${iconName}', '${allClasses}')}`
  })

  // Replace dynamic FA icons: <i class="fas ${expr} CLASS" ...></i>
  content = content.replace(FA_DYNAMIC, (match, expr, extra) => {
    changed = true
    needsImport = true
    const { sizeClass, keepClasses } = extractClasses(extra)
    const allClasses = [sizeClass, ...keepClasses].join(' ')
    return `\${icon(${expr}, '${allClasses}')}`
  })

  if (changed && needsImport) {
    // Add import if not already there
    if (!content.includes("from '../utils/icons.js'") &&
        !content.includes("from '../../utils/icons.js'") &&
        !content.includes("from '../utils/icons'") &&
        !content.includes("from '../../utils/icons'") &&
        !content.includes("from './utils/icons")) {

      // Determine relative path
      const rel = relative(dirname(filePath), 'src/utils')
      const importPath = rel ? `${rel.replace(/\\/g, '/')}/icons.js` : './icons.js'
      const normalizedPath = importPath.startsWith('.') ? importPath : `./${importPath}`

      // Find first import line and add after it
      const importMatch = content.match(/^(import\s+.*\n)/m)
      if (importMatch) {
        const insertPos = content.lastIndexOf(importMatch[0]) + importMatch[0].length
        // Find last import block
        const lines = content.split('\n')
        let lastImportLine = -1
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/^import\s/)) lastImportLine = i
        }
        if (lastImportLine >= 0) {
          lines.splice(lastImportLine + 1, 0, `import { icon } from '${normalizedPath}'`)
          content = lines.join('\n')
        }
      } else {
        // No existing imports, add at top after any comments
        content = `import { icon } from '${normalizedPath}'\n\n${content}`
      }
    }
  }

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8')
    return true
  }
  return false
}

// Run
const files = glob.sync('src/**/*.js')
let count = 0
for (const f of files) {
  if (f.includes('utils/icons.js')) continue // skip our own file
  if (processFile(f)) {
    count++
    console.log(`  ✓ ${f}`)
  }
}
console.log(`\nMigrated ${count} files.`)
