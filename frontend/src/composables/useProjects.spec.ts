import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { useProjects } from './useProjects'

const listProjects = vi.fn()

vi.mock('../api/projects', () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
}))

function project(id: string, name: string, status = 'active') {
  return {
    id,
    name,
    status,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
    clientId: '100',
  }
}

describe('useProjects', () => {
  beforeEach(() => {
    listProjects.mockReset()
    listProjects.mockResolvedValue({
      items: [
        project('1', 'Website Redesign', 'in-progress'),
        project('12', 'Hidden Later', 'pending'),
      ],
      total: 2,
      totalDurationMinutes: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends search and status to the API', async () => {
    const { visibleProjects, searchQuery, statusFilter } = useProjects('100')
    await flushPromises()

    listProjects.mockResolvedValue({
      items: [project('12', 'Project 12', 'urgent')],
      total: 1,
      totalDurationMinutes: 0,
    })
    searchQuery.value = 'project 12'
    await flushPromises()

    expect(listProjects).toHaveBeenLastCalledWith(
      '100',
      expect.objectContaining({ q: 'project 12', offset: 0 }),
      expect.anything(),
    )
    expect(visibleProjects.value).toHaveLength(1)

    searchQuery.value = ''
    statusFilter.value = 'urgent'
    await flushPromises()

    expect(listProjects).toHaveBeenLastCalledWith(
      '100',
      expect.objectContaining({ q: '', status: 'urgent' }),
      expect.anything(),
    )
  })

  it('surfaces documented 404 errors instead of an empty list', async () => {
    listProjects.mockRejectedValue(new ApiError('Unknown user', 404))
    const { visibleProjects, error } = useProjects('100')
    await flushPromises()

    expect(visibleProjects.value).toEqual([])
    expect(error.value).toBe('Unknown user')
  })
})
