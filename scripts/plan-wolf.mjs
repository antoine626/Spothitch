#!/usr/bin/env node
/**
 * PLAN WOLF v4 — L'Equipe QA Autonome
 *
 * Un gardien intelligent qui teste CHAQUE bouton, compare avec la
 * concurrence, apprend de ses erreurs, et evolue continuellement.
 * Il travaille comme une equipe entiere de testeurs QA.
 *
 * 16 phases :
 *   1. Code Quality       — ESLint, i18n, RGPD
 *   2. Unit Tests         — Vitest (wiring, integration, all)
 *   3. Build              — Vite build + bundle size + chunks
 *   4. Impact Analysis    — git diff, 2x attention fichiers modifies depuis dernier run
 *   5. Feature Inventory  — features.md vs code reel, verification profonde
 *   6. Regression Guard   — re-teste chaque bug, ALL duplicate handlers
 *   7. Wiring Integrity   — handlers morts, onclick verification, modales
 *   8. Button & Link Audit— CHAQUE bouton, lien, modal, placeholder teste
 *   9. Dead Code          — unused functions, exports, TODO/FIXME, placeholders
 *  10. Multi-Level Audit  — perf, SEO, a11y, securite, legal, images, npm audit
 *  11. Lighthouse         — performance, accessibility, SEO, best practices
 *  12. Screenshots        — Playwright visual regression
 *  13. Feature Scores     — score par feature (carte, social, profil...)
 *  14. Competitive Intel  — recherche web par domaine, comparaison concurrents
 *  15. Score /100         — auto-evaluation + comparaison run precedent
 *  16. Recommendations    — conseils par phase, par feature, evolution
 *
 * Usage:
 *   node scripts/plan-wolf.mjs           # Full run (~12 min)
 *   node scripts/plan-wolf.mjs --quick   # Skip Lighthouse, Screenshots, Web Search
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, resolve, relative, basename } from 'path'

const ROOT = resolve(process.cwd())
const MEMORY_PATH = join(ROOT, 'wolf-memory.json')
const FEATURES_PATH = join(ROOT, 'memory', 'features.md')
const isQuick = process.argv.includes('--quick')
const start = Date.now()

// ═══════════════════════════════════════════════════════════════
// WOLF MEMORY — persistent brain across runs
// ═══════════════════════════════════════════════════════════════

function loadMemory() {
  if (existsSync(MEMORY_PATH)) {
    try {
      return JSON.parse(readFileSync(MEMORY_PATH, 'utf-8'))
    } catch { /* corrupted, start fresh */ }
  }
  return {
    version: 4,
    runs: [],
    errors: [],
    patterns: [],
    recommendations: [],
    featureBaseline: null,
    dependencyGraph: null,
  }
}

function saveMemory(memory) {
  writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2))
}

const memory = loadMemory()

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

const phases = []
let totalScore = 0
let maxScore = 0

function phase(name, score, max, findings, details = []) {
  phases.push({ name, score, max, findings, details })
  totalScore += score
  maxScore += max
}

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      timeout: opts.timeout || 120000,
      cwd: ROOT,
      stdio: opts.stdio || 'pipe',
      ...opts,
    }).trim()
  } catch (e) {
    if (opts.allowFail) return e.stdout?.trim?.() || ''
    throw e
  }
}

