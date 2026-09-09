import puppeteer from 'puppeteer-core'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const stamp = Date.now().toString(36)
const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
const ctx = await browser.createBrowserContext()
const page = await ctx.newPage()
await page.setViewport({ width: 1180, height: 820 })
page.on('pageerror', e => console.log('[PAGEERR]', String(e).slice(0, 200)))
await page.goto(BASE, { waitUntil: 'networkidle0' })
await page.evaluate(() => { document.querySelectorAll('.tabs button')[1].click() })
await page.type('.field input[placeholder*="3-20"]', 'chk_' + stamp)
await page.type('.field input[placeholder="选填，默认同用户名"]', '界面检查')
const pwds = await page.$$('.field input[type="password"]')
await pwds[0].type('secret123'); await pwds[1].type('secret123')
await page.click('button.submit')
await page.waitForFunction(() => document.body.innerText.includes('通讯录'), { timeout: 12000 })
await sleep(700)

async function audit(label) {
  const info = await page.evaluate(() => {
    const out = { label: '', pl: null, avatars: [], overlays: [], hScroll: null, body: '' }
    const pl = document.querySelector('.pl-logo')
    out.pl = pl ? { text: pl.textContent.trim(), cls: pl.className, tag: pl.tagName } : null
    out.avatars = Array.from(document.querySelectorAll('.avatar')).map(a => {
      const r = a.getBoundingClientRect()
      const img = a.querySelector('img')
      const cs = getComputedStyle(a)
      return {
        rect: [Math.round(r.width), Math.round(r.height)],
        radius: cs.borderRadius,
        hasImg: !!img,
        imgOk: img ? (img.complete && img.naturalWidth > 0) : null,
        src: img ? img.src.replace('http://127.0.0.1:5173', '') : null,
        text: !img ? a.textContent.trim().slice(0, 2) : null
      }
    })
    out.overlays = Array.from(document.querySelectorAll('.mask, .record-mask, .lightbox, .crop-box')).map(m => ({
      cls: m.className, visible: m.offsetParent !== null
    })).filter(o => o.visible)
    out.hScroll = { sw: document.documentElement.scrollWidth, iw: window.innerWidth }
    out.bodySnippet = document.body.innerText.slice(0, 90).replace(/\n/g, '|')
    return out
  })
  info.label = label
  console.log(JSON.stringify(info))
}
await audit('消息tab-未上传')
// 上传头像
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(e => e.textContent.trim() === '我'); if (b) b.click() })
await sleep(500)
const input = await page.$('.me input[type="file"]')
await input.uploadFile('/tmp/shots/av.png')
await sleep(1000)
await page.evaluate(() => { const el = Array.from(document.querySelectorAll('.crop-btns button')).find(b => b.textContent.includes('使用')); if (el) el.click() })
await sleep(2500)
await audit('我-上传后')
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.tabs button')).find(e => e.textContent.includes('消息')); if (b) b.click() })
await sleep(600)
await audit('消息tab-上传后')
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.tabs button')).find(e => e.textContent.includes('通讯录')); if (b) b.click() })
await sleep(600)
await audit('通讯录tab-上传后')
await browser.close()
process.exit(0)
