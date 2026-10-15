<script setup lang="ts">
import type { Task } from '../../api/types'
import { rememberTask } from '../../composables/entityCache'
import { useRowLink } from '../../composables/useRowLink'
import { displayName } from '../../utils/displayName'
import { formatDateTime } from '../../utils/formatDate'
import StatusBadge from '../ui/StatusBadge.vue'
import TruncatedText from '../ui/TruncatedText.vue'

const props = defineProps<{
  task: Task
  clientId: string
  projectId: string
}>()

const { activate, onRowKeydown } = useRowLink(
  `/clients/${props.clientId}/projects/${props.projectId}/tasks/${props.task.id}/time-entries`,
)

function openTask() {
  rememberTask(props.task)
  return activate()
}

function onOpenKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    rememberTask(props.task)
  }
  onRowKeydown(event)
}
</script>

<template>
  <tr
    class="task-row entity-table__row--clickable"
    role="link"
    tabindex="0"
    @click="openTask()"
    @keydown="onOpenKeydown"
  >
    <td class="task-row__id entity-table__id">{{ task.id }}</td>
    <td class="task-row__name">
      <TruncatedText :text="displayName(task.name)" :max-chars="36" title="Name" />
    </td>
    <td class="task-row__status">
      <StatusBadge :status="task.status" />
    </td>
    <td class="task-row__date entity-table__datetime">{{ formatDateTime(task.createdAt) }}</td>
    <td class="task-row__date entity-table__datetime">{{ formatDateTime(task.updatedAt) }}</td>
  </tr>
</template>

<style scoped>
.task-row td {
  border-top: 1px solid var(--color-border-row);
  vertical-align: middle;
}

.task-row:hover {
  background: var(--color-primary-row);
}

.task-row__id {
  padding: 18px 16px;
}

.task-row__name {
  padding: 18px 16px;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.task-row__status,
.task-row__date {
  padding: 18px 16px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 21px;
}

@media (max-width: 720px) {
  .task-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px 12px;
    position: relative;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid rgba(26, 117, 234, 0.12);
    border-radius: var(--radius-lg);
    background: var(--color-primary-row);
  }

  .task-row td,
  .task-row:hover {
    background: transparent;
  }

  .task-row td {
    display: block;
    border: 0;
    padding: 4px 0;
    width: auto;
  }

  .task-row__id,
  .task-row__name,
  .task-row__status,
  .task-row__date {
    flex: 1 1 100%;
    max-width: none;
    white-space: normal;
    word-break: break-all;
  }

  .task-row__name {
    order: -1;
  }

  .task-row__date::before,
  .task-row__status::before,
  .task-row__id::before,
  .task-row__name::before {
    display: block;
    color: var(--color-text-subtle);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.55px;
    text-transform: uppercase;
  }

  .task-row__name::before {
    content: 'Name';
  }

  .task-row__id::before {
    content: 'ID';
  }

  .task-row__status::before {
    content: 'Status';
  }

  .task-row__date:nth-child(4)::before {
    content: 'Created at';
  }

  .task-row__date:nth-child(5)::before {
    content: 'Updated at';
  }
}
</style>
