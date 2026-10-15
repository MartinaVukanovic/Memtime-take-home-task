import type { TimeEntry } from '../api/types'
import { formatDateTime } from './formatDate'

/** Task 3: success message with new entry ID (201 response body). */
export function createTimeEntrySuccessMessage(entry: Pick<TimeEntry, 'id'>): string {
  return `Success: new time entry ID ${entry.id}.`
}

/** Task 3: success message with the updated entry from the PUT response. */
export function updateTimeEntrySuccessMessage(entry: TimeEntry): string {
  return (
    `Time entry updated — ID ${entry.id}, task ID ${entry.taskId}, ` +
    `comment "${entry.comment}", start ${formatDateTime(entry.start)}, ` +
    `end ${formatDateTime(entry.end)}.`
  )
}
