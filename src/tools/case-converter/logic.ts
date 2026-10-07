/** Convert any identifier-ish string into lowercase words. */
export function toWords(input: string): string[] {
  if (input.trim() === '') return []
  let spaced = input
    // camelCase and digit boundaries: fooBar, foo2 -> foo Bar / foo 2
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    // Acronyms: HTTPServer -> HTTP Server
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // letter -> digit boundary (foo2bar -> foo 2 bar)
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // digit -> boundary only when followed by a lowercase letter (2fast -> 2 fast)
    .replace(/(\d)([a-z])/g, '$1 $2')
  // Remaining separators (spaces, punctuation, underscores, dashes) become boundaries.
  spaced = spaced.replace(/[^a-zA-Z0-9]+/g, ' ').trim()
  if (spaced === '') return []
  return spaced
    .split(/\s+/)
    .map((word) => word.toLowerCase())
    .filter((word) => word !== '')
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function join(words: string[], separator: string): string {
  return words.join(separator)
}

export function toCamel(input: string): string {
  const words = toWords(input)
  return words.map((word, i) => (i === 0 ? word : capitalize(word))).join('')
}

export function toPascal(input: string): string {
  return toWords(input)
    .map((word) => capitalize(word))
    .join('')
}

export function toSnake(input: string): string {
  return join(toWords(input), '_')
}

export function toKebab(input: string): string {
  return join(toWords(input), '-')
}

export function toConstant(input: string): string {
  return join(toWords(input), '_').toUpperCase()
}

export function toTitle(input: string): string {
  return toWords(input)
    .map((word) => capitalize(word))
    .join(' ')
}

export function toUpperSentence(input: string): string {
  return join(toWords(input), ' ').toUpperCase()
}

export function toLowerSentence(input: string): string {
  return join(toWords(input), ' ').toLowerCase()
}
