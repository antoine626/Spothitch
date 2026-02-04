/**
 * Tests for Age Verification Component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAge,
  validateBirthDate,
  renderAgeVerification,
  MINIMUM_AGE,
} from '../src/components/modals/AgeVerification.js';

describe('Age Verification Component', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly for past birthdate', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const age = calculateAge(birthDate);
      expect(age).toBe(25);
    });

    it('should calculate age correctly when birthday has passed this year', () => {
      const today = new Date();
      const monthPassed = today.getMonth() > 0; // If current month > January
      const birthDate = new Date(today.getFullYear() - 30, 0, 1); // January 1st
      const age = calculateAge(birthDate);
      expect(age).toBe(monthPassed ? 30 : 29);
    });

    it('should calculate age correctly when birthday hasn\'t passed this year', () => {
      const today = new Date();
      const monthNotPassed = today.getMonth() < 11; // If current month < December
      const birthDate = new Date(today.getFullYear() - 20, 11, 31); // December 31st
      const age = calculateAge(birthDate);
      expect(age).toBe(monthNotPassed ? 19 : 20);
    });

    it('should handle string dates', () => {
      const today = new Date();
      const birthDateString = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate()).toISOString().split('T')[0];
      const age = calculateAge(birthDateString);
      expect(age).toBe(16);
    });

    it('should calculate age 0 for very recent birthdate', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const age = calculateAge(birthDate);
      expect(age).toBe(0);
    });
  });

  describe('validateBirthDate', () => {
    it('should reject empty date', () => {
      const result = validateBirthDate('');
      expect(result.isValid).toBe(false);
      expect(result.age).toBeNull();
    });

    it('should reject invalid date format', () => {
      const result = validateBirthDate('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.age).toBeNull();
    });

    it('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDateString = tomorrow.toISOString().split('T')[0];
      const result = validateBirthDate(futureDateString);
      expect(result.isValid).toBe(false);
      expect(result.age).toBeNull();
    });

    it('should reject age under minimum', () => {
      const today = new Date();
      const tooYoung = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
      const tooYoungString = tooYoung.toISOString().split('T')[0];
      const result = validateBirthDate(tooYoungString);
      expect(result.isValid).toBe(false);
      expect(result.tooYoung).toBe(true);
      expect(result.age).toBe(15);
    });

    it('should accept age equal to minimum', () => {
      const today = new Date();
      const minimum = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      const minimumString = minimum.toISOString().split('T')[0];
      const result = validateBirthDate(minimumString);
      expect(result.isValid).toBe(true);
      expect(result.age).toBe(16);
    });

    it('should accept age above minimum', () => {
      const today = new Date();
      const valid = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const validString = valid.toISOString().split('T')[0];
      const result = validateBirthDate(validString);
      expect(result.isValid).toBe(true);
      expect(result.age).toBe(25);
    });

    it('should reject unreasonable ages', () => {
      // Age over 120 years
      const tooOld = new Date(1800, 0, 1);
      const tooOldString = tooOld.toISOString().split('T')[0];
      const result = validateBirthDate(tooOldString);
      expect(result.isValid).toBe(false);
    });
  });

  describe('renderAgeVerification', () => {
    it('should render age verification modal', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('birth-date');
    });

    it('should include date input field', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('type="date"');
      expect(html).toContain('id="birth-date"');
    });

    it('should include error message container', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('id="age-error-message"');
      expect(html).toContain('id="age-error-text"');
    });

    it('should include age display container', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('id="age-display"');
      expect(html).toContain('id="age-value"');
    });

    it('should include too young message', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('id="too-young-message"');
    });

    it('should have submit button', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('id="age-submit-btn"');
      expect(html).toContain('type="submit"');
    });

    it('should include form element', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('id="age-verification-form"');
      expect(html).toContain('onsubmit="handleAgeVerification(event)"');
    });

    it('should have proper accessibility attributes', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="age-verification-title"');
      expect(html).toContain('aria-describedby="age-verification-desc"');
      expect(html).toContain('aria-required="true"');
    });

    it('should include GDPR footer note', () => {
      const state = { lang: 'fr' };
      const html = renderAgeVerification(state);
      expect(html).toContain('GDPR');
    });
  });

  describe('MINIMUM_AGE constant', () => {
    it('should be set to 16', () => {
      expect(MINIMUM_AGE).toBe(16);
    });
  });

  describe('Age validation edge cases', () => {
    it('should handle leap year birthdays correctly', () => {
      // Person born on Feb 29, 2000
      const birthDate = new Date(2000, 1, 29); // February 29
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(23); // Should be 24 if current date is after Feb 29
    });

    it('should validate date at exact minimum age', () => {
      const today = new Date();
      const exactMinimum = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      const result = validateBirthDate(exactMinimum.toISOString().split('T')[0]);
      expect(result.isValid).toBe(true);
      expect(result.age).toBe(16);
    });

    it('should reject date just before minimum age threshold', () => {
      // Test with a person born on March 15, 2010 (currently 15 years old in Feb 2026)
      const birthDate = new Date(2010, 2, 15); // March 15, 2010
      const result = validateBirthDate(birthDate.toISOString().split('T')[0]);
      // In February 2026, this person is 15 years old (birthday is in March)
      expect(result.isValid).toBe(false);
      expect(result.age).toBe(15);
      expect(result.tooYoung).toBe(true);
    });
  });

  describe('User feedback messages', () => {
    it('should provide appropriate message for valid age', () => {
      const today = new Date();
      const validAge = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      const result = validateBirthDate(validAge.toISOString().split('T')[0]);
      expect(result.isValid).toBe(true);
      expect(result.message).toBeNull();
    });

    it('should provide appropriate message for age too young', () => {
      const today = new Date();
      const tooYoung = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
      const result = validateBirthDate(tooYoung.toISOString().split('T')[0]);
      expect(result.isValid).toBe(false);
      expect(result.message).toBeTruthy();
      expect(result.tooYoung).toBe(true);
    });

    it('should provide appropriate message for invalid format', () => {
      const result = validateBirthDate('25-02-2000');
      expect(result.isValid).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('should provide appropriate message for future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = validateBirthDate(tomorrow.toISOString().split('T')[0]);
      expect(result.isValid).toBe(false);
      expect(result.message).toBeTruthy();
    });
  });
});
