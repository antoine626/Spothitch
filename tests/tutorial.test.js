/**
 * Tests for tutorial component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTutorial, tutorialSteps, cleanupTutorialTargets, executeStepAction } from '../src/components/modals/Tutorial.js';

describe('Tutorial Component', () => {
  describe('tutorialSteps', () => {
    it('should have multiple steps defined', () => {
      expect(Array.isArray(tutorialSteps)).toBe(true);
      expect(tutorialSteps.length).toBeGreaterThan(5);
    });

    it('each step should have required properties', () => {
      tutorialSteps.forEach((step) => {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.desc).toBeDefined();
        expect(step.icon).toBeDefined();
        expect(step.type).toBeDefined();
      });
    });

    it('should start with welcome step', () => {
      expect(tutorialSteps[0].id).toBe('welcome');
    });

    it('should end with ready step', () => {
      const lastStep = tutorialSteps[tutorialSteps.length - 1];
      expect(lastStep.id).toBe('ready');
    });

    it('should have click type steps for navigation', () => {
      const clickSteps = tutorialSteps.filter(s => s.type === 'click');
      expect(clickSteps.length).toBeGreaterThan(0);
    });

    it('should have highlight type steps', () => {
      const highlightSteps = tutorialSteps.filter(s => s.type === 'highlight');
      expect(highlightSteps.length).toBeGreaterThan(0);
    });

    it('should have modal type steps', () => {
      const modalSteps = tutorialSteps.filter(s => s.type === 'modal');
      expect(modalSteps.length).toBeGreaterThan(0);
    });
  });

  describe('renderTutorial', () => {
    const mockState = {
      tutorialStep: 0,
      showTutorial: true,
      points: 0,
      activeTab: 'map',
    };

    it('should render tutorial overlay', () => {
      const html = renderTutorial(mockState);
      expect(html).toContain('tutorial-overlay');
    });

    it('should render tutorial card', () => {
      const html = renderTutorial(mockState);
      expect(html).toContain('tutorial-card');
    });

    it('should show skip button', () => {
      const html = renderTutorial(mockState);
      expect(html).toContain('Passer');
      expect(html).toContain('skipTutorial');
    });

    it('should show step counter', () => {
      const html = renderTutorial(mockState);
      expect(html).toContain('Étape 1');
    });

    it('should show current step title', () => {
      const html = renderTutorial(mockState);
      expect(html).toContain(tutorialSteps[0].title);
    });

    it('should show current step description', () => {
      const html = renderTutorial(mockState);
      expect(html).toContain(tutorialSteps[0].desc);
    });

    it('should show step icon', () => {
      const html = renderTutorial(mockState);
      expect(html).toContain(tutorialSteps[0].icon);
    });

    it('should render different content for click steps', () => {
      const clickStepIndex = tutorialSteps.findIndex(s => s.type === 'click');
      const state = { ...mockState, tutorialStep: clickStepIndex };
      const html = renderTutorial(state);
      expect(html).toContain('<svg');
    });

    it('should render spotlight div for steps with targetSelector', () => {
      const clickStepIndex = tutorialSteps.findIndex(s => s.type === 'click' && s.targetSelector);
      const state = { ...mockState, tutorialStep: clickStepIndex };
      const html = renderTutorial(state);
      expect(html).toContain('tutorial-spotlight');
    });

    it('should show Compris button for highlight type steps', () => {
      const highlightStepIndex = tutorialSteps.findIndex(s => s.type === 'highlight');
      const state = { ...mockState, tutorialStep: highlightStepIndex };
      const html = renderTutorial(state);
      expect(html).toContain('Compris');
    });

    it('should show Commencer button on last step', () => {
      const state = { ...mockState, tutorialStep: tutorialSteps.length - 1 };
      const html = renderTutorial(state);
      expect(html).toContain('Commencer');
    });
  });

  describe('cleanupTutorialTargets', () => {
    it('should be a function', () => {
      expect(typeof cleanupTutorialTargets).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => cleanupTutorialTargets()).not.toThrow();
    });
  });

  describe('executeStepAction', () => {
    it('should be a function', () => {
      expect(typeof executeStepAction).toBe('function');
    });

    it('should not throw when called with valid step index', () => {
      expect(() => executeStepAction(0)).not.toThrow();
    });

    it('should not throw when called with invalid step index', () => {
      expect(() => executeStepAction(999)).not.toThrow();
    });
  });
});
