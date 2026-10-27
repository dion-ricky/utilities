import { describe, expect, it } from 'vitest'
import {
  annotationBounds,
  buildExportFilename,
  clamp,
  clampCropToBounds,
  contrastOutlineColor,
  createHistory,
  defaultCrop,
  fitDisplaySize,
  hexToRgba,
  hitTestAnnotations,
  normalizeDragRect,
  pushHistory,
  redoHistory,
  remapAnnotationsAfterCrop,
  type StrokeAnnotation,
  type TextAnnotation,
  toImagePoint,
  undoHistory,
} from './logic'

const bounds = { x: 0, y: 0, width: 100, height: 80 }

function pen(id: string, points: Array<{ x: number; y: number }>): StrokeAnnotation {
  return { id, type: 'pen', color: '#ff0000', width: 4, points }
}

function text(id: string, x: number, y: number): TextAnnotation {
  return { id, type: 'text', color: '#000000', fontSize: 10, text: 'abc', x, y }
}

describe('clamp', () => {
  it('bounds a value on both sides', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('normalizeDragRect', () => {
  it('normalizes a reverse drag into positive dimensions', () => {
    expect(normalizeDragRect({ x: 80, y: 60 }, { x: 20, y: 10 }, bounds)).toEqual({
      x: 20,
      y: 10,
      width: 60,
      height: 50,
    })
  })

  it('clamps a drag that starts and ends outside the bounds', () => {
    expect(normalizeDragRect({ x: -20, y: -10 }, { x: 150, y: 100 }, bounds)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    })
  })

  it('returns null for a drag below the minimum size', () => {
    expect(normalizeDragRect({ x: 10, y: 10 }, { x: 13, y: 13 }, bounds)).toBeNull()
  })

  it('honours a custom minimum size', () => {
    expect(normalizeDragRect({ x: 10, y: 10 }, { x: 13, y: 13 }, bounds, 2)).toEqual({
      x: 10,
      y: 10,
      width: 3,
      height: 3,
    })
  })
})

describe('fitDisplaySize', () => {
  it('scales up to fill the limiting dimension while preserving aspect ratio', () => {
    expect(fitDisplaySize(400, 300, 800, 600)).toEqual({ width: 800, height: 600, scale: 2 })
  })

  it('letterboxes a wide image using the width limit', () => {
    expect(fitDisplaySize(1000, 500, 400, 400)).toEqual({ width: 400, height: 200, scale: 0.4 })
  })

  it('returns zeros for degenerate dimensions', () => {
    expect(fitDisplaySize(0, 300, 400, 400)).toEqual({ width: 0, height: 0, scale: 0 })
    expect(fitDisplaySize(400, 300, 0, 400)).toEqual({ width: 0, height: 0, scale: 0 })
  })
})

describe('toImagePoint', () => {
  it('divides CSS pixels by the display scale', () => {
    expect(toImagePoint(100, 50, 0.5)).toEqual({ x: 200, y: 100 })
    expect(toImagePoint(100, 50, 2)).toEqual({ x: 50, y: 25 })
  })

  it('returns the origin for an invalid scale', () => {
    expect(toImagePoint(100, 50, 0)).toEqual({ x: 0, y: 0 })
  })
})

describe('remapAnnotationsAfterCrop', () => {
  const annotations = [
    pen('s1', [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
    ]),
    text('t1', 10, 10),
    pen('s2', [{ x: 120, y: 120 }]),
    text('t2', 120, 120),
    pen('s3', [
      { x: -5, y: -5 },
      { x: 20, y: 20 },
    ]),
  ]
  const newBounds = { x: 0, y: 0, width: 60, height: 60 }

  it('translates annotations into the cropped space', () => {
    const remapped = remapAnnotationsAfterCrop(annotations, -5, -5, newBounds)
    const stroke = remapped.find((annotation) => annotation.id === 's1')
    const label = remapped.find((annotation) => annotation.id === 't1')
    expect(stroke).toMatchObject({
      type: 'pen',
      points: [
        { x: 5, y: 5 },
        { x: 45, y: 45 },
      ],
    })
    expect(label).toMatchObject({ type: 'text', x: 5, y: 5 })
  })

  it('drops strokes with no point inside the new bounds', () => {
    const remapped = remapAnnotationsAfterCrop(annotations, -5, -5, newBounds)
    expect(remapped.some((annotation) => annotation.id === 's2')).toBe(false)
  })

  it('drops text labels whose anchor is outside the new bounds', () => {
    const remapped = remapAnnotationsAfterCrop(annotations, -5, -5, newBounds)
    expect(remapped.some((annotation) => annotation.id === 't2')).toBe(false)
  })

  it('keeps a stroke that is only partially inside the new bounds', () => {
    const remapped = remapAnnotationsAfterCrop(annotations, -5, -5, newBounds)
    const stroke = remapped.find((annotation) => annotation.id === 's3')
    expect(stroke).toMatchObject({
      points: [
        { x: -10, y: -10 },
        { x: 15, y: 15 },
      ],
    })
  })

  it('does not mutate the input annotations', () => {
    remapAnnotationsAfterCrop(annotations, -5, -5, newBounds)
    expect(annotations[0]).toMatchObject({
      points: [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
      ],
    })
  })
})

describe('annotationBounds', () => {
  it('pads a stroke by half its width', () => {
    expect(
      annotationBounds(
        pen('s', [
          { x: 10, y: 10 },
          { x: 30, y: 20 },
        ]),
      ),
    ).toEqual({ x: 8, y: 8, width: 24, height: 14 })
  })

  it('estimates text bounds from the glyph count and font size', () => {
    expect(annotationBounds(text('t', 5, 5))).toEqual({
      x: 5,
      y: 5,
      width: 18,
      height: 10,
    })
  })

  it('returns a zero rect for an empty stroke', () => {
    expect(annotationBounds(pen('s', []))).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })
})

describe('hitTestAnnotations', () => {
  const first = pen('a', [{ x: 10, y: 10 }])
  const second = text('b', 10, 10)

  it('returns the topmost match when annotations overlap', () => {
    expect(hitTestAnnotations([first, second], { x: 11, y: 11 })).toBe('b')
  })

  it('uses the tolerance margin', () => {
    const label = text('far', 50, 50)
    expect(hitTestAnnotations([label], { x: 75, y: 55 }, 8)).toBe('far')
    expect(hitTestAnnotations([label], { x: 75, y: 55 }, 1)).toBeNull()
  })

  it('returns null when nothing is hit', () => {
    expect(hitTestAnnotations([first, second], { x: 500, y: 500 })).toBeNull()
  })
})

describe('history', () => {
  it('starts with the present value and no past or future', () => {
    const history = createHistory('a')
    expect(history.present).toBe('a')
    expect(history.past).toEqual([])
    expect(history.future).toEqual([])
    expect(history.limit).toBe(50)
  })

  it('moves back and forward through committed states', () => {
    let history = createHistory('a')
    history = pushHistory(history, 'b')
    history = pushHistory(history, 'c')
    expect(history.present).toBe('c')
    expect(history.past).toEqual(['a', 'b'])

    const undoOnce = undoHistory(history)
    expect(undoOnce?.present).toBe('b')
    expect(undoOnce?.past).toEqual(['a'])
    expect(undoOnce?.future).toEqual(['c'])

    const undoTwice = undoOnce ? undoHistory(undoOnce) : null
    expect(undoTwice?.present).toBe('a')
    expect(undoTwice?.future).toEqual(['b', 'c'])

    const redoOnce = undoTwice ? redoHistory(undoTwice) : null
    expect(redoOnce?.present).toBe('b')
    expect(redoOnce?.future).toEqual(['c'])

    const redoTwice = redoOnce ? redoHistory(redoOnce) : null
    expect(redoTwice?.present).toBe('c')
    expect(redoTwice?.future).toEqual([])
  })

  it('returns null when there is nothing to undo or redo', () => {
    const history = createHistory('only')
    expect(undoHistory(history)).toBeNull()
    expect(redoHistory(history)).toBeNull()
  })

  it('clears the redo future when a new state is pushed', () => {
    let history = pushHistory(createHistory('a'), 'b')
    history = pushHistory(history, 'c')
    const undone = undoHistory(history)
    expect(undone?.future).toEqual(['c'])
    const branched = undone ? pushHistory(undone, 'd') : null
    expect(branched?.present).toBe('d')
    expect(branched?.future).toEqual([])
  })

  it('caps the past at 50 entries and drops the oldest', () => {
    let history = createHistory('v0')
    for (let index = 1; index <= 60; index += 1) {
      history = pushHistory(history, `v${index}`)
    }
    expect(history.past).toHaveLength(50)
    expect(history.past[0]).toBe('v10')
    expect(history.present).toBe('v60')
  })

  it('honours a custom limit', () => {
    let history = createHistory('v0', 3)
    for (let index = 1; index <= 5; index += 1) {
      history = pushHistory(history, `v${index}`)
    }
    expect(history.past).toEqual(['v2', 'v3', 'v4'])
    expect(history.present).toBe('v5')
  })
})

describe('buildExportFilename', () => {
  it('keeps spaces and replaces the extension', () => {
    expect(buildExportFilename('my photo.png', 'png')).toBe('my photo-annotated.png')
  })

  it('strips directories and sanitizes unsafe characters', () => {
    expect(buildExportFilename('folder/sub/photo.JPG', 'jpeg')).toBe('photo-annotated.jpeg')
    expect(buildExportFilename('my:photo?.png', 'webp')).toBe('my-photo-annotated.webp')
  })

  it('falls back to "image" for an empty name', () => {
    expect(buildExportFilename('', 'png')).toBe('image-annotated.png')
  })
})

describe('hexToRgba', () => {
  it('converts six-digit hex to rgba', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('expands three-digit hex', () => {
    expect(hexToRgba('#abc', 1)).toBe('rgba(170, 187, 204, 1)')
  })

  it('falls back to black for invalid input', () => {
    expect(hexToRgba('not-a-colour', 0.25)).toBe('rgba(0, 0, 0, 0.25)')
  })
})

describe('contrastOutlineColor', () => {
  it('returns a white halo for a dark text colour', () => {
    expect(contrastOutlineColor('#000000')).toBe('rgba(255,255,255,0.9)')
  })

  it('returns a black halo for a light text colour', () => {
    expect(contrastOutlineColor('#ffffff')).toBe('rgba(0,0,0,0.85)')
    expect(contrastOutlineColor('#f5c518')).toBe('rgba(0,0,0,0.85)')
  })
})

describe('defaultCrop', () => {
  it('covers the whole image', () => {
    expect(defaultCrop(400, 300)).toEqual({ x: 0, y: 0, width: 400, height: 300 })
  })
})

describe('clampCropToBounds', () => {
  it('leaves a crop already inside the bounds unchanged', () => {
    expect(clampCropToBounds({ x: 10, y: 10, width: 50, height: 40 }, bounds)).toEqual({
      x: 10,
      y: 10,
      width: 50,
      height: 40,
    })
  })

  it('shrinks a crop that overflows the left and top edges', () => {
    expect(clampCropToBounds({ x: -10, y: -5, width: 60, height: 50 }, bounds)).toEqual({
      x: 0,
      y: 0,
      width: 50,
      height: 45,
    })
  })

  it('shrinks a crop that overflows the right and bottom edges', () => {
    expect(clampCropToBounds({ x: 90, y: 70, width: 50, height: 50 }, bounds)).toEqual({
      x: 90,
      y: 70,
      width: 10,
      height: 10,
    })
  })

  it('caps an oversized crop at the bounds', () => {
    expect(clampCropToBounds({ x: 0, y: 0, width: 500, height: 500 }, bounds)).toEqual(bounds)
  })

  it('never returns negative dimensions', () => {
    expect(clampCropToBounds({ x: 10, y: 10, width: -20, height: -5 }, bounds)).toEqual({
      x: 10,
      y: 10,
      width: 0,
      height: 0,
    })
  })
})
