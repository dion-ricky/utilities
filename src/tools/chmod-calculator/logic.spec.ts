import { describe, expect, it } from 'vitest'
import {
  bitsToOctal,
  bitsToSymbolic,
  chmodCommand,
  octalToBits,
  specialValue,
  symbolicToBits,
} from './logic'

/** Unwrap a nullable parse result in tests, failing loudly if null. */
function must<T>(value: T | null): T {
  if (value === null) throw new Error('expected non-null parse result in test')
  return value
}

function makeBits(
  owner: string,
  group: string,
  others: string,
  special: { setuid?: boolean; setgid?: boolean; sticky?: boolean } = {},
) {
  const parse = (s: string) => ({
    r: s.includes('r'),
    w: s.includes('w'),
    x: s.includes('x'),
  })
  return {
    owner: parse(owner),
    group: parse(group),
    others: parse(others),
    special: {
      setuid: special.setuid ?? false,
      setgid: special.setgid ?? false,
      sticky: special.sticky ?? false,
    },
  }
}

describe('bitsToOctal', () => {
  it('converts basic permission triples', () => {
    expect(bitsToOctal(makeBits('rwx', 'rx', 'r'))).toBe('754')
    expect(bitsToOctal(makeBits('rw', 'rw', 'r'))).toBe('664')
    expect(bitsToOctal(makeBits('', '', ''))).toBe('000')
    expect(bitsToOctal(makeBits('rwx', 'rwx', 'rwx'))).toBe('777')
  })

  it('emits 3 digits when no special bits are set', () => {
    expect(bitsToOctal(makeBits('rwx', 'rx', 'rx'))).toBe('755')
  })

  it('emits 4 digits when special bits are set', () => {
    expect(bitsToOctal(makeBits('rwx', 'rx', 'rx', { setuid: true }))).toBe('4755')
    expect(bitsToOctal(makeBits('rwx', 'rx', 'rx', { setgid: true }))).toBe('2755')
    expect(bitsToOctal(makeBits('rwx', 'rx', 'rx', { sticky: true }))).toBe('1755')
    expect(
      bitsToOctal(makeBits('rwx', 'rwx', 'rwx', { setuid: true, setgid: true, sticky: true })),
    ).toBe('7777')
  })

  it('computes the special digit from setuid/setgid/sticky', () => {
    expect(specialValue(makeBits('rwx', 'rx', 'rx', { setuid: true }))).toBe(4)
    expect(specialValue(makeBits('rwx', 'rx', 'rx', { setgid: true }))).toBe(2)
    expect(specialValue(makeBits('rwx', 'rx', 'rx', { sticky: true }))).toBe(1)
    expect(specialValue(makeBits('rwx', 'rx', 'rx'))).toBe(0)
  })
})

describe('bitsToSymbolic', () => {
  it('renders rw-rw-r-- for 664', () => {
    expect(bitsToSymbolic(makeBits('rw', 'rw', 'r'))).toBe('rw-rw-r--')
  })

  it('renders rwxr-xr-x for 755', () => {
    expect(bitsToSymbolic(makeBits('rwx', 'rx', 'rx'))).toBe('rwxr-xr-x')
  })

  it('renders s/S for setuid and t/T for sticky', () => {
    // setuid with execute -> lowercase s
    expect(bitsToSymbolic(makeBits('rwx', 'rx', 'rx', { setuid: true }))).toBe('rwsr-xr-x')
    // setuid without execute -> uppercase S
    expect(bitsToSymbolic(makeBits('rw', 'rx', 'rx', { setuid: true }))).toBe('rwSr-xr-x')
    // sticky with execute -> lowercase t
    expect(bitsToSymbolic(makeBits('rwx', 'rx', 'rwx', { sticky: true }))).toBe('rwxr-xrwt')
    // sticky without execute -> uppercase T
    expect(bitsToSymbolic(makeBits('rwx', 'rx', 'rw', { sticky: true }))).toBe('rwxr-xrwT')
    // setgid
    expect(bitsToSymbolic(makeBits('rwx', 'rwx', 'rx', { setgid: true }))).toBe('rwxrwsr-x')
    expect(bitsToSymbolic(makeBits('rwx', 'rw', 'rx', { setgid: true }))).toBe('rwxrwSr-x')
  })

  it('always returns exactly 9 characters', () => {
    expect(
      bitsToSymbolic(makeBits('rwx', 'rwx', 'rwx', { setuid: true, setgid: true, sticky: true })),
    ).toHaveLength(9)
  })
})

