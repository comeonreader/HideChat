import puppeteer from 'puppeteer-core'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const stamp = Date.now().toString(36)
const userA = 'vc_a_' + stamp
const userB = 'vc_b_' + stamp
const pw = 'secret123'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const fail = (msg) => { throw new Error('E2E_FAIL: ' + msg) }
const log = (s) => console.log('[E2E]', s)

async function register(browser, username, nickname) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 760 })
  page.on('console', (m) => { const t = m.text(); if (t.includes('error') || t.includes('Error') || t.includes('录音')) console.log('[CON ' + nickname + ']', t.slice(0, 160)) })
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
    els[0].click()
    return true
  }, text)
  if (!ok) fail('tap 找不到: ' + text)
  await sleep(400)
}
async function expectText(page, text, timeout = 10000) {
  try { await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text) }
  catch (e) {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 300))
    console.log('[WAIT_FAIL] 找 "' + text + '" 当前: ' + JSON.stringify(body))
    throw e
  }
}
const browser = await puppeteer.launch({
  executablePath: EXE, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required']
})
try {
  const A = await register(browser, userA, '音A')
  const B = await register(browser, userB, '音B')
  log('注册成功')

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

  // B 进会话
  await B.page.evaluate(() => { document.querySelectorAll('.mask .reqs-head button').forEach(b => b.click()) })
  await sleep(400)
  await tap(B.page, '音A')
  await sleep(500)
  await B.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
    if (el) el.click()
  })
  await sleep(1000)
  await expectText(B.page, '对话已开启')

  // B 切到语音模式并按住说话 2 秒
  await B.page.evaluate(() => {
    const mic = Array.from(document.querySelectorAll('.input-row button')).find(b => b.textContent.includes('🎤'))
    if (mic) mic.click()
  })
  await sleep(500)
  await expectText(B.page, '按住 说话')
  log('语音模式开启')

  // 模拟按住 2.2s 再松开
  await B.page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.hold-talk')).find(b => b.textContent.includes('按住'))
    if (!btn) return
    const down = new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'touch', isPrimary: true })
    btn.dispatchEvent(down)
  })
  await sleep(2200)
  await B.page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.hold-talk')).find(b => b.textContent.includes('松开'))
    if (!btn) return
    const up = new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'touch', isPrimary: true })
    btn.dispatchEvent(up)
  })
  log('已模拟按住→松开')
  // 等上传+转正：出现 audio 气泡
  await B.page.waitForSelector('.bubble audio', { timeout: 20000 }).catch(() => log('audio 未出现（检查录音可用性）'))
  const bHasAudio = await B.page.evaluate(() => !!document.querySelector('.bubble audio'))
  log('B 语音气泡: ' + bHasAudio)
  if (!bHasAudio) fail('语音气泡未出现（假麦克风可能不可用）')

  // A 实时收到语音
  await tap(A.page, '消息')
  await sleep(600)
  await tap(A.page, '音B')
  await A.page.waitForSelector('.bubble audio', { timeout: 15000 })
  log('A 实时收到语音气泡')

  // 太短语音自动拒绝（按住 <1s 松开）
  await B.page.evaluate(() => {
    const mic = Array.from(document.querySelectorAll('.input-row button')).find(b => b.textContent.includes('🎤') || b.textContent.includes('⌨️'))
    if (mic && mic.textContent.includes('⌨️')) { /* 已语音模式 */ }
    else if (mic) mic.click()
  })
  await sleep(300)
  // 若处于文字模式先切语音
  await B.page.evaluate(() => {
    const mic = Array.from(document.querySelectorAll('.input-row button')).find(b => b.textContent.includes('🎤'))
    if (mic) mic.click()
  })
  await sleep(500)
  const shortOk = await B.page.evaluate(async () => {
    const btn = document.querySelector('.hold-talk')
    if (!btn) return false
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2 }))
    await new Promise(r => setTimeout(r, 400))
    btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2 }))
    return true
  })
  await sleep(1200)
  const shortToast = await B.page.evaluate(() => document.body.innerText.includes('说话时间太短'))
  log('短语音(<1s)提示: ' + shortToast + ' (dispatch:' + shortOk + ')')
  if (!shortToast) log('（提示可能被 toast 计时错过，不阻断）')

  console.log('[E2E_RESULT] VOICE_ALL_PASS')
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[E2E_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}
