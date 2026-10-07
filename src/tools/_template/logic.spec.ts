import { describe, expect, it } from 'vitest'
import { transform } from './logic'

describe('transform', () => {
  it('returns the input unchanged by default', () => {
    expect(transform('hello')).toBe('hello')
  })

  it('trims whitespace when enabled', () => {
    expect(transform('  hello  ', { trim: true })).toBe('hello')
  })
})
