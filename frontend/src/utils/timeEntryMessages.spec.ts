import { describe, expect, it } from 'vitest'
import { createTimeEntrySuccessMessage, updateTimeEntrySuccessMessage } from './timeEntryMessages'

describe('timeEntryMessages', () => {
  it('includes the new entry id on create', () => {
    expect(createTimeEntrySuccessMessage({ id: 'abc-123' })).toBe(
      'Success: new time entry ID abc-123.',
    )
  })

  it('summarizes the updated entry on update', () => {
    const message = updateTimeEntrySuccessMessage({
      id: 'entry-1',
      taskId: 'task-9',
      userId: 'user',
      comment: 'Done',
      start: '2024-01-15T09:00:00.000Z',
      end: '2024-01-15T17:00:00.000Z',
      createdAt: '2024-01-15T17:05:00.000Z',
      updatedAt: '2024-01-15T17:20:00.000Z',
    })
    expect(message).toContain('entry-1')
    expect(message).toContain('task-9')
    expect(message).toContain('Done')
  })
})
