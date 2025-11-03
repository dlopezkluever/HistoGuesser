/**
 * Supabase database schema types
 * Generated types for type-safe database queries
 */

export interface Database {
  public: {
    Tables: {
      figures: {
        Row: {
          id: string
          name: string
          aliases: string[]
          images: any // JSONB
          birth_year: number
          death_year: number | null
          active_year: number | null
          hometown: string
          lat: number
          lon: number
          description: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          aliases?: string[]
          images: any
          birth_year: number
          death_year?: number | null
          active_year?: number | null
          hometown: string
          lat: number
          lon: number
          description: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          aliases?: string[]
          images?: any
          birth_year?: number
          death_year?: number | null
          active_year?: number | null
          hometown?: string
          lat?: number
          lon?: number
          description?: string
          tags?: string[]
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          username?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          user_id: string
          total_games: number
          best_score: number
          daily_streak: number
          last_daily_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_games?: number
          best_score?: number
          daily_streak?: number
          last_daily_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          total_games?: number
          best_score?: number
          daily_streak?: number
          last_daily_date?: string | null
          updated_at?: string
        }
      }
      daily_scores: {
        Row: {
          id: string
          user_id: string
          challenge_date: string
          score: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_date: string
          score: number
          completed_at?: string
        }
        Update: {
          score?: number
        }
      }
      lobbies: {
        Row: {
          id: string
          room_code: string
          host_id: string
          status: 'waiting' | 'in_progress' | 'finished'
          current_round: number
          figure_ids: string[]
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          room_code: string
          host_id: string
          status?: 'waiting' | 'in_progress' | 'finished'
          current_round?: number
          figure_ids: string[]
          created_at?: string
          expires_at: string
        }
        Update: {
          status?: 'waiting' | 'in_progress' | 'finished'
          current_round?: number
          figure_ids?: string[]
        }
      }
      lobby_players: {
        Row: {
          id: string
          lobby_id: string
          user_id: string
          username: string
          score: number
          ready: boolean
          connected: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          user_id: string
          username: string
          score?: number
          ready?: boolean
          connected?: boolean
          joined_at?: string
        }
        Update: {
          score?: number
          ready?: boolean
          connected?: boolean
        }
      }
      lobby_submissions: {
        Row: {
          id: string
          lobby_id: string
          user_id: string
          round_number: number
          figure_id: string
          guessed_name: string
          guessed_lat: number
          guessed_lon: number
          guessed_year: number
          submission_time: number
          score: number
          submitted_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          user_id: string
          round_number: number
          figure_id: string
          guessed_name: string
          guessed_lat: number
          guessed_lon: number
          guessed_year: number
          submission_time: number
          score: number
          submitted_at?: string
        }
        Update: {
          score?: number
        }
      }
    }
  }
}

