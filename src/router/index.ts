import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/play/free',
    name: 'free-play',
    component: () => import('@/views/FreePlayView.vue'),
  },
  {
    path: '/play/daily',
    name: 'daily-challenge',
    component: () => import('@/views/DailyChallengeView.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/multiplayer',
    name: 'multiplayer',
    component: () => import('@/views/MultiplayerView.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/lobby/:code',
    name: 'lobby',
    component: () => import('@/views/LobbyView.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/views/ResultsView.vue'),
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('@/views/LeaderboardView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router

