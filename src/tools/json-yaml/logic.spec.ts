import { describe, expect, it } from 'vitest'
import { jsonToYaml, yamlToJson } from './logic'

describe('jsonToYaml', () => {
  it('converts a simple object', () => {
    const result = jsonToYaml('{"name": "Ada", "age": 36}')
    expect(result).toEqual({ ok: true, result: 'name: Ada\nage: 36\n' })
  })

  it('converts nested structures with 2-space indent', () => {
    const result = jsonToYaml('{"a": {"b": [1, 2]}}')
    expect(result).toEqual({
      ok: true,
      result: 'a:\n  b:\n    - 1\n    - 2\n',
    })
  })

  it('converts arrays at the top level', () => {
    const result = jsonToYaml('[1, "two", true]')
    expect(result).toEqual({ ok: true, result: '- 1\n- two\n- true\n' })
  })

  it('converts null', () => {
    const result = jsonToYaml('{"a": null}')
    expect(result).toEqual({ ok: true, result: 'a: null\n' })
  })

  it('rejects empty input', () => {
    expect(jsonToYaml('')).toEqual({ ok: false, error: 'No JSON input provided.' })
    expect(jsonToYaml('   \n  ')).toEqual({ ok: false, error: 'No JSON input provided.' })
  })

  it('returns a friendly error on invalid JSON', () => {
    const result = jsonToYaml('{invalid')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/^Invalid JSON —/)
  })
})

describe('yamlToJson', () => {
  it('converts a simple document', () => {
    const result = yamlToJson('name: Ada\nage: 36\n')
    expect(result).toEqual({ ok: true, result: '{\n  "name": "Ada",\n  "age": 36\n}' })
  })

  it('converts nested lists and maps', () => {
    const result = yamlToJson('a:\n  b:\n    - 1\n    - 2\n')
    expect(result).toEqual({
      ok: true,
      result: '{\n  "a": {\n    "b": [\n      1,\n      2\n    ]\n  }\n}',
    })
  })

  it('parses YAML scalars into JSON types', () => {
    const result = yamlToJson('enabled: true\nratio: 1.5\nmissing: null\n')
    expect(result).toEqual({
      ok: true,
      result: '{\n  "enabled": true,\n  "ratio": 1.5,\n  "missing": null\n}',
    })
  })

  it('rejects empty input', () => {
    expect(yamlToJson('')).toEqual({ ok: false, error: 'No YAML input provided.' })
  })

  it('returns a friendly error on invalid YAML', () => {
    const result = yamlToJson('a: [unclosed\nb: {unclosed')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/^Invalid YAML —/)
  })
})

describe('round trip', () => {
  it('JSON → YAML → JSON preserves data', () => {
    const json = '{"user":{"name":"Ada","tags":["x","y"],"active":true}}'
    const asYaml = jsonToYaml(json)
    expect(asYaml.ok).toBe(true)
    if (asYaml.ok) {
      const back = yamlToJson(asYaml.result)
      expect(back.ok).toBe(true)
      if (back.ok)
        expect(back.result).toBe(
          '{\n  "user": {\n    "name": "Ada",\n    "tags": [\n      "x",\n      "y"\n    ],\n    "active": true\n  }\n}',
        )
    }
  })
})
