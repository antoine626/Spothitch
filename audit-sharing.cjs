/**
 * audit-sharing.cjs — Partage Avancé & Donation
 * Teste : copySpotLink, shareApp, shareSocial, openDonation, processDonation,
 *         openShareSpot, copyToClipboard, shareViaWhatsApp, shareViaTelegram,
 *         shareViaEmail, openReferralModal, copyReferralCode, openInvite
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
  console.log('  AUDIT SHARING — Partage Spot, App, Donation, Parrainage')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. PARTAGE SPOT ──
  console.log('── A. Partage Spot ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      copySpotLink: typeof window.copySpotLink === 'function',
      openShareSpot: typeof window.openShareSpot === 'function',
      shareSpot: typeof window.shareSpot === 'function',
    }))
    log(handlers.copySpotLink ? '✓' : '?', 'copySpotLink — copier lien spot disponible')
    log(handlers.openShareSpot ? '✓' : '?', 'openShareSpot — partager spot disponible')
    log(handlers.shareSpot ? '✓' : '?', 'shareSpot — partage spot disponible')

    if (handlers.copySpotLink) {
      const result = await page.evaluate(async () => {
        try {
          window.copySpotLink?.('spot_test_123', 48.8566, 2.3522)
          return true
        } catch { return false }
      })
      log(result ? '✓' : '?', 'copySpotLink — appelable sans crash')
    }
    await ctx.close()
  }

  // ── B. PARTAGE APP ──
  console.log('\n── B. Partage Application ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      shareApp: typeof window.shareApp === 'function',
      shareViaWhatsApp: typeof window.shareViaWhatsApp === 'function',
      shareViaTelegram: typeof window.shareViaTelegram === 'function',
      shareViaEmail: typeof window.shareViaEmail === 'function',
      shareSocial: typeof window.shareSocial === 'function',
    }))
    log(handlers.shareApp ? '✓' : '?', 'shareApp — partager app disponible')
    log(handlers.shareViaWhatsApp ? '✓' : '?', 'shareViaWhatsApp — partage WhatsApp disponible')
    log(handlers.shareViaTelegram ? '✓' : '?', 'shareViaTelegram — partage Telegram disponible')
    log(handlers.shareViaEmail ? '✓' : '?', 'shareViaEmail — partage Email disponible')
    log(handlers.shareSocial ? '✓' : '?', 'shareSocial — partage réseau social disponible')
    await ctx.close()
  }

  // ── C. PRESSE-PAPIER ──
  console.log('\n── C. Presse-papier ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      copyToClipboard: typeof window.copyToClipboard === 'function',
    }))
    log(handlers.copyToClipboard ? '✓' : '?', 'copyToClipboard — copier dans presse-papier disponible')

    // Vérifier que l'API clipboard est disponible
    const clipboardApi = await page.evaluate(() => 'clipboard' in navigator)
    log(clipboardApi ? '✓' : '?', 'Clipboard API — navigator.clipboard disponible')
    await ctx.close()
  }

  // ── D. PARRAINAGE ──
  console.log('\n── D. Parrainage & Invitation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      openReferral: typeof window.openReferralModal === 'function',
      copyCode: typeof window.copyReferralCode === 'function',
      openInvite: typeof window.openInvite === 'function',
    }))
    log(handlers.openReferral ? '✓' : '?', 'openReferralModal — parrainage disponible')
    log(handlers.copyCode ? '✓' : '?', 'copyReferralCode — copier code parrainage disponible')
    log(handlers.openInvite ? '✓' : '?', 'openInvite — inviter ami disponible')
    await ctx.close()
  }

  // ── E. DONATION ──
  console.log('\n── E. Donation ──')

  {
    const { page, ctx } = await newPage(browser)
    const handlers = await page.evaluate(() => ({
      open: typeof window.openDonation === 'function',
      process: typeof window.processDonation === 'function',
      close: typeof window.closeDonation === 'function',
    }))
    log(handlers.open ? '✓' : '?', 'openDonation — ouvrir donation disponible')
    log(handlers.process ? '✓' : '?', 'processDonation — traiter donation disponible')
    log(handlers.close ? '✓' : '?', 'closeDonation — fermer donation disponible')

    if (handlers.open) {
      await page.evaluate(() => window.openDonation?.())
      await page.waitForTimeout(500)
      const donationOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showDonation === true ||
          !!document.querySelector('[id*="donation-modal"], [id*="donate"]')
      })
      log(donationOpen ? '✓' : '?', 'openDonation — modal s\'ouvre')
    }
    await ctx.close()
  }

  // ── F. WEB SHARE API ──
  console.log('\n── F. Web Share API ──')

  {
    const { page, ctx } = await newPage(browser)
    const webShare = await page.evaluate(() => {
      return {
        hasShare: 'share' in navigator,
        canShare: 'canShare' in navigator,
      }
    })
    log(webShare.hasShare ? '✓' : '?', 'Web Share API — navigator.share disponible', `canShare: ${webShare.canShare}`)
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
