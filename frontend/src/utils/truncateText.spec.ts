import { describe, expect, it } from 'vitest'
import { truncateText } from './truncateText'

describe('truncateText', () => {
  it('keeps short text unchanged', () => {
    expect(truncateText('Hello', 40)).toEqual({ text: 'Hello', truncated: false })
  })

  it('truncates long text and marks it as truncated', () => {
    expect(truncateText('abcdefghijklmnopqrstuvwxyz', 10)).toEqual({
      text: 'abcdefghij',
      truncated: true,
    })
  })
})
