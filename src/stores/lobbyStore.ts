import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Lobby, LobbyPlayer, LobbySubmission } from '@/types/lobby'
import type { Figure } from '@/types/figure'

export const useLobbyStore = defineStore('lobby', () => {
  // Current lobby data
  const currentLobby = ref<Lobby | null>(null)
  const currentPlayer = ref<LobbyPlayer | null>(null)
  const players = ref<LobbyPlayer[]>([])
  const figures = ref<Figure[]>([])

  // Game state
  const currentRound = ref<number>(0)
  const currentFigure = ref<Figure | null>(null)
  const roundSubmissions = ref<LobbySubmission[]>([])
  const isRoundActive = ref<boolean>(false)
  const roundStartTime = ref<number | null>(null)
  const playersReadyForNextRound = ref<string[]>([]) // Track players ready for next round

  // UI state
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Actions
  const setLobby = (lobby: Lobby, player: LobbyPlayer) => {
    console.log('🏪 STORE: setLobby called with:', { lobby, player })
    currentLobby.value = lobby
    currentPlayer.value = player
    currentRound.value = lobby.current_round
    isRoundActive.value = lobby.status === 'in_progress'
    console.log('🏪 STORE: setLobby completed, currentLobby:', currentLobby.value)
  }

  const updatePlayers = (newPlayers: LobbyPlayer[]) => {
    console.log('🏪 STORE: updatePlayers called with', newPlayers.length, 'players')
    console.log('🏪 STORE: Current players:', players.value.map(p => ({ id: p.id, user_id: p.user_id, ready: p.ready })))
    console.log('🏪 STORE: New players:', newPlayers.map(p => ({ id: p.id, user_id: p.user_id, ready: p.ready })))

    // Create a fresh array reference to ensure reactivity
    players.value = [...newPlayers]
    console.log('🏪 STORE: updatePlayers completed - fresh array assigned')
  }

  const updateLobbyStatus = (status: Lobby['status'], roundNumber: number) => {
    if (currentLobby.value) {
      currentLobby.value = { ...currentLobby.value, status, current_round: roundNumber }
    }
    currentRound.value = roundNumber
    isRoundActive.value = status === 'in_progress'
  }

  const setFigures = (newFigures: Figure[]) => {
    figures.value = newFigures
  }

  const startRound = (roundNumber: number, figure: Figure) => {
    currentRound.value = roundNumber
    currentFigure.value = figure
    roundSubmissions.value = []
    isRoundActive.value = true
    roundStartTime.value = Date.now()
    // Clear players ready for next round when starting a new round
    clearPlayersReadyForNextRound()
  }

  const endRound = (submissions: LobbySubmission[]) => {
    roundSubmissions.value = submissions
    isRoundActive.value = false
    roundStartTime.value = null
  }

  const updatePlayerReady = (playerId: string, ready: boolean) => {
    console.log('🏪 STORE: updatePlayerReady called for player', playerId, 'ready:', ready)
    const playerIndex = players.value.findIndex(p => p.id === playerId)
    if (playerIndex !== -1) {
      // Create a fresh array to ensure reactivity
      const updatedPlayers = [...players.value]
      updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], ready }
      players.value = updatedPlayers
      console.log('🏪 STORE: updatePlayerReady completed - fresh array assigned')
    } else {
      console.log('🏪 STORE: updatePlayerReady - player not found:', playerId)
    }
  }

  const updatePlayerScore = (userId: string, score: number) => {
    const playerIndex = players.value.findIndex(p => p.user_id === userId)
    if (playerIndex !== -1) {
      // Create a fresh array to ensure reactivity
      const updatedPlayers = [...players.value]
      updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], score }
      players.value = updatedPlayers
    }
  }

  const setPlayerReadyForNextRound = (userId: string, ready: boolean) => {
    console.log('🏪 STORE: setPlayerReadyForNextRound called for user', userId, 'ready:', ready)
    const currentArray = [...playersReadyForNextRound.value]
    if (ready) {
      if (!currentArray.includes(userId)) {
        currentArray.push(userId)
      }
    } else {
      const index = currentArray.indexOf(userId)
      if (index > -1) {
        currentArray.splice(index, 1)
      }
    }
    playersReadyForNextRound.value = currentArray
    console.log('🏪 STORE: setPlayerReadyForNextRound completed - ready players:', playersReadyForNextRound.value)
  }

  const clearPlayersReadyForNextRound = () => {
    playersReadyForNextRound.value = []
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (newError: string | null) => {
    error.value = newError
  }

  const reset = () => {
    currentLobby.value = null
    currentPlayer.value = null
    players.value = []
    figures.value = []
    currentRound.value = 0
    currentFigure.value = null
    roundSubmissions.value = []
    isRoundActive.value = false
    roundStartTime.value = null
    playersReadyForNextRound.value = []
    isLoading.value = false
    error.value = null
  }

  // Computed properties for convenience
  const isHost = computed(() => {
    return currentPlayer.value?.id === currentLobby.value?.host_id
  })

  const connectedPlayers = computed(() => {
    return players.value.filter(player => player.connected)
  })

  const readyPlayers = computed(() => {
    return players.value.filter(player => player.ready)
  })

  const allPlayersReadyForNextRound = computed(() => {
    const connectedUserIds = connectedPlayers.value.map(p => p.user_id)
    return connectedUserIds.length > 0 && connectedUserIds.every(userId => playersReadyForNextRound.value.includes(userId))
  })

  const currentPlayerReadyForNextRound = computed(() => {
    return currentPlayer.value ? playersReadyForNextRound.value.includes(currentPlayer.value.user_id) : false
  })

  return {
    // State
    currentLobby,
    currentPlayer,
    players,
    figures,
    currentRound,
    currentFigure,
    roundSubmissions,
    isRoundActive,
    roundStartTime,
    playersReadyForNextRound,
    isLoading,
    error,

    // Computed
    isHost,
    connectedPlayers,
    readyPlayers,
    allPlayersReadyForNextRound,
    currentPlayerReadyForNextRound,

    // Actions
    setLobby,
    updatePlayers,
    updateLobbyStatus,
    setFigures,
    startRound,
    endRound,
    updatePlayerReady,
    updatePlayerScore,
    setPlayerReadyForNextRound,
    clearPlayersReadyForNextRound,
    setLoading,
    setError,
    reset
  }
})
