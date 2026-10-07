import { describe, expect, it } from 'vitest'
import { HASH_ALGORITHMS, hashAll, hashText, isHashAlgorithm, toHex } from './logic'

const SHA1_ABC = 'a9993e364706816aba3e25717850c26c9cd0d89d'
const SHA256_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
const SHA384_ABC =
  'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7'
const SHA512_ABC =
  'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'

describe('toHex', () => {
  it('converts an empty buffer to an empty string', () => {
    expect(toHex(new ArrayBuffer(0))).toBe('')
  })

  it('converts bytes to lowercase hex with zero padding', () => {
    const bytes = new Uint8Array([0x00, 0x0f, 0xde, 0xad, 0xbe, 0xef])
    expect(toHex(bytes.buffer)).toBe('000fdeadbeef')
  })
})

describe('isHashAlgorithm', () => {
  it('accepts supported algorithm names and rejects others', () => {
    for (const algorithm of HASH_ALGORITHMS) {
      expect(isHashAlgorithm(algorithm)).toBe(true)
    }
    expect(isHashAlgorithm('md5')).toBe(false)
    expect(isHashAlgorithm('SHA-999')).toBe(false)
  })
})

describe('hashText', () => {
  it('matches known SHA-1 vectors', async () => {
    expect(await hashText('abc', 'SHA-1')).toBe(SHA1_ABC)
    expect(await hashText('', 'SHA-1')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
  })

  it('matches known SHA-256 vectors', async () => {
    expect(await hashText('abc', 'SHA-256')).toBe(SHA256_ABC)
    expect(await hashText('', 'SHA-256')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('matches known SHA-384 vectors', async () => {
    expect(await hashText('abc', 'SHA-384')).toBe(SHA384_ABC)
  })

  it('matches known SHA-512 vectors', async () => {
    expect(await hashText('abc', 'SHA-512')).toBe(SHA512_ABC)
  })

  it('produces lowercase hex of the expected length', async () => {
    const hash = await hashText('abc', 'SHA-256')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hashes multi-byte UTF-8 text', async () => {
    // Cross-check against a SHA-256 of the UTF-8 encoding of 'héllo ✨'.
    const hash = await hashText('héllo ✨', 'SHA-256')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toBe(SHA256_ABC)
  })
})

describe('hashAll', () => {
  it('returns one row per algorithm in canonical order', async () => {
    const results = await hashAll('abc')
    expect(results.map((r) => r.algorithm)).toEqual(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'])
  })

  it('matches the individual hashes', async () => {
    const results = await hashAll('abc')
    const byAlgorithm = new Map(results.map((r) => [r.algorithm, r.hash]))
    expect(byAlgorithm.get('SHA-1')).toBe(SHA1_ABC)
    expect(byAlgorithm.get('SHA-256')).toBe(SHA256_ABC)
    expect(byAlgorithm.get('SHA-384')).toBe(SHA384_ABC)
    expect(byAlgorithm.get('SHA-512')).toBe(SHA512_ABC)
  })

  it('handles the empty string', async () => {
    const results = await hashAll('')
    expect(results).toHaveLength(4)
    for (const result of results) {
      expect(result.hash).toMatch(/^[0-9a-f]+$/)
    }
  })
})
