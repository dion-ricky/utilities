import { describe, expect, it } from 'vitest'
import { escapeJsonString, unescapeJsonString } from './logic'

describe('escapeJsonString', () => {
  it('escapes double quotes but leaves single quotes alone', () => {
    expect(escapeJsonString(`"a,b,c", 'd,e,f'`)).toBe(`\\"a,b,c\\", 'd,e,f'`)
  })

  it('wraps the result in quotes when requested', () => {
    expect(escapeJsonString(`"a,b,c", 'd,e,f'`, { wrap: true })).toBe(`"\\"a,b,c\\", 'd,e,f'"`)
  })

  it('escapes backslashes and quotes like JSON.stringify', () => {
    expect(escapeJsonString('a\\b')).toBe('a\\\\b')
    expect(escapeJsonString('say "hi"')).toBe('say \\"hi\\"')
    const input = 'already \\"escaped\\"'
    expect(escapeJsonString(input)).toBe(JSON.stringify(input).slice(1, -1))
  })

  it('escapes common control characters with short forms', () => {
    expect(escapeJsonString('line1\nline2\ttabbed\r\n')).toBe('line1\\nline2\\ttabbed\\r\\n')
  })

  it('escapes other control characters as \\uXXXX', () => {
    expect(escapeJsonString('a\u0000\u0001b')).toBe('a\\u0000\\u0001b')
  })

  it('leaves plain ASCII text untouched', () => {
    expect(escapeJsonString('plain text 123!')).toBe('plain text 123!')
  })

  it('handles the empty string', () => {
    expect(escapeJsonString('')).toBe('')
    expect(escapeJsonString('', { wrap: true })).toBe('""')
  })

  it('keeps astral characters as-is (no surrogate splitting)', () => {
    expect(escapeJsonString('👍')).toBe('👍')
  })

  it('produces output JSON.parse accepts as a string', () => {
    const escaped = escapeJsonString('He said "hi"\nand left', { wrap: true })
    expect(JSON.parse(escaped)).toBe('He said "hi"\nand left')
  })
})

describe('unescapeJsonString', () => {
  it('decodes a wrapped JSON string literal', () => {
    expect(unescapeJsonString(`"\\"a,b,c\\", 'd,e,f'"`)).toBe(`"a,b,c", 'd,e,f'`)
  })

  it('decodes bare escaped text without wrapping quotes', () => {
    expect(unescapeJsonString(`\\"a,b,c\\"`)).toBe(`"a,b,c"`)
  })

  it('decodes unicode and short escapes', () => {
    expect(unescapeJsonString('a\\u0000\\n\\tb')).toBe('a\u0000\n\tb')
  })

  it('trims surrounding whitespace of wrapped input', () => {
    expect(unescapeJsonString('  "x\\ny"  ')).toBe('x\ny')
  })

  it('round-trips escape output', () => {
    const raw = `quote " backslash \\ newline \n tab \t emoji 👍`
    expect(unescapeJsonString(escapeJsonString(raw, { wrap: true }))).toBe(raw)
    expect(unescapeJsonString(escapeJsonString(raw))).toBe(raw)
  })

  it('returns the empty string for empty input', () => {
    expect(unescapeJsonString('')).toBe('')
  })

  it('throws a friendly error on malformed input', () => {
    expect(() => unescapeJsonString('unterminated " quote')).toThrow(/Not a valid JSON string/)
    expect(() => unescapeJsonString('raw\nnewline')).toThrow(/Not a valid JSON string/)
  })
})
