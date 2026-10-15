import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { isApiError } from '../api/errors'
import {
  createTimeEntry,
  deleteTimeEntry,
  listTimeEntries,
  updateTimeEntry,
} from '../api/timeEntries'
import type { TimeEntry, TimeEntryFields, TimeEntrySortField } from '../api/types'
import { durationMinutesLabel } from '../utils/formatDate'
import {
  createTimeEntrySuccessMessage,
  updateTimeEntrySuccessMessage,
} from '../utils/timeEntryMessages'
import { pushAppToast } from './useAppToast'
import { usePagedResource } from './usePagedResource'

export type { TimeEntrySortField } from '../api/types'

export function useTimeEntries(taskId: MaybeRefOrGetter<string>) {
  const list = usePagedResource<TimeEntry, TimeEntrySortField>({
    parentId: taskId,
    extraQuery: () => ({ taskId: toValue(taskId) }),
    load: (query, signal) => listTimeEntries(query, { signal }),
    defaultSortBy: 'createdAt',
    defaultOrder: 'desc',
    errorMessage: 'Unable to load time entries. Check your connection and try again.',
  })

  const totalTracked = computed(() => durationMinutesLabel(list.totalDurationMinutes.value))

  async function logTime(entry: TimeEntryFields): Promise<{ ok: boolean; message: string }> {
    const id = toValue(taskId)
    try {
      const created = await createTimeEntry(id, entry)
      const message = createTimeEntrySuccessMessage(created)
      pushAppToast(message, 'success')
      await list.fetchPage()
      return { ok: true, message }
    } catch (caught) {
      const message = isApiError(caught)
        ? caught.message || 'Unable to log time. Please try again.'
        : 'Unable to log time. Please try again.'
      pushAppToast(message, 'error')
      return { ok: false, message }
    }
  }

  async function removeTime(entryId: string): Promise<{ ok: boolean; message: string }> {
    try {
      const { message } = await deleteTimeEntry(entryId)
      const success = message || 'Time entry deleted successfully'
      pushAppToast(success, 'success')
      await list.fetchPage()
      return { ok: true, message: success }
    } catch (caught) {
      const failMessage = isApiError(caught)
        ? caught.message || 'Unable to delete time entry. Please try again.'
        : 'Unable to delete time entry. Please try again.'
      pushAppToast(failMessage, 'error')
      return { ok: false, message: failMessage }
    }
  }

  async function updateTime(
    entryId: string,
    fields: TimeEntryFields,
  ): Promise<{ ok: boolean; message: string }> {
    const id = toValue(taskId)
    try {
      const updated = await updateTimeEntry(entryId, id, fields)
      const { message: _serverMessage, ...entry } = updated
      const saved = entry as TimeEntry
      const success = updateTimeEntrySuccessMessage(saved)
      pushAppToast(success, 'success')
      await list.fetchPage()
      return { ok: true, message: success }
    } catch (caught) {
      const failMessage = isApiError(caught)
        ? caught.message || 'Unable to update time entry. Please try again.'
        : 'Unable to update time entry. Please try again.'
      pushAppToast(failMessage, 'error')
      return { ok: false, message: failMessage }
    }
  }

  return {
    allEntries: list.items,
    entries: list.items,
    visibleEntries: list.items,
    totalCount: list.totalCount,
    loading: list.loading,
    error: list.error,
    retryAfterMs: list.retryAfterMs,
    limit: list.limit,
    offset: list.offset,
    sortBy: list.sortBy,
    order: list.order,
    searchQuery: list.searchQuery,
    hasNext: list.hasNext,
    hasPrevious: list.hasPrevious,
    page: list.page,
    pageCount: list.pageCount,
    rangeStart: list.rangeStart,
    rangeEnd: list.rangeEnd,
    totalTracked,
    fetchEntries: list.fetchPage,
    goToPreviousPage: list.goToPreviousPage,
    goToNextPage: list.goToNextPage,
    setLimit: list.setLimit,
    toggleSort: list.toggleSort,
    logTime,
    updateTime,
    removeTime,
  }
}
