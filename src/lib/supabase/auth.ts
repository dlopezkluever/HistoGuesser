import { supabase } from './client'
import type { User } from '@/types/user'

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, username: string) {
  // Validate inputs before sending to Supabase
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address')
  }
  
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters long')
  }

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username, // Store username in metadata
      },
    },
  })

  if (authError) {
    // Extract user-friendly error message
    let errorMessage = authError.message || 'Sign up failed'
    
    // Handle specific Supabase errors
    if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
      errorMessage = 'This email is already registered. Please sign in instead.'
    } else if (authError.message.includes('password') || authError.message.includes('422')) {
      errorMessage = 'Password must be at least 6 characters long and meet security requirements.'
    } else if (authError.message.includes('email')) {
      errorMessage = 'Please enter a valid email address.'
    }
    
    throw new Error(errorMessage)
  }
  
  if (!authData.user) {
    throw new Error('User creation failed. Please try again.')
  }

  // Create user profile in database
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    username,
  })

  if (profileError) {
    // If profile creation fails, try to clean up auth user
    console.error('Profile creation failed:', profileError)
    
    // Check if it's a duplicate username
    if (profileError.code === '23505' || profileError.message.includes('unique')) {
      throw new Error('This username is already taken. Please choose another.')
    }
    
    throw new Error('Failed to create user profile. Please try again.')
  }

  // Initialize player stats
  const { error: statsError } = await supabase.from('player_stats').insert({
    user_id: authData.user.id,
  })

  if (statsError) {
    console.error('Stats initialization failed:', statsError)
    // Don't fail signup if stats fail - user can still log in
    // Stats will be created on first game play
  }

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

