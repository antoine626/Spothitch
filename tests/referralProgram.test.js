/**
 * Tests for Referral Program Service
 * Feature #201
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ReferrerLevel,
  levelThresholds,
  referralRewards,
  generateReferralCode,
  getMyReferralCode,
  validateReferralCode,
  getReferralLink,
  getReferrerLevel,
  getReferrerLevelInfo,
  applyReferralCode,
  recordReferralSuccess,
  getReferrals,
  getReferralStats,
  getPendingReferral,
  createPendingReferral,
  isValidReferrerCode,
  renderReferralCard,
  shareReferralLink,
  copyReferralCode,
} from '../src/services/referralProgram.js'
import { getState, setState } from '../src/stores/state.js'

// Mock dependencies
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}))

vi.mock('../src/services/analytics.js', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params) => {
    const translations = {
      referralCodeRequired: 'Referral code is required',
      referralCodeInvalid: 'Invalid referral code format',
      referralCodeAlreadyUsed: 'You have already used a referral code',
      referralCodeOwnCode: 'You cannot use your own referral code',
      referralCodeApplied: `Code applied! +${params?.points || 75} points`,
      referralAlreadyRecorded: 'This referral was already recorded',
      referralLevelUp: `Level up! You are now ${params?.level}`,
      referralMilestone: `Milestone ${params?.count}! +${params?.points} points`,
      referralFriendJoined: `${params?.name} joined! +${params?.points} points`,
      referralProgramTitle: 'Referral Program',
      referralProgramSubtitle: 'Invite friends and earn rewards',
      referralLevel: 'Your Level',
      referralLevelNone: 'Starter',
      bonusPerReferral: 'Bonus per referral',
      referralsCompleted: 'Referrals',
      pointsEarned: 'Points earned',
      pending: 'Pending',
      nextLevel: 'Next Level',
      referralsToGo: 'to go',
      maxLevelReached: 'Maximum level reached!',
      yourReferralCode: 'Your referral code',
      copyCode: 'Copy code',
      shareVia: 'Share via',
      copyLink: 'Copy link',
      referralShareText: `${params?.username} invites you to SpotHitch`,
      referralEmailSubject: 'Join SpotHitch!',
      linkCopied: 'Link copied!',
      referralCodeCopied: 'Code copied!',
      shareError: 'Error sharing',
      anonymousUser: 'Anonymous',
    }
    return translations[key] || key
  }),
}))

describe('referralProgram', () => {
  beforeEach(() => {
    // Reset state before each test
    setState({
      referralCode: null,
      referralCodeCreatedAt: null,
      referrals: [],
      usedReferralCode: null,
      referredBy: null,
      referralAppliedAt: null,
      pendingReferral: null,
      user: { uid: 'test-user-123' },
      username: 'TestUser',
    })
    vi.clearAllMocks()
  })

  describe('ReferrerLevel enum', () => {
    it('should have all 5 levels', () => {
      expect(ReferrerLevel.NONE).toBe('none')
      expect(ReferrerLevel.BRONZE).toBe('bronze')
      expect(ReferrerLevel.SILVER).toBe('silver')
      expect(ReferrerLevel.GOLD).toBe('gold')
      expect(ReferrerLevel.PLATINUM).toBe('platinum')
    })

    it('should have exactly 5 levels', () => {
      expect(Object.keys(ReferrerLevel)).toHaveLength(5)
    })
  })

  describe('levelThresholds', () => {
    it('should have correct thresholds for each level', () => {
      expect(levelThresholds[ReferrerLevel.NONE]).toBe(0)
      expect(levelThresholds[ReferrerLevel.BRONZE]).toBe(3)
      expect(levelThresholds[ReferrerLevel.SILVER]).toBe(10)
      expect(levelThresholds[ReferrerLevel.GOLD]).toBe(25)
      expect(levelThresholds[ReferrerLevel.PLATINUM]).toBe(50)
    })

    it('should have increasing thresholds', () => {
      const thresholds = Object.values(levelThresholds)
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1])
      }
    })
  })

  describe('referralRewards configuration', () => {
    it('should have base rewards', () => {
      expect(referralRewards.referrer).toBe(150)
      expect(referralRewards.referee).toBe(75)
    })

    it('should have level bonuses', () => {
      expect(referralRewards.levelBonus[ReferrerLevel.NONE]).toBe(0)
      expect(referralRewards.levelBonus[ReferrerLevel.BRONZE]).toBe(25)
      expect(referralRewards.levelBonus[ReferrerLevel.SILVER]).toBe(50)
      expect(referralRewards.levelBonus[ReferrerLevel.GOLD]).toBe(100)
      expect(referralRewards.levelBonus[ReferrerLevel.PLATINUM]).toBe(200)
    })

    it('should have badges for levels above none', () => {
      expect(referralRewards.badges[ReferrerLevel.BRONZE]).toBe('referrer_bronze')
      expect(referralRewards.badges[ReferrerLevel.SILVER]).toBe('referrer_silver')
      expect(referralRewards.badges[ReferrerLevel.GOLD]).toBe('referrer_gold')
      expect(referralRewards.badges[ReferrerLevel.PLATINUM]).toBe('referrer_platinum')
    })

    it('should have milestone bonuses', () => {
      expect(referralRewards.milestones[5]).toBe(500)
      expect(referralRewards.milestones[15]).toBe(1000)
      expect(referralRewards.milestones[30]).toBe(2500)
      expect(referralRewards.milestones[50]).toBe(5000)
    })
  })

  describe('generateReferralCode', () => {
    it('should generate a code in correct format', () => {
      const code = generateReferralCode()
      expect(code).toMatch(/^REF-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    })

    it('should save code to state', () => {
      const code = generateReferralCode()
      const state = getState()
      expect(state.referralCode).toBe(code)
      expect(state.referralCodeCreatedAt).toBeDefined()
    })

    it('should return existing code if already generated', () => {
      const code1 = generateReferralCode()
      const code2 = generateReferralCode()
      expect(code1).toBe(code2)
    })

    it('should not include confusing characters (0, O, I, 1)', () => {
      // Generate many codes to increase probability of catching issues
      for (let i = 0; i < 10; i++) {
        setState({ referralCode: null })
        const code = generateReferralCode()
        expect(code).not.toMatch(/[01OI]/)
      }
    })

    it('should use "local" as userId when user is not logged in', () => {
      setState({ user: null, referralCode: null })
      const code = generateReferralCode()
      expect(code).toMatch(/^REF-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    })
  })

  describe('getMyReferralCode', () => {
    it('should return existing code if available', () => {
      setState({ referralCode: 'REF-TEST-CODE' })
      const code = getMyReferralCode()
      expect(code).toBe('REF-TEST-CODE')
    })

    it('should generate new code if none exists', () => {
      const code = getMyReferralCode()
      expect(code).toMatch(/^REF-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    })
  })

  describe('validateReferralCode', () => {
    it('should validate correct format', () => {
      expect(validateReferralCode('REF-ABCD-EFGH')).toBe(true)
      expect(validateReferralCode('REF-2345-6789')).toBe(true)
      expect(validateReferralCode('REF-A2B3-C4D5')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(validateReferralCode('ref-abcd-efgh')).toBe(true)
      expect(validateReferralCode('Ref-AbCd-EfGh')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(validateReferralCode('ABCD-EFGH')).toBe(false) // Missing REF-
      expect(validateReferralCode('REF-ABC-DEFG')).toBe(false) // Wrong length
      expect(validateReferralCode('REF-ABCDE-FGHI')).toBe(false) // Too long
      expect(validateReferralCode('XYZ-ABCD-EFGH')).toBe(false) // Wrong prefix
    })

    it('should reject null, undefined, and non-string values', () => {
      expect(validateReferralCode(null)).toBe(false)
      expect(validateReferralCode(undefined)).toBe(false)
      expect(validateReferralCode(123)).toBe(false)
      expect(validateReferralCode({})).toBe(false)
    })

    it('should reject codes with confusing characters', () => {
      expect(validateReferralCode('REF-0OI1-ABCD')).toBe(false)
    })
  })

  describe('getReferralLink', () => {
    it('should generate link with user code', () => {
      setState({ referralCode: 'REF-TEST-CODE' })
      const link = getReferralLink()
      expect(link).toBe('https://spothitch.app/join/REF-TEST-CODE')
    })

    it('should accept custom code', () => {
      const link = getReferralLink('REF-CUST-CODE')
      expect(link).toBe('https://spothitch.app/join/REF-CUST-CODE')
    })

    it('should generate new code if none provided and none exists', () => {
      const link = getReferralLink()
      expect(link).toMatch(/^https:\/\/spothitch\.app\/join\/REF-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    })
  })

  describe('getReferrerLevel', () => {
    it('should return NONE for 0-2 referrals', () => {
      expect(getReferrerLevel(0)).toBe(ReferrerLevel.NONE)
      expect(getReferrerLevel(1)).toBe(ReferrerLevel.NONE)
      expect(getReferrerLevel(2)).toBe(ReferrerLevel.NONE)
    })

    it('should return BRONZE for 3-9 referrals', () => {
      expect(getReferrerLevel(3)).toBe(ReferrerLevel.BRONZE)
      expect(getReferrerLevel(5)).toBe(ReferrerLevel.BRONZE)
      expect(getReferrerLevel(9)).toBe(ReferrerLevel.BRONZE)
    })

    it('should return SILVER for 10-24 referrals', () => {
      expect(getReferrerLevel(10)).toBe(ReferrerLevel.SILVER)
      expect(getReferrerLevel(15)).toBe(ReferrerLevel.SILVER)
      expect(getReferrerLevel(24)).toBe(ReferrerLevel.SILVER)
    })

    it('should return GOLD for 25-49 referrals', () => {
      expect(getReferrerLevel(25)).toBe(ReferrerLevel.GOLD)
      expect(getReferrerLevel(35)).toBe(ReferrerLevel.GOLD)
      expect(getReferrerLevel(49)).toBe(ReferrerLevel.GOLD)
    })

    it('should return PLATINUM for 50+ referrals', () => {
      expect(getReferrerLevel(50)).toBe(ReferrerLevel.PLATINUM)
      expect(getReferrerLevel(100)).toBe(ReferrerLevel.PLATINUM)
      expect(getReferrerLevel(1000)).toBe(ReferrerLevel.PLATINUM)
    })
  })

  describe('getReferrerLevelInfo', () => {
    it('should return level info for user with no referrals', () => {
      const info = getReferrerLevelInfo()
      expect(info.level).toBe(ReferrerLevel.NONE)
      expect(info.count).toBe(0)
      expect(info.nextLevel).toBe(ReferrerLevel.BRONZE)
      expect(info.referralsToNextLevel).toBe(3)
      expect(info.progress).toBe(0)
      expect(info.bonus).toBe(0)
      expect(info.badge).toBeNull()
    })

    it('should calculate progress correctly', () => {
      setState({
        referrals: [
          { refereeId: '1', status: 'completed' },
          { refereeId: '2', status: 'completed' },
        ],
      })
      const info = getReferrerLevelInfo()
      expect(info.count).toBe(2)
      expect(info.progress).toBeGreaterThan(0)
      expect(info.progress).toBeLessThan(100)
    })

    it('should return 100% progress for platinum users', () => {
      const referrals = Array.from({ length: 50 }, (_, i) => ({
        refereeId: String(i),
        status: 'completed',
      }))
      setState({ referrals })
      const info = getReferrerLevelInfo()
      expect(info.level).toBe(ReferrerLevel.PLATINUM)
      expect(info.progress).toBe(100)
      expect(info.nextLevel).toBeNull()
      expect(info.referralsToNextLevel).toBe(0)
    })

    it('should include badge for levels above none', () => {
      const referrals = Array.from({ length: 3 }, (_, i) => ({
        refereeId: String(i),
        status: 'completed',
      }))
      setState({ referrals })
      const info = getReferrerLevelInfo()
      expect(info.badge).toBe('referrer_bronze')
    })

    it('should only count completed referrals', () => {
      setState({
        referrals: [
          { refereeId: '1', status: 'completed' },
          { refereeId: '2', status: 'pending' },
          { refereeId: '3', status: 'expired' },
        ],
      })
      const info = getReferrerLevelInfo()
      expect(info.count).toBe(1)
    })
  })

  describe('applyReferralCode', () => {
    it('should reject empty code', () => {
      const result = applyReferralCode('')
      expect(result.success).toBe(false)
      expect(result.message).toBe('Referral code is required')
    })

    it('should reject invalid format', () => {
      const result = applyReferralCode('INVALID')
      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid referral code format')
    })

    it('should reject if user already used a code', () => {
      setState({ usedReferralCode: 'REF-PREV-CODE' })
      const result = applyReferralCode('REF-NEW8-CODE')
      expect(result.success).toBe(false)
      expect(result.message).toBe('You have already used a referral code')
    })

    it('should reject own code', () => {
      // Use valid format code (no O, I, 0, 1 characters)
      setState({ referralCode: 'REF-ABCD-EFGH' })
      const result = applyReferralCode('REF-ABCD-EFGH')
      expect(result.success).toBe(false)
      expect(result.message).toBe('You cannot use your own referral code')
    })

    it('should apply valid code successfully', () => {
      const result = applyReferralCode('REF-VALD-CODE')
      expect(result.success).toBe(true)
      expect(result.reward).toBe(75)
    })

    it('should save code to state when applied', () => {
      applyReferralCode('REF-SAVE-CODE')
      const state = getState()
      expect(state.usedReferralCode).toBe('REF-SAVE-CODE')
      expect(state.referredBy).toBe('REF-SAVE-CODE')
      expect(state.referralAppliedAt).toBeDefined()
    })

    it('should normalize code to uppercase', () => {
      // Use valid lowercase format (no o, i, 0, 1 characters)
      applyReferralCode('ref-abcd-efgh')
      const state = getState()
      expect(state.usedReferralCode).toBe('REF-ABCD-EFGH')
    })

    it('should trim whitespace from code', () => {
      applyReferralCode('  REF-TRIM-CODE  ')
      const state = getState()
      expect(state.usedReferralCode).toBe('REF-TRIM-CODE')
    })
  })

  describe('recordReferralSuccess', () => {
    it('should record a new referral', () => {
      const result = recordReferralSuccess('referee-123', 'John Doe')
      expect(result.success).toBe(true)
      expect(result.totalReferrals).toBe(1)
      expect(result.baseReward).toBe(150)
    })

    it('should reject duplicate referrals', () => {
      recordReferralSuccess('referee-123', 'John Doe')
      const result = recordReferralSuccess('referee-123', 'John Doe')
      expect(result.success).toBe(false)
      expect(result.message).toBe('This referral was already recorded')
    })

    it('should calculate level bonus correctly', () => {
      // Add 3 referrals to reach bronze
      recordReferralSuccess('ref-1', 'User 1')
      recordReferralSuccess('ref-2', 'User 2')
      const result = recordReferralSuccess('ref-3', 'User 3')
      expect(result.level).toBe(ReferrerLevel.BRONZE)
      expect(result.bonusReward).toBe(25) // Bronze bonus
      expect(result.totalReward).toBe(175) // 150 + 25
    })

    it('should detect level up', () => {
      // Add 2 referrals first
      recordReferralSuccess('ref-1', 'User 1')
      recordReferralSuccess('ref-2', 'User 2')
      // Third should trigger level up to bronze
      const result = recordReferralSuccess('ref-3', 'User 3')
      expect(result.newBadge).toBe('referrer_bronze')
    })

    it('should award milestone bonuses', () => {
      // Add 4 referrals
      for (let i = 1; i <= 4; i++) {
        recordReferralSuccess(`ref-${i}`, `User ${i}`)
      }
      // Fifth should trigger milestone
      const result = recordReferralSuccess('ref-5', 'User 5')
      expect(result.milestoneReward).toBe(500)
    })

    it('should use provided referrer code', () => {
      recordReferralSuccess('ref-1', 'User 1', 'REF-CUST-CODE')
      const state = getState()
      expect(state.referrals[0].code).toBe('REF-CUST-CODE')
    })

    it('should set correct referral status and timestamp', () => {
      recordReferralSuccess('ref-1', 'User 1')
      const state = getState()
      expect(state.referrals[0].status).toBe('completed')
      expect(state.referrals[0].joinedAt).toBeDefined()
      expect(state.referrals[0].rewarded).toBe(true)
    })
  })

  describe('getReferrals', () => {
    beforeEach(() => {
      setState({
        referrals: [
          { refereeId: '1', status: 'completed' },
          { refereeId: '2', status: 'pending' },
          { refereeId: '3', status: 'completed' },
          { refereeId: '4', status: 'expired' },
        ],
      })
    })

    it('should return all referrals when no status filter', () => {
      const referrals = getReferrals()
      expect(referrals).toHaveLength(4)
    })

    it('should filter by completed status', () => {
      const referrals = getReferrals('completed')
      expect(referrals).toHaveLength(2)
      expect(referrals.every((r) => r.status === 'completed')).toBe(true)
    })

    it('should filter by pending status', () => {
      const referrals = getReferrals('pending')
      expect(referrals).toHaveLength(1)
    })

    it('should filter by expired status', () => {
      const referrals = getReferrals('expired')
      expect(referrals).toHaveLength(1)
    })

    it('should return empty array when no referrals exist', () => {
      setState({ referrals: [] })
      const referrals = getReferrals()
      expect(referrals).toEqual([])
    })

    it('should return empty array when state.referrals is undefined', () => {
      setState({ referrals: undefined })
      const referrals = getReferrals()
      expect(referrals).toEqual([])
    })
  })

  describe('getReferralStats', () => {
    it('should return stats for user with no referrals', () => {
      const stats = getReferralStats()
      expect(stats.totalReferrals).toBe(0)
      expect(stats.pendingReferrals).toBe(0)
      expect(stats.totalPointsEarned).toBe(0)
      expect(stats.level).toBe(ReferrerLevel.NONE)
      expect(stats.referralCode).toBeDefined()
      expect(stats.referralLink).toContain('https://spothitch.app/join/')
    })

    it('should calculate total points earned correctly', () => {
      // Add 5 referrals to include milestone bonus
      for (let i = 1; i <= 5; i++) {
        setState({ referrals: [] }) // Reset for calculation
      }
      // Actually add referrals to state
      const referrals = Array.from({ length: 5 }, (_, i) => ({
        refereeId: String(i + 1),
        status: 'completed',
      }))
      setState({ referrals })

      const stats = getReferralStats()
      expect(stats.totalReferrals).toBe(5)
      // Should include: 5 * 150 base + level bonuses + 500 milestone
      expect(stats.totalPointsEarned).toBeGreaterThan(750)
    })

    it('should track pending and completed separately', () => {
      setState({
        referrals: [
          { refereeId: '1', status: 'completed' },
          { refereeId: '2', status: 'pending' },
          { refereeId: '3', status: 'pending' },
        ],
      })
      const stats = getReferralStats()
      expect(stats.totalReferrals).toBe(1)
      expect(stats.pendingReferrals).toBe(2)
    })

    it('should include next milestone info', () => {
      const stats = getReferralStats()
      expect(stats.nextMilestone).toBe(5)
      expect(stats.referralsToMilestone).toBe(5)
      expect(stats.nextMilestoneReward).toBe(500)
    })

    it('should include used code info', () => {
      setState({
        usedReferralCode: 'REF-USED-CODE',
        referredBy: 'REF-USED-CODE',
      })
      const stats = getReferralStats()
      expect(stats.usedCode).toBe('REF-USED-CODE')
      expect(stats.referredBy).toBe('REF-USED-CODE')
    })
  })

  describe('getPendingReferral', () => {
    it('should return pending referral for matching code', () => {
      setState({
        referrals: [
          { code: 'REF-TEST-CODE', status: 'pending' },
          { code: 'REF-OTHR-CODE', status: 'completed' },
        ],
      })
      const pending = getPendingReferral('REF-TEST-CODE')
      expect(pending).toBeDefined()
      expect(pending.status).toBe('pending')
    })

    it('should return null when no pending referral exists', () => {
      setState({
        referrals: [{ code: 'REF-TEST-CODE', status: 'completed' }],
      })
      const pending = getPendingReferral('REF-TEST-CODE')
      expect(pending).toBeNull()
    })

    it('should return null when code does not match', () => {
      setState({
        referrals: [{ code: 'REF-TEST-CODE', status: 'pending' }],
      })
      const pending = getPendingReferral('REF-OTHR-CODE')
      expect(pending).toBeNull()
    })
  })

  describe('createPendingReferral', () => {
    it('should create pending referral with valid code', () => {
      const result = createPendingReferral('REF-VALD-CODE')
      expect(result.success).toBe(true)
      expect(result.pendingReferral.code).toBe('REF-VALD-CODE')
      expect(result.pendingReferral.status).toBe('pending')
    })

    it('should set expiration to 7 days', () => {
      const result = createPendingReferral('REF-VALD-CODE')
      const expiresAt = new Date(result.pendingReferral.expiresAt)
      const now = new Date()
      const diffDays = (expiresAt - now) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeCloseTo(7, 0)
    })

    it('should reject invalid code format', () => {
      const result = createPendingReferral('INVALID')
      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid referral code format')
    })

    it('should save to state', () => {
      createPendingReferral('REF-SAVE-CODE')
      const state = getState()
      expect(state.pendingReferral.code).toBe('REF-SAVE-CODE')
    })
  })

  describe('isValidReferrerCode', () => {
    it('should accept valid format codes', () => {
      expect(isValidReferrerCode('REF-VALD-CODE')).toBe(true)
      expect(isValidReferrerCode('REF-ABCD-2345')).toBe(true)
    })

    it('should reject invalid format codes', () => {
      expect(isValidReferrerCode('INVALID')).toBe(false)
      expect(isValidReferrerCode('')).toBe(false)
      expect(isValidReferrerCode(null)).toBe(false)
    })
  })

  describe('renderReferralCard', () => {
    it('should render HTML with referral code', () => {
      setState({ referralCode: 'REF-TEST-CODE' })
      const html = renderReferralCard()
      expect(html).toContain('REF-TEST-CODE')
    })

    it('should include level badge', () => {
      const html = renderReferralCard()
      // Check for actual translated text from the t() mock
      expect(html).toContain('Your Level')
    })

    it('should include stats grid', () => {
      const html = renderReferralCard()
      // Check for actual translated text from the t() mock
      expect(html).toContain('Referrals')
      expect(html).toContain('Points earned')
      expect(html).toContain('Pending')
    })

    it('should include share buttons', () => {
      const html = renderReferralCard()
      expect(html).toContain('shareReferralLink')
      expect(html).toContain('whatsapp')
      expect(html).toContain('telegram')
    })

    it('should include copy code button', () => {
      const html = renderReferralCard()
      expect(html).toContain('copyReferralCode')
    })

    it('should show progress bar when not at max level', () => {
      const html = renderReferralCard()
      // Check for actual translated text from the t() mock
      expect(html).toContain('Next Level')
      expect(html).toContain('to go')
    })

    it('should show max level message for platinum users', () => {
      const referrals = Array.from({ length: 50 }, (_, i) => ({
        refereeId: String(i),
        status: 'completed',
      }))
      setState({ referrals })
      const html = renderReferralCard()
      // Check for actual translated text from the t() mock
      expect(html).toContain('Maximum level reached!')
    })

    it('should have correct level colors for each level', () => {
      // Test bronze level
      const bronzeReferrals = Array.from({ length: 3 }, (_, i) => ({
        refereeId: String(i),
        status: 'completed',
      }))
      setState({ referrals: bronzeReferrals })
      const bronzeHtml = renderReferralCard()
      expect(bronzeHtml).toContain('orange')

      // Test gold level
      const goldReferrals = Array.from({ length: 25 }, (_, i) => ({
        refereeId: String(i),
        status: 'completed',
      }))
      setState({ referrals: goldReferrals })
      const goldHtml = renderReferralCard()
      expect(goldHtml).toContain('yellow')
    })

    it('should have accessibility attributes', () => {
      const html = renderReferralCard()
      expect(html).toContain('aria-label')
    })
  })

  describe('shareReferralLink', () => {
    beforeEach(() => {
      // Mock window.open
      global.window = {
        open: vi.fn(),
      }
    })

    it('should open SMS share', () => {
      shareReferralLink('sms')
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('sms:'))
    })

    it('should open email share', () => {
      shareReferralLink('email')
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('mailto:'))
    })

    it('should open WhatsApp share', () => {
      shareReferralLink('whatsapp')
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('wa.me'))
    })

    it('should open Telegram share', () => {
      shareReferralLink('telegram')
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining('t.me'))
    })

    it('should copy to clipboard', () => {
      const mockClipboard = { writeText: vi.fn() }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
      })
      shareReferralLink('copy')
      expect(mockClipboard.writeText).toHaveBeenCalled()
    })

    it('should return false for unknown method', () => {
      const result = shareReferralLink('unknown')
      expect(result).toBe(false)
    })

    it('should include referral link in share text', () => {
      setState({ referralCode: 'REF-TEST-CODE' })
      shareReferralLink('whatsapp')
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('REF-TEST-CODE')
      )
    })

    it('should use username in share text', () => {
      setState({ username: 'TestUser', referralCode: 'REF-TEST-CODE' })
      shareReferralLink('telegram')
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('TestUser')
      )
    })
  })

  describe('copyReferralCode', () => {
    it('should copy code to clipboard when API available', () => {
      const mockClipboard = { writeText: vi.fn() }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
      })
      setState({ referralCode: 'REF-COPY-CODE' })
      copyReferralCode()
      expect(mockClipboard.writeText).toHaveBeenCalledWith('REF-COPY-CODE')
    })

    it('should generate code if none exists', () => {
      const mockClipboard = { writeText: vi.fn() }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
      })
      copyReferralCode()
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringMatching(/^REF-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
      )
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete referral flow', () => {
      // 1. User A generates their referral code
      const codeA = generateReferralCode()
      expect(codeA).toMatch(/^REF-[A-Z2-9]{4}-[A-Z2-9]{4}$/)

      // 2. User B applies User A's code
      setState({
        user: { uid: 'user-b' },
        referralCode: null,
        usedReferralCode: null,
      })
      const applyResult = applyReferralCode(codeA)
      expect(applyResult.success).toBe(true)
      expect(applyResult.reward).toBe(75)

      // 3. User A records the successful referral
      setState({
        user: { uid: 'user-a' },
        referralCode: codeA,
        referrals: [],
      })
      const recordResult = recordReferralSuccess('user-b', 'User B', codeA)
      expect(recordResult.success).toBe(true)
      expect(recordResult.baseReward).toBe(150)
    })

    it('should track progress through all levels', () => {
      const levels = [
        { count: 0, expectedLevel: ReferrerLevel.NONE },
        { count: 3, expectedLevel: ReferrerLevel.BRONZE },
        { count: 10, expectedLevel: ReferrerLevel.SILVER },
        { count: 25, expectedLevel: ReferrerLevel.GOLD },
        { count: 50, expectedLevel: ReferrerLevel.PLATINUM },
      ]

      for (const { count, expectedLevel } of levels) {
        const referrals = Array.from({ length: count }, (_, i) => ({
          refereeId: String(i),
          status: 'completed',
        }))
        setState({ referrals })
        const info = getReferrerLevelInfo()
        expect(info.level).toBe(expectedLevel)
      }
    })

    it('should award all milestone bonuses', () => {
      const milestones = [5, 15, 30, 50]
      let totalMilestoneRewards = 0

      setState({ referrals: [] })

      for (let i = 1; i <= 50; i++) {
        const result = recordReferralSuccess(`ref-${i}`, `User ${i}`)
        if (milestones.includes(i)) {
          expect(result.milestoneReward).toBeGreaterThan(0)
          totalMilestoneRewards += result.milestoneReward
        }
      }

      // Total milestone rewards: 500 + 1000 + 2500 + 5000 = 9000
      expect(totalMilestoneRewards).toBe(9000)
    })

    it('should handle multiple referrals correctly', () => {
      for (let i = 1; i <= 10; i++) {
        recordReferralSuccess(`ref-${i}`, `User ${i}`)
      }

      const stats = getReferralStats()
      expect(stats.totalReferrals).toBe(10)
      expect(stats.level).toBe(ReferrerLevel.SILVER)

      const referrals = getReferrals('completed')
      expect(referrals).toHaveLength(10)
    })
  })

  describe('Edge cases', () => {
    it('should handle state with null referrals', () => {
      setState({ referrals: null })
      const stats = getReferralStats()
      expect(stats.totalReferrals).toBe(0)
    })

    it('should handle very large number of referrals', () => {
      const referrals = Array.from({ length: 1000 }, (_, i) => ({
        refereeId: String(i),
        status: 'completed',
      }))
      setState({ referrals })
      const info = getReferrerLevelInfo()
      expect(info.level).toBe(ReferrerLevel.PLATINUM)
      expect(info.progress).toBe(100)
    })

    it('should not overflow points calculation', () => {
      const referrals = Array.from({ length: 100 }, (_, i) => ({
        refereeId: String(i),
        status: 'completed',
      }))
      setState({ referrals })
      const stats = getReferralStats()
      expect(stats.totalPointsEarned).toBeLessThan(Number.MAX_SAFE_INTEGER)
      expect(stats.totalPointsEarned).toBeGreaterThan(0)
    })

    it('should handle unicode in referee name', () => {
      const result = recordReferralSuccess('ref-unicode', 'Jean-Pierre Dupont')
      expect(result.success).toBe(true)
    })

    it('should handle special characters in referee name', () => {
      const result = recordReferralSuccess('ref-special', "O'Brien <script>")
      expect(result.success).toBe(true)
      const state = getState()
      expect(state.referrals[0].refereeName).toBe("O'Brien <script>")
    })
  })
})
