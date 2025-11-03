# **HistoGuesser \- Implementation Task List**

This document outlines the complete development roadmap for HistoGuesser, from initial setup through MVP to a polished, feature-complete product. Each phase builds on the previous, ensuring a continuously functional product.

---

## **Phase 0: Project Setup & Infrastructure**

### **Environment & Tooling Setup**

* \[ \] Initialize Vite \+ Vue 3 \+ TypeScript project

  * \[ \] Configure `tsconfig.json` with `noImplicitAny: true` and `strict: true`  
  * \[ \] Set up path aliases (`@/` for src directory)  
  * \[ \] Configure Vite build options and environment variables  
  * \[ \] Add ESLint \+ Prettier with project-specific rules  
  * \[ \] Create `.env.example` with required environment variables  
* \[ \] Configure TailwindCSS with Film Noir theme

  * \[ \] Install and initialize Tailwind  
  * \[ \] Add custom color tokens to `tailwind.config.js` (noir-bg, noir-surface, noir-text, noir-red, noir-gold)  
  * \[ \] Configure custom fonts (Bebas Neue, Playfair Display, Inter, JetBrains Mono)  
  * \[ \] Set up purge/content configuration for production builds  
  * \[ \] Create base CSS file with custom utility classes and `:root` variables  
* \[ \] Set up Supabase backend

  * \[ \] Create Supabase project and obtain API keys  
  * \[ \] Initialize Supabase client in `/services/api/SupabaseService.ts`  
  * \[ \] Configure environment variables for Supabase URL and anon key  
  * \[ \] Set up Supabase Auth configuration (email/password)  
  * \[ \] Create initial database schema migration file  
* \[ \] Create core directory structure

  * \[ \] Set up `/src/components` with gameplay, layout, ui subdirectories  
  * \[ \] Create `/src/composables` with game, map, system subdirectories  
  * \[ \] Set up `/src/services` with api, scoring subdirectories  
  * \[ \] Create `/src/stores` directory for Zustand stores  
  * \[ \] Set up `/src/types` for shared TypeScript interfaces  
  * \[ \] Create `/src/views` for route components

### **Database Schema Setup**

* \[ \] Create `figures` table

  * \[ \] Define schema with id, name, aliases, images (JSONB), birth\_year, death\_year, active\_year  
  * \[ \] Add hometown, lat, lon, description, tags columns  
  * \[ \] Add created\_at and updated\_at timestamps  
  * \[ \] Create indexes on commonly queried fields  
* \[ \] Create `users` table

  * \[ \] Define schema synced with Supabase Auth  
  * \[ \] Add username, avatar\_url, created\_at, updated\_at  
  * \[ \] Set up foreign key to auth.users  
  * \[ \] Create unique constraints on email and username  
* \[ \] Create `player_stats` table

  * \[ \] Define schema with user\_id (FK), total\_games, best\_score  
  * \[ \] Add daily\_streak, last\_daily\_date columns  
  * \[ \] Set up timestamps  
  * \[ \] Create index on user\_id  
* \[ \] Set up Row Level Security (RLS) policies

  * \[ \] Enable RLS on all tables  
  * \[ \] Create policies for authenticated read access on figures  
  * \[ \] Create policies for user-owned records (stats, scores)  
  * \[ \] Test RLS policies with different user roles  
* \[ \] Seed initial test data

  * \[ \] Create 20-30 test figures with proper data structure  
  * \[ \] Include diverse historical figures (different eras, regions)  
  * \[ \] Ensure all required fields are populated  
  * \[ \] Add proper image URLs (placeholder or public domain)  
  * \[ \] Validate lat/lon coordinates and birth years

---

## **Phase 1: MVP \- Core Gameplay (Free Play Mode)**

### **Type Definitions & Core Models**

* \[ \] Define core TypeScript interfaces  
  * \[ \] Create `figure-types.ts` (Figure, FigureImage, Coordinates)  
  * \[ \] Create `game-types.ts` (GameState, Round, Guess, Score)  
  * \[ \] Create `user-types.ts` (User, PlayerStats)  
  * \[ \] Create utility types for API responses  
  * \[ \] Export all types from central `index.ts`

