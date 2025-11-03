
It looks like the npm install failed because it couldn't find the package leaflet-geodesic in the npm registry, resulting in an E404 Not Found error.The project requirements specify using Leaflet.js and an extension for calculating Haversine distance for the scoring component. While the plan mentioned the need for a Leaflet extension, lets just implement the robust solution of  implementing the formula directly in your core business logic (/lib) as the Haversine distance formula is a core mathematical function, while mainting the standard Leaflet features for the map display, rather than relying on a potentially unstable, small third-party Leaflet plugin.Here's the plan to fix this and update the project requirements:


Haversine Fix: Implementation Steps
1. Resolve Package Error
Remove Dependency: Edit your package.json file and delete the entry for leaflet-geodesic.

Re-Install: Run npm install to successfully install the remaining, correct dependencies.

2. Implement Core Logic Module
Create File: Create the file lib/geography/haversine.ts.

Insert Code: Use the following TSDoc-compliant, pure TypeScript structure to implement the Haversine formula

Please also update the PRD & the the relevant tasklist files to show that we are using this for the haversine

Lastly, I have also created a possible use for the possible spatialScore typescript function that can be placed in lib/scoring/spatialScore.ts. Please look in the ._docs/spatialScore typescript.md

Here is the Haversine typescript code you can use :

/**
 * @file haversine.ts
 * @description Implements the Haversine formula to calculate the great-circle
 * distance between two points (latitude and longitude) on a sphere (the Earth).
 * This function is framework-agnostic and required for Spatial Accuracy scoring.
 * * @module lib/geography
 * @author Team HistoGuesser
 * @created 2025-11-03
 */

// Constants
const EARTH_RADIUS_KM = 6371; // Earth's mean radius in kilometers
// Note: This matches the constant used in the server-side scoring function implementation.

/**
 * Calculates the Haversine (great-circle) distance between two sets of coordinates.
 * * @param lat1 - Latitude of the first point (in degrees).
 * @param lon1 - Longitude of the first point (in degrees).
 * @param lat2 - Latitude of the second point (in degrees - the correct location).
 * @param lon2 - Longitude of the second point (in degrees - the correct location).
 * @returns The distance between the two points in kilometers (km) as a float.
 * * @example
 * // Distance from Rome (41.9, 12.5) to Paris (48.9, 2.3) should be ~1105 km
 * const distance = haversineDistance(41.9, 12.5, 48.9, 2.3);
 * // distance will be approximately 1105.85
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Convert degrees to radians
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  // Convert latitudes to radians
  const rLat1 = lat1 * (Math.PI / 180);
  const rLat2 = lat2 * (Math.PI / 180);

  // Apply Haversine formula: a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // c = 2 ⋅ atan2(√a, √(1−a))
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // d = R ⋅ c
  const distance = EARTH_RADIUS_KM * c; // Distance in kilometers

  return distance;
}

/**
 * Normalizes an angle from degrees to radians.
 * Note: Not exported, used internally if helper functions are added later.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}