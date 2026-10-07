/**
 * UUID v4 generation built on crypto.randomUUID (available in secure
 * contexts in browsers and natively in Node 18.17+).
 */

export const MIN_COUNT = 1
export const MAX_COUNT = 500

export interface UuidFormatOptions {
  /** Render the UUID in uppercase. */
  uppercase?: boolean
  /** Keep the dashes (default true). Set to false to strip them. */
  hyphens?: boolean
}

/** Clamp a requested count into the 1–500 range (NaN → 1). */
export function clampCount(count: number): number {
  if (Number.isNaN(count)) return MIN_COUNT
  const n = Math.floor(count)
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, n))
}

/** Apply uppercase / hyphen formatting to a single UUID string. */
export function formatUuid(uuid: string, opts: UuidFormatOptions = {}): string {
  let out = uuid
  if (opts.hyphens === false) out = out.replaceAll('-', '')
  if (opts.uppercase) out = out.toUpperCase()
  return out
}

/**
 * Generate `count` RFC 4122 v4 UUIDs with formatting applied.
 * The count is clamped to 1–500.
 */
export function generateUuids(count: number, opts: UuidFormatOptions = {}): string[] {
  const n = clampCount(count)
  const results: string[] = []
  for (let i = 0; i < n; i++) {
    results.push(formatUuid(crypto.randomUUID(), opts))
  }
  return results
}
