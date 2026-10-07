export interface ParsedColor {
  /** Red, 0–255. */
  r: number
  /** Green, 0–255. */
  g: number
  /** Blue, 0–255. */
  b: number
  /** Alpha, 0–1. */
  a: number
}

export interface HslColor {
  /** Hue, 0–360. */
  h: number
  /** Saturation, 0–1. */
  s: number
  /** Lightness, 0–1. */
  l: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function parseHex(text: string): ParsedColor | null {
  const match = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text)
  if (!match || match[1] === undefined) return null
  const hex = match[1]
  const expanded = hex.length <= 4 ? [...hex].map((char) => char + char).join('') : hex
  const byte = (index: number) => Number.parseInt(expanded.slice(index, index + 2), 16)
  return {
    r: byte(0),
    g: byte(2),
    b: byte(4),
    a: expanded.length === 8 ? byte(6) / 255 : 1,
  }
}

function splitArgs(raw: string): string[] {
  return raw
    .trim()
    .split(/\s*[,/\s]\s*/)
    .filter((part) => part.length > 0)
}

function parseChannel(part: string | undefined): number | null {
  if (part === undefined) return null
  if (part.endsWith('%')) {
    const value = Number(part.slice(0, -1))
    return Number.isNaN(value) ? null : (value / 100) * 255
  }
  const value = Number(part)
  return Number.isNaN(value) ? null : value
}

function parseAlphaPart(part: string | undefined): number | null {
  if (part === undefined) return null
  const value = part.endsWith('%') ? Number(part.slice(0, -1)) / 100 : Number(part)
  return Number.isNaN(value) ? null : clamp(value, 0, 1)
}

function parseRgb(text: string): ParsedColor | null {
  const match = /^rgba?\s*\(([^)]*)\)$/.exec(text)
  if (!match || match[1] === undefined) return null
  const parts = splitArgs(match[1])
  if (parts.length !== 3 && parts.length !== 4) return null
  const r = parseChannel(parts[0])
  const g = parseChannel(parts[1])
  const b = parseChannel(parts[2])
  const alpha = parts.length === 4 ? parseAlphaPart(parts[3]) : 1
  if (r === null || g === null || b === null || alpha === null) return null
  return { r, g, b, a: alpha }
}

function parseHue(part: string | undefined): number | null {
  if (part === undefined) return null
  const withoutDeg = part.endsWith('deg') ? part.slice(0, -3) : part
  const value = Number(withoutDeg)
  return Number.isNaN(value) ? null : value
}

function parsePercent(part: string | undefined): number | null {
  if (part === undefined || !part.endsWith('%')) return null
  const value = Number(part.slice(0, -1))
  return Number.isNaN(value) ? null : value
}

function parseHsl(text: string): ParsedColor | null {
  const match = /^hsla?\s*\(([^)]*)\)$/.exec(text)
  if (!match || match[1] === undefined) return null
  const parts = splitArgs(match[1])
  if (parts.length !== 3 && parts.length !== 4) return null
  const h = parseHue(parts[0])
  const s = parsePercent(parts[1])
  const l = parsePercent(parts[2])
  const alpha = parts.length === 4 ? parseAlphaPart(parts[3]) : 1
  if (h === null || s === null || l === null || alpha === null) return null
  const rgb = hslToRgb(h, s / 100, l / 100)
  return { ...rgb, a: alpha }
}

/**
 * Parses a color string: #rgb, #rrggbb, #rrggbbaa, rgb()/rgba() and hsl()/hsla()
 * (comma or space syntax, % or numbers, optional alpha). Returns null when unparsable.
 */
export function parseColor(input: string): ParsedColor | null {
  const text = input.trim().toLowerCase()
  if (text.length === 0) return null
  if (text.startsWith('rgb')) return parseRgb(text)
  if (text.startsWith('hsl')) return parseHsl(text)
  return parseHex(text)
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue = (((h % 360) + 360) % 360) / 360
  if (s === 0) {
    const value = l * 255
    return { r: value, g: value, b: value }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t: number): number => {
    const shifted = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (shifted < 1 / 6) return p + (q - p) * 6 * shifted
    if (shifted < 1 / 2) return q
    if (shifted < 2 / 3) return p + (q - p) * (2 / 3 - shifted) * 6
    return p
  }
  return {
    r: channel(hue + 1 / 3) * 255,
    g: channel(hue) * 255,
    b: channel(hue - 1 / 3) * 255,
  }
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

export function toHex(color: ParsedColor): string {
  const byte = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, '0')
  const base = `#${byte(color.r)}${byte(color.g)}${byte(color.b)}`
  return color.a < 1 ? base + byte(color.a * 255) : base
}

export function toRgbString(color: ParsedColor): string {
  const r = Math.round(clamp(color.r, 0, 255))
  const g = Math.round(clamp(color.g, 0, 255))
  const b = Math.round(clamp(color.b, 0, 255))
  return color.a < 1
    ? `rgba(${r}, ${g}, ${b}, ${Number(color.a.toFixed(3))})`
    : `rgb(${r}, ${g}, ${b})`
}

export function toHslString(color: ParsedColor): string {
  const { h, s, l } = rgbToHsl(color.r, color.g, color.b)
  const core = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`
  return color.a < 1 ? `hsla(${core}, ${Number(color.a.toFixed(3))})` : `hsl(${core})`
}

export function toCmykString(color: ParsedColor): string {
  const percent = (value: number) => `${Math.round(clamp(value, 0, 1) * 100)}%`
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const k = 1 - Math.max(r, g, b)
  if (k >= 1) return 'cmyk(0%, 0%, 0%, 100%)'
  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)
  return `cmyk(${percent(c)}, ${percent(m)}, ${percent(y)}, ${percent(k)})`
}
