import { toValue, type MaybeRefOrGetter } from 'vue'
import { listTasks } from '../api/tasks'
import type { Task, TaskSortField } from '../api/types'
import { rememberTasks } from './entityCache'
import { usePagedResource } from './usePagedResource'

export function useTasks(projectId: MaybeRefOrGetter<string>) {
  const list = usePagedResource<Task, TaskSortField>({
    parentId: projectId,
    load: async (query, signal) => {
      const result = await listTasks(toValue(projectId), query, { signal })
      rememberTasks(result.items)
      return result
    },
    defaultSortBy: 'name',
    includeStatus: true,
    errorMessage: 'Unable to load tasks. Check your connection and try again.',
  })

  return {
    allTasks: list.items,
    tasks: list.items,
    visibleTasks: list.items,
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
    fetchTasks: list.fetchPage,
    goToPreviousPage: list.goToPreviousPage,
    goToNextPage: list.goToNextPage,
    setLimit: list.setLimit,
    toggleSort: list.toggleSort,
  }
}