### **Scoring System Implementation**

* \[ \] Build core scoring service

  * \[ \] Implement Haversine distance calculation in `/services/scoring/distanceCalculator.ts`  
  * \[ \] Create location accuracy scorer (max 800, linear decay)  
  * \[ \] Create temporal accuracy scorer (max 800, linear decay)  
  * \[ \] Implement tiered name matching with fuzzy logic  
  * \[ \] Create speed bonus calculator (time-based decay)  
* \[ \] Implement name matching service

  * \[ \] Set up Levenshtein or Fuse.js for fuzzy matching  
  * \[ \] Create alias normalization function  
  * \[ \] Implement tiered scoring logic (0/200/400/600/800)  
  * \[ \] Add first/last name partial match detection  
  * \[ \] Test with various misspellings and aliases  
* \[ \] Create round score aggregator

  * \[ \] Combine all scoring components into single function  
  * \[ \] Enforce max 2500 points per round  
  * \[ \] Create score breakdown object for UI display  
  * \[ \] Add validation and error handling  
  * \[ \] Write unit tests for scoring edge cases

### **Map Component & Location Guessing**

* \[ \] Set up Leaflet.js integration

  * \[ \] Create `useMap.ts` composable for map initialization  
  * \[ \] Configure OpenStreetMap tile layer  
  * \[ \] Set up map container component with proper sizing  
  * \[ \] Implement lazy loading for map library  
  * \[ \] Handle map cleanup on component unmount  
* \[ \] Implement pin placement system

  * \[ \] Create interactive pin placement on map click  
  * \[ \] Store guessed coordinates in component state  
  * \[ \] Add visual feedback for placed pin (gold outline, cream fill)  
  * \[ \] Allow pin repositioning before submission  
  * \[ \] Ensure mobile touch compatibility  
* \[ \] Create map reveal functionality

  * \[ \] Show correct location pin after submission  
  * \[ \] Draw line between guessed and correct location  
  * \[ \] Display distance in kilometers  
  * \[ \] Add smooth pan/zoom to reveal both pins  
  * \[ \] Style correct pin distinctly (red accent)

### **Timeline Slider Component**

* \[ \] Build year input system

  * \[ \] Create horizontal slider spanning \-1000 BCE to 2025 CE  
  * \[ \] Implement BCE/CE toggle button  
  * \[ \] Add direct year input field (synchronized with slider)  
  * \[ \] Snap slider to 5-year increments for mobile  
  * \[ \] Store year internally as integer (negative for BCE)  
* \[ \] Style timeline component

  * \[ \] Apply noir theme (dark track, gold progress, cream thumb)  
  * \[ \] Add visible markers at century boundaries  
  * \[ \] Show current selected year prominently  
  * \[ \] Ensure responsive sizing for mobile/desktop  
  * \[ \] Add keyboard navigation support

### **Name Input & Image Display**

* \[ \] Create figure image carousel

  * \[ \] Display figure image(s) with proper aspect ratio  
  * \[ \] Support multiple images per figure (up to 4\)  
  * \[ \] Add navigation between images if multiple  
  * \[ \] Implement lazy loading for images  
  * \[ \] Show loading state and error handling  
* \[ \] Build name input component

  * \[ \] Create text input with noir styling  
  * \[ \] Add placeholder text guidance  
  * \[ \] Implement case-insensitive input handling  
  * \[ \] Allow skip functionality (empty submission)  
  * \[ \] Style focus states with gold ring

### **Game State Management**

* \[ \] Create game state store (Zustand)

  * \[ \] Define `useGameStore.ts` with core game state  
  * \[ \] Implement round progression logic  
  * \[ \] Store current figure, guesses, scores  
  * \[ \] Track round number (1-10)  
  * \[ \] Add actions for starting/ending rounds  
* \[ \] Implement Free Play game flow

  * \[ \] Create game initialization function (select 10 random figures)  
  * \[ \] Build round start logic (load figure, reset inputs)  
  * \[ \] Implement submission handler  
  * \[ \] Calculate and store round scores  
  * \[ \] Progress to next round or end game  
  * \[ \] Reset game state for replay

### **Gameplay View & UI Integration**

