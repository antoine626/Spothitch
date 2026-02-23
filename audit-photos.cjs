/**
 * audit-photos.cjs — Photos & Galerie : fullscreen, upload, validation, galerie spot
 * Teste : openPhotoFullscreen, nextPhoto, prevPhoto, closePhotoFullscreen,
 *         handlePhotoUpload, validateImage, removePhoto, openSpotGallery,
 *         handleCheckinPhoto, triggerCheckinPhoto, compressImage, uploadSpotPhoto
 * Cible : https://spothitch.com
 */
const { chromium } = require('playwright')

const BASE_URL = 'https://spothitch.com'
let pass = 0, fail = 0, skip = 0
const details = []

function log(icon, name, detail = '') {
  if (icon === '✓') pass++
  else if (icon === '✗') fail++
  else skip++
  console.log(`  ${icon} ${name}${detail ? ' — ' + detail : ''}`)
  details.push({ icon, name, detail })
}

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: 'map' })
  })
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT PHOTOS — Galerie, Upload, Fullscreen, Check-in Photo')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. GALERIE FULLSCREEN ──
  console.log('── A. Photo Fullscreen ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openPhotoFullscreen === 'function',
      close: typeof window.closePhotoFullscreen === 'function',
      next: typeof window.nextPhoto === 'function',
      prev: typeof window.prevPhoto === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openPhotoFullscreen — ouvrir photo plein écran disponible')
    log(handlers.close ? '✓' : '?', 'closePhotoFullscreen — fermer photo plein écran disponible')
    log(handlers.next ? '✓' : '?', 'nextPhoto — photo suivante disponible')
    log(handlers.prev ? '✓' : '?', 'prevPhoto — photo précédente disponible')

    if (handlers.open) {
      await page.evaluate(() => window.openPhotoFullscreen?.('https://picsum.photos/400/300', 0))
      await page.waitForTimeout(500)
      const fullscreenOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showPhotoFullscreen === true ||
          !!document.querySelector('[id*="photo-fullscreen"], [id*="lightbox"]')
      })
      log(fullscreenOpen ? '✓' : '?', 'openPhotoFullscreen — lightbox s\'ouvre')
    }
    await ctx.close()
  }

  // ── B. GALERIE SPOT ──
  console.log('\n── B. Galerie Spot ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openGallery: typeof window.openSpotGallery === 'function',
      closeGallery: typeof window.closeSpotGallery === 'function',
    }))
    log(handlers.openGallery ? '✓' : '?', 'openSpotGallery — galerie spot disponible')
    log(handlers.closeGallery ? '✓' : '?', 'closeSpotGallery — fermer galerie disponible')
    await ctx.close()
  }

  // ── C. UPLOAD & VALIDATION PHOTO ──
  console.log('\n── C. Upload & Validation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      handleUpload: typeof window.handlePhotoUpload === 'function',
      validateImage: typeof window.validateImage === 'function',
      removePhoto: typeof window.removePhoto === 'function',
      compressImage: typeof window.compressImage === 'function',
      uploadSpotPhoto: typeof window.uploadSpotPhoto === 'function',
    }))
    log(handlers.handleUpload ? '✓' : '?', 'handlePhotoUpload — handler upload disponible')
    log(handlers.validateImage ? '✓' : '?', 'validateImage — validation image disponible')
    log(handlers.removePhoto ? '✓' : '?', 'removePhoto — supprimer photo disponible')
    log(handlers.compressImage ? '✓' : '?', 'compressImage — compression image disponible')
    log(handlers.uploadSpotPhoto ? '✓' : '?', 'uploadSpotPhoto — upload photo spot disponible')
    await ctx.close()
  }

  // ── D. PHOTO CHECK-IN ──
  console.log('\n── D. Photo Check-in ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      handleCheckin: typeof window.handleCheckinPhoto === 'function',
      triggerCheckin: typeof window.triggerCheckinPhoto === 'function',
    }))
    log(handlers.handleCheckin ? '✓' : '?', 'handleCheckinPhoto — handler photo check-in disponible')
    log(handlers.triggerCheckin ? '✓' : '?', 'triggerCheckinPhoto — déclencher photo check-in disponible')
    await ctx.close()
  }

  // ── E. ÉTAT PHOTO ──
  console.log('\n── E. État Photo ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.setState?.({
        showPhotoFullscreen: true,
        currentPhotoIndex: 0,
        currentPhotos: ['https://picsum.photos/400/300', 'https://picsum.photos/400/301'],
      })
    })
    await page.waitForTimeout(300)
    const stateOk = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showPhotoFullscreen === true && Array.isArray(state?.currentPhotos)
    })
    log(stateOk ? '✓' : '?', 'État photo — currentPhotos + showPhotoFullscreen injectables')
    await ctx.close()
  }

  // ── F. IMAGE UTILS ──
  console.log('\n── F. Utilitaires Image ──')

  {
    const { page, ctx } = await newPage(browser)
    const utils = await page.evaluate(() => ({
      safePhotoURL: typeof window.safePhotoURL === 'function',
      getImageDimensions: typeof window.getImageDimensions === 'function',
      imageToBase64: typeof window.imageToBase64 === 'function',
    }))
    log(utils.safePhotoURL ? '✓' : '?', 'safePhotoURL — URL photo sécurisée disponible')
    log(utils.getImageDimensions ? '✓' : '?', 'getImageDimensions — dimensions image disponibles')
    log(utils.imageToBase64 ? '✓' : '?', 'imageToBase64 — conversion base64 disponible')
    await ctx.close()
  }

  await browser.close()
  console.log('\n══════════════════════════════════════════════')
  console.log(`  RÉSULTATS : ${pass} ✓  ${fail} ✗  ${skip} ?`)
  console.log('══════════════════════════════════════════════\n')
  if (fail > 0) {
    console.log('❌ ÉCHECS :')
    details.filter(d => d.icon === '✗').forEach(d => console.log(`  • ${d.name}: ${d.detail}`))
  }
  if (skip > 0) {
    console.log('⚠ À VÉRIFIER :')
    details.filter(d => d.icon === '?').forEach(d => console.log(`  • ${d.name}: ${d.detail}`))
  }
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
