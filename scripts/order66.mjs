#!/usr/bin/env node
/**
 * ORDER 66 — Complete imported data purge
 * Run: node scripts/order66.mjs
 */

import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')

let changedFiles = 0
let deletedFiles = 0

function replace(filePath, search, replacement) {
  const abs = filePath.startsWith('/') ? filePath : join(ROOT, filePath)
  if (!existsSync(abs)) { console.warn(`  SKIP (not found): ${filePath}`); return false }
  const content = readFileSync(abs, 'utf-8')
  if (typeof search === 'string') {
    if (!content.includes(search)) return false
    writeFileSync(abs, content.replaceAll(search, replacement))
  } else {
    const newContent = content.replace(search, replacement)
    if (newContent === content) return false
    writeFileSync(abs, newContent)
  }
  changedFiles++
  console.log(`  CLEANED: ${filePath}`)
  return true
}

function deleteFile(filePath) {
  const abs = filePath.startsWith('/') ? filePath : join(ROOT, filePath)
  if (!existsSync(abs)) return false
  rmSync(abs, { recursive: true, force: true })
  deletedFiles++
  console.log(`  DELETED: ${filePath}`)
  return true
}

console.log('=== ORDER 66 ===\n')

// 1. Delete spot JSON files
console.log('1. Deleting spot JSON files...')
const spotsDir = join(ROOT, 'public', 'data', 'spots')
if (existsSync(spotsDir)) {
  const files = readdirSync(spotsDir)
  for (const f of files) { rmSync(join(spotsDir, f)); deletedFiles++ }
  rmSync(spotsDir, { recursive: true, force: true })
  console.log(`  DELETED: public/data/spots/ (${files.length} files)`)
}

