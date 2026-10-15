<script setup lang="ts">
import gsap from 'gsap'
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { Project, Task, TimeEntry } from '../../api/types'
import calendarIcon from '../../assets/icons/calendar.svg'
import closeIcon from '../../assets/icons/close.svg'
import createPlusIcon from '../../assets/icons/create-plus.svg'
import filterIcon from '../../assets/icons/filter.svg'
import moreIcon from '../../assets/icons/more.svg'
import navFolderIcon from '../../assets/icons/nav-folder.svg'
import chevronRightIcon from '../../assets/icons/chevron-right.svg'
import { displayName } from '../../utils/displayName'
import { durationLabel, formatDateTime, totalDurationLabel } from '../../utils/formatDate'
import { motionDuration } from '../../utils/motion'
import RowActionMenu from '../clients/RowActionMenu.vue'
import StatusBadge from '../ui/StatusBadge.vue'
import TruncatedText from '../ui/TruncatedText.vue'

const props = defineProps<{
  task: Task
  project: Project
  timeEntries: TimeEntry[]
  entriesLoading?: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: []
  delete: []
  'add-entry': []
}>()

const menuOpen = shallowRef(false)
const entryPage = shallowRef(1)
const pageSize = 5

const totalLogged = computed(() => totalDurationLabel(props.timeEntries))

const totalPages = computed(() => Math.max(1, Math.ceil(props.timeEntries.length / pageSize)))

const visibleEntries = computed(() => {
  const start = (entryPage.value - 1) * pageSize
  return props.timeEntries.slice(start, start + pageSize)
})

const backdropRef = useTemplateRef<HTMLButtonElement>('backdrop')
const drawerRef = useTemplateRef<HTMLElement>('drawer')
const entryListRef = useTemplateRef<HTMLUListElement>('entryList')
const totalLoggedRef = useTemplateRef<HTMLParagraphElement>('totalLogged')

const knownEntryIds = new Set<string>()
let gsapCtx: gsap.Context | null = null

function animatePanelOpen() {
  const backdrop = backdropRef.value
  const drawer = drawerRef.value
  if (!backdrop || !drawer) return

  const duration = motionDuration(0.38)
  gsap.killTweensOf([backdrop, drawer])
  gsap.set(drawer, { clearProps: 'transform' })

  if (duration === 0) {
    gsap.set(backdrop, { autoAlpha: 1 })
    gsap.set(drawer, { x: 0, autoAlpha: 1 })
    return
  }

  gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.28, ease: 'power1.out' })
  gsap.fromTo(
    drawer,
    { x: 28, autoAlpha: 0 },
    { x: 0, autoAlpha: 1, duration, ease: 'power2.out' },
  )
}

function animateTimeEntryAdded(entryIds: string[]) {
  if (entryIds.length === 0) return

  const duration = motionDuration(0.32)
  const list = entryListRef.value
  const totalEl = totalLoggedRef.value

  void nextTick(() => {
    if (duration === 0) return

    const rows = entryIds
      .map((id) => list?.querySelector<HTMLElement>(`[data-entry-id="${id}"]`))
      .filter((el): el is HTMLElement => el !== null)

    if (rows.length > 0) {
      gsap.fromTo(
        rows,
        { y: 12, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' },
      )
    }

    if (totalEl) {
      gsap.fromTo(
        totalEl,
        { scale: 1 },
        { scale: 1.03, duration: 0.14, ease: 'power1.out', yoyo: true, repeat: 1 },
      )
    }
  })
}

function seedEntryIds(entries: TimeEntry[]) {
  knownEntryIds.clear()
  for (const entry of entries) knownEntryIds.add(entry.id)
}

function trackNewEntries(entries: TimeEntry[]) {
  const added = entries.filter((entry) => !knownEntryIds.has(entry.id)).map((entry) => entry.id)
  for (const entry of entries) knownEntryIds.add(entry.id)
  animateTimeEntryAdded(added)
}

watch(totalPages, (pages) => {
  if (entryPage.value > pages) entryPage.value = pages
})

watch(
  () => props.task.id,
  () => {
    menuOpen.value = false
    entryPage.value = 1
    seedEntryIds(props.timeEntries)
    void nextTick(() => animatePanelOpen())
  },
)

watch(
  () => props.timeEntries,
  (entries) => trackNewEntries(entries),
  { deep: true },
)

let outsideMenuListener: ((event: MouseEvent) => void) | null = null

function removeOutsideMenuListener() {
  if (!outsideMenuListener) return
  document.removeEventListener('click', outsideMenuListener, true)
  outsideMenuListener = null
}

function onEdit() {
  menuOpen.value = false
  emit('edit')
}

function onDelete() {
  menuOpen.value = false
  emit('delete')
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

watch(menuOpen, (open) => {
  removeOutsideMenuListener()
  if (!open) return

  outsideMenuListener = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('.task-panel__menu-wrap')) return
    menuOpen.value = false
  }

  requestAnimationFrame(() => {
    if (!menuOpen.value || !outsideMenuListener) return
    document.addEventListener('click', outsideMenuListener, true)
  })
})

