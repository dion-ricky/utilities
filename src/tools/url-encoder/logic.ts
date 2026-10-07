export type UrlMode = 'component' | 'uri'

export interface UrlEncodeOptions {
  mode?: UrlMode
}

/**
 * Encodes text for use in a URL.
 * - 'component': escapes every reserved character (encodeURIComponent) — safe for a single
 *   query parameter value.
 * - 'uri': keeps URI structure characters like / ? & = : intact (encodeURI) — for a full URL.
 */
export function encodeUrl(text: string, options: UrlEncodeOptions = {}): string {
  const mode = options.mode ?? 'component'
  return mode === 'component' ? encodeURIComponent(text) : encodeURI(text)
}

/**
 * Decodes percent-encoded text. Throws an Error with a friendly
 * message on malformed sequences such as a lone `%` or `%zz`.
 */
export function decodeUrl(text: string, options: UrlEncodeOptions = {}): string {
  const mode = options.mode ?? 'component'
  try {
    return mode === 'component' ? decodeURIComponent(text) : decodeURI(text)
  } catch {
    throw new Error('Not a valid encoded URI: malformed % sequence')
  }
}
