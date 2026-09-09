const TOKEN_KEY = 'hidechat.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string | null, keep = true) {
  if (t) {
    if (keep) localStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.setItem(TOKEN_KEY, t)
  } else {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  code: string
  status: number
  constructor(status: number, code: string, message: string) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function request<T>(method: string, url: string, body?: unknown, isForm = false): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token
  let payload: BodyInit | undefined
  if (body !== undefined) {
    if (isForm) payload = body as BodyInit
    else { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  }
  const res = await fetch(url, { method, headers, body: payload })
  if (res.status === 401) {
    // 仅对非登录接口做会话失效处理
    if (!url.includes('/api/auth/')) {
      setToken(null)
      window.dispatchEvent(new Event('hc-logout'))
    }
  }
  if (!res.ok) {
    let code = 'ERROR', message = '请求失败(' + res.status + ')'
    try { const j = await res.json(); code = j.code || code; message = j.message || message } catch { /* ignore */ }
    throw new ApiError(res.status, code, message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  upload: <T>(url: string, form: FormData) => request<T>('POST', url, form, true)
}