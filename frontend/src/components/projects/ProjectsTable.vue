<script setup lang="ts">
import type { Project, ProjectSortField, SortOrder } from '../../api/types'
import ProjectRow from './ProjectRow.vue'

const props = defineProps<{
  projects: Project[]
  sortBy: ProjectSortField
  order: SortOrder
  clientId: string
}>()

const emit = defineEmits<{
  sort: [field: ProjectSortField]
}>()

const columns: { key: ProjectSortField; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created at' },
  { key: 'updatedAt', label: 'Updated at' },
]

function sortHint(field: ProjectSortField): 'none' | 'ascending' | 'descending' {
  if (props.sortBy !== field) return 'none'
  return props.order === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="table-wrap">
    <table class="projects-table entity-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :aria-sort="sortHint(column.key)"
            scope="col"
          >
            <button class="projects-table__sort" type="button" @click="emit('sort', column.key)">
              {{ column.label }}
              <span v-if="sortBy === column.key" class="projects-table__arrow">
                {{ order === 'asc' ? '↑' : '↓' }}
              </span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <ProjectRow
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :client-id="clientId"
        />
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.projects-table {
  width: 100%;
}

.projects-table th {
  color: var(--color-text);
}

.projects-table__sort {
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

.projects-table__arrow {
  color: var(--color-primary);
}

</style>
