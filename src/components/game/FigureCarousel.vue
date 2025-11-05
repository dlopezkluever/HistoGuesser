<template>
  <Card :padding="padding" class="figure-carousel">
    <div class="carousel-container">
      <!-- Main image display -->
      <div class="image-wrapper">
        <img
          v-if="currentImage"
          :src="currentImage.url"
          :alt="altText"
          class="figure-image"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <div v-else-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p class="text-noir-text/60 mt-4">Loading image...</p>
        </div>
        <div v-else class="error-state">
          <p class="text-noir-text/60">Image unavailable</p>
        </div>
      </div>

      <!-- Navigation dots (if multiple images) -->
      <div v-if="images.length > 1" class="carousel-controls">
        <button
          v-for="(_, index) in images"
          :key="index"
          :class="dotClass(index)"
          :aria-label="`View image ${index + 1}`"
          @click="selectImage(index)"
        ></button>
      </div>

      <!-- Navigation arrows (if multiple images) -->
      <button
        v-if="images.length > 1 && currentIndex > 0"
        class="nav-button nav-button-left"
        aria-label="Previous image"
        @click="previousImage"
      >
        ‹
      </button>
      <button
        v-if="images.length > 1 && currentIndex < images.length - 1"
        class="nav-button nav-button-right"
        aria-label="Next image"
        @click="nextImage"
      >
        ›
      </button>

      <!-- Image counter -->
      <div v-if="images.length > 1" class="image-counter">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Card from '@/components/ui/Card.vue';
import type { FigureImage } from '@/types/figure';

interface Props {
  images: FigureImage[];
  altText?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  altText: 'Historical figure',
  padding: 'none',
});

const currentIndex = ref(0);
const loading = ref(true);
const imageError = ref(false);

const currentImage = computed(() => {
  return props.images?.[currentIndex.value] || null;
});

const dotClass = (index: number) => {
  const base = ['w-2', 'h-2', 'rounded-full', 'transition-all', 'duration-200'];
  const active = index === currentIndex.value
    ? ['bg-noir-gold', 'w-6']
    : ['bg-noir-text/30', 'hover:bg-noir-text/50'];
  
  return [...base, ...active];
};

const selectImage = (index: number) => {
  if (index >= 0 && index < (props.images?.length || 0)) {
    currentIndex.value = index;
    loading.value = true;
    imageError.value = false;
  }
};

const nextImage = () => {
  if (currentIndex.value < (props.images?.length || 0) - 1) {
    selectImage(currentIndex.value + 1);
  }
};

const previousImage = () => {
  if (currentIndex.value > 0) {
    selectImage(currentIndex.value - 1);
  }
};

const handleImageLoad = () => {
  loading.value = false;
  imageError.value = false;
};

const handleImageError = () => {
  loading.value = false;
  imageError.value = true;
};

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') {
    previousImage();
  } else if (event.key === 'ArrowRight') {
    nextImage();
  }
};

// Reset when images change
watch(
  () => props.images,
  () => {
    currentIndex.value = 0;
    loading.value = true;
    imageError.value = false;
  },
);

// Add keyboard navigation
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown);
}
</script>

<style scoped>
.figure-carousel {
  @apply relative w-full;
}

.carousel-container {
  @apply relative;
}

.image-wrapper {
  @apply relative w-full aspect-[3/4] bg-noir-bg rounded-lg overflow-hidden flex items-center justify-center;
}

.figure-image {
  @apply w-full h-full object-cover;
}

.loading-state,
.error-state {
  @apply flex flex-col items-center justify-center h-full text-center p-6;
}

.spinner {
  @apply w-12 h-12 border-4 border-noir-gold/20 border-t-noir-gold rounded-full animate-spin;
}

.carousel-controls {
  @apply flex items-center justify-center gap-2 mt-4;
}

.nav-button {
  @apply absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-noir-surface/80 text-noir-gold text-2xl rounded-full border border-noir-gold/20 flex items-center justify-center transition-all hover:bg-noir-gold/20 hover:scale-110 z-10;
}

.nav-button-left {
  @apply left-2;
}

.nav-button-right {
  @apply right-2;
}

.image-counter {
  @apply absolute top-2 right-2 bg-noir-surface/80 text-noir-text px-3 py-1 rounded-lg text-sm font-mono border border-noir-gold/20;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

