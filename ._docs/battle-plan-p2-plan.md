  # *SECOND PLAN (IMPLEMENTING)*:
 
 Ready to code?

 Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ Phase 2 Completion Plan: Data Collection Pipeline (300 Milestone → 1000+)

 Context

 HistoGuesser currently has ~130 historical figures (30 seed + ~97 from migration 008). The
 figures-game-mode-dev-battle-plan Phase 2 goal is a scalable data collection pipeline. We're        
 targeting 300 figures as the first milestone (~170 new), with the pipeline designed to scale to     
 1000+ in future runs. Using a hybrid approach (AI generates candidates, scripts validate/enrich via 
  Wikipedia API, user reviews edge cases). We're also self-hosting images via Supabase Storage       
 instead of hotlinking Wikipedia.

 Phase 1 (image fallback system) is already complete. Existing scripts (get-wiki-images.ts,
 find-figure-images.ts, validate-figures-images.ts) provide foundation to build on.

 ---
 Step 1: Set Up Supabase Storage for Images

 Goal: Create infrastructure to self-host figure images instead of relying on fragile Wikipedia      
 hotlinks.

 1a. Create Supabase Storage bucket + schema additions

 - New migration file: supabase/migrations/012_figure_image_storage.sql
   - Create a public figure-images storage bucket
   - Add RLS policy: public read access for all, service-role-only write
   - Add research_stage column to figures table: TEXT DEFAULT 'seed' — values: 'seed',
 'ai_generated', 'validated', 'reviewed'
   - Backfill existing figures: UPDATE figures SET research_stage = 'seed'
   - No new image column — self-hosted URLs go inside the existing images JSONB array (see 1c)       

 1b. Create image download + upload script

 - New file: scripts/upload-figure-images.ts
   - For each figure in DB: download primary image from images[0].url → upload to Supabase Storage   
 as figure-images/{figure_id}.webp (or preserve original format)
   - Update the figure's images JSONB array: insert self-hosted image as priority 1 with "source":   
 "self_hosted", demote existing Wikipedia URL to priority 2 with "source": "wikimedia" and "status": 
  "fallback"
   - Example resulting images array:
   [
   {"url": "https://project.supabase.co/storage/v1/object/public/figure-images/uuid.webp", "source": 
  "self_hosted", "license": "Public Domain", "credit": "...", "priority": 1, "status": "active"},    
   {"url": "https://upload.wikimedia.org/...", "source": "wikimedia", "license": "Public Domain",    
 "credit": "...", "priority": 2, "status": "fallback"}
 ]
   - Handle: rate limiting (300ms between downloads), retries (3 attempts), progress logging
   - Support --dry-run, --figure-id <id> (single figure), --skip-existing (idempotent reruns)        
   - Uses native fetch + @supabase/supabase-js storage API — no new dependencies

 1c. Update FigureCarousel to use priority-based image selection

 - Modify: src/components/game/FigureCarousel.vue
   - Select image by priority: use images array sorted by priority, pick first with status ===       
 'active'
   - On <img @error>: mark current image failed, try next priority level (the Wikipedia fallback)    
   - This is simpler than the previous complex fallback system — just iterate the sorted array       
 - Modify: src/types/figure.ts — ensure FigureImage type includes optional source field
 ('self_hosted' | 'wikimedia')

 1d. Backfill existing ~130 figures

 - Run upload-figure-images.ts against all current figures
 - Validate all self-hosted images load correctly via validate-figures-images.ts
 - This de-risks Wikipedia hotlink breakage for all existing content

 ---
 Step 2: Build the Hybrid Figure Pipeline

 Goal: Create the tooling to generate, validate, and prepare figures at scale. Designed for 1000+    
 even though first run targets ~170.

 2a. AI Candidate Generator output format

 - New file: scripts/figure-candidates-schema.json
   - Define the JSON schema that AI-generated candidate lists must follow:
   {
   "name": "string (canonical name)",
   "aliases": ["string (common variations, nicknames)"],
   "birth_year": "number (negative for BCE)",
   "death_year": "number|null",
   "hometown": "string (City, Country — modern names)",
   "description": "string (50-100 words, humorous/factual blend)",
   "category": "politics|military|science|religion|culture|exploration|social|business",
   "difficulty": "easy|medium|hard",
   "tags": ["string (additional descriptive tags)"],
   "wikipedia_page": "string (exact Wikipedia article title)"
 }
   - No lat/lon in candidate schema. Coordinates are extracted exclusively from Wikipedia by the     
 validation script — AI-suggested coordinates are unreliable for a scoring game.
   - We'll generate candidates in batches of ~25 per category to maintain balance

 2b. Wikipedia Validation & Enrichment Script

 - New file: scripts/validate-figure-candidates.ts
   - Input: JSON file of AI-generated candidates
   - Startup: Preload all existing figure names + aliases from DB into memory (normalized
 lowercase). Cache this for the entire run — avoids repeated DB queries at scale.
   - For each candidate, via Wikipedia REST API (en.wikipedia.org/api/rest_v1/):
       i. Page verification: Fetch page summary → confirm article exists
     ii. Birth year extraction: Parse from page content, cross-check against AI suggestion. Flag if  
 >5 year discrepancy.
     iii. Birthplace → Coordinates resolution (hierarchical):
           - Extract birthplace string from page
       - Search for Wikipedia article on that birthplace → extract coordinates
       - If no coordinates found: try parent region/country page
       - If still none: flag as needs_review with reason
       - This handles messy formats like "Ulm, Kingdom of Württemberg" or "Near present-day Tehran"  
     iv. Image discovery: Fetch infobox image URL (reuse logic from get-wiki-images.ts)
     v. Duplicate detection: Fuzzy match name + aliases against preloaded cache using Levenshtein    
 (reuse src/lib/matching/fuzzyMatch.ts). Flag if similarity > 0.85.
   - Output: Enriched JSON with validation status per figure:
       - valid — all data confirmed, coordinates resolved, no duplicates
     - needs_review — data conflicts, missing coordinates, or potential duplicate (includes reason   
 string)
     - failed — page not found or critical data missing
   - Rate limiting: 300ms between Wikipedia API calls
   - Progress: Logs progress every 10 figures, outputs summary at end

 2c. Figure Insertion Script

 - New file: scripts/insert-validated-figures.ts
   - Input: Validated JSON from step 2b (only valid + user-approved needs_review entries)
   - Idempotent by design:
       - Before each insert: check if figure name already exists in DB
     - --skip-existing flag (default on) to safely rerun after crashes
     - Before each image upload: check if storage object already exists
   - For each figure:
       i. Insert into figures table with research_stage = 'validated'
     ii. Download Wikipedia image → upload to Supabase Storage
     iii. Update figure's images JSONB with self-hosted (priority 1) + Wikipedia fallback (priority  
 2)
   - Generates summary report: inserted count, skipped count, failed count, category breakdown       
   - Support --dry-run for preview
   - Also generates a SQL migration file as backup/audit trail

 2d. Duplicate Detection (integrated into 2b)

 - Preloads all names + aliases at startup, normalized to lowercase
 - Levenshtein fuzzy match (reuse src/lib/matching/fuzzyMatch.ts)
 - At 300 figures: ~300 comparisons per candidate (trivial). At 1000+: still fast with in-memory     
 cache.
 - Flags potential duplicates for user review with match details

 ---
 Step 3: Generate & Process ~170 New Figures

 Goal: Actually produce the figures using the pipeline from Step 2.

 3a. Category distribution target

 Current ~130 figures. To reach 300, we need ~170 new figures:

 ┌─────────────┬────────────┬───────────────────────────────────────────────────┐
 │  Category   │ Target New │                       Notes                       │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Politics    │ ~22        │ Leaders, revolutionaries, activists               │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Military    │ ~21        │ Generals, warriors, strategists                   │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Science     │ ~22        │ Physicists, biologists, mathematicians, inventors │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Religion    │ ~21        │ Religious leaders, reformers, theologians         │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Culture     │ ~22        │ Artists, writers, musicians, philosophers         │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Exploration │ ~21        │ Explorers, navigators, astronauts                 │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Social      │ ~21        │ Reformers, abolitionists, humanitarians           │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Business    │ ~20        │ Entrepreneurs, industrialists, innovators         │
 └─────────────┴────────────┴───────────────────────────────────────────────────┘

 Geographic targets: ~40% Europe, ~30% Americas, ~20% Asia, ~10% Africa/Other

 3b. Candidate generation process (iterative)

 1. Generate candidate JSON batches (~25 figures per category) using schema from 2a
 2. Run validate-figure-candidates.ts against each batch
 3. User reviews needs_review entries — approves, rejects, or manually fixes
 4. Run insert-validated-figures.ts for approved figures (idempotent, safe to rerun)
 5. Repeat until 300 target reached (~3-4 rounds of ~50)

 3c. Quality gates

 - After each batch of ~50 figures: validate all images load, check category balance, check
 geographic distribution
 - Run validate-figures-images.ts after each batch to confirm image health
 - Spot-check 10% of coordinates in Google Maps

 ---
 Step 4: Validation & Cleanup

 4a. Full validation pass

 - Run image validator across all 300 figures (both self-hosted and fallback URLs)
 - Confirm category distribution matches targets
 - Check for any remaining duplicates across the full dataset
 - Verify research_stage is set correctly for all figures

 4b. Update existing scripts for new pipeline format

 - Update validate-figures-images.ts to validate both self_hosted and wikimedia source images in the 
  array
 - Ensure image validator reports on self-hosted vs. Wikipedia URL health separately

 ---
 Files to Create/Modify

 File: supabase/migrations/012_figure_image_storage.sql
 Action: CREATE
 Purpose: Storage bucket + research_stage column
 ────────────────────────────────────────
 File: scripts/upload-figure-images.ts
 Action: CREATE
 Purpose: Download + upload images to Supabase Storage
 ────────────────────────────────────────
 File: scripts/validate-figure-candidates.ts
 Action: CREATE
 Purpose: Wikipedia API validation of AI candidates
 ────────────────────────────────────────
 File: scripts/insert-validated-figures.ts
 Action: CREATE
 Purpose: Insert validated figures + upload images
 ────────────────────────────────────────
 File: scripts/figure-candidates-schema.json
 Action: CREATE
 Purpose: JSON schema for candidate format
 ────────────────────────────────────────
 File: src/components/game/FigureCarousel.vue
 Action: MODIFY
 Purpose: Priority-based image selection with fallback
 ────────────────────────────────────────
 File: src/types/figure.ts
 Action: MODIFY
 Purpose: Add source field to FigureImage type
 ────────────────────────────────────────
 File: scripts/validate-figures-images.ts
 Action: MODIFY
 Purpose: Support self-hosted + wikimedia validation
 ────────────────────────────────────────
 File: package.json
 Action: MODIFY
 Purpose: Add validate-candidates and insert-figures npm scripts

 Existing Code to Reuse

 What: Wikipedia image fetching
 Where: scripts/get-wiki-images.ts
 Used In: validate-figure-candidates.ts
 ────────────────────────────────────────
 What: Fuzzy matching / Levenshtein
 Where: src/lib/matching/fuzzyMatch.ts
 Used In: Duplicate detection
 ────────────────────────────────────────
 What: Image URL validation
 Where: src/lib/utils/imageValidator.ts
 Used In: Post-insertion validation
 ────────────────────────────────────────
 What: Supabase client setup
 Where: src/lib/supabase/client.ts
 Used In: All new scripts
 ────────────────────────────────────────
 What: Tag-to-category mapping
 Where: scripts/ensure_first_tag_category.ts
 Used In: Tag validation
 ────────────────────────────────────────
 What: Image metadata enrichment
 Where: scripts/add_image_metadata.ts
 Used In: priority/status field patterns

 Verification

 1. Storage works: Upload a test image to Supabase Storage, load it in browser
 2. Pipeline works end-to-end: Generate 5 test candidates → validate → insert → verify in game       
 3. Images load in-game: Play a Free Play round, confirm self-hosted images display
 4. Fallback works: Temporarily break a self-hosted URL, confirm Wikipedia fallback triggers via     
 priority array
 5. Idempotency works: Run insert script twice — second run should skip all existing figures
 6. Final count: SELECT count(*) FROM figures → ~300
 7. Category balance: SELECT tags[1], count(*) FROM figures GROUP BY tags[1] → roughly even
 8. Research stage: SELECT research_stage, count(*) FROM figures GROUP BY research_stage → seed      
 ~130, validated ~170
 9. Run npm run validate-images → all figures should pass

 Execution Order

 Step 1a (migration: storage bucket + research_stage column)
   ↓
 Step 1b-1c (upload script + FigureCarousel update)  ←  can be built in parallel
   ↓
 Step 1d (backfill existing 130 figures to self-hosted)
   ↓
 Step 2a-2d (build all pipeline scripts)
   ↓
 Step 3 (generate batches iteratively — 3-4 rounds of ~50)
   ↓
 Step 4 (final validation pass)     
 
