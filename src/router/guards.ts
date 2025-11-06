import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { authStore } from '@/stores/authStore'

/**
 * Auth guard - redirects to login if user is not authenticated
 */
export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const auth = authStore.getState()

  if (!auth.user && !auth.loading) {
    // User is not authenticated, redirect to login
    next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
  } else {
    // User is authenticated, proceed
    next()
  }
}

/**
 * Guest guard - redirects to home if user is already authenticated
 */
export function guestGuard(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const auth = authStore.getState()

  if (auth.user) {
    // User is already authenticated, redirect to home
    next({ name: 'home' })
  } else {
    // User is not authenticated, proceed
    next()
  }
}

