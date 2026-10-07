import { ref, watchEffect } from 'vue'

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem('dsk.theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// Module-level singleton: header and App share the same state.
const theme = ref<Theme>(initialTheme())

if (typeof document !== 'undefined') {
  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value
  })
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem('dsk.theme', theme.value)
  } catch {
    // storage unavailable (private mode etc.) — theme still works for the session
  }
}

export function useTheme() {
  return { theme, toggleTheme }
}
