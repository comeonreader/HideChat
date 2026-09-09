import puppeteer from 'puppeteer-core'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const stamp = Date.now().toString(36)
const userA = 'lo_a_' + stamp
const userB = 'lo_b_' + stamp
const pw = 'secret123'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const fail = (m) => { throw new Error('E2E_FAIL: ' + m) }
const log = (s) => console.log('[E2E]', s)

async function register(browser, username, nickname, w, h) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: w, height: h })
  page.on('pageerror', (e) => console.log('[PAGEERR ' + nickname + '] ' + String(e).slice(0, 200)))
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.tabs', { timeout: 8000 })
  await page.evaluate(() => { document.querySelectorAll('.tabs button')[1].click() })
  await page.type('.field input[placeholder*="3-20"]', username)
  await page.type('.field input[placeholder="选填，默认同用户名"]', nickname)
  const pwds = await page.$$('.field input[type="password"]')
  await pwds[0].type(pw); await pwds[1].type(pw)
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
    els[0].click(); return true
  }, text)
  if (!ok) fail('tap 找不到: ' + text)
  await sleep(450)
}
async function expectText(page, text, timeout = 10000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text)
}
async function sendMsg(page, text) {
  await page.click('textarea.textin')
  await page.type('textarea.textin', text)
  await sleep(200)
  await page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await sleep(250)
}
async function barPos(page) {
  return page.evaluate(() => {
    const bar = document.querySelector('.input-bar')
    const msgs = document.querySelector('.msgs')
    if (!bar) return null
    const r = bar.getBoundingClientRect()
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), winH: window.innerHeight,
      msgsH: msgs ? Math.round(msgs.getBoundingClientRect().height) : -1,
      scrollY: Math.round(window.scrollY) }
  })
}
async function checkFixed(page, label) {
  const before = await barPos(page)
  for (let i = 1; i <= 6; i++) {
    await sendMsg(page, '第' + i + '条用于撑起聊天内容长度的消息，长度要足够让滚动区域产生滚动。' + '内容'.repeat(20))
  }
  await sleep(400)
  const after = await barPos(page)
  const beforeGap = before.winH - before.bottom
  const afterGap = after.winH - after.bottom
  log(label + ' 输入栏贴底距离: 前 gap=' + beforeGap + ' 后 gap=' + afterGap + ' (top ' + before.top + '->' + after.top + ', scrollY=' + after.scrollY + ')')
  if (Math.abs(beforeGap - afterGap) > 3) fail(label + ' 输入栏发生位移: gap ' + beforeGap + ' -> ' + afterGap)
  if (afterGap > 60) fail(label + ' 输入栏未贴底: gap=' + afterGap)
  return after
}

const browser = await puppeteer.launch({
  executablePath: EXE, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
})
try {
  // 桌面双用户
  const A = await register(browser, userA, '布A', 1180, 820)
  const B = await register(browser, userB, '布B', 1180, 820)
  // 好友：A 搜 B 添加，B 同意
  await tap(A.page, '通讯录')
  await A.page.type('input.search', userB)
  await sleep(900)
  await tap(A.page, '添加')
  await sleep(600)
  await tap(B.page, '通讯录')
  await tap(B.page, '新的朋友')
  await tap(B.page, '同意')
  await sleep(800)
  log('好友建立')
  // A 打开与 B 的会话
  await A.page.evaluate(() => { const s = document.querySelector('input.search'); if (s) { s.value=''; s.dispatchEvent(new Event('input')) } })
  await sleep(600)
  await tap(A.page, '布B')
  await sleep(500)
  const sheetOk = await A.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
    if (el) { el.click(); return true }
    return false
  })
  await sleep(1000)
  await expectText(A.page, '对话已开启')
  log('A 会话打开（桌面）')

  const desk = await checkFixed(A.page, '桌面')
  // 切手机视口（同一会话状态）
  await A.page.setViewport({ width: 390, height: 760 })
  await sleep(900)
  const mob = await checkFixed(A.page, '手机390')
  console.log('[E2E_RESULT] LAYOUT_ALL_PASS desktop_top=' + desk.top + ' mobile_top=' + mob.top)
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[E2E_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}
