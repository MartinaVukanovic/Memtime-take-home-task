<script setup lang="ts">
import emptyFolderIcon from '../../assets/icons/empty-folder.svg'
import createPlusIcon from '../../assets/icons/create-plus.svg'

const props = defineProps<{
  title: string
  description: string
  ctaLabel?: string
}>()

const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon-wrap">
      <img :src="emptyFolderIcon" width="40.5" height="36" alt="" />
    </div>
    <h2 class="empty-state__title">{{ title }}</h2>
    <p class="empty-state__description">{{ description }}</p>
    <button
      v-if="props.ctaLabel"
      class="empty-state__cta"
      type="button"
      @click="emit('create')"
    >
      <img :src="createPlusIcon" width="14" height="16" alt="" />
      {{ props.ctaLabel }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 64px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.empty-state__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 32px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-subtle);
}

.empty-state__title {
  margin: 0 0 12px;
  font-family: var(--font-sans);
  font-size: 24px;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.35px;
}

.empty-state__description {
  max-width: 400px;
  margin: 0 0 32px;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 24px;
}

.empty-state__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12.5px 24px 13.5px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

</style>
