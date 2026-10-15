import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { useTasks } from './useTasks'

const listTasks = vi.fn()

vi.mock('../api/tasks', () => ({
  listTasks: (...args: unknown[]) => listTasks(...args),
}))

function task(id: string, name: string, status = 'active') {
  return {
    id,
    parent: 7,
    name,
    status,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  }
}

describe('useTasks', () => {
  beforeEach(() => {
    listTasks.mockReset()
    listTasks.mockResolvedValue({
      items: [task('1', 'Write copy', 'active'), task('12', 'Hidden Later', 'pending')],
      total: 2,
      totalDurationMinutes: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends search and status to the API', async () => {
    const { visibleTasks, searchQuery, statusFilter } = useTasks('7')
    await flushPromises()

    listTasks.mockResolvedValue({
      items: [task('12', 'Task 12', 'urgent')],
      total: 1,
      totalDurationMinutes: 0,
    })
    searchQuery.value = 'task 12'
    await flushPromises()

    expect(listTasks).toHaveBeenLastCalledWith(
      '7',
      expect.objectContaining({ q: 'task 12', offset: 0 }),
      expect.anything(),
    )
    expect(visibleTasks.value).toHaveLength(1)

    searchQuery.value = ''
    statusFilter.value = 'urgent'
    await flushPromises()

    expect(listTasks).toHaveBeenLastCalledWith(
      '7',
      expect.objectContaining({ q: '', status: 'urgent' }),
      expect.anything(),
    )
  })

  it('surfaces documented 404 errors instead of an empty list', async () => {
    listTasks.mockRejectedValue(new ApiError('Unknown user', 404))
    const { visibleTasks, error } = useTasks('7')
    await flushPromises()

    expect(visibleTasks.value).toEqual([])
    expect(error.value).toBe('Unknown user')
  })
})
