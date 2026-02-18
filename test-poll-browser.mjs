import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()

// Test Pollinations directly in browser
const result = await page.evaluate(async () => {
  const url = 'https://image.pollinations.ai/prompt/logo%20with%20thumb%20up%20hand?width=256&height=256&seed=42&nologo=true'
  try {
    const res = await fetch(url)
    return { status: res.status, type: res.headers.get('content-type'), size: (await res.blob()).size }
  } catch(e) {
    return { error: e.message }
  }
})
console.log('Pollinations via browser:', JSON.stringify(result))

// Test loading image directly
await page.setContent('<img id="test" src="https://image.pollinations.ai/prompt/minimal%20logo%20amber%20gold%20thumb%20up?width=256&height=256&seed=7&nologo=true">')
await page.waitForTimeout(30000)
const imgLoaded = await page.evaluate(() => {
  const img = document.getElementById('test')
  return { width: img.naturalWidth, height: img.naturalHeight, complete: img.complete }
})
console.log('Image loaded:', JSON.stringify(imgLoaded))

await browser.close()