# *RECS FOR FIRST PLAN IMPROVEMENT*:
 
This is a **very strong plan**. Structurally, it’s exactly what a scalable Phase 2 should look like.

You’ve moved from “add more figures” → to **build an ingestion system**.

That’s the right mindset.

I’m going to review this like a senior engineer reviewing an architecture proposal and point out:

* ✅ What’s excellent
* ⚠️ What needs adjustment
* 🧠 What you should tighten before implementation

---

# ✅ What You Did Extremely Well

### 1️⃣ You separated infrastructure from data ingestion

Step 1 (Storage infra) before pipeline = correct sequencing.

You’re removing external fragility **before** scaling. That’s mature thinking.

---

### 2️⃣ The hybrid pipeline is clean

You clearly separated:

* Candidate generation
* Wikipedia validation
* Insertion
* Image ingestion
* Duplicate detection

That separation makes this pipeline debuggable and extensible.

This aligns perfectly with your Phase 2 + Phase 3 architecture in the battle plan.

---

### 3️⃣ Validation status model (valid / needs_review / failed)

This is excellent.

That gives you:

* Automation
* Human oversight only where needed
* Quality control without bottleneck

Very good.

---

### 4️⃣ Iterative batch approach (~50 at a time)

This is critical.

If something breaks:

* You debug at 50
* Not at 170

