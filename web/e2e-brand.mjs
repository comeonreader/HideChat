import puppeteer from 'puppeteer-core'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const fail = (m) => { throw new Error('E2E_FAIL: ' + m) }
const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 760 })
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  const loginText = await page.evaluate(() => document.body.innerText)
  if (!loginText.includes('清语 Qingyu')) fail('登录页未显示品牌名')
  if (!loginText.includes('保持登录')) fail('登录页缺保持登录勾选文案')
  if (!loginText.includes('7 天')) fail('登录页缺 7 天提示')
  const stamp = Date.now().toString(36)
  await page.evaluate(() => { document.querySelectorAll('.tabs button')[1].click() })
  await page.type('.field input[placeholder*="3-20"]', 'brand_' + stamp)
  await page.type('.field input[placeholder="选填，默认同用户名"]', '品牌测试')
  const pwds = await page.$$('.field input[type="password"]')
  await pwds[0].type('secret123'); await pwds[1].type('secret123')
  await page.click('button.submit')
  await page.waitForFunction(() => document.body.innerText.includes('通讯录'), { timeout: 12000 })
  // 我页 about
  await page.evaluate(() => { const els = Array.from(document.querySelectorAll('button, .tabb')); const b = els.find(e => e.textContent.includes('我')); if (b) b.click() })
  await sleep(800)
  const meText = await page.evaluate(() => document.body.innerText)
  if (!meText.includes('清语 Qingyu')) fail('我页关于行未显示 清语 Qingyu')
  console.log('[E2E_RESULT] BRAND_ALL_PASS')
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[E2E_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}
