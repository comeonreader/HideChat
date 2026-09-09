import { reactive } from 'vue'

export const toastState = reactive({ items: [] as { id: number; text: string; kind: 'info' | 'err' }[] })
let seq = 0

export function toast(text: string, kind: 'info' | 'err' = 'info') {
  const id = ++seq
  toastState.items.push({ id, text, kind })
  setTimeout(() => {
    const i = toastState.items.findIndex(x => x.id === id)
    if (i >= 0) toastState.items.splice(i, 1)
  }, 2600)
}
