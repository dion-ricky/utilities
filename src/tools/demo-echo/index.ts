import type { ToolMeta } from '../types'

export const demoEcho: ToolMeta = {
  slug: 'demo-echo',
  name: 'Echo (Demo)',
  description:
    'Living example of the tool template: transforms text (reverse/uppercase) to prove the registry end-to-end.',
  category: 'demo',
  keywords: ['demo', 'echo', 'reverse', 'uppercase', 'template'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
