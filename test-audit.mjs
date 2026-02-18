import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

await page.goto('https://spothitch.com', { timeout: 60000 })
await page.waitForTimeout(8000)
await page.waitForFunction(() => typeof window.setState === 'function', { timeout: 15000 })
await page.evaluate(() => window.setState({ showLanding: false, showTutorial: false, showWelcome: false }))
await page.waitForTimeout(1000)

// 1. Home/Map view
await page.screenshot({ path: '/tmp/audit-01-home.png' })

// 2. Trip planner
await page.evaluate(() => window.openTripPlanner?.())
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/audit-02-planner.png' })

// 3. Calculate trip
await page.evaluate(() => {
  window.setState({ tripFrom: 'Paris', tripTo: 'Lyon' })
  window.calculateTrip?.()
})
await page.waitForTimeout(15000)
await page.screenshot({ path: '/tmp/audit-03-results.png' })

// 4. Scroll down results
await page.evaluate(() => {
  const el = document.querySelector('[class*="overflow-y"]') || document.querySelector('main')
  if (el) el.scrollTop = 500
})
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/audit-04-results-scroll.png' })

// 5. Record scroll position, then toggle stations
const scrollBefore = await page.evaluate(() => {
  const el = document.querySelector('[class*="overflow-y"]') || document.scrollingElement
  return el?.scrollTop || 0
})
console.log('Scroll before toggle:', scrollBefore)

await page.evaluate(() => window.toggleRouteAmenities?.())
await page.waitForTimeout(2000)

const scrollAfter = await page.evaluate(() => {
  const el = document.querySelector('[class*="overflow-y"]') || document.scrollingElement
  return el?.scrollTop || 0
})
console.log('Scroll after toggle:', scrollAfter, scrollBefore !== scrollAfter ? '⚠️ SCROLL JUMPED!' : '✅ OK')
await page.screenshot({ path: '/tmp/audit-05-after-toggle.png' })

// 6. View trip map
await page.evaluate(() => window.viewTripOnMap?.())
await page.waitForTimeout(5000)
await page.screenshot({ path: '/tmp/audit-06-tripmap.png' })

// Wait for stations to load
await page.waitForTimeout(35000)
await page.screenshot({ path: '/tmp/audit-07-tripmap-stations.png' })

// 7. Go back to travel panel
await page.evaluate(() => window.setState({ showTripMap: false }))
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/audit-08-back-results.png' })

// 8. Navigation tabs
await page.evaluate(() => window.setState({ activeTab: 'social', showTripPlanner: false }))
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/audit-09-social.png' })

await page.evaluate(() => window.setState({ activeTab: 'guides' }))
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/audit-10-guides.png' })

await page.evaluate(() => window.setState({ activeTab: 'profile' }))
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/audit-11-profile.png' })

// 9. Check the render function for scroll issues
const renderInfo = await page.evaluate(() => {
  // Check if setState causes innerHTML replacement
  const app = document.getElementById('app')
  return {
    appExists: !!app,
    childCount: app?.children?.length || 0,
    scrollHeight: document.scrollingElement?.scrollHeight,
    hasOverflowContainer: !!document.querySelector('[class*="overflow-y-auto"]'),
  }
})
console.log('Render info:', JSON.stringify(renderInfo))

await browser.close()
console.log('Done!')
