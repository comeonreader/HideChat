import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const BASE = 'http://127.0.0.1:5173'
const EXE = '/home/reader/HideChat/.e2e/chrome-headless-shell-linux64/chrome-headless-shell'
const stamp = Date.now().toString(36)
const userA = 'av_a_' + stamp
const userB = 'av_b_' + stamp
const pw = 'secret123'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const fail = (m) => { throw new Error('E2E_FAIL: ' + m) }
const log = (s) => console.log('[E2E]', s)
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

async function register(browser, username, nickname) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 1180, height: 820 })
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
  try { await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text) }
  catch (e) {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 300))
    console.log('[WAIT_FAIL] 找 "' + text + '" 当前: ' + JSON.stringify(body))
    throw e
  }
}
/** 断言页面上所有 .avatar img 均已成功解码（naturalWidth>0 且为圆角方形） */
async function avatarsOk(page, timeout = 12000) {
  return page.waitForFunction(() => {
    const avs = Array.from(document.querySelectorAll('.avatar'))
    if (!avs.length) return false
    for (const a of avs) {
      const img = a.querySelector('img')
      const cs = getComputedStyle(a)
      const rect = a.getBoundingClientRect()
      const r = parseFloat(cs.borderRadius)
      if (!img || !img.complete || img.naturalWidth === 0) return false
      if (!(r > 0)) return false
      // 防 512px 原图撑破布局（v1.2.1 回归护栏）
      if (rect.width > 120 || rect.height > 120) return false
    }
    return true
  }, { timeout })
}
async function uploadAvatar(page, filePath) {
  await tap(page, '我')
  await page.waitForSelector('.me input[type="file"]', { timeout: 8000 })
  const input = await page.$('.me input[type="file"]')
  await input.uploadFile(filePath)
  await sleep(900)
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.crop-btns button')).find(b => b.textContent.includes('使用'))
    if (el) el.click()
  })
  await sleep(2200)
}

const browser = await puppeteer.launch({
  executablePath: EXE, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
})
try {
  fs.writeFileSync('/tmp/av1.png', PNG1)
  const A = await register(browser, userA, '头A')
  const B = await register(browser, userB, '头B')
  log('注册成功')

  // A/B 各自上传头像
  await uploadAvatar(A.page, '/tmp/av1.png')
  await expectText(A.page, '头像已更新')
  await avatarsOk(A.page)
  log('A 上传后：我页头像加载正常(圆角方形)')

  const uidA = await A.page.evaluate(async () => {
    const r = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + localStorage.getItem('hidechat.token') } })
    return (await r.json()).id
  })
  const aVer1 = await A.page.evaluate(() => {
    const img = document.querySelector('.me img')
    return img ? img.src.split('v=')[1] : null
  })
  log('A 头像 version=' + aVer1)

  // 左上角昵称旁头像
  await tap(A.page, '消息')
  const chipOk = await A.page.evaluate(() => {
    const img = document.querySelector('.me-chip img')
    return !!img && img.complete && img.naturalWidth > 0
  })
  if (!chipOk) fail('左上角 me-chip 头像未显示')
  log('左上角昵称旁头像 OK')

  // B 也上传
  await uploadAvatar(B.page, '/tmp/av1.png')
  await expectText(B.page, '头像已更新')
  await avatarsOk(B.page)
  log('B 上传后我页 OK')

  // B 申请加 A（A 的"新的朋友"展示 B 头像）
  await tap(B.page, '通讯录')
  await B.page.type('input.search', userA)
  await sleep(900)
  await tap(B.page, '添加')
  await sleep(700)
  await tap(A.page, '通讯录')
  await tap(A.page, '新的朋友')
  await expectText(A.page, '头B')
  await avatarsOk(A.page)
  log('新的朋友页：申请人头像 OK')
  await tap(A.page, '同意')
  await sleep(900)

  // B 给 A 发消息 → A 消息列表头像 & 打开会话双方气泡头像
  await B.page.evaluate(() => { document.querySelectorAll('.mask .reqs-head button').forEach(b => b.click()) })
  // 清空 B 通讯录的旧搜索词，回到好友列表
  await B.page.evaluate(() => {
    const inp = document.querySelector('input.search')
    if (inp) {
      inp.value = ''
      inp.dispatchEvent(new Event('input'))
    }
  })
  await sleep(600)
  let opened = false
  for (let attempt = 0; attempt < 3 && !opened; attempt++) {
    await tap(B.page, '头A').catch(() => {})
    await sleep(600)
    const sheet = await B.page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.sheet .btn')).find(b => b.textContent.includes('发消息'))
      if (el) { el.click(); return true }
      return false
    })
    if (!sheet) console.log('[DIAG] sheet 未出现 attempt=' + attempt)
    await sleep(900)
    opened = await B.page.evaluate(() => !!document.querySelector('textarea.textin'))
    if (!opened) console.log('[DIAG] 会话未打开 attempt=' + attempt)
  }
  if (!opened) fail('无法打开与头A的会话')
  await B.page.click('textarea.textin')
  await B.page.type('textarea.textin', '头像检查消息')
  await B.page.evaluate(() => {
    const send = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '发送')
    if (send) send.click()
  })
  await sleep(800)
  // 聊天页 mine/them 头像都在
  await avatarsOk(B.page)
  log('B 聊天页双方头像 OK')

  await tap(A.page, '消息')
  await expectText(A.page, '头像检查消息', 12000)
  await avatarsOk(A.page)
  log('A 消息列表头像 OK')
  await tap(A.page, '头B')
  await expectText(A.page, '头像检查消息', 8000)
  await avatarsOk(A.page)
  log('A 聊天页双方头像 OK')

  // A 更换头像 → 自己界面即时更新；B 端好友资料同步（profile_updated）显示新版本
  await tap(A.page, '我')
  const input = await A.page.$('.me input[type="file"]')
  await input.uploadFile('/tmp/av1.png')
  await sleep(900)
  await A.page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.crop-btns button')).find(b => b.textContent.includes('使用'))
    if (el) el.click()
  })
  await sleep(2200)
  const aVer2 = await A.page.evaluate(() => {
    const img = document.querySelector('.me img')
    return img ? img.src.split('v=')[1] : null
  })
  if (!(aVer2 !== aVer1 && aVer2 > aVer1)) fail('更换头像版本号未递增: v' + aVer1 + ' -> v' + aVer2)
  log('A 更换头像 version 递增 v' + aVer2)

  // B 端会话/资料同步到新版本
  const bSeesV2 = await B.page.waitForFunction((v) => {
    const imgs = Array.from(document.querySelectorAll('.avatar img, .htitle img, .bubble-wrap img'))
    return imgs.some(i => i.src.includes('v=' + v) && i.complete && i.naturalWidth > 0)
  }, { timeout: 10000 }, aVer2)
  if (!bSeesV2) fail('B 端未同步 A 的新头像版本')
  log('B 端实时同步新头像版本 OK')

  console.log('[E2E_RESULT] AVATAR_ALL_PASS')
  await browser.close()
  process.exit(0)
} catch (e) {
  console.error('[E2E_FAIL]', e.message)
  try { await browser.close() } catch {}
  process.exit(1)
}