* \[ \] Build main gameplay layout

  * \[ \] Create responsive two-column layout (desktop)  
  * \[ \] Implement mobile vertical stack layout  
  * \[ \] Ensure all four components visible simultaneously (md+)  
  * \[ \] Position submit button prominently  
  * \[ \] Add round counter display  
* \[ \] Create reveal phase UI

  * \[ \] Show correct answer information (name, location, year)  
  * \[ \] Display distance and year difference  
  * \[ \] Show score breakdown by component  
  * \[ \] Add figure description/fun fact  
  * \[ \] Implement "Next Round" button with auto-advance  
* \[ \] Build results screen

  * \[ \] Show final score out of 25,000  
  * \[ \] Display component breakdowns (location, temporal, name, speed)  
  * \[ \] Add "Play Again" and "Back to Menu" buttons  
  * \[ \] Show score summary statistics  
  * \[ \] Style with noir theme cards

### **Main Menu & Navigation**

* \[ \] Create main menu view

  * \[ \] Build hero section with logo/title  
  * \[ \] Add three mode buttons (Daily, Free Play, Multiplayer)  
  * \[ \] Implement guest view (lock Daily/Multiplayer)  
  * \[ \] Add bottom navigation bar  
  * \[ \] Style with noir aesthetic  
* \[ \] Set up Vue Router navigation

  * \[ \] Define routes for menu, gameplay, results  
  * \[ \] Implement route guards for protected modes  
  * \[ \] Add smooth transitions between views  
  * \[ \] Handle browser back button gracefully  
  * \[ \] Configure SPA mode (no full reloads)

### **Basic UI Components Library**

* \[ \] Create reusable button component

  * \[ \] Primary CTA style (red background, gold border)  
  * \[ \] Secondary style (black background, gold border)  
  * \[ \] Disabled state styling  
  * \[ \] Hover and active state animations  
  * \[ \] Implement with TypeScript props interface  
* \[ \] Create card component

  * \[ \] Black surface with gold border  
  * \[ \] Layered shadow for depth  
  * \[ \] Configurable padding and radius  
  * \[ \] Support for header/body/footer slots  
  * \[ \] Responsive sizing  
* \[ \] Create modal component

  * \[ \] Backdrop with 80% opacity black  
  * \[ \] Centered modal panel with noir styling  
  * \[ \] Fade \+ scale animation (280ms)  
  * \[ \] Close on backdrop click or ESC key  
  * \[ \] Trap focus within modal

---

## **Phase 2: MVP \- User Authentication & Daily Challenge**

### **Authentication System**

* \[ \] Implement Supabase Auth integration

  * \[ \] Create `useAuth.ts` composable  
  * \[ \] Build login function with email/password  
  * \[ \] Build signup function with validation  
  * \[ \] Implement logout function  
  * \[ \] Add session persistence and refresh logic  
* \[ \] Create auth UI components

  * \[ \] Build login modal with form  
  * \[ \] Build signup modal with form  
  * \[ \] Add validation and error messaging  
  * \[ \] Implement loading states  
  * \[ \] Style with noir theme  
* \[ \] Set up auth state management

  * \[ \] Create `useAuthStore.ts` in Zustand  
  * \[ \] Store current user and session  
  * \[ \] Handle auth state changes (login/logout)  
  * \[ \] Sync user data from Supabase  
  * \[ \] Add helper functions for auth checks  
* \[ \] Implement profile display

  * \[ \] Show username in main menu  
  * \[ \] Add avatar display (optional)  
  * \[ \] Create profile icon/button  
  * \[ \] Link to logout functionality  
  * \[ \] Update UI based on auth state

### **Daily Challenge Tables & Logic**

* \[ \] Create `daily_scores` table

  * \[ \] Define schema with user\_id, challenge\_date, score  
  * \[ \] Add completed\_at timestamp  
  * \[ \] Set up unique constraint (user\_id, challenge\_date)  
  * \[ \] Create indexes for leaderboard queries  
  * \[ \] Add RLS policies for user access  
* \[ \] Implement daily challenge generation

  * \[ \] Create server function to select 10 figures for date  
  * \[ \] Use deterministic seed based on date  
  * \[ \] Cache figure selection in database table  
  * \[ \] Ensure same figures shown to all players globally  
  * \[ \] Store figure order for consistency  
