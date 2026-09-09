<template>
  <div class="contacts">
    <div class="search-box">
      <span class="s-icon">🔍</span>
      <input v-model="q" class="search" placeholder="搜索用户名 / 昵称" @input="debouncedSearch" />
    </div>
    <div class="list">
      <div class="entry new-friends" @click="showRequests = true">
        <div class="nf-avatar">👋</div>
        <span>新的朋友</span>
        <span v-if="data.requests.length" class="dot">{{ data.requests.length }}</span>
        <span class="arrow">›</span>
      </div>
      <template v-if="q">
        <div v-if="!hits.length && searched" class="hit-empty">未找到用户</div>
        <div v-for="h in hits" :key="h.user.id" class="hit" @click="hitClick(h)">
          <Avatar :u="h.user" :size="40" />
          <div class="hit-info"><div class="hit-name">{{ h.user.nickname }}</div><div class="hit-uname">{{ h.user.username }}</div></div>
          <button class="mini" :class="{ ghost: h.relation === 'friend' }" :disabled="h.relation === 'friend' || busy === h.user.id"
            @click.stop="addHit(h)">
            {{ h.relation === 'friend' ? '已是好友' : '添加' }}
          </button>
        </div>
      </template>
      <template v-else>
        <div v-if="!data.friends.length" class="hit-empty">还没有好友，搜索用户名添加吧</div>
        <div v-for="f in sorted" :key="f.id" class="hit" @click="friendSheet = f">
          <Avatar :u="f" :size="40" />
          <div class="hit-info"><div class="hit-name">{{ f.nickname }}</div><div class="hit-uname">{{ f.username }}</div></div>
        </div>
      </template>
    </div>

    <div v-if="showRequests" class="mask" @click.self="showRequests = false">
      <div class="reqs">
        <div class="reqs-head">新的朋友 <button @click="showRequests = false">✕</button></div>
        <div v-if="!data.requests.length" class="reqs-empty">暂无新的好友申请</div>
        <div v-for="r in data.requests" :key="r.id" class="req">
          <Avatar :u="r.from" :size="40" />
          <div class="req-info">
            <div class="req-name">{{ r.from.nickname }}<span class="req-uname">（{{ r.from.username }}）</span></div>
            <div v-if="r.message" class="req-msg">{{ r.message }}</div>
          </div>
          <button class="mini accept" @click="accept(r)">同意</button>
          <button class="mini" @click="reject(r)">拒绝</button>
        </div>
      </div>
    </div>

    <PersonSheet v-if="friendSheet" :user="friendSheet" relation="friend" @close="friendSheet = null"
      @open-chat="doOpenChat" @changed="refreshAll" />
    <PersonSheet v-if="strangerHit" :user="strangerHit" :relation="strangerRel" @close="strangerHit = null" @changed="refreshAll" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from './Avatar.vue'
import PersonSheet from './PersonSheet.vue'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { useData } from '../stores/data'
import { useAuth } from '../stores/auth'
import { socket } from '../lib/socket'
import type { SearchHit, UserDto } from '../types'

const emit = defineEmits<{ (e: 'open-conv', friend: UserDto): void }>()
const data = useData()
const auth = useAuth()
const q = ref('')
const hits = ref<SearchHit[]>([])
const searched = ref(false)
const busy = ref<number | null>(null)
const showRequests = ref(false)
const friendSheet = ref<UserDto | null>(null)
const strangerHit = ref<UserDto | null>(null)
const strangerRel = ref<'stranger' | 'requested'>('stranger')

const sorted = computed(() => [...data.friends].sort((a, b) => a.nickname.localeCompare(b.nickname, 'zh')))

let timer: number | null = null
function debouncedSearch() {
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(doSearch, 350)
}
async function doSearch() {
  const query = q.value.trim()
  if (!query) { hits.value = []; searched.value = false; return }
  try {
    hits.value = await api.get<SearchHit[]>('/api/users/search?q=' + encodeURIComponent(query))
    searched.value = true
  } catch { hits.value = []; searched.value = false }
}
async function addHit(h: SearchHit) {
  if (h.relation === 'friend' || busy.value === h.user.id) return
  busy.value = h.user.id
  try {
    await api.post('/api/friend-requests', { to_user_id: h.user.id })
    toast('申请已发送，等待对方同意')
    await doSearch()
  } catch (e: any) {
    if (e.code === 'ALREADY_FRIEND') {
      h.relation = 'friend'
    } else {
      toast(e.message || '操作失败', 'err')
    }
  } finally { busy.value = null }
}
function hitClick(h: SearchHit) {
  if (h.relation === 'friend') {
    friendSheet.value = h.user
  } else {
    strangerHit.value = h.user
    strangerRel.value = h.relation === 'requested' ? 'requested' : 'stranger'
  }
}
function openChatWith(f: UserDto) {
  emit('open-conv', f)
}
function doOpenChat() {
  const f = friendSheet.value
  friendSheet.value = null
  if (f) emit('open-conv', f)
}
function refreshAll() {
  // 触发一次全量刷新
  data.init().then(() => { data.refreshConvs() }).catch(() => { })
  if (q.value) doSearch()
}
async function accept(r: any) {
  try {
    await api.post('/api/friend-requests/' + r.id + '/accept')
    toast('已添加好友')
    refreshAll()
  } catch (e: any) { toast(e.message, 'err') }
}
async function reject(r: any) {
  try {
    await api.post('/api/friend-requests/' + r.id + '/reject')
    refreshAll()
  } catch (e: any) { toast(e.message, 'err') }
}
void socket; void auth
</script>
<style scoped>
.contacts { display: flex; flex-direction: column; background: #fff; height: 100%; min-height: 0; }
.search-box { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 6px; }
.search { flex: 1; background: #f4f4f4; border-radius: 6px; height: 34px; padding: 0 10px; font-size: 14px; }
.list { flex: 1; overflow-y: auto; }
.entry { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid #f2f2f2; cursor: pointer; font-size: 15px; }
.nf-avatar { width: 40px; height: 40px; background: #ffd54f; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 21px; }
.dot { margin-left: auto; background: var(--danger); color: #fff; border-radius: 9px; font-size: 11px; padding: 1px 6px; }
.arrow { color: #bbb; font-size: 18px; margin-left: 6px; }
.hit { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #f2f2f2; cursor: pointer; }
.hit:active { background: #f5f5f5; }
.hit-info { flex: 1; min-width: 0; }
.hit-name { font-size: 16px; }
.hit-uname { font-size: 12px; color: #aaa; }
.mini { background: var(--wx-green); color: #fff; border-radius: 5px; font-size: 13px; padding: 6px 13px; }
.mini.ghost { background: #f0f0f0; color: #999; }
.mini.accept { margin-left: auto; }
.mini:disabled { opacity: .6; }
.hit-empty { text-align: center; color: #aaa; padding: 30px 0; font-size: 13px; }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 900; display: flex; align-items: flex-end; justify-content: center; }
.reqs { width: min(96vw, 440px); background: #fff; border-radius: 14px 14px 0 0; max-height: 70vh; display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom); }
.reqs-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #eee; }
.req { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid #f2f2f2; }
.req-info { flex: 1; min-width: 0; }
.req-name { font-size: 15px; }
.req-uname { font-size: 12px; color: #aaa; }
.req-msg { font-size: 12px; color: #888; margin-top: 2px; }
.reqs-empty { text-align: center; color: #aaa; padding: 30px; font-size: 13px; }
</style>