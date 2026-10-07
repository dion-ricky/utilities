<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import Select from '../../components/Select.vue'
import TwoPane from '../../components/TwoPane.vue'
import { CRON_PRESETS, describeCron, formatRun, MAX_RUNS, nextRuns } from './logic'

const expression = ref('*/15 * * * *')
const preset = ref('every-15-minutes')
const count = ref(5)

const presetOptions = CRON_PRESETS.map((p) => ({ value: p.value, label: p.label }))

function onPresetChange(value: string) {
  preset.value = value
  const found = CRON_PRESETS.find((p) => p.value === value)
  if (found && found.expr !== '') {
    expression.value = found.expr
  }
}

const description = computed(() => describeCron(expression.value))
const runs = computed(() => nextRuns(expression.value, count.value))

const runCountOptions = Array.from({ length: MAX_RUNS }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

const nextRunLocal = computed(() => {
  const result = runs.value
  if (!result.ok) return []
  return result.runs.map((run) => formatRun(run))
})
</script>

<template>
  <TwoPane input-label="Cron expression" output-label="Upcoming runs">
    <template #input>
      <Field label="Preset">
        <Select
          :model-value="preset"
          :options="presetOptions"
          label="Preset"
          @update:model-value="onPresetChange"
        />
      </Field>
      <Field label="Expression" hint="5 fields: minute hour day-of-month month day-of-week">
        <input
          v-model="expression"
          class="input"
          placeholder="*/15 * * * *"
          spellcheck="false"
        />
      </Field>
      <Field label="Number of next runs" hint="1–20">
        <select v-model.number="count" class="select">
          <option
            v-for="option in runCountOptions"
            :key="option.value"
            :value="Number(option.value)"
          >
            {{ option.label }}
          </option>
        </select>
      </Field>
      <p class="tool-meta">
        <template v-if="description.ok">{{ description.description }}</template>
        <template v-else>{{ description.error }}</template>
      </p>
    </template>

    <template #output>
      <p v-if="!runs.ok" class="error-note">{{ runs.error }}</p>
      <template v-else>
        <ol class="run-list">
          <li v-for="(run, i) in nextRunLocal" :key="i" class="run-row">
            <span class="run-index">{{ i + 1 }}.</span>
            <code class="run-time">{{ run }}</code>
            <CopyButton :value="run" />
          </li>
        </ol>
      </template>
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

.error-note {
  margin: 0;
  color: var(--accent);
  font-size: 13px;
}

.run-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.run-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
}

.run-index {
  color: var(--muted);
  font-size: 12px;
  min-width: 24px;
}

.run-time {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
}
</style>
