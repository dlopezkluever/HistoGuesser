# **Phase 2 Auth Completion Checklist**

## **Priority 1: Core Infrastructure**

- [ ] **Create `useAuth` composable**
  - Build `src/composables/useAuth.ts` for cleaner auth usage in components
  - Provide convenience methods: `login()`, `logout()`, `signup()`
  - Add computed properties: `isAuthenticated`, `currentUser`, `isLoading`, `error`

- [ ] **Add auth/users table synchronization**
  - Ensure data consistency between Supabase `auth.users` and custom `users` table
  - Add sync checks in auth service functions
  - Handle edge cases where user exists in one table but not the other

- [ ] **Update player stats after games**
  - Hook into game completion flow to update `player_stats` table
  - Track: total_games, best_score, daily_streak, last_daily_date
  - Add stats update functions to game store

## **Priority 2: Profile Page**

- [ ] **Build proper ProfileView**
  - Replace "Coming Soon" with actual stats display
  - Show games played, best score, daily streak from `player_stats`
  - Style with Film Noir theme

- [ ] **Add username change functionality**
  - Create form to update username
  - Add validation (3-30 chars, alphanumeric + _ -)
  - Update both `users` table and any cached auth data
  - Show success/error feedback

- [ ] **Remove settings button from MainMenu**
  - Remove settings icon and handler from MainMenu component
  - Update HomeView to remove settings route handler
  - Clean up any settings-related imports

## **Verification Steps**

- [ ] Test auth flow still works after changes
- [ ] Verify profile page displays stats correctly
- [ ] Test username change functionality
- [ ] Ensure no console errors or linting issues
- [ ] Test on both desktop and mobile layouts

## **Future (Phase 4)**
- [ ] Email verification (stretch goal)
- [ ] Map language settings (stretch goal)
- [ ] Other stretch goals</contents>
</xai:function_call
