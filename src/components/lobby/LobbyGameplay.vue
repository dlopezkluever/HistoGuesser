<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Lobby, LobbyPlayer } from '@/types/lobby'
import type { Figure, Coordinates } from '@/types/figure'
import { useLobby } from '@/composables/useLobby'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useRoundTimer } from '@/composables/useRoundTimer'
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
const isSubmitting = ref(false) // Prevent race condition UI flicker
const submittedOnTime = ref<boolean | null>(null) // null = not submitted, true = submitted on time, false = timed out
const showSubmissionStatus = ref(false) // Show status modal
const showReveal = ref(false)
const revealedFigure = ref<Figure | null>(null) // Figure for the reveal phase

// Use the unified round timer composable
const { timeRemaining, start: startTimer, pause: pauseTimer, stop: stopTimer, reset: resetTimer } = useRoundTimer({
  duration: 45,
  autoStart: false,
  onExpire: () => {
    // Auto-submit if player hasn't submitted yet
    if (!hasSubmitted.value) {
      console.log('⏰ Timer expired - auto-submitting with current guesses')
      autoSubmitOnTimeout()
    }
  }
})

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

// Optimize canSubmit to only recalculate when relevant values change
// timeRemaining > 0 is a boolean check, so we only care when it crosses the threshold
const timeExpired = computed(() => timeRemaining.value <= 0)

const canSubmit = computed(() => {
  const result = !hasSubmitted.value &&
         !isSubmitting.value && // Prevent submission while processing
         guessedLat.value !== null &&
         guessedLon.value !== null &&
         guessedYear.value !== null &&
         !timeExpired.value

  // Reduced logging frequency - only log when result changes
  console.log('🔘 canSubmit check:', {
    result,
    hasSubmitted: hasSubmitted.value,
    isSubmitting: isSubmitting.value,
    hasCoordinates: guessedLat.value !== null && guessedLon.value !== null,
    hasYear: guessedYear.value !== null,
    timeExpired: timeExpired.value
  })

  return result
})

// Start timer when round begins
onMounted(() => {
  startTimer()
})

// Defensive cleanup (useRoundTimer should handle this, but being safe)
onUnmounted(() => {
  console.log('🧹 LobbyGameplay unmounting - ensuring timer cleanup')
  // useRoundTimer composable handles its own cleanup, but we'll double-check
})

// Timer functions are now handled by useRoundTimer composable

// Auto-submit when timer expires (bypasses normal validation)
const autoSubmitOnTimeout = async () => {
  console.log('⏰ autoSubmitOnTimeout called - submitting with current state')
  console.log('Current guesses - name:', guessedName.value, 'coords:', guessedLat.value, guessedLon.value, 'year:', guessedYear.value)

  if (!currentFigure.value) {
    console.error('❌ No current figure available for auto-submit')
    return
  }

  // Mark as timed out submission
  submittedOnTime.value = false
  showSubmissionStatus.value = true
  isSubmitting.value = true

  try {
    // Calculate scores using current guesses (may be incomplete)
    const lat = guessedLat.value ?? 0 // Default to 0 if no coordinate set
    const lon = guessedLon.value ?? 0
    const year = guessedYear.value || 0 // Default to year 0 if not set

    console.log('📊 Auto-submitting with values:', { lat, lon, year, name: guessedName.value })

    const spatialResult = calculateSpatialScore(lat, lon, currentFigure.value.lat, currentFigure.value.lon)
    const temporalResult = calculateTemporalScore(year, currentFigure.value.birth_year)
    const nameScore = calculateNameScore(guessedName.value, currentFigure.value.name, currentFigure.value.aliases || [])
    const speedBonus = 0 // No speed bonus for timeout submissions

    const totalScore = spatialResult.score + temporalResult.score + nameScore + speedBonus

    console.log('📊 Auto-submit scores:', { spatial: spatialResult.score, temporal: temporalResult.score, name: nameScore, speed: speedBonus, total: totalScore })

    // Submit to server
    const submission = await submitGuess(guessedName.value, lat, lon, year, totalScore)

    console.log('✅ Auto-submit completed successfully')
    hasSubmitted.value = true
    isSubmitting.value = false

    // Add own submission to local state
    console.log('🎯 Adding auto-submitted guess to local state:', submission.id)

  } catch (error) {
    console.error('❌ Auto-submit failed:', error)
    isSubmitting.value = false
    // Don't set hasSubmitted = true on error so user can potentially retry
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

  // Mark as on-time submission
  submittedOnTime.value = true
  showSubmissionStatus.value = true

  // Set submitting state immediately to prevent race condition UI flicker
  isSubmitting.value = true

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
    const submission = await submitGuess(
      guessedName.value,
      lat,
      lon,
      year,
      totalScore
    )

    console.log('✅ submitGuess completed successfully, setting hasSubmitted = true')
    hasSubmitted.value = true
    isSubmitting.value = false // Clear submitting state on success
    console.log('✅ hasSubmitted set to true, button should be disabled')

    // Immediately add our own submission to local state for UI updates
    // The broadcast will be received by other players, but we need to update our own UI immediately
    console.log('🎯 Adding own submission to local state:', submission)
    // We'll let the broadcast callback handle adding this submission to roundSubmissions
  } catch (error) {
    console.error('❌ Failed to submit guess:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    // Reset submitting state on error so user can retry
    isSubmitting.value = false
    // Don't set hasSubmitted = true on error so user can retry
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
    console.log('🎯 Current figure for reveal:', currentFigure.value?.name)

    // Pause timer during reveal phase
    pauseTimer()
    console.log('⏸️ Timer paused during reveal phase')

    revealedFigure.value = currentFigure.value // Preserve the figure for reveal
    showReveal.value = true
  }
})

