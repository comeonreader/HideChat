import { defineStore } from 'pinia'
import { api, getToken, setToken, clearTokens } from '../lib/api'
import type { UserDto } from '../types'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null as UserDto | null,
    token: getToken(),
    offsetMs: 0
  }),
  getters: {
    loggedIn: (s) => !!s.token && !!s.user
  },
  actions: {
    async login(username: string, password: string, keep = true) {
      const r = await api.post<{ token: string; user: UserDto }>('/api/auth/login', { username, password })
      this.applyToken(r.token, r.user, keep)
    },
    async register(username: string, password: string, nickname: string, keep = true) {
      const r = await api.post<{ token: string; user: UserDto }>('/api/auth/register', { username, password, nickname })
      this.applyToken(r.token, r.user, keep)
    },
    applyToken(token: string, user: UserDto, keep = true) {
      this.token = token
      this.user = user
      setToken(token, keep)
    },
    setServerTime(serverMs: number) {
      this.offsetMs = serverMs - Date.now()
    },
    async reloadMe() {
      if (this.token && !this.user) {
        try { this.user = await api.get<UserDto>('/api/me') } catch { this.logout() }
      }
    },
    logout() {
      this.user = null
      this.token = null
      clearTokens()
    },
    patchMe(patch: Partial<UserDto>) {
      if (this.user) this.user = { ...this.user, ...patch }
    }
  }
})