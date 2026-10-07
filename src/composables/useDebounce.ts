import { getCurrentScope, onScopeDispose, type Ref, ref, watch } from 'vue'

/**
 * A ref that mirrors `source`, updated only after `delay` ms of quiet.
 * Useful for keeping heavy transforms off the keystroke path.
 */
export function useDebounce<T>(source: Ref<T>, delay = 200): Readonly<Ref<T>> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  const stopWatch = watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearTimeout(timer)
      stopWatch()
    })
  }

  return debounced
}
