/**
 * Password generation using crypto.getRandomValues with rejection
 * sampling to avoid modulo bias.
 */

export const MIN_LENGTH = 4
export const MAX_LENGTH = 128
export const DEFAULT_LENGTH = 16

/** Character sets available for password generation. */
export const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/',
} as const

/** Visually confusable characters removed by "Exclude ambiguous". */
export const AMBIGUOUS_CHARS = 'Il1O0'

export type PasswordCharsetKey = keyof typeof CHARSETS

export interface PasswordOptions {
  length: number
  uppercase?: boolean
  lowercase?: boolean
  digits?: boolean
  symbols?: boolean
  excludeAmbiguous?: boolean
}

export type PasswordResult = { password: string } | { error: string }

/** Clamp a requested length into the 4–128 range (non-finite → default). */
export function clampLength(length: number): number {
  const n = Number.isFinite(length) ? Math.floor(length) : DEFAULT_LENGTH
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n))
}

/** Strip ambiguous characters (I l 1 O 0) from a charset string. */
export function stripAmbiguous(charset: string): string {
  return [...charset].filter((char) => !AMBIGUOUS_CHARS.includes(char)).join('')
}

/**
 * Shannon entropy of a password drawn uniformly from `poolSize` symbols:
 * length * log2(poolSize), rounded to one decimal.
 */
export function passwordEntropy(length: number, poolSize: number): number {
  if (length <= 0 || poolSize <= 1) return 0
  return Math.round(length * Math.log2(poolSize) * 10) / 10
}

/**
 * Uniform random integer in [0, maxExclusive) via rejection sampling on
 * crypto.getRandomValues. Never uses modulo on the raw 32-bit value alone,
 * so every value is equally likely.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0x100000000) {
    throw new RangeError(`maxExclusive must be an integer in (0, 2^32], got ${maxExclusive}`)
  }
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive
  const buf = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buf)
    value = buf[0] ?? 0
  } while (value >= limit)
  return value % maxExclusive
}

/** Build the effective character pool from the selected options. */
export function buildPool(opts: PasswordOptions): string {
  const sets: string[] = []
  const keys: PasswordCharsetKey[] = ['uppercase', 'lowercase', 'digits', 'symbols']
  for (const key of keys) {
    if (!opts[key]) continue
    sets.push(opts.excludeAmbiguous ? stripAmbiguous(CHARSETS[key]) : CHARSETS[key])
  }
  return sets.join('')
}

/** Generate a password, or return a friendly error when no charset is selected. */
export function generatePassword(opts: PasswordOptions): PasswordResult {
  const length = clampLength(opts.length)
  const pool = buildPool(opts)
  if (!pool) {
    return { error: 'Select at least one character set.' }
  }
  const chars: string[] = []
  for (let i = 0; i < length; i++) {
    chars.push(pool[secureRandomInt(pool.length)] ?? '')
  }
  return { password: chars.join('') }
}
