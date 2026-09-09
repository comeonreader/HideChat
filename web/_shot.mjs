import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const stamp = Date.now().toString(36)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
fs.mkdirSync('/tmp/shots', { recursive: true })
fs.writeFileSync('/tmp/shots/av.png', PNG)
const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
try {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 1180, height: 820 })
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.tabs', { timeout: 8000 })
  await page.evaluate(() => { document.querySelectorAll('.tabs button')[1].click() })
  await page.type('.field input[placeholder*="3-20"]', 'shot_' + stamp)
  await page.type('.field input[placeholder="选填，默认同用户名"]', '清语用户')
  const pwds = await page.$$('.field input[type="password"]')
  await pwds[0].type('secret123'); await pwds[1].type('secret123')
  await page.click('button.submit')
  await page.waitForFunction(() => document.body.innerText.includes('通讯录'), { timeout: 12000 })
  await sleep(800)
  // 1) 上传前：消息 tab + 右侧占位
  await page.screenshot({ path: '/tmp/shots/01-before-chats.png' })
  // 上传头像
  await page.evaluate(() => { const els = Array.from(document.querySelectorAll('button, .tabb')); const b = els.find(e => e.textContent.trim() === '我'); if (b) b.click() })
  await sleep(600)
  await page.screenshot({ path: '/tmp/shots/02-me-before-upload.png' })
  const input = await page.$('.me input[type="file"]')
  await input.uploadFile('/tmp/shots/av.png')
  await sleep(1000)
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.crop-btns button')).find(b => b.textContent.includes('使用'))
    if (el) el.click()
  })
  await sleep(2500)
  await page.screenshot({ path: '/tmp/shots/03-me-after-upload.png' })
  // 消息 tab（左侧列表+右侧占位）
  await page.evaluate(() => { const els = Array.from(document.querySelectorAll('.tabs button')); const b = els.find(e => e.textContent.includes('消息')); if (b) b.click() })
  await sleep(600)
  await page.screenshot({ path: '/tmp/shots/04-chats-after.png' })
  // 通讯录
  await page.evaluate(() => { const els = Array.from(document.querySelectorAll('.tabs button')); const b = els.find(e => e.textContent.includes('通讯录')); if (b) b.click() })
  await sleep(600)
  await page.screenshot({ path: '/tmp/shots/05-contacts-after.png' })
  console.log('[SHOT_DONE]')
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[SHOT_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}
