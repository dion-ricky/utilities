<script setup lang="ts">
import { Star } from '@lucide/vue'
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { navigateToTool } from '../router'
import { tools, toolsByCategory } from '../tools'
import type { ToolMeta } from '../tools/types'

defineEmits<{ 'open-palette': [] }>()

const favorites = useLocalStorage<string[]>('dsk.favorites', [])
const recents = useLocalStorage<string[]>('dsk.recents', [])

const favoriteTools = computed(() =>
  favorites.value
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolMeta => tool !== undefined),
)

const recentTools = computed(() =>
  recents.value
    .filter((slug) => !favorites.value.includes(slug))
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolMeta => tool !== undefined)
    .slice(0, 6),
)

function isFavorite(tool: ToolMeta) {
  return favorites.value.includes(tool.slug)
}

function toggleFavorite(tool: ToolMeta) {
  favorites.value = isFavorite(tool)
    ? favorites.value.filter((slug) => slug !== tool.slug)
    : [...favorites.value, tool.slug]
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>Dev Swiss Army Knife</h1>
      <p>
        {{ tools.length }} tool{{ tools.length === 1 ? '' : 's' }} that run entirely in your
        browser. No backend, no uploads — nothing you paste ever leaves your device.
      </p>
      <button type="button" class="btn hero-search" @click="$emit('open-palette')">
        Search tools
        <kbd>⌘K</kbd>
      </button>
    </section>

    <section v-if="favoriteTools.length" class="category">
      <h2>Favorites</h2>
      <div class="grid">
        <article
          v-for="tool in favoriteTools"
          :key="tool.slug"
          class="card"
          tabindex="0"
          role="link"
          @click="navigateToTool(tool.slug)"
          @keydown.enter="navigateToTool(tool.slug)"
        >
          <div class="card-top">
            <h3>{{ tool.name }}</h3>
            <button
              type="button"
              class="star-btn filled"
              :aria-label="`Remove ${tool.name} from favorites`"
              @click.stop="toggleFavorite(tool)"
            >
              <Star :size="14" />
            </button>
          </div>
          <p>{{ tool.description }}</p>
        </article>
      </div>
    </section>

    <section v-if="recentTools.length" class="category">
      <h2>Recent</h2>
      <div class="grid">
        <article
          v-for="tool in recentTools"
          :key="tool.slug"
          class="card"
          tabindex="0"
          role="link"
          @click="navigateToTool(tool.slug)"
          @keydown.enter="navigateToTool(tool.slug)"
        >
          <div class="card-top">
            <h3>{{ tool.name }}</h3>
            <button
              type="button"
              class="star-btn"
              :aria-label="`Add ${tool.name} to favorites`"
              @click.stop="toggleFavorite(tool)"
            >
              <Star :size="14" />
            </button>
          </div>
          <p>{{ tool.description }}</p>
        </article>
      </div>
    </section>

    <section v-for="group in toolsByCategory" :key="group.category" class="category">
      <h2>{{ group.label }}</h2>
      <div class="grid">
        <article
          v-for="tool in group.tools"
          :key="tool.slug"
          class="card"
          tabindex="0"
          role="link"
          @click="navigateToTool(tool.slug)"
          @keydown.enter="navigateToTool(tool.slug)"
        >
          <div class="card-top">
            <h3>{{ tool.name }}</h3>
            <button
              type="button"
              class="star-btn"
              :class="{ filled: isFavorite(tool) }"
              :aria-label="isFavorite(tool) ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`"
              :aria-pressed="isFavorite(tool)"
              @click.stop="toggleFavorite(tool)"
            >
              <Star :size="14" />
            </button>
          </div>
          <p>{{ tool.description }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 48px 0 40px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: 32px;
  letter-spacing: -0.02em;
}

.hero p {
  margin: 0 auto 20px;
  max-width: 480px;
  color: var(--muted);
  font-size: 15px;
}

.hero-search kbd {
  margin-left: 4px;
}

.category {
  margin-bottom: 32px;
}

.category h2 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  cursor: pointer;
  transition:
    border-color 0.12s ease,
    transform 0.12s ease;
}

.card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card h3 {
  margin: 0;
  font-size: 15px;
}

.card p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.45;
}

.star-btn {
  display: inline-flex;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  flex-shrink: 0;
}

.star-btn:hover {
  color: var(--fg);
}

.star-btn.filled {
  color: var(--accent);
}

.star-btn.filled :deep(svg) {
  fill: currentColor;
}

.star-btn:focus-visible {
  outline: 2px solid var(--accent);
}
</style>
