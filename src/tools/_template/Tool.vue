<script setup lang="ts">
import { computed, ref } from 'vue'
import Field from '../../components/Field.vue'
import ResultBox from '../../components/ResultBox.vue'
import Toggle from '../../components/Toggle.vue'
import TwoPane from '../../components/TwoPane.vue'
import { transform } from './logic'

const input = ref('')
const trim = ref(false)

const output = computed(() => transform(input.value, { trim: trim.value }))
</script>

<template>
  <TwoPane input-label="Input" output-label="Output">
    <template #input>
      <Toggle v-model="trim" label="Trim whitespace" />
      <Field label="Text">
        <textarea v-model="input" class="textarea" rows="8" spellcheck="false" />
      </Field>
    </template>
    <template #output>
      <ResultBox :value="output" />
    </template>
  </TwoPane>
</template>
