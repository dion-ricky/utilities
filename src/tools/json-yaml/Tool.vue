<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { jsonToYaml, yamlToJson } from './logic'

const input = ref('')
const toJson = ref(false)

const output = computed(() => (toJson.value ? yamlToJson(input.value) : jsonToYaml(input.value)))
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <div class="tool-controls">
        <Toggle v-model="toJson" label="YAML → JSON" />
      </div>
      <Field :label="toJson ? 'YAML' : 'JSON'" :hint="toJson ? 'paste YAML' : 'paste JSON'">
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          :placeholder="toJson ? 'name: Ada' : '{&quot;name&quot;: &quot;Ada&quot;}'"
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">{{ toJson ? 'Converts YAML to JSON.' : 'Converts JSON to YAML.' }}</p>
    </template>
    <template #output>
      <p v-if="!output.ok" class="tool-error">{{ output.error }}</p>
      <ResultBox
        v-else
        :value="output.result"
        :placeholder="toJson ? 'JSON appears here…' : 'YAML appears here…'"
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
