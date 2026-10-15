<script setup lang="ts">
import searchIcon from '../../assets/icons/search.svg'

const model = defineModel<string>({ required: true })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <label class="search-field">
    <span class="search-field__icon">
      <img :src="searchIcon" width="18" height="18" alt="" />
    </span>
    <span class="visually-hidden">{{ placeholder }}</span>
    <input
      v-model="model"
      class="search-field__input"
      type="search"
      :placeholder="placeholder ?? 'Search'"
    />
  </label>
</template>

<style scoped>
.search-field {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 320px;
  max-width: 100%;
  padding: 10px 17px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
}

.search-field:focus-within {
  border-color: var(--color-focus);
}

.search-field__icon {
  display: flex;
  flex-shrink: 0;
  opacity: 0.55;
}

.search-field__input {
  min-width: 0;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 15px;
  outline: none;
}

.search-field__input::placeholder {
  color: var(--color-text-muted);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

@media (max-width: 720px) {
  .search-field {
    width: 100%;
    padding: 9px 12px;
  }
}
</style>
