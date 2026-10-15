import type { SortOrder } from '../api/types'
import { normalizeStatus } from './status'

export function matchesQuery(
  record: { name: string; description?: string },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  if (record.name.toLowerCase().includes(needle)) return true
  const description = record.description?.trim()
  return description ? description.toLowerCase().includes(needle) : false
}

export function matchesStatus(status: string, filter: string): boolean {
  if (!filter || filter === 'all') return true
  return normalizeStatus(status) === normalizeStatus(filter)
}

export function compareRecords<T extends Record<string, unknown>>(
  left: T,
  right: T,
  field: keyof T & string,
  order: SortOrder,
): number {
  const av = left[field]
  const bv = right[field]
  const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
  return order === 'asc' ? cmp : -cmp
}

