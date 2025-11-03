/**
 * User profile data
 */
export interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Player statistics
 */
export interface PlayerStats {
  user_id: string
  total_games: number
  best_score: number
  daily_streak: number
  last_daily_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Auth state
 */
export interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  error: string | null
}

