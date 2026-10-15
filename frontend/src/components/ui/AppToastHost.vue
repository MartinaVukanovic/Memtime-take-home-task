<script setup lang="ts">
import { dismissAppToast, useAppToast } from '../../composables/useAppToast'
import AppToastItem from './AppToastItem.vue'

const { toasts } = useAppToast()
</script>

<template>
  <Teleport to="body">
    <div v-if="toasts.length > 0" class="app-toast-host" aria-label="Notifications">
      <AppToastItem
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :tone="toast.tone"
        @dismiss="dismissAppToast(toast.id)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.app-toast-host {
  position: fixed;
  top: max(16px, env(safe-area-inset-top, 0px));
  left: 50%;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(440px, calc(100% - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.app-toast-host :deep(.app-toast) {
  pointer-events: auto;
}
</style>
