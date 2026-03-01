const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const DIR = 'audit-screenshots/light-full'

// All navigable tabs + sub-tabs + modals
const SCREENS = [
  // === TABS ===
  { name: '01-map', action: 'tab:0' },
  { name: '02-trip-itinerary', action: 'tab:1' },
  { name: '03-trip-guides', action: 'tab:1,subtab:1' },
  { name: '04-trip-journal', action: 'tab:1,subtab:2' },
  { name: '05-social-messages', action: 'tab:2' },
  { name: '06-social-events', action: 'tab:2,subtab:1' },
  { name: '07-profile', action: 'tab:3' },
  { name: '08-profile-comingsoon', action: 'tab:3,subtab:1' },
  { name: '09-profile-settings', action: 'tab:3,subtab:2' },

  // === MODALS ===
  { name: '10-auth', action: 'fn:openAuth' },
  { name: '11-addspot', action: 'fn:openAddSpot' },
  { name: '12-filters', action: 'fn:openFilters' },
  { name: '13-sos', action: 'fn:openSOS' },
  { name: '14-companion', action: 'fn:openCompanion' },
  { name: '15-badges', action: 'fn:openBadges' },
  { name: '16-shop', action: 'fn:openShop' },
  { name: '17-titles', action: 'fn:openTitles' },
  { name: '18-quiz', action: 'fn:openQuiz' },
  { name: '19-challenges', action: 'fn:openChallengesHub' },
  { name: '20-leaderboard', action: 'fn:openStats' },
  { name: '21-daily-reward', action: 'fn:openDailyReward' },
  { name: '22-faq', action: 'fn:openFAQ' },
  { name: '23-legal', action: 'fn:showLegal' },
  { name: '24-settings', action: 'fn:openSettings' },
  { name: '25-sidemenu', action: 'fn:openSideMenu' },
  { name: '26-feedback', action: 'fn:openFeedbackPanel' },
  { name: '27-roadmap', action: 'fn:openRoadmap' },
  { name: '28-changelog', action: 'fn:openChangelog' },
  { name: '29-helpcenter', action: 'fn:openHelpCenter' },
  { name: '30-editprofile', action: 'fn:openEditProfile' },
  { name: '31-profilecustom', action: 'fn:openProfileCustomization' },
  { name: '32-myrewards', action: 'fn:openMyRewards' },
  { name: '33-triphistory', action: 'fn:openTripHistory' },
  { name: '34-tripplanner', action: 'fn:openTripPlanner' },
  { name: '35-guides', action: 'fn:openGuides' },
  { name: '36-accessibility', action: 'fn:openAccessibilityHelp' },
  { name: '37-identity', action: 'fn:openIdentityVerification' },
  { name: '38-report', action: 'fn:openReport' },
  { name: '39-bugreport', action: 'fn:openBugReport' },
  { name: '40-contactform', action: 'fn:openContactForm' },
  { name: '41-travelgroups', action: 'fn:openTravelGroups' },
  { name: '42-nearbyfriends', action: 'fn:openNearbyFriends' },
  { name: '43-sharecard', action: 'fn:openShareCard' },
  { name: '44-navigation', action: 'fn:openNavigation' },
  { name: '45-rating', action: 'fn:openRating' },
  { name: '46-ageverif', action: 'fn:openAgeVerification' },
  { name: '47-comingsoon-identity', action: 'fn:openComingSoonIdentity' },
  { name: '48-comingsoon-radar', action: 'fn:openComingSoonRadar' },
  { name: '49-donation', action: 'fn:showDonation' },
  { name: '50-safety', action: 'fn:showSafety' },
  { name: '51-cookie-banner', action: 'cookie' },
]

