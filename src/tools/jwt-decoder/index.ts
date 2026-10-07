import type { ToolMeta } from '../types'

export const jwtDecoder: ToolMeta = {
  slug: 'jwt-decoder',
  name: 'JWT Decoder',
  description:
    'Decode a JWT header and payload with human-readable exp/iat/nbf status. Client-side only, no signature verification.',
  category: 'crypto',
  keywords: ['jwt', 'token', 'auth', 'claims', 'base64url', 'exp'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
