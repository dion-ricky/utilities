<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import TwoPane from '../../components/TwoPane.vue'
import type { ParsedColor } from './logic'
import { parseColor, toCmykString, toHex, toHslString, toRgbString } from './logic'

const input = ref('')

const parsed = computed<ParsedColor | null>(() => parseColor(input.value))

const swatchStyle = computed(() => {
  const color = parsed.value
  if (!color) return undefined
  return {
    backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
  }
})

const pickerValue = computed(() => {
  const color = parsed.value
  if (!color) return '#000000'
  return toHex({ r: color.r, g: color.g, b: color.b, a: 1 })
})

const formats = computed(() => {
  const color = parsed.value
  if (!color) return []
  return [
    { label: 'HEX', value: toHex(color) },
    { label: 'RGB', value: toRgbString(color) },
    { label: 'HSL', value: toHslString(color) },
    { label: 'CMYK', value: toCmykString(color) },
  ]
})

function onPickerChange(event: Event) {
  input.value = (event.target as HTMLInputElement).value
}
</script>

<template>
  <TwoPane input-label="Color" output-label="Formats">
    <template #input>
      <Field label="Color" hint="hex, rgb()/rgba(), or hsl()/hsla()">
        <div class="picker-row">
          <input
            v-model="input"
            class="input"
            type="text"
            placeholder="#1a7f5a or rgb(26, 127, 90)"
            spellcheck="false"
          />
          <input
            class="picker"
            type="color"
            :value="pickerValue"
            aria-label="Pick a color"
            @input="onPickerChange"
          />
        </div>
      </Field>
      <p v-if="input.trim() && !parsed" class="tool-error">
        Not a valid color — try #ff8800, rgb(255, 136, 0) or hsl(30, 100%, 50%)
      </p>
    </template>
    <template #output>
      <div v-if="parsed" class="results">
        <div class="swatch-row">
          <div class="swatch" :style="swatchStyle" />
          <p class="tool-meta">Swatch preview (alpha respected)</p>
        </div>
        <div v-for="format in formats" :key="format.label" class="format-block">
          <div class="format-head">
            <span class="format-label">{{ format.label }}</span>
            <CopyButton :value="format.value" :label="`Copy ${format.label}`" />
          </div>
          <pre class="format-value">{{ format.value }}</pre>
        </div>
      </div>
      <p v-else-if="input.trim()" class="tool-error">
        Not a valid color — try #ff8800, rgb(255, 136, 0) or hsl(30, 100%, 50%)
      </p>
    </template>
  </TwoPane>
</template>

<style scoped>
.picker-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.picker {
  width: 44px;
  height: 38px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
}

.tool-meta {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.tool-error {
  margin: 0;
  color: var(--accent);
  font-size: 14px;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.swatch-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.swatch {
  width: 64px;
  height: 40px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background-color: transparent;
}

.format-block {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 10px 12px;
}

.format-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.format-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.format-value {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
