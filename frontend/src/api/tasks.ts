import { http } from './http'
import { toListQuery } from './listQuery'
import type { ListQueryParams, Task } from './types'

export function listTasks(projectId: string, query?: ListQueryParams, init?: RequestInit) {
  return http.getPaged<Task>(`/projects/${projectId}/tasks`, toListQuery(query), init)
}

export function getTask(id: string, init?: RequestInit) {
  return http.get<Task>(`/tasks/${id}`, undefined, init)
}