;(async () => {
  fs.mkdirSync(DIR, { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()

  // Skip all popups + set light theme
  await page.addInitScript(() => {
    localStorage.setItem('spothitch_landing_seen', '1')
    localStorage.setItem('spothitch_onboarding_complete', '1')
    localStorage.setItem('spothitch_beta_seen', '1')
    localStorage.setItem('spothitch_cookie_consent', JSON.stringify({ essential: true, analytics: false, marketing: false }))
    localStorage.setItem('spothitch_theme', 'light')
    localStorage.setItem('spothitch_welcome_seen', '1')
    localStorage.setItem('spothitch_tutorial_complete', '1')
  })

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 })
  await page.evaluate(() => document.body.classList.add('light-theme'))
  await page.waitForTimeout(1500)

  // Dismiss cookie banner if visible
  const acceptBtn = await page.$('button:has-text("Accept"), button:has-text("Accepter")')
  if (acceptBtn) { try { await acceptBtn.click({ force: true }) } catch {} }
  await page.waitForTimeout(300)

  // Dismiss beta banner if visible
  const betaClose = await page.$('[class*="beta"] button, [class*="Beta"] button')
  if (betaClose) { try { await betaClose.click({ force: true }) } catch {} }
  await page.waitForTimeout(300)

  // Dismiss any "ASTUCE" / tip notification
  const tipDismiss = await page.$('button:has-text("OK, compris"), button:has-text("OK")')
  if (tipDismiss) { try { await tipDismiss.click({ force: true }) } catch {} }
  await page.waitForTimeout(300)

  let count = 0

  for (const screen of SCREENS) {
    try {
      // Reset to clean state: close modals + go back to map tab
      await page.keyboard.press('Escape')
      await page.waitForTimeout(150)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(150)
      // Click all visible X/close buttons to dismiss any stubborn panels
      const xBtns = await page.$$('button:has(svg), [aria-label="Close"], [aria-label="Fermer"]')
      for (const btn of xBtns) {
        const text = await btn.textContent().catch(() => '')
        if (text.includes('✕') || text.includes('×') || text.trim() === '') {
          const box = await btn.boundingBox().catch(() => null)
          // Only click X buttons in top-right area (close buttons)
          if (box && box.x > 300 && box.y < 80) {
            try { await btn.click({ force: true, timeout: 200 }) } catch {}
          }
        }
      }
      await page.waitForTimeout(150)
      // For modal screens, navigate to map first for clean state
      if (screen.action.startsWith('fn:') || screen.action === 'cookie') {
        const navBtns = await page.$$('nav[role="navigation"] button')
        if (navBtns[0]) {
          await navBtns[0].click({ force: true })
          await page.waitForTimeout(500)
        }
      }
      // Re-ensure light theme
      await page.evaluate(() => document.body.classList.add('light-theme'))

      if (screen.action.startsWith('tab:')) {
        // Navigate to tab + optional subtab
        const parts = screen.action.split(',')
        const tabIdx = parseInt(parts[0].split(':')[1])
        const navBtns = await page.$$('nav[role="navigation"] button')
        if (navBtns[tabIdx]) {
          await navBtns[tabIdx].click({ force: true })
          await page.waitForTimeout(800)
        }
        // Sub-tab if specified
        if (parts[1]) {
          const subIdx = parseInt(parts[1].split(':')[1])
          // Try clicking sub-tab buttons (usually in a flex container after the header)
          const subTabs = await page.$$('[role="tablist"] button, .flex.border-b button, header + div button, nav + div .flex button')
          if (subTabs.length === 0) {
            // Alternative: look for tab-like buttons in the content area
            const altTabs = await page.$$('button[role="tab"], [class*="sub-tab"] button, [class*="subtab"] button')
            if (altTabs[subIdx]) {
              await altTabs[subIdx].click({ force: true })
              await page.waitForTimeout(600)
            }
          } else if (subTabs[subIdx]) {
            await subTabs[subIdx].click({ force: true })
            await page.waitForTimeout(600)
          }
        }
      } else if (screen.action.startsWith('fn:')) {
        const fnName = screen.action.split(':')[1]
        await page.evaluate((fn) => {
          if (typeof window[fn] === 'function') window[fn]()
        }, fnName)
        await page.waitForTimeout(800)
      } else if (screen.action === 'cookie') {
        // Show cookie banner by clearing consent
        await page.evaluate(() => {
          localStorage.removeItem('spothitch_cookie_consent')
          if (typeof window.showCookieBanner === 'function') window.showCookieBanner()
          else location.reload()
        })
        await page.waitForTimeout(1500)
      }

      await page.screenshot({ path: path.join(DIR, screen.name + '.png'), fullPage: false })
      count++
      console.log(`✓ ${screen.name}`)
    } catch (err) {
      console.log(`✗ ${screen.name}: ${err.message.slice(0, 80)}`)
    }
  }

  await browser.close()
  console.log(`\nDone: ${count}/${SCREENS.length} screenshots`)
})()
