export interface StatusStyle {
  label: string
  tone: 'active' | 'done' | 'pending' | 'blocked' | 'inactive' | 'attention'
}

export interface StatusOption {
  value: string
  label: string
  color: string
  bordered?: boolean
}

/** Canonical record statuses (matches backend RECORD_STATUSES). */
export const RECORD_STATUS_VALUES = [
  'urgent',
  'attention',
  'active',
  'draft',
  'pending',
  'archived',
] as const

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'urgent', label: 'Urgent', color: '#9f2d2d' },
  { value: 'attention', label: 'Attention', color: '#8a5a12' },
  { value: 'active', label: 'Active', color: '#1e5c32' },
  { value: 'draft', label: 'Draft', color: '#5b4a8a' },
  { value: 'pending', label: 'Pending', color: '#1f4d8a' },
  { value: 'archived', label: 'Archived', color: '#5c5d61' },
]

const STATUS_MAP: Record<string, StatusStyle> = {
  active: { label: 'Active', tone: 'active' },
  'in-progress': { label: 'Active', tone: 'active' },
  completed: { label: 'Completed', tone: 'done' },
  done: { label: 'Done', tone: 'done' },
  pending: { label: 'Pending', tone: 'pending' },
  blocked: { label: 'Blocked', tone: 'blocked' },
  urgent: { label: 'Urgent', tone: 'blocked' },
  attention: { label: 'Attention', tone: 'attention' },
  inactive: { label: 'Inactive', tone: 'inactive' },
  draft: { label: 'Draft', tone: 'inactive' },
  archived: { label: 'Archived', tone: 'inactive' },
}

export function normalizeStatus(status: string): string {
  const key = status.trim().toLowerCase()
  if (key === 'in-progress') return 'active'
  if (key === 'done') return 'completed'
  return key
}

/** Status values sent to the interview API. */
export function toApiStatus(status: string): string {
  const normalized = normalizeStatus(status)
  if (normalized === 'completed') return 'completed'
  return normalized
}

export function statusStyle(status: string): StatusStyle {
  const key = status.trim().toLowerCase()
  const mapped = STATUS_MAP[key]
  if (mapped) return mapped

  return {
    label: status.replace(/-/g, ' '),
    tone: 'inactive',
  }
}

export function statusOptionFor(status: string): StatusOption {
  const normalized = normalizeStatus(status)
  const match = STATUS_OPTIONS.find((option) => option.value === normalized)
  if (match) return match

  const style = statusStyle(status)
  return {
    value: normalized,
    label: style.label,
    color: '#9ca3af',
  }
}

export function pickerOptionsFor(status: string): StatusOption[] {
  const current = statusOptionFor(status)
  if (STATUS_OPTIONS.some((option) => option.value === current.value)) {
    return STATUS_OPTIONS
  }
  return [...STATUS_OPTIONS, current]
}

export interface StatusBadgeDisplay {
  background: string
  color: string
  border?: string
}

/** Tinted label for tables/lists (no dot — picker/modals keep the dot). */
export function statusBadgeDisplay(status: string): StatusBadgeDisplay {
  const key = normalizeStatus(status)
  if (key === 'active' || key === 'completed' || key === 'done') {
    return { background: 'var(--st-green-bg)', color: 'var(--st-green)' }
  }
  if (key === 'pending') {
    return { background: 'var(--st-blue-bg)', color: 'var(--st-blue)' }
  }
  if (key === 'draft') {
    return { background: 'var(--st-violet-bg)', color: 'var(--st-violet)' }
  }
  if (key === 'urgent') {
    return { background: 'var(--st-red-bg)', color: 'var(--st-red)' }
  }
  if (key === 'attention') {
    return { background: 'var(--st-amber-bg)', color: 'var(--st-amber)' }
  }
  return { background: 'var(--st-gray-bg)', color: 'var(--st-gray)' }
}
