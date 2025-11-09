import { supabase } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Subscribe to a lobby's realtime updates
 */
export function subscribeLobby(
  lobbyId: string,
  callbacks: {
    onPlayerJoined?: (player: any) => void
    onPlayerLeft?: (playerId: string) => void
    onPlayerReady?: (playerId: string) => void
    onGameStarted?: () => void
    onRoundStarted?: (roundNumber: number) => void
    onSubmissionReceived?: (submission: any) => void
    onRoundEnded?: (scores: any) => void
    onGameEnded?: (finalScores: any) => void
  }
): RealtimeChannel {
  const channel = supabase.channel(`lobby:${lobbyId}`)
  console.log(`📡 Subscribing to channel: lobby:${lobbyId}`)

  // Subscribe to lobby_players table changes
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'lobby_players',
      filter: `lobby_id=eq.${lobbyId}`,
    },
    (payload) => {
      console.log('🔄 REALTIME: Player joined lobby via postgres_changes', payload.new)
      callbacks.onPlayerJoined?.(payload.new)
    }
  )

  // Subscribe to player ready status updates
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'lobby_players',
      filter: `lobby_id=eq.${lobbyId}`,
    },
    (payload) => {
      console.log('🔄 REALTIME: Player updated via postgres_changes', payload.new)
      console.log('🔄 REALTIME: About to call onPlayerReady callback with user_id:', payload.new.user_id)
      try {
        callbacks.onPlayerReady?.(payload.new.user_id)
        console.log('🔄 REALTIME: onPlayerReady callback called successfully')
      } catch (error) {
        console.error('🔄 REALTIME: Error calling onPlayerReady callback:', error)
      }
    }
  )

  // Also subscribe to broadcast events for player joins (fallback)
  channel.on('broadcast', { event: 'player_joined' }, (payload) => {
    console.log('📢 REALTIME: Player joined lobby via broadcast', payload.payload)
    callbacks.onPlayerJoined?.(payload.payload)
  })

  // Subscribe to broadcast events for ready status updates (fallback)
  channel.on('broadcast', { event: 'player_ready' }, (payload) => {
    console.log('📢 REALTIME: Player ready status updated via broadcast', payload.payload)
    console.log('📢 REALTIME: About to call onPlayerReady callback with userId:', payload.payload.userId)
    try {
      callbacks.onPlayerReady?.(payload.payload.userId)
      console.log('📢 REALTIME: onPlayerReady callback called successfully')
    } catch (error) {
      console.error('📢 REALTIME: Error calling onPlayerReady callback:', error)
    }
  })

  // Subscribe to broadcast events for game started (primary mechanism)
  channel.on('broadcast', { event: 'game_started' }, (payload) => {
    console.log('📢 REALTIME: Game started via broadcast', payload.payload)
    console.log('🎮 REALTIME: Game started broadcast received - calling onGameStarted')
    try {
      callbacks.onGameStarted?.()
      console.log('🎮 REALTIME: onGameStarted callback completed successfully')
    } catch (error) {
      console.error('🎮 REALTIME: Error calling onGameStarted callback:', error)
    }
  })

  channel.on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'lobby_players',
      filter: `lobby_id=eq.${lobbyId}`,
    },
    (payload) => {
      callbacks.onPlayerLeft?.(payload.old.id)
    }
  )

  // Subscribe to lobby table changes
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'lobbies',
      filter: `id=eq.${lobbyId}`,
    },
    (payload) => {
      console.log('🔄 REALTIME: Lobby updated via postgres_changes', {
        old: { status: payload.old.status, round: payload.old.current_round },
        new: { status: payload.new.status, round: payload.new.current_round }
      })

      if (payload.new.status === 'in_progress' && payload.old.status === 'waiting') {
        console.log('🎮 REALTIME: Game started condition met, calling onGameStarted')
        try {
          callbacks.onGameStarted?.()
          console.log('🎮 REALTIME: onGameStarted callback completed')
        } catch (error) {
          console.error('🎮 REALTIME: Error in onGameStarted callback:', error)
        }
      }

      if (payload.new.current_round !== payload.old.current_round) {
        console.log('🎲 REALTIME: Round changed, calling onRoundStarted')
        callbacks.onRoundStarted?.(payload.new.current_round)
      }

      if (payload.new.status === 'finished') {
        console.log('🏁 REALTIME: Game finished, calling onGameEnded')
        callbacks.onGameEnded?.(null)
      }
    }
  )

  // Subscribe to submissions (primary: postgres_changes)
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'lobby_submissions',
      filter: `lobby_id=eq.${lobbyId}`,
    },
    (payload) => {
      console.log('📨 REALTIME: Submission INSERT detected:', payload.new)
      console.log('📨 REALTIME: About to call onSubmissionReceived callback')
      try {
        callbacks.onSubmissionReceived?.(payload.new)
        console.log('📨 REALTIME: onSubmissionReceived callback completed successfully')
      } catch (error) {
        console.error('📨 REALTIME: Error calling onSubmissionReceived callback:', error)
      }
    }
  )

  // Subscribe to submission broadcasts (fallback)
  channel.on('broadcast', { event: 'submission_received' }, (payload) => {
    console.log('📢 REALTIME: Submission received via broadcast:', payload.payload)
    console.log('📨 REALTIME: About to call onSubmissionReceived callback via broadcast')
    try {
      callbacks.onSubmissionReceived?.(payload.payload)
      console.log('📨 REALTIME: onSubmissionReceived callback completed successfully via broadcast')
    } catch (error) {
      console.error('📨 REALTIME: Error calling onSubmissionReceived callback via broadcast:', error)
    }
  })

  channel.subscribe((status, err) => {
    console.log(`📡 Channel subscription status for lobby:${lobbyId}:`, status, err ? `Error: ${err}` : '')

    if (status === 'SUBSCRIBED') {
      console.log(`✅ Successfully subscribed to lobby:${lobbyId}`)
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`❌ Channel error for lobby:${lobbyId}:`, err)
      // Try to resubscribe after a delay
      setTimeout(() => {
        console.log(`🔄 Attempting to resubscribe to lobby:${lobbyId}`)
        channel.subscribe((retryStatus, retryErr) => {
          console.log(`📡 Retry subscription status for lobby:${lobbyId}:`, retryStatus, retryErr ? `Error: ${retryErr}` : '')
        })
      }, 2000)
    } else if (status === 'TIMED_OUT') {
      console.error(`⏰ Channel timed out for lobby:${lobbyId}:`, err)
    } else if (status === 'CLOSED') {
      console.log(`🔌 Channel closed for lobby:${lobbyId}:`, err)
      // Don't try to resubscribe on explicit close
    }
  })

  // Add connection state monitoring
  channel.on('system', { event: 'CHANNEL_JOIN' }, () => {
    console.log(`🔗 Channel joined for lobby:${lobbyId}`)
  })

  channel.on('system', { event: 'CHANNEL_LEAVE' }, () => {
    console.log(`👋 Channel left for lobby:${lobbyId}`)
  })

  channel.on('system', { event: 'CHANNEL_ERROR' }, (error) => {
    console.error(`💥 Channel system error for lobby:${lobbyId}:`, error)
  })

  return channel
}

/**
 * Unsubscribe from a lobby channel
 */
export function unsubscribeLobby(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}

/**
 * Broadcast a custom event to lobby participants
 */
export async function broadcastLobbyEvent(lobbyId: string, event: string, payload: any) {
  const channel = supabase.channel(`lobby:${lobbyId}`)
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

