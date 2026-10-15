<script setup lang="ts">
import editIcon from '../../assets/icons/edit.svg'
import trashIcon from '../../assets/icons/trash.svg'

defineProps<{
  floating?: boolean
  menuPosition?: Record<string, string>
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <Teleport to="body" :disabled="!floating">
    <div
      class="action-menu"
      :class="{ 'action-menu--floating': floating }"
      :style="floating ? menuPosition : undefined"
      role="menu"
      @click.stop
    >
      <slot name="prepend" />
      <div v-if="$slots.prepend" class="action-menu__divider" />
      <button class="action-menu__item" type="button" role="menuitem" @click="emit('edit')">
        <img :src="editIcon" width="14" height="14" alt="" />
        Edit
      </button>
      <div class="action-menu__divider" />
      <button
        class="action-menu__item action-menu__item--danger"
        type="button"
        role="menuitem"
        @click="emit('delete')"
      >
        <img :src="trashIcon" width="12" height="14" alt="" />
        Delete
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.action-menu :slotted(.action-menu__item) {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 17.5px;
  text-align: left;
}

.action-menu :slotted(.action-menu__item:hover) {
  background: var(--color-bg-subtle);
}

.action-menu {
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 168px;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-menu--floating {
  position: fixed;
  top: 0;
  right: auto;
  z-index: 120;
}

.action-menu__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 17.5px;
  text-align: left;
}

.action-menu__item:hover {
  background: var(--color-bg-subtle);
}

.action-menu__item--danger {
  color: #dc2626;
  font-weight: 600;
}

.action-menu__divider {
  height: 1px;
  margin: 4px;
  background: var(--color-border);
}
</style>
