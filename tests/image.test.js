/**
 * Image Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  lazyLoadImages,
  observeNewImages,
  createPlaceholder,
  preloadImages,
} from '../src/utils/image.js';

describe('Image Utilities', () => {
  describe('lazyLoadImages', () => {
    let originalIntersectionObserver;

    beforeEach(() => {
      // Store original IntersectionObserver
      originalIntersectionObserver = global.IntersectionObserver;

      // Create mock IntersectionObserver
      const mockObserve = vi.fn();
      const mockUnobserve = vi.fn();
      const mockDisconnect = vi.fn();

      global.IntersectionObserver = vi.fn((callback) => ({
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
        callback,
      }));
    });

    afterEach(() => {
      global.IntersectionObserver = originalIntersectionObserver;
    });

    it('should create IntersectionObserver with default options', () => {
      document.body.innerHTML = '<img data-src="test.jpg" />';
      const observer = lazyLoadImages();

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: null,
          rootMargin: '50px 0px',
          threshold: 0.01,
        })
      );
      expect(observer).not.toBeNull();
    });

    it('should observe images with data-src attribute', () => {
      document.body.innerHTML = `
        <img data-src="test1.jpg" />
        <img data-src="test2.jpg" />
        <img src="loaded.jpg" />
      `;
      const observer = lazyLoadImages();

      expect(observer.observe).toHaveBeenCalledTimes(2);
    });

    it('should use custom selector', () => {
      document.body.innerHTML = `
        <img class="lazy" data-src="test1.jpg" />
        <img data-src="test2.jpg" />
      `;
      lazyLoadImages('.lazy');

      // Should only observe images matching .lazy selector
      const calls = global.IntersectionObserver.mock.results[0].value.observe.mock.calls;
      expect(calls.length).toBe(1);
    });

    it('should accept custom options', () => {
      document.body.innerHTML = '<img data-src="test.jpg" />';
      lazyLoadImages('img[data-src]', { rootMargin: '100px 0px', threshold: 0.5 });

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '100px 0px',
          threshold: 0.5,
        })
      );
    });

    it('should fallback when IntersectionObserver is not supported', () => {
      delete global.IntersectionObserver;

      document.body.innerHTML = '<img data-src="test.jpg" />';
      const observer = lazyLoadImages();

      expect(observer).toBeNull();

      // Image should have src set immediately
      const img = document.querySelector('img');
      expect(img.src).toContain('test.jpg');
      expect(img.dataset.src).toBeUndefined();
    });

    it('should load image when it intersects', () => {
      document.body.innerHTML = '<img data-src="test.jpg" />';
      lazyLoadImages();

      const img = document.querySelector('img');
      const mockEntry = {
        isIntersecting: true,
        target: img,
      };

      // Trigger the callback manually
      const callback = global.IntersectionObserver.mock.calls[0][0];
      const mockObserver = { unobserve: vi.fn() };
      callback([mockEntry], mockObserver);

      expect(img.src).toContain('test.jpg');
      expect(img.dataset.src).toBeUndefined();
      expect(img.classList.contains('lazy-loaded')).toBe(true);
      expect(mockObserver.unobserve).toHaveBeenCalledWith(img);
    });

    it('should not load image when not intersecting', () => {
      document.body.innerHTML = '<img data-src="test.jpg" />';
      lazyLoadImages();

      const img = document.querySelector('img');
      const mockEntry = {
        isIntersecting: false,
        target: img,
      };

      const callback = global.IntersectionObserver.mock.calls[0][0];
      const mockObserver = { unobserve: vi.fn() };
      callback([mockEntry], mockObserver);

      expect(img.src).toBe('');
      expect(img.dataset.src).toBe('test.jpg');
      expect(mockObserver.unobserve).not.toHaveBeenCalled();
    });
  });

  describe('observeNewImages', () => {
    it('should observe new images in container', () => {
      const mockObserver = {
        observe: vi.fn(),
      };

      document.body.innerHTML = `
        <div id="container">
          <img data-src="new1.jpg" />
          <img data-src="new2.jpg" />
        </div>
      `;

      const container = document.getElementById('container');
      observeNewImages(container, mockObserver);

      expect(mockObserver.observe).toHaveBeenCalledTimes(2);
    });

    it('should do nothing if observer is null', () => {
      document.body.innerHTML = '<div id="container"><img data-src="test.jpg" /></div>';
      const container = document.getElementById('container');

      // Should not throw
      expect(() => observeNewImages(container, null)).not.toThrow();
    });
  });

  describe('createPlaceholder', () => {
    it('should create SVG placeholder with default dimensions', () => {
      const placeholder = createPlaceholder();

      expect(placeholder).toContain('data:image/svg+xml;base64,');
      // Decode and verify
      const decoded = atob(placeholder.split(',')[1]);
      expect(decoded).toContain('width="400"');
      expect(decoded).toContain('height="300"');
      expect(decoded).toContain('#334155'); // Default color
    });

    it('should create placeholder with custom dimensions', () => {
      const placeholder = createPlaceholder(800, 600);

      const decoded = atob(placeholder.split(',')[1]);
      expect(decoded).toContain('width="800"');
      expect(decoded).toContain('height="600"');
    });

    it('should create placeholder with custom color', () => {
      const placeholder = createPlaceholder(400, 300, '#ff0000');

      const decoded = atob(placeholder.split(',')[1]);
      expect(decoded).toContain('#ff0000');
    });

    it('should return valid base64 data URL', () => {
      const placeholder = createPlaceholder();

      expect(placeholder.startsWith('data:image/svg+xml;base64,')).toBe(true);
      // Should be valid base64
      expect(() => atob(placeholder.split(',')[1])).not.toThrow();
    });
  });

  describe('preloadImages', () => {
    let originalImage;

    beforeEach(() => {
      originalImage = global.Image;

      // Mock Image constructor
      global.Image = vi.fn().mockImplementation(() => {
        const img = {
          onload: null,
          onerror: null,
          src: '',
        };

        // Auto-resolve when src is set
        setTimeout(() => {
          if (img.src && img.onload) {
            img.onload();
          }
        }, 0);

        return img;
      });
    });

    afterEach(() => {
      global.Image = originalImage;
    });

    it('should preload all images', async () => {
      const urls = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      await preloadImages(urls);

      expect(global.Image).toHaveBeenCalledTimes(3);
    });

    it('should resolve when all images load', async () => {
      const urls = ['image1.jpg', 'image2.jpg'];
      const result = await preloadImages(urls);

      expect(result).toEqual([undefined, undefined]);
    });

    it('should reject when an image fails to load', async () => {
      // Override mock to fail
      global.Image = vi.fn().mockImplementation(() => {
        const img = {
          onload: null,
          onerror: null,
          src: '',
        };

        setTimeout(() => {
          if (img.onerror) {
            img.onerror(new Error('Load failed'));
          }
        }, 0);

        return img;
      });

      const urls = ['bad-image.jpg'];
      await expect(preloadImages(urls)).rejects.toThrow('Failed to preload');
    });

    it('should handle empty array', async () => {
      const result = await preloadImages([]);
      expect(result).toEqual([]);
    });
  });
});
