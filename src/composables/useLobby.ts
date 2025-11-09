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

    // Note: We don't preemptively leave all lobbies here as it can interfere with the join process
    // The joinLobby function will handle removing the user from existing lobbies if needed

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
      console.log('🎯 toggleReady: Current ready state:', lobbyStore.currentPlayer.ready, '→ New state:', newReadyState)

      // Update local state immediately for responsive UI (optimistic update)
      console.log('⚡ toggleReady: Applying optimistic local update')
      lobbyStore.updatePlayerReady(lobbyStore.currentPlayer.id, newReadyState)

      // Then update database
      console.log('🔄 toggleReady: Updating database...')
      await updatePlayerReady(
        lobbyStore.currentLobby.id,
        lobbyStore.currentPlayer.user_id,
        newReadyState
      )

      console.log('✅ toggleReady: Database update completed - optimistic update confirmed')
    } catch (error) {
      console.error('❌ toggleReady: Failed to update ready status:', error)
      // Revert optimistic update on failure
      console.log('↩️ toggleReady: Reverting optimistic update due to error')
      const revertState = lobbyStore.currentPlayer.ready // This is the failed state, revert to opposite
      lobbyStore.updatePlayerReady(lobbyStore.currentPlayer.id, !revertState)
    }
  }

  const startMultiplayerGame = async () => {
    if (!lobbyStore.currentLobby || !authStore.getState().user) {
      console.log('❌ startMultiplayerGame: Missing lobby or user')
      return
    }

    console.log('🎮 startMultiplayerGame called for lobby:', lobbyStore.currentLobby.id)

    try {
      console.log('⏳ Setting loading state for game start')
      lobbyStore.setLoading(true)
      lobbyStore.setError(null)

  console.log('🚀 Calling startGame API...')
  await startGame(lobbyStore.currentLobby.id, authStore.getState().user!.id)
  console.log('✅ startGame API completed - game started successfully!')
  console.log('⏳ Waiting for realtime status update to transition UI...')

  // Set a shorter timeout in case realtime doesn't work - force transition after 1 second
  setTimeout(() => {
    if (lobbyStore.isLoading) {
      console.warn('⏰ Realtime transition timeout - forcing game start manually')
      // Manually trigger game start if realtime failed
      try {
        const lobbyId = lobbyStore.currentLobby?.id
        if (lobbyId) {
          // Fetch current lobby state and start game manually
          getLobbyWithPlayers(lobbyId).then(({ lobby, players }) => {
            console.log('🔄 Fallback: Manually updating lobby status to in_progress')
            lobbyStore.updateLobbyStatus('in_progress', 1)
            // Load figures and start round
            const figurePromises = lobby.figure_ids.map(id => getFigureById(id))
            Promise.all(figurePromises).then(figures => {
              lobbyStore.setFigures(figures)
              if (figures.length > 0) {
                lobbyStore.startRound(1, figures[0])
              }
              lobbyStore.setLoading(false)
              console.log('✅ Fallback game start completed')
            }).catch(error => {
              console.error('❌ Fallback figure loading failed:', error)
              lobbyStore.setLoading(false)
            })
          }).catch(error => {
            console.error('❌ Fallback lobby fetch failed:', error)
            lobbyStore.setLoading(false)
          })
        }
      } catch (error) {
        console.error('❌ Fallback game start failed:', error)
        lobbyStore.setLoading(false)
      }
    }
  }, 1000) // Reduced from 5000ms to 1000ms

  // Don't set loading to false here - let the onGameStarted callback handle it
  // The UI transition will happen when the realtime callback updates the lobby status
    } catch (error) {
      console.error('❌ startMultiplayerGame failed:', error)
      const message = error instanceof Error ? error.message : 'Failed to start game'
      lobbyStore.setError(message)
      lobbyStore.setLoading(false)
      throw error
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

    const submission = await submitMultiplayerGuess(
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

    // Immediately add our own submission to local state for UI updates
    console.log('🎯 Adding own submission to local roundSubmissions:', submission.id)
    const currentSubmissions = lobbyStore.roundSubmissions || []
    lobbyStore.roundSubmissions = [...currentSubmissions, submission]

    // Check if all players have submitted after adding our own
    if (lobbyStore.roundSubmissions.length >= lobbyStore.players.length) {
      console.log('🎯 All players submitted (including self) - reveal phase should start in UI')
    }

    return submission
  }

  const leaveCurrentLobby = async () => {
    console.log('🚪 leaveCurrentLobby called - starting leave process')
    console.log('Current state:', {
      lobby: lobbyStore.currentLobby,
      player: lobbyStore.currentPlayer,
      hasLobby: !!lobbyStore.currentLobby,
      hasPlayer: !!lobbyStore.currentPlayer
    })

    if (!lobbyStore.currentLobby || !lobbyStore.currentPlayer) {
      console.warn('🚪 leaveCurrentLobby: Missing lobby or player - cannot leave', {
        lobby: !!lobbyStore.currentLobby,
        player: !!lobbyStore.currentPlayer
      })
      return
    }

    try {
      console.log('🔄 leaveCurrentLobby: Calling leaveLobby API...', {
        lobbyId: lobbyStore.currentLobby.id,
        userId: lobbyStore.currentPlayer.user_id
      })

      await leaveLobby(lobbyStore.currentLobby.id, lobbyStore.currentPlayer.user_id)

      console.log('✅ leaveCurrentLobby: leaveLobby API call successful')

      console.log('🧹 leaveCurrentLobby: Starting local cleanup...')
      cleanup()

      console.log('✅ leaveCurrentLobby: Leave process completed successfully')
    } catch (error) {
      console.error('❌ leaveCurrentLobby: Failed to leave lobby:', error)
      console.log('🧹 leaveCurrentLobby: Attempting local cleanup despite error...')
      // Still cleanup locally even if API call failed
      cleanup()
      console.log('✅ leaveCurrentLobby: Local cleanup completed after error')
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
          // Refresh players list - server state is the source of truth
          const { players: serverPlayers } = await getLobbyWithPlayers(lobbyId)
          console.log('👥 REALTIME CALLBACK: Server players:', serverPlayers.map(p => ({ id: p.user_id, ready: p.ready })))

          // Preserve optimistic updates for the current user
          const currentUserId = authStore.getState().user?.id
          const currentPlayers = lobbyStore.players

          const reconciledPlayers = serverPlayers.map(serverPlayer => {
            // For other players, use server state
            if (serverPlayer.user_id !== currentUserId) {
              return serverPlayer
            }

            // For current user, check if we have a more recent optimistic update
            const currentPlayer = currentPlayers.find(cp => cp.user_id === currentUserId)
            if (currentPlayer) {
              console.log('👥 REALTIME CALLBACK: Current user optimistic state - server:', serverPlayer.ready, 'local:', currentPlayer.ready)
              // If local state differs from server and we're in an optimistic update scenario,
              // prefer the local state (it will be corrected when database syncs)
              return {
                ...serverPlayer,
                ready: currentPlayer.ready // Preserve optimistic update
              }
            }

            return serverPlayer
          })

          console.log('👥 REALTIME CALLBACK: Final reconciled players:', reconciledPlayers.map(p => ({ id: p.user_id, ready: p.ready })))

          console.log('👥 REALTIME CALLBACK: About to update store with reconciled players')
          lobbyStore.updatePlayers(reconciledPlayers)
          console.log('👥 REALTIME CALLBACK: Updated store after ready change - reactivity is automatic!')
        } catch (error) {
          console.error('👥 REALTIME CALLBACK: Error in onPlayerReady:', error)
        }
      },

      onGameStarted: async () => {
        console.log('🎮 REALTIME CALLBACK: onGameStarted triggered for lobby:', lobbyId)

        try {
          console.log('📊 Fetching updated lobby with players...')
          const { lobby } = await getLobbyWithPlayers(lobbyId)
          console.log('✅ Got updated lobby - status:', lobby.status, 'current_round:', lobby.current_round)

          console.log('💾 Updating lobby status in store...')
          lobbyStore.updateLobbyStatus(lobby.status, lobby.current_round)
          console.log('✅ Lobby status updated to:', lobby.status)

          console.log('🎯 Loading figures for game...')
          const figures = []
          for (const figureId of lobby.figure_ids) {
            console.log('📖 Loading figure:', figureId)
            const figure = await getFigureById(figureId)
            figures.push(figure)
          }
          console.log('✅ Loaded', figures.length, 'figures')

          console.log('💾 Setting figures in store...')
          lobbyStore.setFigures(figures)

          console.log('🎲 Starting first round...')
          if (figures.length > 0) {
            lobbyStore.startRound(1, figures[0])
            console.log('✅ Started round 1 with figure:', figures[0].name)
          } else {
            console.error('❌ No figures loaded for game!')
          }

          console.log('🔄 Setting loading to false after game start')
          lobbyStore.setLoading(false)

          console.log('🎮 Game started successfully!')
        } catch (error) {
          console.error('❌ onGameStarted callback failed:', error)
          lobbyStore.setError('Failed to start game')
          lobbyStore.setLoading(false)
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
        console.log('📨 Submission received:', _submission)

        // Get current submissions to check if we already have this one
        let currentSubmissions = lobbyStore.roundSubmissions || []

        // Check if we already have this submission (avoid duplicates)
        const existingIndex = currentSubmissions.findIndex(sub => sub.id === _submission.id)
        if (existingIndex === -1) {
          // Check if we already have a submission from this user
          const userSubmissionIndex = currentSubmissions.findIndex(sub => sub.user_id === _submission.user_id)
          if (userSubmissionIndex === -1) {
            // Add the new submission
            currentSubmissions = [...currentSubmissions, _submission]
            console.log('📊 Added new submission from user, total now:', currentSubmissions.length, 'players:', lobbyStore.players.length)
          } else {
            // Update existing submission from this user
            console.log('📊 Updating existing submission from user')
            currentSubmissions[userSubmissionIndex] = _submission
          }
        } else {
          console.log('📊 Submission already exists, skipping...')
        }

        // Update round submissions for real-time counter display
        lobbyStore.roundSubmissions = currentSubmissions

        // If all players have submitted, trigger reveal phase (UI handles the rest)
        if (currentSubmissions.length >= lobbyStore.players.length) {
          console.log('🎯 All players submitted - reveal phase should start in UI')
          // Don't end the round here - let the UI handle reveal phase and round progression
          // The LobbyGameplay component will call endRound after reveal phase completes
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
