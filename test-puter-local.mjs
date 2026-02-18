import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()

const logs = []
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text().substring(0, 150)}`))

await page.goto('http://localhost:8888/logos.html', { timeout: 30000 })
await page.waitForTimeout(5000)

// Check initial state
const init = await page.evaluate(() => ({
  progress: document.getElementById('progress')?.textContent,
  puterExists: typeof window.puter !== 'undefined',
}))
console.log('Init:', JSON.stringify(init))

// Wait up to 120s
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(10000)
  const stats = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card-img')
    let ok = 0, err = 0, loading = 0
    cards.forEach(c => {
      if (c.querySelector('img[src]')) ok++
      else if (c.innerHTML.includes('Erreur')) err++
      else loading++
    })
    return { ok, err, loading, progress: document.getElementById('progress')?.textContent }
  })
  console.log(`${(i+1)*10}s:`, JSON.stringify(stats))
  if (stats.loading === 0) break
}

// Screenshot
await page.screenshot({ path: '/tmp/ss-logos-localhost.png', fullPage: true })

console.log('\nLogs:')
logs.filter(l => l.includes('error') || l.includes('Error') || l.includes('401') || l.includes('puter')).slice(0, 10).forEach(l => console.log(' ', l))

await browser.close()
