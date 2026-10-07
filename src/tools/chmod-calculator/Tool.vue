<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import Field from '../../components/Field.vue'
import Toggle from '../../components/Toggle.vue'
import {
  bitsToOctal,
  bitsToSymbolic,
  chmodCommand,
  octalToBits,
  type PermissionBits,
} from './logic'

const bits = reactive<PermissionBits>({
  owner: { r: true, w: true, x: true },
  group: { r: true, w: false, x: true },
  others: { r: true, w: false, x: true },
  special: { setuid: false, setgid: false, sticky: false },
})

const roles = [
  { key: 'owner', label: 'Owner' },
  { key: 'group', label: 'Group' },
  { key: 'others', label: 'Others' },
] as const
const perms = ['r', 'w', 'x'] as const
const permLabels: Record<string, string> = { r: 'Read', w: 'Write', x: 'Execute' }

const octalInput = ref('755')
const path = ref('path/')
const recursive = ref(false)

const octal = computed(() => bitsToOctal(bits))
const symbolic = computed(() => bitsToSymbolic(bits))
const command = computed(() => chmodCommand(bits, path.value, recursive.value))

// Bidirectional sync: octal input drives the checkboxes.
watch(octalInput, (value) => {
  const parsed = octalToBits(value)
  if (!parsed) return
  bits.owner = { ...parsed.owner }
  bits.group = { ...parsed.group }
  bits.others = { ...parsed.others }
  bits.special = { ...parsed.special }
})

// And checkbox changes drive the octal input.
watch(octal, (value) => {
  if (octalInput.value !== value) {
    octalInput.value = value
  }
})

function setTriple(role: 'owner' | 'group' | 'others', perm: 'r' | 'w' | 'x', value: boolean) {
  bits[role][perm] = value
}
</script>

<template>
  <div class="tool">
    <div class="layout">
      <div class="left">
        <Field label="Permission grid" hint="click to toggle read / write / execute">
          <div class="grid">
            <span class="grid-head" />
            <span v-for="perm in perms" :key="perm" class="grid-head">{{ permLabels[perm] }}</span>
            <template v-for="role in roles" :key="role.key">
              <span class="grid-role">{{ role.label }}</span>
              <label v-for="perm in perms" :key="perm" class="grid-cell">
                <input
                  type="checkbox"
                  :checked="bits[role.key][perm]"
                  @change="setTriple(role.key, perm, ($event.target as HTMLInputElement).checked)"
                />
              </label>
            </template>
          </div>
        </Field>
        <div class="tool-controls">
          <Toggle v-model="bits.special.setuid" label="Setuid (4000)" />
          <Toggle v-model="bits.special.setgid" label="Setgid (2000)" />
          <Toggle v-model="bits.special.sticky" label="Sticky (1000)" />
        </div>
        <Field label="Octal" hint="3 or 4 digits, 0–7 — edits sync the grid">
          <input
            v-model="octalInput"
            class="input"
            inputmode="numeric"
            maxlength="4"
            placeholder="755"
            spellcheck="false"
          />
        </Field>
        <p v-if="!octalToBits(octalInput)" class="tool-meta">
          Enter 3 or 4 octal digits (0–7) to sync the grid.
        </p>
      </div>

      <div class="right">
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">Octal</span>
            <code class="result-value big">{{ octal }}</code>
          </div>
          <CopyButton :value="octal" />
        </div>
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">Symbolic</span>
            <code class="result-value big">{{ symbolic }}</code>
          </div>
          <CopyButton :value="symbolic" />
        </div>
        <Field label="Path">
          <input v-model="path" class="input" placeholder="path/" spellcheck="false" />
        </Field>
        <div class="tool-controls">
          <Toggle v-model="recursive" label="Recursive (-R)" />
        </div>
        <div class="result-row">
          <div class="result-col">
            <span class="result-label">Command</span>
            <code class="result-value">{{ command }}</code>
          </div>
          <CopyButton :value="command" label="Copy command" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.left,
.right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.grid {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 8px 16px;
  align-items: center;
  justify-content: start;
}

.grid-head {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.grid-role {
  font-size: 13px;
  font-weight: 600;
}

.grid-cell {
  display: inline-flex;
}

.grid-cell input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
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

.result-value.big {
  font-size: 20px;
}
</style>
