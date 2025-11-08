import { ref, onUnmounted } from 'vue'
import { useLobbyStore } from '@/stores/lobbyStore'
import { authStore } from '@/stores/authStore'
import {
  createLobby,
  joinLobby,
  getLobbyWithPlayers,
  startGame,
  submitMultiplayerGuess,
  getRoundSubmissions,
  updatePlayerReady,
  leaveLobby,
  leaveAllLobbies
} from '@/lib/supabase/queries'
import { subscribeLobby, unsubscribeLobby } from '@/lib/supabase/realtime'
import { getFigureById } from '@/lib/supabase/queries'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useLobby() {
  console.log('🏗️ useLobby composable called')

  // Use Pinia store directly - native Vue reactivity!
  console.log('🏪 Initializing lobbyStore...')
  const lobbyStore = useLobbyStore()
  console.log('🏪 lobbyStore initialized:', {
    isLoading: lobbyStore.isLoading,
    currentLobby: lobbyStore.currentLobby,
    hasSetLoading: typeof lobbyStore.setLoading === 'function'
  })

  const realtimeChannel = ref<RealtimeChannel | null>(null)

  // Cleanup realtime subscription on unmount
  onUnmounted(() => {
    console.log('🧹 Cleaning up realtime subscription')
    if (realtimeChannel.value) {
      unsubscribeLobby(realtimeChannel.value)
      realtimeChannel.value = null
    }
  })

  const createNewLobby = async () => {
    console.log('🎯 createNewLobby called - checking auth...')
    const user = authStore.getState().user
    console.log('👤 Auth user:', user)

    if (!user) {
      console.error('❌ No user found - must be logged in')
      throw new Error('Must be logged in to create a lobby')
    }

    try {
      console.log('⏳ Setting loading state...')
      lobbyStore.setLoading(true)
      lobbyStore.setError(null)

      // Clean up any existing lobbies for this user
      console.log('🧹 Leaving any existing lobbies before creating new one')
      try {
        await leaveAllLobbies(user.id)
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup existing lobbies:', cleanupError)
        // Don't fail the creation if cleanup fails
      }

      console.log('🏗️ Creating lobby for user:', user.id, user.username)
      console.log('🔄 About to call createLobby...')
      const lobby = await createLobby(user.id, user.username || 'Anonymous')
      console.log('✅ createLobby returned:', lobby)

      // Get the lobby with players (just the host)
      const { lobby: lobbyWithPlayers, players } = await getLobbyWithPlayers(lobby.id)

      // Set up the current player (host)
      const currentPlayer = players.find(p => p.user_id === authStore.getState().user!.id)!

      console.log('💾 About to call setLobby...')
      lobbyStore.setLobby(lobbyWithPlayers, currentPlayer)
      console.log('👥 About to call updatePlayers...')
      lobbyStore.updatePlayers(players)
      console.log('✅ Store operations completed - reactivity is automatic!')

      // Subscribe to realtime updates
      console.log('🎯 About to setup realtime subscription...')
      try {
        setupRealtimeSubscription(lobby.id)
        console.log('✅ Realtime subscription setup completed')
      } catch (error) {
        console.error('❌ Failed to setup realtime subscription:', error)
      }

      return lobby
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lobby'
      lobbyStore.setError(message)
      throw error
    } finally {
      lobbyStore.setLoading(false)
    }
  }

  const joinExistingLobby = async (roomCode: string) => {
    console.log('🚪 joinExistingLobby called with roomCode:', roomCode)

    if (!authStore.getState().user) {
      console.error('❌ No authenticated user found')
      throw new Error('Must be logged in to join a lobby')
    }

    console.log('👤 Authenticated user:', authStore.getState().user.id)

    // Clean up any existing lobby state before joining
    console.log('🧹 Cleaning up any existing lobby state before joining')
    cleanup()

    // Also leave any existing lobbies in the database
    console.log('🏠 Leaving any existing lobbies in database before joining')
    try {
      await leaveAllLobbies(authStore.getState().user!.id)
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup existing lobbies:', cleanupError)
      // Don't fail the join if cleanup fails
    }

    try {
      console.log('⏳ Setting loading state to true')
      lobbyStore.setLoading(true)
      lobbyStore.setError(null)

      console.log('🔄 Calling joinLobby API...')
      const { lobby, player } = await joinLobby(
        authStore.getState().user!.id,
        // @ts-expect-error - user_metadata exists on Supabase User type
        authStore.getState().user!.user_metadata?.username || 'Anonymous',
        roomCode
      )
      console.log('✅ joinLobby API returned:', { lobbyId: lobby.id, roomCode: lobby.room_code, playerId: player.id })

      console.log('📊 Fetching updated players list...')
      const { players } = await getLobbyWithPlayers(lobby.id)
      console.log('✅ Got players list:', players.length, 'players')

      console.log('💾 Setting lobby and players in store...')
      lobbyStore.setLobby(lobby, player)
      lobbyStore.updatePlayers(players)
      console.log('✅ Store updated successfully')

      // Subscribe to realtime updates
      console.log('🎯 About to setup realtime subscription for join...')
      try {
        setupRealtimeSubscription(lobby.id)
        console.log('✅ Realtime subscription setup completed for join')
      } catch (error) {
        console.error('❌ Failed to setup realtime subscription for join:', error)
      }

      console.log('🎉 joinExistingLobby completed successfully')
      return { lobby, player }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join lobby'
      console.error('❌ joinExistingLobby failed:', message)
      lobbyStore.setError(message)
      throw error
    } finally {
      console.log('🔄 Setting loading state to false')
      lobbyStore.setLoading(false)
    }
  }

  const toggleReady = async () => {
    console.log('🎯 toggleReady called')
    if (!lobbyStore.currentLobby || !lobbyStore.currentPlayer) {
      console.log('❌ toggleReady: Missing lobby or player')
      return
    }

    try {
      const newReadyState = !lobbyStore.currentPlayer.ready
      console.log('🎯 toggleReady: Setting ready state to', newReadyState)

      await updatePlayerReady(
        lobbyStore.currentLobby.id,
        lobbyStore.currentPlayer.user_id,
        newReadyState
      )

      console.log('✅ toggleReady: updatePlayerReady completed')

      // Update local state immediately for responsive UI
      lobbyStore.updatePlayerReady(lobbyStore.currentPlayer.id, newReadyState)
      console.log('✅ toggleReady: Local state updated')
    } catch (error) {
      console.error('❌ toggleReady: Failed to update ready status:', error)
    }
  }

  const startMultiplayerGame = async () => {
    if (!lobbyStore.currentLobby || !authStore.getState().user) return

    try {
      lobbyStore.setLoading(true)
      await startGame(lobbyStore.currentLobby.id, authStore.getState().user!.id)
      // The realtime subscription will handle the status update
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start game'
      lobbyStore.setError(message)
      throw error
    } finally {
      lobbyStore.setLoading(false)
    }
  }

  const submitGuess = async (
    guessedName: string,
    guessedLat: number,
    guessedLon: number,
    guessedYear: number,
    score: number
  ) => {
    if (!lobbyStore.currentLobby || !lobbyStore.currentPlayer || !lobbyStore.currentFigure) {
      throw new Error('Invalid game state')
    }

    const submissionTime = lobbyStore.roundStartTime
      ? (Date.now() - lobbyStore.roundStartTime) / 1000
      : 0

    await submitMultiplayerGuess(
      lobbyStore.currentLobby.id,
      lobbyStore.currentPlayer.user_id,
      lobbyStore.currentRound,
      lobbyStore.currentFigure.id,
      guessedName,
      guessedLat,
      guessedLon,
      guessedYear,
      submissionTime,
      score
    )
  }

  const leaveCurrentLobby = async () => {
    if (!lobbyStore.currentLobby || !lobbyStore.currentPlayer) return

    try {
      await leaveLobby(lobbyStore.currentLobby.id, lobbyStore.currentPlayer.user_id)
      cleanup()
    } catch (error) {
      console.error('Failed to leave lobby:', error)
      // Still cleanup locally
      cleanup()
    }
  }

  const setupRealtimeSubscription = (lobbyId: string) => {
    console.log('🔌 Setting up realtime subscription for lobby:', lobbyId)

    // Clean up any existing subscription first
    if (realtimeChannel.value) {
      console.log('🧹 Cleaning up existing realtime subscription before setting up new one')
      unsubscribeLobby(realtimeChannel.value)
      realtimeChannel.value = null
    }

    try {
      realtimeChannel.value = subscribeLobby(lobbyId, {
      onPlayerJoined: async (_player) => {
        console.log('👥 REALTIME CALLBACK: Player joined, refreshing players list')
        try {
          // Refresh players list
          const { players } = await getLobbyWithPlayers(lobbyId)
          console.log('👥 REALTIME CALLBACK: Got players from DB:', players.length)
          lobbyStore.updatePlayers(players)
          console.log('👥 REALTIME CALLBACK: Updated store with players')
        } catch (error) {
          console.error('👥 REALTIME CALLBACK: Error in onPlayerJoined:', error)
        }
      },

      onPlayerLeft: async (_playerId) => {
        try {
          // Refresh players list
          const { players } = await getLobbyWithPlayers(lobbyId)
          lobbyStore.updatePlayers(players)
        } catch (error) {
          console.error('👥 REALTIME CALLBACK: Error in onPlayerLeft:', error)
        }
      },

      onPlayerReady: async (_playerId) => {
        console.log('👥 REALTIME CALLBACK: Player ready status changed for player:', _playerId)
        try {
          console.log('👥 REALTIME CALLBACK: About to refresh players list for lobby:', lobbyId)
          // Refresh players list
          const { players } = await getLobbyWithPlayers(lobbyId)
          console.log('👥 REALTIME CALLBACK: Refreshed players after ready change:', players.length, 'players')
          console.log('👥 REALTIME CALLBACK: Player ready statuses:', players.map(p => ({ id: p.user_id, ready: p.ready })))

          console.log('👥 REALTIME CALLBACK: About to update store with players')
          lobbyStore.updatePlayers(players)
          console.log('👥 REALTIME CALLBACK: Updated store after ready change - reactivity is automatic!')
        } catch (error) {
          console.error('👥 REALTIME CALLBACK: Error in onPlayerReady:', error)
        }
      },

      onGameStarted: async () => {
        // Get updated lobby status
        const { lobby } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.updateLobbyStatus(lobby.status, lobby.current_round)

        // Load figures for the game
        const figures = []
        for (const figureId of lobby.figure_ids) {
          const figure = await getFigureById(figureId)
          figures.push(figure)
        }
          lobbyStore.setFigures(figures)

        // Start first round
        if (figures.length > 0) {
          lobbyStore.startRound(1, figures[0])
        }
      },

      onRoundStarted: async (_roundNumber) => {
        // Get updated lobby status
        const { lobby } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.updateLobbyStatus(lobby.status, lobby.current_round)

        // Start the round with the appropriate figure
        const figure = lobbyStore.figures[lobby.current_round - 1]
        if (figure) {
          lobbyStore.startRound(lobby.current_round, figure)
        }
      },

      onSubmissionReceived: async (_submission) => {
        // Check if this completes the round (all players submitted)
        const submissions = await getRoundSubmissions(lobbyId, lobbyStore.currentRound)

        // If all players have submitted, end the round
        if (submissions.length >= lobbyStore.players.length) {
          lobbyStore.endRound(submissions)

          // Update player scores
          const scoreUpdates = submissions.reduce((acc, sub) => {
            acc[sub.user_id] = (acc[sub.user_id] || 0) + sub.score
            return acc
          }, {} as Record<string, number>)

          Object.entries(scoreUpdates).forEach(([userId, additionalScore]) => {
            const currentScore = lobbyStore.players.find(p => p.user_id === userId)?.score || 0
            lobbyStore.updatePlayerScore(userId, currentScore + additionalScore)
          })
        }
      },

      onRoundEnded: async (_scores) => {
        // This is handled by the submission received callback
      },

      onGameEnded: async (_finalScores) => {
        // Game finished
        lobbyStore.updateLobbyStatus('finished', 10)
      }
    })
    } catch (error) {
      console.error('❌ Error in setupRealtimeSubscription:', error)
    }
  }

  const cleanup = () => {
    console.log('🧹 Cleaning up lobby state and realtime subscriptions')

    // Clean up realtime subscription
    if (realtimeChannel.value) {
      console.log('🔌 Unsubscribing from realtime channel')
      unsubscribeLobby(realtimeChannel.value)
      realtimeChannel.value = null
    }

    // Reset store state
    console.log('🔄 Resetting lobby store')
    lobbyStore.reset()

    console.log('✅ Cleanup completed')
  }

  console.log('📤 useLobby returning actions only - state accessed via store directly')

  return {
    // Actions only - state is accessed directly from store in components
    createNewLobby,
    joinExistingLobby,
    toggleReady,
    startMultiplayerGame,
    submitGuess,
    leaveCurrentLobby,
    cleanup
  }
}
