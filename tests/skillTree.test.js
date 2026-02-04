/**
 * Tests for Skill Tree service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SKILL_CATEGORIES,
  SKILLS,
  getUnlockedSkills,
  getSkillPoints,
  getSkillTreeProgress,
  renderSkillTree,
  renderSkillSummary,
} from '../src/services/skillTree.js';

describe('Skill Tree Service', () => {
  describe('SKILL_CATEGORIES', () => {
    it('should have categories defined', () => {
      expect(SKILL_CATEGORIES).toBeDefined();
      expect(typeof SKILL_CATEGORIES).toBe('object');
    });

    it('should have explorer category', () => {
      expect(SKILL_CATEGORIES.EXPLORER).toBeDefined();
    });

    it('should have social category', () => {
      expect(SKILL_CATEGORIES.SOCIAL).toBeDefined();
    });

    it('should have survivor category', () => {
      expect(SKILL_CATEGORIES.SURVIVOR).toBeDefined();
    });

    it('should have veteran category', () => {
      expect(SKILL_CATEGORIES.VETERAN).toBeDefined();
    });
  });

  describe('SKILLS', () => {
    it('should have skills defined', () => {
      expect(SKILLS).toBeDefined();
      expect(typeof SKILLS).toBe('object');
    });

    it('should have multiple skills', () => {
      const skillIds = Object.keys(SKILLS);
      expect(skillIds.length).toBeGreaterThan(5);
    });

    it('each skill should have required properties', () => {
      Object.values(SKILLS).forEach(skill => {
        expect(skill.id).toBeDefined();
        expect(skill.name).toBeDefined();
        expect(skill.cost).toBeDefined();
        expect(typeof skill.cost).toBe('number');
        expect(skill.category).toBeDefined();
      });
    });
  });

  describe('getUnlockedSkills', () => {
    it('should return array', () => {
      const unlocked = getUnlockedSkills();
      expect(Array.isArray(unlocked)).toBe(true);
    });
  });

  describe('getSkillPoints', () => {
    it('should return number', () => {
      const points = getSkillPoints();
      expect(typeof points).toBe('number');
    });

    it('should return non-negative value', () => {
      const points = getSkillPoints();
      expect(points).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSkillTreeProgress', () => {
    it('should return progress object', () => {
      const progress = getSkillTreeProgress();
      expect(progress).toBeDefined();
      expect(typeof progress).toBe('object');
    });

    it('should include total and unlocked count', () => {
      const progress = getSkillTreeProgress();
      expect(progress).toHaveProperty('total');
      expect(progress).toHaveProperty('unlocked');
    });
  });

  describe('renderSkillTree', () => {
    it('should render skill tree modal', () => {
      const state = { skillPoints: 5, unlockedSkills: [] };
      const html = renderSkillTree(state);
      expect(html).toContain('Arbre');
      expect(html).toContain('compétences');
    });

    it('should show skill points', () => {
      const state = { skillPoints: 5, unlockedSkills: [] };
      const html = renderSkillTree(state);
      expect(html).toContain('5');
      expect(html).toContain('Points disponibles');
    });
  });

  describe('renderSkillSummary', () => {
    it('should render summary widget', () => {
      const html = renderSkillSummary();
      expect(typeof html).toBe('string');
    });
  });
});
