<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { diffText } from './logic'

const original = ref('')
const changed = ref('')
const wordLevel = ref(false)
const ignoreCase = ref(false)
const ignoreWhitespace = ref(false)

const output = computed(() =>
  diffText(original.value, changed.value, {
    wordLevel: wordLevel.value,
    ignoreCase: ignoreCase.value,
    ignoreWhitespace: ignoreWhitespace.value,
  }),
)

const stats = computed(() => {
  const { added, removed } = output.value
  if (added === 0 && removed === 0) return 'no changes'
  return `+${added} −${removed}`
})
</script>

<template>
  <TwoPane input-label="Original" output-label="Changed">
    <template #input>
      <div class="tool-controls">
        <Toggle v-model="wordLevel" label="Word-level" />
        <Toggle v-model="ignoreCase" label="Ignore case" />
        <Toggle v-model="ignoreWhitespace" label="Ignore whitespace" />
      </div>
      <Field label="Original text">
        <textarea
          v-model="original"
          class="textarea"
          rows="8"
          placeholder="the original text…"
          spellcheck="false"
        />
      </Field>
      <Field label="Changed text">
        <textarea
          v-model="changed"
          class="textarea"
          rows="8"
          placeholder="the changed text…"
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">{{ stats }}</p>
    </template>
    <template #output>
      <Field label="Unified diff">
        <ResultBox :value="output.unified" placeholder="Diff appears here…" />
      </Field>
      <Field label="Side by side">
        <div class="sxs">
          <div class="sxs-col">
            <div
              v-for="(row, i) in output.sideBySide.left"
              :key="`l${i}`"
              class="sxs-row"
              :class="`sxs-${row.type}`"
            >{{ row.text }}</div>
          </div>
          <div class="sxs-col">
            <div
              v-for="(row, i) in output.sideBySide.right"
              :key="`r${i}`"
              class="sxs-row"
              :class="`sxs-${row.type}`"
            >{{ row.text }}</div>
          </div>
        </div>
        <CopyButton v-if="output.unified" :value="() => output.unified" label="Copy diff" />
      </Field>
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

.sxs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
}

.sxs-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sxs-row {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  padding: 0 8px;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 18px;
}

.sxs-removed {
  background: rgba(214, 69, 69, 0.15);
  color: #d64545;
}

.sxs-added {
  background: rgba(46, 158, 91, 0.15);
  color: #2e9e5b;
}

@media (max-width: 860px) {
  .sxs {
    grid-template-columns: 1fr;
  }
}
</style>
