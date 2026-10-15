<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbClientProject } from '../../composables/useBreadcrumbContext'
import { useTasks } from '../../composables/useTasks'
import { breadcrumbLabel } from '../../utils/displayName'
import AppLayout from '../layout/AppLayout.vue'
import EmptyState from '../ui/EmptyState.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'
import LoadingState from '../ui/LoadingState.vue'
import PaginationBar from '../ui/PaginationBar.vue'
import TasksTable from './TasksTable.vue'
import TasksToolbar from './TasksToolbar.vue'

const route = useRoute()
const router = useRouter()
const clientId = computed(() => String(route.params.clientId ?? ''))
const projectId = computed(() => String(route.params.projectId ?? ''))

const { client, project, refreshBreadcrumbContext } = useBreadcrumbClientProject(clientId, projectId)

const {
  visibleTasks,
  totalCount,
  loading,
  error,
  searchQuery,
  statusFilter,
  sortBy,
  order,
  limit,
  hasNext,
  hasPrevious,
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  fetchTasks,
  goToPreviousPage,
  goToNextPage,
  setLimit,
  toggleSort,
} = useTasks(projectId)

const showEmpty = computed(
  () =>
    !loading.value &&
    !error.value &&
    !searchQuery.value &&
    statusFilter.value === 'all' &&
    totalCount.value === 0,
)
const showNoMatches = computed(
  () => !loading.value && !error.value && !showEmpty.value && totalCount.value === 0,
)

watch([clientId, projectId], ([nextClientId, nextProjectId]) => {
  if (!nextClientId || !nextProjectId) void router.replace('/clients')
})

function retryLoad() {
  void refreshBreadcrumbContext(true)
  void fetchTasks()
}

watch(loading, (isLoading) => {
  if (isLoading || error.value) return
  if (!client.value || !project.value) void refreshBreadcrumbContext()
})
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
        <span class="page-crumb__current">{{ breadcrumbLabel(project) }}</span>
      </nav>
    </template>
    <main id="main" class="tasks-page">
      <header class="table-heading">
        <div>
          <p class="eyebrow">Project · {{ breadcrumbLabel(project) }}</p>
          <h1 class="page-title">Tasks</h1>
        </div>
      </header>

      <TasksToolbar v-model:search-query="searchQuery" v-model:status-filter="statusFilter" />

      <ErrorBanner v-if="error" :message="error" @retry="retryLoad" />
      <LoadingState v-if="loading && !error" message="Loading tasks…" />
      <div v-else-if="showEmpty" class="tasks-page__empty">
        <EmptyState
          title="No tasks yet"
          description="Tasks for this project will appear here once they exist in the API."
        />
      </div>
      <p v-else-if="showNoMatches" class="tasks-page__no-matches">
        No tasks match the current search or status filter.
      </p>
      <template v-else-if="!error && !loading">
        <TasksTable
          :tasks="visibleTasks"
          :sort-by="sortBy"
          :order="order"
          :client-id="clientId"
          :project-id="projectId"
          @sort="toggleSort"
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
          noun="tasks"
          @previous="goToPreviousPage"
          @next="goToNextPage"
          @update:limit="setLimit"
        />
      </template>
    </main>
  </AppLayout>
</template>

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
}

.tasks-page__empty {
  padding: 24px 0;
}

.tasks-page__no-matches {
  padding: 40px 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
