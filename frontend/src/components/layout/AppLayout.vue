<script setup lang="ts">
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="app-shell">
    <a class="app-skip-link" href="#main">Skip to content</a>
    <AppHeader />
    <div class="workspace-shell">
      <div v-if="$slots.crumbs" class="workspace-crumbs">
        <slot name="crumbs" />
      </div>
      <div class="workspace">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--color-bg-page);
}

.workspace-crumbs {
  padding: 0 6px 12px;
}
</style>
