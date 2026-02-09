/**
 * Spot Merge Service Tests
 * Feature #86 - Fusion de spots en double
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MergeStatus,
  calculateDistanceMeters,
  calculateNameSimilarity,
  detectDuplicates,
  proposeMerge,
  getPendingMerges,
  getMergeById,
  voteOnMerge,
  approveMerge,
  rejectMerge,
  cancelMerge,
  mergeSpotData,
  executeMerge,
  autoDetectDuplicates,
  getMergeStats,
  getMergeHistory,
  getSpotRedirects,
  resolveSpotId,
  renderMergeCard,
  renderDuplicateCard,
  getPendingMergesFromStorage,
} from '../src/services/spotMerge.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Sample spots for testing
const sampleSpots = [
  {
    id: 1,
    from: 'Paris',
    to: 'Lille',
    description: 'Porte de la Chapelle - Sortir du metro',
    coordinates: { lat: 48.8973, lng: 2.3597 },
    ratings: { accessibility: 3.5, safety: 4.0, visibility: 3.5, traffic: 4.5 },
    globalRating: 3.88,
    totalReviews: 156,
    avgWaitTime: 45,
    checkins: 523,
    verified: true,
    country: 'FR',
    source: 'hitchwiki',
    photoUrl: 'https://example.com/photo1.jpg',
    lastUsed: '2024-12-10',
  },
  {
    id: 2,
    from: 'Paris',
    to: 'Lille',
    description: 'Chapelle - Pres du metro',
    coordinates: { lat: 48.8974, lng: 2.3598 }, // ~15m from spot 1
    ratings: { accessibility: 4.0, safety: 4.5, visibility: 4.0, traffic: 4.0 },
    globalRating: 4.13,
    totalReviews: 50,
    avgWaitTime: 30,
    checkins: 200,
    verified: false,
    country: 'FR',
    source: 'hitchwiki',
    photoUrl: null,
    lastUsed: '2024-12-15',
  },
  {
    id: 3,
    from: 'Lyon',
    to: 'Marseille',
    description: 'Musee des Confluences',
    coordinates: { lat: 45.7326, lng: 4.8189 },
    ratings: { accessibility: 4.2, safety: 4.5, visibility: 4.3, traffic: 4.4 },
    globalRating: 4.35,
    totalReviews: 134,
    avgWaitTime: 20,
    checkins: 445,
    verified: true,
    country: 'FR',
    source: 'hitchwiki',
    photoUrl: 'https://example.com/photo3.jpg',
    lastUsed: '2024-12-13',
  },
  {
    id: 4,
    from: 'Berlin',
    to: 'Prague',
    description: 'Tankstelle Aral sortie sud',
    coordinates: { lat: 52.4234, lng: 13.4567 },
    ratings: { accessibility: 4.5, safety: 4.7, visibility: 4.6, traffic: 4.4 },
    globalRating: 4.55,
    totalReviews: 167,
    avgWaitTime: 20,
    checkins: 456,
    verified: true,
    country: 'DE',
    source: 'hitchwiki',
    photoUrl: 'https://example.com/photo4.jpg',
    lastUsed: '2024-12-14',
  },
  {
    id: 5,
    from: 'Paris',
    to: 'Lille / Bruxelles',
    description: 'Autre spot proche de Chapelle',
    coordinates: { lat: 48.8975, lng: 2.3599 }, // ~25m from spot 1
    ratings: { accessibility: 3.0, safety: 3.5, visibility: 3.0, traffic: 3.5 },
    globalRating: 3.25,
    totalReviews: 20,
    avgWaitTime: 60,
    checkins: 50,
    verified: false,
    country: 'FR',
    source: 'user',
    photoUrl: null,
    lastUsed: '2024-11-01',
  },
];

describe('Spot Merge Service', () => {
  beforeEach(() => {
    resetState();
    setState({
      user: { uid: 'user1' },
      username: 'TestUser',
      spots: [...sampleSpots],
      favorites: [
        { spotId: 1, addedAt: '2024-12-01' },
        { spotId: 3, addedAt: '2024-12-02' },
      ],
    });
    // Clear localStorage
    localStorage.clear();
  });

  // ==================== MergeStatus Enum ====================
  describe('MergeStatus', () => {
    it('should have all required status values', () => {
      expect(MergeStatus.PENDING).toBe('pending');
      expect(MergeStatus.APPROVED).toBe('approved');
      expect(MergeStatus.REJECTED).toBe('rejected');
      expect(MergeStatus.EXECUTED).toBe('executed');
      expect(MergeStatus.CANCELLED).toBe('cancelled');
    });
  });

  // ==================== calculateDistanceMeters ====================
  describe('calculateDistanceMeters', () => {
    it('should calculate distance between two close points', () => {
      const coord1 = { lat: 48.8973, lng: 2.3597 };
      const coord2 = { lat: 48.8974, lng: 2.3598 };
      const distance = calculateDistanceMeters(coord1, coord2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(50); // Should be about 15m
    });

    it('should return small distance for very close points', () => {
      const coord1 = { lat: 48.8973, lng: 2.3597 };
      const coord2 = { lat: 48.8973, lng: 2.3597 };
      const distance = calculateDistanceMeters(coord1, coord2);
      expect(distance).toBe(0);
    });

    it('should return larger distance for far points', () => {
      const paris = { lat: 48.8566, lng: 2.3522 };
      const lyon = { lat: 45.7640, lng: 4.8357 };
      const distance = calculateDistanceMeters(paris, lyon);
      expect(distance).toBeGreaterThan(300000); // About 390km
    });

    it('should return Infinity for invalid coordinates', () => {
      expect(calculateDistanceMeters(null, null)).toBe(Infinity);
      expect(calculateDistanceMeters({}, {})).toBe(Infinity);
      expect(calculateDistanceMeters({ lat: 48.8 }, { lat: 48.9 })).toBe(Infinity);
    });
  });

  // ==================== calculateNameSimilarity ====================
  describe('calculateNameSimilarity', () => {
    it('should return 1 for identical names', () => {
      const similarity = calculateNameSimilarity('Paris Lille', 'Paris Lille');
      expect(similarity).toBe(1);
    });

    it('should return high similarity for similar names', () => {
      const similarity = calculateNameSimilarity('Paris -> Lille', 'Paris to Lille');
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should return 0.9 when one contains the other', () => {
      const similarity = calculateNameSimilarity('Paris Lille', 'Paris Lille Bruxelles');
      expect(similarity).toBe(0.9);
    });

    it('should ignore case and diacritics', () => {
      const similarity = calculateNameSimilarity('PARIS', 'paris');
      expect(similarity).toBe(1);

      const similarity2 = calculateNameSimilarity('Pres', 'pres');
      expect(similarity2).toBe(1);
    });

    it('should return 0 for empty strings', () => {
      expect(calculateNameSimilarity('', 'test')).toBe(0);
      expect(calculateNameSimilarity('test', '')).toBe(0);
      expect(calculateNameSimilarity(null, 'test')).toBe(0);
    });

    it('should return low similarity for different names', () => {
      const similarity = calculateNameSimilarity('Paris Lyon', 'Berlin Prague');
      expect(similarity).toBeLessThan(0.3);
    });
  });

  // ==================== detectDuplicates ====================
  describe('detectDuplicates', () => {
    it('should detect nearby spots with similar names', () => {
      const duplicates = detectDuplicates(1, 50);
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates.some((d) => d.spot.id === 2)).toBe(true);
    });

    it('should include distance in results', () => {
      const duplicates = detectDuplicates(1, 50);
      duplicates.forEach((d) => {
        expect(d.distance).toBeDefined();
        expect(typeof d.distance).toBe('number');
        expect(d.distance).toBeLessThanOrEqual(50);
      });
    });

    it('should include name similarity in results', () => {
      const duplicates = detectDuplicates(1, 50);
      duplicates.forEach((d) => {
        expect(d.nameSimilarity).toBeDefined();
        expect(d.nameSimilarity).toBeGreaterThanOrEqual(0);
        expect(d.nameSimilarity).toBeLessThanOrEqual(1);
      });
    });

    it('should include confidence score in results', () => {
      const duplicates = detectDuplicates(1, 50);
      duplicates.forEach((d) => {
        expect(d.confidenceScore).toBeDefined();
        expect(d.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(d.confidenceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should not detect spots outside radius', () => {
      const duplicates = detectDuplicates(1, 50);
      expect(duplicates.some((d) => d.spot.id === 3)).toBe(false); // Lyon is far from Paris
    });

    it('should return empty array for non-existent spot', () => {
      const duplicates = detectDuplicates(999, 50);
      expect(duplicates).toEqual([]);
    });

    it('should sort by confidence score descending', () => {
      const duplicates = detectDuplicates(1, 100);
      for (let i = 1; i < duplicates.length; i++) {
        expect(duplicates[i - 1].confidenceScore).toBeGreaterThanOrEqual(
          duplicates[i].confidenceScore
        );
      }
    });

    it('should detect multiple duplicates', () => {
      const duplicates = detectDuplicates(1, 100);
      // Spot 2 and 5 are both near spot 1
      expect(duplicates.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== proposeMerge ====================
  describe('proposeMerge', () => {
    it('should create a merge proposal', () => {
      const merge = proposeMerge(1, 2, 'Ces spots sont identiques');
      expect(merge).toBeDefined();
      expect(merge.id).toBeDefined();
      expect(merge.spotId1).toBe('1');
      expect(merge.spotId2).toBe('2');
      expect(merge.status).toBe(MergeStatus.PENDING);
      expect(merge.reason).toBe('Ces spots sont identiques');
    });

    it('should include spot names', () => {
      const merge = proposeMerge(1, 2);
      expect(merge.spot1Name).toContain('Paris');
      expect(merge.spot2Name).toContain('Paris');
    });

    it('should include distance and similarity', () => {
      const merge = proposeMerge(1, 2);
      expect(merge.distance).toBeDefined();
      expect(merge.nameSimilarity).toBeDefined();
    });

    it('should return null for non-existent spots', () => {
      const merge = proposeMerge(1, 999);
      expect(merge).toBeNull();
    });

    it('should return null when merging spot with itself', () => {
      const merge = proposeMerge(1, 1);
      expect(merge).toBeNull();
    });

    it('should return existing merge if already proposed', () => {
      const merge1 = proposeMerge(1, 2);
      const merge2 = proposeMerge(1, 2);
      expect(merge2.id).toBe(merge1.id);
    });

    it('should store merge in localStorage', () => {
      proposeMerge(1, 2);
      const stored = getPendingMergesFromStorage();
      expect(stored.length).toBeGreaterThan(0);
    });
  });

  // ==================== getPendingMerges ====================
  describe('getPendingMerges', () => {
    it('should return only pending merges', () => {
      proposeMerge(1, 2);
      const pending = getPendingMerges();
      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe(MergeStatus.PENDING);
    });

    it('should return empty array when no pending merges', () => {
      const pending = getPendingMerges();
      expect(pending).toEqual([]);
    });

    it('should not include approved merges', () => {
      const merge = proposeMerge(1, 2);
      approveMerge(merge.id);
      const pending = getPendingMerges();
      expect(pending.length).toBe(0);
    });
  });

  // ==================== getMergeById ====================
  describe('getMergeById', () => {
    it('should return merge by ID', () => {
      const created = proposeMerge(1, 2);
      const found = getMergeById(created.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should return null for non-existent ID', () => {
      const found = getMergeById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  // ==================== voteOnMerge ====================
  describe('voteOnMerge', () => {
    it('should record approve vote', () => {
      const merge = proposeMerge(1, 2);
      const updated = voteOnMerge(merge.id, 'approve');
      expect(updated.votes.approve.length).toBe(1);
    });

    it('should record reject vote', () => {
      const merge = proposeMerge(1, 2);
      const updated = voteOnMerge(merge.id, 'reject');
      expect(updated.votes.reject.length).toBe(1);
    });

    it('should replace previous vote from same user', () => {
      const merge = proposeMerge(1, 2);
      voteOnMerge(merge.id, 'approve');
      const updated = voteOnMerge(merge.id, 'reject');
      expect(updated.votes.approve.length).toBe(0);
      expect(updated.votes.reject.length).toBe(1);
    });

    it('should return null for invalid vote type', () => {
      const merge = proposeMerge(1, 2);
      const result = voteOnMerge(merge.id, 'invalid');
      expect(result).toBeNull();
    });

    it('should return null for non-existent merge', () => {
      const result = voteOnMerge('non-existent', 'approve');
      expect(result).toBeNull();
    });
  });

  // ==================== approveMerge ====================
  describe('approveMerge', () => {
    it('should approve a pending merge', () => {
      const merge = proposeMerge(1, 2);
      const approved = approveMerge(merge.id);
      expect(approved.status).toBe(MergeStatus.APPROVED);
      expect(approved.approvedAt).toBeDefined();
    });

    it('should return null for non-existent merge', () => {
      const result = approveMerge('non-existent');
      expect(result).toBeNull();
    });

    it('should not approve already approved merge', () => {
      const merge = proposeMerge(1, 2);
      approveMerge(merge.id);
      const result = approveMerge(merge.id);
      expect(result.status).toBe(MergeStatus.APPROVED);
    });
  });

  // ==================== rejectMerge ====================
  describe('rejectMerge', () => {
    it('should reject a pending merge', () => {
      const merge = proposeMerge(1, 2);
      const rejected = rejectMerge(merge.id, 'Ces spots sont differents');
      expect(rejected.status).toBe(MergeStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Ces spots sont differents');
    });

    it('should return null for non-existent merge', () => {
      const result = rejectMerge('non-existent');
      expect(result).toBeNull();
    });
  });

  // ==================== cancelMerge ====================
  describe('cancelMerge', () => {
    it('should cancel a merge by proposer', () => {
      const merge = proposeMerge(1, 2);
      const success = cancelMerge(merge.id);
      expect(success).toBe(true);

      const found = getMergeById(merge.id);
      expect(found.status).toBe(MergeStatus.CANCELLED);
    });

    it('should return false for non-existent merge', () => {
      const success = cancelMerge('non-existent');
      expect(success).toBe(false);
    });

    it('should not cancel already approved merge', () => {
      const merge = proposeMerge(1, 2);
      approveMerge(merge.id);
      const success = cancelMerge(merge.id);
      expect(success).toBe(false);
    });
  });

  // ==================== mergeSpotData ====================
  describe('mergeSpotData', () => {
    it('should merge spot data keeping best values', () => {
      const spot1 = sampleSpots[0];
      const spot2 = sampleSpots[1];
      const merged = mergeSpotData(spot1, spot2);

      expect(merged.id).toBe(spot1.id);
      expect(merged.totalReviews).toBe(spot1.totalReviews + spot2.totalReviews);
      expect(merged.checkins).toBe(spot1.checkins + spot2.checkins);
    });

    it('should keep verified coordinates if available', () => {
      const spot1 = sampleSpots[0]; // verified
      const spot2 = sampleSpots[1]; // not verified
      const merged = mergeSpotData(spot1, spot2);
      expect(merged.coordinates).toEqual(spot1.coordinates);
    });

    it('should average ratings weighted by reviews', () => {
      const spot1 = sampleSpots[0];
      const spot2 = sampleSpots[1];
      const merged = mergeSpotData(spot1, spot2);

      expect(merged.ratings.accessibility).toBeGreaterThan(0);
      expect(merged.ratings.safety).toBeGreaterThan(0);
    });

    it('should keep longer description', () => {
      const spot1 = sampleSpots[0];
      const spot2 = sampleSpots[1];
      const merged = mergeSpotData(spot1, spot2);

      const longerDesc =
        spot1.description.length >= spot2.description.length
          ? spot1.description
          : spot2.description;
      expect(merged.description).toBe(longerDesc);
    });

    it('should use most recent lastUsed date', () => {
      const spot1 = sampleSpots[0];
      const spot2 = sampleSpots[1];
      const merged = mergeSpotData(spot1, spot2);
      expect(merged.lastUsed).toBe('2024-12-15'); // spot2 is more recent
    });

    it('should keep valid photo URL', () => {
      const spot1 = sampleSpots[0];
      const spot2 = sampleSpots[1]; // has null photoUrl
      const merged = mergeSpotData(spot1, spot2);
      expect(merged.photoUrl).toBe(spot1.photoUrl);
    });

    it('should set verified to true if either is verified', () => {
      const spot1 = sampleSpots[0]; // verified
      const spot2 = sampleSpots[1]; // not verified
      const merged = mergeSpotData(spot1, spot2);
      expect(merged.verified).toBe(true);
    });

    it('should add mergedFrom metadata', () => {
      const spot1 = sampleSpots[0];
      const spot2 = sampleSpots[1];
      const merged = mergeSpotData(spot1, spot2);
      expect(merged.mergedFrom).toContain(spot2.id);
      expect(merged.mergedAt).toBeDefined();
    });
  });

  // ==================== executeMerge ====================
  describe('executeMerge', () => {
    it('should merge spots and update state', () => {
      const merged = executeMerge(1, 2);
      expect(merged).toBeDefined();

      const state = getState();
      expect(state.spots.length).toBe(4); // 5 - 1 merged
    });

    it('should redirect favorites', () => {
      // First add spot 2 to favorites
      const state = getState();
      setState({
        favorites: [...state.favorites, { spotId: 2, addedAt: '2024-12-05' }],
      });

      executeMerge(1, 2);

      const newState = getState();
      const favIds = newState.favorites.map((f) => f.spotId);
      expect(favIds).not.toContain(2);
      expect(favIds).toContain(1);
    });

    it('should remove duplicate favorites', () => {
      // User has both spots as favorites
      setState({
        favorites: [
          { spotId: 1, addedAt: '2024-12-01' },
          { spotId: 2, addedAt: '2024-12-02' },
        ],
      });

      executeMerge(1, 2);

      const state = getState();
      const spot1Favs = state.favorites.filter((f) => String(f.spotId) === '1');
      expect(spot1Favs.length).toBe(1); // Only one entry for spot 1
    });

    it('should add redirect for merged spot', () => {
      executeMerge(1, 2);
      const redirects = getSpotRedirects();
      expect(redirects['2']).toBe('1');
    });

    it('should return null for non-existent spots', () => {
      const result = executeMerge(1, 999);
      expect(result).toBeNull();
    });

    it('should add to merge history', () => {
      executeMerge(1, 2);
      const history = getMergeHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  // ==================== resolveSpotId ====================
  describe('resolveSpotId', () => {
    it('should resolve redirected spot ID', () => {
      executeMerge(1, 2);
      const resolved = resolveSpotId(2);
      expect(resolved).toBe('1');
    });

    it('should return same ID if no redirect', () => {
      const resolved = resolveSpotId(3);
      expect(resolved).toBe('3');
    });

    it('should follow redirect chains', () => {
      // Merge 2 into 1, then merge 5 into 1
      executeMerge(1, 2);
      executeMerge(1, 5);

      expect(resolveSpotId(2)).toBe('1');
      expect(resolveSpotId(5)).toBe('1');
    });
  });

  // ==================== autoDetectDuplicates ====================
  describe('autoDetectDuplicates', () => {
    it('should detect potential duplicates', () => {
      const detected = autoDetectDuplicates(50, 50);
      expect(detected.length).toBeGreaterThan(0);
    });

    it('should include primary and duplicate spot info', () => {
      const detected = autoDetectDuplicates(50, 50);
      if (detected.length > 0) {
        expect(detected[0].primarySpot).toBeDefined();
        expect(detected[0].duplicateSpot).toBeDefined();
        expect(detected[0].confidenceScore).toBeDefined();
      }
    });

    it('should filter by minimum confidence', () => {
      const detected = autoDetectDuplicates(50, 90);
      detected.forEach((d) => {
        expect(d.confidenceScore).toBeGreaterThanOrEqual(90);
      });
    });

    it('should not return same pair twice', () => {
      const detected = autoDetectDuplicates(100, 50);
      const pairs = detected.map((d) =>
        [d.primarySpot.id, d.duplicateSpot.id].sort().join('-')
      );
      const uniquePairs = [...new Set(pairs)];
      expect(pairs.length).toBe(uniquePairs.length);
    });
  });

  // ==================== getMergeStats ====================
  describe('getMergeStats', () => {
    it('should return correct statistics', () => {
      // Create some merges with different statuses
      const merge1 = proposeMerge(1, 2);
      proposeMerge(1, 5);
      approveMerge(merge1.id);

      const stats = getMergeStats();
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.totalProposed).toBe(2);
    });

    it('should count executed merges from history', () => {
      executeMerge(1, 2);
      const stats = getMergeStats();
      expect(stats.executed).toBe(1);
    });
  });

  // ==================== renderMergeCard ====================
  describe('renderMergeCard', () => {
    it('should render merge card HTML', () => {
      const merge = proposeMerge(1, 2);
      const html = renderMergeCard(merge);
      expect(html).toContain('merge-card');
      expect(html).toContain(merge.id);
    });

    it('should include spot names', () => {
      const merge = proposeMerge(1, 2);
      const html = renderMergeCard(merge);
      expect(html).toContain('Paris');
    });

    it('should show status badge', () => {
      const merge = proposeMerge(1, 2);
      const html = renderMergeCard(merge);
      expect(html).toContain('En attente');
    });

    it('should show action buttons for pending merge', () => {
      const merge = proposeMerge(1, 2);
      const html = renderMergeCard(merge);
      expect(html).toContain('Approuver');
      expect(html).toContain('Rejeter');
    });

    it('should not show action buttons for approved merge', () => {
      const merge = proposeMerge(1, 2);
      approveMerge(merge.id);
      const found = getMergeById(merge.id);
      const html = renderMergeCard(found);
      expect(html).not.toContain('Approuver');
    });

    it('should return empty string for null merge', () => {
      const html = renderMergeCard(null);
      expect(html).toBe('');
    });
  });

  // ==================== renderDuplicateCard ====================
  describe('renderDuplicateCard', () => {
    it('should render duplicate card HTML', () => {
      const duplicates = detectDuplicates(1, 50);
      if (duplicates.length > 0) {
        const html = renderDuplicateCard(duplicates[0], sampleSpots[0]);
        expect(html).toContain('duplicate-card');
        expect(html).toContain(duplicates[0].spot.id.toString());
      }
    });

    it('should show confidence score', () => {
      const duplicates = detectDuplicates(1, 50);
      if (duplicates.length > 0) {
        const html = renderDuplicateCard(duplicates[0], sampleSpots[0]);
        expect(html).toContain('confiance');
      }
    });

    it('should show propose fusion button', () => {
      const duplicates = detectDuplicates(1, 50);
      if (duplicates.length > 0) {
        const html = renderDuplicateCard(duplicates[0], sampleSpots[0]);
        expect(html).toContain('Proposer fusion');
      }
    });

    it('should return empty string for null inputs', () => {
      expect(renderDuplicateCard(null, sampleSpots[0])).toBe('');
      expect(renderDuplicateCard({}, null)).toBe('');
    });
  });

  // ==================== Integration Tests ====================
  describe('Integration Tests', () => {
    it('should complete full merge workflow', () => {
      // 1. Detect duplicates
      const duplicates = detectDuplicates(1, 50);
      expect(duplicates.length).toBeGreaterThan(0);

      // 2. Propose merge
      const merge = proposeMerge(1, duplicates[0].spot.id);
      expect(merge).toBeDefined();
      expect(merge.status).toBe(MergeStatus.PENDING);

      // 3. Approve merge
      const approved = approveMerge(merge.id);
      expect(approved.status).toBe(MergeStatus.APPROVED);

      // 4. Execute merge
      const merged = executeMerge(1, duplicates[0].spot.id, merge.id);
      expect(merged).toBeDefined();

      // 5. Verify spot was removed
      const state = getState();
      expect(state.spots.find((s) => s.id === duplicates[0].spot.id)).toBeUndefined();

      // 6. Verify redirect exists
      const resolved = resolveSpotId(duplicates[0].spot.id);
      expect(resolved).toBe('1');
    });

    it('should handle mass duplicate detection', () => {
      // Add more similar spots
      const moreSpotsState = getState();
      setState({
        spots: [
          ...moreSpotsState.spots,
          {
            id: 6,
            from: 'Paris',
            to: 'Lille',
            coordinates: { lat: 48.8976, lng: 2.3600 },
            ratings: { accessibility: 4, safety: 4, visibility: 4, traffic: 4 },
            globalRating: 4,
            totalReviews: 10,
            checkins: 100,
            country: 'FR',
          },
        ],
      });

      const detected = autoDetectDuplicates(100, 60);
      expect(detected.length).toBeGreaterThanOrEqual(1);
    });

    it('should preserve data integrity after multiple merges', () => {
      const initialCheckins =
        sampleSpots[0].checkins + sampleSpots[1].checkins + sampleSpots[4].checkins;

      // Merge spot 2 into 1
      executeMerge(1, 2);

      // Merge spot 5 into 1
      executeMerge(1, 5);

      const state = getState();
      const spot1 = state.spots.find((s) => s.id === 1);

      expect(spot1.checkins).toBe(initialCheckins);
    });
  });
});
