<template>
  <div class="main-menu">
    <!-- Background pattern (subtle) -->
    <div class="menu-background"></div>

    <!-- Main content -->
    <div class="menu-content">
      <!-- Logo/Title -->
      <div class="menu-header">
        <h1 class="menu-logo">🕰️ HISTOGUESSER</h1>
        <p class="menu-tagline">Guess the Who, Where, and When</p>
      </div>

      <!-- Game mode buttons -->
      <div class="menu-modes">
        <button
          :class="modeButtonClass('daily')"
          :disabled="!isAuthenticated && true"
          @click="handleModeSelect('daily')"
        >
          <div class="mode-icon">🏆</div>
          <div class="mode-content">
            <div class="mode-title">Daily Challenge</div>
            <div class="mode-description">
              Global leaderboard • One play per day
            </div>
          </div>
          <div v-if="!isAuthenticated" class="mode-lock">🔒</div>
        </button>

        <button
          :class="modeButtonClass('freeplay')"
          @click="handleModeSelect('freeplay')"
        >
          <div class="mode-icon">🎯</div>
          <div class="mode-content">
            <div class="mode-title">Free Play</div>
            <div class="mode-description">
              Unlimited practice • No pressure
            </div>
          </div>
        </button>

        <button
          :class="modeButtonClass('multiplayer')"
          :disabled="!isAuthenticated && true"
          @click="handleModeSelect('multiplayer')"
        >
          <div class="mode-icon">👥</div>
          <div class="mode-content">
            <div class="mode-title">Multiplayer</div>
            <div class="mode-description">
              Play with friends • 2-8 players
            </div>
          </div>
          <div v-if="!isAuthenticated" class="mode-lock">🔒</div>
        </button>
      </div>

      <!-- User section -->
      <div class="menu-footer">
        <div v-if="isAuthenticated" class="user-section">
          <div class="user-info">
            <div class="user-avatar">
              <img 
                v-if="user?.avatar_url" 
                :src="user.avatar_url" 
                :alt="user.username"
                class="avatar-img"
              />
              <span v-else class="avatar-placeholder">
                {{ user?.username?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <span class="username">@{{ user?.username }}</span>
          </div>
          <div class="user-actions">
            <button class="icon-button" title="Leaderboards" @click="handleLeaderboards">
              📊
            </button>
            <button class="icon-button" title="Profile" @click="handleProfile">
              👤
            </button>
            <button class="icon-button" title="Settings" @click="handleSettings">
              ⚙️
            </button>
            <button class="icon-button" title="Logout" @click="handleLogout">
              🚪
            </button>
          </div>
        </div>

        <div v-else class="guest-section">
          <p class="guest-text">
            Sign up to access Daily Challenges and Multiplayer!
          </p>
          <div class="auth-buttons">
            <Button variant="primary" @click="handleLogin">
              Login
            </Button>
            <Button variant="secondary" @click="handleSignup">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from './Button.vue';
import type { User } from '@/types/user';

interface Props {
  isAuthenticated: boolean;
  user?: User | null;
}

defineProps<Props>();

const emit = defineEmits<{
  modeSelect: [mode: 'daily' | 'freeplay' | 'multiplayer'];
  login: [];
  signup: [];
  logout: [];
  leaderboards: [];
  profile: [];
  settings: [];
}>();

const modeButtonClass = (_mode: string) => {
  const base = [
    'mode-button',
    'group',
    'relative',
    'w-full',
    'p-6',
    'bg-noir-surface',
    'border-2',
    'border-noir-gold/20',
    'rounded-xl',
    'transition-all',
    'duration-300',
    'hover:border-noir-gold/50',
    'hover:shadow-[0_0_20px_rgba(203,161,53,0.2)]',
    'hover:-translate-y-1',
    'active:translate-y-0',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:hover:translate-y-0',
    'disabled:hover:border-noir-gold/20',
    'disabled:hover:shadow-none',
  ];
  return base;
};

const handleModeSelect = (mode: 'daily' | 'freeplay' | 'multiplayer') => {
  emit('modeSelect', mode);
};

const handleLogin = () => emit('login');
const handleSignup = () => emit('signup');
const handleLogout = () => emit('logout');
const handleLeaderboards = () => emit('leaderboards');
const handleProfile = () => emit('profile');
const handleSettings = () => emit('settings');
</script>

<style scoped>
.main-menu {
  @apply relative min-h-screen bg-noir-bg flex items-center justify-center p-4 overflow-hidden;
}

.menu-background {
  @apply absolute inset-0 opacity-5;
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(203, 161, 53, 0.1) 2px,
      rgba(203, 161, 53, 0.1) 4px
    );
}

.menu-content {
  @apply relative z-10 w-full max-w-2xl;
}

.menu-header {
  @apply text-center mb-12;
}

.menu-logo {
  @apply text-6xl md:text-7xl font-bebas tracking-wider text-noir-gold mb-3;
  text-shadow: 0 0 20px rgba(203, 161, 53, 0.3);
  letter-spacing: 0.08em;
}

.menu-tagline {
  @apply text-lg md:text-xl text-noir-text/70 font-playfair italic;
}

.menu-modes {
  @apply space-y-4 mb-8;
}

.mode-button {
  @apply flex items-center gap-4 text-left;
}

.mode-icon {
  @apply text-4xl flex-shrink-0;
}

.mode-content {
  @apply flex-1;
}

.mode-title {
  @apply text-xl md:text-2xl font-playfair text-noir-text mb-1;
}

.mode-description {
  @apply text-sm text-noir-text/60;
}

.mode-lock {
  @apply text-2xl text-noir-gold/40 flex-shrink-0;
}

.menu-footer {
  @apply mt-8 pt-8 border-t border-noir-gold/20;
}

.user-section {
  @apply flex items-center justify-between flex-wrap gap-4;
}

.user-info {
  @apply flex items-center gap-3;
}

.user-avatar {
  @apply w-10 h-10 rounded-full overflow-hidden bg-noir-gold/20 flex items-center justify-center;
}

.avatar-img {
  @apply w-full h-full object-cover;
}

.avatar-placeholder {
  @apply text-noir-gold font-bold text-lg;
}

.username {
  @apply text-noir-text font-medium;
}

.user-actions {
  @apply flex items-center gap-2;
}

.icon-button {
  @apply w-10 h-10 flex items-center justify-center rounded-lg bg-noir-surface border border-noir-gold/20 text-xl transition-all hover:border-noir-gold/40 hover:bg-noir-gold/10 active:scale-95;
}

.guest-section {
  @apply text-center space-y-4;
}

.guest-text {
  @apply text-noir-text/70;
}

.auth-buttons {
  @apply flex gap-3 justify-center;
}
</style>

