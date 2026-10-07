<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'
import { useCopy } from '../composables/useCopy'

const props = defineProps<{
  value: string | (() => string)
  label?: string
}>()

const { copied, copy } = useCopy()

async function onClick() {
  const text = typeof props.value === 'function' ? props.value() : props.value
  await copy(text)
}
</script>

<template>
  <button
    type="button"
    class="copy-btn"
    :class="{ copied }"
    :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
    @click="onClick"
  >
    <Check v-if="copied" :size="14" aria-hidden="true" />
    <Copy v-else :size="14" aria-hidden="true" />
    <span v-if="label">{{ copied ? 'Copied' : label }}</span>
  </button>
</template>

<style scoped>
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg);
  border-radius: 8px;
  padding: 5px 10px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.copy-btn:hover {
  background: var(--surface-2);
}

.copy-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.copy-btn.copied {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
