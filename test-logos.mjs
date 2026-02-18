import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })

const errors = []
page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`[${msg.type()}] ${msg.text()}`) })
page.on('pageerror', err => errors.push(`[PAGE_ERROR] ${err.message}`))

await page.goto('file:///home/antoine626/Spothitch/logos.html', { timeout: 30000 })
await page.waitForTimeout(10000)
await page.screenshot({ path: '/tmp/ss-logos-test.png' })

const progress = await page.evaluate(() => document.getElementById('progress')?.textContent)
console.log('Progress:', progress)

const firstImg = await page.evaluate(() => {
  const container = document.getElementById('img-0')
  return container?.innerHTML?.substring(0, 300)
})
console.log('First card:', firstImg)

console.log('\nErrors:')
errors.forEach(e => console.log(' ', e))

await browser.close()
