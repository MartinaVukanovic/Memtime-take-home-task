<script setup lang="ts">
import { computed } from 'vue'
import { normalizeStatus, statusOptionFor } from '../../utils/status'

const props = defineProps<{
  status: string
}>()

const option = computed(() => statusOptionFor(props.status))
const dataStatus = computed(() => normalizeStatus(props.status))
</script>

<template>
  <span class="status-badge" :data-status="dataStatus">{{ option.label }}</span>
</template>

<style scoped>
.status-badge {
  --c: var(--st-gray);
  --b: var(--st-gray-bg);
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  border-radius: 5px;
  padding: 5px 9px;
  font-size: 13px;
  font-weight: 400;
  color: var(--c);
  background: var(--b);
}

.status-badge[data-status='active'],
.status-badge[data-status='completed'],
.status-badge[data-status='done'] {
  --c: var(--st-green);
  --b: var(--st-green-bg);
}

.status-badge[data-status='pending'] {
  --c: var(--st-blue);
  --b: var(--st-blue-bg);
}

.status-badge[data-status='draft'] {
  --c: var(--st-violet);
  --b: var(--st-violet-bg);
}

.status-badge[data-status='urgent'] {
  --c: var(--st-red);
  --b: var(--st-red-bg);
}

.status-badge[data-status='attention'] {
  --c: var(--st-amber);
  --b: var(--st-amber-bg);
}

.status-badge[data-status='archived'] {
  --c: var(--st-gray);
  --b: var(--st-gray-bg);
}
</style>
