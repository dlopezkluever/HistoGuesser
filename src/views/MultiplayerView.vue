<script setup lang="ts">
import LobbyCreateJoin from '@/components/lobby/LobbyCreateJoin.vue'
import LobbyWaitingRoom from '@/components/lobby/LobbyWaitingRoom.vue'
import LobbyGameplay from '@/components/lobby/LobbyGameplay.vue'
import LobbyResults from '@/components/lobby/LobbyResults.vue'
import { useLobby } from '@/composables/useLobby'

const {
  lobby,
  player,
  players,
  currentRound,
  isRoundActive,
  isLoading,
  error
} = useLobby()

// Redirect to login if not authenticated will be handled in template
</script>

<template>
  <div class="min-h-screen bg-noir-bg text-noir-text p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center min-h-[50vh]">
        <div class="card text-center">
          <div class="animate-pulse text-noir-gold">Loading...</div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
        <div class="card text-center max-w-md">
          <h2 class="text-xl text-noir-red mb-4">Error</h2>
          <p class="text-noir-text mb-4">{{ error }}</p>
          <button
            @click="$router.go(-1)"
            class="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>

      <!-- Lobby States -->
      <template v-else>
        <!-- Create/Join Screen -->
        <LobbyCreateJoin v-if="!lobby" />

        <!-- Waiting Room -->
        <LobbyWaitingRoom
          v-else-if="lobby && lobby.status === 'waiting'"
          :lobby="lobby"
          :players="players"
          :current-player="player"
        />

        <!-- Active Game -->
        <LobbyGameplay
          v-else-if="lobby && lobby.status === 'in_progress' && isRoundActive"
          :lobby="lobby"
          :players="players"
          :current-round="currentRound"
        />

        <!-- Game Results -->
        <LobbyResults
          v-else-if="lobby && lobby.status === 'finished'"
          :lobby="lobby"
          :players="players"
        />
      </template>
    </div>
  </div>
</template>

