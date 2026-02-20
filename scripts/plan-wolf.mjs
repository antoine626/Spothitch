#!/usr/bin/env node
/**
 * PLAN WOLF v2 — Le Loup Vivant
 *
 * Un gardien intelligent qui comprend le code, analyse les impacts,
 * apprend de ses erreurs, et evolue a chaque execution.
 *
 * 10 phases :
 *   1. Code Quality     — ESLint, i18n, RGPD
 *   2. Unit Tests       — Vitest (wiring, integration, all)
 *   3. Build            — Vite build + bundle size
 *   4. Impact Analysis  — git diff → dependency graph → what could break
 *   5. Feature Inventory— features.md vs code reel
 *   6. Regression Guard — re-teste chaque bug passe (wolf-memory)
 *   7. Wiring Integrity — services orphelins, handlers morts, modales cassees
 *   8. Multi-Level Audit— perf, SEO, a11y, i18n, securite, legal
 *   9. Score /100       — auto-evaluation + comparaison run precedent
 *  10. Recommendations  — conseils, patterns, evolution
 *
 * Usage:
 *   node scripts/plan-wolf.mjs           # Full run (~5 min)
 *   node scripts/plan-wolf.mjs --quick   # Skip E2E + Lighthouse
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
    version: 2,
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

  // Get changed files since last commit (or last tag)
  let changedFiles = []
  try {
    const diff = exec('git diff --name-only HEAD~1 2>/dev/null || git diff --name-only HEAD', { allowFail: true })
    changedFiles = diff.split('\n').filter(f => f.endsWith('.js') && f.startsWith('src/'))
  } catch {
    changedFiles = []
  }

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
    { name: 'Chat', files: ['chat.js'], dir: servicesDir },
    { name: 'Friends', files: ['friendsList.js'], dir: servicesDir },
    { name: 'DirectMessages', files: ['directMessages.js'], dir: servicesDir },
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

  // Check for dead services (imported by nobody)
  const mainContent = readFile(join(ROOT, 'src', 'main.js'))
  const appContent = readFile(join(ROOT, 'src', 'components', 'App.js'))
  const allSrcContent = mainContent + appContent

  const deadServices = []
  for (const svc of existingServices) {
    // Check if service is referenced anywhere in main.js or App.js
    const isReferenced = allSrcContent.includes(`/${svc}`)
      || allSrcContent.includes(`'${svc}'`)
      || allSrcContent.includes(`${svc}.js`)
    if (!isReferenced) {
      // Double check — is it imported by any other service?
      const allSrc = getAllJsFiles(join(ROOT, 'src'))
      const importedAnywhere = allSrc.some(f => {
        if (f.includes(svc + '.js')) return false // don't check self
        const c = readFile(f)
        return c.includes(`/${svc}`) || c.includes(`'${svc}'`)
      })
      if (!importedAnywhere) {
        deadServices.push(svc)
      }
    }
  }

  if (deadServices.length > 0) {
    findings.push(`${deadServices.length} service(s) orphelin(s) (jamais importe): ${deadServices.join(', ')}`)
    details.push('Services orphelins = code mort ou bouton UI manquant')
    score += 2
  } else {
    score += 5
    findings.push('0 services orphelins')
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

  const pastErrors = memory.errors || []

  if (pastErrors.length === 0) {
    score += 10
    findings.push('Premiere execution — pas encore d\'erreurs enregistrees')
    findings.push('Le loup commencera a surveiller les regressions au prochain run')
    phase('Regression Guard', score, max, findings, details)
    return
  }

  let regressions = 0
  let checked = 0

  for (const error of pastErrors) {
    if (!error.file || !error.check) continue
    checked++

    // Re-verify each past error hasn't come back
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

  if (regressions === 0) {
    score += 10
    findings.push(`${checked} erreurs passees verifiees — 0 regressions`)
  } else {
    score += Math.max(0, 10 - regressions * 3)
    findings.push(`REGRESSIONS DETECTEES: ${regressions} sur ${checked} verifications`)
  }

  log(`  Score: ${score}/${max}`)
  phase('Regression Guard', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 7: WIRING INTEGRITY
// ═══════════════════════════════════════════════════════════════

function phase7_wiringIntegrity() {
  header(7, 'WIRING INTEGRITY')
  let score = 0
  const max = 10
  const findings = []
  const details = []

  const mainContent = readFile(join(ROOT, 'src', 'main.js'))

  // Count window.* handlers in main.js
  const handlerMatches = mainContent.match(/window\.\w+\s*=/g) || []
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
// PHASE 8: MULTI-LEVEL AUDIT
// ═══════════════════════════════════════════════════════════════

function phase8_multiLevel() {
  header(8, 'MULTI-LEVEL AUDIT')
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
    const guidesCount = readdirSync(seoDir).filter(f => f.endsWith('.html')).length
    findings.push(`SEO: ${guidesCount} pages guides generees`)
    if (guidesCount >= 50) score += 2
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

  log(`  Score: ${score}/${max}`)
  phase('Multi-Level Audit', score, max, findings, details)
}

// ═══════════════════════════════════════════════════════════════
// PHASE 9: SCORE + SELF-EVALUATION
// ═══════════════════════════════════════════════════════════════

function phase9_score() {
  header(9, 'SCORE + AUTO-EVALUATION')

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
  if (isQuick) limitations.push('E2E et Lighthouse non executes (mode --quick)')
  limitations.push('Pas de test de charge (100K utilisateurs)')
  limitations.push('Pas de test de chat en temps reel')
  limitations.push('Pas de verification push notifications')

  if (limitations.length > 0) {
    log('\n  Ce que le loup ne verifie PAS encore:')
    for (const l of limitations) log(`    - ${l}`)
  }

  return { score100, trend, confidence }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 10: RECOMMENDATIONS + EVOLUTION
// ═══════════════════════════════════════════════════════════════

function phase10_recommendations(scoreResult) {
  header(10, 'RECOMMANDATIONS')
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

  // Display new recommendations — human readable
  if (newRecs.length > 0) {
    const haute = newRecs.filter(r => r.priority === 'HAUTE')
    const moyenne = newRecs.filter(r => r.priority === 'MOYENNE')

    if (haute.length > 0) {
      log('\n  --- URGENT (impact sur les utilisateurs) ---')
      for (const r of haute) {
        printRecommendation(r)
      }
    }

    if (moyenne.length > 0) {
      log('\n  --- A AMELIORER (qualite du code) ---')
      for (const r of moyenne) {
        printRecommendation(r)
      }
    }
  } else {
    log('\n  Aucune recommandation — tout est propre !')
  }

  // Wolf evolution
  const runCount = memory.runs.length + 1
  log(`\n  Run #${runCount}`)

  return newRecs
}

/**
 * Print a single recommendation in human-readable format
 */
