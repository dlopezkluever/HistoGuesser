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
  leaveLobby
} from '@/lib/supabase/queries'
import { subscribeLobby, unsubscribeLobby } from '@/lib/supabase/realtime'
import { getFigureById } from '@/lib/supabase/queries'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useLobby() {
const lobbyStore = useLobbyStore()
  const realtimeChannel = ref<RealtimeChannel | null>(null)

  const createNewLobby = async () => {
    if (!authStore.getState().user) throw new Error('Must be logged in to create a lobby')

    try {
      lobbyStore.setLoading(true)
      lobbyStore.setError(null)

      const lobby = await createLobby(authStore.getState().user!.id)

      // Get the lobby with players (just the host)
      const { lobby: lobbyWithPlayers, players } = await getLobbyWithPlayers(lobby.id)

      // Set up the current player (host)
      const currentPlayer = players.find(p => p.user_id === authStore.getState().user!.id)!

      lobbyStore.setLobby(lobbyWithPlayers, currentPlayer)
      lobbyStore.updatePlayers(players)

      // Subscribe to realtime updates
      setupRealtimeSubscription(lobby.id)

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
    if (!authStore.getState().user) throw new Error('Must be logged in to join a lobby')

    try {
      lobbyStore.setLoading(true)
      lobbyStore.setError(null)

      const { lobby, player } = await joinLobby(
        authStore.getState().user!.id,
        // @ts-expect-error - user_metadata exists on Supabase User type
        authStore.getState().user!.user_metadata?.username || 'Anonymous',
        roomCode
      )

      // Get updated lobby with all players
      const { players } = await getLobbyWithPlayers(lobby.id)

      lobbyStore.setLobby(lobby, player)
      lobbyStore.updatePlayers(players)

      // Subscribe to realtime updates
      setupRealtimeSubscription(lobby.id)

      return { lobby, player }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join lobby'
      lobbyStore.setError(message)
      throw error
    } finally {
      lobbyStore.setLoading(false)
    }
  }

  const toggleReady = async () => {
    if (!lobbyStore.currentLobby || !lobbyStore.currentPlayer) return

    try {
      const newReadyState = !lobbyStore.currentPlayer.ready
      await updatePlayerReady(
        lobbyStore.currentLobby.id,
        lobbyStore.currentPlayer.user_id,
        newReadyState
      )

      // Update local state immediately for responsive UI
      lobbyStore.updatePlayerReady(lobbyStore.currentPlayer.id, newReadyState)
    } catch (error) {
      console.error('Failed to update ready status:', error)
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
    realtimeChannel.value = subscribeLobby(lobbyId, {
      onPlayerJoined: async (player) => {
        // Refresh players list
        const { players } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.updatePlayers(players)
      },

      onPlayerLeft: async (playerId) => {
        // Refresh players list
        const { players } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.updatePlayers(players)
      },

      onPlayerReady: async (playerId) => {
        // Refresh players list
        const { players } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.updatePlayers(players)
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

      onRoundStarted: async (roundNumber) => {
        // Get updated lobby status
        const { lobby } = await getLobbyWithPlayers(lobbyId)
        lobbyStore.updateLobbyStatus(lobby.status, roundNumber)

        // Start the round with the appropriate figure
        const figure = lobbyStore.figures[roundNumber - 1]
        if (figure) {
          lobbyStore.startRound(roundNumber, figure)
        }
      },

      onSubmissionReceived: async (submission) => {
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

      onRoundEnded: async (scores) => {
        // This is handled by the submission received callback
      },

      onGameEnded: async (finalScores) => {
        // Game finished
        lobbyStore.updateLobbyStatus('finished', 10)
      }
    })
  }

  const cleanup = () => {
    if (realtimeChannel.value) {
      unsubscribeLobby(realtimeChannel.value)
      realtimeChannel.value = null
    }
    lobbyStore.reset()
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    lobby: lobbyStore.currentLobby,
    player: lobbyStore.currentPlayer,
    players: lobbyStore.players,
    figures: lobbyStore.figures,
    currentRound: lobbyStore.currentRound,
    currentFigure: lobbyStore.currentFigure,
    roundSubmissions: lobbyStore.roundSubmissions,
    isRoundActive: lobbyStore.isRoundActive,
    isLoading: lobbyStore.isLoading,
    error: lobbyStore.error,

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
