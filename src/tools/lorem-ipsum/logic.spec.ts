import { describe, expect, it } from 'vitest'
import {
  buildSentence,
  clampCount,
  generateLorem,
  MAX_COUNT,
  MIN_COUNT,
  STARTER_WORDS,
  WORDS,
} from './logic'

/** Deterministic mulberry32 PRNG. */
function seededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('clampCount', () => {
  it('keeps in-range values and clamps out-of-range ones', () => {
    expect(clampCount(3)).toBe(3)
    expect(clampCount(0)).toBe(MIN_COUNT)
    expect(clampCount(-1)).toBe(MIN_COUNT)
    expect(clampCount(101)).toBe(MAX_COUNT)
  })

  it('floors fractions and maps non-finite input to the minimum', () => {
    expect(clampCount(3.9)).toBe(3)
    expect(clampCount(Number.NaN)).toBe(MIN_COUNT)
  })
})

describe('buildSentence', () => {
  it('produces 6–14 words, capitalized, ending with a period', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const sentence = buildSentence(seededRng(seed))
      const wordCount = sentence.slice(0, -1).split(' ').length
      expect(wordCount).toBeGreaterThanOrEqual(6)
      expect(wordCount).toBeLessThanOrEqual(14)
      expect(sentence[0]).toMatch(/[A-Z]/)
      expect(sentence.endsWith('.')).toBe(true)
    }
  })

  it('respects starter words even when the random length is shorter', () => {
    const sentence = buildSentence(seededRng(1), ['lorem', 'ipsum', 'dolor', 'sit', 'amet'])
    expect(sentence.startsWith('Lorem ipsum dolor sit amet')).toBe(true)
  })
})

describe('generateLorem (words)', () => {
  it('generates exactly `count` words from the word bank', () => {
    const out = generateLorem({ unit: 'words', count: 12 }, seededRng(42))
    expect(out.split(' ')).toHaveLength(12)
    for (const word of out.split(' ')) {
      expect([...WORDS, ...STARTER_WORDS]).toContain(word.toLowerCase())
    }
  })

  it('capitalizes the first word', () => {
    const out = generateLorem({ unit: 'words', count: 5 }, seededRng(7))
    expect(out[0]).toMatch(/[A-Z]/)
  })

  it('starts with Lorem ipsum dolor sit amet when requested', () => {
    const out = generateLorem({ unit: 'words', count: 10, startWithLorem: true }, seededRng(3))
    expect(out.startsWith('Lorem ipsum dolor sit amet')).toBe(true)
  })

  it('count smaller than the starter does not overflow', () => {
    const out = generateLorem({ unit: 'words', count: 2, startWithLorem: true }, seededRng(3))
    expect(out.split(' ')).toHaveLength(2)
  })
})

describe('generateLorem (sentences)', () => {
  it('generates the requested number of sentences', () => {
    const out = generateLorem({ unit: 'sentences', count: 5 }, seededRng(11))
    expect(out.split('. ').length).toBe(5)
    expect((out.match(/\./g) ?? []).length).toBe(5)
  })

  it('each sentence has 6–14 words and ends with a period', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const out = generateLorem({ unit: 'sentences', count: 10 }, seededRng(seed))
      for (const sentence of out.split('. ').map((s) => (s.endsWith('.') ? s : `${s}.`))) {
        const wordCount = sentence.slice(0, -1).split(' ').length
        expect(wordCount).toBeGreaterThanOrEqual(6)
        expect(wordCount).toBeLessThanOrEqual(14)
      }
    }
  })

  it('is deterministic for a fixed RNG', () => {
    const a = generateLorem({ unit: 'sentences', count: 4 }, seededRng(99))
    const b = generateLorem({ unit: 'sentences', count: 4 }, seededRng(99))
    expect(a).toBe(b)
  })

  it('starts with Lorem ipsum dolor sit amet only in the first sentence', () => {
    const out = generateLorem({ unit: 'sentences', count: 3, startWithLorem: true }, seededRng(5))
    expect(out.startsWith('Lorem ipsum dolor sit amet')).toBe(true)
    expect((out.match(/Lorem ipsum dolor sit amet/g) ?? []).length).toBe(1)
  })
})

describe('generateLorem (paragraphs)', () => {
  it('generates the requested number of paragraphs separated by blank lines', () => {
    const out = generateLorem({ unit: 'paragraphs', count: 4 }, seededRng(13))
    expect(out.split('\n\n')).toHaveLength(4)
  })

  it('each paragraph has 3–6 sentences', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const out = generateLorem({ unit: 'paragraphs', count: 5 }, seededRng(seed))
      for (const paragraph of out.split('\n\n')) {
        const sentenceCount = paragraph.split('. ').length
        expect(sentenceCount).toBeGreaterThanOrEqual(3)
        expect(sentenceCount).toBeLessThanOrEqual(6)
      }
    }
  })

  it('only the very first sentence starts with Lorem ipsum', () => {
    const out = generateLorem({ unit: 'paragraphs', count: 3, startWithLorem: true }, seededRng(21))
    expect(out.startsWith('Lorem ipsum dolor sit amet')).toBe(true)
    expect((out.match(/Lorem ipsum dolor sit amet/g) ?? []).length).toBe(1)
  })

  it('is deterministic for a fixed RNG', () => {
    const a = generateLorem({ unit: 'paragraphs', count: 3 }, seededRng(55))
    const b = generateLorem({ unit: 'paragraphs', count: 3 }, seededRng(55))
    expect(a).toBe(b)
  })
})
