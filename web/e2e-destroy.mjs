import puppeteer from 'puppeteer-core'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const stamp = Date.now().toString(36)
const userA = 'va_a_' + stamp
const userB = 'va_b_' + stamp
const pw = 'secret123'
const M1 = '销毁消息A发送方到期'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const fail = (m) => { throw new Error('E2E_FAIL: ' + m) }
const log = (s) => console.log('[E2E]', s, new Date().toISOString().slice(11, 19))

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
  await sleep(400)
}
async function expectText(page, text, timeout = 10000) {
  try { await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text) }
  catch (e) {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 260))
    console.log('[WAIT_FAIL] 找 "' + text + '" 当前: ' + JSON.stringify(body))
    throw e
  }
}
async function waitGone(page, text, timeout) {
  try { await page.waitForFunction((t) => !document.body.innerText.includes(t), { timeout }, text) }
  catch (e) {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 260))
    console.log('[WAIT_GONE_FAIL] "' + text + '" 仍在: ' + JSON.stringify(body))
    throw e
  }
}
async function sendText(page, text) {
  await page.click('textarea.textin')
  await page.type('textarea.textin', text)
  await sleep(250)
  await page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await sleep(600)
}

const browser = await puppeteer.launch({
  executablePath: EXE, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
})
try {
  const A = await register(browser, userA, '灭A')
  const B = await register(browser, userB, '灭B')
  log('A/B 注册')

  // A 搜 B 加；B 同意
  await tap(A.page, '通讯录')
  await A.page.type('input.search', userB)
  await sleep(900)
  await tap(A.page, '添加')
  await sleep(600)
  await tap(B.page, '通讯录')
  await tap(B.page, '新的朋友')
  await tap(B.page, '同意')
  await sleep(700)
  log('好友建立')

  // B 清搜索并从通讯录进 A 会话（保持不回复）
  await B.page.evaluate(() => { const s = document.querySelector('input.search'); if (s) { s.value=''; s.dispatchEvent(new Event('input')) } })
  await sleep(500)
  await tap(B.page, '灭A')
  await sleep(500)
  await B.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
    if (el) el.click()
  })
  await sleep(900)
  await expectText(B.page, '对话已开启')
  await B.page.evaluate(() => { const b = document.querySelector('.back'); if (b) b.click() })
  await sleep(400)
  log('B 会话就绪并退出（保持未读未回复）')

  // A 打开会话并发消息
  await A.page.evaluate(() => { const s = document.querySelector('input.search'); if (s) { s.value=''; s.dispatchEvent(new Event('input')) } })
  await sleep(400)
  await tap(A.page, '通讯录')
  await tap(A.page, '灭B')
  await sleep(500)
  await A.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
    if (el) el.click()
  })
  await sleep(1000)
  await sendText(A.page, M1)
  await expectText(A.page, M1)
  log('A 已发送（发送方计时开始 T+0）')

  // 1) 发送方 60s 后自己不可见
  await waitGone(A.page, M1, 110000)
  log('发送方视角消息已消失')

  // 2) B 未读等待：重载可见
  await B.page.reload({ waitUntil: 'networkidle0' })
  await sleep(2000)
  await tap(B.page, '消息')
  await expectText(B.page, M1, 10000)
  log('B 未读等待：消息仍在列表')

  // 3) B 打开只查看：不销毁，显示"回复后开始计时"
  await tap(B.page, '灭A')
  await expectText(B.page, M1, 10000)
  await expectText(B.page, '回复后开始计时', 8000)
  log('B 打开查看（未回复）：显示等待提示')

  // 4) 等待 65s 不回复：消息必须仍在（关键语义：查看≠计时）
  await sleep(65000)
  const stillThere = await B.page.evaluate((t) => document.body.innerText.includes(t), M1)
  if (!stillThere) fail('未回复时消息被提前销毁！')
  log('65s 后未回复，消息仍在（未激活不销毁）')

  // 5) B 回复 → 激活 → 60s 后 B 侧销毁
  await sendText(B.page, 'r1-我回复了激活计时')
  await expectText(B.page, 'r1-我回复了激活计时', 8000)
  log('B 已回复（激活开始，T_act）')
  await waitGone(B.page, M1, 110000)
  log('激活后 B 侧消息已销毁')

  // 6) 刷新核查：UI 无残留；服务端 m1 行已删；r1 仍在等待 A 回复
  await B.page.reload({ waitUntil: 'networkidle0' })
  await sleep(2000)
  const clean = await B.page.evaluate((t) => !document.body.innerText.includes(t), M1)
  if (!clean) fail('刷新后 B 端仍残留 m1')
  const api = await A.page.evaluate(async (m1) => {
    const token = localStorage.getItem('hidechat.token')
    const convs = await (await fetch('/api/conversations', { headers: { Authorization: 'Bearer ' + token } })).json()
    if (!convs.length) return { conv: null }
    const list = await (await fetch('/api/conversations/' + convs[0].id + '/messages?limit=100', { headers: { Authorization: 'Bearer ' + token } })).json()
    return { hasM1: list.some(m => (m.text || '').includes(m1)), texts: list.map(m => m.text).filter(Boolean) }
  }, M1)
  log('服务端核查: hasM1=' + api.hasM1 + ' 剩余消息=' + JSON.stringify(api.texts))
  if (api.hasM1) fail('服务端 m1 未物理删除')
  if (!api.texts.some(t => t.includes('r1-我回复了激活计时'))) fail('r1 应仍等待 A 回复（未激活不删）')

  // 7) A 已在会话页 → 直接回复 → r1 激活（删除链路由集成测试覆盖）
  await expectText(A.page, 'r1-我回复了激活计时', 8000)
  await sendText(A.page, 'a1-回应激活')
  const act = await A.page.evaluate(async () => {
    const token = localStorage.getItem('hidechat.token')
    const convs = await (await fetch('/api/conversations', { headers: { Authorization: 'Bearer ' + token } })).json()
    const list = await (await fetch('/api/conversations/' + convs[0].id + '/messages?limit=100', { headers: { Authorization: 'Bearer ' + token } })).json()
    const r1 = list.find(m => (m.text || '').includes('r1-我回复了激活计时'))
    return r1 ? { activated: r1.activated_at != null } : { activated: false }
  })
  log('A 回复后 r1 激活状态: ' + JSON.stringify(act))
  if (!act.activated) fail('回复后对方消息未被激活')

  console.log('[E2E_RESULT] DESTROY_V12_ALL_PASS')
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[E2E_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}
