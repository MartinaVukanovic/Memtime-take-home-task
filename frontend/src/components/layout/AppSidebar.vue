<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import navFolderIcon from '../../assets/icons/nav-folder.svg'

defineProps<{
  clientsCount: string
}>()

const route = useRoute()
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <span class="sidebar__dots" aria-hidden="true">
        <span class="sidebar__dot sidebar__dot--blue" />
        <span class="sidebar__dot sidebar__dot--green" />
        <span class="sidebar__dot sidebar__dot--orange" />
        <span class="sidebar__dot sidebar__dot--red" />
      </span>
      <span class="sidebar__name">Memtime</span>
    </div>

    <nav class="sidebar__nav" aria-label="Main">
      <p class="sidebar__section">General</p>
      <RouterLink
        class="sidebar__link"
        :class="{ 'sidebar__link--active': route.path.startsWith('/clients') }"
        to="/clients"
      >
        <span class="sidebar__link-label">
          <img :src="navFolderIcon" width="11" height="10" alt="" />
          Clients
        </span>
        <span class="sidebar__count">{{ clientsCount }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: var(--sidebar-width);
  min-height: 100vh;
  padding: 24px;
  background: var(--color-bg-subtle);
  border-right: 1px solid var(--color-border);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar__dots {
  display: flex;
  gap: 4px;
}

.sidebar__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}

.sidebar__dot--blue {
  background: #1a75ea;
}

.sidebar__dot--green {
  background: #0eba80;
}

.sidebar__dot--orange {
  background: #ffa722;
}

.sidebar__dot--red {
  background: #ef4444;
}

.sidebar__name {
  font-size: 18px;
  font-weight: 700;
  line-height: 27px;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar__section {
  margin: 0;
  padding: 16px 8px;
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.55px;
  line-height: 16.5px;
  text-transform: uppercase;
}

.sidebar__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.sidebar__link--active {
  background: #e5e7eb;
}

.sidebar__link-label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar__count {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.28px;
  line-height: 18px;
}

@media (max-width: 720px) {
  .sidebar {
    display: none;
  }
}
</style>
