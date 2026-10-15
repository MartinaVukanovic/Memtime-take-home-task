<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { breadcrumbLabel } from '../../utils/displayName'
import { useBreadcrumbClient } from '../../composables/useBreadcrumbContext'
import { useProjects } from '../../composables/useProjects'
import AppLayout from '../layout/AppLayout.vue'
import EmptyState from '../ui/EmptyState.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'
import LoadingState from '../ui/LoadingState.vue'
import PaginationBar from '../ui/PaginationBar.vue'
import ProjectsTable from './ProjectsTable.vue'
import ProjectsToolbar from './ProjectsToolbar.vue'

const route = useRoute()
const router = useRouter()
const clientId = computed(() => String(route.params.clientId ?? ''))
const { client, refreshBreadcrumbContext } = useBreadcrumbClient(clientId)

const {
  visibleProjects,
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
  fetchProjects,
  goToPreviousPage,
  goToNextPage,
  setLimit,
  toggleSort,
} = useProjects(clientId)

const showEmpty = computed(
  () =>
    !loading.value &&
    !error.value &&
    !searchQuery.value &&
    statusFilter.value === 'all' &&
    totalCount.value === 0,
)
const showNoMatches = computed(
  () =>
    !loading.value &&
    !error.value &&
    !showEmpty.value &&
    totalCount.value === 0,
)

watch(clientId, (id) => {
  if (!id) void router.replace('/clients')
})

function retryLoad() {
  void refreshBreadcrumbContext(true)
  void fetchProjects()
}

watch(loading, (isLoading) => {
  if (isLoading || error.value) return
  if (!client.value) void refreshBreadcrumbContext()
})
</script>

<template>
  <AppLayout>
    <template #crumbs>
      <nav class="page-crumb" aria-label="Breadcrumb">
        <RouterLink to="/clients">Clients</RouterLink>
        <span class="page-crumb__sep" aria-hidden="true">/</span>
        <span class="page-crumb__current">{{ breadcrumbLabel(client) }}</span>
      </nav>
    </template>
    <main id="main" class="projects-page">
      <header class="table-heading">
        <div>
          <p class="eyebrow">Client · {{ breadcrumbLabel(client) }}</p>
          <h1 class="page-title">Projects</h1>
        </div>
      </header>

      <ProjectsToolbar v-model:search-query="searchQuery" v-model:status-filter="statusFilter" />

      <ErrorBanner v-if="error" :message="error" @retry="retryLoad" />
      <LoadingState v-if="loading && !error" message="Loading projects…" />
      <div v-else-if="showEmpty" class="projects-page__empty">
        <EmptyState
          title="No projects yet"
          description="Projects for this client will appear here once they exist in the API."
        />
      </div>
      <p v-else-if="showNoMatches" class="projects-page__no-matches">
        No projects match the current search or status filter.
      </p>
      <template v-else-if="!error && !loading">
        <ProjectsTable
          :projects="visibleProjects"
          :sort-by="sortBy"
          :order="order"
          :client-id="clientId"
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
          noun="projects"
          @previous="goToPreviousPage"
          @next="goToNextPage"
          @update:limit="setLimit"
        />
      </template>
    </main>
  </AppLayout>
</template>

<style scoped>
.projects-page {
  display: flex;
  flex-direction: column;
}

.projects-page__empty {
  padding: 24px 0;
}

.projects-page__no-matches {
  padding: 40px 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
