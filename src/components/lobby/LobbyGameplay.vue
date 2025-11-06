<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Lobby, LobbyPlayer } from '@/types/lobby'
import { useLobby } from '@/composables/useLobby'
import { useLobbyStore } from '@/stores/lobbyStore'
import FigureCarousel from '@/components/game/FigureCarousel.vue'
import InteractiveMap from '@/components/game/InteractiveMap.vue'
import NameInput from '@/components/game/NameInput.vue'
import TimelineSlider from '@/components/game/TimelineSlider.vue'
import RevealPhase from '@/components/game/RevealPhase.vue'
import { calculateSpatialScore, calculateTemporalScore, calculateNameScore, calculateSpeedBonus } from '@/lib/scoring'

interface Props {
  lobby: Lobby
  players: LobbyPlayer[]
  currentRound: number
}

const props = defineProps<Props>()

const lobbyStore = useLobbyStore()
const { submitGuess } = useLobby()

// Game state
const guessedName = ref('')
const guessedLat = ref<number | null>(null)
const guessedLon = ref<number | null>(null)
const guessedYear = ref<number>(0) // Default to year 0
const hasSubmitted = ref(false)
const showReveal = ref(false)

// Timer state
const timeRemaining = ref(45)
const timerInterval = ref<NodeJS.Timeout | null>(null)

// Computed properties
const currentFigure = computed(() => lobbyStore.currentFigure)
const roundSubmissions = computed(() => lobbyStore.roundSubmissions)
const allPlayersSubmitted = computed(() =>
  roundSubmissions.value.length >= props.players.length
)

const canSubmit = computed(() => {
  return !hasSubmitted.value &&
         guessedLat.value !== null &&
         guessedLon.value !== null &&
         guessedYear.value !== null &&
         timeRemaining.value > 0
})

// Start timer when round begins
onMounted(() => {
  startTimer()
})

// Timer functions
const startTimer = () => {
  timeRemaining.value = 45
  timerInterval.value = setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      stopTimer()
      // Auto-submit if player hasn't submitted yet
      if (!hasSubmitted.value) {
        handleSubmitGuess()
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// Handle guess submission
const handleSubmitGuess = async () => {
  if (!canSubmit.value || !currentFigure.value) return

  try {
    stopTimer()

    // Calculate scores
    const spatialResult = calculateSpatialScore(
      guessedLat.value!,
      guessedLon.value!,
      currentFigure.value.lat,
      currentFigure.value.lon
    )

    const temporalResult = calculateTemporalScore(
      guessedYear.value!,
      currentFigure.value.birth_year
    )

    const nameScore = calculateNameScore(
      guessedName.value,
      currentFigure.value.name,
      currentFigure.value.aliases || []
    )

    const speedBonus = calculateSpeedBonus(45 - timeRemaining.value)

    const totalScore = spatialResult.score + temporalResult.score + nameScore + speedBonus

    // Submit to server
    await submitGuess(
      guessedName.value,
      guessedLat.value!,
      guessedLon.value!,
      guessedYear.value!,
      totalScore
    )

    hasSubmitted.value = true
  } catch (error) {
    console.error('Failed to submit guess:', error)
  }
}

// Handle map click
const handleMapClick = (lat: number, lon: number) => {
  if (hasSubmitted.value) return
  guessedLat.value = lat
  guessedLon.value = lon
}


// Show reveal when all players have submitted
if (allPlayersSubmitted.value && !showReveal.value) {
  showReveal.value = true
}

// Auto-advance after reveal
const advanceRound = () => {
  showReveal.value = false
  // Reset for next round
  hasSubmitted.value = false
  guessedName.value = ''
  guessedLat.value = null
  guessedLon.value = null
  guessedYear.value = 0
}
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="card mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-heading text-2xl text-noir-gold">
              Round {{ currentRound }}/10
            </h1>
            <p class="text-noir-text text-sm opacity-80">
              Room: {{ lobby.room_code }}
            </p>
          </div>

          <!-- Timer -->
          <div class="text-center">
            <div
              class="text-3xl font-mono font-bold"
              :class="timeRemaining <= 10 ? 'text-noir-red animate-pulse' : 'text-noir-gold'"
            >
              {{ Math.max(0, timeRemaining) }}s
            </div>
            <div class="text-xs text-noir-text opacity-60">Time Remaining</div>
          </div>

          <!-- Player Count -->
          <div class="text-center">
            <div class="text-xl text-noir-text">
              {{ players.length }} Players
            </div>
            <div class="text-xs text-noir-text opacity-60">
              {{ roundSubmissions.length }}/{{ players.length }} Submitted
            </div>
          </div>
        </div>
      </div>

      <!-- Game Content -->
      <div v-if="!showReveal" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Figure -->
        <div class="space-y-6">
          <FigureCarousel
            :images="currentFigure?.images || []"
            :alt-text="currentFigure?.name || 'Historical figure'"
            class="w-full"
          />
        </div>

        <!-- Right Column: Map and Inputs -->
        <div class="space-y-6">
          <!-- Map -->
          <InteractiveMap
            :target-lat="currentFigure?.lat || 0"
            :target-lon="currentFigure?.lon || 0"
            :show-target="false"
            :interactive="!hasSubmitted"
            @map-click="handleMapClick"
            class="w-full h-64 lg:h-80"
          />

          <!-- Inputs -->
          <div class="space-y-4">
            <NameInput
              v-model="guessedName"
              :disabled="hasSubmitted"
              placeholder="Who is this person?"
            />

            <TimelineSlider
              v-model="guessedYear"
              :disabled="hasSubmitted"
            />

            <!-- Submit Button -->
            <button
              @click="handleSubmitGuess"
              :disabled="!canSubmit"
              class="w-full btn-primary py-3 text-lg"
            >
              {{ hasSubmitted ? 'Submitted ✓' : 'Submit Guess' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Reveal Phase -->
      <RevealPhase
        v-else-if="showReveal && currentFigure"
        :figure="currentFigure"
        :is-multiplayer="true"
        :round-submissions="roundSubmissions"
        :players="players"
        :guessed-name="guessedName"
        :guessed-lat="guessedLat || 0"
        :guessed-lon="guessedLon || 0"
        :guessed-year="guessedYear || 0"
        :auto-advance="true"
        :auto-advance-delay="8"
        @next="advanceRound"
      />
    </div>
  </div>
</template>
