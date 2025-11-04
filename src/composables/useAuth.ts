import { computed } from 'vue'
import { useStore } from './useStore'
import { authStore } from '@/stores/authStore'
import * as authService from '@/lib/supabase/auth'

/**
 * Vue composable for authentication
 * Provides convenient auth methods and reactive state for components
 */
export function useAuth() {
  const auth = useStore(authStore)

  // Computed properties for cleaner component usage
  const isAuthenticated = computed(() => !!auth.value.user)
  const currentUser = computed(() => auth.value.user)
  const isLoading = computed(() => auth.value.loading)
  const error = computed(() => auth.value.error)

  // Convenience methods that wrap authStore actions
  const login = async (email: string, password: string) => {
    return await authStore.getState().signIn(email, password)
  }

  const signup = async (email: string, password: string, username: string) => {
    return await authStore.getState().signUp(email, password, username)
  }

  const logout = async () => {
    return await authStore.getState().signOut()
  }

  // Initialize auth state (call this in App.vue or main setup)
  const initialize = async () => {
    return await authStore.getState().initialize()
  }

  // Profile management methods
  const updateProfile = async (updates: { username?: string; avatar_url?: string }) => {
    if (!currentUser.value) {
      throw new Error('No user logged in')
    }
    return await authService.updateProfile(currentUser.value.id, updates)
  }

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    return await authService.isUsernameAvailable(username)
  }

  return {
    // Reactive state
    isAuthenticated,
    currentUser,
    isLoading,
    error,

    // Methods
    login,
    signup,
    logout,
    initialize,
    updateProfile,
    checkUsernameAvailable,
  }
}