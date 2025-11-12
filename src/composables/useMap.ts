import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates } from '@/types/figure';

// Fix for default marker icons in Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

interface UseMapOptions {
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

export function useMap(
  mapContainer: Ref<HTMLElement | null>,
  options: UseMapOptions = {},
) {
  const map = ref<L.Map | null>(null);
  const userPin = ref<L.Marker | null>(null);
  const correctPin = ref<L.Marker | null>(null);
  const distanceLine = ref<L.Polyline | null>(null);
  const guessedCoordinates = ref<Coordinates | null>(null);

  const defaultOptions = {
    center: [20, 0] as [number, number],
    zoom: 2,
    minZoom: 2,
    maxZoom: 18,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Initialize map
  const initMap = () => {
    if (!mapContainer.value || map.value) return;

    // Create map
    map.value = L.map(mapContainer.value, {
      center: mergedOptions.center,
      zoom: mergedOptions.zoom,
      minZoom: mergedOptions.minZoom,
      maxZoom: mergedOptions.maxZoom,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // @ts-expect-error - Leaflet type compatibility issue
    }).addTo(map.value);

    // Handle map clicks for pin placement
    map.value.on('click', (e: L.LeafletMouseEvent) => {
      placeUserPin(e.latlng.lat, e.latlng.lng);
    });
  };

  // Place or move user's guess pin
  const placeUserPin = (lat: number, lon: number) => {
    if (!map.value) return;

    guessedCoordinates.value = { lat, lon };

    // Create custom gold pin icon
    const goldIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div class="w-8 h-8 bg-noir-gold rounded-full border-2 border-noir-text shadow-lg flex items-center justify-center">
               <div class="w-3 h-3 bg-noir-text rounded-full"></div>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (userPin.value) {
      userPin.value.setLatLng([lat, lon]);
    } else {
      userPin.value = L.marker([lat, lon], { icon: goldIcon }).addTo(
        // @ts-expect-error - Leaflet type compatibility issue
        map.value,
      );
    }
  };

  // Show correct location with red pin
  const showCorrectLocation = (lat: number, lon: number) => {
    if (!map.value) return;

    // Create custom red pin icon
    const redIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div class="w-8 h-8 bg-noir-red rounded-full border-2 border-noir-gold shadow-lg flex items-center justify-center">
               <div class="w-3 h-3 bg-noir-gold rounded-full"></div>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // @ts-expect-error - Leaflet type compatibility issue
    correctPin.value = L.marker([lat, lon], { icon: redIcon }).addTo(map.value);

    // Draw line between guess and correct location if user made a guess
    if (guessedCoordinates.value) {
      distanceLine.value = L.polyline(
        [
          [guessedCoordinates.value.lat, guessedCoordinates.value.lon],
          [lat, lon],
        ],
        {
          color: '#CBA135',
          weight: 2,
          opacity: 0.7,
          dashArray: '5, 10',
        },
      // @ts-expect-error - Leaflet type compatibility issue
      ).addTo(map.value);

      // Fit bounds to show both pins
      const bounds = L.latLngBounds([
        [guessedCoordinates.value.lat, guessedCoordinates.value.lon],
        [lat, lon],
      ]);
      map.value.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Just center on correct location
      map.value.setView([lat, lon], 6);
    }
  };

  // Clear all markers and lines
  const clearMap = () => {
    if (!map.value) return;

    if (userPin.value) {
      // @ts-expect-error - Leaflet type compatibility issue
      map.value.removeLayer(userPin.value);
      userPin.value = null;
    }
    if (correctPin.value) {
      // @ts-expect-error - Leaflet type compatibility issue
      map.value.removeLayer(correctPin.value);
      correctPin.value = null;
    }
    if (distanceLine.value) {
      // @ts-expect-error - Leaflet type compatibility issue
      map.value.removeLayer(distanceLine.value);
      distanceLine.value = null;
    }

    guessedCoordinates.value = null;
  };

  // Reset map to initial view
  const resetView = () => {
    if (!map.value) return;
    map.value.setView(mergedOptions.center, mergedOptions.zoom);
  };

  // Cleanup
  const cleanup = () => {
    if (map.value) {
      map.value.remove();
      map.value = null;
    }
  };

  onMounted(() => {
    // Delay initialization slightly to ensure DOM is ready
    setTimeout(initMap, 100);
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    map,
    guessedCoordinates,
    initMap,
    placeUserPin,
    showCorrectLocation,
    clearMap,
    resetView,
    cleanup,
  };
}

