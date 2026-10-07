<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { echoTransform } from './logic'

const input = ref('')
const reverse = ref(false)
const uppercase = ref(false)

const output = computed(() =>
  echoTransform(input.value, {
    reverse: reverse.value,
    uppercase: uppercase.value,
  }),
)
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <div class="tool-controls">
        <Toggle v-model="reverse" label="Reverse" />
        <Toggle v-model="uppercase" label="Uppercase" />
      </div>
      <Field label="Text" hint="type anything">
        <textarea
          v-model="input"
          class="textarea"
          rows="8"
          placeholder="Hello, world!"
          spellcheck="false"
        />
      </Field>
      <p class="tool-meta">{{ input.length }} chars</p>
    </template>
    <template #output>
      <ResultBox :value="output" />
    </template>
  </TwoPane>
</template>

<style scoped>
.tool-controls {
  display: flex;
  gap: 16px;
}

.tool-meta {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
