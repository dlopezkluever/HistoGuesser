import { supabase, supabaseUntyped } from './client'
import type { Figure } from '@/types/figure'
import type { PlayerStats } from '@/types/user'
import type { LeaderboardEntry } from '@/types/score'
import type { Lobby, LobbyPlayer, LobbySubmission } from '@/types/lobby'

/**
 * Fetch random figures for Free Play mode
 */
export async function getRandomFigures(count: number = 10): Promise<Figure[]> {
  try {
    // First, test basic connectivity
    const { error: testError } = await supabase
      .from('figures')
      .select('count', { count: 'exact', head: true })

    if (testError) {
      console.error('❌ Database connectivity test failed:', testError)
      throw new Error(`Database connection failed: ${testError.message}`)
    }

    // Now try to fetch actual figures
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

    // Randomly shuffle and select count figures
    const shuffled = data.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))

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
  const { data: challengeData, error: challengeError } = await supabase
    .rpc('get_or_create_daily_challenge', { target_date: date })

  if (challengeError) throw challengeError
  // @ts-expect-error - RPC function return type not recognized by generated types
  if (!challengeData || challengeData.length === 0) {
    throw new Error('Failed to get daily challenge')
  }

  // @ts-expect-error - RPC function return type not recognized by generated types
  const figureIds: string[] = challengeData[0].figure_ids

  // Fetch the actual figure data
  const { data: figures, error: figuresError } = await supabase
    .from('figures')
    .select('id, name, aliases, images, birth_year, death_year, active_year, hometown, lat, lon, description, tags, created_at, updated_at')
    .in('id', figureIds)

  if (figuresError) throw figuresError
  if (!figures || figures.length !== 10) {
    throw new Error('Failed to load all daily challenge figures')
  }

  // Return figures in the order specified by the challenge
  // @ts-expect-error - TypeScript doesn't know about the id property from the database
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
    // @ts-expect-error - TypeScript doesn't recognize the player_stats update structure
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
    const { data: newStats, error: createError } = await supabase
      .from('player_stats')
      // @ts-expect-error - TypeScript doesn't understand the player_stats insert structure
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
  const { data, error } = await supabase
    // @ts-expect-error - Custom RPC function not in generated types
    .rpc('submit_daily_score', {
      user_uuid: userId,
      target_date: challengeDate,
      submitted_score: score
    })

  if (error) throw error

  // @ts-expect-error - RPC function return type not recognized by generated types
  if (!data || data.length === 0) {
    throw new Error('Failed to submit score')
  }

  // @ts-expect-error - RPC function return type not recognized by generated types
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
  const { data, error } = await supabase
    // @ts-expect-error - Custom RPC function not in generated types
    .rpc('get_daily_challenge_status', {
      user_uuid: userId,
      target_date: date
    })

  if (error) throw error

  // @ts-expect-error - RPC function return type not recognized by generated types
  if (!data || data.length === 0) {
    return {
      hasCompleted: false,
      score: 0,
      completedAt: null,
      currentStreak: 0,
      bestScore: 0
    }
  }

  // @ts-expect-error - RPC function return type not recognized by generated types
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

// =====================================================
// LOBBY MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Create a new multiplayer lobby
 */
