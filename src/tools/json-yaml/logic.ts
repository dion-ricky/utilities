import { dump, load } from 'js-yaml'

export type ConversionResult = { ok: true; result: string } | { ok: false; error: string }

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function jsonToYaml(text: string): ConversionResult {
  if (!text.trim()) {
    return { ok: false, error: 'No JSON input provided.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return { ok: false, error: `Invalid JSON — ${errorMessage(error)}` }
  }

  try {
    return { ok: true, result: dump(parsed, { indent: 2 }) }
  } catch (error) {
    return { ok: false, error: `Could not convert to YAML — ${errorMessage(error)}` }
  }
}

export function yamlToJson(text: string): ConversionResult {
  if (!text.trim()) {
    return { ok: false, error: 'No YAML input provided.' }
  }

  let parsed: unknown
  try {
    parsed = load(text)
  } catch (error) {
    return { ok: false, error: `Invalid YAML — ${errorMessage(error)}` }
  }

  try {
    return { ok: true, result: JSON.stringify(parsed, null, 2) ?? '' }
  } catch (error) {
    return { ok: false, error: `Could not convert to JSON — ${errorMessage(error)}` }
  }
}
