import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })

const errors = []
page.on('console', msg => { 
  if (msg.type() === 'error') errors.push(msg.text().substring(0, 200))
})
page.on('pageerror', err => errors.push(err.message.substring(0, 200)))

// Simple test page for Puter.js
await page.setContent(`
<html><body>
<div id="result">Loading...</div>
<script src="https://js.puter.com/v2/"></script>
<script>
setTimeout(async () => {
  try {
    const img = await puter.ai.txt2img("logo thumb up hand amber gold", { model: "dall-e-3" });
    document.body.appendChild(img);
    document.getElementById('result').textContent = 'SUCCESS: ' + img.tagName + ' ' + img.src?.substring(0, 80);
  } catch(e) {
    document.getElementById('result').textContent = 'ERROR: ' + e.message;
  }
}, 3000);
</script>
</body></html>
`, { waitUntil: 'networkidle' })

await page.waitForTimeout(30000)
const result = await page.evaluate(() => document.getElementById('result')?.textContent)
console.log('Puter result:', result)
console.log('Errors:', errors.slice(0, 3))

await browser.close()
