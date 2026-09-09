const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
export function fmtListTime(ms: number | null | undefined): string {
  if (ms == null) return ''
  const d = new Date(ms)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const pad = (n: number) => String(n).padStart(2, '0')
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (sameDay) return hm
  const yesterday = new Date(now.getTime() - 86400000)
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  if (d.getFullYear() === now.getFullYear()) return (d.getMonth() + 1) + '月' + d.getDate() + '日'
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
}
export function fmtClock(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}
export function fmtCountdown(secs: number): string {
  secs = Math.max(0, Math.ceil(secs))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return m + ':' + pad(s)
}
