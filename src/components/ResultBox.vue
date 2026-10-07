<script setup lang="ts">
import CopyButton from './CopyButton.vue'

withDefaults(
  defineProps<{
    value: string
    placeholder?: string
    copyLabel?: string
  }>(),
  { placeholder: 'Output appears here…', copyLabel: 'Copy' },
)
</script>

<template>
  <div class="result-box">
    <template v-if="value">
      <CopyButton :value="value" :label="copyLabel" class="result-copy" />
      <pre class="result-pre">{{ value }}</pre>
    </template>
    <p v-else class="result-placeholder">{{ placeholder }}</p>
  </div>
</template>

<style scoped>
.result-box {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  min-height: 180px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.result-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.result-pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  padding-right: 70px;
}

.result-placeholder {
  margin: auto;
  color: var(--muted);
  font-size: 14px;
}
</style>
