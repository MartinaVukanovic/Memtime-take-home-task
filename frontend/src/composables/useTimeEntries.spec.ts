import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { useTimeEntries } from './useTimeEntries'

const listTimeEntries = vi.fn()

vi.mock('../api/timeEntries', () => ({
  listTimeEntries: (...args: unknown[]) => listTimeEntries(...args),
  createTimeEntry: vi.fn(),
  updateTimeEntry: vi.fn(),
  deleteTimeEntry: vi.fn(),
}))

vi.mock('./useAppToast', () => ({
  pushAppToast: vi.fn(),
}))

describe('useTimeEntries', () => {
  beforeEach(() => {
    listTimeEntries.mockReset()
    listTimeEntries.mockResolvedValue({ items: [], total: 0, totalDurationMinutes: 0 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads time entries for the current task from the API', async () => {
    const { visibleEntries, hasNext, totalTracked } = useTimeEntries('1')
    await flushPromises()

    expect(listTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: '1',
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        order: 'desc',
      }),
      expect.anything(),
    )
    expect(visibleEntries.value).toEqual([])
    expect(hasNext.value).toBe(false)
    expect(totalTracked.value).toBe('0m')
  })

  it('surfaces documented 404 errors instead of an empty list', async () => {
    listTimeEntries.mockRejectedValue(new ApiError('Unknown user', 404))
    const { visibleEntries, error } = useTimeEntries('1')
    await flushPromises()

    expect(visibleEntries.value).toEqual([])
    expect(error.value).toBe('Unknown user')
  })

  it('keeps resource-not-found API messages', async () => {
    listTimeEntries.mockRejectedValue(new ApiError('Time entry not found', 404))
    const { error } = useTimeEntries('1')
    await flushPromises()

    expect(error.value).toBe('Time entry not found')
  })

  it('returns the new entry id after create', async () => {
    const { createTimeEntry } = await import('../api/timeEntries')
    vi.mocked(createTimeEntry).mockResolvedValue({
      id: 'entry-99',
      taskId: '1',
      userId: 'key',
      comment: 'Work',
      start: '2024-01-15T09:00:00.000Z',
      end: '2024-01-15T17:00:00.000Z',
      createdAt: '2024-01-15T17:05:00.000Z',
      updatedAt: '2024-01-15T17:05:00.000Z',
    })

    const { logTime } = useTimeEntries('1')
    await flushPromises()

    const result = await logTime({
      comment: 'Work',
      start: '2024-01-15T09:00:00.000Z',
      end: '2024-01-15T17:00:00.000Z',
    })

    expect(result.ok).toBe(true)
    expect(result.message).toBe('Success: new time entry ID entry-99.')
    expect(listTimeEntries.mock.calls.length).toBeGreaterThan(1)
  })

  it('returns the updated entry summary after update', async () => {
    const { updateTimeEntry } = await import('../api/timeEntries')
    vi.mocked(updateTimeEntry).mockResolvedValue({
      message: 'Time entry updated successfully',
      id: 'entry-1',
      taskId: '1',
      userId: 'key',
      comment: 'Updated comment',
      start: '2024-01-15T09:30:00.000Z',
      end: '2024-01-15T17:30:00.000Z',
      createdAt: '2024-01-15T17:05:00.000Z',
      updatedAt: '2024-01-15T17:20:00.000Z',
    })

    const { updateTime } = useTimeEntries('1')
    await flushPromises()

    const result = await updateTime('entry-1', {
      comment: 'Updated comment',
      start: '2024-01-15T09:30:00.000Z',
      end: '2024-01-15T17:30:00.000Z',
    })

    expect(result.ok).toBe(true)
    expect(result.message).toContain('Time entry updated')
    expect(result.message).toContain('entry-1')
    expect(result.message).toContain('Updated comment')
  })

  it('refreshes the list after delete', async () => {
    const { deleteTimeEntry } = await import('../api/timeEntries')
    vi.mocked(deleteTimeEntry).mockResolvedValue({ message: 'Time entry deleted successfully' })

    const { removeTime } = useTimeEntries('1')
    await flushPromises()

    const result = await removeTime('entry-1')
    expect(result.ok).toBe(true)
    expect(result.message).toBe('Time entry deleted successfully')
    expect(deleteTimeEntry).toHaveBeenCalledWith('entry-1')
    expect(listTimeEntries.mock.calls.length).toBeGreaterThan(1)
  })
})
