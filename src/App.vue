<script setup lang="ts">
import { onMounted } from 'vue'
import { authStore } from './stores/authStore'

onMounted(async () => {
  // Initialize auth state on app load
  await authStore.getState().initialize()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-noir-bg noir-texture">
    <router-view />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