That’s exactly how you should scale.

---

# ⚠️ Critical Improvements You Should Make

Now let’s strengthen this so it doesn’t bite you later.

---

## ⚠️ 1. Do NOT add `self_hosted_image_url` column

This is the only structural issue in your plan.

You already have:

```
images: JSONB[]
```

You built:

* priority
* status
* fallback system

Adding a top-level `self_hosted_image_url` creates:

* Data duplication
* Inconsistent image logic
* Two sources of truth
* Frontend branching complexity

Instead:

### ✅ Store self-hosted image inside the images array

Example:

```json
[
  {
    "url": "https://supabase.co/storage/figure-id.webp",
    "source": "self_hosted",
    "license": "Public Domain",
    "credit": "...",
    "priority": 1,
    "status": "active"
  },
  {
    "url": "https://upload.wikimedia.org/...",
    "source": "wikimedia",
    "priority": 2,
    "status": "fallback"
  }
]
```

Then your existing fallback logic still works.

No schema change needed.

This keeps everything clean.

---

## ⚠️ 2. Don’t trust AI lat/lon even as “suggested”

You included:

```
"suggested_lat"
"suggested_lon"
```

I would remove that entirely.

Your validator should:

1. Extract birthplace from Wikipedia
2. Resolve coordinates from birthplace page
3. Store that

