import { readonly, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Client, Project, Task } from '../api/types'
import {
  peekClient,
  peekProject,
  peekTask,
  resolveClient,
  resolveProject,
  resolveTask,
} from './entityCache'

function stillCurrent(expected: string, getter: MaybeRefOrGetter<string>) {
  return toValue(getter) === expected
}

export function useBreadcrumbClient(clientId: MaybeRefOrGetter<string>) {
  const client = ref<Client | null>(null)

  async function refreshBreadcrumbContext(force = false) {
    const id = toValue(clientId)
    if (!id) {
      client.value = null
      return
    }

    if (!force) {
      const cached = peekClient(id)
      if (cached) {
        client.value = cached
        return
      }
    }

    const next = await resolveClient(id, force)
    if (!stillCurrent(id, clientId)) return
    client.value = next
  }

  watch(() => toValue(clientId), () => void refreshBreadcrumbContext(), { immediate: true })

  return {
    client: readonly(client),
    refreshBreadcrumbContext,
  }
}

export function useBreadcrumbClientProject(
  clientId: MaybeRefOrGetter<string>,
  projectId: MaybeRefOrGetter<string>,
) {
  const client = ref<Client | null>(null)
  const project = ref<Project | null>(null)

  async function refreshBreadcrumbContext(force = false) {
    const nextClientId = toValue(clientId)
    const nextProjectId = toValue(projectId)

    if (!nextClientId || !nextProjectId) {
      client.value = null
      project.value = null
      return
    }

    const cachedClient = force ? null : peekClient(nextClientId)
    const cachedProject = force ? null : peekProject(nextProjectId)
    client.value = cachedClient
    project.value = cachedProject
    if (cachedClient && cachedProject) return

    const [nextClient, nextProject] = await Promise.all([
      cachedClient ? Promise.resolve(cachedClient) : resolveClient(nextClientId, force),
      cachedProject ? Promise.resolve(cachedProject) : resolveProject(nextProjectId, force),
    ])

    if (!stillCurrent(nextClientId, clientId) || !stillCurrent(nextProjectId, projectId)) return
    client.value = nextClient
    project.value = nextProject
  }

  watch(
    () => [toValue(clientId), toValue(projectId)] as const,
    () => void refreshBreadcrumbContext(),
    { immediate: true },
  )

  return {
    client: readonly(client),
    project: readonly(project),
    refreshBreadcrumbContext,
  }
}

export function useBreadcrumbClientProjectTask(
  clientId: MaybeRefOrGetter<string>,
  projectId: MaybeRefOrGetter<string>,
  taskId: MaybeRefOrGetter<string>,
) {
  const client = ref<Client | null>(null)
  const project = ref<Project | null>(null)
  const task = ref<Task | null>(null)
  const taskMissing = ref(false)

  async function refreshBreadcrumbContext(force = false) {
    const nextClientId = toValue(clientId)
    const nextProjectId = toValue(projectId)
    const nextTaskId = toValue(taskId)

    if (!nextClientId || !nextProjectId || !nextTaskId) {
      client.value = null
      project.value = null
      task.value = null
      taskMissing.value = false
      return
    }

    const cachedClient = force ? null : peekClient(nextClientId)
    const cachedProject = force ? null : peekProject(nextProjectId)
    const cachedTask = force ? null : peekTask(nextTaskId)
    client.value = cachedClient
    project.value = cachedProject
    task.value = cachedTask
    taskMissing.value = false
    if (cachedClient && cachedProject && cachedTask) return

    const [nextClient, nextProject, nextTask] = await Promise.all([
      cachedClient ? Promise.resolve(cachedClient) : resolveClient(nextClientId, force),
      cachedProject ? Promise.resolve(cachedProject) : resolveProject(nextProjectId, force),
      cachedTask ? Promise.resolve(cachedTask) : resolveTask(nextTaskId, force),
    ])

    if (
      !stillCurrent(nextClientId, clientId) ||
      !stillCurrent(nextProjectId, projectId) ||
      !stillCurrent(nextTaskId, taskId)
    ) {
      return
    }

    client.value = nextClient
    project.value = nextProject
    task.value = nextTask
    taskMissing.value = !nextTask
  }

  watch(
    () => [toValue(clientId), toValue(projectId), toValue(taskId)] as const,
    () => void refreshBreadcrumbContext(),
    { immediate: true },
  )

  return {
    client: readonly(client),
    project: readonly(project),
    task: readonly(task),
    taskMissing: readonly(taskMissing),
    refreshBreadcrumbContext,
  }
}
