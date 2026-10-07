import { describe, expect, it } from 'vitest'
import { csvToJson, flattenRecord, jsonToCsv } from './logic'

describe('flattenRecord', () => {
  it('flattens nested plain objects with dot notation', () => {
    expect(flattenRecord({ a: { b: { c: 1 } }, d: 2 })).toEqual({ 'a.b.c': 1, d: 2 })
  })

  it('keeps arrays as values', () => {
    expect(flattenRecord({ a: [1, 2], b: { c: [] } })).toEqual({ a: [1, 2], 'b.c': [] })
  })

  it('keeps null values as-is', () => {
    expect(flattenRecord({ a: null })).toEqual({ a: null })
  })

  it('returns flat records unchanged', () => {
    expect(flattenRecord({ a: 1, b: 'x' })).toEqual({ a: 1, b: 'x' })
  })
})

describe('jsonToCsv', () => {
  it('converts an array of objects with a header row', () => {
    const result = jsonToCsv('[{"a":1,"b":2},{"a":3,"b":4}]')
    expect(result).toEqual({ ok: true, result: 'a,b\n1,2\n3,4' })
  })

  it('treats a single object as a one-row table', () => {
    const result = jsonToCsv('{"x":"hello","y":"world"}')
    expect(result).toEqual({ ok: true, result: 'x,y\nhello,world' })
  })

  it('supports semicolon delimiter', () => {
    const result = jsonToCsv('[{"a":1,"b":2}]', { delimiter: ';' })
    expect(result).toEqual({ ok: true, result: 'a;b\n1;2' })
  })

  it('supports tab and pipe delimiters', () => {
    expect(jsonToCsv('[{"a":1}]', { delimiter: '\t' })).toEqual({ ok: true, result: 'a\n1' })
    expect(jsonToCsv('[{"a":1}]', { delimiter: '|' })).toEqual({ ok: true, result: 'a\n1' })
  })

  it('quotes fields containing the delimiter', () => {
    const result = jsonToCsv('[{"a":"x,y"}]')
    expect(result).toEqual({ ok: true, result: 'a\n"x,y"' })
  })

  it('flattens nested objects when asked', () => {
    const result = jsonToCsv('[{"name":"Ada","address":{"city":"London"}}]', { flatten: true })
    expect(result).toEqual({ ok: true, result: 'name,address.city\nAda,London' })
  })

  it('JSON-stringifies array values', () => {
    const result = jsonToCsv('[{"a":[1,2]}]')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toBe('a\n"[1,2]"')
  })

  it('rejects empty input', () => {
    expect(jsonToCsv('')).toEqual({ ok: false, error: 'No JSON input provided.' })
  })

  it('rejects non-object JSON', () => {
    expect(jsonToCsv('[1,2,3]').ok).toBe(false)
    expect(jsonToCsv('"hello"').ok).toBe(false)
    expect(jsonToCsv('42').ok).toBe(false)
    expect(jsonToCsv('null').ok).toBe(false)
  })

  it('returns a friendly error on invalid JSON', () => {
    const result = jsonToCsv('{nope')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/^Invalid JSON —/)
  })
})

describe('csvToJson', () => {
  it('converts with header row by default', () => {
    const result = csvToJson('a,b\n1,2\n3,4')
    expect(result).toEqual({
      ok: true,
      result: '[\n  {\n    "a": "1",\n    "b": "2"\n  },\n  {\n    "a": "3",\n    "b": "4"\n  }\n]',
    })
  })

  it('converts without header row', () => {
    const result = csvToJson('1,2\n3,4', { header: false })
    expect(result).toEqual({
      ok: true,
      result: '[\n  [\n    "1",\n    "2"\n  ],\n  [\n    "3",\n    "4"\n  ]\n]',
    })
  })

  it('respects a custom delimiter', () => {
    const result = csvToJson('a;b\n1;2', { delimiter: ';' })
    expect(result).toEqual({ ok: true, result: '[\n  {\n    "a": "1",\n    "b": "2"\n  }\n]' })
  })

  it('auto-detects the delimiter when not specified', () => {
    const result = csvToJson('a|b\n1|2')
    expect(result).toEqual({ ok: true, result: '[\n  {\n    "a": "1",\n    "b": "2"\n  }\n]' })
  })

  it('skips empty lines', () => {
    const result = csvToJson('a,b\n1,2\n\n3,4')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).not.toContain('3,4\n\n')
  })

  it('rejects empty input', () => {
    expect(csvToJson('')).toEqual({ ok: false, error: 'No CSV input provided.' })
  })
})

describe('round trip', () => {
  it('JSON → CSV → JSON preserves flat records', () => {
    const csv = jsonToCsv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]')
    expect(csv.ok).toBe(true)
    if (csv.ok) {
      const back = csvToJson(csv.result)
      expect(back.ok).toBe(true)
      if (back.ok) {
        expect(back.result).toContain('"a": "1"')
        expect(back.result).toContain('"b": "y"')
      }
    }
  })
})
