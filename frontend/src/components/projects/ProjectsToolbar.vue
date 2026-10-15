<script setup lang="ts">
import EntityToolbar from '../ui/EntityToolbar.vue'

const searchQuery = defineModel<string>('searchQuery', { required: true })
const statusFilter = defineModel<string>('statusFilter', { required: true })
</script>

<template>
  <EntityToolbar v-model:search-query="searchQuery" v-model:status-filter="statusFilter">
    <slot />
  </EntityToolbar>
</template>