AI coordinates are noise and increase conflict cases.

---

## ⚠️ 3. Your validation script must normalize birthplace hierarchy

Wikipedia birthplace formats vary wildly:

* "Ulm, Kingdom of Württemberg"
* "Florence, Republic of Florence"
* "Macedonia (modern North Macedonia)"
* "Near present-day Tehran"

You need a resolution strategy:

```
birthplace → search Wikipedia page → extract coordinates
if no coords:
   search parent region
if still none:
   flag for review
```

Otherwise you’ll get tons of false failures.

---

## ⚠️ 4. Duplicate detection should be DB-side optimized

You’re planning to fuzzy match against all figures in JS.

At 300 → fine.

At 1000+ → slow.

Better:

* Fetch all names + aliases once at start
* Normalize to lowercase
* Precompute similarity threshold
* Cache in memory during validation run

---

## ⚠️ 5. Add idempotency to insert script

Very important.

If script crashes mid-run, rerunning should not:

* Insert duplicates
* Re-upload images unnecessarily

Add:

* `--skip-existing`
* Unique constraint on name
* Check existence before insert

---

# 🧠 Strategic Improvement Suggestion

## Add a "research_stage" column

Add a lightweight column:

```
research_stage: 'seed' | 'ai_generated' | 'validated' | 'reviewed'
```

This gives you:

* Traceability
* Future analytics
* Ability to improve your pipeline over time

Optional, but very powerful.

---

# 💡 What I Really Like

The execution order is clean:

```
Storage infra
→ Backfill
→ Build scripts
→ Generate batches
→ Validate
→ Insert
→ Quality gate
```

That’s production thinking.

---

