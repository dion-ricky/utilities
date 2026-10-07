import { describe, expect, it } from 'vitest'
import { parseColor, toCmykString, toHex, toHslString, toRgbString } from './logic'

describe('parseColor', () => {
  it('parses 3-digit hex', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColor('f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('parses 6-digit hex case-insensitively', () => {
    expect(parseColor('#FF8800')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
    expect(parseColor('#ff8800')).toEqual({ r: 255, g: 136, b: 0, a: 1 })
  })

  it('parses 8-digit hex with alpha', () => {
    expect(parseColor('#ff000080')).toEqual({ r: 255, g: 0, b: 0, a: 128 / 255 })
  })

  it('parses 4-digit hex with alpha', () => {
    expect(parseColor('#f00f')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('parses rgb() with commas', () => {
    expect(parseColor('rgb(0, 128, 255)')).toEqual({ r: 0, g: 128, b: 255, a: 1 })
  })

  it('parses rgba() with alpha', () => {
    expect(parseColor('rgba(0, 128, 255, 0.5)')).toEqual({ r: 0, g: 128, b: 255, a: 0.5 })
  })

  it('parses modern space-separated rgb() syntax with slash alpha', () => {
    expect(parseColor('rgb(0 128 255 / 0.25)')).toEqual({ r: 0, g: 128, b: 255, a: 0.25 })
  })

  it('parses percentage channels', () => {
    expect(parseColor('rgb(100% 0% 0% / 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 })
  })

  it('parses hsl()', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColor('hsl(120deg, 100%, 25%)')).toEqual({ r: 0, g: 127.5, b: 0, a: 1 })
  })

  it('parses hsla() with alpha', () => {
    expect(parseColor('hsla(240, 100%, 50%, 0.5)')).toEqual({ r: 0, g: 0, b: 255, a: 0.5 })
  })

  it('returns null for invalid input', () => {
    expect(parseColor('')).toBeNull()
    expect(parseColor('not-a-color')).toBeNull()
    expect(parseColor('#ff')).toBeNull()
    expect(parseColor('#ffgg00')).toBeNull()
    expect(parseColor('rgb(1, 2)')).toBeNull()
    expect(parseColor('rgb(1, 2, 3, 4, 5)')).toBeNull()
    expect(parseColor('hsl(0, 50%)')).toBeNull()
    expect(parseColor('rgb(abc, 2, 3)')).toBeNull()
  })

  it('wraps hue into 0-360', () => {
    expect(parseColor('hsl(480, 100%, 50%)')).toEqual({ r: 0, g: 255, b: 0, a: 1 })
  })
})

describe('formatters', () => {
  it('formats hex without alpha for opaque colors', () => {
    expect(toHex({ r: 255, g: 136, b: 0, a: 1 })).toBe('#ff8800')
  })

  it('formats 8-digit hex when transparent', () => {
    expect(toHex({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('#ff000080')
  })

  it('formats rgb() and rgba() strings', () => {
    expect(toRgbString({ r: 255, g: 136, b: 0, a: 1 })).toBe('rgb(255, 136, 0)')
    expect(toRgbString({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('formats hsl() and hsla() strings', () => {
    expect(toHslString({ r: 255, g: 0, b: 0, a: 1 })).toBe('hsl(0, 100%, 50%)')
    expect(toHslString({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('hsla(0, 100%, 50%, 0.5)')
  })

  it('formats cmyk() strings', () => {
    expect(toCmykString({ r: 255, g: 0, b: 0, a: 1 })).toBe('cmyk(0%, 100%, 100%, 0%)')
    expect(toCmykString({ r: 0, g: 0, b: 0, a: 1 })).toBe('cmyk(0%, 0%, 0%, 100%)')
    expect(toCmykString({ r: 255, g: 255, b: 255, a: 1 })).toBe('cmyk(0%, 0%, 0%, 0%)')
  })

  it('ignores alpha in cmyk', () => {
    expect(toCmykString({ r: 255, g: 0, b: 0, a: 0.1 })).toBe('cmyk(0%, 100%, 100%, 0%)')
  })

  it('round-trips through every representation', () => {
    const parsed = parseColor('#336699')
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(toHex(parsed)).toBe('#336699')
    expect(toRgbString(parsed)).toBe('rgb(51, 102, 153)')
    expect(toHslString(parsed)).toBe('hsl(210, 50%, 40%)')
  })
})
