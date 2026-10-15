<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink class="app-header__brand" to="/clients">
        <span class="brand-mark" aria-hidden="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path d="M12 12 3 7M12 12l9-5M12 12v10" stroke="currentColor" stroke-width="1.8" />
          </svg>
        </span>
        <span class="app-header__name">Memtime</span>
      </RouterLink>
      <RouterLink class="app-header__clients" to="/clients">All clients</RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: transparent;
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1152px;
  margin: 0 auto;
  padding: 20px 24px;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 33px;
  height: 33px;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-primary-fg);
}

.app-header__name {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.app-header__clients {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
}

.app-header__clients:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

@media (max-width: 720px) {
  .app-header__inner {
    padding: 16px 12px;
  }
}
</style>
