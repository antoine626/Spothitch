/**
 * Profile Frames Service Tests (#175)
 * Tests for profile frame decorations and unlocking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

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
  badges: ['first_checkin', 'explorer', 'reviewer', 'helper', 'veteran'],
  countriesVisited: 5,
  visitedCountries: ['FR', 'ES', 'DE', 'BE', 'NL'],
  activeFrame: null,
  unlockedFrames: [],
  specialFrames: [],
};

vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: vi.fn((updates) => {
    Object.assign(mockState, updates);
  }),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: (key) => {
    const translations = {
      currentFrame: 'Current frame',
      unlockedFrames: 'Unlocked frames',
      lockedFrames: 'Locked frames',
      noUnlockedFrames: 'No unlocked frames',
      allFramesUnlocked: 'All frames unlocked!',
      frameNotFound: 'Frame not found',
      frameLocked: 'This frame is locked',
      frameChanged: 'Frame changed!',
      frameUnlocked: 'New frame unlocked',
      newFrameUnlocked: 'New frame',
      select: 'Select',
      current: 'Current',
      rarityCommon: 'Common',
      rarityUncommon: 'Uncommon',
      rarityRare: 'Rare',
      rarityEpic: 'Epic',
      rarityLegendary: 'Legendary',
      frameBasicCircle: 'Basic Circle',
      frameBasicCircleDesc: 'A simple frame',
      frameGreenTraveler: 'Green Traveler',
      frameBlueExplorer: 'Blue Explorer',
      frameRoadWarrior: 'Road Warrior',
    };
    return translations[key] || key;
  },
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Import after mocks
import {
  FrameRarity,
  UnlockCondition,
  profileFrames,
  getRarityColor,
  getRarityLabel,
  isFrameUnlocked,
  getUnlockedFrames,
  getLockedFrames,
  getFrameProgress,
  getFrameById,
  getCurrentFrame,
  setActiveFrame,
  unlockFrame,
  getFrameStyles,
  getFrameAnimationClass,
  renderFramePreview,
  renderFrameCard,
  renderFramesGallery,
  checkFrameUnlocks,
} from '../src/services/profileFrames.js';

import { showToast } from '../src/services/notifications.js';

describe('Profile Frames Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    mockState.level = 12;
    mockState.checkins = 30;
    mockState.spotsCreated = 8;
    mockState.streak = 10;
    mockState.badges = ['first_checkin', 'explorer', 'reviewer', 'helper', 'veteran'];
    mockState.countriesVisited = 5;
    mockState.activeFrame = null;
    mockState.unlockedFrames = [];
    mockState.specialFrames = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('FrameRarity', () => {
    it('should define all rarity levels', () => {
      expect(FrameRarity.COMMON).toBe('common');
      expect(FrameRarity.UNCOMMON).toBe('uncommon');
      expect(FrameRarity.RARE).toBe('rare');
      expect(FrameRarity.EPIC).toBe('epic');
      expect(FrameRarity.LEGENDARY).toBe('legendary');
    });
  });

  describe('UnlockCondition', () => {
    it('should define all unlock conditions', () => {
      expect(UnlockCondition.LEVEL).toBe('level');
      expect(UnlockCondition.BADGES).toBe('badges');
      expect(UnlockCondition.CHECKINS).toBe('checkins');
      expect(UnlockCondition.COUNTRIES).toBe('countries');
      expect(UnlockCondition.STREAK).toBe('streak');
      expect(UnlockCondition.SPOTS_CREATED).toBe('spots_created');
      expect(UnlockCondition.PURCHASE).toBe('purchase');
      expect(UnlockCondition.EVENT).toBe('event');
      expect(UnlockCondition.SECRET).toBe('secret');
    });
  });

  describe('profileFrames', () => {
    it('should have multiple frames defined', () => {
      expect(profileFrames).toBeInstanceOf(Array);
      expect(profileFrames.length).toBeGreaterThan(10);
    });

    it('should have required properties for each frame', () => {
      for (const frame of profileFrames) {
        expect(frame).toHaveProperty('id');
        expect(frame).toHaveProperty('name');
        expect(frame).toHaveProperty('rarity');
        expect(frame).toHaveProperty('unlockCondition');
        expect(frame).toHaveProperty('borderStyle');
        expect(frame).toHaveProperty('borderWidth');
        expect(frame).toHaveProperty('borderColor');
        expect(frame).toHaveProperty('borderRadius');
      }
    });

    it('should have a default frame', () => {
      const defaultFrame = profileFrames.find(f => f.isDefault);
      expect(defaultFrame).toBeDefined();
      expect(defaultFrame.id).toBe('basic_circle');
    });

    it('should have frames of all rarities', () => {
      const rarities = profileFrames.map(f => f.rarity);
      expect(rarities).toContain(FrameRarity.COMMON);
      expect(rarities).toContain(FrameRarity.UNCOMMON);
      expect(rarities).toContain(FrameRarity.RARE);
      expect(rarities).toContain(FrameRarity.EPIC);
      expect(rarities).toContain(FrameRarity.LEGENDARY);
    });
  });

  describe('getRarityColor', () => {
    it('should return correct color class for each rarity', () => {
      expect(getRarityColor(FrameRarity.COMMON)).toContain('gray');
      expect(getRarityColor(FrameRarity.UNCOMMON)).toContain('green');
      expect(getRarityColor(FrameRarity.RARE)).toContain('blue');
      expect(getRarityColor(FrameRarity.EPIC)).toContain('purple');
      expect(getRarityColor(FrameRarity.LEGENDARY)).toContain('yellow');
    });

    it('should return default color for unknown rarity', () => {
      expect(getRarityColor('unknown')).toContain('gray');
    });
  });

  describe('getRarityLabel', () => {
    it('should return translated label for each rarity', () => {
      expect(getRarityLabel(FrameRarity.COMMON)).toBe('Common');
      expect(getRarityLabel(FrameRarity.UNCOMMON)).toBe('Uncommon');
      expect(getRarityLabel(FrameRarity.RARE)).toBe('Rare');
      expect(getRarityLabel(FrameRarity.EPIC)).toBe('Epic');
      expect(getRarityLabel(FrameRarity.LEGENDARY)).toBe('Legendary');
    });
  });

  describe('isFrameUnlocked', () => {
    it('should always unlock default frame', () => {
      const defaultFrame = getFrameById('basic_circle');
      expect(isFrameUnlocked(defaultFrame)).toBe(true);
    });

    it('should unlock frame based on level', () => {
      const roadWarrior = getFrameById('road_warrior');
      // User is level 12, frame requires level 10
      expect(isFrameUnlocked(roadWarrior)).toBe(true);
    });

    it('should not unlock frame if level too low', () => {
      mockState.level = 5;
      const roadWarrior = getFrameById('road_warrior');
      expect(isFrameUnlocked(roadWarrior)).toBe(false);
    });

    it('should unlock frame based on checkins', () => {
      const greenTraveler = getFrameById('green_traveler');
      // User has 30 checkins, frame requires 5
      expect(isFrameUnlocked(greenTraveler)).toBe(true);
    });

    it('should unlock frame based on countries', () => {
      const europeExplorer = getFrameById('europe_explorer');
      // User has visited 5 countries, frame requires 5
      expect(isFrameUnlocked(europeExplorer)).toBe(true);
    });

    it('should unlock frame based on spots created', () => {
      const spotCreator = getFrameById('spot_creator');
      // User created 8 spots, frame requires 5
      expect(isFrameUnlocked(spotCreator)).toBe(true);
    });

    it('should unlock frame based on streak', () => {
      const streakMaster = getFrameById('streak_master');
      // User has 10 day streak, frame requires 7
      expect(isFrameUnlocked(streakMaster)).toBe(true);
    });

    it('should unlock frame based on badges', () => {
      mockState.badges = Array(10).fill('badge');
      const communityHero = getFrameById('community_hero');
      expect(isFrameUnlocked(communityHero)).toBe(true);
    });

    it('should not unlock event frames by default', () => {
      const foundingMember = getFrameById('founding_member');
      expect(isFrameUnlocked(foundingMember)).toBe(false);
    });

    it('should unlock manually unlocked frames', () => {
      mockState.unlockedFrames = ['founding_member'];
      const foundingMember = getFrameById('founding_member');
      expect(isFrameUnlocked(foundingMember)).toBe(true);
    });
  });

  describe('getUnlockedFrames', () => {
    it('should return array of unlocked frames', () => {
      const unlocked = getUnlockedFrames();
      expect(unlocked).toBeInstanceOf(Array);
      expect(unlocked.length).toBeGreaterThan(0);
    });

    it('should always include default frame', () => {
      const unlocked = getUnlockedFrames();
      const hasDefault = unlocked.some(f => f.id === 'basic_circle');
      expect(hasDefault).toBe(true);
    });
  });

  describe('getLockedFrames', () => {
    it('should return array of locked frames', () => {
      const locked = getLockedFrames();
      expect(locked).toBeInstanceOf(Array);
      expect(locked.length).toBeGreaterThan(0);
    });

    it('should not include default frame', () => {
      const locked = getLockedFrames();
      const hasDefault = locked.some(f => f.id === 'basic_circle');
      expect(hasDefault).toBe(false);
    });
  });

  describe('getFrameProgress', () => {
    it('should return progress for level-based frame', () => {
      mockState.level = 15;
      const legendaryTraveler = getFrameById('legendary_traveler');
      const progress = getFrameProgress(legendaryTraveler);

      expect(progress.current).toBe(15);
      expect(progress.target).toBe(25);
      expect(progress.percent).toBe(60);
    });

    it('should return progress for checkin-based frame', () => {
      mockState.checkins = 25;
      const veteranFrame = getFrameById('veteran_hitchhiker');
      const progress = getFrameProgress(veteranFrame);

      expect(progress.current).toBe(25);
      expect(progress.target).toBe(50);
      expect(progress.percent).toBe(50);
    });

    it('should cap percent at 100', () => {
      mockState.checkins = 100;
      const greenTraveler = getFrameById('green_traveler');
      const progress = getFrameProgress(greenTraveler);

      expect(progress.percent).toBe(100);
    });

    it('should mark event frames as special', () => {
      const foundingMember = getFrameById('founding_member');
      const progress = getFrameProgress(foundingMember);

      expect(progress.isSpecial).toBe(true);
    });
  });

  describe('getFrameById', () => {
    it('should return frame by id', () => {
      const frame = getFrameById('basic_circle');
      expect(frame).toBeDefined();
      expect(frame.id).toBe('basic_circle');
    });

    it('should return null for non-existent frame', () => {
      const frame = getFrameById('nonexistent');
      expect(frame).toBeNull();
    });
  });

  describe('getCurrentFrame', () => {
    it('should return default frame when no frame set', () => {
      mockState.activeFrame = null;
      const current = getCurrentFrame();
      expect(current.id).toBe('basic_circle');
    });

    it('should return active frame when set', () => {
      mockState.activeFrame = 'road_warrior';
      const current = getCurrentFrame();
      expect(current.id).toBe('road_warrior');
    });

    it('should fallback to default if active frame not unlocked', () => {
      mockState.activeFrame = 'hitchhiking_legend';
      mockState.level = 5; // Not level 50
      const current = getCurrentFrame();
      expect(current.id).toBe('basic_circle');
    });
  });

  describe('setActiveFrame', () => {
    it('should set active frame if unlocked', () => {
      const result = setActiveFrame('road_warrior');
      expect(result).toBe(true);
      expect(mockState.activeFrame).toBe('road_warrior');
      expect(showToast).toHaveBeenCalledWith('Frame changed!', 'success');
    });

    it('should fail if frame not found', () => {
      const result = setActiveFrame('nonexistent');
      expect(result).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Frame not found', 'error');
    });

    it('should fail if frame is locked', () => {
      mockState.level = 5;
      const result = setActiveFrame('legendary_traveler');
      expect(result).toBe(false);
      expect(showToast).toHaveBeenCalledWith('This frame is locked', 'error');
    });
  });

  describe('unlockFrame', () => {
    it('should manually unlock a frame', () => {
      const result = unlockFrame('founding_member');
      expect(result).toBe(true);
      expect(mockState.unlockedFrames).toContain('founding_member');
    });

    it('should return true if already unlocked', () => {
      mockState.unlockedFrames = ['founding_member'];
      const result = unlockFrame('founding_member');
      expect(result).toBe(true);
    });

    it('should return false for non-existent frame', () => {
      const result = unlockFrame('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getFrameStyles', () => {
    it('should return CSS style object', () => {
      const frame = getFrameById('basic_circle');
      const styles = getFrameStyles(frame);

      expect(styles).toHaveProperty('border');
      expect(styles).toHaveProperty('borderRadius');
      expect(styles.borderRadius).toBe('50%');
    });

    it('should return empty object for null frame', () => {
      const styles = getFrameStyles(null);
      expect(styles).toEqual({});
    });

    it('should include gradient for frames with gradient', () => {
      const spotCreator = getFrameById('spot_creator');
      const styles = getFrameStyles(spotCreator);

      expect(styles).toHaveProperty('borderImage');
    });
  });

  describe('getFrameAnimationClass', () => {
    it('should return animation class for animated frame', () => {
      const streakMaster = getFrameById('streak_master');
      const animClass = getFrameAnimationClass(streakMaster);

      expect(animClass).toContain('animate');
    });

    it('should return empty string for non-animated frame', () => {
      const basicCircle = getFrameById('basic_circle');
      const animClass = getFrameAnimationClass(basicCircle);

      expect(animClass).toBe('');
    });

    it('should return empty string for null frame', () => {
      const animClass = getFrameAnimationClass(null);
      expect(animClass).toBe('');
    });
  });

  describe('renderFramePreview', () => {
    it('should render HTML preview', () => {
      const frame = getFrameById('basic_circle');
      const html = renderFramePreview(frame, '🤙', 'md');

      expect(html).toContain('frame-preview');
      expect(html).toContain('🤙');
      expect(html).toContain('data-frame-id="basic_circle"');
    });

    it('should show lock icon for locked frames', () => {
      mockState.level = 1;
      const frame = getFrameById('legendary_traveler');
      const html = renderFramePreview(frame, '🤙', 'md');

      expect(html).toContain('🔒');
    });

    it('should apply grayscale filter for locked frames', () => {
      mockState.level = 1;
      const frame = getFrameById('legendary_traveler');
      const html = renderFramePreview(frame, '🤙', 'md');

      expect(html).toContain('grayscale');
    });

    it('should support different sizes', () => {
      const frame = getFrameById('basic_circle');

      const sm = renderFramePreview(frame, '🤙', 'sm');
      const lg = renderFramePreview(frame, '🤙', 'lg');

      expect(sm).toContain('w-12');
      expect(lg).toContain('w-24');
    });
  });

  describe('renderFrameCard', () => {
    it('should render HTML card', () => {
      const frame = getFrameById('basic_circle');
      const html = renderFrameCard(frame);

      expect(html).toContain('frame-card');
      expect(html).toContain('Basic Circle');
    });

    it('should show current badge for active frame', () => {
      mockState.activeFrame = 'basic_circle';
      const frame = getFrameById('basic_circle');
      const html = renderFrameCard(frame);

      expect(html).toContain('Current');
    });

    it('should show progress bar for locked frames', () => {
      mockState.level = 5;
      const frame = getFrameById('legendary_traveler');
      const html = renderFrameCard(frame);

      expect(html).toContain('bg-primary-500');
      expect(html).toContain('%');
    });

    it('should show select button for unlocked non-current frames', () => {
      mockState.activeFrame = null;
      const frame = getFrameById('road_warrior');
      const html = renderFrameCard(frame);

      expect(html).toContain('Select');
      expect(html).toContain('selectFrame');
    });
  });

  describe('renderFramesGallery', () => {
    it('should render full gallery HTML', () => {
      const html = renderFramesGallery();

      expect(html).toContain('frames-gallery');
      expect(html).toContain('Current frame');
      expect(html).toContain('Unlocked frames');
      expect(html).toContain('Locked frames');
    });

    it('should include current frame section', () => {
      const html = renderFramesGallery();

      // The HTML contains "Current frame" (translated text)
      expect(html).toContain('Current frame');
    });
  });

  describe('checkFrameUnlocks', () => {
    it('should return newly unlocked frames', () => {
      // Simulate progress that unlocks new frames
      mockState.level = 25;
      mockState.checkins = 50;

      const newFrames = checkFrameUnlocks();

      expect(newFrames).toBeInstanceOf(Array);
    });

    it('should be callable function', () => {
      // Verify the function exists and runs without error
      expect(typeof checkFrameUnlocks).toBe('function');

      // Call it and verify it returns an array
      const result = checkFrameUnlocks();
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('Global handlers', () => {
    it('should define selectFrame on window', () => {
      expect(typeof window.selectFrame).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty badges array', () => {
      mockState.badges = [];
      const communityHero = getFrameById('community_hero');
      expect(isFrameUnlocked(communityHero)).toBe(false);
    });

    it('should handle null visitedCountries', () => {
      mockState.countriesVisited = 0;
      mockState.visitedCountries = null;
      const europeExplorer = getFrameById('europe_explorer');
      expect(isFrameUnlocked(europeExplorer)).toBe(false);
    });

    it('should handle zero streak', () => {
      mockState.streak = 0;
      const streakMaster = getFrameById('streak_master');
      expect(isFrameUnlocked(streakMaster)).toBe(false);
    });
  });
});
