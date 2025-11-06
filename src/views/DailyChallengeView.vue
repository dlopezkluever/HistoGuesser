<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import GameplayView from '@/components/game/GameplayView.vue'
import ResultsScreen from '@/components/game/ResultsScreen.vue'
import { useAuth } from '@/composables/useAuth'
import { getDailyChallengeFigures, getDailyChallengeStatus, submitDailyScore } from '@/lib/supabase/queries'
import { calculateRoundScore } from '@/lib/scoring'
import type { Figure } from '@/types/figure'

const router = useRouter()
const { currentUser } = useAuth()

// Component refs
const gameplayRef = ref<InstanceType<typeof GameplayView> | null>(null)

// Game state
const gameState = ref<'loading' | 'info' | 'playing' | 'completed'>('loading')
const figures = ref<Figure[]>([])
const currentFigure = ref<Figure | null>(null)
const currentRoundNumber = ref(1)
const scores = ref<any[]>([])
const finalResults = ref<any>(null)

// Challenge status
const challengeStatus = ref<{
  hasCompleted: boolean
  score: number
  completedAt: string | null
  currentStreak: number
  bestScore: number
} | null>(null)

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const isAuthenticated = computed(() => !!currentUser.value)

const canPlayChallenge = computed(() => {
  return isAuthenticated.value && (!challengeStatus.value?.hasCompleted || false)
})

const isLastRound = computed(() => currentRoundNumber.value >= 10)

// Load challenge data
const loadChallenge = async () => {
  try {
    if (!isAuthenticated.value) {
      gameState.value = 'info'
      return
    }

    // Load challenge status and figures in parallel
    const [status, challengeFigures] = await Promise.all([
      getDailyChallengeStatus(currentUser.value!.id, today.value),
      getDailyChallengeFigures(today.value)
    ])

    challengeStatus.value = status
    figures.value = challengeFigures

    if (status.hasCompleted) {
      gameState.value = 'completed'
    } else {
      gameState.value = 'info'
    }
  } catch (error) {
    console.error('Failed to load daily challenge:', error)
    // Fallback to info screen
    gameState.value = 'info'
  }
}

// Start the challenge
const startChallenge = () => {
  if (!canPlayChallenge.value || figures.value.length === 0) return

  currentFigure.value = figures.value[0]
  currentRoundNumber.value = 1
  scores.value = []

  gameState.value = 'playing'
}

// Handle guess submission
const handleSubmit = async (guess: any, submissionTime: number) => {
  if (!currentFigure.value || !gameplayRef.value) return

  // Calculate score using the scoring library
  const calculatedScore = calculateRoundScore(
    guess.name,
    guess.coordinates.lat,
    guess.coordinates.lon,
    guess.year,
    currentFigure.value.name,
    currentFigure.value.lat,
    currentFigure.value.lon,
    currentFigure.value.birth_year,
    currentFigure.value.aliases,
    submissionTime,
    'daily_challenge' // Game mode for speed bonus
  )

  // Map to component-expected format
  const roundScore = {
    spatial: calculatedScore.spatial_score,
    temporal: calculatedScore.temporal_score,
    name: calculatedScore.name_score,
    speed: calculatedScore.speed_bonus,
    total: calculatedScore.total,
    distanceKm: calculatedScore.distance_km,
    yearDiff: calculatedScore.year_diff,
  }

  scores.value.push({
    round: currentRoundNumber.value,
    ...roundScore,
    submissionTime
  })

  // Show reveal phase
  gameplayRef.value.showRevealPhase(roundScore)
}

// Handle next round
const handleNextRound = () => {
  if (isLastRound.value) {
    // Calculate final results
    const totalScore = scores.value.reduce((sum, score) => sum + score.total, 0)

    finalResults.value = {
      totalScore,
      componentScores: {
        spatial: scores.value.reduce((sum, score) => sum + score.spatial, 0),
        temporal: scores.value.reduce((sum, score) => sum + score.temporal, 0),
        name: scores.value.reduce((sum, score) => sum + score.name, 0),
        speed: scores.value.reduce((sum, score) => sum + score.speed, 0)
      }
    }

    // Submit to database if authenticated
    if (isAuthenticated.value) {
      submitDailyScore(currentUser.value!.id, today.value, totalScore)
        .then((result) => {
          if (!result.success) {
            console.error('Failed to submit score:', result.message)
          }
          // Reload challenge status
          return getDailyChallengeStatus(currentUser.value!.id, today.value)
        })
        .then((status) => {
          challengeStatus.value = status
        })
        .catch((error) => {
          console.error('Failed to update stats:', error)
        })
    }

    gameState.value = 'completed'
  } else {
    // Move to next round
    currentRoundNumber.value++
    currentFigure.value = figures.value[currentRoundNumber.value - 1]
  }
}

