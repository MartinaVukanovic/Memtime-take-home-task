import { http } from './http'
import { toListQuery } from './listQuery'
import type { ListQueryParams, TimeEntry, TimeEntryFields } from './types'

export function listTimeEntries(query?: ListQueryParams, init?: RequestInit) {
  return http.getPaged<TimeEntry>('/time-entries', toListQuery(query), init)
}

export function createTimeEntry(taskId: string, fields: TimeEntryFields, init?: RequestInit) {
  return http.post<TimeEntry>(
    '/time-entries',
    {
      taskId,
      comment: fields.comment,
      start: fields.start,
      end: fields.end,
    },
    init,
  )
}

export function updateTimeEntry(
  id: string,
  taskId: string,
  fields: TimeEntryFields,
  init?: RequestInit,
) {
  return http.put<TimeEntry & { message: string }>(
    `/time-entries/${id}`,
    {
      taskId,
      comment: fields.comment,
      start: fields.start,
      end: fields.end,
    },
    init,
  )
}

export function deleteTimeEntry(id: string, init?: RequestInit) {
  return http.delete<{ message: string }>(`/time-entries/${id}`, init)
}
