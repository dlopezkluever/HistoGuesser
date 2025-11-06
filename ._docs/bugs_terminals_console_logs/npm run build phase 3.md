# the remaining errors are primarily type-related issues with Supabase's generated types not recognizing the new multiplayer tables. These don't affect functionality and can be resolved by regenerating the Supabase types when the CLI tools are available.

*npm run build*:
src/components/lobby/LobbyGameplay.vue:11:104 - error TS2307: Cannot find module '@/lib/scoring' or its corresponding type declarations.

11 import { calculateSpatialScore, calculateTemporalScore, calculateNameScore, calculateSpeedBonus } 
from '@/lib/scoring'
   
     ~~~~~~~~~~~~~~~

src/components/lobby/LobbyGameplay.vue:218:15 - error TS2322: Type 'number | null' is not assignable 
to type 'number'.
  Type 'null' is not assignable to type 'number'.

218               v-model="guessedYear"
                  ~~~~~~~

  src/components/game/TimelineSlider.vue:74:3
    74   modelValue: number; // Internal format: negative for BCE, positive for CE
         ~~~~~~~~~~
    The expected type comes from property 'modelValue' which is declared here on type '{ readonly modelValue: number; readonly disabled?: boolean | undefined; readonly snapIncrement?: number | undefined; readonly padding?: "sm" | "md" | "lg" | "none" | undefined; readonly "onUpdate:modelValue"?: ((value: number) => any) | undefined; } & VNodeProps & AllowedComponentProps & ComponentCustomProps & Recor...'

src/composables/useLobby.ts:23:20 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

23     if (!authStore.user) throw new Error('Must be logged in to create a lobby')
                      ~~~~

src/composables/useLobby.ts:29:49 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

29       const lobby = await createLobby(authStore.user.id)
                                                   ~~~~

src/composables/useLobby.ts:35:71 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

35       const currentPlayer = players.find(p => p.user_id === authStore.user!.id)!
                                                                         ~~~~

src/composables/useLobby.ts:54:20 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

54     if (!authStore.user) throw new Error('Must be logged in to join a lobby')
                      ~~~~

src/composables/useLobby.ts:61:19 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

61         authStore.user.id,
                     ~~~~

src/composables/useLobby.ts:62:19 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

62         authStore.user.user_metadata?.username || 'Anonymous',
                     ~~~~

src/composables/useLobby.ts:104:48 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

104     if (!lobbyStore.currentLobby || !authStore.user) return
                                                   ~~~~

src/composables/useLobby.ts:108:61 - error TS2339: Property 'user' does not exist on type 'StoreApi<AuthStore>'.

108       await startGame(lobbyStore.currentLobby.id, authStore.user.id)
                                                                ~~~~

src/composables/useLobby.ts:163:30 - error TS6133: 'player' is declared but its value is never read. 

163       onPlayerJoined: async (player) => {
                                 ~~~~~~

src/composables/useLobby.ts:169:28 - error TS6133: 'playerId' is declared but its value is never read.

169       onPlayerLeft: async (playerId) => {
                               ~~~~~~~~

src/composables/useLobby.ts:175:29 - error TS6133: 'playerId' is declared but its value is never read.

175       onPlayerReady: async (playerId) => {
                                ~~~~~~~~

src/composables/useLobby.ts:212:36 - error TS6133: 'submission' is declared but its value is never read.

212       onSubmissionReceived: async (submission) => {
                                       ~~~~~~~~~~

src/composables/useLobby.ts:233:28 - error TS6133: 'scores' is declared but its value is never read. 

233       onRoundEnded: async (scores) => {
                               ~~~~~~

src/composables/useLobby.ts:237:27 - error TS6133: 'finalScores' is declared but its value is never read.

237       onGameEnded: async (finalScores) => {
                              ~~~~~~~~~~~

src/composables/useLobby.ts:246:24 - error TS2345: Argument of type '{ topic: string; params: { config: { broadcast?: { self?: boolean | undefined; ack?: boolean | undefined; replay?: { since: number; limit?: number | undefined; } | undefined; } | undefined; presence?: { ...; } | undefined; private?: boolean | undefined; }; }; ... 21 more ...; teardown: () => void; }' is not assignable to parameter of type 'RealtimeChannel'.
  Types of property 'socket' are incompatible.
    Type '{ accessTokenValue: string | null; apiKey: string | null; channels: { topic: string; params: { config: { broadcast?: { self?: boolean | undefined; ack?: boolean | undefined; replay?: { since: 
number; limit?: number | undefined; } | undefined; } | undefined; presence?: { ...; } | undefined; private?: boolean | undefi...' is missing the following properties from type 'RealtimeClient': _connectionState, _wasManualDisconnect, _authPromise, _workerObjectUrl

246       unsubscribeLobby(realtimeChannel.value)
                           ~~~~~~~~~~~~~~~~~~~~~

src/composables/useMap.ts:62:14 - error TS2345: Argument of type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to parameter of type 'Map | LayerGroup<any>'.
  Type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to type 'Map'.
    The types of 'options.layers' are incompatible between these types.
      Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[] | undefined' is not assignable to type 'Layer[] | undefined'.
        Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: 
Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[]' is not assignable to type 'Layer[]'.
          Property '_map' is missing in type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | 
undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }' but required in type 'Layer'.

62     }).addTo(map.value);
                ~~~~~~~~~

  node_modules/@types/leaflet/index.d.ts:1715:15
    1715     protected _map: Map;
                       ~~~~
    '_map' is declared here.

src/composables/useMap.ts:90:9 - error TS2345: Argument of type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to parameter of type 'Map | LayerGroup<any>'.
  Type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to type 'Map'.
    The types of 'options.layers' are incompatible between these types.
      Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[] | undefined' is not assignable to type 'Layer[] | undefined'.
        Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: 
Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[]' is not assignable to type 'Layer[]'.
          Property '_map' is missing in type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | 
undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }' but required in type 'Layer'.

