/**
 * Exponential Progression Service Tests
 * Feature #158 - Progression exponentielle
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getProgressToNextLevel,
  getXPToNextLevel,
  formatXPDisplay,
  calculateLevelReward,
  getLevelInfo,
  getLevelTable,
  getProgressionConstants,
  renderXPProgressBar,
  RewardType,
} from '../src/services/exponentialProgression.js'

describe('Exponential Progression Service', () => {
  describe('Progression Constants', () => {
    it('should have correct base constants', () => {
      const constants = getProgressionConstants()
      expect(constants.BASE_XP).toBe(100)
      expect(constants.MULTIPLIER).toBe(1.5)
      expect(constants.MAX_LEVEL).toBe(100)
    })

    it('should have a pre-calculated level table', () => {
      const table = getLevelTable()
      expect(table.length).toBe(100)
      expect(table[0].level).toBe(1)
      expect(table[99].level).toBe(100)
    })

    it('should have cumulative XP in level table', () => {
      const table = getLevelTable()
      expect(table[0].cumulativeXP).toBe(0)
      expect(table[1].cumulativeXP).toBe(100) // After level 1
    })
  })

  describe('getXPForLevel - XP Formula', () => {
    it('should return 100 XP for level 1', () => {
      expect(getXPForLevel(1)).toBe(100)
    })

    it('should return 150 XP for level 2 (100 * 1.5)', () => {
      expect(getXPForLevel(2)).toBe(150)
    })

    it('should return 225 XP for level 3 (100 * 1.5^2)', () => {
      expect(getXPForLevel(3)).toBe(225)
    })

    it('should follow exponential formula: base * multiplier^(level-1)', () => {
      // Level 5: 100 * 1.5^4 = 506.25 -> 506
      expect(getXPForLevel(5)).toBe(506)
      // Level 10: 100 * 1.5^9 = 3844.33 -> 3844
      expect(getXPForLevel(10)).toBe(3844)
    })

    it('should return 0 for invalid levels', () => {
      expect(getXPForLevel(0)).toBe(0)
      expect(getXPForLevel(-1)).toBe(0)
      expect(getXPForLevel(-100)).toBe(0)
    })

    it('should handle non-number inputs', () => {
      expect(getXPForLevel(null)).toBe(0)
      expect(getXPForLevel(undefined)).toBe(0)
      expect(getXPForLevel('abc')).toBe(0)
      expect(getXPForLevel(NaN)).toBe(0)
    })

    it('should calculate XP beyond MAX_LEVEL', () => {
      const xp101 = getXPForLevel(101)
      const expected = Math.floor(100 * Math.pow(1.5, 100))
      expect(xp101).toBe(expected)
    })
  })

  describe('getTotalXPForLevel - Cumulative XP', () => {
    it('should return 0 for level 1', () => {
      expect(getTotalXPForLevel(1)).toBe(0)
    })

    it('should return 100 for level 2', () => {
      expect(getTotalXPForLevel(2)).toBe(100)
    })

    it('should return 250 for level 3 (100 + 150)', () => {
      expect(getTotalXPForLevel(3)).toBe(250)
    })

    it('should return 0 for invalid levels', () => {
      expect(getTotalXPForLevel(0)).toBe(0)
      expect(getTotalXPForLevel(-1)).toBe(0)
    })

    it('should handle non-number inputs', () => {
      expect(getTotalXPForLevel(null)).toBe(0)
      expect(getTotalXPForLevel(undefined)).toBe(0)
      expect(getTotalXPForLevel(NaN)).toBe(0)
    })

    it('should match level table values', () => {
      const table = getLevelTable()
      expect(getTotalXPForLevel(5)).toBe(table[4].cumulativeXP)
      expect(getTotalXPForLevel(10)).toBe(table[9].cumulativeXP)
    })
  })

  describe('getLevelFromXP - Level Calculation', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXP(0)).toBe(1)
    })

    it('should return level 1 for XP less than 100', () => {
      expect(getLevelFromXP(50)).toBe(1)
      expect(getLevelFromXP(99)).toBe(1)
    })

    it('should return level 2 for exactly 100 XP', () => {
      expect(getLevelFromXP(100)).toBe(2)
    })

    it('should return level 2 for XP between 100-249', () => {
      expect(getLevelFromXP(100)).toBe(2)
      expect(getLevelFromXP(200)).toBe(2)
      expect(getLevelFromXP(249)).toBe(2)
    })

    it('should return level 3 for XP 250+', () => {
      expect(getLevelFromXP(250)).toBe(3)
      expect(getLevelFromXP(400)).toBe(3)
    })

    it('should return level 1 for negative XP', () => {
      expect(getLevelFromXP(-100)).toBe(1)
      expect(getLevelFromXP(-1)).toBe(1)
    })

    it('should handle non-number inputs', () => {
      expect(getLevelFromXP(null)).toBe(1)
      expect(getLevelFromXP(undefined)).toBe(1)
      expect(getLevelFromXP('abc')).toBe(1)
      expect(getLevelFromXP(NaN)).toBe(1)
    })

    it('should correctly calculate high levels', () => {
      // Level 10 requires about 8600 cumulative XP
      const table = getLevelTable()
      const xpForLevel10 = table[9].cumulativeXP
      expect(getLevelFromXP(xpForLevel10)).toBe(10)
      expect(getLevelFromXP(xpForLevel10 - 1)).toBe(9)
    })

    it('should handle XP exactly at level boundaries', () => {
      const table = getLevelTable()
      // Test multiple level boundaries
      for (let i = 2; i <= 10; i++) {
        const boundary = table[i - 1].cumulativeXP
        expect(getLevelFromXP(boundary)).toBe(i)
        expect(getLevelFromXP(boundary - 1)).toBe(i - 1)
      }
    })
  })

  describe('getProgressToNextLevel - Progress Calculation', () => {
    it('should return 0% at start of level', () => {
      expect(getProgressToNextLevel(0)).toBe(0)
    })

    it('should return 50% at halfway point', () => {
      // Level 1 needs 100 XP to complete, halfway is 50 XP
      const progress = getProgressToNextLevel(50)
      expect(progress).toBe(50)
    })

    it('should return close to 100% near level boundary', () => {
      // 99 XP out of 100 needed for level 1
      const progress = getProgressToNextLevel(99)
      expect(progress).toBe(99)
    })

    it('should reset progress after leveling up', () => {
      // At exactly 100 XP, you're level 2 with 0% progress to level 3
      const progress = getProgressToNextLevel(100)
      expect(progress).toBe(0)
    })

    it('should calculate progress correctly mid-level', () => {
      // Level 2 needs 150 XP to complete (100-250 range)
      // At 175 XP, that's 75/150 = 50%
      const progress = getProgressToNextLevel(175)
      expect(progress).toBe(50)
    })

    it('should return 0 for negative XP', () => {
      expect(getProgressToNextLevel(-100)).toBe(0)
    })

    it('should handle non-number inputs', () => {
      expect(getProgressToNextLevel(null)).toBe(0)
      expect(getProgressToNextLevel(undefined)).toBe(0)
      expect(getProgressToNextLevel(NaN)).toBe(0)
    })

    it('should never exceed 100%', () => {
      const progress = getProgressToNextLevel(1000000000)
      expect(progress).toBeLessThanOrEqual(100)
    })
  })

  describe('getXPToNextLevel - Remaining XP', () => {
    it('should return 100 for 0 XP (need 100 to reach level 2)', () => {
      // Level 1 needs 100 XP to complete
      expect(getXPToNextLevel(0)).toBe(100)
    })

    it('should return 50 at halfway through level 1', () => {
      // Level 1 needs 100 XP, at 50 XP need 50 more
      expect(getXPToNextLevel(50)).toBe(50)
    })

    it('should return 150 at start of level 2', () => {
      // Level 2 needs 150 XP to complete
      expect(getXPToNextLevel(100)).toBe(150)
    })

    it('should return correct XP for mid-level', () => {
      // At 175 XP (level 2), which is 75 XP into level 2
      // Level 2 needs 150 XP to complete, so need 75 more
      expect(getXPToNextLevel(175)).toBe(75)
    })

    it('should never return negative values', () => {
      expect(getXPToNextLevel(-100)).toBeGreaterThanOrEqual(0)
    })

    it('should handle non-number inputs', () => {
      const result = getXPToNextLevel(null)
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('formatXPDisplay - Number Formatting', () => {
    it('should format small numbers as-is', () => {
      expect(formatXPDisplay(0)).toBe('0')
      expect(formatXPDisplay(100)).toBe('100')
      expect(formatXPDisplay(999)).toBe('999')
    })

    it('should format thousands with k suffix', () => {
      expect(formatXPDisplay(1000)).toBe('1k')
      expect(formatXPDisplay(1500)).toBe('1.5k')
      expect(formatXPDisplay(2500)).toBe('2.5k')
    })

    it('should format 10k+ without decimals', () => {
      expect(formatXPDisplay(10000)).toBe('10k')
      expect(formatXPDisplay(15000)).toBe('15k')
      expect(formatXPDisplay(150000)).toBe('150k')
    })

    it('should format millions with M suffix', () => {
      expect(formatXPDisplay(1000000)).toBe('1M')
      expect(formatXPDisplay(1500000)).toBe('1.5M')
      expect(formatXPDisplay(2500000)).toBe('2.5M')
    })

    it('should format 10M+ without decimals', () => {
      expect(formatXPDisplay(10000000)).toBe('10M')
      expect(formatXPDisplay(150000000)).toBe('150M')
    })

    it('should format billions with B suffix', () => {
      expect(formatXPDisplay(1000000000)).toBe('1B')
      expect(formatXPDisplay(1500000000)).toBe('1.5B')
      expect(formatXPDisplay(10000000000)).toBe('10B')
    })

    it('should handle negative numbers', () => {
      expect(formatXPDisplay(-1000)).toBe('-1k')
      expect(formatXPDisplay(-1500000)).toBe('-1.5M')
    })

    it('should handle non-number inputs', () => {
      expect(formatXPDisplay(null)).toBe('0')
      expect(formatXPDisplay(undefined)).toBe('0')
      expect(formatXPDisplay(NaN)).toBe('0')
      expect(formatXPDisplay('abc')).toBe('0')
    })

    it('should truncate decimals, not round', () => {
      expect(formatXPDisplay(1990)).toBe('1.9k')
      expect(formatXPDisplay(1999)).toBe('1.9k')
    })
  })

  describe('calculateLevelReward - Rewards System', () => {
    it('should return rewards object with correct structure', () => {
      const reward = calculateLevelReward(1)
      expect(reward).toHaveProperty('level')
      expect(reward).toHaveProperty('rewards')
      expect(reward).toHaveProperty('totalSkillPoints')
      expect(Array.isArray(reward.rewards)).toBe(true)
    })

    it('should give skill points for every level', () => {
      const reward = calculateLevelReward(1)
      const skillPointReward = reward.rewards.find(r => r.type === RewardType.SKILL_POINTS)
      expect(skillPointReward).toBeDefined()
      expect(skillPointReward.amount).toBeGreaterThan(0)
    })

    it('should give more skill points at higher levels', () => {
      const reward1 = calculateLevelReward(1)
      const reward20 = calculateLevelReward(20)
      expect(reward20.totalSkillPoints).toBeGreaterThan(reward1.totalSkillPoints)
    })

    it('should give bonus skill points at level milestones (every 5 levels)', () => {
      const reward5 = calculateLevelReward(5)
      const reward6 = calculateLevelReward(6)
      // Level 5 should have bonus, level 6 should not
      const bonusAt5 = reward5.rewards.filter(r => r.type === RewardType.SKILL_POINTS)
      const bonusAt6 = reward6.rewards.filter(r => r.type === RewardType.SKILL_POINTS)
      expect(bonusAt5.length).toBeGreaterThan(bonusAt6.length)
    })

    it('should give cosmetic rewards at specific levels', () => {
      const reward5 = calculateLevelReward(5)
      const cosmeticReward = reward5.rewards.find(r => r.type === RewardType.COSMETIC)
      expect(cosmeticReward).toBeDefined()
      expect(cosmeticReward.name).toBe('Cadre Bronze')
    })

    it('should give title reward at level 1', () => {
      const reward = calculateLevelReward(1)
      const titleReward = reward.rewards.find(r => r.type === RewardType.TITLE)
      expect(titleReward).toBeDefined()
      expect(titleReward.name).toBe('Debutant')
    })

    it('should give title reward at level 50', () => {
      const reward = calculateLevelReward(50)
      const titleReward = reward.rewards.find(r => r.type === RewardType.TITLE)
      expect(titleReward).toBeDefined()
      expect(titleReward.name).toBe('Maitre du Pouce')
    })

    it('should give XP multiplier bonus at level 25', () => {
      const reward = calculateLevelReward(25)
      const multiplierReward = reward.rewards.find(r => r.type === RewardType.MULTIPLIER)
      expect(multiplierReward).toBeDefined()
      expect(multiplierReward.amount).toBe(0.1)
    })

    it('should give feature unlock at level 5', () => {
      const reward = calculateLevelReward(5)
      const featureReward = reward.rewards.find(r => r.type === RewardType.FEATURE)
      expect(featureReward).toBeDefined()
      expect(featureReward.name).toBe('Ajout de spots')
    })

    it('should handle invalid level input', () => {
      const reward = calculateLevelReward(0)
      expect(reward.level).toBe(1)
      expect(reward.totalSkillPoints).toBe(0)
    })

    it('should handle negative level input', () => {
      const reward = calculateLevelReward(-5)
      expect(reward.level).toBe(1)
    })

    it('should have all reward types defined', () => {
      expect(RewardType.SKILL_POINTS).toBe('skill_points')
      expect(RewardType.COSMETIC).toBe('cosmetic')
      expect(RewardType.BADGE).toBe('badge')
      expect(RewardType.TITLE).toBe('title')
      expect(RewardType.MULTIPLIER).toBe('multiplier')
      expect(RewardType.FEATURE).toBe('feature')
    })
  })

  describe('getLevelInfo - Complete Level Information', () => {
    it('should return complete level info object', () => {
      const info = getLevelInfo(150)
      expect(info).toHaveProperty('level')
      expect(info).toHaveProperty('totalXP')
      expect(info).toHaveProperty('xpInCurrentLevel')
      expect(info).toHaveProperty('xpForNextLevel')
      expect(info).toHaveProperty('xpToNextLevel')
      expect(info).toHaveProperty('progress')
      expect(info).toHaveProperty('rewards')
    })

    it('should have correct values for 0 XP', () => {
      const info = getLevelInfo(0)
      expect(info.level).toBe(1)
      expect(info.totalXP).toBe(0)
      expect(info.xpInCurrentLevel).toBe(0)
      // Level 1 needs 100 XP to complete
      expect(info.xpForNextLevel).toBe(100)
      expect(info.progress).toBe(0)
    })

    it('should have correct values for mid-level', () => {
      const info = getLevelInfo(150)
      expect(info.level).toBe(2)
      expect(info.totalXP).toBe(150)
      expect(info.xpInCurrentLevel).toBe(50)
      // Level 2 needs 150 XP to complete
      expect(info.xpForNextLevel).toBe(150)
    })

    it('should include rewards for current level', () => {
      const info = getLevelInfo(100)
      expect(info.rewards).toBeDefined()
      expect(info.rewards.level).toBe(2)
    })
  })

  describe('renderXPProgressBar - HTML Rendering', () => {
    it('should return valid HTML string', () => {
      const html = renderXPProgressBar(50)
      expect(typeof html).toBe('string')
      expect(html).toContain('xp-progress-container')
    })

    it('should include level labels by default', () => {
      const html = renderXPProgressBar(50)
      expect(html).toContain('Niveau 1')
      expect(html).toContain('Niveau 2')
    })

    it('should include XP values by default', () => {
      const html = renderXPProgressBar(50)
      expect(html).toContain('XP')
      expect(html).toContain('restant')
    })

    it('should hide labels when showLabel is false', () => {
      const html = renderXPProgressBar(50, { showLabel: false })
      expect(html).not.toContain('Niveau 1')
    })

    it('should hide XP when showXP is false', () => {
      const html = renderXPProgressBar(50, { showXP: false })
      expect(html).not.toContain('restant')
    })

    it('should apply different sizes', () => {
      const smallHtml = renderXPProgressBar(50, { size: 'sm' })
      const largeHtml = renderXPProgressBar(50, { size: 'lg' })
      expect(smallHtml).toContain('h-2')
      expect(largeHtml).toContain('h-4')
    })

    it('should include animation class by default', () => {
      const html = renderXPProgressBar(50)
      expect(html).toContain('transition-all')
    })

    it('should exclude animation when animated is false', () => {
      const html = renderXPProgressBar(50, { animated: false })
      expect(html).not.toContain('transition-all')
    })

    it('should show correct progress percentage in style', () => {
      // 50 XP out of 100 needed for level 1 = 50%
      const html = renderXPProgressBar(50)
      expect(html).toContain('style="width: 50%"')
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very large XP values beyond level 100', () => {
      // Get XP needed to reach level 100, then add more
      const table = getLevelTable()
      const xpFor100 = table[99].cumulativeXP + table[99].xpRequired
      // Add enough XP to go beyond level 100
      const level = getLevelFromXP(xpFor100 + 1000000000)
      expect(level).toBeGreaterThan(100)
    })

    it('should handle level MAX_LEVEL (100)', () => {
      const table = getLevelTable()
      const xpFor100 = table[99].cumulativeXP
      expect(getLevelFromXP(xpFor100)).toBe(100)
    })

    it('should handle floating point XP', () => {
      const level = getLevelFromXP(100.5)
      expect(level).toBe(2)
    })

    it('should maintain consistency between functions', () => {
      // getLevelFromXP and getTotalXPForLevel should be consistent
      for (let level = 1; level <= 20; level++) {
        const xp = getTotalXPForLevel(level)
        expect(getLevelFromXP(xp)).toBe(level)
      }
    })

    it('should handle XP just below and at level boundaries', () => {
      const table = getLevelTable()
      for (let i = 2; i <= 5; i++) {
        const boundary = table[i - 1].cumulativeXP
        expect(getLevelFromXP(boundary - 1)).toBe(i - 1)
        expect(getLevelFromXP(boundary)).toBe(i)
      }
    })

    it('should format edge case numbers correctly', () => {
      expect(formatXPDisplay(999)).toBe('999')
      expect(formatXPDisplay(1000)).toBe('1k')
      expect(formatXPDisplay(9999)).toBe('9.9k')
      expect(formatXPDisplay(10000)).toBe('10k')
    })
  })

  describe('Integration Tests', () => {
    it('should have consistent progression from level 1 to 10', () => {
      let currentXP = 0
      let previousLevelXP = 0

      for (let level = 1; level <= 10; level++) {
        const xpNeeded = getXPForLevel(level)
        expect(getLevelFromXP(currentXP)).toBe(level)

        // Each level should require more XP than the previous
        if (level > 1) {
          expect(xpNeeded).toBeGreaterThan(previousLevelXP)
        }

        previousLevelXP = xpNeeded
        currentXP += xpNeeded
      }
    })

    it('should give appropriate rewards throughout progression', () => {
      let totalSkillPoints = 0
      let cosmeticCount = 0
      let titleCount = 0

      for (let level = 1; level <= 50; level++) {
        const reward = calculateLevelReward(level)
        totalSkillPoints += reward.totalSkillPoints
        cosmeticCount += reward.rewards.filter(r => r.type === RewardType.COSMETIC).length
        titleCount += reward.rewards.filter(r => r.type === RewardType.TITLE).length
      }

      expect(totalSkillPoints).toBeGreaterThan(50) // At least 1 per level
      expect(cosmeticCount).toBeGreaterThan(5) // Multiple cosmetics
      expect(titleCount).toBeGreaterThan(3) // Multiple titles
    })

    it('should calculate XP to next level correctly at any point', () => {
      for (let xp = 0; xp <= 1000; xp += 50) {
        const level = getLevelFromXP(xp)
        const toNext = getXPToNextLevel(xp)
        const progress = getProgressToNextLevel(xp)

        // XP to next should be positive
        expect(toNext).toBeGreaterThanOrEqual(0)

        // Progress should be between 0 and 100
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)

        // Adding XP to next should level up
        const nextLevel = getLevelFromXP(xp + toNext)
        expect(nextLevel).toBe(level + 1)
      }
    })

    it('should format XP display consistently across ranges', () => {
      const testValues = [0, 100, 999, 1000, 5000, 10000, 100000, 1000000, 10000000]

      for (const value of testValues) {
        const formatted = formatXPDisplay(value)
        expect(typeof formatted).toBe('string')
        expect(formatted.length).toBeLessThan(10)
      }
    })
  })
})
