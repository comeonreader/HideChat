<template>
  <div class="login-wrap">
    <div class="brand">
      <div class="logo">清</div>
      <div class="title">清语 Qingyu</div>
      <div class="slogan">清简而谈 · 短暂消息自动销毁 · 服务器不留痕</div>
    </div>
    <div class="card">
      <div class="tabs">
        <button :class="{ on: mode === 'login' }" @click="mode = 'login'">登录</button>
        <button :class="{ on: mode === 'register' }" @click="mode = 'register'">注册</button>
      </div>
      <form @submit.prevent="submit">
        <label class="field">
          <span>用户名</span>
          <input v-model="username" maxlength="20" autocomplete="username" placeholder="3-20 位字母/数字/下划线" />
        </label>
        <label v-if="mode === 'register'" class="field">
          <span>昵称</span>
          <input v-model="nickname" maxlength="30" placeholder="选填，默认同用户名" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="password" type="password" maxlength="64" autocomplete="current-password" placeholder="6-64 位" />
        </label>
        <label v-if="mode === 'register'" class="field">
          <span>确认密码</span>
          <input v-model="password2" type="password" maxlength="64" autocomplete="new-password" placeholder="再次输入密码" />
        </label>
        <p v-if="err" class="err">{{ err }}</p>
        <label v-if="mode === 'login'" class="keep-row">
          <input v-model="keep" type="checkbox" />
          <span>保持登录（7 天内无需重新登录，到期后需再次登录）</span>
        </label>
        <button type="submit" class="submit" :disabled="busy">{{ mode === 'login' ? '登 录' : '注册并登录' }}</button>
      </form>
      <p class="note" v-if="mode === 'login'">登录状态最多保持 7 天；到期后需要重新登录。</p>
      <p class="note" v-else>注册无需验证码；发送的消息在对方回复后开始计时销毁。</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../stores/auth'

const auth = useAuth()
const mode = ref<'login' | 'register'>('login')
const username = ref('')
const nickname = ref('')
const password = ref('')
const password2 = ref('')
const keep = ref(true)
const err = ref('')
const busy = ref(false)

async function submit() {
  err.value = ''
  const u = username.value.trim()
  if (!u || !password.value) { err.value = '请填写用户名和密码'; return }
  if (mode.value === 'register' && password.value !== password2.value) {
    err.value = '两次输入的密码不一致'
    return
  }
  busy.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(u, password.value, keep.value)
    } else {
      await auth.register(u, password.value, nickname.value.trim())
    }
  } catch (e: any) {
    err.value = e.message || '操作失败'
  } finally {
    busy.value = false
  }
}
</script>
<style scoped>
.login-wrap { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: linear-gradient(180deg, #e8f5ee 0%, #f5f5f5 45%); padding: 20px 14px calc(30px + env(safe-area-inset-bottom)); gap: 26px; }
.brand { text-align: center; }
.logo { width: 84px; height: 84px; margin: 0 auto 14px; border-radius: 22px; background: var(--wx-green); color: #fff;
  font-size: 46px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 24px rgba(7,193,96,.35); }
.title { font-size: 22px; font-weight: 600; }
.slogan { color: #8a8a8a; font-size: 13px; margin-top: 6px; }
.card { width: min(94vw, 400px); background: #fff; border-radius: 14px; padding: 8px 20px 18px;
  box-shadow: 0 6px 30px rgba(0,0,0,.06); }
.tabs { display: flex; border-bottom: 1px solid #eee; margin-bottom: 14px; }
.tabs button { flex: 1; padding: 13px 0; font-size: 16px; color: #666; border-bottom: 2px solid transparent; }
.tabs button.on { color: var(--wx-green); border-bottom-color: var(--wx-green); font-weight: 600; }
.field { display: flex; flex-direction: column; gap: 6px; padding: 9px 0; }
.field span { font-size: 12px; color: #999; }
.field input { height: 40px; border-bottom: 1px solid #ececec; font-size: 16px; width: 100%; }
.field input:focus { border-bottom-color: var(--wx-green); }
.keep-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; color: #666; cursor: pointer; }
.keep-row input { width: 17px; height: 17px; accent-color: var(--wx-green); }
.err { color: var(--danger); font-size: 13px; margin: 8px 0 0; }
.submit { margin-top: 16px; width: 100%; height: 44px; border-radius: 22px; background: var(--wx-green);
  color: #fff; font-size: 16px; letter-spacing: 4px; }
.submit:disabled { opacity: .55; }
.note { color: #aaa; font-size: 12px; text-align: center; margin: 14px 0 0; }
</style>
