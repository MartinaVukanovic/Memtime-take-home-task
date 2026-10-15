<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'
import calendarIcon from '../../assets/icons/calendar.svg'
import closeIcon from '../../assets/icons/close.svg'
import type { TimeEntry, TimeEntryFields } from '../../api/types'
import { useDialogEnterAnimation } from '../../composables/useDialogEnterAnimation'
import { displayName } from '../../utils/displayName'
import {
  durationLabel,
  parseTimeInput,
  toIsoFromDateAndTime,
  toLocalDateInputValue,
  toTimeInputValue,
} from '../../utils/formatDate'

const props = defineProps<{
  clientName: string
  projectName: string
  taskName: string
  entry?: TimeEntry | null
}>()

const emit = defineEmits<{
  close: []
  save: [payload: TimeEntryFields, done: (result: { ok: boolean; message: string }) => void]
}>()

const now = new Date()
const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
const initial = props.entry
const isEdit = Boolean(initial)

const comment = shallowRef(initial?.comment ?? '')
const startDate = shallowRef(toLocalDateInputValue(initial?.start ?? now.toISOString()))
const startTime = shallowRef(toTimeInputValue(initial?.start ?? now.toISOString()))
const endDate = shallowRef(
  toLocalDateInputValue(initial?.end ?? inOneHour.toISOString()),
)
const endTime = shallowRef(toTimeInputValue(initial?.end ?? inOneHour.toISOString()))
const saving = shallowRef(false)
const submitted = shallowRef(false)
const feedback = shallowRef<{ type: 'error'; message: string } | null>(null)
const commentInput = useTemplateRef<HTMLTextAreaElement>('commentInput')
const overlayRef = useTemplateRef<HTMLElement>('overlay')
const dialogRef = useTemplateRef<HTMLElement>('dialog')

useDialogEnterAnimation(overlayRef, dialogRef)

const startAtIso = computed(() => {
  const start = parseTimeInput(startTime.value)
  if (!start || !startDate.value) return null
  return toIsoFromDateAndTime(startDate.value, start.h, start.m)
})

const endAtIso = computed(() => {
  const end = parseTimeInput(endTime.value)
  if (!end || !endDate.value) return null
  return toIsoFromDateAndTime(endDate.value, end.h, end.m)
})

const rangeError = computed(() => {
  if (!startAtIso.value || !endAtIso.value) return 'Choose a start and an end date and time.'
  if (new Date(endAtIso.value).getTime() <= new Date(startAtIso.value).getTime()) {
    return 'Start date and time must be before the end.'
  }
  return null
})

const previewDuration = computed(() => {
  if (rangeError.value || !startAtIso.value || !endAtIso.value) return null
  return durationLabel(startAtIso.value, endAtIso.value)
})

const canSave = computed(
  () => comment.value.trim().length > 0 && !saving.value && !submitted.value && !rangeError.value,
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !saving.value) emit('close')
}

onMounted(() => {
  commentInput.value?.focus()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

function save() {
  if (submitted.value || saving.value || !canSave.value || !startAtIso.value || !endAtIso.value) {
    return
  }

  submitted.value = true
  saving.value = true
  feedback.value = null
  emit(
    'save',
    { comment: comment.value.trim(), start: startAtIso.value, end: endAtIso.value },
    (result) => {
      if (result.ok) {
        return
      }
      submitted.value = false
      saving.value = false
      feedback.value = { type: 'error', message: result.message }
    },
  )
}
</script>

<template>
  <Teleport to="body">
    <div ref="overlay" class="modal-overlay" @click.self="!saving && emit('close')">
      <div ref="dialog" class="modal" role="dialog" aria-modal="true" aria-labelledby="log-time-title">
        <header class="modal__header">
          <div>
            <h2 id="log-time-title" class="modal__title">
              {{ isEdit ? 'Edit time entry' : 'Log time entry' }}
            </h2>
            <p class="modal__crumb">
              {{ displayName(clientName) }}
              <span class="modal__crumb-sep">›</span>
              {{ displayName(projectName) }}
              <span class="modal__crumb-sep">›</span>
              <span class="modal__crumb-current">{{ displayName(taskName) }}</span>
            </p>
          </div>
          <button
            class="modal__icon-button"
            type="button"
            aria-label="Close"
            :disabled="saving"
            @click="!saving && emit('close')"
          >
            <img :src="closeIcon" width="14" height="14" alt="" />
          </button>
        </header>

        <div class="modal__body">
          <p v-if="feedback" class="modal__feedback modal__feedback--error" role="alert">
            {{ feedback.message }}
          </p>

          <label class="field">
            <span class="field__label">Comment</span>
            <textarea
              ref="commentInput"
              v-model="comment"
              class="field__input field__textarea"
              rows="3"
              placeholder="What did you work on?"
              :disabled="saving"
            />
          </label>

          <div class="time-block">
            <p class="time-block__title">Start</p>
            <p class="time-block__hint">Choose the date, then the time you started.</p>
            <div class="modal__row">
              <label class="field">
                <span class="field__label">Date</span>
                <span class="field__date">
                  <img :src="calendarIcon" width="14" height="16" alt="" />
                  <input
                    v-model="startDate"
                    class="field__input field__input--date"
                    type="date"
                    :disabled="saving"
                  />
                </span>
              </label>
              <label class="field">
                <span class="field__label">Time</span>
                <input
                  v-model="startTime"
                  class="field__input field__input--time"
                  type="time"
                  required
                  :disabled="saving"
                />
              </label>
            </div>
          </div>

          <div class="time-block">
            <p class="time-block__title">End</p>
            <p class="time-block__hint">Choose the date, then the time you finished.</p>
            <div class="modal__row">
              <label class="field">
                <span class="field__label">Date</span>
                <span class="field__date">
                  <img :src="calendarIcon" width="14" height="16" alt="" />
                  <input
                    v-model="endDate"
                    class="field__input field__input--date"
                    type="date"
                    :disabled="saving"
                  />
                </span>
              </label>
              <label class="field">
                <span class="field__label">Time</span>
                <input
                  v-model="endTime"
                  class="field__input field__input--time"
                  type="time"
                  required
                  :disabled="saving"
                />
              </label>
            </div>
          </div>

          <p v-if="rangeError" class="time-block__duration time-block__duration--warn" role="alert">
            {{ rangeError }}
          </p>
          <p v-else class="time-block__duration">Duration: {{ previewDuration }}</p>
        </div>

        <footer class="modal__footer">
          <button class="modal__cancel" type="button" :disabled="saving" @click="emit('close')">Cancel</button>
          <button class="modal__save" type="button" :disabled="!canSave" @click="save">
            {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log time' }}
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
  z-index: 50;
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
  gap: 20px;
  padding: 32px;
}

.modal__feedback {
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  line-height: 21px;
}

.modal__feedback--success {
  border: 1px solid #86efac;
  background: #f0fdf4;
  color: #166534;
}

.modal__feedback--error {
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #991b1b;
}

.time-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.time-block__title {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.time-block__hint {
  margin: -4px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 20px;
}

.time-block__duration {
  margin: 0;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.time-block__duration--warn {
  color: #b45309;
  font-weight: 500;
}

.modal__row {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
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
  border: 1px solid var(--color-border);
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

.field__input--time {
  font-variant-numeric: tabular-nums;
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
