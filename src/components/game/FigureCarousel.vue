<template>
  <Card :padding="padding" class="figure-carousel">
    <div class="carousel-container">
      <!-- Main image display with fallback support -->
      <div class="image-wrapper">
        <Transition name="image-fade" mode="out-in">
          <img
            v-if="currentDisplayImage && !loading"
            :key="`${currentDisplayImage.url}-${currentFallbackIndex}`"
            :src="currentDisplayImage.url"
            :alt="altText"
            class="figure-image"
            @load="handleImageLoad"
            @error="handleImageError"
          />
          <div v-else-if="loading" key="loading" class="loading-state">
            <div class="spinner"></div>
            <p class="text-noir-text/60 mt-4">
              {{ loadingMessage }}
            </p>
          </div>
          <div v-else key="error" class="error-state">
            <p class="text-noir-text/60">Image unavailable</p>
          </div>
        </Transition>
      </div>

      <!-- Navigation dots (if multiple images) -->
      <div v-if="availableImages.length > 1" class="carousel-controls">
        <button
          v-for="(_, index) in availableImages"
          :key="index"
          :class="dotClass(index)"
          :aria-label="`View image ${index + 1}`"
          @click="selectImage(index)"
        ></button>
      </div>

      <!-- Navigation arrows (if multiple images) -->
      <button
        v-if="availableImages.length > 1 && currentIndex > 0"
        class="nav-button nav-button-left"
        aria-label="Previous image"
        @click="previousImage"
      >
        ‹
      </button>
      <button
        v-if="availableImages.length > 1 && currentIndex < availableImages.length - 1"
        class="nav-button nav-button-right"
        aria-label="Next image"
        @click="nextImage"
      >
        ›
      </button>

      <!-- Image counter -->
      <div v-if="availableImages.length > 1" class="image-counter">
        {{ currentIndex + 1 }} / {{ availableImages.length }}
      </div>

      <!-- Debug info (only in development) -->
      <div v-if="isDevMode" class="debug-info">
        <small class="text-noir-text/40 text-xs">
          Status: {{ currentDisplayImage?.status || 'N/A' }}
        </small>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
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

// Image loading and fallback state
const currentFallbackIndex = ref(0);

// Simplified image handling

// Development mode detection
const isDevMode = computed(() => {
  return import.meta.env.DEV;
});

// Filter and sort images by priority (lowest number = highest priority)
// Only include active and fallback status images
const availableImages = computed(() => {
  return props.images
    ?.map(img => ({
      ...img,
      // Default missing fields
      priority: img.priority ?? 1,
      status: img.status ?? 'active'
    }))
    ?.filter(img => img.status === 'active' || img.status === 'fallback')
    ?.sort((a, b) => a.priority - b.priority) || [];
});

// Get the current image being displayed (considering fallback attempts)
const currentDisplayImage = computed(() => {
  const image = availableImages.value[currentIndex.value];
  if (!image) return null;

  // If we're in a fallback attempt, return the image
  return image;
});

// Loading message
const loadingMessage = computed(() => 'Loading image...');

// Simplified - no fallback indicators needed

// Simplified image handling - no preloading needed

// Simplified image loading - just set the current image
const loadImageWithFallback = async (startIndex = 0) => {
  loading.value = true;
  imageError.value = false;
  currentFallbackIndex.value = startIndex;

  const image = availableImages.value[currentIndex.value];
  if (!image) {
    console.error('❌ No image available for current index');
    loading.value = false;
    imageError.value = true;
    return;
  }

  // Just set loading to false after a short delay to show the image
  // The actual img element will handle loading/error states
  setTimeout(() => {
    loading.value = false;
  }, 100);
};

// Watch for image changes and start loading
watch(() => props.images, (newImages) => {
  if (newImages && newImages.length > 0) {
    console.log('🖼️ Images updated, starting load process');
    currentIndex.value = 0;
    loadImageWithFallback();
  }
}, { immediate: true });

// Watch for carousel index changes
watch(() => currentIndex.value, () => {
  loadImageWithFallback();
});

const dotClass = (index: number) => {
  const base = ['w-2', 'h-2', 'rounded-full', 'transition-all', 'duration-200'];
  const active = index === currentIndex.value
    ? ['bg-noir-gold', 'w-6']
    : ['bg-noir-text/30', 'hover:bg-noir-text/50'];
  
  return [...base, ...active];
};

const selectImage = (index: number) => {
  if (index >= 0 && index < availableImages.value.length) {
    currentIndex.value = index;
  }
};

const nextImage = () => {
  if (currentIndex.value < availableImages.value.length - 1) {
    selectImage(currentIndex.value + 1);
  }
};

const previousImage = () => {
  if (currentIndex.value > 0) {
    selectImage(currentIndex.value - 1);
  }
};

const handleImageLoad = () => {
  console.log('🖼️ Image loaded successfully, setting loading to false');
  loading.value = false;
  imageError.value = false;
};

const handleImageError = () => {
  console.error('❌ Image failed to load in DOM');
  // Try the next priority image in the sorted list
  const nextIndex = currentIndex.value + 1;
  if (nextIndex < availableImages.value.length) {
    console.log(`🔄 Falling back to next priority image (${nextIndex + 1}/${availableImages.value.length})`);
    currentIndex.value = nextIndex;
  } else {
    loading.value = false;
    imageError.value = true;
  }
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
    loading.value = true; // Start loading when images change
    imageError.value = false;
  },
);

// Add keyboard navigation
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown);
}

// Cleanup on unmount
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
  }
});
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

.debug-info {
  @apply absolute bottom-2 left-2 bg-noir-surface/80 text-noir-text px-3 py-1 rounded-lg text-xs font-mono border border-noir-gold/20;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Image transition animations */
.image-fade-enter-active,
.image-fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.image-fade-enter-from {
  opacity: 0;
}

.image-fade-leave-to {
  opacity: 0;
}
</style>

