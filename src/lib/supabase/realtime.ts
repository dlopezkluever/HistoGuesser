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

  // Also subscribe to broadcast events for player joins (fallback)
  channel.on('broadcast', { event: 'player_joined' }, (payload) => {
    console.log('📢 REALTIME: Player joined lobby via broadcast', payload.payload)
    callbacks.onPlayerJoined?.(payload.payload)
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

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'lobby_players',
      filter: `lobby_id=eq.${lobbyId}`,
    },
    (payload) => {
      if (payload.new.ready && !payload.old.ready) {
        callbacks.onPlayerReady?.(payload.new.id)
      }
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
      if (payload.new.status === 'in_progress' && payload.old.status === 'waiting') {
        callbacks.onGameStarted?.()
      }

      if (payload.new.current_round !== payload.old.current_round) {
        callbacks.onRoundStarted?.(payload.new.current_round)
      }

      if (payload.new.status === 'finished') {
        callbacks.onGameEnded?.(null)
      }
    }
  )

  // Subscribe to submissions
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'lobby_submissions',
      filter: `lobby_id=eq.${lobbyId}`,
    },
    (payload) => {
      callbacks.onSubmissionReceived?.(payload.new)
    }
  )

  channel.subscribe((status) => {
    console.log(`📡 Channel subscription status for lobby:${lobbyId}:`, status)
    if (status === 'SUBSCRIBED') {
      console.log(`✅ Successfully subscribed to lobby:${lobbyId}`)
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`❌ Channel error for lobby:${lobbyId}`)
    } else if (status === 'TIMED_OUT') {
      console.error(`⏰ Channel timed out for lobby:${lobbyId}`)
    } else if (status === 'CLOSED') {
      console.log(`🔌 Channel closed for lobby:${lobbyId}`)
    }
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

