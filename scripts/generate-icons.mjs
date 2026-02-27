#!/usr/bin/env node
/**
 * Generate recolored + resized PWA icons from logo-source.png
 * Uses Playwright's browser canvas for pixel manipulation.
 *
 * Target colors: hands=#f59e0b, background=#0f1520
 * Scale: option C (+45%, ~12% padding)
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.join(__dirname, '..', 'public')
const BRANDING = path.join(PUBLIC, 'images', 'branding')

const SIZES = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512]
const SCALE_FACTOR = 1.45

// Shared recolor function (runs in browser)
const RECOLOR_FN = `
function recolorCanvas(ctx, size) {
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  const BG_R = 15, BG_G = 21, BG_B = 32
  const HAND_R = 245, HAND_G = 158, HAND_B = 11
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
    if (a < 10) continue
    const brightness = (r + g + b) / 3
    const isBackground = (b >= r - 10 && brightness < 120) || brightness < 40
    if (isBackground) {
      data[i] = BG_R; data[i+1] = BG_G; data[i+2] = BG_B
    } else {
      const ob = Math.max(r, g, b) / 255
      if (brightness < 80) {
        const t = brightness / 80
        data[i]   = Math.round(BG_R*(1-t) + HAND_R*ob*t)
        data[i+1] = Math.round(BG_G*(1-t) + HAND_G*ob*t)
        data[i+2] = Math.round(BG_B*(1-t) + HAND_B*ob*t)
      } else {
        data[i]   = Math.round(HAND_R * ob)
        data[i+1] = Math.round(HAND_G * ob)
        data[i+2] = Math.round(HAND_B * ob)
      }
    }
  }
  ctx.putImageData(imageData, 0, 0)
}
`

async function main() {
  const sourcePath = path.join(BRANDING, 'logo-source.png')
  if (!fs.existsSync(sourcePath)) {
    console.error('Source logo not found:', sourcePath)
    process.exit(1)
  }
  const sourceBase64 = fs.readFileSync(sourcePath).toString('base64')
  const sourceDataUrl = `data:image/png;base64,${sourceBase64}`

  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const size of SIZES) {
    console.log(`Generating ${size}x${size}...`)
    const pngBase64 = await page.evaluate(async ({ dataUrl, size, scale, recolorCode }) => {
      return new Promise((resolve) => {
        // eslint-disable-next-line no-eval
        eval(recolorCode)
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
          ctx.fillStyle = '#0f1520'
          ctx.fillRect(0, 0, size, size)
          const s = size * scale
          const o = (size - s) / 2
          ctx.drawImage(img, o, o, s, s)
          recolorCanvas(ctx, size)
          resolve(canvas.toDataURL('image/png').split(',')[1])
        }
        img.src = dataUrl
      })
    }, { dataUrl: sourceDataUrl, size, scale: SCALE_FACTOR, recolorCode: RECOLOR_FN })

    const buf = Buffer.from(pngBase64, 'base64')

    // Save to appropriate files
    if (size === 32) {
      fs.writeFileSync(path.join(PUBLIC, 'favicon.png'), buf)
      console.log(`  -> favicon.png`)
    } else if (size === 180) {
      fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), buf)
      console.log(`  -> apple-touch-icon.png`)
    } else if (size === 192) {
      fs.writeFileSync(path.join(PUBLIC, `icon-${size}.png`), buf)
      fs.writeFileSync(path.join(PUBLIC, 'logo.png'), buf)
      console.log(`  -> icon-${size}.png + logo.png`)
    } else {
      fs.writeFileSync(path.join(PUBLIC, `icon-${size}.png`), buf)
      console.log(`  -> icon-${size}.png`)
    }
  }

  await browser.close()
  console.log('\nAll icons generated!')
}

main().catch(console.error)
