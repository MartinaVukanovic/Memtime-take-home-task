<script setup lang="ts">
import type { Project } from '../../api/types'
import { rememberProject } from '../../composables/entityCache'
import { useRowLink } from '../../composables/useRowLink'
import { displayName } from '../../utils/displayName'
import { formatDateTime } from '../../utils/formatDate'
import StatusBadge from '../ui/StatusBadge.vue'
import TruncatedText from '../ui/TruncatedText.vue'

const props = defineProps<{
  project: Project
  clientId: string
}>()

const { activate, onRowKeydown } = useRowLink(
  `/clients/${props.clientId}/projects/${props.project.id}/tasks`,
)

function openProject() {
  rememberProject(props.project)
  return activate()
}

function onOpenKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    rememberProject(props.project)
  }
  onRowKeydown(event)
}
</script>

<template>
  <tr
    class="project-row entity-table__row--clickable"
    role="link"
    tabindex="0"
    @click="openProject()"
    @keydown="onOpenKeydown"
  >
    <td class="project-row__id entity-table__id">{{ project.id }}</td>
    <td class="project-row__id entity-table__id">{{ project.clientId }}</td>
    <td class="project-row__name">
      <TruncatedText :text="displayName(project.name)" :max-chars="36" title="Name" />
    </td>
    <td class="project-row__status">
      <StatusBadge :status="project.status" />
    </td>
    <td class="project-row__date entity-table__datetime">{{ formatDateTime(project.createdAt) }}</td>
    <td class="project-row__date entity-table__datetime">{{ formatDateTime(project.updatedAt) }}</td>
  </tr>
</template>

<style scoped>
.project-row td {
  border-top: 1px solid var(--color-border-row);
  vertical-align: middle;
}

.project-row:hover {
  background: var(--color-primary-row);
}

.project-row__id {
  padding: 18px 16px;
}

.project-row__name {
  padding: 18px 16px;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.project-row__status,
.project-row__date {
  padding: 18px 16px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 21px;
  text-align: left;
}

@media (max-width: 720px) {
  .project-row {
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

  .project-row td,
  .project-row:hover {
    background: transparent;
  }

  .project-row td {
    display: block;
    border: 0;
    padding: 4px 0;
    width: auto;
  }

  .project-row__id,
  .project-row__name,
  .project-row__status,
  .project-row__date {
    flex: 1 1 100%;
    max-width: none;
    white-space: normal;
    word-break: break-all;
    text-align: left;
  }

  .project-row__name {
    order: -1;
  }

  .project-row__date::before,
  .project-row__status::before,
  .project-row__id::before,
  .project-row__name::before {
    display: block;
    color: var(--color-text-subtle);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.55px;
    text-transform: uppercase;
  }

  .project-row__name::before {
    content: 'Name';
  }

  .project-row td:nth-child(1)::before {
    content: 'ID';
  }

  .project-row td:nth-child(2)::before {
    content: 'Client ID';
  }

  .project-row__status::before {
    content: 'Status';
  }

  .project-row__date:nth-child(5)::before {
    content: 'Created at';
  }

  .project-row__date:nth-child(6)::before {
    content: 'Updated at';
  }
}
</style>
