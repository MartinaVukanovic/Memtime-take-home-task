<script setup lang="ts">
import { STATUS_OPTIONS } from '../../utils/status'

const model = defineModel<string>({ default: 'all' })

function select(value: string) {
  model.value = value
}
</script>

<template>
  <div class="status-tabs" role="tablist" aria-label="Filter by status">
    <button
      class="status-tab"
      type="button"
      role="tab"
      :data-active="model === 'all'"
      :aria-selected="model === 'all'"
      @click="select('all')"
    >
      All
    </button>
    <button
      v-for="option in STATUS_OPTIONS"
      :key="option.value"
      class="status-tab"
      type="button"
      role="tab"
      :data-active="model === option.value"
      :aria-selected="model === option.value"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 4px;
  border-radius: 8px;
  background: var(--color-bg-subtle);
}

.status-tab {
  min-width: 68px;
  height: 34px;
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 400;
}

.status-tab[data-active='true'] {
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 720px) {
  .status-tab {
    min-width: 0;
    padding: 0 10px;
    font-size: 12px;
  }
}
</style>
