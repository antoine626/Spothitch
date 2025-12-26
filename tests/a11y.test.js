/**
 * Accessibility Utilities Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
  formatForSR,
  createSkipLink,
  getContrastRatio,
  meetsContrastAA,
  announce,
  trapFocus,
  setupModal,
  enableArrowNavigation,
} from '../src/utils/a11y.js'

describe('Accessibility Utilities', () => {
  describe('generateId', () => {
    it('should generate unique IDs with prefix', () => {
      const id1 = generateId('test')
      const id2 = generateId('test')

      expect(id1).toMatch(/^test-[a-z0-9]+$/)
      expect(id2).toMatch(/^test-[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should use default prefix "aria"', () => {
      const id = generateId()
      expect(id).toMatch(/^aria-[a-z0-9]+$/)
    })

    it('should generate IDs with custom prefix', () => {
      const id = generateId('modal')
      expect(id).toMatch(/^modal-[a-z0-9]+$/)
    })
  })

  describe('prefersReducedMotion', () => {
    it('should return true when user prefers reduced motion', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true })
      expect(prefersReducedMotion()).toBe(true)
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    })

    it('should return false when user does not prefer reduced motion', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false })
      expect(prefersReducedMotion()).toBe(false)
    })
  })

  describe('prefersHighContrast', () => {
    it('should return true when user prefers high contrast', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true })
      expect(prefersHighContrast()).toBe(true)
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: more)')
    })

    it('should return false when user does not prefer high contrast', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false })
      expect(prefersHighContrast()).toBe(false)
    })
  })

  describe('formatForSR', () => {
    it('should format singular correctly', () => {
      expect(formatForSR(1, 'spot', 'spots')).toBe('1 spot')
    })

    it('should format plural correctly', () => {
      expect(formatForSR(5, 'spot', 'spots')).toBe('5 spots')
    })

    it('should format zero as plural', () => {
      expect(formatForSR(0, 'spot', 'spots')).toBe('0 spots')
    })

    it('should use auto plural when plural not provided', () => {
      expect(formatForSR(2, 'item')).toBe('2 items')
      expect(formatForSR(1, 'item')).toBe('1 item')
    })
  })

  describe('createSkipLink', () => {
    it('should create skip link with default values', () => {
      const link = createSkipLink()
      expect(link).toContain('href="#main-content"')
      expect(link).toContain('Aller au contenu principal')
      expect(link).toContain('class="skip-link"')
    })

    it('should create skip link with custom values', () => {
      const link = createSkipLink('content', 'Skip to main')
      expect(link).toContain('href="#content"')
      expect(link).toContain('Skip to main')
    })
  })

  describe('getContrastRatio', () => {
    it('should return 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('should return 1 for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff')
      expect(ratio).toBeCloseTo(1, 0)
    })

    it('should calculate contrast for other color pairs', () => {
      const ratio = getContrastRatio('#0ea5e9', '#ffffff')
      expect(ratio).toBeGreaterThan(1)
      expect(ratio).toBeLessThan(21)
    })
  })

  describe('meetsContrastAA', () => {
    it('should return true for sufficient contrast (normal text)', () => {
      expect(meetsContrastAA('#000000', '#ffffff')).toBe(true)
    })

    it('should return false for insufficient contrast (normal text)', () => {
      expect(meetsContrastAA('#777777', '#888888')).toBe(false)
    })

    it('should use lower threshold for large text', () => {
      // With largeText=true, threshold is 3:1 instead of 4.5:1
      const foreground = '#767676' // This gives ~4.5:1 ratio on white
      const background = '#ffffff'
      expect(meetsContrastAA(foreground, background, true)).toBe(true)
    })
  })

  describe('announce', () => {
    let announcer

    beforeEach(() => {
      document.body.innerHTML = ''
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should create announcer element if not exists', () => {
      announce('Test message')
      vi.advanceTimersByTime(100)

      announcer = document.getElementById('sr-announcer')
      expect(announcer).not.toBeNull()
      expect(announcer.getAttribute('role')).toBe('status')
      expect(announcer.getAttribute('aria-atomic')).toBe('true')
    })

    it('should announce message with polite priority', () => {
      announce('Test message', 'polite')
      vi.advanceTimersByTime(100)

      announcer = document.getElementById('sr-announcer')
      expect(announcer.getAttribute('aria-live')).toBe('polite')
      expect(announcer.textContent).toBe('Test message')
    })

    it('should announce message with assertive priority', () => {
      announce('Urgent message', 'assertive')
      vi.advanceTimersByTime(100)

      announcer = document.getElementById('sr-announcer')
      expect(announcer.getAttribute('aria-live')).toBe('assertive')
      expect(announcer.textContent).toBe('Urgent message')
    })
  })

  describe('trapFocus', () => {
    let container
    let buttons
    let cleanup

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="modal">
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
          <button id="btn3">Button 3</button>
        </div>
      `
      container = document.getElementById('modal')
      buttons = container.querySelectorAll('button')
    })

    afterEach(() => {
      if (cleanup) cleanup()
    })

    it('should focus first focusable element', () => {
      cleanup = trapFocus(container)
      expect(document.activeElement).toBe(buttons[0])
    })

    it('should trap focus on Tab at last element', () => {
      cleanup = trapFocus(container)
      buttons[2].focus()

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      container.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should trap focus on Shift+Tab at first element', () => {
      cleanup = trapFocus(container)
      buttons[0].focus()

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      container.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should dispatch close-modal on Escape', () => {
      cleanup = trapFocus(container)
      const handler = vi.fn()
      container.addEventListener('close-modal', handler)

      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(handler).toHaveBeenCalled()
    })

    it('should return cleanup function', () => {
      cleanup = trapFocus(container)
      expect(typeof cleanup).toBe('function')
    })
  })

  describe('setupModal', () => {
    let modal
    let cleanup

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="modal">
          <h2 id="modal-title">Title</h2>
          <button>Close</button>
        </div>
      `
      modal = document.getElementById('modal')
    })

    afterEach(() => {
      if (cleanup) cleanup()
      document.body.style.overflow = ''
    })

    it('should set modal ARIA attributes', () => {
      cleanup = setupModal(modal, 'modal-title')

      expect(modal.getAttribute('role')).toBe('dialog')
      expect(modal.getAttribute('aria-modal')).toBe('true')
      expect(modal.getAttribute('aria-labelledby')).toBe('modal-title')
    })

    it('should prevent body scroll', () => {
      cleanup = setupModal(modal)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll on cleanup', () => {
      cleanup = setupModal(modal)
      cleanup()
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('enableArrowNavigation', () => {
    let container
    let items

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="list">
          <button id="item1">Item 1</button>
          <button id="item2">Item 2</button>
          <button id="item3">Item 3</button>
        </div>
      `
      container = document.getElementById('list')
      items = container.querySelectorAll('button')
    })

    it('should move focus on ArrowDown', () => {
      enableArrowNavigation(container)
      items[0].focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      container.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should move focus on ArrowUp', () => {
      enableArrowNavigation(container)
      items[1].focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      container.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should move to first item on Home', () => {
      enableArrowNavigation(container)
      items[2].focus()

      const event = new KeyboardEvent('keydown', { key: 'Home' })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      container.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should move to last item on End', () => {
      enableArrowNavigation(container)
      items[0].focus()

      const event = new KeyboardEvent('keydown', { key: 'End' })
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() })
      container.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })
  })
})
