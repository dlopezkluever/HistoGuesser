 useLobby composable called
useLobby.ts:23 🏪 Initializing lobbyStore...
useLobby.ts:25 🏪 lobbyStore initialized: {isLoading: false, currentLobby: null, hasSetLoading: true}
useLobby.ts:524 📤 useLobby returning actions only - state accessed via store directly
MultiplayerView.vue:37 🔍 lobbyStore reactive refs: {lobby: ObjectRefImpl, player: ObjectRefImpl, isLoading: ObjectRefImpl}
MultiplayerView.vue:38 🎯 MultiplayerView mounted, initial state: {lobby: null, player: null, isLoading: false}
MultiplayerView.vue:46 🎯 MultiplayerView store changed: {lobby: null, player: null, playersCount: 0, players: Array(0)}
MultiplayerView.vue:56 🎯 MultiplayerView: Lobby status changed: undefined → undefined
useLobby.ts:20 🏗️ useLobby composable called
useLobby.ts:23 🏪 Initializing lobbyStore...
useLobby.ts:25 🏪 lobbyStore initialized: {isLoading: false, currentLobby: null, hasSetLoading: true}
useLobby.ts:524 📤 useLobby returning actions only - state accessed via store directly
LobbyCreateJoin.vue:20 🎨 LobbyCreateJoin component mounted!
LobbyCreateJoin.vue:21 🔍 LobbyCreateJoin reactive values: {isLoading: false, hasCreateNewLobby: true, hasJoinExistingLobby: true}
MultiplayerView.vue:31 🎯 MultiplayerView mounted - cleaning up any existing lobby state
MultiplayerView.vue:46 🎯 MultiplayerView store changed: {lobby: null, player: null, playersCount: 0, players: Array(0)}
authStore.ts:47 👂 Setting up auth state listener...
authStore.ts:73 ✅ Auth store initialized
authStore.ts:49 🔄 Auth state change: INITIAL_SESSION Session exists
LobbyCreateJoin.vue:44 🏗️ LobbyCreateJoin.handleJoinLobby called with roomCode: UXFMDH
LobbyCreateJoin.vue:52 🚀 Calling joinExistingLobby...
useLobby.ts:103 🚪 joinExistingLobby called with roomCode: UXFMDH
useLobby.ts:110 👤 Authenticated user: 360c97e2-504f-420e-a903-3dd272eed80d
useLobby.ts:113 🧹 Cleaning up any existing lobby state before joining
useLobby.ts:508 🧹 Cleaning up lobby state and realtime subscriptions
useLobby.ts:518 🔄 Resetting lobby store
useLobby.ts:521 ✅ Cleanup completed
useLobby.ts:120 ⏳ Setting loading state to true
useLobby.ts:124 🔄 Calling joinLobby API...
queries.ts:423 🔍 joinLobby: Looking for lobby with code: UXFMDH
MultiplayerView.vue:46 🎯 MultiplayerView store changed: {lobby: null, player: null, playersCount: 0, players: Array(0)}
useLobby.ts:35 🧹 Cleaning up realtime subscription
queries.ts:440 ✅ joinLobby: Found lobby: 7740ffab-ba33-48ca-8157-a37b7bc4b204 status: waiting
queries.ts:446 🔍 joinLobby: Checking player capacity for lobby: 7740ffab-ba33-48ca-8157-a37b7bc4b204
queries.ts:459 ✅ joinLobby: Current player count: 1
queries.ts:465 🔍 joinLobby: Checking if user already in lobby: 360c97e2-504f-420e-a903-3dd272eed80d
queries.ts:498 📝 joinLobby: Adding player to lobby
queries.ts:516 ✅ joinLobby: Player added successfully: 7bd43a49-d4c2-46f4-ba4a-66a761ff5ea2
realtime.ts:222 Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.
send @ @supabase_supabase-js.js?v=a926d579:2805
broadcastLobbyEvent @ realtime.ts:222
joinLobby @ queries.ts:521
await in joinLobby
joinExistingLobby @ useLobby.ts:125
handleJoinLobby @ LobbyCreateJoin.vue:53
(anonymous) @ chunk-LG6AQRJS.js?v=a926d579:12326
callWithErrorHandling @ chunk-LG6AQRJS.js?v=a926d579:2296
callWithAsyncErrorHandling @ chunk-LG6AQRJS.js?v=a926d579:2303
invoker @ chunk-LG6AQRJS.js?v=a926d579:11335Understand this warning
queries.ts:522 📢 Broadcasted player joined event for Anonymous
queries.ts:528 🎉 joinLobby: Successfully joined lobby: 7740ffab-ba33-48ca-8157-a37b7bc4b204
useLobby.ts:131 ✅ joinLobby API returned: {lobbyId: '7740ffab-ba33-48ca-8157-a37b7bc4b204', roomCode: 'UXFMDH', playerId: '7bd43a49-d4c2-46f4-ba4a-66a761ff5ea2'}
useLobby.ts:133 📊 Fetching updated players list...
useLobby.ts:135 ✅ Got players list: 2 players
useLobby.ts:137 💾 Setting lobby and players in store...
lobbyStore.ts:26 🏪 STORE: setLobby called with: {lobby: {…}, player: {…}}
lobbyStore.ts:31 🏪 STORE: setLobby completed, currentLobby: Proxy(Object) {id: '7740ffab-ba33-48ca-8157-a37b7bc4b204', room_code: 'UXFMDH', host_id: '4cea1883-91bc-431f-ba4f-eddc93a8b4c6', status: 'waiting', current_round: 0, …}
lobbyStore.ts:35 🏪 STORE: updatePlayers called with 2 players
lobbyStore.ts:36 🏪 STORE: Current players: []
lobbyStore.ts:37 🏪 STORE: New players: (2) [{…}, {…}]
lobbyStore.ts:41 🏪 STORE: updatePlayers completed - fresh array assigned
useLobby.ts:140 ✅ Store updated successfully
useLobby.ts:143 🎯 About to setup realtime subscription for join...
useLobby.ts:333 🔌 Setting up realtime subscription for lobby: 7740ffab-ba33-48ca-8157-a37b7bc4b204
realtime.ts:21 📡 Subscribing to channel: lobby:7740ffab-ba33-48ca-8157-a37b7bc4b204
useLobby.ts:146 ✅ Realtime subscription setup completed for join
useLobby.ts:151 🎉 joinExistingLobby completed successfully
useLobby.ts:159 🔄 Setting loading state to false
MultiplayerView.vue:46 🎯 MultiplayerView store changed: {lobby: {…}, player: {…}, playersCount: 2, players: Array(2)}
MultiplayerView.vue:56 🎯 MultiplayerView: Lobby status changed: undefined → waiting
useLobby.ts:20 🏗️ useLobby composable called
useLobby.ts:23 🏪 Initializing lobbyStore...
useLobby.ts:25 🏪 lobbyStore initialized: {isLoading: false, currentLobby: Proxy(Object), hasSetLoading: true}
useLobby.ts:524 📤 useLobby returning actions only - state accessed via store directly
LobbyWaitingRoom.vue:26 🎯 LobbyWaitingRoom props: {playersCount: 2, players: Array(2)}
LobbyWaitingRoom.vue:45 🎯 LobbyWaitingRoom allPlayersReady computed: false players: (2) [{…}, {…}]
LobbyCreateJoin.vue:54 ✅ joinExistingLobby completed successfully
realtime.ts:173 📡 Channel subscription status for lobby:7740ffab-ba33-48ca-8157-a37b7bc4b204: SUBSCRIBED 
realtime.ts:176 ✅ Successfully subscribed to lobby:7740ffab-ba33-48ca-8157-a37b7bc4b204
realtime.ts:196 🔗 Channel joined for lobby:7740ffab-ba33-48ca-8157-a37b7bc4b204
realtime.ts:200 👋 Channel left for lobby:7740ffab-ba33-48ca-8157-a37b7bc4b204
realtime.ts:204 💥 Channel system error for lobby:7740ffab-ba33-48ca-8157-a37b7bc4b204: {message: 'Unable to subscribe to changes with given paramete…, "eq", "7740ffab-ba33-48ca-8157-a37b7bc4b204"}]]', status: 'error', extension: 'postgres_changes', channel: 'lobby:7740ffab-ba33-48ca-8157-a37b7bc4b204'}
(anonymous) @ realtime.ts:204
(anonymous) @ @supabase_supabase-js.js?v=a926d579:3002
_trigger @ @supabase_supabase-js.js?v=a926d579:2987
(anonymous) @ @supabase_supabase-js.js?v=a926d579:3509
(anonymous) @ @supabase_supabase-js.js?v=a926d579:3509
decode @ @supabase_supabase-js.js?v=a926d579:2038
_onConnMessage @ @supabase_supabase-js.js?v=a926d579:3494
conn.onmessage @ @supabase_supabase-js.js?v=a926d579:3547Understand this error
LobbyWaitingRoom.vue:69 🎯 handleToggleReady called in component
useLobby.ts:165 🎯 toggleReady called
useLobby.ts:173 🎯 toggleReady: Current ready state: false → New state: true
useLobby.ts:176 ⚡ toggleReady: Applying optimistic local update
lobbyStore.ts:71 🏪 STORE: updatePlayerReady called for player 7bd43a49-d4c2-46f4-ba4a-66a761ff5ea2 ready: true
lobbyStore.ts:78 🏪 STORE: updatePlayerReady completed - fresh array assigned
useLobby.ts:180 🔄 toggleReady: Updating database...
MultiplayerView.vue:46 🎯 MultiplayerView store changed: {lobby: {…}, player: {…}, playersCount: 2, players: Array(2)}
LobbyWaitingRoom.vue:33 🎯 LobbyWaitingRoom players changed: {old: Array(2), new: Array(2)}
LobbyWaitingRoom.vue:45 🎯 LobbyWaitingRoom allPlayersReady computed: false players: (2) [{…}, {…}]
queries.ts:731 📢 Broadcasted player ready event for 360c97e2-504f-420e-a903-3dd272eed80d ready: true
useLobby.ts:187 ✅ toggleReady: Database update completed - optimistic update confirmed
realtime.ts:67 📢 REALTIME: Player ready status updated via broadcast {ready: true, userId: '4cea1883-91bc-431f-ba4f-eddc93a8b4c6'}
realtime.ts:68 📢 REALTIME: About to call onPlayerReady callback with userId: 4cea1883-91bc-431f-ba4f-eddc93a8b4c6
useLobby.ts:368 👥 REALTIME CALLBACK: Player ready status changed for player: 4cea1883-91bc-431f-ba4f-eddc93a8b4c6
useLobby.ts:370 👥 REALTIME CALLBACK: About to refresh players list for lobby: 7740ffab-ba33-48ca-8157-a37b7bc4b204
realtime.ts:71 📢 REALTIME: onPlayerReady callback called successfully
useLobby.ts:373 👥 REALTIME CALLBACK: Server players: (2) [{…}, {…}]
useLobby.ts:388 👥 REALTIME CALLBACK: Current user optimistic state - server: true local: true
useLobby.ts:400 👥 REALTIME CALLBACK: Final reconciled players: (2) [{…}, {…}]
useLobby.ts:402 👥 REALTIME CALLBACK: About to update store with reconciled players
lobbyStore.ts:35 🏪 STORE: updatePlayers called with 2 players
lobbyStore.ts:36 🏪 STORE: Current players: (2) [{…}, {…}]
lobbyStore.ts:37 🏪 STORE: New players: (2) [{…}, {…}]
lobbyStore.ts:41 🏪 STORE: updatePlayers completed - fresh array assigned
useLobby.ts:404 👥 REALTIME CALLBACK: Updated store after ready change - reactivity is automatic!
MultiplayerView.vue:46 🎯 MultiplayerView store changed: {lobby: {…}, player: {…}, playersCount: 2, players: Array(2)}
LobbyWaitingRoom.vue:33 🎯 LobbyWaitingRoom players changed: {old: Array(2), new: Array(2)}
LobbyWaitingRoom.vue:45 🎯 LobbyWaitingRoom allPlayersReady computed: true players: (2) [{…}, {…}]
LobbyWaitingRoom.vue:51 🎯 LobbyWaitingRoom canStartGame computed: false {isHost: false, allPlayersReady: true, playerCount: 2}
realtime.ts:79 📢 REALTIME: Game started via broadcast {current_round: 1, lobbyId: '7740ffab-ba33-48ca-8157-a37b7bc4b204', status: 'in_progress', timestamp: '2025-11-09T08:59:02.596Z'}
realtime.ts:80 🎮 REALTIME: Game started broadcast received - calling onGameStarted
useLobby.ts:411 🎮 REALTIME CALLBACK: onGameStarted triggered for lobby: 7740ffab-ba33-48ca-8157-a37b7bc4b204
useLobby.ts:414 📊 Fetching updated lobby with players...
realtime.ts:83 🎮 REALTIME: onGameStarted callback completed successfully
useLobby.ts:416 ✅ Got updated lobby - status: in_progress current_round: 1
useLobby.ts:418 💾 Updating lobby status in store...
useLobby.ts:420 ✅ Lobby status updated to: in_progress
useLobby.ts:422 🎯 Loading figures for game...
useLobby.ts:425 📖 Loading figure: 6774e5e2-7830-4a3d-960b-ea4103bb0a23
MultiplayerView.vue:46 🎯 MultiplayerView store changed: {lobby: {…}, player: {…}, playersCount: 2, players: Array(2)}
MultiplayerView.vue:56 🎯 MultiplayerView: Lobby status changed: waiting → in_progress
MultiplayerView.vue:58 🎮 MultiplayerView: Lobby status is now in_progress - should show game screen
useLobby.ts:20 🏗️ useLobby composable called
useLobby.ts:23 🏪 Initializing lobbyStore...
useLobby.ts:25 🏪 lobbyStore initialized: {isLoading: false, currentLobby: Proxy(Object), hasSetLoading: true}
useLobby.ts:524 📤 useLobby returning actions only - state accessed via store directly
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
useLobby.ts:35 🧹 Cleaning up realtime subscription
useLobby.ts:425 📖 Loading figure: 2bdee868-9128-4389-8cd4-ff272d0f3038
useLobby.ts:425 📖 Loading figure: d3556929-f466-468f-808f-de23560f0e21
useLobby.ts:425 📖 Loading figure: 71855ba9-176a-4d37-8e66-ad7d76a030bc
useLobby.ts:425 📖 Loading figure: f42b31f2-0c7b-4ea7-88d0-0896679aa765
useLobby.ts:425 📖 Loading figure: 8060d265-cd30-46a3-af00-aebe877c5f8c
useLobby.ts:425 📖 Loading figure: 571821e2-712f-4253-b9e2-acd347bb8910
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
useLobby.ts:425 📖 Loading figure: 53190f65-066e-4ea7-911b-7cc31946dd66
useLobby.ts:425 📖 Loading figure: 6c221933-363d-45c0-bde9-97ae38323368
useLobby.ts:425 📖 Loading figure: 0b2c1e3e-d069-406b-9986-f18aaac83c5b
useLobby.ts:429 ✅ Loaded 10 figures
useLobby.ts:431 💾 Setting figures in store...
useLobby.ts:434 🎲 Starting first round...
useLobby.ts:437 ✅ Started round 1 with figure: Pablo Picasso
useLobby.ts:442 🔄 Setting loading to false after game start
useLobby.ts:445 🎮 Game started successfully!
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: false, guessedLat: null, guessedLon: null, guessedYear: 0, …}
LobbyGameplay.vue:181 🗺️ Map clicked: Proxy(Object) {lat: 7.27529233637217, lon: 22.148437500000004} hasSubmitted: false
LobbyGameplay.vue:185 📍 Set guessedLat: 7.27529233637217 guessedLon: 22.148437500000004
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 0, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1716, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
realtime.ts:162 📢 REALTIME: Submission received via broadcast: {figure_id: '6774e5e2-7830-4a3d-960b-ea4103bb0a23', guessed_lat: 42.3138775661619, guessed_lon: -3.8671875, guessed_name: 'winny churchill', guessed_year: 1741, …}
realtime.ts:163 📨 REALTIME: About to call onSubmissionReceived callback via broadcast
useLobby.ts:466 📨 Submission received: {figure_id: '6774e5e2-7830-4a3d-960b-ea4103bb0a23', guessed_lat: 42.3138775661619, guessed_lon: -3.8671875, guessed_name: 'winny churchill', guessed_year: 1741, …}
realtime.ts:166 📨 REALTIME: onSubmissionReceived callback completed successfully via broadcast
useLobby.ts:470 📊 Updated submissions: 1 players: 2
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:59 🔘 canSubmit check: {result: true, hasSubmitted: false, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}
LobbyGameplay.vue:99 🎯 handleSubmitGuess called
LobbyGameplay.vue:100 canSubmit: true currentFigure: true
LobbyGameplay.vue:127 ✅ Client-side validation passed: {lat: 7.27529233637217, lon: 22.148437500000004, year: 1726}
LobbyGameplay.vue:130 ✅ Validation passed - proceeding with submission
LobbyGameplay.vue:156 📊 Calculated scores: {spatial: 376, temporal: 723, name: 0, speed: 0, total: 1099}
queries.ts:688 📢 Broadcast sent for submission: c131e58f-9930-497c-9efd-8a872f1773a7
LobbyGameplay.vue:59 🔘 canSubmit check: {result: false, hasSubmitted: true, guessedLat: 7.27529233637217, guessedLon: 22.148437500000004, guessedYear: 1726, …}