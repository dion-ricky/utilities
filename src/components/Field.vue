<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
}>()
</script>

<template>
  <div class="field">
    <span class="field-label">
      {{ label }}
      <span v-if="hint" class="field-hint">{{ hint }}</span>
    </span>
    <slot />
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
}

.field-hint {
  font-weight: 400;
  color: var(--muted);
}
</style>
