export type WsHandler = (payload: any) => void

export class ChatSocket {
  private ws: WebSocket | null = null
  private handlers = new Map<string, Set<WsHandler>>()
  private token: string | null = null
  private reconnectDelay = 1000
  private heartbeat: number | null = null
  private shouldRun = false
  private _running = false
  onStatus?: (connected: boolean) => void
  get running() { return this._running }

  on(type: string, fn: WsHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(fn)
    return () => this.handlers.get(type)?.delete(fn)
  }

  emit(type: string, payload: any) {
    this.handlers.get(type)?.forEach(fn => { try { fn(payload) } catch (e) { console.error(e) } })
  }

  start(token: string) {
    if (this._running) return
    this.token = token
    this.shouldRun = true
    this._running = true
    this.reconnectDelay = 1000
    this.connect()
  }

  stop() {
    this.shouldRun = false
    this._running = false
    if (this.heartbeat) window.clearInterval(this.heartbeat)
    this.heartbeat = null
    this.ws?.close()
    this.ws = null
    this.onStatus?.(false)
  }

  private connect() {
    if (!this.shouldRun) return
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(proto + '://' + location.host + '/ws')
    this.ws = ws
    ws.onopen = () => {
      this.send({ type: 'auth', token: this.token })
      if (this.heartbeat) window.clearInterval(this.heartbeat)
      this.heartbeat = window.setInterval(() => this.send({ type: 'ping' }), 25000)
      this.onStatus?.(true)
    }
    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data)
        this.emit(m.type || 'message', m)
        this.emit('*', m)
      } catch { /* ignore */ }
    }
    ws.onclose = () => this.scheduleReconnect()
    ws.onerror = () => { try { ws.close() } catch { /* */ } }
  }

  private scheduleReconnect() {
    this.ws = null
    if (this.heartbeat) { window.clearInterval(this.heartbeat); this.heartbeat = null }
    this.onStatus?.(false)
    if (!this.shouldRun) return
    const delay = this.reconnectDelay
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
    window.setTimeout(() => this.connect(), delay)
  }

  send(obj: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj))
    }
  }
}

export const socket = new ChatSocket()