import { defineStore } from 'pinia'
import { api } from '../lib/api'
import { socket } from '../lib/socket'
import { useAuth } from './auth'
import type { ChatMsg, ConvItem, FriendRequestItem, InitData, UserDto } from '../types'

export interface LocalMsg {
  key: string
  kind: 1 | 2 | 3 | 4
  text?: string
  media?: { key: string; meta?: Record<string, unknown> }
  status: 'sending' | 'sent' | 'delivered' | 'read'
  sendAt: number
  msgId: number | null
}

export interface ConvState {
  msgs: ChatMsg[]
  locals: LocalMsg[]
  delivered: Set<number>
  loaded: boolean
  loading: boolean
}

export const useData = defineStore('data', {
  state: () => ({
    friends: [] as UserDto[],
    requests: [] as FriendRequestItem[],
    convs: [] as ConvItem[],
    convStates: {} as Record<number, ConvState>,
    ttlMinutes: 20,
    recallMinutes: 2,
    connected: false,
    ready: false
  }),
  actions: {
    convState(id: number): ConvState {
      if (!this.convStates[id]) {
        this.convStates[id] = { msgs: [], locals: [], delivered: new Set(), loaded: false, loading: false }
      }
      return this.convStates[id]
    },
    async init() {
      const d = await api.get<InitData>('/api/init')
      this.friends = d.friends
      this.requests = d.pending_requests
      this.convs = d.conversations
      this.ttlMinutes = d.ttl_minutes
      this.recallMinutes = d.recall_minutes
      this.ready = true
    },
    refreshConvs() {
      api.get<ConvItem[]>('/api/conversations').then((list) => {
        this.convs = list
      }).catch(() => { /* 瞬时失败忽略 */ })
    },
    async loadMessages(convId: number) {
      const st = this.convState(convId)
      if (st.loaded || st.loading) return
      st.loading = true
      try {
        const page = await api.get<ChatMsg[]>('/api/conversations/' + convId + '/messages?limit=50')
        st.msgs = page
        st.loaded = true
      } finally {
        st.loading = false
      }
    },
    markReadLocal(convId: number) {
      const st = this.convState(convId)
      const now = Date.now()
      for (const m of st.msgs) {
        if (m.sender_id !== this.mineId() && m.viewed_at == null) m.viewed_at = now
      }
    },
    mineId(): number {
      const a = useAuth()
      return a.user ? a.user.id : -1
    },
    removeMsgGlobally(msgId: number) {
      for (const k of Object.keys(this.convStates)) {
        const st = this.convStates[k]
        st.msgs = st.msgs.filter((x) => x.id !== msgId)
        st.locals = st.locals.filter((x) => x.msgId !== msgId)
      }
    },
    findConvById(id: number): ConvItem | undefined {
      return this.convs.find((c) => c.id === id)
    },
    findConvByFriend(friendId: number): ConvItem | undefined {
      return this.convs.find((c) => c.friend.id === friendId)
    }
  }
})

let wired = false

