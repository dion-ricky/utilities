<script setup lang="ts">
import QRCode from 'qrcode'
import { ref, watch } from 'vue'
import Field from '../../components/Field.vue'
import Select from '../../components/Select.vue'
import TwoPane from '../../components/TwoPane.vue'
import { useDebounce } from '../../composables/useDebounce'
import { buildQrOptions, clampMargin, clampSize, ECC_LEVELS } from './logic'

const payload = ref('')
const size = ref(256)
const margin = ref(4)
const ecc = ref('M')

const eccOptions = ECC_LEVELS.map((level) => ({ value: level, label: level }))

const debouncedPayload = useDebounce(payload, 250)
const debouncedSize = useDebounce(size, 250)
const debouncedMargin = useDebounce(margin, 250)
const debouncedEcc = useDebounce(ecc, 250)

const dataUrl = ref('')
const svgError = ref('')

watch(
  [debouncedPayload, debouncedSize, debouncedMargin, debouncedEcc],
  async ([text, s, m, level]) => {
    if (!text) {
      dataUrl.value = ''
      svgError.value = ''
      return
    }
    try {
      const opts = buildQrOptions({ size: s, margin: m, ecc: level })
      dataUrl.value = await QRCode.toDataURL(text, opts)
      svgError.value = ''
    } catch (err) {
      dataUrl.value = ''
      svgError.value = err instanceof Error ? err.message : 'Failed to generate QR code.'
    }
  },
  { immediate: true },
)

function onSizeInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) size.value = clampSize(value)
}

function onMarginInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) margin.value = clampMargin(value)
}

function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function downloadPng() {
  if (!dataUrl.value) return
  triggerDownload(dataUrl.value, 'qr.png')
}

async function downloadSvg() {
  if (!debouncedPayload.value) return
  try {
    const opts = buildQrOptions({
      size: size.value,
      margin: margin.value,
      ecc: ecc.value,
    })
    const svg = await QRCode.toString(debouncedPayload.value, {
      ...opts,
      type: 'svg',
    })
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'qr.svg')
    URL.revokeObjectURL(url)
  } catch (err) {
    svgError.value = err instanceof Error ? err.message : 'Failed to export SVG.'
  }
}
</script>

<template>
  <TwoPane input-label="Content" output-label="Preview">
    <template #input>
      <Field label="Text / URL" hint="the QR payload">
        <textarea
          v-model="payload"
          class="textarea"
          rows="6"
          placeholder="https://example.com"
          spellcheck="false"
        />
      </Field>
      <div class="tool-controls">
        <Field label="Size (px)" hint="100–1000">
          <input
            v-model.number="size"
            type="number"
            class="input"
            :min="100"
            :max="1000"
            @change="onSizeInput"
          />
        </Field>
        <Field label="Margin" hint="0–10">
          <input
            v-model.number="margin"
            type="number"
            class="input"
            :min="0"
            :max="10"
            @change="onMarginInput"
          />
        </Field>
        <Field label="Error correction">
          <Select v-model="ecc" :options="eccOptions" label="Error correction" />
        </Field>
      </div>
    </template>
    <template #output>
      <template v-if="payload">
        <p v-if="svgError" class="tool-meta error">{{ svgError }}</p>
        <div v-else-if="dataUrl" class="preview-wrap">
          <img :src="dataUrl" alt="QR code preview" class="qr-preview" />
          <div class="tool-controls">
            <button type="button" class="btn" @click="downloadPng">Download PNG</button>
            <button type="button" class="btn" @click="downloadSvg">Download SVG</button>
          </div>
        </div>
      </template>
      <p v-else class="tool-meta">Enter text above to generate a QR code.</p>
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

.preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.qr-preview {
  width: 200px;
  height: 200px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  image-rendering: pixelated;
}
</style>
