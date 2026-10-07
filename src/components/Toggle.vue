<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <label class="toggle">
    <input
      type="checkbox"
      class="toggle-input"
      :checked="modelValue"
      @change="onChange"
    />
    <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb" /></span>
    <span v-if="label" class="toggle-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.toggle-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.toggle-input:focus-visible + .toggle-track {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.toggle-track {
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 2px;
  display: inline-flex;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.toggle-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--muted);
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.toggle-input:checked + .toggle-track {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(14px);
  background: var(--accent-fg);
}

.toggle-label {
  color: var(--fg);
}
</style>
