/**
 * Lorem ipsum generator with a classic Latin word bank. Accepts an
 * injectable RNG so tests can be deterministic.
 */

/** Classic Latin word bank (~60 words). */
export const WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
] as const

/** Words used when "Start with 'Lorem ipsum dolor sit amet'" is enabled. */
export const STARTER_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'] as const

export type LoremUnit = 'paragraphs' | 'sentences' | 'words'

export interface LoremOptions {
  unit: LoremUnit
  count: number
  startWithLorem?: boolean
}

export const MIN_COUNT = 1
export const MAX_COUNT = 100

/** Clamp a requested count into the 1–100 range. */
export function clampCount(count: number): number {
  const n = Number.isFinite(count) ? Math.floor(count) : MIN_COUNT
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, n))
}

function pickWord(rng: () => number): string {
  return WORDS[Math.floor(rng() * WORDS.length)] ?? ''
}

function sentenceLength(rng: () => number): number {
  return 6 + Math.floor(rng() * 9) // 6–14 words
}

function paragraphSentenceCount(rng: () => number): number {
  return 3 + Math.floor(rng() * 4) // 3–6 sentences
}

/** Build one sentence of 6–14 words, optionally seeded with starter words. */
export function buildSentence(rng: () => number, starterWords: readonly string[] = []): string {
  const total = Math.max(sentenceLength(rng), starterWords.length)
  const words = [...starterWords]
  while (words.length < total) {
    words.push(pickWord(rng))
  }
  const text = words.join(' ')
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}

/**
 * Generate lorem ipsum text.
 * - sentences: `count` sentences joined by spaces
 * - paragraphs: `count` paragraphs of 3–6 sentences, separated by blank lines
 * - words: exactly `count` words, capitalized
 * When `startWithLorem` is true, the first sentence (or word run) begins
 * with "Lorem ipsum dolor sit amet".
 */
export function generateLorem(opts: LoremOptions, rng: () => number = Math.random): string {
  const count = clampCount(opts.count)
  const startWithLorem = opts.startWithLorem === true

  if (opts.unit === 'words') {
    const words: string[] = []
    while (words.length < count) {
      if (startWithLorem && words.length < STARTER_WORDS.length) {
        words.push(STARTER_WORDS[words.length] ?? pickWord(rng))
      } else {
        words.push(pickWord(rng))
      }
    }
    const text = words.join(' ')
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  if (opts.unit === 'sentences') {
    const sentences: string[] = []
    for (let i = 0; i < count; i++) {
      const starter = i === 0 && startWithLorem ? STARTER_WORDS : []
      sentences.push(buildSentence(rng, starter))
    }
    return sentences.join(' ')
  }

  const paragraphs: string[] = []
  let isFirstSentence = true
  for (let i = 0; i < count; i++) {
    const sentenceCount = paragraphSentenceCount(rng)
    const sentences: string[] = []
    for (let j = 0; j < sentenceCount; j++) {
      const starter = isFirstSentence && startWithLorem ? STARTER_WORDS : []
      sentences.push(buildSentence(rng, starter))
      isFirstSentence = false
    }
    paragraphs.push(sentences.join(' '))
  }
  return paragraphs.join('\n\n')
}
