<script setup lang="ts">
import { ref, watch } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import TwoPane from '../../components/TwoPane.vue'
import { useDebounce } from '../../composables/useDebounce'
import { type HashResult, hashAll } from './logic'

const input = ref('')
const debouncedInput = useDebounce(input, 200)

const results = ref<HashResult[]>([])
const error = ref('')

watch(
  debouncedInput,
  async (text) => {
    try {
      results.value = await hashAll(text)
      error.value = ''
    } catch (err) {
      results.value = []
      error.value = err instanceof Error ? err.message : 'Hashing failed.'
    }
  },
  { immediate: true },
)
</script>

<template>
  <TwoPane input-label="Input" output-label="Digests">
    <template #input>
      <Field label="Text" hint="hashed with SHA-1 / SHA-256 / SHA-384 / SHA-512">
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          placeholder="Type text to hash…"
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">{{ input.length }} chars · UTF-8 · hex lowercase</p>
    </template>
    <template #output>
      <p v-if="error" class="tool-meta error">{{ error }}</p>
      <p v-else-if="results.length === 0" class="tool-meta">Type some text to see digests.</p>
      <div v-else class="hash-grid">
        <div v-for="result in results" :key="result.algorithm" class="hash-row">
          <div class="hash-info">
            <span class="hash-alg">{{ result.algorithm }}</span>
            <code class="hash-value">{{ result.hash }}</code>
          </div>
          <CopyButton :value="result.hash" label="Copy" />
        </div>
      </div>
    </template>
  </TwoPane>
</template>

<style scoped>
.tool-meta {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.tool-meta.error {
  color: var(--accent);
}

.hash-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hash-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.hash-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.hash-alg {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.hash-value {
  font-family: var(--font-mono);
  font-size: 12px;
  word-break: break-all;
  overflow-wrap: anywhere;
}
</style>
