// @ts-nocheck - Supabase types don't recognize custom RPC functions and some database operations
import { supabase } from './client'
import type { Figure } from '@/types/figure'
import type { PlayerStats } from '@/types/user'
import type { LeaderboardEntry } from '@/types/score'

/**
 * Fetch random figures for Free Play mode
 */
export async function getRandomFigures(count: number = 10): Promise<Figure[]> {
  console.log('🎭 Loading random figures for Free Play...')

  try {
    // First, test basic connectivity
    console.log('🔍 Testing database connectivity...')
    const { data: testData, error: testError } = await supabase
      .from('figures')
      .select('count', { count: 'exact', head: true })

    if (testError) {
      console.error('❌ Database connectivity test failed:', testError)
      throw new Error(`Database connection failed: ${testError.message}`)
    }

    console.log(`📊 Database connectivity OK - found ${testData} total figures`)

    // Now try to fetch actual figures
    console.log('📥 Fetching figure data...')
    const { data, error } = await supabase
      .from('figures')
      .select('id, name, aliases, images, birth_year, death_year, active_year, hometown, lat, lon, description, tags')
      .limit(count * 3)

    if (error) {
      console.error('❌ Error loading figures:', error)
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })

      if (error.code === 'PGRST116') {
        throw new Error('Access denied: You do not have permission to view figures. Please check RLS policies.')
      }

      throw error
    }

    if (!data) {
      console.error('❌ Query returned null data')
      throw new Error('Query returned null data')
    }

    if (data.length === 0) {
      console.error('❌ No figures available in database')
      throw new Error('No figures available in database')
    }

    console.log(`✅ Successfully loaded ${data.length} figures from database`)
    console.log('📋 Sample figure:', data[0])

    // Randomly shuffle and select count figures
    const shuffled = data.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))
    console.log(`🎲 Selected ${selected.length} random figures for game`)

    return selected as Figure[]
  } catch (error) {
    console.error('💥 getRandomFigures failed completely:', error)

    if (error instanceof Error) {
      console.error('💥 Error message:', error.message)
      console.error('💥 Error stack:', error.stack)
    }

    throw error
  }
}

/**
 * Fetch figures for Daily Challenge (deterministic based on date)
 * Uses database function to ensure consistency across all players
 */
export async function getDailyChallengeFigures(date: string): Promise<Figure[]> {
  // Call database function to get or create daily challenge
  // @ts-ignore - Custom RPC function not in generated types
  const { data: challengeData, error: challengeError } = await supabase
    .rpc('get_or_create_daily_challenge', { target_date: date })

  if (challengeError) throw challengeError
  if (!challengeData || challengeData.length === 0) {
    throw new Error('Failed to get daily challenge')
  }

  const figureIds: string[] = challengeData[0].figure_ids

  // Fetch the actual figure data
  const { data: figures, error: figuresError } = await supabase
    .from('figures')
    .select('*')
    .in('id', figureIds)

  if (figuresError) throw figuresError
  if (!figures || figures.length !== 10) {
    throw new Error('Failed to load all daily challenge figures')
  }

  // Return figures in the order specified by the challenge
  // @ts-ignore - TypeScript doesn't know about the id property from the database
  const figureMap = new Map(figures.map(f => [f.id, f]))
  return figureIds.map(id => figureMap.get(id)!)
}

/**
 * Fetch a specific figure by ID
 */
export async function getFigureById(id: string): Promise<Figure> {
  const { data, error } = await supabase.from('figures').select('*').eq('id', id).single()

  if (error) throw error
  if (!data) throw new Error('Figure not found')
  return data
}

/**
 * Fetch player statistics
 */
export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Player stats not found')
  return data
}

/**
 * Update player statistics
 */
export async function updatePlayerStats(
  userId: string,
  updates: Partial<PlayerStats>
): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from('player_stats')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update player stats after completing a game
 * Note: For Daily Challenge, stats are updated by submitDailyScore function
 * This function is primarily for Free Play mode
 */
