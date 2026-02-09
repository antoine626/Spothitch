/**
 * Reputation System Service Tests
 * Feature #191 - Star-based reputation system
 *
 * VALIDATED DECISIONS:
 * - Score based on: spots created (+), spot ratings (+), seniority (+), identity verification (+++), reports (-)
 * - Displayed as stars (1-5) on profile
 * - No exact number visible (avoid toxic competition)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  REPUTATION_FACTORS,
  NEGATIVE_FACTORS,
  STAR_DESCRIPTIONS,
  calculateReputation,
  scoreToStars,
  getStarThresholds,
  getUserReputation,
  getUserReputationByData,
  renderStars,
  renderReputationBadge,
  renderReputationCard,
  renderMiniReputation,
  updateReputationFactors,
  recordReportReceived,
  recordWarning,
  getReputationFactors,
  getStarDescriptions,
  hasMinimumReputation,
} from '../src/services/reputationSystem.js'
import { getState, setState, resetState } from '../src/stores/state.js'

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

import { showToast } from '../src/services/notifications.js'

describe('Reputation System Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
    setState({
      spotsCreated: 0,
      avgSpotRating: 0,
      ratedSpotsCount: 0,
      verificationLevel: 0,
      reviewsGiven: 0,
      checkins: 0,
      helpfulVotesReceived: 0,
      validReportsReceived: 0,
      warnings: 0,
      flaggedSuspicious: false,
      cachedReputation: null,
    })
  })

  describe('REPUTATION_FACTORS', () => {
    it('should have all required positive factors', () => {
      expect(REPUTATION_FACTORS.spotsCreated).toBeDefined()
      expect(REPUTATION_FACTORS.spotRatings).toBeDefined()
      expect(REPUTATION_FACTORS.seniority).toBeDefined()
      expect(REPUTATION_FACTORS.identityVerification).toBeDefined()
      expect(REPUTATION_FACTORS.helpfulReviews).toBeDefined()
      expect(REPUTATION_FACTORS.communityActivity).toBeDefined()
    })

    it('should have correct weights totaling 100', () => {
      const totalWeight = Object.values(REPUTATION_FACTORS).reduce(
        (sum, factor) => sum + factor.weight,
        0
      )
      expect(totalWeight).toBe(100)
    })

    it('should have id, name, nameEn for each factor', () => {
      Object.values(REPUTATION_FACTORS).forEach(factor => {
        expect(factor.id).toBeDefined()
        expect(factor.name).toBeDefined()
        expect(factor.nameEn).toBeDefined()
        expect(factor.icon).toBeDefined()
        expect(typeof factor.calculate).toBe('function')
      })
    })

    it('should have identity verification as highest weight', () => {
      const maxWeight = Math.max(...Object.values(REPUTATION_FACTORS).map(f => f.weight))
      expect(REPUTATION_FACTORS.identityVerification.weight).toBe(maxWeight)
    })
  })

  describe('NEGATIVE_FACTORS', () => {
    it('should have all required negative factors', () => {
      expect(NEGATIVE_FACTORS.reportsReceived).toBeDefined()
      expect(NEGATIVE_FACTORS.warnings).toBeDefined()
      expect(NEGATIVE_FACTORS.suspiciousActivity).toBeDefined()
    })

    it('should have penalty values', () => {
      Object.values(NEGATIVE_FACTORS).forEach(factor => {
        expect(factor.penalty).toBeGreaterThan(0)
        expect(typeof factor.calculate).toBe('function')
      })
    })
  })

  describe('STAR_DESCRIPTIONS', () => {
    it('should have descriptions for all 5 star levels', () => {
      expect(Object.keys(STAR_DESCRIPTIONS).length).toBe(5)
      for (let i = 1; i <= 5; i++) {
        expect(STAR_DESCRIPTIONS[i]).toBeDefined()
      }
    })

    it('should have label, description, color, emoji for each level', () => {
      Object.values(STAR_DESCRIPTIONS).forEach(desc => {
        expect(desc.label).toBeDefined()
        expect(desc.labelEn).toBeDefined()
        expect(desc.description).toBeDefined()
        expect(desc.descriptionEn).toBeDefined()
        expect(desc.color).toMatch(/^#[0-9a-fA-F]{6}$/)
        expect(desc.emoji).toBeDefined()
      })
    })

    it('should have progressive labels from Nouveau to Legende', () => {
      expect(STAR_DESCRIPTIONS[1].label).toBe('Nouveau')
      expect(STAR_DESCRIPTIONS[5].label).toBe('Legende')
    })
  })

  describe('scoreToStars', () => {
    it('should return 1 star for score 0-19', () => {
      expect(scoreToStars(0)).toBe(1)
      expect(scoreToStars(10)).toBe(1)
      expect(scoreToStars(19)).toBe(1)
    })

    it('should return 2 stars for score 20-39', () => {
      expect(scoreToStars(20)).toBe(2)
      expect(scoreToStars(30)).toBe(2)
      expect(scoreToStars(39)).toBe(2)
    })

    it('should return 3 stars for score 40-59', () => {
      expect(scoreToStars(40)).toBe(3)
      expect(scoreToStars(50)).toBe(3)
      expect(scoreToStars(59)).toBe(3)
    })

    it('should return 4 stars for score 60-79', () => {
      expect(scoreToStars(60)).toBe(4)
      expect(scoreToStars(70)).toBe(4)
      expect(scoreToStars(79)).toBe(4)
    })

    it('should return 5 stars for score 80-100', () => {
      expect(scoreToStars(80)).toBe(5)
      expect(scoreToStars(90)).toBe(5)
      expect(scoreToStars(100)).toBe(5)
    })
  })

  describe('getStarThresholds', () => {
    it('should return correct thresholds for each star level', () => {
      const thresholds = getStarThresholds()
      expect(thresholds[1]).toEqual({ min: 0, max: 19 })
      expect(thresholds[2]).toEqual({ min: 20, max: 39 })
      expect(thresholds[3]).toEqual({ min: 40, max: 59 })
      expect(thresholds[4]).toEqual({ min: 60, max: 79 })
      expect(thresholds[5]).toEqual({ min: 80, max: 100 })
    })
  })

  describe('calculateReputation', () => {
    it('should return correct structure', () => {
      const result = calculateReputation()
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('stars')
      expect(result).toHaveProperty('starInfo')
      expect(result).toHaveProperty('positiveTotal')
      expect(result).toHaveProperty('negativeTotal')
      expect(result).toHaveProperty('positiveBreakdown')
      expect(result).toHaveProperty('negativeBreakdown')
      expect(result).toHaveProperty('stats')
    })

    it('should return 1 star for new user with no activity', () => {
      const result = calculateReputation()
      expect(result.stars).toBe(1)
      expect(result.starInfo.label).toBe('Nouveau')
    })

    it('should calculate positive points from spots created', () => {
      setState({ spotsCreated: 15 })
      const result = calculateReputation()
      expect(result.positiveBreakdown.spotsCreated.points).toBe(15)
    })

    it('should cap spots created points at max weight', () => {
      setState({ spotsCreated: 100 })
      const result = calculateReputation()
      expect(result.positiveBreakdown.spotsCreated.points).toBe(15)
    })

    it('should calculate points from identity verification level', () => {
      setState({ verificationLevel: 4 })
      const result = calculateReputation()
      expect(result.positiveBreakdown.identityVerification.points).toBe(25)
    })

    it('should give partial points for lower verification levels', () => {
      setState({ verificationLevel: 2 })
      const result = calculateReputation()
      expect(result.positiveBreakdown.identityVerification.points).toBe(12)
    })

    it('should calculate spot ratings only with enough rated spots', () => {
      setState({ avgSpotRating: 5, ratedSpotsCount: 2 })
      const result = calculateReputation()
      expect(result.positiveBreakdown.spotRatings.points).toBe(0) // Need 3+ rated spots
    })

    it('should calculate spot ratings with enough rated spots', () => {
      setState({ avgSpotRating: 4.5, ratedSpotsCount: 5 })
      const result = calculateReputation()
      expect(result.positiveBreakdown.spotRatings.points).toBe(20)
    })

    it('should apply penalty for valid reports received', () => {
      setState({ validReportsReceived: 2 })
      const result = calculateReputation()
      expect(result.negativeBreakdown.reportsReceived.penalty).toBe(20)
    })

    it('should cap report penalty at maximum', () => {
      setState({ validReportsReceived: 10 })
      const result = calculateReputation()
      expect(result.negativeBreakdown.reportsReceived.penalty).toBe(30)
    })

    it('should apply penalty for warnings', () => {
      setState({ warnings: 1 })
      const result = calculateReputation()
      expect(result.negativeBreakdown.warnings.penalty).toBe(15)
    })

    it('should apply penalty for suspicious activity flag', () => {
      setState({ flaggedSuspicious: true })
      const result = calculateReputation()
      expect(result.negativeBreakdown.suspiciousActivity.penalty).toBe(20)
    })

    it('should not go below 0 score with many penalties', () => {
      setState({
        validReportsReceived: 5,
        warnings: 3,
        flaggedSuspicious: true,
      })
      const result = calculateReputation()
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('should accept custom userStats parameter', () => {
      const result = calculateReputation({
        spotsCreated: 20,
        verificationLevel: 4,
        accountAgeDays: 400,
      })
      expect(result.positiveBreakdown.spotsCreated.points).toBe(15)
      expect(result.positiveBreakdown.identityVerification.points).toBe(25)
      expect(result.positiveBreakdown.seniority.points).toBe(15)
    })
  })

  describe('getUserReputation', () => {
    it('should return reputation based on current state', () => {
      setState({ spotsCreated: 10 })
      const result = getUserReputation()
      expect(result.positiveBreakdown.spotsCreated.points).toBeGreaterThan(0)
    })
  })

  describe('getUserReputationByData', () => {
    it('should calculate reputation from provided user data', () => {
      const userData = {
        spotsCreated: 15,
        verificationLevel: 3,
        reviewsGiven: 20,
        checkins: 50,
      }
      const result = getUserReputationByData(userData)
      expect(result.positiveBreakdown.spotsCreated.points).toBe(15)
    })
  })

  describe('renderStars', () => {
    it('should render correct number of filled stars', () => {
      const html = renderStars(3)
      const filledStars = (html.match(/fa-star"/g) || []).length
      expect(filledStars).toBe(3)
    })

    it('should render empty stars for remaining', () => {
      const html = renderStars(2)
      expect(html).toContain('far fa-star')
    })

    it('should include aria-label for accessibility', () => {
      const html = renderStars(4)
      expect(html).toContain('aria-label=')
      expect(html).toContain('4 etoiles sur 5')
    })

    it('should clamp stars to valid range', () => {
      const html1 = renderStars(0)
      expect(html1).toContain('1 etoiles sur 5')

      const html2 = renderStars(10)
      expect(html2).toContain('5 etoiles sur 5')
    })

    it('should support different sizes', () => {
      const smHtml = renderStars(3, 'sm')
      const lgHtml = renderStars(3, 'lg')
      expect(smHtml).toContain('text-xs')
      expect(lgHtml).toContain('text-lg')
    })
  })

  describe('renderReputationBadge', () => {
    it('should render badge with stars', () => {
      const html = renderReputationBadge(3)
      expect(html).toContain('reputation-badge')
      expect(html).toContain('reputation-stars')
    })

    it('should include label by default', () => {
      const html = renderReputationBadge(3, true)
      expect(html).toContain('Fiable')
    })

    it('should hide label when showLabel is false', () => {
      const html = renderReputationBadge(3, false)
      expect(html).not.toContain('Fiable</span>')
    })

    it('should use current user reputation when stars is null', () => {
      setState({ spotsCreated: 0, verificationLevel: 0 })
      const html = renderReputationBadge(null)
      expect(html).toContain('Nouveau')
    })

    it('should have correct background color style', () => {
      const html = renderReputationBadge(5)
      expect(html).toContain('background:')
    })
  })

  describe('renderReputationCard', () => {
    it('should render complete card structure', () => {
      const html = renderReputationCard()
      expect(html).toContain('reputation-card')
      expect(html).toContain('card')
    })

    it('should include star display', () => {
      const html = renderReputationCard()
      expect(html).toContain('reputation-stars')
    })

    it('should show factor breakdown', () => {
      const html = renderReputationCard()
      expect(html).toContain('Spots crees')
      expect(html).toContain('Verification identite')
    })

    it('should show progress bar when not at max level', () => {
      setState({ verificationLevel: 0 })
      const html = renderReputationCard()
      expect(html).toContain('Progression vers')
    })

    it('should show max reputation message at 5 stars', () => {
      setState({
        spotsCreated: 20,
        verificationLevel: 4,
        reviewsGiven: 30,
        checkins: 100,
        avgSpotRating: 5,
        ratedSpotsCount: 10,
        accountAgeDays: 400,
        helpfulVotesReceived: 50,
      })
      const html = renderReputationCard()
      expect(html).toContain('Reputation maximale atteinte')
    })

    it('should show improvement tips for non-max users', () => {
      setState({ verificationLevel: 0 })
      const html = renderReputationCard()
      expect(html).toContain('Ameliorer ta reputation')
    })

    it('should show penalties section when user has penalties', () => {
      setState({ validReportsReceived: 1 })
      const html = renderReputationCard()
      expect(html).toContain('Penalites')
    })
  })

  describe('renderMiniReputation', () => {
    it('should render mini indicator', () => {
      const html = renderMiniReputation(3)
      expect(html).toContain('mini-reputation')
      expect(html).toContain('3')
    })

    it('should include title with label', () => {
      const html = renderMiniReputation(4)
      expect(html).toContain('Experimente')
    })

    it('should clamp to valid range', () => {
      const html = renderMiniReputation(10)
      expect(html).toContain('5') // Star count clamped to max
      expect(html).toContain('Legende (5/5)')
    })
  })

  describe('updateReputationFactors', () => {
    it('should update state with provided factors', () => {
      updateReputationFactors({ spotsCreated: 5 })
      expect(getState().spotsCreated).toBe(5)
    })

    it('should show toast when reputation improves', () => {
      setState({ cachedReputation: { stars: 1 } })
      // Provide enough factors to improve
      updateReputationFactors({
        verificationLevel: 4,
        spotsCreated: 15,
        reviewsGiven: 20,
        checkins: 50,
        accountAgeDays: 400,
      })
      expect(showToast).toHaveBeenCalled()
    })

    it('should cache new reputation', () => {
      updateReputationFactors({ spotsCreated: 5 })
      expect(getState().cachedReputation).toBeDefined()
    })
  })

  describe('recordReportReceived', () => {
    it('should increment valid reports when report is valid', () => {
      recordReportReceived(true)
      expect(getState().validReportsReceived).toBe(1)
    })

    it('should not increment for invalid reports', () => {
      recordReportReceived(false)
      expect(getState().validReportsReceived).toBeFalsy()
    })

    it('should show warning toast when reputation drops', () => {
      setState({
        cachedReputation: { stars: 3 },
        spotsCreated: 10,
        verificationLevel: 2,
      })
      recordReportReceived(true)
      recordReportReceived(true)
      recordReportReceived(true)
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('diminue'),
        'warning'
      )
    })
  })

  describe('recordWarning', () => {
    it('should increment warnings count', () => {
      recordWarning()
      expect(getState().warnings).toBe(1)
    })

    it('should recalculate and cache reputation', () => {
      recordWarning()
      expect(getState().cachedReputation).toBeDefined()
    })
  })

  describe('getReputationFactors', () => {
    it('should return both positive and negative factors', () => {
      const factors = getReputationFactors()
      expect(factors.positive).toBe(REPUTATION_FACTORS)
      expect(factors.negative).toBe(NEGATIVE_FACTORS)
    })
  })

  describe('getStarDescriptions', () => {
    it('should return STAR_DESCRIPTIONS', () => {
      expect(getStarDescriptions()).toBe(STAR_DESCRIPTIONS)
    })
  })

  describe('hasMinimumReputation', () => {
    it('should return true when user has sufficient reputation', () => {
      setState({
        verificationLevel: 4,
        spotsCreated: 15,
        reviewsGiven: 20,
        checkins: 50,
      })
      expect(hasMinimumReputation(3)).toBe(true)
    })

    it('should return false when user has insufficient reputation', () => {
      setState({ verificationLevel: 0, spotsCreated: 0 })
      expect(hasMinimumReputation(3)).toBe(false)
    })
  })

  describe('Complete reputation scenarios', () => {
    it('should give 5 stars to a highly active verified user', () => {
      const result = calculateReputation({
        spotsCreated: 20,
        avgSpotRating: 4.8,
        ratedSpotsCount: 15,
        accountAgeDays: 500,
        verificationLevel: 4,
        reviewsGiven: 30,
        checkins: 100,
        helpfulVotesReceived: 50,
      })
      expect(result.stars).toBe(5)
    })

    it('should give 1 star to a new unverified user', () => {
      const result = calculateReputation({
        spotsCreated: 0,
        avgSpotRating: 0,
        ratedSpotsCount: 0,
        accountAgeDays: 5,
        verificationLevel: 0,
        reviewsGiven: 0,
        checkins: 0,
        helpfulVotesReceived: 0,
      })
      expect(result.stars).toBe(1)
    })

    it('should reduce reputation for user with reports', () => {
      const cleanResult = calculateReputation({
        spotsCreated: 10,
        verificationLevel: 2,
        accountAgeDays: 100,
      })

      const reportedResult = calculateReputation({
        spotsCreated: 10,
        verificationLevel: 2,
        accountAgeDays: 100,
        validReportsReceived: 2,
      })

      expect(reportedResult.score).toBeLessThan(cleanResult.score)
    })

    it('should reduce reputation for user with warnings', () => {
      const cleanResult = calculateReputation({
        spotsCreated: 10,
        verificationLevel: 2,
      })

      const warnedResult = calculateReputation({
        spotsCreated: 10,
        verificationLevel: 2,
        warnings: 1,
      })

      expect(warnedResult.score).toBeLessThan(cleanResult.score)
    })

    it('should heavily penalize flagged suspicious users', () => {
      const normalResult = calculateReputation({
        spotsCreated: 5,
        verificationLevel: 1,
      })

      const suspiciousResult = calculateReputation({
        spotsCreated: 5,
        verificationLevel: 1,
        flaggedSuspicious: true,
      })

      // Score should be reduced by suspicious penalty (20 points), but capped at 0 minimum
      const expectedScore = Math.max(0, normalResult.score - 20)
      expect(suspiciousResult.score).toBe(expectedScore)
      expect(suspiciousResult.negativeBreakdown.suspiciousActivity.penalty).toBe(20)
    })
  })

  describe('Accessibility', () => {
    it('should include role="img" on star display', () => {
      const html = renderStars(3)
      expect(html).toContain('role="img"')
    })

    it('should have aria-hidden on decorative icons', () => {
      const html = renderReputationCard()
      expect(html).toContain('aria-hidden="true"')
    })

    it('should include descriptive aria-label', () => {
      const html = renderReputationBadge(4)
      expect(html).toContain('aria-label')
      expect(html).toContain('4 etoiles')
    })
  })

  describe('No exact score visible (validated decision)', () => {
    it('should not display exact numeric score in renderStars', () => {
      const html = renderStars(3)
      // Score (0-100) should not appear, only small numbers in color codes are OK
      // Check that we don't show a score like "45" or "78" as actual displayed content
      expect(html).not.toContain('>45<')
      expect(html).not.toContain('>78<')
      // Should show star description, not score
      expect(html).toContain('Fiable')
    })

    it('should not display exact numeric score in renderReputationBadge', () => {
      const html = renderReputationBadge(4)
      // Should show star label, not numeric score
      expect(html).toContain('Experimente')
      // Should not contain score-like display text
      expect(html).not.toContain('/100')
    })

    it('should show star count but not score in mini reputation', () => {
      const html = renderMiniReputation(3)
      // Star count is shown (small number 1-5)
      expect(html).toContain('3')
      expect(html).toContain('Fiable (3/5)')
      // Should not show score like "45/100" or similar
      expect(html).not.toContain('/100')
    })
  })

  describe('Identity verification importance (validated decision)', () => {
    it('should give maximum bonus for full identity verification', () => {
      const unverified = calculateReputation({ verificationLevel: 0 })
      const fullyVerified = calculateReputation({ verificationLevel: 4 })

      const verificationBonus = fullyVerified.positiveBreakdown.identityVerification.points -
                                unverified.positiveBreakdown.identityVerification.points

      expect(verificationBonus).toBe(25) // Highest single factor
    })

    it('should make identity verification the most impactful factor', () => {
      expect(REPUTATION_FACTORS.identityVerification.weight).toBe(25)

      const otherWeights = Object.values(REPUTATION_FACTORS)
        .filter(f => f.id !== 'identityVerification')
        .map(f => f.weight)

      otherWeights.forEach(weight => {
        expect(weight).toBeLessThan(25)
      })
    })
  })
})
