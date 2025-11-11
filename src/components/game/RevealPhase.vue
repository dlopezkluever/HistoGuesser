<template>
  <div class="reveal-phase">
    <!-- Figure information -->
    <Card class="reveal-card mb-6">
      <div class="reveal-header">
        <h2 class="text-3xl font-playfair text-noir-gold">{{ figure.name }}</h2>
        <div class="figure-years">
          <span class="text-noir-text/80">
            {{ formatYear(figure.birth_year) }}
            <span v-if="figure.death_year"> - {{ formatYear(figure.death_year) }}</span>
          </span>
        </div>
      </div>

      <div class="reveal-content">
        <p class="figure-hometown">📍 {{ figure.hometown || 'Location unknown' }}</p>
        <p class="figure-description">{{ figure.description }}</p>
      </div>

      <!-- Tags -->
      <div v-if="figure.tags && figure.tags.length" class="figure-tags">
        <span 
          v-for="tag in figure.tags" 
          :key="tag"
          class="tag"
        >
          {{ tag.replace('_', ' ') }}
        </span>
      </div>
    </Card>

    <!-- Score breakdown (single player) -->
    <ScoreBreakdown
      v-if="!isMultiplayer && roundScore"
      :round-score="roundScore"
      :submission-time="submissionTime"
    />

    <!-- Multiplayer Round Scores -->
    <Card v-if="isMultiplayer" class="mb-6">
      <h3 class="text-noir-gold font-medium mb-4 text-center">Round Scores</h3>

      <div class="space-y-3">
        <div
          v-for="submission in roundSubmissions"
          :key="submission.id"
          class="flex items-center justify-between p-3 rounded-lg border border-noir-gold/20 bg-noir-surface/50"
        >
          <div class="flex items-center gap-3">
            <span class="text-noir-text font-medium">{{ getPlayerUsername(submission.user_id) }}</span>
            <span class="text-noir-text opacity-60 text-sm">
              {{ Math.round(submission.submission_time * 10) / 10 }}s
            </span>
          </div>
          <div class="text-noir-gold font-mono font-bold">
            {{ submission.score }}
          </div>
        </div>
      </div>

      <!-- Your Guess (if provided) -->
      <div v-if="guessedName || guessedLat || guessedLon || guessedYear" class="mt-4 pt-4 border-t border-noir-gold/20">
        <h4 class="text-noir-text font-medium mb-2">Your Guess:</h4>
        <div class="text-sm text-noir-text opacity-80">
          <p v-if="guessedName">Name: {{ guessedName }}</p>
          <p v-if="guessedLat && guessedLon">
            Location: {{ guessedLat.toFixed(2) }}, {{ guessedLon.toFixed(2) }}
          </p>
          <p v-if="guessedYear">Year: {{ formatYear(guessedYear) }}</p>
        </div>
      </div>
    </Card>

    <!-- Next button -->
    <div class="reveal-actions">
      <Button 
        variant="primary" 
        size="lg" 
        full-width
        @click="handleNext"
      >
        {{ isLastRound ? 'View Results' : 'Next Round' }}
      </Button>
      <div v-if="autoAdvance && countdown > 0" class="auto-advance-text">
        Auto-advancing in {{ countdown }}s...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import ScoreBreakdown from './ScoreBreakdown.vue';
import type { Figure } from '@/types/figure';
import type { RoundScore } from '@/types/score';
import type { LobbySubmission, LobbyPlayer } from '@/types/lobby';

interface Props {
  figure: Figure;
  roundScore?: RoundScore;
  submissionTime?: number;
  isLastRound?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number; // in seconds
  isMultiplayer?: boolean;
  roundSubmissions?: LobbySubmission[];
  players?: LobbyPlayer[];
  guessedName?: string;
  guessedLat?: number;
  guessedLon?: number;
  guessedYear?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isLastRound: false,
  autoAdvance: false,
  autoAdvanceDelay: 8,
});

// Debug logging
console.log('RevealPhase figure data:', {
  name: props.figure?.name,
  hometown: props.figure?.hometown,
  hasHometown: !!props.figure?.hometown,
  hometownLength: props.figure?.hometown?.length
});

const emit = defineEmits<{
  next: [];
}>();

const countdown = ref(props.autoAdvanceDelay);
let countdownInterval: number | null = null;

const formatYear = (year: number): string => {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }
  return `${year} CE`;
};

const getPlayerUsername = (userId: string): string => {
  const player = props.players?.find(p => p.user_id === userId);
  return player?.username || 'Unknown Player';
};

const handleNext = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  emit('next');
};

// Auto-advance countdown
onMounted(() => {
  if (props.autoAdvance) {
    countdownInterval = window.setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        handleNext();
      }
    }, 1000);
  }
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.reveal-phase {
  @apply w-full max-w-4xl mx-auto;
}

.reveal-card {
  @apply animate-fade-in;
}

.reveal-header {
  @apply mb-4 pb-4 border-b border-noir-gold/20;
}

.figure-years {
  @apply text-lg font-mono mt-2;
}

.reveal-content {
  @apply space-y-3;
}

.figure-hometown {
  @apply text-noir-text/80 text-lg;
}

.figure-description {
  @apply text-noir-text leading-relaxed;
}

.figure-tags {
  @apply flex flex-wrap gap-2 mt-4 pt-4 border-t border-noir-gold/10;
}

.tag {
  @apply px-3 py-1 bg-noir-bg text-noir-text/70 text-sm rounded-full border border-noir-gold/10;
}

.reveal-actions {
  @apply mt-6 space-y-2;
}

.auto-advance-text {
  @apply text-center text-sm text-noir-text/60 animate-pulse;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}
</style>

