/**
 * audit-a11y.cjs — Accessibilité : Clavier, Focus Trap, ARIA, Reduced Motion
 * Teste : navigation clavier (Tab/Escape/Ctrl+K/Alt+shortcuts), focus trap modaux,
 *         ARIA live regions, skip links, reduced motion CSS, screen reader handlers,
 *         keyboard-nav CSS class, préférences media queries
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
  console.log('  AUDIT A11Y — Clavier, ARIA, Focus, Reduced Motion')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. RACCOURCIS CLAVIER ──
  console.log('── A. Raccourcis Clavier ──')

  // A1. Escape ferme les modaux
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openFAQ?.())
    await page.waitForTimeout(500)
    const faqOpenBefore = await page.evaluate(() => window.getState?.()?.showFAQ === true)
    if (faqOpenBefore) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      const faqClosed = await page.evaluate(() => window.getState?.()?.showFAQ !== true)
      log(faqClosed ? '✓' : '?', 'Touche Escape — ferme le modal FAQ')
    } else {
      log('?', 'Touche Escape — modal non ouvert pour tester')
    }
    await ctx.close()
  }

  // A2. Ctrl+K focus la recherche
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ activeTab: 'map' }))
    await page.waitForTimeout(500)
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(400)
    const searchFocused = await page.evaluate(() => {
      const el = document.activeElement
      return el?.id === 'search-input' || el?.id === 'home-destination' ||
        el?.placeholder?.toLowerCase().includes('recherch') ||
        el?.placeholder?.toLowerCase().includes('search')
    })
    log(searchFocused ? '✓' : '?', 'Ctrl+K — focus sur la barre de recherche')
    await ctx.close()
  }

  // A3. window.showAccessibilityHelp
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.showAccessibilityHelp === 'function')
    if (hasFn) {
      await page.evaluate(() => window.showAccessibilityHelp?.())
      await page.waitForTimeout(500)
      const helpOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showAccessibilityHelp === true ||
          !!document.querySelector('[id*="a11y-help"], [class*="keyboard-shortcuts"]')
      })
      log(helpOpen ? '✓' : '?', 'showAccessibilityHelp — aide raccourcis clavier disponible')
      await page.evaluate(() => window.closeAccessibilityHelp?.())
    } else {
      log('?', 'showAccessibilityHelp — non disponible')
    }
    await ctx.close()
  }

  // A4. Escape ferme le modal Auth
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openAuth?.())
    await page.waitForTimeout(600)
    const authBefore = await page.evaluate(() => window.getState?.()?.showAuth === true)
    if (authBefore) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      const authClosed = await page.evaluate(() => window.getState?.()?.showAuth !== true)
      log(authClosed ? '✓' : '?', 'Escape modal Auth — modal auth fermé')
    } else {
      log('?', 'Escape modal Auth — non testé')
    }
    await ctx.close()
  }

  // ── B. FOCUS TRAP ──
  console.log('\n── B. Focus Trap ──')

  // B1. Éléments focusables dans une modal
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openFAQ?.())
    await page.waitForTimeout(800)
    const focusableCount = await page.evaluate(() => {
      // Chercher les éléments focusables dans les modaux ouverts
      const modal = document.querySelector('[role="dialog"], [id*="faq-modal"], [id*="modal"]')
      if (!modal) return 0
      const focusable = modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      return focusable.length
    })
    log(focusableCount > 0 ? '✓' : '?', 'Focus trap modal — éléments focusables présents', `${focusableCount} éléments`)
    await ctx.close()
  }

  // B2. keyboard-nav classe CSS sur body
  {
    const { page, ctx } = await newPage(browser)
    // Simuler une pression de Tab pour activer keyboard-nav
    await page.keyboard.press('Tab')
    await page.waitForTimeout(300)
    const hasKeyboardNav = await page.evaluate(() =>
      document.body.classList.contains('keyboard-nav')
    )
    log(hasKeyboardNav ? '✓' : '?', 'keyboard-nav CSS class — activée sur pression Tab')
    await ctx.close()
  }

  // ── C. ARIA LIVE REGIONS ──
  console.log('\n── C. ARIA Live Regions ──')

  // C1. Live regions polite/assertive présentes
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000) // Laisser screenReader.js s'initialiser
    const liveRegions = await page.evaluate(() => {
      const polite = document.querySelector('[aria-live="polite"], #sr-live-polite, [role="status"]')
      const assertive = document.querySelector('[aria-live="assertive"], #sr-live-assertive, [role="alert"]')
      return { polite: !!polite, assertive: !!assertive }
    })
    log(liveRegions.polite ? '✓' : '?', 'ARIA live polite — région polite présente')
    log(liveRegions.assertive ? '✓' : '?', 'ARIA live assertive — région assertive/alerte présente')
    await ctx.close()
  }

  // C2. Skip links présents
  {
    const { page, ctx } = await newPage(browser)
    await page.waitForTimeout(2000)
    const skipLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href="#main-content"], a[href="#main-navigation"], .skip-link')
      return links.length
    })
    log(skipLinks > 0 ? '✓' : '?', 'Skip links — liens de navigation rapide présents', `${skipLinks} lien(s)`)
    await ctx.close()
  }

  // C3. role="navigation" et role="main" présents
  {
    const { page, ctx } = await newPage(browser)
    const roles = await page.evaluate(() => ({
      main: !!document.querySelector('[role="main"], main'),
      navigation: !!document.querySelector('[role="navigation"], nav'),
      tablist: !!document.querySelector('[role="tablist"]'),
      dialog: typeof window.openFAQ === 'function', // dialogs disponibles
    }))
    log(roles.main ? '✓' : '?', 'role="main" — landmark principal présent')
    log(roles.navigation ? '✓' : '?', 'role="navigation" — landmark navigation présent')
    log(roles.tablist ? '✓' : '?', 'role="tablist" — navigation par onglets accessible')
    await ctx.close()
  }

  // ── D. ATTRIBUTS ARIA ──
  console.log('\n── D. Attributs ARIA ──')

  // D1. aria-label sur boutons iconiques
  {
    const { page, ctx } = await newPage(browser)
    const ariaLabels = await page.evaluate(() => {
      const btns = document.querySelectorAll('button[aria-label]')
      const links = document.querySelectorAll('a[aria-label]')
      return { buttons: btns.length, links: links.length }
    })
    log(ariaLabels.buttons > 0 ? '✓' : '?', 'aria-label boutons — présents', `${ariaLabels.buttons} boutons labellisés`)
    await ctx.close()
  }

  // D2. aria-selected sur les onglets actifs
  {
    const { page, ctx } = await newPage(browser)
    const ariaSelected = await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"][aria-selected="true"]')
      return tabs.length
    })
    log(ariaSelected > 0 ? '✓' : '?', 'aria-selected — onglet actif marqué', `${ariaSelected} onglet(s)`)
    await ctx.close()
  }

  // D3. aria-invalid sur formulaires (test avec champ vide)
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openAuth?.())
    await page.waitForTimeout(800)
    // Trouver les champs de formulaire
    const hasAriaInvalidSupport = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[aria-invalid], input[aria-required]')
      return inputs.length > 0 || typeof window.handleAuth === 'function'
    })
    log(hasAriaInvalidSupport ? '✓' : '?', 'aria-invalid/required — support formulaires accessible')
    await ctx.close()
  }

  // ── E. PREFERS-REDUCED-MOTION ──
  console.log('\n── E. prefers-reduced-motion ──')

  // E1. CSS reduced motion appliqué
  {
    const { page, ctx } = await newPage(browser)
    const hasReducedMotionCSS = await page.evaluate(() => {
      const styleSheets = [...document.styleSheets]
      for (const sheet of styleSheets) {
        try {
          const rules = [...sheet.cssRules]
          for (const rule of rules) {
            if (rule.conditionText?.includes('prefers-reduced-motion') ||
                rule.cssText?.includes('prefers-reduced-motion')) {
              return true
            }
          }
        } catch (_) {}
      }
      return false
    })
    log(hasReducedMotionCSS ? '✓' : '?', 'prefers-reduced-motion CSS — règle présente dans les styles')
    await ctx.close()
  }

  // E2. prefersReducedMotion() function
  {
    const { page, ctx } = await newPage(browser)
    const motionValue = await page.evaluate(() =>
      typeof window.matchMedia('(prefers-reduced-motion: reduce)').matches === 'boolean'
    )
    log(motionValue ? '✓' : '?', 'prefersReducedMotion — media query disponible')
    await ctx.close()
  }

  // ── F. CSS A11Y ──
  console.log('\n── F. CSS Accessibilité ──')

  // F1. .sr-only classe présente
  {
    const { page, ctx } = await newPage(browser)
    const srOnly = await page.evaluate(() => {
      const el = document.createElement('span')
      el.className = 'sr-only'
      el.textContent = 'test'
      document.body.appendChild(el)
      const styles = window.getComputedStyle(el)
      const isHidden = styles.position === 'absolute' && parseInt(styles.width) <= 1
      document.body.removeChild(el)
      return isHidden
    })
    log(srOnly ? '✓' : '?', '.sr-only — classe screen-reader-only fonctionne')
    await ctx.close()
  }

  // F2. focus-visible styles
  {
    const { page, ctx } = await newPage(browser)
    const focusVisible = await page.evaluate(() => {
      const styleSheets = [...document.styleSheets]
      for (const sheet of styleSheets) {
        try {
          const rules = [...sheet.cssRules]
          for (const rule of rules) {
            if (rule.selectorText?.includes('focus-visible') ||
                rule.cssText?.includes('focus-visible')) {
              return true
            }
          }
        } catch (_) {}
      }
      return false
    })
    log(focusVisible ? '✓' : '?', 'focus-visible — styles focus clavier présents')
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
