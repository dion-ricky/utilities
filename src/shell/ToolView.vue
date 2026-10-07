<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { computed, defineAsyncComponent, watchEffect } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { navigateHome, useRoute } from '../router'
import { getTool } from '../tools'

const route = useRoute()
const recents = useLocalStorage<string[]>('dsk.recents', [])

const tool = computed(() => (route.value.name === 'tool' ? getTool(route.value.slug) : undefined))

const toolComponent = computed(() =>
  tool.value ? defineAsyncComponent(tool.value.component) : undefined,
)

watchEffect(() => {
  document.title = tool.value ? `${tool.value.name} — Dev Swiss Army Knife` : 'Dev Swiss Army Knife'

  const slug = tool.value?.slug
  if (slug) {
    recents.value = [slug, ...recents.value.filter((s) => s !== slug)].slice(0, 6)
  }
})
</script>

<template>
  <div v-if="tool" class="tool">
    <nav class="tool-nav">
      <a href="#/" class="back-link" @click.prevent="navigateHome">
        <ArrowLeft :size="14" aria-hidden="true" />
        All tools
      </a>
    </nav>
    <header class="tool-header">
      <h1>{{ tool.name }}</h1>
      <p>{{ tool.description }}</p>
    </header>
    <component :is="toolComponent" />
  </div>

  <div v-else class="not-found">
    <h1>Tool not found</h1>
    <p>There is no tool at this address (yet).</p>
    <a href="#/">← Back to all tools</a>
  </div>
</template>

<style scoped>
.tool-nav {
  margin: 24px 0 12px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
  text-decoration: none;
}

.back-link:hover {
  color: var(--fg);
}

.tool-header {
  margin-bottom: 20px;
}

.tool-header h1 {
  margin: 0 0 4px;
  font-size: 24px;
  letter-spacing: -0.01em;
}

.tool-header p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.not-found {
  text-align: center;
  padding: 80px 0;
}

.not-found h1 {
  margin: 0 0 8px;
}
</style>
