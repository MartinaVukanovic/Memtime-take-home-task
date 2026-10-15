<script setup lang="ts">
import { computed } from 'vue'
import trashIcon from '../../assets/icons/trash.svg'
import AppCheckbox from '../ui/AppCheckbox.vue'

const props = defineProps<{
  count: number
  visibleCount: number
}>()

const emit = defineEmits<{
  cancel: []
  delete: []
  'toggle-all': [checked: boolean]
}>()

const allSelected = computed(
  () => props.visibleCount > 0 && props.count === props.visibleCount,
)
const someSelected = computed(
  () => props.count > 0 && props.count < props.visibleCount,
)
</script>

<template>
  <div class="selection">
    <div class="selection__toast">
      <span>Actions for {{ count }} {{ count === 1 ? 'item' : 'items' }}</span>
      <span class="selection__rule" />
      <button class="selection__delete" type="button" @click="emit('delete')">
        <img :src="trashIcon" width="12" height="14" alt="" />
        Delete
      </button>
    </div>
    <footer class="selection__footer">
      <div class="selection__footer-start">
        <label class="selection__select-all">
          <AppCheckbox
            :checked="allSelected"
            :indeterminate="someSelected"
            @change="emit('toggle-all', $event)"
          />
          <span>Select all</span>
        </label>
        <p class="selection__count">{{ count }} {{ count === 1 ? 'item' : 'items' }} selected</p>
      </div>
      <button class="selection__cancel" type="button" @click="emit('cancel')">Cancel</button>
    </footer>
  </div>
</template>

<style scoped>
.selection {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 0 24px 18px;
  background: linear-gradient(180deg, transparent, #fff 28%);
}

.selection__toast {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 55px;
  padding: 13px 25px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.12);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
}

.selection__rule {
  width: 1px;
  height: 16px;
  background: var(--color-border);
}

.selection__delete {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #dc2626;
  font-size: 14px;
  font-weight: 700;
}

.selection__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 73px;
}

.selection__footer-start {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.selection__select-all {
  display: none;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.selection__count {
  margin: 0;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.selection__cancel {
  padding: 8px 24px;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 720px) {
  .selection {
    padding-bottom: 88px;
  }

  .selection__select-all {
    display: inline-flex;
  }
}
</style>
