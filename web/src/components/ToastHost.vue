<template>
  <div class="toast-host">
    <transition-group name="t">
      <div v-for="t in toastState.items" :key="t.id" class="toast-item" :class="t.kind">{{ t.text }}</div>
    </transition-group>
  </div>
</template>
<script setup lang="ts">
import { toastState } from '../lib/toast'
</script>
<style scoped>
.toast-host { position: fixed; left: 0; right: 0; top: 18%; display: flex; flex-direction: column;
  align-items: center; gap: 10px; z-index: 9999; pointer-events: none; }
.toast-item { background: rgba(0,0,0,.72); color: #fff; padding: 9px 18px; border-radius: 6px;
  font-size: 14px; max-width: 78vw; word-break: break-all; }
.toast-item.err { background: rgba(214,69,69,.92); }
.t-enter-active,.t-leave-active { transition: all .25s; }
.t-enter-from,.t-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