* \[ \] Build daily challenge flow

  * \[ \] Check if user completed today's challenge  
  * \[ \] Display challenge info screen with date/streak  
  * \[ \] Load predetermined figure set  
  * \[ \] Enable 45-second timer per round  
  * \[ \] Submit final score to daily\_scores table  
* \[ \] Implement streak tracking

  * \[ \] Update player\_stats on challenge completion  
  * \[ \] Calculate consecutive days played  
  * \[ \] Reset streak on missed day  
  * \[ \] Display streak counter in UI  
  * \[ \] Add streak fire emoji indicator

### **Leaderboard System**

* \[ \] Create leaderboard query service

  * \[ \] Build query for top 100 players by date  
  * \[ \] Order by score DESC, completed\_at ASC  
  * \[ \] Fetch user's rank relative to all players  
  * \[ \] Add pagination support for large datasets  
  * \[ \] Cache results for performance  
* \[ \] Build leaderboard UI

  * \[ \] Create leaderboard modal/overlay  
  * \[ \] Display top 100 with rank, username, score  
  * \[ \] Highlight current user's position  
  * \[ \] Add date selector for historical leaderboards  
  * \[ \] Style with noir theme (gold for top 3\)  
* \[ \] Implement score submission validation

  * \[ \] Create server-side scoring validation function  
  * \[ \] Compare client-submitted score with server calculation  
  * \[ \] Reject scores outside valid range  
  * \[ \] Log suspicious submissions  
  * \[ \] Update player\_stats after validation

### **Timer & Speed Bonus**

* \[ \] Implement round timer

  * \[ \] Create `useRoundTimer.ts` composable  
  * \[ \] Display countdown in monospaced font  
  * \[ \] Update every second  
  * \[ \] Auto-submit on timer expiration (multiplayer)  
  * \[ \] Calculate elapsed time for speed bonus  
* \[ \] Build speed bonus calculator

  * \[ \] Implement formula (110 \- floor(time/2) \* 10\)  
  * \[ \] Cap at 100 points max  
  * \[ \] Only apply in Daily/Multiplayer modes  
  * \[ \] Show bonus in score breakdown  
  * \[ \] Add visual indicator for fast submissions

### **Guest-to-User Conversion Flow**

* \[ \] Implement post-game signup prompt

  * \[ \] Detect guest completion of Free Play  
  * \[ \] Show signup modal with benefits  
  * \[ \] Allow dismissal without blocking  
  * \[ \] Track modal shown/dismissed state  
  * \[ \] Style with persuasive copy and noir aesthetic  
* \[ \] Build seamless signup flow

  * \[ \] Pre-fill any available data  
  * \[ \] Complete signup without leaving results screen  
  * \[ \] Automatically authenticate after signup  
  * \[ \] Return to authenticated main menu  
  * \[ \] Show welcome message

---

## **Phase 3: Multiplayer Mode**

### **Multiplayer Database Tables**

* \[ \] Create `lobbies` table

  * \[ \] Define schema with id, room\_code, host\_id, status  
  * \[ \] Add current\_round, figure\_ids array, created\_at, expires\_at  
  * \[ \] Create unique index on room\_code  
  * \[ \] Set up auto-deletion after 24 hours  
  * \[ \] Add RLS policies for lobby access  
* \[ \] Create `lobby_players` table

  * \[ \] Define schema with lobby\_id, user\_id, username, score  
  * \[ \] Add ready, connected boolean flags  
  * \[ \] Include joined\_at timestamp  
  * \[ \] Create composite index on (lobby\_id, user\_id)  
  * \[ \] Add RLS policies for player visibility  
* \[ \] Create `lobby_submissions` table

  * \[ \] Define schema with lobby\_id, user\_id, round\_number, figure\_id  
  * \[ \] Add guess data (name, lat, lon, year)  
  * \[ \] Include submission\_time, score, submitted\_at  
  * \[ \] Create indexes for quick round result queries  
  * \[ \] Add RLS policies for submission access

### **Lobby Management System**