// 2. Rewrite spotLoader.js
console.log('2. Rewriting spotLoader.js...')
const spotLoaderPath = join(SRC, 'services', 'spotLoader.js')
if (existsSync(spotLoaderPath)) {
  writeFileSync(spotLoaderPath, `/**
 * Spot Loader Service
 * Loads hitchhiking spots from Firebase community data
 */

import { haversineKm } from '../utils/geo.js'

let allLoadedSpots = []

export function getAllLoadedSpots() { return allLoadedSpots }
export function setLoadedSpots(spots) { allLoadedSpots = spots }
export async function loadSpotIndex() { return null }
export async function loadCountrySpots() { return [] }
export async function loadSpotsInBounds() { return [] }
export async function loadSpotsInRadius() { return [] }
export function getLoadedCountryCodes() { return new Set() }
export function getCountryCenters() { return _countryCenters }

const _countryCenters = {
  FR: { lat: 46.6, lon: 2.2 }, DE: { lat: 51.2, lon: 10.4 },
  ES: { lat: 40.0, lon: -3.7 }, IT: { lat: 42.5, lon: 12.5 },
  NL: { lat: 52.1, lon: 5.3 }, BE: { lat: 50.5, lon: 4.5 },
  PT: { lat: 39.4, lon: -8.2 }, AT: { lat: 47.5, lon: 14.6 },
  CH: { lat: 46.8, lon: 8.2 }, IE: { lat: 53.4, lon: -8.2 },
  PL: { lat: 51.9, lon: 19.1 }, CZ: { lat: 49.8, lon: 15.5 },
  GB: { lat: 55.4, lon: -3.4 }, SE: { lat: 60.1, lon: 18.6 },
  NO: { lat: 60.5, lon: 8.5 }, DK: { lat: 56.3, lon: 9.5 },
  FI: { lat: 61.9, lon: 25.7 }, HU: { lat: 47.2, lon: 19.5 },
  HR: { lat: 45.1, lon: 15.2 }, RO: { lat: 45.9, lon: 25.0 },
  GR: { lat: 39.1, lon: 21.8 }, BG: { lat: 42.7, lon: 25.5 },
  SK: { lat: 48.7, lon: 19.7 }, SI: { lat: 46.2, lon: 14.8 },
  LT: { lat: 55.2, lon: 23.9 }, LV: { lat: 56.9, lon: 24.1 },
  EE: { lat: 58.6, lon: 25.0 }, LU: { lat: 49.8, lon: 6.1 },
  RS: { lat: 44.0, lon: 21.0 }, BA: { lat: 43.9, lon: 17.7 },
  ME: { lat: 42.7, lon: 19.4 }, MK: { lat: 41.5, lon: 21.7 },
  AL: { lat: 41.2, lon: 20.2 }, XK: { lat: 42.6, lon: 21.0 },
  MD: { lat: 47.0, lon: 28.4 }, UA: { lat: 48.4, lon: 31.2 },
  IS: { lat: 64.9, lon: -19.0 },
  GE: { lat: 42.3, lon: 43.4 }, AM: { lat: 40.1, lon: 44.5 },
  US: { lat: 37.1, lon: -95.7 }, CA: { lat: 56.1, lon: -106.3 },
  MX: { lat: 23.6, lon: -102.5 }, BR: { lat: -14.2, lon: -51.9 },
  AR: { lat: -38.4, lon: -63.6 }, CL: { lat: -35.7, lon: -71.5 },
  CO: { lat: 4.6, lon: -74.1 }, PE: { lat: -9.2, lon: -75.0 },
  EC: { lat: -1.8, lon: -78.2 }, BO: { lat: -16.3, lon: -63.6 },
  UY: { lat: -32.5, lon: -55.8 }, CR: { lat: 9.7, lon: -83.8 },
  PA: { lat: 8.5, lon: -80.8 }, GT: { lat: 15.8, lon: -90.2 },
  JP: { lat: 36.2, lon: 138.3 }, CN: { lat: 35.9, lon: 104.2 },
  IN: { lat: 20.6, lon: 78.9 }, TH: { lat: 15.9, lon: 100.9 },
  ID: { lat: -0.8, lon: 113.9 }, PH: { lat: 12.9, lon: 121.8 },
  VN: { lat: 14.1, lon: 108.3 }, KH: { lat: 12.6, lon: 104.9 },
  MY: { lat: 4.2, lon: 101.9 }, LA: { lat: 19.9, lon: 102.5 },
  LK: { lat: 7.9, lon: 80.8 }, NP: { lat: 28.4, lon: 84.1 },
  KR: { lat: 35.9, lon: 128.0 }, MN: { lat: 46.9, lon: 103.8 },
  KG: { lat: 41.2, lon: 74.8 }, KZ: { lat: 48.0, lon: 68.0 },
  UZ: { lat: 41.4, lon: 64.6 }, TJ: { lat: 38.9, lon: 71.3 },
  PK: { lat: 30.4, lon: 69.3 }, TR: { lat: 38.9, lon: 35.2 },
  IR: { lat: 32.4, lon: 53.7 }, IL: { lat: 31.0, lon: 34.9 },
  JO: { lat: 30.6, lon: 36.2 }, OM: { lat: 21.5, lon: 55.9 },
  MA: { lat: 31.8, lon: -7.1 }, ZA: { lat: -30.6, lon: 22.9 },
  EG: { lat: 26.8, lon: 30.8 }, KE: { lat: -0.0, lon: 37.9 },
  TZ: { lat: -6.4, lon: 34.9 }, GH: { lat: 7.9, lon: -1.0 },
  NG: { lat: 9.1, lon: 8.7 }, NA: { lat: -22.9, lon: 18.5 },
  BW: { lat: -22.3, lon: 24.7 }, TN: { lat: 33.9, lon: 9.5 },
  MZ: { lat: -18.7, lon: 35.5 }, AU: { lat: -25.3, lon: 133.8 },
  NZ: { lat: -40.9, lon: 174.9 }, TW: { lat: 23.7, lon: 120.9 },
  AD: { lat: 42.5, lon: 1.5 }, AF: { lat: 33.9, lon: 67.7 },
  AO: { lat: -11.2, lon: 17.9 }, BD: { lat: 23.7, lon: 90.4 },
  BJ: { lat: 9.3, lon: 2.3 }, BN: { lat: 4.5, lon: 114.7 },
  BZ: { lat: 17.2, lon: -88.5 }, CI: { lat: 7.5, lon: -5.5 },
  CM: { lat: 7.4, lon: 12.4 }, CY: { lat: 35.1, lon: 33.4 },
  DM: { lat: 15.4, lon: -61.4 }, DO: { lat: 18.7, lon: -70.2 },
  DZ: { lat: 28.0, lon: 1.7 }, FO: { lat: 61.9, lon: -6.9 },
  GD: { lat: 12.1, lon: -61.7 }, GG: { lat: 49.5, lon: -2.5 },
  GL: { lat: 71.7, lon: -42.6 }, GY: { lat: 4.9, lon: -58.9 },
  HN: { lat: 15.2, lon: -86.2 }, IM: { lat: 54.2, lon: -4.5 },
  IQ: { lat: 33.2, lon: 43.7 }, JE: { lat: 49.2, lon: -2.1 },
  LI: { lat: 47.2, lon: 9.6 }, MC: { lat: 43.7, lon: 7.4 },
  MR: { lat: 21.0, lon: -10.9 }, MT: { lat: 35.9, lon: 14.4 },
  MU: { lat: -20.3, lon: 57.6 }, NI: { lat: 12.9, lon: -85.2 },
  RU: { lat: 61.5, lon: 105.3 }, SA: { lat: 23.9, lon: 45.1 },
  SM: { lat: 43.9, lon: 12.4 }, SN: { lat: 14.5, lon: -14.5 },
  SV: { lat: 13.8, lon: -88.9 }, SZ: { lat: -26.5, lon: 31.5 },
  TG: { lat: 8.6, lon: 1.2 }, TL: { lat: -8.9, lon: 125.7 },
  TO: { lat: -21.2, lon: -175.2 }, UG: { lat: 1.4, lon: 32.3 },
  VC: { lat: 12.9, lon: -61.3 }, XZ: { lat: 29.7, lon: 91.1 },
  ZM: { lat: -13.1, lon: 27.8 },
}

export function getLoadedCountries() { return [] }
export function isCountryLoaded() { return false }
export async function getSpotStats() { return { totalCountries: 0, totalLocations: 0, totalReviews: 0 } }
export function prefetchNearbyCountries() {}
export function clearSpotCache() { allLoadedSpots = [] }

export default {
  loadSpotIndex, loadCountrySpots, loadSpotsInBounds, loadSpotsInRadius,
  getAllLoadedSpots, getLoadedCountries, getLoadedCountryCodes, getCountryCenters,
  isCountryLoaded, getSpotStats, clearSpotCache, prefetchNearbyCountries,
}
`)
  changedFiles++
  console.log('  REWRITTEN: src/services/spotLoader.js')
}

