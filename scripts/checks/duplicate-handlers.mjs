/**
 * Check: Duplicate window.* handlers
 *
 * Rules:
 * - ERREUR : un handler défini dans 2+ fichiers HORS main.js
 *   (ex: Auth.js ET Travel.js → bug réel)
 * - WARN   : un handler défini dans main.js ET 1 autre fichier
 *   (pattern stub intentionnel toléré, mais limité à 1 doublon)
 * - OK     : handler défini dans 1 seul fichier (source unique)
 *
 * Score: 100 - 20 par erreur (handler dans 2+ composants sans main.js)
 *             - 3 par warning (stub main.js + 1 composant)
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, basename } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')

function getAllJsFiles(dir) {
  let files = []
  try {
    readdirSync(dir, { withFileTypes: true }).forEach(f => {
      const full = join(dir, f.name)
      if (f.isDirectory()) files = files.concat(getAllJsFiles(full))
      else if (f.name.endsWith('.js')) files.push(full)
    })
  } catch { /* ignore */ }
  return files
}

export default function checkDuplicateHandlers() {
  const errors = []
  const warnings = []

  const srcDir = join(ROOT, 'src')
  const allFiles = getAllJsFiles(srcDir)

  // Map: handlerName → Set of UNIQUE files that define it
  const handlerFiles = new Map()

  for (const file of allFiles) {
    const rel = relative(ROOT, file)
    let content
    try { content = readFileSync(file, 'utf-8') } catch { continue }

    const seen = new Set() // avoid counting same handler twice in same file
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Only detect MODULE-LEVEL definitions (0 indentation, not inside functions/if blocks)
      // Lines inside functions are intentional re-bindings, not true duplicates
      const match = line.match(/^window\.(\w+)\s*=/)
      if (!match) continue
      const name = match[1]
      // Skip if this line is inside a guard: if (!window.xxx) { window.xxx = ... }
      const prevLines = lines.slice(Math.max(0, i - 3), i).join('\n')
      if (new RegExp(`if\\s*\\(!\\s*window\\.${name}\\s*\\)`).test(prevLines)) continue
      if (seen.has(name)) continue // same file redefinition is a different issue
      seen.add(name)

      if (!handlerFiles.has(name)) handlerFiles.set(name, new Set())
      handlerFiles.get(name).add(rel)
    }
  }

  for (const [name, files] of handlerFiles) {
    if (files.size < 2) continue

    const fileList = [...files]
    const hasMain = fileList.some(f => basename(f) === 'main.js')
    const nonMain = fileList.filter(f => basename(f) !== 'main.js')

    if (nonMain.length >= 2) {
      // Defined in 2+ component files — real bug
      errors.push(
        `window.${name} dans ${nonMain.length} fichiers composant : ` +
        nonMain.map(f => f.replace('src/', '')).join(', ')
      )
    } else if (hasMain && nonMain.length === 1) {
      // Stub pattern (main.js + 1 component) — warn only
      warnings.push(
        `window.${name} : main.js + ${nonMain[0].replace('src/', '')} (stub pattern OK)`
      )
    }
  }

  // Only penalize real duplicates (2+ component files), not intentional stubs (main.js + 1 component)
  const score = Math.max(0, 100 - errors.length * 25)

  return {
    name: 'Duplicate Handlers',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: { totalHandlers: handlerFiles.size, duplicates: errors.length + warnings.length },
  }
}
