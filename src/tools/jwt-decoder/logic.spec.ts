import { describe, expect, it } from 'vitest'
import { claimStatus, decodeJwt, formatTimestamp } from './logic'

function makeToken(header: object, payload: object, signature = 'sig'): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  return `${encode(header)}.${encode(payload)}.${signature}`
}

const NOW = 1_700_000_000_000 // 2023-11-14T22:13:20Z

describe('decodeJwt', () => {
  it('decodes header, payload and keeps the raw signature', () => {
    const token = makeToken({ alg: 'HS256', typ: 'JWT' }, { sub: '123', exp: NOW / 1000 })
    const decoded = decodeJwt(token)
    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decoded.payload).toEqual({ sub: '123', exp: NOW / 1000 })
    expect(decoded.signature).toBe('sig')
  })

  it('decodes tokens with URL-safe base64 characters', () => {
    const header = btoa('{"alg":"HS256"}').replace(/[+/=]/g, '')
    expect(decodeJwt(`${header}.${header}.sig`).header).toEqual({ alg: 'HS256' })
  })

  it('throws on a token without three segments', () => {
    expect(() => decodeJwt('not.a.token.here')).toThrow(/3 dot-separated segments/)
    expect(() => decodeJwt('onlyone')).toThrow(/3 dot-separated segments/)
  })

  it('throws when a segment is empty', () => {
    expect(() => decodeJwt('..sig')).toThrow(/3 dot-separated segments/)
  })

  it('throws on invalid base64url in the payload', () => {
    expect(() => decodeJwt('eyJhbGciOiJIUzI1NiJ9.not*valid!.sig')).toThrow(/Invalid Base64URL/)
  })

  it('throws when the payload is not valid JSON', () => {
    const garbage = btoa('this is not json')
    expect(() => decodeJwt(`eyJhbGciOiJIUzI1NiJ9.${garbage}.sig`)).toThrow(/not valid JSON/)
  })
})

describe('claimStatus', () => {
  it('reports exp as Valid when it is in the future', () => {
    const status = claimStatus('exp', NOW / 1000 + 3 * 86_400, NOW)
    expect(status.ok).toBe(true)
    expect(status.label).toBe('Valid')
    expect(status.detail).toContain('Expires 3 days from now')
    expect(status.detail).toContain(formatTimestamp(NOW / 1000 + 3 * 86_400))
  })

  it('reports exp as Expired with a relative time', () => {
    const status = claimStatus('exp', NOW / 1000 - 3 * 86_400, NOW)
    expect(status.ok).toBe(false)
    expect(status.label).toBe('Expired')
    expect(status.detail).toContain('Expired 3 days ago')
  })

  it('reports exp as Expired at the exact boundary', () => {
    expect(claimStatus('exp', NOW / 1000, NOW).label).toBe('Expired')
  })

  it('reports nbf as Not yet valid in the future', () => {
    const status = claimStatus('nbf', NOW / 1000 + 60 * 60, NOW)
    expect(status.ok).toBe(false)
    expect(status.label).toBe('Not yet valid')
    expect(status.detail).toContain('Valid 1 hour from now')
  })

  it('reports nbf as Valid once active', () => {
    const status = claimStatus('nbf', NOW / 1000 - 90_000, NOW)
    expect(status.ok).toBe(true)
    expect(status.label).toBe('Valid')
    expect(status.detail).toContain('Active since 1 day ago')
  })

  it('reports iat as Issued in the past', () => {
    const status = claimStatus('iat', NOW / 1000 - 5 * 60, NOW)
    expect(status.ok).toBe(true)
    expect(status.label).toBe('Issued')
    expect(status.detail).toContain('Issued 5 minutes ago')
  })

  it('reports iat as Not yet issued in the future', () => {
    const status = claimStatus('iat', NOW / 1000 + 60_000, NOW)
    expect(status.ok).toBe(false)
    expect(status.label).toBe('Not yet issued')
  })

  it('uses singular units for a count of one', () => {
    expect(claimStatus('exp', NOW / 1000 + 60, NOW).detail).toContain('Expires 1 minute')
  })

  it('rounds down sub-minute differences', () => {
    expect(claimStatus('exp', NOW / 1000 + 30, NOW).detail).toContain(
      'Expires less than a minute from now',
    )
  })
})

describe('formatTimestamp', () => {
  it('formats unix seconds as a readable UTC date', () => {
    expect(formatTimestamp(1_700_000_000)).toBe('2023-11-14 22:13 UTC')
  })
})
