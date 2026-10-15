import { describe, expect, it } from 'vitest'
import { parseErrorBody } from './errors'

describe('parseErrorBody', () => {
  it('reads JSON error messages', () => {
    expect(parseErrorBody('{"error":"Client not found"}', 404)).toBe('Client not found')
  })

  it('reads the documented unknown-user body', () => {
    expect(parseErrorBody('{"error":"Unknown user"}', 404)).toBe('Unknown user')
  })

  it('falls back to plaintext bodies', () => {
    expect(parseErrorBody('Unauthorized', 401)).toBe('Unauthorized')
  })

  it('uses a status fallback for empty bodies', () => {
    expect(parseErrorBody('', 429)).toBe('Too many requests. Please wait and try again.')
  })
})
