<template>
  <Card :padding="padding" class="timeline-container">
    <div class="timeline-header">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-medium text-noir-text">Birth Year</label>
        <div class="flex items-center gap-2">
          <button
            :class="eraButtonClass('BCE')"
            @click="toggleEra('BCE')"
          >
            BCE
          </button>
          <button
            :class="eraButtonClass('CE')"
            @click="toggleEra('CE')"
          >
            CE
          </button>
        </div>
      </div>

      <!-- Direct year input -->
      <div class="flex items-center gap-2 mb-4">
        <input
          v-model.number="directYearInput"
          type="number"
          :min="era === 'BCE' ? 1 : 1"
          :max="era === 'BCE' ? 1000 : 2025"
          :disabled="disabled"
          class="year-input"
          placeholder="Type year..."
          @input="handleDirectInput"
        />
        <span class="text-noir-text/60 text-sm">{{ era }}</span>
      </div>
    </div>

    <!-- Slider -->
    <div class="slider-wrapper">
      <input
        ref="sliderRef"
        v-model.number="sliderValue"
        type="range"
        :min="sliderMin"
        :max="sliderMax"
        :step="snapIncrement"
        :disabled="disabled"
        class="timeline-slider"
        @input="handleSliderChange"
      />

      <!-- Slider labels -->
      <div class="slider-labels">
        <span class="text-xs text-noir-text/60">{{ sliderMin }}</span>
        <span class="text-xs text-noir-text/60">{{ sliderMax }}</span>
      </div>

      <!-- Current value display -->
      <div class="current-value">
        <span class="text-2xl font-mono text-noir-gold">
          {{ displayValue }}
        </span>
        <span class="text-sm text-noir-text/60 ml-2">{{ era }}</span>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Card from '@/components/ui/Card.vue';

interface Props {
  modelValue: number; // Internal format: negative for BCE, positive for CE
  disabled?: boolean;
  snapIncrement?: number;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  snapIncrement: 5,
  padding: 'sm',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const sliderRef = ref<HTMLInputElement | null>(null);

// Era state (BCE or CE)
const era = ref<'BCE' | 'CE'>(props.modelValue < 0 ? 'BCE' : 'CE');

// Current slider value (always positive for the slider)
const sliderValue = ref(Math.abs(props.modelValue));

// Direct input value
const directYearInput = ref(Math.abs(props.modelValue));

// Slider bounds
const sliderMin = computed(() => (era.value === 'BCE' ? 1 : 1));
const sliderMax = computed(() => (era.value === 'BCE' ? 1000 : 2025));

// Display value
const displayValue = computed(() => Math.abs(props.modelValue));

// Convert to internal format (negative for BCE)
const toInternalValue = (year: number, currentEra: 'BCE' | 'CE'): number => {
  return currentEra === 'BCE' ? -Math.abs(year) : Math.abs(year);
};

// Era button classes
const eraButtonClass = (buttonEra: 'BCE' | 'CE') => {
  const base = [
    'px-3',
    'py-1',
    'text-sm',
    'rounded',
    'transition-all',
    'border',
  ];
  const active = era.value === buttonEra
    ? ['bg-noir-gold', 'text-noir-surface', 'border-noir-gold']
    : ['bg-noir-surface', 'text-noir-text', 'border-noir-gold/20', 'hover:border-noir-gold/40'];

  return [...base, ...active];
};

// Toggle era
const toggleEra = (newEra: 'BCE' | 'CE') => {
  if (props.disabled) return;
  
  era.value = newEra;
  
  // Reset slider to middle of range when switching eras
  const midpoint = newEra === 'BCE' ? 500 : 1000;
  sliderValue.value = midpoint;
  directYearInput.value = midpoint;
  
  emitValue(midpoint);
};

// Handle slider change
const handleSliderChange = () => {
  directYearInput.value = sliderValue.value;
  emitValue(sliderValue.value);
};

// Handle direct input
const handleDirectInput = () => {
  // Clamp value to valid range
  const min = sliderMin.value;
  const max = sliderMax.value;
  
  if (directYearInput.value < min) {
    directYearInput.value = min;
  } else if (directYearInput.value > max) {
    directYearInput.value = max;
  }
  
  sliderValue.value = directYearInput.value;
  emitValue(directYearInput.value);
};

// Emit value in internal format
const emitValue = (year: number) => {
  const internalValue = toInternalValue(year, era.value);
  emit('update:modelValue', internalValue);
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    const newEra = newValue < 0 ? 'BCE' : 'CE';
    const absValue = Math.abs(newValue);
    
    if (era.value !== newEra) {
      era.value = newEra;
    }
    
    sliderValue.value = absValue;
    directYearInput.value = absValue;
  },
);
</script>

<style scoped>
.timeline-container {
  @apply w-full;
}

.year-input {
  @apply flex-1 px-3 py-2 bg-noir-surface text-noir-text border border-noir-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-noir-gold/30 focus:border-noir-gold/40 transition-all font-mono;
}

.year-input:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.slider-wrapper {
  @apply relative;
}

.timeline-slider {
  @apply w-full h-2 bg-noir-bg rounded-lg appearance-none cursor-pointer transition-all;
}

.timeline-slider::-webkit-slider-thumb {
  @apply appearance-none w-6 h-6 bg-noir-text rounded-full border-2 border-noir-gold cursor-pointer shadow-lg;
}

.timeline-slider::-moz-range-thumb {
  @apply w-6 h-6 bg-noir-text rounded-full border-2 border-noir-gold cursor-pointer shadow-lg;
}

.timeline-slider::-webkit-slider-track {
  @apply w-full h-2 bg-noir-bg rounded-lg;
}

.timeline-slider::-moz-range-track {
  @apply w-full h-2 bg-noir-bg rounded-lg;
}

/* Progress fill effect */
.timeline-slider::-webkit-slider-runnable-track {
  @apply bg-gradient-to-r from-noir-gold/40 to-noir-bg;
}

.slider-labels {
  @apply flex justify-between mt-1 px-1;
}

.current-value {
  @apply flex items-center justify-center mt-4 pt-4 border-t border-noir-gold/10;
}

.timeline-slider:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>

