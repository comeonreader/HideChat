<template>
  <div class="me">
    <div class="profile-card">
      <div class="av-row" @click="pickFile">
        <Avatar :u="auth.user" :size="72" />
        <span class="cam">📷</span>
      </div>
      <input ref="file" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFile" />
      <div class="p-name">{{ auth.user?.nickname }}</div>
      <div class="p-uname">用户名：{{ auth.user?.username }}</div>
      <button v-if="auth.user?.avatarExt" class="link danger" @click="removeAvatar">删除头像</button>
      <div v-else class="hint">点头像上传头像</div>
    </div>
    <div class="cell-row">
      <span>昵称</span>
      <div class="cell-r">
        <input v-model="nickname" class="nick-input" maxlength="30" />
        <button class="save" :disabled="savingNick" @click="saveNick">保存</button>
      </div>
    </div>
    <div class="cell-row">
      <span>消息销毁</span>
      <span class="cell-val">发送后 {{ data.ttlMinutes }} 分钟自己不可见；对方查看后 {{ data.ttlMinutes }} 分钟销毁（未读一直等待）</span>
    </div>
    <div class="cell-row"><span>关于</span><span class="cell-val">清语 Qingyu · 自托管 · 服务器物理删除不留痕</span></div>
    <button class="logout" @click="logout">退出登录</button>

    <div v-if="cropUrl" class="mask" @click.self="cancelCrop">
      <div class="crop-box">
        <div class="crop-head">调整头像</div>
        <div class="crop-body"><img :src="cropUrl" class="crop-img" alt="preview" /></div>
        <div class="crop-btns">
          <button class="btn" @click="cancelCrop">取消</button>
          <button class="btn primary" :disabled="uploading" @click="doUpload">使用</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import Avatar from './Avatar.vue'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import { useData } from '../stores/data'

const auth = useAuth()
const data = useData()
const file = ref<HTMLInputElement | null>(null)
const nickname = ref(auth.user?.nickname ?? '')
const savingNick = ref(false)
const cropUrl = ref('')
const rawFile = ref<File | null>(null)
const uploading = ref(false)

watch(() => auth.user?.nickname, (n) => { if (n) nickname.value = n })

function pickFile() { file.value?.click() }
function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  if (f.size > 2 * 1024 * 1024) { toast('图片不能超过 2MB', 'err'); input.value = ''; return }
  rawFile.value = f
  cropUrl.value = URL.createObjectURL(f)
  input.value = ''
}
function cancelCrop() {
  cropUrl.value = ''
  rawFile.value = null
}
async function doUpload() {
  const f = rawFile.value
  if (!f) return
  uploading.value = true
  try {
    // 客户端方形压缩 512px（设计 8.5）
    const img = new Image()
    img.src = URL.createObjectURL(f)
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
    const side = 512
    const canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    const ctx = canvas.getContext('2d')!
    const scale = Math.max(side / img.width, side / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, side, side)
    ctx.drawImage(img, (side - w) / 2, (side - h) / 2, w, h)
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9))
    const form = new FormData()
    form.append('file', blob, 'avatar.jpg')
    const r = await api.upload<{ avatar_ext: string; avatar_version: number }>('/api/me/avatar', form)
    auth.patchMe({ avatarExt: r.avatar_ext, avatarVersion: r.avatar_version })
    toast('头像已更新')
    cancelCrop()
    data.refreshConvs()
  } catch (e: any) {
    toast(e.message || '上传失败', 'err')
  } finally {
    uploading.value = false
  }
}
async function removeAvatar() {
  if (!window.confirm('删除头像并恢复默认头像？')) return
  try {
    await api.del('/api/me/avatar')
    auth.patchMe({ avatarExt: null })
    toast('已删除头像')
    data.refreshConvs()
  } catch (e: any) { toast(e.message, 'err') }
}
async function saveNick() {
  const n = nickname.value.trim()
  if (!n || n === auth.user?.nickname) return
  if (n.length > 30) { toast('昵称最长 30 字', 'err'); return }
  savingNick.value = true
  try {
    const r = await api.put<{ nickname: string }>('/api/me', { nickname: n })
    auth.patchMe({ nickname: r.nickname })
    toast('昵称已更新')
    data.refreshConvs()
  } catch (e: any) {
    toast(e.message, 'err')
  } finally { savingNick.value = false }
}
function logout() {
  if (!window.confirm('确定退出登录？')) return
  window.dispatchEvent(new Event('hc-logout'))
}
</script>
<style scoped>
.me { background: #fff; min-height: 100%; overflow-y: auto; padding-bottom: 30px; }
.profile-card { display: flex; flex-direction: column; align-items: center; padding: 34px 16px 22px; border-bottom: 8px solid #f2f2f2; }
.av-row { position: relative; cursor: pointer; }
.cam { position: absolute; right: -6px; bottom: -6px; background: #fff; border-radius: 50%; padding: 4px 5px; font-size: 13px; box-shadow: 0 1px 4px rgba(0,0,0,.25); }
.p-name { font-size: 20px; font-weight: 600; margin-top: 14px; }
.p-uname { font-size: 13px; color: #999; margin-top: 4px; }
.link { margin-top: 8px; font-size: 13px; }
.link.danger { color: var(--danger); }
.hint { font-size: 12px; color: #bbb; margin-top: 8px; }
.cell-row { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f2f2f2; gap: 12px; }
.cell-row > span:first-child { width: 74px; font-size: 15px; flex-shrink: 0; }
.cell-r { flex: 1; display: flex; gap: 8px; }
.nick-input { flex: 1; border-bottom: 1px solid #e3e3e3; font-size: 15px; padding: 4px 0; }
.save { background: var(--wx-green); color: #fff; border-radius: 5px; font-size: 13px; padding: 5px 13px; }
.cell-val { font-size: 12px; color: #888; line-height: 1.5; }
.logout { display: block; width: calc(100% - 30px); margin: 30px 15px 0; padding: 12px 0; background: #fff3f3; color: var(--danger); border-radius: 8px; font-size: 15px; }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 950; display: flex; align-items: center; justify-content: center; }
.crop-box { background: #fff; border-radius: 12px; width: min(90vw, 340px); overflow: hidden; }
.crop-head { padding: 14px; text-align: center; font-size: 16px; font-weight: 600; }
.crop-body { display: flex; justify-content: center; background: #111; padding: 12px; }
.crop-img { width: 210px; height: 210px; object-fit: cover; border-radius: 8px; }
.crop-btns { display: flex; gap: 10px; padding: 12px; }
.btn { flex: 1; padding: 10px 0; border-radius: 8px; background: #f2f2f2; font-size: 15px; }
.btn.primary { background: var(--wx-green); color: #fff; }
</style>