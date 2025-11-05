<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { useAuth } from '@/composables/useAuth'
import { getDailyLeaderboard, getUserDailyRank } from '@/lib/supabase/queries'
import type { LeaderboardEntry } from '@/types/score'

// Router and auth
const router = useRouter()
const { currentUser } = useAuth()

// State
const selectedDate = ref(new Date().toISOString().split('T')[0])
const leaderboard = ref<LeaderboardEntry[]>([])
const userRank = ref<number | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed
const formattedDate = computed(() => {
  const date = new Date(selectedDate.value)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const isAuthenticated = computed(() => !!currentUser.value)

const canGoToPreviousDay = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return selectedDate.value < today
})

const canGoToNextDay = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return selectedDate.value < today
})

// Methods
const loadLeaderboard = async () => {
  isLoading.value = true
  error.value = null

  try {
    // Load leaderboard for selected date
    const entries = await getDailyLeaderboard(selectedDate.value)

    // If no entries for selected date, try yesterday (for days with no completions)
    if (entries.length === 0 && selectedDate.value === new Date().toISOString().split('T')[0]) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const yesterdayEntries = await getDailyLeaderboard(yesterdayStr)
      if (yesterdayEntries.length > 0) {
        selectedDate.value = yesterdayStr
        leaderboard.value = yesterdayEntries
      } else {
        leaderboard.value = []
      }
    } else {
      leaderboard.value = entries
    }

    // Load user's rank if authenticated
    if (isAuthenticated.value) {
      userRank.value = await getUserDailyRank(currentUser.value!.id, selectedDate.value)
    }
  } catch (err) {
    console.error('Failed to load leaderboard:', err)
    error.value = 'Failed to load leaderboard'
    leaderboard.value = []
  } finally {
    isLoading.value = false
  }
}

const goToPreviousDay = () => {
  if (!canGoToPreviousDay.value) return

  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() - 1)
  selectedDate.value = date.toISOString().split('T')[0]
}

const goToNextDay = () => {
  if (!canGoToNextDay.value) return

  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + 1)
  const today = new Date().toISOString().split('T')[0]

  if (date.toISOString().split('T')[0] <= today) {
    selectedDate.value = date.toISOString().split('T')[0]
  }
}

const goToToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
}

const goBack = () => {
  router.go(-1) || router.push('/')
}

// Watch for date changes
watch(selectedDate, loadLeaderboard)

// Initialize
onMounted(() => {
  loadLeaderboard()
})
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <Button variant="ghost" @click="goBack">
          ← Back
        </Button>
        <h1 class="text-3xl font-bebas text-noir-gold">LEADERBOARD</h1>
        <div class="w-16"></div> <!-- Spacer for centering -->
      </div>

      <!-- Date Selector -->
      <Card class="mb-6">
        <div class="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            :disabled="!canGoToPreviousDay"
            @click="goToPreviousDay"
          >
            ← Previous
          </Button>

          <div class="text-center min-w-64">
            <div class="text-lg font-medium text-noir-text">{{ formattedDate }}</div>
            <Button
              v-if="selectedDate !== new Date().toISOString().split('T')[0]"
              variant="ghost"
              size="sm"
              @click="goToToday"
              class="mt-1"
            >
              Go to Today
            </Button>
          </div>

          <Button
            variant="ghost"
            :disabled="!canGoToNextDay"
            @click="goToNextDay"
          >
            Next →
          </Button>
        </div>
      </Card>

      <!-- Loading State -->
      <Card v-if="isLoading" class="text-center py-12">
        <div class="text-noir-text">Loading leaderboard...</div>
      </Card>

      <!-- Error State -->
      <Card v-else-if="error" class="text-center py-12">
        <div class="text-noir-red mb-4">{{ error }}</div>
        <Button @click="loadLeaderboard">Try Again</Button>
      </Card>

      <!-- Leaderboard -->
      <Card v-else>
        <!-- User's Rank (if not in top 100) -->
        <div
          v-if="userRank && userRank > 100"
          class="border-b border-noir-gold/20 pb-4 mb-4"
        >
          <div class="flex items-center justify-between bg-noir-bg/50 p-4 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="text-xl font-mono text-noir-gold">#{{ userRank }}</div>
              <div class="text-sm text-noir-text/60">Your Rank</div>
            </div>
            <div class="text-noir-text/60">
              Not in top 100 for this day
            </div>
          </div>
        </div>

        <!-- Top 100 List -->
        <div v-if="leaderboard.length > 0" class="space-y-2">
          <div
            v-for="entry in leaderboard"
            :key="entry.user_id"
            class="flex items-center justify-between p-4 rounded-lg transition-colors"
            :class="{
              'bg-noir-red/10 border border-noir-red/20': entry.rank <= 3 && entry.rank === 1,
              'bg-noir-gold/10 border border-noir-gold/20': entry.rank <= 3 && entry.rank === 2,
              'bg-noir-gold/5 border border-noir-gold/10': entry.rank <= 3 && entry.rank === 3,
              'bg-noir-bg/30': entry.rank > 3,
              'ring-2 ring-noir-gold': isAuthenticated && entry.user_id === currentUser?.id
            }"
          >
            <!-- Rank and Medal -->
            <div class="flex items-center gap-3">
              <div class="text-lg font-mono w-8 text-center" :class="{
                'text-noir-red': entry.rank === 1,
                'text-noir-gold': entry.rank === 2,
                'text-noir-gold/80': entry.rank === 3,
                'text-noir-text/60': entry.rank > 3
              }">
                #{{ entry.rank }}
              </div>

              <!-- Medal for top 3 -->
              <div v-if="entry.rank <= 3" class="text-2xl">
                <span v-if="entry.rank === 1">🥇</span>
                <span v-else-if="entry.rank === 2">🥈</span>
                <span v-else-if="entry.rank === 3">🥉</span>
              </div>

              <!-- User Info -->
              <div class="flex items-center gap-3">
                <div v-if="entry.avatar_url" class="w-8 h-8 rounded-full bg-noir-bg overflow-hidden">
                  <img
                    :src="entry.avatar_url"
                    :alt="`${entry.username}'s avatar`"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-else class="w-8 h-8 rounded-full bg-noir-gold/20 flex items-center justify-center">
                  <span class="text-xs font-medium text-noir-gold">
                    {{ entry.username.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="font-medium text-noir-text">{{ entry.username }}</span>
                <span v-if="isAuthenticated && entry.user_id === currentUser?.id" class="text-xs text-noir-gold font-medium">
                  (You)
                </span>
              </div>
            </div>

            <!-- Score -->
            <div class="text-lg font-mono text-noir-text">
              {{ entry.score.toLocaleString() }}
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-12">
          <div class="text-noir-text/60 mb-4">
            No scores for {{ formattedDate }}
          </div>
          <div class="text-sm text-noir-text/40">
            Be the first to complete the Daily Challenge!
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

