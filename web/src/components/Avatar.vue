<template>
  <div class="avatar" :style="box" :class="rounded" :title="u?.nickname || ''">
    <img v-if="img" :src="img" :alt="u?.nickname || ''" loading="lazy" referrerpolicy="no-referrer" />
    <span v-else>{{ initialOf(u?.nickname || u?.username || '?') }}</span>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { UserDto } from '../types'
import { avatarUrl, hashColor, initialOf } from '../lib/avatar'
const props = defineProps<{ u: UserDto | null | undefined; size?: number; square?: boolean }>()
const size = computed(() => props.size ?? 40)
const img = computed(() => avatarUrl(props.u))
const seed = computed(() => (props.u?.username || props.u?.nickname || '?'))
// 内联尺寸：任意 size 均稳定渲染（v1.2.1，防 512px 原图撑破布局）
const box = computed(() => ({
  width: size.value + 'px',
  height: size.value + 'px',
  borderRadius: props.square ? '6px' : Math.round(size.value * 0.15) + 'px',
  background: img.value ? 'transparent' : hashColor(seed.value),
  fontSize: Math.round(size.value * 0.42) + 'px'
}))
const rounded = computed(() => (props.square ? 'sq' : ''))
</script>
<style scoped>
.avatar { display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 600; flex-shrink: 0; overflow: hidden; user-select: none; }
.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>