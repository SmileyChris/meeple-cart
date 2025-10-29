/**
 * Utility functions for working with photo regions
 */

import type {
  PhotoRegion,
  RectangleCoordinates,
  PolygonCoordinates,
} from '$lib/types/photo-region';

/**
 * Convert pixel coordinates to percentage-based coordinates
 * @param pixelX X coordinate in pixels
 * @param pixelY Y coordinate in pixels
 * @param imageWidth Width of the image in pixels
 * @param imageHeight Height of the image in pixels
 * @returns Percentage coordinates { x, y }
 */
export function pixelsToPercent(
  pixelX: number,
  pixelY: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  return {
    x: (pixelX / imageWidth) * 100,
    y: (pixelY / imageHeight) * 100,
  };
}

/**
 * Convert percentage-based coordinates to pixel coordinates
 * @param percentX X coordinate as percentage (0-100)
 * @param percentY Y coordinate as percentage (0-100)
 * @param imageWidth Width of the image in pixels
 * @param imageHeight Height of the image in pixels
 * @returns Pixel coordinates { x, y }
 */
export function percentToPixels(
  percentX: number,
  percentY: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  return {
    x: (percentX / 100) * imageWidth,
    y: (percentY / 100) * imageHeight,
  };
}

/**
 * Convert rectangle pixel coordinates to percentage-based
 */
export function rectanglePixelsToPercent(
  x: number,
  y: number,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): RectangleCoordinates {
  return {
    x: (x / imageWidth) * 100,
    y: (y / imageHeight) * 100,
    width: (width / imageWidth) * 100,
    height: (height / imageHeight) * 100,
  };
}

/**
 * Convert rectangle percentage coordinates to pixels
 */
export function rectanglePercentToPixels(
  coords: RectangleCoordinates,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: (coords.x / 100) * imageWidth,
    y: (coords.y / 100) * imageHeight,
    width: (coords.width / 100) * imageWidth,
    height: (coords.height / 100) * imageHeight,
  };
}

/**
 * Convert polygon pixel coordinates to percentage-based
 */
export function polygonPixelsToPercent(
  points: Array<{ x: number; y: number }>,
  imageWidth: number,
  imageHeight: number
): PolygonCoordinates {
  return {
    points: points.map((point) => ({
      x: (point.x / imageWidth) * 100,
      y: (point.y / imageHeight) * 100,
    })),
  };
}

/**
 * Convert polygon percentage coordinates to pixels
 */
export function polygonPercentToPixels(
  coords: PolygonCoordinates,
  imageWidth: number,
  imageHeight: number
): Array<{ x: number; y: number }> {
  return coords.points.map((point) => ({
    x: (point.x / 100) * imageWidth,
    y: (point.y / 100) * imageHeight,
  }));
}

/**
 * Check if a point is inside a rectangular region
 */
export function isPointInRectangle(
  pointX: number,
  pointY: number,
  rect: RectangleCoordinates
): boolean {
  return (
    pointX >= rect.x &&
    pointX <= rect.x + rect.width &&
    pointY >= rect.y &&
    pointY <= rect.y + rect.height
  );
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param pointX X coordinate (percentage or pixels, must match polygon units)
 * @param pointY Y coordinate (percentage or pixels, must match polygon units)
 * @param polygon Polygon coordinates
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(
  pointX: number,
  pointY: number,
  polygon: PolygonCoordinates
): boolean {
  const points = polygon.points;
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersect =
      yi > pointY !== yj > pointY && pointX < ((xj - xi) * (pointY - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Get all regions for a specific photo
 */
export function getRegionsForPhoto(regions: PhotoRegion[], photoId: string): PhotoRegion[] {
  return regions.filter((region) => region.photoId === photoId);
}

/**
 * Get all regions for a specific game
 */
export function getRegionsForGame(regions: PhotoRegion[], gameId: string): PhotoRegion[] {
  return regions.filter((region) => region.gameId === gameId);
}

/**
 * Check if a region should be blurred based on game status
 * @param region The photo region
 * @param gameStatus The game's current status
 * @returns True if the region should be blurred
 */
export function shouldBlurRegion(
  region: PhotoRegion,
  gameStatus?: 'available' | 'pending' | 'sold' | 'bundled'
): boolean {
  // Always blur manually obscured regions
  if (region.manuallyObscured) {
    return true;
  }

  // Blur if game is sold or pending
  if (gameStatus === 'sold' || gameStatus === 'pending') {
    return true;
  }

  return false;
}

/**
 * Validate that region coordinates are within bounds (0-100%)
 */
export function validateRegionCoordinates(region: PhotoRegion): boolean {
  if (region.type === 'rectangle') {
    const rect = region.coordinates as RectangleCoordinates;
    return (
      rect.x >= 0 &&
      rect.y >= 0 &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.x + rect.width <= 100 &&
      rect.y + rect.height <= 100
    );
  } else {
    const poly = region.coordinates as PolygonCoordinates;
    return poly.points.every((point) => point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100);
  }
}
