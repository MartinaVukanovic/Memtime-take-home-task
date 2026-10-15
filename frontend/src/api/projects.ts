import { http } from './http'
import { toListQuery } from './listQuery'
import type { ListQueryParams, Project } from './types'

export function listProjects(clientId: string, query?: ListQueryParams, init?: RequestInit) {
  return http.getPaged<Project>(`/clients/${clientId}/projects`, toListQuery(query), init)
}

export function getProject(id: string, init?: RequestInit) {
  return http.get<Project>(`/projects/${id}`, undefined, init)
}
