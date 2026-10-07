<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import {
  toCamel,
  toConstant,
  toKebab,
  toLowerSentence,
  toPascal,
  toSnake,
  toTitle,
  toUpperSentence,
} from './logic'

const input = ref('backgroundColor2Fast')

const conversions = computed(() => [
  { label: 'camelCase', value: toCamel(input.value) },
  { label: 'PascalCase', value: toPascal(input.value) },
  { label: 'snake_case', value: toSnake(input.value) },
  { label: 'kebab-case', value: toKebab(input.value) },
  { label: 'CONSTANT_CASE', value: toConstant(input.value) },
  { label: 'Title Case', value: toTitle(input.value) },
  { label: 'UPPER CASE', value: toUpperSentence(input.value) },
  { label: 'lower case', value: toLowerSentence(input.value) },
])
</script>

<template>
  <div class="tool">
    <Field label="Input text" hint="anyCase, snake_case, kebab-case, spaces — all handled">
      <textarea
        v-model="input"
        class="textarea"
        placeholder="Paste an identifier or sentence…"
        spellcheck="false"
      />
    </Field>

    <div class="grid">
      <div v-for="conversion in conversions" :key="conversion.label" class="row">
        <span class="row-label">{{ conversion.label }}</span>
        <code class="row-value">{{ conversion.value || '—' }}</code>
        <CopyButton :value="conversion.value" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
}

.row-label {
  min-width: 130px;
  font-size: 12px;
  color: var(--muted);
}

.row-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
  word-break: break-all;
}
</style>
