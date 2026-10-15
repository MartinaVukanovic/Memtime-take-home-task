<script setup lang="ts">
import type { Client } from '../../api/types'
import { rememberClient } from '../../composables/entityCache'
import { useRowLink } from '../../composables/useRowLink'
import { displayName } from '../../utils/displayName'
import { formatDateTime } from '../../utils/formatDate'
import StatusBadge from '../ui/StatusBadge.vue'
import TruncatedText from '../ui/TruncatedText.vue'

const props = defineProps<{
  client: Client
}>()

const { activate, onRowKeydown } = useRowLink(`/clients/${props.client.id}/projects`)

function openClient() {
  rememberClient(props.client)
  return activate()
}

function onOpenKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    rememberClient(props.client)
  }
  onRowKeydown(event)
}
</script>

<template>
  <tr
    class="client-row entity-table__row--clickable"
    role="link"
    tabindex="0"
    @click="openClient()"
    @keydown="onOpenKeydown"
  >
    <td class="client-row__id entity-table__id">{{ client.id }}</td>
    <td class="client-row__name">
      <TruncatedText :text="displayName(client.name)" :max-chars="36" title="Name" />
    </td>
    <td class="client-row__description">
      <TruncatedText :text="client.description" :max-chars="48" title="Description" />
    </td>
    <td class="client-row__status">
      <StatusBadge :status="client.status" />
    </td>
    <td class="client-row__date entity-table__datetime">{{ formatDateTime(client.createdAt) }}</td>
    <td class="client-row__date entity-table__datetime">{{ formatDateTime(client.updatedAt) }}</td>
  </tr>
</template>

<style scoped>
.client-row td {
  border-top: 1px solid var(--color-border-row);
  vertical-align: middle;
}

.client-row:hover {
  background: var(--color-primary-row);
}

.client-row__id {
  padding: 18px 16px;
}

.client-row__name {
  padding: 18px 16px;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.client-row__status,
.client-row__date,
.client-row__description {
  padding: 18px 16px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 21px;
}

.client-row__date {
  padding: 18px 16px;
}

.client-row__description {
  max-width: 280px;
}

@media (max-width: 720px) {
  .client-row {
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

  .client-row td,
  .client-row:hover {
    background: transparent;
  }

  .client-row td {
    display: block;
    border: 0;
    padding: 4px 0;
    width: auto;
  }

  .client-row__id,
  .client-row__name,
  .client-row__status,
  .client-row__date,
  .client-row__description {
    flex: 1 1 100%;
    max-width: none;
    white-space: normal;
    word-break: break-all;
  }

  .client-row__name {
    order: -1;
  }

  .client-row__date::before,
  .client-row__status::before,
  .client-row__description::before,
  .client-row__id::before,
  .client-row__name::before {
    display: block;
    color: var(--color-text-subtle);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.55px;
    text-transform: uppercase;
  }

  .client-row__name::before {
    content: 'Name';
  }

  .client-row__id::before {
    content: 'ID';
  }

  .client-row__status::before {
    content: 'Status';
  }

  .client-row__description::before {
    content: 'Description';
  }

  .client-row__date:nth-child(5)::before {
    content: 'Created at';
  }

  .client-row__date:nth-child(6)::before {
    content: 'Updated at';
  }
}
</style>
