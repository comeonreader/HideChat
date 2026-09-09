<template>
  <div v-if="user" class="mask" @click.self="emit('close')">
    <div class="sheet">
      <Avatar :u="user" :size="72" />
      <div class="name">{{ user.nickname }}</div>
      <div class="uname">用户名：{{ user.username }}</div>
      <div v-if="desc" class="desc">{{ desc }}</div>
      <div class="btns">
        <template v-if="relation === 'friend'">
          <button class="btn primary" @click="openChat">发消息</button>
          <button class="btn danger" @click="del">删除好友</button>
        </template>
        <template v-else-if="relation === 'stranger'">
          <button class="btn primary" @click="add">添加好友</button>
          <button class="btn" @click="emit('close')">取消</button>
        </template>
        <template v-else-if="relation === 'requested'">
          <button class="btn" disabled>已发送申请</button>
        </template>
        <template v-else-if="relation === 'self'">
          <button class="btn" @click="emit('close')">关闭</button>
        </template>
        <template v-else-if="relation === 'incoming'">
          <button class="btn primary" @click="acceptReq">同意</button>
          <button class="btn" @click="rejectReq">拒绝</button>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import Avatar from './Avatar.vue'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { useData } from '../stores/data'
import type { FriendRequestItem, UserDto } from '../types'

const props = defineProps<{
  user: UserDto | null
  relation: 'friend' | 'stranger' | 'requested' | 'self' | 'incoming'
  request?: FriendRequestItem | null
  desc?: string
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'open-chat'): void; (e: 'changed'): void }>()
const data = useData()
const sending = ref(false)

function openChat() {
  emit('open-chat')
}
async function del() {
  if (!props.user) return
  if (!window.confirm('确定删除好友 ' + props.user.nickname + ' 吗？双方的会话记录将一并清除，不可恢复。')) return
  try {
    await api.del('/api/friends/' + props.user!.id)
    data.friends = data.friends.filter((f) => f.id !== props.user!.id)
    emit('changed')
  } catch (e: any) { toast(e.message, 'err') }
}
async function add() {
  if (!props.user || sending.value) return
  sending.value = true
  try {
    await api.post('/api/friend-requests', { to_user_id: props.user.id })
    toast('申请已发送')
    emit('changed')
  } catch (e: any) {
    toast(e.message, 'err')
    emit('changed')
  } finally { sending.value = false }
}
async function acceptReq() {
  if (!props.request) return
  try {
    await api.post('/api/friend-requests/' + props.request.id + '/accept')
    toast('已添加好友')
    emit('changed')
    emit('close')
  } catch (e: any) { toast(e.message, 'err') }
}
async function rejectReq() {
  if (!props.request) return
  try {
    await api.post('/api/friend-requests/' + props.request.id + '/reject')
    emit('changed')
    emit('close')
  } catch (e: any) { toast(e.message, 'err') }
}
</script>
<style scoped>
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 800; display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: min(94vw, 420px); background: #fff; border-radius: 14px 14px 0 0; padding: 26px 20px calc(20px + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; align-items: center; gap: 8px; animation: up .22s ease; }
@keyframes up { from { transform: translateY(30px); opacity: .6 } to { transform: none; opacity: 1 } }
.name { font-size: 19px; font-weight: 600; }
.uname { font-size: 13px; color: #999; }
.desc { font-size: 13px; color: #666; max-width: 100%; word-break: break-all; text-align: center; }
.btns { display: flex; gap: 14px; margin-top: 14px; width: 100%; }
.btn { flex: 1; padding: 11px 0; border-radius: 8px; font-size: 15px; background: #f2f2f2; }
.btn.primary { background: var(--wx-green); color: #fff; }
.btn.danger { background: #fff0f0; color: var(--danger); }
.btn:disabled { opacity: .5; }
</style>