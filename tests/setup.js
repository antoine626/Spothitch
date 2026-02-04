/**
 * Test Setup
 * Configure testing environment
 */

import { vi } from 'vitest';

// Create a working localStorage mock that actually stores data
// This allows tests to either use real storage or mock storage
const localStorageData = {};

const getItem = vi.fn((key) => localStorageData[key] || null);
const setItem = vi.fn((key, value) => {
  localStorageData[key] = String(value);
});
const removeItem = vi.fn((key) => {
  delete localStorageData[key];
});
const clear = vi.fn(() => {
  Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
});

const localStorageMock = {
  getItem,
  setItem,
  removeItem,
  clear,
  get length() {
    return Object.keys(localStorageData).length;
  },
  key: (index) => Object.keys(localStorageData)[index] || null,
};
global.localStorage = localStorageMock;

// Mock navigator
global.navigator = {
  ...global.navigator,
  language: 'fr-FR',
  onLine: true,
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  serviceWorker: {
    register: vi.fn().mockResolvedValue({}),
  },
};

// Mock window.matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn().mockReturnValue({
    result: {},
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
  }),
};

// Reset mocks before each test (but not localStorage which should persist)
beforeEach(() => {
  vi.clearAllMocks();
});
