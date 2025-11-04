import { createStore } from 'zustand/vanilla'
import type { User, AuthState } from '@/types/user'
import * as authService from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { uiStore } from './uiStore'

interface AuthStore extends AuthState {
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const store = createStore<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      set({ loading: true, error: null })

      // Get current session
      const session = await authService.getSession()

      if (session) {
        // Ensure user consistency (profile + stats)
        try {
          const user = await authService.ensureUserConsistency(session.user)
          set({ user, session, loading: false })
        } catch (error) {
          console.error('Error ensuring user consistency on init:', error)
          uiStore.getState().showToast('error', 'Failed to load user profile')
          set({ error: 'Failed to load user profile', loading: false })
        }
      } else {
        set({ user: null, session: null, loading: false })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            const user = await authService.ensureUserConsistency(session.user)
            set({ user, session })
            uiStore.getState().showToast('success', 'Successfully signed in!')
          } catch (error) {
            console.error('Error ensuring user consistency on sign in:', error)
            uiStore.getState().showToast('error', 'Failed to load user profile')
            set({ error: 'Failed to load user profile', user: null, session: null })
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null })
          uiStore.getState().showToast('success', 'Successfully signed out!')
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      set({ error: message, loading: false })
      console.error('Auth initialization error:', error)
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null })
      const { session } = await authService.signIn(email, password)
      if (session?.user) {
        const user = await authService.ensureUserConsistency(session.user)
        set({ user, session, loading: false })
        uiStore.getState().showToast('success', 'Successfully signed in!')
      } else {
        throw new Error('Sign in failed - no session returned')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      set({ error: message, loading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    try {
      set({ loading: true, error: null })
      const { session } = await authService.signUp(email, password, username)
      if (session?.user) {
        const user = await authService.ensureUserConsistency(session.user)
        set({ user, session, loading: false })
        uiStore.getState().showToast('success', 'Account created successfully!')
      } else {
        throw new Error('Sign up failed - no session returned')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed'
      set({ error: message, loading: false })
      throw error
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null })
      await authService.signOut()
      set({ user: null, session: null, loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed'
      set({ error: message, loading: false })
      throw error
    }
  },

  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}))

// Export vanilla store
export const authStore = store

