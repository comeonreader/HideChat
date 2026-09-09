import puppeteer from 'puppeteer-core'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const stamp = Date.now().toString(36)
const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 1180, height: 820 })
await page.goto(BASE, { waitUntil: 'networkidle0' })
await page.evaluate(() => { document.querySelectorAll('.tabs button')[1].click() })
await page.type('.field input[placeholder*="3-20"]', 'bg_' + stamp)
await page.type('.field input[placeholder="选填，默认同用户名"]', '大元素定位')
const pwds = await page.$$('.field input[type="password"]')
await pwds[0].type('secret123'); await pwds[1].type('secret123')
await page.click('button.submit')
await page.waitForFunction(() => document.body.innerText.includes('通讯录'), { timeout: 12000 })
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(e => e.textContent.trim() === '我'); if (b) b.click() })
await sleep(500)
const input = await page.$('.me input[type="file"]')
await input.uploadFile('/tmp/shots/av.png')
await sleep(1000)
await page.evaluate(() => { const el = Array.from(document.querySelectorAll('.crop-btns button')).find(b => b.textContent.includes('使用')); if (el) el.click() })
await sleep(2500)
const probe = await page.evaluate(() => {
  const big = Array.from(document.querySelectorAll('.avatar')).filter(a => a.getBoundingClientRect().width > 200)
  return big.map(a => {
    const chain = []
    let n = a
    while (n && chain.length < 6) { chain.push(n.className.toString().slice(0, 60) + '<' + n.tagName); n = n.parentElement }
    return { chain, html: a.outerHTML.slice(0, 220) }
  })
})
console.log(JSON.stringify(probe, null, 1).slice(0, 1600))
await browser.close()
process.exit(0)
