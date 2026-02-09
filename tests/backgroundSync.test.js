/**
 * Background Sync Service Tests
 * Comprehensive tests for the background sync functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initBackgroundSync,
  destroyBackgroundSync,
  registerSync,
  processPendingSync,
  getSyncQueue,
  getSyncQueueCount,
  clearSyncQueue,
  onSyncComplete,
  onItemSyncComplete,
  getSyncItem,
  removeSyncItem,
  retrySyncItem,
  isBackgroundSyncSupported,
  isSyncing,
  getSyncStats,
  forceSync,
  registerSyncHandler,
  unregisterSyncHandler,
  renderSyncStatus,
  SyncType,
  SyncStatus,
} from '../src/services/backgroundSync.js';

describe('Background Sync Service', () => {
  // Store original navigator.onLine
  let originalOnLine;
  let originalServiceWorker;
  let originalSyncManager;

  beforeEach(() => {
    // Store original values
    originalOnLine = navigator.onLine;
    originalServiceWorker = navigator.serviceWorker;
    originalSyncManager = window.SyncManager;

    // Reset navigator.onLine to true for most tests
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Mock window.SyncManager as undefined (not supported)
    delete window.SyncManager;

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          sync: {
            register: vi.fn().mockResolvedValue(undefined),
          },
        }),
        addEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Clear localStorage completely before each test
    localStorage.clear();

    // Destroy any previous instance
    destroyBackgroundSync();

    // Mock timers for setTimeout/setInterval
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    // Destroy service first
    destroyBackgroundSync();

    // Clear the queue in storage
    localStorage.clear();

    // Restore original values
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });

    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        writable: true,
        configurable: true,
      });
    }

    if (originalSyncManager) {
      window.SyncManager = originalSyncManager;
    }

    // Clear timers
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('SyncType constants', () => {
    it('should have all sync types defined', () => {
      expect(SyncType.SPOT_CREATED).toBe('spot-created');
      expect(SyncType.CHECKIN).toBe('checkin');
      expect(SyncType.MESSAGE).toBe('message');
      expect(SyncType.FAVORITE).toBe('favorite');
      expect(SyncType.RATING).toBe('rating');
      expect(SyncType.PROFILE_UPDATE).toBe('profile-update');
      expect(SyncType.REPORT).toBe('report');
      expect(SyncType.SOS_ALERT).toBe('sos-alert');
    });

    it('should have 8 sync types', () => {
      expect(Object.keys(SyncType).length).toBe(8);
    });
  });

  describe('SyncStatus constants', () => {
    it('should have all sync statuses defined', () => {
      expect(SyncStatus.PENDING).toBe('pending');
      expect(SyncStatus.IN_PROGRESS).toBe('in-progress');
      expect(SyncStatus.COMPLETED).toBe('completed');
      expect(SyncStatus.FAILED).toBe('failed');
      expect(SyncStatus.RETRYING).toBe('retrying');
    });

    it('should have 5 sync statuses', () => {
      expect(Object.keys(SyncStatus).length).toBe(5);
    });
  });

  describe('initBackgroundSync', () => {
    it('should initialize successfully', () => {
      const result = initBackgroundSync();
      expect(result).toBe(true);
    });

    it('should return true if already initialized', () => {
      initBackgroundSync();
      const result = initBackgroundSync();
      expect(result).toBe(true);
    });

    it('should merge custom configuration', () => {
      initBackgroundSync({ maxRetries: 10 });
      // Register a sync to verify initialization
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });
      expect(syncId).toBeTruthy();
    });

    it('should load existing queue from storage', () => {
      // Pre-populate storage with sync data
      const existingQueue = [
        {
          id: 'sync_existing_1',
          tag: SyncType.CHECKIN,
          data: { spotId: '123' },
          status: SyncStatus.PENDING,
          retries: 0,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 1000,
          priority: 1,
          metadata: {},
        },
      ];
      localStorage.setItem('spothitch_v4_backgroundSyncQueue', JSON.stringify(existingQueue));

      initBackgroundSync();

      const queue = getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe('sync_existing_1');
    });

    it('should set up event listeners for online/offline', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      initBackgroundSync();

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });

  describe('destroyBackgroundSync', () => {
    it('should remove event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      initBackgroundSync();
      destroyBackgroundSync();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should allow re-initialization after destroy', () => {
      initBackgroundSync();
      destroyBackgroundSync();
      localStorage.clear();
      const result = initBackgroundSync();
      expect(result).toBe(true);
    });
  });

  describe('registerSync', () => {
    beforeEach(() => {
      // Make navigator offline to prevent immediate processing
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should register a sync item and return ID', () => {
      const syncId = registerSync(SyncType.SPOT_CREATED, { name: 'Test Spot' });
      expect(syncId).toBeTruthy();
      expect(syncId.startsWith('sync_')).toBe(true);
    });

    it('should return null if tag is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const syncId = registerSync(null, { data: 'test' });
      expect(syncId).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[BackgroundSync] Tag is required for registerSync');
      warnSpy.mockRestore();
    });

    it('should return null if data is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const syncId = registerSync(SyncType.CHECKIN, null);
      expect(syncId).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[BackgroundSync] Data is required for registerSync');
      warnSpy.mockRestore();
    });

    it('should create sync item with correct structure', () => {
      const syncId = registerSync(SyncType.MESSAGE, { text: 'Hello' });
      const item = getSyncItem(syncId);

      expect(item).toBeTruthy();
      expect(item.tag).toBe(SyncType.MESSAGE);
      expect(item.data).toEqual({ text: 'Hello' });
      expect(item.status).toBe(SyncStatus.PENDING);
      expect(item.retries).toBe(0);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('should assign priority based on tag', () => {
      const sosId = registerSync(SyncType.SOS_ALERT, { emergency: true });
      const messageId = registerSync(SyncType.MESSAGE, { text: 'test' });

      const sosItem = getSyncItem(sosId);
      const messageItem = getSyncItem(messageId);

      // SOS has priority 0 (highest), MESSAGE has priority 4
      expect(sosItem.priority).toBeLessThan(messageItem.priority);
    });

    it('should allow custom priority override', () => {
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' }, { priority: 0 });
      const item = getSyncItem(syncId);
      expect(item.priority).toBe(0);
    });

    it('should include metadata if provided', () => {
      const syncId = registerSync(SyncType.CHECKIN, { spotId: '123' }, { metadata: { source: 'app' } });
      const item = getSyncItem(syncId);
      expect(item.metadata).toEqual({ source: 'app' });
    });

    it('should sort queue by priority', () => {
      registerSync(SyncType.MESSAGE, { text: 'low' });
      registerSync(SyncType.SOS_ALERT, { emergency: true });
      registerSync(SyncType.CHECKIN, { spotId: '1' });

      const queue = getSyncQueue();

      // SOS should be first (priority 0), then CHECKIN (priority 1), then MESSAGE (priority 4)
      expect(queue[0].tag).toBe(SyncType.SOS_ALERT);
      expect(queue[1].tag).toBe(SyncType.CHECKIN);
      expect(queue[2].tag).toBe(SyncType.MESSAGE);
    });

    it('should persist queue to storage', () => {
      registerSync(SyncType.FAVORITE, { spotId: '456', action: 'add' });

      const stored = localStorage.getItem('spothitch_v4_backgroundSyncQueue');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('getSyncQueue', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should return empty array if no items', () => {
      const queue = getSyncQueue();
      expect(queue).toEqual([]);
    });

    it('should return all items by default', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });

      const queue = getSyncQueue();
      expect(queue.length).toBe(2);
    });

    it('should filter by status', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });

      const pending = getSyncQueue({ status: SyncStatus.PENDING });
      expect(pending.length).toBe(2);

      const failed = getSyncQueue({ status: SyncStatus.FAILED });
      expect(failed.length).toBe(0);
    });

    it('should filter by tag', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.CHECKIN, { spotId: '1' });

      const messages = getSyncQueue({ tag: SyncType.MESSAGE });
      expect(messages.length).toBe(1);
      expect(messages[0].tag).toBe(SyncType.MESSAGE);
    });

    it('should filter by time range', () => {
      const now = Date.now();
      registerSync(SyncType.MESSAGE, { text: '1' });

      const queue = getSyncQueue({ since: now - 1000 });
      expect(queue.length).toBe(1);

      const futureQueue = getSyncQueue({ since: now + 10000 });
      expect(futureQueue.length).toBe(0);
    });

    it('should return a copy of the queue', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });

      const queue1 = getSyncQueue();
      const queue2 = getSyncQueue();

      expect(queue1).not.toBe(queue2);
    });
  });

  describe('getSyncQueueCount', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should return 0 for empty queue', () => {
      expect(getSyncQueueCount()).toBe(0);
    });

    it('should return total count', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });

      expect(getSyncQueueCount()).toBe(2);
    });

    it('should filter count by status', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });

      expect(getSyncQueueCount(SyncStatus.PENDING)).toBe(2);
      expect(getSyncQueueCount(SyncStatus.FAILED)).toBe(0);
    });
  });

  describe('clearSyncQueue', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should clear all items by default', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });

      const cleared = clearSyncQueue();

      expect(cleared).toBe(2);
      expect(getSyncQueueCount()).toBe(0);
    });

    it('should clear by status', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });

      const cleared = clearSyncQueue({ status: SyncStatus.PENDING });

      expect(cleared).toBe(2);
      expect(getSyncQueueCount()).toBe(0);
    });

    it('should clear by tag', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.CHECKIN, { spotId: '1' });

      const cleared = clearSyncQueue({ tag: SyncType.MESSAGE });

      expect(cleared).toBe(1);
      expect(getSyncQueueCount()).toBe(1);
      expect(getSyncQueue()[0].tag).toBe(SyncType.CHECKIN);
    });

    it('should clear by timestamp (olderThan)', () => {
      // This item will be older than the cutoff
      registerSync(SyncType.MESSAGE, { text: '1' });

      // Advance time
      vi.advanceTimersByTime(5000);

      const cutoff = Date.now();
      registerSync(SyncType.MESSAGE, { text: '2' });

      const cleared = clearSyncQueue({ olderThan: cutoff });

      expect(cleared).toBe(1);
      expect(getSyncQueueCount()).toBe(1);
    });

    it('should persist changes to storage', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      clearSyncQueue();

      const stored = JSON.parse(localStorage.getItem('spothitch_v4_backgroundSyncQueue'));
      expect(stored.length).toBe(0);
    });
  });

  describe('getSyncItem', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should return item by ID', () => {
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });
      const item = getSyncItem(syncId);

      expect(item).toBeTruthy();
      expect(item.id).toBe(syncId);
    });

    it('should return null for non-existent ID', () => {
      const item = getSyncItem('non_existent_id');
      expect(item).toBeNull();
    });
  });

  describe('removeSyncItem', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should remove item by ID', () => {
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });

      const removed = removeSyncItem(syncId);

      expect(removed).toBe(true);
      expect(getSyncItem(syncId)).toBeNull();
    });

    it('should return false for non-existent ID', () => {
      const removed = removeSyncItem('non_existent_id');
      expect(removed).toBe(false);
    });

    it('should persist changes to storage', () => {
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });
      removeSyncItem(syncId);

      const stored = JSON.parse(localStorage.getItem('spothitch_v4_backgroundSyncQueue'));
      expect(stored.find(item => item.id === syncId)).toBeUndefined();
    });

    it('should remove associated callback', () => {
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });
      const callback = vi.fn();
      onItemSyncComplete(syncId, callback);

      removeSyncItem(syncId);

      // Callback should no longer be called on completion
      expect(getSyncItem(syncId)).toBeNull();
    });
  });

  describe('retrySyncItem', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should return false for non-existent ID', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = retrySyncItem('non_existent_id');

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should return false for non-failed items', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });

      const result = retrySyncItem(syncId);

      expect(result).toBe(false);
      warnSpy.mockRestore();
    });
  });

  describe('onSyncComplete', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should register callback', () => {
      const callback = vi.fn();
      const unsubscribe = onSyncComplete(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return no-op if callback is not a function', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const unsubscribe = onSyncComplete('not a function');

      expect(typeof unsubscribe).toBe('function');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should allow unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = onSyncComplete(callback);

      unsubscribe();

      // Callback should no longer be called after unsubscribe
    });
  });

  describe('onItemSyncComplete', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should register callback for specific item', () => {
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });
      const callback = vi.fn();

      onItemSyncComplete(syncId, callback);

      // Callback is registered (would be called on sync completion)
      expect(callback).not.toHaveBeenCalled();
    });

    it('should warn if callback is not a function', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      onItemSyncComplete('sync_id', 'not a function');

      expect(warnSpy).toHaveBeenCalledWith('[BackgroundSync] onItemSyncComplete requires a function callback');
      warnSpy.mockRestore();
    });
  });

  describe('isBackgroundSyncSupported', () => {
    it('should return false when SyncManager not available', () => {
      initBackgroundSync();
      expect(isBackgroundSyncSupported()).toBe(false);
    });

    it('should return true when SyncManager is available', () => {
      window.SyncManager = function() {};

      initBackgroundSync();

      expect(isBackgroundSyncSupported()).toBe(true);

      delete window.SyncManager;
    });
  });

  describe('isSyncing', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should return false when not processing', () => {
      expect(isSyncing()).toBe(false);
    });
  });

  describe('getSyncStats', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should return empty stats for empty queue', () => {
      const stats = getSyncStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.retrying).toBe(0);
      expect(stats.byTag).toEqual({});
      expect(stats.oldestItem).toBeNull();
      expect(stats.newestItem).toBeNull();
    });

    it('should count items by status', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });

      const stats = getSyncStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);
    });

    it('should count items by tag', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.MESSAGE, { text: '2' });
      registerSync(SyncType.CHECKIN, { spotId: '1' });

      const stats = getSyncStats();

      expect(stats.byTag[SyncType.MESSAGE]).toBe(2);
      expect(stats.byTag[SyncType.CHECKIN]).toBe(1);
    });

    it('should track oldest and newest items', () => {
      registerSync(SyncType.MESSAGE, { text: '1' });

      vi.advanceTimersByTime(1000);

      registerSync(SyncType.MESSAGE, { text: '2' });

      const stats = getSyncStats();

      expect(stats.oldestItem).toBeTruthy();
      expect(stats.newestItem).toBeTruthy();
      expect(stats.oldestItem.data.text).toBe('1');
      expect(stats.newestItem.data.text).toBe('2');
    });
  });

  describe('forceSync', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should trigger processPendingSync', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.MESSAGE, { text: 'test' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await forceSync();

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('number');
      expect(typeof result.failed).toBe('number');
    });
  });

  describe('registerSyncHandler', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should register custom handler', () => {
      const handler = vi.fn().mockResolvedValue({ success: true });

      registerSyncHandler('custom-tag', handler);

      // Handler is registered
      expect(handler).not.toHaveBeenCalled();
    });

    it('should warn if handler is not a function', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      registerSyncHandler('custom-tag', 'not a function');

      expect(warnSpy).toHaveBeenCalledWith('[BackgroundSync] Handler must be a function');
      warnSpy.mockRestore();
    });
  });

  describe('unregisterSyncHandler', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should remove registered handler', () => {
      const handler = vi.fn();
      registerSyncHandler('custom-tag', handler);

      unregisterSyncHandler('custom-tag');

      // Handler is unregistered (no error thrown)
    });

    it('should handle unregistering non-existent handler', () => {
      // Should not throw
      unregisterSyncHandler('non-existent-tag');
    });
  });

  describe('processPendingSync', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should return offline status when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      registerSync(SyncType.MESSAGE, { text: 'test' });

      const result = await processPendingSync();

      expect(result.offline).toBe(true);
    });

    it('should return success/failed counts', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.MESSAGE, { text: 'test' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();

      expect(typeof result.success).toBe('number');
      expect(typeof result.failed).toBe('number');
    });

    it('should process items with default handlers', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.SPOT_CREATED, { name: 'Test Spot' });
      registerSync(SyncType.CHECKIN, { spotId: '123' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();

      // Default handlers should succeed
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should call completion callbacks', async () => {
      const callback = vi.fn();
      onSyncComplete(callback);

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.MESSAGE, { text: 'test' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      await processPendingSync();

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        success: expect.any(Number),
        failed: expect.any(Number),
      }));
    });

    it('should handle empty queue', async () => {
      const result = await processPendingSync();

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should process items with custom handlers', async () => {
      const customHandler = vi.fn().mockResolvedValue({ success: true });
      registerSyncHandler('custom-type', customHandler);

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync('custom-type', { test: true });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      await processPendingSync();

      expect(customHandler).toHaveBeenCalledWith({ test: true }, {});
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      registerSyncHandler('error-type', errorHandler);

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync('error-type', { test: true });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const errorSpy = vi.spyOn(console, 'error').mockImplementation();
      const result = await processPendingSync();
      errorSpy.mockRestore();

      expect(result.failed).toBe(1);
    });

    it('should remove completed items from queue', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      await processPendingSync();

      expect(getSyncItem(syncId)).toBeNull();
    });
  });

  describe('renderSyncStatus', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should return empty string for empty queue', () => {
      const html = renderSyncStatus();
      expect(html).toBe('');
    });

    it('should render status widget with pending items', () => {
      registerSync(SyncType.MESSAGE, { text: 'test' });

      const html = renderSyncStatus();

      expect(html).toContain('background-sync-status');
      expect(html).toContain('en attente de synchronisation');
      expect(html).toContain('message(s)');
    });

    it('should show offline message when offline', () => {
      registerSync(SyncType.MESSAGE, { text: 'test' });

      const html = renderSyncStatus();

      expect(html).toContain('au retour en ligne');
    });

    it('should include role and aria-live attributes', () => {
      registerSync(SyncType.MESSAGE, { text: 'test' });

      const html = renderSyncStatus();

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
    });

    it('should show tag labels for different sync types', () => {
      registerSync(SyncType.SPOT_CREATED, { name: 'Test' });
      registerSync(SyncType.CHECKIN, { spotId: '1' });
      registerSync(SyncType.SOS_ALERT, { emergency: true });

      const html = renderSyncStatus();

      expect(html).toContain('spot(s)');
      expect(html).toContain('check-in(s)');
      expect(html).toContain('alerte(s) SOS');
    });

    it('should include sync button when online', () => {
      registerSync(SyncType.MESSAGE, { text: 'test' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const html = renderSyncStatus();

      expect(html).toContain('Synchroniser maintenant');
      expect(html).toContain('window.forceBackgroundSync()');
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should handle complete sync workflow', async () => {
      const callback = vi.fn();
      onSyncComplete(callback);

      // Make offline to prevent auto processing
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Register multiple items
      registerSync(SyncType.MESSAGE, { text: '1' });
      registerSync(SyncType.CHECKIN, { spotId: '123' });

      expect(getSyncQueueCount()).toBe(2);

      // Go online and process
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      // Process sync
      const result = await processPendingSync();

      expect(result.success).toBe(2);
      expect(getSyncQueueCount()).toBe(0);
      expect(callback).toHaveBeenCalled();
    });

    it('should handle mixed success and failure', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      registerSyncHandler('fail-type', errorHandler);

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.MESSAGE, { text: 'success' });
      registerSync('fail-type', { will: 'fail' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const errorSpy = vi.spyOn(console, 'error').mockImplementation();
      const result = await processPendingSync();
      errorSpy.mockRestore();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should call item-specific callback on success', async () => {
      const itemCallback = vi.fn();

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      const syncId = registerSync(SyncType.MESSAGE, { text: 'test' });
      onItemSyncComplete(syncId, itemCallback);
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      await processPendingSync();

      expect(itemCallback).toHaveBeenCalledWith(null, expect.objectContaining({
        id: syncId,
        status: SyncStatus.COMPLETED,
      }));
    });

    it('should handle large batches', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Register more items than batch size (default 10)
      for (let i = 0; i < 25; i++) {
        registerSync(SyncType.MESSAGE, { text: `message ${i}` });
      }

      expect(getSyncQueueCount()).toBe(25);

      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();

      expect(result.success).toBe(25);
      expect(getSyncQueueCount()).toBe(0);
    });

    it('should maintain priority order in queue', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Add in reverse priority order
      registerSync(SyncType.PROFILE_UPDATE, { data: '1' });
      registerSync(SyncType.FAVORITE, { data: '2' });
      registerSync(SyncType.MESSAGE, { data: '3' });
      registerSync(SyncType.RATING, { data: '4' });
      registerSync(SyncType.SPOT_CREATED, { data: '5' });
      registerSync(SyncType.CHECKIN, { data: '6' });
      registerSync(SyncType.SOS_ALERT, { data: '7' });

      const queue = getSyncQueue();

      // Verify priority order
      expect(queue[0].tag).toBe(SyncType.SOS_ALERT);
      expect(queue[1].tag).toBe(SyncType.CHECKIN);
      expect(queue[2].tag).toBe(SyncType.SPOT_CREATED);
    });
  });

  describe('Offline/Online handling', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should queue items when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const syncId = registerSync(SyncType.MESSAGE, { text: 'offline message' });

      expect(syncId).toBeTruthy();
      expect(getSyncQueueCount()).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted storage data gracefully', () => {
      localStorage.setItem('spothitch_v4_backgroundSyncQueue', 'invalid json');

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();

      // Should not crash during init
      initBackgroundSync();

      // Queue should be empty (loaded gracefully)
      // Note: the Storage.get method catches the error and returns null
      warnSpy.mockRestore();
    });

    it('should handle null storage data', () => {
      localStorage.removeItem('spothitch_v4_backgroundSyncQueue');

      initBackgroundSync();

      // Queue should be empty
      expect(getSyncQueue()).toEqual([]);
    });
  });

  describe('Window global', () => {
    it('should expose forceBackgroundSync on window', () => {
      expect(typeof window.forceBackgroundSync).toBe('function');
    });
  });

  describe('Additional edge cases', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      initBackgroundSync();
    });

    it('should handle sync with empty data object', () => {
      const syncId = registerSync(SyncType.MESSAGE, {});
      expect(syncId).toBeTruthy();
      const item = getSyncItem(syncId);
      expect(item.data).toEqual({});
    });

    it('should handle sync with complex nested data', () => {
      const complexData = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        date: new Date().toISOString(),
      };
      const syncId = registerSync(SyncType.MESSAGE, complexData);
      const item = getSyncItem(syncId);
      expect(item.data).toEqual(complexData);
    });

    it('should handle multiple unsubscribes', () => {
      const callback = vi.fn();
      const unsubscribe = onSyncComplete(callback);

      // Multiple unsubscribes should not error
      unsubscribe();
      unsubscribe();
      unsubscribe();
    });

    it('should generate unique sync IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const syncId = registerSync(SyncType.MESSAGE, { index: i });
        expect(ids.has(syncId)).toBe(false);
        ids.add(syncId);
      }
      expect(ids.size).toBe(100);
    });

    it('should preserve item order for same priority', () => {
      registerSync(SyncType.MESSAGE, { text: 'first' });
      vi.advanceTimersByTime(10);
      registerSync(SyncType.MESSAGE, { text: 'second' });
      vi.advanceTimersByTime(10);
      registerSync(SyncType.MESSAGE, { text: 'third' });

      const queue = getSyncQueue();

      // All MESSAGE items have same priority, should maintain creation order
      expect(queue[0].data.text).toBe('first');
      expect(queue[1].data.text).toBe('second');
      expect(queue[2].data.text).toBe('third');
    });
  });

  describe('Default handlers for all sync types', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should have default handler for SPOT_CREATED', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.SPOT_CREATED, { name: 'Test Spot' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });

    it('should have default handler for CHECKIN', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.CHECKIN, { spotId: '123' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });

    it('should have default handler for MESSAGE', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.MESSAGE, { text: 'Hello' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });

    it('should have default handler for FAVORITE', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.FAVORITE, { spotId: '456' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });

    it('should have default handler for RATING', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.RATING, { spotId: '789', rating: 5 });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });

    it('should have default handler for PROFILE_UPDATE', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.PROFILE_UPDATE, { username: 'newname' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });

    it('should have default handler for REPORT', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.REPORT, { type: 'spam', targetId: '123' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });

    it('should have default handler for SOS_ALERT', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync(SyncType.SOS_ALERT, { location: { lat: 0, lng: 0 } });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const result = await processPendingSync();
      expect(result.success).toBe(1);
    });
  });

  describe('Unknown tag handling', () => {
    beforeEach(() => {
      initBackgroundSync();
    });

    it('should fail for unknown tag without handler', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      registerSync('unknown-tag', { data: 'test' });
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = await processPendingSync();
      warnSpy.mockRestore();

      expect(result.failed).toBe(1);
    });
  });
});
