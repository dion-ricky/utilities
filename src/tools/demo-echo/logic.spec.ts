import { describe, expect, it } from 'vitest'
import { echoTransform } from './logic'

describe('echoTransform', () => {
  it('returns the input unchanged when no options are set', () => {
    expect(echoTransform('hello', { reverse: false, uppercase: false })).toBe('hello')
  })

  it('reverses the input, preserving unicode code points', () => {
    expect(echoTransform('abc👍', { reverse: true, uppercase: false })).toBe('👍cba')
  })

  it('uppercases the input', () => {
    expect(echoTransform('hello', { reverse: false, uppercase: true })).toBe('HELLO')
  })

  it('applies options in order: reverse then uppercase', () => {
    expect(echoTransform('abc', { reverse: true, uppercase: true })).toBe('CBA')
  })
})
