/**
 * Custom Titles Service Tests (#177)
 * Tests for custom user titles with rarities and unlock conditions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock state
const mockState = {
  user: { uid: 'user123' },
  username: 'TestUser',
  avatar: '🤙',
  level: 12,
  points: 1200,
  checkins: 30,
  spotsCreated: 8,
  reviewsGiven: 15,
  streak: 10,
  maxStreak: 14,
  badges: ['first_checkin', 'explorer', 'reviewer', 'helper', 'veteran'],
  countriesVisited: 5,
  visitedCountries: ['FR', 'ES', 'DE', 'BE', 'NL'],
  activeTitle: null,
  unlockedTitles: [],
  completedAchievements: [],
  seasonTitles: [],
  lang: 'fr',
}

vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: vi.fn((updates) => {
    Object.assign(mockState, updates)
  }),
}))

vi.mock('../src/i18n/index.js', () => ({
  t: (key) => {
    const translations = {
      rarityCommon: 'Commun',
      rarityUncommon: 'Peu commun',
      rarityRare: 'Rare',
      rarityEpic: 'Epique',
      rarityLegendary: 'Legendaire',
      titleUnlocked: 'Nouveau titre',
      titleNotFound: 'Titre introuvable',
      titleLocked: 'Ce titre est verrouille',
      titleChanged: 'Titre change',
      activeTitle: 'Titre actif',
      unlockedTitles: 'Titres debloques',
      lockedTitles: 'Titres verrouilles',
      noUnlockedTitles: 'Aucun titre debloque',
      allTitlesUnlocked: 'Tous les titres sont debloques!',
      current: 'Actuel',
      locked: 'Verrouille',
      specialUnlock: 'Deblocage special',
      titleSelector: 'Selecteur de titre',
      userTitle: 'Titre',
      newTitleUnlocked: 'Nouveau titre',
      seasonTitleAwarded: 'Titre saisonnier obtenu',
    }
    return translations[key] || key
  },
}))

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

// Import after mocks
import {
  TitleRarity,
  UnlockSource,
  customTitles,
  getRarityColor,
  getRarityBgColor,
  getRarityLabel,
  getTitleById,
  isTitleUnlocked,
  getAvailableTitles,
  getUnlockedTitles,
  getLockedTitles,
  getTitleProgress,
  unlockTitle,
  setActiveTitle,
  getActiveTitle,
  renderTitleSelector,
  renderUserTitle,
  getTitlesByRarity,
  getTitlesBySource,
  checkTitleUnlocks,
  awardSeasonTitle,
  getTitleCounts,
} from '../src/services/customTitles.js'

import { showToast } from '../src/services/notifications.js'

describe('Custom Titles Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state
    mockState.level = 12
    mockState.checkins = 30
    mockState.spotsCreated = 8
    mockState.streak = 10
    mockState.maxStreak = 14
    mockState.badges = ['first_checkin', 'explorer', 'reviewer', 'helper', 'veteran']
    mockState.countriesVisited = 5
    mockState.activeTitle = null
    mockState.unlockedTitles = []
    mockState.completedAchievements = []
    mockState.seasonTitles = []
    mockState.lang = 'fr'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('TitleRarity', () => {
    it('should define all rarity levels', () => {
      expect(TitleRarity.COMMON).toBe('common')
      expect(TitleRarity.UNCOMMON).toBe('uncommon')
      expect(TitleRarity.RARE).toBe('rare')
      expect(TitleRarity.EPIC).toBe('epic')
      expect(TitleRarity.LEGENDARY).toBe('legendary')
    })

    it('should have exactly 5 rarity levels', () => {
      const rarityValues = Object.values(TitleRarity)
      expect(rarityValues).toHaveLength(5)
    })
  })

  describe('UnlockSource', () => {
    it('should define all unlock sources', () => {
      expect(UnlockSource.LEVEL).toBe('level')
      expect(UnlockSource.ACHIEVEMENT).toBe('achievement')
      expect(UnlockSource.SEASON).toBe('season')
      expect(UnlockSource.EVENT).toBe('event')
      expect(UnlockSource.CHECKINS).toBe('checkins')
      expect(UnlockSource.COUNTRIES).toBe('countries')
      expect(UnlockSource.SPOTS_CREATED).toBe('spots_created')
      expect(UnlockSource.STREAK).toBe('streak')
      expect(UnlockSource.BADGES).toBe('badges')
      expect(UnlockSource.SPECIAL).toBe('special')
    })

    it('should have 10 unlock sources', () => {
      const sourceValues = Object.values(UnlockSource)
      expect(sourceValues).toHaveLength(10)
    })
  })

  describe('customTitles', () => {
    it('should have multiple titles defined', () => {
      expect(customTitles).toBeInstanceOf(Array)
      expect(customTitles.length).toBeGreaterThan(20)
    })

    it('should have required properties for each title', () => {
      for (const title of customTitles) {
        expect(title).toHaveProperty('id')
        expect(title).toHaveProperty('name')
        expect(title).toHaveProperty('nameEn')
        expect(title).toHaveProperty('emoji')
        expect(title).toHaveProperty('rarity')
        expect(title).toHaveProperty('unlockSource')
        expect(title).toHaveProperty('unlockValue')
        expect(title).toHaveProperty('description')
        expect(title).toHaveProperty('descriptionEn')
        expect(title).toHaveProperty('color')
      }
    })

    it('should have a default title', () => {
      const defaultTitle = customTitles.find(t => t.isDefault)
      expect(defaultTitle).toBeDefined()
      expect(defaultTitle.id).toBe('debutant')
    })

    it('should have titles of all rarities', () => {
      const rarities = customTitles.map(t => t.rarity)
      expect(rarities).toContain(TitleRarity.COMMON)
      expect(rarities).toContain(TitleRarity.UNCOMMON)
      expect(rarities).toContain(TitleRarity.RARE)
      expect(rarities).toContain(TitleRarity.EPIC)
      expect(rarities).toContain(TitleRarity.LEGENDARY)
    })

    it('should have unique IDs for all titles', () => {
      const ids = customTitles.map(t => t.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids.length).toBe(uniqueIds.length)
    })
  })

  describe('getRarityColor', () => {
    it('should return correct color class for each rarity', () => {
      expect(getRarityColor(TitleRarity.COMMON)).toContain('gray')
      expect(getRarityColor(TitleRarity.UNCOMMON)).toContain('green')
      expect(getRarityColor(TitleRarity.RARE)).toContain('blue')
      expect(getRarityColor(TitleRarity.EPIC)).toContain('purple')
      expect(getRarityColor(TitleRarity.LEGENDARY)).toContain('yellow')
    })

    it('should return default color for unknown rarity', () => {
      expect(getRarityColor('unknown')).toContain('gray')
    })
  })

  describe('getRarityBgColor', () => {
    it('should return correct background color class for each rarity', () => {
      expect(getRarityBgColor(TitleRarity.COMMON)).toContain('gray')
      expect(getRarityBgColor(TitleRarity.UNCOMMON)).toContain('green')
      expect(getRarityBgColor(TitleRarity.RARE)).toContain('blue')
      expect(getRarityBgColor(TitleRarity.EPIC)).toContain('purple')
      expect(getRarityBgColor(TitleRarity.LEGENDARY)).toContain('yellow')
    })

    it('should include opacity for background', () => {
      expect(getRarityBgColor(TitleRarity.COMMON)).toContain('/20')
    })
  })

  describe('getRarityLabel', () => {
    it('should return translated label for each rarity', () => {
      expect(getRarityLabel(TitleRarity.COMMON)).toBe('Commun')
      expect(getRarityLabel(TitleRarity.UNCOMMON)).toBe('Peu commun')
      expect(getRarityLabel(TitleRarity.RARE)).toBe('Rare')
      expect(getRarityLabel(TitleRarity.EPIC)).toBe('Epique')
      expect(getRarityLabel(TitleRarity.LEGENDARY)).toBe('Legendaire')
    })

    it('should return default for unknown rarity', () => {
      expect(getRarityLabel('unknown')).toBe('Commun')
    })
  })

  describe('getTitleById', () => {
    it('should return title by id', () => {
      const title = getTitleById('debutant')
      expect(title).toBeDefined()
      expect(title.id).toBe('debutant')
      expect(title.emoji).toBe('🌱')
    })

    it('should return null for non-existent title', () => {
      const title = getTitleById('nonexistent')
      expect(title).toBeNull()
    })

    it('should return correct title properties', () => {
      const title = getTitleById('explorateur')
      expect(title.name).toBe('Explorateur')
      expect(title.nameEn).toBe('Explorer')
      expect(title.rarity).toBe(TitleRarity.RARE)
    })
  })

  describe('isTitleUnlocked', () => {
    it('should always unlock default title', () => {
      const defaultTitle = getTitleById('debutant')
      expect(isTitleUnlocked(defaultTitle)).toBe(true)
    })

    it('should unlock title based on level', () => {
      const routard = getTitleById('routard')
      // User is level 12, title requires level 5
      expect(isTitleUnlocked(routard)).toBe(true)
    })

    it('should not unlock title if level too low', () => {
      mockState.level = 3
      const routard = getTitleById('routard')
      expect(isTitleUnlocked(routard)).toBe(false)
    })

    it('should unlock title based on checkins', () => {
      const habitue = getTitleById('habitue')
      // User has 30 checkins, title requires 15
      expect(isTitleUnlocked(habitue)).toBe(true)
    })

    it('should unlock title based on countries', () => {
      const europeen = getTitleById('europeen')
      // User has visited 5 countries, title requires 5
      expect(isTitleUnlocked(europeen)).toBe(true)
    })

    it('should unlock title based on spots created', () => {
      const cartographe = getTitleById('cartographe')
      // User created 8 spots, title requires 5
      expect(isTitleUnlocked(cartographe)).toBe(true)
    })

    it('should unlock title based on streak', () => {
      const fidele = getTitleById('fidele')
      // User has 10 day streak, title requires 7
      expect(isTitleUnlocked(fidele)).toBe(true)
    })

    it('should unlock title based on maxStreak', () => {
      mockState.streak = 3
      mockState.maxStreak = 14
      const fidele = getTitleById('fidele')
      // maxStreak is 14, title requires 7
      expect(isTitleUnlocked(fidele)).toBe(true)
    })

    it('should unlock title based on badges count', () => {
      const collectionneur = getTitleById('collectionneur')
      // User has 5 badges, title requires 5
      expect(isTitleUnlocked(collectionneur)).toBe(true)
    })

    it('should not unlock event titles by default', () => {
      const membreFondateur = getTitleById('membre_fondateur')
      expect(isTitleUnlocked(membreFondateur)).toBe(false)
    })

    it('should unlock manually unlocked titles', () => {
      mockState.unlockedTitles = ['membre_fondateur']
      const membreFondateur = getTitleById('membre_fondateur')
      expect(isTitleUnlocked(membreFondateur)).toBe(true)
    })

    it('should unlock achievement-based titles', () => {
      mockState.completedAchievements = ['night_hitchhiker_10']
      const noctambule = getTitleById('noctambule')
      expect(isTitleUnlocked(noctambule)).toBe(true)
    })

    it('should unlock season titles', () => {
      mockState.seasonTitles = ['champion_ete']
      const championEte = getTitleById('champion_ete')
      expect(isTitleUnlocked(championEte)).toBe(true)
    })
  })

  describe('getAvailableTitles', () => {
    it('should return all titles with unlock status', () => {
      const titles = getAvailableTitles()
      expect(titles).toBeInstanceOf(Array)
      expect(titles.length).toBe(customTitles.length)
      expect(titles[0]).toHaveProperty('isUnlocked')
    })

    it('should include default title as unlocked', () => {
      const titles = getAvailableTitles()
      const defaultTitle = titles.find(t => t.id === 'debutant')
      expect(defaultTitle.isUnlocked).toBe(true)
    })
  })

  describe('getUnlockedTitles', () => {
    it('should return array of unlocked titles', () => {
      const unlocked = getUnlockedTitles()
      expect(unlocked).toBeInstanceOf(Array)
      expect(unlocked.length).toBeGreaterThan(0)
    })

    it('should always include default title', () => {
      const unlocked = getUnlockedTitles()
      const hasDefault = unlocked.some(t => t.id === 'debutant')
      expect(hasDefault).toBe(true)
    })

    it('should include titles based on user stats', () => {
      const unlocked = getUnlockedTitles()
      // With level 12, should have routard (level 5) and explorateur (level 10)
      const hasRoutard = unlocked.some(t => t.id === 'routard')
      const hasExplorateur = unlocked.some(t => t.id === 'explorateur')
      expect(hasRoutard).toBe(true)
      expect(hasExplorateur).toBe(true)
    })
  })

  describe('getLockedTitles', () => {
    it('should return array of locked titles', () => {
      const locked = getLockedTitles()
      expect(locked).toBeInstanceOf(Array)
      expect(locked.length).toBeGreaterThan(0)
    })

    it('should not include default title', () => {
      const locked = getLockedTitles()
      const hasDefault = locked.some(t => t.id === 'debutant')
      expect(hasDefault).toBe(false)
    })

    it('should include progress for each locked title', () => {
      const locked = getLockedTitles()
      for (const title of locked) {
        expect(title).toHaveProperty('progress')
        expect(title.progress).toHaveProperty('current')
        expect(title.progress).toHaveProperty('target')
        expect(title.progress).toHaveProperty('percent')
      }
    })
  })

  describe('getTitleProgress', () => {
    it('should return progress for level-based title', () => {
      mockState.level = 15
      const aventurier = getTitleById('aventurier')
      const progress = getTitleProgress(aventurier)

      expect(progress.current).toBe(15)
      expect(progress.target).toBe(25)
      expect(progress.percent).toBe(60)
    })

    it('should return progress for checkin-based title', () => {
      mockState.checkins = 25
      const veteran = getTitleById('veteran')
      const progress = getTitleProgress(veteran)

      expect(progress.current).toBe(25)
      expect(progress.target).toBe(50)
      expect(progress.percent).toBe(50)
    })

    it('should cap percent at 100', () => {
      mockState.checkins = 100
      const curieux = getTitleById('curieux')
      const progress = getTitleProgress(curieux)

      expect(progress.percent).toBe(100)
    })

    it('should mark event titles as special', () => {
      const membreFondateur = getTitleById('membre_fondateur')
      const progress = getTitleProgress(membreFondateur)

      expect(progress.isSpecial).toBe(true)
    })

    it('should use maxStreak for streak-based progress', () => {
      mockState.streak = 5
      mockState.maxStreak = 20
      const marathonRoute = getTitleById('marathon_route')
      const progress = getTitleProgress(marathonRoute)

      expect(progress.current).toBe(20) // Uses maxStreak
    })
  })

  describe('unlockTitle', () => {
    it('should manually unlock a title', () => {
      const result = unlockTitle('membre_fondateur')
      expect(result).toBe(true)
      expect(mockState.unlockedTitles).toContain('membre_fondateur')
    })

    it('should show toast when unlocking', () => {
      unlockTitle('beta_testeur')
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Beta Testeur'),
        'success'
      )
    })

    it('should return true if already unlocked', () => {
      mockState.unlockedTitles = ['membre_fondateur']
      const result = unlockTitle('membre_fondateur')
      expect(result).toBe(true)
    })

    it('should return false for non-existent title', () => {
      const result = unlockTitle('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('setActiveTitle', () => {
    it('should set active title if unlocked', () => {
      // routard is unlocked at level 5, user is level 12
      const result = setActiveTitle('routard')
      expect(result).toBe(true)
      expect(mockState.activeTitle).toBe('routard')
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Titre change'),
        'success'
      )
    })

    it('should fail if title not found', () => {
      const result = setActiveTitle('nonexistent')
      expect(result).toBe(false)
      expect(showToast).toHaveBeenCalledWith('Titre introuvable', 'error')
    })

    it('should fail if title is locked', () => {
      mockState.level = 3
      const result = setActiveTitle('aventurier')
      expect(result).toBe(false)
      expect(showToast).toHaveBeenCalledWith('Ce titre est verrouille', 'error')
    })
  })

  describe('getActiveTitle', () => {
    it('should return default title when no title set', () => {
      mockState.activeTitle = null
      const active = getActiveTitle()
      expect(active.id).toBe('debutant')
    })

    it('should return active title when set', () => {
      mockState.activeTitle = 'routard'
      const active = getActiveTitle()
      expect(active.id).toBe('routard')
    })

    it('should fallback to default if active title not unlocked', () => {
      mockState.activeTitle = 'legende_route'
      mockState.level = 5 // Not level 50
      const active = getActiveTitle()
      expect(active.id).toBe('debutant')
    })
  })

  describe('renderTitleSelector', () => {
    it('should render HTML selector', () => {
      const html = renderTitleSelector()

      expect(html).toContain('title-selector')
      expect(html).toContain('Titre actif')
      expect(html).toContain('Titres debloques')
      expect(html).toContain('Titres verrouilles')
    })

    it('should include unlocked titles', () => {
      const html = renderTitleSelector()

      expect(html).toContain('data-unlocked="true"')
      expect(html).toContain('Debutant')
    })

    it('should include locked titles', () => {
      const html = renderTitleSelector()

      expect(html).toContain('data-unlocked="false"')
      expect(html).toContain('🔒')
    })

    it('should show current badge for active title', () => {
      mockState.activeTitle = 'routard'
      const html = renderTitleSelector()

      expect(html).toContain('Actuel')
    })

    it('should include progress bars for locked titles', () => {
      const html = renderTitleSelector()

      expect(html).toContain('bg-dark-tertiary')
      expect(html).toContain('%')
    })

    it('should have proper accessibility attributes', () => {
      const html = renderTitleSelector()

      expect(html).toContain('role="listbox"')
      expect(html).toContain('aria-label')
      expect(html).toContain('aria-pressed')
    })
  })

  describe('renderUserTitle', () => {
    it('should render HTML badge', () => {
      const html = renderUserTitle()

      expect(html).toContain('user-title')
      expect(html).toContain('🌱')
      expect(html).toContain('Debutant')
    })

    it('should render active title', () => {
      mockState.activeTitle = 'explorateur'
      const html = renderUserTitle()

      expect(html).toContain('🧭')
      expect(html).toContain('Explorateur')
    })

    it('should include rarity styling', () => {
      mockState.activeTitle = 'explorateur' // RARE
      const html = renderUserTitle()

      expect(html).toContain('text-blue') // Rare color
    })

    it('should support different sizes', () => {
      const smHtml = renderUserTitle(null, 'sm')
      const lgHtml = renderUserTitle(null, 'lg')

      expect(smHtml).toContain('text-xs')
      expect(lgHtml).toContain('text-base')
    })

    it('should have proper accessibility', () => {
      const html = renderUserTitle()

      expect(html).toContain('aria-label')
      expect(html).toContain('aria-hidden="true"')
    })
  })

  describe('getTitlesByRarity', () => {
    it('should return titles by rarity', () => {
      const commonTitles = getTitlesByRarity(TitleRarity.COMMON)
      expect(commonTitles.every(t => t.rarity === TitleRarity.COMMON)).toBe(true)
    })

    it('should return multiple legendary titles', () => {
      const legendaryTitles = getTitlesByRarity(TitleRarity.LEGENDARY)
      expect(legendaryTitles.length).toBeGreaterThan(0)
    })

    it('should return empty array for invalid rarity', () => {
      const titles = getTitlesByRarity('invalid')
      expect(titles).toEqual([])
    })
  })

  describe('getTitlesBySource', () => {
    it('should return titles by unlock source', () => {
      const levelTitles = getTitlesBySource(UnlockSource.LEVEL)
      expect(levelTitles.every(t => t.unlockSource === UnlockSource.LEVEL)).toBe(true)
    })

    it('should return season titles', () => {
      const seasonTitles = getTitlesBySource(UnlockSource.SEASON)
      expect(seasonTitles.length).toBeGreaterThan(0)
    })

    it('should return event titles', () => {
      const eventTitles = getTitlesBySource(UnlockSource.EVENT)
      expect(eventTitles.length).toBeGreaterThan(0)
    })
  })

  describe('checkTitleUnlocks', () => {
    it('should return newly unlocked titles', () => {
      // Start with no unlocked titles tracked
      mockState.unlockedTitles = []
      mockState.level = 25

      const newTitles = checkTitleUnlocks()

      expect(newTitles).toBeInstanceOf(Array)
      expect(newTitles.length).toBeGreaterThan(0)
    })

    it('should not re-unlock already tracked titles', () => {
      mockState.unlockedTitles = ['debutant', 'routard', 'explorateur']
      mockState.level = 12

      const newTitles = checkTitleUnlocks()

      expect(newTitles).not.toContain('debutant')
      expect(newTitles).not.toContain('routard')
    })

    it('should show toast for new unlocks', () => {
      mockState.unlockedTitles = []
      mockState.level = 5

      checkTitleUnlocks()

      expect(showToast).toHaveBeenCalled()
    })
  })

  describe('awardSeasonTitle', () => {
    it('should award season title', () => {
      const result = awardSeasonTitle('champion_ete', 'summer_2025')
      expect(result).toBe(true)
      expect(mockState.seasonTitles).toContain('champion_ete')
    })

    it('should show toast when awarding', () => {
      awardSeasonTitle('champion_hiver', 'winter_2025')
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Champion d\'Hiver'),
        'success'
      )
    })

    it('should return false for non-season title', () => {
      const result = awardSeasonTitle('debutant', 'summer_2025')
      expect(result).toBe(false)
    })

    it('should return false for non-existent title', () => {
      const result = awardSeasonTitle('nonexistent', 'summer_2025')
      expect(result).toBe(false)
    })
  })

  describe('getTitleCounts', () => {
    it('should return correct counts', () => {
      const counts = getTitleCounts()

      expect(counts).toHaveProperty('total')
      expect(counts).toHaveProperty('unlocked')
      expect(counts).toHaveProperty('common')
      expect(counts).toHaveProperty('uncommon')
      expect(counts).toHaveProperty('rare')
      expect(counts).toHaveProperty('epic')
      expect(counts).toHaveProperty('legendary')
    })

    it('should have total equal to customTitles length', () => {
      const counts = getTitleCounts()
      expect(counts.total).toBe(customTitles.length)
    })

    it('should have unlocked count greater than 0', () => {
      const counts = getTitleCounts()
      expect(counts.unlocked).toBeGreaterThan(0)
    })
  })

  describe('Global handlers', () => {
    it('should define selectTitle on window', () => {
      expect(typeof window.selectTitle).toBe('function')
    })

    it('should selectTitle call setActiveTitle', () => {
      const result = window.selectTitle('routard')
      expect(result).toBe(true)
      expect(mockState.activeTitle).toBe('routard')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty badges array', () => {
      mockState.badges = []
      const collectionneur = getTitleById('collectionneur')
      expect(isTitleUnlocked(collectionneur)).toBe(false)
    })

    it('should handle null visitedCountries', () => {
      mockState.countriesVisited = 0
      mockState.visitedCountries = null
      const frontalier = getTitleById('frontalier')
      expect(isTitleUnlocked(frontalier)).toBe(false)
    })

    it('should handle zero streak', () => {
      mockState.streak = 0
      mockState.maxStreak = 0
      const fidele = getTitleById('fidele')
      expect(isTitleUnlocked(fidele)).toBe(false)
    })

    it('should handle undefined state properties', () => {
      mockState.level = undefined
      mockState.checkins = undefined
      const debutant = getTitleById('debutant')
      // Default title should still be unlocked
      expect(isTitleUnlocked(debutant)).toBe(true)
    })
  })

  describe('Internationalization', () => {
    it('should support English names', () => {
      mockState.lang = 'en'
      const title = getTitleById('explorateur')
      expect(title.nameEn).toBe('Explorer')
    })

    it('should have English descriptions', () => {
      const title = getTitleById('europeen')
      expect(title.descriptionEn).toContain('European')
    })

    it('should render in English when lang is en', () => {
      mockState.lang = 'en'
      mockState.activeTitle = 'explorateur'
      const html = renderUserTitle()
      expect(html).toContain('Explorer')
    })
  })
})
