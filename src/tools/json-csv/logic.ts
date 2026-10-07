import type { ParseResult } from 'papaparse'
import { parse as parseCsv, unparse } from 'papaparse'

export type ConversionResult = { ok: true; result: string } | { ok: false; error: string }

export interface JsonToCsvOptions {
  /** CSV delimiter; '' or undefined means auto-detect. */
  delimiter?: string
  /** Flatten nested plain objects into dot-notation keys. */
  flatten?: boolean
}

export interface CsvToJsonOptions {
  /** CSV delimiter; '' or undefined means auto-detect. */
  delimiter?: string
  /** Treat the first row as a header (default true). */
  header?: boolean
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Recursively flatten a plain object into dot-notation keys.
 * Arrays and primitives are kept as-is (arrays become JSON strings in CSV).
 */
export function flattenRecord(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenRecord(value as Record<string, unknown>, fullKey))
    } else {
      out[fullKey] = value
    }
  }
  return out
}

function parseJsonRecords(
  text: string,
): { ok: true; records: Record<string, unknown>[] } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return { ok: false, error: `Invalid JSON — ${errorMessage(error)}` }
  }

  if (Array.isArray(parsed)) {
    const invalid = parsed.some(
      (item) => item === null || typeof item !== 'object' || Array.isArray(item),
    )
    if (invalid) {
      return { ok: false, error: 'JSON must be an array of objects (or a single object).' }
    }
    return { ok: true, records: parsed as Record<string, unknown>[] }
  }

  if (parsed !== null && typeof parsed === 'object') {
    return { ok: true, records: [parsed as Record<string, unknown>] }
  }

  return { ok: false, error: 'JSON must be an object or an array of objects.' }
}

export function jsonToCsv(text: string, options: JsonToCsvOptions = {}): ConversionResult {
  if (!text.trim()) {
    return { ok: false, error: 'No JSON input provided.' }
  }

  const parsed = parseJsonRecords(text)
  if (!parsed.ok) return parsed

  const records = parsed.records.map((record) => {
    const flat = options.flatten ? flattenRecord(record) : record
    // Stringify arrays so their commas are not treated as CSV delimiters.
    const normalized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(flat)) {
      normalized[key] = Array.isArray(value) ? JSON.stringify(value) : value
    }
    return normalized
  })
  if (records.length === 0) {
    return { ok: true, result: '' }
  }

  try {
    const csv = unparse(records, options.delimiter ? { delimiter: options.delimiter } : undefined)
    return { ok: true, result: csv.replace(/\r\n/g, '\n') }
  } catch (error) {
    return { ok: false, error: `Could not convert to CSV — ${errorMessage(error)}` }
  }
}

export function csvToJson(text: string, options: CsvToJsonOptions = {}): ConversionResult {
  if (!text.trim()) {
    return { ok: false, error: 'No CSV input provided.' }
  }

  let parsed: ParseResult<unknown>
  try {
    parsed = parseCsv(text, {
      header: options.header ?? true,
      delimiter: options.delimiter || undefined,
      skipEmptyLines: true,
    })
  } catch (error) {
    return { ok: false, error: `Could not parse CSV — ${errorMessage(error)}` }
  }

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0]
    if (first) {
      const row = first.row !== undefined ? ` on row ${first.row + 1}` : ''
      return { ok: false, error: `CSV parse error${row} — ${first.message}` }
    }
  }

  return { ok: true, result: JSON.stringify(parsed.data, null, 2) }
}
