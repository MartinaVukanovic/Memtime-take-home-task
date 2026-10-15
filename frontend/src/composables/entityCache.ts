import { getClient } from '../api/clients'
import { getProject } from '../api/projects'
import { getTask } from '../api/tasks'
import type { Client, Project, Task } from '../api/types'

const clients = new Map<string, Client>()
const projects = new Map<string, Project>()
const tasks = new Map<string, Task>()
const inflight = new Map<string, Promise<unknown>>()

export function rememberClient(client: Client) {
  clients.set(client.id, client)
}

export function rememberProject(project: Project) {
  projects.set(project.id, project)
}

export function rememberTask(task: Task) {
  tasks.set(task.id, task)
}

export function rememberClients(items: Client[]) {
  for (const item of items) rememberClient(item)
}

export function rememberProjects(items: Project[]) {
  for (const item of items) rememberProject(item)
}

export function rememberTasks(items: Task[]) {
  for (const item of items) rememberTask(item)
}

export function peekClient(id: string): Client | null {
  return clients.get(id) ?? null
}

export function peekProject(id: string): Project | null {
  return projects.get(id) ?? null
}

export function peekTask(id: string): Task | null {
  return tasks.get(id) ?? null
}

async function resolve<T extends { id: string }>(
  key: string,
  cache: Map<string, T>,
  id: string,
  load: () => Promise<T>,
  force: boolean,
): Promise<T | null> {
  if (!force) {
    const cached = cache.get(id)
    if (cached) return cached
  }

  const pending = inflight.get(key)
  if (pending) return pending as Promise<T | null>

  const request = load()
    .then((item) => {
      cache.set(item.id, item)
      return item
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, request)
  return request
}

export function resolveClient(id: string, force = false) {
  return resolve(`client:${id}`, clients, id, () => getClient(id), force)
}

export function resolveProject(id: string, force = false) {
  return resolve(`project:${id}`, projects, id, () => getProject(id), force)
}

export function resolveTask(id: string, force = false) {
  return resolve(`task:${id}`, tasks, id, () => getTask(id), force)
}

export function resetEntityCache() {
  clients.clear()
  projects.clear()
  tasks.clear()
  inflight.clear()
}
