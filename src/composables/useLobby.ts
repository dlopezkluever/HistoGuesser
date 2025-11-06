import { ref, onUnmounted, computed } from 'vue'
import { lobbyStore } from '@/stores/lobbyStore'
import { authStore } from '@/stores/authStore'
import {
  createLobby,
  joinLobby,
  getLobbyWithPlayers,
  startGame,
  submitMultiplayerGuess,
  getRoundSubmissions,
  updatePlayerReady,
  leaveLobby
} from '@/lib/supabase/queries'
import { subscribeLobby, unsubscribeLobby } from '@/lib/supabase/realtime'
import { getFigureById } from '@/lib/supabase/queries'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useLobby() {
  const realtimeChannel = ref<RealtimeChannel | null>(null)

  const createNewLobby = async () => {
    if (!authStore.getState().user) throw new Error('Must be logged in to create a lobby')

    try {
      lobbyStore.getState().setLoading(true)
      lobbyStore.getState().setError(null)

      const lobby = await createLobby(authStore.getState().user!.id, authStore.getState().user!.username)

      // Get the lobby with players (just the host)
      const { lobby: lobbyWithPlayers, players } = await getLobbyWithPlayers(lobby.id)

      // Set up the current player (host)
      const currentPlayer = players.find(p => p.user_id === authStore.getState().user!.id)!

      lobbyStore.getState().setLobby(lobbyWithPlayers, currentPlayer)
      lobbyStore.getState().updatePlayers(players)

      // Subscribe to realtime updates
      setupRealtimeSubscription(lobby.id)

      return lobby
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lobby'
      lobbyStore.getState().setError(message)
      throw error
    } finally {
      lobbyStore.getState().setLoading(false)
    }
  }

  const joinExistingLobby = async (roomCode: string) => {
    if (!authStore.getState().user) throw new Error('Must be logged in to join a lobby')

    try {
      lobbyStore.getState().setLoading(true)
      lobbyStore.getState().setError(null)

      const { lobby, player } = await joinLobby(
        authStore.getState().user!.id,
        // @ts-expect-error - user_metadata exists on Supabase User type
        authStore.getState().user!.user_metadata?.username || 'Anonymous',
        roomCode
      )

      // Get updated lobby with all players
      const { players } = await getLobbyWithPlayers(lobby.id)

      lobbyStore.getState().setLobby(lobby, player)
      lobbyStore.getState().updatePlayers(players)

      // Subscribe to realtime updates
      setupRealtimeSubscription(lobby.id)

      return { lobby, player }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join lobby'
      lobbyStore.getState().setError(message)
      throw error
    } finally {
      lobbyStore.getState().setLoading(false)
    }
  }

  const toggleReady = async () => {
    if (!lobbyStore.getState().currentLobby || !lobbyStore.getState().currentPlayer) return

    try {
      const newReadyState = !lobbyStore.getState().currentPlayer!.ready
      await updatePlayerReady(
        lobbyStore.getState().currentLobby!.id,
        lobbyStore.getState().currentPlayer!.user_id,
        newReadyState
      )

      // Update local state immediately for responsive UI
      lobbyStore.getState().updatePlayerReady(lobbyStore.getState().currentPlayer!.id, newReadyState)
    } catch (error) {
      console.error('Failed to update ready status:', error)
    }
  }

  const startMultiplayerGame = async () => {
    if (!lobbyStore.getState().currentLobby || !authStore.getState().user) return

    try {
      lobbyStore.getState().setLoading(true)
      await startGame(lobbyStore.getState().currentLobby!.id, authStore.getState().user!.id)
      // The realtime subscription will handle the status update
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start game'
      lobbyStore.getState().setError(message)
      throw error
    } finally {
      lobbyStore.getState().setLoading(false)
    }
  }

  const submitGuess = async (
    guessedName: string,
    guessedLat: number,
    guessedLon: number,
    guessedYear: number,
    score: number
  ) => {
    if (!lobbyStore.getState().currentLobby || !lobbyStore.getState().currentPlayer || !lobbyStore.getState().currentFigure) {
      throw new Error('Invalid game state')
    }

    const submissionTime = lobbyStore.getState().roundStartTime
      ? (Date.now() - lobbyStore.getState().roundStartTime) / 1000
      : 0

    await submitMultiplayerGuess(
      lobbyStore.getState().currentLobby.id,
      lobbyStore.getState().currentPlayer.user_id,
      lobbyStore.getState().currentRound,
      lobbyStore.getState().currentFigure.id,
      guessedName,
      guessedLat,
      guessedLon,
      guessedYear,
      submissionTime,
      score
    )
  }

  const leaveCurrentLobby = async () => {
    if (!lobbyStore.getState().currentLobby || !lobbyStore.getState().currentPlayer) return

    try {
      await leaveLobby(lobbyStore.getState().currentLobby!.id, lobbyStore.getState().currentPlayer!.user_id)
      cleanup()
    } catch (error) {
      console.error('Failed to leave lobby:', error)
      // Still cleanup locally
      cleanup()
    }
  }

  const setupRealtimeSubscription = (lobbyId: string) => {
    realtimeChannel.value = subscribeLobby(lobbyId, {
      onPlayerJoined: async (player) => {
        // Refresh players list
        const { players } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.getState().updatePlayers(players)
      },

      onPlayerLeft: async (playerId) => {
        // Refresh players list
        const { players } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.getState().updatePlayers(players)
      },

      onPlayerReady: async (playerId) => {
        // Refresh players list
        const { players } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.getState().updatePlayers(players)
      },

      onGameStarted: async () => {
        // Get updated lobby status
        const { lobby } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.getState().updateLobbyStatus(lobby.status, lobby.current_round)

        // Load figures for the game
        const figures = []
        for (const figureId of lobby.figure_ids) {
          const figure = await getFigureById(figureId)
          figures.push(figure)
        }
          lobbyStore.getState().setFigures(figures)

        // Start first round
        if (figures.length > 0) {
          lobbyStore.getState().startRound(1, figures[0])
        }
      },

      onRoundStarted: async (roundNumber) => {
        // Get updated lobby status
        const { lobby } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.getState().updateLobbyStatus(lobby.status, roundNumber)

        // Start the round with the appropriate figure
        const figure = lobbyStore.getState().figures[roundNumber - 1]
        if (figure) {
          lobbyStore.getState().startRound(roundNumber, figure)
        }
      },

      onSubmissionReceived: async (submission) => {
        // Check if this completes the round (all players submitted)
        const submissions = await getRoundSubmissions(lobbyId, lobbyStore.getState().currentRound)

        // If all players have submitted, end the round
        if (submissions.length >= lobbyStore.getState().players.length) {
          lobbyStore.getState().endRound(submissions)

          // Update player scores
          const scoreUpdates = submissions.reduce((acc, sub) => {
            acc[sub.user_id] = (acc[sub.user_id] || 0) + sub.score
            return acc
          }, {} as Record<string, number>)

          Object.entries(scoreUpdates).forEach(([userId, additionalScore]) => {
            const currentScore = lobbyStore.getState().players.find(p => p.user_id === userId)?.score || 0
            lobbyStore.getState().updatePlayerScore(userId, currentScore + additionalScore)
          })
        }
      },

      onRoundEnded: async (scores) => {
        // This is handled by the submission received callback
      },

      onGameEnded: async (finalScores) => {
        // Game finished
        lobbyStore.getState().updateLobbyStatus('finished', 10)
      }
    })
  }

  const cleanup = () => {
    if (realtimeChannel.value) {
      unsubscribeLobby(realtimeChannel.value)
      realtimeChannel.value = null
    }
    lobbyStore.getState().reset()
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    cleanup()
  })

  // Create reactive computed properties for Vue reactivity
  const lobby = computed(() => lobbyStore.getState().currentLobby)
  const player = computed(() => lobbyStore.getState().currentPlayer)
  const players = computed(() => lobbyStore.getState().players)
  const figures = computed(() => lobbyStore.getState().figures)
  const currentRound = computed(() => lobbyStore.getState().currentRound)
  const currentFigure = computed(() => lobbyStore.getState().currentFigure)
  const roundSubmissions = computed(() => lobbyStore.getState().roundSubmissions)
  const isRoundActive = computed(() => lobbyStore.getState().isRoundActive)
  const isLoading = computed(() => lobbyStore.getState().isLoading)
  const error = computed(() => lobbyStore.getState().error)

  return {
    // State (now reactive)
    lobby,
    player,
    players,
    figures,
    currentRound,
    currentFigure,
    roundSubmissions,
    isRoundActive,
    isLoading,
    error,

    // Actions
    createNewLobby,
    joinExistingLobby,
    toggleReady,
    startMultiplayerGame,
    submitGuess,
    leaveCurrentLobby,
    cleanup
  }
}
