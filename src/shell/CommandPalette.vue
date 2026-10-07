<script setup lang="ts">
import { CornerDownLeft, Search, Star } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { navigateToTool } from '../router'
import { searchTools } from '../tools'
import { CATEGORY_LABELS, type ToolMeta } from '../tools/types'

const open = ref(false)
const query = ref('')
const active = ref(0)
const inputEl = ref<HTMLInputElement>()
const listEl = ref<HTMLUListElement>()
const favorites = useLocalStorage<string[]>('dsk.favorites', [])

const results = computed(() => searchTools(query.value))

watch(results, () => {
  active.value = 0
})

watch(active, () => {
  nextTick(() => {
    listEl.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  })
})

function openPalette() {
  open.value = true
  query.value = ''
  active.value = 0
  nextTick(() => inputEl.value?.focus())
}

function close() {
  open.value = false
}

function go(tool: ToolMeta) {
  navigateToTool(tool.slug)
  close()
}

function isFavorite(tool: ToolMeta) {
  return favorites.value.includes(tool.slug)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    active.value = Math.min(active.value + 1, results.value.length - 1)
    event.preventDefault()
  } else if (event.key === 'ArrowUp') {
    active.value = Math.max(active.value - 1, 0)
    event.preventDefault()
  } else if (event.key === 'Enter') {
    const tool = results.value[active.value]
    if (tool) go(tool)
  } else if (event.key === 'Escape') {
    close()
  }
}

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (open.value) close()
    else openPalette()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

defineExpose({ openPalette })
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="palette-backdrop" @click="close">
      <div
        class="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        @click.stop
      >
        <div class="palette-input-row">
          <Search :size="16" class="palette-search-icon" aria-hidden="true" />
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            class="palette-input"
            placeholder="Search tools…"
            aria-label="Search tools"
            @keydown="onKeydown"
          />
          <kbd>esc</kbd>
        </div>
        <ul ref="listEl" class="palette-results" role="listbox" aria-label="Tools">
          <li
            v-for="(tool, index) in results"
            :key="tool.slug"
            role="option"
            :aria-selected="index === active"
            :data-active="index === active || undefined"
            class="palette-item"
            :class="{ active: index === active }"
            @mousemove="active = index"
            @click="go(tool)"
          >
            <Star
              v-if="isFavorite(tool)"
              :size="13"
              class="palette-star"
              aria-label="Favorite"
            />
            <span class="palette-item-name">{{ tool.name }}</span>
            <span class="palette-item-category">{{ CATEGORY_LABELS[tool.category] }}</span>
            <CornerDownLeft v-if="index === active" :size="13" class="palette-enter" aria-hidden="true" />
          </li>
          <li v-if="results.length === 0" class="palette-empty">
            No tools match “{{ query }}”
          </li>
        </ul>
        <div class="palette-hint-row">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.palette-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 16px 16px;
}

.palette {
  width: 100%;
  max-width: 560px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 16px 48px rgb(0 0 0 / 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.palette-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.palette-search-icon {
  color: var(--muted);
  flex-shrink: 0;
}

.palette-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fg);
  font: inherit;
  font-size: 15px;
  min-width: 0;
}

.palette-results {
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: 320px;
  overflow-y: auto;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.palette-item.active {
  background: var(--surface-2);
}

.palette-star {
  color: var(--accent);
  fill: var(--accent);
  flex-shrink: 0;
}

.palette-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.palette-item-category {
  font-size: 11px;
  color: var(--muted);
  flex-shrink: 0;
}

.palette-enter {
  color: var(--muted);
  flex-shrink: 0;
}

.palette-empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.palette-hint-row {
  display: flex;
  gap: 16px;
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--muted);
}

.palette-hint-row span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
