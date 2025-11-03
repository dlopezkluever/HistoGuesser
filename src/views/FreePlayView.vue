<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameStore } from '@/stores/gameStore'
import { uiStore } from '@/stores/uiStore'
import { useStore } from '@/composables/useStore'
import { getRandomFigures } from '@/lib/supabase/queries'
import { GameplayView, ResultsScreen } from '@/components/game'
import type { Guess as GameGuess } from '@/types/game'
import type { RoundScore } from '@/types/score'

const router = useRouter()
const game = useStore(gameStore)
const ui = useStore(uiStore)

const gameplayRef = ref<InstanceType<typeof GameplayView> | null>(null)
const showResults = ref(false)

const currentFigure = computed(() => game.value.currentRound?.figure || null)
const currentRoundNumber = computed(() => game.value.currentRound?.round_number || 1)
const isLoading = computed(() => ui.value.loading)

// Calculated results for final screen
const finalResults = computed(() => {
  const session = game.value.session
  if (!session) return null

  const rounds = session.rounds
  const spatial = rounds.reduce((sum, r) => sum + (r.score?.spatial_score || 0), 0)
  const temporal = rounds.reduce((sum, r) => sum + (r.score?.temporal_score || 0), 0)
  const name = rounds.reduce((sum, r) => sum + (r.score?.name_score || 0), 0)
  const speed = rounds.reduce((sum, r) => sum + (r.score?.speed_bonus || 0), 0)

  return {
    totalScore: session.total_score,
    componentScores: {
      spatial,
      temporal,
      name,
      speed,
    },
  }
})

// Handle guess submission
const handleSubmit = (guess: { name: string; coordinates: { lat: number; lon: number } | null; year: number }, submissionTime: number) => {
  if (!guess.coordinates) return

  const gameGuess: GameGuess = {
    name: guess.name,
    lat: guess.coordinates.lat,
    lon: guess.coordinates.lon,
    year: guess.year,
    submission_time: submissionTime,
  }

  // Submit to game store
  gameStore.getState().submitGuess(gameGuess)
  
  // Immediately reveal
  gameStore.getState().revealAnswer()
  
  // Show reveal in gameplay component
  const currentRound = game.value.currentRound
  if (currentRound && currentRound.score && gameplayRef.value) {
    // Map RoundScore to component's expected format
    const roundScore: RoundScore = {
      spatial: currentRound.score.spatial_score,
      temporal: currentRound.score.temporal_score,
      name: currentRound.score.name_score,
      speed: currentRound.score.speed_bonus,
      total: currentRound.score.total,
      distanceKm: currentRound.score.distance_km,
      yearDiff: currentRound.score.year_diff,
    }
    
    gameplayRef.value.showRevealPhase(roundScore)
  }
}

// Handle next round
const handleNextRound = () => {
  const session = game.value.session
  if (!session) return

  // Check if game is complete
  if (currentRoundNumber.value >= 10) {
    gameStore.getState().endGame()
    showResults.value = true
  } else {
    gameStore.getState().nextRound()
  }
}

// Handle play again
const handlePlayAgain = async () => {
  showResults.value = false
  gameStore.getState().resetGame()
  await initGame()
}

// Handle back to menu
const handleBackToMenu = () => {
  gameStore.getState().resetGame()
  router.push({ name: 'home' })
}

// Initialize game
const initGame = async () => {
  try {
    uiStore.getState().setLoading(true)
    const figures = await getRandomFigures(10)
    gameStore.getState().startGame('free_play', figures)
    showResults.value = false
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    uiStore.getState().showToast('error', 'Failed to load game: ' + message)
    router.push({ name: 'home' })
  } finally {
    uiStore.getState().setLoading(false)
  }
}

onMounted(() => {
  initGame()
})
</script>

<template>
  <div class="free-play-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p class="text-noir-text mt-4">Loading game...</p>
    </div>

    <!-- Gameplay -->
    <GameplayView
      v-else-if="!showResults && currentFigure"
      ref="gameplayRef"
      :current-figure="currentFigure"
      :current-round="currentRoundNumber"
      :total-rounds="10"
      :show-timer="false"
      :auto-advance="false"
      @submit="handleSubmit"
      @next-round="handleNextRound"
    />

    <!-- Results -->
    <ResultsScreen
      v-else-if="showResults && finalResults"
      :total-score="finalResults.totalScore"
      :component-scores="finalResults.componentScores"
      :total-rounds="10"
      :show-play-again="true"
      :show-leaderboard="false"
      :show-signup-prompt="false"
      @play-again="handlePlayAgain"
      @back-to-menu="handleBackToMenu"
    />
  </div>
</template>

<style scoped>
.free-play-view {
  @apply min-h-screen bg-noir-bg;
}

.loading-container {
  @apply flex flex-col items-center justify-center min-h-screen;
}

.spinner {
  @apply w-16 h-16 border-4 border-noir-gold/20 border-t-noir-gold rounded-full animate-spin;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

