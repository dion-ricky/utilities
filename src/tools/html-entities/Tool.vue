<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { decodeHtmlEntities, encodeHtmlEntities } from './logic'

const input = ref('')
const decodeMode = ref(false)
const numericNonAscii = ref(false)

const output = computed(() => {
  const text = input.value
  if (!text) return ''
  if (!decodeMode.value) {
    return encodeHtmlEntities(text, { numericNonAscii: numericNonAscii.value })
  }
  return decodeHtmlEntities(text)
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
        <Toggle v-model="numericNonAscii" label="Numeric refs for non-ASCII (&#233;)" />
      </div>
      <Field label="Text" :hint="decodeMode ? 'paste HTML with entities' : 'text or HTML snippet'">
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          placeholder="Tom & Jerry's &quot;café&quot;"
          spellcheck="false"
        />
      </Field>
    </template>
    <template #output>
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
</style>
