<script setup lang="ts">
import { computed } from 'vue'
import { useClients } from '../../composables/useClients'
import AppLayout from '../layout/AppLayout.vue'
import EmptyState from '../ui/EmptyState.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'
import LoadingState from '../ui/LoadingState.vue'
import PaginationBar from '../ui/PaginationBar.vue'
import ClientsTable from './ClientsTable.vue'
import ClientsToolbar from './ClientsToolbar.vue'

const {
  visibleClients,
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
  fetchClients,
  goToPreviousPage,
  goToNextPage,
  setLimit,
  toggleSort,
} = useClients()

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
</script>

<template>
  <AppLayout>
    <main id="main" class="clients-page">
      <header class="table-heading">
        <div>
          <h1 class="page-title">Clients</h1>
        </div>
      </header>

      <ClientsToolbar v-model:search-query="searchQuery" v-model:status-filter="statusFilter" />

      <ErrorBanner v-if="error" :message="error" @retry="fetchClients" />
      <LoadingState v-if="loading && !error" message="Loading clients…" />
      <div v-else-if="showEmpty" class="clients-page__empty">
        <EmptyState
          title="No clients yet"
          description="Clients from the API will show up here so you can open their projects and track time."
        />
      </div>
      <p v-else-if="showNoMatches" class="clients-page__no-matches">
        No clients match the current search or status filter.
      </p>
      <template v-else-if="!error && !loading">
        <ClientsTable
          :clients="visibleClients"
          :sort-by="sortBy"
          :order="order"
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
          noun="clients"
          @previous="goToPreviousPage"
          @next="goToNextPage"
          @update:limit="setLimit"
        />
      </template>
    </main>
  </AppLayout>
</template>

<style scoped>
.clients-page {
  display: flex;
  flex-direction: column;
}

.clients-page__empty {
  padding: 24px 0;
}

.clients-page__no-matches {
  padding: 40px 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
