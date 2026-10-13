<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import TwoPane from '../../components/TwoPane.vue'
import { epochToIso, epochToLocal, localDateToEpoch, parseEpoch, relativeTime } from './logic'

const epochInput = ref('')
const now = ref(Date.now())
const localDateTime = ref('')

const epoch = computed(() => parseEpoch(epochInput.value))
const epochInvalid = computed(() => epochInput.value.trim() !== '' && !epoch.value)

const isoUtc = computed(() =>
  epoch.value ? epochToIso(epoch.value.millis, epoch.value.micros % 1000) : '',
)
const localFormatted = computed(() =>
  epoch.value ? epochToLocal(epoch.value.millis, epoch.value.micros % 1000) : '',
)
const relative = computed(() => (epoch.value ? relativeTime(epoch.value.millis, now.value) : ''))

const localParsed = computed(() =>
  localDateTime.value ? localDateToEpoch(localDateTime.value) : null,
)
const localInvalid = computed(() => localDateTime.value !== '' && localParsed.value === null)

// Mirror a valid local date & time back into the epoch input (in milliseconds).
watch(localDateTime, (value) => {
  const parsed = value ? localDateToEpoch(value) : null
  if (parsed) epochInput.value = String(parsed.millis)
})

function fillNow() {
  now.value = Date.now()
  epochInput.value = String(now.value)
}
</script>

<template>
  <TwoPane input-label="Epoch timestamp" output-label="Conversions">
    <template #input>
      <Field label="Epoch (s, ms, or µs)" hint="auto-detected by magnitude, digits only">
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
        Not a valid epoch — enter digits only (seconds, milliseconds, or microseconds).
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
              {{ epoch.seconds }} s · {{ epoch.millis }} ms · {{ epoch.micros }} µs
            </code>
          </div>
          <CopyButton :value="String(epoch.seconds)" label="Copy s" />
          <CopyButton :value="String(epoch.millis)" label="Copy ms" />
          <CopyButton :value="String(epoch.micros)" label="Copy µs" />
        </div>
      </template>
      <p v-else class="tool-meta">Enter an epoch above to see conversions.</p>

      <p v-if="localInvalid" class="hint-error" style="margin-top: 8px">
        Invalid local date &amp; time — pick a real calendar date and time.
      </p>
      <p v-else-if="!localDateTime" class="tool-meta" style="margin-top: 8px">
        Pick a local date &amp; time above to set the epoch.
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
</style>
