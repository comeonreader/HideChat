<template>
  <div class="chat">
    <div class="head">
      <button v-if="narrow" class="back" @click="emit('close')">‹</button>
      <div class="htitle" @click="showFriend = true">
        <Avatar :u="conv.friend" :size="30" />
        <span class="hname">{{ conv.friend.nickname }}</span>
      </div>
      <button class="more" @click="showFriend = true">···</button>
    </div>
    <div ref="scroller" class="msgs">
      <div v-if="!items.length" class="welcome">
        <p>你和 {{ conv.friend.nickname }} 的对话已开启</p>
        <p class="tip">所有消息在 {{ data.ttlMinutes }} 分钟后自动销毁（对方未读时一直等待）</p>
      </div>
      <template v-for="item in items" :key="item.key">
        <div class="row" :class="item.side">
          <Avatar :u="item.side === 'me' ? auth.user : conv.friend" :size="38" />
          <div class="bubble-wrap">
            <div class="bubble" :class="[item.side, item.msg.kind === 5 ? 'sys' : '']" @click="onBubbleClick(item)">
              <template v-if="item.msg.kind === 5">{{ item.msg.recalled ? '对方撤回了一条消息' : '[系统消息]' }}</template>
              <template v-else-if="item.msg.kind === 1">{{ item.msg.text }}</template>
              <template v-else-if="(item.msg.kind === 2 || item.msg.kind === 3) && item.msg.media">
                <MediaBubble :msg="item.msg" @preview="lightbox = $event" />
              </template>
              <template v-else-if="item.msg.kind === 4 && item.msg.media">
                <MediaBubble :msg="item.msg" @preview="lightbox = $event" />
              </template>
              <template v-else>{{ sendingLabel(item) }}</template>
            </div>
            <div class="meta">
              <span v-if="item.msg.kind !== 5 && item.expirySecs !== null" class="cd" :class="{ hot: item.expirySecs <= 30 }">
                {{ fmtCountdown(item.expirySecs) }} 后销毁
              </span>
              <span v-else-if="item.side === 'them' && item.msg.kind !== 5" class="wait-tip">回复后开始计时</span>
              <span class="tm">{{ fmtClock(item.msg.send_at) }}</span>
              <span v-if="item.side === 'me'" class="ticks" :class="{ read: item.read }">
                <template v-if="item.local && item.local.status === 'sending'">…</template>
                <template v-else-if="item.read">✓✓</template>
                <template v-else-if="item.delivered">✓✓</template>
                <template v-else>✓</template>
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div v-if="lightbox" class="lightbox" @click="lightbox = ''">
      <img :src="lightbox" alt="预览" />
    </div>
    <div v-if="menuMsg" class="ctx" @click.self="menuMsg = null">
      <div class="ctx-box">
        <div class="ctx-title">{{ menuMsg.side === 'me' ? '你' : conv.friend.nickname }}的消息</div>
        <div class="ctx-item" v-if="menuMsg!.msg.kind === 1" @click="copyText">复制</div>
        <div class="ctx-item danger" v-if="menuMsg && canRecall(menuMsg)" @click="recall(menuMsg)">撤回</div>
        <div class="ctx-item" @click="menuMsg = null">取消</div>
      </div>
    </div>
    <div class="input-bar">
      <div v-if="showPlus" class="plus-row">
        <button class="plus-item" @click="imgInput!.click()">🖼 图片</button>
        <button class="plus-item" @click="vidInput!.click()">🎬 视频</button>
        <button class="plus-item" @click="showVoice = true; showPlus = false">🎤 语音</button>
      </div>
      <div v-if="recording" class="record-mask">
        <div class="record-panel" :class="{ cancel: willCancel }">
          <div class="r-icon">{{ willCancel ? '🗑' : '🎙' }}</div>
          <div class="r-text">{{ willCancel ? '松开取消' : '正在录音…' }}</div>
          <div class="r-time">{{ Math.floor(recordSecs) }}s / 60s</div>
        </div>
      </div>
      <div class="input-row">
        <button v-if="!recording && !showVoice" class="icon-btn" @click="showVoice = true">🎤</button>
        <button v-if="showVoice && !recording" class="icon-btn voice-close" @click="showVoice = false">⌨️</button>
        <textarea v-if="!showVoice" v-model="text" rows="1" class="textin" :placeholder="'发消息给 ' + conv.friend.nickname"
          @keydown.enter.prevent="onEnter" @input="autoGrow" ref="ta" />
        <button v-if="showVoice" class="hold-talk"
          @pointerdown="beginRecord" @pointerup="endRecord" @pointercancel="cancelRecord" @pointerleave="onLeave">
          {{ recording ? '松开 发送' : '按住 说话' }}
        </button>
        <button class="icon-btn plus" @click="showPlus = !showPlus">＋</button>
        <button v-if="text.trim()" class="send" @click="sendText">发送</button>
      </div>
    </div>
    <input ref="imgInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden chat-file" @change="onImagePicked" />
    <input ref="vidInput" type="file" accept="video/mp4,video/webm" class="hidden chat-file" @change="onVideoPicked" />
    <PersonSheet v-if="showFriend" :user="conv.friend" relation="friend" @close="showFriend = false" @open-chat="onOpenChatFromSheet" @changed="emit('changed')" />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Avatar from './Avatar.vue'
