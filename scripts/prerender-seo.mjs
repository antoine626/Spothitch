#!/usr/bin/env node
/**
 * Pre-rendering SEO Script
 * Generates static HTML pages for country guides so Google can index them
 * Run after build: node scripts/prerender-seo.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const DIST_PATH = join(import.meta.dirname, '..', 'dist')
const GUIDES_PATH = join(import.meta.dirname, '..', 'src', 'data', 'guides.js')
const SPOTS_PATH = join(import.meta.dirname, '..', 'public', 'data', 'spots')
const BASE_URL = 'https://spothitch.com'

// Popular countries for cross-linking (top traffic)
const POPULAR_COUNTRIES = ['FR', 'DE', 'ES', 'IT', 'NL', 'PL', 'GB', 'US', 'AU', 'TR']

// Extract guide data by parsing each block between { code: ... }
function extractGuides() {
  const content = readFileSync(GUIDES_PATH, 'utf-8')
  const guides = []

  const blockRegex = /\{\s*\n\s*code:\s*'([A-Z]{2})'/g
  let match
  const starts = []
  while ((match = blockRegex.exec(content)) !== null) {
    starts.push({ index: match.index, code: match[1] })
  }

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index
    const end = i + 1 < starts.length ? starts[i + 1].index : content.length
    const block = content.slice(start, end)

    const getField = (field) => {
      const re = new RegExp(`^\\s{4}${field}:\\s*'([^']*)'`, 'm')
      const m = block.match(re)
      return m ? m[1].replace(/\\'/g, "'") : ''
    }

    // Extract array of strings (tipsEn, lawsEn, strategiesEn, etc.)
    const getArray = (field) => {
      const re = new RegExp(`${field}:\\s*\\[([\\s\\S]*?)\\]`, 'm')
      const m = block.match(re)
      if (!m) return []
      const items = []
      const itemRe = /'([^']+)'/g
      let im
      while ((im = itemRe.exec(m[1])) !== null) {
        items.push(im[1].replace(/\\'/g, "'"))
      }
      return items
    }

    // Extract phrases array [{local, meaningEn}]
    const getPhrases = () => {
      const re = /phrases:\s*\[([\s\S]*?)\]/m
      const m = block.match(re)
      if (!m) return []
      const phrases = []
      const phraseRe = /local:\s*'([^']+)'[\s\S]*?meaningEn:\s*'([^']+)'/g
      let pm
      while ((pm = phraseRe.exec(m[1])) !== null) {
        phrases.push({ local: pm[1].replace(/\\'/g, "'"), meaning: pm[2].replace(/\\'/g, "'") })
      }
      return phrases
    }

    // Extract events [{nameEn, dateEn, descriptionEn}]
    const getEvents = () => {
      const re = /events:\s*\[([\s\S]*?)\]\s*,?\s*\}/m
      const m = block.match(re)
      if (!m) return []
      const events = []
      const evRe = /nameEn:\s*'([^']+)'[\s\S]*?dateEn:\s*'([^']+)'[\s\S]*?descriptionEn:\s*'([^']+)'/g
      let em
      while ((em = evRe.exec(m[1])) !== null) {
        events.push({ name: em[1], date: em[2], desc: em[3].replace(/\\'/g, "'") })
      }
      return events
    }

    guides.push({
      code: starts[i].code,
      name: getField('name'),
      nameEn: getField('nameEn'),
      flag: getField('flag'),
      legalityTextEn: getField('legalityTextEn'),
      difficultyTextEn: getField('difficultyTextEn'),
      culturalNotesEn: getField('culturalNotesEn'),
      tipsEn: getArray('tipsEn'),
      lawsEn: getArray('lawsEn'),
      strategiesEn: getArray('strategiesEn'),
      borderCrossingsEn: getArray('borderCrossingsEn'),
      phrases: getPhrases(),
      events: getEvents(),
    })
  }

  return guides
}

// Count spots for a country
function countSpots(code) {
  const filePath = join(SPOTS_PATH, `${code.toLowerCase()}.json`)
  if (!existsSync(filePath)) return 0
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))
    if (Array.isArray(data)) return data.length
    if (data.spots && Array.isArray(data.spots)) return data.spots.length
    if (data.totalSpots) return data.totalSpots
    return 0
  } catch {
    return 0
  }
}

function nearestCityName(lat, lon) {
  let best = null, bestDist = Infinity
  for (const c of KNOWN_CITIES) {
    const d = haversineKm(lat, lon, c.lat, c.lon)
    if (d < bestDist) { bestDist = d; best = c }
  }
  return best && bestDist < 200 ? best.name : null
}

function generateGuideHTML(guide, allGuides) {
  const spotCount = countSpots(guide.code)
  const codeLower = guide.code.toLowerCase()

  // Cross-links to popular guides
  const crossLinks = allGuides
    .filter(g => g.code !== guide.code && POPULAR_COUNTRIES.includes(g.code))
    .slice(0, 6)
    .map(g => `      <li><a href="${BASE_URL}/guides/${g.code.toLowerCase()}">${g.flag} Hitchhiking in ${g.nameEn}</a></li>`)
    .join('\n')

  // Build rich content sections
  const sections = []

  if (guide.tipsEn.length > 0) {
    sections.push(`    <h2>Tips for Hitchhiking in ${guide.nameEn}</h2>
    <ul>${guide.tipsEn.map(t => `\n      <li>${t}</li>`).join('')}
    </ul>`)
  }

  if (guide.lawsEn.length > 0) {
    sections.push(`    <h2>Laws &amp; Regulations</h2>
    <ul>${guide.lawsEn.map(l => `\n      <li>${l}</li>`).join('')}
    </ul>`)
  }

  if (guide.strategiesEn.length > 0) {
    sections.push(`    <h2>Strategies</h2>
    <ul>${guide.strategiesEn.map(s => `\n      <li>${s}</li>`).join('')}
    </ul>`)
  }

  if (guide.culturalNotesEn) {
    sections.push(`    <h2>Cultural Notes</h2>
    <p>${guide.culturalNotesEn}</p>`)
  }

  if (guide.phrases.length > 0) {
    sections.push(`    <h2>Useful Phrases</h2>
    <ul>${guide.phrases.map(p => `\n      <li><strong>${p.local}</strong> — ${p.meaning}</li>`).join('')}
    </ul>`)
  }

  if (guide.events.length > 0) {
    sections.push(`    <h2>Events &amp; Festivals</h2>
    <ul>${guide.events.map(e => `\n      <li><strong>${e.name}</strong> (${e.date}) — ${e.desc}</li>`).join('')}
    </ul>`)
  }

  if (guide.borderCrossingsEn.length > 0) {
    sections.push(`    <h2>Border Crossings</h2>
    <ul>${guide.borderCrossingsEn.map(b => `\n      <li>${b}</li>`).join('')}
    </ul>`)
  }

  const richContent = sections.join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hitchhiking in ${guide.nameEn} ${guide.flag}${spotCount > 0 ? ` - ${spotCount} spots` : ''} | SpotHitch</title>
  <meta name="description" content="Complete hitchhiking guide for ${guide.nameEn}: legality, tips, strategies, useful phrases, cultural notes.${spotCount > 0 ? ` ${spotCount} spots available.` : ''}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/guides/${codeLower}">
  <meta property="og:title" content="Hitchhiking in ${guide.nameEn} ${guide.flag} | SpotHitch">
  <meta property="og:description" content="Complete hitchhiking guide: legality, tips, strategies, cultural notes for ${guide.nameEn}">
  <meta property="og:url" content="${BASE_URL}/guides/${codeLower}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="en_US">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "name": "Hitchhiking in ${guide.nameEn}",
    "description": "Complete hitchhiking guide for ${guide.nameEn}: legality, tips, strategies, useful phrases",
    "url": "${BASE_URL}/guides/${codeLower}",
    "publisher": { "@type": "Organization", "name": "SpotHitch" }
  }
  </script>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#0f1520;color:#e2e8f0;margin:0;padding:20px;line-height:1.6}
    a{color:#f59e0b;text-decoration:none}a:hover{text-decoration:underline}
    .container{max-width:800px;margin:0 auto;padding:20px}
    h1{color:#fff;font-size:2em;margin-bottom:0.5em}
    h2{color:#f59e0b;font-size:1.3em;margin-top:1.5em;border-bottom:1px solid #1a2332;padding-bottom:6px}
    .info{background:#1a2332;padding:16px;border-radius:12px;margin:16px 0}
    .info p{margin:8px 0}
    ul{padding-left:20px}li{margin:8px 0}
    .cta{display:inline-block;background:#f59e0b;color:#0f1520;padding:12px 24px;border-radius:8px;font-weight:bold;margin:16px 0}
    .cta:hover{background:#d97706;text-decoration:none}
  </style>
</head>
<body>
  <div class="container">
    <p><a href="${BASE_URL}">&larr; Back to SpotHitch</a></p>
    <h1>${guide.flag} Hitchhiking in ${guide.nameEn}</h1>
    <div class="info">
      <p><strong>Legality:</strong> ${guide.legalityTextEn}</p>
      <p><strong>Difficulty:</strong> ${guide.difficultyTextEn}</p>
      ${spotCount > 0 ? `<p><strong>${spotCount} hitchhiking spots</strong> available on SpotHitch.</p>` : ''}
    </div>
    <a class="cta" href="${BASE_URL}/?guide=${guide.code}">Open Full Interactive Guide &rarr;</a>
${richContent}
    <h2>More Country Guides</h2>
    <ul>
${crossLinks}
    </ul>
    <p style="margin-top:2em"><a href="${BASE_URL}">&larr; Back to SpotHitch - The Hitchhiking Community</a></p>
  </div>
</body>
</html>`
}

function generateSitemap(guides, cities) {
  const today = new Date().toISOString().split('T')[0]
  const urls = [
    `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
    ...guides.map(g =>
      `  <url><loc>${BASE_URL}/guides/${g.code.toLowerCase()}</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`
    ),
    ...cities.map(c =>
      `  <url><loc>${BASE_URL}/city/${c.slug}</loc><changefreq>monthly</changefreq><priority>0.6</priority><lastmod>${today}</lastmod></url>`
    ),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

// ==================== CITY PAGES ====================

// Country name mapping (ISO 2-letter code -> English name)
const COUNTRY_NAMES = {
  AD: 'Andorra', AF: 'Afghanistan', AL: 'Albania', AM: 'Armenia', AO: 'Angola',
  AR: 'Argentina', AT: 'Austria', AU: 'Australia', BA: 'Bosnia', BD: 'Bangladesh',
  BE: 'Belgium', BG: 'Bulgaria', BJ: 'Benin', BN: 'Brunei', BO: 'Bolivia',
  BR: 'Brazil', BW: 'Botswana', BZ: 'Belize', CA: 'Canada', CH: 'Switzerland',
  CI: 'Ivory Coast', CL: 'Chile', CM: 'Cameroon', CN: 'China', CO: 'Colombia',
  CR: 'Costa Rica', CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark',
  DM: 'Dominica', DO: 'Dominican Republic', DZ: 'Algeria', EC: 'Ecuador', EE: 'Estonia',
  EG: 'Egypt', ES: 'Spain', FI: 'Finland', FO: 'Faroe Islands', FR: 'France',
  GB: 'United Kingdom', GD: 'Grenada', GE: 'Georgia', GG: 'Guernsey', GH: 'Ghana',
  GL: 'Greenland', GR: 'Greece', GT: 'Guatemala', GY: 'Guyana', HN: 'Honduras',
  HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
  IM: 'Isle of Man', IN: 'India', IQ: 'Iraq', IR: 'Iran', IS: 'Iceland', IT: 'Italy',
  JE: 'Jersey', JO: 'Jordan', JP: 'Japan', KE: 'Kenya', KG: 'Kyrgyzstan',
  KH: 'Cambodia', KR: 'South Korea', KZ: 'Kazakhstan', LA: 'Laos', LI: 'Liechtenstein',
  LK: 'Sri Lanka', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MA: 'Morocco',
  MC: 'Monaco', MD: 'Moldova', ME: 'Montenegro', MK: 'North Macedonia', MN: 'Mongolia',
  MR: 'Mauritania', MT: 'Malta', MU: 'Mauritius', MX: 'Mexico', MY: 'Malaysia',
  MZ: 'Mozambique', NA: 'Namibia', NG: 'Nigeria', NI: 'Nicaragua', NL: 'Netherlands',
  NO: 'Norway', NP: 'Nepal', NZ: 'New Zealand', OM: 'Oman', PA: 'Panama',
  PE: 'Peru', PH: 'Philippines', PK: 'Pakistan', PL: 'Poland', PT: 'Portugal',
  PY: 'Paraguay', RO: 'Romania', RS: 'Serbia', RU: 'Russia', SA: 'Saudi Arabia',
  SE: 'Sweden', SI: 'Slovenia', SK: 'Slovakia', SM: 'San Marino', SN: 'Senegal',
  SZ: 'Eswatini', TG: 'Togo', TH: 'Thailand', TL: 'Timor-Leste', TN: 'Tunisia',
  TO: 'Tonga', TR: 'Turkey', UA: 'Ukraine', UG: 'Uganda', US: 'United States',
  UY: 'Uruguay', UZ: 'Uzbekistan', VC: 'St. Vincent', VN: 'Vietnam', ZA: 'South Africa',
  ZM: 'Zambia',
}

// Well-known cities with coordinates (top hitchhiking cities)
const KNOWN_CITIES = [
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
  { name: 'Berlin', lat: 52.5200, lon: 13.4050, country: 'DE' },
  { name: 'Madrid', lat: 40.4168, lon: -3.7038, country: 'ES' },
  { name: 'Barcelona', lat: 41.3874, lon: 2.1686, country: 'ES' },
  { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, country: 'NL' },
  { name: 'Prague', lat: 50.0755, lon: 14.4378, country: 'CZ' },
  { name: 'Vienna', lat: 48.2082, lon: 16.3738, country: 'AT' },
  { name: 'Munich', lat: 48.1351, lon: 11.5820, country: 'DE' },
  { name: 'Hamburg', lat: 53.5511, lon: 9.9937, country: 'DE' },
  { name: 'Lyon', lat: 45.7640, lon: 4.8357, country: 'FR' },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698, country: 'FR' },
  { name: 'Toulouse', lat: 43.6047, lon: 1.4442, country: 'FR' },
  { name: 'Bordeaux', lat: 44.8378, lon: -0.5792, country: 'FR' },
  { name: 'Nantes', lat: 47.2184, lon: -1.5536, country: 'FR' },
  { name: 'Brussels', lat: 50.8503, lon: 4.3517, country: 'BE' },
  { name: 'Rome', lat: 41.9028, lon: 12.4964, country: 'IT' },
  { name: 'Milan', lat: 45.4642, lon: 9.1900, country: 'IT' },
  { name: 'Lisbon', lat: 38.7223, lon: -9.1393, country: 'PT' },
  { name: 'Porto', lat: 41.1579, lon: -8.6291, country: 'PT' },
  { name: 'Warsaw', lat: 52.2297, lon: 21.0122, country: 'PL' },
  { name: 'Krakow', lat: 50.0647, lon: 19.9450, country: 'PL' },
  { name: 'Budapest', lat: 47.4979, lon: 19.0402, country: 'HU' },
  { name: 'Copenhagen', lat: 55.6761, lon: 12.5683, country: 'DK' },
  { name: 'Stockholm', lat: 59.3293, lon: 18.0686, country: 'SE' },
  { name: 'Oslo', lat: 59.9139, lon: 10.7522, country: 'NO' },
  { name: 'Helsinki', lat: 60.1699, lon: 24.9384, country: 'FI' },
  { name: 'Dublin', lat: 53.3498, lon: -6.2603, country: 'IE' },
  { name: 'Edinburgh', lat: 55.9533, lon: -3.1883, country: 'GB' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' },
  { name: 'Zurich', lat: 47.3769, lon: 8.5417, country: 'CH' },
  { name: 'Ljubljana', lat: 46.0569, lon: 14.5058, country: 'SI' },
  { name: 'Zagreb', lat: 45.8150, lon: 15.9819, country: 'HR' },
  { name: 'Belgrade', lat: 44.7866, lon: 20.4489, country: 'RS' },
  { name: 'Bucharest', lat: 44.4268, lon: 26.1025, country: 'RO' },
  { name: 'Sofia', lat: 42.6977, lon: 23.3219, country: 'BG' },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'TR' },
  { name: 'Athens', lat: 37.9838, lon: 23.7275, country: 'GR' },
  { name: 'Bratislava', lat: 48.1486, lon: 17.1077, country: 'SK' },
  { name: 'Tallinn', lat: 59.4370, lon: 24.7536, country: 'EE' },
  { name: 'Riga', lat: 56.9496, lon: 24.1052, country: 'LV' },
  { name: 'Vilnius', lat: 54.6872, lon: 25.2797, country: 'LT' },
  { name: 'Tbilisi', lat: 41.7151, lon: 44.8271, country: 'GE' },
  { name: 'Reykjavik', lat: 64.1466, lon: -21.9426, country: 'IS' },
  { name: 'Marrakech', lat: 31.6295, lon: -7.9811, country: 'MA' },
  { name: 'Fez', lat: 34.0181, lon: -5.0078, country: 'MA' },
  { name: 'Strasbourg', lat: 48.5734, lon: 7.7521, country: 'FR' },
  { name: 'Nice', lat: 43.7102, lon: 7.2620, country: 'FR' },
  { name: 'Montpellier', lat: 43.6108, lon: 3.8767, country: 'FR' },
  { name: 'Cologne', lat: 50.9375, lon: 6.9603, country: 'DE' },
  { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, country: 'DE' },
]

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function loadAllSpots() {
  const files = readdirSync(SPOTS_PATH).filter(f => f.endsWith('.json'))
  const allSpots = []
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(SPOTS_PATH, file), 'utf-8'))
      const country = file.replace('.json', '').toUpperCase()
      const spots = data.spots || (Array.isArray(data) ? data : [])
      for (const s of spots) {
        allSpots.push({ ...s, country })
      }
    } catch { /* skip broken files */ }
  }
  return allSpots
}