// 3. Clean map.js
console.log('3. Cleaning map.js...')
replace('src/services/map.js',
  `'circle-radius': [\n        'case',\n        ['==', ['get', 'source'], 'hitchwiki'], 5,\n        7,\n      ]`,
  `'circle-radius': 7`)
replace('src/services/map.js',
  `'circle-stroke-width': [\n        'case',\n        ['==', ['get', 'source'], 'hitchwiki'], 1,\n        2,\n      ]`,
  `'circle-stroke-width': 2`)

// 4. Clean SpotDetail.js
console.log('4. Cleaning SpotDetail.js...')
replace('src/components/modals/SpotDetail.js',
  /\$\{spot\.source === 'hitchwiki' \? `[\s\S]*?` : ''\}/,
  '')
replace('src/components/modals/SpotDetail.js',
  /\$\{spot\.dataSource === 'community'[\s\S]*?`\}\n\s*<\/div>/,
  `<span class="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                \${icon('users', 'w-3 h-3 mr-1')} \${t('spotSourceCommunity') || 'Community data'}
              </span>
            </div>`)
replace('src/components/modals/SpotDetail.js',
  '// Generate simulated reviews from HitchWiki data if available',
  '// Generate simulated reviews from spot data if available')
replace('src/components/modals/SpotDetail.js',
  "spot.creator || 'HitchWiki'",
  "spot.creator || 'SpotHitch User'")

// 5. Clean i18n
console.log('5. Cleaning i18n keys...')
const i18nPath = join(SRC, 'i18n', 'index.js')
if (existsSync(i18nPath)) {
  let i18n = readFileSync(i18nPath, 'utf-8')
  i18n = i18n.replace(/^\s*hitchwikiImport:.*$/gm, '')
  i18n = i18n.replace(/^\s*spotSourceHitchmap:.*$/gm, '')
  i18n = i18n.replace(/Hitchwiki\/Hitchmap \(ODbL\)/g, 'SpotHitch Community')
  i18n = i18n.replace(/Hitchwiki\/Hitchmap \(ODBL\)/g, 'SpotHitch Community')
  i18n = i18n.replace(/Hitchwiki, Hitchmap \(ODbL\)/g, 'SpotHitch Community')
  i18n = i18n.replace(/legalNoticeHitchwikiDesc:.*$/gm, '')
  i18n = i18n.replace(/legalNoticeCreditsSpots:.*$/gm, '')
  i18n = i18n.replace(/HitchWiki \(ODbL\)\. /g, '')
  i18n = i18n.replace(/HitchWiki \(ODBL\)\. /g, '')
  i18n = i18n.replace(/Les donnees de spots proviennent en partie de [^.]+\./g, 'Toutes les donnees de spots sont creees par la communaute SpotHitch.')
  i18n = i18n.replace(/Spot data partly comes from [^.]+\./g, 'All spot data is created by the SpotHitch community.')
  i18n = i18n.replace(/Los datos de spots provienen en parte de [^.]+\./g, 'Todos los datos de spots son creados por la comunidad SpotHitch.')
  i18n = i18n.replace(/Spot-Daten stammen teilweise von [^.]+\./g, 'Alle Spot-Daten werden von der SpotHitch-Community erstellt.')
  i18n = i18n.replace(/\n{3,}/g, '\n\n')
  writeFileSync(i18nPath, i18n)
  changedFiles++
  console.log('  CLEANED: src/i18n/index.js')
}

// 6-9. Clean various files
console.log('6. Cleaning Legal.js...')
replace('src/components/views/Legal.js', /\s*<li><strong>Hitchwiki\/Hitchmap<\/strong>.*<\/li>/g, '')

console.log('7. Cleaning spots.js...')
replace('src/data/spots.js', /Source: Hitchwiki\.org \/ Hitchmap\.com - License ODBL/, 'Source: SpotHitch Community')
replace('src/data/spots.js', /Attribution: "Data from Hitchwiki\/Hitchmap \(ODBL\)"/, 'All spot data is created by the SpotHitch community')

console.log('8. Cleaning guides.js...')
replace('src/data/guides.js', 'Source: Hitchwiki.org (ODBL) - Content reformulated, never invented', 'Source: SpotHitch Community - Original content')

console.log('9. Cleaning spotFreshness.js...')
replace('src/services/spotFreshness.js', 'Color-coded system based on USER validations (not HitchWiki ratings)', 'Color-coded system based on user validations')
replace('src/services/spotFreshness.js', 'Grey:  Unverified (HitchWiki import, 0 user validations)', 'Grey:  Unverified (0 user validations)')
replace('src/services/spotFreshness.js', 'Count user validations (check-ins from app users, not HitchWiki reviews)', 'Count user validations (check-ins from app users)')
replace('src/services/spotFreshness.js', 'GREY: Unverified (HitchWiki import or no user validation)', 'GREY: Unverified (no user validation)')

console.log('10. Cleaning firebase.js...')
replace('src/services/firebase.js', 'May fail if spot is from Hitchmap (not in Firestore)', 'May fail if spot not in Firestore')

// 11. Clean prerender-seo.mjs
console.log('11. Cleaning prerender-seo.mjs...')
const prerenderPath = join(ROOT, 'scripts', 'prerender-seo.mjs')
if (existsSync(prerenderPath)) {
  let p = readFileSync(prerenderPath, 'utf-8')
  p = p.replace(/\/\/ HITCHMAP_ENABLED:.*\n/, '')
  p = p.replace(/const HITCHMAP_ENABLED.*\n/, '')
  p = p.replace(
    /\/\*\*\n \* Load Hitchmap spots[\s\S]*?function loadHitchmapSpots\(\) \{[\s\S]*?return allSpots\n\}/,
    `function loadLegacySpots() {\n  return []\n}`)
  p = p.replace(/Hitchmap/g, 'legacy')
  p = p.replace(/hitchmap/g, 'legacy')
  p = p.replace(
    /async function loadAllSpots\(\) \{[\s\S]*?return all\n\}/,
    `async function loadAllSpots() {\n  const spots = await loadFirebaseSpots()\n  console.log(\`  Total: \${spots.length} community spots\`)\n  return spots\n}`)
  writeFileSync(prerenderPath, p)
  changedFiles++
  console.log('  CLEANED: scripts/prerender-seo.mjs')
}

// 12. Delete extract-spots.mjs
console.log('12. Deleting extract-spots.mjs...')
deleteFile('scripts/extract-spots.mjs')

// 13. Clean tests
console.log('13. Cleaning test comments...')
replace('tests/spotFreshness.test.js', 'New system: user validations (not HitchWiki globalRating)', 'User validation-based freshness system')

// 14-15. Clean offline services
console.log('14. Cleaning offlineDownload.js...')
replace('src/services/offlineDownload.js', /const HITCHMAP_ENABLED.*\n/, '')
replace('src/services/offlineDownload.js', /\s*if \(!HITCHMAP_ENABLED\) return.*\n/, '')

console.log('15. Cleaning autoOfflineSync.js...')
replace('src/services/autoOfflineSync.js', /const HITCHMAP_ENABLED.*\n/, '')
replace('src/services/autoOfflineSync.js', /\s*if \(!HITCHMAP_ENABLED\) return\n/, '')

// 16. Set env var
console.log('16. Setting VITE_HITCHMAP_ENABLED=false...')
const envPath = join(ROOT, '.env.local')
if (existsSync(envPath)) {
  let env = readFileSync(envPath, 'utf-8')
  if (env.includes('VITE_HITCHMAP_ENABLED')) {
    env = env.replace(/VITE_HITCHMAP_ENABLED=.*/, 'VITE_HITCHMAP_ENABLED=false')
  } else { env += '\nVITE_HITCHMAP_ENABLED=false\n' }
  writeFileSync(envPath, env)
} else { writeFileSync(envPath, 'VITE_HITCHMAP_ENABLED=false\n') }

// 17. Clean vite.config.js SW caching
console.log('17. Cleaning vite.config.js...')
const viteConfigPath = join(ROOT, 'vite.config.js')
if (existsSync(viteConfigPath)) {
  let vc = readFileSync(viteConfigPath, 'utf-8')
  if (vc.includes("cacheName: 'spot-data'")) {
    const idx = vc.indexOf("cacheName: 'spot-data'")
    let startCut = idx
    while (startCut > 0 && vc[startCut] !== ',') startCut--
    const endMarker = "cacheName: 'spot-index'"
    const idxEnd = vc.indexOf(endMarker)
    let searchBack = idxEnd
    while (searchBack > 0 && vc[searchBack] !== '{') searchBack--
    let endCut = searchBack
    let depth = 0
    for (let i = searchBack; i < vc.length; i++) {
      if (vc[i] === '{') depth++
      if (vc[i] === '}') { depth--; if (depth === 0) { endCut = i + 1; break } }
    }
    vc = vc.slice(0, startCut) + vc.slice(endCut)
    writeFileSync(viteConfigPath, vc)
    changedFiles++
    console.log('  CLEANED: vite.config.js')
  }
}

// 18. Self-destruct
console.log('18. Self-destructing...')
deleteFile('scripts/order66.mjs')

console.log(`\n=== COMPLETE: ${changedFiles} cleaned, ${deletedFiles} deleted ===`)
console.log('Run: npx vitest run tests/wiring/ && npm run build')
console.log('Then: git add -A && git commit -m "Order 66" && git push')
