/**
 * Hashing helpers built on the Web Crypto SubtleCrypto API.
 */

export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

export interface HashResult {
  algorithm: string
  hash: string
}

/** Convert an ArrayBuffer of bytes to a lowercase hex string. */
export function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let hex = ''
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0')
  }
  return hex
}

/** Is the value one of the supported algorithm names? */
export function isHashAlgorithm(value: string): value is HashAlgorithm {
  return (HASH_ALGORITHMS as readonly string[]).includes(value)
}

/** Hash a UTF-8 string with the given algorithm and return lowercase hex. */
export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest(algorithm, data)
  return toHex(digest)
}

/** Hash the text with every supported algorithm (in parallel). */
export async function hashAll(text: string): Promise<HashResult[]> {
  return Promise.all(
    HASH_ALGORITHMS.map(async (algorithm) => ({
      algorithm,
      hash: await hashText(text, algorithm),
    })),
  )
}
