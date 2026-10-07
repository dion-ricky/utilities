<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { clampCount, generateUuids, MAX_COUNT, MIN_COUNT } from './logic'

const count = ref(5)
const uppercase = ref(false)
const removeHyphens = ref(false)

const uuids = computed(() =>
  generateUuids(count.value, {
    uppercase: uppercase.value,
    hyphens: !removeHyphens.value,
  }),
)

const output = computed(() => uuids.value.join('\n'))

const meta = computed(
  () => `${uuids.value.length} UUID${uuids.value.length === 1 ? '' : 's'} · v4 · crypto.randomUUID`,
)

function onCountInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) count.value = clampCount(value)
}
</script>

<template>
  <TwoPane input-label="Options" output-label="Output">
    <template #input>
      <div class="tool-controls">
        <Field label="Count" :hint="`1–${MAX_COUNT}`">
          <input
            v-model.number="count"
            type="number"
            class="input"
            :min="MIN_COUNT"
            :max="MAX_COUNT"
            @change="onCountInput"
          />
        </Field>
        <Toggle v-model="uppercase" label="Uppercase" />
        <Toggle v-model="removeHyphens" label="Remove hyphens" />
      </div>
      <p class="tool-meta">{{ meta }}</p>
    </template>
    <template #output>
      <ResultBox :value="output" placeholder="UUIDs appear here…" copy-label="Copy all" />
    </template>
  </TwoPane>
</template>

<style scoped>
.tool-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.tool-controls input[type='number'] {
  width: 110px;
}

.tool-meta {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