/**
 * Auto-discover cities by clustering spots geographically.
 * Groups spots within 15km of each other, names the cluster
 * after the most common comment mention or coordinates.
 */
function discoverCitiesFromSpots(allSpots) {
  const discovered = []
  const used = new Set()

  // Sort spots by density (spots with more neighbors first)
  const withNeighbors = allSpots
    .filter(s => s.lat && s.lon)
    .map(s => {
      const neighbors = allSpots.filter(other =>
        other !== s && other.lat && other.lon &&
        haversineKm(s.lat, s.lon, other.lat, other.lon) <= 15
      ).length
      return { ...s, neighbors }
    })
    .sort((a, b) => b.neighbors - a.neighbors)

  for (const spot of withNeighbors) {
    const key = `${Math.round(spot.lat * 5)}_${Math.round(spot.lon * 5)}`
    if (used.has(key)) continue

    // Find all spots in 15km radius
    const cluster = allSpots.filter(s =>
      s.lat && s.lon && haversineKm(spot.lat, spot.lon, s.lat, s.lon) <= 15
    )
    if (cluster.length < 3) continue // Need 3+ spots to be worth a page

    used.add(key)

    // Try to find a city name from comments
    let cityName = null
    for (const s of cluster) {
      if (s.comments && s.comments.length > 0) {
        for (const c of s.comments) {
          // Look for patterns like "from CityName" or "near CityName" in comments
          const match = c.text?.match(/(?:from|near|in|leaving|quitting|depuis|près de|sortie)\s+([A-Z][a-zéèêëàâîïôùûü]+(?:\s[A-Z][a-zéèêëàâîïôùûü]+)?)/i)
          if (match) {
            cityName = match[1].trim()
            break
          }
        }
        if (cityName) break
      }
    }

    // Fallback: use coordinates as name (will be improved when users add real city data)
    if (!cityName) continue // Skip unnamed clusters for SEO

    discovered.push({
      name: cityName,
      lat: spot.lat,
      lon: spot.lon,
      country: spot.country || '',
    })
  }

  return discovered
}

