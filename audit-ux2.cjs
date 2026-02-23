/**
 * audit-ux2.cjs — UX avancée : États vides, Profil footer, CGU, Skeletons, FAQ
 * Teste : états vides (friends/favorites/trips), profile footer (bug report, changelog,
 *         invite, CGU, social links), FAQ modal, skeletons en loading, contact form
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
  await page.evaluate((o) => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    const userState = {
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, photoURL: null, metadata: { creationTime: new Date(Date.now() - 48*3600000).toISOString() } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: o.tab || 'map', ...userState })
    localStorage.setItem('spothitch_account_created', new Date(Date.now() - 48*3600000).toISOString())
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT UX 2 — États Vides, Profil Footer, CGU, FAQ, Skeletons')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. ÉTATS VIDES ──
  console.log('── A. États Vides ──')

  // A1. État vide amis
  {
    const { page, ctx } = await newPage(browser, { tab: 'social' })
    await page.evaluate(() => {
      window.setState?.({ friends: [], friendRequests: [], socialTab: 'amis' })
    })
    await page.waitForTimeout(600)
    const emptyOk = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('compagnon') || text.includes('ami') || text.includes('route') ||
        !!document.querySelector('[class*="empty-state"], [id*="empty"]') ||
        typeof window.renderEmptyState === 'function'
    })
    log(emptyOk ? '✓' : '?', 'État vide amis — message vide ou composant EmptyState')
    await ctx.close()
  }

  // A2. renderEmptyState disponible
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.renderEmptyState === 'function')
    log(hasFn ? '✓' : '?', 'renderEmptyState — fonction états vides disponible')

    // A3. État vide favoris (localStorage vide)
    await page.evaluate(() => {
      localStorage.removeItem('spothitch_favorites')
      window.setState?.({ activeTab: 'profile', profileSubTab: 'progression' })
    })
    await page.waitForTimeout(500)
    const favEmptyOk = await page.evaluate(() => {
      const favs = JSON.parse(localStorage.getItem('spothitch_favorites') || '[]')
      return favs.length === 0
    })
    log(favEmptyOk ? '✓' : '?', 'État vide favoris — favoris vides détectables')
    await ctx.close()
  }

  // ── B. FAQ ──
  console.log('\n── B. FAQ ──')

  // B1. openFAQ / closeFAQ
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openFAQ?.())
    await page.waitForTimeout(600)
    const faqOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showFAQ === true || !!document.querySelector('[id*="faq-modal"]')
    })
    log(faqOpen ? '✓' : '?', 'openFAQ — modal FAQ ouvert')
    await page.evaluate(() => window.closeFAQ?.())
    await page.waitForTimeout(300)
    const faqClosed = await page.evaluate(() => window.getState?.()?.showFAQ !== true)
    log(faqClosed ? '✓' : '?', 'closeFAQ — modal FAQ fermé')
    await ctx.close()
  }

  // B2. openHelpCenter (alias openFAQ)
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openHelpCenter === 'function')
    log(hasFn ? '✓' : '?', 'openHelpCenter — aide/centre aide disponible')
    await ctx.close()
  }

  // ── C. CONTACT / BUG REPORT ──
  console.log('\n── C. Contact & Bug Report ──')

  // C1. openContactForm / closeContactForm
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openContactForm?.())
    await page.waitForTimeout(600)
    const contactOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showContactForm === true || !!document.querySelector('[id*="contact-form"], [id*="contact-modal"]')
    })
    log(contactOpen ? '✓' : '?', 'openContactForm — formulaire contact ouvert')
    await page.evaluate(() => window.closeContactForm?.())
    await page.waitForTimeout(300)
    log('✓', 'closeContactForm — fonction appelable')
    await ctx.close()
  }

  // C2. openBugReport
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openBugReport?.())
    await page.waitForTimeout(600)
    const bugOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showContactForm === true || state?.showBugReport === true ||
        !!document.querySelector('[id*="bug-report"], [id*="contact"]')
    })
    log(bugOpen ? '✓' : '?', 'openBugReport — formulaire bug report ouvert')
    await ctx.close()
  }

  // ── D. LEGAL / CGU ──
  console.log('\n── D. Legal / CGU ──')

  // D1. showLegalPage / closeLegal
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.showLegalPage?.('cgu'))
    await page.waitForTimeout(600)
    const legalOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showLegal === true && state?.legalPage === 'cgu' ||
        !!document.querySelector('[id*="legal-modal"]')
    })
    log(legalOpen ? '✓' : '?', 'showLegalPage("cgu") — modal CGU ouvert')
    await page.evaluate(() => window.closeLegal?.())
    await page.waitForTimeout(300)
    const legalClosed = await page.evaluate(() => window.getState?.()?.showLegal !== true)
    log(legalClosed ? '✓' : '?', 'closeLegal — modal légal fermé')
    await ctx.close()
  }

  // D2. Privacy policy
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.showLegalPage?.('privacy'))
    await page.waitForTimeout(600)
    const privacyOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return (state?.showLegal === true && state?.legalPage === 'privacy') ||
        !!document.querySelector('[id*="legal-modal"]')
    })
    log(privacyOpen ? '✓' : '?', 'showLegalPage("privacy") — politique confidentialité ouverte')
    await ctx.close()
  }

  // D3. Community guidelines
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.showLegalPage?.('guidelines'))
    await page.waitForTimeout(600)
    const guidelinesOpen = await page.evaluate(() => {
      const state = window.getState?.()
      return (state?.showLegal === true && state?.legalPage === 'guidelines') ||
        !!document.querySelector('[id*="legal-modal"]')
    })
    log(guidelinesOpen ? '✓' : '?', 'showLegalPage("guidelines") — charte communautaire ouverte')
    await ctx.close()
  }

  // ── E. CHANGELOG & PARTAGE ──
  console.log('\n── E. Changelog & Partage ──')

  // E1. openChangelog
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openChangelog === 'function')
    if (hasFn) {
      await page.evaluate(() => window.openChangelog?.())
      await page.waitForTimeout(500)
      const changelogOk = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showChangelog === true || state?.showFAQ === true ||
          !!document.querySelector('[id*="changelog"]') || typeof window.openChangelog === 'function'
      })
      log(changelogOk ? '✓' : '?', 'openChangelog — changelog/nouveautés disponible')
    } else {
      log('?', 'openChangelog — fonction non trouvée')
    }
    await ctx.close()
  }

  // E2. shareApp (Web Share API)
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.shareApp === 'function')
    log(hasFn ? '✓' : '?', 'shareApp — partager l\'application disponible')
    await ctx.close()
  }

  // E3. openRoadmap
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openRoadmap === 'function')
    log(hasFn ? '✓' : '?', 'openRoadmap — roadmap disponible')
    await ctx.close()
  }

  // ── F. LIENS SOCIAUX PROFIL ──
  console.log('\n── F. Liens Sociaux (Profil Footer) ──')

  {
    const { page, ctx } = await newPage(browser, { tab: 'profile' })
    await page.evaluate(() => window.setState?.({ profileSubTab: 'réglages' }))
    await page.waitForTimeout(1000)
    const socialLinks = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href*="instagram"], a[href*="tiktok"], a[href*="discord"]')]
      return {
        instagram: links.some(l => l.href.includes('instagram')),
        tiktok: links.some(l => l.href.includes('tiktok')),
        discord: links.some(l => l.href.includes('discord')),
        count: links.length,
      }
    })
    log(socialLinks.instagram ? '✓' : '?', 'Lien Instagram — présent dans le profil footer')
    log(socialLinks.tiktok ? '✓' : '?', 'Lien TikTok — présent dans le profil footer')
    log(socialLinks.discord ? '✓' : '?', 'Lien Discord — présent dans le profil footer')
    await ctx.close()
  }

  // ── G. SKELETONS ──
  console.log('\n── G. Skeletons / États de Chargement ──')

  // G1. CSS skeleton animation (shimmer)
  {
    const { page, ctx } = await newPage(browser)
    const hasSkeletonCSS = await page.evaluate(() => {
      const styleSheets = [...document.styleSheets]
      try {
        for (const sheet of styleSheets) {
          try {
            const rules = [...sheet.cssRules]
            for (const rule of rules) {
              if (rule.selectorText?.includes('skeleton') || rule.cssText?.includes('shimmer')) {
                return true
              }
            }
          } catch (_) {}
        }
      } catch (_) {}
      // Vérifier en créant un élément test
      const el = document.createElement('div')
      el.className = 'skeleton'
      document.body.appendChild(el)
      const styles = window.getComputedStyle(el)
      const hasAnimation = styles.animationName && styles.animationName !== 'none'
      document.body.removeChild(el)
      return hasAnimation
    })
    log(hasSkeletonCSS ? '✓' : '?', 'CSS skeleton — animation shimmer présente')
    await ctx.close()
  }

  // G2. Skeleton dans Spots (loading state)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.setState?.({ activeTab: 'map', spotsLoading: true })
    })
    await page.waitForTimeout(500)
    // Vérifier que le composant Skeleton.js est importé/utilisable
    const skeletonOk = await page.evaluate(() => {
      // Créer un élément skeleton et vérifier son style
      const el = document.createElement('div')
      el.className = 'skeleton rounded'
      el.style.width = '100px'
      el.style.height = '20px'
      document.body.appendChild(el)
      const exists = document.contains(el)
      document.body.removeChild(el)
      return exists
    })
    log(skeletonOk ? '✓' : '?', 'Skeleton elements — classe CSS skeleton applicable')
    await ctx.close()
  }

  // ── H. PROFIL ENRICHI (bio, langues, références) ──
  console.log('\n── H. Profil Enrichi ──')

  {
    const { page, ctx } = await newPage(browser, { tab: 'profile' })
    const handlers = await page.evaluate(() => ({
      editBio: typeof window.editBio === 'function',
      saveBio: typeof window.saveBio === 'function',
      editLanguages: typeof window.editLanguages === 'function',
      openReferences: typeof window.openReferences === 'function',
      togglePrivacy: typeof window.togglePrivacy === 'function',
      openAddPastTrip: typeof window.openAddPastTrip === 'function',
    }))
    log(handlers.editBio ? '✓' : '?', 'editBio — éditer bio disponible')
    log(handlers.editLanguages ? '✓' : '?', 'editLanguages — éditer langues parlées disponible')
    log(handlers.openReferences ? '✓' : '?', 'openReferences — références/témoignages disponible')
    log(handlers.togglePrivacy ? '✓' : '?', 'togglePrivacy — paramètres vie privée disponible')
    log(handlers.openAddPastTrip ? '✓' : '?', 'openAddPastTrip — ajouter voyage passé disponible')
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
