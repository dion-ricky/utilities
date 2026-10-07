import { describe, expect, it } from 'vitest'
import { epochToIso, epochToLocal, localDateToEpoch, parseEpoch, relativeTime } from './logic'

describe('parseEpoch', () => {
  it('returns null for empty input', () => {
    expect(parseEpoch('')).toBeNull()
    expect(parseEpoch('   ')).toBeNull()
  })

  it('returns null for non-numeric input', () => {
    expect(parseEpoch('abc')).toBeNull()
    expect(parseEpoch('12.5')).toBeNull()
    expect(parseEpoch('-5')).toBeNull()
    expect(parseEpoch('1e5')).toBeNull()
  })

  it('treats small magnitudes as seconds', () => {
    expect(parseEpoch('0')).toEqual({ seconds: 0, millis: 0 })
    expect(parseEpoch('1700000000')).toEqual({ seconds: 1700000000, millis: 1700000000000 })
  })

  it('treats large magnitudes as milliseconds', () => {
    expect(parseEpoch('1700000000000')).toEqual({
      seconds: 1700000000,
      millis: 1700000000000,
    })
  })

  it('uses the 1e11 boundary', () => {
    expect(parseEpoch('99999999999')).toEqual({ seconds: 99999999999, millis: 99999999999000 })
    expect(parseEpoch('100000000000')).toEqual({ seconds: 100000000, millis: 100000000000 })
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseEpoch(' 42 ')).toEqual({ seconds: 42, millis: 42000 })
  })
})

describe('epochToIso', () => {
  it('formats epoch zero as Unix epoch in UTC', () => {
    expect(epochToIso(0)).toBe('1970-01-01T00:00:00.000Z')
  })

  it('formats a known timestamp in UTC regardless of local timezone', () => {
    expect(epochToIso(1700000000000)).toBe('2023-11-14T22:13:20.000Z')
  })

  it('handles negative epochs', () => {
    expect(epochToIso(-1000)).toBe('1969-12-31T23:59:59.000Z')
  })
})

describe('epochToLocal', () => {
  it('contains the UTC date components for the reference timestamp when TZ is UTC', () => {
    // Format is YYYY-MM-DD HH:mm:ss in the local zone; just check the shape.
    expect(epochToLocal(1700000000000)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('marks invalid dates as invalid', () => {
    expect(epochToLocal(Number.NaN)).toBe('Invalid date')
  })
})

describe('relativeTime', () => {
  const now = 1_000_000_000_000

  it('reports "just now" for (almost) current times', () => {
    expect(relativeTime(now, now)).toBe('just now')
    expect(relativeTime(now - 500, now)).toBe('just now')
  })

  it('reports past seconds, minutes, hours, and days', () => {
    expect(relativeTime(now - 1_500, now)).toBe('1 second ago')
    expect(relativeTime(now - 45_000, now)).toBe('45 seconds ago')
    expect(relativeTime(now - 60_000, now)).toBe('1 minute ago')
    expect(relativeTime(now - 90_000, now)).toBe('1 minute ago')
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5 minutes ago')
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3 hours ago')
    expect(relativeTime(now - 3 * 86_400_000, now)).toBe('3 days ago')
  })

  it('reports singular and plural correctly', () => {
    expect(relativeTime(now - 120_000, now)).toBe('2 minutes ago')
    expect(relativeTime(now - 3_600_000, now)).toBe('1 hour ago')
  })

  it('reports months and years (30/365 day buckets)', () => {
    expect(relativeTime(now - 60 * 86_400_000, now)).toBe('2 months ago')
    expect(relativeTime(now - 400 * 86_400_000, now)).toBe('1 year ago')
  })

  it('reports future times with "in"', () => {
    expect(relativeTime(now + 5 * 60_000, now)).toBe('in 5 minutes')
    expect(relativeTime(now + 2 * 86_400_000, now)).toBe('in 2 days')
    expect(relativeTime(now + 3_600_000, now)).toBe('in 1 hour')
  })
})

describe('localDateToEpoch', () => {
  it('returns null for empty or malformed input', () => {
    expect(localDateToEpoch('')).toBeNull()
    expect(localDateToEpoch('not-a-date')).toBeNull()
    expect(localDateToEpoch('2023-11-14')).toBeNull()
    expect(localDateToEpoch('2023-11-14 22:13')).toBeNull()
  })

  it('returns null for out-of-range components', () => {
    expect(localDateToEpoch('2023-13-01T00:00')).toBeNull()
    expect(localDateToEpoch('2023-00-10T00:00')).toBeNull()
    expect(localDateToEpoch('2023-11-00T00:00')).toBeNull()
    expect(localDateToEpoch('2023-11-32T00:00')).toBeNull()
    expect(localDateToEpoch('2023-11-14T24:00')).toBeNull()
    expect(localDateToEpoch('2023-11-14T10:60')).toBeNull()
  })

  it('returns null for calendar-invalid dates like Feb 30', () => {
    expect(localDateToEpoch('2023-02-30T12:00')).toBeNull()
    expect(localDateToEpoch('2023-04-31T00:00')).toBeNull()
  })

  it('parses the datetime-local value as local time (components round-trip)', () => {
    const parts = localDateToEpoch('2023-11-14T22:13')
    expect(parts).not.toBeNull()
    if (!parts) return
    const date = new Date(parts.millis)
    expect(date.getFullYear()).toBe(2023)
    expect(date.getMonth()).toBe(10)
    expect(date.getDate()).toBe(14)
    expect(date.getHours()).toBe(22)
    expect(date.getMinutes()).toBe(13)
    expect(parts.millis % 1000).toBe(0)
  })

  it('handles leap days', () => {
    expect(localDateToEpoch('2024-02-29T00:00')).not.toBeNull()
    expect(localDateToEpoch('2023-02-29T00:00')).toBeNull()
  })
})
