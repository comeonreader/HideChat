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
function log(step) { results.push(step); console.log('[E2E]', step) }

async function register(browser, username, nickname) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 760 })
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
    const sel = 'button, .item, .hit, .tabb, .entry, .send, .mini'
    const el = Array.from(document.querySelectorAll(sel)).find(e => e.textContent.includes(txt))
    if (el) { el.click(); return true }
    return false
  }, text)
  if (!ok) fail('tap 找不到: ' + text)
  await sleep(400)
}

async function expectText(page, text, timeout = 10000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text)
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

  // A 搜索并申请加 B
  await tap(A.page, '通讯录')
  await expectText(A.page, '新的朋友')
  await A.page.type('input.search', userB)
  await sleep(900)
  await expectText(A.page, 'QA鲍勃')
  await tap(A.page, '添加')
  log('A 已发送好友申请')

  // B 同意
  await tap(B.page, '通讯录')
  await tap(B.page, '新的朋友')
  await expectText(B.page, 'QA爱丽丝')
  await tap(B.page, '同意')
  await sleep(700)
  log('B 已同意')

  // B 关闭申请面板 → 通讯录点好友 → 发消息
  await B.page.evaluate(() => { document.querySelectorAll('.mask .reqs-head button').forEach(b => b.click()) })
  await sleep(400)
  await tap(B.page, 'QA爱丽丝')
  await sleep(500)
  await B.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
    if (el) el.click()
  })
  await sleep(900)
  await expectText(B.page, '发消息给')
  await B.page.type('textarea.textin', '你好呀，这是实时消息测试 123')
  await B.page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await sleep(700)
  await expectText(B.page, '你好呀，这是实时消息测试 123')
  log('B 文本已上屏')

  // A 实时收到（A 在通讯录页，会话列表后台刷新）
  await tap(A.page, '消息')
  await expectText(A.page, '你好呀，这是实时消息测试 123', 12000)
  log('A 实时收到 B 消息且会话出现')

  // A 打开会话 → 倒计时标签
  await tap(A.page, 'QA鲍勃')
  await expectText(A.page, '后销毁')
  log('A 气泡显示销毁倒计时')

  // A 回复 → B 实时收到
  await A.page.type('textarea.textin', '收到收到，20 分钟后销毁')
  await A.page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await expectText(B.page, '收到收到，20 分钟后销毁', 12000)
  log('双向实时收发 OK')

  // 头像上传（A）
  await A.page.evaluate(() => { const b = document.querySelector('.back'); if (b) b.click() })
  await sleep(400)
  await tap(A.page, '我')
  await A.page.type('.nick-input', '爱丽丝新版')
  await tap(A.page, '保存')
  await sleep(700)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  fs.writeFileSync('/tmp/qa-avatar.png', png)
  const input = await A.page.$('.me input[type="file"]')
  await input.uploadFile('/tmp/qa-avatar.png')
  await sleep(900)
  await A.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.crop-btns button')).find(b => b.textContent.includes('使用'))
    if (el) el.click()
  })
  await sleep(1500)
  const hasImg = await A.page.evaluate(() => !!document.querySelector('.me img'))
  if (!hasImg) fail('我的页面未显示头像图片')
  const nickOk = await A.page.evaluate(() => document.body.innerText.includes('爱丽丝新版'))
  if (!nickOk) fail('昵称未更新')
  log('头像上传 + 昵称修改 OK')

  // 注销冒烟：刷新后仍保持登录（token 持久化）
  await A.page.reload({ waitUntil: 'networkidle0' })
  await sleep(800)
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
