import { supabase } from './client'
import type { User } from '@/types/user'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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

  // Note: User profile creation is handled by the auth state listener
  // via ensureUserConsistency() to avoid race conditions

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
 * Sync user profile between auth.users and users table
 * Creates profile record if it doesn't exist and handles edge cases
 */
export async function syncUserProfile(authUser: SupabaseUser): Promise<User> {
  if (!authUser?.id) {
    throw new Error('No auth user provided')
  }

  try {
    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (existingProfile) {
      // Profile exists, update email if it changed (in case user updated email in auth)
      if (existingProfile.email !== authUser.email) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: authUser.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUser.id)

        if (updateError) {
          console.warn('Failed to update user email:', updateError)
        }
      }
      return existingProfile
    }

    // Profile doesn't exist, create it
    const username = authUser.user_metadata?.username ||
                     authUser.email?.split('@')[0] ||
                     `user_${authUser.id.slice(0, 8)}`

    // Ensure username is available
    const isAvailable = await isUsernameAvailable(username)
    const finalUsername = isAvailable ? username : `${username}_${Date.now().toString().slice(-4)}`

    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        username: finalUsername,
      })
      .select()
      .single()

    if (createError) {
      // Handle duplicate key errors (race condition)
      if (createError.code === '23505') {
        // Try to fetch the profile that was created by another request
        const { data: retryProfile, error: retryError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (retryProfile && !retryError) {
          return retryProfile
        }
      }
      throw createError
    }

    return newProfile
  } catch (error) {
    console.error('Error syncing user profile:', error)
    throw new Error('Failed to sync user profile. Please try logging out and back in.')
  }
}

/**
 * Ensure user data consistency across auth and profile tables
 * Call this after auth state changes to guarantee sync
 */
export async function ensureUserConsistency(authUser: SupabaseUser): Promise<User> {
  if (!authUser?.id) {
    throw new Error('No auth user provided for consistency check')
  }

  try {
    // First, ensure profile exists and is synced
    const profile = await syncUserProfile(authUser)

    // Ensure player stats exist
    const { error: statsError } = await supabase
      .from('player_stats')
      .upsert({
        user_id: authUser.id,
        // Other fields will use defaults
      }, {
        onConflict: 'user_id'
      })

    if (statsError) {
      console.warn('Failed to ensure player stats exist:', statsError)
      // Don't fail the whole operation for stats issues
    }

    return profile
  } catch (error) {
    console.error('Error ensuring user consistency:', error)
    throw error
  }
}

/**
 * Get the current user profile
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session?.user) return null

  try {
    // Try to get existing profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, sync it
      return await syncUserProfile(session.user)
    }

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting current user:', error)
    // If all else fails, try to sync the profile
    try {
      return await syncUserProfile(session.user)
    } catch (syncError) {
      console.error('Failed to sync user profile:', syncError)
      throw error
    }
  }
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

