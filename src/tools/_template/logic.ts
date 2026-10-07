export interface TransformOptions {
  trim?: boolean
}

/**
 * Pure transform logic — keep this free of DOM/Vue so it stays unit-testable.
 */
export function transform(input: string, options: TransformOptions = {}): string {
  return options.trim ? input.trim() : input
}
