import sharp from 'sharp'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function generateIcons() {
  const svgBuffer = readFileSync(join(publicDir, 'icon.svg'))

  console.log('Generating PWA icons...')

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `icon-${size}.png`))
    console.log(`  ✓ icon-${size}.png`)
  }

  // Favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'))
  console.log('  ✓ favicon.png')

  // Apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'))
  console.log('  ✓ apple-touch-icon.png')

  console.log('\nAll icons generated successfully!')
}

generateIcons().catch(console.error)
