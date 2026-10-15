import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClients } from './useClients'

const listClients = vi.fn()

vi.mock('../api/clients', () => ({
  listClients: (...args: unknown[]) => listClients(...args),
}))

function client(id: string, name: string) {
  return {
    id,
    name,
    description: `${name} description`,
    status: 'pending',
    createdAt: '2025-11-25T14:20:17.564Z',
    updatedAt: '2025-11-25T14:20:17.564Z',
  }
}

describe('useClients', () => {
  beforeEach(() => {
    listClients.mockReset()
    listClients.mockResolvedValue({
      items: [client('1', 'Acme'), client('11', 'Zephyr Labs')],
      total: 2,
      totalDurationMinutes: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads a server page and uses the total count for pagination', async () => {
    listClients.mockResolvedValue({
      items: [client('1', 'Acme')],
      total: 25,
      totalDurationMinutes: 0,
    })
    const { visibleClients, hasNext, pageCount, rangeEnd } = useClients()
    await flushPromises()

    expect(listClients).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 0,
        sortBy: 'name',
        order: 'asc',
        q: '',
        status: 'all',
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(visibleClients.value).toHaveLength(1)
    expect(hasNext.value).toBe(true)
    expect(pageCount.value).toBe(3)
    expect(rangeEnd.value).toBe(1)
  })

  it('sends search and status to the API instead of filtering locally', async () => {
    const { searchQuery, statusFilter, visibleClients } = useClients()
    await flushPromises()

    listClients.mockResolvedValue({
      items: [client('12', 'Client 12')],
      total: 1,
      totalDurationMinutes: 0,
    })
    searchQuery.value = 'client 12'
    await flushPromises()

    expect(listClients).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'client 12', offset: 0 }),
      expect.anything(),
    )
    expect(visibleClients.value.map((item) => item.name)).toEqual(['Client 12'])

    listClients.mockResolvedValue({
      items: [client('3', 'Urgent Co')],
      total: 1,
      totalDurationMinutes: 0,
    })
    statusFilter.value = 'urgent'
    await flushPromises()

    expect(listClients).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'urgent', q: 'client 12' }),
      expect.anything(),
    )
  })
})
