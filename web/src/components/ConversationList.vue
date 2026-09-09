<template>
  <div class="cv-list">
    <div v-if="!convs.length" class="empty">
      <div class="eicon">💬</div>
      <p>暂无会话</p>
      <p class="sub">在「通讯录」添加好友后开始聊天</p>
    </div>
    <div v-for="c in convs" :key="c.id" class="item" :class="{ on: c.id === activeId }" @click="emit('open', c)">
      <Avatar :u="c.friend" :size="44" />
      <div class="mid">
        <div class="row1"><span class="name">{{ c.friend.nickname }}</span><span class="time">{{ fmtListTime(c.last_msg_at) }}</span></div>
        <div class="row2"><span class="snippet">{{ snippet(c) }}</span><span v-if="c.unread > 0" class="badge">{{ c.unread > 99 ? '99+' : c.unread }}</span></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Avatar from './Avatar.vue'
import { fmtListTime } from '../lib/time'
import type { ConvItem } from '../types'
defineProps<{ convs: ConvItem[]; activeId: number | null }>()
const emit = defineEmits<{ (e: 'open', c: ConvItem): void }>()
function snippet(c: ConvItem): string {
  const m = c.last_msg
  if (!m) return ''
  if (m.recalled) return '[撤回了一条消息]'
  switch (m.kind) {
    case 1: return m.text || ''
    case 2: return '[图片]'
    case 3: return '[视频]'
    case 4: return '[语音]'
    case 5: return '[系统消息]'
  }
  return ''
}
</script>
<style scoped>
.cv-list { flex: 1; overflow-y: auto; background: #fff; }
.item { display: flex; gap: 12px; padding: 11px 14px; align-items: center; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.item:active { background: #f3f3f3; }
.item.on { background: #ececec; }
.mid { flex: 1; min-width: 0; }
.row1, .row2 { display: flex; justify-content: space-between; align-items: center; }
.name { font-size: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time { font-size: 11px; color: #b2b2b2; }
.row2 { margin-top: 4px; }
.snippet { font-size: 13px; color: #9a9a9a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 8px; }
.badge { background: var(--danger); color: #fff; font-size: 11px; min-width: 18px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; padding: 0 5px; }
.empty { padding: 60px 20px; text-align: center; color: #b0b0b0; }
.eicon { font-size: 42px; margin-bottom: 8px; }
.sub { font-size: 12px; }
</style>
