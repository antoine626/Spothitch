/**
 * Extract Hitchmap spots from SQLite database to JSON files per country
 * Source: hitchmap.com/dump.sqlite (ODBL license)
 *
 * Groups reviews at same location, computes averages, keeps real comments
 *
 * Usage: node scripts/extract-spots.mjs [dump-path]
 * Default dump path: /tmp/hitchmap_dump.sqlite
 */

import { createRequire } from 'module'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const require = createRequire(import.meta.url)

// Accept dump path as CLI argument, fallback to /tmp
const DUMP_PATH = process.argv[2] || '/tmp/hitchmap_dump.sqlite'
const OUTPUT_DIR = join(import.meta.dirname, '..', 'public', 'data', 'spots')

// Check if dump file exists
if (!existsSync(DUMP_PATH)) {
  console.error(`❌ Error: SQLite dump not found at ${DUMP_PATH}`)
  console.error('Download it from https://hitchmap.com/dump.sqlite')
  process.exit(1)
}

console.log(`📦 Reading Hitchmap dump from: ${DUMP_PATH}`)

let Database
try {
  Database = require('better-sqlite3')
} catch (err) {
  console.error('❌ Error: better-sqlite3 not installed')
  console.error('Run: npm install')
  process.exit(1)
}

const db = new Database(DUMP_PATH)

// Extract ALL countries from the database (no exceptions)
const COUNTRIES = db.prepare(`
  SELECT DISTINCT country FROM points
  WHERE country IS NOT NULL AND country != '' AND (banned = 0 OR banned IS NULL)
  ORDER BY country
`).all().map(r => r.country).filter(c => c && c.length === 2)

// Country names for display
const COUNTRY_NAMES = {
  FR: 'France', DE: 'Allemagne', ES: 'Espagne', IT: 'Italie',
  NL: 'Pays-Bas', BE: 'Belgique', PT: 'Portugal', AT: 'Autriche',
  CH: 'Suisse', IE: 'Irlande', PL: 'Pologne', CZ: 'Tchéquie',
  GB: 'Royaume-Uni', SE: 'Suède', NO: 'Norvège', DK: 'Danemark',
  FI: 'Finlande', HU: 'Hongrie', HR: 'Croatie', RO: 'Roumanie',
  GR: 'Grèce', BG: 'Bulgarie', SK: 'Slovaquie', SI: 'Slovénie',
  LT: 'Lituanie', LV: 'Lettonie', EE: 'Estonie', LU: 'Luxembourg',
  RS: 'Serbie', BA: 'Bosnie', ME: 'Monténégro', MK: 'Macédoine du Nord',
  AL: 'Albanie', XK: 'Kosovo', MD: 'Moldavie', UA: 'Ukraine',
  BY: 'Biélorussie', IS: 'Islande',
  MA: 'Maroc', TR: 'Turquie', US: 'États-Unis', CA: 'Canada',
  AU: 'Australie', NZ: 'Nouvelle-Zélande', IL: 'Israël', GE: 'Géorgie',
  AM: 'Arménie', IR: 'Iran', IN: 'Inde', TH: 'Thaïlande',
  VN: 'Vietnam', KH: 'Cambodge', MM: 'Myanmar', LA: 'Laos',
  MY: 'Malaisie', ID: 'Indonésie', PH: 'Philippines', JP: 'Japon',
  KR: 'Corée du Sud', CN: 'Chine', MN: 'Mongolie', KZ: 'Kazakhstan',
  UZ: 'Ouzbékistan', KG: 'Kirghizistan', TJ: 'Tadjikistan', CL: 'Chili',
  AR: 'Argentine', BR: 'Brésil', CO: 'Colombie', PE: 'Pérou',
  BO: 'Bolivie', EC: 'Équateur', MX: 'Mexique', GT: 'Guatemala',
  CR: 'Costa Rica', PA: 'Panama', CU: 'Cuba', ZA: 'Afrique du Sud',
  NA: 'Namibie', BW: 'Botswana', KE: 'Kenya', TZ: 'Tanzanie',
  ET: 'Éthiopie', EG: 'Égypte', TN: 'Tunisie', SN: 'Sénégal',
  GH: 'Ghana', NG: 'Nigéria',
  JO: 'Jordanie', OM: 'Oman', NP: 'Népal', LK: 'Sri Lanka',
  PK: 'Pakistan', PY: 'Paraguay', UY: 'Uruguay', VE: 'Venezuela'
}

mkdirSync(OUTPUT_DIR, { recursive: true })

let totalSpots = 0
let totalLocations = 0
const countrySummary = []

