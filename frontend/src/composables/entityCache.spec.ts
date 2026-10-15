import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  peekClient,
  rememberClient,
  resetEntityCache,
  resolveClient,
  resolveProject,
  resolveTask,
} from './entityCache'

const getClient = vi.fn()
const getProject = vi.fn()
const getTask = vi.fn()

vi.mock('../api/clients', () => ({
  getClient: (...args: unknown[]) => getClient(...args),
}))

vi.mock('../api/projects', () => ({
  getProject: (...args: unknown[]) => getProject(...args),
}))

vi.mock('../api/tasks', () => ({
  getTask: (...args: unknown[]) => getTask(...args),
}))

function client(id: string, name = 'Acme') {
  return {
    id,
    name,
    description: 'Desc',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('entityCache', () => {
  beforeEach(() => {
    resetEntityCache()
    getClient.mockReset()
    getProject.mockReset()
    getTask.mockReset()
    getClient.mockResolvedValue(client('c1'))
    getProject.mockResolvedValue({
      id: 'p1',
      name: 'Website',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      clientId: 'c1',
    })
    getTask.mockResolvedValue({
      id: 't1',
      parent: 0,
      name: 'Design',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    })
  })

  afterEach(() => {
    resetEntityCache()
  })

  it('returns a remembered entity without fetching', async () => {
    rememberClient(client('c1', 'Cached'))
    const resolved = await resolveClient('c1')
    expect(resolved?.name).toBe('Cached')
    expect(getClient).not.toHaveBeenCalled()
  })

  it('fetches once on a cache miss and reuses the result', async () => {
    const first = await resolveClient('c1')
    const second = await resolveClient('c1')
    expect(first?.name).toBe('Acme')
    expect(second?.name).toBe('Acme')
    expect(getClient).toHaveBeenCalledTimes(1)
    expect(peekClient('c1')?.name).toBe('Acme')
  })

  it('dedupes in-flight fetches for the same id', async () => {
    let release: (value: ReturnType<typeof client>) => void = () => {}
    getClient.mockReturnValue(
      new Promise<ReturnType<typeof client>>((resolve) => {
        release = resolve
      }),
    )

    const pendingA = resolveClient('c1')
    const pendingB = resolveClient('c1')
    release(client('c1'))
    const [a, b] = await Promise.all([pendingA, pendingB])

    expect(a?.id).toBe('c1')
    expect(b?.id).toBe('c1')
    expect(getClient).toHaveBeenCalledTimes(1)
  })

  it('force-refetch bypasses the cache', async () => {
    rememberClient(client('c1', 'Old'))
    getClient.mockResolvedValue(client('c1', 'New'))
    const resolved = await resolveClient('c1', true)
    expect(resolved?.name).toBe('New')
    expect(getClient).toHaveBeenCalledTimes(1)
  })

  it('returns null when a detail fetch fails', async () => {
    getClient.mockRejectedValue(new Error('not found'))
    expect(await resolveClient('missing')).toBeNull()
  })

  it('resolves projects and tasks independently', async () => {
    await resolveProject('p1')
    await resolveTask('t1')
    expect(getProject).toHaveBeenCalledTimes(1)
    expect(getTask).toHaveBeenCalledTimes(1)
    await resolveProject('p1')
    await resolveTask('t1')
    expect(getProject).toHaveBeenCalledTimes(1)
    expect(getTask).toHaveBeenCalledTimes(1)
  })
})
