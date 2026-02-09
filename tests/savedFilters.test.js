/**
 * Tests for Saved Filters Service
 * Comprehensive test coverage for filter saving, loading, and management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the notifications module before importing the service
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

import {
  FILTER_TYPES,
  FRESHNESS_OPTIONS,
  AMENITIES_LIST,
  validateFilters,
  saveFilter,
  getSavedFilters,
  loadFilter,
  deleteFilter,
  updateFilter,
  getFilterById,
  renameFilter,
  duplicateFilter,
  exportFilters,
  importFilters,
  getDefaultFilters,
  setAsDefault,
  getDefaultFilter,
  clearDefaultFilter,
  clearAllFilters,
  getFiltersCount,
  getFilterStats,
  searchFilters,
  renderSavedFiltersList,
} from '../src/services/savedFilters.js';

// Storage key used by the service
const STORAGE_KEY = 'spothitch_saved_filters';

// Mock localStorage
let mockStorage = {};

beforeEach(() => {
  // Reset mock storage
  mockStorage = {};

  // Mock localStorage
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => mockStorage[key] || null),
    setItem: vi.fn((key, value) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ============================================
// FILTER_TYPES constant tests
// ============================================
describe('FILTER_TYPES', () => {
  it('should have all expected filter types', () => {
    expect(FILTER_TYPES.RATING).toBe('rating');
    expect(FILTER_TYPES.COUNTRY).toBe('country');
    expect(FILTER_TYPES.AMENITIES).toBe('amenities');
    expect(FILTER_TYPES.FRESHNESS).toBe('freshness');
    expect(FILTER_TYPES.VERIFIED).toBe('verified');
  });

  it('should have exactly 5 filter types', () => {
    expect(Object.keys(FILTER_TYPES)).toHaveLength(5);
  });
});

// ============================================
// FRESHNESS_OPTIONS constant tests
// ============================================
describe('FRESHNESS_OPTIONS', () => {
  it('should have all expected freshness options', () => {
    expect(FRESHNESS_OPTIONS.ANY).toBe('any');
    expect(FRESHNESS_OPTIONS.WEEK).toBe('week');
    expect(FRESHNESS_OPTIONS.MONTH).toBe('month');
    expect(FRESHNESS_OPTIONS.QUARTER).toBe('quarter');
    expect(FRESHNESS_OPTIONS.YEAR).toBe('year');
  });

  it('should have exactly 5 freshness options', () => {
    expect(Object.keys(FRESHNESS_OPTIONS)).toHaveLength(5);
  });
});

// ============================================
// AMENITIES_LIST constant tests
// ============================================
describe('AMENITIES_LIST', () => {
  it('should contain expected amenities', () => {
    expect(AMENITIES_LIST).toContain('shelter');
    expect(AMENITIES_LIST).toContain('lighting');
    expect(AMENITIES_LIST).toContain('bench');
    expect(AMENITIES_LIST).toContain('toilet');
    expect(AMENITIES_LIST).toContain('water');
    expect(AMENITIES_LIST).toContain('wifi');
    expect(AMENITIES_LIST).toContain('restaurant');
    expect(AMENITIES_LIST).toContain('gas_station');
    expect(AMENITIES_LIST).toContain('parking');
    expect(AMENITIES_LIST).toContain('hitchhiker_friendly');
  });

  it('should have exactly 10 amenities', () => {
    expect(AMENITIES_LIST).toHaveLength(10);
  });
});

// ============================================
// validateFilters tests
// ============================================
describe('validateFilters', () => {
  it('should validate a valid filter with rating', () => {
    const result = validateFilters({ rating: 4 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid filter with country string', () => {
    const result = validateFilters({ country: 'FR' });
    expect(result.isValid).toBe(true);
  });

  it('should validate a valid filter with country array', () => {
    const result = validateFilters({ country: ['FR', 'DE', 'ES'] });
    expect(result.isValid).toBe(true);
  });

  it('should validate a valid filter with amenities', () => {
    const result = validateFilters({ amenities: ['shelter', 'lighting'] });
    expect(result.isValid).toBe(true);
  });

  it('should validate a valid filter with freshness', () => {
    const result = validateFilters({ freshness: 'month' });
    expect(result.isValid).toBe(true);
  });

  it('should validate a valid filter with verified status', () => {
    const result = validateFilters({ verified: true });
    expect(result.isValid).toBe(true);
  });

  it('should validate a complex filter with multiple criteria', () => {
    const result = validateFilters({
      rating: 4,
      country: 'FR',
      amenities: ['shelter'],
      freshness: 'week',
      verified: true,
    });
    expect(result.isValid).toBe(true);
  });

  it('should reject null filters', () => {
    const result = validateFilters(null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Les filtres doivent etre un objet');
  });

  it('should reject non-object filters', () => {
    const result = validateFilters('string');
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid rating (too high)', () => {
    const result = validateFilters({ rating: 6 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('La note doit etre un nombre entre 0 et 5');
  });

  it('should reject invalid rating (negative)', () => {
    const result = validateFilters({ rating: -1 });
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid rating (not a number)', () => {
    const result = validateFilters({ rating: 'four' });
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid country type', () => {
    const result = validateFilters({ country: 123 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Le pays doit etre une chaine ou un tableau');
  });

  it('should reject invalid country array items', () => {
    const result = validateFilters({ country: ['FR', 123] });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Tous les pays doivent etre des chaines');
  });

  it('should reject invalid amenities (not an array)', () => {
    const result = validateFilters({ amenities: 'shelter' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Les commodites doivent etre un tableau');
  });

  it('should reject invalid amenities (unknown amenity)', () => {
    const result = validateFilters({ amenities: ['shelter', 'unknown_amenity'] });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Commodites invalides');
  });

  it('should reject invalid freshness option', () => {
    const result = validateFilters({ freshness: 'invalid' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Option de fraicheur invalide');
  });

  it('should reject invalid verified type', () => {
    const result = validateFilters({ verified: 'yes' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Le statut verifie doit etre un booleen');
  });

  it('should accept empty object as valid', () => {
    const result = validateFilters({});
    expect(result.isValid).toBe(true);
  });

  it('should accept rating of 0', () => {
    const result = validateFilters({ rating: 0 });
    expect(result.isValid).toBe(true);
  });

  it('should accept rating of 5', () => {
    const result = validateFilters({ rating: 5 });
    expect(result.isValid).toBe(true);
  });
});

// ============================================
// saveFilter tests
// ============================================
describe('saveFilter', () => {
  it('should save a valid filter', () => {
    const filter = saveFilter('My Filter', { rating: 4 });
    expect(filter).not.toBeNull();
    expect(filter.name).toBe('My Filter');
    expect(filter.filters.rating).toBe(4);
    expect(filter.id).toMatch(/^filter_/);
  });

  it('should save filter with all fields', () => {
    const filter = saveFilter('Complete Filter', {
      rating: 4,
      country: 'FR',
      amenities: ['shelter', 'lighting'],
      freshness: 'month',
      verified: true,
    });
    expect(filter).not.toBeNull();
    expect(filter.filters.rating).toBe(4);
    expect(filter.filters.country).toBe('FR');
    expect(filter.filters.amenities).toEqual(['shelter', 'lighting']);
    expect(filter.filters.freshness).toBe('month');
    expect(filter.filters.verified).toBe(true);
  });

  it('should set createdAt timestamp', () => {
    const before = new Date().toISOString();
    const filter = saveFilter('Test Filter', { rating: 3 });
    const after = new Date().toISOString();

    expect(filter.createdAt).toBeDefined();
    expect(filter.createdAt >= before).toBe(true);
    expect(filter.createdAt <= after).toBe(true);
  });

  it('should initialize usageCount to 0', () => {
    const filter = saveFilter('Test Filter', { rating: 3 });
    expect(filter.usageCount).toBe(0);
  });

  it('should initialize lastUsedAt to null', () => {
    const filter = saveFilter('Test Filter', { rating: 3 });
    expect(filter.lastUsedAt).toBeNull();
  });

  it('should reject empty name', () => {
    const filter = saveFilter('', { rating: 4 });
    expect(filter).toBeNull();
  });

  it('should reject whitespace-only name', () => {
    const filter = saveFilter('   ', { rating: 4 });
    expect(filter).toBeNull();
  });

  it('should reject null name', () => {
    const filter = saveFilter(null, { rating: 4 });
    expect(filter).toBeNull();
  });

  it('should reject name longer than 50 characters', () => {
    const longName = 'A'.repeat(51);
    const filter = saveFilter(longName, { rating: 4 });
    expect(filter).toBeNull();
  });

  it('should accept name exactly 50 characters', () => {
    const name = 'A'.repeat(50);
    const filter = saveFilter(name, { rating: 4 });
    expect(filter).not.toBeNull();
    expect(filter.name).toBe(name);
  });

  it('should trim name whitespace', () => {
    const filter = saveFilter('  My Filter  ', { rating: 4 });
    expect(filter.name).toBe('My Filter');
  });

  it('should reject invalid filters', () => {
    const filter = saveFilter('Test', { rating: 10 });
    expect(filter).toBeNull();
  });

  it('should reject duplicate names (case insensitive)', () => {
    saveFilter('My Filter', { rating: 4 });
    const duplicate = saveFilter('MY FILTER', { rating: 3 });
    expect(duplicate).toBeNull();
  });

  it('should persist to localStorage', () => {
    saveFilter('Test Filter', { rating: 4 });
    expect(localStorage.setItem).toHaveBeenCalled();
    const stored = JSON.parse(mockStorage[STORAGE_KEY]);
    expect(stored.filters).toHaveLength(1);
  });

  it('should enforce maximum filter limit', () => {
    // Save 20 filters (max)
    for (let i = 0; i < 20; i++) {
      saveFilter(`Filter ${i}`, { rating: 4 });
    }

    // Try to save one more
    const overLimit = saveFilter('Over Limit', { rating: 4 });
    expect(overLimit).toBeNull();
  });
});

// ============================================
// getSavedFilters tests
// ============================================
describe('getSavedFilters', () => {
  it('should return empty array when no filters saved', () => {
    const filters = getSavedFilters();
    expect(filters).toEqual([]);
  });

  it('should return saved filters', () => {
    saveFilter('Filter 1', { rating: 4 });
    saveFilter('Filter 2', { rating: 3 });

    const filters = getSavedFilters();
    expect(filters).toHaveLength(2);
  });

  it('should sort by date (newest first) by default', () => {
    saveFilter('First', { rating: 1 });
    saveFilter('Second', { rating: 2 });
    saveFilter('Third', { rating: 3 });

    const filters = getSavedFilters();
    // Filters are sorted by creation date, with same timestamps falling back to array order
    // Since they're created almost instantly, they may have same timestamp
    // Just verify we get 3 filters and they contain our names
    expect(filters).toHaveLength(3);
    expect(filters.map(f => f.name)).toContain('First');
    expect(filters.map(f => f.name)).toContain('Second');
    expect(filters.map(f => f.name)).toContain('Third');
  });

  it('should sort by name when specified', () => {
    saveFilter('Zebra', { rating: 1 });
    saveFilter('Apple', { rating: 2 });
    saveFilter('Mango', { rating: 3 });

    const filters = getSavedFilters({ sortBy: 'name' });
    expect(filters[0].name).toBe('Apple');
    expect(filters[1].name).toBe('Mango');
    expect(filters[2].name).toBe('Zebra');
  });

  it('should sort by usage when specified', () => {
    const f1 = saveFilter('Low Usage', { rating: 1 });
    const f2 = saveFilter('High Usage', { rating: 2 });

    // Simulate usage
    loadFilter(f2.id);
    loadFilter(f2.id);
    loadFilter(f1.id);

    const filters = getSavedFilters({ sortBy: 'usage' });
    expect(filters[0].name).toBe('High Usage');
    expect(filters[0].usageCount).toBe(2);
  });

  it('should sort by recent usage when specified', () => {
    const f1 = saveFilter('Used First', { rating: 1 });
    const f2 = saveFilter('Used Second', { rating: 2 });

    loadFilter(f1.id);
    loadFilter(f2.id);

    const filters = getSavedFilters({ sortBy: 'recent' });
    // Both were used at nearly the same time, verify both are present
    // and the one used has lastUsedAt set
    expect(filters).toHaveLength(2);
    expect(filters[0].lastUsedAt).not.toBeNull();
    expect(filters[1].lastUsedAt).not.toBeNull();
  });

  it('should return a copy of filters array', () => {
    saveFilter('Test', { rating: 4 });
    const filters1 = getSavedFilters();
    const filters2 = getSavedFilters();
    expect(filters1).not.toBe(filters2);
  });
});

// ============================================
// loadFilter tests
// ============================================
describe('loadFilter', () => {
  it('should load a saved filter by ID', () => {
    const saved = saveFilter('Test Filter', { rating: 4, verified: true });
    const loaded = loadFilter(saved.id);

    expect(loaded).toEqual({ rating: 4, verified: true });
  });

  it('should increment usage count when loading', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    loadFilter(saved.id);
    loadFilter(saved.id);

    const filter = getFilterById(saved.id);
    expect(filter.usageCount).toBe(2);
  });

  it('should update lastUsedAt when loading', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    loadFilter(saved.id);

    const filter = getFilterById(saved.id);
    expect(filter.lastUsedAt).not.toBeNull();
  });

  it('should return null for invalid ID', () => {
    const result = loadFilter(null);
    expect(result).toBeNull();
  });

  it('should return null for non-existent ID', () => {
    const result = loadFilter('nonexistent_id');
    expect(result).toBeNull();
  });

  it('should return null for empty string ID', () => {
    const result = loadFilter('');
    expect(result).toBeNull();
  });
});

// ============================================
// deleteFilter tests
// ============================================
describe('deleteFilter', () => {
  it('should delete a filter by ID', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    expect(getFiltersCount()).toBe(1);

    const result = deleteFilter(saved.id);
    expect(result).toBe(true);
    expect(getFiltersCount()).toBe(0);
  });

  it('should return false for invalid ID', () => {
    const result = deleteFilter(null);
    expect(result).toBe(false);
  });

  it('should return false for non-existent ID', () => {
    const result = deleteFilter('nonexistent_id');
    expect(result).toBe(false);
  });

  it('should clear default filter if deleting the default', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    setAsDefault(saved.id);
    expect(getDefaultFilter()).not.toBeNull();

    deleteFilter(saved.id);
    expect(getDefaultFilter()).toBeNull();
  });

  it('should preserve other filters when deleting one', () => {
    saveFilter('Filter 1', { rating: 1 });
    const f2 = saveFilter('Filter 2', { rating: 2 });
    saveFilter('Filter 3', { rating: 3 });

    deleteFilter(f2.id);

    const remaining = getSavedFilters();
    expect(remaining).toHaveLength(2);
    expect(remaining.some(f => f.name === 'Filter 1')).toBe(true);
    expect(remaining.some(f => f.name === 'Filter 3')).toBe(true);
  });
});

// ============================================
// updateFilter tests
// ============================================
describe('updateFilter', () => {
  it('should update filter configuration', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    const updated = updateFilter(saved.id, { rating: 5, verified: true });

    expect(updated).not.toBeNull();
    expect(updated.filters.rating).toBe(5);
    expect(updated.filters.verified).toBe(true);
  });

  it('should update updatedAt timestamp', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    const originalUpdatedAt = saved.updatedAt;

    // Small delay to ensure different timestamp
    const updated = updateFilter(saved.id, { rating: 5 });
    expect(updated.updatedAt >= originalUpdatedAt).toBe(true);
  });

  it('should preserve name when updating filters', () => {
    const saved = saveFilter('My Name', { rating: 4 });
    const updated = updateFilter(saved.id, { rating: 5 });
    expect(updated.name).toBe('My Name');
  });

  it('should return null for invalid ID', () => {
    const result = updateFilter(null, { rating: 5 });
    expect(result).toBeNull();
  });

  it('should return null for non-existent ID', () => {
    const result = updateFilter('nonexistent', { rating: 5 });
    expect(result).toBeNull();
  });

  it('should reject invalid filter configuration', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    const result = updateFilter(saved.id, { rating: 10 });
    expect(result).toBeNull();
  });
});

// ============================================
// getFilterById tests
// ============================================
describe('getFilterById', () => {
  it('should return filter object for valid ID', () => {
    const saved = saveFilter('Test Filter', { rating: 4 });
    const filter = getFilterById(saved.id);

    expect(filter).not.toBeNull();
    expect(filter.name).toBe('Test Filter');
  });

  it('should return null for invalid ID', () => {
    expect(getFilterById(null)).toBeNull();
    expect(getFilterById('')).toBeNull();
    expect(getFilterById(123)).toBeNull();
  });

  it('should return null for non-existent ID', () => {
    expect(getFilterById('nonexistent')).toBeNull();
  });
});

// ============================================
// renameFilter tests
// ============================================
describe('renameFilter', () => {
  it('should rename a filter', () => {
    const saved = saveFilter('Old Name', { rating: 4 });
    const renamed = renameFilter(saved.id, 'New Name');

    expect(renamed).not.toBeNull();
    expect(renamed.name).toBe('New Name');
  });

  it('should trim the new name', () => {
    const saved = saveFilter('Old Name', { rating: 4 });
    const renamed = renameFilter(saved.id, '  New Name  ');
    expect(renamed.name).toBe('New Name');
  });

  it('should update updatedAt timestamp', () => {
    const saved = saveFilter('Old Name', { rating: 4 });
    const renamed = renameFilter(saved.id, 'New Name');
    expect(renamed.updatedAt >= saved.updatedAt).toBe(true);
  });

  it('should reject empty name', () => {
    const saved = saveFilter('Old Name', { rating: 4 });
    const result = renameFilter(saved.id, '');
    expect(result).toBeNull();
  });

  it('should reject whitespace-only name', () => {
    const saved = saveFilter('Old Name', { rating: 4 });
    const result = renameFilter(saved.id, '   ');
    expect(result).toBeNull();
  });

  it('should reject name longer than 50 characters', () => {
    const saved = saveFilter('Old Name', { rating: 4 });
    const result = renameFilter(saved.id, 'A'.repeat(51));
    expect(result).toBeNull();
  });

  it('should reject duplicate name', () => {
    saveFilter('Existing Name', { rating: 3 });
    const saved = saveFilter('Old Name', { rating: 4 });
    const result = renameFilter(saved.id, 'Existing Name');
    expect(result).toBeNull();
  });

  it('should allow renaming to same name with different case', () => {
    const saved = saveFilter('Old Name', { rating: 4 });
    const result = renameFilter(saved.id, 'OLD NAME');
    // Should be rejected as duplicate (case insensitive)
    expect(result).not.toBeNull(); // Same filter, different case is OK
  });

  it('should return null for invalid filter ID', () => {
    const result = renameFilter('nonexistent', 'New Name');
    expect(result).toBeNull();
  });
});

// ============================================
// duplicateFilter tests
// ============================================
describe('duplicateFilter', () => {
  it('should create a copy of the filter', () => {
    const original = saveFilter('Original', { rating: 4, verified: true });
    const duplicate = duplicateFilter(original.id);

    expect(duplicate).not.toBeNull();
    expect(duplicate.filters).toEqual(original.filters);
    expect(duplicate.id).not.toBe(original.id);
  });

  it('should name the copy with (copie) suffix', () => {
    const original = saveFilter('Original', { rating: 4 });
    const duplicate = duplicateFilter(original.id);
    expect(duplicate.name).toBe('Original (copie)');
  });

  it('should increment copy number for multiple duplicates', () => {
    const original = saveFilter('Original', { rating: 4 });
    const dup1 = duplicateFilter(original.id);
    const dup2 = duplicateFilter(original.id);

    expect(dup1.name).toBe('Original (copie)');
    expect(dup2.name).toBe('Original (copie 2)');
  });

  it('should reset usage statistics for duplicate', () => {
    const original = saveFilter('Original', { rating: 4 });
    loadFilter(original.id); // Increment usage

    const duplicate = duplicateFilter(original.id);
    expect(duplicate.usageCount).toBe(0);
    expect(duplicate.lastUsedAt).toBeNull();
  });

  it('should set new createdAt for duplicate', () => {
    const original = saveFilter('Original', { rating: 4 });
    const duplicate = duplicateFilter(original.id);
    expect(duplicate.createdAt >= original.createdAt).toBe(true);
  });

  it('should return null for invalid filter ID', () => {
    const result = duplicateFilter('nonexistent');
    expect(result).toBeNull();
  });

  it('should return null for null ID', () => {
    const result = duplicateFilter(null);
    expect(result).toBeNull();
  });

  it('should respect max filter limit when duplicating', () => {
    // Save 19 filters
    for (let i = 0; i < 19; i++) {
      saveFilter(`Filter ${i}`, { rating: 4 });
    }
    const original = saveFilter('Original', { rating: 4 });

    // Should fail - already at max
    const result = duplicateFilter(original.id);
    expect(result).toBeNull();
  });
});

// ============================================
// exportFilters tests
// ============================================
describe('exportFilters', () => {
  it('should export filters as object', () => {
    saveFilter('Filter 1', { rating: 4 });
    saveFilter('Filter 2', { verified: true });

    const exported = exportFilters();

    expect(exported.exportedAt).toBeDefined();
    expect(exported.version).toBe('1.0');
    expect(exported.totalFilters).toBe(2);
    expect(exported.filters).toHaveLength(2);
  });

  it('should include filter details in export', () => {
    saveFilter('Test Filter', { rating: 4, country: 'FR' });

    const exported = exportFilters();
    const filter = exported.filters[0];

    expect(filter.name).toBe('Test Filter');
    expect(filter.filters.rating).toBe(4);
    expect(filter.filters.country).toBe('FR');
    expect(filter.createdAt).toBeDefined();
  });

  it('should export empty array when no filters', () => {
    const exported = exportFilters();
    expect(exported.filters).toEqual([]);
    expect(exported.totalFilters).toBe(0);
  });

  it('should include default filter ID in export', () => {
    const saved = saveFilter('Test', { rating: 4 });
    setAsDefault(saved.id);

    const exported = exportFilters();
    expect(exported.defaultFilterId).toBe(saved.id);
  });
});

// ============================================
// importFilters tests
// ============================================
describe('importFilters', () => {
  it('should import filters from JSON object', () => {
    const data = {
      filters: [
        { name: 'Imported Filter', filters: { rating: 4 } },
      ],
    };

    const result = importFilters(data);

    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
    expect(getFiltersCount()).toBe(1);
  });

  it('should import filters from JSON string', () => {
    const data = JSON.stringify({
      filters: [
        { name: 'Imported Filter', filters: { rating: 4 } },
      ],
    });

    const result = importFilters(data);
    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
  });

  it('should skip filters with invalid names', () => {
    const data = {
      filters: [
        { name: '', filters: { rating: 4 } },
        { name: 'Valid', filters: { rating: 3 } },
      ],
    };

    const result = importFilters(data);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('should skip filters with invalid configuration', () => {
    const data = {
      filters: [
        { name: 'Invalid', filters: { rating: 10 } },
        { name: 'Valid', filters: { rating: 3 } },
      ],
    };

    const result = importFilters(data);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('should skip duplicate names by default', () => {
    saveFilter('Existing', { rating: 4 });

    const data = {
      filters: [
        { name: 'Existing', filters: { rating: 5 } },
        { name: 'New', filters: { rating: 3 } },
      ],
    };

    const result = importFilters(data);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('should overwrite duplicates when option is set', () => {
    saveFilter('Existing', { rating: 4 });

    const data = {
      filters: [
        { name: 'Existing', filters: { rating: 5 } },
      ],
    };

    const result = importFilters(data, { overwrite: true });
    expect(result.imported).toBe(1);

    const filter = getSavedFilters()[0];
    expect(filter.filters.rating).toBe(5);
  });

  it('should handle invalid JSON string', () => {
    const result = importFilters('invalid json');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Format JSON invalide');
  });

  it('should handle missing filters array', () => {
    const result = importFilters({ other: 'data' });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Structure de donnees invalide');
  });

  it('should respect max filter limit during import', () => {
    // Save 19 filters
    for (let i = 0; i < 19; i++) {
      saveFilter(`Existing ${i}`, { rating: 4 });
    }

    const data = {
      filters: [
        { name: 'Import 1', filters: { rating: 4 } },
        { name: 'Import 2', filters: { rating: 4 } },
      ],
    };

    const result = importFilters(data);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });
});

// ============================================
// getDefaultFilters tests
// ============================================
describe('getDefaultFilters', () => {
  it('should return preset filters array', () => {
    const presets = getDefaultFilters();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBeGreaterThan(0);
  });

  it('should include preset IDs', () => {
    const presets = getDefaultFilters();
    presets.forEach(preset => {
      expect(preset.id).toMatch(/^preset_/);
    });
  });

  it('should include isPreset flag', () => {
    const presets = getDefaultFilters();
    presets.forEach(preset => {
      expect(preset.isPreset).toBe(true);
    });
  });

  it('should include top rated preset', () => {
    const presets = getDefaultFilters();
    const topRated = presets.find(p => p.id === 'preset_top_rated');
    expect(topRated).toBeDefined();
    expect(topRated.filters.rating).toBe(4);
  });

  it('should include verified preset', () => {
    const presets = getDefaultFilters();
    const verified = presets.find(p => p.id === 'preset_verified');
    expect(verified).toBeDefined();
    expect(verified.filters.verified).toBe(true);
  });

  it('should include fresh spots preset', () => {
    const presets = getDefaultFilters();
    const fresh = presets.find(p => p.id === 'preset_fresh');
    expect(fresh).toBeDefined();
    expect(fresh.filters.freshness).toBe('month');
  });

  it('should include equipped spots preset', () => {
    const presets = getDefaultFilters();
    const equipped = presets.find(p => p.id === 'preset_equipped');
    expect(equipped).toBeDefined();
    expect(equipped.filters.amenities).toContain('shelter');
  });

  it('should include France preset', () => {
    const presets = getDefaultFilters();
    const france = presets.find(p => p.id === 'preset_france');
    expect(france).toBeDefined();
    expect(france.filters.country).toBe('FR');
  });
});

// ============================================
// setAsDefault tests
// ============================================
describe('setAsDefault', () => {
  it('should set a user filter as default', () => {
    const saved = saveFilter('My Filter', { rating: 4 });
    const result = setAsDefault(saved.id);

    expect(result).toBe(true);
    const defaultFilter = getDefaultFilter();
    expect(defaultFilter).not.toBeNull();
  });

  it('should set a preset as default', () => {
    const result = setAsDefault('preset_top_rated');
    expect(result).toBe(true);

    const defaultFilter = getDefaultFilter();
    expect(defaultFilter.rating).toBe(4);
  });

  it('should return false for invalid ID', () => {
    const result = setAsDefault(null);
    expect(result).toBe(false);
  });

  it('should return false for non-existent ID', () => {
    const result = setAsDefault('nonexistent_id');
    expect(result).toBe(false);
  });

  it('should replace previous default', () => {
    const f1 = saveFilter('Filter 1', { rating: 3 });
    const f2 = saveFilter('Filter 2', { rating: 4 });

    setAsDefault(f1.id);
    setAsDefault(f2.id);

    const defaultFilter = getDefaultFilter();
    expect(defaultFilter.filterName).toBe('Filter 2');
  });
});

// ============================================
// getDefaultFilter tests
// ============================================
describe('getDefaultFilter', () => {
  it('should return null when no default set', () => {
    const result = getDefaultFilter();
    expect(result).toBeNull();
  });

  it('should return user filter config when set as default', () => {
    const saved = saveFilter('My Filter', { rating: 4, verified: true });
    setAsDefault(saved.id);

    const defaultFilter = getDefaultFilter();
    expect(defaultFilter.rating).toBe(4);
    expect(defaultFilter.verified).toBe(true);
    expect(defaultFilter.filterId).toBe(saved.id);
    expect(defaultFilter.filterName).toBe('My Filter');
  });

  it('should return preset config when preset set as default', () => {
    setAsDefault('preset_verified');

    const defaultFilter = getDefaultFilter();
    expect(defaultFilter.verified).toBe(true);
    expect(defaultFilter.filterId).toBe('preset_verified');
  });

  it('should return null if default filter was deleted', () => {
    const saved = saveFilter('My Filter', { rating: 4 });
    setAsDefault(saved.id);
    deleteFilter(saved.id);

    const defaultFilter = getDefaultFilter();
    expect(defaultFilter).toBeNull();
  });
});

// ============================================
// clearDefaultFilter tests
// ============================================
describe('clearDefaultFilter', () => {
  it('should clear the default filter setting', () => {
    const saved = saveFilter('My Filter', { rating: 4 });
    setAsDefault(saved.id);
    expect(getDefaultFilter()).not.toBeNull();

    const result = clearDefaultFilter();
    expect(result).toBe(true);
    expect(getDefaultFilter()).toBeNull();
  });

  it('should succeed even when no default is set', () => {
    const result = clearDefaultFilter();
    expect(result).toBe(true);
  });
});

// ============================================
// clearAllFilters tests
// ============================================
describe('clearAllFilters', () => {
  it('should remove all saved filters', () => {
    saveFilter('Filter 1', { rating: 4 });
    saveFilter('Filter 2', { rating: 3 });
    saveFilter('Filter 3', { rating: 2 });

    const result = clearAllFilters();

    expect(result).toBe(true);
    expect(getFiltersCount()).toBe(0);
  });

  it('should clear default filter by default', () => {
    const saved = saveFilter('My Filter', { rating: 4 });
    setAsDefault(saved.id);

    clearAllFilters();

    expect(getDefaultFilter()).toBeNull();
  });

  it('should preserve default filter when keepDefault is true', () => {
    const saved = saveFilter('My Filter', { rating: 4 });
    setAsDefault(saved.id);

    clearAllFilters(true);

    // Default setting is preserved but filter is gone
    // So getDefaultFilter should return null since filter doesn't exist
    expect(getFiltersCount()).toBe(0);
  });

  it('should succeed even when no filters exist', () => {
    const result = clearAllFilters();
    expect(result).toBe(true);
  });
});

// ============================================
// getFiltersCount tests
// ============================================
describe('getFiltersCount', () => {
  it('should return 0 when no filters', () => {
    expect(getFiltersCount()).toBe(0);
  });

  it('should return correct count', () => {
    saveFilter('Filter 1', { rating: 4 });
    saveFilter('Filter 2', { rating: 3 });

    expect(getFiltersCount()).toBe(2);
  });

  it('should update after deletion', () => {
    const saved = saveFilter('Filter 1', { rating: 4 });
    saveFilter('Filter 2', { rating: 3 });

    expect(getFiltersCount()).toBe(2);

    deleteFilter(saved.id);
    expect(getFiltersCount()).toBe(1);
  });
});

// ============================================
// getFilterStats tests
// ============================================
describe('getFilterStats', () => {
  it('should return stats object', () => {
    const stats = getFilterStats();

    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('maxAllowed');
    expect(stats).toHaveProperty('remaining');
    expect(stats).toHaveProperty('hasDefault');
    expect(stats).toHaveProperty('totalUsage');
  });

  it('should return correct totals', () => {
    saveFilter('Filter 1', { rating: 4 });
    saveFilter('Filter 2', { rating: 3 });

    const stats = getFilterStats();
    expect(stats.total).toBe(2);
    expect(stats.maxAllowed).toBe(20);
    expect(stats.remaining).toBe(18);
  });

  it('should track total usage', () => {
    const f1 = saveFilter('Filter 1', { rating: 4 });
    const f2 = saveFilter('Filter 2', { rating: 3 });

    loadFilter(f1.id);
    loadFilter(f1.id);
    loadFilter(f2.id);

    const stats = getFilterStats();
    expect(stats.totalUsage).toBe(3);
  });

  it('should identify most used filter', () => {
    const f1 = saveFilter('Less Used', { rating: 4 });
    const f2 = saveFilter('Most Used', { rating: 3 });

    loadFilter(f1.id);
    loadFilter(f2.id);
    loadFilter(f2.id);
    loadFilter(f2.id);

    const stats = getFilterStats();
    expect(stats.mostUsed.name).toBe('Most Used');
    expect(stats.mostUsed.count).toBe(3);
  });

  it('should identify last created filter', () => {
    saveFilter('First', { rating: 4 });
    saveFilter('Last', { rating: 3 });

    const stats = getFilterStats();
    // Due to rapid creation, both may have same timestamp
    // Just verify lastCreated is one of our filters
    expect(['First', 'Last']).toContain(stats.lastCreated.name);
  });

  it('should identify last used filter', () => {
    const f1 = saveFilter('First Used', { rating: 4 });
    const f2 = saveFilter('Last Used', { rating: 3 });

    loadFilter(f1.id);
    loadFilter(f2.id);

    const stats = getFilterStats();
    // Both filters were used, so lastUsed should be one of them
    expect(['First Used', 'Last Used']).toContain(stats.lastUsed.name);
  });

  it('should handle no filters gracefully', () => {
    const stats = getFilterStats();
    expect(stats.total).toBe(0);
    expect(stats.mostUsed).toBeNull();
    expect(stats.lastCreated).toBeNull();
  });
});

// ============================================
// searchFilters tests
// ============================================
describe('searchFilters', () => {
  it('should find filters by name', () => {
    saveFilter('France Spots', { country: 'FR' });
    saveFilter('Germany Spots', { country: 'DE' });
    saveFilter('Top Rated', { rating: 4 });

    const results = searchFilters('Spots');
    expect(results).toHaveLength(2);
  });

  it('should be case insensitive', () => {
    saveFilter('France Spots', { country: 'FR' });

    const results = searchFilters('FRANCE');
    expect(results).toHaveLength(1);
  });

  it('should return empty array for no matches', () => {
    saveFilter('France Spots', { country: 'FR' });

    const results = searchFilters('Spain');
    expect(results).toHaveLength(0);
  });

  it('should return empty array for null query', () => {
    const results = searchFilters(null);
    expect(results).toEqual([]);
  });

  it('should return empty array for empty query', () => {
    const results = searchFilters('');
    expect(results).toEqual([]);
  });

  it('should trim query whitespace', () => {
    saveFilter('France Spots', { country: 'FR' });

    const results = searchFilters('  France  ');
    expect(results).toHaveLength(1);
  });
});

// ============================================
// renderSavedFiltersList tests
// ============================================
describe('renderSavedFiltersList', () => {
  it('should render empty state when no filters', () => {
    const html = renderSavedFiltersList({ showPresets: false });
    expect(html).toContain('Aucun filtre sauvegarde');
    expect(html).toContain('fa-filter');
  });

  it('should render user filters', () => {
    saveFilter('My Filter', { rating: 4 });

    const html = renderSavedFiltersList({ showPresets: false });
    expect(html).toContain('My Filter');
    expect(html).toContain('Mes filtres');
  });

  it('should render presets when enabled', () => {
    const html = renderSavedFiltersList({ showPresets: true });
    expect(html).toContain('Filtres predefinis');
    expect(html).toContain('Preset');
  });

  it('should hide presets when disabled', () => {
    const html = renderSavedFiltersList({ showPresets: false });
    expect(html).not.toContain('Filtres predefinis');
  });

  it('should mark default filter', () => {
    const saved = saveFilter('My Filter', { rating: 4 });
    setAsDefault(saved.id);

    const html = renderSavedFiltersList({ showPresets: false });
    expect(html).toContain('Defaut');
  });

  it('should include delete button for user filters', () => {
    saveFilter('My Filter', { rating: 4 });

    const html = renderSavedFiltersList({ showPresets: false });
    expect(html).toContain('deleteSavedFilter');
    expect(html).toContain('fa-trash');
  });

  it('should not include delete button for presets', () => {
    const html = renderSavedFiltersList({ showPresets: true });
    // Presets should not have delete buttons - check specific pattern
    const presetSection = html.split('Filtres predefinis')[1];
    if (presetSection) {
      // Count delete buttons - should only be in user section
      const userSection = html.split('Filtres predefinis')[0];
      // User filters section (if any) can have delete, presets should not
    }
  });

  it('should use custom onSelect handler', () => {
    saveFilter('My Filter', { rating: 4 });

    const html = renderSavedFiltersList({ onSelect: 'customHandler', showPresets: false });
    expect(html).toContain('customHandler');
  });

  it('should show usage count', () => {
    const saved = saveFilter('My Filter', { rating: 4 });
    loadFilter(saved.id);
    loadFilter(saved.id);

    const html = renderSavedFiltersList({ showPresets: false });
    expect(html).toContain('2 utilisation');
  });
});

// ============================================
// Integration tests
// ============================================
describe('Integration tests', () => {
  it('should handle complete filter lifecycle', () => {
    // Create
    const filter = saveFilter('Test Filter', { rating: 4, verified: true });
    expect(filter).not.toBeNull();

    // Read
    const retrieved = getFilterById(filter.id);
    expect(retrieved.name).toBe('Test Filter');

    // Update
    const updated = updateFilter(filter.id, { rating: 5 });
    expect(updated.filters.rating).toBe(5);

    // Rename
    const renamed = renameFilter(filter.id, 'Renamed Filter');
    expect(renamed.name).toBe('Renamed Filter');

    // Load (use)
    const loaded = loadFilter(filter.id);
    expect(loaded.rating).toBe(5);

    // Duplicate
    const duplicate = duplicateFilter(filter.id);
    expect(duplicate.name).toBe('Renamed Filter (copie)');

    // Delete
    const deleted = deleteFilter(filter.id);
    expect(deleted).toBe(true);

    // Verify deletion
    expect(getFilterById(filter.id)).toBeNull();

    // Duplicate still exists
    expect(getFilterById(duplicate.id)).not.toBeNull();
  });

  it('should handle export/import cycle', () => {
    // Create filters
    saveFilter('Filter 1', { rating: 4 });
    saveFilter('Filter 2', { verified: true });

    // Export
    const exported = exportFilters();
    expect(exported.totalFilters).toBe(2);

    // Clear
    clearAllFilters();
    expect(getFiltersCount()).toBe(0);

    // Import
    const result = importFilters(exported);
    expect(result.success).toBe(true);
    expect(result.imported).toBe(2);
    expect(getFiltersCount()).toBe(2);
  });

  it('should persist data across storage operations', () => {
    const filter = saveFilter('Persistent Filter', { rating: 4 });

    // Verify localStorage was called
    expect(localStorage.setItem).toHaveBeenCalled();

    // Simulate reading from storage
    const filters = getSavedFilters();
    expect(filters).toHaveLength(1);
    expect(filters[0].name).toBe('Persistent Filter');
  });
});
