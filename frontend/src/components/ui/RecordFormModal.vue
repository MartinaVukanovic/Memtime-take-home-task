<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  shallowRef,
  useTemplateRef,
  watch,
  type CSSProperties,
} from 'vue'
import type { RecordFields } from '../../api/types'
import calendarIcon from '../../assets/icons/calendar.svg'
import closeIcon from '../../assets/icons/close.svg'
import { fromDateInputValue, toDateInputValue } from '../../utils/formatDate'
import { useDialogEnterAnimation } from '../../composables/useDialogEnterAnimation'
import { normalizeStatus, statusOptionFor, toApiStatus } from '../../utils/status'
import StatusPicker from './StatusPicker.vue'

const props = defineProps<{
  title: string
  crumb: string
  crumbCurrent: string
  nameLabel: string
  submitLabel: string
  includeDescription?: boolean
  initial?: Partial<RecordFields> | null
}>()

const includeDescription = computed(() => props.includeDescription ?? true)

const emit = defineEmits<{
  close: []
  save: [payload: RecordFields]
}>()

const name = shallowRef(props.initial?.name ?? '')
const description = shallowRef(props.initial?.description ?? '')
const status = shallowRef(normalizeStatus(props.initial?.status ?? 'active'))
const createdAt = shallowRef(toDateInputValue(props.initial?.createdAt ?? new Date().toISOString()))
const pickerOpen = shallowRef(false)
const overlayRef = useTemplateRef<HTMLElement>('overlay')
const dialogRef = useTemplateRef<HTMLElement>('dialog')
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
const statusTrigger = useTemplateRef<HTMLButtonElement>('statusTrigger')

useDialogEnterAnimation(overlayRef, dialogRef)
const pickerStyle = shallowRef<CSSProperties>({})
const selectedOption = computed(() => statusOptionFor(status.value))
const canSave = computed(() => name.value.trim().length > 0)

watch(
  () => props.initial,
  (initial) => {
    name.value = initial?.name ?? ''
    description.value = initial?.description ?? ''
    status.value = normalizeStatus(initial?.status ?? 'active')
    createdAt.value = toDateInputValue(initial?.createdAt ?? new Date().toISOString())
    pickerOpen.value = false
  },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (pickerOpen.value) {
      closePicker()
      return
    }
    emit('close')
  }
}

function onDocumentPointerDown(event: MouseEvent) {
  if (!pickerOpen.value) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('.status-picker') || target.closest('.status-trigger')) return
  closePicker()
}

function updatePickerPosition() {
  const trigger = statusTrigger.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const width = Math.min(280, Math.max(rect.width, 200))
  const left = Math.min(rect.left, window.innerWidth - width - 12)
  const spaceBelow = window.innerHeight - rect.bottom - 12
  const spaceAbove = rect.top - 12
  const preferredHeight = 320
  const openUp = spaceBelow < preferredHeight && spaceAbove > spaceBelow

  if (openUp) {
    const maxHeight = Math.min(preferredHeight, spaceAbove - 8)
    pickerStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      bottom: `${window.innerHeight - rect.top + 8}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 60,
    }
  } else {
    const maxHeight = Math.min(preferredHeight, spaceBelow - 8)
    pickerStyle.value = {
      position: 'fixed',
      left: `${left}px`,
      top: `${rect.bottom + 8}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 60,
    }
  }
}

function closePicker() {
  pickerOpen.value = false
}

function togglePicker() {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value) updatePickerPosition()
}

watch(pickerOpen, (open) => {
  if (open) {
    updatePickerPosition()
    window.addEventListener('resize', updatePickerPosition)
    window.addEventListener('scroll', updatePickerPosition, true)
    return
  }
  window.removeEventListener('resize', updatePickerPosition)
  window.removeEventListener('scroll', updatePickerPosition, true)
})

