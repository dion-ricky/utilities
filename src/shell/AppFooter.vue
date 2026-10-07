<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'
import GithubIcon from '../components/GithubIcon.vue'
import { tools } from '../tools'
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <p class="footer-note">
        <ShieldCheck :size="14" aria-hidden="true" />
        100% client-side — {{ tools.length }} tool{{ tools.length === 1 ? '' : 's' }}, zero server
        calls. Nothing you paste leaves your device.
      </p>
      <a
        href="https://github.com/dion-ricky/utilities"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >
        <GithubIcon class="gh" />
        dion-ricky/utilities
      </a>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  padding: 16px 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-note {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  text-decoration: none;
}

.footer-link .gh {
  font-size: 14px;
}

.footer-link:hover {
  color: var(--fg);
}
</style>