* \[ \] Implement lobby creation

  * \[ \] Generate unique 6-character room codes  
  * \[ \] Create lobby record in database  
  * \[ \] Select 10 random figures for game  
  * \[ \] Set host as lobby creator  
  * \[ \] Return lobby details to client  
* \[ \] Build lobby join functionality

  * \[ \] Validate room code exists and is open  
  * \[ \] Check player capacity (max 8\)  
  * \[ \] Add player to lobby\_players table  
  * \[ \] Subscribe to lobby updates via Realtime  
  * \[ \] Handle join errors gracefully  
* \[ \] Create lobby state management

  * \[ \] Create `useLobbyStore.ts` in Zustand  
  * \[ \] Track current lobby, players, status  
  * \[ \] Handle lobby updates from Realtime  
  * \[ \] Manage player ready states  
  * \[ \] Store game progress and scores

### **Supabase Realtime Integration**

* \[ \] Set up Realtime subscriptions

  * \[ \] Subscribe to lobby\_players changes  
  * \[ \] Subscribe to lobby status updates  
  * \[ \] Subscribe to round submissions  
  * \[ \] Handle connection state changes  
  * \[ \] Implement reconnection logic  
* \[ \] Build Realtime event handlers

  * \[ \] Handle player join/leave events  
  * \[ \] Update player list in real-time  
  * \[ \] Sync ready states across clients  
  * \[ \] Broadcast round start/end  
  * \[ \] Sync score updates after each round  
* \[ \] Implement server-authoritative timing

  * \[ \] Store round start time on server  
  * \[ \] Validate submission times server-side  
  * \[ \] Reject late submissions  
  * \[ \] Auto-advance rounds on server timer  
  * \[ \] Prevent client-side timer manipulation

### **Multiplayer UI Components**

* \[ \] Create lobby creation screen

  * \[ \] Add "Create Game" button  
  * \[ \] Show generated room code prominently  
  * \[ \] Add "Copy Code" functionality  
  * \[ \] Display shareable invite link  
  * \[ \] Style with noir theme  
* \[ \] Build waiting room UI

  * \[ \] Display room code at top  
  * \[ \] Show list of connected players  
  * \[ \] Indicate host with badge  
  * \[ \] Show ready status indicators  
  * \[ \] Add "Start Game" button (host only)  
* \[ \] Implement join lobby screen

  * \[ \] Add room code input field  
  * \[ \] Validate code format  
  * \[ \] Show "Join" button  
  * \[ \] Handle join errors with messages  
  * \[ \] Add "Back to Menu" option  
* \[ \] Create live score display

  * \[ \] Show round-by-round scores for all players  
  * \[ \] Update in real-time after reveals  
  * \[ \] Highlight current user  
  * \[ \] Show cumulative totals  
  * \[ \] Style with noir leaderboard aesthetic

### **Multiplayer Game Flow**

* \[ \] Implement synchronized round start

  * \[ \] Host triggers game start  
  * \[ \] Broadcast to all players via Realtime  
  * \[ \] Load first figure simultaneously  
  * \[ \] Start 45-second timer for all players  
  * \[ \] Lock out new players once started  
* \[ \] Build submission synchronization

  * \[ \] Submit guesses to server on player action  
  * \[ \] Store in lobby\_submissions table  
  * \[ \] Wait for all players or timer expiration  
  * \[ \] Trigger reveal phase when ready  
  * \[ \] Calculate and broadcast scores  
* \[ \] Implement auto-advance logic

  * \[ \] 8-second reveal phase with auto-countdown  
  * \[ \] Advance to next round automatically  
  * \[ \] Sync all clients to same round  
  * \[ \] Handle disconnections gracefully  
  * \[ \] End game after round 10  
* \[ \] Create multiplayer results screen

  * \[ \] Show final standings with medals (🥇🥈🥉)  
  * \[ \] Display winner announcement  
  * \[ \] Show each player's component breakdowns  
  * \[ \] Add "Play Again" option (reuse lobby)  
  * \[ \] Add "Back to Menu" button

### **Connection Handling & Edge Cases**

* \[ \] Implement disconnect detection

  * \[ \] Mark players as disconnected in real-time  
  * \[ \] Show connection status in UI  
  * \[ \] Allow reconnection to active game  
  * \[ \] Auto-remove after timeout  
  * \[ \] Notify other players of disconnects  
