<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import TwoPane from '../../components/TwoPane.vue'
import { findMatches, highlightHtml, parseFlags, replacePreview } from './logic'

const pattern = ref('\\w+')
const flags = ref('g')
const text = ref('Hello, world! Hello again.')
const replacement = ref('[$&]')

const flagsInfo = computed(() => parseFlags(flags.value))
const effectiveFlags = computed(() => flagsInfo.value.valid.join(''))

const matchResult = computed(() => findMatches(pattern.value, effectiveFlags.value, text.value))

const highlighted = computed(() => {
  const result = matchResult.value
  if (!result.ok) return ''
  return highlightHtml(text.value, result.matches)
})

const replaceResult = computed(() =>
  replacePreview(text.value, pattern.value, effectiveFlags.value, replacement.value),
)

const truncationNote = computed(() => {
  const result = matchResult.value
  if (!result.ok || !result.truncated) return ''
  return `Showing ${result.matches.length} of ${result.total} matches — refine the pattern.`
})
</script>

<template>
  <TwoPane input-label="Test text & pattern" output-label="Matches & replace">
    <template #input>
      <Field label="Pattern" hint="without surrounding slashes">
        <input v-model="pattern" class="input" placeholder="\w+" spellcheck="false" />
      </Field>
      <Field label="Flags" hint="e.g. gimsuy — invalid flags are ignored">
        <input v-model="flags" class="input" placeholder="g" spellcheck="false" />
      </Field>
      <Field label="Test text">
        <textarea
          v-model="text"
          class="textarea"
          placeholder="Paste text to test against…"
          spellcheck="false"
        />
      </Field>
      <p v-if="flagsInfo.invalid.length" class="tool-meta">
        Ignored unsupported flag(s): {{ flagsInfo.invalid.join(', ') }}
      </p>
      <p class="tool-meta">
        {{ text.length }} chars · {{ flagsInfo.valid.join('') || 'no flags' }}
      </p>
    </template>

    <template #output>
      <p v-if="!matchResult.ok" class="error-note">{{ matchResult.error }}</p>
      <template v-else>
        <p class="tool-meta">
          {{ matchResult.total }} match{{ matchResult.total === 1 ? '' : 'es' }}
        </p>
        <p v-if="truncationNote" class="note">{{ truncationNote }}</p>
        <div v-if="matchResult.matches.length" class="match-list">
          <div v-for="match in matchResult.matches" :key="match.index" class="match-row">
            <span class="match-index">#{{ match.index }}</span>
            <code class="match-text">{{ match.text || '(empty)' }}</code>
            <span v-if="match.groups.length" class="match-groups">
              groups: {{ match.groups.map((g, i) => `$${i + 1}=${g || '∅'}`).join(' ') }}
            </span>
            <span v-if="Object.keys(match.namedGroups).length" class="match-groups">
              {{
                Object.entries(match.namedGroups)
                  .map(([k, v]) => `${k}=${v || '∅'}`)
                  .join(' ')
              }}
            </span>
          </div>
        </div>
        <Field label="Highlighted preview">
          <pre class="highlight" v-html="highlighted" />
        </Field>
        <Field label="Replacement" hint="$1, $&lt;name&gt; and $& are supported">
          <input v-model="replacement" class="input" placeholder="[$&]" spellcheck="false" />
        </Field>
        <p v-if="!replaceResult.ok" class="error-note">{{ replaceResult.error }}</p>
        <Field v-else label="Replace preview" hint="add the g flag to replace all">
          <div class="replace-row">
            <code class="replace-value">{{ replaceResult.result }}</code>
            <CopyButton :value="replaceResult.result" label="Copy" />
          </div>
        </Field>
      </template>
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

.error-note {
  margin: 0;
  color: var(--accent);
  font-size: 13px;
}

.note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  font-style: italic;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px;
  background: var(--surface);
}

.match-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
}

.match-index {
  color: var(--muted);
  font-family: var(--font-mono);
  min-width: 48px;
}

.match-text {
  font-family: var(--font-mono);
  color: var(--fg);
  word-break: break-all;
}

.match-groups {
  color: var(--muted);
  font-family: var(--font-mono);
}

.highlight {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  max-height: 180px;
  overflow-y: auto;
}

.highlight mark {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  color: inherit;
  border-radius: 3px;
  padding: 0 2px;
}

.replace-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
}

.replace-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