import PersonSheet from './PersonSheet.vue'
import MediaBubble from './MediaBubble.vue'
import { fmtClock, fmtCountdown } from '../lib/time'
import { toast } from '../lib/toast'
import { socket } from '../lib/socket'
import { compressImage, uploadFile } from '../lib/media'
import { useAuth } from '../stores/auth'
import { useData, type LocalMsg } from '../stores/data'
import type { ChatMsg, ConvItem } from '../types'

const props = defineProps<{ conv: ConvItem; narrow: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'changed'): void }>()
const data = useData()
const auth = useAuth()
const text = ref('')
const showPlus = ref(false)
const showFriend = ref(false)
const scroller = ref<HTMLDivElement | null>(null)
const ta = ref<HTMLTextAreaElement | null>(null)
const imgInput = ref<HTMLInputElement | null>(null)
const vidInput = ref<HTMLInputElement | null>(null)
const menuMsg = ref<ItemView | null>(null)
const lightbox = ref('')

interface ItemView {
  key: string
  side: 'me' | 'them'
  msg: ChatMsg
  read: boolean
  delivered: boolean
  expirySecs: number | null
  local: LocalMsg | null
}

const items = computed<ItemView[]>(() => {
  const st = data.convState(props.conv.id)
  const mine = data.mineId()
  const now = Date.now()
  const ttl = data.ttlMinutes * 60000
  const arr: ItemView[] = st.msgs.map((m) => {
    let expirySecs: number | null = null
    if (!(m.kind === 5 && m.recalled)) {
      let deadline: number | null = null
      if (m.sender_id === mine) deadline = m.send_at + ttl
      else if (m.activated_at != null) deadline = m.activated_at + ttl
      // 接收方未激活：不销毁不倒计时
      if (deadline != null) expirySecs = Math.max(0, deadline - now) / 1000
    }
    return {
      key: 'm' + m.id,
      side: m.sender_id === mine ? 'me' : 'them',
      msg: m,
      read: m.viewed_at != null,
      delivered: st.delivered.has(m.id),
      expirySecs,
      local: null
    }
  })
  for (const l of st.locals) {
    const msg: ChatMsg = {
      id: -1,
      conv_id: props.conv.id,
      sender_id: mine,
      kind: l.kind,
      send_at: l.sendAt,
      viewed_at: null
    }
    if (l.text != null) msg.text = l.text
    if (l.media) msg.media = { key: l.media.key, meta: (l.media.meta as any) ?? null }
    arr.push({
      key: 'l' + l.key,
      side: 'me',
      msg,
      read: false,
      delivered: l.status === 'delivered',
      expirySecs: null,
      local: l
    })
  }
  return arr
})

