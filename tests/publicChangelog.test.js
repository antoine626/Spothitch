/**
 * Public Changelog Service Tests
 * Tests for changelog management, read status tracking, and rendering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CHANGE_TYPES,
  CHANGELOG_ENTRIES,
  getChangelog,
  getChangelogByVersion,
  getLatestVersion,
  getReadVersions,
  isVersionRead,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  hasUnreadVersions,
  getUnreadEntries,
  clearReadStatus,
  getChangesByType,
  getChangeTypes,
  formatChangelogDate,
  renderChangelogEntry,
  renderChangelog,
  renderChangelogWidget,
  compareVersions,
  getEntriesBetweenVersions,
} from '../src/services/publicChangelog.js';

// Mock showToast
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock getState
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({ lang: 'fr' })),
}));

describe('Public Changelog Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('CHANGE_TYPES', () => {
    it('should have all required change types', () => {
      expect(CHANGE_TYPES).toHaveProperty('feature');
      expect(CHANGE_TYPES).toHaveProperty('fix');
      expect(CHANGE_TYPES).toHaveProperty('improvement');
      expect(CHANGE_TYPES).toHaveProperty('security');
      expect(CHANGE_TYPES).toHaveProperty('performance');
      expect(CHANGE_TYPES).toHaveProperty('breaking');
    });

    it('should have consistent structure for each type', () => {
      Object.values(CHANGE_TYPES).forEach(type => {
        expect(type).toHaveProperty('id');
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('labelEn');
        expect(type).toHaveProperty('icon');
        expect(type).toHaveProperty('color');
        expect(type).toHaveProperty('bgClass');
        expect(type).toHaveProperty('textClass');
      });
    });

    it('should have unique icons for each type', () => {
      const icons = Object.values(CHANGE_TYPES).map(t => t.icon);
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(icons.length);
    });
  });

  describe('CHANGELOG_ENTRIES', () => {
    it('should be an array with entries', () => {
      expect(Array.isArray(CHANGELOG_ENTRIES)).toBe(true);
      expect(CHANGELOG_ENTRIES.length).toBeGreaterThan(0);
    });

    it('should have required fields in each entry', () => {
      CHANGELOG_ENTRIES.forEach(entry => {
        expect(entry).toHaveProperty('version');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('changes');
        expect(Array.isArray(entry.changes)).toBe(true);
      });
    });

    it('should have valid change types in entries', () => {
      const validTypes = Object.keys(CHANGE_TYPES);
      CHANGELOG_ENTRIES.forEach(entry => {
        entry.changes.forEach(change => {
          expect(validTypes).toContain(change.type);
        });
      });
    });

    it('should be sorted by date descending (newest first)', () => {
      for (let i = 0; i < CHANGELOG_ENTRIES.length - 1; i++) {
        const current = new Date(CHANGELOG_ENTRIES[i].date);
        const next = new Date(CHANGELOG_ENTRIES[i + 1].date);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });

  describe('getChangelog', () => {
    it('should return all changelog entries', () => {
      const result = getChangelog();
      expect(result.length).toBe(CHANGELOG_ENTRIES.length);
    });

    it('should return a copy, not the original array', () => {
      const result = getChangelog();
      expect(result).not.toBe(CHANGELOG_ENTRIES);
      expect(result).toEqual(CHANGELOG_ENTRIES);
    });
  });

  describe('getChangelogByVersion', () => {
    it('should return entry for existing version', () => {
      const version = CHANGELOG_ENTRIES[0].version;
      const result = getChangelogByVersion(version);
      expect(result).not.toBeNull();
      expect(result.version).toBe(version);
    });

    it('should return null for non-existing version', () => {
      const result = getChangelogByVersion('99.99.99');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = getChangelogByVersion(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = getChangelogByVersion(undefined);
      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const result = getChangelogByVersion(123);
      expect(result).toBeNull();
    });
  });

  describe('getLatestVersion', () => {
    it('should return the first entry (newest)', () => {
      const result = getLatestVersion();
      expect(result).toBe(CHANGELOG_ENTRIES[0]);
    });

    it('should return object with version property', () => {
      const result = getLatestVersion();
      expect(result).toHaveProperty('version');
    });
  });

  describe('getReadVersions', () => {
    it('should return empty array when nothing saved', () => {
      const result = getReadVersions();
      expect(result).toEqual([]);
    });

    it('should return saved versions', () => {
      localStorage.setItem('spothitch_changelog_read', JSON.stringify(['2.0.0', '2.1.0']));
      const result = getReadVersions();
      expect(result).toEqual(['2.0.0', '2.1.0']);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('spothitch_changelog_read', 'not-json');
      const result = getReadVersions();
      expect(result).toEqual([]);
    });
  });

  describe('isVersionRead', () => {
    it('should return false for unread version', () => {
      const result = isVersionRead('2.0.0');
      expect(result).toBe(false);
    });

    it('should return true for read version', () => {
      localStorage.setItem('spothitch_changelog_read', JSON.stringify(['2.0.0']));
      const result = isVersionRead('2.0.0');
      expect(result).toBe(true);
    });

    it('should return false for null input', () => {
      const result = isVersionRead(null);
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = isVersionRead('');
      expect(result).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark version as read', () => {
      const version = CHANGELOG_ENTRIES[0].version;
      const result = markAsRead(version);
      expect(result).toBe(true);
      // Verify it was saved
      const saved = localStorage.getItem('spothitch_changelog_read');
      expect(saved).toContain(version);
    });

    it('should return false for invalid version', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = markAsRead(null);
      expect(result).toBe(false);
      warnSpy.mockRestore();
    });

    it('should return false for non-string version', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = markAsRead(123);
      expect(result).toBe(false);
      warnSpy.mockRestore();
    });

    it('should return false for non-existing version', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation();
      const result = markAsRead('99.99.99');
      expect(result).toBe(false);
      warnSpy.mockRestore();
    });

    it('should not duplicate already read versions', () => {
      const version = CHANGELOG_ENTRIES[0].version;
      localStorage.setItem('spothitch_changelog_read', JSON.stringify([version]));
      markAsRead(version);
      // Should still only have one entry
      const saved = JSON.parse(localStorage.getItem('spothitch_changelog_read'));
      expect(saved.filter(v => v === version).length).toBe(1);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all versions as read', () => {
      const result = markAllAsRead();
      expect(result).toBe(true);
    });

    it('should save all version strings', () => {
      markAllAsRead();
      const saved = JSON.parse(localStorage.getItem('spothitch_changelog_read'));
      expect(saved.length).toBe(CHANGELOG_ENTRIES.length);
    });
  });

  describe('getUnreadCount', () => {
    it('should return total count when nothing read', () => {
      const result = getUnreadCount();
      expect(result).toBe(CHANGELOG_ENTRIES.length);
    });

    it('should return correct count after marking some as read', () => {
      const versions = CHANGELOG_ENTRIES.slice(0, 2).map(e => e.version);
      localStorage.setItem('spothitch_changelog_read', JSON.stringify(versions));
      const result = getUnreadCount();
      expect(result).toBe(CHANGELOG_ENTRIES.length - 2);
    });

    it('should return 0 when all read', () => {
      const allVersions = CHANGELOG_ENTRIES.map(e => e.version);
      localStorage.setItem('spothitch_changelog_read', JSON.stringify(allVersions));
      const result = getUnreadCount();
      expect(result).toBe(0);
    });
  });

  describe('hasUnreadVersions', () => {
    it('should return true when has unread versions', () => {
      const result = hasUnreadVersions();
      expect(result).toBe(true);
    });

    it('should return false when all read', () => {
      const allVersions = CHANGELOG_ENTRIES.map(e => e.version);
      localStorage.setItem('spothitch_changelog_read', JSON.stringify(allVersions));
      const result = hasUnreadVersions();
      expect(result).toBe(false);
    });
  });

  describe('getUnreadEntries', () => {
    it('should return all entries when nothing read', () => {
      const result = getUnreadEntries();
      expect(result.length).toBe(CHANGELOG_ENTRIES.length);
    });

    it('should return only unread entries', () => {
      const versions = [CHANGELOG_ENTRIES[0].version];
      localStorage.setItem('spothitch_changelog_read', JSON.stringify(versions));
      const result = getUnreadEntries();
      expect(result.length).toBe(CHANGELOG_ENTRIES.length - 1);
      expect(result.every(e => e.version !== CHANGELOG_ENTRIES[0].version)).toBe(true);
    });
  });

  describe('clearReadStatus', () => {
    it('should remove read status from storage', () => {
      localStorage.setItem('spothitch_changelog_read', JSON.stringify(['2.0.0']));
      clearReadStatus();
      expect(localStorage.getItem('spothitch_changelog_read')).toBeNull();
    });
  });

  describe('getChangesByType', () => {
    it('should return changes for valid type', () => {
      const result = getChangesByType('feature');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(change => {
        expect(change.type).toBe('feature');
        expect(change).toHaveProperty('version');
        expect(change).toHaveProperty('date');
      });
    });

    it('should return empty array for invalid type', () => {
      const result = getChangesByType('invalid');
      expect(result).toEqual([]);
    });

    it('should return empty array for null type', () => {
      const result = getChangesByType(null);
      expect(result).toEqual([]);
    });

    it('should include version and date in results', () => {
      const result = getChangesByType('improvement');
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('version');
        expect(result[0]).toHaveProperty('date');
        expect(result[0]).toHaveProperty('description');
      }
    });
  });

  describe('getChangeTypes', () => {
    it('should return all change types', () => {
      const result = getChangeTypes();
      expect(Object.keys(result).length).toBe(Object.keys(CHANGE_TYPES).length);
    });

    it('should return a copy, not the original', () => {
      const result = getChangeTypes();
      expect(result).not.toBe(CHANGE_TYPES);
    });
  });

  describe('formatChangelogDate', () => {
    it('should format date in French by default', () => {
      const result = formatChangelogDate('2026-02-06');
      expect(result).toContain('2026');
      // Should contain French month name
      expect(result.toLowerCase()).toMatch(/janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre/i);
    });

    it('should format date in English when specified', () => {
      const result = formatChangelogDate('2026-02-06', 'en');
      expect(result).toContain('2026');
      expect(result.toLowerCase()).toMatch(/january|february|march|april|may|june|july|august|september|october|november|december/i);
    });

    it('should return original string for invalid date', () => {
      const result = formatChangelogDate('not-a-date');
      expect(typeof result).toBe('string');
    });
  });

  describe('renderChangelogEntry', () => {
    it('should render HTML for valid entry', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const result = renderChangelogEntry(entry);
      expect(result).toContain('changelog-entry');
      expect(result).toContain(entry.version);
    });

    it('should include new badge for unread entries', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const result = renderChangelogEntry(entry, { showBadge: true });
      expect(result).toContain('badge-new');
      expect(result).toContain('Nouveau');
    });

    it('should not show badge when showBadge is false', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const result = renderChangelogEntry(entry, { showBadge: false });
      expect(result).not.toContain('badge-new');
    });

    it('should return empty string for null entry', () => {
      const result = renderChangelogEntry(null);
      expect(result).toBe('');
    });

    it('should return empty string for entry without version', () => {
      const result = renderChangelogEntry({ title: 'Test' });
      expect(result).toBe('');
    });

    it('should include change type icons', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const result = renderChangelogEntry(entry);
      // Should contain at least one type icon
      const hasTypeIcon = Object.values(CHANGE_TYPES).some(type => result.includes(type.icon));
      expect(hasTypeIcon).toBe(true);
    });

    it('should include aria labels for accessibility', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const result = renderChangelogEntry(entry);
      expect(result).toContain('aria-label');
      expect(result).toContain('role="article"');
    });

    it('should render breaking changes section when present', () => {
      const entryWithBreaking = CHANGELOG_ENTRIES.find(e => e.breakingChanges && e.breakingChanges.length > 0);
      if (entryWithBreaking) {
        const result = renderChangelogEntry(entryWithBreaking);
        expect(result).toContain('Changements majeurs');
        expect(result).toContain('border-orange');
      }
    });

    it('should respect expanded option', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const collapsed = renderChangelogEntry(entry, { expanded: false });
      const expanded = renderChangelogEntry(entry, { expanded: true });
      expect(expanded.length).toBeGreaterThan(collapsed.length);
    });
  });

  describe('renderChangelog', () => {
    it('should render full changelog HTML', () => {
      const result = renderChangelog();
      expect(result).toContain('changelog-container');
      expect(result).toContain('Historique des versions');
    });

    it('should include header by default', () => {
      const result = renderChangelog();
      expect(result).toContain('Historique des versions');
    });

    it('should hide header when showHeader is false', () => {
      const result = renderChangelog({ showHeader: false });
      // The main changelog header with "Mark all as read" should not be present
      expect(result).not.toContain('markAllChangelogRead');
      expect(result).not.toContain('Tout marquer comme lu');
    });

    it('should limit entries when limit is specified', () => {
      const fullResult = renderChangelog();
      const limitedResult = renderChangelog({ limit: 2 });
      expect(limitedResult.length).toBeLessThan(fullResult.length);
    });

    it('should show mark all read button when unread', () => {
      const result = renderChangelog({ showMarkAllRead: true });
      expect(result).toContain('markAllChangelogRead');
    });

    it('should filter by type when filterType specified', () => {
      const result = renderChangelog({ filterType: 'feature' });
      expect(result).toContain('changelog-entry');
    });

    it('should include unread count in header', () => {
      const result = renderChangelog();
      const unreadCount = getUnreadCount();
      if (unreadCount > 0) {
        expect(result).toContain('nouveau');
      }
    });

    it('should render in English when lang is en', () => {
      const result = renderChangelog({ lang: 'en' });
      expect(result).toContain('Changelog');
    });
  });

  describe('renderChangelogWidget', () => {
    it('should render compact widget HTML', () => {
      const result = renderChangelogWidget();
      expect(result).toContain('changelog-widget');
      expect(result).toContain('Mises a jour recentes');
    });

    it('should limit entries by maxEntries', () => {
      const result = renderChangelogWidget({ maxEntries: 2 });
      const versionMatches = result.match(/v\d+\.\d+\.\d+/g);
      expect(versionMatches.length).toBeLessThanOrEqual(2);
    });

    it('should include view all button', () => {
      const result = renderChangelogWidget();
      expect(result).toContain('Voir tout');
    });

    it('should show unread indicator when has unread', () => {
      const result = renderChangelogWidget();
      expect(result).toContain('animate-pulse');
    });

    it('should render in English when lang is en', () => {
      const result = renderChangelogWidget({ lang: 'en' });
      expect(result).toContain('Recent Updates');
      expect(result).toContain('View all');
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should return -1 when first is smaller', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should return 1 when first is larger', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    });

    it('should compare minor versions correctly', () => {
      expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
      expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
    });

    it('should compare patch versions correctly', () => {
      expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
      expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
    });

    it('should handle versions with different lengths', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    });

    it('should return 0 for null inputs', () => {
      expect(compareVersions(null, '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0', null)).toBe(0);
    });
  });

  describe('getEntriesBetweenVersions', () => {
    it('should return entries between versions', () => {
      // Get entries between 2.0.0 (exclusive) and 2.5.0 (exclusive)
      const result = getEntriesBetweenVersions('2.5.0', '2.0.0');
      result.forEach(entry => {
        expect(compareVersions(entry.version, '2.5.0')).toBe(-1);
        expect(compareVersions(entry.version, '2.0.0')).toBe(1);
      });
    });

    it('should return empty array for null inputs', () => {
      expect(getEntriesBetweenVersions(null, '2.0.0')).toEqual([]);
      expect(getEntriesBetweenVersions('2.0.0', null)).toEqual([]);
    });

    it('should return empty array when no entries between', () => {
      const result = getEntriesBetweenVersions('1.0.0', '0.9.0');
      expect(result.length).toBe(0);
    });
  });

  describe('Integration tests', () => {
    it('should track read status correctly through workflow', () => {
      // Start with all unread
      expect(getUnreadCount()).toBe(CHANGELOG_ENTRIES.length);

      // Mark one as read
      const version = CHANGELOG_ENTRIES[0].version;
      markAsRead(version);

      // Verify read tracking works
      expect(isVersionRead(version)).toBe(true);
      expect(getUnreadCount()).toBe(CHANGELOG_ENTRIES.length - 1);
    });

    it('should render correctly after marking all as read', () => {
      markAllAsRead();

      const result = renderChangelog();
      // Should not have "new" badges
      expect(result).not.toContain('badge-new');
    });

    it('should filter changes correctly across all entries', () => {
      const features = getChangesByType('feature');
      const fixes = getChangesByType('fix');
      const improvements = getChangesByType('improvement');

      // At least some entries should have features
      expect(features.length).toBeGreaterThan(0);

      // All returned items should be of correct type
      features.forEach(f => expect(f.type).toBe('feature'));
      fixes.forEach(f => expect(f.type).toBe('fix'));
      improvements.forEach(f => expect(f.type).toBe('improvement'));
    });
  });

  describe('Accessibility', () => {
    it('should include proper ARIA attributes in entry', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const result = renderChangelogEntry(entry);

      expect(result).toContain('role="article"');
      expect(result).toContain('aria-label');
      expect(result).toContain('role="list"');
    });

    it('should include proper ARIA attributes in changelog', () => {
      const result = renderChangelog();

      expect(result).toContain('role="region"');
      expect(result).toContain('aria-label');
    });

    it('should include proper ARIA attributes in widget', () => {
      const result = renderChangelogWidget();

      expect(result).toContain('role="complementary"');
      expect(result).toContain('aria-label');
    });

    it('should use semantic HTML elements', () => {
      const result = renderChangelog();

      expect(result).toContain('<article');
      expect(result).toContain('<header');
      expect(result).toContain('<time');
    });
  });

  describe('Multilingual support', () => {
    it('should support French titles', () => {
      const result = renderChangelog({ lang: 'fr' });
      expect(result).toContain('Historique des versions');
    });

    it('should support English titles', () => {
      const result = renderChangelog({ lang: 'en' });
      expect(result).toContain('Changelog');
    });

    it('should format dates according to language', () => {
      const frDate = formatChangelogDate('2026-02-06', 'fr');
      const enDate = formatChangelogDate('2026-02-06', 'en');

      // French and English formats should be different
      expect(frDate).not.toBe(enDate);
    });

    it('should use English descriptions when available', () => {
      const entry = CHANGELOG_ENTRIES[0];
      const result = renderChangelogEntry(entry, { lang: 'en' });

      // Should contain English title if available
      if (entry.titleEn) {
        expect(result).toContain(entry.titleEn);
      }
    });
  });
});
