<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const navigateToFreePlay = () => router.push({ name: 'free-play' })
const navigateToDailyChallenge = () => router.push({ name: 'daily-challenge' })
const navigateToMultiplayer = () => router.push({ name: 'multiplayer' })
const navigateToLogin = () => router.push({ name: 'login' })
const navigateToLeaderboard = () => router.push({ name: 'leaderboard' })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="card max-w-2xl w-full text-center space-y-8">
      <!-- Title -->
      <h1 class="font-title text-6xl md:text-8xl text-noir-gold tracking-title uppercase">
        HistoGuesser
      </h1>

      <!-- Game Mode Buttons -->
      <div class="space-y-4">
        <button
          class="btn btn-primary w-full text-xl py-4"
          :disabled="!authStore.user"
          @click="navigateToDailyChallenge"
        >
          🏆 Daily Challenge
          <span v-if="!authStore.user" class="text-sm block">(Login Required)</span>
        </button>

        <button class="btn btn-primary w-full text-xl py-4" @click="navigateToFreePlay">
          🎯 Free Play
        </button>

        <button
          class="btn btn-primary w-full text-xl py-4"
          :disabled="!authStore.user"
          @click="navigateToMultiplayer"
        >
          👥 Multiplayer
          <span v-if="!authStore.user" class="text-sm block">(Login Required)</span>
        </button>
      </div>

      <!-- Bottom Bar -->
      <div class="flex justify-center gap-4 pt-4 border-t border-noir-gold/30">
        <button v-if="authStore.user" class="btn btn-secondary">
          👤 {{ authStore.user.username }}
        </button>
        <button v-else class="btn btn-secondary" @click="navigateToLogin">Login / Sign Up</button>

        <button class="btn btn-secondary" @click="navigateToLeaderboard">📊 Leaderboard</button>
      </div>
    </div>
  </div>
</template>

