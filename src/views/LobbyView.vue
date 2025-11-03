<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Lobby - Coming Soon')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="card max-w-2xl w-full text-center">
      <h1 class="font-heading text-4xl text-noir-gold mb-4">{{ message }}</h1>
    </div>
  </div>
</template>

