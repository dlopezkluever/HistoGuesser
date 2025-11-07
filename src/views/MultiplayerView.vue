<script setup lang="ts">
import LobbyCreateJoin from '@/components/lobby/LobbyCreateJoin.vue'
import LobbyWaitingRoom from '@/components/lobby/LobbyWaitingRoom.vue'
import LobbyGameplay from '@/components/lobby/LobbyGameplay.vue'
import LobbyResults from '@/components/lobby/LobbyResults.vue'
import { useLobby } from '@/composables/useLobby'
import { useLobbyStore } from '@/stores/lobbyStore'
import { watch } from 'vue'

// Get the composable directly (avoid destructuring issues)
const lobbyComposable = useLobby()

// Debug what we actually got
console.log('🔍 lobbyComposable:', lobbyComposable)
console.log('🔍 lobbyComposable.error:', lobbyComposable?.error)

// Simple debug - log initial state
console.log('🎯 MultiplayerView mounted, initial state:', {
  lobby: lobbyComposable.lobby,
  player: lobbyComposable.player,
  isLoading: lobbyComposable.isLoading
})

// Removed problematic watch statements - Pinia provides automatic reactivity!
// State changes are now handled automatically without manual watching

// Debug button click handler
const onCreateClick = () => {
  console.log('🎯 Create New Game button clicked!')
  console.log('Current state before create:', {
    lobby: lobbyComposable.lobby,
    player: lobbyComposable.player,
    isLoading: lobbyComposable.isLoading
  })
}

// Debug function to manually test state
const debugSetLobby = () => {
  console.log('🔧 Manually setting debug lobby...')

  const lobbyStore = useLobbyStore()

  const debugLobby = {
    id: 'test-lobby-id',
    room_code: 'DEBUG',
    host_id: 'test-user-id',
    status: 'waiting' as const,
    current_round: 0,
    figure_ids: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }

  const debugPlayer = {
    id: 'test-player-id',
    lobby_id: 'test-lobby-id',
    user_id: 'test-user-id',
    username: 'TestUser',
    score: 0,
    ready: false,
    connected: true,
    joined_at: new Date().toISOString()
  }

  console.log('🔧 Calling lobbyStore.setLobby()...')
  lobbyStore.setLobby(debugLobby, debugPlayer)
  console.log('🔧 Calling lobbyStore.updatePlayers()...')
  lobbyStore.updatePlayers([debugPlayer])
  console.log('🔧 Debug state setting completed')
}

// Redirect to login if not authenticated will be handled in template
</script>

<template>
  <div class="min-h-screen bg-noir-bg text-noir-text p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Loading State -->
      <div v-if="lobbyComposable.isLoading" class="flex items-center justify-center min-h-[50vh]">
        <div class="card text-center">
          <div class="animate-pulse text-noir-gold">Loading...</div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="lobbyComposable.error" class="flex items-center justify-center min-h-[50vh]">
        <div class="card text-center max-w-md">
          <h2 class="text-xl text-noir-red mb-4">Error</h2>
          <p class="text-noir-text mb-4">{{ lobbyComposable.error }}</p>
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
        <!-- Debug Info -->
        <div class="mb-4 p-4 bg-noir-gold/10 border border-noir-gold/20 rounded">
          <h3 class="text-noir-gold font-bold mb-2">🔍 Debug Info</h3>
          <p><strong>Lobby:</strong> {{ lobbyComposable.lobby ? 'EXISTS' : 'NULL' }}</p>
          <p><strong>Status:</strong> {{ lobbyComposable.lobby?.status || 'N/A' }}</p>
          <p><strong>Player:</strong> {{ lobbyComposable.player ? 'EXISTS' : 'NULL' }}</p>
          <p><strong>Players Count:</strong> {{ lobbyComposable.players?.length || 0 }}</p>
          <p><strong>Loading:</strong> {{ lobbyComposable.isLoading }}</p>
          <button
            @click="debugSetLobby"
            class="mt-2 px-4 py-2 bg-noir-gold text-noir-bg rounded hover:bg-noir-gold/80 transition-colors"
          >
            🔧 Test State Management
          </button>
        </div>

        <!-- Create/Join Screen -->
        <div v-if="!lobbyComposable.lobby" class="border-2 border-red-500 p-4">
          <p class="text-red-400 mb-2">🔴 RENDERING: Create/Join Screen</p>
          <LobbyCreateJoin />
          <button
            @click="onCreateClick"
            class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            🎯 Debug: Test Create Button
          </button>
        </div>

        <!-- Waiting Room -->
        <div v-else-if="lobbyComposable.lobby && lobbyComposable.lobby.status === 'waiting'" class="border-2 border-green-500 p-4">
          <p class="text-green-400 mb-2">🟢 RENDERING: Waiting Room</p>
          <LobbyWaitingRoom
            :lobby="lobbyComposable.lobby"
            :players="lobbyComposable.players || []"
            :current-player="lobbyComposable.player"
          />
        </div>

        <!-- Active Game -->
        <div v-else-if="lobbyComposable.lobby && lobbyComposable.lobby.status === 'in_progress' && lobbyComposable.isRoundActive" class="border-2 border-blue-500 p-4">
          <p class="text-blue-400 mb-2">🔵 RENDERING: Active Game</p>
          <LobbyGameplay
            :lobby="lobbyComposable.lobby"
            :players="lobbyComposable.players || []"
            :current-round="lobbyComposable.currentRound || 0"
            :figures="lobbyComposable.figures || []"
          />
        </div>

        <!-- Game Results -->
        <div v-else-if="lobbyComposable.lobby && lobbyComposable.lobby.status === 'finished'" class="border-2 border-purple-500 p-4">
          <p class="text-purple-400 mb-2">🟣 RENDERING: Game Results</p>
          <LobbyResults
            :lobby="lobbyComposable.lobby"
            :players="lobbyComposable.players || []"
          />
        </div>

        <!-- Fallback -->
        <div v-else class="border-2 border-yellow-500 p-4">
          <p class="text-yellow-400">🟡 RENDERING: Fallback (unexpected state)</p>
          <p>Lobby: {{ JSON.stringify(lobbyComposable.lobby, null, 2) }}</p>
          <p>Player: {{ JSON.stringify(lobbyComposable.player, null, 2) }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

