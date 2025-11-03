# HistoGuesser - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ Supabase account created
- ✅ Supabase project set up

---

## Step 1: Install Dependencies

```bash
npm install
```

**Expected output:** `335 packages installed, 0 vulnerabilities`

---

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env  # (if exists)
# Or create manually
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=HistoGuesser
VITE_APP_URL=http://localhost:3000
VITE_ENABLE_MULTIPLAYER=true
VITE_ENABLE_DAILY_CHALLENGE=true
```

**Where to find your Supabase credentials:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click ⚙️ Settings → API
4. Copy:
   - **URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## Step 3: Run Database Migrations

Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

### 1. Initial Schema
Open `supabase/migrations/001_initial_schema.sql` and click **RUN**

Creates tables: `figures`, `users`, `player_stats`, `daily_scores`

### 2. Multiplayer Tables
Open `supabase/migrations/002_multiplayer_tables.sql` and click **RUN**

Creates tables: `lobbies`, `lobby_players`, `lobby_submissions`

### 3. Row Level Security
Open `supabase/migrations/003_row_level_security.sql` and click **RUN**

Sets up security policies for all tables

### 4. Seed Data
Open `supabase/migrations/004_seed_figures.sql` and click **RUN**

Adds 30 historical figures for testing

**Verify:**
- Go to Table Editor → You should see 30 rows in `figures` table

---

## Step 4: Configure Authentication (Optional for Free Play)

1. Go to Authentication → Providers
2. Enable **Email** provider
3. For development, disable email confirmation:
   - Settings → Auth → **Email Confirmations** = OFF

---

## Step 5: Start the Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v7.1.12  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## Step 6: Play Free Play Mode! 🎮

1. Open browser to **http://localhost:3000**
2. Click **🎯 Free Play**
3. Start guessing!

**No login required for Free Play!**

---

## Troubleshooting

### Issue: "Failed to load game"
**Solution:** Check that:
- ✅ `.env` file exists with correct Supabase credentials
- ✅ All 4 migrations ran successfully
- ✅ `figures` table has 30 rows

### Issue: Map doesn't appear
**Solution:** 
- Clear browser cache and reload
- Check browser console for Leaflet errors
- Ensure internet connection (map tiles load from OpenStreetMap)

### Issue: Linting errors
**Solution:**
```bash
npm run lint
```
Should show: `0 errors, 0 warnings`

### Issue: TypeScript errors
**Solution:**
```bash
npm run build
```
Should complete without errors

---

## What's Working (Phase 1 Complete)

✅ **Free Play Mode**
- 10 random historical figures
- Interactive world map
- Timeline slider (BCE/CE)
- Name input
- Score calculation
- Reveal phase with fun facts
- Results screen
- Play again

✅ **Main Menu**
- Film Noir themed
- Mode selection
- Auth state awareness

✅ **All Game Components**
- Fully responsive
- Mobile-friendly
- Accessibility features

---

## What's NOT Yet Implemented

⏳ **Daily Challenge** - Coming in Phase 2  
⏳ **Multiplayer** - Coming in Phase 2  
⏳ **Leaderboards** - Coming in Phase 2  
⏳ **Login/Signup UI** - Coming in Phase 2  
⏳ **Profile Page** - Coming in Phase 2

**For now, focus on testing Free Play mode!**

---

## Testing Checklist

Try these actions:

- [ ] Click on map to place a pin
- [ ] Move the timeline slider
- [ ] Type a year directly
- [ ] Switch between BCE/CE
- [ ] Enter a name (try misspelling!)
- [ ] Click "Skip Name"
- [ ] Submit your guess
- [ ] View the reveal with score breakdown
- [ ] Click "Next Round"
- [ ] Complete all 10 rounds
- [ ] View results screen
- [ ] Click "Play Again"
- [ ] Resize browser window (test responsive design)

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Format code
npm run format
```

---

## Project Structure

```
src/
├── components/
│   ├── ui/          # Button, Card, Modal, Input, MainMenu
│   ├── game/        # Map, Timeline, Carousel, Gameplay, Results
│   └── lobby/       # (Phase 2)
├── composables/     # useMap
├── views/           # HomeView, FreePlayView, etc.
├── stores/          # gameStore, authStore, uiStore
├── lib/             # scoring, matching, geography, supabase
├── types/           # TypeScript definitions
└── styles/          # Global CSS, Film Noir theme
```

---

## Support & Documentation

📖 **Full Documentation:**
- `README.md` - Project overview
- `._docs/PRD.md` - Product requirements
- `._docs/PHASE-0-COMPLETION-REPORT.md` - Setup details
- `._docs/PHASE-1-COMPLETION-REPORT.md` - Phase 1 details
- `SUPABASE-SETUP.md` - Database setup guide

---

## Need Help?

1. Check `._docs/` folder for detailed documentation
2. Review `PHASE-1-COMPLETION-REPORT.md` for component details
3. Check browser console for errors
4. Verify Supabase dashboard for data

---

**Happy guessing! 🕰️**

Built with Vue 3 + TypeScript + Vite + Supabase + TailwindCSS

