<script setup lang="ts">
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import closeIcon from '../../assets/icons/close.svg'
import { useDialogEnterAnimation } from '../../composables/useDialogEnterAnimation'
import { displayName } from '../../utils/displayName'

const props = defineProps<{
  title: string
  message: string
  confirmLabel?: string
  clientName?: string
  projectName?: string
  taskName?: string
}>()

const breadcrumb = computed(() => {
  const { clientName, projectName, taskName } = props
  if (clientName === undefined || projectName === undefined || taskName === undefined) {
    return null
  }
  return {
    client: displayName(clientName),
    project: displayName(projectName),
    task: displayName(taskName),
  }
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const overlayRef = useTemplateRef<HTMLElement>('overlay')
const dialogRef = useTemplateRef<HTMLElement>('dialog')

useDialogEnterAnimation(overlayRef, dialogRef)

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
    <div ref="overlay" class="modal-overlay" @click.self="emit('close')">
      <div ref="dialog" class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
        <header class="modal__header">
          <div>
            <h2 id="confirm-delete-title" class="modal__title">{{ title }}</h2>
            <p v-if="breadcrumb" class="modal__crumb">
              {{ breadcrumb.client }}
              <span class="modal__crumb-sep">›</span>
              {{ breadcrumb.project }}
              <span class="modal__crumb-sep">›</span>
              <span class="modal__crumb-current">{{ breadcrumb.task }}</span>
            </p>
          </div>
          <button class="modal__icon-button" type="button" aria-label="Close" @click="emit('close')">
            <img :src="closeIcon" width="14" height="14" alt="" />
          </button>
        </header>

        <div class="modal__body">
          <p class="modal__message">{{ message }}</p>
        </div>

        <footer class="modal__footer">
          <button class="modal__cancel" type="button" @click="emit('close')">Cancel</button>
          <button class="modal__confirm" type="button" @click="emit('confirm')">
            {{ confirmLabel ?? 'Delete' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: var(--color-overlay);
}

.modal {
  width: min(480px, 100%);
  overflow: hidden;
  border-radius: var(--radius-modal);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.modal__header,
.modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
}

.modal__header {
  border-bottom: 1px solid var(--color-border);
}

.modal__title {
  margin: 0;
  padding-right: 16px;
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 700;
  line-height: 30px;
}

.modal__crumb {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 18px;
}

.modal__crumb-sep {
  margin: 0 8px;
}

.modal__crumb-current {
  color: var(--color-primary);
  font-weight: 500;
}

.modal__icon-button {
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

.modal__body {
  padding: 24px 32px 32px;
}

.modal__message {
  margin: 0;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 21px;
}

.modal__footer {
  justify-content: flex-end;
  gap: 12px;
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border);
}

.modal__cancel,
.modal__confirm {
  padding: 10px 24px;
  border: 0;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.modal__cancel {
  background: transparent;
  color: var(--color-text-muted);
}

.modal__confirm {
  background: #dc2626;
  color: #fff;
  box-shadow: var(--shadow-sm);
}

@media (max-width: 720px) {
  .modal-overlay {
    padding: 20px;
    align-items: center;
  }

  .modal {
    width: 100%;
    border-radius: var(--radius-modal);
  }
}
</style>
