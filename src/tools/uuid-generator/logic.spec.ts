import { describe, expect, it } from 'vitest'
import { clampCount, formatUuid, generateUuids, MAX_COUNT, MIN_COUNT } from './logic'

const V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('clampCount', () => {
  it('keeps values inside the range unchanged', () => {
    expect(clampCount(1)).toBe(1)
    expect(clampCount(42)).toBe(42)
    expect(clampCount(MAX_COUNT)).toBe(MAX_COUNT)
  })

  it('clamps values below the minimum and above the maximum', () => {
    expect(clampCount(0)).toBe(MIN_COUNT)
    expect(clampCount(-10)).toBe(MIN_COUNT)
    expect(clampCount(501)).toBe(MAX_COUNT)
    expect(clampCount(10000)).toBe(MAX_COUNT)
  })

  it('floors fractional values and clamps infinities to the bounds', () => {
    expect(clampCount(7.9)).toBe(7)
    expect(clampCount(Number.NaN)).toBe(MIN_COUNT)
    expect(clampCount(Number.POSITIVE_INFINITY)).toBe(MAX_COUNT)
  })
})

describe('formatUuid', () => {
  const sample = '01234567-89ab-4cde-8f01-23456789abcd'

  it('leaves the UUID untouched with default options', () => {
    expect(formatUuid(sample)).toBe(sample)
  })

  it('uppercases when requested', () => {
    expect(formatUuid(sample, { uppercase: true })).toBe(sample.toUpperCase())
  })

  it('strips hyphens when hyphens is false', () => {
    expect(formatUuid(sample, { hyphens: false })).toBe('0123456789ab4cde8f0123456789abcd')
  })

  it('combines both options', () => {
    expect(formatUuid(sample, { uppercase: true, hyphens: false })).toBe(
      '0123456789AB4CDE8F0123456789ABCD',
    )
  })
})

describe('generateUuids', () => {
  it('generates RFC 4122 v4 UUIDs', () => {
    const uuids = generateUuids(50)
    expect(uuids).toHaveLength(50)
    for (const uuid of uuids) {
      expect(uuid).toMatch(V4_RE)
    }
  })

  it('generates unique UUIDs', () => {
    const uuids = generateUuids(200)
    expect(new Set(uuids).size).toBe(uuids.length)
  })

  it('respects the requested count and clamps it', () => {
    expect(generateUuids(5)).toHaveLength(5)
    expect(generateUuids(0)).toHaveLength(MIN_COUNT)
    expect(generateUuids(1000)).toHaveLength(MAX_COUNT)
  })

  it('applies the uppercase transform', () => {
    const [uuid] = generateUuids(1, { uppercase: true })
    expect(uuid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/)
  })

  it('applies the no-hyphens transform', () => {
    const [uuid] = generateUuids(1, { hyphens: false })
    expect(uuid).not.toContain('-')
    expect(uuid).toMatch(/^[0-9a-f]{32}$/)
    // Version nibble still readable at position 12.
    expect(uuid?.[12]).toBe('4')
  })

  it('applies both transforms together', () => {
    const [uuid] = generateUuids(1, { uppercase: true, hyphens: false })
    expect(uuid).toMatch(/^[0-9A-F]{32}$/)
  })
})
