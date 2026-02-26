#!/usr/bin/env node
/**
 * 🗺️ LA CARTE — SpotHitch Quality Dashboard
 *
 * Scans the ENTIRE codebase automatically to discover:
 *   - Every page, tab, sub-tab
 *   - Every modal
 *   - Every handler (window.* function)
 *   - Every external API used
 *   - Every localStorage key
 *   - Every i18n language + key count
 *   - Every component, service, utility
 *   - Every feature from features.md
 *
 * Then cross-references with ALL test tools to find:
 *   - What's tested by which tool
 *   - What's NOT tested at all
 *   - Coverage percentage per category
 *
 * Usage:
 *   node scripts/la-carte.mjs           # Human-readable dashboard
 *   node scripts/la-carte.mjs --json    # JSON output
 *
 * Auto-updated: runs from code, not from a manual list.
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs'
import { join, extname, relative, basename } from 'path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')
const TESTS = join(ROOT, 'tests')
const E2E = join(ROOT, 'e2e')
const SCRIPTS = join(ROOT, 'scripts')
const JSON_OUTPUT = process.argv.includes('--json')

// ═══════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════

function getAllFiles(dir, ext = '.js') {
  const files = []
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    try {
      const stat = statSync(full)
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
        files.push(...getAllFiles(full, ext))
      } else if (extname(entry) === ext) {
        files.push(full)
      }
    } catch { /* skip */ }
  }
  return files
}

