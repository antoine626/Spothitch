/**
 * Tests for Map controls
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Map Controls', () => {
  beforeEach(() => {
    // Mock map instance
    window.mapInstance = {
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      setView: vi.fn(),
      getZoom: vi.fn(() => 10),
    };
  });

  describe('mapZoomIn', () => {
    it('should be defined', () => {
      // Import after mocking
      import('../src/components/views/Map.js').then(() => {
        expect(typeof window.mapZoomIn).toBe('function');
      });
    });
  });

  describe('mapZoomOut', () => {
    it('should be defined', () => {
      import('../src/components/views/Map.js').then(() => {
        expect(typeof window.mapZoomOut).toBe('function');
      });
    });
  });

  describe('searchLocation', () => {
    it('should be defined', () => {
      import('../src/components/views/Map.js').then(() => {
        expect(typeof window.searchLocation).toBe('function');
      });
    });
  });

  describe('renderMap', () => {
    it('should render map container', async () => {
      const { renderMap } = await import('../src/components/views/Map.js');
      const state = { spots: [], points: 100, level: 1, streak: 0 };
      const html = renderMap(state);

      expect(html).toContain('main-map');
      expect(html).toContain('map-search');
    });

    it('should render zoom controls', async () => {
      const { renderMap } = await import('../src/components/views/Map.js');
      const state = { spots: [], points: 100, level: 1, streak: 0 };
      const html = renderMap(state);

      expect(html).toContain('mapZoomIn');
      expect(html).toContain('mapZoomOut');
      expect(html).toContain('centerOnUser');
    });

    it('should render add spot button', async () => {
      const { renderMap } = await import('../src/components/views/Map.js');
      const state = { spots: [], points: 100, level: 1, streak: 0 };
      const html = renderMap(state);

      expect(html).toContain('openAddSpot');
      expect(html).toContain('Ajouter');
    });

    it('should render search input', async () => {
      const { renderMap } = await import('../src/components/views/Map.js');
      const state = { spots: [], points: 100, level: 1, streak: 0 };
      const html = renderMap(state);

      expect(html).toContain('Rechercher');
      expect(html).toContain('input');
    });
  });
});
