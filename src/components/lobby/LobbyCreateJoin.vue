<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLobby } from '@/composables/useLobby'
import { useLobbyStore } from '@/stores/lobbyStore'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'

// Use Pinia store directly with storeToRefs for proper reactivity
const lobbyStore = useLobbyStore()
const { isLoading } = storeToRefs(lobbyStore)

// Get actions from composable
const { createNewLobby, joinExistingLobby } = useLobby()
const router = useRouter()

onMounted(() => {
  console.log('🎨 LobbyCreateJoin component mounted!')
  console.log('🔍 LobbyCreateJoin reactive values:', {
    isLoading: isLoading.value,
    hasCreateNewLobby: typeof createNewLobby === 'function',
    hasJoinExistingLobby: typeof joinExistingLobby === 'function'
  })
})

const roomCode = ref('')
const joinError = ref('')

const handleCreateLobby = async () => {
  console.log('🏗️ LobbyCreateJoin.handleCreateLobby called!')
  console.log('🔍 Component state:', { isLoading: isLoading.value })
  try {
    console.log('🚀 Calling createNewLobby...')
    await createNewLobby()
    console.log('✅ createNewLobby completed successfully')
  } catch (error) {
    console.error('❌ Failed to create lobby:', error)
  }
}

const handleJoinLobby = async () => {
  console.log('🏗️ LobbyCreateJoin.handleJoinLobby called with roomCode:', roomCode.value)
  if (!roomCode.value.trim()) {
    joinError.value = 'Please enter a room code'
    return
  }

  try {
    joinError.value = ''
    console.log('🚀 Calling joinExistingLobby...')
    await joinExistingLobby(roomCode.value.trim().toUpperCase())
    console.log('✅ joinExistingLobby completed successfully')
  } catch (error) {
    console.log('❌ joinExistingLobby failed:', error)
    joinError.value = error instanceof Error ? error.message : 'Failed to join lobby'
  }
}

const handleBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <Card class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="font-heading text-3xl text-noir-gold mb-2">MULTIPLAYER</h1>
        <p class="text-noir-text text-sm opacity-80">Compete with friends in real-time</p>
      </div>

      <!-- Create Game Section -->
      <div class="mb-8">
        <Button
          :disabled="isLoading"
          class="w-full mb-4"
          variant="primary"
          @click="handleCreateLobby"
        >
          {{ isLoading ? 'Creating...' : 'Create New Game' }}
        </Button>
        <p class="text-xs text-noir-text opacity-60 text-center">
          Create a lobby and share the room code with friends
        </p>
      </div>

      <!-- Divider -->
      <div class="flex items-center mb-8">
        <div class="flex-1 h-px bg-noir-gold opacity-20"></div>
        <span class="px-3 text-noir-gold text-sm font-medium">OR</span>
        <div class="flex-1 h-px bg-noir-gold opacity-20"></div>
      </div>

      <!-- Join Game Section -->
      <div class="mb-6">
        <h3 class="text-noir-text font-medium mb-3 text-center">Join Existing Game</h3>
        <form class="space-y-3" @submit.prevent="handleJoinLobby">
          <Input
            v-model="roomCode"
            placeholder="Enter room code (e.g. ABC123)"
            :maxlength="6"
            class="text-center font-mono text-lg tracking-wider"
            style="text-transform: uppercase;"
          />
          <Button
            type="submit"
            :disabled="isLoading || !roomCode.trim()"
            class="w-full"
            variant="secondary"
          >
            {{ isLoading ? 'Joining...' : 'Join Game' }}
          </Button>
        </form>

        <!-- Join Error -->
        <div v-if="joinError" class="mt-3 text-center">
          <p class="text-noir-red text-sm">{{ joinError }}</p>
        </div>
      </div>

      <!-- Back Button -->
      <div class="text-center">
        <button
          class="text-noir-text opacity-60 hover:opacity-100 transition-opacity text-sm"
          @click="handleBack"
        >
          ← Back to Menu
        </button>
      </div>
    </Card>
  </div>
</template>
