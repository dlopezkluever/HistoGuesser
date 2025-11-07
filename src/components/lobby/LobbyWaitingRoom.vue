<script setup lang="ts">
import { computed } from 'vue'
import type { Lobby, LobbyPlayer } from '@/types/lobby'
import { useLobby } from '@/composables/useLobby'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

interface Props {
  lobby: Lobby
  players: LobbyPlayer[]
  currentPlayer: LobbyPlayer | null
}

const props = defineProps<Props>()
const { toggleReady, startMultiplayerGame, leaveCurrentLobby, isLoading } = useLobby()

const isHost = computed(() =>
  props.currentPlayer?.user_id === props.lobby.host_id
)

const allPlayersReady = computed(() =>
  props.players.length > 0 && props.players.every(player => player.ready)
)

const canStartGame = computed(() =>
  isHost.value && allPlayersReady.value && props.players.length >= 2
)

const handleCopyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.lobby.room_code)
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy room code:', error)
  }
}

const handleToggleReady = () => {
  console.log('🎯 handleToggleReady called in component')
  toggleReady()
}

const handleStartGame = () => {
  startMultiplayerGame()
}

const handleLeaveLobby = () => {
  leaveCurrentLobby()
}
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <Card class="mb-6">
        <div class="text-center">
          <div class="flex items-center justify-center gap-3 mb-4">
            <h1 class="font-heading text-2xl text-noir-gold">LOBBY</h1>
            <button
              @click="handleCopyCode"
              class="btn-secondary text-sm px-3 py-1"
              title="Copy room code"
            >
              {{ lobby.room_code }}
            </button>
          </div>
          <p class="text-noir-text text-sm opacity-80">
            Share this code with friends to join
          </p>
        </div>
      </Card>

      <!-- Players List -->
      <Card class="mb-6">
        <h2 class="text-noir-gold font-medium mb-4 text-center">
          Players ({{ players.length }}/8)
        </h2>

        <div class="space-y-3">
          <div
            v-for="player in players"
            :key="player.id"
            class="flex items-center justify-between p-3 rounded-lg border border-noir-gold/20 bg-noir-surface/50"
          >
            <div class="flex items-center gap-3">
              <!-- Connection Status -->
              <div
                class="w-3 h-3 rounded-full"
                :class="player.connected ? 'bg-green-500' : 'bg-red-500'"
              ></div>

              <!-- Player Name -->
              <div>
                <span class="text-noir-text font-medium">{{ player.username }}</span>
                <span v-if="player.user_id === lobby.host_id" class="text-noir-gold text-xs ml-2">(Host)</span>
              </div>
            </div>

            <!-- Ready Status -->
            <div class="flex items-center gap-2">
              <span
                class="text-sm"
                :class="player.ready ? 'text-green-400' : 'text-noir-text opacity-60'"
              >
                {{ player.ready ? 'Ready' : 'Not Ready' }}
              </span>
              <div
                class="w-2 h-2 rounded-full"
                :class="player.ready ? 'bg-green-400' : 'bg-gray-500'"
              ></div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Action Buttons -->
      <Card>
        <div class="flex gap-3">
          <!-- Ready Button (for non-host players) -->
          <Button
            v-if="!isHost"
            @click="handleToggleReady"
            :variant="currentPlayer?.ready ? 'secondary' : 'primary'"
            class="flex-1"
            :disabled="isLoading"
          >
            {{ currentPlayer?.ready ? 'Not Ready' : 'Ready' }}
          </Button>

          <!-- Start Game Button (for host) -->
          <Button
            v-if="isHost"
            @click="handleStartGame"
            :disabled="!canStartGame || isLoading"
            class="flex-1"
            variant="primary"
          >
            {{ isLoading ? 'Starting...' : 'Start Game' }}
          </Button>

          <!-- Leave Lobby Button -->
          <Button
            @click="handleLeaveLobby"
            variant="secondary"
            class="px-6"
            :disabled="isLoading"
          >
            Leave
          </Button>
        </div>

        <!-- Status Messages -->
        <div class="mt-4 text-center text-sm">
          <p v-if="!isHost && !allPlayersReady" class="text-noir-text opacity-70">
            Waiting for all players to be ready...
          </p>
          <p v-else-if="isHost && !allPlayersReady" class="text-noir-red">
            All players must be ready to start
          </p>
          <p v-else-if="players.length < 2" class="text-noir-text opacity-70">
            Need at least 2 players to start
          </p>
          <p v-else-if="canStartGame" class="text-green-400">
            Ready to start!
          </p>
        </div>
      </Card>
    </div>
  </div>
</template>
