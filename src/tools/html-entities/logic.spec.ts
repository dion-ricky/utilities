import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities, encodeHtmlEntities } from './logic'

describe('encodeHtmlEntities', () => {
  it('escapes the five XML-significant characters', () => {
    expect(encodeHtmlEntities(`a & b < c > d " e ' f`)).toBe(
      'a &amp; b &lt; c &gt; d &quot; e &#39; f',
    )
  })

  it('leaves ASCII text untouched', () => {
    expect(encodeHtmlEntities('plain text 123')).toBe('plain text 123')
  })

  it('handles the empty string', () => {
    expect(encodeHtmlEntities('')).toBe('')
  })

  it('keeps non-ASCII as-is by default', () => {
    expect(encodeHtmlEntities('café')).toBe('café')
  })

  it('uses numeric refs for non-ASCII when requested', () => {
    expect(encodeHtmlEntities('café', { numericNonAscii: true })).toBe('caf&#233;')
  })

  it('uses code points (not UTF-16 units) for astral characters', () => {
    expect(encodeHtmlEntities('👍', { numericNonAscii: true })).toBe('&#128077;')
  })

  it('still escapes reserved characters with numericNonAscii on', () => {
    expect(encodeHtmlEntities('é&', { numericNonAscii: true })).toBe('&#233;&amp;')
  })
})

describe('decodeHtmlEntities', () => {
  it('decodes the common named refs', () => {
    expect(decodeHtmlEntities('&amp;&lt;&gt;&quot;&#39;')).toBe(`&<>"'`)
  })

  it('decodes punctuation and symbol refs', () => {
    expect(decodeHtmlEntities('&copy; &reg; &trade; &hellip; &mdash; &times;')).toBe('© ® ™ … — ×')
  })

  it('decodes nbsp to a non-breaking space', () => {
    expect(decodeHtmlEntities('a&nbsp;b')).toBe('a\u00A0b')
  })

  it('decodes decimal numeric refs', () => {
    expect(decodeHtmlEntities('&#39;')).toBe("'")
    expect(decodeHtmlEntities('&#233;')).toBe('é')
  })

  it('decodes hex numeric refs', () => {
    expect(decodeHtmlEntities('&#x27;')).toBe("'")
    expect(decodeHtmlEntities('&#xE9;')).toBe('é')
  })

  it('leaves unknown named refs untouched', () => {
    expect(decodeHtmlEntities('&fakeentity; &amp;')).toBe('&fakeentity; &')
  })

  it('leaves invalid numeric refs untouched', () => {
    expect(decodeHtmlEntities('&#xZZ; &#858533455; &#55296;')).toBe('&#xZZ; &#858533455; &#55296;')
  })

  it('leaves bare ampersands untouched', () => {
    expect(decodeHtmlEntities('a & b')).toBe('a & b')
  })

  it('decodes only once (no double decoding)', () => {
    expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;')
  })

  it('round-trips escaped text', () => {
    const original = `<div class="x">Tom & Jerry's "café" — 5 &gt; 3 &copy; 2026</div>`
    expect(decodeHtmlEntities(encodeHtmlEntities(original))).toBe(original)
  })
})
