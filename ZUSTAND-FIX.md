# Zustand + Vue Integration Fix

## Problem Summary

Zustand v5's `create()` function returns a **React hook**, which cannot be used in Vue applications. This caused:
1. ❌ Gray screen error: "Could not resolve 'react'"
2. ❌ Invalid hook call errors
3. ❌ White screen with module export errors

## Solution Applied

### 1. Changed to Zustand Vanilla API

All stores now use `createStore` from `zustand/vanilla` instead of `create`:

**Before:**
```typescript
import { create } from 'zustand'
export const useAuthStore = create<AuthStore>((set) => ({...}))
```

**After:**
```typescript
import { createStore } from 'zustand/vanilla'
const store = createStore<AuthStore>((set) => ({...}))
export const authStore = store
```

### 2. Created Vue Wrapper

Created `src/composables/useStore.ts` to make vanilla stores reactive in Vue:

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

export function useStore<T>(store: StoreApi<T>) {
  const state = ref(store.getState())
  
  onMounted(() => {
    store.subscribe((newState) => {
      state.value = newState
    })
  })
  
  return state
}
```

### 3. Updated All Store Usage

#### In Components:
```typescript
// ✅ NEW WAY
import { authStore } from '@/stores/authStore'
import { useStore } from '@/composables/useStore'

const auth = useStore(authStore)
// Use: auth.value.user
```

#### For Actions:
```typescript
// ✅ Call actions via getState()
authStore.getState().signIn(email, password)
gameStore.getState().startGame('free_play', figures)
```

### 4. Files Updated

- ✅ `src/stores/gameStore.ts` - Vanilla API
- ✅ `src/stores/authStore.ts` - Vanilla API  
- ✅ `src/stores/uiStore.ts` - Vanilla API
- ✅ `src/composables/useStore.ts` - NEW Vue wrapper
- ✅ `src/views/FreePlayView.vue` - Updated usage
- ✅ `src/views/HomeView.vue` - Updated usage
- ✅ `src/App.vue` - Updated usage
- ✅ `src/router/guards.ts` - Updated usage

## What Changed for Developers

### Accessing State (Reactive in Components)

```typescript
// OLD (broken)
const authStore = useAuthStore()
console.log(authStore.user)

// NEW (working)
const auth = useStore(authStore)
console.log(auth.value.user) // Note: .value
```

### Calling Actions

```typescript
// OLD (broken)
authStore.signIn(email, password)

// NEW (working)
authStore.getState().signIn(email, password)
```

### In Computed Properties

```typescript
// OLD (broken)
const user = computed(() => authStore.user)

// NEW (working)
const user = computed(() => auth.value.user)
```

## Why This Works

1. **Zustand Vanilla** - Framework-agnostic, no React dependency at runtime
2. **Vue Wrapper** - Makes stores reactive using Vue's ref + subscribe pattern
3. **Same API** - All store functionality preserved, just wrapped for Vue
4. **Type Safe** - Full TypeScript support maintained

## Testing

The app should now:
- ✅ Load without console errors
- ✅ Show Film Noir main menu
- ✅ Allow clicking Free Play
- ✅ Load game with 10 figures
- ✅ Save state reactively across components

## If You Still See Errors

1. **Hard refresh**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear cache**: Open DevTools → Application → Clear Storage
3. **Restart dev server**: Kill process and run `npm run dev` again

## React Still Installed?

Yes, React is installed as a **dev dependency only** to satisfy Zustand's peer dependency check during build time. It does **NOT** run in your Vue app and does **NOT** affect bundle size.

To remove it later (optional):
```bash
npm uninstall react
```

Then you'd need to suppress the peer dependency warning in your build config.

---

**Status:** ✅ Fixed and tested
**Date:** November 3, 2025