onMounted(() => {
  gsapCtx = gsap.context(() => {
    seedEntryIds(props.timeEntries)
    void nextTick(() => animatePanelOpen())
  })
})

onUnmounted(() => {
  removeOutsideMenuListener()
  gsapCtx?.revert()
  gsapCtx = null
})

function goPrevPage() {
  entryPage.value = Math.max(1, entryPage.value - 1)
}

function goNextPage() {
  entryPage.value = Math.min(totalPages.value, entryPage.value + 1)
}
</script>

<template>
  <Teleport to="body">
    <div class="task-panel" role="presentation">
      <button
        ref="backdrop"
        class="task-panel__backdrop"
        type="button"
        aria-label="Close task details"
        @click="emit('close')"
      />

      <aside
        ref="drawer"
        class="task-panel__drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-panel-title"
      >
        <header class="task-panel__top">
          <h2 id="task-panel-title" class="task-panel__title">
            <TruncatedText :text="displayName(task.name)" :max-chars="42" title="Task name" />
          </h2>
          <div class="task-panel__top-actions">
            <div class="task-panel__menu-wrap">
              <button
                class="task-panel__icon-btn"
                type="button"
                :aria-expanded="menuOpen"
                aria-haspopup="menu"
                aria-label="Task actions"
                @click.stop="toggleMenu"
              >
                <img :src="moreIcon" width="14" height="16" alt="" />
              </button>
              <RowActionMenu v-if="menuOpen" class="task-panel__action-menu" @edit="onEdit" @delete="onDelete" />
            </div>
            <button class="task-panel__icon-btn" type="button" aria-label="Close" @click="emit('close')">
              <img :src="closeIcon" width="14" height="14" alt="" />
            </button>
          </div>
        </header>

        <div class="task-panel__body">
          <div class="task-panel__details">
          <div class="task-panel__rows">
            <div class="task-panel__row">
              <span class="task-panel__row-label">
                <img :src="filterIcon" width="12" height="12" alt="" />
                Status
              </span>
              <StatusBadge :status="task.status" />
            </div>
            <div class="task-panel__row">
              <span class="task-panel__row-label">
                <img :src="calendarIcon" width="14" height="16" alt="" />
                Created At
              </span>
              <span class="task-panel__row-value">{{ formatDateTime(task.createdAt) }}</span>
            </div>
            <div class="task-panel__row">
              <span class="task-panel__row-label">
                <img :src="calendarIcon" width="14" height="16" alt="" />
                Updated At
              </span>
              <span class="task-panel__row-value">{{ formatDateTime(task.updatedAt) }}</span>
            </div>
            <div class="task-panel__row">
              <span class="task-panel__row-label">
                <img :src="navFolderIcon" width="11" height="10" alt="" />
                Project
              </span>
              <span class="task-panel__project">
                <img :src="navFolderIcon" width="11" height="10" alt="" />
                {{ displayName(project.name) }}
              </span>
            </div>
          </div>
          </div>

          <section class="task-panel__entries" aria-labelledby="task-panel-entries-title">
            <div class="task-panel__entries-header">
              <div class="task-panel__entries-heading">
                <h3 id="task-panel-entries-title" class="task-panel__entries-title">Time Entries</h3>
                <p ref="totalLogged" class="task-panel__logged">Total time: {{ totalLogged }}</p>
              </div>
              <button class="task-panel__add-entry" type="button" @click="emit('add-entry')">
                <img :src="createPlusIcon" width="14" height="16" alt="" />
                Add Entry
              </button>
            </div>

            <p v-if="entriesLoading" class="task-panel__entries-empty">Loading time entries…</p>
            <template v-else>
              <ul v-if="timeEntries.length > 0" ref="entryList" class="task-panel__entry-list">
                <li
                  v-for="entry in visibleEntries"
                  :key="entry.id"
                  class="task-panel__entry"
                  :data-entry-id="entry.id"
                >
                  <span class="task-panel__avatar" aria-hidden="true">ME</span>
                  <div class="task-panel__entry-main">
                    <TruncatedText
                      class="task-panel__entry-title"
                      :text="entry.comment"
                      :max-chars="64"
                      title="Comment"
                    />
                    <p class="task-panel__entry-date">{{ formatDateTime(entry.start) }}</p>
                  </div>
                  <div class="task-panel__entry-side">
                    <span class="task-panel__entry-duration">{{ durationLabel(entry.start, entry.end) }}</span>
                    <span class="task-panel__entry-status">LOGGED</span>
                  </div>
                </li>
              </ul>
              <p v-else class="task-panel__entries-empty">No time logged yet. Add an entry to get started.</p>

              <div v-if="timeEntries.length > pageSize" class="task-panel__pagination">
                <button type="button" :disabled="entryPage <= 1" @click="goPrevPage">‹</button>
                <span>{{ entryPage }} of {{ totalPages }}</span>
                <button type="button" :disabled="entryPage >= totalPages" @click="goNextPage">
                  <img :src="chevronRightIcon" width="8" height="12" alt="" />
                </button>
              </div>
            </template>
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.task-panel {
  position: fixed;
  inset: 0;
  z-index: 35;
  display: flex;
  justify-content: flex-end;
  padding: 20px 20px 20px 0;
  pointer-events: none;
}

