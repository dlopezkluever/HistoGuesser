// Test script for database connectivity and RLS policies
// Run this in browser console: import('./src/lib/supabase/test-connection.ts').then(m => m.testConnection())

import { supabase } from './client'

export async function testConnection() {
  console.log('🧪 Testing database connection and RLS policies...')

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...')
    const { data: countData, error: countError } = await supabase
      .from('figures')
      .select('count', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Basic connectivity failed:', countError)
      return false
    }

    console.log(`✅ Basic connectivity OK - found ${countData} figures`)

    // Test 2: Anonymous read access to figures
    console.log('2️⃣ Testing anonymous read access to figures...')
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

    console.log('✅ Anonymous access to figures OK:', figuresData?.[0])

    // Test 3: Check current auth status
    console.log('3️⃣ Checking authentication status...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Auth session check failed:', sessionError)
    } else {
      console.log('✅ Auth session check OK:', sessionData.session ? 'Authenticated' : 'Anonymous')
    }

    // Test 4: Try authenticated-only access (should fail for anonymous)
    console.log('4️⃣ Testing authenticated-only access (should fail for anonymous)...')
    const { data: statsData, error: statsError } = await supabase
      .from('player_stats')
      .select('count', { count: 'exact', head: true })

    if (statsError) {
      if (statsError.code === 'PGRST116') {
        console.log('✅ Correctly blocked anonymous access to player_stats')
      } else {
        console.error('❌ Unexpected error accessing player_stats:', statsError)
      }
    } else {
      console.log('⚠️ Anonymous user could access player_stats (this might be OK)')
    }

    console.log('🎉 All tests completed!')
    return true

  } catch (error) {
    console.error('💥 Test script failed:', error)
    return false
  }
}

// Auto-run when imported
if (typeof window !== 'undefined') {
  console.log('🔧 Database test utility loaded. Run: testConnection()')
  // @ts-ignore
  window.testConnection = testConnection
}
