import { type Ref, ref, watch } from 'vue'

/**
 * Reactive ref backed by localStorage (JSON-serialized).
 * Falls back to in-memory only when storage is unavailable.
 */
export function useLocalStorage<T>(key: string, initialValue: T): Ref<T> {
  function read(): T {
    if (typeof localStorage === 'undefined') return initialValue
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initialValue : (JSON.parse(raw) as T)
    } catch {
      return initialValue
    }
  }

  const value = ref(read()) as Ref<T>

  watch(
    value,
    (v) => {
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {
        // storage unavailable — keep working in memory
      }
    },
    { deep: true },
  )

  return value
}
