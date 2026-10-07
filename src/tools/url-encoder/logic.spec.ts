import { describe, expect, it } from 'vitest'
import { decodeUrl, encodeUrl } from './logic'

describe('encodeUrl', () => {
  it('escapes reserved characters in component mode', () => {
    expect(encodeUrl('a b&c=d/e?f')).toBe('a%20b%26c%3Dd%2Fe%3Ff')
  })

  it('keeps URI structure characters in uri mode', () => {
    expect(encodeUrl('https://example.com/a b?q=x y', { mode: 'uri' })).toBe(
      'https://example.com/a%20b?q=x%20y',
    )
  })

  it('defaults to component mode', () => {
    expect(encodeUrl('a&b')).toBe(encodeURIComponent('a&b'))
  })

  it('encodes non-ASCII as UTF-8 percent sequences', () => {
    expect(encodeUrl('é', { mode: 'component' })).toBe('%C3%A9')
  })

  it('leaves unreserved characters untouched', () => {
    expect(encodeUrl("aAzZ09-_.!~*'()")).toBe("aAzZ09-_.!~*'()")
  })
})

describe('decodeUrl', () => {
  it('decodes percent-encoded text', () => {
    expect(decodeUrl('a%20b%26c')).toBe('a b&c')
  })

  it('decodes multi-byte UTF-8 sequences', () => {
    expect(decodeUrl('%C3%A9')).toBe('é')
  })

  it('leaves URI structure intact in uri mode but decodes escapes', () => {
    expect(decodeUrl('https://example.com/a%20b?q=x', { mode: 'uri' })).toBe(
      'https://example.com/a b?q=x',
    )
  })

  it('throws a friendly error on a lone percent sign', () => {
    expect(() => decodeUrl('100%')).toThrow(/malformed % sequence/i)
  })

  it('throws a friendly error on truncated escape sequences', () => {
    expect(() => decodeUrl('%E0%A4')).toThrow(/malformed % sequence/i)
  })

  it('throws a friendly error on invalid hex digits', () => {
    expect(() => decodeUrl('%zz')).toThrow(/malformed % sequence/i)
  })

  it('round-trips arbitrary text', () => {
    const text = 'q=hello world&lang=fr#réponse 🎉'
    expect(decodeUrl(encodeUrl(text, { mode: 'component' }), { mode: 'component' })).toBe(text)
  })
})
