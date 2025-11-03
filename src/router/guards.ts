import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

/**
 * Auth guard - redirects to login if user is not authenticated
 */
export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore()

  if (!authStore.user && !authStore.loading) {
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
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore()

  if (authStore.user) {
    // User is already authenticated, redirect to home
    next({ name: 'home' })
  } else {
    // User is not authenticated, proceed
    next()
  }
}

