/**
 * Photo region types for mapping games to areas within listing photos
 */

/**
 * Type of region shape
 */
export type RegionType = 'rectangle' | 'polygon';

/**
 * A rectangular region defined by top-left corner and dimensions
 * All coordinates are percentages (0-100) relative to image dimensions
 */
export interface RectangleCoordinates {
  x: number; // Left position (%)
  y: number; // Top position (%)
  width: number; // Width (%)
  height: number; // Height (%)
}

/**
 * A polygon region defined by an array of points
 * All coordinates are percentages (0-100) relative to image dimensions
 */
export interface PolygonCoordinates {
  points: Array<{ x: number; y: number }>; // Array of [x%, y%] points
}

/**
 * Union type for all coordinate types
 */
export type RegionCoordinates = RectangleCoordinates | PolygonCoordinates;

/**
 * A photo region that can be linked to a game or manually obscured
 */
export interface PhotoRegion {
  id: string; // Unique identifier
  photoId: string; // Which photo filename this region is on
  gameId: string | null; // Linked game ID (null for manual obscures)
  type: RegionType;
  coordinates: RegionCoordinates;
  manuallyObscured: boolean; // True for manually obscured regions (not linked to a game)
  created: string; // ISO date string
  updated: string; // ISO date string
}

/**
 * Helper type to check if coordinates are rectangular
 */
export function isRectangleCoordinates(
  coords: RegionCoordinates
): coords is RectangleCoordinates {
  return 'width' in coords && 'height' in coords;
}

/**
 * Helper type to check if coordinates are polygon
 */
export function isPolygonCoordinates(coords: RegionCoordinates): coords is PolygonCoordinates {
  return 'points' in coords;
}

/**
 * Create a new rectangle region
 */
export function createRectangleRegion(
  photoId: string,
  coords: RectangleCoordinates,
  gameId: string | null = null
): PhotoRegion {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    photoId,
    gameId,
    type: 'rectangle',
    coordinates: coords,
    manuallyObscured: gameId === null,
    created: now,
    updated: now,
  };
}

/**
 * Create a new polygon region
 */
export function createPolygonRegion(
  photoId: string,
  coords: PolygonCoordinates,
  gameId: string | null = null
): PhotoRegion {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    photoId,
    gameId,
    type: 'polygon',
    coordinates: coords,
    manuallyObscured: gameId === null,
    created: now,
    updated: now,
  };
}
