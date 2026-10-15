import { toValue, type MaybeRefOrGetter } from 'vue'
import { listProjects } from '../api/projects'
import type { Project, ProjectSortField } from '../api/types'
import { rememberProjects } from './entityCache'
import { usePagedResource } from './usePagedResource'

export function useProjects(clientId: MaybeRefOrGetter<string>) {
  const list = usePagedResource<Project, ProjectSortField>({
    parentId: clientId,
    load: async (query, signal) => {
      const result = await listProjects(toValue(clientId), query, { signal })
      rememberProjects(result.items)
      return result
    },
    defaultSortBy: 'name',
    includeStatus: true,
    errorMessage: 'Unable to load projects. Check your connection and try again.',
  })

  return {
    allProjects: list.items,
    projects: list.items,
    visibleProjects: list.items,
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
    fetchProjects: list.fetchPage,
    goToPreviousPage: list.goToPreviousPage,
    goToNextPage: list.goToNextPage,
    setLimit: list.setLimit,
    toggleSort: list.toggleSort,
  }
}
