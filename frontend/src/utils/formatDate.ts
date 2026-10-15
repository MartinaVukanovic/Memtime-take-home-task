export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function toDateInputValue(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function toLocalDateInputValue(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toTimeInputValue(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '09:00'
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function fromDateInputValue(value: string): string {
  if (!value) return new Date().toISOString()
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

/** ISO 8601 UTC string as returned by the Memtime API (e.g. 2024-01-15T10:30:00.000Z). */
export function formatApiTimestamp(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate

  return date.toISOString()
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function toIsoFromDateAndTime(dateValue: string, hours: number, minutes: number): string {
  const [year, month, day] = dateValue.split('-').map((part) => Number.parseInt(part, 10))
  if (!year || !month || !day) return new Date().toISOString()
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

function formatMinutesAsDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function durationLabel(startAt: string, endAt: string): string {
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return '0m'

  const totalMinutes = Math.round((end - start) / 60_000)
  return formatMinutesAsDuration(totalMinutes)
}

export function durationMinutesLabel(totalMinutes: number): string {
  return formatMinutesAsDuration(Math.max(0, Math.round(totalMinutes)))
}

export function totalDurationLabel(entries: { start: string; end: string }[]): string {
  let totalMinutes = 0
  for (const entry of entries) {
    const start = new Date(entry.start).getTime()
    const end = new Date(entry.end).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue
    totalMinutes += Math.round((end - start) / 60_000)
  }
  return durationMinutesLabel(totalMinutes)
}

export function parseTimeInput(value: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const h = Number.parseInt(match[1], 10)
  const m = Number.parseInt(match[2], 10)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}