describe('octalToBits', () => {
  it('parses 3-digit octal', () => {
    const bits = octalToBits('664')
    expect(bits).toEqual(makeBits('rw', 'rw', 'r'))
  })

  it('parses 4-digit octal with special bits', () => {
    expect(octalToBits('4755')).toEqual(makeBits('rwx', 'rx', 'rx', { setuid: true }))
    expect(octalToBits('1777')).toEqual(makeBits('rwx', 'rwx', 'rwx', { sticky: true }))
    expect(octalToBits('0755')).toEqual(makeBits('rwx', 'rx', 'rx'))
  })

  it('returns null for invalid input', () => {
    expect(octalToBits('')).toBeNull()
    expect(octalToBits('75')).toBeNull()
    expect(octalToBits('75555')).toBeNull()
    expect(octalToBits('abc')).toBeNull()
    expect(octalToBits('788')).toBeNull()
    expect(octalToBits('-755')).toBeNull()
  })

  it('round-trips through bitsToOctal', () => {
    for (const octal of ['000', '755', '644', '777', '4755', '2750', '1755', '7777']) {
      expect(bitsToOctal(must(octalToBits(octal)))).toBe(octal.replace(/^0(?=\d{3})/, ''))
    }
  })
})

describe('symbolicToBits', () => {
  it('parses rw-rw-r-- as 664', () => {
    const bits = symbolicToBits('rw-rw-r--')
    expect(bits).not.toBeNull()
    expect(bitsToOctal(must(bits))).toBe('664')
  })

  it('parses s/S/t in execute positions as special bits', () => {
    expect(symbolicToBits('rwsr-xr-x')).toEqual(makeBits('rwx', 'rx', 'rx', { setuid: true }))
    expect(symbolicToBits('rwsr-xr-x')).toEqual(octalToBits('4755'))
    expect(symbolicToBits('rwxrwsr-x')).toEqual(octalToBits('2775'))
    expect(symbolicToBits('rwxrwxrwt')).toEqual(octalToBits('1777'))
    expect(symbolicToBits('rwxr-xrwt')).toEqual(octalToBits('1757'))
    // Uppercase S/T means the special bit WITHOUT execute permission.
    expect(symbolicToBits('rwSr-xr-x')).toEqual(makeBits('rw', 'rx', 'rx', { setuid: true }))
    expect(bitsToOctal(must(symbolicToBits('rwSr-xr-x')))).toBe('4655')
    expect(symbolicToBits('rwxr-xrwT')).toEqual(makeBits('rwx', 'rx', 'rw', { sticky: true }))
    expect(bitsToOctal(must(symbolicToBits('rwxr-xrwT')))).toBe('1756')
  })

  it('returns null for malformed strings', () => {
    expect(symbolicToBits('')).toBeNull()
    expect(symbolicToBits('rwxr-xr')).toBeNull()
    expect(symbolicToBits('rwxr-xrxxx')).toBeNull()
    expect(symbolicToBits('rwxr-xr-xy')).toBeNull()
  })

  it('round-trips through bitsToSymbolic', () => {
    for (const sym of [
      'rwxr-xr-x',
      'rw-rw-r--',
      'rwsr-xr-x',
      'rwxrwsr-x',
      'rwxr-xrwt',
      'rwxr-xrwT',
      'rwSr-xr-x',
    ]) {
      expect(bitsToSymbolic(must(symbolicToBits(sym)))).toBe(sym)
    }
  })
})

describe('chmodCommand', () => {
  const bits = makeBits('rwx', 'rx', 'rx')

  it('builds a basic command', () => {
    expect(chmodCommand(bits, 'path/', false)).toBe('chmod 755 path/')
  })

  it('adds -R when recursive', () => {
    expect(chmodCommand(bits, 'path/', true)).toBe('chmod -R 755 path/')
  })

  it('handles 4-digit modes and empty paths', () => {
    const setuid = makeBits('rwx', 'rx', 'rx', { setuid: true })
    expect(chmodCommand(setuid, '', false)).toBe('chmod 4755')
    expect(chmodCommand(setuid, '/usr/local/bin/tool', true)).toBe(
      'chmod -R 4755 /usr/local/bin/tool',
    )
  })

  it('trims surrounding whitespace from the path', () => {
    expect(chmodCommand(bits, '  script.sh  ', false)).toBe('chmod 755 script.sh')
  })
})
