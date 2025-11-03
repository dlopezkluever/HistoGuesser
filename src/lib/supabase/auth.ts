import { supabase } from './client'
import type { User } from '@/types/user'

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, username: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('User creation failed')

  // Create user profile
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    username,
  })

  if (profileError) throw profileError

  // Initialize player stats
  const { error: statsError } = await supabase.from('player_stats').insert({
    user_id: authData.user.id,
  })

  if (statsError) throw statsError

  return authData
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/**
 * Get the current user profile
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error) throw error
  return data
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: { username?: string; avatar_url?: string }
) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (error) throw error
  return !data
}

