<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Lobby, LobbyPlayer } from '@/types/lobby'
import type { Figure, Coordinates } from '@/types/figure'
import { useLobby } from '@/composables/useLobby'
import { useLobbyStore } from '@/stores/lobbyStore'
import FigureCarousel from '@/components/game/FigureCarousel.vue'
import InteractiveMap from '@/components/game/InteractiveMap.vue'
import NameInput from '@/components/game/NameInput.vue'
import TimelineSlider from '@/components/game/TimelineSlider.vue'
import RevealPhase from '@/components/game/RevealPhase.vue'
import { calculateSpatialScore, calculateTemporalScore, calculateNameScore, calculateSpeedBonus } from '@/lib/scoring'
import type { LobbySubmission } from '@/types/lobby'

const emit = defineEmits<{
  advanceRound: []
}>()

interface Props {
  lobby: Lobby
  players: LobbyPlayer[]
  currentRound: number
  figures: Figure[]
  roundSubmissions: LobbySubmission[]
}

const props = defineProps<Props>()

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

// Computed properties - now derived from props
const currentFigure = computed(() => {
  // Get figure from figures array based on current round (1-indexed)
  if (props.figures && props.currentRound >= 1 && props.currentRound <= props.figures.length) {
    return props.figures[props.currentRound - 1]
  }
  return null
})
const roundSubmissions = computed(() => props.roundSubmissions || [])

const allPlayersSubmitted = computed(() =>
  roundSubmissions.value.length >= props.players.length
)

const canSubmit = computed(() => {
  const result = !hasSubmitted.value &&
         guessedLat.value !== null &&
         guessedLon.value !== null &&
         guessedYear.value !== null &&
         timeRemaining.value > 0
  console.log('🔘 canSubmit check:', {
    result,
    hasSubmitted: hasSubmitted.value,
    guessedLat: guessedLat.value,
    guessedLon: guessedLon.value,
    guessedYear: guessedYear.value,
    timeRemaining: timeRemaining.value
  })
  return result
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
  console.log('🎯 handleSubmitGuess called')
  console.log('canSubmit:', canSubmit.value, 'currentFigure:', !!currentFigure.value)

  if (!canSubmit.value || !currentFigure.value) {
    console.log('❌ Validation failed - cannot submit')
    return
  }

  // Additional client-side validation for data types
  const lat = Number(guessedLat.value)
  const lon = Number(guessedLon.value)
  const year = Number(guessedYear.value)

  if (isNaN(lat) || isNaN(lon) || isNaN(year)) {
    console.error('❌ Invalid data types in submission:', {
      lat: { value: guessedLat.value, type: typeof guessedLat.value, isNaN: isNaN(lat) },
      lon: { value: guessedLon.value, type: typeof guessedLon.value, isNaN: isNaN(lon) },
      year: { value: guessedYear.value, type: typeof guessedYear.value, isNaN: isNaN(year) }
    })
    return
  }

  // Validate coordinate ranges
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    console.error('❌ Invalid coordinate ranges:', { lat, lon })
    return
  }

  console.log('✅ Client-side validation passed:', { lat, lon, year })

  try {
    console.log('✅ Validation passed - proceeding with submission')
    stopTimer()

    // Calculate scores using validated numeric values
    const spatialResult = calculateSpatialScore(
      lat,
      lon,
      currentFigure.value.lat,
      currentFigure.value.lon
    )

    const temporalResult = calculateTemporalScore(
      year,
      currentFigure.value.birth_year
    )

    const nameScore = calculateNameScore(
      guessedName.value,
      currentFigure.value.name,
      currentFigure.value.aliases || []
    )

    const speedBonus = calculateSpeedBonus(45 - timeRemaining.value)

    const totalScore = spatialResult.score + temporalResult.score + nameScore + speedBonus

    console.log('📊 Calculated scores:', {
      spatial: spatialResult.score,
      temporal: temporalResult.score,
      name: nameScore,
      speed: speedBonus,
      total: totalScore
    })

    // Submit to server using validated numeric values
    await submitGuess(
      guessedName.value,
      lat,
      lon,
      year,
      totalScore
    )

    hasSubmitted.value = true
  } catch (error) {
    console.error('Failed to submit guess:', error)
  }
}

// Handle map click
const handleMapClick = (coordinates: Coordinates) => {
  console.log('🗺️ Map clicked:', coordinates, 'hasSubmitted:', hasSubmitted.value)
  if (hasSubmitted.value) return
  guessedLat.value = coordinates.lat
  guessedLon.value = coordinates.lon
  console.log('📍 Set guessedLat:', guessedLat.value, 'guessedLon:', guessedLon.value)
}


// Watch for changes and show reveal when all submitted
watch(allPlayersSubmitted, (isComplete) => {
  if (isComplete && !showReveal.value) {
    console.log('🎯 All players submitted - showing reveal phase')
    showReveal.value = true
  }
})

// Auto-advance after reveal
const advanceRound = () => {
  console.log('🎯 advanceRound called - emitting to parent for round progression')
  emit('advanceRound')
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
            @guess="handleMapClick"
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
