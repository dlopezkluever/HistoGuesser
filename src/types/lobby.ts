/**
 * Lobby status
 */
export type LobbyStatus = 'waiting' | 'in_progress' | 'finished'

/**
 * Lobby data structure
 */
export interface Lobby {
  id: string
  room_code: string
  host_id: string
  status: LobbyStatus
  current_round: number
  figure_ids: string[]
  created_at: string
  expires_at: string
}

/**
 * Lobby player
 */
export interface LobbyPlayer {
  id: string
  lobby_id: string
  user_id: string
  username: string
  score: number
  ready: boolean
  connected: boolean
  joined_at: string
}

/**
 * Player submission in multiplayer
 */
export interface LobbySubmission {
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

/**
 * Realtime lobby event types
 */
export type LobbyEventType =
  | 'player_joined'
  | 'player_left'
  | 'player_ready'
  | 'game_started'
  | 'round_started'
  | 'submission_received'
  | 'round_ended'
  | 'game_ended'

/**
 * Realtime lobby event
 */
export interface LobbyEvent {
  type: LobbyEventType
  lobby_id: string
  data: any
  timestamp: string
}

