<script setup lang="ts">
import type { SortOrder, Task, TaskSortField } from '../../api/types'
import TaskRow from './TaskRow.vue'

const props = defineProps<{
  tasks: Task[]
  sortBy: TaskSortField
  order: SortOrder
  clientId: string
  projectId: string
}>()

const emit = defineEmits<{
  sort: [field: TaskSortField]
}>()

const columns: { key: TaskSortField; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created at' },
  { key: 'updatedAt', label: 'Updated at' },
]

function sortHint(field: TaskSortField): 'none' | 'ascending' | 'descending' {
  if (props.sortBy !== field) return 'none'
  return props.order === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="table-wrap">
    <table class="tasks-table entity-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :aria-sort="sortHint(column.key)"
            scope="col"
          >
            <button class="tasks-table__sort" type="button" @click="emit('sort', column.key)">
              {{ column.label }}
              <span v-if="sortBy === column.key" class="tasks-table__arrow">
                {{ order === 'asc' ? '↑' : '↓' }}
              </span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <TaskRow
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :client-id="clientId"
          :project-id="projectId"
        />
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.tasks-table {
  width: 100%;
}

.tasks-table th {
  color: var(--color-text);
}

.tasks-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
}

.tasks-table__arrow {
  color: var(--color-primary);
}

</style>
