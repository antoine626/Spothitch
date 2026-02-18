import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

await page.goto('https://spothitch.com', { timeout: 60000 })
await page.waitForTimeout(8000)
await page.waitForFunction(() => typeof window.setState === 'function', { timeout: 15000 })
await page.evaluate(() => window.setState({ showLanding: false, showTutorial: false, showWelcome: false }))
await page.waitForTimeout(1000)

// Calculate trip
await page.evaluate(() => {
  window.openTripPlanner?.()
  window.setState({ tripFrom: 'Paris', tripTo: 'Lyon' })
  window.calculateTrip?.()
})
await page.waitForTimeout(15000)

// Scroll down in results
await page.evaluate(() => {
  const el = document.getElementById('main-content')
  if (el) el.scrollTop = 400
})
await page.waitForTimeout(500)
const scrollBefore = await page.evaluate(() => document.getElementById('main-content')?.scrollTop || 0)
console.log('Scroll before toggle:', scrollBefore)

await page.screenshot({ path: '/tmp/fix-01-before-toggle.png' })

// Toggle stations
await page.evaluate(() => window.toggleRouteAmenities?.())
await page.waitForTimeout(2000)

const scrollAfter = await page.evaluate(() => document.getElementById('main-content')?.scrollTop || 0)
console.log('Scroll after toggle:', scrollAfter, scrollBefore === scrollAfter ? '✅ PRESERVED!' : '⚠️ JUMPED')
await page.screenshot({ path: '/tmp/fix-02-after-toggle.png' })

// Check social tab (no trip bar)
await page.evaluate(() => window.setState({ activeTab: 'social', showTripPlanner: false }))
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/fix-03-social.png' })

// Check profile (no trip bar)
await page.evaluate(() => window.setState({ activeTab: 'profile' }))
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/fix-04-profile.png' })

// Check toast position
await page.evaluate(() => window.showToast?.('Test toast message', 'success'))
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/fix-05-toast.png' })

await browser.close()

console.log('Done!')
