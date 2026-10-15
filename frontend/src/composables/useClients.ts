import { listClients } from '../api/clients'
import type { Client, ClientSortField } from '../api/types'
import { rememberClients } from './entityCache'
import { usePagedResource } from './usePagedResource'

export function useClients() {
  const list = usePagedResource<Client, ClientSortField>({
    load: async (query, signal) => {
      const result = await listClients(query, { signal })
      rememberClients(result.items)
      return result
    },
    defaultSortBy: 'name',
    includeStatus: true,
    errorMessage: 'Unable to load clients. Check your connection and try again.',
  })

  return {
    allClients: list.items,
    clients: list.items,
    visibleClients: list.items,
    totalCount: list.totalCount,
    loading: list.loading,
    error: list.error,
    retryAfterMs: list.retryAfterMs,
    limit: list.limit,
    offset: list.offset,
    sortBy: list.sortBy,
    order: list.order,
    searchQuery: list.searchQuery,
    statusFilter: list.statusFilter,
    hasNext: list.hasNext,
    hasPrevious: list.hasPrevious,
    page: list.page,
    pageCount: list.pageCount,
    rangeStart: list.rangeStart,
    rangeEnd: list.rangeEnd,
    fetchClients: list.fetchPage,
    goToPreviousPage: list.goToPreviousPage,
    goToNextPage: list.goToNextPage,
    setLimit: list.setLimit,
    toggleSort: list.toggleSort,
  }
}
