<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { base64Decode, base64Encode } from './logic'

const input = ref('')
const decodeMode = ref(false)
const urlSafe = ref(false)

const result = computed<{ text: string; error?: string }>(() => {
  const text = input.value
  if (!text) return { text: '' }
  if (!decodeMode.value) {
    return { text: base64Encode(text, { urlSafe: urlSafe.value }) }
  }
  try {
    return { text: base64Decode(text) }
  } catch (error) {
    return { text: '', error: error instanceof Error ? error.message : 'Not valid Base64' }
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
      <div v-if="!decodeMode" class="tool-controls">
        <Toggle v-model="urlSafe" label="URL-safe (-_ and unpadded)" />
      </div>
      <Field
        label="Text"
        :hint="decodeMode ? 'paste Base64 (standard or URL-safe)' : 'type anything'"
      >
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          placeholder="Hello, world!"
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

.tool-error {
  margin: 0;
  color: var(--accent);
  font-size: 14px;
}
</style>
