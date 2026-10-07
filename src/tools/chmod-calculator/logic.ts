export interface PermissionTriple {
  r: boolean
  w: boolean
  x: boolean
}

export interface PermissionBits {
  owner: PermissionTriple
  group: PermissionTriple
  others: PermissionTriple
  special: {
    setuid: boolean
    setgid: boolean
    sticky: boolean
  }
}

/** Convert a permission triple (rwx) to its 0–7 octal digit. */
function tripleValue(triple: PermissionTriple): number {
  return (triple.r ? 4 : 0) + (triple.w ? 2 : 0) + (triple.x ? 1 : 0)
}

/** Special-bit digit: setuid=4, setgid=2, sticky=1. */
export function specialValue(bits: PermissionBits): number {
  return (
    (bits.special.setuid ? 4 : 0) + (bits.special.setgid ? 2 : 0) + (bits.special.sticky ? 1 : 0)
  )
}

/** Octal string (4 digits when any special bit is set, otherwise 3). */
export function bitsToOctal(bits: PermissionBits): string {
  const special = specialValue(bits)
  const digits = [bits.owner, bits.group, bits.others].map((triple) => String(tripleValue(triple)))
  if (special > 0) {
    return `${special}${digits.join('')}`
  }
  return digits.join('')
}

/**
 * Symbolic notation, exactly 9 characters (rwxr-xr-x).
 * Special bits appear as s/S/t/T in the execute positions.
 */
export function bitsToSymbolic(bits: PermissionBits): string {
  function tripleToSymbolic(triple: PermissionTriple): string {
    return `${triple.r ? 'r' : '-'}${triple.w ? 'w' : '-'}${triple.x ? 'x' : '-'}`
  }

  const symbolic =
    tripleToSymbolic(bits.owner) + tripleToSymbolic(bits.group) + tripleToSymbolic(bits.others)
  const chars = [...symbolic]
  if (bits.special.setuid) {
    chars[2] = bits.owner.x ? 's' : 'S'
  }
  if (bits.special.setgid) {
    chars[5] = bits.group.x ? 's' : 'S'
  }
  if (bits.special.sticky) {
    chars[8] = bits.others.x ? 't' : 'T'
  }
  return chars.join('')
}

function digitToTriple(digit: number): PermissionTriple {
  return {
    r: (digit & 4) !== 0,
    w: (digit & 2) !== 0,
    x: (digit & 1) !== 0,
  }
}

/** Parse an octal string (3 or 4 digits, each 0-7) into bits. Returns null if invalid. */
export function octalToBits(octal: string): PermissionBits | null {
  const trimmed = octal.trim()
  if (!/^[0-7]{3,4}$/.test(trimmed)) return null
  const digits = [...trimmed].map((c) => Number(c))
  const hasSpecial = digits.length === 4
  const special = hasSpecial ? (digits[0] ?? 0) : 0
  const [owner = 0, group = 0, others = 0] = hasSpecial ? digits.slice(1) : digits
  return {
    owner: digitToTriple(owner),
    group: digitToTriple(group),
    others: digitToTriple(others),
    special: {
      setuid: (special & 4) !== 0,
      setgid: (special & 2) !== 0,
      sticky: (special & 1) !== 0,
    },
  }
}

/** Parse a 9-character symbolic string (e.g. rwsr-xr-x) into bits. Returns null if invalid. */
export function symbolicToBits(sym: string): PermissionBits | null {
  const trimmed = sym.trim()
  if (!/^[rwxstST-]{9}$/.test(trimmed)) return null
  const chars = [...trimmed]
  const isSet = (index: number, flag: string) => chars[index] === flag

  return {
    owner: {
      r: isSet(0, 'r'),
      w: isSet(1, 'w'),
      // Lowercase s = setuid + execute; uppercase S = setuid without execute.
      x: isSet(2, 'x') || isSet(2, 's'),
    },
    group: {
      r: isSet(3, 'r'),
      w: isSet(4, 'w'),
      x: isSet(5, 'x') || isSet(5, 's'),
    },
    others: {
      r: isSet(6, 'r'),
      w: isSet(7, 'w'),
      // Lowercase t = sticky + execute; uppercase T = sticky without execute.
      x: isSet(8, 'x') || isSet(8, 't'),
    },
    special: {
      setuid: isSet(2, 's') || isSet(2, 'S'),
      setgid: isSet(5, 's') || isSet(5, 'S'),
      sticky: isSet(8, 't') || isSet(8, 'T'),
    },
  }
}

/** Build a chmod command string, e.g. `chmod -R 755 path/`. */
export function chmodCommand(bits: PermissionBits, path: string, recursive: boolean): string {
  const octal = bitsToOctal(bits)
  const recursivePart = recursive ? '-R ' : ''
  const pathPart = path.trim()
  return `chmod ${recursivePart}${octal}${pathPart ? ` ${pathPart}` : ''}`
}
