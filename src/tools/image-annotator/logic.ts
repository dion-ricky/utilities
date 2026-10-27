/**
 * Pure image-annotator logic. No DOM, no Vue, no clock — safe to unit test in
 * the node environment. Geometry is expressed in image pixels throughout.
 */

export type ToolMode = 'select' | 'crop' | 'pen' | 'highlight' | 'text'

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface StrokeAnnotation {
  id: string
  type: 'pen' | 'highlight'
  color: string
  width: number
  points: Point[]
}

export interface TextAnnotation {
  id: string
  type: 'text'
  color: string
  fontSize: number
  text: string
  x: number
  y: number
}

export type Annotation = StrokeAnnotation | TextAnnotation

export interface EditorSnapshot {
  /** Cropped region in original-image pixel space. */
  crop: Rect
  /** Annotations in cropped-image pixel space (top-left = crop origin). */
  annotations: Annotation[]
}

export const DEFAULT_HISTORY_LIMIT = 50

/** Rough average glyph width as a fraction of the font size. */
const TEXT_WIDTH_FACTOR = 0.6

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  let normalized = hex.trim().replace(/^#/, '')
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

/** `#rrggbb`/`#rgb` → `rgba(r, g, b, alpha)`; invalid input falls back to black. */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex) ?? { r: 0, g: 0, b: 0 }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/** Pick a white or black halo that contrasts with the given text colour. */
export function contrastOutlineColor(hex: string): 'rgba(255,255,255,0.9)' | 'rgba(0,0,0,0.85)' {
  const rgb = parseHex(hex) ?? { r: 0, g: 0, b: 0 }
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
  return luminance > 128 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'
}

/**
 * Normalize a drag (in either direction) into a positive rect, clamped to
 * `bounds`. Returns `null` when the drag is smaller than `minSize` on either
 * axis, which also filters out accidental clicks.
 */
export function normalizeDragRect(
  start: Point,
  end: Point,
  bounds: Rect,
  minSize = 4,
): Rect | null {
  const left = clamp(Math.min(start.x, end.x), bounds.x, bounds.x + bounds.width)
  const right = clamp(Math.max(start.x, end.x), bounds.x, bounds.x + bounds.width)
  const top = clamp(Math.min(start.y, end.y), bounds.y, bounds.y + bounds.height)
  const bottom = clamp(Math.max(start.y, end.y), bounds.y, bounds.y + bounds.height)
  const width = right - left
  const height = bottom - top
  if (width < minSize || height < minSize) return null
  return { x: left, y: top, width, height }
}

/** Letterbox `imgWidth × imgHeight` inside `maxWidth × maxHeight`. */
export function fitDisplaySize(
  imgWidth: number,
  imgHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number; scale: number } {
  if (imgWidth <= 0 || imgHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: 0, height: 0, scale: 0 }
  }
  const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
  return { width: imgWidth * scale, height: imgHeight * scale, scale }
}

/** Convert CSS pixels inside the display canvas to image pixels. */
export function toImagePoint(offsetX: number, offsetY: number, scale: number): Point {
  if (!Number.isFinite(scale) || scale <= 0) return { x: 0, y: 0 }
  return { x: offsetX / scale, y: offsetY / scale }
}

function isInside(point: Point, bounds: Rect): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  )
}

/**
 * Translate annotations by `(deltaX, deltaY)` and drop the ones that fall
 * outside `newBounds`. Callers moving into a cropped space pass the negated
 * crop origin, e.g. `(-crop.x, -crop.y)`.
 *
 * A stroke is kept when at least one of its points is inside the new bounds
 * (points themselves are not clipped). A text label is kept only when its
 * anchor point is inside.
 */
export function remapAnnotationsAfterCrop(
  annotations: Annotation[],
  deltaX: number,
  deltaY: number,
  newBounds: Rect,
): Annotation[] {
  const kept: Annotation[] = []
  for (const annotation of annotations) {
    if (annotation.type === 'text') {
      const x = annotation.x + deltaX
      const y = annotation.y + deltaY
      if (isInside({ x, y }, newBounds)) kept.push({ ...annotation, x, y })
      continue
    }
    const points = annotation.points.map((point) => ({
      x: point.x + deltaX,
      y: point.y + deltaY,
    }))
    if (points.some((point) => isInside(point, newBounds))) {
      kept.push({ ...annotation, points })
    }
  }
  return kept
}

