<template>
  <div class="app">
    <LoginView v-if="!auth.loggedIn" />
    <template v-else>
      <div class="shell" :class="{ narrow: narrow }">
        <aside v-if="!narrow" class="side">
          <div class="me-chip" @click="tab = 'me'">
            <Avatar :u="auth.user" :size="30" />
            <span class="chip-name">{{ auth.user?.nickname }}</span>
          </div>
          <div class="tabs">
            <button :class="{ on: tab === 'chats' }" @click="switchTab('chats')">消息<em v-if="totalUnread" class="badge">{{ totalUnread }}</em></button>
            <button :class="{ on: tab === 'contacts' }" @click="switchTab('contacts')">通讯录<em v-if="data.requests.length" class="dot"></em></button>
            <button :class="{ on: tab === 'me' }" @click="switchTab('me')">我</button>
          </div>
          <div class="side-body">
            <ConversationList v-if="tab === 'chats'" :convs="data.convs" :active-id="activeConv?.id ?? null" @open="openConv" />
            <ContactsPanel v-else-if="tab === 'contacts'" ref="contactsRef" @open-conv="openChatWithFriend" />
            <MePanel v-else />
          </div>
        </aside>

        <main class="main" :class="{ 'chat-only': narrow && activeConv }">
          <template v-if="narrow">
            <div v-if="!activeConv" class="mobile-nav-wrap">
              <div class="mnav-head">
                <button class="tabb" :class="{ on: tab === 'chats' }" @click="switchTab('chats')">消息<em v-if="totalUnread" class="badge">{{ totalUnread }}</em></button>
                <button class="tabb" :class="{ on: tab === 'contacts' }" @click="switchTab('contacts')">通讯录<em v-if="data.requests.length" class="dot"></em></button>
                <button class="tabb" :class="{ on: tab === 'me' }" @click="switchTab('me')">我</button>
              </div>
              <div class="mobile-body">
                <ConversationList v-if="tab === 'chats'" :convs="data.convs" :active-id="activeConv?.id ?? null" @open="openConv" />
                <ContactsPanel v-else-if="tab === 'contacts'" @open-conv="openChatWithFriend" />
                <MePanel v-else />
              </div>
            </div>
            <ChatWindow v-if="activeConv" :conv="activeConv" :narrow="true" @close="activeConv = null" @changed="data.refreshConvs" />
          </template>
          <template v-else>
            <ChatWindow v-if="activeConv" :conv="activeConv" :narrow="false" @close="activeConv = null" @changed="data.refreshConvs" />
            <div v-else class="placeholder">
              <img src="/icon.svg" class="pl-logo" alt="清语" />
              <p>选择左侧会话开始聊天</p>
              <p class="pl-sub">清简而谈 · 短暂消息自动销毁 · 服务器不留痕</p>
            </div>
          </template>
        </main>

        <nav v-if="narrow && !activeConv" class="bottom-nav">
          <button :class="{ on: tab === 'chats' }" @click="switchTab('chats')">💬 消息</button>
          <button :class="{ on: tab === 'contacts' }" @click="switchTab('contacts')">👥 通讯录</button>
          <button :class="{ on: tab === 'me' }" @click="switchTab('me')">👤 我</button>
        </nav>
      </div>
    </template>
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuth } from './stores/auth'
import { useData, wireSocket, startExpiryTicker } from './stores/data'
import { socket } from './lib/socket'
import { api } from './lib/api'
import { toast } from './lib/toast'
import LoginView from './views/LoginView.vue'
import ToastHost from './components/ToastHost.vue'
import Avatar from './components/Avatar.vue'
import ConversationList from './components/ConversationList.vue'
import ContactsPanel from './components/ContactsPanel.vue'
import ChatWindow from './components/ChatWindow.vue'
import MePanel from './components/MePanel.vue'
import type { ConvItem, UserDto } from './types'

const auth = useAuth()
const data = useData()
const tab = ref<'chats' | 'contacts' | 'me'>('chats')
const activeConv = ref<ConvItem | null>(null)
const narrow = ref(false)
const contactsRef = ref<InstanceType<typeof ContactsPanel> | null>(null)

const totalUnread = computed(() => data.convs.reduce((s, c) => s + (c.unread || 0), 0))