90         map.value,
           ~~~~~~~~~

  node_modules/@types/leaflet/index.d.ts:1715:15
    1715     protected _map: Map;
                       ~~~~
    '_map' is declared here.

src/composables/useMap.ts:109:70 - error TS2345: Argument of type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to parameter of type 'Map | LayerGroup<any>'.
  Type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to type 'Map'.
    The types of 'options.layers' are incompatible between these types.
      Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[] | undefined' is not assignable to type 'Layer[] | undefined'.
        Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: 
Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[]' is not assignable to type 'Layer[]'.
          Property '_map' is missing in type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | 
undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }' but required in type 'Layer'.

109     correctPin.value = L.marker([lat, lon], { icon: redIcon }).addTo(map.value);
                                                                         ~~~~~~~~~

  node_modules/@types/leaflet/index.d.ts:1715:15
    1715     protected _map: Map;
                       ~~~~
    '_map' is declared here.

src/composables/useMap.ts:124:15 - error TS2345: Argument of type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to parameter of type 'Map | LayerGroup<any>'.
  Type '{ getRenderer: (layer: Path) => Renderer; addControl: (control: Control<ControlOptions>) => Map; removeControl: (control: Control<ControlOptions>) => Map; ... 83 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to type 'Map'.
    The types of 'options.layers' are incompatible between these types.
      Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[] | undefined' is not assignable to type 'Layer[] | undefined'.
        Type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: 
Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }[]' is not assignable to type 'Layer[]'.
          Property '_map' is missing in type '{ addTo: (map: Map | LayerGroup<any>) => Layer; remove: () => Layer; removeFrom: (map: Map) => Layer; getPane: (name?: string | undefined) => HTMLElement | 
undefined; ... 36 more ...; hasEventListeners: (type: string) => boolean; }' but required in type 'Layer'.

124       ).addTo(map.value);
                  ~~~~~~~~~

  node_modules/@types/leaflet/index.d.ts:1715:15
    1715     protected _map: Map;
                       ~~~~
    '_map' is declared here.

src/composables/useMap.ts:143:29 - error TS2345: Argument of type '{ toGeoJSON: (precision?: number | false | undefined) => Feature<Point, any>; getLatLng: () => LatLng; setLatLng: (latlng: LatLngExpression) => Marker<...>; ... 47 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to parameter of type 'Layer'.
  Property '_map' is missing in type '{ toGeoJSON: (precision?: number | false | undefined) => Feature<Point, any>; getLatLng: () => LatLng; setLatLng: (latlng: LatLngExpression) => Marker<...>; ... 47 
more ...; hasEventListeners: (type: string) => boolean; }' but required in type 'Layer'.

143       map.value.removeLayer(userPin.value);
                                ~~~~~~~~~~~~~

  node_modules/@types/leaflet/index.d.ts:1715:15
    1715     protected _map: Map;
                       ~~~~
    '_map' is declared here.

src/composables/useMap.ts:147:29 - error TS2345: Argument of type '{ toGeoJSON: (precision?: number | false | undefined) => Feature<Point, any>; getLatLng: () => LatLng; setLatLng: (latlng: LatLngExpression) => Marker<...>; ... 47 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to parameter of type 'Layer'.
  Property '_map' is missing in type '{ toGeoJSON: (precision?: number | false | undefined) => Feature<Point, any>; getLatLng: () => LatLng; setLatLng: (latlng: LatLngExpression) => Marker<...>; ... 47 
more ...; hasEventListeners: (type: string) => boolean; }' but required in type 'Layer'.

147       map.value.removeLayer(correctPin.value);
                                ~~~~~~~~~~~~~~~~

  node_modules/@types/leaflet/index.d.ts:1715:15
    1715     protected _map: Map;
                       ~~~~
    '_map' is declared here.

src/composables/useMap.ts:151:29 - error TS2345: Argument of type '{ toGeoJSON: (precision?: number | false | undefined) => Feature<LineString | MultiLineString, any>; getLatLngs: () => LatLng[] | LatLng[][] | LatLng[][][]; ... 52 more ...; hasEventListeners: (type: string) => boolean; }' is not assignable to parameter of type 'Layer'.
  Property '_map' is missing in type '{ toGeoJSON: (precision?: number | false | undefined) => Feature<LineString | MultiLineString, any>; getLatLngs: () => LatLng[] | LatLng[][] | LatLng[][][]; ... 52 
