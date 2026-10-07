const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export interface Base64EncodeOptions {
  urlSafe?: boolean
}

/** UTF-8 safe Base64 encoding of arbitrary text. */
export function base64Encode(text: string, options: Base64EncodeOptions = {}): string {
  const bytes = new TextEncoder().encode(text)
  const standard = bytesToBase64(bytes)
  if (!options.urlSafe) return standard
  return standard.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/**
 * Decodes Base64 (standard or URL-safe alphabet, missing padding tolerated).
 * Throws an Error with a friendly message when the input is not valid Base64.
 */
export function base64Decode(text: string): string {
  const normalized = text.trim().replaceAll(/\s+/g, '').replaceAll('-', '+').replaceAll('_', '/')
  if (!BASE64_PATTERN.test(normalized)) {
    throw new Error('Not valid Base64: unexpected characters')
  }
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  let binary: string
  try {
    binary = atob(padded)
  } catch {
    throw new Error('Not valid Base64: invalid length or padding')
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Heuristic check whether a string looks like Base64 (non-empty, valid alphabet, sane length). */
export function isProbablyBase64(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0 || trimmed.length % 4 === 1) return false
  return BASE64_PATTERN.test(trimmed.replaceAll('-', '+').replaceAll('_', '/'))
}
