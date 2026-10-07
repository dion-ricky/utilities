import { describe, expect, it } from 'vitest'
import {
  buildQrOptions,
  clampMargin,
  clampSize,
  DEFAULT_ECC,
  DEFAULT_MARGIN,
  DEFAULT_SIZE,
  MAX_MARGIN,
  MAX_SIZE,
  MIN_MARGIN,
  MIN_SIZE,
  normalizeEcc,
} from './logic'

describe('clampSize', () => {
  it('keeps in-range values and clamps out-of-range ones', () => {
    expect(clampSize(256)).toBe(256)
    expect(clampSize(50)).toBe(MIN_SIZE)
    expect(clampSize(2000)).toBe(MAX_SIZE)
  })

  it('floors fractions and maps non-finite input to the default', () => {
    expect(clampSize(300.9)).toBe(300)
    expect(clampSize(Number.NaN)).toBe(DEFAULT_SIZE)
  })
})

describe('clampMargin', () => {
  it('keeps in-range values and clamps out-of-range ones', () => {
    expect(clampMargin(4)).toBe(4)
    expect(clampMargin(-1)).toBe(MIN_MARGIN)
    expect(clampMargin(99)).toBe(MAX_MARGIN)
  })

  it('floors fractions and maps non-finite input to the default', () => {
    expect(clampMargin(2.9)).toBe(2)
    expect(clampMargin(Number.NaN)).toBe(DEFAULT_MARGIN)
  })
})

describe('normalizeEcc', () => {
  it('accepts L, M, Q and H', () => {
    expect(normalizeEcc('L')).toBe('L')
    expect(normalizeEcc('M')).toBe('M')
    expect(normalizeEcc('Q')).toBe('Q')
    expect(normalizeEcc('H')).toBe('H')
  })

  it('falls back to M for anything else, including undefined', () => {
    expect(normalizeEcc('X')).toBe(DEFAULT_ECC)
    expect(normalizeEcc('l')).toBe(DEFAULT_ECC)
    expect(normalizeEcc('')).toBe(DEFAULT_ECC)
    expect(normalizeEcc(undefined)).toBe(DEFAULT_ECC)
  })
})

describe('buildQrOptions', () => {
  it('applies defaults when called with no arguments', () => {
    expect(buildQrOptions()).toEqual({
      width: DEFAULT_SIZE,
      margin: DEFAULT_MARGIN,
      errorCorrectionLevel: DEFAULT_ECC,
    })
  })

  it('passes through valid values', () => {
    expect(buildQrOptions({ size: 512, margin: 2, ecc: 'H' })).toEqual({
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
    })
  })

  it('clamps and validates invalid values', () => {
    expect(buildQrOptions({ size: 10, margin: 50, ecc: 'Z' })).toEqual({
      width: MIN_SIZE,
      margin: MAX_MARGIN,
      errorCorrectionLevel: DEFAULT_ECC,
    })
  })
})
