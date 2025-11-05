// Test script for database connectivity and RLS policies
// Run this in browser console: import('./src/lib/supabase/test-connection.ts').then(m => m.testConnection())

import { supabase } from './client'

export async function testConnection() {
  try {
    // Test 1: Basic connectivity
    const { data: countData, error: countError } = await supabase
      .from('figures')
      .select('count', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Basic connectivity failed:', countError)
      return false
    }

    // Test 2: Anonymous read access to figures
    const { data: figuresData, error: figuresError } = await supabase
      .from('figures')
      .select('id, name, birth_year')
      .limit(1)

    if (figuresError) {
      console.error('❌ Anonymous access to figures failed:', figuresError)

      if (figuresError.code === 'PGRST116') {
        console.error('🚫 This indicates RLS policy is blocking anonymous access!')
        console.error('🔧 Run the migration: supabase/migrations/008_complete_fix.sql')
      }

      return false
    }

    // Test 3: Check current auth status
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Auth session check failed:', sessionError)
    }

    // Test 4: Try authenticated-only access (should fail for anonymous)
    const { error: statsError } = await supabase
      .from('player_stats')
      .select('count', { count: 'exact', head: true })

    if (statsError) {
      if (statsError.code === 'PGRST116') {
        // Correctly blocked anonymous access to player_stats
      } else {
        console.error('❌ Unexpected error accessing player_stats:', statsError)
      }
    }

    return true

  } catch (error) {
    console.error('💥 Test script failed:', error)
    return false
  }
}