for (const country of COUNTRIES) {
  // Get all non-banned points for this country
  const points = db.prepare(`
    SELECT id, lat, lon, rating, wait, comment, datetime, signal, dest_lat, dest_lon
    FROM points
    WHERE country = ? AND (banned = 0 OR banned IS NULL)
    ORDER BY datetime DESC
  `).all(country)

  if (points.length === 0) continue

  // Group by location (round to 3 decimals = ~111m precision)
  const locationMap = new Map()

  for (const p of points) {
    const key = `${Math.round(p.lat * 1000) / 1000},${Math.round(p.lon * 1000) / 1000}`

    if (!locationMap.has(key)) {
      locationMap.set(key, {
        lat: Math.round(p.lat * 10000) / 10000,
        lon: Math.round(p.lon * 10000) / 10000,
        ratings: [],
        waits: [],
        comments: [],
        signals: [],
        lastUsed: null,
        destLat: null,
        destLon: null,
      })
    }

    const loc = locationMap.get(key)
    if (p.rating) loc.ratings.push(p.rating)
    if (p.wait && p.wait > 0 && p.wait < 1440) loc.waits.push(p.wait) // max 24h
    if (p.comment && p.comment.trim()) {
      // Keep max 5 most recent comments, truncate to 500 chars
      if (loc.comments.length < 5) {
        loc.comments.push({
          text: p.comment.trim().substring(0, 500),
          date: p.datetime ? p.datetime.split(' ')[0] : null,
          rating: p.rating,
        })
      }
    }
    if (p.signal) loc.signals.push(p.signal)
    if (p.datetime && (!loc.lastUsed || p.datetime > loc.lastUsed)) {
      loc.lastUsed = p.datetime.split(' ')[0]
    }
    if (p.dest_lat && p.dest_lon && !loc.destLat) {
      loc.destLat = Math.round(p.dest_lat * 10000) / 10000
      loc.destLon = Math.round(p.dest_lon * 10000) / 10000
    }
  }

  // Convert to array with computed fields
  let spotId = 1
  const spots = []

  for (const [, loc] of locationMap) {
    const avgRating = loc.ratings.length > 0
      ? Math.round((loc.ratings.reduce((a, b) => a + b, 0) / loc.ratings.length) * 100) / 100
      : 3

    const avgWait = loc.waits.length > 0
      ? Math.round(loc.waits.reduce((a, b) => a + b, 0) / loc.waits.length)
      : null

    // Most common signal type
    const signalCounts = {}
    loc.signals.forEach(s => { signalCounts[s] = (signalCounts[s] || 0) + 1 })
    const bestSignal = Object.entries(signalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    spots.push({
      id: spotId++,
      lat: loc.lat,
      lon: loc.lon,
      rating: avgRating,
      reviews: loc.ratings.length,
      wait: avgWait,
      signal: bestSignal,
      lastUsed: loc.lastUsed,
      comments: loc.comments,
      destLat: loc.destLat,
      destLon: loc.destLon,
    })
  }

  // Sort by rating descending (best spots first)
  spots.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)

  // Write JSON file
  const filename = `${country.toLowerCase()}.json`
  const output = {
    country,
    name: COUNTRY_NAMES[country] || country,
    totalSpots: spots.length,
    totalReviews: points.length,
    source: 'hitchwiki',
    license: 'ODBL',
    attribution: 'Data from Hitchwiki/Hitchmap (ODBL)',
    spots,
  }

  writeFileSync(join(OUTPUT_DIR, filename), JSON.stringify(output))

  totalSpots += points.length
  totalLocations += spots.length
  countrySummary.push({ country, name: COUNTRY_NAMES[country], locations: spots.length, reviews: points.length })

  console.log(`✅ ${country} (${COUNTRY_NAMES[country]}): ${spots.length} locations, ${points.length} reviews → ${filename}`)
}

// Write index file with country summary
const index = {
  totalCountries: countrySummary.length,
  totalLocations,
  totalReviews: totalSpots,
  source: 'hitchwiki',
  license: 'ODBL',
  attribution: 'Data from Hitchwiki/Hitchmap (ODBL)',
  countries: countrySummary.map(c => ({
    code: c.country,
    name: c.name,
    locations: c.locations,
    reviews: c.reviews,
    file: `${c.country.toLowerCase()}.json`,
  })),
}

writeFileSync(join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2))

console.log(`\n🎉 DONE: ${totalLocations} unique locations, ${totalSpots} reviews across ${countrySummary.length} countries`)
console.log(`📁 Output directory: ${OUTPUT_DIR}`)
console.log(`📄 Generated ${countrySummary.length + 1} JSON files (${countrySummary.length} countries + index.json)`)

db.close()
