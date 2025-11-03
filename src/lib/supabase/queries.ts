import { supabase } from './client'
import type { Figure } from '@/types/figure'
import type { PlayerStats } from '@/types/user'
import type { DailyScore, LeaderboardEntry } from '@/types/score'

/**
 * Fetch random figures for Free Play mode
 */
export async function getRandomFigures(count: number = 10): Promise<Figure[]> {
  // Note: In production, this should use a proper random sampling method
  // For now, we'll fetch all figures and randomly select
  const { data, error } = await supabase.from('figures').select('*').limit(count * 3)

  if (error) throw error
  if (!data || data.length === 0) throw new Error('No figures available')

  // Randomly shuffle and select count figures
  const shuffled = data.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Fetch figures for Daily Challenge (deterministic based on date)
 */
export async function getDailyChallengeFigures(date: string): Promise<Figure[]> {
  // Implement deterministic selection based on date
  // For MVP, we'll use a simple hash of the date to seed selection
  const seed = hashString(date)

  const { data, error } = await supabase.from('figures').select('*')

  if (error) throw error
  if (!data || data.length < 10) throw new Error('Insufficient figures for daily challenge')

  // Deterministic shuffle using seed
  const shuffled = deterministicShuffle(data, seed)
  return shuffled.slice(0, 10)
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
 * Submit Daily Challenge score
 */
export async function submitDailyScore(
  userId: string,
  challengeDate: string,
  score: number
): Promise<DailyScore> {
  const { data, error } = await supabase
    .from('daily_scores')
    .insert({
      user_id: userId,
      challenge_date: challengeDate,
      score,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
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
 * Get user's rank in Daily Challenge leaderboard
 */
export async function getUserDailyRank(userId: string, date: string): Promise<number | null> {
  const { data: userScore, error: userError } = await supabase
    .from('daily_scores')
    .select('score, completed_at')
    .eq('user_id', userId)
    .eq('challenge_date', date)
    .single()

  if (userError || !userScore) return null

  const { count, error: countError } = await supabase
    .from('daily_scores')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_date', date)
    .or(
      `score.gt.${userScore.score},and(score.eq.${userScore.score},completed_at.lt.${userScore.completed_at})`
    )

  if (countError) return null
  return (count || 0) + 1
}

// Helper functions

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function deterministicShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]
  let currentSeed = seed

  for (let i = shuffled.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const j = Math.floor((currentSeed / 233280) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

