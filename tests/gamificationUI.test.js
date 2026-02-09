import { describe, it, expect, beforeEach, vi } from 'vitest'
import gamificationUI, {
  UIComplexityLevel,
  UIElement,
  initGamificationUI,
  resetGamificationUI,
  getUIComplexityLevel,
  getVisibleElements,
  isElementVisible,
  setCustomVisibility,
  getCustomVisibility,
  resetCustomVisibility,
  getElementUnlockLevel,
  getCompactMode,
  setCompactMode,
  getAnimationsEnabled,
  setAnimationsEnabled,
  getNotificationsEnabled,
  setNotificationsEnabled,
  getLayoutConfig,
  renderGamificationPanel,
  renderSimplifiedBadges,
  renderProgressBar,
  renderLevelUpNotification,
  renderSettingsPanel,
  renderElementPreview,
  getGamificationUIStats,
} from '../src/services/gamificationUI.js'

describe('gamificationUI', () => {
  beforeEach(() => {
    localStorage.clear()
    resetGamificationUI()
    vi.clearAllMocks()
  })

  describe('UIComplexityLevel enum', () => {
    it('should have 4 complexity levels', () => {
      expect(UIComplexityLevel.BEGINNER).toBe('BEGINNER')
      expect(UIComplexityLevel.INTERMEDIATE).toBe('INTERMEDIATE')
      expect(UIComplexityLevel.ADVANCED).toBe('ADVANCED')
      expect(UIComplexityLevel.EXPERT).toBe('EXPERT')
    })
  })

  describe('UIElement enum', () => {
    it('should have 10 UI elements', () => {
      const elements = Object.keys(UIElement)
      expect(elements).toHaveLength(10)
      expect(elements).toContain('POINTS_DISPLAY')
      expect(elements).toContain('LEVEL_BAR')
      expect(elements).toContain('BADGES')
      expect(elements).toContain('LEADERBOARD')
      expect(elements).toContain('QUESTS')
      expect(elements).toContain('STREAKS')
      expect(elements).toContain('SEASONS')
      expect(elements).toContain('GUILDS')
      expect(elements).toContain('ACHIEVEMENTS')
      expect(elements).toContain('FRIEND_CHALLENGES')
    })
  })

  describe('initGamificationUI', () => {
    it('should initialize with default level 1', () => {
      initGamificationUI()
      const stats = getGamificationUIStats()
      expect(stats.initialized).toBe(true)
      expect(stats.currentUserLevel).toBe(1)
    })

    it('should initialize with specified user level', () => {
      initGamificationUI(10)
      const stats = getGamificationUIStats()
      expect(stats.currentUserLevel).toBe(10)
    })

    it('should load settings from storage if available', () => {
      localStorage.setItem('spothitch_gamification_ui', JSON.stringify({
        compactMode: true,
        animationsEnabled: false,
        notificationsEnabled: false,
        customVisibility: { BADGES: false },
      }))

      initGamificationUI(5)
      expect(getCompactMode()).toBe(true)
      expect(getAnimationsEnabled()).toBe(false)
      expect(getNotificationsEnabled()).toBe(false)
      expect(getCustomVisibility()).toEqual({ BADGES: false })
    })

    it('should not re-initialize if already initialized', () => {
      initGamificationUI(5)
      initGamificationUI(10)
      const stats = getGamificationUIStats()
      expect(stats.currentUserLevel).toBe(5) // Should keep first value
    })
  })

  describe('getUIComplexityLevel', () => {
    it('should return BEGINNER for levels 1-5', () => {
      expect(getUIComplexityLevel(1)).toBe(UIComplexityLevel.BEGINNER)
      expect(getUIComplexityLevel(3)).toBe(UIComplexityLevel.BEGINNER)
      expect(getUIComplexityLevel(5)).toBe(UIComplexityLevel.BEGINNER)
    })

    it('should return INTERMEDIATE for levels 6-15', () => {
      expect(getUIComplexityLevel(6)).toBe(UIComplexityLevel.INTERMEDIATE)
      expect(getUIComplexityLevel(10)).toBe(UIComplexityLevel.INTERMEDIATE)
      expect(getUIComplexityLevel(15)).toBe(UIComplexityLevel.INTERMEDIATE)
    })

    it('should return ADVANCED for levels 16-30', () => {
      expect(getUIComplexityLevel(16)).toBe(UIComplexityLevel.ADVANCED)
      expect(getUIComplexityLevel(20)).toBe(UIComplexityLevel.ADVANCED)
      expect(getUIComplexityLevel(30)).toBe(UIComplexityLevel.ADVANCED)
    })

    it('should return EXPERT for levels 31+', () => {
      expect(getUIComplexityLevel(31)).toBe(UIComplexityLevel.EXPERT)
      expect(getUIComplexityLevel(50)).toBe(UIComplexityLevel.EXPERT)
      expect(getUIComplexityLevel(100)).toBe(UIComplexityLevel.EXPERT)
    })
  })

  describe('getVisibleElements', () => {
    it('should return only POINTS_DISPLAY and LEVEL_BAR for BEGINNER (level 1-5)', () => {
      const visible = getVisibleElements(1)
      expect(visible).toHaveLength(2)
      expect(visible).toContain('POINTS_DISPLAY')
      expect(visible).toContain('LEVEL_BAR')
    })

    it('should return 5 elements for INTERMEDIATE (level 6-15)', () => {
      const visible = getVisibleElements(10)
      expect(visible).toHaveLength(5)
      expect(visible).toContain('POINTS_DISPLAY')
      expect(visible).toContain('LEVEL_BAR')
      expect(visible).toContain('BADGES')
      expect(visible).toContain('QUESTS')
      expect(visible).toContain('STREAKS')
    })

    it('should return 8 elements for ADVANCED (level 16-30)', () => {
      const visible = getVisibleElements(20)
      expect(visible).toHaveLength(8)
      expect(visible).toContain('LEADERBOARD')
      expect(visible).toContain('SEASONS')
      expect(visible).toContain('ACHIEVEMENTS')
    })

    it('should return all 10 elements for EXPERT (level 31+)', () => {
      const visible = getVisibleElements(35)
      expect(visible).toHaveLength(10)
      expect(visible).toContain('GUILDS')
      expect(visible).toContain('FRIEND_CHALLENGES')
    })

    it('should respect custom visibility overrides', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true) // Force enable badges at level 1

      const visible = getVisibleElements(1)
      expect(visible).toContain('BADGES')
    })

    it('should hide elements with custom visibility set to false', () => {
      initGamificationUI(10)
      setCustomVisibility('BADGES', false)

      const visible = getVisibleElements(10)
      expect(visible).not.toContain('BADGES')
    })
  })

  describe('isElementVisible', () => {
    it('should return true if element is unlocked at user level', () => {
      expect(isElementVisible('POINTS_DISPLAY', 1)).toBe(true)
      expect(isElementVisible('BADGES', 10)).toBe(true)
    })

    it('should return false if element is locked at user level', () => {
      expect(isElementVisible('BADGES', 5)).toBe(false)
      expect(isElementVisible('GUILDS', 20)).toBe(false)
    })

    it('should respect custom visibility overrides', () => {
      initGamificationUI(1)
      setCustomVisibility('GUILDS', true)

      expect(isElementVisible('GUILDS', 1)).toBe(true)
    })

    it('should return false for invalid element', () => {
      expect(isElementVisible('INVALID', 10)).toBe(false)
    })
  })

  describe('setCustomVisibility', () => {
    it('should set custom visibility for valid element', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true)

      expect(getCustomVisibility()).toEqual({ BADGES: true })
    })

    it('should persist custom visibility to storage', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true)

      const stored = JSON.parse(localStorage.getItem('spothitch_gamification_ui'))
      expect(stored.customVisibility).toEqual({ BADGES: true })
    })

    it('should warn for invalid element', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      initGamificationUI(1)
      setCustomVisibility('INVALID', true)

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should allow multiple custom visibility overrides', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true)
      setCustomVisibility('GUILDS', false)

      expect(getCustomVisibility()).toEqual({ BADGES: true, GUILDS: false })
    })
  })

  describe('getCustomVisibility', () => {
    it('should return empty object if no overrides', () => {
      initGamificationUI(1)
      expect(getCustomVisibility()).toEqual({})
    })

    it('should return all custom visibility overrides', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true)
      setCustomVisibility('GUILDS', false)

      const custom = getCustomVisibility()
      expect(custom).toEqual({ BADGES: true, GUILDS: false })
    })

    it('should return a copy, not the original object', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true)

      const custom1 = getCustomVisibility()
      custom1.QUESTS = false

      const custom2 = getCustomVisibility()
      expect(custom2).toEqual({ BADGES: true })
    })
  })

  describe('resetCustomVisibility', () => {
    it('should clear all custom visibility overrides', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true)
      setCustomVisibility('GUILDS', false)

      resetCustomVisibility()
      expect(getCustomVisibility()).toEqual({})
    })

    it('should persist reset to storage', () => {
      initGamificationUI(1)
      setCustomVisibility('BADGES', true)
      resetCustomVisibility()

      const stored = JSON.parse(localStorage.getItem('spothitch_gamification_ui'))
      expect(stored.customVisibility).toEqual({})
    })
  })

  describe('getElementUnlockLevel', () => {
    it('should return correct unlock level for each element', () => {
      expect(getElementUnlockLevel('POINTS_DISPLAY')).toBe(1)
      expect(getElementUnlockLevel('LEVEL_BAR')).toBe(1)
      expect(getElementUnlockLevel('BADGES')).toBe(6)
      expect(getElementUnlockLevel('QUESTS')).toBe(6)
      expect(getElementUnlockLevel('STREAKS')).toBe(6)
      expect(getElementUnlockLevel('LEADERBOARD')).toBe(16)
      expect(getElementUnlockLevel('SEASONS')).toBe(16)
      expect(getElementUnlockLevel('ACHIEVEMENTS')).toBe(16)
      expect(getElementUnlockLevel('GUILDS')).toBe(31)
      expect(getElementUnlockLevel('FRIEND_CHALLENGES')).toBe(31)
    })

    it('should return null for invalid element', () => {
      expect(getElementUnlockLevel('INVALID')).toBeNull()
    })
  })

  describe('getCompactMode', () => {
    it('should return false by default', () => {
      initGamificationUI(1)
      expect(getCompactMode()).toBe(false)
    })

    it('should return current compact mode setting', () => {
      initGamificationUI(1)
      setCompactMode(true)
      expect(getCompactMode()).toBe(true)
    })
  })

  describe('setCompactMode', () => {
    it('should set compact mode to true', () => {
      initGamificationUI(1)
      setCompactMode(true)
      expect(getCompactMode()).toBe(true)
    })

    it('should set compact mode to false', () => {
      initGamificationUI(1)
      setCompactMode(true)
      setCompactMode(false)
      expect(getCompactMode()).toBe(false)
    })

    it('should persist to storage', () => {
      initGamificationUI(1)
      setCompactMode(true)

      const stored = JSON.parse(localStorage.getItem('spothitch_gamification_ui'))
      expect(stored.compactMode).toBe(true)
    })

    it('should coerce non-boolean values', () => {
      initGamificationUI(1)
      setCompactMode(1)
      expect(getCompactMode()).toBe(true)

      setCompactMode(0)
      expect(getCompactMode()).toBe(false)
    })
  })

  describe('getAnimationsEnabled', () => {
    it('should return true by default', () => {
      initGamificationUI(1)
      expect(getAnimationsEnabled()).toBe(true)
    })

    it('should return current animations setting', () => {
      initGamificationUI(1)
      setAnimationsEnabled(false)
      expect(getAnimationsEnabled()).toBe(false)
    })
  })

  describe('setAnimationsEnabled', () => {
    it('should set animations to false', () => {
      initGamificationUI(1)
      setAnimationsEnabled(false)
      expect(getAnimationsEnabled()).toBe(false)
    })

    it('should set animations to true', () => {
      initGamificationUI(1)
      setAnimationsEnabled(false)
      setAnimationsEnabled(true)
      expect(getAnimationsEnabled()).toBe(true)
    })

    it('should persist to storage', () => {
      initGamificationUI(1)
      setAnimationsEnabled(false)

      const stored = JSON.parse(localStorage.getItem('spothitch_gamification_ui'))
      expect(stored.animationsEnabled).toBe(false)
    })
  })

  describe('getNotificationsEnabled', () => {
    it('should return true by default', () => {
      initGamificationUI(1)
      expect(getNotificationsEnabled()).toBe(true)
    })

    it('should return current notifications setting', () => {
      initGamificationUI(1)
      setNotificationsEnabled(false)
      expect(getNotificationsEnabled()).toBe(false)
    })
  })

  describe('setNotificationsEnabled', () => {
    it('should set notifications to false', () => {
      initGamificationUI(1)
      setNotificationsEnabled(false)
      expect(getNotificationsEnabled()).toBe(false)
    })

    it('should set notifications to true', () => {
      initGamificationUI(1)
      setNotificationsEnabled(false)
      setNotificationsEnabled(true)
      expect(getNotificationsEnabled()).toBe(true)
    })

    it('should persist to storage', () => {
      initGamificationUI(1)
      setNotificationsEnabled(false)

      const stored = JSON.parse(localStorage.getItem('spothitch_gamification_ui'))
      expect(stored.notificationsEnabled).toBe(false)
    })
  })

  describe('getLayoutConfig', () => {
    it('should return complete layout config for BEGINNER', () => {
      initGamificationUI(1)
      const config = getLayoutConfig(3)

      expect(config.complexity).toBe(UIComplexityLevel.BEGINNER)
      expect(config.userLevel).toBe(3)
      expect(config.visibleElements).toHaveLength(2)
      expect(config.compactMode).toBe(false)
      expect(config.animationsEnabled).toBe(true)
      expect(config.notificationsEnabled).toBe(true)
      expect(config.elementsCount).toBe(2)
    })

    it('should return complete layout config for INTERMEDIATE', () => {
      const config = getLayoutConfig(10)

      expect(config.complexity).toBe(UIComplexityLevel.INTERMEDIATE)
      expect(config.elementsCount).toBe(5)
    })

    it('should return complete layout config for ADVANCED', () => {
      const config = getLayoutConfig(20)

      expect(config.complexity).toBe(UIComplexityLevel.ADVANCED)
      expect(config.elementsCount).toBe(8)
    })

    it('should return complete layout config for EXPERT', () => {
      const config = getLayoutConfig(35)

      expect(config.complexity).toBe(UIComplexityLevel.EXPERT)
      expect(config.elementsCount).toBe(10)
    })

    it('should reflect current settings in config', () => {
      initGamificationUI(10)
      setCompactMode(true)
      setAnimationsEnabled(false)

      const config = getLayoutConfig(10)
      expect(config.compactMode).toBe(true)
      expect(config.animationsEnabled).toBe(false)
    })
  })

  describe('renderGamificationPanel', () => {
    it('should render panel with points display for BEGINNER', () => {
      const html = renderGamificationPanel(3, { points: 150 })
      expect(html).toContain('gamification-panel')
      expect(html).toContain('points-display')
      expect(html).toContain('150')
    })

    it('should render level bar for BEGINNER', () => {
      const html = renderGamificationPanel(3, { points: 250 })
      expect(html).toContain('level-bar')
      expect(html).toContain('Niveau 3')
    })

    it('should render badges for INTERMEDIATE', () => {
      const badges = [
        { name: 'Badge 1', icon: '🏅' },
        { name: 'Badge 2', icon: '🎖️' },
      ]
      const html = renderGamificationPanel(10, { badges })
      expect(html).toContain('badges-section')
      expect(html).toContain('🏅')
      expect(html).toContain('🎖️')
    })

    it('should render streak for INTERMEDIATE', () => {
      const html = renderGamificationPanel(10, { streak: 7 })
      expect(html).toContain('streak-display')
      expect(html).toContain('🔥')
      expect(html).toContain('7')
    })

    it('should render leaderboard rank for ADVANCED', () => {
      const html = renderGamificationPanel(20, { rank: 42 })
      expect(html).toContain('rank-display')
      expect(html).toContain('🏆')
      expect(html).toContain('#42')
    })

    it('should add compact class when compact mode enabled', () => {
      const html = renderGamificationPanel(10, {}, { compact: true })
      expect(html).toContain('compact')
    })

    it('should include complexity level in data attribute', () => {
      const html = renderGamificationPanel(10, {})
      expect(html).toContain('data-complexity="INTERMEDIATE"')
    })

    it('should support different languages', () => {
      const html = renderGamificationPanel(10, { points: 100 }, { lang: 'en' })
      expect(html).toContain('Level 10')
      expect(html).toContain('Points')
    })

    it('should not render badges section if no badges', () => {
      const html = renderGamificationPanel(10, { badges: [] })
      expect(html).not.toContain('badges-section')
    })

    it('should not render streak if zero', () => {
      const html = renderGamificationPanel(10, { streak: 0 })
      expect(html).not.toContain('streak-display')
    })

    it('should not render rank if null', () => {
      const html = renderGamificationPanel(20, { rank: null })
      expect(html).not.toContain('rank-display')
    })
  })

  describe('renderSimplifiedBadges', () => {
    it('should render all badges if under max', () => {
      const badges = [
        { name: 'Badge 1', icon: '🏅' },
        { name: 'Badge 2', icon: '🎖️' },
      ]
      const html = renderSimplifiedBadges(badges, 6)
      expect(html).toContain('🏅')
      expect(html).toContain('🎖️')
      expect(html).not.toContain('badge-item more')
    })

    it('should show +N for remaining badges', () => {
      const badges = Array.from({ length: 10 }, (_, i) => ({
        name: `Badge ${i}`,
        icon: '🏅',
      }))
      const html = renderSimplifiedBadges(badges, 6)
      expect(html).toContain('+4')
    })

    it('should default to 6 max visible', () => {
      const badges = Array.from({ length: 10 }, (_, i) => ({
        name: `Badge ${i}`,
        icon: '🏅',
      }))
      const html = renderSimplifiedBadges(badges)
      expect(html).toContain('+4')
    })

    it('should use default icon if badge has no icon', () => {
      const badges = [{ name: 'Badge 1' }]
      const html = renderSimplifiedBadges(badges)
      expect(html).toContain('🏅')
    })

    it('should include aria-label for badges', () => {
      const badges = [{ name: 'Master Badge', icon: '🏆' }]
      const html = renderSimplifiedBadges(badges)
      expect(html).toContain('aria-label="Master Badge"')
    })
  })

  describe('renderProgressBar', () => {
    it('should render progress bar with percentage', () => {
      const html = renderProgressBar(50, 100)
      expect(html).toContain('progress-bar-container')
      expect(html).toContain('width: 50%')
    })

    it('should clamp percentage to 0-100', () => {
      const html1 = renderProgressBar(150, 100)
      expect(html1).toContain('width: 100%')

      const html2 = renderProgressBar(-10, 100)
      expect(html2).toContain('width: 0%')
    })

    it('should render label if provided', () => {
      const html = renderProgressBar(50, 100, { label: 'XP Progress' })
      expect(html).toContain('XP Progress')
    })

    it('should show percentage if enabled', () => {
      const html = renderProgressBar(75, 100, { showPercentage: true })
      expect(html).toContain('75%')
    })

    it('should hide percentage if disabled', () => {
      const html = renderProgressBar(75, 100, { showPercentage: false, label: 'Test' })
      expect(html).toContain('Test')
      // Should not show percentage text in label
      expect(html).not.toContain('<span>75%</span>')
      // Progress fill should still be at 75%
      expect(html).toContain('width: 75%')
    })

    it('should use custom color', () => {
      const html = renderProgressBar(50, 100, { color: '#FF0000' })
      expect(html).toContain('background-color: #FF0000')
    })

    it('should use custom height', () => {
      const html = renderProgressBar(50, 100, { height: '16px' })
      expect(html).toContain('height: 16px')
    })

    it('should include ARIA attributes', () => {
      const html = renderProgressBar(60, 100)
      expect(html).toContain('role="progressbar"')
      expect(html).toContain('aria-valuenow="60"')
      expect(html).toContain('aria-valuemin="0"')
      expect(html).toContain('aria-valuemax="100"')
    })
  })

  describe('renderLevelUpNotification', () => {
    it('should render level up notification with new level', () => {
      const html = renderLevelUpNotification(5)
      expect(html).toContain('level-up-notification')
      expect(html).toContain('Niveau supérieur !')
      expect(html).toContain('Niveau 5')
    })

    it('should include celebration icon', () => {
      const html = renderLevelUpNotification(10)
      expect(html).toContain('🎉')
    })

    it('should show unlocked elements if provided', () => {
      const html = renderLevelUpNotification(6, ['BADGES', 'QUESTS'])
      expect(html).toContain('Nouveaux éléments débloqués')
      expect(html).toContain('Badges')
      expect(html).toContain('Quêtes')
    })

    it('should not show unlocked section if no elements', () => {
      const html = renderLevelUpNotification(5, [])
      expect(html).not.toContain('unlocked-elements')
    })

    it('should support different languages', () => {
      const html = renderLevelUpNotification(10, ['BADGES'], { lang: 'en' })
      expect(html).toContain('Level up!')
      expect(html).toContain('Level 10')
      expect(html).toContain('New elements unlocked')
      expect(html).toContain('Badges')
    })

    it('should include ARIA attributes for accessibility', () => {
      const html = renderLevelUpNotification(5)
      expect(html).toContain('role="alert"')
      expect(html).toContain('aria-live="assertive"')
    })

    it('should show unlock icon for each element', () => {
      const html = renderLevelUpNotification(16, ['LEADERBOARD', 'SEASONS', 'ACHIEVEMENTS'])
      expect(html).toContain('🔓')
      expect((html.match(/🔓/g) || []).length).toBe(3)
    })
  })

  describe('renderSettingsPanel', () => {
    it('should render settings panel with all toggles', () => {
      initGamificationUI(1)
      const html = renderSettingsPanel()
      expect(html).toContain('gamification-settings-panel')
      expect(html).toContain('Mode compact')
      expect(html).toContain('Animations')
      expect(html).toContain('Notifications')
    })

    it('should show checked state for compact mode', () => {
      initGamificationUI(1)
      setCompactMode(true)
      const html = renderSettingsPanel()
      expect(html).toContain('checked')
    })

    it('should show unchecked state for animations if disabled', () => {
      initGamificationUI(1)
      setAnimationsEnabled(false)
      const html = renderSettingsPanel()
      // Should have 1 checked attribute (notifications=true), compact and animations are false
      // Count only 'checked' as an attribute, not in function names
      const checkedAttributes = (html.match(/type="checkbox" checked/g) || []).length
      expect(checkedAttributes).toBe(1) // Only notifications checkbox is checked
    })

    it('should include customize button', () => {
      const html = renderSettingsPanel()
      expect(html).toContain('btn-customize')
      expect(html).toContain('Personnaliser')
    })

    it('should support different languages', () => {
      initGamificationUI(1)
      const html = renderSettingsPanel({ lang: 'en' })
      expect(html).toContain('Settings')
      expect(html).toContain('Compact mode')
      expect(html).toContain('Customize')
    })

    it('should include window handlers in onchange attributes', () => {
      const html = renderSettingsPanel()
      expect(html).toContain('window.toggleGamificationCompactMode')
      expect(html).toContain('window.toggleGamificationAnimations')
      expect(html).toContain('window.toggleGamificationNotifications')
      expect(html).toContain('window.openGamificationCustomize')
    })
  })

  describe('renderElementPreview', () => {
    it('should render locked element preview', () => {
      const html = renderElementPreview('GUILDS')
      expect(html).toContain('element-preview locked')
      expect(html).toContain('🔒')
      expect(html).toContain('Guildes')
      expect(html).toContain('Débloqué au niveau 31')
    })

    it('should include element description', () => {
      const html = renderElementPreview('BADGES')
      expect(html).toContain('Vos badges débloqués')
    })

    it('should return empty string for invalid element', () => {
      const html = renderElementPreview('INVALID')
      expect(html).toBe('')
    })

    it('should support different languages', () => {
      const html = renderElementPreview('GUILDS', { lang: 'en' })
      expect(html).toContain('Guilds')
      expect(html).toContain('Unlocked at level 31')
    })

    it('should include data attribute for element', () => {
      const html = renderElementPreview('LEADERBOARD')
      expect(html).toContain('data-element="LEADERBOARD"')
    })
  })

  describe('getGamificationUIStats', () => {
    it('should return complete stats object', () => {
      initGamificationUI(10)
      const stats = getGamificationUIStats()

      expect(stats).toHaveProperty('initialized')
      expect(stats).toHaveProperty('currentUserLevel')
      expect(stats).toHaveProperty('complexity')
      expect(stats).toHaveProperty('visibleElementsCount')
      expect(stats).toHaveProperty('totalElements')
      expect(stats).toHaveProperty('customOverridesCount')
      expect(stats).toHaveProperty('compactMode')
      expect(stats).toHaveProperty('animationsEnabled')
      expect(stats).toHaveProperty('notificationsEnabled')
    })

    it('should reflect current state', () => {
      initGamificationUI(10)
      setCompactMode(true)
      setCustomVisibility('BADGES', false)

      const stats = getGamificationUIStats()
      expect(stats.currentUserLevel).toBe(10)
      expect(stats.complexity).toBe(UIComplexityLevel.INTERMEDIATE)
      expect(stats.compactMode).toBe(true)
      expect(stats.customOverridesCount).toBe(1)
    })

    it('should count total elements correctly', () => {
      initGamificationUI(1)
      const stats = getGamificationUIStats()
      expect(stats.totalElements).toBe(10)
    })

    it('should count visible elements for BEGINNER', () => {
      initGamificationUI(3)
      const stats = getGamificationUIStats()
      expect(stats.visibleElementsCount).toBe(2)
    })

    it('should count visible elements for EXPERT', () => {
      initGamificationUI(50)
      const stats = getGamificationUIStats()
      expect(stats.visibleElementsCount).toBe(10)
    })
  })

  describe('default export', () => {
    it('should export all functions', () => {
      expect(gamificationUI).toHaveProperty('UIComplexityLevel')
      expect(gamificationUI).toHaveProperty('UIElement')
      expect(gamificationUI).toHaveProperty('initGamificationUI')
      expect(gamificationUI).toHaveProperty('getUIComplexityLevel')
      expect(gamificationUI).toHaveProperty('getVisibleElements')
      expect(gamificationUI).toHaveProperty('isElementVisible')
      expect(gamificationUI).toHaveProperty('setCustomVisibility')
      expect(gamificationUI).toHaveProperty('getCustomVisibility')
      expect(gamificationUI).toHaveProperty('resetCustomVisibility')
      expect(gamificationUI).toHaveProperty('getElementUnlockLevel')
      expect(gamificationUI).toHaveProperty('getCompactMode')
      expect(gamificationUI).toHaveProperty('setCompactMode')
      expect(gamificationUI).toHaveProperty('getAnimationsEnabled')
      expect(gamificationUI).toHaveProperty('setAnimationsEnabled')
      expect(gamificationUI).toHaveProperty('getNotificationsEnabled')
      expect(gamificationUI).toHaveProperty('setNotificationsEnabled')
      expect(gamificationUI).toHaveProperty('getLayoutConfig')
      expect(gamificationUI).toHaveProperty('renderGamificationPanel')
      expect(gamificationUI).toHaveProperty('renderSimplifiedBadges')
      expect(gamificationUI).toHaveProperty('renderProgressBar')
      expect(gamificationUI).toHaveProperty('renderLevelUpNotification')
      expect(gamificationUI).toHaveProperty('renderSettingsPanel')
      expect(gamificationUI).toHaveProperty('renderElementPreview')
      expect(gamificationUI).toHaveProperty('getGamificationUIStats')
    })
  })

  describe('storage persistence', () => {
    it('should persist all settings to localStorage', () => {
      initGamificationUI(10)
      setCompactMode(true)
      setAnimationsEnabled(false)
      setNotificationsEnabled(false)
      setCustomVisibility('BADGES', false)

      const stored = JSON.parse(localStorage.getItem('spothitch_gamification_ui'))
      expect(stored.compactMode).toBe(true)
      expect(stored.animationsEnabled).toBe(false)
      expect(stored.notificationsEnabled).toBe(false)
      expect(stored.customVisibility.BADGES).toBe(false)
    })

    it('should load settings from localStorage on init', () => {
      localStorage.setItem('spothitch_gamification_ui', JSON.stringify({
        compactMode: true,
        animationsEnabled: false,
        notificationsEnabled: true,
        customVisibility: { GUILDS: true },
      }))

      initGamificationUI(5)

      expect(getCompactMode()).toBe(true)
      expect(getAnimationsEnabled()).toBe(false)
      expect(getNotificationsEnabled()).toBe(true)
      expect(getCustomVisibility()).toEqual({ GUILDS: true })
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('spothitch_gamification_ui', 'invalid json')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      initGamificationUI(5)
      expect(getCompactMode()).toBe(false) // Default value

      consoleSpy.mockRestore()
    })
  })

  describe('edge cases', () => {
    it('should handle level 0', () => {
      const complexity = getUIComplexityLevel(0)
      expect(complexity).toBe(UIComplexityLevel.BEGINNER)
    })

    it('should handle negative level', () => {
      const complexity = getUIComplexityLevel(-5)
      expect(complexity).toBe(UIComplexityLevel.BEGINNER)
    })

    it('should handle very high level', () => {
      const complexity = getUIComplexityLevel(9999)
      expect(complexity).toBe(UIComplexityLevel.EXPERT)
    })

    it('should handle empty stats in renderGamificationPanel', () => {
      const html = renderGamificationPanel(10, {})
      expect(html).toContain('gamification-panel')
    })

    it('should handle empty badges array', () => {
      const html = renderSimplifiedBadges([])
      expect(html).toContain('badges-list')
    })

    it('should handle 0 max value in renderProgressBar', () => {
      const html = renderProgressBar(50, 0)
      expect(html).toContain('width: 0%')
    })
  })
})
