<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Select from '../../components/Select.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { clampCount, generateLorem, MAX_COUNT, MIN_COUNT } from './logic'

const unit = ref('paragraphs')
const count = ref(3)
const startWithLorem = ref(true)

const unitOptions = [
  { value: 'paragraphs', label: 'Paragraphs' },
  { value: 'sentences', label: 'Sentences' },
  { value: 'words', label: 'Words' },
]

const output = computed(() =>
  generateLorem({
    unit: unit.value as 'paragraphs' | 'sentences' | 'words',
    count: count.value,
    startWithLorem: startWithLorem.value,
  }),
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
        <Field label="Unit">
          <Select v-model="unit" :options="unitOptions" label="Unit" />
        </Field>
        <Field label="Count" :hint="`${MIN_COUNT}–${MAX_COUNT}`">
          <input
            v-model.number="count"
            type="number"
            class="input"
            :min="MIN_COUNT"
            :max="MAX_COUNT"
            @change="onCountInput"
          />
        </Field>
        <Toggle v-model="startWithLorem" label="Start with 'Lorem ipsum dolor sit amet'" />
      </div>
      <p class="tool-meta">Classic Latin filler text, generated locally.</p>
    </template>
    <template #output>
      <ResultBox :value="output" placeholder="Lorem ipsum appears here…" />
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