* \[ \] Handle host migration

  * \[ \] Transfer host role if host leaves  
  * \[ \] Pick next earliest joined player  
  * \[ \] Update UI to show new host  
  * \[ \] Preserve game state through migration  
  * \[ \] Notify all players of host change  
* \[ \] Build lobby cleanup

  * \[ \] Auto-expire lobbies after 24 hours  
  * \[ \] Clean up abandoned lobbies (no players)  
  * \[ \] Remove finished games after results shown  
  * \[ \] Implement database cleanup cron job  
  * \[ \] Log cleanup operations

---

## **Phase 4: Polish & Enhancement**

### **Advanced UI/UX Improvements**

* \[ \] Implement smooth animations

  * \[ \] Add reveal phase crossfade (300-450ms)  
  * \[ \] Implement map pin drop animation  
  * \[ \] Create score counter animation  
  * \[ \] Add modal fade \+ scale entrance  
  * \[ \] Respect `prefers-reduced-motion`  
* \[ \] Build loading states

  * \[ \] Add skeleton loaders for figure images  
  * \[ \] Show loading spinner for API calls  
  * \[ \] Display "Finding game..." for lobby join  
  * \[ \] Add progress indicator for game initialization  
  * \[ \] Style with noir theme  
* \[ \] Enhance error handling

  * \[ \] Create error toast notifications  
  * \[ \] Add retry mechanisms for failed requests  
  * \[ \] Show user-friendly error messages  
  * \[ \] Implement offline detection  
  * \[ \] Log errors for debugging  
* \[ \] Add accessibility features

  * \[ \] Ensure 4.5:1 contrast ratio everywhere  
  * \[ \] Add keyboard navigation for all controls  
  * \[ \] Implement focus trap in modals  
  * \[ \] Add ARIA labels to interactive elements  
  * \[ \] Ensure 44-48px touch targets on mobile

### **Advanced Gameplay Features**

* \[ \] Build hint system (Free Play only)

  * \[ \] Add "Hint" button to gameplay UI  
  * \[ \] Show region/continent hint for location  
  * \[ \] Show century/era hint for timeline  
  * \[ \] Show first/last name initial hints  
  * \[ \] Deduct points for hints used  
* \[ \] Implement skip functionality

  * \[ \] Add "Skip" button (Free Play only)  
  * \[ \] Award 0 points for skipped component  
  * \[ \] Show answer immediately  
  * \[ \] Allow continuing to next round  
  * \[ \] Track skip statistics  
* \[ \] Create practice mode variants

  * \[ \] Add era-specific practice (e.g., "Ancient World")  
  * \[ \] Add region-specific practice (e.g., "European Figures")  
  * \[ \] Add category practice (e.g., "Scientists Only")  
  * \[ \] Allow custom figure selection  
  * \[ \] Track practice mode statistics

### **Visual Polish & Theme Refinement**

* \[ \] Add texture overlays

  * \[ \] Create subtle grain texture for cards  
  * \[ \] Add paper texture to backgrounds (≤0.06 opacity)  
  * \[ \] Implement via CSS/SVG patterns  
  * \[ \] Keep under 20KB total size  
  * \[ \] Test on various devices  
* \[ \] Enhance button states

  * \[ \] Add micro-interactions on hover  
  * \[ \] Implement press effect (inset shadow)  
  * \[ \] Add glow effect on focus  
  * \[ \] Create disabled state animations  
  * \[ \] Ensure smooth 60fps transitions  
* \[ \] Refine typography

  * \[ \] Fine-tune letter spacing for titles  
  * \[ \] Add subtle text shadows for legibility  
  * \[ \] Optimize line heights for readability  
  * \[ \] Ensure responsive font sizes  
  * \[ \] Test on various screen sizes  
* \[ \] Polish map interactions

  * \[ \] Add hover state for map cursor  
  * \[ \] Improve pin placement feedback  
  * \[ \] Add subtle animation to distance line  
  * \[ \] Enhance zoom/pan controls  
  * \[ \] Optimize for touch gestures

### **Performance Optimization**