// Navigation
const goToLeaderboard = () => {
  router.push('/leaderboard')
}

const goToMenu = () => {
  router.push('/')
}


// Initialize
onMounted(() => {
  loadChallenge()
})
</script>

<template>
  <div class="min-h-screen p-4">
    <!-- Loading State -->
    <div v-if="gameState === 'loading'" class="flex items-center justify-center min-h-screen">
      <Card class="text-center">
        <div class="text-noir-text">Loading Daily Challenge...</div>
      </Card>
    </div>

    <!-- Challenge Info Screen -->
    <div v-else-if="gameState === 'info'" class="flex items-center justify-center min-h-screen">
      <Card class="max-w-2xl w-full">
        <div class="text-center space-y-6">
          <!-- Header -->
          <div>
            <h1 class="text-4xl font-bebas text-noir-gold mb-2">DAILY CHALLENGE</h1>
            <p class="text-noir-text/80">{{ today }}</p>
          </div>

          <!-- Streak Display -->
          <div v-if="challengeStatus" class="flex justify-center items-center gap-4">
            <div class="text-center">
              <div class="text-3xl font-mono text-noir-gold">{{ challengeStatus.currentStreak }}</div>
              <div class="text-sm text-noir-text/60">Day Streak</div>
            </div>
            <div v-if="challengeStatus.currentStreak > 0" class="text-2xl">🔥</div>
          </div>

          <!-- Best Score -->
          <div v-if="challengeStatus && challengeStatus.bestScore > 0" class="text-center">
            <div class="text-xl font-mono text-noir-text">{{ challengeStatus.bestScore.toLocaleString() }}</div>
            <div class="text-sm text-noir-text/60">Personal Best</div>
          </div>

          <!-- Start Button -->
          <div class="space-y-4">
            <Button
              v-if="canPlayChallenge"
              size="lg"
              class="w-full"
              @click="startChallenge"
            >
              Start Challenge
            </Button>

            <div v-else-if="challengeStatus?.hasCompleted" class="space-y-4">
              <div class="text-noir-red font-medium">
                Today's challenge completed!
              </div>
              <div class="text-sm text-noir-text/60">
                Score: {{ challengeStatus.score.toLocaleString() }}
              </div>
              <Button variant="secondary" class="w-full" @click="goToLeaderboard">
                View Leaderboard
              </Button>
            </div>

            <Button variant="ghost" class="w-full" @click="goToMenu">
              Back to Menu
            </Button>
          </div>

          <!-- Not Authenticated -->
          <div v-if="!isAuthenticated" class="text-sm text-noir-text/60">
            Sign up to play the Daily Challenge and track your progress!
          </div>
        </div>
      </Card>
    </div>

    <!-- Gameplay -->
    <GameplayView
      v-else-if="gameState === 'playing' && currentFigure"
      ref="gameplayRef"
      :current-figure="currentFigure"
      :current-round="currentRoundNumber"
      :total-rounds="10"
      :show-timer="true"
      :timer-duration="45"
      :auto-advance="true"
      :auto-advance-delay="8"
      @submit="handleSubmit"
      @next-round="handleNextRound"
    />

    <!-- Results Screen -->
    <div v-else-if="gameState === 'completed' && finalResults" class="flex items-center justify-center min-h-screen">
      <ResultsScreen
        :total-score="finalResults.totalScore"
        :component-scores="finalResults.componentScores"
        :total-rounds="10"
        :show-play-again="false"
        :show-leaderboard="true"
        @view-leaderboard="goToLeaderboard"
        @back-to-menu="goToMenu"
      />
    </div>
  </div>
</template>

