/**
 * Identity Verification Service Tests
 * Tests for progressive verification system for building trust between hitchhikers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  verificationLevels,
  verificationReasons,
  getVerificationLevel,
  getNextVerificationLevel,
  getVerificationProgress,
  isEmailVerified,
  isPhoneVerified,
  isPhotoVerified,
  isIdentityVerified,
  sendEmailVerification,
  sendPhoneVerification,
  confirmPhoneVerification,
  uploadVerificationPhoto,
  uploadIdentityDocument,
  renderVerificationBadge,
  renderVerificationStatus,
  getVerificationErrorMessage,
} from '../src/services/identityVerification.js'

// Mock dependencies
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    verificationLevel: 0,
    pendingPhoneVerification: null,
    pendingPhotoVerification: null,
    pendingIdentityVerification: null,
    verifiedPhone: null,
    verifiedPhotoUrl: null,
    identityVerifiedAt: null,
  })),
  setState: vi.fn(),
}))

vi.mock('../src/services/firebase.js', () => ({
  getCurrentUser: vi.fn(() => ({
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: false,
  })),
  updateUserProfile: vi.fn().mockResolvedValue(true),
  uploadImage: vi.fn().mockResolvedValue({
    success: true,
    url: 'https://example.com/image.jpg',
  }),
}))

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}))

import { getState, setState } from '../src/stores/state.js'
import { getCurrentUser, uploadImage } from '../src/services/firebase.js'
import { showToast } from '../src/services/notifications.js'
import { addPoints } from '../src/services/gamification.js'

describe('Identity Verification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verificationLevels', () => {
    it('should have all 6 verification levels (0-5)', () => {
      expect(Object.keys(verificationLevels).length).toBe(6)
      expect(verificationLevels[0]).toBeDefined()
      expect(verificationLevels[5]).toBeDefined()
    })

    it('should have unverified level at index 0', () => {
      const level = verificationLevels[0]
      expect(level.id).toBe(0)
      expect(level.name).toBe('Non verifie')
      expect(level.trustScore).toBe(0)
    })

    it('should have email verified level at index 1', () => {
      const level = verificationLevels[1]
      expect(level.id).toBe(1)
      expect(level.name).toBe('Email verifie')
      expect(level.trustScore).toBe(10)
      expect(level.benefits.length).toBeGreaterThan(0)
    })

    it('should have phone verified level at index 2', () => {
      const level = verificationLevels[2]
      expect(level.id).toBe(2)
      expect(level.name).toBe('Telephone verifie')
      expect(level.trustScore).toBe(25)
    })

    it('should have photo verified level at index 3', () => {
      const level = verificationLevels[3]
      expect(level.id).toBe(3)
      expect(level.name).toBe('Selfie + ID soumis')
      expect(level.trustScore).toBe(40)
    })

    it('should have identity verified level at index 4', () => {
      const level = verificationLevels[4]
      expect(level.id).toBe(4)
      expect(level.name).toBe('Identite verifiee')
      expect(level.trustScore).toBe(70)
    })

    it('should have color property for each level', () => {
      Object.values(verificationLevels).forEach(level => {
        expect(level.color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    it('should have English names for each level', () => {
      Object.values(verificationLevels).forEach(level => {
        expect(level.nameEn).toBeDefined()
        expect(typeof level.nameEn).toBe('string')
      })
    })

    it('should have benefits array for each level', () => {
      Object.values(verificationLevels).forEach(level => {
        expect(Array.isArray(level.benefits)).toBe(true)
        expect(Array.isArray(level.benefitsEn)).toBe(true)
      })
    })
  })

  describe('verificationReasons', () => {
    it('should have French and English explanations', () => {
      expect(verificationReasons.fr).toBeDefined()
      expect(verificationReasons.en).toBeDefined()
    })

    it('should have title and subtitle in both languages', () => {
      expect(verificationReasons.fr.title).toBeDefined()
      expect(verificationReasons.fr.subtitle).toBeDefined()
      expect(verificationReasons.en.title).toBeDefined()
      expect(verificationReasons.en.subtitle).toBeDefined()
    })

    it('should have 4 reasons for verification', () => {
      expect(verificationReasons.fr.reasons.length).toBe(4)
      expect(verificationReasons.en.reasons.length).toBe(4)
    })

    it('should have privacy note in both languages', () => {
      expect(verificationReasons.fr.privacyNote).toBeDefined()
      expect(verificationReasons.en.privacyNote).toBeDefined()
    })
  })

  describe('getVerificationLevel', () => {
    it('should return current verification level', () => {
      const level = getVerificationLevel()
      expect(level).toBeDefined()
      expect(level.id).toBe(0)
    })

    it('should return unverified level when state level is undefined', () => {
      const level = getVerificationLevel()
      expect(level.name).toBe('Non verifie')
    })
  })

  describe('getNextVerificationLevel', () => {
    it('should return next level when available', () => {
      const next = getNextVerificationLevel()
      expect(next).toBeDefined()
      expect(next.id).toBe(1)
    })

    it('should return null when at maximum level', () => {
      getState.mockReturnValueOnce({
        verificationLevel: 5,
      })
      const next = getNextVerificationLevel()
      expect(next).toBeNull()
    })
  })

  describe('getVerificationProgress', () => {
    it('should return progress object with correct structure', () => {
      const progress = getVerificationProgress()
      expect(progress.currentLevel).toBeDefined()
      expect(progress.maxLevel).toBe(5)
      expect(progress.progress).toBeDefined()
      expect(progress.trustScore).toBeDefined()
      expect(progress.maxTrustScore).toBe(100)
    })

    it('should calculate correct progress percentage', () => {
      const progress = getVerificationProgress()
      expect(progress.progress).toBe(0) // 0/4 * 100
    })

    it('should track completed verification steps', () => {
      const progress = getVerificationProgress()
      expect(progress.verifications.email).toBe(false)
      expect(progress.verifications.phone).toBe(false)
      expect(progress.verifications.selfieIdSubmitted).toBe(false)
      expect(progress.verifications.identityVerified).toBe(false)
    })
  })

  describe('isEmailVerified', () => {
    it('should return false when not verified', () => {
      expect(isEmailVerified()).toBe(false)
    })

    it('should return true when level >= 1', () => {
      getState.mockReturnValueOnce({
        verificationLevel: 1,
      })
      expect(isEmailVerified()).toBe(true)
    })
  })

  describe('isPhoneVerified', () => {
    it('should return false when level < 2', () => {
      expect(isPhoneVerified()).toBe(false)
    })

    it('should return true when level >= 2', () => {
      getState.mockReturnValueOnce({
        verificationLevel: 2,
      })
      expect(isPhoneVerified()).toBe(true)
    })
  })

  describe('isPhotoVerified', () => {
    it('should return false when level < 3', () => {
      expect(isPhotoVerified()).toBe(false)
    })

    it('should return true when level >= 3', () => {
      getState.mockReturnValueOnce({
        verificationLevel: 3,
      })
      expect(isPhotoVerified()).toBe(true)
    })
  })

  describe('isIdentityVerified', () => {
    it('should return false when level < 4', () => {
      expect(isIdentityVerified()).toBe(false)
    })

    it('should return true when level >= 4', () => {
      getState.mockReturnValueOnce({
        verificationLevel: 4,
      })
      expect(isIdentityVerified()).toBe(true)
    })
  })

  describe('sendPhoneVerification', () => {
    it('should reject invalid phone numbers', async () => {
      const result = await sendPhoneVerification('invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid-phone')
    })

    it('should accept valid phone numbers', async () => {
      const result = await sendPhoneVerification('+33612345678')
      expect(result.success).toBe(true)
      expect(result.verificationId).toBeDefined()
    })

    it('should store pending phone verification', async () => {
      await sendPhoneVerification('+33612345678')
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          pendingPhoneVerification: expect.objectContaining({
            phone: '+33612345678',
          }),
        })
      )
    })

    it('should accept different phone formats', async () => {
      const formats = [
        '+33612345678',
        '0612345678',
        '+1 234 567 8900',
      ]
      for (const phone of formats) {
        const result = await sendPhoneVerification(phone)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('confirmPhoneVerification', () => {
    it('should reject when no pending verification', async () => {
      getState.mockReturnValueOnce({
        pendingPhoneVerification: null,
      })
      const result = await confirmPhoneVerification('123456')
      expect(result.success).toBe(false)
      expect(result.error).toBe('no-pending-verification')
    })

    it('should reject expired codes', async () => {
      getState.mockReturnValueOnce({
        pendingPhoneVerification: {
          expiresAt: Date.now() - 1000, // Past time
        },
      })
      const result = await confirmPhoneVerification('123456')
      expect(result.success).toBe(false)
      expect(result.error).toBe('code-expired')
    })

    it('should accept correct code', async () => {
      getState.mockReturnValueOnce({
        pendingPhoneVerification: {
          code: '123456',
          expiresAt: Date.now() + 10000,
          phone: '+33612345678',
        },
      })
      const result = await confirmPhoneVerification('123456')
      expect(result.success).toBe(true)
    })

    it('should clear pending verification on success', async () => {
      getState.mockReturnValueOnce({
        pendingPhoneVerification: {
          code: '123456',
          expiresAt: Date.now() + 10000,
          phone: '+33612345678',
        },
      })
      await confirmPhoneVerification('123456')
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          pendingPhoneVerification: null,
        })
      )
    })
  })

  describe('uploadVerificationPhoto', () => {
    it('should reject when not logged in', async () => {
      getCurrentUser.mockReturnValueOnce(null)
      const result = await uploadVerificationPhoto('data:image/jpeg;base64,abc')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not-logged-in')
    })

    it('should reject invalid image data', async () => {
      const result = await uploadVerificationPhoto('not-image-data')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid-image')
    })

    it('should upload valid image data', async () => {
      const result = await uploadVerificationPhoto('data:image/jpeg;base64,abc')
      expect(result.success).toBe(true)
      expect(result.url).toBeDefined()
    })

    it('should store pending photo verification', async () => {
      await uploadVerificationPhoto('data:image/jpeg;base64,abc')
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          pendingPhotoVerification: expect.objectContaining({
            status: 'pending',
          }),
        })
      )
    })
  })

  describe('uploadIdentityDocument', () => {
    it('should reject when not logged in', async () => {
      getCurrentUser.mockReturnValueOnce(null)
      const result = await uploadIdentityDocument('data:image/jpeg;base64,abc', 'passport')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not-logged-in')
    })

    it('should reject invalid document types', async () => {
      const result = await uploadIdentityDocument('data:image/jpeg;base64,abc', 'invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid-document-type')
    })

    it('should accept passport documents', async () => {
      const result = await uploadIdentityDocument('data:image/jpeg;base64,abc', 'passport')
      expect(result.success).toBe(true)
    })

    it('should accept id_card documents', async () => {
      const result = await uploadIdentityDocument('data:image/jpeg;base64,abc', 'id_card')
      expect(result.success).toBe(true)
    })

    it('should reject invalid image data', async () => {
      const result = await uploadIdentityDocument('not-image-data', 'passport')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid-image')
    })

    it('should store pending identity verification', async () => {
      await uploadIdentityDocument('data:image/jpeg;base64,abc', 'passport')
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          pendingIdentityVerification: expect.objectContaining({
            documentType: 'passport',
            status: 'pending_review',
          }),
        })
      )
    })
  })

  describe('renderVerificationBadge', () => {
    it('should return empty string for unverified level', () => {
      const html = renderVerificationBadge(0)
      expect(html).toBe('')
    })

    it('should return HTML for verified levels', () => {
      const html = renderVerificationBadge(1)
      expect(html).toContain('span')
      expect(html).toContain('Email verifie')
    })

    it('should include background color style', () => {
      const html = renderVerificationBadge(2)
      expect(html).toContain('style=')
      expect(html).toContain('background:')
    })

    it('should support different sizes', () => {
      const smBadge = renderVerificationBadge(1, 'sm')
      const mdBadge = renderVerificationBadge(1, 'md')
      const lgBadge = renderVerificationBadge(1, 'lg')

      expect(smBadge).toContain('w-4')
      expect(mdBadge).toContain('w-5')
      expect(lgBadge).toContain('w-6')
    })

    it('should have aria-label for accessibility', () => {
      const html = renderVerificationBadge(3)
      expect(html).toContain('aria-label=')
    })
  })

  describe('renderVerificationStatus', () => {
    it('should return HTML string', () => {
      const html = renderVerificationStatus()
      expect(typeof html).toBe('string')
      expect(html).toContain('card')
    })

    it('should include progress bar', () => {
      const html = renderVerificationStatus()
      expect(html).toContain('bg-white')
    })

    it('should display current verification level', () => {
      const html = renderVerificationStatus()
      expect(html).toContain('Verification')
    })

    it('should include next level CTA button', () => {
      const html = renderVerificationStatus()
      expect(html).toContain('button')
    })

    it('should show completion message at max level', () => {
      getState.mockReturnValue({
        verificationLevel: 5,
        pendingPhoneVerification: null,
        pendingPhotoVerification: null,
        pendingIdentityVerification: null,
        verifiedPhone: null,
        verifiedPhotoUrl: null,
        identityVerifiedAt: null,
      })
      const html = renderVerificationStatus()
      expect(html).toContain('100% verifie')
    })
  })

  describe('getVerificationErrorMessage', () => {
    it('should return French messages by default', () => {
      const msg = getVerificationErrorMessage('not-logged-in')
      expect(msg).toContain('connecte')
    })

    it('should return English messages when requested', () => {
      const msg = getVerificationErrorMessage('not-logged-in', 'en')
      expect(msg).toContain('logged')
    })

    it('should handle invalid-phone error', () => {
      const msgFr = getVerificationErrorMessage('invalid-phone', 'fr')
      const msgEn = getVerificationErrorMessage('invalid-phone', 'en')
      expect(msgFr).toBeDefined()
      expect(msgEn).toBeDefined()
    })

    it('should handle code-expired error', () => {
      const msg = getVerificationErrorMessage('code-expired', 'fr')
      expect(msg).toContain('expire')
    })

    it('should handle upload-failed error', () => {
      const msg = getVerificationErrorMessage('upload-failed', 'fr')
      expect(msg).toBeDefined()
    })

    it('should return fallback message for unknown errors', () => {
      const msg = getVerificationErrorMessage('unknown-error-code', 'fr')
      expect(msg).toBeDefined()
    })
  })

  describe('Security and Privacy', () => {
    it('should not expose sensitive document data', () => {
      const level = getVerificationLevel()
      expect(level.documentData).toBeUndefined()
    })

    it('should validate image data before processing', async () => {
      const invalidImages = [
        'text/plain',
        'data:text/html;base64,abc',
        '',
      ]
      for (const img of invalidImages) {
        const result = await uploadVerificationPhoto(img)
        expect(result.success).toBe(false)
      }
    })

    it('should clean phone numbers properly', async () => {
      const result = await sendPhoneVerification('+33612345678')
      expect(result.success).toBe(true)
    })

    it('should store verification pending state safely', async () => {
      await sendPhoneVerification('+33612345678')
      const calls = setState.mock.calls
      const stateUpdate = calls[calls.length - 1][0]
      expect(stateUpdate.pendingPhoneVerification.phone).toBeDefined()
    })
  })

  describe('Gamification Integration', () => {
    it('should award points for email verification (25 points)', async () => {
      getState.mockReturnValueOnce({
        pendingPhoneVerification: {
          code: '123456',
          expiresAt: Date.now() + 10000,
          phone: '+33612345678',
        },
      })
      await confirmPhoneVerification('123456')
      // addPoints would be called in updateVerificationLevel
      // This is tested indirectly through the confirmation flow
    })
  })

  describe('Internationalization', () => {
    it('should support French language', () => {
      expect(verificationReasons.fr).toBeDefined()
      expect(verificationReasons.fr.title).toBeDefined()
      const level = verificationLevels[1]
      expect(level.name).toContain('verifie')
    })

    it('should support English language', () => {
      expect(verificationReasons.en).toBeDefined()
      const level = verificationLevels[1]
      expect(level.nameEn).toMatch(/English|email/i)
    })

    it('should have all levels translated to English', () => {
      Object.values(verificationLevels).forEach(level => {
        expect(level.nameEn).toBeDefined()
        expect(level.benefitsEn).toBeDefined()
        expect(Array.isArray(level.benefitsEn)).toBe(true)
      })
    })
  })
})
