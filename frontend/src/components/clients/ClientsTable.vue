<script setup lang="ts">
import type { Client, ClientSortField, SortOrder } from '../../api/types'
import ClientRow from './ClientRow.vue'

const props = defineProps<{
  clients: Client[]
  sortBy: ClientSortField
  order: SortOrder
}>()

const emit = defineEmits<{
  sort: [field: ClientSortField]
}>()

const columns: { key: ClientSortField | 'description'; label: string; sortable: boolean }[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created at', sortable: true },
  { key: 'updatedAt', label: 'Updated at', sortable: true },
]

function sortHint(field: ClientSortField): 'none' | 'ascending' | 'descending' {
  if (props.sortBy !== field) return 'none'
  return props.order === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="table-wrap">
    <table class="clients-table entity-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :aria-sort="column.sortable ? sortHint(column.key as ClientSortField) : undefined"
            scope="col"
          >
            <button
              v-if="column.sortable"
              class="clients-table__sort"
              type="button"
              @click="emit('sort', column.key as ClientSortField)"
            >
              {{ column.label }}
              <span v-if="sortBy === column.key" class="clients-table__arrow">
                {{ order === 'asc' ? '↑' : '↓' }}
              </span>
            </button>
            <span v-else>{{ column.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <ClientRow v-for="client in clients" :key="client.id" :client="client" />
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.clients-table {
  width: 100%;
}

.clients-table th {
  color: var(--color-text);
}

.clients-table__sort {
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

.clients-table__arrow {
  color: var(--color-primary);
}

</style>
