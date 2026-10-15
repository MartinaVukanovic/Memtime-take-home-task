<script setup lang="ts">
import { onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { TimeEntry } from '../../api/types'
import moreIcon from '../../assets/icons/more.svg'
import { useAnchoredMenu } from '../../composables/useAnchoredMenu'
import { formatDateTime } from '../../utils/formatDate'
import RowActionMenu from '../clients/RowActionMenu.vue'
import TruncatedText from '../ui/TruncatedText.vue'

defineProps<{
  entry: TimeEntry
  clientName: string
  projectName: string
  taskName: string
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const menuOpen = shallowRef(false)
const menuBtnRef = useTemplateRef<HTMLButtonElement>('menuBtn')
const { menuStyle, bindListeners, unbindListeners } = useAnchoredMenu(menuBtnRef)
let outsideMenuListener: ((event: MouseEvent) => void) | null = null

function removeOutsideMenuListener() {
  if (!outsideMenuListener) return
  document.removeEventListener('click', outsideMenuListener, true)
  outsideMenuListener = null
}

function openEdit() {
  menuOpen.value = false
  emit('edit')
}

function openDelete() {
  menuOpen.value = false
  emit('delete')
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

watch(menuOpen, (open) => {
  removeOutsideMenuListener()
  if (!open) {
    unbindListeners()
    return
  }

  bindListeners()

  outsideMenuListener = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('.time-entry-row__menu-wrap')) return
    if (target.closest('.action-menu')) return
    menuOpen.value = false
  }
  document.addEventListener('click', outsideMenuListener, true)
})

onUnmounted(() => {
  removeOutsideMenuListener()
  unbindListeners()
})

function onRowKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openEdit()
  }
}
</script>

<template>
  <tr
    class="time-entry-row entity-table__row--clickable"
    tabindex="0"
    @click="openEdit"
    @keydown="onRowKeydown"
  >
    <td class="time-entry-row__id entity-table__id">{{ entry.id }}</td>
    <td class="time-entry-row__id entity-table__id">{{ entry.taskId }}</td>
    <td class="time-entry-row__comment">
      <TruncatedText
        :text="entry.comment || '—'"
        :max-chars="48"
        title="Comment"
        :client-name="clientName"
        :project-name="projectName"
        :task-name="taskName"
      />
    </td>
    <td class="time-entry-row__date entity-table__datetime">{{ formatDateTime(entry.start) }}</td>
    <td class="time-entry-row__date entity-table__datetime">{{ formatDateTime(entry.end) }}</td>
    <td class="time-entry-row__date entity-table__datetime">{{ formatDateTime(entry.createdAt) }}</td>
    <td class="time-entry-row__actions">
      <div class="time-entry-row__menu-wrap">
        <button
          ref="menuBtn"
          class="time-entry-row__menu-btn"
          type="button"
          :aria-expanded="menuOpen"
          aria-haspopup="menu"
          aria-label="Time entry actions"
          @click.stop="toggleMenu"
        >
          <img :src="moreIcon" width="14" height="16" alt="" />
        </button>
        <RowActionMenu
          v-if="menuOpen"
          floating
          :menu-position="menuStyle"
          @edit="openEdit"
          @delete="openDelete"
        />
      </div>
    </td>
  </tr>
</template>

<style scoped>
.time-entry-row td {
  border-top: 1px solid var(--color-border-row);
  vertical-align: middle;
}

.time-entry-row:hover {
  background: var(--color-primary-row);
}

.time-entry-row__id {
  padding: 18px 16px;
}

.time-entry-row__comment {
  padding: 18px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  max-width: 320px;
}

.time-entry-row__date {
  padding: 18px 16px;
}

.time-entry-row__actions {
  padding: 12px 16px;
  text-align: right;
  white-space: nowrap;
}

.time-entry-row__menu-wrap {
  position: relative;
  display: inline-flex;
  justify-content: flex-end;
}

.time-entry-row__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  transition: background-color 0.25s ease;
}

.time-entry-row__menu-btn:hover {
  background: #eef2ff;
}

@media (max-width: 720px) {
  .time-entry-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid rgba(26, 117, 234, 0.12);
    border-radius: var(--radius-lg);
    background: var(--color-primary-row);
  }

  .time-entry-row td,
  .time-entry-row:hover {
    background: transparent;
  }

  .time-entry-row td {
    display: block;
    border: 0;
    padding: 4px 0;
    width: auto;
  }

  .time-entry-row__id,
  .time-entry-row__comment,
  .time-entry-row__date,
  .time-entry-row__actions {
    flex: 1 1 100%;
    max-width: none;
    white-space: normal;
    word-break: break-all;
  }

  .time-entry-row__comment {
    order: -1;
  }

  .time-entry-row__date::before,
  .time-entry-row__id::before,
  .time-entry-row__comment::before,
  .time-entry-row__actions::before {
    display: block;
    color: var(--color-text-subtle);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.55px;
    text-transform: uppercase;
  }

  .time-entry-row__comment::before {
    content: 'Comment';
  }

  .time-entry-row__actions::before {
    content: 'Actions';
  }

  .time-entry-row td:nth-child(1)::before {
    content: 'ID';
  }

  .time-entry-row td:nth-child(2)::before {
    content: 'Task ID';
  }

  .time-entry-row td:nth-child(4)::before {
    content: 'Start';
  }

  .time-entry-row td:nth-child(5)::before {
    content: 'End';
  }

  .time-entry-row td:nth-child(6)::before {
    content: 'Created at';
  }
}
</style>
