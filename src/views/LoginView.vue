<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const username = ref('')
const loading = ref(false)

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  email.value = ''
  password.value = ''
  username.value = ''
}

const handleSubmit = async () => {
  try {
    loading.value = true

    if (isSignUp.value) {
      await authStore.signUp(email.value, password.value, username.value)
      uiStore.showToast('success', 'Account created successfully!')
    } else {
      await authStore.signIn(email.value, password.value)
      uiStore.showToast('success', 'Logged in successfully!')
    }

    router.push({ name: 'home' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    uiStore.showToast('error', message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="card max-w-md w-full space-y-6">
      <h1 class="font-heading text-4xl text-center text-noir-gold">
        {{ isSignUp ? 'Sign Up' : 'Login' }}
      </h1>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="isSignUp">
          <label class="block text-sm mb-2">Username</label>
          <input v-model="username" type="text" class="input w-full" required />
        </div>

        <div>
          <label class="block text-sm mb-2">Email</label>
          <input v-model="email" type="email" class="input w-full" required />
        </div>

        <div>
          <label class="block text-sm mb-2">Password</label>
          <input v-model="password" type="password" class="input w-full" required />
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login' }}
        </button>
      </form>

      <div class="text-center">
        <button class="text-noir-gold hover:underline" @click="toggleMode">
          {{ isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up" }}
        </button>
      </div>

      <div class="text-center">
        <button class="text-noir-text/70 hover:underline" @click="router.push({ name: 'home' })">
          ← Back to Home
        </button>
      </div>
    </div>
  </div>
</template>

