<script setup lang="ts">
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import closeIcon from '../../assets/icons/close.svg'
import { useDialogEnterAnimation } from '../../composables/useDialogEnterAnimation'
import { displayName } from '../../utils/displayName'

const props = defineProps<{
  title: string
  text: string
  clientName?: string
  projectName?: string
  taskName?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const overlayRef = useTemplateRef<HTMLElement>('overlay')
const dialogRef = useTemplateRef<HTMLElement>('dialog')

useDialogEnterAnimation(overlayRef, dialogRef)

const showCrumb = computed(
  () => Boolean(props.clientName && props.projectName && props.taskName),
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div ref="overlay" class="text-modal-overlay" @click.self="emit('close')">
      <div ref="dialog" class="text-modal" role="dialog" aria-modal="true" aria-labelledby="text-detail-title">
        <header class="text-modal__header">
          <div class="text-modal__heading">
            <h2 id="text-detail-title" class="text-modal__title">{{ title }}</h2>
            <p v-if="showCrumb" class="text-modal__crumb">
              {{ displayName(clientName!) }}
              <span class="text-modal__crumb-sep">›</span>
              {{ displayName(projectName!) }}
              <span class="text-modal__crumb-sep">›</span>
              <span class="text-modal__crumb-current">{{ displayName(taskName!) }}</span>
            </p>
          </div>
          <button class="text-modal__close" type="button" aria-label="Close" @click="emit('close')">
            <img :src="closeIcon" width="14" height="14" alt="" />
          </button>
        </header>
        <div class="text-modal__body">
          <p class="text-modal__text">{{ text }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.text-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: var(--color-overlay);
}

.text-modal {
  display: flex;
  flex-direction: column;
  width: min(520px, 100%);
  max-height: min(calc(100dvh - 48px), 560px);
  overflow: hidden;
  border-radius: var(--radius-modal);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.text-modal__header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.text-modal__heading {
  min-width: 0;
}

.text-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 27px;
}

.text-modal__crumb {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 18px;
}

.text-modal__crumb-sep {
  margin: 0 8px;
}

.text-modal__crumb-current {
  color: var(--color-primary);
  font-weight: 500;
}

.text-modal__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
}

.text-modal__body {
  min-height: 0;
  padding: 24px;
  overflow: auto;
}

.text-modal__text {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 21px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