function buildCitySEOData(allSpots) {
  const cities = []
  const processedSlugs = new Set()

  // Auto-discover cities from spot clusters (groups of 2+ spots within 15km)
  const autoCities = discoverCitiesFromSpots(allSpots)

  // Merge: KNOWN_CITIES first (higher quality), then auto-discovered
  const allCities = [...KNOWN_CITIES]
  for (const ac of autoCities) {
    const slug = slugify(ac.name)
    if (!allCities.some(kc => slugify(kc.name) === slug)) {
      allCities.push(ac)
    }
  }

  for (const city of allCities) {
    const slug = slugify(city.name)
    if (processedSlugs.has(slug)) continue
    processedSlugs.add(slug)

    const nearby = allSpots.filter(s => {
      if (!s.lat || !s.lon) return false
      return haversineKm(city.lat, city.lon, s.lat, s.lon) <= 30
    })
    if (nearby.length < 2) continue

    const waits = nearby.filter(s => s.wait > 0).map(s => s.wait)
    const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0
    const ratings = nearby.filter(s => s.rating > 0).map(s => s.rating)
    const avgRating = ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0

    // Group by destination direction
    const routes = {}
    for (const spot of nearby) {
      if (!spot.destLat || !spot.destLon) continue
      let matched = false
      for (const key of Object.keys(routes)) {
        const r = routes[key]
        if (haversineKm(r.destLat, r.destLon, spot.destLat, spot.destLon) < 30) {
          r.spots.push(spot)
          matched = true
          break
        }
      }
      if (!matched) {
        const key = `${Math.round(spot.destLat * 10)}_${Math.round(spot.destLon * 10)}`
        routes[key] = { destLat: spot.destLat, destLon: spot.destLon, spots: [spot] }
      }
    }

    const routesList = Object.entries(routes)
      .map(([key, r]) => ({
        slug: key,
        destLat: r.destLat,
        destLon: r.destLon,
        spotCount: r.spots.length,
        avgWait: r.spots.filter(s => s.wait > 0).length > 0
          ? Math.round(r.spots.filter(s => s.wait > 0).reduce((a, s) => a + s.wait, 0) / r.spots.filter(s => s.wait > 0).length)
          : 0,
      }))
      .filter(r => r.spotCount >= 1)
      .sort((a, b) => b.spotCount - a.spotCount)

    cities.push({
      name: city.name,
      slug: slugify(city.name),
      lat: city.lat,
      lon: city.lon,
      country: city.country,
      countryName: COUNTRY_NAMES[city.country] || city.country,
      spotCount: nearby.length,
      avgWait,
      avgRating,
      routesList,
    })
  }

  return cities
}

