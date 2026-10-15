<script setup lang="ts">
import gsap from 'gsap'
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import closeIcon from '../../assets/icons/close.svg'
import { motionDuration } from '../../utils/motion'
import { normalizeStatus, pickerOptionsFor, type StatusOption } from '../../utils/status'

const model = defineModel<string>({ required: true })

const emit = defineEmits<{
  close: []
}>()

function select(option: StatusOption) {
  model.value = option.value
  emit('close')
}

function isSelected(option: StatusOption) {
  return normalizeStatus(option.value) === normalizeStatus(model.value)
}

const rootRef = useTemplateRef<HTMLElement>('root')
let ctx: gsap.Context | null = null

onMounted(() => {
  const el = rootRef.value
  if (!el) return
  const duration = motionDuration(0.24)
  ctx = gsap.context(() => {
    if (duration === 0) {
      gsap.set(el, { autoAlpha: 1, y: 0 })
      return
    }
    gsap.fromTo(
      el,
      { y: -8, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration, ease: 'power2.out', clearProps: 'transform' },
    )
  })
})

onUnmounted(() => {
  ctx?.revert()
  ctx = null
})
</script>

<template>
  <div ref="root" class="status-picker" role="listbox" aria-label="Select status" @click.stop>
    <div class="status-picker__header">
      <p class="status-picker__title">Select Status</p>
      <button class="status-picker__close" type="button" aria-label="Close status picker" @click="emit('close')">
        <img :src="closeIcon" width="14" height="14" alt="" />
      </button>
    </div>
    <ul class="status-picker__list">
      <li v-for="option in pickerOptionsFor(model)" :key="option.value">
        <button
          class="status-picker__option"
          :class="{ 'status-picker__option--active': isSelected(option) }"
          type="button"
          role="option"
          :aria-selected="isSelected(option)"
          @click="select(option)"
        >
          <span
            class="status-picker__dot"
            :class="{ 'status-picker__dot--bordered': option.bordered }"
            :style="{ background: option.color }"
          />
          <span>{{ option.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.status-picker {
  display: flex;
  flex-direction: column;
  width: 280px;
  max-height: min(320px, 70vh);
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-modal);
  background: var(--color-bg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  z-index: 60;
}

.status-picker__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.status-picker__title {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.55px;
  line-height: 16.5px;
  text-transform: uppercase;
}

.status-picker__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
}

.status-picker__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 8px 0;
  overflow-y: auto;
  list-style: none;
  -webkit-overflow-scrolling: touch;
}

.status-picker__option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  line-height: 21px;
  text-align: left;
  cursor: pointer;
}

.status-picker__option--active {
  background: var(--color-bg-subtle);
  color: var(--color-text);
  font-weight: 600;
}

.status-picker__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.status-picker__dot--bordered {
  border: 1px solid var(--color-border);
}
</style>
