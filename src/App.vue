<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from './composables/useTheme'
import { useRoute } from './router'
import AppFooter from './shell/AppFooter.vue'
import AppHeader from './shell/AppHeader.vue'
import type CommandPalette from './shell/CommandPalette.vue'
import HomeView from './shell/HomeView.vue'
import ToolView from './shell/ToolView.vue'

useTheme()

const route = useRoute()
const palette = ref<InstanceType<typeof CommandPalette>>()

const isHome = computed(() => route.value.name === 'home')

function openPalette() {
  palette.value?.openPalette()
}
</script>

<template>
  <AppHeader @open-palette="openPalette" />
  <main class="container main">
    <HomeView v-if="isHome" @open-palette="openPalette" />
    <ToolView v-else />
  </main>
  <AppFooter />
  <CommandPalette ref="palette" />
</template>

<style scoped>
.main {
  width: 100%;
  flex: 1;
}
</style>
