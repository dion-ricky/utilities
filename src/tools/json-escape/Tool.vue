<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { escapeJsonString, unescapeJsonString } from './logic'

const input = ref('')
const decodeMode = ref(false)
const wrap = ref(true)
const decodeError = ref('')

const output = computed(() => {
  const text = input.value
  decodeError.value = ''
  if (!text) return ''
  if (!decodeMode.value) {
    return escapeJsonString(text, { wrap: wrap.value })
  }
  try {
    return unescapeJsonString(text)
  } catch (error) {
    decodeError.value = error instanceof Error ? error.message : 'Failed to unescape input.'
    return ''
  }
})
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <div class="tool-controls" role="group" aria-label="Direction">
        <button
          type="button"
          class="btn"
          :class="{ 'btn-active': !decodeMode }"
          @click="decodeMode = false"
        >
          Escape
        </button>
        <button
          type="button"
          class="btn"
          :class="{ 'btn-active': decodeMode }"
          @click="decodeMode = true"
        >
          Unescape
        </button>
      </div>
      <div v-if="!decodeMode" class="tool-controls">
        <Toggle v-model="wrap" label='Wrap in surrounding quotes ("…")' />
      </div>
      <Field
        label="Text"
        :hint="decodeMode ? 'paste an escaped JSON string' : 'raw text to embed in JSON'"
      >
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          :placeholder="decodeMode ? '&quot;\\&quot;escaped\\&quot;&quot;' : `&quot;a,b,c&quot;, 'd,e,f'`"
          spellcheck="false"
        />
      </Field>
    </template>
    <template #output>
      <p v-if="decodeError" class="error" role="alert">{{ decodeError }}</p>
      <ResultBox :value="output" />
    </template>
  </TwoPane>
</template>

<style scoped>
.tool-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.btn-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-fg);
}

.btn-active:hover {
  background: var(--accent);
}

.error {
  color: var(--danger, #dc3545);
  margin: 0 0 12px;
  font-size: 0.875rem;
}
</style>
