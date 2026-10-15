<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTemplateRef } from 'vue'

const props = defineProps<{
  checked: boolean
  indeterminate?: boolean
}>()

const emit = defineEmits<{
  change: [checked: boolean]
}>()

const inputRef = useTemplateRef<HTMLInputElement>('checkbox')
const inputClass = computed(() => ({
  'app-checkbox__input': true,
  'app-checkbox__input--checked': props.checked && !props.indeterminate,
  'app-checkbox__input--indeterminate': props.indeterminate,
}))

watch(
  () => props.indeterminate,
  (value) => {
    if (inputRef.value) inputRef.value.indeterminate = Boolean(value)
  },
  { immediate: true },
)
</script>

<template>
  <label class="app-checkbox">
    <input
      ref="checkbox"
      class="app-checkbox__native"
      type="checkbox"
      :checked="checked"
      :aria-checked="indeterminate ? 'mixed' : checked"
      @change="emit('change', ($event.target as HTMLInputElement).checked)"
    />
    <span :class="inputClass" aria-hidden="true" />
  </label>
</template>

<style scoped>
.app-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.app-checkbox__native {
  position: absolute;
  inset: 0;
  z-index: 1;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.app-checkbox__input {
  display: block;
  width: 16px;
  height: 16px;
  border: 1px solid #767676;
  border-radius: 2.5px;
  background: #fff;
}

.app-checkbox__input--checked,
.app-checkbox__input--indeterminate {
  border-color: var(--color-primary);
  background: var(--color-primary);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='8' viewBox='0 0 10 8'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='1.6' d='M1 4.1 3.6 6.6 9 1.2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.app-checkbox__input--indeterminate {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='2' viewBox='0 0 10 2'%3E%3Crect width='10' height='2' rx='1' fill='%23fff'/%3E%3C/svg%3E");
}

</style>
