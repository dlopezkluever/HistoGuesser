# Supabase Setup Instructions

## Step 1: Create .env File

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=HistoGuesser
VITE_APP_URL=http://localhost:3000
VITE_ENABLE_MULTIPLAYER=true
VITE_ENABLE_DAILY_CHALLENGE=true
```

## Step 2: Run Database Migrations

Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

### 1. Initial Schema (`001_initial_schema.sql`)
This creates the core tables: `figures`, `users`, `player_stats`, `daily_scores`

### 2. Multiplayer Tables (`002_multiplayer_tables.sql`)
This creates: `lobbies`, `lobby_players`, `lobby_submissions`

### 3. Row Level Security (`003_row_level_security.sql`)
This sets up RLS policies for all tables

### 4. Seed Data (`004_seed_figures.sql`)
This adds 30 historical figures for testing

## Step 3: Verify Setup

After running all migrations, you should see these tables in your Database section:
- ✅ figures (30 rows)
- ✅ users
- ✅ player_stats
- ✅ daily_scores
- ✅ lobbies
- ✅ lobby_players
- ✅ lobby_submissions

## Step 4: Test Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Disable email confirmation for development (Settings → Auth → Enable email confirmations = OFF)

## Ready to Run!

Once migrations are complete, run:
```bash
npm run dev
```

Your app will be at `http://localhost:3000`

