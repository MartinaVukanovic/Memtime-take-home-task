<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="error-banner" role="alert">
    <p class="error-banner__text">{{ message }}</p>
    <button class="error-banner__retry" type="button" @click="emit('retry')">Retry</button>
  </div>
</template>

<style scoped>
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  margin: 0 0 16px;
  padding: 12px 16px;
  border: 1px solid var(--color-danger-soft);
  border-radius: var(--radius-sm);
  background: #fff7f7;
}

.error-banner__text {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 14px;
  line-height: 21px;
}

.error-banner__retry {
  border: 1px solid var(--color-danger-text);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-danger-text);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
}

</style>
