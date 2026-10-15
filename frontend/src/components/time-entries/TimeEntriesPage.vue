<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TimeEntry, TimeEntryFields } from '../../api/types'
import { useBreadcrumbClientProjectTask } from '../../composables/useBreadcrumbContext'
import { useTimeEntries } from '../../composables/useTimeEntries'
import { breadcrumbLabel } from '../../utils/displayName'
import AppLayout from '../layout/AppLayout.vue'
import EmptyState from '../ui/EmptyState.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'
import LoadingState from '../ui/LoadingState.vue'
import PaginationBar from '../ui/PaginationBar.vue'
import CreatePageButton from '../ui/CreatePageButton.vue'
import EntityToolbar from '../ui/EntityToolbar.vue'
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal.vue'
import LogTimeModal from '../ui/LogTimeModal.vue'
import TimeEntriesTable from './TimeEntriesTable.vue'

const route = useRoute()
const router = useRouter()
const clientId = computed(() => String(route.params.clientId ?? ''))
const projectId = computed(() => String(route.params.projectId ?? ''))
const taskId = computed(() => String(route.params.taskId ?? ''))

const { client, project, task, taskMissing, refreshBreadcrumbContext } =
  useBreadcrumbClientProjectTask(clientId, projectId, taskId)
const logging = shallowRef(false)
const editingEntry = ref<TimeEntry | null>(null)
const deletingEntry = ref<TimeEntry | null>(null)
const statusFilterUnused = shallowRef('all')

const {
  visibleEntries,
  totalCount,
  loading,
  error,
  searchQuery,
  sortBy,
  order,
  limit,
  hasNext,
  hasPrevious,
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  totalTracked,
  fetchEntries,
  goToPreviousPage,
  goToNextPage,
  setLimit,
  toggleSort,
  logTime,
  updateTime,
  removeTime,
} = useTimeEntries(taskId)

const showEmpty = computed(
  () =>
    !loading.value &&
    !error.value &&
    !searchQuery.value &&
    totalCount.value === 0,
)
const showNoMatches = computed(
  () => !loading.value && !error.value && !showEmpty.value && totalCount.value === 0,
)

watch([clientId, projectId, taskId], ([nextClientId, nextProjectId, nextTaskId]) => {
  if (!nextClientId || !nextProjectId || !nextTaskId) void router.replace('/clients')
})

function retryLoad() {
  void refreshBreadcrumbContext(true)
  void fetchEntries()
}

watch(loading, (isLoading) => {
  if (isLoading || error.value) return
  if (!client.value || !project.value || !task.value) void refreshBreadcrumbContext()
})

function openLogTime() {
  editingEntry.value = null
  logging.value = true
}

function openEdit(entry: TimeEntry) {
  editingEntry.value = entry
  logging.value = true
}

function closeModal() {
  logging.value = false
  editingEntry.value = null
}

function openDelete(entry: TimeEntry) {
  deletingEntry.value = entry
}

function closeDelete() {
  deletingEntry.value = null
}

function confirmDelete() {
  const entry = deletingEntry.value
  if (!entry) return
  void removeTime(entry.id).then((result) => {
    if (result.ok) {
      closeDelete()
    }
  })
}

function saveTimeEntry(
  payload: TimeEntryFields,
  done: (result: { ok: boolean; message: string }) => void,
) {
  const pending = editingEntry.value
  const request = pending ? updateTime(pending.id, payload) : logTime(payload)
  void request.then((result) => {
    done(result)
    if (result.ok) {
      closeModal()
    }
  })
}
</script>

<template>
  <AppLayout>
    <template #crumbs>
      <nav class="page-crumb" aria-label="Breadcrumb">
        <RouterLink to="/clients">Clients</RouterLink>
        <span class="page-crumb__sep" aria-hidden="true">/</span>
        <RouterLink :to="`/clients/${clientId}/projects`">
          {{ breadcrumbLabel(client) }}
        </RouterLink>
        <span class="page-crumb__sep" aria-hidden="true">/</span>
        <RouterLink :to="`/clients/${clientId}/projects/${projectId}/tasks`">
          {{ breadcrumbLabel(project) }}
        </RouterLink>
        <span class="page-crumb__sep" aria-hidden="true">/</span>
        <span class="page-crumb__current">{{ breadcrumbLabel(task) }}</span>
      </nav>
    </template>
    <main id="main" class="time-entries-page">
      <p v-if="taskMissing && !error" class="time-entries-page__missing">Task not found.</p>
      <template v-else>
        <header class="table-heading">
          <div>
            <p class="eyebrow">Task · {{ breadcrumbLabel(task) }}</p>
            <h1 class="page-title">Time entries</h1>
            <p class="page-aside">Total tracked: {{ totalTracked }}</p>
          </div>
        </header>

        <EntityToolbar
          v-model:search-query="searchQuery"
          v-model:status-filter="statusFilterUnused"
          :show-filter="false"
        >
          <CreatePageButton label="Log time" @click="openLogTime" />
        </EntityToolbar>

        <ErrorBanner v-if="error" :message="error" @retry="retryLoad" />
        <LoadingState v-if="loading && !error" message="Loading time entries…" />
        <div v-else-if="showEmpty" class="time-entries-page__empty">
          <EmptyState
            title="No time entries yet"
            description="Log time against this task to keep a record of work."
            cta-label="Log time"
            @create="openLogTime"
          />
        </div>
        <p v-else-if="showNoMatches" class="time-entries-page__no-matches">
          No time entries match the current search.
        </p>
        <template v-else-if="!error && !loading">
          <TimeEntriesTable
            :entries="visibleEntries"
            :sort-by="sortBy"
            :order="order"
            :client-name="client?.name ?? ''"
            :project-name="project?.name ?? ''"
            :task-name="task?.name ?? ''"
            @sort="toggleSort"
            @edit="openEdit"
            @delete="openDelete"
          />
          <PaginationBar
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :total="totalCount"
            :page="page"
            :page-count="pageCount"
            :has-next="hasNext"
            :has-previous="hasPrevious"
            :limit="limit"
            noun="time entries"
            @previous="goToPreviousPage"
            @next="goToNextPage"
            @update:limit="setLimit"
          />
        </template>
      </template>

      <LogTimeModal
        v-if="logging && task"
        :client-name="client?.name ?? 'Client'"
        :project-name="project?.name ?? 'Project'"
        :task-name="task.name"
        :entry="editingEntry"
        @close="closeModal"
        @save="saveTimeEntry"
      />

      <ConfirmDeleteModal
        v-if="deletingEntry && task"
        title="Delete time entry?"
        message="This time entry will be removed permanently. You can't undo this action."
        :client-name="client?.name ?? 'Client'"
        :project-name="project?.name ?? 'Project'"
        :task-name="task.name"
        @close="closeDelete"
        @confirm="confirmDelete"
      />
    </main>
  </AppLayout>
</template>

<style scoped>
.time-entries-page {
  display: flex;
  flex-direction: column;
}

.page-aside {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.time-entries-page__empty {
  padding: 24px 0;
}

.time-entries-page__no-matches,
.time-entries-page__missing {
  padding: 40px 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
