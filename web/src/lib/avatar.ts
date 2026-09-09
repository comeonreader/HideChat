import type { UserDto } from '../types'

const COLORS = ['#5b8def', '#f06c6c', '#3eb575', '#e9a23b', '#9b6cf0', '#2ab7ca', '#e8709a', '#8a9a5b']
export function hashColor(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}
export function avatarUrl(u: UserDto | null | undefined): string | null {
  if (u && u.avatarExt) return '/api/avatars/' + u.id + '?v=' + u.avatarVersion
  return null
}
export function initialOf(nickname: string): string {
  return (nickname || '?').slice(0, 1).toUpperCase()
}
