/**
 * Contact Form Service Tests
 * Feature #274 - Tests for the contact form service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock state
let mockState = {
  user: { uid: 'user123' },
  lang: 'fr',
  contactHistory: [],
};

// Mock storage
let mockStorage = {};

// Mock modules
vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: (newState) => {
    mockState = { ...mockState, ...newState };
  },
}));

vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: (key) => mockStorage[key] || null,
    set: (key, value) => {
      mockStorage[key] = value;
    },
    remove: (key) => {
      delete mockStorage[key];
    },
  },
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: (key) => key,
}));

// Mock document for escapeHTML
global.document = {
  createElement: () => ({
    textContent: '',
    get innerHTML() {
      return this.textContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
  }),
  getElementById: vi.fn(() => null),
};

// Mock window
global.window = {};

// Mock navigator
global.navigator = {
  userAgent: 'test-user-agent',
};

// Import after mocks are set up
import {
  ContactTypes,
  ContactStatus,
  submitContactForm,
  validateContactForm,
  validateEmail,
  getContactTypes,
  getContactTypeById,
  canSubmitContact,
  getContactHistory,
  getAllContactHistory,
  getSubmissionById,
  getContactStats,
  clearContactHistory,
  renderContactForm,
  renderContactHistory,
} from '../src/services/contactForm.js';

describe('Contact Form Service', () => {
  beforeEach(() => {
    // Reset mocks
    mockState = {
      user: { uid: 'user123' },
      lang: 'fr',
      contactHistory: [],
    };
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ==================== ContactTypes Enum Tests ====================
  describe('ContactTypes', () => {
    it('should have all required contact types', () => {
      expect(ContactTypes.QUESTION).toBeDefined();
      expect(ContactTypes.BUG).toBeDefined();
      expect(ContactTypes.SUGGESTION).toBeDefined();
      expect(ContactTypes.PARTNERSHIP).toBeDefined();
      expect(ContactTypes.PRESS).toBeDefined();
    });

    it('should have exactly 5 contact types', () => {
      const types = Object.keys(ContactTypes);
      expect(types).toHaveLength(5);
    });

    it('should have id, label, icon, and description for each type', () => {
      Object.values(ContactTypes).forEach((type) => {
        expect(type.id).toBeDefined();
        expect(type.label).toBeDefined();
        expect(type.icon).toBeDefined();
        expect(type.description).toBeDefined();
      });
    });

    it('should have unique IDs for each type', () => {
      const ids = Object.values(ContactTypes).map((t) => t.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });

    it('should have correct type IDs', () => {
      expect(ContactTypes.QUESTION.id).toBe('question');
      expect(ContactTypes.BUG.id).toBe('bug');
      expect(ContactTypes.SUGGESTION.id).toBe('suggestion');
      expect(ContactTypes.PARTNERSHIP.id).toBe('partnership');
      expect(ContactTypes.PRESS.id).toBe('press');
    });
  });

  // ==================== ContactStatus Enum Tests ====================
  describe('ContactStatus', () => {
    it('should have all required status values', () => {
      expect(ContactStatus.PENDING).toBe('pending');
      expect(ContactStatus.SENT).toBe('sent');
      expect(ContactStatus.READ).toBe('read');
      expect(ContactStatus.REPLIED).toBe('replied');
      expect(ContactStatus.CLOSED).toBe('closed');
    });

    it('should have exactly 5 status values', () => {
      const statuses = Object.keys(ContactStatus);
      expect(statuses).toHaveLength(5);
    });
  });

  // ==================== getContactTypes Tests ====================
  describe('getContactTypes', () => {
    it('should return an array of all types', () => {
      const types = getContactTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types).toHaveLength(5);
    });

    it('should include question type', () => {
      const types = getContactTypes();
      const question = types.find((t) => t.id === 'question');
      expect(question).toBeDefined();
    });

    it('should include all type IDs', () => {
      const types = getContactTypes();
      const ids = types.map((t) => t.id);
      expect(ids).toContain('question');
      expect(ids).toContain('bug');
      expect(ids).toContain('suggestion');
      expect(ids).toContain('partnership');
      expect(ids).toContain('press');
    });
  });

  // ==================== getContactTypeById Tests ====================
  describe('getContactTypeById', () => {
    it('should return correct type by ID', () => {
      const type = getContactTypeById('question');
      expect(type).toBeDefined();
      expect(type.id).toBe('question');
    });

    it('should return null for invalid ID', () => {
      const type = getContactTypeById('invalid_type');
      expect(type).toBeNull();
    });

    it('should return null for null/undefined ID', () => {
      expect(getContactTypeById(null)).toBeNull();
      expect(getContactTypeById(undefined)).toBeNull();
    });

    it('should return bug type correctly', () => {
      const type = getContactTypeById('bug');
      expect(type).toBeDefined();
      expect(type.icon).toBe('fa-bug');
    });
  });

  // ==================== validateEmail Tests ====================
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.org')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('not-an-email')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
      expect(validateEmail('spaces in@email.com')).toBe(false);
    });

    it('should reject empty or null values', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });

    it('should handle trimmed emails', () => {
      expect(validateEmail('  test@example.com  ')).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(validateEmail(123)).toBe(false);
      expect(validateEmail({})).toBe(false);
      expect(validateEmail([])).toBe(false);
    });
  });

  // ==================== validateContactForm Tests ====================
  describe('validateContactForm', () => {
    const validFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      type: 'question',
      subject: 'Test subject here',
      message: 'This is a test message that is long enough to pass validation.',
      honeypot: '',
      website: '',
    };

    it('should validate a correct form', () => {
      const result = validateContactForm(validFormData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with null data', () => {
      const result = validateContactForm(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('form');
    });

    it('should fail with missing name', () => {
      const result = validateContactForm({ ...validFormData, name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail with short name', () => {
      const result = validateContactForm({ ...validFormData, name: 'A' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail with name too long', () => {
      const result = validateContactForm({ ...validFormData, name: 'A'.repeat(101) });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail with missing email', () => {
      const result = validateContactForm({ ...validFormData, email: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should fail with invalid email', () => {
      const result = validateContactForm({ ...validFormData, email: 'not-an-email' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should fail with missing type', () => {
      const result = validateContactForm({ ...validFormData, type: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should fail with invalid type', () => {
      const result = validateContactForm({ ...validFormData, type: 'invalid_type' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should fail with short subject', () => {
      const result = validateContactForm({ ...validFormData, subject: 'Test' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'subject')).toBe(true);
    });

    it('should fail with subject too long', () => {
      const result = validateContactForm({ ...validFormData, subject: 'A'.repeat(201) });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'subject')).toBe(true);
    });

    it('should fail with short message', () => {
      const result = validateContactForm({ ...validFormData, message: 'Too short' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'message')).toBe(true);
    });

    it('should fail with message too long', () => {
      const result = validateContactForm({ ...validFormData, message: 'A'.repeat(5001) });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'message')).toBe(true);
    });

    it('should fail with honeypot filled (spam detection)', () => {
      const result = validateContactForm({ ...validFormData, honeypot: 'spam value' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'honeypot')).toBe(true);
    });

    it('should fail with website field filled (spam detection)', () => {
      const result = validateContactForm({ ...validFormData, website: 'http://spam.com' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'website')).toBe(true);
    });

    it('should collect multiple errors', () => {
      const result = validateContactForm({
        name: '',
        email: 'invalid',
        type: '',
        subject: 'Hi',
        message: 'Short',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  // ==================== submitContactForm Tests ====================
  describe('submitContactForm', () => {
    const validFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      type: 'question',
      subject: 'Test subject here',
      message: 'This is a test message that is long enough to pass validation.',
      honeypot: '',
      website: '',
    };

    it('should successfully submit valid form data', () => {
      const result = submitContactForm(validFormData);
      expect(result.success).toBe(true);
      expect(result.submission).toBeDefined();
      expect(result.submission.name).toBe('John Doe');
      expect(result.submission.email).toBe('john@example.com');
    });

    it('should generate unique submission ID', () => {
      const result = submitContactForm(validFormData);
      expect(result.submission.id).toBeDefined();
      expect(result.submission.id).toMatch(/^contact_\d+_/);
    });

    it('should set initial status to PENDING', () => {
      const result = submitContactForm(validFormData);
      expect(result.submission.status).toBe(ContactStatus.PENDING);
    });

    it('should trim whitespace from fields', () => {
      const result = submitContactForm({
        ...validFormData,
        name: '  John Doe  ',
        subject: '  Subject with spaces  ',
      });
      expect(result.submission.name).toBe('John Doe');
      expect(result.submission.subject).toBe('Subject with spaces');
    });

    it('should lowercase email', () => {
      const result = submitContactForm({
        ...validFormData,
        email: 'John.DOE@Example.COM',
      });
      expect(result.submission.email).toBe('john.doe@example.com');
    });

    it('should set correct timestamps', () => {
      const beforeTime = new Date().toISOString();
      const result = submitContactForm(validFormData);
      const afterTime = new Date().toISOString();

      expect(result.submission.createdAt).toBeDefined();
      expect(result.submission.updatedAt).toBeDefined();
      expect(result.submission.createdAt >= beforeTime).toBe(true);
      expect(result.submission.createdAt <= afterTime).toBe(true);
    });

    it('should store user metadata', () => {
      const result = submitContactForm(validFormData);
      expect(result.submission.metadata).toBeDefined();
      expect(result.submission.metadata.lang).toBe('fr');
      expect(result.submission.metadata.isLoggedIn).toBe(true);
    });

    it('should fail with validation errors', () => {
      const result = submitContactForm({ ...validFormData, email: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_failed');
      expect(result.errors).toBeDefined();
    });

    it('should save submission to history', () => {
      submitContactForm(validFormData);
      const history = getContactHistory();
      expect(history).toHaveLength(1);
    });

    it('should handle anonymous user', () => {
      mockState.user = null;
      const result = submitContactForm(validFormData);
      expect(result.success).toBe(true);
      expect(result.submission.userId).toBe('anonymous');
    });
  });

  // ==================== canSubmitContact Tests ====================
  describe('canSubmitContact', () => {
    const validFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      type: 'question',
      subject: 'Test subject here',
      message: 'This is a test message that is long enough to pass validation.',
    };

    it('should allow first submission', () => {
      const status = canSubmitContact();
      expect(status.canSubmit).toBe(true);
      expect(status.remainingTime).toBe(0);
    });

    it('should enforce cooldown after submission', () => {
      submitContactForm(validFormData);
      const status = canSubmitContact();
      expect(status.canSubmit).toBe(false);
      expect(status.remainingTime).toBeGreaterThan(0);
    });

    it('should return remaining cooldown time', () => {
      submitContactForm(validFormData);
      const status = canSubmitContact();
      // Cooldown is 5 minutes = 300000ms
      expect(status.remainingTime).toBeLessThanOrEqual(5 * 60 * 1000);
      expect(status.remainingTime).toBeGreaterThan(0);
    });

    it('should block submission during cooldown', () => {
      submitContactForm(validFormData);
      const result = submitContactForm({ ...validFormData, email: 'other@example.com' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('cooldown_active');
    });
  });

  // ==================== getContactHistory Tests ====================
  describe('getContactHistory', () => {
    const validFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      type: 'question',
      subject: 'Test subject here',
      message: 'This is a test message that is long enough to pass validation.',
    };

    it('should return empty array when no history', () => {
      const history = getContactHistory();
      expect(history).toEqual([]);
    });

    it('should return submissions by current user', () => {
      submitContactForm(validFormData);
      const history = getContactHistory();
      expect(history).toHaveLength(1);
      expect(history[0].userId).toBe('user123');
    });

    it('should only return current user submissions', () => {
      submitContactForm(validFormData);

      // Change user
      mockState.user = { uid: 'otherUser' };
      const history = getContactHistory();
      expect(history).toHaveLength(0);
    });

    it('should sort by date (newest first)', () => {
      // Submit first form
      submitContactForm(validFormData);

      // Manually add an older submission
      const historyData = mockStorage['spothitch_contact_history'];
      historyData.push({
        id: 'contact_old',
        userId: 'user123',
        createdAt: new Date(Date.now() - 10000).toISOString(),
      });
      mockStorage['spothitch_contact_history'] = historyData;

      const history = getContactHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      // First should be newer
      expect(new Date(history[0].createdAt) >= new Date(history[1].createdAt)).toBe(true);
    });
  });

  // ==================== getAllContactHistory Tests ====================
  describe('getAllContactHistory', () => {
    it('should return all submissions regardless of user', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject here',
        message: 'This is a test message that is long enough to pass validation.',
      };

      submitContactForm(validFormData);

      // Manually add submission from another user
      const historyData = mockStorage['spothitch_contact_history'];
      historyData.push({
        id: 'contact_other',
        userId: 'otherUser',
        createdAt: new Date().toISOString(),
      });
      mockStorage['spothitch_contact_history'] = historyData;

      const allHistory = getAllContactHistory();
      expect(allHistory.length).toBe(2);
    });
  });

  // ==================== getSubmissionById Tests ====================
  describe('getSubmissionById', () => {
    it('should return submission by ID', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject here',
        message: 'This is a test message that is long enough to pass validation.',
      };

      const result = submitContactForm(validFormData);
      const submission = getSubmissionById(result.submission.id);

      expect(submission).toBeDefined();
      expect(submission.id).toBe(result.submission.id);
    });

    it('should return null for non-existent ID', () => {
      const submission = getSubmissionById('non_existent_id');
      expect(submission).toBeNull();
    });

    it('should return null for null/undefined ID', () => {
      expect(getSubmissionById(null)).toBeNull();
      expect(getSubmissionById(undefined)).toBeNull();
    });
  });

  // ==================== getContactStats Tests ====================
  describe('getContactStats', () => {
    const validFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      type: 'question',
      subject: 'Test subject here',
      message: 'This is a test message that is long enough to pass validation.',
    };

    it('should return correct stats with no submissions', () => {
      const stats = getContactStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.sent).toBe(0);
      expect(stats.read).toBe(0);
      expect(stats.replied).toBe(0);
      expect(stats.closed).toBe(0);
      expect(stats.byType).toEqual({});
    });

    it('should return correct total count', () => {
      submitContactForm(validFormData);
      const stats = getContactStats();
      expect(stats.total).toBe(1);
    });

    it('should count by status correctly', () => {
      submitContactForm(validFormData);

      // Update status
      const historyData = mockStorage['spothitch_contact_history'];
      historyData[0].status = ContactStatus.SENT;
      mockStorage['spothitch_contact_history'] = historyData;

      const stats = getContactStats();
      expect(stats.sent).toBe(1);
      expect(stats.pending).toBe(0);
    });

    it('should count by type correctly', () => {
      submitContactForm(validFormData);

      const stats = getContactStats();
      expect(stats.byType.question).toBe(1);
    });
  });

  // ==================== clearContactHistory Tests ====================
  describe('clearContactHistory', () => {
    it('should clear all history', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject here',
        message: 'This is a test message that is long enough to pass validation.',
      };

      submitContactForm(validFormData);
      const result = clearContactHistory();

      expect(result.success).toBe(true);
      expect(getContactHistory()).toHaveLength(0);
    });

    it('should work when no history exists', () => {
      const result = clearContactHistory();
      expect(result.success).toBe(true);
    });
  });

  // ==================== renderContactForm Tests ====================
  describe('renderContactForm', () => {
    it('should render form with correct structure', () => {
      const html = renderContactForm();

      expect(html).toContain('contact-form-container');
      expect(html).toContain('contact-form');
      expect(html).toContain('role="form"');
    });

    it('should include all required form fields', () => {
      const html = renderContactForm();

      expect(html).toContain('contact-name');
      expect(html).toContain('contact-email');
      expect(html).toContain('contact-type');
      expect(html).toContain('contact-subject');
      expect(html).toContain('contact-message');
    });

    it('should include honeypot fields for anti-spam', () => {
      const html = renderContactForm();

      expect(html).toContain('contact-honeypot');
      expect(html).toContain('contact-website');
      expect(html).toContain('class="hidden"');
      expect(html).toContain('aria-hidden="true"');
    });

    it('should include all contact type options', () => {
      const html = renderContactForm();

      expect(html).toContain('question');
      expect(html).toContain('bug');
      expect(html).toContain('suggestion');
      expect(html).toContain('partnership');
      expect(html).toContain('press');
    });

    it('should include submit button', () => {
      const html = renderContactForm();

      expect(html).toContain('contact-submit-btn');
      expect(html).toContain('fa-paper-plane');
    });

    it('should include privacy notice', () => {
      const html = renderContactForm();

      expect(html).toContain('fa-lock');
      expect(html).toContain('contactPrivacy');
    });

    it('should include character counter', () => {
      const html = renderContactForm();

      expect(html).toContain('contact-chars-count');
      expect(html).toContain('/5000');
    });

    it('should include aria labels for accessibility', () => {
      const html = renderContactForm();

      expect(html).toContain('aria-labelledby');
      expect(html).toContain('aria-required="true"');
    });

    it('should include contact alternatives section', () => {
      const html = renderContactForm();

      expect(html).toContain('contact@spothitch.com');
      expect(html).toContain('@spothitch');
    });
  });

  // ==================== renderContactHistory Tests ====================
  describe('renderContactHistory', () => {
    it('should render empty state when no history', () => {
      const html = renderContactHistory();

      expect(html).toContain('empty-state');
      expect(html).toContain('noContactHistory');
    });

    it('should render list with submissions', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject',
        message: 'This is a test message that is long enough to pass validation.',
      };

      submitContactForm(validFormData);
      const html = renderContactHistory();

      expect(html).toContain('contact-history');
      expect(html).toContain('role="list"');
      expect(html).toContain('Test subject');
    });

    it('should display submission status', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject',
        message: 'This is a test message that is long enough to pass validation.',
      };

      submitContactForm(validFormData);
      const html = renderContactHistory();

      expect(html).toContain('contactStatusPending');
    });

    it('should display contact type with icon', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'bug',
        subject: 'Bug report',
        message: 'This is a test message that is long enough to pass validation.',
      };

      submitContactForm(validFormData);
      const html = renderContactHistory();

      expect(html).toContain('fa-bug');
    });

    it('should truncate long messages', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject',
        message: 'A'.repeat(200),
      };

      submitContactForm(validFormData);
      const html = renderContactHistory();

      expect(html).toContain('...');
    });

    it('should display submission count', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject',
        message: 'This is a test message that is long enough to pass validation.',
      };

      submitContactForm(validFormData);
      const html = renderContactHistory();

      expect(html).toContain('(1)');
    });
  });

  // ==================== Global Handlers Tests ====================
  describe('Global Handlers', () => {
    it('should export default object with all functions', async () => {
      const defaultExport = await import('../src/services/contactForm.js').then(m => m.default);
      expect(defaultExport.submitContactForm).toBeDefined();
      expect(defaultExport.validateContactForm).toBeDefined();
      expect(defaultExport.validateEmail).toBeDefined();
      expect(defaultExport.getContactTypes).toBeDefined();
      expect(defaultExport.getContactTypeById).toBeDefined();
      expect(defaultExport.canSubmitContact).toBeDefined();
      expect(defaultExport.getContactHistory).toBeDefined();
      expect(defaultExport.renderContactForm).toBeDefined();
      expect(defaultExport.renderContactHistory).toBeDefined();
    });

    it('should export ContactTypes enum', async () => {
      const { ContactTypes } = await import('../src/services/contactForm.js');
      expect(ContactTypes.QUESTION).toBeDefined();
      expect(ContactTypes.BUG).toBeDefined();
      expect(ContactTypes.SUGGESTION).toBeDefined();
    });

    it('should export ContactStatus enum', async () => {
      const { ContactStatus } = await import('../src/services/contactForm.js');
      expect(ContactStatus.PENDING).toBe('pending');
      expect(ContactStatus.SENT).toBe('sent');
      expect(ContactStatus.REPLIED).toBe('replied');
    });

    it('should export all named functions', async () => {
      const module = await import('../src/services/contactForm.js');
      expect(typeof module.submitContactForm).toBe('function');
      expect(typeof module.validateContactForm).toBe('function');
      expect(typeof module.validateEmail).toBe('function');
      expect(typeof module.getContactTypes).toBe('function');
      expect(typeof module.getContactTypeById).toBe('function');
      expect(typeof module.canSubmitContact).toBe('function');
      expect(typeof module.getContactHistory).toBe('function');
      expect(typeof module.getAllContactHistory).toBe('function');
      expect(typeof module.getSubmissionById).toBe('function');
      expect(typeof module.getContactStats).toBe('function');
      expect(typeof module.clearContactHistory).toBe('function');
      expect(typeof module.renderContactForm).toBe('function');
      expect(typeof module.renderContactHistory).toBe('function');
    });
  });

  // ==================== Integration Tests ====================
  describe('Integration Tests', () => {
    it('should handle complete submission lifecycle', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Integration test',
        message: 'This is a complete integration test for the contact form.',
      };

      // Submit form
      const result = submitContactForm(formData);
      expect(result.success).toBe(true);

      // Check it exists in history
      const history = getContactHistory();
      expect(history).toHaveLength(1);

      // Get by ID
      const submission = getSubmissionById(result.submission.id);
      expect(submission).toBeDefined();

      // Check stats
      const stats = getContactStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.question).toBe(1);
    });

    it('should validate and reject spam submissions', () => {
      const spamData = {
        name: 'Spammer',
        email: 'spam@example.com',
        type: 'question',
        subject: 'Buy our products!',
        message: 'This is a spam message with enough characters to pass length validation.',
        honeypot: 'spam_bot_filled_this',
      };

      const result = submitContactForm(spamData);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'honeypot')).toBe(true);
    });

    it('should handle all contact types', () => {
      const types = ['question', 'bug', 'suggestion', 'partnership', 'press'];

      types.forEach(type => {
        const typeObj = getContactTypeById(type);
        expect(typeObj).toBeDefined();
        expect(typeObj.id).toBe(type);
        expect(typeObj.label).toBeDefined();
        expect(typeObj.icon).toBeDefined();
      });
    });
  });

  // ==================== Edge Cases Tests ====================
  describe('Edge Cases', () => {
    it('should handle XSS in input fields', () => {
      const html = renderContactForm();
      expect(html).not.toContain('<script>');
    });

    it('should handle very long valid message', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'question',
        subject: 'Test subject',
        message: 'A'.repeat(4999), // Just under 5000 limit
      };

      const result = submitContactForm(validFormData);
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in name', () => {
      const validFormData = {
        name: 'Jean-Pierre Dupont',
        email: 'jean@example.com',
        type: 'question',
        subject: 'Test avec accents',
        message: 'This is a test message with unicode characters.',
      };

      const result = submitContactForm(validFormData);
      expect(result.success).toBe(true);
      expect(result.submission.name).toBe('Jean-Pierre Dupont');
    });

    it('should handle empty history gracefully', () => {
      mockStorage['spothitch_contact_history'] = null;
      const history = getContactHistory();
      expect(history).toEqual([]);
    });

    it('should handle corrupted storage data', () => {
      mockStorage['spothitch_contact_history'] = 'not an array';
      const history = getContactHistory();
      expect(history).toEqual([]);
    });
  });
});
