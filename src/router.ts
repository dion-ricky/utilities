import { ref } from 'vue'

export interface HomeRoute {
  name: 'home'
}

export interface ToolRoute {
  name: 'tool'
  slug: string
  query: URLSearchParams
}

export type Route = HomeRoute | ToolRoute

function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '')
  const [path = '', search = ''] = raw.split('?')
  const slug = path.replaceAll('/', '')
  if (!slug) return { name: 'home' }
  return { name: 'tool', slug, query: new URLSearchParams(search) }
}

const initial = typeof window === 'undefined' ? { name: 'home' } : parseHash(window.location.hash)

const route = ref<Route>(initial as Route)

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.value = parseHash(window.location.hash)
  })
}

export function useRoute() {
  return route
}

export function navigateToTool(slug: string) {
  window.location.hash = `#/${slug}`
}

export function navigateHome() {
  window.location.hash = '#/'
}
