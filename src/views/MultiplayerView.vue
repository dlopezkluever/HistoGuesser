<script setup lang="ts">
import LobbyCreateJoin from '@/components/lobby/LobbyCreateJoin.vue'
import LobbyWaitingRoom from '@/components/lobby/LobbyWaitingRoom.vue'
import LobbyGameplay from '@/components/lobby/LobbyGameplay.vue'
import LobbyResults from '@/components/lobby/LobbyResults.vue'
import { useLobby } from '@/composables/useLobby'
import { useLobbyStore } from '@/stores/lobbyStore'
import { watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

// Use Pinia store directly with storeToRefs for proper reactivity
const lobbyStore = useLobbyStore()
const {
  currentLobby: lobby,
  currentPlayer: player,
  players,
  figures,
  currentRound,
  currentFigure,
  isRoundActive,
  isLoading,
  error,
  roundSubmissions
} = storeToRefs(lobbyStore)

// Get actions from composable
const { createNewLobby, joinExistingLobby, toggleReady, startMultiplayerGame, submitGuess, leaveCurrentLobby } = useLobby()

// Clean up any existing lobby state when entering multiplayer
onMounted(() => {
  console.log('🎯 MultiplayerView mounted - cleaning up any existing lobby state')
  // Reset lobby store to ensure clean state
  lobbyStore.reset()
})

// Debug what we actually got
console.log('🔍 lobbyStore reactive refs:', { lobby, player, isLoading })
console.log('🎯 MultiplayerView mounted, initial state:', {
  lobby: lobby.value,
  player: player.value,
  isLoading: isLoading.value
})

// Watch for store changes to debug reactivity
watch([lobby, player, players], ([newLobby, newPlayer, newPlayers]) => {
  console.log('🎯 MultiplayerView store changed:', {
    lobby: newLobby ? { id: newLobby.id, status: newLobby.status, round: newLobby.current_round } : null,
    player: newPlayer ? { id: newPlayer.id, ready: newPlayer.ready } : null,
    playersCount: newPlayers?.length || 0,
    players: newPlayers?.map(p => ({ id: p.id, user_id: p.user_id, ready: p.ready, username: p.username }))
  })
}, { deep: true, immediate: true })

// Specifically watch for lobby status changes
watch(() => lobby.value?.status, (newStatus, oldStatus) => {
  console.log('🎯 MultiplayerView: Lobby status changed:', oldStatus, '→', newStatus)
  if (newStatus === 'in_progress') {
    console.log('🎮 MultiplayerView: Lobby status is now in_progress - should show game screen')
  }
}, { immediate: true })

// Debug button click handler
const onCreateClick = () => {
  console.log('🎯 Create New Game button clicked!')
  console.log('Current state before create:', {
    lobby: lobby.value,
    player: player.value,
    isLoading: isLoading.value
  })
}

// Handle round advancement from LobbyGameplay
const handleAdvanceRound = async () => {
  console.log('🎯 handleAdvanceRound called in MultiplayerView')

  if (!lobby.value || !lobbyStore.roundSubmissions.length) {
    console.warn('⚠️ handleAdvanceRound: Missing lobby or submissions')
    return
  }

  try {
    // End the current round
    console.log('🏁 Ending current round and updating scores')
    lobbyStore.endRound(lobbyStore.roundSubmissions)

    // Update player scores based on submissions
    const scoreUpdates = lobbyStore.roundSubmissions.reduce((acc, sub) => {
      acc[sub.user_id] = (acc[sub.user_id] || 0) + sub.score
      return acc
    }, {} as Record<string, number>)

    Object.entries(scoreUpdates).forEach(([userId, additionalScore]) => {
      const currentScore = lobbyStore.players.find(p => p.user_id === userId)?.score || 0
      lobbyStore.updatePlayerScore(userId, currentScore + additionalScore)
    })

    const nextRound = lobbyStore.currentRound + 1
    console.log('🎲 Current round:', lobbyStore.currentRound, 'Next round would be:', nextRound)

    if (nextRound > 10) {
      // Game finished
      console.log('🏆 Game completed! All 10 rounds finished')
      lobbyStore.updateLobbyStatus('finished', 10)
    } else {
      // Start next round
      console.log('🎯 Starting next round:', nextRound)
      const nextFigure = lobbyStore.figures[nextRound - 1] // 0-indexed array

      if (nextFigure) {
        console.log('🎯 Starting round with figure:', nextFigure.name)
        lobbyStore.startRound(nextRound, nextFigure)
      } else {
        console.error('❌ No figure found for round', nextRound)
        // End game if we can't find the next figure
        lobbyStore.updateLobbyStatus('finished', lobbyStore.currentRound)
      }
    }

    console.log('✅ Round advancement completed')
  } catch (error) {
    console.error('❌ Error advancing round:', error)
  }
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
        <!-- Debug Info -->
        <div class="mb-4 p-4 bg-noir-gold/10 border border-noir-gold/20 rounded">
          <h3 class="text-noir-gold font-bold mb-2">🔍 Debug Info</h3>
          <p><strong>Lobby:</strong> {{ lobby ? 'EXISTS' : 'NULL' }}</p>
          <p><strong>Status:</strong> {{ lobby?.status || 'N/A' }}</p>
          <p><strong>Player:</strong> {{ player ? 'EXISTS' : 'NULL' }}</p>
          <p><strong>Players Count:</strong> {{ players?.length || 0 }}</p>
          <p><strong>Loading:</strong> {{ isLoading }}</p>
          <button
            @click="debugSetLobby"
            class="mt-2 px-4 py-2 bg-noir-gold text-noir-bg rounded hover:bg-noir-gold/80 transition-colors"
          >
            🔧 Test State Management
          </button>
        </div>

        <!-- Create/Join Screen -->
        <div v-if="!lobby" class="border-2 border-red-500 p-4">
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
        <div v-else-if="lobby && lobby.status === 'waiting'" class="border-2 border-green-500 p-4">
          <p class="text-green-400 mb-2">🟢 RENDERING: Waiting Room</p>
          <LobbyWaitingRoom
            :lobby="lobby"
            :players="players || []"
            :current-player="player"
          />
        </div>

        <!-- Active Game -->
        <div v-else-if="lobby && lobby.status === 'in_progress' && isRoundActive" class="border-2 border-blue-500 p-4">
          <p class="text-blue-400 mb-2">🔵 RENDERING: Active Game</p>
          <LobbyGameplay
            :lobby="lobby"
            :players="players || []"
            :current-round="currentRound || 0"
            :figures="figures || []"
            :round-submissions="roundSubmissions || []"
            @advance-round="handleAdvanceRound"
          />
        </div>

        <!-- Game Results -->
        <div v-else-if="lobby && lobby.status === 'finished'" class="border-2 border-purple-500 p-4">
          <p class="text-purple-400 mb-2">🟣 RENDERING: Game Results</p>
          <LobbyResults
            :lobby="lobby"
            :players="players || []"
          />
        </div>

        <!-- Fallback -->
        <div v-else class="border-2 border-yellow-500 p-4">
          <p class="text-yellow-400">🟡 RENDERING: Fallback (unexpected state)</p>
          <p>Lobby: {{ JSON.stringify(lobby, null, 2) }}</p>
          <p>Player: {{ JSON.stringify(player, null, 2) }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

