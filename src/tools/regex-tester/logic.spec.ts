import { describe, expect, it } from 'vitest'
import { findMatches, highlightHtml, MAX_MATCHES, parseFlags, replacePreview } from './logic'

describe('parseFlags', () => {
  it('accepts all valid flags', () => {
    expect(parseFlags('dgimsuvy')).toEqual({
      valid: ['d', 'g', 'i', 'm', 's', 'u', 'v', 'y'],
      invalid: [],
    })
  })

  it('detects invalid flags', () => {
    expect(parseFlags('gxz')).toEqual({ valid: ['g'], invalid: ['x', 'z'] })
  })

  it('deduplicates and skips spaces', () => {
    expect(parseFlags('g g  i')).toEqual({ valid: ['g', 'i'], invalid: [] })
  })

  it('returns empty for empty input', () => {
    expect(parseFlags('')).toEqual({ valid: [], invalid: [] })
  })
})

describe('findMatches', () => {
  it('finds matches with index and text', () => {
    const result = findMatches('\\d+', 'g', 'a1 b22 c333')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.matches).toEqual([
      { index: 1, text: '1', groups: [], namedGroups: {} },
      { index: 4, text: '22', groups: [], namedGroups: {} },
      { index: 8, text: '333', groups: [], namedGroups: {} },
    ])
    expect(result.total).toBe(3)
    expect(result.truncated).toBe(false)
  })

  it('captures numbered and named groups', () => {
    const result = findMatches('(\\w+)=(?<val>\\w+)', 'g', 'a=1 b=2')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.matches[0]).toEqual({
      index: 0,
      text: 'a=1',
      groups: ['a', '1'],
      namedGroups: { val: '1' },
    })
    expect(result.matches[1]?.groups).toEqual(['b', '2'])
  })

  it('returns only the first match without the g flag', () => {
    const result = findMatches('b', '', 'abcb')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]?.index).toBe(1)
  })

  it('advances past zero-length matches instead of looping forever', () => {
    const result = findMatches('a*', 'g', 'bab')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.matches.map((m) => m.index)).toEqual([0, 1, 2, 3])
    expect(result.total).toBe(4)
  })

  it('returns a friendly error for invalid regex', () => {
    expect(findMatches('a(', '', 'aaa')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid regular expression'),
    })
  })

  it('returns a friendly error for empty pattern', () => {
    expect(findMatches('', 'g', 'aaa')).toEqual({ ok: false, error: expect.any(String) })
  })

  it('returns a friendly error for unsupported flags', () => {
    expect(findMatches('a', 'q', 'aaa')).toEqual({
      ok: false,
      error: expect.stringContaining('q'),
    })
  })

  it('caps listed matches at MAX_MATCHES and flags truncation', () => {
    const text = 'x'.repeat(MAX_MATCHES + 50)
    const result = findMatches('x', 'g', text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.matches).toHaveLength(MAX_MATCHES)
    expect(result.total).toBe(MAX_MATCHES + 50)
    expect(result.truncated).toBe(true)
  })
})

describe('highlightHtml', () => {
  it('wraps matches in <mark>', () => {
    const matches = [{ index: 6, text: 'world', groups: [], namedGroups: {} }]
    expect(highlightHtml('hello world!', matches)).toBe('hello <mark>world</mark>!')
  })

  it('escapes HTML in the text before inserting', () => {
    const matches = [{ index: 0, text: '<b>', groups: [], namedGroups: {} }]
    expect(highlightHtml('<b>&</b>', matches)).toBe('<mark>&lt;b&gt;</mark>&amp;&lt;/b&gt;')
  })

  it('escapes HTML inside matches too', () => {
    const matches = [{ index: 0, text: '<img>', groups: [], namedGroups: {} }]
    const html = highlightHtml('<img>', matches)
    expect(html).toBe('<mark>&lt;img&gt;</mark>')
    expect(html).not.toContain('<img')
  })

  it('ignores zero-length and overlapping matches', () => {
    const matches = [
      { index: 1, text: '', groups: [], namedGroups: {} },
      { index: 2, text: 'cd', groups: [], namedGroups: {} },
      { index: 3, text: 'de', groups: [], namedGroups: {} },
    ]
    expect(highlightHtml('abcde', matches)).toBe('ab<mark>cd</mark>e')
  })

  it('returns escaped text unchanged when there are no matches', () => {
    expect(highlightHtml('a < b', [])).toBe('a &lt; b')
  })
})

describe('replacePreview', () => {
  it('applies $1 group references', () => {
    const result = replacePreview('John Smith', '(\\w+) (\\w+)', '', '$2, $1')
    expect(result).toEqual({ ok: true, result: 'Smith, John' })
  })

  it('leaves g-flag handling to the caller', () => {
    const withoutG = replacePreview('aaa', 'a', '', 'b')
    const withG = replacePreview('aaa', 'a', 'g', 'b')
    expect(withoutG).toEqual({ ok: true, result: 'baa' })
    expect(withG).toEqual({ ok: true, result: 'bbb' })
  })

  it('returns a friendly error for invalid regex', () => {
    expect(replacePreview('aaa', '[', '', 'x')).toEqual({
      ok: false,
      error: expect.stringContaining('Invalid regular expression'),
    })
  })

  it('returns a friendly error for empty pattern', () => {
    expect(replacePreview('aaa', '', 'g', 'x')).toEqual({
      ok: false,
      error: expect.any(String),
    })
  })
})
