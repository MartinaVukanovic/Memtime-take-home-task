export interface Client {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  clientId: string
}

export interface Task {
  id: string
  parent: number
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface TimeEntry {
  id: string
  taskId: string
  userId: string
  comment: string
  start: string
  end: string
  createdAt: string
  updatedAt: string
}

export interface TimeEntryFields {
  comment: string
  start: string
  end: string
}

export interface RecordFields {
  name: string
  description?: string
  status: string
  createdAt: string
}

export type SortOrder = 'asc' | 'desc'

export interface ListQueryParams {
  limit: number
  offset: number
  sortBy: string
  order: SortOrder
  q?: string
  status?: string
  taskId?: string
}

export interface PagedList<T> {
  items: T[]
  total: number
  totalDurationMinutes: number
}

export const CLIENT_SORT_FIELDS = ['id', 'name', 'status', 'createdAt', 'updatedAt'] as const

export type ClientSortField = (typeof CLIENT_SORT_FIELDS)[number]

export const PROJECT_SORT_FIELDS = [
  'id',
  'clientId',
  'name',
  'status',
  'createdAt',
  'updatedAt',
] as const

export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number]

export const TASK_SORT_FIELDS = ['id', 'name', 'status', 'createdAt', 'updatedAt'] as const

export type TaskSortField = (typeof TASK_SORT_FIELDS)[number]

export const TIME_ENTRY_SORT_FIELDS = [
  'id',
  'taskId',
  'comment',
  'start',
  'end',
  'createdAt',
] as const

export type TimeEntrySortField = (typeof TIME_ENTRY_SORT_FIELDS)[number]
