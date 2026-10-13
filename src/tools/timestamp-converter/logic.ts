/** Epoch input below these magnitudes is treated as seconds / milliseconds / microseconds. */
const SECONDS_THRESHOLD = 1e11
const MILLIS_THRESHOLD = 1e14

const EPOCH_PATTERN = /^\d+$/

export interface EpochParts {
  seconds: number
  millis: number
  micros: number
}

/**
 * Parse a digits-only epoch value, auto-detecting seconds vs milliseconds vs
 * microseconds by magnitude (< 1e11 → s, < 1e14 → ms, otherwise → µs).
 * Returns null for empty or non-numeric input. Never uses Date.parse.
 */
export function parseEpoch(input: string): EpochParts | null {
  const trimmed = input.trim()
  if (!EPOCH_PATTERN.test(trimmed)) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return null
  let micros: number
  if (value < SECONDS_THRESHOLD) micros = value * 1e6
  else if (value < MILLIS_THRESHOLD) micros = value * 1e3
  else micros = value
  const millis = Math.floor(micros / 1e3)
  return { seconds: Math.floor(millis / 1000), millis, micros }
}

/**
 * Format an epoch in milliseconds as an ISO 8601 UTC string. `subMsMicros`
 * (0–999) is the sub-millisecond remainder; when non-zero it is appended as a
 * 6-digit fractional-seconds component.
 */
export function epochToIso(ms: number, subMsMicros = 0): string {
  const base = new Date(ms).toISOString()
  if (!subMsMicros) return base
  const micros = (((ms % 1000) + 1000) % 1000) * 1000 + subMsMicros
  return `${base.slice(0, base.length - 5)}.${String(micros).padStart(6, '0')}Z`
}

/** Format an epoch in milliseconds using the browser's local timezone. */
export function epochToLocal(ms: number, subMsMicros = 0): string {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  const pad = (n: number) => String(n).padStart(2, '0')
  const base =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  if (!subMsMicros) return base
  const micros = (((ms % 1000) + 1000) % 1000) * 1000 + subMsMicros
  return `${base}.${String(micros).padStart(6, '0')}`
}

/** Format the difference between `ms` and `now` (default: now) as a relative string. */
export function relativeTime(ms: number, now: number = Date.now()): string {
  const diffMs = ms - now
  const future = diffMs > 0
  const absSeconds = Math.floor(Math.abs(diffMs) / 1000)

  if (absSeconds < 1) {
    return 'just now'
  }

  // Buckets: seconds, minutes, hours, days, months (30 days), years (365 days).
  const units = [
    { secs: 1, one: 'second', many: 'seconds' },
    { secs: 60, one: 'minute', many: 'minutes' },
    { secs: 60 * 60, one: 'hour', many: 'hours' },
    { secs: 60 * 60 * 24, one: 'day', many: 'days' },
    { secs: 60 * 60 * 24 * 30, one: 'month', many: 'months' },
    { secs: 60 * 60 * 24 * 365, one: 'year', many: 'years' },
  ] as const

  let unit: (typeof units)[number] = units[0]
  for (const candidate of units) {
    if (absSeconds >= candidate.secs) unit = candidate
  }

  const count = Math.floor(absSeconds / unit.secs)
  const noun = count === 1 ? unit.one : unit.many
  return future ? `in ${count} ${noun}` : `${count} ${noun} ago`
}

const LOCAL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

/**
 * Parse a `YYYY-MM-DDTHH:mm` value as local time (from a datetime-local input).
 * Constructs a Date from components to avoid UTC parsing pitfalls; returns null
 * for malformed or out-of-range values (e.g. February 30th).
 */
export function localDateToEpoch(value: string): EpochParts | null {
  const match = LOCAL_DATETIME_PATTERN.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  if (hour > 23 || minute > 59) return null

  const date = new Date(year, month - 1, day, hour, minute, 0, 0)
  // Reject rolled-over dates such as Feb 30.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  const millis = date.getTime()
  return { seconds: Math.floor(millis / 1000), millis, micros: millis * 1000 }
}
