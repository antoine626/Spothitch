/**
 * Tests for tutorial component (3-screen version)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderTutorial, tutorialSteps, cleanupTutorialTargets, executeStepAction } from '../src/components/modals/Tutorial.js'

describe('Tutorial Component', () => {
  describe('tutorialSteps', () => {
    it('should have 3 screens defined', () => {
      expect(Array.isArray(tutorialSteps)).toBe(true)
      expect(tutorialSteps.length).toBe(3)
    })

    it('each step should have required properties', () => {
      tutorialSteps.forEach((step) => {
        expect(step.id).toBeDefined()
        expect(step.title).toBeDefined()
        expect(step.desc).toBeDefined()
        expect(step.emoji).toBeDefined()
        expect(step.features).toBeDefined()
        expect(step.color).toBeDefined()
      })
    })

    it('should start with discover step', () => {
      expect(tutorialSteps[0].id).toBe('discover')
    })

    it('should end with safety step', () => {
      const lastStep = tutorialSteps[tutorialSteps.length - 1]
      expect(lastStep.id).toBe('safety')
    })

    it('each step should have 3 features', () => {
      tutorialSteps.forEach((step) => {
        expect(step.features.length).toBe(3)
        step.features.forEach(f => {
          expect(f.icon).toBeDefined()
          expect(f.text).toBeDefined()
        })
      })
    })
  })

  describe('renderTutorial', () => {
    const mockState = {
      tutorialStep: 0,
      showTutorial: true,
      points: 0,
      activeTab: 'map',
    }

    it('should render tutorial overlay', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain('tutorial-overlay')
    })

    it('should show skip/passer button on first screen', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain('skipTutorial')
    })

    it('should show current step title', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain(tutorialSteps[0].title)
    })

    it('should show current step description', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain(tutorialSteps[0].desc)
    })

    it('should show step emoji', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain(tutorialSteps[0].emoji)
    })

    it('should show features list', () => {
      const html = renderTutorial(mockState)
      tutorialSteps[0].features.forEach(f => {
        expect(html).toContain(f.text)
      })
    })

    it('should show next button on non-last step', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain('nextTutorial()')
    })

    it('should show finish button on last step', () => {
      const state = { ...mockState, tutorialStep: tutorialSteps.length - 1 }
      const html = renderTutorial(state)
      expect(html).toContain('finishTutorial()')
    })

    it('should show back button on non-first step', () => {
      const state = { ...mockState, tutorialStep: 1 }
      const html = renderTutorial(state)
      expect(html).toContain('prevTutorial()')
    })

    it('should show step dots', () => {
      const html = renderTutorial(mockState)
      // 3 dots for 3 screens
      expect(html).toContain('rounded-full')
    })
  })

  describe('cleanupTutorialTargets', () => {
    it('should be a function', () => {
      expect(typeof cleanupTutorialTargets).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => cleanupTutorialTargets()).not.toThrow()
    })
  })

  describe('executeStepAction', () => {
    it('should be a function', () => {
      expect(typeof executeStepAction).toBe('function')
    })

    it('should not throw when called with valid step index', () => {
      expect(() => executeStepAction(0)).not.toThrow()
    })

    it('should not throw when called with invalid step index', () => {
      expect(() => executeStepAction(999)).not.toThrow()
    })
  })
})
