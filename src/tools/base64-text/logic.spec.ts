import { describe, expect, it } from 'vitest'
import { base64Decode, base64Encode, isProbablyBase64 } from './logic'

describe('base64Encode', () => {
  it('encodes plain ASCII text', () => {
    expect(base64Encode('Hello, world!')).toBe('SGVsbG8sIHdvcmxkIQ==')
  })

  it('encodes empty string to empty string', () => {
    expect(base64Encode('')).toBe('')
  })

  it('encodes multi-byte UTF-8 correctly', () => {
    expect(base64Encode('héllo')).toBe('aMOpbGxv')
    expect(base64Encode('👍')).toBe('8J+RjQ==')
  })

  it('produces URL-safe output when requested', () => {
    const encoded = base64Encode('subjects?_d', { urlSafe: true })
    expect(encoded).not.toMatch(/[+/=]/)
    expect(base64Decode(encoded)).toBe('subjects?_d')
  })
})

describe('base64Decode', () => {
  it('decodes standard Base64', () => {
    expect(base64Decode('SGVsbG8sIHdvcmxkIQ==')).toBe('Hello, world!')
  })

  it('tolerates missing padding', () => {
    expect(base64Decode('aMOpbGxv')).toBe('héllo')
    expect(base64Decode('8J-RjQ')).toBe('👍')
  })

  it('accepts URL-safe alphabet input', () => {
    const urlSafe = base64Encode('>>>??', { urlSafe: true })
    expect(urlSafe).toContain('-')
    expect(base64Decode(urlSafe)).toBe('>>>??')
  })

  it('ignores surrounding whitespace', () => {
    expect(base64Decode('  SGVs\nbG8s  ')).toBe('Hello,')
  })

  it('returns empty string for empty input', () => {
    expect(base64Decode('')).toBe('')
  })

  it('throws a friendly error on invalid characters', () => {
    expect(() => base64Decode('not*valid!')).toThrow(/Not valid Base64/)
  })

  it('throws a friendly error on impossible length', () => {
    expect(() => base64Decode('abcde')).toThrow(/Not valid Base64/)
  })

  it('round-trips arbitrary unicode text', () => {
    const text = 'Ünïcødé ✓ 日本語 🎉'
    expect(base64Decode(base64Encode(text, { urlSafe: true }))).toBe(text)
  })
})

describe('isProbablyBase64', () => {
  it('accepts typical Base64 strings', () => {
    expect(isProbablyBase64('SGVsbG8sIHdvcmxkIQ==')).toBe(true)
    expect(isProbablyBase64('aGVsbG8')).toBe(true)
  })

  it('rejects plain text and empty strings', () => {
    expect(isProbablyBase64('Hello, world!')).toBe(false)
    expect(isProbablyBase64('')).toBe(false)
  })

  it('rejects strings with a length that leaves an impossible remainder', () => {
    expect(isProbablyBase64('abcde')).toBe(false)
  })
})
