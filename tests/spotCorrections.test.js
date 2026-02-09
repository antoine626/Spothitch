/**
 * Spot Corrections Service Tests
 * Feature #85 - Proposer une correction de spot
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Constants
  VOTES_REQUIRED_TO_APPROVE,
  VOTES_REQUIRED_TO_REJECT,
  CORRECTION_EXPIRY_DAYS,
  CORRECTION_EXPIRY_MS,
  POINTS_FOR_APPROVED_CORRECTION,
  POINTS_FOR_VOTING,
  CorrectionStatus,
  EditableFields,
  // Field functions
  getEditableFields,
  getEditableFieldById,
  validateFieldValue,
  // Core functions
  proposeCorrection,
  getPendingCorrections,
  getAllPendingCorrections,
  getCorrectionById,
  approveCorrection,
  rejectCorrection,
  getMyCorrections,
  // Voting
  voteOnCorrection,
  hasVotedOnCorrection,
  // Other actions
  cancelCorrection,
  processExpiredCorrections,
  // Stats and queries
  getCorrectionStats,
  getCorrectionsByField,
  getApprovedCorrectionsHistory,
  getStatusLabel,
  // Render functions
  renderCorrectionCard,
  renderCorrectionsListForSpot,
  renderMyCorrections,
  renderCorrectionForm,
  // Testing
  clearAllCorrections,
} from '../src/services/spotCorrections.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}));

// Mock Storage
vi.mock('../src/utils/storage.js', () => {
  let store = {};
  return {
    Storage: {
      get: vi.fn((key) => {
        const data = store[key];
        return data ? JSON.parse(JSON.stringify(data)) : null;
      }),
      set: vi.fn((key, value) => {
        store[key] = value;
      }),
      remove: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      _getStore: () => store,
      _reset: () => {
        store = {};
      },
    },
  };
});

import { Storage } from '../src/utils/storage.js';

describe('Spot Corrections Service', () => {
  beforeEach(() => {
    resetState();
    Storage._reset();
    vi.clearAllMocks();

    // Set up a logged in user
    setState({
      user: { uid: 'user123' },
      username: 'TestUser',
      level: 5,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Storage._reset();
  });

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should have VOTES_REQUIRED_TO_APPROVE as 5', () => {
      expect(VOTES_REQUIRED_TO_APPROVE).toBe(5);
    });

    it('should have VOTES_REQUIRED_TO_REJECT as 3', () => {
      expect(VOTES_REQUIRED_TO_REJECT).toBe(3);
    });

    it('should have CORRECTION_EXPIRY_DAYS as 14', () => {
      expect(CORRECTION_EXPIRY_DAYS).toBe(14);
    });

    it('should have CORRECTION_EXPIRY_MS as 14 days in ms', () => {
      expect(CORRECTION_EXPIRY_MS).toBe(14 * 24 * 60 * 60 * 1000);
    });

    it('should have POINTS_FOR_APPROVED_CORRECTION as 15', () => {
      expect(POINTS_FOR_APPROVED_CORRECTION).toBe(15);
    });

    it('should have POINTS_FOR_VOTING as 2', () => {
      expect(POINTS_FOR_VOTING).toBe(2);
    });

    it('should have all CorrectionStatus values', () => {
      expect(CorrectionStatus.PENDING).toBe('pending');
      expect(CorrectionStatus.APPROVED).toBe('approved');
      expect(CorrectionStatus.REJECTED).toBe('rejected');
      expect(CorrectionStatus.EXPIRED).toBe('expired');
    });

    it('should have all EditableFields defined', () => {
      expect(EditableFields.name).toBeDefined();
      expect(EditableFields.description).toBeDefined();
      expect(EditableFields.coordinates).toBeDefined();
      expect(EditableFields.amenities).toBeDefined();
      expect(EditableFields.directions).toBeDefined();
    });
  });

  // ==================== getEditableFields ====================

  describe('getEditableFields', () => {
    it('should return array of all editable fields', () => {
      const fields = getEditableFields();
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBe(5);
    });

    it('should include all field properties', () => {
      const fields = getEditableFields();
      fields.forEach(field => {
        expect(field.id).toBeDefined();
        expect(field.label).toBeDefined();
        expect(field.icon).toBeDefined();
        expect(field.description).toBeDefined();
        expect(typeof field.validation).toBe('function');
        expect(field.errorMessage).toBeDefined();
      });
    });

    it('should include name, description, coordinates, amenities, directions', () => {
      const fields = getEditableFields();
      const fieldIds = fields.map(f => f.id);
      expect(fieldIds).toContain('name');
      expect(fieldIds).toContain('description');
      expect(fieldIds).toContain('coordinates');
      expect(fieldIds).toContain('amenities');
      expect(fieldIds).toContain('directions');
    });
  });

  // ==================== getEditableFieldById ====================

  describe('getEditableFieldById', () => {
    it('should return null for empty input', () => {
      expect(getEditableFieldById(null)).toBeNull();
      expect(getEditableFieldById('')).toBeNull();
      expect(getEditableFieldById(undefined)).toBeNull();
    });

    it('should return field object for valid ID', () => {
      const nameField = getEditableFieldById('name');
      expect(nameField).toBeDefined();
      expect(nameField.id).toBe('name');
      expect(nameField.label).toBe('Nom du spot');
    });

    it('should return null for invalid ID', () => {
      expect(getEditableFieldById('invalid')).toBeNull();
      expect(getEditableFieldById('xyz')).toBeNull();
    });
  });

  // ==================== validateFieldValue ====================

  describe('validateFieldValue', () => {
    it('should return error for unknown field', () => {
      const result = validateFieldValue('unknown', 'value');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Champ inconnu');
    });

    it('should validate name field correctly', () => {
      expect(validateFieldValue('name', 'Valid Name').valid).toBe(true);
      expect(validateFieldValue('name', 'AB').valid).toBe(false); // Too short
      expect(validateFieldValue('name', '').valid).toBe(false);
      expect(validateFieldValue('name', 'A'.repeat(101)).valid).toBe(false); // Too long
    });

    it('should validate description field correctly', () => {
      expect(validateFieldValue('description', 'A valid description text').valid).toBe(true);
      expect(validateFieldValue('description', 'Too short').valid).toBe(false);
      expect(validateFieldValue('description', '').valid).toBe(false);
    });

    it('should validate coordinates field correctly', () => {
      expect(validateFieldValue('coordinates', { lat: 48.8566, lng: 2.3522 }).valid).toBe(true);
      expect(validateFieldValue('coordinates', { lat: 91, lng: 0 }).valid).toBe(false); // lat out of range
      expect(validateFieldValue('coordinates', { lat: 0, lng: 181 }).valid).toBe(false); // lng out of range
      expect(validateFieldValue('coordinates', 'invalid').valid).toBe(false);
      expect(validateFieldValue('coordinates', null).valid).toBe(false);
    });

    it('should validate amenities field correctly', () => {
      expect(validateFieldValue('amenities', ['wifi', 'toilettes']).valid).toBe(true);
      expect(validateFieldValue('amenities', []).valid).toBe(true);
      expect(validateFieldValue('amenities', 'not an array').valid).toBe(false);
      expect(validateFieldValue('amenities', Array(21).fill('item')).valid).toBe(false); // Too many
    });

    it('should validate directions field correctly', () => {
      expect(validateFieldValue('directions', 'Take the A6 highway, exit at...').valid).toBe(true);
      expect(validateFieldValue('directions', 'Too short').valid).toBe(false);
      expect(validateFieldValue('directions', '').valid).toBe(false);
    });
  });

  // ==================== proposeCorrection ====================

  describe('proposeCorrection', () => {
    it('should successfully propose a correction', () => {
      const result = proposeCorrection('spot1', 'name', 'New Spot Name', 'The name was incorrect');

      expect(result.success).toBe(true);
      expect(result.correction).toBeDefined();
      expect(result.correction.spotId).toBe('spot1');
      expect(result.correction.field).toBe('name');
      expect(result.correction.newValue).toBe('New Spot Name');
      expect(result.correction.reason).toBe('The name was incorrect');
      expect(result.correction.status).toBe(CorrectionStatus.PENDING);
    });

    it('should fail if not logged in', () => {
      setState({ user: null });
      const result = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_logged_in');
    });

    it('should fail if spotId is missing', () => {
      const result = proposeCorrection('', 'name', 'New Name', 'Reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('spot_id_required');
    });

    it('should fail if field is missing', () => {
      const result = proposeCorrection('spot1', '', 'New Value', 'Reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('field_required');
    });

    it('should fail for invalid field', () => {
      const result = proposeCorrection('spot1', 'invalid_field', 'Value', 'Reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_field');
    });

    it('should fail for invalid value', () => {
      const result = proposeCorrection('spot1', 'name', 'AB', 'Reason'); // Too short

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_value');
    });

    it('should fail if reason is too short', () => {
      const result = proposeCorrection('spot1', 'name', 'Valid Name', 'Hi'); // Too short

      expect(result.success).toBe(false);
      expect(result.error).toBe('reason_required');
    });

    it('should fail if user already has pending correction for same field', () => {
      proposeCorrection('spot1', 'name', 'First Name', 'First reason here');
      const result = proposeCorrection('spot1', 'name', 'Second Name', 'Second reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_proposed');
    });

    it('should allow corrections for different fields', () => {
      const result1 = proposeCorrection('spot1', 'name', 'New Name', 'Name reason here');
      const result2 = proposeCorrection('spot1', 'description', 'A new description text', 'Desc reason');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should set correct expiration date', () => {
      const before = Date.now();
      const result = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const after = Date.now();

      const expiresAt = new Date(result.correction.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(before + CORRECTION_EXPIRY_MS);
      expect(expiresAt).toBeLessThanOrEqual(after + CORRECTION_EXPIRY_MS + 1000);
    });

    it('should initialize empty vote arrays', () => {
      const result = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');

      expect(result.correction.votes.approve).toEqual([]);
      expect(result.correction.votes.reject).toEqual([]);
    });
  });

  // ==================== getPendingCorrections ====================

  describe('getPendingCorrections', () => {
    it('should return empty array for spotId with no corrections', () => {
      const result = getPendingCorrections('nonexistent');
      expect(result).toEqual([]);
    });

    it('should return only pending corrections for given spotId', () => {
      proposeCorrection('spot1', 'name', 'Name 1', 'Reason one here');
      proposeCorrection('spot2', 'name', 'Name 2', 'Reason two here');

      const result = getPendingCorrections('spot1');
      expect(result.length).toBe(1);
      expect(result[0].spotId).toBe('spot1');
    });

    it('should not return approved corrections', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      approveCorrection(proposed.correction.id);

      const result = getPendingCorrections('spot1');
      expect(result.length).toBe(0);
    });

    it('should return empty array for null spotId', () => {
      expect(getPendingCorrections(null)).toEqual([]);
      expect(getPendingCorrections('')).toEqual([]);
    });

    it('should sort by creation date descending', () => {
      proposeCorrection('spot1', 'name', 'First Name', 'First reason here');
      proposeCorrection('spot1', 'description', 'First description text', 'Second reason');

      const result = getPendingCorrections('spot1');
      expect(result.length).toBe(2);
      // Most recent first
      expect(new Date(result[0].createdAt) >= new Date(result[1].createdAt)).toBe(true);
    });
  });

  // ==================== getAllPendingCorrections ====================

  describe('getAllPendingCorrections', () => {
    it('should return empty array when no corrections exist', () => {
      expect(getAllPendingCorrections()).toEqual([]);
    });

    it('should return all pending corrections across spots', () => {
      proposeCorrection('spot1', 'name', 'Name 1', 'Reason for spot1');
      proposeCorrection('spot2', 'name', 'Name 2', 'Reason for spot2');

      const result = getAllPendingCorrections();
      expect(result.length).toBe(2);
    });

    it('should not return non-pending corrections', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      approveCorrection(proposed.correction.id);

      const result = getAllPendingCorrections();
      expect(result.length).toBe(0);
    });
  });

  // ==================== getCorrectionById ====================

  describe('getCorrectionById', () => {
    it('should return null for invalid ID', () => {
      expect(getCorrectionById(null)).toBeNull();
      expect(getCorrectionById('')).toBeNull();
      expect(getCorrectionById('nonexistent')).toBeNull();
    });

    it('should return correction object for valid ID', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const result = getCorrectionById(proposed.correction.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(proposed.correction.id);
      expect(result.spotId).toBe('spot1');
    });
  });

  // ==================== approveCorrection ====================

  describe('approveCorrection', () => {
    it('should successfully approve a correction', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const result = approveCorrection(proposed.correction.id);

      expect(result.success).toBe(true);
      expect(result.correction.status).toBe(CorrectionStatus.APPROVED);
      expect(result.correction.approvedAt).toBeDefined();
    });

    it('should fail for invalid correction ID', () => {
      const result = approveCorrection('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_found');
    });

    it('should fail for missing correction ID', () => {
      const result = approveCorrection('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_id_required');
    });

    it('should fail if correction is already approved', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      approveCorrection(proposed.correction.id);
      const result = approveCorrection(proposed.correction.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_pending');
    });
  });

  // ==================== rejectCorrection ====================

  describe('rejectCorrection', () => {
    it('should successfully reject a correction', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const result = rejectCorrection(proposed.correction.id, 'Invalid correction');

      expect(result.success).toBe(true);

      const correction = getCorrectionById(proposed.correction.id);
      expect(correction.status).toBe(CorrectionStatus.REJECTED);
      expect(correction.rejectionReason).toBe('Invalid correction');
    });

    it('should fail for invalid correction ID', () => {
      const result = rejectCorrection('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_found');
    });

    it('should fail for missing correction ID', () => {
      const result = rejectCorrection('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_id_required');
    });

    it('should fail if correction is already rejected', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      rejectCorrection(proposed.correction.id);
      const result = rejectCorrection(proposed.correction.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_pending');
    });
  });

  // ==================== getMyCorrections ====================

  describe('getMyCorrections', () => {
    it('should return empty array if not logged in', () => {
      setState({ user: null });
      expect(getMyCorrections()).toEqual([]);
    });

    it('should return only current user corrections', () => {
      proposeCorrection('spot1', 'name', 'My Correction', 'My reason here');

      // Switch user
      setState({ user: { uid: 'user456' }, username: 'OtherUser' });
      proposeCorrection('spot2', 'name', 'Other Correction', 'Other reason');

      // Switch back
      setState({ user: { uid: 'user123' }, username: 'TestUser' });
      const result = getMyCorrections();

      expect(result.length).toBe(1);
      expect(result[0].authorId).toBe('user123');
    });

    it('should return corrections sorted by date descending', () => {
      proposeCorrection('spot1', 'name', 'First Name', 'First reason here');
      proposeCorrection('spot2', 'description', 'First description text', 'Second reason');

      const result = getMyCorrections();
      expect(result.length).toBe(2);
      expect(new Date(result[0].createdAt) >= new Date(result[1].createdAt)).toBe(true);
    });
  });

  // ==================== voteOnCorrection ====================

  describe('voteOnCorrection', () => {
    let correctionId;

    beforeEach(() => {
      // Create correction as user123
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      correctionId = proposed.correction.id;

      // Switch to another user for voting
      setState({ user: { uid: 'voter1' }, username: 'Voter1' });
    });

    it('should successfully vote to approve', () => {
      const result = voteOnCorrection(correctionId, 'approve');

      expect(result.success).toBe(true);
      expect(result.approveVotes).toBe(1);
      expect(result.statusChanged).toBe(false);
    });

    it('should successfully vote to reject', () => {
      const result = voteOnCorrection(correctionId, 'reject');

      expect(result.success).toBe(true);
      expect(result.rejectVotes).toBe(1);
      expect(result.statusChanged).toBe(false);
    });

    it('should fail for invalid correction ID', () => {
      const result = voteOnCorrection('invalid', 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_found');
    });

    it('should fail for missing correction ID', () => {
      const result = voteOnCorrection('', 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_id_required');
    });

    it('should fail for invalid vote type', () => {
      const result = voteOnCorrection(correctionId, 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_vote_type');
    });

    it('should fail if not logged in', () => {
      setState({ user: null });
      const result = voteOnCorrection(correctionId, 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_logged_in');
    });

    it('should fail if user already voted', () => {
      voteOnCorrection(correctionId, 'approve');
      const result = voteOnCorrection(correctionId, 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_voted');
    });

    it('should not allow voting on own correction', () => {
      setState({ user: { uid: 'user123' }, username: 'TestUser' });
      const result = voteOnCorrection(correctionId, 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_vote_own');
    });

    it('should auto-approve when reaching threshold', () => {
      // Vote with multiple users
      for (let i = 1; i <= VOTES_REQUIRED_TO_APPROVE; i++) {
        setState({ user: { uid: `approver${i}` }, username: `Approver${i}` });
        const result = voteOnCorrection(correctionId, 'approve');
        if (i === VOTES_REQUIRED_TO_APPROVE) {
          expect(result.statusChanged).toBe(true);
          expect(result.newStatus).toBe(CorrectionStatus.APPROVED);
        }
      }
    });

    it('should auto-reject when reaching threshold', () => {
      // Vote with multiple users
      for (let i = 1; i <= VOTES_REQUIRED_TO_REJECT; i++) {
        setState({ user: { uid: `rejecter${i}` }, username: `Rejecter${i}` });
        const result = voteOnCorrection(correctionId, 'reject');
        if (i === VOTES_REQUIRED_TO_REJECT) {
          expect(result.statusChanged).toBe(true);
          expect(result.newStatus).toBe(CorrectionStatus.REJECTED);
        }
      }
    });

    it('should fail if correction is not pending', () => {
      approveCorrection(correctionId);
      const result = voteOnCorrection(correctionId, 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_pending');
    });
  });

  // ==================== hasVotedOnCorrection ====================

  describe('hasVotedOnCorrection', () => {
    it('should return hasVoted false for invalid correction', () => {
      const result = hasVotedOnCorrection('invalid');
      expect(result.hasVoted).toBe(false);
      expect(result.voteType).toBeNull();
    });

    it('should return hasVoted false if not voted', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: { uid: 'voter1' } });

      const result = hasVotedOnCorrection(proposed.correction.id);
      expect(result.hasVoted).toBe(false);
      expect(result.voteType).toBeNull();
    });

    it('should return correct vote type after voting approve', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: { uid: 'voter1' } });
      voteOnCorrection(proposed.correction.id, 'approve');

      const result = hasVotedOnCorrection(proposed.correction.id);
      expect(result.hasVoted).toBe(true);
      expect(result.voteType).toBe('approve');
    });

    it('should return correct vote type after voting reject', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: { uid: 'voter1' } });
      voteOnCorrection(proposed.correction.id, 'reject');

      const result = hasVotedOnCorrection(proposed.correction.id);
      expect(result.hasVoted).toBe(true);
      expect(result.voteType).toBe('reject');
    });

    it('should return hasVoted false if not logged in', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: null });

      const result = hasVotedOnCorrection(proposed.correction.id);
      expect(result.hasVoted).toBe(false);
    });
  });

  // ==================== cancelCorrection ====================

  describe('cancelCorrection', () => {
    it('should successfully cancel own correction', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const result = cancelCorrection(proposed.correction.id);

      expect(result.success).toBe(true);
      expect(getCorrectionById(proposed.correction.id)).toBeNull();
    });

    it('should fail for invalid correction ID', () => {
      const result = cancelCorrection('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_found');
    });

    it('should fail for missing correction ID', () => {
      const result = cancelCorrection('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_id_required');
    });

    it('should fail if not logged in', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: null });
      const result = cancelCorrection(proposed.correction.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_logged_in');
    });

    it('should fail if not the author', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: { uid: 'other_user' } });
      const result = cancelCorrection(proposed.correction.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_author');
    });

    it('should fail if correction is not pending', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      approveCorrection(proposed.correction.id);
      const result = cancelCorrection(proposed.correction.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('correction_not_pending');
    });
  });

  // ==================== processExpiredCorrections ====================

  describe('processExpiredCorrections', () => {
    it('should return 0 when no corrections exist', () => {
      const count = processExpiredCorrections();
      expect(count).toBe(0);
    });

    it('should not expire recent corrections', () => {
      proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const count = processExpiredCorrections();

      expect(count).toBe(0);
      expect(getPendingCorrections('spot1').length).toBe(1);
    });
  });

  // ==================== getCorrectionStats ====================

  describe('getCorrectionStats', () => {
    it('should return correct initial stats', () => {
      const stats = getCorrectionStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.byField).toBeDefined();
    });

    it('should count corrections by status', () => {
      proposeCorrection('spot1', 'name', 'Name 1', 'Reason one here');
      const proposed2 = proposeCorrection('spot2', 'description', 'Description text', 'Reason two');
      approveCorrection(proposed2.correction.id);

      const stats = getCorrectionStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
    });

    it('should count corrections by field', () => {
      proposeCorrection('spot1', 'name', 'Name 1', 'Reason one here');
      proposeCorrection('spot2', 'name', 'Name 2', 'Reason two here');
      proposeCorrection('spot3', 'description', 'Description text', 'Reason three');

      const stats = getCorrectionStats();

      expect(stats.byField.name).toBe(2);
      expect(stats.byField.description).toBe(1);
    });

    it('should include user-specific stats', () => {
      proposeCorrection('spot1', 'name', 'New Name', 'Reason here');

      const stats = getCorrectionStats();

      expect(stats.myCorrections).toBe(1);
    });
  });

  // ==================== getCorrectionsByField ====================

  describe('getCorrectionsByField', () => {
    it('should return all corrections for spot when no field specified', () => {
      proposeCorrection('spot1', 'name', 'New Name', 'Reason one');
      proposeCorrection('spot1', 'description', 'New description text', 'Reason two');

      const result = getCorrectionsByField('spot1');
      expect(result.length).toBe(2);
    });

    it('should filter by field when specified', () => {
      proposeCorrection('spot1', 'name', 'New Name', 'Reason one');
      proposeCorrection('spot1', 'description', 'New description text', 'Reason two');

      const result = getCorrectionsByField('spot1', 'name');
      expect(result.length).toBe(1);
      expect(result[0].field).toBe('name');
    });

    it('should return empty array for non-existent spot', () => {
      const result = getCorrectionsByField('nonexistent');
      expect(result).toEqual([]);
    });
  });

  // ==================== getApprovedCorrectionsHistory ====================

  describe('getApprovedCorrectionsHistory', () => {
    it('should return empty array for spot with no approved corrections', () => {
      proposeCorrection('spot1', 'name', 'New Name', 'Reason here');

      const result = getApprovedCorrectionsHistory('spot1');
      expect(result).toEqual([]);
    });

    it('should return only approved corrections', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      approveCorrection(proposed.correction.id);
      proposeCorrection('spot1', 'description', 'New description text', 'Another reason');

      const result = getApprovedCorrectionsHistory('spot1');
      expect(result.length).toBe(1);
      expect(result[0].status).toBe(CorrectionStatus.APPROVED);
    });

    it('should return empty array for null spotId', () => {
      expect(getApprovedCorrectionsHistory(null)).toEqual([]);
      expect(getApprovedCorrectionsHistory('')).toEqual([]);
    });
  });

  // ==================== getStatusLabel ====================

  describe('getStatusLabel', () => {
    it('should return correct labels for all statuses', () => {
      expect(getStatusLabel(CorrectionStatus.PENDING)).toBe('En attente');
      expect(getStatusLabel(CorrectionStatus.APPROVED)).toBe('Approuvee');
      expect(getStatusLabel(CorrectionStatus.REJECTED)).toBe('Rejetee');
      expect(getStatusLabel(CorrectionStatus.EXPIRED)).toBe('Expiree');
    });

    it('should return the status itself for unknown status', () => {
      expect(getStatusLabel('unknown')).toBe('unknown');
    });
  });

  // ==================== renderCorrectionCard ====================

  describe('renderCorrectionCard', () => {
    it('should return empty string for null correction', () => {
      expect(renderCorrectionCard(null)).toBe('');
      expect(renderCorrectionCard(undefined)).toBe('');
    });

    it('should render card HTML for valid correction', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const html = renderCorrectionCard(proposed.correction);

      expect(html).toContain('correction-card');
      expect(html).toContain('New Name');
      expect(html).toContain('Reason here');
    });

    it('should include vote buttons for non-author pending corrections', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: { uid: 'voter1' }, username: 'Voter' });

      const html = renderCorrectionCard(proposed.correction);

      expect(html).toContain('voteOnCorrectionHandler');
      expect(html).toContain('fa-thumbs-up');
      expect(html).toContain('fa-thumbs-down');
    });

    it('should include cancel button for author', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const html = renderCorrectionCard(proposed.correction);

      expect(html).toContain('cancelCorrectionHandler');
      expect(html).toContain('Annuler');
    });

    it('should display vote counts', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      setState({ user: { uid: 'voter1' } });
      voteOnCorrection(proposed.correction.id, 'approve');

      const updated = getCorrectionById(proposed.correction.id);
      const html = renderCorrectionCard(updated);

      expect(html).toContain(`1/${VOTES_REQUIRED_TO_APPROVE}`);
    });

    it('should format coordinates correctly', () => {
      const proposed = proposeCorrection('spot1', 'coordinates', { lat: 48.8566, lng: 2.3522 }, 'Reason here');
      const html = renderCorrectionCard(proposed.correction);

      expect(html).toContain('48.8566');
      expect(html).toContain('2.3522');
    });

    it('should format amenities correctly', () => {
      const proposed = proposeCorrection('spot1', 'amenities', ['wifi', 'toilettes'], 'Reason here');
      const html = renderCorrectionCard(proposed.correction);

      expect(html).toContain('wifi, toilettes');
    });

    it('should have ARIA attributes for accessibility', () => {
      const proposed = proposeCorrection('spot1', 'name', 'New Name', 'Reason here');
      const html = renderCorrectionCard(proposed.correction);

      expect(html).toContain('role="article"');
      expect(html).toContain('aria-labelledby');
      expect(html).toContain('aria-label');
    });
  });

  // ==================== renderCorrectionsListForSpot ====================

  describe('renderCorrectionsListForSpot', () => {
    it('should render empty state when no corrections', () => {
      const html = renderCorrectionsListForSpot('spot1');

      expect(html).toContain('empty-state');
      expect(html).toContain('Aucune correction en attente');
    });

    it('should render list of corrections', () => {
      proposeCorrection('spot1', 'name', 'New Name', 'Reason here');

      const html = renderCorrectionsListForSpot('spot1');

      expect(html).toContain('corrections-list');
      expect(html).toContain('correction-card');
    });

    it('should show correction count', () => {
      proposeCorrection('spot1', 'name', 'Name 1', 'Reason one here');
      proposeCorrection('spot1', 'description', 'Description text', 'Reason two here');

      const html = renderCorrectionsListForSpot('spot1');

      expect(html).toContain('(2)');
    });
  });

  // ==================== renderMyCorrections ====================

  describe('renderMyCorrections', () => {
    it('should render empty state when no corrections', () => {
      const html = renderMyCorrections();

      expect(html).toContain('empty-state');
      expect(html).toContain('Aucune correction');
    });

    it('should render list of my corrections', () => {
      proposeCorrection('spot1', 'name', 'New Name', 'Reason here');

      const html = renderMyCorrections();

      expect(html).toContain('my-corrections-list');
      expect(html).toContain('Mes corrections');
    });
  });

  // ==================== renderCorrectionForm ====================

  describe('renderCorrectionForm', () => {
    it('should return empty string for null spotId', () => {
      expect(renderCorrectionForm(null)).toBe('');
      expect(renderCorrectionForm('')).toBe('');
    });

    it('should render form HTML for valid spotId', () => {
      const html = renderCorrectionForm('spot1');

      expect(html).toContain('correction-form');
      expect(html).toContain('Proposer une correction');
    });

    it('should include field select options', () => {
      const html = renderCorrectionForm('spot1');

      expect(html).toContain('correction-field');
      expect(html).toContain('Nom du spot');
      expect(html).toContain('Description');
      expect(html).toContain('Coordonnees');
      expect(html).toContain('Commodites');
      expect(html).toContain('Directions');
    });

    it('should include value input', () => {
      const html = renderCorrectionForm('spot1');

      expect(html).toContain('correction-value');
      expect(html).toContain('Nouvelle valeur');
    });

    it('should include reason textarea', () => {
      const html = renderCorrectionForm('spot1');

      expect(html).toContain('correction-reason');
      expect(html).toContain('Raison de la correction');
    });

    it('should include submit button with correct handler', () => {
      const html = renderCorrectionForm('spot1');

      expect(html).toContain('submitCorrectionHandler');
      expect(html).toContain('Soumettre la correction');
    });

    it('should have form role for accessibility', () => {
      const html = renderCorrectionForm('spot1');

      expect(html).toContain('role="form"');
    });
  });

  // ==================== clearAllCorrections ====================

  describe('clearAllCorrections', () => {
    it('should clear all corrections', () => {
      proposeCorrection('spot1', 'name', 'Name 1', 'Reason one');
      proposeCorrection('spot2', 'name', 'Name 2', 'Reason two');

      const result = clearAllCorrections();

      expect(result.success).toBe(true);
      expect(getAllPendingCorrections()).toEqual([]);
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should handle full correction workflow', () => {
      // 1. User proposes a correction
      const proposed = proposeCorrection('spot1', 'name', 'Better Name', 'The current name is misleading');
      expect(proposed.success).toBe(true);
      expect(getPendingCorrections('spot1').length).toBe(1);

      // 2. Other users vote
      for (let i = 1; i <= VOTES_REQUIRED_TO_APPROVE - 1; i++) {
        setState({ user: { uid: `voter${i}` }, username: `Voter${i}` });
        const vote = voteOnCorrection(proposed.correction.id, 'approve');
        expect(vote.success).toBe(true);
        expect(vote.statusChanged).toBe(false);
      }

      // 3. Final vote triggers approval
      setState({ user: { uid: 'final_voter' }, username: 'FinalVoter' });
      const finalVote = voteOnCorrection(proposed.correction.id, 'approve');
      expect(finalVote.success).toBe(true);
      expect(finalVote.statusChanged).toBe(true);
      expect(finalVote.newStatus).toBe(CorrectionStatus.APPROVED);

      // 4. Correction is no longer pending
      expect(getPendingCorrections('spot1').length).toBe(0);

      // 5. Correction appears in history
      expect(getApprovedCorrectionsHistory('spot1').length).toBe(1);
    });

    it('should handle rejection workflow', () => {
      // 1. User proposes a correction
      const proposed = proposeCorrection('spot1', 'name', 'Wrong Name', 'Invalid reason here');
      expect(proposed.success).toBe(true);

      // 2. Users vote to reject
      for (let i = 1; i <= VOTES_REQUIRED_TO_REJECT; i++) {
        setState({ user: { uid: `rejecter${i}` }, username: `Rejecter${i}` });
        const vote = voteOnCorrection(proposed.correction.id, 'reject');
        if (i === VOTES_REQUIRED_TO_REJECT) {
          expect(vote.statusChanged).toBe(true);
          expect(vote.newStatus).toBe(CorrectionStatus.REJECTED);
        }
      }

      // 3. Correction is rejected
      const correction = getCorrectionById(proposed.correction.id);
      expect(correction.status).toBe(CorrectionStatus.REJECTED);
    });

    it('should handle multiple spots with corrections', () => {
      // Create corrections for multiple spots
      proposeCorrection('spot1', 'name', 'Spot 1 Name', 'Reason for spot1');
      proposeCorrection('spot2', 'name', 'Spot 2 Name', 'Reason for spot2');
      proposeCorrection('spot3', 'description', 'Spot 3 description here', 'Reason for spot3');

      // Check spot-specific queries
      expect(getPendingCorrections('spot1').length).toBe(1);
      expect(getPendingCorrections('spot2').length).toBe(1);
      expect(getPendingCorrections('spot3').length).toBe(1);

      // Check global query
      expect(getAllPendingCorrections().length).toBe(3);

      // Check stats
      const stats = getCorrectionStats();
      expect(stats.total).toBe(3);
      expect(stats.byField.name).toBe(2);
      expect(stats.byField.description).toBe(1);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle special characters in values', () => {
      const result = proposeCorrection('spot1', 'name', "L'aire d'autoroute", 'Special chars reason');
      expect(result.success).toBe(true);

      const html = renderCorrectionCard(result.correction);
      expect(html).toContain("L'aire d'autoroute");
    });

    it('should handle coordinates at boundary values', () => {
      const result = proposeCorrection('spot1', 'coordinates', { lat: 90, lng: 180 }, 'Boundary coords test');
      expect(result.success).toBe(true);
    });

    it('should handle empty amenities array', () => {
      const result = proposeCorrection('spot1', 'amenities', [], 'Removing all amenities');
      expect(result.success).toBe(true);
    });

    it('should handle max length values', () => {
      const longDescription = 'A'.repeat(1000);
      const result = proposeCorrection('spot1', 'description', longDescription, 'Max length description');
      expect(result.success).toBe(true);
    });

    it('should handle whitespace trimming in reason', () => {
      const result = proposeCorrection('spot1', 'name', 'New Name', '  Reason with whitespace  ');
      expect(result.correction.reason).toBe('Reason with whitespace');
    });
  });
});