function execOk(cmd, timeout = 120000) {
  try {
    execSync(cmd, { encoding: 'utf-8', timeout, cwd: ROOT, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function readFile(path) {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

function getAllJsFiles(dir) {
  const files = []
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
        walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(full)
      }
    }
  }
  walk(dir)
  return files
}

function log(msg) { console.log(msg) }
function header(n, title) {
  log(`\n${'='.repeat(60)}`)
  log(`  PHASE ${n} — ${title}`)
  log('='.repeat(60))
}

/**
 * Web search via DuckDuckGo (curl-based, synchronous)
 * Returns { snippets: string[], titles: string[] }
 */
function webSearch(query) {
  try {
    const encoded = encodeURIComponent(query)
    const html = exec(
      `curl -s -L -m 10 -A "Mozilla/5.0 (compatible; WolfBot/1.0)" "https://html.duckduckgo.com/html/?q=${encoded}"`,
      { allowFail: true, timeout: 15000 }
    )
    if (!html || html.length < 100) return { snippets: [], titles: [] }
    const snippets = []
    const titles = []
    const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    let match
    while ((match = snippetRegex.exec(html)) && snippets.length < 8) {
      const clean = match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim()
      if (clean.length > 20) snippets.push(clean)
    }
    const titleRegex = /class="result__a"[^>]*>([\s\S]*?)<\/a>/g
    while ((match = titleRegex.exec(html)) && titles.length < 8) {
      const clean = match[1].replace(/<[^>]+>/g, '').trim()
      if (clean.length > 5) titles.push(clean)
    }
    return { snippets, titles }
  } catch {
    return { snippets: [], titles: [] }
  }
}

/**
 * Extract potential feature keywords from search result snippets
 */
function extractFeatureKeywords(snippets) {
  const text = snippets.join(' ').toLowerCase()
  const keywords = []
  const patterns = [
    /(?:feature|support|include|offer|provide|enable|allow)s?\s+(\w+[\s\w]{3,25})/g,
    /(\w+[\s\w]{3,20})\s+(?:feature|mode|option|tool|system)/g,
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) && keywords.length < 20) {
      const kw = match[1].trim().replace(/[.,;:!?]$/, '')
      if (kw.length > 3 && kw.length < 30 && !keywords.includes(kw)) {
        keywords.push(kw)
      }
    }
  }
  return keywords
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1: CODE QUALITY
// ═══════════════════════════════════════════════════════════════

function phase1_codeQuality() {
  header(1, 'CODE QUALITY')
  let score = 0
  const max = 15
  const findings = []
  const details = []

  // ESLint
  const eslintOk = execOk('npx eslint src/ --max-warnings=0')
  if (eslintOk) {
    score += 5
    findings.push('ESLint: 0 erreurs')
  } else {
    const out = exec('npx eslint src/ --format=compact 2>&1 || true', { allowFail: true })
    const errorCount = (out.match(/\d+ error/g) || []).length
    const warnCount = (out.match(/\d+ warning/g) || []).length
    if (errorCount === 0) score += 3 // warnings only
    findings.push(`ESLint: ${errorCount} erreurs, ${warnCount} warnings`)
    details.push('Lancer npx eslint src/ --fix pour corriger automatiquement')
  }

  // i18n lint
  const i18nOk = execOk('node scripts/lint-i18n.mjs')
  if (i18nOk) {
    score += 5
    findings.push('i18n: 4 langues completes')
  } else {
    score += 2
    findings.push('i18n: traductions manquantes detectees')
    details.push('Lancer node scripts/lint-i18n.mjs pour voir les cles manquantes')
  }

  // RGPD audit
  const rgpdOk = execOk('node scripts/audit-rgpd.mjs')
  if (rgpdOk) {
    score += 5
    findings.push('RGPD: conforme')
  } else {
    score += 1
    findings.push('RGPD: cles localStorage non enregistrees')
    details.push('Lancer node scripts/audit-rgpd.mjs pour voir les cles manquantes')
  }

  log(`  Score: ${score}/${max}`)
  phase('Code Quality', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: UNIT TESTS
// ═══════════════════════════════════════════════════════════════

function phase2_unitTests() {
  header(2, 'UNIT TESTS')
  let score = 0
  const max = 20
  const findings = []
  const details = []

  // Wiring tests
  if (execOk('npx vitest run tests/wiring/', 180000)) {
    score += 7
    findings.push('Wiring tests: PASS')
  } else {
    findings.push('Wiring tests: FAIL')
    details.push('Des handlers ou modal flags sont casses')
  }

  // Integration tests
  if (execOk('npx vitest run tests/integration/modals.test.js', 180000)) {
    score += 6
    findings.push('Integration tests: PASS')
  } else {
    score += 2
    findings.push('Integration tests: FAIL')
    details.push('Des modales ne rendent pas correctement')
  }

  // All tests
  const testOut = exec('npx vitest run 2>&1 || true', { allowFail: true, timeout: 300000 })
  const passMatch = testOut.match(/(\d+) passed/)
  const failMatch = testOut.match(/(\d+) failed/)
  const passed = passMatch ? parseInt(passMatch[1]) : 0
  const failed = failMatch ? parseInt(failMatch[1]) : 0

  if (failed === 0 && passed > 0) {
    score += 7
    findings.push(`Tous les tests: ${passed} PASS, 0 FAIL`)
  } else if (failed > 0) {
    score += Math.max(0, 7 - failed)
    findings.push(`Tests: ${passed} pass, ${failed} FAIL`)
    details.push(`${failed} tests echouent — corriger en priorite`)
  } else {
    findings.push('Tests: impossible de lire les resultats')
  }

  log(`  Score: ${score}/${max}`)
  phase('Unit Tests', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3: BUILD + BUNDLE SIZE
// ═══════════════════════════════════════════════════════════════

function phase3_build() {
  header(3, 'BUILD')
  let score = 0
  const max = 15
  const findings = []
  const details = []

  if (execOk('npm run build', 300000)) {
    score += 10
    findings.push('Build production: OK')

    // Bundle size check
    try {
      const distAssets = join(ROOT, 'dist', 'assets')
      const jsFiles = readdirSync(distAssets).filter(f => f.startsWith('index-') && f.endsWith('.js'))
      if (jsFiles.length > 0) {
        const size = statSync(join(distAssets, jsFiles[0])).size
        const kb = Math.round(size / 1024)
        if (kb <= 750) {
          score += 5
          findings.push(`Bundle: ${kb}KB (< 750KB)`)
        } else {
          score += 2
          findings.push(`Bundle: ${kb}KB (> 750KB LIMITE!)`)
          details.push(`Le bundle principal depasse 750KB — optimiser les imports`)
        }

        // Chunk breakdown — find biggest chunks
        const allChunks = readdirSync(distAssets)
          .filter(f => f.endsWith('.js'))
          .map(f => ({ name: f, size: Math.round(statSync(join(distAssets, f)).size / 1024) }))
          .sort((a, b) => b.size - a.size)
        if (allChunks.length > 1) {
          const top3 = allChunks.slice(0, 3)
          findings.push(`Top chunks: ${top3.map(c => `${c.name.replace(/-.+\.js$/, '')}(${c.size}KB)`).join(', ')}`)
          // Flag chunks over 300KB
          const bigChunks = allChunks.filter(c => c.size > 300)
          if (bigChunks.length > 0) {
            for (const c of bigChunks) {
              details.push(`Chunk trop gros: ${c.name} (${c.size}KB > 300KB) — verifier les imports`)
            }
          }
        }

        // Track trend
        const lastRun = memory.runs[memory.runs.length - 1]
        if (lastRun?.bundleSize) {
          const diff = kb - lastRun.bundleSize
          if (diff > 20) {
            details.push(`Bundle a grossi de +${diff}KB depuis le dernier run`)
          } else if (diff < -10) {
            findings.push(`Bundle reduit de ${Math.abs(diff)}KB`)
          }
        }
        // Store for next run
        memory._currentBundleSize = kb
      }
    } catch {
      findings.push('Bundle size: impossible a mesurer')
    }
  } else {
    findings.push('Build production: ECHEC')
    details.push('Le build ne compile pas — corriger immediatement')
  }

  log(`  Score: ${score}/${max}`)
  phase('Build', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4: IMPACT ANALYSIS
// ═══════════════════════════════════════════════════════════════

function phase4_impactAnalysis() {
  header(4, 'IMPACT ANALYSIS')
  let score = 0
  const max = 10
  const findings = []
  const details = []

  // Build dependency graph
  const srcDir = join(ROOT, 'src')
  const allFiles = getAllJsFiles(srcDir)
  const deps = {} // file → [files it imports]
  const reverseDeps = {} // file → [files that import it]

  for (const file of allFiles) {
    const rel = relative(ROOT, file)
    deps[rel] = []
    const content = readFile(file)
    const importRegex = /import\s+.*?from\s+['"](\..*?)['"]/g
    let match
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]
      // Resolve relative import
      const dir = join(file, '..')
      let resolved = resolve(dir, importPath)
      if (!resolved.endsWith('.js')) resolved += '.js'
      const resolvedRel = relative(ROOT, resolved)
      if (existsSync(resolved)) {
        deps[rel].push(resolvedRel)
        if (!reverseDeps[resolvedRel]) reverseDeps[resolvedRel] = []
        reverseDeps[resolvedRel].push(rel)
      }
    }
  }

  // Save graph for future use
  memory.dependencyGraph = {
    totalFiles: allFiles.length,
    totalLinks: Object.values(deps).reduce((s, d) => s + d.length, 0),
    updatedAt: new Date().toISOString(),
  }

  // --- Circular import detection ---
  const cycles = []
  function findCycles(node, path, visited) {
    if (path.includes(node)) {
      const cycle = path.slice(path.indexOf(node))
      if (cycle.length >= 2) cycles.push(cycle)
      return
    }
    if (visited.has(node)) return
    visited.add(node)
    for (const dep of (deps[node] || [])) {
      findCycles(dep, [...path, node], visited)
    }
  }
  const cycleVisited = new Set()
  for (const file of Object.keys(deps)) {
    findCycles(file, [], cycleVisited)
  }
  const uniqueCycles = []
  const seenCycleKeys = new Set()
  for (const c of cycles) {
    const key = [...c].sort().join('|')
    if (!seenCycleKeys.has(key)) {
      seenCycleKeys.add(key)
      uniqueCycles.push(c)
    }
  }
  if (uniqueCycles.length > 0) {
    findings.push(`Imports circulaires: ${uniqueCycles.length} cycle(s) detecte(s)`)
    for (const c of uniqueCycles.slice(0, 5)) {
      details.push(`Cycle: ${c.map(f => basename(f, '.js')).join(' -> ')} -> ${basename(c[0], '.js')}`)
    }
    if (uniqueCycles.length > 5) details.push(`... et ${uniqueCycles.length - 5} autres cycles`)
  } else {
    findings.push('0 imports circulaires')
  }

  // Get changed files since LAST WOLF RUN (not just last commit) for 2x attention
  let changedFiles = []
  const lastRunCommit = memory.lastRunCommit || null
  try {
    let diffCmd
    if (lastRunCommit) {
      diffCmd = `git diff --name-only ${lastRunCommit}..HEAD 2>/dev/null || git diff --name-only HEAD~1`
    } else {
      diffCmd = 'git diff --name-only HEAD~1 2>/dev/null || git diff --name-only HEAD'
    }
    const diff = exec(diffCmd, { allowFail: true })
    changedFiles = diff.split('\n').filter(f => f.endsWith('.js') && f.startsWith('src/'))
  } catch {
    changedFiles = []
  }
  // Store current commit for next run
  try { memory.lastRunCommit = exec('git rev-parse HEAD', { allowFail: true }) } catch { /* ignore */ }

  if (changedFiles.length === 0) {
    score += 10
    findings.push('Aucun fichier src/ modifie depuis le dernier commit')
    phase('Impact Analysis', score, max, findings, details)
    return { deps, reverseDeps }
  }

  findings.push(`${changedFiles.length} fichier(s) modifie(s)`)

  // Trace impact
  const affected = new Set()
  const queue = [...changedFiles]
  const visited = new Set()

  while (queue.length > 0) {
    const file = queue.shift()
    if (visited.has(file)) continue
    visited.add(file)
    affected.add(file)
    // Who imports this file?
    const importers = reverseDeps[file] || []
    for (const imp of importers) {
      if (!visited.has(imp)) queue.push(imp)
    }
  }

  const impactedFeatures = new Set()
  for (const f of affected) {
    if (f.includes('modals/')) impactedFeatures.add(`Modal: ${basename(f, '.js')}`)
    if (f.includes('views/')) impactedFeatures.add(`View: ${basename(f, '.js')}`)
    if (f.includes('services/')) impactedFeatures.add(`Service: ${basename(f, '.js')}`)
    if (f.includes('stores/')) impactedFeatures.add('State Management')
    if (f.includes('i18n/')) impactedFeatures.add('Internationalization')
    if (f.includes('main.js')) impactedFeatures.add('App Entry Point (CRITICAL)')
    if (f.includes('App.js')) impactedFeatures.add('App Component (CRITICAL)')
  }

  // Categorize risk
  const criticalFiles = ['src/main.js', 'src/stores/state.js', 'src/components/App.js', 'src/i18n/index.js']
  const touchedCritical = changedFiles.filter(f => criticalFiles.includes(f))

  if (touchedCritical.length > 0) {
    score += 3
    findings.push(`ATTENTION: fichier(s) critique(s) modifie(s): ${touchedCritical.join(', ')}`)
    details.push(`${touchedCritical.join(', ')} affecte potentiellement ${affected.size} fichiers`)
    details.push('Tester TOUT apres modification de fichiers critiques')
  } else if (affected.size > 20) {
    score += 5
    findings.push(`Impact moyen: ${affected.size} fichiers potentiellement affectes`)
  } else {
    score += 8
    findings.push(`Impact faible: ${affected.size} fichiers affectes`)
  }

  if (impactedFeatures.size > 0) {
    findings.push(`Features impactees: ${[...impactedFeatures].join(', ')}`)
  }

  // Check if changed files have tests
  let untestedChanges = 0
  for (const f of changedFiles) {
    const name = basename(f, '.js')
    const hasTest = existsSync(join(ROOT, 'tests', `${name}.test.js`))
      || existsSync(join(ROOT, 'tests', 'wiring', `${name}.test.js`))
      || existsSync(join(ROOT, 'tests', 'integration', `${name}.test.js`))
    if (!hasTest) untestedChanges++
  }

  if (untestedChanges > 0) {
    score = Math.max(score - 2, 0)
    details.push(`${untestedChanges} fichier(s) modifie(s) sans test unitaire correspondant`)
  }

  // === 2x ATTENTION: Deep scan of every changed file ===
  if (changedFiles.length > 0) {
    log('  --- 2x ATTENTION sur fichiers modifies ---')
    let deepIssues = 0

    for (const f of changedFiles) {
      const fullPath = join(ROOT, f)
      if (!existsSync(fullPath)) continue
      const content = readFile(fullPath)
      const fileName = basename(f, '.js')
      const fileIssues = []

      // 1. Check for TODO/FIXME/HACK in changed files
      const todos = content.match(/(TODO|FIXME|HACK|XXX)[\s:]/g) || []
      if (todos.length > 0) fileIssues.push(`${todos.length} TODO/FIXME`)

      // 2. Check all onclick handlers in this file point to real functions
      const jsKw = new Set(['if', 'for', 'while', 'return', 'switch', 'case', 'var', 'let', 'const', 'new', 'this', 'event', 'true', 'false', 'null', 'document', 'window', 'console', 'alert', 'confirm', 'prompt'])
      const onclickRefs = (content.match(/onclick="(\w+)\(/g) || []).map(m => m.replace('onclick="', '').replace('(', '')).filter(fn => !jsKw.has(fn))
      const windowHandlersInFile = (content.match(/window\.(\w+)\s*=/g) || []).map(h => h.replace('window.', '').replace(/\s*=$/, ''))
      const allSrcFilesForCheck = getAllJsFiles(join(ROOT, 'src'))
      const globalHandlers = new Set()
      for (const sf of allSrcFilesForCheck) {
        const sc = readFile(sf)
        const hs = (sc.match(/window\.(\w+)\s*=/g) || []).map(h => h.replace('window.', '').replace(/\s*=$/, ''))
        for (const h of hs) globalHandlers.add(h)
      }
      const brokenOnclicks = onclickRefs.filter(fn => !globalHandlers.has(fn))
      if (brokenOnclicks.length > 0) fileIssues.push(`onclick casses: ${brokenOnclicks.join(', ')}`)

      // 3. Check for i18n hardcoded strings (French text in templates not using t())
      const frenchInTemplate = content.match(/>\s*(Le|La|Les|Un|Une|Des|Ce|Cette|Pour|Avec|Dans|Sur|Par)\s+\w+/g) || []
      const hardcodedCount = frenchInTemplate.filter(m => !m.includes("t('") && !m.includes('t("')).length
      if (hardcodedCount > 5) fileIssues.push(`${hardcodedCount} textes FR potentiellement non-traduits`)

      // 4. Check file size change (if file grew more than 50%)
      const lines = content.split('\n').length
      if (lines > 500) fileIssues.push(`fichier long (${lines} lignes) — verifier la lisibilite`)

      // 5. Check for empty function bodies
      const emptyFns = content.match(/(?:function\s+\w+\s*\([^)]*\)\s*\{\s*\})|(?:\w+\s*=\s*(?:\([^)]*\)|[^=])\s*=>\s*\{\s*\})/g) || []
      if (emptyFns.length > 0) fileIssues.push(`${emptyFns.length} fonction(s) vide(s)`)

      if (fileIssues.length > 0) {
        deepIssues += fileIssues.length
        details.push(`[2x] ${f}: ${fileIssues.join(', ')}`)
      }
    }

    if (deepIssues === 0) {
      findings.push(`2x scan approfondi: ${changedFiles.length} fichiers modifies — aucun probleme`)
    } else {
      findings.push(`2x scan approfondi: ${deepIssues} probleme(s) dans ${changedFiles.length} fichiers modifies`)
      score = Math.max(0, score - Math.min(3, Math.ceil(deepIssues / 5)))
    }
  }

  log(`  Score: ${score}/${max}`)
  phase('Impact Analysis', score, max, findings, details)
  return { deps, reverseDeps }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5: FEATURE INVENTORY
// ═══════════════════════════════════════════════════════════════

function phase5_featureInventory() {
  header(5, 'FEATURE INVENTORY')
  let score = 0
  const max = 15
  const findings = []
  const details = []

  if (!existsSync(FEATURES_PATH)) {
    findings.push('features.md introuvable — impossible de verifier les features')
    phase('Feature Inventory', 0, max, findings, details)
    return
  }

  const featuresContent = readFile(FEATURES_PATH)

  // Parse checked features from features.md
  const checkedFeatures = []
  const uncheckedFeatures = []
  for (const line of featuresContent.split('\n')) {
    const checkedMatch = line.match(/^- \[x\]\s+(.+)/)
    const uncheckedMatch = line.match(/^- \[ \]\s+(.+)/)
    if (checkedMatch) checkedFeatures.push(checkedMatch[1].trim())
    if (uncheckedMatch) uncheckedFeatures.push(uncheckedMatch[1].trim())
  }

  findings.push(`features.md: ${checkedFeatures.length} features marquees done, ${uncheckedFeatures.length} en attente`)

  // Check modals exist
  const modalsDir = join(ROOT, 'src', 'components', 'modals')
  const existingModals = existsSync(modalsDir) ? readdirSync(modalsDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', '')) : []

  // Check services exist
  const servicesDir = join(ROOT, 'src', 'services')
  const existingServices = existsSync(servicesDir) ? readdirSync(servicesDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', '')) : []

  // Check views exist
  const viewsDir = join(ROOT, 'src', 'components', 'views')
  const existingViews = existsSync(viewsDir) ? readdirSync(viewsDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', '')) : []

  findings.push(`Code: ${existingModals.length} modales, ${existingServices.length} services, ${existingViews.length} vues`)

  // Verify key features have corresponding code
  const featureChecks = [
    { name: 'SOS Mode', files: ['SOS.js'], dir: modalsDir },
    { name: 'Companion', files: ['Companion.js'], dir: modalsDir },
    { name: 'Auth', files: ['Auth.js'], dir: modalsDir },
    { name: 'AddSpot', files: ['AddSpot.js'], dir: modalsDir },
    { name: 'SpotDetail', files: ['SpotDetail.js'], dir: modalsDir },
    { name: 'Quiz', files: ['Quiz.js'], dir: modalsDir },
    { name: 'CheckinModal', files: ['CheckinModal.js'], dir: modalsDir },
    { name: 'ValidateSpot', files: ['ValidateSpot.js'], dir: modalsDir },
    { name: 'Tutorial', files: ['Tutorial.js'], dir: modalsDir },
    { name: 'Welcome', files: ['Welcome.js'], dir: modalsDir },
    { name: 'Gamification', files: ['gamification.js'], dir: servicesDir },
    { name: 'Firebase', files: ['firebase.js'], dir: servicesDir },
    { name: 'Notifications', files: ['notifications.js'], dir: servicesDir },
    { name: 'SpotLoader', files: ['spotLoader.js'], dir: servicesDir },
    { name: 'Chat', files: ['Conversations.js'], dir: join(ROOT, 'src', 'components', 'views', 'social') },
    { name: 'Friends', files: ['Friends.js'], dir: join(ROOT, 'src', 'components', 'views', 'social') },
    { name: 'Feed', files: ['Feed.js'], dir: join(ROOT, 'src', 'components', 'views', 'social') },
    { name: 'Moderation', files: ['moderation.js'], dir: servicesDir },
    { name: 'UserBlocking', files: ['userBlocking.js'], dir: servicesDir },
    { name: 'Verification', files: ['verification.js'], dir: servicesDir },
    { name: 'TripPlanner', files: ['osrm.js'], dir: servicesDir },
    { name: 'Offline', files: ['offline.js'], dir: servicesDir },
    { name: 'SEO', files: ['seo.js'], dir: join(ROOT, 'src', 'utils') },
    { name: 'Accessibility', files: ['a11y.js'], dir: join(ROOT, 'src', 'utils') },
  ]

  let present = 0
  let missing = 0
  for (const check of featureChecks) {
    const exists = check.files.every(f => existsSync(join(check.dir, f)))
    if (exists) {
      present++
    } else {
      missing++
      details.push(`Feature "${check.name}" : fichier manquant (${check.files.join(', ')})`)
    }
  }

  findings.push(`Verification: ${present}/${featureChecks.length} features critiques ont leur code`)

  if (missing === 0) score += 10
  else if (missing <= 2) score += 7
  else score += 3

  // Check for dead services (imported/referenced by nobody in the full src/ tree)
  const allSrc = getAllJsFiles(join(ROOT, 'src'))
  const allSrcContentCached = {}
  for (const f of allSrc) allSrcContentCached[f] = readFile(f)

  const deadServices = []
  for (const svc of existingServices) {
    const svcFile = join(servicesDir, svc + '.js')
    const importedAnywhere = allSrc.some(f => {
      if (f === svcFile) return false // don't check self
      const c = allSrcContentCached[f]
      // Check all possible import/reference patterns
      return c.includes(`/${svc}'`) || c.includes(`/${svc}"`)
        || c.includes(`/${svc}.js'`) || c.includes(`/${svc}.js"`)
        || c.includes(`'${svc}'`) || c.includes(`"${svc}"`)
        || c.includes(`${svc}.js`) || c.includes(`services/${svc}`)
    })
    // Also check main.js for dynamic imports like import('./services/xxx.js')
    if (!importedAnywhere) {
      const mainJS = readFile(join(ROOT, 'src', 'main.js'))
      const dynamicallyImported = mainJS.includes(svc)
      if (dynamicallyImported) continue
    }
    if (!importedAnywhere) {
      deadServices.push(svc)
    }
  }

  if (deadServices.length > 0) {
    findings.push(`${deadServices.length} service(s) orphelin(s) (jamais importe): ${deadServices.slice(0, 8).join(', ')}${deadServices.length > 8 ? '...' : ''}`)
    details.push(`${deadServices.length} services orphelins = code mort ou bouton UI manquant`)
    score += 2
  } else {
    score += 5
    findings.push('0 services orphelins')
  }

  // --- Memory accuracy: verify numbers in features.md vs reality ---
  let memoryAccurate = true

  // Check city page count
  const distCityDir = join(ROOT, 'dist', 'hitchhiking')
  if (existsSync(distCityDir)) {
    let realCityCount = 0
    try {
      for (const country of readdirSync(distCityDir)) {
        const cDir = join(distCityDir, country)
        if (statSync(cDir).isDirectory()) {
          realCityCount += readdirSync(cDir).filter(f => f.endsWith('.html')).length
        }
      }
    } catch { /* ignore */ }

    // Check what features.md says
    const cityMatch = featuresContent.match(/(\d+)\s*villes?\s*auto/)
    if (cityMatch) {
      const claimed = parseInt(cityMatch[1])
      if (Math.abs(claimed - realCityCount) > 10) {
        memoryAccurate = false
        details.push(`MEMOIRE PERIMEE: features.md dit "${claimed} villes" mais le build en genere ${realCityCount}`)
      }
    }
  }

  // Check test count — look for "X passed" in Tests line (not Test Files)
  const testCountMatch = featuresContent.match(/(\d+)\+?\s*tests?\s*wiring/)
  if (testCountMatch) {
    const claimedTests = parseInt(testCountMatch[1])
    const testOut = exec('npx vitest run tests/wiring/ 2>&1 || true', { allowFail: true, timeout: 60000 })
    // Match the "Tests" line specifically (not "Test Files")
    const realTestMatch = testOut.match(/Tests\s+.*?(\d+)\s+passed/)
    if (realTestMatch) {
      const realTests = parseInt(realTestMatch[1])
      if (Math.abs(claimedTests - realTests) > 5) {
        memoryAccurate = false
        details.push(`MEMOIRE PERIMEE: features.md dit "${claimedTests} tests wiring" mais il y en a ${realTests}`)
      }
    }
  }

  if (memoryAccurate) {
    findings.push('Memoire: chiffres coherents avec la realite')
  } else {
    findings.push('Memoire: chiffres perimes (voir details)')
  }

  log(`  Score: ${score}/${max}`)
  phase('Feature Inventory', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6: REGRESSION GUARD
// ═══════════════════════════════════════════════════════════════

function phase6_regressionGuard() {
  header(6, 'REGRESSION GUARD')
  let score = 0
  const max = 10
  const findings = []
  const details = []

  // === Part A: Check wolf-memory errors (automated regression checks) ===
  const pastErrors = memory.errors || []
  let regressions = 0
  let checked = 0

  for (const error of pastErrors) {
    if (!error.file || !error.check) continue
    checked++

    try {
      if (error.check.type === 'file_exists') {
        if (!existsSync(join(ROOT, error.file))) {
          regressions++
          details.push(`REGRESSION: ${error.description} (fichier supprime: ${error.file})`)
        }
      } else if (error.check.type === 'content_contains') {
        const content = readFile(join(ROOT, error.file))
        if (!content.includes(error.check.value)) {
          regressions++
          details.push(`REGRESSION: ${error.description}`)
        }
      } else if (error.check.type === 'test_passes') {
        if (!execOk(error.check.cmd, 60000)) {
          regressions++
          details.push(`REGRESSION: ${error.description} (test echoue)`)
        }
      }
    } catch {
      // Can't check this error, skip
    }
  }

  // === Part B: Analyze memory/errors.md (human-readable error journal) ===
  const errorsPath = join(ROOT, 'memory', 'errors.md')
  let errorsTotal = 0
  let errorsFixed = 0
  let errorsPending = 0
  let lessons = []

  if (existsSync(errorsPath)) {
    const errorsContent = readFile(errorsPath)
    const errBlocks = errorsContent.split(/### ERR-\d+/).slice(1)
    errorsTotal = errBlocks.length

    for (const block of errBlocks) {
      if (/Statut.*:\s*CORRIG[EÉ]/i.test(block)) errorsFixed++
      else errorsPending++

      // Extract lessons
      const lessonMatch = block.match(/\*\*Leçon\*\*\s*:\s*(.+?)(?:\n|$)/)
      if (lessonMatch) lessons.push(lessonMatch[1].trim())
    }

    findings.push(`Journal erreurs: ${errorsTotal} erreurs documentees (${errorsFixed} corrigees, ${errorsPending} en cours)`)

    if (errorsPending > 0) {
      details.push(`${errorsPending} erreur(s) NON CORRIGEE(S) dans memory/errors.md — a traiter en priorite`)
    }

    // ERR-001 regression check: scan ALL files for duplicate window.* handlers
    const allSrcFiles = getAllJsFiles(join(ROOT, 'src'))
    const handlersByFile = {} // handler name → [files]
    for (const file of allSrcFiles) {
      const content = readFile(file)
      const relPath = relative(ROOT, file)
      // Match window.xxx = but skip window.xxx?.() and if(!window.xxx) patterns
      const handlers = (content.match(/window\.(\w+)\s*=/g) || [])
        .map(h => h.replace('window.', '').replace(/\s*=$/, ''))
      for (const h of handlers) {
        if (!handlersByFile[h]) handlersByFile[h] = []
        if (!handlersByFile[h].includes(relPath)) handlersByFile[h].push(relPath)
      }
    }
    const duplicateHandlers = Object.entries(handlersByFile)
      .filter(([, files]) => files.length > 1)
      .sort((a, b) => b[1].length - a[1].length)

    if (duplicateHandlers.length > 0) {
      findings.push(`DUPLICATE HANDLERS: ${duplicateHandlers.length} handlers definis dans 2+ fichiers`)
      // Show worst offenders
      const worst = duplicateHandlers.slice(0, 10)
      for (const [name, files] of worst) {
        details.push(`Handler "${name}" defini dans ${files.length} fichiers: ${files.map(f => basename(f, '.js')).join(', ')}`)
      }
      if (duplicateHandlers.length > 10) {
        details.push(`... et ${duplicateHandlers.length - 10} autres handlers dupliques`)
      }
      // Penalize score proportionally
      if (duplicateHandlers.length > 20) regressions += 2
      else if (duplicateHandlers.length > 5) regressions++
    } else {
      findings.push('0 handlers dupliques entre fichiers')
    }
  } else {
    findings.push('Pas de journal erreurs (memory/errors.md manquant)')
    details.push('Creer memory/errors.md pour documenter les bugs et leurs corrections')
  }

  // === Scoring ===
  if (checked === 0 && errorsTotal === 0) {
    score += 10
    findings.push('Premiere execution — pas encore d\'erreurs enregistrees')
  } else if (regressions === 0) {
    score += Math.min(10, 6 + Math.min(4, errorsFixed))
    if (checked > 0) findings.push(`${checked} verifications auto — 0 regressions`)
    if (lessons.length > 0) findings.push(`${lessons.length} lecons apprises documentees`)
  } else {
    score += Math.max(0, 10 - regressions * 3)
    findings.push(`REGRESSIONS DETECTEES: ${regressions}`)
  }

  if (errorsPending > 0) score = Math.max(0, score - errorsPending)

  log(`  Score: ${score}/${max}`)
  phase('Regression Guard', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 7: WIRING INTEGRITY
// ═══════════════════════════════════════════════════════════════

function phase7_wiringIntegrity() {
  header(7, 'WIRING INTEGRITY')
  let score = 0
  const max = 12
  const findings = []
  const details = []

  const mainContent = readFile(join(ROOT, 'src', 'main.js'))

  // Count window.* handlers in main.js (exclude browser APIs)
  const browserAPIs = new Set(['location', 'scrollTo', 'scrollBy', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'innerWidth', 'innerHeight', 'devicePixelRatio', 'navigator', 'history', 'localStorage', 'sessionStorage', 'indexedDB', 'crypto', 'performance', 'matchMedia', 'getSelection', 'onload', 'onresize', 'onscroll', 'onerror', 'onpopstate', 'onbeforeunload', 'onhashchange', 'onfocus', 'onblur'])
  const handlerMatches = (mainContent.match(/window\.(\w+)\s*=/g) || [])
    .filter(h => !browserAPIs.has(h.replace('window.', '').replace(/\s*=$/, '')))
  const handlerCount = handlerMatches.length
  findings.push(`${handlerCount} handlers window.* enregistres dans main.js`)

  if (handlerCount >= 300) score += 3
  else if (handlerCount >= 200) score += 2
  else { score += 1; details.push('Moins de 200 handlers — des features sont peut-etre debranchees') }

  // Check each modal has both open and close
  const modalFlags = mainContent.match(/show\w+:\s*true/g) || []
  const openModals = new Set()
  const closeModals = new Set()

  for (const h of handlerMatches) {
    const name = h.replace('window.', '').replace(/\s*=/, '')
    if (name.startsWith('open') || name.startsWith('show')) openModals.add(name)
    if (name.startsWith('close')) closeModals.add(name)
  }

  // Every open should have a close
  const missingClose = []
  for (const open of openModals) {
    const modalName = open.replace(/^(open|show)/, '')
    const hasClose = [...closeModals].some(c => c.replace(/^close/, '') === modalName)
    if (!hasClose && modalName.length > 2) {
      missingClose.push(modalName)
    }
  }

  if (missingClose.length === 0) {
    score += 4
    findings.push('Toutes les modales ont un open + close')
  } else if (missingClose.length <= 3) {
    score += 2
    findings.push(`${missingClose.length} modale(s) sans handler close: ${missingClose.join(', ')}`)
  } else {
    details.push(`${missingClose.length} modales sans close handler`)
  }

  // --- onclick verification: every onclick="fn()" must have a window.fn ---
  const allSrcForOnclick = getAllJsFiles(join(ROOT, 'src'))
  const allRegisteredHandlers = new Set()
  for (const file of allSrcForOnclick) {
    const content = readFile(file)
    const handlers = (content.match(/window\.(\w+)\s*=/g) || [])
      .map(h => h.replace('window.', '').replace(/\s*=$/, ''))
    for (const h of handlers) allRegisteredHandlers.add(h)
  }

  const onclickCalls = new Set()
  for (const file of allSrcForOnclick) {
    const content = readFile(file)
    const matches = content.match(/onclick="(\w+)\(/g) || []
    for (const m of matches) {
      const fn = m.replace('onclick="', '').replace('(', '')
      onclickCalls.add(fn)
    }
  }

  const danglingOnclicks = [...onclickCalls].filter(fn => !allRegisteredHandlers.has(fn))
  if (danglingOnclicks.length === 0) {
    score += 2
    findings.push(`onclick: ${onclickCalls.size} appels, tous branches`)
  } else {
    findings.push(`onclick: ${danglingOnclicks.length} fonction(s) appelees mais inexistantes`)
    for (const fn of danglingOnclicks.slice(0, 5)) {
      details.push(`onclick="${fn}()" utilise dans le HTML mais window.${fn} n'existe pas`)
    }
  }

  // Check i18n — all t() calls have translations
  const i18nDir = join(ROOT, 'src', 'i18n', 'lang')
  if (existsSync(i18nDir)) {
    const langFiles = readdirSync(i18nDir).filter(f => f.endsWith('.js'))
    if (langFiles.length >= 4) {
      score += 3
      findings.push(`${langFiles.length} fichiers de langue trouves`)
    } else {
      score += 1
      findings.push(`Seulement ${langFiles.length} langues (4 attendues)`)
    }
  } else {
    // Check in i18n/index.js
    const i18nContent = readFile(join(ROOT, 'src', 'i18n', 'index.js'))
    const langCount = (i18nContent.match(/\b(fr|en|es|de)\b/g) || []).length
    if (langCount >= 4) {
      score += 3
      findings.push('4 langues detectees dans i18n')
    }
  }

  log(`  Score: ${score}/${max}`)
  phase('Wiring Integrity', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 8: BUTTON & LINK AUDIT — test EVERY interactive element
// ═══════════════════════════════════════════════════════════════

function phase8_buttonAudit() {
  header(8, 'BUTTON & LINK AUDIT')
  let score = 0
  const max = 15
  const findings = []
  const details = []

  const srcDir = join(ROOT, 'src')
  const allFiles = getAllJsFiles(srcDir)

  // Collect ALL interactive elements from templates
  const allOnclicks = new Map() // fn name → [files]
  const deadHrefs = [] // href="#" or empty
  const emptyHandlers = [] // window.xxx = ()=>{} or empty body
  const placeholders = [] // TODO, Coming soon, etc.
  const allModals = new Map() // modal name → { hasOpen, hasClose, hasContent }
  const navTargets = new Set() // names used in navigation (openXxx, showXxx)
  const allRegisteredHandlers = new Set()

  for (const file of allFiles) {
    const content = readFile(file)
    const rel = relative(ROOT, file)

    // Collect all window.xxx = handlers
    const handlers = (content.match(/window\.(\w+)\s*=/g) || [])
      .map(h => h.replace('window.', '').replace(/\s*=$/, ''))
    for (const h of handlers) allRegisteredHandlers.add(h)

    // 1. onclick="xxx(" — verify the function exists (skip JS keywords like if, for, return)
    const jsKeywords = new Set(['if', 'for', 'while', 'return', 'switch', 'case', 'var', 'let', 'const', 'new', 'this', 'event', 'true', 'false', 'null', 'document', 'window', 'console', 'alert', 'confirm', 'prompt'])
    const onclickMatches = content.match(/onclick="(\w+)\(/g) || []
    for (const m of onclickMatches) {
      const fn = m.replace('onclick="', '').replace('(', '')
      if (jsKeywords.has(fn)) continue
      if (!allOnclicks.has(fn)) allOnclicks.set(fn, [])
      allOnclicks.get(fn).push(rel)
    }

    // 2. Dead hrefs: href="#", href="" (but NOT javascript:void(0) with onclick — that's intentional)
    const anchorMatches = content.match(/<a\s[^>]*>/gi) || []
    for (const tag of anchorMatches) {
      const hrefM = tag.match(/href=["']([^"']{0,40})["']/)
      if (!hrefM) continue
      const href = hrefM[1]
      const hasOnclick = /onclick=/i.test(tag)
      if (href === '#' || href === '' || href === 'javascript:;') {
        deadHrefs.push({ href, file: rel })
      } else if (href === 'javascript:void(0)' && !hasOnclick) {
        deadHrefs.push({ href, file: rel })
      }
    }

    // 3. Empty handler bodies: window.xxx = () => {} or function() {}
    const handlerDefRegex = /window\.(\w+)\s*=\s*(?:function\s*\([^)]*\)\s*\{(\s*)\}|\([^)]*\)\s*=>\s*\{(\s*)\})/g
    let hMatch
    while ((hMatch = handlerDefRegex.exec(content))) {
      const name = hMatch[1]
      const body1 = hMatch[2] || ''
      const body2 = hMatch[3] || ''
      if (body1.trim() === '' && body2.trim() === '') {
        emptyHandlers.push({ name, file: rel })
      }
    }

    // 4. Placeholders: TODO, FIXME, Coming soon, Lorem ipsum
    const todoMatches = content.match(/(TODO|FIXME|HACK|XXX|Coming soon|Lorem ipsum|placeholder text|Not implemented)/gi) || []
    for (const m of todoMatches) {
      placeholders.push({ text: m, file: rel })
    }

    // 5. Modal tracking: open/close/content
    const openMatches = content.match(/window\.(open\w+|show\w+)\s*=/g) || []
    for (const m of openMatches) {
      const name = m.replace('window.', '').replace(/\s*=$/, '')
      const modalName = name.replace(/^(open|show)/, '')
      if (modalName.length < 3) continue
      if (!allModals.has(modalName)) allModals.set(modalName, { hasOpen: false, hasClose: false, hasContent: false })
      allModals.get(modalName).hasOpen = true
      navTargets.add(modalName)
    }
    const closeMatches = content.match(/window\.close(\w+)\s*=/g) || []
    for (const m of closeMatches) {
      const modalName = m.replace('window.close', '').replace(/\s*=$/, '')
      if (modalName.length < 3) continue
      if (!allModals.has(modalName)) allModals.set(modalName, { hasOpen: false, hasClose: false, hasContent: false })
      allModals.get(modalName).hasClose = true
    }

    // Check if modal/view files have real content — only for modals that have an open handler
    if (rel.includes('modals/') || rel.includes('views/')) {
      const modalName = basename(file, '.js')
      // Only update content flag if this modal was already tracked (has an open handler)
      if (allModals.has(modalName)) {
        const hasHTML = (content.match(/<div|<section|<form|<h[1-6]|<p\s|<button/g) || []).length > 2
        allModals.get(modalName).hasContent = hasHTML && content.length > 300
      }
    }
  }

  // === SCORING ===

  // A. Broken onclick handlers (buttons that do nothing)
  let brokenOnclicks = 0
  for (const [fn, files] of allOnclicks) {
    if (!allRegisteredHandlers.has(fn)) {
      brokenOnclicks++
      if (brokenOnclicks <= 5) details.push(`Bouton casse: onclick="${fn}()" dans ${files[0]} — la fonction n'existe pas`)
    }
  }
  if (brokenOnclicks > 5) details.push(`... et ${brokenOnclicks - 5} autres onclick casses`)

  if (brokenOnclicks === 0) {
    score += 4
    findings.push(`${allOnclicks.size} onclick verifies — tous branches`)
  } else {
    score += Math.max(0, 3 - brokenOnclicks)
    findings.push(`${brokenOnclicks}/${allOnclicks.size} onclick pointe(nt) vers des fonctions INEXISTANTES`)
  }

  // B. Dead hrefs
  if (deadHrefs.length <= 3) {
    score += 2
    findings.push(`${deadHrefs.length} lien(s) mort(s) (href="#") — acceptable`)
  } else {
    findings.push(`${deadHrefs.length} lien(s) mort(s) (href="#" ou vides)`)
    for (const h of deadHrefs.slice(0, 3)) {
      details.push(`Lien mort: href="${h.href}" dans ${h.file}`)
    }
    if (deadHrefs.length > 3) details.push(`... et ${deadHrefs.length - 3} autres liens morts`)
  }

  // C. Empty handlers (buttons that exist but do NOTHING)
  if (emptyHandlers.length === 0) {
    score += 3
    findings.push('0 handlers vides (tous font quelque chose)')
  } else {
    score += Math.max(0, 3 - emptyHandlers.length)
    findings.push(`${emptyHandlers.length} handler(s) avec corps vide — le bouton ne fait RIEN`)
    for (const h of emptyHandlers.slice(0, 5)) {
      details.push(`Handler vide: window.${h.name} dans ${h.file} — cliquer ne fait rien`)
    }
  }

  // D. Modals: only flag modals that have a MATCHING FILE in modals/ or views/ that's empty
  // (many openXxx handlers render inline in App.js — those are NOT separate modals)
  const modalsDir = join(ROOT, 'src', 'components', 'modals')
  const viewsDir = join(ROOT, 'src', 'components', 'views')
  const modalFiles = existsSync(modalsDir) ? readdirSync(modalsDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', '')) : []
  const viewFiles = existsSync(viewsDir) ? readdirSync(viewsDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', '')) : []
  const knownUIFiles = new Set([...modalFiles, ...viewFiles])

  let emptyModals = 0
  let unclosableModals = 0
  for (const [name, info] of allModals) {
    // Only flag if there's a matching file that we can verify
    if (info.hasOpen && !info.hasContent && knownUIFiles.has(name)) {
      emptyModals++
      if (emptyModals <= 5) details.push(`Modale "${name}": fichier existe mais AUCUN contenu HTML visible`)
    }
    if (info.hasOpen && !info.hasClose && knownUIFiles.has(name)) {
      unclosableModals++
      if (unclosableModals <= 3) details.push(`Modale "${name}": peut s'ouvrir mais PAS se fermer`)
    }
  }

  if (emptyModals <= 2) {
    score += 3
    findings.push(`${knownUIFiles.size} fichiers modales/vues verifies — ${emptyModals} vide(s)`)
  } else {
    score += Math.max(0, 3 - Math.ceil(emptyModals / 3))
    findings.push(`${emptyModals} modale(s)/vue(s) avec fichier VIDE (pas de contenu HTML)`)
  }

  // E. Placeholders and TODOs (unfinished work)
  if (placeholders.length === 0) {
    score += 3
    findings.push('0 TODO/placeholder dans le code')
  } else {
    score += Math.max(0, 3 - Math.ceil(placeholders.length / 5))
    findings.push(`${placeholders.length} TODO/placeholder(s) — travail inacheve`)
    const grouped = {}
    for (const p of placeholders) {
      const type = p.text.toUpperCase().replace(/\s+/g, ' ')
      if (!grouped[type]) grouped[type] = 0
      grouped[type]++
    }
    for (const [type, count] of Object.entries(grouped).slice(0, 5)) {
      details.push(`${count}x "${type}" — a implementer ou supprimer`)
    }
  }

  // F. Summary: what Wolf couldn't test
  const buttonCoverage = allOnclicks.size + allModals.size
  findings.push(`Couverture: ${buttonCoverage} elements interactifs testes, ${deadHrefs.length + emptyHandlers.length + emptyModals + brokenOnclicks} problemes`)

  log(`  Score: ${score}/${max}`)
  phase('Button & Link Audit', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 9: DEAD CODE DETECTION
// ═══════════════════════════════════════════════════════════════

function phase9_deadCode() {
  header(9, 'DEAD CODE')
  let score = 0
  const max = 10
  const findings = []
  const details = []

  const srcDir = join(ROOT, 'src')
  const allFiles = getAllJsFiles(srcDir)
  let deadFunctions = 0
  let deadExports = 0

  // Collect all exported function names
  const exportedFunctions = {} // name → file
  const allContent = {} // file → content (cache)
  for (const file of allFiles) {
    const content = readFile(file)
    allContent[file] = content
    const rel = relative(ROOT, file)

    // export function xxx
    const exportFnMatches = content.match(/export\s+function\s+(\w+)/g) || []
    for (const m of exportFnMatches) {
      const name = m.replace(/export\s+function\s+/, '')
      exportedFunctions[name] = rel
    }

    // export { xxx }
    const namedExports = content.match(/export\s*\{([^}]+)\}/g) || []
    for (const block of namedExports) {
      const names = block.replace(/export\s*\{/, '').replace(/\}/, '').split(',')
      for (const n of names) {
        const clean = n.trim().split(/\s+as\s+/)[0].trim()
        if (clean && clean !== 'default') exportedFunctions[clean] = rel
      }
    }
  }

  // Build sets of all known usages: window handlers, onclick refs, dynamic imports
  const allWindowHandlers = new Set()
  const allTemplateRefs = new Set()
  const dynamicallyImportedFiles = new Set() // files loaded via import()

  for (const file of allFiles) {
    const content = allContent[file]

    // window.xxx = assignments
    const handlers = (content.match(/window\.(\w+)\s*=/g) || [])
      .map(h => h.replace('window.', '').replace(/\s*=$/, ''))
    for (const h of handlers) allWindowHandlers.add(h)

    // onclick="fn(" in templates (skip JS keywords like if, for, etc.)
    const jsKw2 = new Set(['if', 'for', 'while', 'return', 'switch', 'case', 'var', 'let', 'const', 'new', 'this', 'event', 'true', 'false', 'null', 'document', 'window', 'console', 'alert', 'confirm', 'prompt'])
    const onclickRefs = content.match(/onclick="(\w+)\(/g) || []
    for (const m of onclickRefs) {
      const fn = m.replace('onclick="', '').replace('(', '')
      if (!jsKw2.has(fn)) allTemplateRefs.add(fn)
    }

    // Dynamic imports: import('./path') or import('../services/xxx')
    const dynamicImports = content.match(/import\(['"]([^'"]+)['"]\)/g) || []
    for (const di of dynamicImports) {
      const importPath = di.replace(/import\(['"]/, '').replace(/['"]\)/, '')
      if (importPath.startsWith('.')) {
        const dir = join(file, '..')
        let resolved = resolve(dir, importPath)
        if (!resolved.endsWith('.js')) resolved += '.js'
        dynamicallyImportedFiles.add(relative(ROOT, resolved))
      }
    }
  }

  // For files that ARE imported (statically or dynamically) somewhere, their exports
  // are part of the module's public API and should NOT be flagged as dead.
  // Only flag exports from files that nobody imports at all.
  const importedFiles = new Set()
  for (const file of allFiles) {
    const content = allContent[file]
    const importRegex = /import\s+.*?from\s+['"](\..*?)['"]/g
    let match
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]
      const dir = join(file, '..')
      let resolved = resolve(dir, importPath)
      if (!resolved.endsWith('.js')) resolved += '.js'
      importedFiles.add(relative(ROOT, resolved))
    }
  }
  // Add dynamically imported files
  for (const f of dynamicallyImportedFiles) importedFiles.add(f)

  // Check if exports are used anywhere — only for files NOT imported by anyone
  for (const [fnName, sourceFile] of Object.entries(exportedFunctions)) {
    if (fnName.length < 4) continue // skip short names (false positives)

    // Skip if the source file is imported by at least one other file
    // (its exports are the module's public API)
    if (importedFiles.has(sourceFile)) continue

    // Skip if it's a window handler or template ref
    if (allWindowHandlers.has(fnName)) continue
    if (allTemplateRefs.has(fnName)) continue

    // Skip common lifecycle/render patterns
    if (fnName.startsWith('render') || fnName.startsWith('init') || fnName.startsWith('setup')) continue
    if (fnName.startsWith('open') || fnName.startsWith('close') || fnName.startsWith('show') || fnName.startsWith('hide')) continue
    if (fnName.startsWith('handle') || fnName.startsWith('on') || fnName.startsWith('get') || fnName.startsWith('set')) continue
    if (fnName.startsWith('update') || fnName.startsWith('create') || fnName.startsWith('delete') || fnName.startsWith('load')) continue

    let usedElsewhere = false
    for (const file of allFiles) {
      const rel = relative(ROOT, file)
      if (rel === sourceFile) continue
      if (allContent[file].includes(fnName)) {
        usedElsewhere = true
        break
      }
    }
    // Also check tests and scripts
    if (!usedElsewhere) {
      const checkDirs = [join(ROOT, 'tests'), join(ROOT, 'scripts')]
      for (const checkDir of checkDirs) {
        if (!existsSync(checkDir)) continue
        const checkFiles = getAllJsFiles(checkDir)
        for (const tf of checkFiles) {
          if (readFile(tf).includes(fnName)) {
            usedElsewhere = true
            break
          }
        }
        if (usedElsewhere) break
      }
    }
    if (!usedElsewhere) {
      deadExports++
      if (deadExports <= 10) {
        details.push(`Export mort: "${fnName}" dans ${sourceFile} — jamais importe ailleurs`)
      }
    }
  }

  // Check for defined-but-unused local functions
  // Only flag functions that are clearly dead — not callbacks, handlers, or lifecycle functions
  for (const file of allFiles) {
    const content = allContent[file]
    const rel = relative(ROOT, file)
    // Match: function xxx( but NOT export function xxx
    const localFns = content.match(/(?<!export\s)function\s+(\w+)\s*\(/g) || []
    for (const m of localFns) {
      const name = m.replace(/function\s+/, '').replace(/\s*\(/, '')
      if (name.length < 4) continue
      // Skip lifecycle/handler patterns
      if (name.startsWith('render') || name.startsWith('init') || name.startsWith('setup')) continue
      if (name.startsWith('handle') || name.startsWith('on') || name.startsWith('get') || name.startsWith('set')) continue
      if (name.startsWith('open') || name.startsWith('close') || name.startsWith('show') || name.startsWith('hide')) continue
      if (name.startsWith('update') || name.startsWith('create') || name.startsWith('load') || name.startsWith('build')) continue
      if (name.startsWith('validate') || name.startsWith('format') || name.startsWith('parse') || name.startsWith('check')) continue
      // Count occurrences in same file (should be > 1: definition + at least one call)
      const count = (content.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length
      if (count <= 1) {
        deadFunctions++
        if (deadFunctions <= 5) {
          details.push(`Fonction morte: "${name}" dans ${rel} — definie mais jamais appelee`)
        }
      }
    }
  }

  if (deadExports > 10) details.push(`... et ${deadExports - 10} autres exports morts`)
  if (deadFunctions > 5) details.push(`... et ${deadFunctions - 5} autres fonctions mortes`)

  const totalDead = deadExports + deadFunctions
  findings.push(`${deadExports} export(s) mort(s), ${deadFunctions} fonction(s) locale(s) morte(s)`)

  // Scoring: relative to codebase size (% of total exports that are dead)
  const totalExports = Object.keys(exportedFunctions).length
  const deadPct = totalExports > 0 ? Math.round((deadExports / totalExports) * 100) : 0
  if (totalDead === 0) score += 10
  else if (deadPct <= 2 && deadFunctions <= 3) score += 9
  else if (deadPct <= 5 && deadFunctions <= 5) score += 7
  else if (deadPct <= 10) score += 5
  else if (deadPct <= 20) score += 3
  else score += 1
  findings.push(`${totalExports} exports totaux, ${deadPct}% morts`)

  log(`  Score: ${score}/${max}`)
  phase('Dead Code', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 10: MULTI-LEVEL AUDIT
// ═══════════════════════════════════════════════════════════════

function phase10_multiLevel() {
  header(10, 'MULTI-LEVEL AUDIT')
  let score = 0
  const max = 15
  const findings = []
  const details = []

  // --- Performance ---
  const distDir = join(ROOT, 'dist')
  if (existsSync(distDir)) {
    // Count chunks
    const assetsDir = join(distDir, 'assets')
    if (existsSync(assetsDir)) {
      const jsChunks = readdirSync(assetsDir).filter(f => f.endsWith('.js'))
      const cssFiles = readdirSync(assetsDir).filter(f => f.endsWith('.css'))
      findings.push(`Performance: ${jsChunks.length} chunks JS, ${cssFiles.length} fichier(s) CSS`)
      if (jsChunks.length >= 5) score += 1 // Good code splitting
    }
  }

  // --- SEO ---
  const sitemapExists = existsSync(join(ROOT, 'dist', 'sitemap.xml'))
    || existsSync(join(ROOT, 'public', 'sitemap.xml'))
  const robotsExists = existsSync(join(ROOT, 'public', 'robots.txt'))
  const seoDir = join(ROOT, 'dist', 'guides')

  if (sitemapExists && robotsExists) {
    score += 2
    findings.push('SEO: sitemap.xml + robots.txt presents')
  } else {
    details.push('SEO: sitemap.xml ou robots.txt manquant')
  }

  if (existsSync(seoDir)) {
    // Count guides — they may be in subdirectories or flat
    let guidesCount = 0
    try {
      const entries = readdirSync(seoDir, { withFileTypes: true })
      for (const e of entries) {
        if (e.isFile() && e.name.endsWith('.html')) guidesCount++
        if (e.isDirectory()) {
          guidesCount += readdirSync(join(seoDir, e.name)).filter(f => f.endsWith('.html')).length
        }
      }
    } catch { /* ignore */ }
    findings.push(`SEO: ${guidesCount} pages guides generees`)
    if (guidesCount >= 50) score += 2
    else if (guidesCount >= 10) score += 1
  } else {
    // Check if guides are generated as part of public/guides instead
    const publicGuidesDir = join(ROOT, 'public', 'guides')
    if (existsSync(publicGuidesDir)) {
      const guidesCount = readdirSync(publicGuidesDir).filter(f => f.endsWith('.html')).length
      findings.push(`SEO: ${guidesCount} pages guides (dans public/)`)
      if (guidesCount >= 50) score += 2
    }
  }

  const cityDir = join(ROOT, 'dist', 'hitchhiking')
  if (existsSync(cityDir)) {
    let cityCount = 0
    try {
      const countries = readdirSync(cityDir)
      for (const country of countries) {
        const countryDir = join(cityDir, country)
        if (statSync(countryDir).isDirectory()) {
          cityCount += readdirSync(countryDir).filter(f => f.endsWith('.html')).length
        }
      }
    } catch { /* ignore */ }
    findings.push(`SEO: ${cityCount} pages villes generees`)
    if (cityCount >= 800) score += 2
    else if (cityCount >= 100) score += 1
  }

  // --- Accessibility ---
  const a11yFile = join(ROOT, 'src', 'utils', 'a11y.js')
  if (existsSync(a11yFile)) {
    const a11yContent = readFile(a11yFile)
    const hasAria = a11yContent.includes('aria-') || a11yContent.includes('role=')
    const hasFocus = a11yContent.includes('focus') || a11yContent.includes('Focus')
    if (hasAria && hasFocus) {
      score += 2
      findings.push('Accessibilite: a11y.js avec ARIA + focus management')
    } else {
      score += 1
      findings.push('Accessibilite: a11y.js present mais incomplet')
    }
  }

  // --- Security ---
  const indexHtml = readFile(join(ROOT, 'index.html'))
  const hasCSP = indexHtml.includes('Content-Security-Policy') || indexHtml.includes('content-security-policy')
  const hasSanitize = existsSync(join(ROOT, 'src', 'utils', 'sanitize.js'))
    || existsSync(join(ROOT, 'src', 'services', 'sanitize.js'))

  if (hasCSP || hasSanitize) {
    score += 2
    findings.push(`Securite: ${hasCSP ? 'CSP' : ''} ${hasSanitize ? 'DOMPurify' : ''} actif`)
  } else {
    details.push('Securite: pas de CSP ni sanitization detecte')
  }

  // --- Legal ---
  const hasPrivacy = existsSync(join(ROOT, 'PRIVACY.md'))
  const hasTerms = existsSync(join(ROOT, 'TERMS.md'))
  const hasCookie = readFile(join(ROOT, 'src', 'components', 'App.js')).includes('CookieBanner')

  if (hasPrivacy && hasTerms && hasCookie) {
    score += 2
    findings.push('Legal: PRIVACY + TERMS + CookieBanner presents')
  } else {
    const missing = []
    if (!hasPrivacy) missing.push('PRIVACY.md')
    if (!hasTerms) missing.push('TERMS.md')
    if (!hasCookie) missing.push('CookieBanner')
    details.push(`Legal: manque ${missing.join(', ')}`)
  }

  // --- Spots Data ---
  const spotsDir = join(ROOT, 'public', 'data', 'spots')
  if (existsSync(spotsDir)) {
    const countryFiles = readdirSync(spotsDir).filter(f => f.endsWith('.json'))
    findings.push(`Donnees: ${countryFiles.length} fichiers pays de spots`)
    if (countryFiles.length >= 100) score += 2
    else score += 1
  }

  // --- npm audit (security vulnerabilities) ---
  const npmAuditOut = exec('npm audit --json 2>/dev/null || true', { allowFail: true, timeout: 30000 })
  try {
    const auditData = JSON.parse(npmAuditOut)
    const vulns = auditData.metadata?.vulnerabilities || {}
    const critical = vulns.critical || 0
    const high = vulns.high || 0
    const moderate = vulns.moderate || 0
    const total = critical + high + moderate
    if (total === 0) {
      findings.push('npm audit: 0 vulnerabilites connues')
    } else {
      findings.push(`npm audit: ${total} vulnerabilite(s) (${critical} critiques, ${high} hautes, ${moderate} moyennes)`)
      if (critical > 0 || high > 0) {
        details.push('npm audit: vulnerabilites critiques/hautes detectees — lancer npm audit fix')
      }
    }
  } catch {
    // npm audit didn't return JSON — try simple parse
    if (npmAuditOut.includes('found 0 vulnerabilities') || npmAuditOut.includes('0 vulnerabilities')) {
      findings.push('npm audit: 0 vulnerabilites')
    }
  }

  // --- Image size check ---
  const imgDirs = ['public/images', 'public/icons', 'public/screenshots', 'src/assets']
  let oversizedImages = 0
  let totalImages = 0
  const imgExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']
  for (const imgDir of imgDirs) {
    const fullDir = join(ROOT, imgDir)
    if (!existsSync(fullDir)) continue
    try {
      const imgFiles = readdirSync(fullDir).filter(f => imgExtensions.some(ext => f.toLowerCase().endsWith(ext)))
      for (const img of imgFiles) {
        totalImages++
        const size = statSync(join(fullDir, img)).size
        const kb = Math.round(size / 1024)
        if (kb > 200) {
          oversizedImages++
          if (oversizedImages <= 3) {
            details.push(`Image trop lourde: ${imgDir}/${img} (${kb}KB > 200KB)`)
          }
        }
      }
    } catch { /* ignore */ }
  }
  if (oversizedImages > 3) details.push(`... et ${oversizedImages - 3} autres images trop lourdes`)
  if (oversizedImages === 0 && totalImages > 0) {
    findings.push(`Images: ${totalImages} fichiers, tous < 200KB`)
  } else if (oversizedImages > 0) {
    findings.push(`Images: ${oversizedImages}/${totalImages} trop lourdes (> 200KB)`)
  }

  log(`  Score: ${score}/${max}`)
  phase('Multi-Level Audit', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 11: LIGHTHOUSE (skip in --quick mode)
// ═══════════════════════════════════════════════════════════════

function phase11_lighthouse() {
  header(11, 'LIGHTHOUSE')
  let score = 0
  const max = 8
  const findings = []
  const details = []

  if (isQuick) {
    findings.push('Lighthouse saute en mode --quick')
    score += 4
    log(`  Score: ${score}/${max} (skip)`)
    phase('Lighthouse', score, max, findings, details)
    return
  }

  // Check if lhci is available
  const lhciAvailable = execOk('npx lhci --version')
  if (!lhciAvailable) {
    findings.push('Lighthouse CI non installe (npx lhci)')
    details.push('Installer avec: npm install -g @lhci/cli')
    score += 2
    log(`  Score: ${score}/${max}`)
    phase('Lighthouse', score, max, findings, details)
    return
  }

  // Run lighthouse on built files (needs a server)
  try {
    const distIndex = join(ROOT, 'dist', 'index.html')
    if (!existsSync(distIndex)) {
      findings.push('dist/index.html introuvable — lancer npm run build d\'abord')
      score += 2
      log(`  Score: ${score}/${max}`)
      phase('Lighthouse', score, max, findings, details)
      return
    }

    // Use lhci autorun with a temp server
    const lhOut = exec(
      'npx lhci autorun --collect.staticDistDir=./dist --collect.numberOfRuns=1 --assert.preset=lighthouse:no-pwa 2>&1 || true',
      { allowFail: true, timeout: 120000 }
    )

    // Parse scores from output — try multiple formats
    // lhci outputs various formats: "performance: 85", "Performance: 0.85", "[performance] 85", etc.
    let perf = null, a11y = null, seo = null, bp = null

    // Format 1: "category: XX" (integer 0-100)
    const perfMatch1 = lhOut.match(/performance[:\s]+(\d+)/i)
    const a11yMatch1 = lhOut.match(/accessibility[:\s]+(\d+)/i)
    const seoMatch1 = lhOut.match(/seo[:\s]+(\d+)/i)
    const bpMatch1 = lhOut.match(/best.practices[:\s]+(\d+)/i)

    // Format 2: "category: 0.XX" (decimal 0-1)
    const perfMatch2 = lhOut.match(/performance[:\s]+(0\.\d+)/i)
    const a11yMatch2 = lhOut.match(/accessibility[:\s]+(0\.\d+)/i)
    const seoMatch2 = lhOut.match(/seo[:\s]+(0\.\d+)/i)
    const bpMatch2 = lhOut.match(/best.practices[:\s]+(0\.\d+)/i)

    if (perfMatch2) perf = Math.round(parseFloat(perfMatch2[1]) * 100)
    else if (perfMatch1) perf = parseInt(perfMatch1[1])
    if (a11yMatch2) a11y = Math.round(parseFloat(a11yMatch2[1]) * 100)
    else if (a11yMatch1) a11y = parseInt(a11yMatch1[1])
    if (seoMatch2) seo = Math.round(parseFloat(seoMatch2[1]) * 100)
    else if (seoMatch1) seo = parseInt(seoMatch1[1])
    if (bpMatch2) bp = Math.round(parseFloat(bpMatch2[1]) * 100)
    else if (bpMatch1) bp = parseInt(bpMatch1[1])

    // Fallback: try to find any numeric scores in typical lhci table output
    if (perf === null) {
      const tableScores = lhOut.match(/\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/)
      if (tableScores) {
        perf = parseInt(tableScores[1])
        a11y = parseInt(tableScores[2])
        bp = parseInt(tableScores[3])
        seo = parseInt(tableScores[4])
      }
    }

    if (perf !== null) {
      findings.push(`Lighthouse: perf=${perf} a11y=${a11y} seo=${seo} bp=${bp}`)
      const vals = [perf, a11y, seo, bp].filter(v => v !== null)
      const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
      if (avg >= 90) score += 8
      else if (avg >= 70) score += 6
      else if (avg >= 50) score += 4
      else score += 2

      if (perf !== null && perf < 70) details.push(`Performance Lighthouse basse (${perf}) — optimiser le chargement`)
      if (a11y !== null && a11y < 90) details.push(`Accessibilite Lighthouse basse (${a11y}) — verifier ARIA/contraste`)
      if (seo !== null && seo < 80) details.push(`SEO Lighthouse bas (${seo}) — verifier meta tags`)
    } else {
      // Lighthouse didn't produce parseable scores — still give partial credit for having it configured
      const hasLhciConfig = existsSync(join(ROOT, 'lighthouserc.js')) || existsSync(join(ROOT, '.lighthouserc.json'))
      if (hasLhciConfig) {
        score += 3
        findings.push('Lighthouse: configure mais scores non lisibles (verifier lhci manuellement)')
      } else {
        score += 2
        findings.push('Lighthouse: pas de scores lisibles, pas de config trouvee')
        details.push('Creer un fichier lighthouserc.js pour configurer les seuils Lighthouse')
      }
    }
  } catch {
    findings.push('Lighthouse: erreur lors de l\'execution')
    score += 1
  }

  log(`  Score: ${score}/${max}`)
  phase('Lighthouse', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 12: PLAYWRIGHT SCREENSHOTS (skip in --quick mode)
// ═══════════════════════════════════════════════════════════════

function phase12_screenshots() {
  header(12, 'SCREENSHOTS')
  let score = 0
  const max = 5
  const findings = []
  const details = []

  if (isQuick) {
    findings.push('Screenshots sautes en mode --quick')
    score += 3
    log(`  Score: ${score}/${max} (skip)`)
    phase('Screenshots', score, max, findings, details)
    return
  }

  // Check if playwright is available
  const pwAvailable = execOk('npx playwright --version')
  if (!pwAvailable) {
    findings.push('Playwright non installe')
    details.push('Installer avec: npx playwright install chromium')
    score += 1
    log(`  Score: ${score}/${max}`)
    phase('Screenshots', score, max, findings, details)
    return
  }

  // Take screenshots of key pages
  try {
    const screenshotDir = join(ROOT, 'wolf-screenshots')
    const screenshotScript = `
      const { chromium } = require('playwright');
      const path = require('path');
      const fs = require('fs');
      (async () => {
        const dir = '${screenshotDir.replace(/\\/g, '\\\\')}';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const browser = await chromium.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        try {
          await page.goto('file://${join(ROOT, 'dist', 'index.html').replace(/\\/g, '\\\\')}', { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(dir, 'home.png'), fullPage: false });
        } catch (e) { console.log('Screenshot error:', e.message); }
        await browser.close();
        console.log('SCREENSHOTS_OK');
      })();
    `
    const out = exec(`node -e "${screenshotScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { allowFail: true, timeout: 30000 })

    if (out.includes('SCREENSHOTS_OK')) {
      const screenshots = existsSync(screenshotDir) ? readdirSync(screenshotDir).filter(f => f.endsWith('.png')) : []
      score += 5
      findings.push(`${screenshots.length} screenshot(s) genere(s) dans wolf-screenshots/`)
    } else {
      score += 2
      findings.push('Screenshots: execution partielle')
      details.push('Verifier que Playwright et Chromium sont installes')
    }
  } catch {
    score += 1
    findings.push('Screenshots: erreur lors de la capture')
    details.push('Installer Chromium: npx playwright install chromium')
  }

  log(`  Score: ${score}/${max}`)
  phase('Screenshots', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 13: FEATURE SCORES (score par feature)
// ═══════════════════════════════════════════════════════════════

function phase13_featureScores() {
  header(13, 'FEATURE SCORES')
  let score = 0
  const max = 10
  const findings = []
  const details = []

  // Define features with expected files, handlers, i18n, AND improvement advice
  const features = [
    {
      name: 'Carte',
      files: ['src/components/App.js', 'src/components/views/Map.js'],
      handlers: ['flyToCity', 'toggleHeatmap', 'toggleGasStations', 'toggleSplitView'],
      i18nKeys: ['searchCity', 'mapLoading'],
      advice100: 'Ajouter un mode offline pour les tuiles carte (cache local).',
      adviceLow: 'La carte est le coeur de l\'app — s\'assurer que la recherche et les filtres marchent parfaitement.',
    },
    {
      name: 'AddSpot',
      files: ['src/components/modals/AddSpot.js'],
      handlers: ['openAddSpot', 'closeAddSpot', 'addSpotNextStep', 'submitNewSpot'],
      i18nKeys: ['addSpot', 'spotType', 'spotDirection'],
      advice100: 'Ajouter la detection automatique du type de spot (via photo IA ou geolocalisation).',
      adviceLow: 'Le formulaire doit etre simple et rapide — verifier que chaque etape fonctionne.',
    },
    {
      name: 'Social',
      files: ['src/components/views/Social.js', 'src/components/views/social/Conversations.js', 'src/components/views/social/Friends.js'],
      handlers: ['setSocialTab', 'sendMessage', 'addFriendByName'],
      i18nKeys: ['chat', 'friends', 'messages'],
      advice100: 'Ajouter les notifications push pour les nouveaux messages.',
      adviceLow: 'Le chat et les amis sont essentiels — brancher les services dans l\'UI si pas fait.',
    },
    {
      name: 'Gamification',
      files: ['src/services/gamification.js'],
      handlers: ['openShop', 'claimDailyReward', 'openLeaderboard', 'openChallengesHub'],
      i18nKeys: ['badges', 'points', 'level'],
      advice100: 'Ajouter des recompenses saisonnieres liees aux voyages reels.',
      adviceLow: 'Verifier que les badges et le leaderboard s\'affichent correctement.',
    },
    {
      name: 'Mode SOS',
      files: ['src/components/modals/SOS.js'],
      handlers: ['openSOS', 'closeSOS', 'triggerSOS', 'shareSOS'],
      i18nKeys: ['sosButton', 'sosTitle', 'sosDisclaimer', 'emergencyContacts'],
      advice100: 'Integrer l\'envoi SMS reel aux contacts d\'urgence + appel auto 112/911.',
      adviceLow: 'Le SOS est VITAL — le bouton doit etre visible, rapide, et marcher OFFLINE.',
    },
    {
      name: 'Mode Compagnon',
      files: ['src/components/modals/Companion.js'],
      handlers: ['openCompanion', 'closeCompanion', 'startCompanion', 'stopCompanion', 'companionCheckIn'],
      i18nKeys: ['companionMode', 'companionStart', 'companionCheckIn', 'companionAlert'],
      advice100: 'Ajouter detection automatique d\'inactivite + alerte SMS si pas de check-in.',
      adviceLow: 'Le compagnon est essentiel pour les voyageurs solo — verifier le timer et les alertes.',
    },
    {
      name: 'Profil',
      files: ['src/components/views/Profile.js'],
      handlers: ['openProfile', 'openSettings', 'openEditProfile'],
      i18nKeys: ['profile', 'settings'],
      advice100: 'Ajouter l\'export de donnees RGPD directement depuis le profil.',
      adviceLow: 'Le profil doit afficher les stats, badges et historique correctement.',
    },
    {
      name: 'Voyage',
      files: ['src/components/views/Travel.js', 'src/services/osrm.js'],
      handlers: ['planTrip', 'clearTrip', 'setRouteFilter'],
      i18nKeys: ['planTrip', 'routeInfo'],
      advice100: 'Ajouter le partage d\'itineraire avec d\'autres utilisateurs.',
      adviceLow: 'Le planificateur doit calculer et afficher les routes correctement.',
    },
    {
      name: 'Auth',
      files: ['src/components/modals/Auth.js', 'src/services/firebase.js'],
      handlers: ['openAuth', 'closeAuth', 'loginWithEmail'],
      i18nKeys: ['login', 'register', 'logout'],
      advice100: 'Ajouter la connexion par lien magique (magic link) pour simplifier.',
      adviceLow: 'L\'auth est un prealable — Google/Facebook/Email doivent tous fonctionner.',
    },
    {
      name: 'Guides',
      files: ['src/components/views/Guides.js'],
      handlers: ['openGuides', 'voteGuideTip', 'submitGuideSuggestion'],
      i18nKeys: ['countryGuides', 'tipUseful'],
      advice100: 'Enrichir les guides avec des photos et des cartes interactives par pays.',
      adviceLow: 'Les guides sont un argument SEO majeur — verifier qu\'ils sont accessibles.',
    },
  ]

  // Collect all handler names from src files
  const allSrcFiles = getAllJsFiles(join(ROOT, 'src'))
  const allHandlers = new Set()
  const allSrcContent = {}
  for (const file of allSrcFiles) {
    const content = readFile(file)
    allSrcContent[relative(ROOT, file)] = content
    const handlers = (content.match(/window\.(\w+)\s*=/g) || [])
      .map(h => h.replace('window.', '').replace(/\s*=$/, ''))
    for (const h of handlers) allHandlers.add(h)
  }

  // Load first i18n file for key checking
  const frLangPath = join(ROOT, 'src', 'i18n', 'lang', 'fr.js')
  const frContent = readFile(frLangPath)

  let totalFeatureScore = 0
  const maxFeatureScore = features.length * 4 // 4 points per feature

  for (const feat of features) {
    let fScore = 0
    const missingHandlers = []
    const missingI18n = []

    // 1 point: files exist
    const filesExist = feat.files.every(f => existsSync(join(ROOT, f)))
    if (filesExist) fScore++

    // 1 point: handlers registered
    for (const h of feat.handlers) {
      if (allHandlers.has(h)) { /* ok */ } else missingHandlers.push(h)
    }
    const handlersOk = feat.handlers.length - missingHandlers.length
    if (handlersOk >= feat.handlers.length * 0.8) fScore++
    else if (handlersOk > 0) fScore += 0.5

    // 1 point: i18n keys present
    for (const k of feat.i18nKeys) {
      if (frContent.includes(k)) { /* ok */ } else missingI18n.push(k)
    }
    const i18nOk = feat.i18nKeys.length - missingI18n.length
    if (i18nOk >= feat.i18nKeys.length * 0.8) fScore++
    else if (i18nOk > 0) fScore += 0.5

    // 1 point: file not empty (> 50 lines)
    let mainFileLines = 0
    const mainFile = feat.files[0]
    if (filesExist) {
      const content = readFile(join(ROOT, mainFile))
      mainFileLines = content.split('\n').length
      if (mainFileLines > 50) fScore++
    }

    totalFeatureScore += fScore

    const pct = Math.round((fScore / 4) * 100)
    const icon = pct >= 90 ? '++' : pct >= 60 ? 'OK' : '!!'
    findings.push(`[${icon}] ${feat.name}: ${fScore}/4 (${pct}%)`)

    // === PER-FEATURE RECOMMENDATIONS ===
    if (pct === 100) {
      // Feature is perfect — give next-level advice
      findings.push(`     -> ${feat.advice100}`)
    } else {
      // Feature needs work — give specific advice
      const issues = []
      if (!filesExist) issues.push('fichiers manquants')
      if (missingHandlers.length > 0) issues.push(`handlers manquants: ${missingHandlers.join(', ')}`)
      if (missingI18n.length > 0) issues.push(`i18n manquantes: ${missingI18n.join(', ')}`)
      if (mainFileLines > 0 && mainFileLines <= 50) issues.push('fichier principal trop court (<50 lignes)')

      if (issues.length > 0) {
        findings.push(`     -> A corriger: ${issues.join('; ')}`)
      }
      findings.push(`     -> ${feat.adviceLow}`)
    }
  }

  // Score: proportional to feature coverage
  score = Math.round((totalFeatureScore / maxFeatureScore) * max)
  findings.unshift(`Score global features: ${Math.round(totalFeatureScore)}/${maxFeatureScore}`)

  log(`  Score: ${score}/${max}`)
  phase('Feature Scores', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 14: COMPETITIVE INTELLIGENCE — web research per feature
// ═══════════════════════════════════════════════════════════════

function phase14_competitiveIntel() {
  header(14, 'COMPETITIVE INTELLIGENCE')
  let score = 0
  const max = 10
  const findings = []
  const details = []

  if (isQuick) {
    findings.push('Analyse concurrentielle sautee en mode --quick')
    score += 5
    log(`  Score: ${score}/${max} (skip)`)
    phase('Competitive Intelligence', score, max, findings, details)
    return
  }

  // Each feature domain is compared to the BEST apps in that specific category
  const domains = [
    {
      feature: 'Carte & Itineraire',
      queries: ['best route planning app features 2026', 'Google Maps Waze Komoot features comparison'],
      referenceApps: ['Google Maps', 'Waze', 'Komoot', 'Maps.me'],
      knownBestFeatures: [
        'turn-by-turn navigation', 'offline maps download', 'real-time traffic',
        'street view', 'ETA estimation', 'alternative routes', 'speed camera alerts',
        'voice guidance', 'live location sharing', 'save places', 'multi-stop route',
        'elevation profile', 'route conditions warnings',
      ],
      spothitchHas: ['offline map tiles', 'route planning', 'save favorites', 'spots along route', 'multi-city planner', 'heatmap'],
    },
    {
      feature: 'Messagerie & Social',
      queries: ['best messaging app features 2026', 'WhatsApp Telegram Discord comparison'],
      referenceApps: ['WhatsApp', 'Telegram', 'Discord', 'Signal'],
      knownBestFeatures: [
        'read receipts', 'typing indicators', 'voice messages', 'group chats',
        'media sharing', 'message reactions', 'message search', 'pinned messages',
        'disappearing messages', 'video calls', 'status stories', 'message forwarding',
        'reply to specific message', 'mentions', 'threads', 'file sharing',
      ],
      spothitchHas: ['text messages', 'group chats', 'emoji reactions', 'zone chat', 'direct messages', 'friend activity feed'],
    },
    {
      feature: 'Gamification',
      queries: ['best gamification app features 2026', 'Duolingo Strava gamification design'],
      referenceApps: ['Duolingo', 'Strava', 'Nike Run Club', 'Habitica'],
      knownBestFeatures: [
        'daily streaks', 'XP system', 'levels', 'badges', 'leaderboards',
        'friend challenges', 'seasonal events', 'achievement trees', 'progress bars',
        'milestone rewards', 'social sharing achievements', 'hearts lives system',
        'combo multiplier', 'weekly goals', 'tier rewards',
      ],
      spothitchHas: ['XP', 'badges', 'levels', 'leaderboard', 'daily reward', 'challenges', 'leagues', 'VIP', 'streaks', 'team challenges'],
    },
    {
      feature: 'Mode SOS (urgence)',
      queries: ['best emergency SOS app features 2026', 'bSafe panic button safety app'],
      referenceApps: ['bSafe', 'Noonlight', 'Life360', 'Kitestring'],
      knownBestFeatures: [
        'one-tap SOS button', 'auto-call emergency services', 'SMS alert to contacts',
        'live GPS location sharing', 'audio recording', 'video recording',
        'shake to trigger SOS', 'countdown before alert', 'offline SOS mode',
        'emergency contacts management', 'fake call to escape', 'evidence collection',
        'police report integration', 'customizable alert message', 'silent alarm mode',
      ],
      spothitchHas: ['SOS button', 'location sharing', 'emergency contacts', 'SOS disclaimer'],
    },
    {
      feature: 'Mode Compagnon (solo travel)',
      queries: ['best solo traveler safety check-in app 2026', 'companion mode travel safety app'],
      referenceApps: ['bSafe', 'Kitestring', 'TripWhistle', 'Bugle'],
      knownBestFeatures: [
        'automatic timed check-ins', 'missed check-in alert to contacts',
        'custom check-in intervals', 'GPS breadcrumb trail', 'battery low auto-alert',
        'safe arrival notification', 'departure notification', 'route tracking',
        'estimated arrival time', 'inactivity detection', 'SMS fallback if no internet',
        'trusted contacts circle', 'check-in reminder notification', 'travel timeline history',
      ],
      spothitchHas: ['companion check-in', 'timed alerts', 'companion consent', 'location sharing'],
    },
    {
      feature: 'Profil Utilisateur',
      queries: ['best user profile social travel app 2026', 'Couchsurfing profile design'],
      referenceApps: ['Couchsurfing', 'Instagram', 'LinkedIn', 'Strava'],
      knownBestFeatures: [
        'profile photo', 'bio', 'stats dashboard', 'achievement showcase',
        'travel map visited places', 'references reviews from others', 'verification badges',
        'privacy controls', 'activity feed', 'shared trips', 'languages spoken',
        'travel style preferences', 'skill endorsements',
      ],
      spothitchHas: ['avatar', 'stats', 'badges', 'titles', 'custom frames', 'verification levels', 'activity feed'],
    },
    {
      feature: 'Planification Voyage',
      queries: ['best trip planning app features 2026', 'Roadtrippers Rome2Rio TripIt features'],
      referenceApps: ['Google Travel', 'TripIt', 'Roadtrippers', 'Rome2Rio'],
      knownBestFeatures: [
        'multi-stop itinerary', 'accommodation suggestions', 'budget tracking',
        'packing lists', 'weather forecast', 'document storage', 'offline access',
        'collaborative planning', 'points of interest along route', 'time estimates',
        'currency converter', 'transport comparator', 'travel calendar',
      ],
      spothitchHas: ['multi-city planner', 'route analysis', 'spots along route', 'trip history', 'amenities along route', 'route filters'],
    },
    {
      feature: 'Guides & Contenu',
      queries: ['best travel guide app features 2026', 'Lonely Planet WikiVoyage app comparison'],
      referenceApps: ['Lonely Planet', 'TripAdvisor', 'WikiVoyage', 'Culture Trip'],
      knownBestFeatures: [
        'offline guides', 'photo galleries', 'local tips', 'restaurant recommendations',
        'cultural etiquette', 'visa info', 'phrase book', 'currency info',
        'safety ratings', 'best time to visit', 'events calendar', 'user reviews',
        'interactive maps in guides', 'bookmark articles', 'nearby attractions',
      ],
      spothitchHas: ['53 country guides', 'community tips', 'difficulty rating', 'legality info', 'emergency numbers', 'useful phrases', 'vote on tips'],
    },
    {
      feature: 'PWA & Performance',
      queries: ['best progressive web app features 2026', 'PWA best practices mobile'],
      referenceApps: ['Twitter Lite', 'Starbucks PWA', 'Pinterest PWA'],
      knownBestFeatures: [
        'instant loading 3s', 'full offline mode', 'push notifications',
        'add to home screen', 'background sync', 'smooth animations 60fps',
        'lazy loading', 'skeleton screens', 'auto-update', 'share target',
        'app shortcuts', 'badging API',
      ],
      spothitchHas: ['PWA installable', 'offline mode', 'push notifications', 'lazy loading', 'service worker', 'background sync', 'auto-update', 'skeleton screens'],
    },
  ]

  let totalKnown = 0
  let totalCovered = 0
  const topOpportunities = []

  for (const domain of domains) {
    // Compare known best features with what SpotHitch has
    let covered = 0
    const missing = []

    for (const feat of domain.knownBestFeatures) {
      const words = feat.toLowerCase().split(/\s+/)
      const isPresent = domain.spothitchHas.some(s => {
        const sLower = s.toLowerCase()
        return words.some(w => w.length > 3 && sLower.includes(w))
      })
      if (isPresent) covered++
      else missing.push(feat)
    }

    totalKnown += domain.knownBestFeatures.length
    totalCovered += covered
    const pct = Math.round((covered / domain.knownBestFeatures.length) * 100)
    findings.push(`${domain.feature}: ${pct}% (${covered}/${domain.knownBestFeatures.length}) — ref: ${domain.referenceApps.slice(0, 2).join(', ')}`)

    // Top 3 missing features as opportunities
    for (const m of missing.slice(0, 3)) {
      topOpportunities.push({ domain: domain.feature, feature: m, refs: domain.referenceApps })
    }

    if (missing.length > 0) {
      details.push(`[${domain.feature}] Manque (inspire par ${domain.referenceApps[0]}): ${missing.slice(0, 4).join(', ')}`)
    }

    // === WEB SEARCH for fresh ideas ===
    if (domain.queries.length > 0) {
      log(`  Recherche web: ${domain.feature}...`)
      const result = webSearch(domain.queries[0])
      if (result.snippets && result.snippets.length > 0) {
        const novelKeywords = extractFeatureKeywords(result.snippets)
        const trulyNovel = novelKeywords.filter(k =>
          !domain.knownBestFeatures.some(f => f.includes(k.split(' ')[0])) &&
          !domain.spothitchHas.some(s => s.toLowerCase().includes(k.split(' ')[0]))
        )
        if (trulyNovel.length > 0) {
          details.push(`[${domain.feature}] Idees du web: ${trulyNovel.slice(0, 3).join(', ')}`)
        }
      }
    }
  }

  // Score based on competitive coverage
  const overallPct = Math.round((totalCovered / totalKnown) * 100)
  if (overallPct >= 60) score += 6
  else if (overallPct >= 40) score += 4
  else if (overallPct >= 25) score += 2
  else score += 1

  findings.unshift(`Couverture concurrentielle globale: ${overallPct}% (${totalCovered}/${totalKnown})`)

  // Show top opportunities
  if (topOpportunities.length > 0) {
    score += Math.min(4, Math.floor(topOpportunities.length / 4))
    log('\n  --- TOP OPPORTUNITES (fonctions des meilleurs concurrents) ---')
    for (const opp of topOpportunities.slice(0, 10)) {
      log(`  [${opp.domain}] "${opp.feature}" (vu chez ${opp.refs.slice(0, 2).join(', ')})`)
    }
    if (topOpportunities.length > 10) {
      log(`  ... et ${topOpportunities.length - 10} autres idees`)
    }
  }

  log(`  Score: ${score}/${max}`)
  phase('Competitive Intelligence', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 15: SCORE + SELF-EVALUATION
// ═══════════════════════════════════════════════════════════════

function phase15_score() {
  header(15, 'SCORE + AUTO-EVALUATION')

  const score100 = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  // Compare with last run
  const lastRun = memory.runs[memory.runs.length - 1]
  let trend = ''
  if (lastRun) {
    const diff = score100 - lastRun.score
    if (diff > 0) trend = `(+${diff} depuis le dernier run)`
    else if (diff < 0) trend = `(${diff} depuis le dernier run)`
    else trend = '(= stable)'
  } else {
    trend = '(premier run — baseline etablie)'
  }

  log('')
  log(`  SCORE GLOBAL: ${score100}/100 ${trend}`)
  log('')

  // Self-evaluation
  const weakPhases = phases.filter(p => p.score < p.max * 0.6)
  const strongPhases = phases.filter(p => p.score >= p.max * 0.9)

  if (weakPhases.length > 0) {
    log('  Points faibles:')
    for (const p of weakPhases) {
      log(`    - ${p.name}: ${p.score}/${p.max}`)
    }
  }

  if (strongPhases.length > 0) {
    log('  Points forts:')
    for (const p of strongPhases) {
      log(`    - ${p.name}: ${p.score}/${p.max}`)
    }
  }

  // Confidence assessment
  const confidence = score100 >= 80 ? 'HAUTE'
    : score100 >= 60 ? 'MOYENNE'
    : 'FAIBLE'

  log(`\n  Confiance du loup: ${confidence}`)

  // What the wolf doesn't test yet
  const limitations = []
  if (isQuick) limitations.push('Lighthouse + Screenshots + Recherche Web sautes (mode --quick)')
  limitations.push('Pas de test de charge (100K utilisateurs)')
  limitations.push('Pas de test de chat en temps reel (WebSocket)')
  limitations.push('Pas de verification push notifications (Firebase Messaging)')
  limitations.push('Pas de test E2E complet (utiliser npm run test:e2e)')
  limitations.push('Pas de test multi-navigateurs (seulement Chromium)')

  if (limitations.length > 0) {
    log('\n  Ce que le loup ne verifie PAS encore:')
    for (const l of limitations) log(`    - ${l}`)
  }

  return { score100, trend, confidence }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 16: RECOMMENDATIONS + EVOLUTION
// ═══════════════════════════════════════════════════════════════

function phase16_recommendations(scoreResult) {
  header(16, 'RECOMMANDATIONS')
  const newRecs = []

  // ── Build enriched, human-readable recommendations ──
  // Each recommendation has: title (short), explain (why it matters), action (what to do), impact (what it fixes)

  for (const p of phases) {
    for (const d of p.details) {
      const enriched = enrichRecommendation(p.name, d, p.score, p.max)
      newRecs.push(enriched)
    }
  }

  // Check for patterns across runs
  if (memory.runs.length >= 3) {
    const lastScores = memory.runs.slice(-3).map(r => r.score)
    if (lastScores.every((s, i) => i === 0 || s <= lastScores[i - 1])) {
      newRecs.push({
        source: 'Tendance',
        text: 'Le score baisse depuis 3 runs consecutifs',
        title: 'Score en baisse',
        explain: 'Le score du loup diminue a chaque verification. Ca veut dire que le code se degrade petit a petit au lieu de s\'ameliorer.',
        action: 'Regarder les recommandations non-suivies ci-dessous et les corriger une par une.',
        impact: 'Remonter le score et eviter que des bugs s\'accumulent.',
        priority: 'HAUTE',
        createdAt: new Date().toISOString(),
        followed: false,
      })
    }
  }

  // Track which old recommendations were followed
  if (memory.recommendations.length > 0) {
    let followed = 0
    let ignored = 0
    for (const rec of memory.recommendations) {
      const stillExists = phases.some(p => p.details.some(d => d === rec.text))
      if (!stillExists && !rec.followed) {
        rec.followed = true
        rec.followedAt = new Date().toISOString()
        followed++
      } else if (stillExists) {
        ignored++
      }
    }
    if (followed > 0) log(`\n  ${followed} recommandation(s) corrigee(s) depuis le dernier run`)
    if (ignored > 0) log(`  ${ignored} recommandation(s) toujours en attente`)
  }

  // Deduplicate recommendations by title — group and count
  const grouped = new Map()
  for (const r of newRecs) {
    const key = r.title
    if (grouped.has(key)) {
      grouped.get(key).count++
      if (r.priority === 'HAUTE') grouped.get(key).rec.priority = 'HAUTE'
    } else {
      grouped.set(key, { rec: r, count: 1 })
    }
  }
  const dedupedRecs = [...grouped.values()].map(({ rec, count }) => ({ ...rec, count }))

  // === RECOMMENDATIONS PAR PHASE ===
  log('\n  --- RECOMMANDATIONS PAR PHASE ---')
  for (const p of phases) {
    const pct = Math.round((p.score / p.max) * 100)
    if (pct >= 90) continue // Skip perfect phases

    log(`\n  [${p.name}] ${p.score}/${p.max} (${pct}%)`)

    // Generate phase-specific action plan
    const phaseAdvice = getPhaseAdvice(p.name, p.score, p.max, p.findings, p.details)
    if (phaseAdvice) {
      log(`     Objectif : ${phaseAdvice.goal}`)
      log(`     Action   : ${phaseAdvice.action}`)
      log(`     Gain     : +${phaseAdvice.pointsGain} points possible`)
    }

    // Show top 3 details for this phase
    const topDetails = p.details.slice(0, 3)
    for (const d of topDetails) {
      log(`     - ${d.slice(0, 100)}${d.length > 100 ? '...' : ''}`)
    }
    if (p.details.length > 3) {
      log(`     ... et ${p.details.length - 3} autre(s)`)
    }
  }

  // === GLOBAL RECOMMENDATIONS (deduplicated) ===
  if (dedupedRecs.length > 0) {
    const haute = dedupedRecs.filter(r => r.priority === 'HAUTE')
    const moyenne = dedupedRecs.filter(r => r.priority === 'MOYENNE')

    if (haute.length > 0) {
      log('\n  --- TOP 5 URGENT ---')
      for (const r of haute.slice(0, 5)) {
        printRecommendation(r)
      }
      if (haute.length > 5) log(`\n  ... et ${haute.length - 5} autre(s) recommandation(s) urgente(s)`)
    }

    if (moyenne.length > 0) {
      log('\n  --- AMELIORATIONS ---')
      for (const r of moyenne.slice(0, 3)) {
        printRecommendation(r)
      }
    }
  } else {
    log('\n  Aucune recommandation — tout est propre !')
  }

  // ═══════════════════════════════════════════════════════════════
  // WOLF SELF-EVALUATION — mandatory deep analysis every run
  // ═══════════════════════════════════════════════════════════════
  log('\n  --- AUTO-EVALUATION DU LOUP (obligatoire) ---')
  const selfEval = { perPhase: [], global: [], evolution: [] }

  // === PER-PHASE ANALYSIS: what worked, what didn't, why ===
  for (const p of phases) {
    const pct = Math.round((p.score / p.max) * 100)
    const entry = { name: p.name, pct, score: p.score, max: p.max }

    if (pct === 100) {
      entry.verdict = 'PARFAIT'
      entry.insight = 'Rien a ameliorer sur cette phase.'
    } else if (pct >= 80) {
      entry.verdict = 'BON'
      entry.insight = `${p.details.length} detail(s) mineur(s) a traiter.`
    } else if (pct >= 50) {
      entry.verdict = 'A AMELIORER'
      entry.insight = `Score moyen — ${p.details.length} probleme(s) detecte(s). Priorite moyenne.`
    } else {
      entry.verdict = 'CRITIQUE'
      entry.insight = `Score bas — ${p.details.length} probleme(s) a corriger en priorite.`
    }

    // Check if this phase improved since last run
    const lastRun = memory.runs[memory.runs.length - 1]
    if (lastRun?.phases) {
      const lastPhase = lastRun.phases.find(lp => lp.name === p.name)
      if (lastPhase) {
        const lastPct = Math.round((lastPhase.score / lastPhase.max) * 100)
        if (pct > lastPct) entry.trend = `+${pct - lastPct}% (amelioration)`
        else if (pct < lastPct) entry.trend = `${pct - lastPct}% (regression)`
        else entry.trend = 'stable'
      } else {
        entry.trend = 'nouvelle phase'
      }
    }

    selfEval.perPhase.push(entry)
  }

  // Display per-phase verdict
  log('')
  for (const e of selfEval.perPhase) {
    const trendStr = e.trend ? ` [${e.trend}]` : ''
    const icon = e.verdict === 'PARFAIT' ? '++' : e.verdict === 'BON' ? 'OK' : e.verdict === 'A AMELIORER' ? '!!' : 'XX'
    log(`  [${icon}] ${e.name}: ${e.pct}% — ${e.verdict}${trendStr}`)
    if (e.verdict === 'CRITIQUE' || e.verdict === 'A AMELIORER') {
      log(`       ${e.insight}`)
    }
  }

  // === GLOBAL ANALYSIS: patterns, trends, accuracy ===
  log('\n  --- ANALYSE GLOBALE ---')

  // 1. Detection accuracy: check if recommendation count is reasonable
  if (newRecs.length > 40) {
    selfEval.global.push('Detection trop bruyante (' + newRecs.length + ' recs brutes). Augmenter les seuils de tolerance.')
  } else if (newRecs.length < 3) {
    selfEval.global.push('Tres peu de recommandations (' + newRecs.length + '). Le loup est peut-etre trop indulgent.')
  } else {
    selfEval.global.push('Volume de recommandations raisonnable (' + newRecs.length + ').')
  }

  // 2. Score balance: are all phases contributing fairly?
  const minPct = Math.min(...selfEval.perPhase.map(e => e.pct))
  const maxPctVal = Math.max(...selfEval.perPhase.map(e => e.pct))
  const spread = maxPctVal - minPct
  if (spread > 60) {
    const weakest = selfEval.perPhase.find(e => e.pct === minPct)
    selfEval.global.push(`Ecart de ${spread}% entre phases — "${weakest.name}" tire le score vers le bas.`)
  }

  // 3. Run-over-run trends
  if (memory.runs.length >= 2) {
    const scores = memory.runs.slice(-5).map(r => r.score)
    const latest = scores[scores.length - 1]
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    if (latest > avg) {
      selfEval.global.push(`Tendance positive: score actuel (${scoreResult.score100}) au-dessus de la moyenne des ${scores.length} derniers runs (${avg}).`)
    } else if (latest < avg - 5) {
      selfEval.global.push(`Tendance negative: score actuel (${scoreResult.score100}) sous la moyenne recente (${avg}). Corriger les regressions.`)
    } else {
      selfEval.global.push(`Score stable autour de ${avg}/100 sur les ${scores.length} derniers runs.`)
    }
  }

  // 4. Test coverage check
  const srcFilesForCov = getAllJsFiles(join(ROOT, 'src'))
  const testDirForCov = join(ROOT, 'tests')
  let filesWithTests = 0
  if (existsSync(testDirForCov)) {
    const allTestFiles = getAllJsFiles(testDirForCov)
    const testContent = allTestFiles.map(f => readFile(f)).join('\n')
    for (const sf of srcFilesForCov) {
      const name = basename(sf, '.js')
      if (testContent.includes(name)) filesWithTests++
    }
  }
  const coveragePct = srcFilesForCov.length > 0 ? Math.round((filesWithTests / srcFilesForCov.length) * 100) : 0
  selfEval.global.push(`Couverture de tests: ${filesWithTests}/${srcFilesForCov.length} fichiers src/ references dans les tests (${coveragePct}%).`)

  // 5. Recommendation follow-through rate
  const allRecs = memory.recommendations || []
  const followedRecs = allRecs.filter(r => r.followed)
  const followRate = allRecs.length > 0 ? Math.round((followedRecs.length / allRecs.length) * 100) : 0
  if (followRate < 30 && allRecs.length > 10) {
    selfEval.global.push(`Seulement ${followRate}% des recommandations passees ont ete suivies. Les recommandations sont-elles trop vagues ?`)
  } else if (followRate > 70) {
    selfEval.global.push(`${followRate}% des recommandations suivies — bonne discipline.`)
  }

  for (const g of selfEval.global) {
    log(`  >> ${g}`)
  }

  // === EVOLUTION: what should the wolf learn for next run? ===
  log('\n  --- EVOLUTION (ce que le loup apprend) ---')

  // Detect phases that have been stuck for 3+ runs
  if (memory.runs.length >= 3) {
    for (const p of phases) {
      const history = memory.runs.slice(-3).map(r => {
        const ph = (r.phases || []).find(x => x.name === p.name)
        return ph ? Math.round((ph.score / ph.max) * 100) : null
      }).filter(v => v !== null)

      if (history.length >= 2 && history.every(v => v === history[0]) && history[0] < 80) {
        selfEval.evolution.push(`"${p.name}" bloquee a ${history[0]}% depuis ${history.length} runs. Besoin d'une action differente.`)
      }
    }
  }

  // Suggest specific improvements based on weakest areas
  const criticalPhases = selfEval.perPhase.filter(e => e.pct < 50).sort((a, b) => a.pct - b.pct)
  if (criticalPhases.length > 0) {
    const worst = criticalPhases[0]
    selfEval.evolution.push(`Priorite #1 pour le prochain run: ameliorer "${worst.name}" (${worst.pct}%).`)
  }

  // Check if the wolf should adjust its own scoring
  if (scoreResult.score100 === 100) {
    selfEval.evolution.push('Score parfait atteint — le loup devrait ajouter de nouveaux checks pour rester exigeant.')
  }

  // Suggest new checks based on what's missing
  if (!phases.some(p => p.name === 'Test Coverage')) {
    selfEval.evolution.push('Prochain ajout possible: phase "Test Coverage" (% de fichiers avec tests).')
  }

  if (selfEval.evolution.length === 0) {
    selfEval.evolution.push('Le loup est satisfait de sa configuration actuelle. Continuer a surveiller les tendances.')
  }

  for (const e of selfEval.evolution) {
    log(`  -> ${e}`)
  }

  // Store self-evaluation in memory for next run comparison
  memory.selfEvaluation = {
    date: new Date().toISOString(),
    score: scoreResult.score100,
    perPhase: selfEval.perPhase.map(e => ({ name: e.name, pct: e.pct, verdict: e.verdict })),
    globalInsights: selfEval.global,
    evolutionItems: selfEval.evolution,
    coveragePct,
    recommendationFollowRate: followRate,
  }

  const runCount = memory.runs.length + 1
  log(`\n  Run #${runCount}`)

  // Store dedupedRecs on memory for HTML report access
  memory._dedupedRecs = dedupedRecs

  return newRecs
}

/**
 * Get specific advice for a phase to improve its score
 */
function getPhaseAdvice(name, score, max, findings, details) {
  const pct = Math.round((score / max) * 100)
  const gap = max - score

  const adviceMap = {
    'Code Quality': {
      goal: 'Passer de ' + pct + '% a 100%',
      action: 'npx eslint src/ --fix && node scripts/lint-i18n.mjs && node scripts/audit-rgpd.mjs',
      pointsGain: gap,
    },
    'Unit Tests': {
      goal: 'Tous les tests passent',
      action: 'npx vitest run — corriger les tests qui echouent un par un',
      pointsGain: gap,
    },
    'Build': {
      goal: 'Build OK + bundle < 750KB',
      action: 'npm run build — verifier les imports inutiles si bundle trop gros',
      pointsGain: gap,
    },
    'Impact Analysis': {
      goal: 'Pas d\'impact critique non couvert par des tests',
      action: 'Ajouter des tests pour les fichiers modifies recemment',
      pointsGain: gap,
    },
    'Feature Inventory': {
      goal: 'Tous les services sont branches + memoire a jour',
      action: 'Brancher ou supprimer les services orphelins, mettre a jour features.md',
      pointsGain: gap,
    },
    'Regression Guard': {
      goal: '0 handlers dupliques, 0 regressions',
      action: 'Dedupliquer les 100 handlers window.* — garder 1 seule definition par handler dans le fichier de la feature',
      pointsGain: gap,
    },
    'Wiring Integrity': {
      goal: 'Chaque open a un close, chaque onclick fonctionne',
      action: 'Ajouter les close handlers manquants + corriger les onclick qui pointent vers des fonctions inexistantes',
      pointsGain: gap,
    },
    'Dead Code': {
      goal: '< 5% d\'exports morts',
      action: 'Supprimer les fonctions et exports jamais utilises (voir la liste ci-dessus)',
      pointsGain: gap,
    },
    'Multi-Level Audit': {
      goal: 'SEO complet + securite + a11y',
      action: 'Generer plus de pages SEO, verifier les meta tags, renforcer le CSP',
      pointsGain: gap,
    },
    'Lighthouse': {
      goal: 'Performance > 70, Accessibilite > 90, SEO > 80',
      action: 'Installer @lhci/cli et configurer lighthouserc.js pour mesurer les vrais scores',
      pointsGain: gap,
    },
    'Screenshots': {
      goal: 'Screenshots des pages principales captures automatiquement',
      action: 'Verifier que Playwright + Chromium sont installes (npx playwright install chromium)',
      pointsGain: gap,
    },
    'Feature Scores': {
      goal: 'Toutes les features a 100%',
      action: 'Verifier les recommandations par feature ci-dessus',
      pointsGain: gap,
    },
    'Button & Link Audit': {
      goal: '0 boutons casses, 0 liens morts, 0 handlers vides, 0 placeholders',
      action: 'Corriger chaque onclick qui pointe vers une fonction inexistante, implementer les handlers vides, supprimer les TODO',
      pointsGain: gap,
    },
    'Competitive Intelligence': {
      goal: '> 60% de couverture des fonctionnalites des meilleurs concurrents',
      action: 'Implementer les fonctionnalites manquantes les plus impactantes (voir TOP OPPORTUNITES)',
      pointsGain: gap,
    },
  }

  return adviceMap[name] || {
    goal: 'Ameliorer le score de ' + pct + '% a 100%',
    action: 'Voir les details ci-dessus',
    pointsGain: gap,
  }
}

/**
 * Print a single recommendation in human-readable format
 */
function printRecommendation(r) {
  const icon = r.priority === 'HAUTE' ? '!!' : '>>'
  const countLabel = r.count > 1 ? ` (x${r.count})` : ''
  log(`\n  ${icon} ${r.title}${countLabel}`)
  log(`     Pourquoi : ${r.explain}`)
  log(`     A faire  : ${r.action}`)
  log(`     Resultat : ${r.impact}`)
}

/**
 * Enrich a raw detail string into a human-readable recommendation
 */
function enrichRecommendation(phaseName, rawDetail, phaseScore, phaseMax) {
  const base = {
    source: phaseName,
    text: rawDetail,
    createdAt: new Date().toISOString(),
    followed: false,
    priority: phaseScore < phaseMax * 0.5 ? 'HAUTE' : 'MOYENNE',
  }

  // --- Code Quality ---
  if (rawDetail.includes('eslint') || rawDetail.includes('ESLint') || rawDetail.includes('--fix')) {
    return { ...base,
      title: 'Nettoyage automatique du code (ESLint)',
      explain: 'ESLint trouve des petites erreurs de style dans le code (espaces, variables inutilisees). Ca ne casse rien mais ca rend le code moins propre.',
      action: 'Lancer la commande : npx eslint src/ --fix (ca corrige tout automatiquement).',
      impact: 'Code plus propre, plus facile a maintenir, et le score Code Quality passe a 15/15.',
    }
  }

  // --- Orphan services ---
  if (rawDetail.includes('orphelin') || rawDetail.includes('orphan') || rawDetail.includes('jamais importe')) {
    const serviceMatch = rawDetail.match(/:\s*(.+)$/)
    const services = serviceMatch ? serviceMatch[1] : '(voir liste)'
    return { ...base,
      title: 'Services codes mais invisibles pour les utilisateurs',
      explain: 'Ces fonctionnalites ont ete codees mais ne sont accessibles nulle part dans l\'app. Aucun bouton ne les ouvre, aucun ecran ne les affiche. C\'est du code "fantome" — il existe mais personne ne peut l\'utiliser.',
      action: 'Deux choix : (A) Supprimer les fichiers inutiles pour alleger le code, ou (B) Les brancher dans l\'app en ajoutant les boutons/ecrans necessaires.',
      impact: 'Option A = code plus leger et plus clair. Option B = nouvelles fonctionnalites pour les utilisateurs.',
    }
  }

  // --- Missing close handlers ---
  if (rawDetail.includes('close handler') || rawDetail.includes('sans handler close') || rawDetail.includes('sans close')) {
    return { ...base,
      title: 'Des fenetres popup ne peuvent pas etre fermees',
      explain: 'Certaines fenetres (modales) s\'ouvrent mais n\'ont pas de bouton "fermer" fonctionnel. L\'utilisateur reste bloque s\'il ouvre une de ces fenetres.',
      action: 'Ajouter un handler window.closeXxx pour chaque modale qui en manque un.',
      impact: 'Les utilisateurs pourront fermer toutes les fenetres popup sans rester bloques.',
    }
  }

  // --- SEO ---
  if (rawDetail.includes('SEO') || rawDetail.includes('sitemap') || rawDetail.includes('guides')) {
    return { ...base,
      title: 'Le site est peu visible sur Google',
      explain: 'Il manque des pages de contenu (guides, pages villes) qui permettent a Google de trouver le site quand quelqu\'un cherche "autostop" ou "hitchhiking spot".',
      action: 'Generer des pages guides pour les destinations populaires (ex: "Autostop a Paris", "Hitchhiking from Berlin").',
      impact: 'Plus de visiteurs venant de Google = plus d\'utilisateurs sans pub payante.',
    }
  }

  // --- Performance / bundle ---
  if (rawDetail.includes('bundle') || rawDetail.includes('chunk') || rawDetail.includes('KB')) {
    return { ...base,
      title: 'L\'app est un peu lourde a charger',
      explain: 'Le poids total de l\'app depasse la limite recommandee. Sur un telephone avec une connexion lente, ca peut mettre du temps a s\'afficher.',
      action: 'Verifier les imports inutiles et activer le code-splitting (chargement a la demande).',
      impact: 'L\'app charge plus vite, surtout pour les utilisateurs avec des vieux telephones ou en 3G.',
    }
  }

  // --- Security ---
  if (rawDetail.includes('securite') || rawDetail.includes('CSP') || rawDetail.includes('sanitiz')) {
    return { ...base,
      title: 'Protection de securite manquante',
      explain: 'Certaines protections contre les attaques web (injection de code, vol de donnees) ne sont pas en place.',
      action: 'Ajouter une Content-Security-Policy dans index.html et verifier que DOMPurify est actif.',
      impact: 'Les utilisateurs sont proteges contre les attaques courantes.',
      priority: 'HAUTE',
    }
  }

  // --- Legal ---
  if (rawDetail.includes('Legal') || rawDetail.includes('PRIVACY') || rawDetail.includes('TERMS') || rawDetail.includes('Cookie')) {
    return { ...base,
      title: 'Documents legaux manquants',
      explain: 'L\'app doit avoir des conditions d\'utilisation, une politique de confidentialite, et un bandeau cookies pour etre conforme RGPD.',
      action: 'Ajouter les fichiers manquants (PRIVACY.md, TERMS.md, ou CookieBanner).',
      impact: 'Le site est legal en Europe et inspire confiance aux utilisateurs.',
      priority: 'HAUTE',
    }
  }

  // --- Accessibility ---
  if (rawDetail.includes('accessibilite') || rawDetail.includes('a11y') || rawDetail.includes('ARIA')) {
    return { ...base,
      title: 'Ameliorer l\'accessibilite',
      explain: 'Les personnes avec un handicap (malvoyants, utilisateurs de lecteurs d\'ecran) peuvent avoir du mal a utiliser l\'app.',
      action: 'Ajouter les attributs ARIA manquants et verifier la navigation au clavier.',
      impact: 'L\'app est utilisable par tout le monde, y compris les personnes en situation de handicap.',
    }
  }

  // --- i18n ---
  if (rawDetail.includes('langue') || rawDetail.includes('i18n') || rawDetail.includes('traduction')) {
    return { ...base,
      title: 'Traductions manquantes',
      explain: 'Certains textes ne sont pas traduits dans les 4 langues (FR/EN/ES/DE). Les utilisateurs non-francophones verront des textes en anglais par defaut.',
      action: 'Lancer node scripts/lint-i18n.mjs pour voir les cles manquantes et les ajouter.',
      impact: 'Tous les utilisateurs voient l\'app dans leur langue.',
    }
  }

  // --- Tests ---
  if (rawDetail.includes('tests echouent') || rawDetail.includes('FAIL') || (rawDetail.includes('echoue') && phaseName === 'Unit Tests')) {
    return { ...base,
      title: 'Des tests echouent',
      explain: 'Certains tests automatiques detectent des problemes. Ca veut dire qu\'une fonctionnalite est peut-etre cassee.',
      action: 'Lancer npx vitest run pour voir les tests qui echouent et corriger les erreurs.',
      impact: 'Toutes les fonctionnalites marchent comme prevu.',
      priority: 'HAUTE',
    }
  }

  // --- Files without tests ---
  if (rawDetail.includes('sans test unitaire')) {
    return { ...base,
      title: 'Fichiers modifies sans test correspondant',
      explain: 'Des fichiers ont ete modifies mais il n\'y a pas de test automatique qui verifie qu\'ils marchent correctement.',
      action: 'Ajouter des tests pour les fichiers modifies ou verifier manuellement.',
      impact: 'Moins de risque de casser quelque chose sans s\'en apercevoir.',
    }
  }

  // --- RGPD ---
  if (rawDetail.includes('RGPD') || rawDetail.includes('rgpd')) {
    return { ...base,
      title: 'Probleme de conformite RGPD',
      explain: 'Le reglement europeen sur les donnees personnelles n\'est pas respecte sur certains points.',
      action: 'Lancer node scripts/audit-rgpd.mjs pour voir les problemes et les corriger.',
      impact: 'Le site respecte la loi et les donnees des utilisateurs sont protegees.',
      priority: 'HAUTE',
    }
  }

  // --- Build ---
  if (rawDetail.includes('build') || rawDetail.includes('Build')) {
    return { ...base,
      title: 'Le build ne fonctionne pas',
      explain: 'Le site ne peut pas etre construit correctement — il ne se mettra pas a jour tant que ce n\'est pas corrige.',
      action: 'Lancer npm run build pour voir l\'erreur exacte et la corriger.',
      impact: 'Le site peut etre mis a jour normalement.',
      priority: 'HAUTE',
    }
  }

  // --- Regression ---
  if (rawDetail.includes('REGRESSION')) {
    return { ...base,
      title: 'Un bug deja corrige est revenu',
      explain: 'Un probleme qui avait ete resolu est reapparu. Ca arrive quand une modification casse quelque chose qui marchait avant.',
      action: 'Verifier le detail ci-dessus et re-corriger le bug.',
      impact: 'La fonctionnalite remarche comme prevu.',
      priority: 'HAUTE',
    }
  }

  // --- Dead code ---
  if (rawDetail.includes('Export mort') || rawDetail.includes('Fonction morte') || rawDetail.includes('exports morts') || rawDetail.includes('fonctions mortes')) {
    return { ...base,
      title: 'Code mort detecte (fonctions jamais utilisees)',
      explain: 'Des fonctions ont ete codees mais ne sont jamais appelees. Ca alourdit le code et cree de la confusion.',
      action: 'Supprimer les fonctions/exports listes ci-dessus. Si certaines sont utiles, les brancher dans le code.',
      impact: 'Code plus leger, plus clair, et plus facile a maintenir.',
    }
  }

  // --- Circular imports ---
  if (rawDetail.includes('Cycle') || rawDetail.includes('circulaire')) {
    return { ...base,
      title: 'Import circulaire detecte',
      explain: 'Deux fichiers s\'importent mutuellement, ce qui peut causer des bugs subtils (variables undefined au chargement).',
      action: 'Casser le cycle en deplacant le code partage dans un fichier commun (utils ou shared).',
      impact: 'Plus de bugs de chargement et meilleure stabilite.',
      priority: 'HAUTE',
    }
  }

  // --- onclick dangling ---
  if (rawDetail.includes('onclick') || rawDetail.includes('inexistante')) {
    return { ...base,
      title: 'Bouton HTML pointe vers une fonction qui n\'existe pas',
      explain: 'Un bouton dans l\'interface appelle une fonction (onclick="xxx()") mais cette fonction n\'a jamais ete definie. Le bouton ne fait rien quand on clique.',
      action: 'Soit ajouter window.xxx dans le bon fichier, soit corriger le nom dans le template HTML.',
      impact: 'Tous les boutons fonctionnent quand on clique dessus.',
      priority: 'HAUTE',
    }
  }

  // --- Duplicate handlers ---
  if (rawDetail.includes('Handler') && rawDetail.includes('defini dans')) {
    return { ...base,
      title: 'Un handler est defini dans plusieurs fichiers',
      explain: 'La meme fonction window.xxx est definie dans 2+ fichiers differents. Le dernier fichier charge "gagne" et ecrase les autres, ce qui peut casser des fonctionnalites.',
      action: 'Garder le handler dans un seul fichier (celui qui gere la feature) et supprimer les doublons.',
      impact: 'Chaque bouton fait exactement ce qu\'il est cense faire, sans surprises.',
    }
  }

  // --- Image size ---
  if (rawDetail.includes('Image trop lourde') || rawDetail.includes('images trop lourdes')) {
    return { ...base,
      title: 'Images trop lourdes (> 200KB)',
      explain: 'Certaines images pesent plus de 200KB. Sur un telephone avec une connexion lente, ca ralentit l\'affichage.',
      action: 'Compresser les images listees en WebP avec une taille max de 256px.',
      impact: 'L\'app charge plus vite, surtout en 3G.',
    }
  }

  // --- Lighthouse ---
  if (rawDetail.includes('Lighthouse') || rawDetail.includes('Performance Lighthouse') || rawDetail.includes('Accessibilite Lighthouse') || rawDetail.includes('SEO Lighthouse')) {
    return { ...base,
      title: 'Score Lighthouse a ameliorer',
      explain: 'Google Lighthouse mesure la qualite de l\'app (rapidite, accessibilite, SEO). Un mauvais score = mauvais classement Google.',
      action: 'Lancer npx lhci autorun --collect.staticDistDir=./dist pour voir les details.',
      impact: 'Meilleur classement Google et meilleure experience utilisateur.',
    }
  }

  // --- Memory perimee ---
  if (rawDetail.includes('MEMOIRE PERIMEE')) {
    return { ...base,
      title: 'Chiffres perimes dans les fichiers memoire',
      explain: 'Les fichiers memory/*.md contiennent des chiffres qui ne correspondent plus a la realite du code.',
      action: 'Mettre a jour les chiffres dans features.md et MEMORY.md avec les valeurs reelles.',
      impact: 'La documentation est fiable et ne trompe personne.',
    }
  }

  // --- Button casse ---
  if (rawDetail.includes('Bouton casse') || rawDetail.includes('onclick casse')) {
    return { ...base,
      title: 'Bouton qui ne fait rien quand on clique',
      explain: 'Un bouton dans l\'app appelle une fonction qui n\'existe pas. L\'utilisateur clique et il ne se passe rien.',
      action: 'Creer la fonction manquante ou corriger le nom dans le template HTML.',
      impact: 'Tous les boutons de l\'app fonctionnent — zero frustration utilisateur.',
      priority: 'HAUTE',
    }
  }

  // --- Lien mort ---
  if (rawDetail.includes('Lien mort') || rawDetail.includes('liens morts')) {
    return { ...base,
      title: 'Liens morts dans l\'interface (href="#")',
      explain: 'Des liens dans l\'app ne menent nulle part. L\'utilisateur clique et rien ne se passe ou la page scroll vers le haut.',
      action: 'Remplacer href="#" par de vraies actions (onclick ou route) ou supprimer les liens inutiles.',
      impact: 'Navigation fluide — chaque lien mene quelque part.',
    }
  }

  // --- Handler vide ---
  if (rawDetail.includes('Handler vide') || rawDetail.includes('corps vide')) {
    return { ...base,
      title: 'Bouton connecte a une fonction vide',
      explain: 'La fonction existe mais son corps est vide = le bouton est la mais ne fait rien. C\'est pire qu\'un bouton manquant car l\'utilisateur croit que ca marche.',
      action: 'Implementer le contenu de la fonction ou supprimer le bouton si la feature n\'existe pas encore.',
      impact: 'Chaque bouton fait ce qu\'il promet.',
      priority: 'HAUTE',
    }
  }

  // --- Modale vide ---
  if (rawDetail.includes('Modale') && (rawDetail.includes('contenu') || rawDetail.includes('fermer'))) {
    return { ...base,
      title: 'Fenetre popup vide ou impossible a fermer',
      explain: 'Une modale s\'ouvre mais elle est vide (aucun contenu) ou ne peut pas etre fermee. L\'utilisateur est bloque.',
      action: 'Ajouter du contenu reel dans la modale et un bouton fermer fonctionnel.',
      impact: 'L\'utilisateur voit du contenu utile et peut toujours fermer les popups.',
      priority: 'HAUTE',
    }
  }

  // --- Placeholder/TODO ---
  if (rawDetail.includes('TODO') || rawDetail.includes('FIXME') || rawDetail.includes('placeholder') || rawDetail.includes('Coming soon') || rawDetail.includes('Not implemented')) {
    return { ...base,
      title: 'Travail inacheve dans le code (TODO/placeholder)',
      explain: 'Du code contient des marqueurs "TODO" ou "Coming soon" — ca veut dire que la fonctionnalite n\'est pas finie.',
      action: 'Finir l\'implementation ou supprimer la fonctionnalite si elle n\'est pas prioritaire.',
      impact: 'Aucun placeholder visible par l\'utilisateur — tout est fini et fonctionnel.',
    }
  }

  // --- Competitive Intelligence ---
  if (rawDetail.includes('Manque') && rawDetail.includes('inspire par')) {
    return { ...base,
      title: 'Fonctionnalite presente chez les concurrents mais absente',
      explain: 'Les meilleures apps concurrentes (Google Maps, WhatsApp, Duolingo...) offrent des fonctions que SpotHitch n\'a pas encore.',
      action: 'Evaluer les fonctionnalites manquantes et implementer celles qui ont le plus de valeur pour les autostoppeurs.',
      impact: 'SpotHitch devient aussi complet que les meilleurs apps dans chaque domaine.',
    }
  }

  // --- Idees du web ---
  if (rawDetail.includes('Idees du web')) {
    return { ...base,
      title: 'Nouvelles idees decouvertes par recherche web',
      explain: 'La recherche web a revele des fonctionnalites populaires dans les apps similaires.',
      action: 'Evaluer si ces idees correspondent aux besoins des autostoppeurs et les implementer si oui.',
      impact: 'SpotHitch reste innovant et a jour avec les tendances.',
    }
  }

  // --- 2x scan approfondi ---
  if (rawDetail.includes('[2x]')) {
    return { ...base,
      title: 'Probleme dans un fichier recemment modifie (attention 2x)',
      explain: 'Les fichiers modifies depuis le dernier passage du loup sont verifies 2x plus en profondeur. Ce probleme est dans un fichier change recemment.',
      action: 'Corriger le probleme specifique detecte dans le fichier (voir details).',
      impact: 'Les modifications recentes sont validees et ne cassent rien.',
      priority: 'HAUTE',
    }
  }

  // --- Fallback for unrecognized details ---
  return { ...base,
    title: `[${phaseName}] ${rawDetail.slice(0, 60)}`,
    explain: 'Le loup a detecte un probleme dans cette phase.',
    action: 'Investiguer le detail ci-dessus.',
    impact: 'Ameliorer le score de la phase ' + phaseName + '.',
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

log('\n' + '='.repeat(60))
log('  PLAN WOLF v4 — L\'EQUIPE QA AUTONOME')
log('='.repeat(60))
log(`Mode: ${isQuick ? 'QUICK (skip Lighthouse/Screenshots/Web Search)' : 'FULL (16 phases)'}`)
log(`Date: ${new Date().toISOString()}`)
log(`Run #${memory.runs.length + 1}`)
if (memory.runs.length > 0) {
  log(`Dernier run: ${memory.runs[memory.runs.length - 1].date} — Score: ${memory.runs[memory.runs.length - 1].score}/100`)
}

// Execute all 16 phases
phase1_codeQuality()
phase2_unitTests()
phase3_build()
phase4_impactAnalysis()
phase5_featureInventory()
phase6_regressionGuard()
phase7_wiringIntegrity()
phase8_buttonAudit()
phase9_deadCode()
phase10_multiLevel()
phase11_lighthouse()
phase12_screenshots()
phase13_featureScores()
// phase14_competitiveIntel() — désactivé (conseils internes uniquement)
const scoreResult = phase15_score()
const newRecs = phase16_recommendations(scoreResult)

// ═══════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════

const totalTime = ((Date.now() - start) / 1000).toFixed(1)

log('\n\n' + '='.repeat(60))
log('  PLAN WOLF v4 — RAPPORT FINAL')
log('='.repeat(60))

// Quick summary at the top for fast scanning
const urgentCount = phases.filter(p => p.score < p.max * 0.4).length
const okCount = phases.filter(p => p.score >= p.max * 0.6 && p.score < p.max * 0.9).length
const perfectCount = phases.filter(p => p.score >= p.max * 0.9).length
log('')
log(`  RESUME: ${scoreResult.score100}/100 ${scoreResult.trend}`)
log(`  ${perfectCount} parfait(s) | ${okCount} correct(s) | ${urgentCount} a corriger | ${totalTime}s`)
log('')

const maxName = Math.max(...phases.map(p => p.name.length))
for (const p of phases) {
  const pct = Math.round((p.score / p.max) * 100)
  const icon = pct >= 90 ? '++' : pct >= 60 ? 'OK' : pct >= 30 ? '!!' : 'XX'
  log(`  [${icon}] ${p.name.padEnd(maxName + 2)} ${p.score}/${p.max} (${pct}%)`)
  for (const f of p.findings) {
    log(`       ${f}`)
  }
}

log('')
log(`  Confiance: ${scoreResult.confidence}`)
log('')

// ═══════════════════════════════════════════════════════════════
// SAVE TO WOLF MEMORY
// ═══════════════════════════════════════════════════════════════

// Record errors from this run
const newErrors = []
for (const p of phases) {
  for (const d of p.details) {
    // Only record actionable errors (not info messages)
    if (d.includes('FAIL') || d.includes('REGRESSION') || d.includes('manquant') || d.includes('echoue') || d.includes('casse')) {
      newErrors.push({
        phase: p.name,
        description: d,
        date: new Date().toISOString(),
        file: null, // Will be enriched by future analysis
        check: null,
      })
    }
  }
}

// Add new errors to memory (avoid duplicates)
for (const err of newErrors) {
  const exists = memory.errors.some(e => e.description === err.description)
  if (!exists) memory.errors.push(err)
}

// Add new recommendations (avoid duplicates)
for (const rec of newRecs) {
  const exists = memory.recommendations.some(r => r.text === rec.text)
  if (!exists) memory.recommendations.push(rec)
}

// Record this run
memory.runs.push({
  date: new Date().toISOString(),
  score: scoreResult.score100,
  confidence: scoreResult.confidence,
  duration: `${totalTime}s`,
  mode: isQuick ? 'quick' : 'full',
  bundleSize: memory._currentBundleSize || null,
  phases: phases.map(p => ({ name: p.name, score: p.score, max: p.max })),
  errors: newErrors.length,
  recommendations: newRecs.length,
})
delete memory._currentBundleSize

// Keep memory manageable — prune old data
if (memory.runs.length > 50) memory.runs = memory.runs.slice(-50)
if (memory.errors.length > 100) memory.errors = memory.errors.slice(-100)
// Clean old followed recommendations (keep last 30 unfollowed + 20 followed)
const unfollowed = memory.recommendations.filter(r => !r.followed)
const followed = memory.recommendations.filter(r => r.followed)
memory.recommendations = [
  ...followed.slice(-20),
  ...unfollowed.slice(-30),
]

saveMemory(memory)
log(`  Memoire du loup sauvegardee (${memory.runs.length} runs, ${memory.errors.length} erreurs, ${memory.recommendations.length} recommandations)`)

// Exit code
if (scoreResult.score100 >= 70) {
  log('\n  Le loup est satisfait.')
  process.exit(0)
} else {
  log('\n  Le loup gronde — des corrections sont necessaires.')
  process.exit(1)
}