// Auto-advance after reveal
const advanceRound = () => {
  console.log('🎯 advanceRound called - emitting to parent for round progression')
  emit('advanceRound')

  // Reset for next round
  console.log('🔄 Resetting UI state for next round')
  hasSubmitted.value = false
  isSubmitting.value = false // Reset submitting state
  submittedOnTime.value = null // Reset submission status
  showSubmissionStatus.value = false // Hide status modal
  guessedName.value = ''
  guessedLat.value = null
  guessedLon.value = null
  guessedYear.value = 0
  showReveal.value = false
  revealedFigure.value = null

  // Reset and restart timer for next round
  console.log('🔄 Resetting timer for next round')
  resetTimer()
  console.log('▶️ Starting fresh timer for next round')
  startTimer()
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
              <span v-if="isSubmitting">Submitting...</span>
              <span v-else-if="hasSubmitted">Submitted ✓</span>
              <span v-else>Submit Guess</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Reveal Phase -->
      <RevealPhase
        v-else-if="showReveal && revealedFigure"
        :figure="revealedFigure"
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

      <!-- Submission Status Modal -->
      <Transition name="fade">
        <div
          v-if="showSubmissionStatus && !showReveal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          @click.self="showSubmissionStatus = false"
        >
          <div class="bg-noir-surface border border-noir-gold/20 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div class="text-center">
              <!-- Submitted on time -->
              <div v-if="submittedOnTime === true" class="text-green-400">
                <div class="text-4xl mb-2">✅</div>
                <h3 class="text-xl font-semibold mb-2 text-noir-gold">Guess Submitted!</h3>
                <p class="text-noir-text mb-4">Waiting for other players to submit their guesses...</p>
              </div>

              <!-- Auto-submitted due to timeout -->
              <div v-else-if="submittedOnTime === false" class="text-orange-400">
                <div class="text-4xl mb-2">⏰</div>
                <h3 class="text-xl font-semibold mb-2 text-noir-gold">Time Expired</h3>
                <p class="text-noir-text mb-4">Auto-submitted with your current guesses. Waiting for other players...</p>
              </div>

              <!-- Still submitting -->
              <div v-else-if="isSubmitting" class="text-blue-400">
                <div class="text-4xl mb-2 animate-spin">⏳</div>
                <h3 class="text-xl font-semibold mb-2 text-noir-gold">Submitting...</h3>
                <p class="text-noir-text mb-4">Please wait while we process your guess.</p>
              </div>
            </div>

            <!-- Player count indicator -->
            <div class="text-center text-sm text-noir-text/60">
              {{ roundSubmissions.length }}/{{ players.length }} players submitted
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
