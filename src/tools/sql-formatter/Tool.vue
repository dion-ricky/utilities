<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Select from '../../components/Select.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import type { SqlLanguage } from './logic'
import { formatSql } from './logic'

const input = ref('')
const language = ref('postgresql')
const indent = ref('2')
const uppercase = ref(true)

const languageOptions = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'tsql', label: 'T-SQL' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
]

const indentOptions = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
]

const output = computed(() =>
  formatSql(input.value, {
    language: language.value as SqlLanguage,
    indent: indent.value as '2' | '4' | 'tab',
    keywordCase: uppercase.value ? 'upper' : 'preserve',
  }),
)
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <div class="tool-controls">
        <Select v-model="language" label="Dialect" :options="languageOptions" />
        <Select v-model="indent" label="Indent" :options="indentOptions" />
        <Toggle v-model="uppercase" label="Uppercase keywords" />
      </div>
      <Field label="SQL" hint="paste any query">
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          placeholder="select a, b from t where x = 1"
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">Paste SQL to format it.</p>
    </template>
    <template #output>
      <p v-if="!output.ok" class="tool-error">{{ output.error }}</p>
      <ResultBox v-else :value="output.result" placeholder="Formatted SQL appears here…" />
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