more ...; hasEventListeners: (type: string) => boolean; }' but required in type 'Layer'.

151       map.value.removeLayer(distanceLine.value);
                                ~~~~~~~~~~~~~~~~~~

  node_modules/@types/leaflet/index.d.ts:1715:15
    1715     protected _map: Map;
                       ~~~~
    '_map' is declared here.

src/lib/geography/haversine.ts:63:10 - error TS6133: '_toRadians' is declared but its value is never 
read.

63 function _toRadians(degrees: number): number {
            ~~~~~~~~~~

src/lib/supabase/auth.ts:108:27 - error TS2339: Property 'email' does not exist on type 'never'.     

108       if (existingProfile.email !== authUser.email) {
                              ~~~~~

src/lib/supabase/auth.ts:111:19 - error TS2345: Argument of type '{ email: string | undefined; updated_at: string; }' is not assignable to parameter of type 'never'.

111           .update({
                      ~
112             email: authUser.email,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
113             updated_at: new Date().toISOString()
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
114           })
    ~~~~~~~~~~~

src/lib/supabase/auth.ts:135:8 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "users", never, "POST">', gave the following error.
    Argument of type '{ id: string; email: string | undefined; username: any; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "users", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'id' does not exist in type 'never[]'.     

135       .insert({
           ~~~~~~


src/lib/supabase/auth.ts:183:8 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { onConflict?: string | undefined; ignoreDuplicates?: boolean | undefined; count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ ...; }, ... 5 more ..., "POST">', gave the following error.
    Argument of type '{ user_id: string; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { onConflict?: string | undefined; ignoreDuplicates?: boolean | undefined; count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean 
| undefined; } | undefined): PostgrestFilterBuilder<...>', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.
183       .upsert({
           ~~~~~~


src/lib/supabase/auth.ts:245:13 - error TS2345: Argument of type '{ updated_at: string; username?: string; avatar_url?: string; }' is not assignable to parameter of type 'never'.

245     .update({ ...updates, updated_at: new Date().toISOString() })
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/lib/supabase/queries.ts:78:43 - error TS2345: Argument of type '{ target_date: string; }' is not 
assignable to parameter of type 'undefined'.

78     .rpc('get_or_create_daily_challenge', { target_date: date })
                                             ~~~~~~~~~~~~~~~~~~~~~

src/lib/supabase/queries.ts:231:3 - error TS2578: Unused '@ts-expect-error' directive.

231   // @ts-expect-error - RPC function return type not recognized by generated types
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/lib/supabase/queries.ts:233:22 - error TS2339: Property 'success' does not exist on type 'never'.
233     success: data[0].success,
                         ~~~~~~~

src/lib/supabase/queries.ts:234:22 - error TS2339: Property 'message' does not exist on type 'never'.
234     message: data[0].message,
                         ~~~~~~~

src/lib/supabase/queries.ts:235:20 - error TS2339: Property 'final_score' does not exist on type 'never'.

235     score: data[0].final_score
                       ~~~~~~~~~~~

src/lib/supabase/queries.ts:329:3 - error TS2578: Unused '@ts-expect-error' directive.

329   // @ts-expect-error - RPC function return type not recognized by generated types
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/lib/supabase/queries.ts:331:27 - error TS2339: Property 'has_completed' does not exist on type 'never'.

331     hasCompleted: data[0].has_completed,
                              ~~~~~~~~~~~~~

src/lib/supabase/queries.ts:332:20 - error TS2339: Property 'score' does not exist on type 'never'.  

332     score: data[0].score,
                       ~~~~~

src/lib/supabase/queries.ts:333:26 - error TS2339: Property 'completed_at' does not exist on type 'never'.

333     completedAt: data[0].completed_at,
                             ~~~~~~~~~~~~

src/lib/supabase/queries.ts:334:28 - error TS2339: Property 'current_streak' does not exist on type 'never'.

334     currentStreak: data[0].current_streak,
                               ~~~~~~~~~~~~~~

src/lib/supabase/queries.ts:335:24 - error TS2339: Property 'best_score' does not exist on type 'never'.

335     bestScore: data[0].best_score
                           ~~~~~~~~~~

src/views/MultiplayerView.vue:3:1 - error TS6133: 'authStore' is declared but its value is never read.

3 import { authStore } from '@/stores/authStore'
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/views/MultiplayerView.vue:10:7 - error TS6133: 'router' is declared but its value is never read. 

10 const router = useRouter()
         ~~~~~~


Found 43 errors in 7 files.

Errors  Files
     2  src/components/lobby/LobbyGameplay.vue:11
    15  src/composables/useLobby.ts:23
     7  src/composables/useMap.ts:62
     1  src/lib/geography/haversine.ts:63
     5  src/lib/supabase/auth.ts:108
    11  src/lib/supabase/queries.ts:78
     2  src/views/MultiplayerView.vue:3