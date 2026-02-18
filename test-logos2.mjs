import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })

const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().substring(0, 200)) })
page.on('pageerror', err => errors.push(err.message.substring(0, 200)))

// Serve via dev server instead of file://
await page.goto('http://localhost:5173/logos.html', { timeout: 30000 }).catch(() => null)

// If dev server not running, try file:// with longer wait
if (!await page.evaluate(() => !!document.getElementById('grid')).catch(() => false)) {
  await page.goto('file:///home/antoine626/Spothitch/logos.html', { timeout: 15000 })
}

// Wait for images to generate (60s)
console.log('Waiting for images...')
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(10000)
  const p = await page.evaluate(() => document.getElementById('progress')?.textContent)
  console.log(`  ${(i+1)*10}s: ${p}`)
  if (p?.includes('30/30') || p?.includes('Termine')) break
}

await page.screenshot({ path: '/tmp/ss-logos-final.png', fullPage: true })

// Count successful images
const stats = await page.evaluate(() => {
  const cards = document.querySelectorAll('.card-img')
  let ok = 0, err = 0, loading = 0
  cards.forEach(c => {
    if (c.querySelector('img')) ok++
    else if (c.innerHTML.includes('Erreur')) err++
    else loading++
  })
  return { ok, err, loading, total: cards.length }
})
console.log('Stats:', JSON.stringify(stats))
console.log('Errors:', errors.slice(0, 5))

await browser.close()
