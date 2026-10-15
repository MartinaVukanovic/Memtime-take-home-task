<script setup lang="ts">
import chevronRightIcon from '../../assets/icons/chevron-right.svg'

defineProps<{
  rangeStart: number
  rangeEnd: number
  total: number
  page: number
  pageCount: number
  hasNext: boolean
  hasPrevious: boolean
  limit: number
  noun: string
}>()

const emit = defineEmits<{
  previous: []
  next: []
  'update:limit': [value: number]
}>()

const pageSizes = [10, 20, 50]
</script>

<template>
  <div class="pagination">
    <div class="pagination__range">
      <span>{{ rangeStart }}–{{ rangeEnd }} of {{ total }} {{ noun }}</span>
      <div class="pagination__select-wrap">
        <select
          class="pagination__select"
          :value="limit"
          aria-label="Rows per page"
          @change="emit('update:limit', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }} / page</option>
        </select>
        <img
          class="pagination__select-chevron"
          :src="chevronRightIcon"
          width="8"
          height="12"
          alt=""
          aria-hidden="true"
        />
      </div>
    </div>
    <div class="pagination__nav" aria-label="Pagination">
      <button
        class="pagination__nav-btn"
        type="button"
        :disabled="!hasPrevious"
        aria-label="Previous page"
        @click="emit('previous')"
      >
        ‹
      </button>
      <span class="pagination__nav-label">{{ page }} / {{ pageCount }}</span>
      <button
        class="pagination__nav-btn"
        type="button"
        :disabled="!hasNext"
        aria-label="Next page"
        @click="emit('next')"
      >
        ›
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 12px;
}

.pagination__range {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.pagination__select-wrap {
  position: relative;
  display: inline-flex;
}

.pagination__select-chevron {
  position: absolute;
  top: 50%;
  right: 10px;
  pointer-events: none;
  transform: translateY(-50%) rotate(90deg);
}

.pagination__select {
  padding: 6px 30px 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.4;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.pagination__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination__nav-btn {
  padding: 4px 8px;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 18px;
  line-height: 1;
}

.pagination__nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pagination__nav-label {
  min-width: 3rem;
  text-align: center;
}
</style>
