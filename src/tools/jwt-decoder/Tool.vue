<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import TwoPane from '../../components/TwoPane.vue'
import type { ClaimStatus, TimedClaim } from './logic'
import { claimStatus, decodeJwt } from './logic'

const token = ref('')

interface Parsed {
  headerJson: string
  payloadJson: string
  signature: string
  badges: Array<{ claim: TimedClaim; status: ClaimStatus }>
}

const parsed = computed<{ data: Parsed | null; error: string }>(() => {
  const text = token.value.trim()
  if (!text) return { data: null, error: '' }
  try {
    const jwt = decodeJwt(text)
    const payload = jwt.payload
    const badges: Array<{ claim: TimedClaim; status: ClaimStatus }> = []
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>
      const now = Date.now()
      for (const claim of ['exp', 'iat', 'nbf'] as const) {
        const value = record[claim]
        if (typeof value === 'number')
          badges.push({ claim, status: claimStatus(claim, value, now) })
      }
    }
    return {
      data: {
        headerJson: JSON.stringify(jwt.header, null, 2),
        payloadJson: JSON.stringify(jwt.payload, null, 2),
        signature: jwt.signature,
        badges,
      },
      error: '',
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Not a valid JWT' }
  }
})
</script>

<template>
  <TwoPane input-label="Token" output-label="Decoded">
    <template #input>
      <Field label="JSON Web Token" hint="paste a JWT — it is only decoded, never sent anywhere">
        <textarea
          v-model="token"
          class="textarea"
          rows="8"
          placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature"
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">
        Decoded locally in your browser. The signature is NOT verified — do not trust a token
        just because it parses.
      </p>
    </template>
    <template #output>
      <p v-if="parsed.error" class="tool-error">{{ parsed.error }}</p>
      <template v-else-if="parsed.data">
        <div v-if="parsed.data.badges.length" class="badge-row">
          <span
            v-for="badge in parsed.data.badges"
            :key="badge.claim"
            class="badge"
            :class="badge.status.ok ? 'badge-ok' : 'badge-bad'"
            :title="badge.status.detail"
          >
            <strong>{{ badge.claim }}</strong> {{ badge.status.label }} — {{ badge.status.detail }}
          </span>
        </div>

        <div class="json-block">
          <div class="json-head">
            <span class="json-title">Header</span>
            <CopyButton :value="parsed.data.headerJson" label="Copy header" />
          </div>
          <pre class="json-pre">{{ parsed.data.headerJson }}</pre>
        </div>

        <div class="json-block">
          <div class="json-head">
            <span class="json-title">Payload</span>
            <CopyButton :value="parsed.data.payloadJson" label="Copy payload" />
          </div>
          <pre class="json-pre">{{ parsed.data.payloadJson }}</pre>
        </div>

        <div class="json-block">
          <div class="json-head">
            <span class="json-title">Signature</span>
            <CopyButton :value="parsed.data.signature" label="Copy signature" />
          </div>
          <pre class="json-pre json-pre-signature">{{ parsed.data.signature }}</pre>
        </div>
      </template>
    </template>
  </TwoPane>
</template>

<style scoped>
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

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.badge {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.badge-ok {
  border-color: #2f9e44;
  color: #2f9e44;
}

.badge-bad {
  border-color: var(--accent);
  color: var(--accent);
}

.json-block {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 12px;
  margin-bottom: 16px;
}

.json-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.json-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}

.json-pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.json-pre-signature {
  word-break: break-all;
}
</style>
