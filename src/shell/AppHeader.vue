<script setup lang="ts">
import { Moon, Search, Sun } from '@lucide/vue'
import GithubIcon from '../components/GithubIcon.vue'
import { useTheme } from '../composables/useTheme'

defineEmits<{ 'open-palette': [] }>()

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <a href="#/" class="brand">
        <span class="brand-mark" aria-hidden="true" />
        <span>Dev Swiss Army Knife</span>
      </a>
      <div class="header-actions">
        <button type="button" class="btn search-btn" @click="$emit('open-palette')">
          <Search :size="15" aria-hidden="true" />
          <span>Search tools</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          type="button"
          class="icon-btn"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" :size="17" />
          <Moon v-else :size="17" />
        </button>
        <a
          class="icon-btn"
          href="https://github.com/dion-ricky/utilities"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
        >
          <GithubIcon class="gh" />
        </a>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 56px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--fg);
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
}

.brand-mark {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--accent);
  position: relative;
  flex-shrink: 0;
}

.brand-mark::before,
.brand-mark::after {
  content: '';
  position: absolute;
  background: var(--accent-fg);
  border-radius: 1px;
}

.brand-mark::before {
  left: 7px;
  top: 3px;
  width: 4px;
  height: 12px;
}

.brand-mark::after {
  left: 3px;
  top: 7px;
  width: 12px;
  height: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-btn {
  color: var(--muted);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg);
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--surface-2);
}

.icon-btn.gh {
  font-size: 17px;
}

.icon-btn:focus-visible,
.search-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

@media (max-width: 560px) {
  .search-btn span {
    display: none;
  }
}
</style>
