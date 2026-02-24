#!/usr/bin/env node
/**
 * Generate all app icons from a single source image.
 *
 * Usage:
 *   node scripts/generate-icons.mjs [path-to-source.png]
 *
 * If no path given, uses public/images/branding/logo-source.png
 *
 * Requires: sharp (npm install -D sharp)
 *
 * Output files generated in public/:
 *   logo.png          (192x192)  — Header + Splash screen
 *   favicon.png       (32x32)   — Browser tab
 *   apple-touch-icon  (180x180) — iOS home screen
 *   icon-72.png       (72x72)   — PWA manifest
 *   icon-96.png       (96x96)   — PWA manifest + notifications badge
 *   icon-128.png      (128x128) — PWA manifest
 *   icon-144.png      (144x144) — PWA manifest
 *   icon-152.png      (152x152) — PWA manifest
 *   icon-192.png      (192x192) — PWA manifest + notifications icon
 *   icon-384.png      (384x384) — PWA manifest
 *   icon-512.png      (512x512) — PWA manifest + SEO schema.org
 *   og-image.png      (1200x630) — Open Graph (centered logo on dark bg)
 *   images/branding/logo.webp    — WebP version
 *   images/branding/icon-512.webp — WebP icon
 */

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, copyFileSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public')
const BRANDING = join(PUBLIC, 'images', 'branding')

// Source image path
const sourcePath = process.argv[2] || join(BRANDING, 'logo-source.png')

if (!existsSync(sourcePath)) {
  console.error(`Source image not found: ${sourcePath}`)
  console.error('Usage: node scripts/generate-icons.mjs [path-to-source.png]')
  console.error('')
  console.error('Place your high-res logo (512px+ square) at:')
  console.error('  public/images/branding/logo-source.png')
  process.exit(1)
}

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('sharp is not installed. Install it with:')
  console.error('  npm install -D sharp')
  console.error('')
  console.error('Then re-run this script.')
  process.exit(1)
}

// Ensure branding dir exists
if (!existsSync(BRANDING)) mkdirSync(BRANDING, { recursive: true })

// Save source for future reference
const sourceBackup = join(BRANDING, 'logo-source.png')
if (sourcePath !== sourceBackup) {
  copyFileSync(sourcePath, sourceBackup)
  console.log(`Source saved to: ${sourceBackup}`)
}

// Icon sizes to generate
const ICON_SIZES = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512]

console.log('Generating icons from:', sourcePath)

for (const size of ICON_SIZES) {
  const filename = size === 32
    ? 'favicon.png'
    : size === 180
      ? 'apple-touch-icon.png'
      : size === 192
        ? 'icon-192.png'
        : `icon-${size}.png`

  await sharp(sourcePath)
    .resize(size, size, { fit: 'cover' })
    .png({ quality: 90 })
    .toFile(join(PUBLIC, filename))

  console.log(`  [OK] ${filename} (${size}x${size})`)

  // Also generate logo.png at 192px
  if (size === 192) {
    await sharp(sourcePath)
      .resize(192, 192, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(join(PUBLIC, 'logo.png'))
    console.log(`  [OK] logo.png (192x192)`)
  }
}

// WebP versions
await sharp(sourcePath)
  .resize(512, 512, { fit: 'cover' })
  .webp({ quality: 85 })
  .toFile(join(BRANDING, 'logo.webp'))
console.log('  [OK] images/branding/logo.webp')

await sharp(sourcePath)
  .resize(512, 512, { fit: 'cover' })
  .webp({ quality: 85 })
  .toFile(join(BRANDING, 'icon-512.webp'))
console.log('  [OK] images/branding/icon-512.webp')

// OG image (1200x630 with logo centered on dark background)
const ogWidth = 1200
const ogHeight = 630
const logoSize = 300
const logoBuf = await sharp(sourcePath)
  .resize(logoSize, logoSize, { fit: 'cover' })
  .png()
  .toBuffer()

await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 4,
    background: { r: 15, g: 21, b: 32, alpha: 1 }, // #0f1520
  },
})
  .composite([{
    input: logoBuf,
    left: Math.round((ogWidth - logoSize) / 2),
    top: Math.round((ogHeight - logoSize) / 2),
  }])
  .png({ quality: 90 })
  .toFile(join(PUBLIC, 'og-image.png'))
console.log('  [OK] og-image.png (1200x630)')

console.log(`\nDone! ${ICON_SIZES.length + 4} files generated.`)
console.log('Remember to bump the favicon cache version in index.html if needed: href="favicon.png?v=X"')
