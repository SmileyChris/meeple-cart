import { describe, it, expect } from 'vitest';
import {
  pixelsToPercent,
  percentToPixels,
  rectanglePixelsToPercent,
  rectanglePercentToPixels,
  polygonPixelsToPercent,
  polygonPercentToPixels,
  isPointInRectangle,
  isPointInPolygon,
  getRegionsForPhoto,
  getRegionsForGame,
  shouldBlurRegion,
  validateRegionCoordinates,
} from './photo-regions';
import { createRectangleRegion, createPolygonRegion } from '$lib/types/photo-region';
import type { PhotoRegion, PolygonCoordinates } from '$lib/types/photo-region';

describe('photo-regions utilities', () => {
  describe('pixelsToPercent', () => {
    it('converts pixel coordinates to percentage', () => {
      const result = pixelsToPercent(100, 50, 1000, 500);
      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
    });

    it('handles zero coordinates', () => {
      const result = pixelsToPercent(0, 0, 1000, 500);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('handles max coordinates', () => {
      const result = pixelsToPercent(1000, 500, 1000, 500);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });
  });

  describe('percentToPixels', () => {
    it('converts percentage coordinates to pixels', () => {
      const result = percentToPixels(10, 10, 1000, 500);
      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
    });

    it('handles zero percentage', () => {
      const result = percentToPixels(0, 0, 1000, 500);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('handles 100% percentage', () => {
      const result = percentToPixels(100, 100, 1000, 500);
      expect(result.x).toBe(1000);
      expect(result.y).toBe(500);
    });
  });

  describe('rectanglePixelsToPercent', () => {
    it('converts rectangle pixel coordinates to percentage', () => {
      const result = rectanglePixelsToPercent(100, 50, 200, 100, 1000, 500);
      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
      expect(result.width).toBe(20);
      expect(result.height).toBe(20);
    });

    it('handles full-image rectangle', () => {
      const result = rectanglePixelsToPercent(0, 0, 1000, 500, 1000, 500);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('handles small rectangle', () => {
      const result = rectanglePixelsToPercent(10, 5, 10, 5, 1000, 500);
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });
  });

  describe('rectanglePercentToPixels', () => {
    it('converts rectangle percentage coordinates to pixels', () => {
      const coords = { x: 10, y: 10, width: 20, height: 20 };
      const result = rectanglePercentToPixels(coords, 1000, 500);
      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
      expect(result.width).toBe(200);
      expect(result.height).toBe(100);
    });

    it('handles full-image percentage', () => {
      const coords = { x: 0, y: 0, width: 100, height: 100 };
      const result = rectanglePercentToPixels(coords, 1000, 500);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);
    });
  });

  describe('polygonPixelsToPercent', () => {
    it('converts polygon pixel coordinates to percentage', () => {
      const points = [
        { x: 100, y: 50 },
        { x: 200, y: 50 },
        { x: 200, y: 150 },
        { x: 100, y: 150 },
      ];
      const result = polygonPixelsToPercent(points, 1000, 500);
      expect(result.points).toHaveLength(4);
      expect(result.points[0]).toEqual({ x: 10, y: 10 });
      expect(result.points[1]).toEqual({ x: 20, y: 10 });
      expect(result.points[2]).toEqual({ x: 20, y: 30 });
      expect(result.points[3]).toEqual({ x: 10, y: 30 });
    });

    it('handles triangle', () => {
      const points = [
        { x: 500, y: 0 },
        { x: 1000, y: 500 },
        { x: 0, y: 500 },
      ];
      const result = polygonPixelsToPercent(points, 1000, 500);
      expect(result.points).toHaveLength(3);
      expect(result.points[0]).toEqual({ x: 50, y: 0 });
      expect(result.points[1]).toEqual({ x: 100, y: 100 });
      expect(result.points[2]).toEqual({ x: 0, y: 100 });
    });
  });

  describe('polygonPercentToPixels', () => {
    it('converts polygon percentage coordinates to pixels', () => {
      const coords: PolygonCoordinates = {
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 10 },
          { x: 20, y: 30 },
          { x: 10, y: 30 },
        ],
      };
      const result = polygonPercentToPixels(coords, 1000, 500);
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ x: 100, y: 50 });
      expect(result[1]).toEqual({ x: 200, y: 50 });
      expect(result[2]).toEqual({ x: 200, y: 150 });
      expect(result[3]).toEqual({ x: 100, y: 150 });
    });
  });

  describe('isPointInRectangle', () => {
    const rect = { x: 10, y: 10, width: 20, height: 20 };

    it('returns true for point inside rectangle', () => {
      expect(isPointInRectangle(15, 15, rect)).toBe(true);
      expect(isPointInRectangle(20, 20, rect)).toBe(true);
    });

    it('returns true for point on rectangle edge', () => {
      expect(isPointInRectangle(10, 10, rect)).toBe(true);
      expect(isPointInRectangle(30, 30, rect)).toBe(true);
    });

    it('returns false for point outside rectangle', () => {
      expect(isPointInRectangle(5, 15, rect)).toBe(false);
      expect(isPointInRectangle(15, 5, rect)).toBe(false);
      expect(isPointInRectangle(35, 25, rect)).toBe(false);
      expect(isPointInRectangle(25, 35, rect)).toBe(false);
    });
  });

  describe('isPointInPolygon', () => {
    // Square polygon
    const squarePolygon: PolygonCoordinates = {
      points: [
        { x: 10, y: 10 },
        { x: 30, y: 10 },
        { x: 30, y: 30 },
        { x: 10, y: 30 },
      ],
    };

    it('returns true for point inside polygon', () => {
      expect(isPointInPolygon(20, 20, squarePolygon)).toBe(true);
      expect(isPointInPolygon(15, 25, squarePolygon)).toBe(true);
    });

    it('returns false for point outside polygon', () => {
      expect(isPointInPolygon(5, 5, squarePolygon)).toBe(false);
      expect(isPointInPolygon(35, 35, squarePolygon)).toBe(false);
      expect(isPointInPolygon(5, 20, squarePolygon)).toBe(false);
    });

    // Triangle polygon
    const trianglePolygon: PolygonCoordinates = {
      points: [
        { x: 50, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ],
    };

    it('returns true for point inside triangle', () => {
      expect(isPointInPolygon(50, 50, trianglePolygon)).toBe(true);
      expect(isPointInPolygon(40, 70, trianglePolygon)).toBe(true);
    });

    it('returns false for point outside triangle', () => {
      expect(isPointInPolygon(50, 5, trianglePolygon)).toBe(false);
      expect(isPointInPolygon(10, 10, trianglePolygon)).toBe(false);
      expect(isPointInPolygon(95, 50, trianglePolygon)).toBe(false);
    });
  });

  describe('getRegionsForPhoto', () => {
    const regions: PhotoRegion[] = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
      createRectangleRegion('photo2.jpg', { x: 30, y: 30, width: 20, height: 20 }, 'game2'),
      createRectangleRegion('photo1.jpg', { x: 50, y: 50, width: 20, height: 20 }, 'game3'),
    ];

    it('returns only regions for specified photo', () => {
      const result = getRegionsForPhoto(regions, 'photo1.jpg');
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.photoId === 'photo1.jpg')).toBe(true);
    });

    it('returns empty array for photo with no regions', () => {
      const result = getRegionsForPhoto(regions, 'photo3.jpg');
      expect(result).toHaveLength(0);
    });
  });

  describe('getRegionsForGame', () => {
    const regions: PhotoRegion[] = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
      createRectangleRegion('photo2.jpg', { x: 30, y: 30, width: 20, height: 20 }, 'game1'),
      createRectangleRegion('photo1.jpg', { x: 50, y: 50, width: 20, height: 20 }, 'game2'),
    ];

    it('returns only regions for specified game', () => {
      const result = getRegionsForGame(regions, 'game1');
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.gameId === 'game1')).toBe(true);
    });

    it('returns empty array for game with no regions', () => {
      const result = getRegionsForGame(regions, 'game3');
      expect(result).toHaveLength(0);
    });
  });

  describe('shouldBlurRegion', () => {
    it('returns true for manually obscured regions', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, null);
      region.manuallyObscured = true;
      expect(shouldBlurRegion(region, 'available')).toBe(true);
      expect(shouldBlurRegion(region, undefined)).toBe(true);
    });

    it('returns true for sold game', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1');
      expect(shouldBlurRegion(region, 'sold')).toBe(true);
    });

    it('returns true for pending game', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1');
      expect(shouldBlurRegion(region, 'pending')).toBe(true);
    });

    it('returns false for available game', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1');
      expect(shouldBlurRegion(region, 'available')).toBe(false);
    });

    it('returns false for bundled game', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1');
      expect(shouldBlurRegion(region, 'bundled')).toBe(false);
    });

    it('returns false when game status is undefined and not manually obscured', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1');
      expect(shouldBlurRegion(region, undefined)).toBe(false);
    });
  });

  describe('validateRegionCoordinates', () => {
    it('validates rectangle region within bounds', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 });
      expect(validateRegionCoordinates(region)).toBe(true);
    });

    it('rejects rectangle with negative coordinates', () => {
      const region = createRectangleRegion('photo1.jpg', { x: -5, y: 10, width: 20, height: 20 });
      expect(validateRegionCoordinates(region)).toBe(false);
    });

    it('rejects rectangle extending beyond bounds', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 90, y: 10, width: 20, height: 20 });
      expect(validateRegionCoordinates(region)).toBe(false);
    });

    it('rejects rectangle with zero width', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 0, height: 20 });
      expect(validateRegionCoordinates(region)).toBe(false);
    });

    it('rejects rectangle with zero height', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 0 });
      expect(validateRegionCoordinates(region)).toBe(false);
    });

    it('validates polygon region within bounds', () => {
      const region = createPolygonRegion(
        'photo1.jpg',
        {
          points: [
            { x: 10, y: 10 },
            { x: 30, y: 10 },
            { x: 30, y: 30 },
            { x: 10, y: 30 },
          ],
        },
        'game1'
      );
      expect(validateRegionCoordinates(region)).toBe(true);
    });

    it('rejects polygon with points outside bounds', () => {
      const region = createPolygonRegion(
        'photo1.jpg',
        {
          points: [
            { x: 10, y: 10 },
            { x: 110, y: 10 },
            { x: 30, y: 30 },
          ],
        },
        'game1'
      );
      expect(validateRegionCoordinates(region)).toBe(false);
    });

    it('rejects polygon with negative coordinates', () => {
      const region = createPolygonRegion(
        'photo1.jpg',
        {
          points: [
            { x: -5, y: 10 },
            { x: 30, y: 10 },
            { x: 30, y: 30 },
          ],
        },
        'game1'
      );
      expect(validateRegionCoordinates(region)).toBe(false);
    });

    it('validates edge case: rectangle at bounds', () => {
      const region = createRectangleRegion('photo1.jpg', { x: 0, y: 0, width: 100, height: 100 });
      expect(validateRegionCoordinates(region)).toBe(true);
    });

    it('validates edge case: polygon at bounds', () => {
      const region = createPolygonRegion(
        'photo1.jpg',
        {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
          ],
        },
        'game1'
      );
      expect(validateRegionCoordinates(region)).toBe(true);
    });
  });

  describe('coordinate conversion round-trip', () => {
    it('preserves rectangle coordinates through conversion cycle', () => {
      const original = { x: 100, y: 50, width: 200, height: 100 };
      const percent = rectanglePixelsToPercent(original.x, original.y, original.width, original.height, 1000, 500);
      const backToPixels = rectanglePercentToPixels(percent, 1000, 500);

      expect(backToPixels.x).toBeCloseTo(original.x, 0.01);
      expect(backToPixels.y).toBeCloseTo(original.y, 0.01);
      expect(backToPixels.width).toBeCloseTo(original.width, 0.01);
      expect(backToPixels.height).toBeCloseTo(original.height, 0.01);
    });

    it('preserves polygon coordinates through conversion cycle', () => {
      const original = [
        { x: 100, y: 50 },
        { x: 200, y: 50 },
        { x: 200, y: 150 },
      ];
      const percent = polygonPixelsToPercent(original, 1000, 500);
      const backToPixels = polygonPercentToPixels(percent, 1000, 500);

      expect(backToPixels).toHaveLength(original.length);
      backToPixels.forEach((point, i) => {
        expect(point.x).toBeCloseTo(original[i].x, 0.01);
        expect(point.y).toBeCloseTo(original[i].y, 0.01);
      });
    });
  });
});
