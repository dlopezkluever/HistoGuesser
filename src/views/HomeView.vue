<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '@/stores/authStore'
import { useStore } from '@/composables/useStore'
import { MainMenu } from '@/components/ui'

const router = useRouter()
const auth = useStore(authStore)

const isAuthenticated = computed(() => !!auth.value.user)
const currentUser = computed(() => auth.value.user)

const handleModeSelect = (mode: 'daily' | 'freeplay' | 'multiplayer') => {
  switch (mode) {
    case 'daily':
      router.push({ name: 'daily-challenge' })
      break
    case 'freeplay':
      router.push({ name: 'free-play' })
      break
    case 'multiplayer':
      router.push({ name: 'multiplayer' })
      break
  }
}

const handleLogin = () => router.push({ name: 'login' })
const handleSignup = () => router.push({ name: 'login' }) // Same route with signup tab
const handleLogout = async () => {
  await authStore.getState().signOut()
  // Stay on home page after logout
}
const handleLeaderboards = () => router.push({ name: 'leaderboard' })
const handleProfile = () => router.push({ name: 'profile' })
const handleSettings = () => {
  // TODO: Create settings modal in Phase 2
  // Placeholder for settings functionality
}
</script>

<template>
  <MainMenu
    :is-authenticated="isAuthenticated"
    :user="currentUser"
    @mode-select="handleModeSelect"
    @login="handleLogin"
    @signup="handleSignup"
    @logout="handleLogout"
    @leaderboards="handleLeaderboards"
    @profile="handleProfile"
    @settings="handleSettings"
  />
</template>

