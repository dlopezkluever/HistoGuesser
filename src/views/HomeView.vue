<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authStore } from '@/stores/authStore'
import { useStore } from '@/composables/useStore'
import { MainMenu } from '@/components/ui'

const router = useRouter()
const route = useRoute()
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
const handleSignup = () => router.push({ name: 'login', query: { mode: 'signup' } })
const handleLogout = async () => {
  await authStore.getState().signOut()
  // Stay on home page after logout
}
const handleLeaderboards = () => router.push({ name: 'leaderboard' })
const handleProfile = () => router.push({ name: 'profile' })

// Check for query parameters on mount
onMounted(() => {
  if (route.query.signup === 'true') {
    handleSignup()
  } else if (route.query.welcome === 'true') {
    // Show additional welcome message for new signups
    setTimeout(() => {
      // Import uiStore dynamically to avoid circular dependencies
      import('@/stores/uiStore').then(({ uiStore }) => {
        uiStore.getState().showToast('info', 'Try the Daily Challenge to compete on the leaderboard! 🏆')
      })
    }, 1000)
  }
})
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
  />
</template>

