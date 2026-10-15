<script setup lang="ts">
import createPlusIcon from '../../assets/icons/create-plus.svg'

defineProps<{
  label: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button class="create-page-button" type="button" :aria-label="label" :title="label" @click="emit('click')">
    <img :src="createPlusIcon" width="16" height="16" alt="" />
  </button>
</template>

<style scoped>
.create-page-button {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: var(--color-primary-fg);
}

</style>
