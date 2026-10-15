<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
  }>(),
  { message: 'Loading…' },
)
</script>

<template>
  <div class="loading-state" role="status" aria-live="polite">
    <span class="loading-state__dot" />
    <p class="loading-state__text">{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 240px;
}

.loading-state__dot {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: var(--color-primary);
  animation: pulse 1s ease-in-out infinite;
}

.loading-state__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