export async function updateStatsAfterGame(
  userId: string,
  gameScore: number,
  gameMode: string
): Promise<PlayerStats> {
  // Only update stats for logged-in users
  if (!userId) {
    throw new Error('User ID required')
  }

  // For Daily Challenge, stats are handled by submitDailyScore
  if (gameMode === 'daily') {
    return await getPlayerStats(userId)
  }

  // Get current stats (create if doesn't exist)
  let currentStats: PlayerStats
  try {
    currentStats = await getPlayerStats(userId)
  } catch {
    // Stats don't exist, create them
    // @ts-ignore - TypeScript doesn't understand the player_stats insert structure
    const { data: newStats, error: createError } = await supabase
      .from('player_stats')
      .insert({
        user_id: userId,
        total_games: 0,
        best_score: 0,
        daily_streak: 0,
      })
      .select()
      .single()

    if (createError) throw createError
    currentStats = newStats
  }

  // Calculate updates for Free Play
  const updates: Partial<PlayerStats> = {
    total_games: currentStats.total_games + 1,
  }

  // Update best score if this game is better
  if (gameScore > currentStats.best_score) {
    updates.best_score = gameScore
  }

  // Apply updates
  // @ts-ignore - TypeScript doesn't understand the partial update structure
  return await updatePlayerStats(userId, updates)
}

/**
 * Submit Daily Challenge score with validation and stats updates
 */
export async function submitDailyScore(
  userId: string,
  challengeDate: string,
  score: number
): Promise<{ success: boolean; message: string; score: number }> {
  // Use database function for validation and submission
  // @ts-ignore - Custom RPC function not in generated types
  const { data, error } = await supabase
    .rpc('submit_daily_score', {
      user_uuid: userId,
      target_date: challengeDate,
      submitted_score: score
    })

  if (error) throw error

  if (!data || data.length === 0) {
    throw new Error('Failed to submit score')
  }

  return {
    success: data[0].success,
    message: data[0].message,
    score: data[0].final_score
  }
}

/**
 * Check if user has completed today's Daily Challenge
 */
export async function hasCompletedDailyChallenge(
  userId: string,
  date: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('daily_scores')
    .select('id')
    .eq('user_id', userId)
    .eq('challenge_date', date)
    .maybeSingle()

  if (error) throw error
  return !!data
}

/**
 * Fetch Daily Challenge leaderboard
 */
export async function getDailyLeaderboard(
  date: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('daily_scores')
    .select(
      `
      score,
      completed_at,
      users!inner (
        id,
        username,
        avatar_url
      )
    `
    )
    .eq('challenge_date', date)
    .order('score', { ascending: false })
    .order('completed_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  return (
    data?.map((entry: any, index: number) => ({
      rank: index + 1,
      user_id: entry.users.id,
      username: entry.users.username,
      avatar_url: entry.users.avatar_url,
      score: entry.score,
      completed_at: entry.completed_at,
    })) || []
  )
}

/**
 * Get user's daily challenge status and stats
 */
export async function getDailyChallengeStatus(
  userId: string,
  date: string
): Promise<{
  hasCompleted: boolean
  score: number
  completedAt: string | null
  currentStreak: number
  bestScore: number
}> {
  // @ts-ignore - Custom RPC function not in generated types
  const { data, error } = await supabase
    .rpc('get_daily_challenge_status', {
      user_uuid: userId,
      target_date: date
    })

  if (error) throw error

  if (!data || data.length === 0) {
    return {
      hasCompleted: false,
      score: 0,
      completedAt: null,
      currentStreak: 0,
      bestScore: 0
    }
  }

  return {
    hasCompleted: data[0].has_completed,
    score: data[0].score,
    completedAt: data[0].completed_at,
    currentStreak: data[0].current_streak,
    bestScore: data[0].best_score
  }
}

/**
 * Get user's rank in Daily Challenge leaderboard
 */
export async function getUserDailyRank(userId: string, date: string): Promise<number | null> {
  // @ts-ignore - TypeScript doesn't know about the score and completed_at properties
  const { data: userScore, error: userError } = await supabase
    .from('daily_scores')
    .select('score, completed_at')
    .eq('user_id', userId)
    .eq('challenge_date', date)
    .single()

  if (userError || !userScore) return null

  const scoreData = userScore as { score: number; completed_at: string }

  const { count, error: countError } = await supabase
    .from('daily_scores')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_date', date)
    .or(
      `score.gt.${scoreData.score},and(score.eq.${scoreData.score},completed_at.lt.${scoreData.completed_at})`
    )

  if (countError) return null
  return (count || 0) + 1
}


