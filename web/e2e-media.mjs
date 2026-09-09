import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const stamp = Date.now().toString(36)
const userA = 'md_a_' + stamp
const userB = 'md_b_' + stamp
const pw = 'secret123'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const fail = (msg) => { throw new Error('E2E_FAIL: ' + msg) }
const log = (s) => console.log('[E2E] ' + s)

async function register(browser, username, nickname) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 760 })
  page.on('pageerror', (e) => console.log('[PAGEERR ' + nickname + '] ' + String(e).slice(0, 200)))
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.tabs', { timeout: 8000 })
  await page.evaluate(() => { document.querySelectorAll('.tabs button')[1].click() })
  await page.type('.field input[placeholder*="3-20"]', username)
  await page.type('.field input[placeholder="选填，默认同用户名"]', nickname)
  const pwds = await page.$$('.field input[type="password"]')
  await pwds[0].type(pw)
  await pwds[1].type(pw)
  await page.click('button.submit')
  await page.waitForFunction(() => document.body.innerText.includes('通讯录'), { timeout: 12000 })
  return { ctx, page }
}
async function tap(page, text) {
  const ok = await page.evaluate((txt) => {
    const els = Array.from(document.querySelectorAll('button, .item, .hit, .tabb, .entry, .mini'))
      .filter(e => e.textContent.includes(txt) && e.offsetParent !== null)
      .sort((a, b) => a.textContent.length - b.textContent.length)
    if (!els.length) return false
    els[0].click()
    return true
  }, text)
  if (!ok) fail('tap 找不到: ' + text)
  await sleep(450)
}
async function expectText(page, text, timeout = 10000) {
  try {
    await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text)
  } catch (e) {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 300))
    console.log('[WAIT_FAIL] 找 "' + text + '" 当前: ' + JSON.stringify(body))
    throw e
  }
}
const waitImg = (page, timeout = 15000) =>
  page.waitForSelector('.bubble img.media-img', { timeout })

const browser = await puppeteer.launch({
  executablePath: EXE, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
})
try {
  const A = await register(browser, userA, '图A')
  const B = await register(browser, userB, '图B')
  log('A/B 注册成功')

  // A 加 B；B 同意
  await tap(A.page, '通讯录')
  await A.page.type('input.search', userB)
  await sleep(900)
  await tap(A.page, '添加')
  await sleep(700)
  await tap(B.page, '通讯录')
  await tap(B.page, '新的朋友')
  await tap(B.page, '同意')
  await sleep(800)
  log('好友建立')

  // B 打开与 A 的会话
  await B.page.evaluate(() => { document.querySelectorAll('.mask .reqs-head button').forEach(b => b.click()) })
  await sleep(500)
  await tap(B.page, '图A')
  await sleep(600)
  await B.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
    if (el) el.click()
  })
  await sleep(1200)
  await expectText(B.page, '对话已开启')
  log('B 会话打开')

  // B 上传图片（真实 PNG 文件）
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  fs.writeFileSync('/tmp/qa-img.png', png)
  await B.page.evaluate(() => {
    const plus = Array.from(document.querySelectorAll('.plus-item')).find(b => b.textContent.includes('图片'))
    const openPlus = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '＋')
    if (openPlus) openPlus.click()
    if (plus) plus.click()
  })
  await sleep(500)
  const imgInput = await B.page.$('.chat-file[accept*="image"]')
  if (!imgInput) fail('找不到图片文件输入')
  await imgInput.uploadFile('/tmp/qa-img.png')
  await waitImg(B.page, 15000)
  log('B 图片气泡已显示')

  // A 实时收到图片
  await tap(A.page, '消息')
  await expectText(A.page, '图B', 12000)
  await tap(A.page, '图B')
  await waitImg(A.page, 15000)
  log('A 实时收到图片气泡')

  // A 点开灯箱预览
  await A.page.click('.bubble img.media-img')
  await A.page.waitForSelector('.lightbox img', { timeout: 5000 })
  log('灯箱预览 OK')
  await A.page.click('.lightbox')
  await sleep(300)

  // A 回复文本确认链路仍通
  await A.page.type('textarea.textin', '图片收到！')
  await A.page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await expectText(B.page, '图片收到！', 12000)
  log('回复文本实时到达')

  // B 刷新页面后图片仍在（服务端持久 + 可见性过滤）
  await B.page.reload({ waitUntil: 'networkidle0' })
  await sleep(1800)
  await tap(B.page, '消息')
  await tap(B.page, '图A')
  await waitImg(B.page, 15000)
  log('刷新后图片消息仍可加载')

  console.log('[E2E_RESULT] MEDIA_ALL_PASS')
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[E2E_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}