export interface DecodedJwt {
  header: unknown
  payload: unknown
  signature: string
}

export type TimedClaim = 'exp' | 'iat' | 'nbf'

export interface ClaimStatus {
  label: string
  detail: string
  ok: boolean
}

const BASE64URL_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/

function base64UrlDecode(segment: string, label: string): Uint8Array {
  const normalized = segment.replaceAll('-', '+').replaceAll('_', '/')
  if (!BASE64URL_PATTERN.test(normalized)) {
    throw new Error(`Invalid Base64URL in JWT ${label}`)
  }
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  let binary: string
  try {
    binary = atob(padded)
  } catch {
    throw new Error(`Invalid Base64URL in JWT ${label}`)
  }
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function decodeSegment(segment: string, label: string): unknown {
  const bytes = base64UrlDecode(segment, label)
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error(`JWT ${label} is not valid JSON`)
  }
}

/**
 * Decodes a JWT's header and payload without verifying the signature.
 * Throws an Error with a friendly message when the token is malformed.
 */
export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.')
  if (parts.length !== 3) throw new Error('Not a valid JWT: expected 3 dot-separated segments')
  const [headerPart, payloadPart, signaturePart] = parts
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('Not a valid JWT: expected 3 dot-separated segments')
  }
  return {
    header: decodeSegment(headerPart, 'header'),
    payload: decodeSegment(payloadPart, 'payload'),
    signature: signaturePart,
  }
}

/** Formats a unix-seconds timestamp as a readable UTC date, e.g. '2026-10-07 12:34 UTC'. */
export function formatTimestamp(unixSeconds: number): string {
  const iso = new Date(unixSeconds * 1000).toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`
}

function relativeTime(diffMs: number): string {
  const abs = Math.abs(diffMs)
  const units: Array<[number, string]> = [
    [86_400_000, 'day'],
    [3_600_000, 'hour'],
    [60_000, 'minute'],
  ]
  for (const [unitMs, name] of units) {
    if (abs >= unitMs) {
      const count = Math.floor(abs / unitMs)
      return `${count} ${name}${count === 1 ? '' : 's'}`
    }
  }
  return 'less than a minute'
}

/**
 * Human-readable status of a registered time claim, evaluated against `now` (unix ms).
 * - exp: 'Valid' while in the future, 'Expired' afterwards.
 * - iat: 'Issued' once in the past, 'Not yet issued' when in the future.
 * - nbf: 'Valid' once in the past, 'Not yet valid' when in the future.
 */
export function claimStatus(
  claim: TimedClaim,
  value: number,
  now: number = Date.now(),
): ClaimStatus {
  const ms = value * 1000
  const date = formatTimestamp(value)
  const diff = now - ms
  const rel = relativeTime(diff)
  if (claim === 'exp') {
    if (diff >= 0) {
      return { label: 'Expired', detail: `Expired ${rel} ago (at ${date})`, ok: false }
    }
    return { label: 'Valid', detail: `Expires ${rel} from now (at ${date})`, ok: true }
  }
  if (claim === 'iat') {
    if (diff < 0) {
      return { label: 'Not yet issued', detail: `Issued ${rel} from now (at ${date})`, ok: false }
    }
    return { label: 'Issued', detail: `Issued ${rel} ago (at ${date})`, ok: true }
  }
  if (diff < 0) {
    return { label: 'Not yet valid', detail: `Valid ${rel} from now (at ${date})`, ok: false }
  }
  return { label: 'Valid', detail: `Active since ${rel} ago (at ${date})`, ok: true }
}
