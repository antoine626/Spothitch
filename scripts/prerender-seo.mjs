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
const BASE_URL = 'https://spothitch.com'

// Extract guide data from source
function extractGuides() {
  const content = readFileSync(GUIDES_PATH, 'utf-8')
  const guides = []

  const codeRegex = /code:\s*'([^']+)'/g
  const nameRegex = /name:\s*'([^']+)'/g
  const nameEnRegex = /nameEn:\s*'([^']+)'/g
  const flagRegex = /flag:\s*'([^']+)'/g
  const legalityTextRegex = /legalityText:\s*'([^']+)'/g
  const difficultyTextRegex = /difficultyText:\s*'([^']+)'/g

  let match
  const codes = []
  while ((match = codeRegex.exec(content)) !== null) codes.push(match[1])

  const names = []
  while ((match = nameRegex.exec(content)) !== null) names.push(match[1])

  const namesEn = []
  while ((match = nameEnRegex.exec(content)) !== null) namesEn.push(match[1])

  const flags = []
  while ((match = flagRegex.exec(content)) !== null) flags.push(match[1])

  const legality = []
  while ((match = legalityTextRegex.exec(content)) !== null) legality.push(match[1])

  const difficulty = []
  while ((match = difficultyTextRegex.exec(content)) !== null) difficulty.push(match[1])

  for (let i = 0; i < codes.length; i++) {
    guides.push({
      code: codes[i],
      name: names[i] || codes[i],
      nameEn: namesEn[i] || names[i],
      flag: flags[i] || '',
      legalityText: legality[i] || '',
      difficultyText: difficulty[i] || '',
    })
  }

  return guides
}

function generateGuideHTML(guide) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auto-stop ${guide.name} ${guide.flag} - Guide SpotHitch</title>
  <meta name="description" content="Guide auto-stop ${guide.name}: ${guide.legalityText}. ${guide.difficultyText}. Spots, lois, numeros d'urgence et conseils pour faire du stop en ${guide.name}.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/guides/${guide.code.toLowerCase()}">
  <meta property="og:title" content="Auto-stop ${guide.name} ${guide.flag} - SpotHitch">
  <meta property="og:description" content="Guide complet: ${guide.legalityText}">
  <meta property="og:url" content="${BASE_URL}/guides/${guide.code.toLowerCase()}">
  <meta property="og:type" content="article">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "name": "Guide auto-stop ${guide.name}",
    "description": "${guide.legalityText}",
    "url": "${BASE_URL}/guides/${guide.code.toLowerCase()}",
    "publisher": { "@type": "Organization", "name": "SpotHitch" }
  }
  </script>
  <meta http-equiv="refresh" content="0;url=${BASE_URL}/?guide=${guide.code}">
</head>
<body>
  <h1>${guide.flag} Auto-stop en ${guide.name}</h1>
  <p>${guide.legalityText}</p>
  <p>Difficulte: ${guide.difficultyText}</p>
  <p><a href="${BASE_URL}">Voir tous les guides sur SpotHitch</a></p>
  <p><a href="${BASE_URL}/?guide=${guide.code}">Ouvrir le guide complet</a></p>
  <noscript>
    <p>SpotHitch - La communaute des autostoppeurs. 37 000+ spots dans 170 pays.</p>
  </noscript>
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
<urlset xmlns="http://www.sitemapindex.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

// Main
const guides = extractGuides()
console.log(`Generating pre-rendered pages for ${guides.length} country guides...`)

// Create guides directory
const guidesDir = join(DIST_PATH, 'guides')
if (!existsSync(guidesDir)) mkdirSync(guidesDir, { recursive: true })

// Generate guide pages
for (const guide of guides) {
  const dir = join(guidesDir, guide.code.toLowerCase())
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), generateGuideHTML(guide))
}

// Generate sitemap
writeFileSync(join(DIST_PATH, 'sitemap.xml'), generateSitemap(guides))

// Generate robots.txt
writeFileSync(join(DIST_PATH, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`)

console.log(`Generated ${guides.length} guide pages + sitemap.xml + robots.txt`)
