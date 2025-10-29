import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PhotoRegionOverlay from './PhotoRegionOverlay.svelte';
import { createRectangleRegion, createPolygonRegion } from '$lib/types/photo-region';
import type { GameRecord } from '$lib/types/listing';

describe('PhotoRegionOverlay', () => {
  const mockGames: GameRecord[] = [
    {
      id: 'game1',
      listing: 'listing1',
      title: 'Gloomhaven',
      condition: 'excellent',
      status: 'available',
      created: '2024-01-01',
      updated: '2024-01-01',
    } as GameRecord,
    {
      id: 'game2',
      listing: 'listing1',
      title: 'Wingspan',
      condition: 'good',
      status: 'sold',
      created: '2024-01-01',
      updated: '2024-01-01',
    } as GameRecord,
  ];

  it('renders nothing when no regions for photo', () => {
    const regions = [
      createRectangleRegion('other-photo.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'current-photo.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    // Component doesn't render the overlay div if there are no regions for the photo
    const overlayContainer = container.querySelector('.pointer-events-none');
    expect(overlayContainer).toBeFalsy();
  });

  it('renders rectangular region', () => {
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    const regionDiv = container.querySelector('.pointer-events-auto');
    expect(regionDiv).toBeTruthy();
    expect(regionDiv?.getAttribute('role')).toBe('button');
  });

  it('renders polygon region', () => {
    const regions = [
      createPolygonRegion(
        'photo1.jpg',
        {
          points: [
            { x: 10, y: 10 },
            { x: 30, y: 10 },
            { x: 30, y: 30 },
          ],
        },
        'game1'
      ),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();

    const path = container.querySelector('path');
    expect(path).toBeTruthy();
  });

  it('applies blur class to sold game region', () => {
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game2'), // game2 is sold
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    const regionDiv = container.querySelector('.region-blurred');
    expect(regionDiv).toBeTruthy();
  });

  it('does not blur available game region', () => {
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'), // game1 is available
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    const regionDiv = container.querySelector('.region-normal');
    expect(regionDiv).toBeTruthy();

    const blurredDiv = container.querySelector('.region-blurred');
    expect(blurredDiv).toBeFalsy();
  });

  it('shows game name label for non-blurred region', () => {
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    const label = container.querySelector('.region-label');
    expect(label).toBeTruthy();
    expect(label?.textContent).toContain('Gloomhaven');
  });

  it('hides game name label for blurred region', () => {
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game2'), // game2 is sold
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    const label = container.querySelector('.region-label');
    expect(label).toBeFalsy(); // Label should not exist for blurred regions
  });

  it('calls onRegionClick when region is clicked', async () => {
    const onRegionClick = vi.fn();
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
      onRegionClick,
    });

    const regionDiv = container.querySelector('[role="button"]');
    expect(regionDiv).toBeTruthy();

    // Simulate click
    regionDiv?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onRegionClick).toHaveBeenCalledWith('game1');
  });

  it('does not call onRegionClick for manually obscured region', () => {
    const onRegionClick = vi.fn();
    const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, null);
    region.manuallyObscured = true;

    const { container } = render(PhotoRegionOverlay, {
      regions: [region],
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
      onRegionClick,
    });

    const regionDiv = container.querySelector('[role="button"]');
    regionDiv?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onRegionClick).not.toHaveBeenCalled();
  });

  it('renders multiple regions correctly', () => {
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
      createRectangleRegion('photo1.jpg', { x: 50, y: 50, width: 20, height: 20 }, 'game2'),
      createPolygonRegion(
        'photo1.jpg',
        {
          points: [
            { x: 70, y: 10 },
            { x: 90, y: 10 },
            { x: 90, y: 30 },
          ],
        },
        'game1'
      ),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    // Should have 2 rectangle divs (with specific class) and 1 SVG
    const rectangleDivs = container.querySelectorAll('div.pointer-events-auto');
    const svgs = container.querySelectorAll('svg');

    expect(rectangleDivs.length).toBe(2);
    expect(svgs.length).toBe(1);
  });

  it('scales coordinates based on image dimensions', () => {
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 50, y: 50, width: 10, height: 10 }, 'game1'),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 800,
      imageHeight: 400,
    });

    const regionDiv = container.querySelector('.pointer-events-auto') as HTMLElement;
    expect(regionDiv).toBeTruthy();

    // 50% of 800px = 400px for left
    // 50% of 400px = 200px for top
    // 10% of 800px = 80px for width
    // 10% of 400px = 40px for height
    const style = regionDiv.getAttribute('style');
    expect(style).toContain('left: 400px');
    expect(style).toContain('top: 200px');
    expect(style).toContain('width: 80px');
    expect(style).toContain('height: 40px');
  });

  it('handles keyboard interaction', () => {
    const onRegionClick = vi.fn();
    const regions = [
      createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, 'game1'),
    ];

    const { container } = render(PhotoRegionOverlay, {
      regions,
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
      onRegionClick,
    });

    const regionDiv = container.querySelector('[role="button"]');

    // Simulate Enter key
    regionDiv?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );

    expect(onRegionClick).toHaveBeenCalledWith('game1');
  });

  it('shows "Obscured" for manually obscured regions', () => {
    const region = createRectangleRegion('photo1.jpg', { x: 10, y: 10, width: 20, height: 20 }, null);
    region.manuallyObscured = true;

    const { container } = render(PhotoRegionOverlay, {
      regions: [region],
      photoId: 'photo1.jpg',
      games: mockGames,
      imageWidth: 1000,
      imageHeight: 500,
    });

    // Manually obscured regions are blurred and don't show labels
    const blurredDiv = container.querySelector('.region-blurred');
    expect(blurredDiv).toBeTruthy();

    const label = container.querySelector('.region-label');
    expect(label).toBeFalsy();
  });
});
