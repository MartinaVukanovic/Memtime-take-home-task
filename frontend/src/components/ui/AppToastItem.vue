<script setup lang="ts">
import gsap from 'gsap'
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import type { AppToastTone } from '../../composables/useAppToast'
import { motionDuration } from '../../utils/motion'

const props = defineProps<{
  message: string
  tone: AppToastTone
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const rootRef = useTemplateRef<HTMLElement>('root')
const AUTO_DISMISS_MS = 4500
let dismissTimer: number | undefined

function dismissAnimated() {
  const node = rootRef.value
  const duration = motionDuration(0.22)
  if (!node || duration === 0) {
    emit('dismiss')
    return
  }
  gsap.to(node, {
    y: -10,
    autoAlpha: 0,
    duration,
    ease: 'power2.in',
    onComplete: () => emit('dismiss'),
  })
}

onMounted(() => {
  const node = rootRef.value
  if (node) {
    const duration = motionDuration(0.34)
    if (duration === 0) {
      gsap.set(node, { autoAlpha: 1, y: 0 })
    } else {
      // from() would animate toward CSS opacity:0 — use explicit end state instead.
      gsap.fromTo(
        node,
        { y: -18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration, ease: 'power2.out', clearProps: 'transform' },
      )
    }
  }
  dismissTimer = window.setTimeout(dismissAnimated, AUTO_DISMISS_MS)
})

onUnmounted(() => {
  if (dismissTimer !== undefined) window.clearTimeout(dismissTimer)
})
</script>

<template>
  <div
    ref="root"
    class="app-toast"
    :class="`app-toast--${tone}`"
    role="status"
    aria-live="polite"
  >
    <p class="app-toast__message">{{ message }}</p>
    <button class="app-toast__close" type="button" aria-label="Dismiss" @click="dismissAnimated">
      ×
    </button>
  </div>
</template>

<style scoped>
.app-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px 12px 16px;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.app-toast--success {
  border: 1px solid #86efac;
  background: var(--color-success-soft);
  color: #166534;
}

.app-toast--error {
  border: 1px solid #fca5a5;
  background: var(--color-danger-soft);
  color: #991b1b;
}

.app-toast__message {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.app-toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: inherit;
  font-size: 18px;
  line-height: 1;
  opacity: 0.7;
}

.app-toast__close:hover {
  opacity: 1;
}
</style>
