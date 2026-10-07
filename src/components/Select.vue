<script setup lang="ts">
defineProps<{
  modelValue: string
  options: Array<{ value: string; label: string }>
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <select class="select" :value="modelValue" :aria-label="label" @change="onChange">
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