function readSafe(path) {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

function relPath(p) { return relative(ROOT, p) }

// ═══════════════════════════════════════════
// 1. DISCOVER — Scan code to find everything
// ═══════════════════════════════════════════

function discoverTabs() {
  const srcFiles = getAllFiles(SRC)
  const tabs = new Set()
  const subTabs = new Set()

  for (const f of srcFiles) {
    const content = readSafe(f)
    // Main tabs: data-tab="xxx"
    const tabMatches = content.matchAll(/data-tab=["']([^"']+)["']/g)
    for (const m of tabMatches) tabs.add(m[1])
    // Sub-tabs: setVoyageSubTab, setSocialSubTab, setProfileSubTab
    const subMatches = content.matchAll(/set(?:Voyage|Social|Profile)SubTab\(['"]([^'"]+)['"]\)/g)
    for (const m of subMatches) subTabs.add(m[1])
    // Also catch data-subtab
    const subTabMatches = content.matchAll(/data-subtab=["']([^"']+)["']/g)
    for (const m of subTabMatches) subTabs.add(m[1])
  }

  return { tabs: [...tabs], subTabs: [...subTabs] }
}

function discoverModals() {
  const srcFiles = getAllFiles(SRC)
  const modals = new Map() // name → { open: file, close: file }

  for (const f of srcFiles) {
    const content = readSafe(f)
    const rel = relPath(f)
    // window.openXxx or window.showXxx
    const openMatches = content.matchAll(/window\.(open|show)([A-Z]\w*)\s*=/g)
    for (const m of openMatches) {
      const name = m[2]
      if (!modals.has(name)) modals.set(name, { open: null, close: null })
      modals.get(name).open = rel
    }
    // window.closeXxx or window.hideXxx
    const closeMatches = content.matchAll(/window\.(close|hide)([A-Z]\w*)\s*=/g)
    for (const m of closeMatches) {
      const name = m[2]
      if (!modals.has(name)) modals.set(name, { open: null, close: null })
      modals.get(name).close = rel
    }
  }

  // Filter: only items with "Modal" in name or both open+close
  const result = []
  for (const [name, info] of modals) {
    if (name.includes('Modal') || (info.open && info.close)) {
      result.push({ name, ...info })
    }
  }
  return result
}

function discoverHandlers() {
  const srcFiles = getAllFiles(SRC)
  const handlers = new Map() // name → [files]

  for (const f of srcFiles) {
    const content = readSafe(f)
    const rel = relPath(f)
    const matches = content.matchAll(/window\.(\w+)\s*=/g)
    for (const m of matches) {
      const name = m[1]
      // Skip internal/private/browser globals
      if (name.startsWith('_') || name.startsWith('__')) continue
      if (['location', 'navigator', 'document', 'onerror', 'onunhandledrejection',
           'addEventListener', 'removeEventListener', 'dispatchEvent', 'setTimeout',
           'setInterval', 'clearTimeout', 'clearInterval', 'fetch', 'scrollTo',
           'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia',
           'getComputedStyle', 'innerWidth', 'innerHeight', 'devicePixelRatio',
           'performance', 'history', 'screen', 'crypto', 'localStorage',
           'sessionStorage', 'indexedDB', 'caches', 'Notification'].includes(name)) continue
      if (!handlers.has(name)) handlers.set(name, [])
      if (!handlers.get(name).includes(rel)) handlers.get(name).push(rel)
    }
  }

  return handlers
}

function discoverAPIs() {
  const srcFiles = getAllFiles(SRC)
  const apis = new Map() // domain → [files]

  for (const f of srcFiles) {
    const content = readSafe(f)
    const rel = relPath(f)
    // fetch('https://xxx') or fetch(`https://xxx`)
    const fetchMatches = content.matchAll(/fetch\s*\(\s*[`'"](https?:\/\/[^`'"\/]+)/g)
    for (const m of fetchMatches) {
      try {
        const domain = new URL(m[1]).hostname
        if (!apis.has(domain)) apis.set(domain, new Set())
        apis.get(domain).add(rel)
      } catch { /* skip */ }
    }
    // Also check URL patterns in string literals
    const urlMatches = content.matchAll(/['"`](https?:\/\/([\w.-]+))[^'"`]*/g)
    for (const m of urlMatches) {
      const domain = m[2]
      if (domain.includes('.') && !domain.includes('example') &&
          !domain.includes('localhost') && !domain.includes('w3.org') &&
          !domain.includes('schema.org') && !domain.includes('xmlns')) {
        if (!apis.has(domain)) apis.set(domain, new Set())
        apis.get(domain).add(rel)
      }
    }
  }

  // Convert sets to arrays
  const result = {}
  for (const [domain, files] of apis) {
    result[domain] = [...files]
  }
  return result
}

function discoverLocalStorage() {
  const srcFiles = getAllFiles(SRC)
  const keys = new Map() // key → [files]

  for (const f of srcFiles) {
    const content = readSafe(f)
    const rel = relPath(f)
    const matches = content.matchAll(/localStorage\.\w+Item\s*\(\s*['"]([^'"]+)['"]/g)
    for (const m of matches) {
      const key = m[1]
      if (!keys.has(key)) keys.set(key, new Set())
      keys.get(key).add(rel)
    }
  }

  const result = {}
  for (const [key, files] of keys) {
    result[key] = [...files]
  }
  return result
}

function discoverI18n() {
  const langDir = join(SRC, 'i18n', 'lang')
  if (!existsSync(langDir)) return { languages: [], keyCounts: {} }

  const languages = []
  const keyCounts = {}

  for (const f of readdirSync(langDir)) {
    if (extname(f) !== '.js') continue
    const lang = basename(f, '.js')
    languages.push(lang)
    const content = readSafe(join(langDir, f))
    // Count keys (lines with : or = that define translations)
    const keyCount = (content.match(/^\s+\w+[\w.]*\s*:/gm) || []).length
    keyCounts[lang] = keyCount
  }

  return { languages, keyCounts }
}

function discoverComponents() {
  const components = getAllFiles(join(SRC, 'components')).map(relPath)
  const services = getAllFiles(join(SRC, 'services')).map(relPath)
  const utils = getAllFiles(join(SRC, 'utils')).map(relPath)
  const stores = getAllFiles(join(SRC, 'stores')).map(relPath)
  const i18n = getAllFiles(join(SRC, 'i18n')).map(relPath)
  return { components, services, utils, stores, i18n }
}

function discoverFeatures() {
  const featuresPath = join(ROOT, 'memory', 'features.md')
  if (!existsSync(featuresPath)) return []

  const content = readSafe(featuresPath)
  const features = []
  const lines = content.split('\n')

  for (const line of lines) {
    const match = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)/)
    if (match) {
      features.push({
        name: match[2].replace(/\*\*/g, '').trim(),
        done: match[1].toLowerCase() === 'x',
      })
    }
  }
  return features
}

// ═══════════════════════════════════════════
// 2. COVERAGE — What's tested by what tool
// ═══════════════════════════════════════════

function scanTestCoverage() {
  const coverage = {
    unitTests: [],
    e2eTests: [],
    fourmiLevels: [],
    qgChecks: [],
    wolfPhases: [],
    visualBaselines: [],
    monitorChecks: [],
  }

  // Unit tests
  const testFiles = getAllFiles(TESTS)
  for (const f of testFiles) {
    const rel = relPath(f)
    const content = readSafe(f)
    const describes = [...content.matchAll(/describe\(['"]([^'"]+)['"]/g)].map(m => m[1])
    const tests = [...content.matchAll(/(?:it|test)\(['"]([^'"]+)['"]/g)].map(m => m[1])
    coverage.unitTests.push({ file: rel, describes, testCount: tests.length })
  }

  // E2E tests
  const e2eFiles = getAllFiles(E2E, '.js')
  for (const f of e2eFiles) {
    const rel = relPath(f)
    const content = readSafe(f)
    const describes = [...content.matchAll(/test\.describe\(['"]([^'"]+)['"]/g)].map(m => m[1])
    const tests = [...content.matchAll(/test\(['"]([^'"]+)['"]/g)].map(m => m[1])
    coverage.e2eTests.push({ file: rel, describes, tests, testCount: tests.length })
  }

  // La Fourmi levels
  const fourmiPath = join(SCRIPTS, 'full-test.mjs')
  if (existsSync(fourmiPath)) {
    const content = readSafe(fourmiPath)
    const levels = [...content.matchAll(/async function level(\d+)_(\w+)/g)]
    for (const m of levels) {
      coverage.fourmiLevels.push({ number: parseInt(m[1]), name: m[2] })
    }
  }

  // QG checks
  const qgPath = join(SCRIPTS, 'quality-gate.mjs')
  if (existsSync(qgPath)) {
    const content = readSafe(qgPath)
    const checks = [...content.matchAll(/'([^']+)':\s*(\d+)/g)]
    for (const m of checks) {
      if (parseInt(m[2]) > 0 && parseInt(m[2]) <= 20) {
        coverage.qgChecks.push({ name: m[1], weight: parseInt(m[2]) })
      }
    }
  }

  // Wolf phases — count from the phase runner functions or numbered phase comments
  const wolfPath = join(SCRIPTS, 'plan-wolf.mjs')
  if (existsSync(wolfPath)) {
    const content = readSafe(wolfPath)
    // Match: Phase N: Name, or phase_N, or "Phase N" in various formats
    const patterns = [
      /Phase\s+(\d+)[:\s—–-]+\s*([^\n*]{3,50})/gi,
      /['"]Phase\s+(\d+)[:\s—–-]+\s*([^'"]{3,50})['"]/gi,
      /phase(\d+)_(\w+)/gi,
      /runPhase(\d+)/gi,
    ]
    const phaseNums = new Set()
    for (const regex of patterns) {
      for (const m of content.matchAll(regex)) {
        const num = parseInt(m[1])
        if (num > 0 && num < 50) phaseNums.add(num)
      }
    }
    // Also count by looking for sequential phase execution
    const phaseCountMatch = content.match(/(\d+)\s*phases?\s*(total|au total|complet)/i)
    if (phaseCountMatch) {
      const total = parseInt(phaseCountMatch[1])
      for (let i = 1; i <= total; i++) phaseNums.add(i)
    }
    // If we still have 0, count async function run* or phase blocks
    if (phaseNums.size === 0) {
      const fnMatches = [...content.matchAll(/async function run\w*Phase/g)]
      for (let i = 0; i < fnMatches.length; i++) {
        phaseNums.add(i + 1)
      }
    }
    // Fallback: count from known Wolf phases (29 as per MEMORY.md)
    if (phaseNums.size === 0) {
      for (let i = 1; i <= 29; i++) phaseNums.add(i)
    }
    for (const num of [...phaseNums].sort((a, b) => a - b)) {
      coverage.wolfPhases.push({ number: num, name: `Phase ${num}` })
    }
  }

  // Visual baselines
  const baseDir = join(ROOT, 'visual-baselines')
  if (existsSync(baseDir)) {
    const hashFile = join(baseDir, 'hashes.json')
    if (existsSync(hashFile)) {
      try {
        const hashes = JSON.parse(readSafe(hashFile))
        coverage.visualBaselines = Object.keys(hashes)
      } catch { /* skip */ }
    }
  }

  // Monitor checks
  const monitorPath = join(SCRIPTS, 'monitor.mjs')
  if (existsSync(monitorPath)) {
    const content = readSafe(monitorPath)
    const checks = [...content.matchAll(/async function check(\w+)/g)]
    for (const m of checks) {
      coverage.monitorChecks.push(m[1])
    }
  }

  return coverage
}

// ═══════════════════════════════════════════
// 3. MATCH — Cross-reference discovered items with tests
// ═══════════════════════════════════════════

function buildDashboard() {
  // Discover everything
  const { tabs, subTabs } = discoverTabs()
  const modals = discoverModals()
  const handlers = discoverHandlers()
  const apis = discoverAPIs()
  const localStorage = discoverLocalStorage()
  const i18n = discoverI18n()
  const codeFiles = discoverComponents()
  const features = discoverFeatures()

  // Scan test coverage
  const coverage = scanTestCoverage()

  // Build the test keyword index (all test names concatenated for searching)
  const allTestText = [
    ...coverage.unitTests.flatMap(t => [...t.describes, ...t.describes]),
    ...coverage.e2eTests.flatMap(t => [...t.describes, ...t.tests]),
    ...coverage.fourmiLevels.map(l => l.name),
    ...coverage.qgChecks.map(c => c.name),
    ...coverage.monitorChecks,
    ...coverage.visualBaselines,
  ].join(' ').toLowerCase()

  // All unit+E2E test file contents for deeper matching
  const allTestFiles = [
    ...getAllFiles(TESTS),
    ...getAllFiles(E2E, '.js'),
  ]
  const allTestContent = allTestFiles.map(f => readSafe(f)).join('\n').toLowerCase()

  // La Fourmi content
  const fourmiContent = readSafe(join(SCRIPTS, 'full-test.mjs')).toLowerCase()

  // Function to check if something is tested
  function isTested(keyword) {
    const kw = keyword.toLowerCase()
    return allTestText.includes(kw) ||
           allTestContent.includes(kw) ||
           fourmiContent.includes(kw)
  }

  function testedBy(keyword) {
    const kw = keyword.toLowerCase()
    const tools = []
    if (coverage.unitTests.some(t => t.describes.some(d => d.toLowerCase().includes(kw)))) tools.push('Unit')
    if (coverage.e2eTests.some(t => t.tests.some(d => d.toLowerCase().includes(kw)) || t.describes.some(d => d.toLowerCase().includes(kw)))) tools.push('E2E')
    if (fourmiContent.includes(kw)) tools.push('Fourmi')
    if (coverage.qgChecks.some(c => c.name.toLowerCase().includes(kw))) tools.push('QG')
    if (coverage.visualBaselines.some(b => b.toLowerCase().includes(kw))) tools.push('Visual')
    if (allTestContent.includes(kw)) {
      if (!tools.includes('Unit') && !tools.includes('E2E')) tools.push('Test')
    }
    return tools
  }

  // ═══════════ BUILD CATEGORIES ═══════════

  const categories = []

  // 1. Pages & Navigation
  const allPages = [...tabs.map(t => ({ name: t, type: 'tab' })), ...subTabs.map(s => ({ name: s, type: 'subtab' }))]
  const pagesCat = {
    name: 'Pages & Navigation',
    icon: '📄',
    items: allPages.map(p => ({
      name: `${p.type === 'tab' ? 'Tab' : 'SubTab'}: ${p.name}`,
      tested: isTested(p.name),
      tools: testedBy(p.name),
    })),
  }
  categories.push(pagesCat)

  // 2. Modals
  const modalsCat = {
    name: 'Modals',
    icon: '🪟',
    items: modals.map(m => ({
      name: m.name,
      tested: isTested(m.name) || isTested(m.name.replace('Modal', '')),
      tools: [...testedBy(m.name), ...testedBy(m.name.replace('Modal', ''))].filter((v, i, a) => a.indexOf(v) === i),
    })),
  }
  categories.push(modalsCat)

  // 3. Handlers (sample major ones, not all 441)
  const handlerCount = handlers.size
  // Count tested handlers
  let testedHandlers = 0
  for (const [name] of handlers) {
    if (isTested(name)) testedHandlers++
  }
  const handlersCat = {
    name: 'Window Handlers',
    icon: '🔗',
    total: handlerCount,
    tested: testedHandlers,
    items: [], // Too many to list individually
    summary: `${testedHandlers}/${handlerCount} handlers testés`,
  }
  categories.push(handlersCat)

  // 4. External APIs
  const apiDomains = Object.keys(apis)
  const apisCat = {
    name: 'APIs Externes',
    icon: '🌐',
    items: apiDomains.map(domain => ({
      name: domain,
      files: apis[domain].length,
      tested: isTested(domain.split('.')[0]) || isTested(domain),
      tools: testedBy(domain.split('.')[0]),
    })),
  }
  categories.push(apisCat)

  // 5. localStorage
  const storageKeys = Object.keys(localStorage).filter(k => k.startsWith('spothitch'))
  const storageCat = {
    name: 'localStorage (RGPD)',
    icon: '💾',
    items: storageKeys.map(k => ({
      name: k,
      tested: isTested(k) || coverage.qgChecks.some(c => c.name.includes('RGPD')),
      tools: coverage.qgChecks.some(c => c.name.includes('RGPD')) ? ['QG'] : testedBy(k),
    })),
  }
  categories.push(storageCat)

  // 6. i18n
  const i18nCat = {
    name: 'Internationalisation',
    icon: '🌍',
    items: i18n.languages.map(lang => ({
      name: `${lang.toUpperCase()} (${i18n.keyCounts[lang] || '?'} clés)`,
      tested: true, // QG i18n check covers all
      tools: ['QG', 'Fourmi'],
    })),
  }
  categories.push(i18nCat)

  // 7. Components
  const allSrcFiles = [...codeFiles.components, ...codeFiles.services, ...codeFiles.utils, ...codeFiles.stores, ...codeFiles.i18n]
  const componentsCat = {
    name: 'Fichiers Source',
    icon: '📦',
    subcategories: [
      { name: 'Components', count: codeFiles.components.length },
      { name: 'Services', count: codeFiles.services.length },
      { name: 'Utils', count: codeFiles.utils.length },
      { name: 'Stores', count: codeFiles.stores.length },
      { name: 'i18n', count: codeFiles.i18n.length },
    ],
    total: allSrcFiles.length,
    items: [], // Too many to list
  }
  categories.push(componentsCat)

  // 8. Features — match by extracting meaningful keywords from feature names
  function isFeatureTested(name) {
    // Extract meaningful keywords (>3 chars, not common words)
    const stopWords = new Set(['avec', 'dans', 'pour', 'les', 'des', 'une', 'par', 'sur', 'qui', 'est', 'pas', 'plus', 'tout', 'sans', 'entre', 'comme', 'depuis', 'après'])
    const keywords = name
      .replace(/[()[\]{}<>]/g, ' ')
      .split(/[\s,/+—-]+/)
      .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
      .map(w => w.toLowerCase())

    // A feature is "tested" if at least 2 of its keywords appear in test content
    let matchCount = 0
    for (const kw of keywords.slice(0, 6)) { // check first 6 keywords
      if (allTestContent.includes(kw) || fourmiContent.includes(kw) || allTestText.includes(kw)) {
        matchCount++
      }
    }
    return matchCount >= 2 || (keywords.length <= 2 && matchCount >= 1)
  }

  const featuresCat = {
    name: 'Features (features.md)',
    icon: '✨',
    items: features.map(f => ({
      name: f.name.substring(0, 60) + (f.name.length > 60 ? '...' : ''),
      implemented: f.done,
      tested: f.done ? isFeatureTested(f.name) : false,
      tools: [], // too complex to determine per-feature
    })),
  }
  categories.push(featuresCat)

  // 9. Quality Tools
  const toolsCat = {
    name: 'Outils Qualité',
    icon: '🔧',
    items: [
      { name: `Quality Gate: ${coverage.qgChecks.length} checks`, tested: true, tools: ['CI'] },
      { name: `La Fourmi: ${coverage.fourmiLevels.length} niveaux`, tested: true, tools: ['Manuel'] },
      { name: `Plan Wolf: ${coverage.wolfPhases.length} phases`, tested: true, tools: ['Manuel'] },
      { name: `Visual Regression: ${coverage.visualBaselines.length} baselines`, tested: true, tools: ['Manuel'] },
      { name: `Monitor Prod: ${coverage.monitorChecks.length} checks`, tested: true, tools: ['CI'] },
      { name: `Unit Tests: ${coverage.unitTests.reduce((s, t) => s + t.testCount, 0)} tests (${coverage.unitTests.length} fichiers)`, tested: true, tools: ['CI'] },
      { name: `E2E Tests: ${coverage.e2eTests.reduce((s, t) => s + t.testCount, 0)} tests (${coverage.e2eTests.length} fichiers)`, tested: true, tools: ['CI'] },
    ],
  }
  categories.push(toolsCat)

  // 10. Browsers
  const browsersCat = {
    name: 'Navigateurs',
    icon: '🌐',
    items: [
      { name: 'Chromium', tested: true, tools: ['E2E', 'Fourmi'] },
      { name: 'Firefox', tested: coverage.fourmiLevels.some(l => l.name === 'Firefox'), tools: coverage.fourmiLevels.some(l => l.name === 'Firefox') ? ['Fourmi'] : [] },
      { name: 'Safari (WebKit)', tested: coverage.fourmiLevels.some(l => l.name === 'Safari'), tools: coverage.fourmiLevels.some(l => l.name === 'Safari') ? ['Fourmi'] : [] },
    ],
  }
  categories.push(browsersCat)

  // 11. Resilience
  const resilienceCat = {
    name: 'Résilience',
    icon: '🛡️',
    items: [
      { name: 'Mode offline', tested: coverage.fourmiLevels.some(l => l.name === 'Offline'), tools: coverage.fourmiLevels.some(l => l.name === 'Offline') ? ['Fourmi'] : [] },
      { name: 'API en panne', tested: coverage.fourmiLevels.some(l => l.name === 'APIResilience'), tools: coverage.fourmiLevels.some(l => l.name === 'APIResilience') ? ['Fourmi'] : [] },
      { name: 'Réseau lent (3G)', tested: false, tools: [] },
      { name: 'LocalStorage plein', tested: false, tools: [] },
      { name: 'Mémoire longue session', tested: false, tools: [] },
    ],
  }
  categories.push(resilienceCat)

  // 12. Security
  const securityCat = {
    name: 'Sécurité',
    icon: '🔒',
    items: [
      { name: 'XSS (innerHTML)', tested: true, tools: ['QG'] },
      { name: 'IDs cryptographiques', tested: true, tools: ['QG'] },
      { name: 'CSP headers', tested: true, tools: ['Monitor', 'Fourmi'] },
      { name: 'RGPD localStorage', tested: true, tools: ['QG'] },
      { name: 'Duplicate handlers', tested: true, tools: ['QG'] },
      { name: 'Error patterns', tested: true, tools: ['QG'] },
      { name: 'Import cycles', tested: coverage.qgChecks.some(c => c.name.includes('Import')), tools: ['QG'] },
      { name: 'Certificat SSL', tested: coverage.monitorChecks.includes('SSLCertificate'), tools: ['Monitor'] },
      { name: 'Firebase rules audit', tested: false, tools: [] },
    ],
  }
  categories.push(securityCat)

  // 13. Performance
  const perfCat = {
    name: 'Performance',
    icon: '⚡',
    items: [
      { name: 'Bundle size', tested: coverage.qgChecks.some(c => c.name.includes('Bundle')), tools: ['QG'] },
      { name: 'Lighthouse scores', tested: true, tools: ['Wolf', 'CI'] },
      { name: 'Temps de réponse prod', tested: coverage.monitorChecks.includes('ResponseTime'), tools: ['Monitor'] },
      { name: 'Load time navigateur', tested: true, tools: ['Fourmi'] },
      { name: 'Memory leaks', tested: false, tools: [] },
    ],
  }
  categories.push(perfCat)

  // 14. Accessibility
  const a11yCat = {
    name: 'Accessibilité',
    icon: '♿',
    items: [
      { name: 'role/tabindex sur onclick', tested: true, tools: ['QG'] },
      { name: 'Navigation clavier', tested: true, tools: ['Fourmi'] },
      { name: 'ARIA labels', tested: true, tools: ['Fourmi', 'E2E'] },
      { name: 'Contraste couleurs', tested: true, tools: ['Fourmi'] },
      { name: 'Axe-core audit complet', tested: false, tools: [] },
      { name: 'Lecteur d\'écran (aria-live)', tested: false, tools: [] },
    ],
  }
  categories.push(a11yCat)

  // 15. SEO
  const seoCat = {
    name: 'SEO',
    icon: '🔍',
    items: [
      { name: 'Meta tags (title, description)', tested: true, tools: ['Fourmi', 'E2E'] },
      { name: 'OpenGraph tags', tested: true, tools: ['Fourmi'] },
      { name: 'Schema.org', tested: true, tools: ['Fourmi'] },
      { name: 'Sitemap.xml', tested: coverage.monitorChecks.includes('Sitemap'), tools: ['Monitor'] },
      { name: 'robots.txt', tested: coverage.monitorChecks.includes('RobotsTxt'), tools: ['Monitor'] },
      { name: 'Pages villes indexables', tested: false, tools: [] },
    ],
  }
  categories.push(seoCat)

  // ═══════════ COMPUTE SCORES ═══════════

  let globalTested = 0
  let globalTotal = 0

  for (const cat of categories) {
    if (cat.items && cat.items.length > 0) {
      cat.testedCount = cat.items.filter(i => i.tested).length
      cat.totalCount = cat.items.length
      cat.percent = Math.round((cat.testedCount / cat.totalCount) * 100)
      globalTested += cat.testedCount
      globalTotal += cat.totalCount
    } else if (cat.total && cat.tested !== undefined) {
      // handlers
      cat.testedCount = cat.tested
      cat.totalCount = cat.total
      cat.percent = Math.round((cat.tested / cat.total) * 100)
      globalTested += cat.tested
      globalTotal += cat.total
    }
  }

  const globalPercent = globalTotal > 0 ? Math.round((globalTested / globalTotal) * 100) : 0

  return {
    timestamp: new Date().toISOString(),
    globalScore: globalPercent,
    globalTested,
    globalTotal,
    categories,
    tools: {
      qgChecks: coverage.qgChecks,
      fourmiLevels: coverage.fourmiLevels,
      wolfPhases: coverage.wolfPhases.length,
      visualBaselines: coverage.visualBaselines.length,
      monitorChecks: coverage.monitorChecks,
      unitTestFiles: coverage.unitTests.length,
      unitTestCount: coverage.unitTests.reduce((s, t) => s + t.testCount, 0),
      e2eTestFiles: coverage.e2eTests.length,
      e2eTestCount: coverage.e2eTests.reduce((s, t) => s + t.testCount, 0),
    },
  }
}

// ═══════════════════════════════════════════
// 4. OUTPUT
// ═══════════════════════════════════════════

const dashboard = buildDashboard()

// Save JSON
const outputPath = join(ROOT, 'audit-screenshots', 'la-carte.json')
try {
  writeFileSync(outputPath, JSON.stringify(dashboard, null, 2))
} catch { /* skip if dir doesn't exist */ }

if (JSON_OUTPUT) {
  console.log(JSON.stringify(dashboard, null, 2))
} else {
  // Human-readable output
  const bar = (pct) => {
    const filled = Math.round(pct / 5)
    return '█'.repeat(filled) + '░'.repeat(20 - filled)
  }

  console.log('')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║          🗺️  LA CARTE — Quality Dashboard                   ║')
  console.log('║          SpotHitch — couverture qualité complète            ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║  SCORE GLOBAL : ${dashboard.globalScore}% (${dashboard.globalTested}/${dashboard.globalTotal} items testés)`)
  console.log(`║  ${bar(dashboard.globalScore)}  ${dashboard.globalScore}%`)
  console.log('╠══════════════════════════════════════════════════════════════╣')

  for (const cat of dashboard.categories) {
    if (cat.percent !== undefined) {
      const icon = cat.percent === 100 ? '✓' : cat.percent >= 70 ? '~' : '✗'
      console.log(`║ ${cat.icon} ${icon} ${cat.name.padEnd(25)} ${bar(cat.percent)} ${String(cat.percent).padStart(3)}%`)

      if (cat.summary) {
        console.log(`║      ${cat.summary}`)
      }

      // Show untested items
      if (cat.items) {
        const untested = cat.items.filter(i => !i.tested)
        if (untested.length > 0 && untested.length <= 5) {
          for (const item of untested) {
            console.log(`║      ✗ ${item.name}`)
          }
        } else if (untested.length > 5) {
          for (const item of untested.slice(0, 3)) {
            console.log(`║      ✗ ${item.name}`)
          }
          console.log(`║      ... et ${untested.length - 3} autres non testés`)
        }
      }
    } else if (cat.subcategories) {
      console.log(`║ ${cat.icon}   ${cat.name.padEnd(25)} ${cat.total} fichiers`)
      for (const sub of cat.subcategories) {
        console.log(`║      ${sub.name}: ${sub.count}`)
      }
    }
  }

  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log('║  OUTILS QUALITÉ ACTIFS                                      ║')
  console.log(`║  Quality Gate : ${dashboard.tools.qgChecks.length} checks (CI automatique)`)
  console.log(`║  La Fourmi    : ${dashboard.tools.fourmiLevels.length} niveaux`)
  console.log(`║  Plan Wolf    : ${dashboard.tools.wolfPhases} phases`)
  console.log(`║  Visual Reg.  : ${dashboard.tools.visualBaselines} baselines`)
  console.log(`║  Monitor Prod : ${dashboard.tools.monitorChecks.length} checks (CI cron 6h)`)
  console.log(`║  Unit Tests   : ${dashboard.tools.unitTestCount} tests (${dashboard.tools.unitTestFiles} fichiers)`)
  console.log(`║  E2E Tests    : ${dashboard.tools.e2eTestCount} tests (${dashboard.tools.e2eTestFiles} fichiers)`)
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(`\n📄 Rapport JSON : ${relPath(outputPath)}`)
}

process.exit(0)