// ---------- 语音录制（MediaRecorder，兼容 mp4/webm/ogg，60s 上限） ----------
let mediaStream: MediaStream | null = null
let recorder: MediaRecorder | null = null
let chunks: Blob[] = []
let recStart = 0
let recTimer: number | null = null
let recordSecs = ref(0)
let recording = ref(false)
let willCancel = ref(false)
let showVoice = ref(false)

function pickMime(): string {
  const cands = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
  for (const m of cands) if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m
  return ''
}
async function beginRecord(e: PointerEvent) {
  if (!recording.value) {
    e.preventDefault()
    if (!navigator.mediaDevices?.getUserMedia) { toast('当前浏览器不支持录音', 'err'); return }
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast('无法访问麦克风', 'err')
      return
    }
    const mime = pickMime()
    try {
      recorder = mime ? new MediaRecorder(mediaStream, { mimeType: mime }) : new MediaRecorder(mediaStream)
    } catch {
      recorder = new MediaRecorder(mediaStream)
    }
    chunks = []
    recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }
    recorder.start(200)
    recStart = Date.now()
    recordSecs.value = 0
    recording.value = true
    willCancel.value = false
    if (recTimer) window.clearInterval(recTimer)
    recTimer = window.setInterval(() => {
      recordSecs.value = (Date.now() - recStart) / 1000
      if (recordSecs.value >= 60) endRecord()
    }, 200)
  }
}
function onLeave(e: PointerEvent) {
  if (recording.value && (e as PointerEvent).buttons === 0) endRecord()
}
function onPointerMoveGlobal(e: PointerEvent) {
  willCancel.value = recording.value && e.clientY < window.innerHeight - 190
}
async function endRecord() {
  if (!recording.value || !recorder) return
  const durSec = Math.min((Date.now() - recStart) / 1000, 60)
  recording.value = false
  willCancel.value = false
  if (recTimer) window.clearInterval(recTimer)
  recTimer = null
  const doCancel = willCancel.value
  willCancel.value = false
  const rec = recorder
  const stream = mediaStream
  recorder = null
  mediaStream = null
  const finish = () => {
    stream.getTracks().forEach((t) => t.stop())
    if (doCancel || durSec < 1) {
      if (!doCancel) toast('说话时间太短')
      return
    }
    const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
    const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([blob], 'voice.' + ext, { type: blob.type })
    uploadFile('voice', file, { duration: Math.round(durSec) })
      .then((up) => pushLocal(4, { media: up }))
      .catch((err) => toast(err.message || '语音上传失败', 'err'))
  }
  if (rec.state !== 'inactive') {
    rec.onstop = finish
    rec.stop()
  } else {
    finish()
  }
}
async function cancelRecord() {
  if (!recording.value) return
  willCancel.value = true
  await endRecord()
}
function sendingLabel(item: ItemView): string {
  if (item.local && item.local.status === 'sending') return '发送中…'
  if (item.msg.kind === 2) return '[图片]'
  if (item.msg.kind === 3) return '[视频]'
  if (item.msg.kind === 4) return '[语音]'
  return ''
}
function canRecall(v: ItemView): boolean {
  if (v.side !== 'me' || v.local) return false
  if (v.msg.kind === 5 || v.msg.recalled) return false
  return Date.now() - v.msg.send_at < data.recallMinutes * 60000
}
async function copyText() {
  const v = menuMsg.value
  if (v && v.msg.kind === 1 && v.msg.text) {
    try { await navigator.clipboard.writeText(v.msg.text) } catch {
      const el = document.createElement('textarea')
      el.value = v.msg.text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
    }
    toast('已复制')
  }
  menuMsg.value = null
}
function onBubbleClick(v: ItemView) {
  if (v.msg.kind === 5 && v.msg.recalled) return
  if (v.msg.kind !== 1) return // 媒体消息不做气泡菜单
  menuMsg.value = v
}
function recall(v: ItemView) {
  menuMsg.value = null
  socket.send({ type: 'recall', msg_id: v.msg.id })
  toast('已撤回')
}
function pushLocal(kind: 1 | 2 | 3 | 4, payload: { text?: string; media?: { key: string; meta?: Record<string, unknown> } }) {
  if (!data.connected) { toast('连接中，请稍候…', 'err'); return false }
  const key = 'c' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
  const st = data.convState(props.conv.id)
  const meta = payload.media ? { ...payload.media, meta: { ...(payload.media.meta || {}) } } : undefined
  st.locals.push({ key, kind, text: payload.text, media: meta, status: 'sending', sendAt: Date.now(), msgId: null })
  const frame: Record<string, unknown> = { type: 'send', client_msg_id: key, conv_id: props.conv.id, kind: kindLabel(kind) }
  if (payload.text != null) frame.text = payload.text
  if (payload.media) frame.media = payload.media
  socket.send(frame)
  return true
}
function kindLabel(k: number): string {
  return k === 1 ? 'text' : k === 2 ? 'image' : k === 3 ? 'video' : 'voice'
}
function sendText() {
  const t = text.value.trim()
  if (!t) return
  if (pushLocal(1, { text: t })) {
    text.value = ''
    showPlus.value = false
    // 发送后复位输入框高度，输入栏位置稳定（v1.2 需求 4）
    nextTick(() => {
      const el = ta.value
      if (el) {
        el.style.height = 'auto'
        el.style.height = '36px'
      }
    })
  }
}
async function onImagePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 20 * 1024 * 1024) { toast('图片不能超过 20MB', 'err'); return }
  try {
    const dims = file.type === 'image/gif' ? { width: 0, height: 0 } : await imageDims(file)
    const upFile = await compressImage(file)
    const up = await uploadFile('image', upFile, dims)
    pushLocal(2, { media: up })
  } catch (err: any) {
    toast(err.message || '图片上传失败', 'err')
  }
}
async function onVideoPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 200 * 1024 * 1024) { toast('视频不能超过 200MB', 'err'); return }
  if (file.type !== 'video/mp4' && file.type !== 'video/webm') { toast('仅支持 mp4/webm', 'err'); return }
  try {
    const up = await uploadFile('video', file)
    pushLocal(3, { media: up })
  } catch (err: any) {
    toast(err.message || '视频上传失败', 'err')
  }
}
function imageDims(file: File): Promise<{ width: number; height: number }> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); res({ width: img.width, height: img.height }) }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('不是有效图片')) }
    img.src = url
  })
}
function onEnter() {
  if (window.matchMedia('(pointer: fine)').matches) sendText()
}
function autoGrow() {
  const el = ta.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 96) + 'px'
}
function scrollBottom() {
  const el = scroller.value
  if (el) el.scrollTop = el.scrollHeight
}
function onOpenChatFromSheet() {
  showFriend.value = false
  emit('changed')
}
function openConv() {
  data.loadMessages(props.conv.id)
  const conv = data.findConvById(props.conv.id)
  if (conv) conv.unread = 0
  data.markReadLocal(props.conv.id)
  socket.send({ type: 'read_conv', conv_id: props.conv.id })
  data.refreshConvs()
  nextTick(scrollBottom)
}
function onConvRemoved(e: Event) {
  const id = (e as CustomEvent).detail
  if (id === props.conv.id) emit('close')
}
watch(() => props.conv.id, openConv, { immediate: true })
watch(() => data.convStates[props.conv.id]?.msgs.length, () => { nextTick(scrollBottom) })
onMounted(() => {
  window.addEventListener('hc-conv-removed', onConvRemoved)
  window.addEventListener('pointermove', onPointerMoveGlobal)
})
onUnmounted(() => {
  window.removeEventListener('hc-conv-removed', onConvRemoved)
  window.removeEventListener('pointermove', onPointerMoveGlobal)
  if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop())
})
</script>
<style scoped>
.chat { flex: 1; display: flex; flex-direction: column; background: var(--wx-bg); min-width: 0; position: relative; }
.head { height: 54px; background: var(--wx-header); display: flex; align-items: center; padding: 0 10px; gap: 8px; border-bottom: 1px solid #d9d9d9; flex-shrink: 0; }
.back { font-size: 26px; color: #333; padding: 0 6px; }
.htitle { display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer; min-width: 0; }
.hname { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.more { color: #333; font-size: 17px; letter-spacing: 1px; padding: 4px 8px; }
.msgs { flex: 1; overflow-y: auto; padding: 14px 12px 8px; }
.welcome { text-align: center; color: #b5b5b5; font-size: 13px; padding: 40px 0 10px; }
.tip { font-size: 12px; margin-top: 6px; }
.row { display: flex; gap: 10px; margin-bottom: 16px; }
.row.me { flex-direction: row-reverse; }
.bubble-wrap { max-width: 72%; display: flex; flex-direction: column; }
.row.me .bubble-wrap { align-items: flex-end; }
.bubble { padding: 8px 10px; border-radius: 8px; font-size: 16px; line-height: 1.45; word-break: break-word; white-space: pre-wrap; }
.bubble.them { background: #fff; }
.bubble.me { background: var(--wx-green); }
.bubble.sys { background: transparent; color: #b0b0b0; font-size: 13px; text-align: center; }
.meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 10.5px; color: #b4b4b4; }
.row.me .meta { justify-content: flex-end; }
.cd { color: #c8a15a; }
.wait-tip { color: #b9b9b9; }
.cd.hot { color: var(--danger); }
.ticks { font-size: 11px; color: #8f8f8f; }
.ticks.read { color: #4aa2ff; }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); z-index: 2000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.lightbox img { max-width: 96vw; max-height: 92vh; border-radius: 4px; }
.ctx { position: absolute; inset: 54px 0 0; background: rgba(0,0,0,.25); z-index: 500; }
.ctx-box { position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%); background: #fff; border-radius: 12px; width: min(82vw, 280px); overflow: hidden; }
.ctx-title { padding: 12px; text-align: center; font-size: 13px; color: #999; border-bottom: 1px solid #eee; }
.ctx-item { padding: 13px; text-align: center; font-size: 15px; border-bottom: 1px solid #f2f2f2; cursor: pointer; }
.ctx-item.danger { color: var(--danger); }
.input-bar { background: #f7f7f7; border-top: 1px solid #ddd; flex-shrink: 0; padding-bottom: env(safe-area-inset-bottom); }
.plus-row { display: flex; gap: 12px; padding: 10px 14px 4px; }
.plus-item { background: #fff; border: 1px solid #e4e4e4; border-radius: 10px; padding: 14px 0; flex: 1; font-size: 13px; color: #444; }
.input-row { display: flex; align-items: flex-end; gap: 8px; padding: 8px 10px; }
.icon-btn { font-size: 22px; width: 34px; height: 34px; }
.textin { flex: 1; background: #fff; border-radius: 6px; padding: 8px 10px; font-size: 16px; max-height: 96px; min-height: 36px; resize: none; line-height: 1.4; }
.send { background: var(--wx-green); color: #fff; border-radius: 6px; padding: 8px 14px; font-size: 14px; height: 36px; }
.voice-close { font-size: 18px; }
.hold-talk { flex: 1; background: #fff; border-radius: 6px; height: 38px; font-size: 15px; color: #444; border: 1px solid #e0e0e0; user-select: none; touch-action: none; }
.record-mask { position: absolute; inset: 54px 0 0; background: rgba(0,0,0,.35); z-index: 700; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.record-panel { background: rgba(0,0,0,.72); border-radius: 14px; color: #fff; width: 150px; height: 150px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.record-panel.cancel { background: rgba(200,60,60,.85); }
.r-icon { font-size: 40px; }
.r-text { font-size: 14px; }
.r-time { font-size: 12px; color: #cfcfcf; }
.voice-pill { display: inline-flex; align-items: center; gap: 6px; min-width: 110px; }
.v-icon { font-size: 17px; }
.voice-audio { height: 30px; width: 150px; }
.v-dur { font-size: 12px; opacity: .75; white-space: nowrap; }
</style>