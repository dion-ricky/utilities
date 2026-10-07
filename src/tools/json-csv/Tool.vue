<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Select from '../../components/Select.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { csvToJson, jsonToCsv } from './logic'

const input = ref('')
const toJson = ref(false)
const delimiter = ref('auto')
const headerRow = ref(true)
const flatten = ref(false)

const delimiterOptions = [
  { value: 'auto', label: 'Auto-detect' },
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
]

const output = computed(() => {
  const delim = delimiter.value === 'auto' ? undefined : delimiter.value
  return toJson.value
    ? csvToJson(input.value, { delimiter: delim, header: headerRow.value })
    : jsonToCsv(input.value, { delimiter: delim, flatten: flatten.value })
})
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <div class="tool-controls">
        <Toggle v-model="toJson" label="CSV → JSON" />
        <Select v-model="delimiter" label="Delimiter" :options="delimiterOptions" />
        <Toggle v-if="toJson" v-model="headerRow" label="Header row" />
        <Toggle v-else v-model="flatten" label="Flatten nested" />
      </div>
      <Field :label="toJson ? 'CSV' : 'JSON'" :hint="toJson ? 'paste CSV' : 'array of objects'">
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          :placeholder="toJson ? 'a,b\n1,2' : '[{&quot;a&quot;: 1, &quot;b&quot;: 2}]'"
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">{{ toJson ? 'Converts CSV to JSON.' : 'Converts JSON to CSV.' }}</p>
    </template>
    <template #output>
      <p v-if="!output.ok" class="tool-error">{{ output.error }}</p>
      <ResultBox
        v-else
        :value="output.result"
        :placeholder="toJson ? 'JSON appears here…' : 'CSV appears here…'"
      />
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
