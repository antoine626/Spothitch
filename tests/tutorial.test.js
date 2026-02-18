/**
 * Tests for tutorial component (3-screen lightweight version)
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
        expect(typeof step.title).toBe('function')
        expect(step.desc).toBeDefined()
        expect(typeof step.desc).toBe('function')
        expect(step.icon).toBeDefined()
        expect(step.color).toBeDefined()
      })
    })

    it('should start with spots step', () => {
      expect(tutorialSteps[0].id).toBe('spots')
    })

    it('should end with safety step', () => {
      const lastStep = tutorialSteps[tutorialSteps.length - 1]
      expect(lastStep.id).toBe('safety')
    })

    it('should have contribute as middle step', () => {
      expect(tutorialSteps[1].id).toBe('contribute')
    })

    it('each step title and desc should return strings', () => {
      tutorialSteps.forEach((step) => {
        const title = step.title()
        const desc = step.desc()
        expect(typeof title).toBe('string')
        expect(title.length).toBeGreaterThan(0)
        expect(typeof desc).toBe('string')
        expect(desc.length).toBeGreaterThan(0)
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

    it('should show skip button on first screen', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain('skipTutorial()')
    })

    it('should show current step title as rendered string', () => {
      const html = renderTutorial(mockState)
      const title = tutorialSteps[0].title()
      expect(html).toContain(title)
    })

    it('should show current step description as rendered string', () => {
      const html = renderTutorial(mockState)
      const desc = tutorialSteps[0].desc()
      expect(html).toContain(desc)
    })

    it('should show step icon', () => {
      const html = renderTutorial(mockState)
      // Icon is rendered as SVG via icon() utility
      expect(html).toContain('<svg')
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

    it('should not have prev button (simplified 3-step design)', () => {
      const state = { ...mockState, tutorialStep: 1 }
      const html = renderTutorial(state)
      // New lightweight tutorial has skip + next, no prev
      expect(html).not.toContain('prevTutorial()')
    })

    it('should show step dots', () => {
      const html = renderTutorial(mockState)
      // 3 dots for 3 screens
      expect(html).toContain('rounded-full')
    })

    it('should render bottom card layout', () => {
      const html = renderTutorial(mockState)
      expect(html).toContain('bottom-24')
      expect(html).toContain('max-w-sm')
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
