import { http } from './http'
import { toListQuery } from './listQuery'
import type { Client, ListQueryParams } from './types'

export function listClients(query?: ListQueryParams, init?: RequestInit) {
  return http.getPaged<Client>('/clients', toListQuery(query), init)
}

export function getClient(id: string, init?: RequestInit) {
  return http.get<Client>(`/clients/${id}`, undefined, init)
}
