import { describe, expect, it } from 'vitest'
import { diffText } from './logic'

describe('diffText (line-level)', () => {
  it('produces unified output with counts for a simple change', () => {
    const result = diffText('a\nb\nc', 'a\nx\nc')
    expect(result.unified).toBe('*** original\n+++ changed\n a\n-b\n+x\n c')
    expect(result.added).toBe(1)
    expect(result.removed).toBe(1)
  })

  it('marks pure additions and removals', () => {
    const result = diffText('a\nb', 'a\nb\nc')
    expect(result.added).toBe(1)
    expect(result.removed).toBe(0)
    expect(result.unified).toContain('+c')
  })

  it('handles a removed line', () => {
    const result = diffText('a\nb\nc', 'a\nc')
    expect(result.added).toBe(0)
    expect(result.removed).toBe(1)
    expect(result.unified).toContain('-b')
  })

  it('returns no changes for identical text', () => {
    const result = diffText('same\ntext', 'same\ntext')
    expect(result.added).toBe(0)
    expect(result.removed).toBe(0)
    expect(result.unified).toBe('*** original\n+++ changed\n same\n text')
  })

  it('ignores case when asked', () => {
    const result = diffText('Apple\nBanana', 'apple\nbanana', { ignoreCase: true })
    expect(result.added).toBe(0)
    expect(result.removed).toBe(0)
  })

  it('ignores leading/trailing whitespace when asked', () => {
    const result = diffText('  hello\nworld  ', 'hello\nworld', { ignoreWhitespace: true })
    expect(result.added).toBe(0)
    expect(result.removed).toBe(0)
  })

  it('still reports differences when ignore options are off', () => {
    const result = diffText('Apple', 'apple')
    expect(result.added + result.removed).toBe(2)
  })

  it('treats an empty string as an empty first line', () => {
    const result = diffText('', 'a')
    expect(result.added).toBe(1)
    expect(result.removed).toBe(1)
  })

  it('returns no changes for two empty strings', () => {
    const result = diffText('', '')
    expect(result.added).toBe(0)
    expect(result.removed).toBe(0)
  })
})

describe('diffText (word-level)', () => {
  it('diffs individual words', () => {
    const result = diffText('foo bar baz', 'foo qux baz', { wordLevel: true })
    expect(result.added).toBe(1)
    expect(result.removed).toBe(1)
    expect(result.unified).toBe('*** original\n+++ changed\n foo \n-bar\n+qux\n  baz')
  })

  it('is inherently whitespace-insensitive', () => {
    const result = diffText('foo  bar', 'foo bar', { wordLevel: true })
    expect(result.added).toBe(0)
    expect(result.removed).toBe(0)
  })

  it('supports case-insensitive word diffing', () => {
    const result = diffText('Foo BAR', 'foo bar', { wordLevel: true, ignoreCase: true })
    expect(result.added).toBe(0)
    expect(result.removed).toBe(0)
  })

  it('reports additions of whole words', () => {
    const result = diffText('hello world', 'hello big world', { wordLevel: true })
    expect(result.added).toBe(1)
    expect(result.removed).toBe(0)
  })
})

describe('sideBySide', () => {
  it('pairs changed rows and keeps same rows on both sides', () => {
    const result = diffText('a\nb\nc', 'a\nx\nc')
    expect(result.sideBySide.left).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'same', text: 'c' },
    ])
    expect(result.sideBySide.right).toEqual([
      { type: 'same', text: 'a' },
      { type: 'added', text: 'x' },
      { type: 'same', text: 'c' },
    ])
  })

  it('pads the opposite side for unpaired rows', () => {
    const result = diffText('a\nb', 'b\nc')
    const { left, right } = result.sideBySide
    expect(left).toHaveLength(3)
    expect(right).toHaveLength(3)
    expect(left[0]).toEqual({ type: 'removed', text: 'a' })
    expect(right[0]).toEqual({ type: 'same', text: '' })
    expect(right[2]).toEqual({ type: 'added', text: 'c' })
    expect(left[2]).toEqual({ type: 'same', text: '' })
  })

  it('keeps both columns the same length for additions only', () => {
    const result = diffText('a', 'a\nb')
    const { left, right } = result.sideBySide
    expect(left).toHaveLength(right.length)
    expect(right.some((row) => row.type === 'added')).toBe(true)
  })

  it('handles empty input', () => {
    const result = diffText('', '')
    expect(result.sideBySide.left).toHaveLength(1)
    expect(result.sideBySide.right).toHaveLength(1)
  })

  it('works for word-level diffs', () => {
    const result = diffText('foo bar', 'foo baz', { wordLevel: true })
    const { left, right } = result.sideBySide
    expect(left).toHaveLength(right.length)
    expect(left.some((row) => row.type === 'removed')).toBe(true)
    expect(right.some((row) => row.type === 'added')).toBe(true)
  })
})