* \[ \] Implement code splitting

  * \[ \] Lazy-load map component  
  * \[ \] Lazy-load multiplayer lobby  
  * \[ \] Split vendor chunks  
  * \[ \] Optimize bundle sizes  
  * \[ \] Test initial load time  
* \[ \] Optimize image delivery

  * \[ \] Set up Supabase image transformations  
  * \[ \] Serve WebP format with fallbacks  
  * \[ \] Implement responsive images  
  * \[ \] Add lazy loading for off-screen images  
  * \[ \] Configure CDN caching headers  
* \[ \] Database query optimization

  * \[ \] Add database indexes on hot paths  
  * \[ \] Implement query result caching  
  * \[ \] Use materialized views for leaderboards  
  * \[ \] Optimize Realtime subscriptions  
  * \[ \] Test query performance under load  
* \[ \] Frontend optimization

  * \[ \] Minimize re-renders in Vue components  
  * \[ \] Use computed properties for derived state  
  * \[ \] Memoize expensive calculations  
  * \[ \] Debounce map interactions  
  * \[ \] Profile and fix performance bottlenecks

### **Analytics & Monitoring**

* \[ \] Implement basic analytics

  * \[ \] Track games played per mode  
  * \[ \] Monitor user retention  
  * \[ \] Track conversion rate (guest → user)  
  * \[ \] Measure average scores by mode  
  * \[ \] Log completion rates  
* \[ \] Set up error tracking

  * \[ \] Integrate error logging service  
  * \[ \] Track client-side errors  
  * \[ \] Monitor API failures  
  * \[ \] Log Realtime connection issues  
  * \[ \] Set up alerts for critical errors  
* \[ \] Build admin dashboard (basic)

  * \[ \] View total users and games  
  * \[ \] Monitor daily challenge participation  
  * \[ \] Check figure data quality  
  * \[ \] View leaderboard snapshots  
  * \[ \] Access error logs

### **Content & Data Management**

* \[ \] Build figure ingestion pipeline

  * \[ \] Create admin interface for adding figures  
  * \[ \] Implement image upload with validation  
  * \[ \] Add license metadata requirements  
  * \[ \] Create approval workflow  
  * \[ \] Build bulk import from CSV  
* \[ \] Expand figure database

  * \[ \] Add 100+ diverse historical figures  
  * \[ \] Ensure era diversity (ancient, medieval, modern)  
  * \[ \] Ensure geographic diversity (all continents)  
  * \[ \] Ensure field diversity (science, arts, politics, etc.)  
  * \[ \] Validate all data quality  
* \[ \] Implement figure tagging system

  * \[ \] Create tag taxonomy  
  * \[ \] Tag all figures appropriately  
  * \[ \] Build filtering by tags  
  * \[ \] Allow practice mode by tag  
  * \[ \] Create tag-based recommendations

### **Settings & Customization**

* \[ \] Create settings modal

  * \[ \] Add sound effects toggle  
  * \[ \] Add animation toggle  
  * \[ \] Add theme variant selector (if applicable)  
  * \[ \] Add language selector placeholder  
  * \[ \] Style with noir aesthetic  
* \[ \] Implement user preferences

  * \[ \] Store settings in local storage  
  * \[ \] Sync settings to database (logged-in)  
  * \[ \] Apply preferences across sessions  
  * \[ \] Add reset to defaults option  
  * \[ \] Validate preference values

### **Mobile Optimization**

* \[ \] Optimize mobile layouts

  * \[ \] Test on various screen sizes (320px+)  
  * \[ \] Improve touch target sizes  
  * \[ \] Optimize map controls for touch  
  * \[ \] Ensure readable text sizes  
  * \[ \] Test landscape orientation  
* \[ \] Improve mobile performance

  * \[ \] Reduce initial bundle size  
  * \[ \] Optimize images for mobile bandwidth  
  * \[ \] Minimize JavaScript execution  
  * \[ \] Test on low-end devices  
  * \[ \] Implement service worker for offline  
* \[ \] Add PWA capabilities

  * \[ \] Create manifest.json  
  * \[ \] Add app icons (various sizes)  
  * \[ \] Implement service worker  
  * \[ \] Enable add-to-home-screen  
  * \[ \] Test offline functionality