# 🎯 Overall Evaluation

On a scale:

* Architecture clarity: 9/10
* Scalability thinking: 9/10
* Risk awareness: 8/10
* Data modeling hygiene: needs one adjustment (image column)

This is absolutely Phase-2-ready.

---

# 🚀 One Bigger Strategic Question

You’re targeting **300 now**, but the battle plan says **1000+**.

Are you:

* Treating 300 as Phase 2 milestone?
* Or redefining the scope permanently?

Because if 1000+ is still the goal:

You may want to design this pipeline assuming 1000 from day one.

Right now it scales, but thinking one level higher would make it bulletproof.

---

# 🏁 Final Verdict

This plan is strong.

If you:

* Remove `self_hosted_image_url`
* Normalize birthplace extraction
* Add idempotency
* Avoid AI coordinates

Then this becomes a production-grade ingestion system.


 # *FIRST PLAN (UNUSED)*:
 
 Phase 2 Completion Plan: Data Collection Pipeline (Target: 300 Figures)

 Context

 HistoGuesser currently has ~130 historical figures (30 seed + ~97 from migration 008). The
 figures-game-mode-dev-battle-plan Phase 2 goal is a scalable data collection pipeline. We're        
 targeting 300 total figures (~170 new) using a hybrid approach (AI generates candidates, scripts    
 validate/enrich via Wikipedia API, user reviews edge cases). We're also self-hosting images via     
 Supabase Storage instead of hotlinking Wikipedia.

 Phase 1 (image fallback system) is already complete. Existing scripts (get-wiki-images.ts,
 find-figure-images.ts, validate-figures-images.ts) provide foundation to build on.

 ---
 Step 1: Set Up Supabase Storage for Images

 Goal: Create infrastructure to self-host figure images instead of relying on fragile Wikipedia      
 hotlinks.

 1a. Create Supabase Storage bucket + RLS policies

 - New migration file: supabase/migrations/012_figure_image_storage.sql
   - Create a public figure-images storage bucket
   - Add RLS policy: public read access for all, service-role-only write
   - Add a self_hosted_image_url column to figures table (nullable TEXT) for the Supabase Storage    
 URL — keeps existing images JSONB intact as metadata/fallback

 1b. Create image download + upload script

 - New file: scripts/upload-figure-images.ts
   - For each figure in DB: download primary image from images[0].url → upload to Supabase Storage   
 bucket as figure-images/{figure_id}.jpg
   - Update self_hosted_image_url column with the public Supabase Storage URL
   - Handle: rate limiting, retries, CORS issues with Wikipedia, progress logging
   - Support --dry-run mode and --figure-id for individual uploads
 - Dependencies to add: None — native fetch + @supabase/supabase-js storage API is sufficient. For   
 image format detection we can use response headers.

 1c. Update FigureCarousel to prefer self-hosted images

 - Modify: src/components/game/FigureCarousel.vue
   - If figure.self_hosted_image_url exists, use it as primary source
   - Fall back to images[0].url (Wikipedia) if self-hosted URL fails
   - Simple <img :src="primaryUrl" @error="useFallback"> pattern
 - Modify: src/types/figure.ts — add self_hosted_image_url?: string to Figure type

 1d. Backfill existing 130 figures

 - Run upload-figure-images.ts against all current figures
 - Validate all uploads loaded correctly
 - This de-risks Wikipedia hotlink breakage for existing content

 ---
 Step 2: Build the Hybrid Figure Pipeline

 Goal: Create the tooling to generate, validate, and prepare ~170 new figures efficiently.

 2a. AI Candidate Generator output format

 - New file: scripts/figure-candidates.json (template/schema)
   - Define the JSON schema that AI-generated candidate lists must follow:
   {
   "name": "string",
   "aliases": ["string"],
   "birth_year": "number",
   "death_year": "number|null",
   "hometown": "string (City, Country)",
   "suggested_lat": "number",
   "suggested_lon": "number",
   "description": "string (50-100 words, humorous/factual)",
   "category": "politics|military|science|religion|culture|exploration|social|business",
   "difficulty": "easy|medium|hard",
   "tags": ["string"],
   "wikipedia_page": "string (exact Wikipedia article title)"
 }
   - This schema is what we'll prompt an LLM to produce, and what the validation script expects as   
 input
   - We'll generate candidates in batches of ~25 per category to maintain balance

 2b. Wikipedia Validation & Enrichment Script

 - New file: scripts/validate-figure-candidates.ts
   - Input: JSON file of AI-generated candidates
   - For each candidate, via Wikipedia REST API (en.wikipedia.org/api/rest_v1/):
       i. Verify Wikipedia page exists (page summary endpoint)
     ii. Extract birth year from page (cross-check against AI suggestion)
     iii. Look up birthplace page → extract coordinates (cross-check lat/lon)
     iv. Fetch infobox image URL (reuse logic from existing get-wiki-images.ts)
     v. Check for duplicates against existing figures in DB
   - Output: Enriched JSON with validation status per figure:
       - valid — all data confirmed
     - needs_review — data conflicts (e.g., AI said 1452, Wikipedia says 1451)
     - failed — page not found or critical data missing
   - Rate limiting: 300ms between Wikipedia API calls (matching existing scripts)
   - Reuse: Import image discovery logic from get-wiki-images.ts and coordinate extraction patterns  

 2c. Figure Insertion Script

 - New file: scripts/insert-validated-figures.ts
   - Input: Validated JSON from step 2b (only valid + user-approved needs_review entries)
   - For each figure:
       i. Insert into figures table via Supabase client (using service role key)
     ii. Download Wikipedia image → upload to Supabase Storage
     iii. Update self_hosted_image_url with Storage URL
   - Generates a summary report: inserted count, failed count, category breakdown
   - Support --dry-run for preview
   - Also generates a SQL migration file as backup/audit trail

 2d. Duplicate Detection

 - Built into validate-figure-candidates.ts (step 2b)
 - Checks candidate name + aliases against all existing figures.name and figures.aliases in DB       
 - Fuzzy match using Levenshtein (reuse existing src/lib/matching/fuzzyMatch.ts)
 - Flags potential duplicates for user review

 ---
 Step 3: Generate & Process ~170 New Figures

 Goal: Actually produce the figures using the pipeline from Step 2.

 3a. Category distribution target

 Current ~130 figures. To reach 300, we need ~170 new figures distributed across 8 categories:       

 ┌─────────────┬────────────┬───────────────────────────────────────────────────┐
 │  Category   │ Target New │                       Notes                       │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Politics    │ ~22        │ Leaders, revolutionaries, activists               │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Military    │ ~21        │ Generals, warriors, strategists                   │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Science     │ ~22        │ Physicists, biologists, mathematicians, inventors │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Religion    │ ~21        │ Religious leaders, reformers, theologians         │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Culture     │ ~22        │ Artists, writers, musicians, philosophers         │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Exploration │ ~21        │ Explorers, navigators, astronauts                 │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Social      │ ~21        │ Reformers, abolitionists, humanitarians           │
 ├─────────────┼────────────┼───────────────────────────────────────────────────┤
 │ Business    │ ~20        │ Entrepreneurs, industrialists, innovators         │
 └─────────────┴────────────┴───────────────────────────────────────────────────┘

 Geographic targets: ~40% Europe, ~30% Americas, ~20% Asia, ~10% Africa/Other

 3b. Candidate generation process (iterative)

 1. I generate candidate JSON batches (~25 figures per category) using the schema from 2a
 2. Run validate-figure-candidates.ts against each batch
 3. User reviews needs_review entries, approves or rejects
 4. Run insert-validated-figures.ts for approved figures
 5. Repeat until target reached

 3c. Quality gates

 - After each batch of ~50 figures: validate all images load, check category balance, check
 geographic distribution
 - Run validate-figures-images.ts after each batch to confirm image health
 - Spot-check 10% of coordinates in Google Maps

 ---
 Step 4: Validation & Cleanup

 4a. Full validation pass

 - Run image validator across all 300 figures
 - Verify all self-hosted images load from Supabase Storage
 - Confirm category distribution matches targets
 - Check for any remaining duplicates

 4b. Update existing scripts

 - Update validate-figures-images.ts to also check self_hosted_image_url
 - Ensure find-figure-images.ts can output in the new pipeline format

 ---
 Files to Create/Modify

 File: supabase/migrations/012_figure_image_storage.sql
 Action: CREATE
 Purpose: Storage bucket + schema changes
 ────────────────────────────────────────
 File: scripts/upload-figure-images.ts
 Action: CREATE
 Purpose: Download + upload images to Supabase Storage
 ────────────────────────────────────────
 File: scripts/validate-figure-candidates.ts
 Action: CREATE
 Purpose: Wikipedia API validation of AI candidates
 ────────────────────────────────────────
 File: scripts/insert-validated-figures.ts
 Action: CREATE
 Purpose: Insert validated figures + upload images
 ────────────────────────────────────────
 File: scripts/figure-candidates-schema.json
 Action: CREATE
 Purpose: JSON schema for candidate format
 ────────────────────────────────────────
 File: src/components/game/FigureCarousel.vue
 Action: MODIFY
 Purpose: Prefer self-hosted image URL
 ────────────────────────────────────────
 File: src/types/figure.ts
 Action: MODIFY
 Purpose: Add self_hosted_image_url field
 ────────────────────────────────────────
 File: scripts/validate-figures-images.ts
 Action: MODIFY
 Purpose: Support self-hosted URL validation
 ────────────────────────────────────────
 File: package.json
 Action: MODIFY
 Purpose: Add validate-candidates and insert-figures npm scripts

 Existing Code to Reuse

 What: Wikipedia image fetching
 Where: scripts/get-wiki-images.ts
 Used In: validate-figure-candidates.ts
 ────────────────────────────────────────
 What: Fuzzy matching / Levenshtein
 Where: src/lib/matching/fuzzyMatch.ts
 Used In: Duplicate detection
 ────────────────────────────────────────
 What: Image URL validation
 Where: src/lib/utils/imageValidator.ts
 Used In: Post-insertion validation
 ────────────────────────────────────────
 What: Supabase client setup
 Where: src/lib/supabase/client.ts
 Used In: All new scripts
 ────────────────────────────────────────
 What: Tag-to-category mapping
 Where: scripts/ensure_first_tag_category.ts
 Used In: Tag validation

 Verification

 1. Storage works: Upload a test image to Supabase Storage, load it in browser
 2. Pipeline works end-to-end: Generate 5 test candidates → validate → insert → verify in game       
 3. Images load in-game: Play a Free Play round, confirm self-hosted images display
 4. Fallback works: Temporarily break a self-hosted URL, confirm Wikipedia fallback triggers
 5. Final count: Query SELECT count(*) FROM figures → should be ~300
 6. Category balance: Query SELECT tags[1], count(*) FROM figures GROUP BY tags[1] → roughly even    
 7. Run npm run validate-images → all figures should pass

 Execution Order

 Step 1 (Storage infra)  →  Step 1d (backfill existing 130)
         ↓
 Step 2 (Build pipeline scripts)
         ↓
 Step 3 (Generate batches iteratively — 3-4 rounds of ~50)
         ↓
 Step 4 (Final validation)
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌



