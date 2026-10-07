<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import {
  buildPool,
  clampLength,
  generatePassword,
  MAX_LENGTH,
  MIN_LENGTH,
  passwordEntropy,
} from './logic'

const length = ref(16)
const uppercase = ref(true)
const lowercase = ref(true)
const digits = ref(true)
const symbols = ref(true)
const excludeAmbiguous = ref(false)

const result = ref<{ password: string } | { error: string }>({ password: '' })

const pool = computed(() =>
  buildPool({
    length: length.value,
    uppercase: uppercase.value,
    lowercase: lowercase.value,
    digits: digits.value,
    symbols: symbols.value,
    excludeAmbiguous: excludeAmbiguous.value,
  }),
)

const entropyMeta = computed(() => {
  const effectiveLength = clampLength(length.value)
  if (!pool.value) return 'No character set selected.'
  const bits = passwordEntropy(effectiveLength, pool.value.length)
  return `Entropy ≈ ${bits} bits (${effectiveLength} chars × log₂(${pool.value.length}))`
})

const password = computed(() => ('password' in result.value ? result.value.password : ''))
const errorMessage = computed(() => ('error' in result.value ? result.value.error : ''))

// Re-roll on mount and whenever any control changes.
watch([length, uppercase, lowercase, digits, symbols, excludeAmbiguous], regenerate, {
  immediate: true,
})

function regenerate() {
  result.value = generatePassword({
    length: length.value,
    uppercase: uppercase.value,
    lowercase: lowercase.value,
    digits: digits.value,
    symbols: symbols.value,
    excludeAmbiguous: excludeAmbiguous.value,
  })
}

function onLengthInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) length.value = clampLength(value)
}
</script>

<template>
  <TwoPane input-label="Options" output-label="Password">
    <template #input>
      <div class="tool-controls">
        <Field label="Length" :hint="`${MIN_LENGTH}–${MAX_LENGTH}`">
          <input
            v-model.number="length"
            type="number"
            class="input"
            :min="MIN_LENGTH"
            :max="MAX_LENGTH"
            @change="onLengthInput"
          />
        </Field>
        <Toggle v-model="uppercase" label="Uppercase" />
        <Toggle v-model="lowercase" label="Lowercase" />
        <Toggle v-model="digits" label="Digits" />
        <Toggle v-model="symbols" label="Symbols" />
        <Toggle v-model="excludeAmbiguous" label="Exclude ambiguous (I l 1 O 0)" />
      </div>
      <p class="tool-meta">{{ entropyMeta }}</p>
    </template>
    <template #output>
      <ResultBox :value="password" placeholder="Select a character set…" copy-label="Copy password" />
      <p v-if="errorMessage" class="tool-meta error">{{ errorMessage }}</p>
      <button v-else type="button" class="btn" @click="regenerate">Regenerate</button>
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

.tool-meta.error {
  color: var(--accent);
}
</style>