### **Testing & QA**

* \[ \] Write unit tests

  * \[ \] Test all scoring functions  
  * \[ \] Test name matching algorithms  
  * \[ \] Test date/year calculations  
  * \[ \] Test state management functions  
  * \[ \] Achieve 80%+ code coverage  
* \[ \] Write integration tests

  * \[ \] Test complete Free Play flow  
  * \[ \] Test Daily Challenge flow  
  * \[ \] Test multiplayer lobby flow  
  * \[ \] Test authentication flows  
  * \[ \] Test error scenarios  
* \[ \] Perform cross-browser testing

  * \[ \] Test on Chrome, Firefox, Safari, Edge  
  * \[ \] Test on mobile browsers (iOS Safari, Chrome Android)  
  * \[ \] Fix browser-specific bugs  
  * \[ \] Verify consistent styling  
  * \[ \] Test Realtime on all browsers  
* \[ \] Conduct user acceptance testing

  * \[ \] Run beta with 20-50 users  
  * \[ \] Collect feedback on gameplay  
  * \[ \] Identify pain points in UX  
  * \[ \] Test multiplayer with real players  
  * \[ \] Iterate based on feedback

### **Documentation & Deployment**

* \[ \] Write developer documentation

  * \[ \] Document component APIs  
  * \[ \] Explain state management patterns  
  * \[ \] Document scoring algorithms  
  * \[ \] Create setup guide for new developers  
  * \[ \] Add code comments to complex functions  
* \[ \] Create user help content

  * \[ \] Write gameplay tutorial  
  * \[ \] Create FAQ page  
  * \[ \] Add in-game help tooltips  
  * \[ \] Document scoring system for players  
  * \[ \] Create video walkthrough (optional)  
* \[ \] Set up production deployment

  * \[ \] Configure Vercel project  
  * \[ \] Set up environment variables  
  * \[ \] Configure custom domain  
  * \[ \] Set up SSL certificates  
  * \[ \] Test production build  
* \[ \] Implement CI/CD pipeline

  * \[ \] Configure GitHub Actions or similar  
  * \[ \] Run tests on every PR  
  * \[ \] Auto-deploy to staging on merge to dev  
  * \[ \] Auto-deploy to production on merge to main  
  * \[ \] Set up deployment notifications  
* \[ \] Prepare for launch

  * \[ \] Create marketing landing page  
  * \[ \] Set up social media accounts  
  * \[ \] Prepare press kit  
  * \[ \] Plan launch announcement  
  * \[ \] Monitor launch day performance

---

## **Phase 5: Post-Launch Enhancements (Future)**

### **Advanced Features (Not MVP)**

* \[ \] Implement AI-powered hints  
* \[ \] Add social sharing features  
* \[ \] Create team tournaments mode  
* \[ \] Build figure recommendation engine  
* \[ \] Add achievements/badges system  
* \[ \] Implement player profiles and stats  
* \[ \] Create educational mode with extended info  
* \[ \] Add voice narration for accessibility  
* \[ \] Build API for third-party integrations

### **Scalability Improvements (As Needed)**

* \[ \] Migrate Realtime to dedicated WebSocket server  
* \[ \] Implement Redis caching layer  
* \[ \] Set up database read replicas  
* \[ \] Configure CDN for global distribution  
* \[ \] Optimize for 1000+ concurrent multiplayer lobbies  
* \[ \] Implement rate limiting and DDoS protection  
* \[ \] Set up multi-region deployment

---

## **Ongoing Maintenance**

* \[ \] Monitor application health and performance  
* \[ \] Review and moderate user-generated content (if added)  
* \[ \] Update figure database regularly  
* \[ \] Address bug reports and user feedback  
* \[ \] Keep dependencies updated and secure  
* \[ \] Perform regular database backups  
* \[ \] Review and optimize cloud costs

---

**Total Tasks:** \~250+  
 **Estimated MVP Timeline:** 8-12 weeks (single developer)  
 **Estimated Full Polish:** 14-18 weeks (single developer)

This task list follows the AI-first principles with clear, actionable steps that can be implemented incrementally while maintaining a functional product at every phase.