---
--
---

╰─────────────────────────────────────────────────────────────────────────────────────────────────────────╯

❯ we recently implemented the following plan: 'c:/Users/Daniel                                             
  Lopez/Desktop/Neet-a-thon/Histo-Guesser/._docs/recent-plan-we-built.md' as part of completing            
  **Phase 2: Data Collection Pipeline** of our 'c:/Users/Daniel                                            
  Lopez/Desktop/Neet-a-thon/Histo-Guesser/._docs/tasklists/figures-game-mode-dev-battle-plan.md'...        inst your Supabase project. Everything else 
  Every commit since this commit (iD: 45d3d660eae4cebc0e2c60d2d45f33ec99e080c5) is related to the          
  edits made in looking to compelet the phase 2 build out. Now I need instruction on how to test the       
  implementation and basically next steps; do i need to run a migration, or what do I need to do?          

● Let me read the plan and battle plan documents, and also check what's been committed since that commit.  ────────────────────────────────────────────

● Read 2 files (ctrl+o to expand)                                                                          ────────────────────────────────────────────

● Bash(cd "/c/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser" && git log
      45d3d660eae4cebc0e2c60d2d45f33ec99e080c5..HEAD --oneline)
  ⎿  f1f2ead end phase 2 battle plan raw
     ecadafb  Fixed pre-existing typo ({a → {) in interface
     44cdade Added source-aware breakdown in summary           (self-hosted vs wikimedia vs legacy hea     
     … +15 lines (ctrl+o to expand)

● Good, I can see all the Phase 2 commits. Let me now check the actual files to give you precise next      
  steps.

● Explore(Explore Phase 2 implementation files)
  ⎿  Initializing…
  ⎿  Interrupted · What should Claude do instead?

❯ continue  

● Let me check the key files directly.

● Searched for 3 patterns, read 2 files (ctrl+o to expand)

● Bash(cd "/c/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser" && cat .env 2>/dev/null | grep -i      
      "SUPA" | head -5 || echo "No .env found")
  ⎿  VITE_SUPABASE_URL=https://wmzinowylibtdwtqonow.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indte     
     mlub3d5bGlidGR3dHFvbm93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODU0NjMsImV4cCI6MjA3Nzc2MTQ2M30.HHXZm7     
     hrSOtjCd2S2QxmPM8-McGWKr-Ge_og7LXoxGo

● Bash(cd "/c/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser" && cat .env.local 2>/dev/null | grep -i       "SUPA" | head -5 || echo "No .env.local found")
  ⎿  # Supabase Configuration
     VITE_SUPABASE_URL=https://wmzinowylibtdwtqonow.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indte     
     … +2 lines (ctrl+o to expand)

● Bash(cd "/c/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser" && npx supabase --version 2>/dev/null  
      || echo "Supabase CLI not installed")
  ⎿  2.76.8

● Bash(cd "/c/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser" && ls supabase/config.toml 2>/dev/null 
      && head -30 supabase/config.toml 2>/dev/null || echo "No sup…)
  ⎿  No supabase config.toml found

● Searched for 2 patterns (ctrl+o to expand)

● Now I have the full picture. Here's exactly what you need to do:

  ---
  Next Steps: Testing Phase 2 Implementation

  Step 0: Get your Service Role Key

  The scripts (upload-figure-images.ts, insert-validated-figures.ts) require SUPABASE_SERVICE_ROLE_KEY,    
  which you don't have in your .env or .env.local yet.

  1. Go to your Supabase Dashboard → Project Settings → API
  2. Copy the service_role key (the secret one, NOT the anon key)
  3. Add it to your .env.local:
  SUPABASE_SERVICE_ROLE_KEY=eyJ...your-key-here...

  Step 1: Run Migration 012

  Since you don't have supabase/config.toml (no local Supabase link), you've likely been running migrations   manually. You have two options:

  Option A — Supabase Dashboard (what you've probably been doing):
  1. Go to Supabase Dashboard → SQL Editor
  2. Paste the contents of supabase/migrations/012_figure_image_storage.sql
  3. Run it

  Option B — Link the CLI and push:
  supabase init    # creates config.toml
  supabase link --project-ref wmzinowylibtdwtqonow
  supabase db push # pushes all un-applied migrations

  The migration does 3 things:
  - Creates a figure-images storage bucket (public read, service-role write)
  - Adds research_stage column to figures table
  - Backfills all existing figures with research_stage = 'seed'

  Step 2: Verify the Migration Worked

  After running the migration, verify in the Supabase Dashboard:
  - Storage tab → you should see a figure-images bucket
  - Table Editor → figures table → should have a research_stage column (all values = 'seed')

  Step 3: Test the Image Upload Script (Backfill)

  This is Step 1d from the plan — backfilling existing ~130 figures with self-hosted images.

  # Dry run first (no changes, just shows what it would do)
  npm run upload-images:dry

  # If that looks good, run for real
  npm run upload-images

  Or test on a single figure first:
  npx tsx scripts/upload-figure-images.ts --figure-id <pick-any-figure-uuid-from-db>

  Step 4: Validate Images

  npm run validate-images

  This should now report self-hosted vs wikimedia health separately (per your commit 44cdade).

  Step 5: Test the Frontend

  npm run dev

  Play a Free Play round and confirm:
  - Self-hosted images load as primary
  - If you deliberately break a self-hosted URL in the DB, the wikimedia fallback kicks in (per your       
  handleImageError changes in commit 958979e)

  ---
  After That: The Pipeline (Steps 2-3 of the plan)

  Once the backfill is proven, you're ready to use the pipeline for new figures:

  1. Generate candidates — Create a JSON file following scripts/figure-candidates-schema.json (you generate   this with AI in batches of ~25 per category)
  2. Validate — npm run validate-candidates -- --input candidates-batch1.json
  3. Review — Check the output for needs_review entries, fix or approve them
  4. Insert — npm run insert-figures:dry first, then npm run insert-figures

  ---
  TL;DR: The immediate blocker is (1) add the service role key to .env.local, and (2) run migration 012    
  against your Supabase project. Everything else is already built and ready to test.