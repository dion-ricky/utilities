<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Select from '../../components/Select.vue'
import TwoPane from '../../components/TwoPane.vue'
import type { UrlMode } from './logic'
import { decodeUrl, encodeUrl } from './logic'

const input = ref('')
const decodeMode = ref(false)
const mode = ref<UrlMode>('component')

const modeOptions = [
  { value: 'component', label: 'Escape reserved chars (component)' },
  { value: 'uri', label: 'Keep URI structure (whole URL)' },
]

const result = computed<{ text: string; error?: string }>(() => {
  const text = input.value
  if (!text) return { text: '' }
  if (!decodeMode.value) {
    return { text: encodeUrl(text, { mode: mode.value }) }
  }
  try {
    return { text: decodeUrl(text, { mode: mode.value }) }
  } catch (error) {
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Not a valid encoded URI',
    }
  }
})
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <div class="tool-controls">
        <div role="group" aria-label="Direction" class="direction-group">
          <button
            type="button"
            class="btn"
            :class="{ 'btn-active': !decodeMode }"
            @click="decodeMode = false"
          >
            Encode
          </button>
          <button
            type="button"
            class="btn"
            :class="{ 'btn-active': decodeMode }"
            @click="decodeMode = true"
          >
            Decode
          </button>
        </div>
        <Select v-model="mode" :options="modeOptions" label="Mode" />
      </div>
      <Field
        label="Text"
        :hint="decodeMode ? 'paste a percent-encoded string' : 'text or URL to encode'"
      >
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          placeholder="https://example.com/search?q=hello world"
          spellcheck="false"
        />
      </Field>
    </template>
    <template #output>
      <p v-if="result.error" class="tool-error">{{ result.error }}</p>
      <ResultBox v-else :value="result.text" />
    </template>
  </TwoPane>
</template>

<style scoped>
.tool-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.direction-group {
  display: inline-flex;
  gap: 8px;
}

.tool-error {
  margin: 0;
  color: var(--accent);
  font-size: 14px;
}
</style>
