<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import TwoPane from '../../components/TwoPane.vue'
import { epochToIso, epochToLocal, localDateToEpoch, parseEpoch, relativeTime } from './logic'

const epochInput = ref('')
const now = ref(Date.now())
const localDateTime = ref('')

const epoch = computed(() => parseEpoch(epochInput.value))
const epochInvalid = computed(() => epochInput.value.trim() !== '' && !epoch.value)

const isoUtc = computed(() => (epoch.value ? epochToIso(epoch.value.millis) : ''))
const localFormatted = computed(() => (epoch.value ? epochToLocal(epoch.value.millis) : ''))
const relative = computed(() => (epoch.value ? relativeTime(epoch.value.millis, now.value) : ''))

const localParsed = computed(() =>
  localDateTime.value ? localDateToEpoch(localDateTime.value) : null,
)
const localInvalid = computed(() => localDateTime.value !== '' && localParsed.value === null)

function fillNow() {
  now.value = Date.now()
  epochInput.value = String(now.value)
}
</script>

<template>
  <TwoPane input-label="Epoch timestamp" output-label="Conversions">
    <template #input>
      <Field label="Epoch (seconds or milliseconds)" hint="auto-detected by magnitude, digits only">
        <input
          v-model="epochInput"
          class="input"
          inputmode="numeric"
          placeholder="1700000000000"
          spellcheck="false"
        />
      </Field>
      <button type="button" class="btn" @click="fillNow">Now</button>
      <p v-if="epochInvalid" class="hint-error">
        Not a valid epoch — enter digits only (seconds or milliseconds).
      </p>
      <Field
        label="Local date & time"
        hint="interpreted in your timezone"
      >
        <input v-model="localDateTime" type="datetime-local" class="input" />
      </Field>
      <p v-if="localInvalid" class="hint-error">
        Invalid date — pick a real calendar date and time.
      </p>
    </template>

    <template #output>
      <template v-if="epoch">
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">ISO 8601 (UTC)</span>
            <code class="result-value">{{ isoUtc }}</code>
          </div>
          <CopyButton :value="isoUtc" />
        </div>
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">Local time</span>
            <code class="result-value">{{ localFormatted }}</code>
          </div>
          <CopyButton :value="localFormatted" />
        </div>
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">Relative</span>
            <code class="result-value">{{ relative }}</code>
          </div>
          <CopyButton :value="relative" />
        </div>
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">Epoch</span>
            <code class="result-value">
              {{ epoch.seconds }} s · {{ epoch.millis }} ms
            </code>
          </div>
          <CopyButton :value="String(epoch.seconds)" label="Copy s" />
          <CopyButton :value="String(epoch.millis)" label="Copy ms" />
        </div>
      </template>
      <p v-else class="tool-meta">Enter an epoch above to see conversions.</p>

      <template v-if="localParsed">
        <div class="divider" />
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">Epoch from local time</span>
            <code class="result-value">
              {{ localParsed.seconds }} s · {{ localParsed.millis }} ms
            </code>
          </div>
          <CopyButton :value="String(localParsed.seconds)" label="Copy s" />
          <CopyButton :value="String(localParsed.millis)" label="Copy ms" />
        </div>
      </template>
      <p v-else-if="!localDateTime" class="tool-meta">
        Pick a local date &amp; time to get its epoch.
      </p>
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

.hint-error {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.result-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.result-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.result-value {
  font-family: var(--font-mono);
  font-size: 13px;
  word-break: break-all;
}

.divider {
  height: 8px;
}
</style>
