#!/usr/bin/env node
/**
 * Pre-rendering SEO Script
 * Generates static HTML pages for country guides so Google can index them
 * Run after build: node scripts/prerender-seo.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
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

  // Split by top-level objects: find each "code: 'XX'" and extract the block
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

    // Extract only top-level fields (indented with 4 spaces, not deeper)
    const getField = (field) => {
      const re = new RegExp(`^\\s{4}${field}:\\s*'([^']+)'`, 'm')
      const m = block.match(re)
      return m ? m[1] : ''
    }

    guides.push({
      code: starts[i].code,
      name: getField('name'),
      nameEn: getField('nameEn'),
      flag: getField('flag'),
      legalityTextEn: getField('legalityTextEn'),
      difficultyTextEn: getField('difficultyTextEn'),
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

function generateGuideHTML(guide, allGuides) {
  const spotCount = countSpots(guide.code)
  const spotText = spotCount > 0 ? `${spotCount} hitchhiking spots available on SpotHitch.` : ''
  const codeLower = guide.code.toLowerCase()

  // Pick 6 other popular guides for cross-linking (exclude current)
  const crossLinks = allGuides
    .filter(g => g.code !== guide.code && POPULAR_COUNTRIES.includes(g.code))
    .slice(0, 6)
    .map(g => `    <li><a href="${BASE_URL}/guides/${g.code.toLowerCase()}">${g.flag} Hitchhiking in ${g.nameEn}</a></li>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hitchhiking in ${guide.nameEn} ${guide.flag}${spotCount > 0 ? ` - ${spotCount} spots` : ''} | SpotHitch</title>
  <meta name="description" content="Hitchhiking guide for ${guide.nameEn}: ${guide.legalityTextEn}. Difficulty: ${guide.difficultyTextEn}.${spotCount > 0 ? ` ${spotCount} spots available.` : ''}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/guides/${codeLower}">
  <meta property="og:title" content="Hitchhiking in ${guide.nameEn} ${guide.flag} | SpotHitch">
  <meta property="og:description" content="${guide.legalityTextEn}">
  <meta property="og:url" content="${BASE_URL}/guides/${codeLower}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="en_US">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "name": "Hitchhiking in ${guide.nameEn}",
    "description": "${guide.legalityTextEn}",
    "url": "${BASE_URL}/guides/${codeLower}",
    "publisher": { "@type": "Organization", "name": "SpotHitch" }
  }
  </script>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#0f1520;color:#e2e8f0;margin:0;padding:20px}
    a{color:#f59e0b;text-decoration:none}a:hover{text-decoration:underline}
    .container{max-width:800px;margin:0 auto;padding:20px}
    h1{color:#fff;font-size:2em;margin-bottom:0.5em}
    h2{color:#f59e0b;font-size:1.3em;margin-top:1.5em}
    .info{background:#1a2332;padding:16px;border-radius:8px;margin:12px 0}
    ul{padding-left:20px}li{margin:6px 0}
  </style>
</head>
<body>
  <div class="container">
    <p><a href="${BASE_URL}">&larr; Back to SpotHitch</a></p>
    <h1>${guide.flag} Hitchhiking in ${guide.nameEn}</h1>
    <div class="info">
      <p><strong>Legality:</strong> ${guide.legalityTextEn}</p>
      <p><strong>Difficulty:</strong> ${guide.difficultyTextEn}</p>
      ${spotText ? `<p><strong>${spotCount} spots</strong> available on SpotHitch.</p>` : ''}
    </div>
    <p><a href="${BASE_URL}/?guide=${guide.code}">Open full interactive guide &rarr;</a></p>
    <h2>More Country Guides</h2>
    <ul>
${crossLinks}
    </ul>
    <p style="margin-top:2em"><a href="${BASE_URL}">&larr; Back to SpotHitch - The Hitchhiking Community</a></p>
  </div>
</body>
</html>`
}

function generateSitemap(guides) {
  const today = new Date().toISOString().split('T')[0]
  const urls = [
    `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
    ...guides.map(g =>
      `  <url><loc>${BASE_URL}/guides/${g.code.toLowerCase()}</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`
    )
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
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

// Generate sitemap (robots.txt comes from public/, not generated here)
writeFileSync(join(DIST_PATH, 'sitemap.xml'), generateSitemap(guides))

console.log(`Generated ${guides.length} guide pages + sitemap.xml`)
