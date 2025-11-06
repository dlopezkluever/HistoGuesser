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
          console.error('❌ Error ensuring user consistency on init:', error)
          uiStore.getState().showToast('error', 'Failed to load user profile')
          // Don't set user to null - keep the session but mark as error
          set({ error: 'Failed to load user profile', loading: false })
        }
      } else {
        console.log('🚪 No active session')
        set({ user: null, session: null, loading: false })
      }

      // Listen for auth changes
      console.log('👂 Setting up auth state listener...')
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state change:', event, session ? 'Session exists' : 'No session')

        if (event === 'SIGNED_IN' && session) {
          try {
            console.log('🔑 User signed in, ensuring consistency...')
            const user = await authService.ensureUserConsistency(session.user)
            console.log('✅ Sign in consistency ensured:', user.username)
            set({ user, session, loading: false, error: null })
            uiStore.getState().showToast('success', 'Successfully signed in!')
          } catch (error) {
            console.error('❌ Error ensuring user consistency on sign in:', error)
            uiStore.getState().showToast('error', 'Failed to load user profile')
            // Keep session but clear user on error
            set({ error: 'Failed to load user profile', user: null, loading: false })
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out')
          set({ user: null, session: null, loading: false, error: null })
          uiStore.getState().showToast('success', 'Successfully signed out!')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed')
        }
      })

      console.log('✅ Auth store initialized')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('❌ Auth initialization error:', error)
      set({ error: message, loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      console.log('🔑 Attempting sign in for:', email)
      set({ loading: true, error: null })
      const { session } = await authService.signIn(email, password)
      console.log('📋 Sign in result - session:', session ? 'Exists' : 'None')

      if (session?.user) {
        console.log('👤 Ensuring user consistency after sign in...')
        const user = await authService.ensureUserConsistency(session.user)
        console.log('✅ Sign in user consistency ensured:', user.username)
        set({ user, session, loading: false })
        uiStore.getState().showToast('success', 'Successfully signed in!')
      } else {
        throw new Error('Sign in failed - no session returned')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      console.error('❌ Sign in error:', error)
      set({ error: message, loading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    try {
      console.log('📝 Attempting sign up for:', email, username)
      set({ loading: true, error: null })
      const authData = await authService.signUp(email, password, username)
      console.log('📋 Sign up result - session:', authData.session ? 'Exists' : 'None')

      if (authData.session?.user) {
        console.log('✅ Signup successful - auth state listener will handle user consistency')
        set({ session: authData.session, loading: false })
        // Note: User consistency is handled by onAuthStateChange listener
      } else {
        console.log('⚠️ Sign up succeeded but no immediate session (email confirmation may be required)')
        set({ loading: false })
        uiStore.getState().showToast('success', 'Account created! Please check your email.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed'
      console.error('❌ Sign up error:', error)
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

