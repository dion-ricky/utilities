<script setup lang="ts">
defineProps<{
  inputLabel?: string
  outputLabel?: string
}>()
</script>

<template>
  <div class="two-pane">
    <section class="pane">
      <header v-if="inputLabel" class="pane-header">
        <span>{{ inputLabel }}</span>
        <slot name="input-actions" />
      </header>
      <slot name="input" />
    </section>
    <section class="pane">
      <header v-if="outputLabel" class="pane-header">
        <span>{{ outputLabel }}</span>
        <slot name="output-actions" />
      </header>
      <slot name="output" />
    </section>
  </div>
</template>

<style scoped>
.two-pane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

@media (max-width: 860px) {
  .two-pane {
    grid-template-columns: 1fr;
  }
}
</style>