function onResize() {
  narrow.value = window.innerWidth < 768
}
function switchTab(t: 'chats' | 'contacts' | 'me') {
  tab.value = t
}

function openConv(c: ConvItem) {
  activeConv.value = c
}
async function openChatWithFriend(friend: UserDto) {
  try {
    const r = await api.get<{ id: number }>('/api/conv-with/' + friend.id)
    const exist = data.findConvById(r.id)
    const conv: ConvItem = exist ?? { id: r.id, friend, last_msg: null, unread: 0, last_msg_at: null }
    if (!exist) data.convs.push(conv)
    activeConv.value = conv
  } catch (e: any) {
    toast(e.message || '无法开始会话', 'err')
  }
}

function handleWsError(m: any) {
  const code = m.code || ''
  if (code === 'UNAUTHENTICATED' || code === 'BAD_TOKEN' || code === 'TOKEN_STALE') {
    logoutFlow()
    return
  }
  toast(m.message || '操作失败', 'err')
}

function logoutFlow() {
  socket.stop()
  auth.logout()
  data.$reset()
  activeConv.value = null
  tab.value = 'chats'
}
function onLogoutRequest() { logoutFlow() }

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  window.addEventListener('hc-logout', onLogoutRequest)
  socket.on('error', handleWsError)
  wireSocket()
  startExpiryTicker()
  auth.reloadMe().catch(() => { /* 无 token 或已失效 */ })
})

// 登录态驱动实时链路：登录/刷新后自动连接并同步
watch(
  () => auth.loggedIn,
  (v) => {
    if (v && auth.token) {
      socket.onStatus = (up) => { data.connected = up }
      socket.start(auth.token)
      data.init().catch(() => { /* auth_ok 后 init 兜底 */ })
    } else {
      socket.stop()
      data.connected = false
    }
  },
  { immediate: true }
)
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('hc-logout', onLogoutRequest)
})
</script>

<style scoped>
.app { height: 100%; }
.shell { height: 100dvh; display: flex; background: #f2f2f2; overflow: hidden; }
.shell.narrow { flex-direction: column; }
.side { width: 330px; max-width: 40vw; display: flex; flex-direction: column; background: #f7f7f7; border-right: 1px solid #dcdcdc; flex-shrink: 0; }
.me-chip { display: flex; align-items: center; gap: 8px; padding: 10px 14px; }
.chip-name { font-weight: 600; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tabs { display: flex; margin: 0 10px 6px; background: #ececec; border-radius: 6px; overflow: hidden; position: relative; }
.tabs button { flex: 1; padding: 7px 0; font-size: 14px; color: #555; position: relative; }
.tabs button.on { background: #fff; color: #191919; font-weight: 600; }
.badge { position: absolute; right: 8px; top: 4px; background: var(--danger); color: #fff; font-size: 10px; border-radius: 8px; min-width: 16px; height: 16px; line-height: 16px; padding: 0 4px; font-style: normal; }
.dot { position: absolute; right: 6px; top: 5px; width: 8px; height: 8px; border-radius: 50%; background: var(--danger); }
.side-body { flex: 1; min-height: 0; display: flex; }
.side-body > * { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.main { flex: 1; min-width: 0; min-height: 0; background: var(--wx-bg); display: flex; flex-direction: column; }
.main > .chat, .main > .placeholder { flex: 1; min-height: 0; }
.mobile-nav-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.mnav-head { display: flex; background: #f7f7f7; border-bottom: 1px solid #e2e2e2; }
.tabb { flex: 1; padding: 12px 0 8px; font-size: 15px; position: relative; color: #444; }
.tabb.on { color: var(--wx-green); font-weight: 600; }
.mobile-body { flex: 1; min-height: 0; }
.bottom-nav { display: flex; border-top: 1px solid #dcdcdc; background: #fafafa; padding-bottom: env(safe-area-inset-bottom); }
.bottom-nav button { flex: 1; padding: 8px 0 6px; font-size: 11px; color: #666; }
.bottom-nav button.on { color: var(--wx-green); }
.placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; }
.pl-logo { width: 84px; height: 84px; border-radius: 20px; margin-bottom: 16px; display: block; box-shadow: 0 10px 24px rgba(7,193,96,.25); }
.pl-sub { font-size: 12px; margin-top: 6px; }
</style>