/** Axis-aligned bounds of an annotation, used for hit-testing and selection. */
export function annotationBounds(annotation: Annotation): Rect {
  if (annotation.type === 'text') {
    return {
      x: annotation.x,
      y: annotation.y,
      width: annotation.text.length * annotation.fontSize * TEXT_WIDTH_FACTOR,
      height: annotation.fontSize,
    }
  }
  const first = annotation.points[0]
  if (!first) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = first.x
  let maxX = first.x
  let minY = first.y
  let maxY = first.y
  for (const point of annotation.points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }
  const pad = annotation.width / 2
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + annotation.width,
    height: maxY - minY + annotation.width,
  }
}

/** Topmost annotation under `point` (later entries win), or `null`. */
export function hitTestAnnotations(
  annotations: Annotation[],
  point: Point,
  tolerance = 8,
): string | null {
  for (let index = annotations.length - 1; index >= 0; index -= 1) {
    const annotation = annotations[index]
    if (!annotation) continue
    const bounds = annotationBounds(annotation)
    if (
      point.x >= bounds.x - tolerance &&
      point.x <= bounds.x + bounds.width + tolerance &&
      point.y >= bounds.y - tolerance &&
      point.y <= bounds.y + bounds.height + tolerance
    ) {
      return annotation.id
    }
  }
  return null
}

export interface History<T> {
  past: T[]
  present: T
  future: T[]
  /** Maximum number of past entries retained; set by `createHistory`. */
  limit?: number
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return DEFAULT_HISTORY_LIMIT
  return Math.floor(limit)
}

export function createHistory<T>(present: T, limit = DEFAULT_HISTORY_LIMIT): History<T> {
  return { past: [], present, future: [], limit: normalizeLimit(limit) }
}

/** Record `next` as the present, dropping the oldest past entry past the cap. */
export function pushHistory<T>(history: History<T>, next: T): History<T> {
  const limit = normalizeLimit(history.limit ?? DEFAULT_HISTORY_LIMIT)
  const past = [...history.past, history.present].slice(-limit)
  return { past, present: next, future: [], limit }
}

export function undoHistory<T>(history: History<T>): History<T> | null {
  if (history.past.length === 0) return null
  const present = history.past[history.past.length - 1]
  if (present === undefined) return null
  return {
    past: history.past.slice(0, -1),
    present,
    future: [history.present, ...history.future],
    limit: history.limit,
  }
}

export function redoHistory<T>(history: History<T>): History<T> | null {
  const present = history.future[0]
  if (present === undefined) return null
  const limit = normalizeLimit(history.limit ?? DEFAULT_HISTORY_LIMIT)
  return {
    past: [...history.past, history.present].slice(-limit),
    present,
    future: history.future.slice(1),
    limit,
  }
}

/** `<sanitized-source-name>-annotated.<ext>`; keeps spaces, strips paths. */
export function buildExportFilename(sourceName: string, ext: 'png' | 'jpeg' | 'webp'): string {
  const filename = sourceName.split(/[\\/]/).pop() ?? ''
  const withoutExtension = filename.replace(/\.[^.]+$/, '')
  const withoutControls = Array.from(withoutExtension)
    .filter((char) => char.charCodeAt(0) >= 32)
    .join('')
  const sanitized = withoutControls
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()
  return `${sanitized || 'image'}-annotated.${ext}`
}

export function defaultCrop(width: number, height: number): Rect {
  return { x: 0, y: 0, width, height }
}

/** Shrink/offset `crop` so it lies fully inside `bounds`. */
export function clampCropToBounds(crop: Rect, bounds: Rect): Rect {
  const left = clamp(crop.x, bounds.x, bounds.x + bounds.width)
  const right = clamp(crop.x + crop.width, bounds.x, bounds.x + bounds.width)
  const top = clamp(crop.y, bounds.y, bounds.y + bounds.height)
  const bottom = clamp(crop.y + crop.height, bounds.y, bounds.y + bounds.height)
  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}
