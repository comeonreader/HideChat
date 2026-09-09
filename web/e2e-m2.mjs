import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const stamp = Date.now().toString(36)
const userA = 'qa_a_' + stamp
const userB = 'qa_b_' + stamp
const pw = 'secret123'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const fail = (msg) => { throw new Error('E2E_FAIL: ' + msg) }
const results = []
const log = (s) => { results.push(s); console.log('[E2E] ' + s) }

async function register(browser, username, nickname) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 760 })
  page.on('response', async (resp) => {
    const u = resp.url()
    if (u.includes('/api/')) {
      const p = u.replace('http://127.0.0.1:5173', '')
      console.log('[HTTP ' + nickname + '] ' + resp.status() + ' ' + resp.request().method() + ' ' + p)
    }
  })
  page.on('requestfailed', (req) => console.log('[REQFAIL ' + nickname + '] ' + req.url() + ' ' + (req.failure()?.errorText || '')))
  page.on('pageerror', (e) => console.log('[PAGEERR ' + nickname + '] ' + String(e).slice(0, 300)))
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
    console.log('[WAIT_FAIL] 找 "' + text + '" 当前页面: ' + JSON.stringify(body))
    throw e
  }
}

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
})

try {
  const A = await register(browser, userA, 'QA爱丽丝')
  log('A 注册成功')
  const B = await register(browser, userB, 'QA鲍勃')
  log('B 注册成功')

  await tap(A.page, '通讯录')
  await expectText(A.page, '新的朋友')
  await A.page.type('input.search', userB)
  await sleep(900)
  await expectText(A.page, 'QA鲍勃')
  await tap(A.page, '添加')
  await sleep(800)
  log('A 已发送好友申请')

  await tap(B.page, '通讯录')
  await sleep(600)
  const dotOk = await B.page.evaluate(() => !!document.querySelector('.entry .dot'))
  log('B 新朋友红点: ' + dotOk)
  await tap(B.page, '新的朋友')
  await expectText(B.page, 'QA爱丽丝')
  await tap(B.page, '同意')
  await sleep(900)
  log('B 已同意')

  await B.page.evaluate(() => { document.querySelectorAll('.mask .reqs-head button').forEach(b => b.click()) })
  await sleep(600)
  await tap(B.page, 'QA爱丽丝')
  await sleep(700)
  await B.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
    if (el) el.click()
  })
  await sleep(1500)
  log('B 尝试打开会话')
  await expectText(B.page, '对话已开启', 10000)

  await B.page.type('textarea.textin', '你好呀，这是实时消息测试 123')
  await B.page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await sleep(800)
  await expectText(B.page, '你好呀，这是实时消息测试 123', 8000)
  log('B 文本已上屏')

  await tap(A.page, '消息')
  await expectText(A.page, '你好呀，这是实时消息测试 123', 12000)
  log('A 实时收到 B 消息')

  await tap(A.page, 'QA鲍勃')
  await expectText(A.page, '回复后开始计时', 8000)
  log('A 查看后对方消息仍等待（未销毁）')

  // A 回复 → 自己刚发的消息立即开始倒计时（发送方计时）
  await A.page.click('textarea.textin')
  await A.page.type('textarea.textin', '好的，我来回复你')
  await sleep(300)
  const typedOk = await A.page.evaluate(() => {
    const ta = document.querySelector('textarea.textin')
    return !!ta && ta.value.length > 0
  })
  if (!typedOk) fail('输入未同步到输入框')
  await A.page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await expectText(A.page, '后销毁', 8000)
  log('A 发送方气泡显示销毁倒计时')

  // B 实时看到 A 的回复（双向）
  await expectText(B.page, '好的，我来回复你', 12000)
  log('双向实时收发 OK')

  await A.page.evaluate(() => { const b = document.querySelector('.back'); if (b) b.click() })
  await sleep(500)
  await tap(A.page, '我')
  await A.page.type('.nick-input', '爱丽丝新版')
  await tap(A.page, '保存')
  await sleep(900)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  fs.writeFileSync('/tmp/qa-avatar.png', png)
  const input = await A.page.$('.me input[type="file"]')
  if (!input) fail('找不到头像文件输入')
  await input.uploadFile('/tmp/qa-avatar.png')
  await sleep(1000)
  await A.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.crop-btns button')).find(b => b.textContent.includes('使用'))
    if (el) el.click()
  })
  await sleep(1800)
  const hasImg = await A.page.evaluate(() => !!document.querySelector('.me img'))
  if (!hasImg) fail('我的页面未显示头像图片')
  const nickOk = await A.page.evaluate(() => document.body.innerText.includes('爱丽丝新版'))
  if (!nickOk) fail('昵称未更新')
  log('头像上传 + 昵称修改 OK')

  await A.page.reload({ waitUntil: 'networkidle0' })
  await sleep(1500)
  const stillIn = await A.page.evaluate(() => document.body.innerText.includes('通讯录'))
  if (!stillIn) fail('刷新后掉登录')
  log('登录态持久化 OK')

  console.log('[E2E_RESULT] ALL_PASS steps=' + results.length)
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[E2E_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}