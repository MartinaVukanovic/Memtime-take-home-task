<script setup lang="ts">
import { ref } from 'vue'
import chevronRightIcon from '../../assets/icons/chevron-right.svg'
import filterIcon from '../../assets/icons/filter.svg'
import { STATUS_OPTIONS } from '../../utils/status'
import SearchField from './SearchField.vue'

const searchQuery = defineModel<string>('searchQuery', { required: true })
const statusFilter = defineModel<string>('statusFilter', { default: 'all' })

withDefaults(
  defineProps<{
    placeholder?: string
    showFilter?: boolean
    showStatusFilter?: boolean
  }>(),
  { placeholder: 'Search', showFilter: true, showStatusFilter: true },
)

const filtersOpen = ref(false)

function resetFilters() {
  statusFilter.value = 'all'
  searchQuery.value = ''
}
</script>

<template>
  <div class="entity-toolbar">
    <div class="table-toolbar">
      <SearchField v-model="searchQuery" :placeholder="placeholder" />
      <div class="table-toolbar__actions">
        <button
          v-if="showFilter"
          class="filter-button"
          type="button"
          :data-active="filtersOpen"
          :aria-expanded="filtersOpen"
          aria-label="Filter"
          @click="filtersOpen = !filtersOpen"
        >
          <img :src="filterIcon" width="16" height="16" alt="" />
          Filter
        </button>
        <slot />
      </div>
    </div>
    <div v-if="showFilter && filtersOpen" class="filter-strip">
      <label v-if="showStatusFilter" class="filter-strip__status">
        Status
        <div class="filter-strip__select-wrap">
          <select v-model="statusFilter" class="filter-strip__select" aria-label="Filter by status">
            <option value="all">All</option>
            <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <img
            class="filter-strip__select-chevron"
            :src="chevronRightIcon"
            width="8"
            height="12"
            alt=""
            aria-hidden="true"
          />
        </div>
      </label>
      <span v-else />
      <button class="filter-strip__reset" type="button" @click="resetFilters">Reset</button>
    </div>
  </div>
</template>

<style scoped>
.table-toolbar {
  margin-bottom: 0;
}

.entity-toolbar {
  margin-bottom: 24px;
}

.table-toolbar__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.filter-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
}

.filter-button[data-active='true'] {
  background: var(--color-bg-subtle);
}

.filter-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0 4px;
}

.filter-strip__status {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.filter-strip__select-wrap {
  position: relative;
  display: inline-flex;
}

.filter-strip__select-chevron {
  position: absolute;
  top: 50%;
  right: 10px;
  pointer-events: none;
  transform: translateY(-50%) rotate(90deg);
}

.filter-strip__select {
  min-width: 120px;
  padding: 8px 30px 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.filter-strip__reset {
  padding: 6px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 500;
}

.filter-strip__reset:hover {
  background: var(--color-bg-subtle);
}

@media (max-width: 720px) {
  .table-toolbar__actions {
    gap: 6px;
  }

  .filter-button {
    padding: 0 9px;
  }
}
</style>