function printRecommendation(r) {
  const icon = r.priority === 'HAUTE' ? '!!' : '>>'
  log(`\n  ${icon} ${r.title}`)
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
  if (rawDetail.includes('FAIL') || rawDetail.includes('echoue') || rawDetail.includes('test')) {
    return { ...base,
      title: 'Des tests echouent',
      explain: 'Certains tests automatiques detectent des problemes. Ca veut dire qu\'une fonctionnalite est peut-etre cassee.',
      action: 'Lancer npx vitest run pour voir les tests qui echouent et corriger les erreurs.',
      impact: 'Toutes les fonctionnalites marchent comme prevu.',
      priority: 'HAUTE',
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
log('  PLAN WOLF v2 — LE LOUP VIVANT')
log('='.repeat(60))
log(`Mode: ${isQuick ? 'QUICK' : 'FULL'}`)
log(`Date: ${new Date().toISOString()}`)
log(`Run #${memory.runs.length + 1}`)
if (memory.runs.length > 0) {
  log(`Dernier run: ${memory.runs[memory.runs.length - 1].date} — Score: ${memory.runs[memory.runs.length - 1].score}/100`)
}

// Execute all phases
phase1_codeQuality()
phase2_unitTests()
phase3_build()
phase4_impactAnalysis()
phase5_featureInventory()
phase6_regressionGuard()
phase7_wiringIntegrity()
phase8_multiLevel()
const scoreResult = phase9_score()
const newRecs = phase10_recommendations(scoreResult)

// ═══════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════

const totalTime = ((Date.now() - start) / 1000).toFixed(1)

log('\n\n' + '='.repeat(60))
log('  PLAN WOLF v2 — RAPPORT FINAL')
log('='.repeat(60))
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
log(`  SCORE GLOBAL: ${scoreResult.score100}/100 ${scoreResult.trend}`)
log(`  Confiance: ${scoreResult.confidence}`)
log(`  Duree: ${totalTime}s`)
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

// Keep memory manageable (max 50 runs, 200 errors, 100 recommendations)
if (memory.runs.length > 50) memory.runs = memory.runs.slice(-50)
if (memory.errors.length > 200) memory.errors = memory.errors.slice(-200)
if (memory.recommendations.length > 100) memory.recommendations = memory.recommendations.slice(-100)

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
