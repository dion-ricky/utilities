/**
 * Pure option building/validation for QR generation. The actual rendering
 * (qrcode package) happens in Tool.vue, which handles the async calls.
 */

export const ECC_LEVELS = ['L', 'M', 'Q', 'H'] as const

export type EccLevel = (typeof ECC_LEVELS)[number]

export const MIN_SIZE = 100
export const MAX_SIZE = 1000
export const MIN_MARGIN = 0
export const MAX_MARGIN = 10
export const DEFAULT_SIZE = 256
export const DEFAULT_MARGIN = 4
export const DEFAULT_ECC: EccLevel = 'M'

export interface QrOptions {
  width: number
  margin: number
  errorCorrectionLevel: EccLevel
}

export interface QrOptionsInput {
  size?: number
  margin?: number
  ecc?: string
}

/** Clamp a requested pixel size into the 100–1000 range. */
export function clampSize(size: number): number {
  const n = Number.isFinite(size) ? Math.floor(size) : DEFAULT_SIZE
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, n))
}

/** Clamp a requested quiet-zone margin into the 0–10 range. */
export function clampMargin(margin: number): number {
  const n = Number.isFinite(margin) ? Math.floor(margin) : DEFAULT_MARGIN
  return Math.min(MAX_MARGIN, Math.max(MIN_MARGIN, n))
}

/** Validate an ECC level, falling back to 'M' for anything else. */
export function normalizeEcc(ecc: string | undefined): EccLevel {
  return (ECC_LEVELS as readonly string[]).includes(ecc ?? '') ? (ecc as EccLevel) : DEFAULT_ECC
}

/** Build the options object expected by `QRCode.toDataURL`/`toString`. */
export function buildQrOptions(input: QrOptionsInput = {}): QrOptions {
  return {
    width: clampSize(input.size ?? DEFAULT_SIZE),
    margin: clampMargin(input.margin ?? DEFAULT_MARGIN),
    errorCorrectionLevel: normalizeEcc(input.ecc),
  }
}
