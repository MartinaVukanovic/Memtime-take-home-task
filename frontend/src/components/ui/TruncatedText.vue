<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { truncateText } from '../../utils/truncateText'
import TextDetailModal from './TextDetailModal.vue'

const props = withDefaults(
  defineProps<{
    text: string
    maxChars?: number
    title?: string
    empty?: string
    clientName?: string
    projectName?: string
    taskName?: string
  }>(),
  {
    maxChars: 48,
    title: 'Details',
    empty: '—',
  },
)

const open = shallowRef(false)
const preview = computed(() => truncateText(props.text, props.maxChars))
const display = computed(() => (preview.value.text ? preview.value.text : props.empty))
</script>

<template>
  <span class="truncated-text">
    <span class="truncated-text__preview">{{ display }}</span>
    <button
      v-if="preview.truncated"
      class="truncated-text__more"
      type="button"
      @click.stop="open = true"
    >
      … more
    </button>
    <TextDetailModal
      v-if="open"
      :title="title"
      :text="text"
      :client-name="clientName"
      :project-name="projectName"
      :task-name="taskName"
      @close="open = false"
    />
  </span>
</template>

<style scoped>
.truncated-text {
  display: inline;
}

.truncated-text__preview {
  word-break: break-word;
}

.truncated-text__more {
  margin-left: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  white-space: nowrap;
}
</style>
