<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()

onMounted(async () => {
  // Initialize auth state on app load
  await authStore.initialize()
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

