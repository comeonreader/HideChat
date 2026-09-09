<template>
  <span v-if="url">
    <img v-if="msg.kind === 2" :src="url" class="media-img" loading="lazy" @click="$emit('preview', url)" alt="图片消息" />
    <video v-else-if="msg.kind === 3" :src="url" class="media-vid" controls playsinline preload="metadata"></video>
    <audio v-else-if="msg.kind === 4" :src="url" class="media-audio" controls preload="metadata"></audio>
  </span>
  <span v-else class="media-loading">加载中…</span>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../lib/api'
import type { ChatMsg } from '../types'
const props = defineProps<{ msg: ChatMsg }>()
defineEmits<{ (e: 'preview', url: string): void }>()
const url = ref('')
const cache = new Map<string, string>() // 模块级 URL 缓存
onMounted(async () => {
  const key = props.msg.media?.key
  if (!key) return
  if (cache.has(key)) { url.value = cache.get(key)!; return }
  // 上传后服务端落库有延迟：短重试，避免 404 竞态
  for (let i = 0; i < 10; i++) {
    try {
      const r = await api.get<{ url: string }>('/api/media-url/' + key)
      cache.set(key, r.url)
      url.value = r.url
      return
    } catch { /* 等 1s 重试 */ }
    await new Promise((res) => setTimeout(res, 1000))
  }
  url.value = ''
})
</script>
<style scoped>
.media-img { display: block; border-radius: 6px; max-width: min(220px, 60vw); max-height: 260px; cursor: zoom-in; }
.media-vid { width: min(230px, 62vw); border-radius: 6px; display: block; background: #000; }
.media-audio { width: min(220px, 58vw); }
.media-loading { color: #888; font-size: 13px; }
</style>