export function wireSocket() {
  if (wired) return
  wired = true
  const data = useData()
  const auth = useAuth()

  socket.on('auth_ok', async (m: any) => {
    auth.setServerTime(m.server_time_ms)
    try {
      await data.init()
    } catch { /* */ }
  })
  socket.on('new_msg', (m: any) => {
    const msg = m.msg as ChatMsg
    const st = data.convState(msg.conv_id)
    const incoming = msg.sender_id !== data.mineId()
    if (incoming) {
      st.msgs.push(msg)
      if (msg.viewed_at == null) {
        msg.viewed_at = Date.now()
        socket.send({ type: 'read_conv', conv_id: msg.conv_id })
      }
    } else {
      if (!st.msgs.some((x) => x.id === msg.id)) st.msgs.push(msg)
    }
    data.refreshConvs()
  })
  socket.on('ack_send', (m: any) => {
    const msgId: number | null = m.msg_id ?? null
    if (msgId == null) return
    for (const convKey of Object.keys(data.convStates)) {
      const convId = Number(convKey)
      const st = data.convStates[convId]
      const l = st.locals.find((x) => x.key === m.client_msg_id || (!m.client_msg_id && x.status === 'sending'))
      if (!l) continue
      // 转正：本地气泡升级为服务端消息（纳入倒计时/撤回/刷新体系）
      const server: ChatMsg = {
        id: msgId,
        conv_id: convId,
        sender_id: data.mineId(),
        kind: l.kind,
        send_at: m.send_at ?? l.sendAt,
        viewed_at: null,
        activated_at: null
      }
      if (l.text != null) server.text = l.text
      if (l.media) server.media = { key: l.media.key, meta: l.media.meta ?? null }
      st.locals = st.locals.filter((x) => x !== l)
      st.msgs.push(server)
      // v1.2：我发送 = 回复激活 —— 对端此前未激活的消息开始倒计时
      const mine = data.mineId()
      for (const x of st.msgs) {
        if (x.sender_id !== mine && x.activated_at == null) x.activated_at = Date.now()
      }
      break
    }
    data.refreshConvs()
  })
  socket.on('msg_delivered', (m: any) => {
    const st = data.convStates[m.conv_id]
    if (st) st.delivered.add(m.msg_id)
  })
  socket.on('conv_read', (m: any) => {
    const st = data.convStates[m.conv_id]
    if (st) {
      const mine = data.mineId()
      for (const x of st.msgs) {
        if (x.sender_id === mine && (m.msg_id == null || x.id <= m.msg_id)) x.viewed_at = m.read_at
      }
    }
    data.refreshConvs()
  })
  socket.on('msg_expired', (m: any) => {
    data.removeMsgGlobally(m.msg_id)
    data.refreshConvs()
  })
  socket.on('recalled', (m: any) => {
    for (const k of Object.keys(data.convStates)) {
      const st = data.convStates[k]
      const mm = st.msgs.find((x) => x.id === m.msg_id)
      if (mm) {
        if (m.recall_kind === 'silent') {
          st.msgs = st.msgs.filter((x) => x.id !== m.msg_id)
        } else {
          mm.kind = 5
          mm.recalled = true
          mm.text = undefined
          mm.media = undefined
        }
      }
    }
    data.refreshConvs()
  })
  socket.on('friend_request', (m: any) => {
    const req = m.request
    data.requests.unshift({ id: req.id, from: req.from, message: req.message, created_at: req.created_at })
  })
  socket.on('friend_accepted', (m: any) => {
    const f: UserDto = m.friend
    if (!data.friends.some((x) => x.id === f.id)) data.friends.push(f)
    const idx = data.requests.findIndex((r) => r.from.id === f.id)
    if (idx >= 0) data.requests.splice(idx, 1)
    data.refreshConvs()
  })
  socket.on('friend_request_result', () => { /* 申请被拒的提示由操作方展示 */ })
  socket.on('friend_deleted', (m: any) => {
    data.friends = data.friends.filter((f) => f.id !== m.friend_id)
    const conv = data.findConvByFriend(m.friend_id)
    if (conv) {
      delete data.convStates[conv.id]
      data.convs = data.convs.filter((c) => c.id !== conv.id)
      window.dispatchEvent(new CustomEvent('hc-conv-removed', { detail: conv.id }))
    }
  })
  socket.on('profile_updated', (m: any) => {
    const patch = { nickname: m.nickname, avatarExt: m.avatar_ext, avatarVersion: m.avatar_version } as Partial<UserDto>
    const apply = (u: UserDto) => {
      if (u.id === m.user_id) Object.assign(u, patch)
    }
    data.friends.forEach(apply)
    data.convs.forEach((c) => apply(c.friend))
    data.requests.forEach((r) => apply(r.from))
    const a = useAuth()
    if (a.user && a.user.id === m.user_id) a.patchMe(patch)
  })
  socket.on('error', (m: any) => {
    console.warn('ws error', m)
  })
}

let ticker: number | null = null

/** 本地兜底：每秒移除已过本地可视期的气泡（服务端 msg_expired 双保险） */
export function startExpiryTicker() {
  if (ticker != null) return
  ticker = window.setInterval(() => {
    const data = useData()
    const auth = useAuth()
    if (!data.ready || !auth.user) return
    const now = Date.now()
    const ttlMs = data.ttlMinutes * 60000
    const mine = auth.user.id
    for (const k of Object.keys(data.convStates)) {
      const st = data.convStates[k]
      const keep: ChatMsg[] = []
      for (const x of st.msgs) {
        if (x.kind === 5 && x.recalled) {
          keep.push(x)
          continue
        }
        let deadline: number | null = null
        if (x.sender_id === mine) deadline = x.send_at + ttlMs
        else if (x.activated_at != null) deadline = x.activated_at + ttlMs
        // 接收方未激活：一直等待，本地不过期
        if (deadline === null || now < deadline) keep.push(x)
      }
      if (keep.length !== st.msgs.length) st.msgs = keep
      // 发送超时未确认的本地消息移除
      const cutoff = now - 20000
      st.locals = st.locals.filter((x) => !(x.status === 'sending' && x.sendAt < cutoff))
    }
  }, 1000)
}