/**
 * @file spatialScore.ts
 * @description Calculates the Spatial Accuracy score component (max 800 points) 
 * using the Haversine distance and the linear decay formula specified in the PRD.
 * * @module lib/scoring
 * @author Team HistoGuesser
 * @created 2025-11-03
 */

// Internal imports
// Note: Using '@lib/' alias as configured in Phase 0.1
import { haversineDistance } from '@/lib/geography/haversine';

// Constants (based on PRD formula)
const MAX_SCORE = 800; // Maximum possible points for this component
const DECAY_RATE_PER_KM = 1 / 10; // Lose 1 point for every 10 km (distance_km / 10)

/**
 * Calculates the Location Accuracy score based on the distance between the
 * guessed location and the true figure location.
 * * Formula: max(0, 800 - (distance_km / 10))
 * * @param guessLat - Latitude of the player's guess.
 * @param guessLon - Longitude of the player's guess.
 * @param trueLat - True latitude of the historical figure.
 * @param trueLon - True longitude of the historical figure.
 * @returns The Spatial Accuracy score (integer between 0 and 800).
 * * @example
 * // Example: Distance is 500 km
 * // Score = 800 - (500 / 10) = 750
 * const score = calculateSpatialScore(40.7, -74.0, 42.3, -71.1);
 * // score should be an integer
 */
export function calculateSpatialScore(
  guessLat: number,
  guessLon: number,
  trueLat: number,
  trueLon: number
): number {
  // 1. Calculate the distance in kilometers using the Haversine formula
  const distanceKm = haversineDistance(guessLat, guessLon, trueLat, trueLon);

  // 2. Apply the linear decay formula: score = 800 - (distance_km / 10)
  const penalty = distanceKm * DECAY_RATE_PER_KM;

  // 3. Ensure the score is an integer and does not fall below zero
  const rawScore = MAX_SCORE - penalty;
  
  // The max() ensures the score doesn't go below 0
  const finalScore = Math.max(0, Math.round(rawScore));

  return finalScore;
}