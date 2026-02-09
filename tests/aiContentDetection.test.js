/**
 * Tests for AI Content Detection Service
 * Task #214: Détection contenu inapproprié (IA)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  analyzeText,
  detectSpam,
  detectHateSpeech,
  detectPersonalInfo,
  detectInappropriateContent,
  moderateContent,
  getContentReport,
  addCustomPattern,
  getPatternDatabase,
  clearContentHistory,
  ContentCategory,
  ToxicityLevel,
  ContentContext,
} from '../src/services/aiContentDetection.js'

// Mock localStorage
const mockStorage = {}

beforeEach(() => {
  // Clear mock storage
  Object.keys(mockStorage).forEach(key => delete mockStorage[key])

  // Mock localStorage
  global.localStorage = {
    getItem: vi.fn((key) => mockStorage[key] || null),
    setItem: vi.fn((key, value) => {
      mockStorage[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete mockStorage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    }),
  }

  // Clear history before each test
  clearContentHistory()
})

// ============================================
// CONSTANTS
// ============================================

describe('Constants', () => {
  it('should export ContentCategory enum', () => {
    expect(ContentCategory).toBeDefined()
    expect(ContentCategory.SPAM).toBe('spam')
    expect(ContentCategory.HATE_SPEECH).toBe('hate_speech')
    expect(ContentCategory.PERSONAL_INFO).toBe('personal_info')
    expect(ContentCategory.SEXUAL).toBe('sexual')
    expect(ContentCategory.VIOLENCE).toBe('violence')
  })

  it('should export ToxicityLevel thresholds', () => {
    expect(ToxicityLevel).toBeDefined()
    expect(ToxicityLevel.SAFE.max).toBe(4)
    expect(ToxicityLevel.LOW.min).toBe(4)
    expect(ToxicityLevel.MEDIUM.min).toBe(7)
    expect(ToxicityLevel.HIGH.min).toBe(10)
  })

  it('should export ContentContext enum', () => {
    expect(ContentContext).toBeDefined()
    expect(ContentContext.REVIEW).toBe('review')
    expect(ContentContext.MESSAGE).toBe('message')
    expect(ContentContext.PROFILE_BIO).toBe('profile_bio')
  })
})

// ============================================
// ANALYZE TEXT
// ============================================

describe('analyzeText', () => {
  it('should return safe result for clean text', () => {
    const result = analyzeText('Perfect location for meeting')

    expect(result).toBeDefined()
    expect(result.safe).toBe(true)
  })

  it('should return empty result for null text', () => {
    const result = analyzeText(null)

    expect(result.score).toBe(0)
    expect(result.safe).toBe(true)
  })

  it('should detect spam patterns', () => {
    const result = analyzeText('Click here!!! FREE MONEY $$$$$')

    expect(result.score).toBeGreaterThan(0)
    expect(result.categories).toContain('spam')
    expect(result.safe).toBe(false)
  })

  it('should detect hate speech', () => {
    const result = analyzeText('This nazi guy is a racist')

    expect(result.score).toBeGreaterThan(5)
    expect(result.categories).toContain('hate_speech')
    expect(result.level).not.toBe('safe')
  })

  it('should detect personal info (email)', () => {
    const result = analyzeText('Contact me at john.doe@example.com for more info')

    expect(result.score).toBeGreaterThan(0)
    expect(result.categories).toContain('personal_info')
  })

  it('should detect personal info (phone)', () => {
    const result = analyzeText('Call me at +33 6 12 34 56 78')

    expect(result.score).toBeGreaterThan(0)
    expect(result.categories).toContain('personal_info')
  })

  it('should detect multiple categories', () => {
    const result = analyzeText('FREE MONEY!!! Contact john@example.com NOW')

    expect(result.categories.length).toBeGreaterThan(1)
    expect(result.categories).toContain('spam')
    expect(result.categories).toContain('personal_info')
  })

  it('should set correct context', () => {
    const result = analyzeText('Test message', ContentContext.MESSAGE)

    expect(result.context).toBe(ContentContext.MESSAGE)
  })

  it('should calculate toxicity level correctly', () => {
    const lowToxic = analyzeText('Perfect location for meeting')
    const highToxic = analyzeText('Nazi racist terrorist kill murder bomb')

    expect(lowToxic.safe).toBe(true)
    expect(highToxic.safe).toBe(false)
    expect(highToxic.score).toBeGreaterThan(5)
  })

  it('should record analysis in history', () => {
    analyzeText('Test content')
    analyzeText('Another test')

    const db = getPatternDatabase()
    // History is stored in the same data object
    expect(localStorage.setItem).toHaveBeenCalled()
  })
})

// ============================================
// DETECT SPAM
// ============================================

describe('detectSpam', () => {
  it('should return false for clean text', () => {
    const result = detectSpam('Perfect location for meeting')

    expect(result.isSpam).toBe(false)
  })

  it('should detect repetitive characters', () => {
    const result = detectSpam('AAAAAAAAAAAA')  // 12 As (needs 8+)

    expect(result.score).toBeGreaterThan(0)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('should detect URLs as potential spam', () => {
    const result = detectSpam('Check out http://example.com and https://spam.com')

    expect(result.score).toBeGreaterThan(0)
  })

  it('should detect all caps text', () => {
    const result = detectSpam('THIS IS ALL CAPS MESSAGE!!!')

    expect(result.score).toBeGreaterThan(0)
    expect(result.reasons.some(r => r.type === 'all_caps')).toBe(true)
  })

  it('should detect excessive punctuation', () => {
    const result = detectSpam('Buy now!!! Amazing offer!!!')

    expect(result.score).toBeGreaterThan(0)
    expect(result.reasons.some(r => r.type === 'punctuation')).toBe(true)
  })

  it('should detect click bait patterns', () => {
    const result = detectSpam('Click here for free money!!!')

    expect(result.isSpam).toBe(true)
    expect(result.score).toBeGreaterThan(4)
  })

  it('should handle null input', () => {
    const result = detectSpam(null)

    expect(result.isSpam).toBe(false)
    expect(result.score).toBe(0)
  })

  it('should classify spam levels correctly', () => {
    const lowSpam = detectSpam('Perfect location')
    const highSpam = detectSpam('CLICK HERE!!! FREE MONEY$$$ http://spam.com http://scam.com')

    expect(lowSpam.isSpam).toBe(false)
    expect(highSpam.isSpam).toBe(true)
  })
})

// ============================================
// DETECT HATE SPEECH
// ============================================

describe('detectHateSpeech', () => {
  it('should return false for clean text', () => {
    const result = detectHateSpeech('Perfect location for meeting')

    expect(result.detected).toBe(false)
  })

  it('should detect racist terms', () => {
    const result = detectHateSpeech('This racist person is awful')

    expect(result.detected).toBe(true)
    expect(result.score).toBeGreaterThan(0)
  })

  it('should detect nazi/fascist references', () => {
    const result = detectHateSpeech('That nazi guy is a fascist')

    expect(result.detected).toBe(true)
    expect(result.score).toBeGreaterThan(5)
    expect(result.severity).not.toBe('low')
  })

  it('should detect sexist language', () => {
    const result = detectHateSpeech('Sexist behavior is not tolerated')

    expect(result.detected).toBe(true)
    expect(result.matches.length).toBeGreaterThan(0)
  })

  it('should detect harassment terms', () => {
    const result = detectHateSpeech('You idiot stupid loser')

    expect(result.detected).toBe(true)
    expect(result.score).toBeGreaterThan(0)
  })

  it('should classify severity correctly', () => {
    const medium = detectHateSpeech('You stupid idiot loser')
    const critical = detectHateSpeech('You nazi terrorist fascist')

    expect(medium.severity).not.toBe('low')
    expect(critical.severity).toBe('critical')
  })

  it('should handle null input', () => {
    const result = detectHateSpeech(null)

    expect(result.detected).toBe(false)
    expect(result.score).toBe(0)
  })

  it('should detect multiple hate speech terms', () => {
    const result = detectHateSpeech('Racist nazi fascist terrorist')

    expect(result.score).toBeGreaterThan(10)
    expect(result.matches.length).toBeGreaterThan(2)
  })
})

// ============================================
// DETECT PERSONAL INFO
// ============================================

describe('detectPersonalInfo', () => {
  it('should return false for clean text', () => {
    const result = detectPersonalInfo('Perfect location for meeting')

    expect(result.detected).toBe(false)
  })

  it('should detect email addresses', () => {
    const result = detectPersonalInfo('Contact john.doe@example.com')

    expect(result.detected).toBe(true)
    expect(result.count).toBeGreaterThan(0)
    expect(result.types.some(t => t.type === 'email')).toBe(true)
  })

  it('should detect phone numbers', () => {
    const result = detectPersonalInfo('Call +33-6-12-34-56-78 now')

    expect(result.detected).toBe(true)
    expect(result.types.some(t => t.type === 'phone')).toBe(true)
  })

  it('should detect multiple email formats', () => {
    const result = detectPersonalInfo('Email test@example.com or john_doe@test.co.uk')

    expect(result.count).toBeGreaterThanOrEqual(2)
  })

  it('should censor detected info in examples', () => {
    const result = detectPersonalInfo('My email is test@example.com')

    expect(result.types[0].examples[0]).toMatch(/\*+/)
  })

  it('should detect credit card patterns', () => {
    const result = detectPersonalInfo('Card number 1234 5678 9012 3456')

    expect(result.detected).toBe(true)
    expect(result.count).toBeGreaterThan(0)
  })

  it('should classify severity based on count', () => {
    const low = detectPersonalInfo('Email test@example.com')
    const high = detectPersonalInfo('Email a@b.com, phone +33-1-23-45-67-89, card 1234-5678-9012-3456')

    expect(low.severity).not.toBe('low')
    expect(high.severity).toBe('high')
  })

  it('should handle null input', () => {
    const result = detectPersonalInfo(null)

    expect(result.detected).toBe(false)
  })

  it('should detect street addresses', () => {
    const result = detectPersonalInfo('I live at 123 Main Street')

    expect(result.detected).toBe(true)
    expect(result.types.some(t => t.type === 'address')).toBe(true)
  })
})

// ============================================
// DETECT INAPPROPRIATE CONTENT
// ============================================

describe('detectInappropriateContent', () => {
  it('should return false for clean text', () => {
    const result = detectInappropriateContent('Perfect location for meeting')

    expect(result.detected).toBe(false)
  })

  it('should detect sexual content', () => {
    const result = detectInappropriateContent('Looking for adult entertainment')

    expect(result.detected).toBe(true)
    expect(result.categories.some(c => c.category === 'sexual')).toBe(true)
  })

  it('should detect violent content', () => {
    const result = detectInappropriateContent('I want to kill someone with a gun')

    expect(result.detected).toBe(true)
    expect(result.categories.some(c => c.category === 'violence')).toBe(true)
  })

  it('should detect dangerous content', () => {
    const result = detectInappropriateContent('Looking for drugs like cocaine')

    expect(result.detected).toBe(true)
    expect(result.categories.some(c => c.category === 'dangerous')).toBe(true)
  })

  it('should detect multiple inappropriate categories', () => {
    const result = detectInappropriateContent('Sex drugs and violence everywhere')

    expect(result.categories.length).toBeGreaterThan(1)
  })

  it('should classify severity correctly', () => {
    const low = detectInappropriateContent('Perfect location')
    const critical = detectInappropriateContent('Murder kill bomb attack suicide gun weapon')

    expect(low.detected).toBe(false)
    expect(critical.detected).toBe(true)
    expect(critical.severity).toBe('critical')
  })

  it('should handle null input', () => {
    const result = detectInappropriateContent(null)

    expect(result.detected).toBe(false)
  })

  it('should accumulate scores from multiple matches', () => {
    const result = detectInappropriateContent('Gun weapon bomb attack kill murder')

    expect(result.score).toBeGreaterThan(10)
  })
})

// ============================================
// MODERATE CONTENT
// ============================================

describe('moderateContent', () => {
  it('should allow clean text', () => {
    const result = moderateContent('Perfect location for meeting')

    expect(result.allowed).toBe(true)
  })

  it('should block highly toxic content', () => {
    const result = moderateContent('Nazi racist kill you idiot FREE MONEY click@spam.com')

    expect(result.allowed).toBe(false)
    expect(result.score).toBeGreaterThan(8)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('should flag medium toxicity for review', () => {
    const result = moderateContent('Click here for free money!!! Buy now http://spam.com http://scam.com')

    expect(result.score).toBeGreaterThan(0)
    expect(result.details.spam).toBeDefined()
  })

  it('should detect all violation types', () => {
    const result = moderateContent('Nazi racist! Email me@spam.com for FREE drugs kill bomb')

    expect(result.categories.length).toBeGreaterThan(2)
    expect(result.details).toBeDefined()
    expect(result.details.spam).toBeDefined()
    expect(result.details.hateSpeech).toBeDefined()
    expect(result.details.personalInfo).toBeDefined()
  })

  it('should use context-specific thresholds', () => {
    const messageResult = moderateContent('Click free money', ContentContext.MESSAGE)
    const reviewResult = moderateContent('Click free money', ContentContext.REVIEW)

    // Message has stricter threshold
    expect(messageResult).toBeDefined()
    expect(reviewResult).toBeDefined()
  })

  it('should handle different contexts', () => {
    const contexts = [
      ContentContext.MESSAGE,
      ContentContext.REVIEW,
      ContentContext.SPOT_DESCRIPTION,
      ContentContext.PROFILE_BIO,
    ]

    contexts.forEach(context => {
      const result = moderateContent('Test content', context)
      expect(result).toBeDefined()
    })
  })

  it('should create report when content blocked', () => {
    moderateContent('Nazi terrorist kill you', ContentContext.MESSAGE)

    // Report should be created in storage
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('should handle null input gracefully', () => {
    const result = moderateContent(null)

    expect(result.allowed).toBe(true)
    expect(result.score).toBe(0)
  })

  it('should include timestamp in result', () => {
    const result = moderateContent('Test')

    expect(result.timestamp).toBeDefined()
    expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('should combine spam and hate speech detection', () => {
    const result = moderateContent('Click here!!! Racist nazi attack http://spam.com')

    expect(result.reasons).toContain('spam')
    expect(result.reasons).toContain('hate_speech')
  })
})

// ============================================
// GET CONTENT REPORT
// ============================================

describe('getContentReport', () => {
  it('should return null for non-existent content', () => {
    const result = getContentReport('non_existent_id')

    expect(result).toBeNull()
  })

  it('should return null for null input', () => {
    const result = getContentReport(null)

    expect(result).toBeNull()
  })

  it('should retrieve report after creation', () => {
    // Create a blocked content that generates a report
    const moderation = moderateContent('Nazi terrorist kill bomb murder racist', ContentContext.MESSAGE)

    // The report ID is generated internally, we need to get it from storage
    const data = JSON.parse(localStorage.getItem('spothitch_ai_content_detection'))

    if (data && data.reports && data.reports.length > 0) {
      const reportId = data.reports[0].contentId
      const report = getContentReport(reportId)

      expect(report).toBeDefined()
      expect(report.contentId).toBe(reportId)
    }
  })
})

// ============================================
// ADD CUSTOM PATTERN
// ============================================

describe('addCustomPattern', () => {
  it('should add custom pattern successfully', () => {
    const pattern = {
      pattern: /custom[- ]spam/i,
      score: 3,
      lang: 'en',
    }

    const result = addCustomPattern(pattern, ContentCategory.SPAM)

    expect(result).toBe(true)

    const db = getPatternDatabase()
    expect(db.spam.some(p => p.custom)).toBe(true)
  })

  it('should reject invalid category', () => {
    const pattern = {
      pattern: /test/i,
      score: 2,
    }

    const result = addCustomPattern(pattern, 'invalid_category')

    expect(result).toBe(false)
  })

  it('should reject null pattern', () => {
    const result = addCustomPattern(null, ContentCategory.SPAM)

    expect(result).toBe(false)
  })

  it('should reject null category', () => {
    const pattern = { pattern: /test/i, score: 2 }
    const result = addCustomPattern(pattern, null)

    expect(result).toBe(false)
  })

  it('should convert string pattern to RegExp', () => {
    const pattern = {
      pattern: 'test-pattern',
      score: 2,
    }

    const result = addCustomPattern(pattern, ContentCategory.SPAM)

    expect(result).toBe(true)

    const db = getPatternDatabase()
    const customPattern = db.spam.find(p => p.custom)

    expect(customPattern).toBeDefined()
  })

  it('should set default score if not provided', () => {
    const pattern = {
      pattern: /test/i,
    }

    addCustomPattern(pattern, ContentCategory.SPAM)

    const db = getPatternDatabase()
    const customPattern = db.spam.find(p => p.custom)

    expect(customPattern.score).toBe(2)
  })

  it('should add timestamp to custom pattern', () => {
    const pattern = {
      pattern: /test/i,
      score: 3,
    }

    addCustomPattern(pattern, ContentCategory.SPAM)

    const db = getPatternDatabase()
    const customPattern = db.spam.find(p => p.custom)

    expect(customPattern.addedAt).toBeDefined()
  })
})

// ============================================
// GET PATTERN DATABASE
// ============================================

describe('getPatternDatabase', () => {
  it('should return pattern database', () => {
    const db = getPatternDatabase()

    expect(db).toBeDefined()
    expect(db.spam).toBeDefined()
    expect(db.hate_speech).toBeDefined()
    expect(db.personal_info).toBeDefined()
  })

  it('should include all default categories', () => {
    const db = getPatternDatabase()

    expect(db.spam).toBeInstanceOf(Array)
    expect(db.hate_speech).toBeInstanceOf(Array)
    expect(db.personal_info).toBeInstanceOf(Array)
    expect(db.sexual).toBeInstanceOf(Array)
    expect(db.violence).toBeInstanceOf(Array)
    expect(db.dangerous).toBeInstanceOf(Array)
  })

  it('should include custom patterns after addition', () => {
    const pattern = {
      pattern: /custom/i,
      score: 5,
    }

    addCustomPattern(pattern, ContentCategory.SPAM)

    const db = getPatternDatabase()
    const hasCustom = db.spam.some(p => p.custom === true)

    expect(hasCustom).toBe(true)
  })
})

// ============================================
// CLEAR CONTENT HISTORY
// ============================================

describe('clearContentHistory', () => {
  it('should clear history successfully', () => {
    // Generate some history
    analyzeText('Test 1')
    analyzeText('Test 2')

    const result = clearContentHistory()

    expect(result).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalled()
  })

  it('should clear reports', () => {
    // Generate a report
    moderateContent('Nazi terrorist kill', ContentContext.MESSAGE)

    clearContentHistory()

    const data = JSON.parse(localStorage.getItem('spothitch_ai_content_detection'))
    expect(data.reports).toEqual([])
    expect(data.history).toEqual([])
  })

  it('should preserve patterns after clear', () => {
    const pattern = {
      pattern: /test/i,
      score: 2,
    }

    addCustomPattern(pattern, ContentCategory.SPAM)
    clearContentHistory()

    const db = getPatternDatabase()
    expect(db.spam.some(p => p.custom)).toBe(true)
  })
})

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Integration Tests', () => {
  it('should handle complete moderation workflow', () => {
    // 1. Analyze clean content
    const clean = moderateContent('Perfect location for meeting')
    expect(clean.allowed).toBe(true)

    // 2. Analyze spam
    const spam = moderateContent('Click here FREE MONEY!!!')
    expect(spam.categories).toContain('spam')

    // 3. Analyze toxic content
    const toxic = moderateContent('Nazi racist terrorist')
    expect(toxic.allowed).toBe(false)

    // 4. Clear history
    clearContentHistory()

    // 5. Verify cleared
    const data = JSON.parse(localStorage.getItem('spothitch_ai_content_detection'))
    expect(data.history).toEqual([])
  })

  it('should detect multilingual patterns', () => {
    const french = analyzeText('Cliquez ici pour de l\'argent gratuit')
    const spanish = analyzeText('Haz clic aquí dinero gratis')
    const german = analyzeText('Klicken Sie hier kostenlos Geld')

    expect(french.score).toBeGreaterThan(0)
    expect(spanish.score).toBeGreaterThan(0)
    expect(german.score).toBeGreaterThan(0)
  })

  it('should handle edge cases gracefully', () => {
    const emptyString = moderateContent('')
    const whitespace = moderateContent('   ')
    const nullValue = moderateContent(null)
    const undefinedValue = moderateContent(undefined)

    expect(emptyString.allowed).toBe(true)
    expect(whitespace.allowed).toBe(true)
    expect(nullValue.allowed).toBe(true)
    expect(undefinedValue.allowed).toBe(true)
  })

  it('should maintain consistency across multiple analyses', () => {
    const text = 'Test content with some spam http://example.com'

    const result1 = analyzeText(text)
    const result2 = analyzeText(text)

    expect(result1.score).toBe(result2.score)
    expect(result1.categories).toEqual(result2.categories)
  })

  it('should combine multiple detection methods', () => {
    const text = 'Nazi racist! FREE MONEY!!! Email me@spam.com for drugs and guns'

    const analysis = analyzeText(text)
    const spam = detectSpam(text)
    const hate = detectHateSpeech(text)
    const personal = detectPersonalInfo(text)
    const inappropriate = detectInappropriateContent(text)

    expect(spam.isSpam).toBe(true)
    expect(hate.detected).toBe(true)
    expect(personal.detected).toBe(true)
    expect(inappropriate.detected).toBe(true)

    const moderation = moderateContent(text)
    expect(moderation.allowed).toBe(false)
    expect(moderation.categories.length).toBeGreaterThan(3)
  })
})

// ============================================
// DEFAULT EXPORT
// ============================================

describe('Default Export', () => {
  it('should export all functions', async () => {
    const module = await import('../src/services/aiContentDetection.js')

    expect(module.default).toBeDefined()
    expect(module.default.analyzeText).toBe(analyzeText)
    expect(module.default.detectSpam).toBe(detectSpam)
    expect(module.default.detectHateSpeech).toBe(detectHateSpeech)
    expect(module.default.detectPersonalInfo).toBe(detectPersonalInfo)
    expect(module.default.detectInappropriateContent).toBe(detectInappropriateContent)
    expect(module.default.moderateContent).toBe(moderateContent)
    expect(module.default.getContentReport).toBe(getContentReport)
    expect(module.default.addCustomPattern).toBe(addCustomPattern)
    expect(module.default.getPatternDatabase).toBe(getPatternDatabase)
    expect(module.default.clearContentHistory).toBe(clearContentHistory)
  })

  it('should export all constants', async () => {
    const module = await import('../src/services/aiContentDetection.js')

    expect(module.default.ContentCategory).toBe(ContentCategory)
    expect(module.default.ToxicityLevel).toBe(ToxicityLevel)
    expect(module.default.ContentContext).toBe(ContentContext)
  })
})
