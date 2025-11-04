<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { getPlayerStats } from '@/lib/supabase/queries'
import { uiStore } from '@/stores/uiStore'
import type { PlayerStats } from '@/types/user'
import { Card } from '@/components/ui'

const router = useRouter()
const { currentUser, updateProfile, checkUsernameAvailable, isAuthenticated } = useAuth()

const stats = ref<PlayerStats | null>(null)
const loading = ref(false)
const editingUsername = ref(false)
const newUsername = ref('')
const usernameError = ref('')
const savingUsername = ref(false)

// Computed properties
const displayUsername = computed(() => currentUser.value?.username || 'Unknown User')

// Load player stats
const loadStats = async () => {
  if (!currentUser.value) return

  try {
    loading.value = true
    stats.value = await getPlayerStats(currentUser.value.id)
  } catch (error) {
    console.error('Failed to load stats:', error)
    // Show empty stats if loading fails
    stats.value = {
      user_id: currentUser.value.id,
      total_games: 0,
      best_score: 0,
      daily_streak: 0,
      last_daily_date: null,
      created_at: '',
      updated_at: '',
    }
  } finally {
    loading.value = false
  }
}

// Username editing
const startEditingUsername = () => {
  editingUsername.value = true
  newUsername.value = displayUsername.value
  usernameError.value = ''
}

const cancelEditingUsername = () => {
  editingUsername.value = false
  newUsername.value = ''
  usernameError.value = ''
}

const saveUsername = async () => {
  if (!currentUser.value || !newUsername.value.trim()) return

  try {
    savingUsername.value = true
    usernameError.value = ''

    // Validate username
    const trimmedUsername = newUsername.value.trim()
    if (trimmedUsername.length < 3) {
      usernameError.value = 'Username must be at least 3 characters long'
      return
    }
    if (trimmedUsername.length > 30) {
      usernameError.value = 'Username must be less than 30 characters'
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      usernameError.value = 'Username can only contain letters, numbers, underscores, and hyphens'
      return
    }

    // Check if username is different from current
    if (trimmedUsername === displayUsername.value) {
      cancelEditingUsername()
      return
    }

    // Check availability
    const isAvailable = await checkUsernameAvailable(trimmedUsername)
    if (!isAvailable) {
      usernameError.value = 'This username is already taken'
      return
    }

    // Update username
    await updateProfile({ username: trimmedUsername })
    uiStore.getState().showToast('success', 'Username updated successfully!')
    editingUsername.value = false
    newUsername.value = ''

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update username'
    usernameError.value = message
    uiStore.getState().showToast('error', message)
  } finally {
    savingUsername.value = false
  }
}

const goBack = () => {
  router.push({ name: 'home' })
}

// Load stats on mount
onMounted(() => {
  if (isAuthenticated.value) {
    loadStats()
  }
})
</script>

<template>
  <div class="min-h-screen bg-noir-bg p-4">
    <div class="max-w-2xl mx-auto pt-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <button
          class="flex items-center gap-2 text-noir-text hover:text-noir-gold transition-colors"
          @click="goBack"
        >
          ← Back to Menu
        </button>
        <h1 class="font-heading text-3xl text-noir-gold">Profile</h1>
        <div></div> <!-- Spacer -->
      </div>

      <!-- Profile Card -->
      <Card class="mb-6">
        <div class="text-center">
          <!-- Avatar placeholder -->
          <div class="w-20 h-20 bg-noir-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-noir-gold font-bold text-2xl">
              {{ displayUsername.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Username section -->
          <div class="mb-6">
            <div v-if="!editingUsername" class="flex items-center justify-center gap-3">
              <h2 class="font-heading text-2xl text-noir-text">@{{ displayUsername }}</h2>
              <button
                class="text-noir-gold hover:text-noir-gold/80 text-sm underline"
                @click="startEditingUsername"
              >
                Edit
              </button>
            </div>

            <!-- Username edit form -->
            <div v-else class="space-y-3">
              <div>
                <label class="block text-sm text-noir-text/70 mb-1">New Username</label>
                <input
                  v-model="newUsername"
                  type="text"
                  class="input w-full max-w-xs"
                  placeholder="Enter new username"
                  :disabled="savingUsername"
                  @keyup.enter="saveUsername"
                />
              </div>
              <div v-if="usernameError" class="text-noir-red text-sm">
                {{ usernameError }}
              </div>
              <div class="flex gap-2 justify-center">
                <button
                  :disabled="savingUsername || !newUsername.trim()"
                  class="btn btn-primary"
                  @click="saveUsername"
                >
                  {{ savingUsername ? 'Saving...' : 'Save' }}
                </button>
                <button
                  :disabled="savingUsername"
                  class="btn btn-secondary"
                  @click="cancelEditingUsername"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Stats Card -->
      <Card>
        <h3 class="font-heading text-xl text-noir-gold mb-6 text-center">Game Statistics</h3>

        <div v-if="loading" class="text-center py-8">
          <div class="text-noir-text/70">Loading stats...</div>
        </div>

        <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Total Games -->
          <div class="stat-card">
            <div class="stat-number">{{ stats.total_games }}</div>
            <div class="stat-label">Total Games</div>
          </div>

          <!-- Best Score -->
          <div class="stat-card">
            <div class="stat-number">{{ stats.best_score.toLocaleString() }}</div>
            <div class="stat-label">Best Score</div>
          </div>

          <!-- Daily Streak -->
          <div class="stat-card">
            <div class="stat-number">{{ stats.daily_streak }}</div>
            <div class="stat-label">Daily Streak</div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="text-noir-text/70">No stats available yet</div>
          <div class="text-noir-text/50 text-sm mt-1">Play some games to see your statistics!</div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.input {
  @apply px-4 py-2.5 bg-noir-surface text-noir-text border border-noir-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-noir-gold/30 focus:border-noir-gold/40 transition-all placeholder:text-noir-text/40;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-noir-gold/30;
}

.btn-primary {
  @apply bg-noir-red text-noir-text border border-noir-gold/20 hover:bg-[#660000] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-noir-surface text-noir-text border border-noir-gold/20 hover:border-noir-gold/40 disabled:opacity-50 disabled:cursor-not-allowed;
}

.stat-card {
  @apply bg-noir-surface border border-noir-gold/20 rounded-xl p-6 text-center hover:border-noir-gold/40 transition-colors;
}

.stat-number {
  @apply font-heading text-3xl text-noir-gold mb-2;
}

.stat-label {
  @apply text-noir-text/70 text-sm uppercase tracking-wide;
}

.font-heading {
  @apply font-playfair;
}
</style>

