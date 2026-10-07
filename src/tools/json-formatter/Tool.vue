<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Select from '../../components/Select.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { formatJson } from './logic'

const input = ref('')
const indent = ref('2')
const sortKeys = ref(false)

const indentOptions = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
  { value: 'none', label: 'Minify' },
]

const output = computed(() =>
  formatJson(input.value, {
    indent: indent.value as '2' | '4' | 'tab' | 'none',
    sortKeys: sortKeys.value,
  }),
)

const meta = computed(() => {
  if (!output.value.ok) return ''
  const chars = output.value.result.length
  const bytes = new TextEncoder().encode(output.value.result).length
  return `${chars} chars · ${bytes} bytes`
})
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <div class="tool-controls">
        <Select v-model="indent" label="Indent" :options="indentOptions" />
        <Toggle v-model="sortKeys" label="Sort keys" />
      </div>
      <Field label="JSON" hint="paste any JSON">
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          placeholder='{"hello": "world"}'
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">Paste JSON to format it.</p>
    </template>
    <template #output>
      <p v-if="!output.ok" class="tool-error">{{ output.error }}</p>
      <ResultBox v-else :value="output.result" placeholder="Formatted JSON appears here…" />
      <p class="tool-meta">{{ meta }}</p>
    </template>
  </TwoPane>
</template>

<style scoped>
.tool-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.tool-controls > * {
  min-width: 180px;
}

.tool-meta {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.tool-error {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 14px;
  color: #d64545;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
