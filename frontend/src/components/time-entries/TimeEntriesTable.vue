<script setup lang="ts">
import type { SortOrder, TimeEntry, TimeEntrySortField } from '../../api/types'
import TimeEntryRow from './TimeEntryRow.vue'

const props = defineProps<{
  entries: TimeEntry[]
  sortBy: TimeEntrySortField
  order: SortOrder
  clientName: string
  projectName: string
  taskName: string
}>()

const emit = defineEmits<{
  sort: [field: TimeEntrySortField]
  edit: [entry: TimeEntry]
  delete: [entry: TimeEntry]
}>()

const columns: { key: TimeEntrySortField; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'taskId', label: 'Task ID' },
  { key: 'comment', label: 'Comment' },
  { key: 'start', label: 'Start' },
  { key: 'end', label: 'End' },
  { key: 'createdAt', label: 'Created at' },
]

function sortHint(field: TimeEntrySortField): 'none' | 'ascending' | 'descending' {
  if (props.sortBy !== field) return 'none'
  return props.order === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="table-wrap">
    <table class="time-entries-table time-entries-table--sticky-actions entity-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :aria-sort="sortHint(column.key)"
            scope="col"
          >
            <button class="time-entries-table__sort" type="button" @click="emit('sort', column.key)">
              {{ column.label }}
              <span v-if="sortBy === column.key" class="time-entries-table__arrow">
                {{ order === 'asc' ? '↑' : '↓' }}
              </span>
            </button>
          </th>
          <th class="time-entries-table__actions" scope="col">
            <span class="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <TimeEntryRow
          v-for="entry in entries"
          :key="entry.id"
          :entry="entry"
          :client-name="clientName"
          :project-name="projectName"
          :task-name="taskName"
          @edit="emit('edit', entry)"
          @delete="emit('delete', entry)"
        />
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.time-entries-table {
  width: 100%;
}

.time-entries-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.time-entries-table__arrow {
  color: var(--color-primary);
}

.time-entries-table__actions {
  min-width: 5.5rem;
  width: 5.5rem;
  padding: 0;
  text-align: right;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

</style>
