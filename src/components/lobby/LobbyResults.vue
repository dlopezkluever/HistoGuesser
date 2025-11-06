<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Lobby, LobbyPlayer } from '@/types/lobby'
import { useLobby } from '@/composables/useLobby'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface Props {
  lobby: Lobby
  players: LobbyPlayer[]
}

const props = defineProps<Props>()
const router = useRouter()
const { leaveCurrentLobby } = useLobby()

// Sort players by score (highest first)
const sortedPlayers = computed(() =>
  [...props.players].sort((a, b) => b.score - a.score)
)

// Get medal emoji for top 3
const getMedal = (rank: number) => {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return `${rank}.`
  }
}

// Handle actions
const handlePlayAgain = () => {
  // This would create a new lobby with the same players
  // For now, just leave and go back to menu
  leaveCurrentLobby()
  router.push('/multiplayer')
}

const handleBackToMenu = () => {
  leaveCurrentLobby()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <Card class="mb-6 text-center">
        <h1 class="font-heading text-3xl text-noir-gold mb-2">GAME COMPLETE</h1>
        <p class="text-noir-text opacity-80">Room: {{ lobby.room_code }}</p>
      </Card>

      <!-- Winner Announcement -->
      <Card class="mb-6 text-center" v-if="sortedPlayers.length > 0">
        <div class="mb-4">
          <div class="text-6xl mb-2">{{ getMedal(1) }}</div>
          <h2 class="text-2xl font-bold text-noir-gold mb-1">
            {{ sortedPlayers[0].username }}
          </h2>
          <p class="text-noir-text opacity-80">Winner!</p>
        </div>
      </Card>

      <!-- Final Standings -->
      <Card class="mb-6">
        <h3 class="text-noir-gold font-medium mb-4 text-center">Final Standings</h3>

        <div class="space-y-3">
          <div
            v-for="(player, index) in sortedPlayers"
            :key="player.id"
            class="flex items-center justify-between p-4 rounded-lg border"
            :class="index < 3 ? 'border-noir-gold bg-noir-gold/10' : 'border-noir-gold/20'"
          >
            <div class="flex items-center gap-4">
              <!-- Rank/Medal -->
              <div class="text-2xl">
                {{ getMedal(index + 1) }}
              </div>

              <!-- Player Info -->
              <div>
                <div class="font-medium text-noir-text">{{ player.username }}</div>
                <div class="text-sm text-noir-text opacity-60">
                  {{ player.score }} points
                </div>
              </div>
            </div>

            <!-- Score -->
            <div class="text-right">
              <div class="text-xl font-mono font-bold text-noir-gold">
                {{ player.score.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Action Buttons -->
      <Card>
        <div class="flex gap-3">
          <Button
            @click="handlePlayAgain"
            variant="primary"
            class="flex-1"
          >
            Play Again
          </Button>

          <Button
            @click="handleBackToMenu"
            variant="secondary"
            class="flex-1"
          >
            Back to Menu
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
