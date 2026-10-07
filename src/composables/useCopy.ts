import { ref } from 'vue'

let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Clipboard write with an execCommand fallback for non-secure contexts.
 * Returns a `copied` ref that resets after `timeout` ms.
 */
export function useCopy(timeout = 1500) {
  const copied = ref(false)

  async function copy(text: string): Promise<boolean> {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = legacyCopy(text)
    }
    if (ok) {
      copied.value = true
      clearTimeout(timer)
      timer = setTimeout(() => {
        copied.value = false
      }, timeout)
    }
    return ok
  }

  return { copied, copy }
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  textarea.remove()
  return ok
}
