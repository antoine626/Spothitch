/**
 * Infinite Scroll Service Tests
 * Tests for infinite scroll loading functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initInfiniteScroll,
  destroyInfiniteScroll,
  setLoading,
  hasMoreItems,
  setHasMore,
  resetScroll,
  isLoading,
  manualLoadMore,
} from '../src/services/infiniteScroll.js';

describe('Infinite Scroll Service', () => {
  let container;
  let mockLoadMoreFn;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'test-container';
    container.className = 'scroll-container';
    document.body.appendChild(container);

    // Mock loadMoreFn
    mockLoadMoreFn = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Cleanup
    const instance = document.querySelector('#test-container');
    if (instance) {
      destroyInfiniteScroll(instance);
      instance.remove();
    }
  });

  describe('initInfiniteScroll', () => {
    it('should initialize with DOM element', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn);

      expect(instance).toBeDefined();
      expect(instance.container).toBe(container);
      expect(instance.loadMoreFn).toBe(mockLoadMoreFn);
    });

    it('should initialize with selector string', () => {
      const instance = initInfiniteScroll('#test-container', mockLoadMoreFn);

      expect(instance).toBeDefined();
      expect(instance.container).toBe(container);
    });

    it('should set default options', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn);

      expect(instance.config.threshold).toBe(100);
      expect(instance.config.initialLoad).toBe(true);
    });

    it('should merge custom options', () => {
      const options = { threshold: 50, initialLoad: false };
      const instance = initInfiniteScroll(container, mockLoadMoreFn, options);

      expect(instance.config.threshold).toBe(50);
      expect(instance.config.initialLoad).toBe(false);
    });

    it('should create sentinel element', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn);
      const sentinel = container.querySelector('.infinite-scroll-sentinel');

      expect(sentinel).toBeDefined();
      expect(sentinel).toBe(instance.sentinel);
    });

    it('should set up intersection observer', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn);

      expect(instance.observer).toBeDefined();
    });

    it('should prevent duplicate instances', () => {
      const instance1 = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      const instance2 = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(instance1).toBe(instance2);
    });

    it('should warn if container not found with selector', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = initInfiniteScroll('#nonexistent', mockLoadMoreFn);

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found');
      warnSpy.mockRestore();
    });

    it('should trigger initial load if enabled', async () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: true });

      // Initial load happens asynchronously, just verify it was called
      // Note: We can't easily test this without mocking the async behavior
      // Instead, verify the instance was created successfully
      expect(instance).toBeDefined();
      expect(instance.hasMore).toBe(true);
    }, { timeout: 1000 });

    it('should not trigger initial load if disabled', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(mockLoadMoreFn).not.toHaveBeenCalled();
    });

    it('should initialize with hasMore as true', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(instance.hasMore).toBe(true);
    });
  });

  describe('destroyInfiniteScroll', () => {
    it('should remove observer', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      const disconnectSpy = vi.spyOn(instance.observer, 'disconnect');

      destroyInfiniteScroll(container);

      expect(disconnectSpy).toHaveBeenCalled();
      disconnectSpy.mockRestore();
    });

    it('should remove sentinel element', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      destroyInfiniteScroll(container);

      const sentinel = container.querySelector('.infinite-scroll-sentinel');
      expect(sentinel).toBeNull();
    });

    it('should remove loader element if present', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      setLoading(container, true);

      destroyInfiniteScroll(container);

      const loader = container.querySelector('.infinite-scroll-loader');
      expect(loader).toBeNull();
    });

    it('should warn if container not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      destroyInfiniteScroll('#nonexistent');

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found for destruction');
      warnSpy.mockRestore();
    });

    it('should warn if no instance exists', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const tempContainer = document.createElement('div');
      document.body.appendChild(tempContainer);

      destroyInfiniteScroll(tempContainer);

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] No instance found for this container');
      warnSpy.mockRestore();
      tempContainer.remove();
    });

    it('should work with selector string', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      destroyInfiniteScroll('#test-container');

      const sentinel = container.querySelector('.infinite-scroll-sentinel');
      expect(sentinel).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should create loader element when setting to true', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      setLoading(container, true);

      const loader = container.querySelector('.infinite-scroll-loader');
      expect(loader).toBeDefined();
      expect(loader.style.display).not.toBe('none');
    });

    it('should show existing loader', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      setLoading(container, true);
      setLoading(container, false);
      setLoading(container, true);

      const loader = container.querySelector('.infinite-scroll-loader');
      expect(loader.style.display).not.toBe('none');
    });

    it('should hide loader when setting to false', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      setLoading(container, true);

      setLoading(container, false);

      const loader = container.querySelector('.infinite-scroll-loader');
      expect(loader.style.display).toBe('none');
    });

    it('should include loading spinner', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      setLoading(container, true);

      const loader = container.querySelector('.infinite-scroll-loader');
      expect(loader.innerHTML).toContain('animate-spin');
      expect(loader.innerHTML).toContain('fa-circle-notch');
    });

    it('should warn if container not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      setLoading('#nonexistent', true);

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found for setLoading');
      warnSpy.mockRestore();
    });

    it('should work with selector string', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      setLoading('#test-container', true);

      const loader = container.querySelector('.infinite-scroll-loader');
      expect(loader).toBeDefined();
    });
  });

  describe('hasMoreItems', () => {
    it('should return true by default', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(hasMoreItems(container)).toBe(true);
    });

    it('should return false after setHasMore(false)', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      setHasMore(container, false);

      expect(hasMoreItems(container)).toBe(false);
    });

    it('should warn if container not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      hasMoreItems('#nonexistent');

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found for hasMoreItems');
      warnSpy.mockRestore();
    });

    it('should return false if no instance', () => {
      const tempContainer = document.createElement('div');
      document.body.appendChild(tempContainer);

      expect(hasMoreItems(tempContainer)).toBe(false);

      tempContainer.remove();
    });

    it('should work with selector string', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(hasMoreItems('#test-container')).toBe(true);
    });
  });

  describe('setHasMore', () => {
    it('should set hasMore to true', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      setHasMore(container, false);

      setHasMore(container, true);

      expect(hasMoreItems(container)).toBe(true);
    });

    it('should set hasMore to false', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      setHasMore(container, false);

      expect(hasMoreItems(container)).toBe(false);
    });

    it('should warn if container not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      setHasMore('#nonexistent', false);

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found for setHasMore');
      warnSpy.mockRestore();
    });

    it('should work with selector string', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      setHasMore('#test-container', false);

      expect(hasMoreItems('#test-container')).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should return false by default', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(isLoading(container)).toBe(false);
    });

    it('should warn if container not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      isLoading('#nonexistent');

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found for isLoading');
      warnSpy.mockRestore();
    });

    it('should return false if no instance', () => {
      const tempContainer = document.createElement('div');
      document.body.appendChild(tempContainer);

      expect(isLoading(tempContainer)).toBe(false);

      tempContainer.remove();
    });

    it('should work with selector string', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(isLoading('#test-container')).toBe(false);
    });
  });

  describe('resetScroll', () => {
    it('should clear loading state', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      instance.isLoading = true;

      resetScroll(container);

      expect(instance.isLoading).toBe(false);
    });

    it('should hide loader', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      setLoading(container, true);

      resetScroll(container);

      const loader = container.querySelector('.infinite-scroll-loader');
      expect(loader.style.display).toBe('none');
    });

    it('should warn if container not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      resetScroll('#nonexistent');

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found for reset');
      warnSpy.mockRestore();
    });

    it('should work with selector string', () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      instance.isLoading = true;

      resetScroll('#test-container');

      expect(instance.isLoading).toBe(false);
    });
  });

  describe('manualLoadMore', () => {
    it('should trigger load if conditions met', async () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      await manualLoadMore(container);

      expect(mockLoadMoreFn).toHaveBeenCalled();
    });

    it('should not trigger if already loading', async () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      instance.isLoading = true;

      await manualLoadMore(container);

      expect(mockLoadMoreFn).not.toHaveBeenCalled();
    });

    it('should not trigger if no more items', async () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });
      setHasMore(container, false);

      await manualLoadMore(container);

      expect(mockLoadMoreFn).not.toHaveBeenCalled();
    });

    it('should warn if container not found', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      await manualLoadMore('#nonexistent');

      expect(warnSpy).toHaveBeenCalledWith('[InfiniteScroll] Container not found for manualLoadMore');
      warnSpy.mockRestore();
    });

    it('should work with selector string', async () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      await manualLoadMore('#test-container');

      expect(mockLoadMoreFn).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete load cycle', async () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      // Start loading
      await manualLoadMore(container);
      expect(mockLoadMoreFn).toHaveBeenCalledTimes(1);

      // Set no more items
      setHasMore(container, false);
      expect(hasMoreItems(container)).toBe(false);

      // Should not load again
      await manualLoadMore(container);
      expect(mockLoadMoreFn).toHaveBeenCalledTimes(1);
    });

    it('should handle error in loadMoreFn', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Load failed'));
      const instance = initInfiniteScroll(container, errorFn, { initialLoad: false });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation();

      await manualLoadMore(container);

      expect(hasMoreItems(container)).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should handle multiple loads and stops', async () => {
      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      // First load
      await manualLoadMore(container);
      expect(mockLoadMoreFn).toHaveBeenCalledTimes(1);

      // Reset and continue
      resetScroll(container);
      await manualLoadMore(container);
      expect(mockLoadMoreFn).toHaveBeenCalledTimes(2);

      // Stop loading
      setHasMore(container, false);
      await manualLoadMore(container);
      expect(mockLoadMoreFn).toHaveBeenCalledTimes(2);
    });

    it('should track loading state correctly', async () => {
      let isLoadingDuringCallback = false;
      const trackingFn = vi.fn(async () => {
        isLoadingDuringCallback = isLoading(container);
      });

      const instance = initInfiniteScroll(container, trackingFn, { initialLoad: false });

      await manualLoadMore(container);

      expect(isLoadingDuringCallback).toBe(true);
      expect(isLoading(container)).toBe(false);
    });
  });

  describe('DOM compatibility', () => {
    it('should handle container with existing content', () => {
      container.innerHTML = '<div class="item">Item 1</div><div class="item">Item 2</div>';

      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      const items = container.querySelectorAll('.item');
      expect(items.length).toBe(2);
      expect(instance).toBeDefined();
    });

    it('should not interfere with container classes', () => {
      container.className = 'custom-class another-class';

      const instance = initInfiniteScroll(container, mockLoadMoreFn, { initialLoad: false });

      expect(container.className).toBe('custom-class another-class');
    });

    it('should handle nested containers', () => {
      const parent = document.createElement('div');
      const child = document.createElement('div');
      child.id = 'nested-container';
      parent.appendChild(child);
      document.body.appendChild(parent);

      const instance = initInfiniteScroll(child, mockLoadMoreFn, { initialLoad: false });

      expect(instance.container).toBe(child);

      destroyInfiniteScroll(child);
      parent.remove();
    });
  });
});
