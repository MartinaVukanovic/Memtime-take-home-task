import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { rememberClient, rememberProject, rememberTask, resetEntityCache } from './entityCache'
import {
  useBreadcrumbClient,
  useBreadcrumbClientProject,
  useBreadcrumbClientProjectTask,
} from './useBreadcrumbContext'

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

const clientDoc = {
  id: 'c1',
  name: 'Acme',
  description: 'Desc',
  status: 'active',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const projectDoc = {
  id: 'p1',
  name: 'Website',
  status: 'active',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  clientId: 'c1',
}

const taskDoc = {
  id: 't1',
  parent: 0,
  name: 'Design',
  status: 'active',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('useBreadcrumbContext', () => {
  beforeEach(() => {
    resetEntityCache()
    getClient.mockReset()
    getProject.mockReset()
    getTask.mockReset()
    getClient.mockResolvedValue(clientDoc)
    getProject.mockResolvedValue(projectDoc)
    getTask.mockResolvedValue(taskDoc)
  })

  afterEach(() => {
    resetEntityCache()
  })

  it('skips detail requests when the entity is already remembered (happy-path drill-down)', async () => {
    rememberClient(clientDoc)
    const { client } = useBreadcrumbClient('c1')
    await flushPromises()
    expect(client.value?.name).toBe('Acme')
    expect(getClient).not.toHaveBeenCalled()
  })

  it('fetches on a cold start such as refresh or a deep link', async () => {
    const { client } = useBreadcrumbClient('c1')
    await flushPromises()
    expect(client.value?.name).toBe('Acme')
    expect(getClient).toHaveBeenCalledTimes(1)
  })

  it('fetches only missing parents on a mixed cache', async () => {
    rememberClient(clientDoc)
    const { client, project } = useBreadcrumbClientProject('c1', 'p1')
    await flushPromises()
    expect(client.value?.name).toBe('Acme')
    expect(project.value?.name).toBe('Website')
    expect(getClient).not.toHaveBeenCalled()
    expect(getProject).toHaveBeenCalledTimes(1)
  })

  it('does not refetch cached client, project, and task together', async () => {
    rememberClient(clientDoc)
    rememberProject(projectDoc)
    rememberTask(taskDoc)
    const { task, taskMissing } = useBreadcrumbClientProjectTask('c1', 'p1', 't1')
    await flushPromises()
    expect(task.value?.name).toBe('Design')
    expect(taskMissing.value).toBe(false)
    expect(getClient).not.toHaveBeenCalled()
    expect(getProject).not.toHaveBeenCalled()
    expect(getTask).not.toHaveBeenCalled()
  })

  it('marks the task missing when a deep-linked task cannot be loaded', async () => {
    getTask.mockRejectedValue(new Error('not found'))
    const { task, taskMissing } = useBreadcrumbClientProjectTask('c1', 'p1', 't1')
    await flushPromises()
    expect(task.value).toBeNull()
    expect(taskMissing.value).toBe(true)
  })

  it('force refresh bypasses the cache', async () => {
    rememberClient(clientDoc)
    const { refreshBreadcrumbContext } = useBreadcrumbClient('c1')
    await flushPromises()
    getClient.mockResolvedValue({ ...clientDoc, name: 'Acme Updated' })
    await refreshBreadcrumbContext(true)
    expect(getClient).toHaveBeenCalledTimes(1)
  })

  it('ignores a stale response after the route id changes', async () => {
    let release: (value: typeof clientDoc) => void = () => {}
    getClient.mockReturnValueOnce(
      new Promise<typeof clientDoc>((resolve) => {
        release = resolve
      }),
    )
    const clientId = ref('c1')
    const { client } = useBreadcrumbClient(clientId)
    clientId.value = 'c2'
    getClient.mockResolvedValue({ ...clientDoc, id: 'c2', name: 'Other' })
    await flushPromises()
    release(clientDoc)
    await flushPromises()
    expect(client.value?.id).toBe('c2')
  })
})