function generateCityHTML(city) {
  const routesHTML = city.routesList.slice(0, 15).map((r) => {
    const destName = nearestCityName(r.destLat, r.destLon)
    // Skip routes pointing back to the same city
    if (destName && destName.toLowerCase() === city.name.toLowerCase()) return null
    const label = destName ? `Towards ${destName}` : `Direction ${r.destLat.toFixed(1)}°N, ${r.destLon.toFixed(1)}°E`
    return `      <li><strong>${label}</strong>: ${r.spotCount} spot${r.spotCount > 1 ? 's' : ''}${r.avgWait > 0 ? `, ~${r.avgWait} min average wait` : ''}</li>`
  }).filter(Boolean).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hitchhiking from ${city.name}, ${city.countryName} - ${city.spotCount} spots | SpotHitch</title>
  <meta name="description" content="Best hitchhiking spots leaving ${city.name}, ${city.countryName}. ${city.spotCount} spots${city.avgWait > 0 ? `, average wait ${city.avgWait} min` : ''}. Find the best departure points.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/city/${city.slug}">
  <meta property="og:title" content="Hitchhiking from ${city.name} | SpotHitch">
  <meta property="og:description" content="${city.spotCount} hitchhiking spots near ${city.name}${city.avgWait > 0 ? `, ~${city.avgWait} min average wait` : ''}">
  <meta property="og:url" content="${BASE_URL}/city/${city.slug}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="en_US">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": "Hitchhiking spots near ${city.name}",
    "description": "${city.spotCount} hitchhiking spots leaving ${city.name}, ${city.countryName}",
    "url": "${BASE_URL}/city/${city.slug}",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": ${city.lat},
      "longitude": ${city.lon}
    },
    "containedInPlace": {
      "@type": "Country",
      "name": "${city.countryName}"
    }
  }
  </script>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#0f1520;color:#e2e8f0;margin:0;padding:20px}
    a{color:#f59e0b;text-decoration:none}a:hover{text-decoration:underline}
    .container{max-width:800px;margin:0 auto;padding:20px}
    h1{color:#fff;font-size:2em;margin-bottom:0.5em}
    h2{color:#f59e0b;font-size:1.3em;margin-top:1.5em}
    .info{background:#1a2332;padding:16px;border-radius:8px;margin:12px 0}
    .stat{display:inline-block;margin-right:16px;font-size:1.1em}
    .stat strong{color:#f59e0b}
    ul{padding-left:20px}li{margin:6px 0}
  </style>
</head>
<body>
  <div class="container">
    <p><a href="${BASE_URL}">&larr; Back to SpotHitch</a></p>
    <h1>Hitchhiking from ${city.name}</h1>
    <div class="info">
      <p class="stat"><strong>${city.spotCount}</strong> spots</p>
      ${city.avgWait > 0 ? `<p class="stat">Average wait: <strong>~${city.avgWait} min</strong></p>` : ''}
      ${city.avgRating > 0 ? `<p class="stat">Rating: <strong>${city.avgRating}/5</strong></p>` : ''}
      <p>Country: <a href="${BASE_URL}/guides/${city.country.toLowerCase()}">${city.countryName}</a></p>
    </div>
    <p><a href="${BASE_URL}/?city=${city.slug}&lat=${city.lat}&lon=${city.lon}">Open in SpotHitch App &rarr;</a></p>
    ${city.routesList.length > 0 ? `
    <h2>Popular departure directions</h2>
    <ul>
${routesHTML}
    </ul>` : ''}
    <h2>More cities</h2>
    <ul>
      <li><a href="${BASE_URL}/">Find more hitchhiking spots worldwide</a></li>
    </ul>
    <p style="margin-top:2em"><a href="${BASE_URL}">&larr; Back to SpotHitch - The Hitchhiking Community</a></p>
  </div>
</body>
</html>`
}

// Main
const guides = extractGuides()
console.log(`Generating pre-rendered pages for ${guides.length} country guides...`)

// Verify extraction
for (const g of guides) {
  if (!g.nameEn || !g.flag) {
    console.warn(`  WARNING: ${g.code} missing nameEn="${g.nameEn}" flag="${g.flag}"`)
  }
}

// Create guides directory
const guidesDir = join(DIST_PATH, 'guides')
if (!existsSync(guidesDir)) mkdirSync(guidesDir, { recursive: true })

// Generate guide pages
for (const guide of guides) {
  const dir = join(guidesDir, guide.code.toLowerCase())
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), generateGuideHTML(guide, guides))
}

// ==================== CITY PAGES ====================
console.log('Loading all spots for city pages...')
const allSpots = loadAllSpots()
console.log(`Loaded ${allSpots.length} spots total`)

const cities = buildCitySEOData(allSpots)
console.log(`Building city pages for ${cities.length} cities with 2+ spots...`)

// Create city directory
const cityDir = join(DIST_PATH, 'city')
if (!existsSync(cityDir)) mkdirSync(cityDir, { recursive: true })

// Generate city pages
for (const city of cities) {
  const dir = join(cityDir, city.slug)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), generateCityHTML(city))
}

// Generate sitemap (robots.txt comes from public/, not generated here)
writeFileSync(join(DIST_PATH, 'sitemap.xml'), generateSitemap(guides, cities))

console.log(`Generated ${guides.length} guide pages + ${cities.length} city pages + sitemap.xml`)
