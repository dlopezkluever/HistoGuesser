<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { getRandomFigures } from '@/lib/supabase/queries'

const router = useRouter()
const gameStore = useGameStore()
const uiStore = useUIStore()

onMounted(async () => {
  try {
    uiStore.setLoading(true)
    const figures = await getRandomFigures(10)
    gameStore.startGame('free_play', figures)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    uiStore.showToast('error', 'Failed to load game: ' + message)
    router.push({ name: 'home' })
  } finally {
    uiStore.setLoading(false)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="card max-w-4xl w-full">
      <h1 class="font-heading text-3xl text-center text-noir-gold mb-4">Free Play</h1>
      <p class="text-center">Gameplay interface coming soon...</p>
      <p class="text-center text-sm mt-4">
        Round: {{ gameStore.currentRound?.round_number || 0 }} / 10
      </p>
    </div>
  </div>
</template>

