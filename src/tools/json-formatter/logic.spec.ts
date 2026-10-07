import { describe, expect, it } from 'vitest'
import { formatJson, jsonErrorPosition, positionToLineCol } from './logic'

describe('jsonErrorPosition', () => {
  it('extracts the position from a V8-style message', () => {
    expect(jsonErrorPosition('Unexpected token } in JSON at position 42')).toBe(42)
  })

  it('matches the newer V8 message format', () => {
    expect(
      jsonErrorPosition(`Unexpected token '}', ..."}"... is not valid JSON at position 7`),
    ).toBe(7)
  })

  it('returns null when there is no position', () => {
    expect(jsonErrorPosition('Unexpected end of JSON input')).toBeNull()
  })
})

describe('positionToLineCol', () => {
  it('returns 1:1 for position 0', () => {
    expect(positionToLineCol('abc', 0)).toEqual({ line: 1, col: 1 })
  })

  it('counts newlines into the line number', () => {
    const text = '{\n  "a": 1,\n  "b": }\n'
    // position of the "}" after "b":
    const pos = text.indexOf('}')
    expect(positionToLineCol(text, pos)).toEqual({ line: 3, col: 8 })
  })

  it('clamps positions past the end of the text', () => {
    expect(positionToLineCol('ab', 999)).toEqual({ line: 1, col: 3 })
    expect(positionToLineCol('', 5)).toEqual({ line: 1, col: 1 })
  })
})

describe('formatJson', () => {
  const input = '{"b":1,"a":[1,{"d":2,"c":3}]}'

  it('formats with 2-space indent by default shape', () => {
    const result = formatJson(input, { indent: '2' })
    expect(result).toEqual({
      ok: true,
      result: '{\n  "b": 1,\n  "a": [\n    1,\n    {\n      "d": 2,\n      "c": 3\n    }\n  ]\n}',
    })
  })

  it('formats with 4-space indent', () => {
    const result = formatJson('{"a":1}', { indent: '4' })
    expect(result).toEqual({ ok: true, result: '{\n    "a": 1\n}' })
  })

  it('formats with tab indent', () => {
    const result = formatJson('{"a":1}', { indent: 'tab' })
    expect(result).toEqual({ ok: true, result: '{\n\t"a": 1\n}' })
  })

  it('minifies', () => {
    const result = formatJson('{ "a" : 1 , "b" : [ 2 , 3 ] }', { indent: 'none' })
    expect(result).toEqual({ ok: true, result: '{"a":1,"b":[2,3]}' })
  })

  it('sorts keys recursively when asked', () => {
    const result = formatJson(input, { indent: 'none', sortKeys: true })
    expect(result).toEqual({ ok: true, result: '{"a":[1,{"c":3,"d":2}],"b":1}' })
  })

  it('sorts keys inside arrays of objects', () => {
    const result = formatJson('[{"z":1,"a":2}]', { indent: 'none', sortKeys: true })
    expect(result).toEqual({ ok: true, result: '[{"a":2,"z":1}]' })
  })

  it('keeps non-string keys ordered after sorting (numeric-like keys)', () => {
    const result = formatJson('{"2":1,"1":2,"b":3}', { indent: 'none', sortKeys: true })
    expect(result).toEqual({ ok: true, result: '{"1":2,"2":1,"b":3}' })
  })

  it('handles empty objects and arrays', () => {
    expect(formatJson('{}', { indent: '2', sortKeys: true })).toEqual({ ok: true, result: '{}' })
    expect(formatJson('[]', { indent: '2', sortKeys: true })).toEqual({ ok: true, result: '[]' })
  })

  it('returns a friendly error on parse failure', () => {
    const bad = '{\n  "a": 1,\n  "b": }\n'
    const result = formatJson(bad, { indent: '2' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/^Invalid JSON/)
  })

  it('returns a friendly error without line:col when no position is available', () => {
    const result = formatJson('', { indent: '2' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid JSON —/)
      expect(result.error).not.toContain('line')
    }
  })
})