onMounted(() => {
  nameInput.value?.focus()
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onDocumentPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onDocumentPointerDown)
  window.removeEventListener('resize', updatePickerPosition)
  window.removeEventListener('scroll', updatePickerPosition, true)
})

function save() {
  if (!canSave.value) return
  emit('save', {
    name: name.value.trim(),
    description: includeDescription.value ? description.value.trim() : '',
    status: toApiStatus(status.value),
    createdAt: fromDateInputValue(createdAt.value),
  })
}
</script>

<template>
  <Teleport to="body">
    <div ref="overlay" class="modal-overlay" @click.self="emit('close')">
      <div ref="dialog" class="modal" role="dialog" aria-modal="true" aria-labelledby="record-form-title">
        <header class="modal__header">
          <div>
            <h2 id="record-form-title" class="modal__title">{{ title }}</h2>
            <p class="modal__crumb">
              {{ crumb }}
              <span class="modal__crumb-sep">›</span>
              <span class="modal__crumb-current">{{ crumbCurrent }}</span>
            </p>
          </div>
          <button class="modal__icon-button" type="button" aria-label="Close" @click="emit('close')">
            <img :src="closeIcon" width="14" height="14" alt="" />
          </button>
        </header>

        <div class="modal__body">
          <label class="field">
            <span class="field__label">{{ nameLabel }}</span>
            <input ref="nameInput" v-model="name" class="field__input" type="text" />
          </label>

          <label v-if="includeDescription" class="field">
            <span class="field__label">Description</span>
            <textarea v-model="description" class="field__input field__textarea" rows="3" />
          </label>

          <div class="modal__row">
            <div class="field">
              <span class="field__label">Status</span>
              <div class="field__status">
                <button
                  ref="statusTrigger"
                  class="status-trigger"
                  type="button"
                  :aria-expanded="pickerOpen"
                  @click="togglePicker"
                >
                  <span
                    class="status-trigger__dot"
                    :class="{ 'status-trigger__dot--bordered': selectedOption.bordered }"
                    :style="{ background: selectedOption.color }"
                  />
                  {{ selectedOption.label }}
                </button>
                <Teleport to="body">
                  <StatusPicker
                    v-if="pickerOpen"
                    v-model="status"
                    class="status-trigger__popup"
                    :style="pickerStyle"
                    @close="closePicker"
                  />
                </Teleport>
              </div>
            </div>

            <label class="field">
              <span class="field__label">Date created</span>
              <span class="field__date">
                <img :src="calendarIcon" width="14" height="16" alt="" />
                <input v-model="createdAt" class="field__input field__input--date" type="date" />
              </span>
            </label>
          </div>
        </div>

        <footer class="modal__footer">
          <button class="modal__cancel" type="button" @click="emit('close')">Cancel</button>
          <button class="modal__save" type="button" :disabled="!canSave" @click="save">{{ submitLabel }}</button>
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
  width: min(560px, 100%);
  overflow: hidden;
  border-radius: var(--radius-modal);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
  border: 0;
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
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
}

.modal__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field__label {
  color: var(--color-text-subtle);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.55px;
  line-height: 16.5px;
  text-transform: uppercase;
}

.field__input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--color-input);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 14px;
}

.field__textarea {
  height: auto;
  min-height: 72px;
  padding: 12px 16px;
  resize: vertical;
}

.field__date {
  position: relative;
  display: block;
}

.field__date img {
  position: absolute;
  top: 16px;
  left: 16px;
  pointer-events: none;
}

.field__input--date {
  padding-left: 40px;
}

.field__status {
  position: relative;
}

.status-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 14px;
  text-align: left;
}

.status-trigger__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}

.status-trigger__dot--bordered {
  border: 1px solid var(--color-border);
}

.status-trigger__popup {
  max-height: inherit;
}

.modal__footer {
  justify-content: flex-end;
  gap: 12px;
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border);
}

.modal__cancel,
.modal__save {
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

.modal__save {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.modal__save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

  .modal__row {
    grid-template-columns: 1fr;
  }
}
</style>
