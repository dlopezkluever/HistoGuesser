<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authStore } from '@/stores/authStore'
import { uiStore } from '@/stores/uiStore'
import { Card } from '@/components/ui'

const router = useRouter()
const route = useRoute()

const isSignUp = ref(false)

// Check for signup mode from query parameter
onMounted(() => {
  if (route.query.mode === 'signup') {
    isSignUp.value = true
  }
})
const email = ref('')
const password = ref('')
const username = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  email.value = ''
  password.value = ''
  username.value = ''
  errorMessage.value = null
}

// Validate password requirements
const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long'
  }
  return null
}

// Validate username
const validateUsername = (username: string): string | null => {
  if (username.length < 3) {
    return 'Username must be at least 3 characters long'
  }
  if (username.length > 30) {
    return 'Username must be less than 30 characters'
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens'
  }
  return null
}

const handleSubmit = async () => {
  try {
    errorMessage.value = null
    loading.value = true

    // Client-side validation
    if (isSignUp.value) {
      const usernameError = validateUsername(username.value)
      if (usernameError) {
        errorMessage.value = usernameError
        loading.value = false
        return
      }

      const passwordError = validatePassword(password.value)
      if (passwordError) {
        errorMessage.value = passwordError
        loading.value = false
        return
      }
    }

    if (isSignUp.value) {
      await authStore.getState().signUp(email.value, password.value, username.value)

      // Check if user is actually authenticated before navigating
      const currentUser = authStore.getState().user
      if (currentUser) {
        uiStore.getState().showToast('success', 'Welcome to HistoGuesser! 🎉')
        router.push({ name: 'home', query: { welcome: 'true' } })
      } else {
        // Account created but user not logged in - stay on signup page
        errorMessage.value = 'Account created successfully! Please sign in with your credentials.'
        isSignUp.value = false // Switch to login mode
      }
    } else {
      await authStore.getState().signIn(email.value, password.value)
      uiStore.getState().showToast('success', 'Logged in successfully!')
      router.push({ name: 'home' })
    }
  } catch (error: unknown) {
    // Extract detailed error message from Supabase
    let message = 'Authentication failed'
    
    if (error && typeof error === 'object' && 'message' in error) {
      message = error.message as string
    } else if (error instanceof Error) {
      message = error.message
    }
    
    // Handle common Supabase errors with user-friendly messages
    if (message.includes('422') || message.includes('Unprocessable')) {
      message = 'Invalid email or password. Password must be at least 6 characters.'
    } else if (message.includes('already registered') || message.includes('already exists')) {
      message = 'This email is already registered. Please sign in instead.'
    } else if (message.includes('Invalid login')) {
      message = 'Invalid email or password. Please try again.'
    }
    
    errorMessage.value = message
    uiStore.getState().showToast('error', message)
    console.error('Auth error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-noir-bg">
    <Card class="max-w-md w-full space-y-6">
      <h1 class="font-heading text-4xl text-center text-noir-gold">
        {{ isSignUp ? 'Sign Up' : 'Login' }}
      </h1>

      <!-- Error message display -->
      <div v-if="errorMessage" class="error-message">
        <p class="text-noir-red text-sm">{{ errorMessage }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="isSignUp">
          <label class="block text-sm mb-2 text-noir-text">Username</label>
          <input 
            v-model="username" 
            type="text" 
            class="input w-full" 
            placeholder="3-30 characters, letters/numbers only"
            required 
            minlength="3"
            maxlength="30"
          />
        </div>

        <div>
          <label class="block text-sm mb-2 text-noir-text">Email</label>
          <input 
            v-model="email" 
            type="email" 
            class="input w-full" 
            placeholder="your@email.com"
            required 
          />
        </div>

        <div>
          <label class="block text-sm mb-2 text-noir-text">Password</label>
          <input 
            v-model="password" 
            type="password" 
            class="input w-full" 
            placeholder="At least 6 characters"
            required 
            minlength="6"
          />
          <p v-if="isSignUp" class="text-xs text-noir-text/60 mt-1">
            Password must be at least 6 characters long
          </p>
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
    </Card>
  </div>
</template>

<style scoped>
.error-message {
  @apply p-3 bg-noir-red/10 border border-noir-red/30 rounded-lg;
}

.input {
  @apply px-4 py-2.5 bg-noir-surface text-noir-text border border-noir-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-noir-gold/30 focus:border-noir-gold/40 transition-all placeholder:text-noir-text/40;
}

.btn {
  @apply px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-noir-gold/30;
}

.btn-primary {
  @apply bg-noir-red text-noir-text border border-noir-gold/20 hover:bg-[#660000] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed;
}

.font-heading {
  @apply font-playfair;
}
</style>

