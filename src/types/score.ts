/**
 * Score component breakdown
 */
export interface ScoreComponents {
  spatial: number // 0-800
  temporal: number // 0-800
  name: number // 0-800
  speed: number // 0-100
}

/**
 * Daily challenge score entry
 */
export interface DailyScore {
  id: string
  user_id: string
  challenge_date: string
  score: number
  completed_at: string
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  score: number
  completed_at: string
}

/**
 * Name matching confidence levels
 */
export type NameMatchConfidence = 'exact' | 'high' | 'medium' | 'low' | 'none'

/**
 * Name match result
 */
export interface NameMatchResult {
  confidence: NameMatchConfidence
  score: number // 0, 200, 400, 600, or 800
  matched_alias?: string
}

