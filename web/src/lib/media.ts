import { api } from './api'

export interface Uploaded { key: string; meta: Record<string, unknown> }

export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file // 动图直传
  const img = await loadImage(file)
  const MAX = 1920
  let w = img.width
  let h = img.height
  if (Math.max(w, h) > MAX) {
    const k = MAX / Math.max(w, h)
    w = Math.round(w * k)
    h = Math.round(h * k)
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('compress failed'))), 'image/jpeg', 0.86))
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); res(img) }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('不是有效图片')) }
    img.src = url
  })
}

export async function uploadFile(kind: 'image' | 'video' | 'voice', file: File, extra: Record<string, unknown> = {}): Promise<Uploaded> {
  const form = new FormData()
  form.append('kind', kind)
  form.append('file', file)
  if (extra.width != null) form.append('width', String(extra.width))
  if (extra.height != null) form.append('height', String(extra.height))
  if (extra.duration != null) form.append('duration', String(extra.duration))
  const r = await api.upload<{ key: string; meta: Record<string, unknown> }>('/api/upload', form)
  return r
}
