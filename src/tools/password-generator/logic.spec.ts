import { describe, expect, it } from 'vitest'
import {
  AMBIGUOUS_CHARS,
  buildPool,
  CHARSETS,
  clampLength,
  generatePassword,
  MAX_LENGTH,
  MIN_LENGTH,
  passwordEntropy,
  secureRandomInt,
  stripAmbiguous,
} from './logic'

describe('clampLength', () => {
  it('keeps in-range values and clamps out-of-range ones', () => {
    expect(clampLength(16)).toBe(16)
    expect(clampLength(0)).toBe(MIN_LENGTH)
    expect(clampLength(-5)).toBe(MIN_LENGTH)
    expect(clampLength(1000)).toBe(MAX_LENGTH)
  })

  it('floors fractions and maps non-finite input to the default', () => {
    expect(clampLength(16.9)).toBe(16)
    expect(clampLength(Number.NaN)).toBe(16)
  })
})

describe('stripAmbiguous', () => {
  it('removes I, l, 1, O and 0', () => {
    expect(stripAmbiguous('Il1O0')).toBe('')
    expect(stripAmbiguous(CHARSETS.digits)).toBe('23456789')
    expect(stripAmbiguous(CHARSETS.uppercase)).not.toMatch(/[IO]/)
    expect(stripAmbiguous(CHARSETS.lowercase)).not.toMatch(/[l]/)
  })
})

describe('secureRandomInt', () => {
  it('stays within bounds', () => {
    for (let i = 0; i < 200; i++) {
      const value = secureRandomInt(10)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(10)
    }
  })

  it('covers the full range for a small pool', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(secureRandomInt(5))
    expect(seen).toEqual(new Set([0, 1, 2, 3, 4]))
  })

  it('rejects invalid bounds', () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError)
    expect(() => secureRandomInt(-3)).toThrow(RangeError)
    expect(() => secureRandomInt(1.5)).toThrow(RangeError)
  })
})

describe('buildPool', () => {
  it('is empty when no charset is selected', () => {
    expect(buildPool({ length: 16 })).toBe('')
  })

  it('concatenates the selected charsets', () => {
    expect(buildPool({ length: 16, digits: true })).toBe(CHARSETS.digits)
    expect(buildPool({ length: 16, digits: true, symbols: true })).toBe(
      CHARSETS.digits + CHARSETS.symbols,
    )
  })

  it('strips ambiguous characters when requested', () => {
    const pool = buildPool({ length: 16, digits: true, excludeAmbiguous: true })
    expect(pool).toBe(stripAmbiguous(CHARSETS.digits))
    expect([...pool].some((c) => AMBIGUOUS_CHARS.includes(c))).toBe(false)
  })
})

describe('passwordEntropy', () => {
  it('computes length * log2(poolSize) to one decimal', () => {
    expect(passwordEntropy(16, 26)).toBe(Math.round(16 * Math.log2(26) * 10) / 10)
    expect(passwordEntropy(8, 94)).toBe(Math.round(8 * Math.log2(94) * 10) / 10)
  })

  it('returns 0 for degenerate inputs', () => {
    expect(passwordEntropy(0, 26)).toBe(0)
    expect(passwordEntropy(16, 1)).toBe(0)
    expect(passwordEntropy(-3, 26)).toBe(0)
  })
})

describe('generatePassword', () => {
  const ALL_ON = { uppercase: true, lowercase: true, digits: true, symbols: true } as const

  it('returns an error object when no charset is selected', () => {
    const result = generatePassword({ length: 16 })
    expect('error' in result && typeof result.error === 'string').toBe(true)
  })

  it('returns a password of the requested (clamped) length', () => {
    const ok = generatePassword({ length: 24, ...ALL_ON })
    expect('password' in ok && ok.password).toHaveLength(24)

    const clamped = generatePassword({ length: 999, ...ALL_ON })
    expect('password' in clamped && clamped.password).toHaveLength(MAX_LENGTH)
  })

  it('only uses characters from the selected charsets', () => {
    const pool = CHARSETS.lowercase + CHARSETS.digits
    for (let i = 0; i < 50; i++) {
      const result = generatePassword({ length: 32, lowercase: true, digits: true })
      if ('password' in result) {
        for (const char of result.password) {
          expect(pool).toContain(char)
        }
      }
      expect('error' in result).toBe(false)
    }
  })

  it('honours digits-only selection', () => {
    const result = generatePassword({ length: 20, digits: true })
    expect('password' in result && result.password).toMatch(/^\d{20}$/)
  })

  it('never emits ambiguous characters when excludeAmbiguous is on', () => {
    for (let i = 0; i < 20; i++) {
      const result = generatePassword({ length: 64, ...ALL_ON, excludeAmbiguous: true })
      if ('password' in result) {
        for (const char of result.password) {
          expect(AMBIGUOUS_CHARS.includes(char)).toBe(false)
        }
      }
    }
  })

  it('produces different passwords across calls', () => {
    const a = generatePassword({ length: 32, ...ALL_ON })
    const b = generatePassword({ length: 32, ...ALL_ON })
    expect('password' in a && 'password' in b && a.password !== b.password).toBe(true)
  })
})