.task-panel__backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: var(--color-overlay);
  cursor: default;
  pointer-events: auto;
  visibility: hidden;
  opacity: 0;
}

.task-panel__drawer {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: min(520px, 100%);
  max-height: 100%;
  overflow: visible;
  border-radius: var(--radius-modal);
  background: var(--color-bg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.task-panel__top {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.task-panel__title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 30px;
}

.task-panel__top-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

.task-panel__menu-wrap {
  position: relative;
  z-index: 5;
}

.task-panel__menu-wrap :deep(.action-menu) {
  top: calc(100% + 6px);
  right: 0;
  z-index: 50;
}

.task-panel__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
}

.task-panel__icon-btn:hover {
  background: var(--color-bg-subtle);
}

.task-panel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: var(--color-bg);
}

.task-panel__details {
  flex-shrink: 0;
  padding: 24px 24px 20px;
}

.task-panel__rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.task-panel__row-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 21px;
}

.task-panel__row-value {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 21px;
  text-align: right;
}

.task-panel__project {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.task-panel__entries {
  flex: 1;
  min-height: 0;
  margin-top: 4px;
  padding: 20px 24px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}

.task-panel__entries-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.task-panel__entries-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.task-panel__entries-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.task-panel__logged {
  margin: 0;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.task-panel__add-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.task-panel__entry-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.task-panel__entry {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-row);
}

.task-panel__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: #e5e7eb;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.task-panel__entry-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.task-panel__entry-date {
  margin: 2px 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 18px;
}

.task-panel__entry-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.task-panel__entry-duration {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.task-panel__entry-status {
  color: #16a34a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.task-panel__entries-empty {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 21px;
}

.task-panel__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.task-panel__pagination button {
  padding: 4px 8px;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
}

.task-panel__pagination button:disabled {
  opacity: 0.4;
}

@media (max-width: 720px) {
  .task-panel {
    padding: 0;
  }

  .task-panel__drawer {
    width: 100%;
    max-height: 100%;
    height: 100%;
    border-radius: 0;
  }
}
</style>
