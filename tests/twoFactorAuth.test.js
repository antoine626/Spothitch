/**
 * Two-Factor Authentication Service Tests
 * Tests for SMS/email verification codes for sensitive actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
const mockStorage = {}
const localStorageMock = {
  getItem: vi.fn((key) => mockStorage[key] || null),
  setItem: vi.fn((key, value) => { mockStorage[key] = value }),
  removeItem: vi.fn((key) => { delete mockStorage[key] }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]) })
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn()
}))

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { email: 'test@example.com', uid: 'test-uid' },
    lang: 'fr'
  })),
  setState: vi.fn()
}))

// Import after mocks
import {
  generateVerificationCode,
  is2FAEnabled,
  get2FAMethod,
  requiresTwoFactor,
  enable2FA,
  disable2FA,
  startVerification,
  verifyCode,
  resendVerificationCode,
  clearVerificationState,
  getVerificationState,
  getVerifiedPhone,
  startSensitiveAction,
  completeSensitiveAction,
  render2FAModal,
  render2FASettings,
  TwoFactorMethod,
  SensitiveAction,
  CODE_LENGTH,
  CODE_EXPIRY_MS,
  MAX_VERIFICATION_ATTEMPTS,
  RESEND_COOLDOWN_MS
} from '../src/services/twoFactorAuth.js'

describe('Two-Factor Authentication Service', () => {
  beforeEach(() => {
    // Clear mocks and storage
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    clearVerificationState()
  })

  afterEach(() => {
    clearVerificationState()
  })

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should export TwoFactorMethod enum', () => {
      expect(TwoFactorMethod).toBeDefined()
      expect(TwoFactorMethod.EMAIL).toBe('email')
      expect(TwoFactorMethod.SMS).toBe('sms')
      expect(TwoFactorMethod.NONE).toBe('none')
    })

    it('should export SensitiveAction enum', () => {
      expect(SensitiveAction).toBeDefined()
      expect(SensitiveAction.DELETE_ACCOUNT).toBe('delete_account')
      expect(SensitiveAction.CHANGE_EMAIL).toBe('change_email')
      expect(SensitiveAction.CHANGE_PASSWORD).toBe('change_password')
      expect(SensitiveAction.CHANGE_PHONE).toBe('change_phone')
      expect(SensitiveAction.DISABLE_2FA).toBe('disable_2fa')
      expect(SensitiveAction.EXPORT_DATA).toBe('export_data')
    })

    it('should have correct CODE_LENGTH', () => {
      expect(CODE_LENGTH).toBe(6)
    })

    it('should have correct CODE_EXPIRY_MS (10 minutes)', () => {
      expect(CODE_EXPIRY_MS).toBe(10 * 60 * 1000)
    })

    it('should have correct MAX_VERIFICATION_ATTEMPTS', () => {
      expect(MAX_VERIFICATION_ATTEMPTS).toBe(5)
    })

    it('should have correct RESEND_COOLDOWN_MS (60 seconds)', () => {
      expect(RESEND_COOLDOWN_MS).toBe(60 * 1000)
    })
  })

  // ==================== generateVerificationCode ====================

  describe('generateVerificationCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateVerificationCode()
      expect(code).toHaveLength(6)
    })

    it('should generate only numeric codes', () => {
      const code = generateVerificationCode()
      expect(/^\d{6}$/.test(code)).toBe(true)
    })

    it('should generate different codes', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(generateVerificationCode())
      }
      // Should have at least 90 unique codes out of 100
      expect(codes.size).toBeGreaterThan(90)
    })

    it('should generate codes in range 100000-999999', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateVerificationCode()
        const num = parseInt(code, 10)
        expect(num).toBeGreaterThanOrEqual(100000)
        expect(num).toBeLessThanOrEqual(999999)
      }
    })
  })

  // ==================== is2FAEnabled ====================

  describe('is2FAEnabled', () => {
    it('should return false when not enabled', () => {
      expect(is2FAEnabled()).toBe(false)
    })

    it('should return true when enabled', () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      expect(is2FAEnabled()).toBe(true)
    })

    it('should return false for invalid values', () => {
      mockStorage['spothitch_2fa_enabled'] = 'false'
      expect(is2FAEnabled()).toBe(false)

      mockStorage['spothitch_2fa_enabled'] = 'invalid'
      expect(is2FAEnabled()).toBe(false)
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      expect(is2FAEnabled()).toBe(false)
    })
  })

  // ==================== get2FAMethod ====================

  describe('get2FAMethod', () => {
    it('should return NONE when no method set', () => {
      expect(get2FAMethod()).toBe(TwoFactorMethod.NONE)
    })

    it('should return EMAIL when set to email', () => {
      mockStorage['spothitch_2fa_method'] = 'email'
      expect(get2FAMethod()).toBe(TwoFactorMethod.EMAIL)
    })

    it('should return SMS when set to sms', () => {
      mockStorage['spothitch_2fa_method'] = 'sms'
      expect(get2FAMethod()).toBe(TwoFactorMethod.SMS)
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      expect(get2FAMethod()).toBe(TwoFactorMethod.NONE)
    })
  })

  // ==================== requiresTwoFactor ====================

  describe('requiresTwoFactor', () => {
    it('should always require 2FA for DELETE_ACCOUNT', () => {
      expect(requiresTwoFactor(SensitiveAction.DELETE_ACCOUNT)).toBe(true)
    })

    it('should always require 2FA for CHANGE_EMAIL', () => {
      expect(requiresTwoFactor(SensitiveAction.CHANGE_EMAIL)).toBe(true)
    })

    it('should always require 2FA for DISABLE_2FA', () => {
      expect(requiresTwoFactor(SensitiveAction.DISABLE_2FA)).toBe(true)
    })

    it('should not require 2FA for CHANGE_PASSWORD when 2FA disabled', () => {
      expect(requiresTwoFactor(SensitiveAction.CHANGE_PASSWORD)).toBe(false)
    })

    it('should require 2FA for CHANGE_PASSWORD when 2FA enabled', () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      expect(requiresTwoFactor(SensitiveAction.CHANGE_PASSWORD)).toBe(true)
    })

    it('should not require 2FA for EXPORT_DATA when 2FA disabled', () => {
      expect(requiresTwoFactor(SensitiveAction.EXPORT_DATA)).toBe(false)
    })

    it('should require 2FA for EXPORT_DATA when 2FA enabled', () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      expect(requiresTwoFactor(SensitiveAction.EXPORT_DATA)).toBe(true)
    })

    it('should not require 2FA for unknown actions', () => {
      expect(requiresTwoFactor('unknown_action')).toBe(false)
    })
  })

  // ==================== enable2FA ====================

  describe('enable2FA', () => {
    it('should reject invalid method', async () => {
      const result = await enable2FA(null, 'test@example.com')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_method')
    })

    it('should reject NONE method', async () => {
      const result = await enable2FA(TwoFactorMethod.NONE, 'test@example.com')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_method')
    })

    it('should reject missing target', async () => {
      const result = await enable2FA(TwoFactorMethod.EMAIL, null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_target')
    })

    it('should reject invalid email format', async () => {
      const result = await enable2FA(TwoFactorMethod.EMAIL, 'invalid-email')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_email')
    })

    it('should accept valid email', async () => {
      const result = await enable2FA(TwoFactorMethod.EMAIL, 'test@example.com')
      expect(result.success).toBe(true)
      expect(result.message).toContain('email')
    })

    it('should reject invalid phone format', async () => {
      const result = await enable2FA(TwoFactorMethod.SMS, 'abc')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_phone')
    })

    it('should accept valid phone number', async () => {
      const result = await enable2FA(TwoFactorMethod.SMS, '+33612345678')
      expect(result.success).toBe(true)
      expect(result.message).toContain('SMS')
    })

    it('should accept phone number with spaces', async () => {
      const result = await enable2FA(TwoFactorMethod.SMS, '+33 6 12 34 56 78')
      expect(result.success).toBe(true)
    })
  })

  // ==================== disable2FA ====================

  describe('disable2FA', () => {
    it('should fail if 2FA not enabled', async () => {
      const result = await disable2FA()
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_enabled')
    })

    it('should succeed if 2FA is enabled', async () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      mockStorage['spothitch_2fa_method'] = 'email'

      const result = await disable2FA()
      expect(result.success).toBe(true)
    })

    it('should remove 2FA settings from storage', async () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      mockStorage['spothitch_2fa_method'] = 'email'

      await disable2FA()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('spothitch_2fa_enabled')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('spothitch_2fa_method')
    })
  })

  // ==================== startVerification ====================

  describe('startVerification', () => {
    it('should generate a code and return success', async () => {
      const result = await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      expect(result.success).toBe(true)
      expect(result.expiresAt).toBeDefined()
      expect(result.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should store code in localStorage', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should enforce resend cooldown', async () => {
      // First send
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      // Immediate resend should fail
      const result = await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      expect(result.success).toBe(false)
      expect(result.error).toBe('cooldown')
      expect(result.remainingSeconds).toBeGreaterThan(0)
    })

    it('should reset attempts when starting new verification', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const state = getVerificationState()
      expect(state.attemptsRemaining).toBe(MAX_VERIFICATION_ATTEMPTS)
    })
  })

  // ==================== verifyCode ====================

  describe('verifyCode', () => {
    it('should fail if no pending verification', () => {
      const result = verifyCode('123456')
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_pending')
    })

    it('should fail for invalid format (too short)', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const result = verifyCode('12345')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_format')
    })

    it('should fail for invalid format (non-numeric)', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const result = verifyCode('12345a')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_format')
    })

    it('should fail for incorrect code', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const result = verifyCode('000000')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_code')
    })

    it('should track attempts remaining', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const result1 = verifyCode('000000')
      expect(result1.attemptsRemaining).toBe(MAX_VERIFICATION_ATTEMPTS - 1)

      const result2 = verifyCode('000001')
      expect(result2.attemptsRemaining).toBe(MAX_VERIFICATION_ATTEMPTS - 2)
    })

    it('should fail after max attempts', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      // Use up all attempts (5 failed attempts increments counter to 5)
      for (let i = 0; i < MAX_VERIFICATION_ATTEMPTS; i++) {
        verifyCode('000000')
      }

      // The 6th call should trigger max_attempts error (attempts >= 5)
      const result = verifyCode('000000')
      expect(result.success).toBe(false)
      expect(result.error).toBe('max_attempts')

      // Subsequent calls should fail with no_pending since state is cleared
      const result2 = verifyCode('000000')
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('no_pending')
    })

    it('should succeed with correct code', async () => {
      const startResult = await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      // Get the code from dev mode result
      const code = startResult.code

      const result = verifyCode(code)
      expect(result.success).toBe(true)
      expect(result.message).toContain('succes')
    })

    it('should save 2FA settings on enable_2fa action', async () => {
      const startResult = await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'enable_2fa')
      const code = startResult.code

      verifyCode(code)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('spothitch_2fa_enabled', 'true')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('spothitch_2fa_method', TwoFactorMethod.EMAIL)
    })

    it('should clear verification state after success', async () => {
      const startResult = await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')
      const code = startResult.code

      verifyCode(code)

      const state = getVerificationState()
      expect(state.hasPendingVerification).toBe(false)
    })
  })

  // ==================== resendVerificationCode ====================

  describe('resendVerificationCode', () => {
    it('should fail if no pending verification', async () => {
      const result = await resendVerificationCode()
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_pending')
    })

    it('should enforce cooldown on resend', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const result = await resendVerificationCode()
      expect(result.success).toBe(false)
      expect(result.error).toBe('cooldown')
    })
  })

  // ==================== clearVerificationState ====================

  describe('clearVerificationState', () => {
    it('should clear all verification state', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      clearVerificationState()

      const state = getVerificationState()
      expect(state.hasPendingVerification).toBe(false)
      expect(state.pendingAction).toBeNull()
    })

    it('should remove localStorage entries', () => {
      clearVerificationState()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('spothitch_pending_2fa_code')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('spothitch_2fa_code_expiry')
    })
  })

  // ==================== getVerificationState ====================

  describe('getVerificationState', () => {
    it('should return inactive state when no verification', () => {
      const state = getVerificationState()

      expect(state.hasPendingVerification).toBe(false)
      expect(state.pendingAction).toBeNull()
      expect(state.method).toBeNull()
      expect(state.remainingTimeSeconds).toBe(0)
    })

    it('should return active state when verification pending', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const state = getVerificationState()

      expect(state.hasPendingVerification).toBe(true)
      expect(state.pendingAction).toBe('test_action')
      expect(state.method).toBe(TwoFactorMethod.EMAIL)
      expect(state.remainingTimeSeconds).toBeGreaterThan(0)
      expect(state.attemptsRemaining).toBe(MAX_VERIFICATION_ATTEMPTS)
    })

    it('should return masked email target', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const state = getVerificationState()

      expect(state.targetMasked).toContain('@example.com')
      expect(state.targetMasked).toContain('*')
    })

    it('should return masked phone target', async () => {
      await startVerification(TwoFactorMethod.SMS, '+33612345678', 'test_action')

      const state = getVerificationState()

      expect(state.targetMasked).toContain('5678')
      expect(state.targetMasked).toContain('*')
    })
  })

  // ==================== getVerifiedPhone ====================

  describe('getVerifiedPhone', () => {
    it('should return null when no phone stored', () => {
      expect(getVerifiedPhone()).toBeNull()
    })

    it('should return stored phone', () => {
      mockStorage['spothitch_verified_phone'] = '+33612345678'
      expect(getVerifiedPhone()).toBe('+33612345678')
    })
  })

  // ==================== startSensitiveAction ====================

  describe('startSensitiveAction', () => {
    it('should not require verification for non-sensitive actions', async () => {
      const result = await startSensitiveAction('some_action')
      expect(result.success).toBe(true)
      expect(result.requiresVerification).toBe(false)
    })

    it('should require verification for DELETE_ACCOUNT', async () => {
      const result = await startSensitiveAction(SensitiveAction.DELETE_ACCOUNT)
      expect(result.requiresVerification).toBe(true)
    })

    it('should require verification for CHANGE_EMAIL', async () => {
      const result = await startSensitiveAction(SensitiveAction.CHANGE_EMAIL)
      expect(result.requiresVerification).toBe(true)
    })

    it('should use email as fallback when no method configured', async () => {
      const result = await startSensitiveAction(SensitiveAction.DELETE_ACCOUNT)

      expect(result.success).toBe(true)
      expect(result.requiresVerification).toBe(true)
    })
  })

  // ==================== completeSensitiveAction ====================

  describe('completeSensitiveAction', () => {
    it('should fail with invalid code', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')

      const result = await completeSensitiveAction('000000', () => {})
      expect(result.success).toBe(false)
    })

    it('should execute callback on successful verification', async () => {
      const startResult = await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')
      const code = startResult.code

      const callback = vi.fn().mockResolvedValue('action_result')

      const result = await completeSensitiveAction(code, callback)

      expect(result.success).toBe(true)
      expect(callback).toHaveBeenCalled()
      expect(result.actionResult).toBe('action_result')
    })

    it('should handle callback errors', async () => {
      const startResult = await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')
      const code = startResult.code

      const callback = vi.fn().mockRejectedValue(new Error('Action failed'))

      const result = await completeSensitiveAction(code, callback)

      expect(result.success).toBe(false)
      expect(result.error).toBe('action_failed')
    })
  })

  // ==================== render2FAModal ====================

  describe('render2FAModal', () => {
    beforeEach(async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test_action')
    })

    it('should return HTML string', () => {
      const html = render2FAModal()
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('should include modal container', () => {
      const html = render2FAModal()
      expect(html).toContain('id="2fa-modal"')
      expect(html).toContain('role="dialog"')
    })

    it('should include code input', () => {
      const html = render2FAModal()
      expect(html).toContain('id="2fa-code"')
      expect(html).toContain('inputmode="numeric"')
      expect(html).toContain('maxlength="6"')
    })

    it('should include verify button', () => {
      const html = render2FAModal()
      expect(html).toContain('type="submit"')
      expect(html).toContain('Verifier')
    })

    it('should include resend button by default', () => {
      const html = render2FAModal()
      expect(html).toContain('id="2fa-resend-btn"')
      expect(html).toContain('Renvoyer le code')
    })

    it('should hide resend button when showResend is false', () => {
      const html = render2FAModal({ showResend: false })
      expect(html).not.toContain('id="2fa-resend-btn"')
    })

    it('should include custom title', () => {
      const html = render2FAModal({ title: 'Custom Title' })
      expect(html).toContain('Custom Title')
    })

    it('should include attempts remaining', () => {
      const html = render2FAModal()
      expect(html).toContain('tentatives restantes')
    })

    it('should include expiry countdown', () => {
      const html = render2FAModal()
      expect(html).toContain('Le code expire dans')
    })

    it('should have accessible structure', () => {
      const html = render2FAModal()
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="2fa-title"')
      expect(html).toContain('aria-describedby="2fa-help"')
      expect(html).toContain('role="alert"')
      expect(html).toContain('aria-live="polite"')
    })
  })

  // ==================== render2FASettings ====================

  describe('render2FASettings', () => {
    it('should return HTML string', () => {
      const html = render2FASettings()
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('should show disabled state when 2FA not enabled', () => {
      const html = render2FASettings()
      expect(html).toContain('Desactive')
      expect(html).toContain('Activer')
    })

    it('should show enabled state when 2FA is enabled', () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      mockStorage['spothitch_2fa_method'] = 'email'

      const html = render2FASettings()
      expect(html).toContain('Active via Email')
      expect(html).toContain('Desactiver')
    })

    it('should show verified phone when available', () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      mockStorage['spothitch_2fa_method'] = 'sms'
      mockStorage['spothitch_verified_phone'] = '+33612345678'

      const html = render2FASettings()
      expect(html).toContain('Telephone verifie')
      expect(html).toContain('5678') // Last 4 digits
    })

    it('should include change method button when enabled', () => {
      mockStorage['spothitch_2fa_enabled'] = 'true'
      mockStorage['spothitch_2fa_method'] = 'email'

      const html = render2FASettings()
      expect(html).toContain('Changer de methode')
    })

    it('should include explanation when disabled', () => {
      const html = render2FASettings()
      expect(html).toContain('proteger votre compte')
    })

    it('should include toggle button', () => {
      const html = render2FASettings()
      expect(html).toContain('onclick="window.toggle2FA()"')
    })
  })

  // ==================== Email masking ====================

  describe('Email masking', () => {
    it('should mask email correctly', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'john@example.com', 'test')
      const state = getVerificationState()

      expect(state.targetMasked).toBe('j**n@example.com')
    })

    it('should handle short local part', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'ab@example.com', 'test')
      const state = getVerificationState()

      expect(state.targetMasked).toBe('a*@example.com')
    })

    it('should handle single char local part', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'a@example.com', 'test')
      const state = getVerificationState()

      expect(state.targetMasked).toBe('a*@example.com')
    })
  })

  // ==================== Phone masking ====================

  describe('Phone masking', () => {
    it('should mask phone correctly', async () => {
      await startVerification(TwoFactorMethod.SMS, '+33612345678', 'test')
      const state = getVerificationState()

      expect(state.targetMasked).toContain('5678')
      expect(state.targetMasked).toContain('*')
    })

    it('should show only last 4 digits', async () => {
      await startVerification(TwoFactorMethod.SMS, '0612345678', 'test')
      const state = getVerificationState()

      // Should mask first 6 digits and show last 4
      expect(state.targetMasked).toBe('******5678')
    })
  })

  // ==================== Code expiry ====================

  describe('Code expiry', () => {
    it('should set correct expiry time', async () => {
      const before = Date.now()
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test')
      const after = Date.now()

      const state = getVerificationState()
      const expectedExpiry = before + CODE_EXPIRY_MS

      // Remaining time should be close to 10 minutes
      expect(state.remainingTimeSeconds).toBeLessThanOrEqual(600)
      expect(state.remainingTimeSeconds).toBeGreaterThan(590)
    })
  })

  // ==================== Integration tests ====================

  describe('Integration tests', () => {
    it('should complete full enable 2FA flow', async () => {
      // Start enable flow
      const enableResult = await enable2FA(TwoFactorMethod.EMAIL, 'test@example.com')
      expect(enableResult.success).toBe(true)

      // Get the code
      const state = getVerificationState()
      expect(state.hasPendingVerification).toBe(true)

      // Verify with correct code (get code from storage in test)
      const code = mockStorage['spothitch_pending_2fa_code']
      const verifyResult = verifyCode(code)
      expect(verifyResult.success).toBe(true)

      // Check 2FA is now enabled
      expect(is2FAEnabled()).toBe(true)
      expect(get2FAMethod()).toBe(TwoFactorMethod.EMAIL)
    })

    it('should complete full sensitive action flow', async () => {
      // Enable 2FA first
      mockStorage['spothitch_2fa_enabled'] = 'true'
      mockStorage['spothitch_2fa_method'] = 'email'

      // Start sensitive action
      const startResult = await startSensitiveAction(SensitiveAction.DELETE_ACCOUNT)
      expect(startResult.requiresVerification).toBe(true)

      // Get code
      const code = mockStorage['spothitch_pending_2fa_code']

      // Complete action
      const actionExecuted = vi.fn().mockResolvedValue('deleted')
      const result = await completeSensitiveAction(code, actionExecuted)

      expect(result.success).toBe(true)
      expect(actionExecuted).toHaveBeenCalled()
    })

    it('should handle multiple failed attempts then success', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test')

      // Fail a few times
      verifyCode('000000')
      verifyCode('000001')
      verifyCode('000002')

      // Check attempts
      let state = getVerificationState()
      expect(state.attemptsRemaining).toBe(MAX_VERIFICATION_ATTEMPTS - 3)

      // Now succeed with correct code
      const code = mockStorage['spothitch_pending_2fa_code']
      const result = verifyCode(code)

      expect(result.success).toBe(true)
    })
  })

  // ==================== Edge cases ====================

  describe('Edge cases', () => {
    it('should handle empty code input', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test')

      const result = verifyCode('')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_format')
    })

    it('should handle null code input', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test')

      const result = verifyCode(null)
      expect(result.success).toBe(false)
    })

    it('should handle undefined code input', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test')

      const result = verifyCode(undefined)
      expect(result.success).toBe(false)
    })

    it('should handle whitespace in code', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test')

      const result = verifyCode('  123456  ')
      // Should fail because whitespace makes it invalid format
      expect(result.success).toBe(false)
    })

    it('should handle code with letters', async () => {
      await startVerification(TwoFactorMethod.EMAIL, 'test@example.com', 'test')

      const result = verifyCode('12345A')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_format')
    })
  })

  // ==================== Default export ====================

  describe('Default export', () => {
    it('should export all functions and constants', async () => {
      const module = await import('../src/services/twoFactorAuth.js')

      // Constants
      expect(module.default.TwoFactorMethod).toBeDefined()
      expect(module.default.SensitiveAction).toBeDefined()
      expect(module.default.CODE_LENGTH).toBe(6)
      expect(module.default.CODE_EXPIRY_MS).toBe(CODE_EXPIRY_MS)
      expect(module.default.MAX_VERIFICATION_ATTEMPTS).toBe(5)
      expect(module.default.RESEND_COOLDOWN_MS).toBe(RESEND_COOLDOWN_MS)

      // Core functions
      expect(typeof module.default.generateVerificationCode).toBe('function')
      expect(typeof module.default.is2FAEnabled).toBe('function')
      expect(typeof module.default.get2FAMethod).toBe('function')
      expect(typeof module.default.requiresTwoFactor).toBe('function')
      expect(typeof module.default.enable2FA).toBe('function')
      expect(typeof module.default.disable2FA).toBe('function')
      expect(typeof module.default.startVerification).toBe('function')
      expect(typeof module.default.verifyCode).toBe('function')
      expect(typeof module.default.resendVerificationCode).toBe('function')
      expect(typeof module.default.clearVerificationState).toBe('function')
      expect(typeof module.default.getVerificationState).toBe('function')
      expect(typeof module.default.getVerifiedPhone).toBe('function')

      // Sensitive actions
      expect(typeof module.default.startSensitiveAction).toBe('function')
      expect(typeof module.default.completeSensitiveAction).toBe('function')

      // UI
      expect(typeof module.default.render2FAModal).toBe('function')
      expect(typeof module.default.render2FASettings).toBe('function')
      expect(typeof module.default.show2FAModal).toBe('function')
      expect(typeof module.default.init2FAHandlers).toBe('function')
    })
  })
})
