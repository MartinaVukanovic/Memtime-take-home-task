import { describe, expect, it } from 'vitest'
import {
  durationLabel,
  durationMinutesLabel,
  formatApiTimestamp,
  formatDate,
  formatDateTime,
  fromDateInputValue,
  parseTimeInput,
  totalDurationLabel,
  toDateInputValue,
} from './formatDate'

describe('formatDate', () => {
  it('formats ISO timestamps in en-US short style', () => {
    expect(formatDate('2025-11-25T14:20:17.564Z')).toBe('Nov 25, 2025')
  })

  it('formats API timestamps as ISO 8601 UTC', () => {
    expect(formatApiTimestamp('2024-01-15T10:30:00.000Z')).toBe('2024-01-15T10:30:00.000Z')
  })

  it('returns the original value when the date is invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('round-trips date input values', () => {
    expect(toDateInputValue('2024-01-15T10:30:00.000Z')).toBe('2024-01-15')
    expect(fromDateInputValue('2024-01-15')).toBe('2024-01-15T00:00:00.000Z')
  })

  it('formats duration between start and end', () => {
    expect(durationLabel('2024-01-15T09:00:00.000Z', '2024-01-15T11:30:00.000Z')).toBe('2h 30m')
  })

  it('formats date and time in a readable local style', () => {
    const formatted = formatDateTime('2025-07-12T10:45:00.000Z')
    expect(formatted.length).toBeGreaterThan(8)
    expect(formatted).not.toContain('T')
    expect(formatted).not.toContain('Z')
  })

  it('formats a total minute count', () => {
    expect(durationMinutesLabel(480)).toBe('8h')
    expect(durationMinutesLabel(0)).toBe('0m')
  })

  it('sums entry durations', () => {
    expect(
      totalDurationLabel([
        { start: '2024-01-15T09:00:00.000Z', end: '2024-01-15T10:00:00.000Z' },
        { start: '2024-01-15T11:00:00.000Z', end: '2024-01-15T12:30:00.000Z' },
      ]),
    ).toBe('2h 30m')
  })

  it('parses time input values', () => {
    expect(parseTimeInput('09:30')).toEqual({ h: 9, m: 30 })
    expect(parseTimeInput('invalid')).toBeNull()
  })
})
