import { createStore } from 'zustand/vanilla'
import type { Lobby, LobbyPlayer, LobbySubmission } from '@/types/lobby'
import type { Figure } from '@/types/figure'

interface LobbyState {
  // Current lobby data
  currentLobby: Lobby | null
  currentPlayer: LobbyPlayer | null
  players: LobbyPlayer[]
  figures: Figure[]

  // Game state
  currentRound: number
  currentFigure: Figure | null
  roundSubmissions: LobbySubmission[]
  isRoundActive: boolean
  roundStartTime: number | null

  // UI state
  isLoading: boolean
  error: string | null

  // Actions
  setLobby: (lobby: Lobby, player: LobbyPlayer) => void
  updatePlayers: (players: LobbyPlayer[]) => void
  updateLobbyStatus: (status: Lobby['status'], currentRound: number) => void
  setFigures: (figures: Figure[]) => void
  startRound: (roundNumber: number, figure: Figure) => void
  endRound: (submissions: LobbySubmission[]) => void
  updatePlayerReady: (playerId: string, ready: boolean) => void
  updatePlayerScore: (playerId: string, score: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  currentLobby: null,
  currentPlayer: null,
  players: [],
  figures: [],
  currentRound: 0,
  currentFigure: null,
  roundSubmissions: [],
  isRoundActive: false,
  roundStartTime: null,
  isLoading: false,
  error: null
}

const store = createStore<LobbyState>((set, get) => ({
  ...initialState,

  setLobby: (lobby, player) => {
    console.log('🏪 STORE: setLobby called with:', { lobby, player })
    set({
      currentLobby: lobby,
      currentPlayer: player,
      currentRound: lobby.current_round,
      isRoundActive: lobby.status === 'in_progress'
    })
    console.log('🏪 STORE: setLobby completed, new state:', lobbyStore.getState())
  },

  updatePlayers: (players) => {
    console.log('🏪 STORE: updatePlayers called with', players.length, 'players')
    set({ players })
    console.log('🏪 STORE: updatePlayers completed')
  },

  updateLobbyStatus: (status, currentRound) => set({
    currentLobby: get().currentLobby ? { ...get().currentLobby!, status, current_round: currentRound } : null,
    currentRound,
    isRoundActive: status === 'in_progress'
  }),

  setFigures: (figures) => set({ figures }),

  startRound: (roundNumber, figure) => set({
    currentRound: roundNumber,
    currentFigure: figure,
    roundSubmissions: [],
    isRoundActive: true,
    roundStartTime: Date.now()
  }),

  endRound: (submissions) => set({
    roundSubmissions: submissions,
    isRoundActive: false,
    roundStartTime: null
  }),

  updatePlayerReady: (playerId, ready) => set(state => ({
    players: state.players.map(player =>
      player.id === playerId ? { ...player, ready } : player
    )
  })),

  updatePlayerScore: (playerId, score) => set(state => ({
    players: state.players.map(player =>
      player.id === playerId ? { ...player, score } : player
    )
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState)
}))

export const lobbyStore = store
