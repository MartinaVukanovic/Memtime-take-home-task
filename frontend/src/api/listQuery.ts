import type { ListQueryParams } from './types'

export function toListQuery(
  query?: ListQueryParams,
): Record<string, string | number | undefined> | undefined {
  if (!query) return undefined

  const status = query.status && query.status !== 'all' ? query.status : undefined
  const q = query.q?.trim() || undefined

  return {
    limit: query.limit,
    offset: query.offset,
    sortBy: query.sortBy,
    order: query.order,
    q,
    status,
    taskId: query.taskId,
  }
}