export async function createLobby(hostId: string, hostUsername: string): Promise<Lobby> {
  // Generate random room code
  const { data: codeData, error: codeError } = await supabase
    .rpc('generate_room_code')

  if (codeError) throw codeError
  const roomCode = codeData as string

  // Select 10 random figures
  const figures = await getRandomFigures(10)
  const figureIds = figures.map(f => f.id)

  // Set expiration to 24 hours from now
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { data, error } = await supabaseUntyped
    .from('lobbies')
    .insert({
      room_code: roomCode,
      host_id: hostId,
      figure_ids: figureIds,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) throw error
  const lobby = data as Lobby

  // Add the host as the first player
  const { error: playerError } = await supabaseUntyped
    .from('lobby_players')
    .insert({
      lobby_id: lobby.id,
      user_id: hostId,
      username: hostUsername
    })

  if (playerError) throw playerError

  return lobby
}

/**
 * Join an existing lobby
 */
export async function joinLobby(userId: string, username: string, roomCode: string): Promise<{ lobby: Lobby; player: LobbyPlayer }> {
  // Find the lobby
  const { data: lobby, error: lobbyError } = await supabaseUntyped
    .from('lobbies')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .single()

  if (lobbyError) {
    if (lobbyError.code === 'PGRST116') {
      throw new Error('Lobby not found')
    }
    throw lobbyError
  }

  if (lobby.status !== 'waiting') {
    throw new Error('Game has already started')
  }

  // Check player capacity (max 8)
  const { count: playerCount, error: countError } = await supabaseUntyped
    .from('lobby_players')
    .select('*', { count: 'exact', head: true })
    .eq('lobby_id', lobby.id)

  if (countError) throw countError
  if (playerCount && playerCount >= 8) {
    throw new Error('Lobby is full (maximum 8 players)')
  }

  // Check if user is already in the lobby
  const { data: existingPlayer, error: existingError } = await supabaseUntyped
    .from('lobby_players')
    .select('*')
    .eq('lobby_id', lobby.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existingPlayer) {
    throw new Error('You are already in this lobby')
  }

  // Add player to lobby
  const { data: player, error: playerError } = await supabaseUntyped
    .from('lobby_players')
    .insert({
      lobby_id: lobby.id,
      user_id: userId,
      username: username
    })
    .select()
    .single()

  if (playerError) throw playerError

  return {
    lobby: lobby as Lobby,
    player: player as LobbyPlayer
  }
}

/**
 * Get lobby details with players
 */
export async function getLobbyWithPlayers(lobbyId: string): Promise<{ lobby: Lobby; players: LobbyPlayer[] }> {
  const { data: lobby, error: lobbyError } = await supabaseUntyped
    .from('lobbies')
    .select('*')
    .eq('id', lobbyId)
    .single()

  if (lobbyError) throw lobbyError

  const { data: players, error: playersError } = await supabaseUntyped
    .from('lobby_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })

  if (playersError) throw playersError

  return {
    lobby: lobby as Lobby,
    players: players as LobbyPlayer[]
  }
}

/**
 * Start a multiplayer game
 */
export async function startGame(lobbyId: string, hostId: string): Promise<void> {
  // Verify user is the host
  const { data: lobby, error: lobbyError } = await supabaseUntyped
    .from('lobbies')
    .select('host_id')
    .eq('id', lobbyId)
    .single()

  if (lobbyError) throw lobbyError
  if (lobby.host_id !== hostId) {
    throw new Error('Only the host can start the game')
  }

  // Check that all players are ready
  const { data: players, error: playersError } = await supabaseUntyped
    .from('lobby_players')
    .select('ready')
    .eq('lobby_id', lobbyId)

  if (playersError) throw playersError
  const allReady = players.every(player => player.ready)
  if (!allReady) {
    throw new Error('All players must be ready before starting')
  }

  // Start the game
  const { error: startError } = await supabaseUntyped
    .from('lobbies')
    .update({
      status: 'in_progress',
      current_round: 1
    })
    .eq('id', lobbyId)

  if (startError) throw startError
}

/**
 * Submit a guess in multiplayer
 */
export async function submitMultiplayerGuess(
  lobbyId: string,
  userId: string,
  roundNumber: number,
  figureId: string,
  guessedName: string,
  guessedLat: number,
  guessedLon: number,
  guessedYear: number,
  submissionTime: number,
  score: number
): Promise<LobbySubmission> {
  const { data, error } = await supabaseUntyped
    .from('lobby_submissions')
    .insert({
      lobby_id: lobbyId,
      user_id: userId,
      round_number: roundNumber,
      figure_id: figureId,
      guessed_name: guessedName,
      guessed_lat: guessedLat,
      guessed_lon: guessedLon,
      guessed_year: guessedYear,
      submission_time: submissionTime,
      score: score
    })
    .select()
    .single()

  if (error) throw error
  return data as LobbySubmission
}

/**
 * Get submissions for a specific round
 */
export async function getRoundSubmissions(lobbyId: string, roundNumber: number): Promise<LobbySubmission[]> {
  const { data, error } = await supabaseUntyped
    .from('lobby_submissions')
    .select(`
      *,
      users!inner(username)
    `)
    .eq('lobby_id', lobbyId)
    .eq('round_number', roundNumber)
    .order('submitted_at', { ascending: true })

  if (error) throw error
  return data as LobbySubmission[]
}

/**
 * Update player ready status
 */
export async function updatePlayerReady(lobbyId: string, userId: string, ready: boolean): Promise<void> {
  const { error } = await supabaseUntyped
    .from('lobby_players')
    .update({ ready: ready })
    .eq('lobby_id', lobbyId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Leave a lobby
 */
export async function leaveLobby(lobbyId: string, userId: string): Promise<void> {
  const { error } = await supabaseUntyped
    .from('lobby_players')
    .delete()
    .eq('lobby_id', lobbyId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Advance to next round
 */
export async function advanceRound(lobbyId: string): Promise<void> {
  // Get current round
  const { data: lobby, error: lobbyError } = await supabaseUntyped
    .from('lobbies')
    .select('current_round')
    .eq('id', lobbyId)
    .single()

  if (lobbyError) throw lobbyError

  const nextRound = lobby.current_round + 1

  // If this was the last round, end the game
  if (nextRound > 10) {
    const { error: endError } = await supabaseUntyped
      .from('lobbies')
      .update({
        status: 'finished',
        current_round: 10
      })
      .eq('id', lobbyId)

    if (endError) throw endError
  } else {
    // Advance to next round
    const { error: advanceError } = await supabaseUntyped
      .from('lobbies')
      .update({ current_round: nextRound })
      .eq('id', lobbyId)

    if (advanceError) throw advanceError
  }
}

/**
 * Get final scores for a completed lobby
 */
export async function getFinalScores(lobbyId: string): Promise<{ user_id: string; username: string; score: number }[]> {
  const { data, error } = await supabaseUntyped
    .from('lobby_players')
    .select('user_id, username, score')
    .eq('lobby_id', lobbyId)
    .order('score', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Clean up finished lobbies (called by cron job)
 */
export async function cleanupFinishedLobbies(): Promise<void> {
  const { error } = await supabase.rpc('delete_expired_lobbies')
  if (error) throw error
}


