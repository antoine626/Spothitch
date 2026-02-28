/**
 * Tests for Admin Panel component — 3-tab dashboard
 */

import { describe, it, expect } from 'vitest'
import { renderAdminPanel } from '../src/components/modals/AdminPanel.js'

describe('Admin Panel', () => {
  const mockState = {
    points: 100,
    level: 5,
    skillPoints: 10,
    thumbs: 50,
    showAdminPanel: true,
    adminActiveTab: 'feedback',
    adminFeedbackData: null,
    adminFeedbackPeriod: 'all',
    adminSentryIssues: null,
  }

  describe('renderAdminPanel — tab navigation', () => {
    it('should render admin panel modal with tabs', () => {
      const html = renderAdminPanel(mockState)
      expect(html).toContain('Panneau Admin')
      expect(html).toContain('modal-overlay')
      expect(html).toContain('setAdminTab')
    })

    it('should show 3 tab buttons', () => {
      const html = renderAdminPanel(mockState)
      expect(html).toContain('Feedbacks')
      expect(html).toContain('Erreurs')
      expect(html).toContain('Outils')
    })

    it('should have close button', () => {
      const html = renderAdminPanel(mockState)
      expect(html).toContain('closeAdminPanel')
    })
  })

  describe('renderAdminPanel — feedback tab (default)', () => {
    it('should show load button when no data', () => {
      const html = renderAdminPanel(mockState)
      expect(html).toContain('loadAdminFeedback')
    })

    it('should show analytics when data loaded', () => {
      const state = {
        ...mockState,
        adminFeedbackData: [
          { featureId: 'search-city', reactions: ['like', 'love'], comment: 'Great!', userName: 'Alice', timestamp: new Date().toISOString() },
          { featureId: 'filters', reactions: ['bug'], comment: 'Broken', userName: 'Bob', timestamp: new Date().toISOString() },
        ],
      }
      const html = renderAdminPanel(state)
      expect(html).toContain('2') // total feedbacks
      expect(html).toContain('exportFeedbackCSV')
      expect(html).toContain('setAdminFeedbackPeriod')
    })
  })

  describe('renderAdminPanel — sentry tab', () => {
    it('should show load button when no data', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'sentry' })
      expect(html).toContain('loadAdminSentry')
    })

    it('should show no errors message when empty', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'sentry', adminSentryIssues: [] })
      expect(html).toContain('Aucune erreur')
    })

    it('should show issues when loaded', () => {
      const state = {
        ...mockState,
        adminActiveTab: 'sentry',
        adminSentryIssues: [
          { title: 'setChatRoom is not defined', state: 'open', number: 42, created_at: new Date().toISOString(), html_url: 'https://github.com/test' },
        ],
      }
      const html = renderAdminPanel(state)
      expect(html).toContain('setChatRoom is not defined')
      expect(html).toContain('#42')
    })
  })

  describe('renderAdminPanel — tools tab', () => {
    it('should show current stats', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'tools' })
      expect(html).toContain('100') // points
      expect(html).toContain('5') // level
    })

    it('should have resource buttons', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'tools' })
      expect(html).toContain('+100')
      expect(html).toContain('+1000')
      expect(html).toContain('MAX ALL')
    })

    it('should have gamification section', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'tools' })
      expect(html).toContain('Gamification')
      expect(html).toContain('Badges')
      expect(html).toContain('Quiz')
    })

    it('should have shop section', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'tools' })
      expect(html).toContain('Boutique')
    })

    it('should have social section', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'tools' })
      expect(html).toContain('Social')
    })

    it('should have system section', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'tools' })
      expect(html).toContain('Reset')
      expect(html).toContain('Export')
    })

    it('should have navigation tabs', () => {
      const html = renderAdminPanel({ ...mockState, adminActiveTab: 'tools' })
      expect(html).toContain('Carte')
      expect(html).toContain('Voyage')
      expect(html).toContain('Profil')
    })
  })

  describe('Admin handlers', () => {
    it('should have openAdminPanel handler', () => {
      expect(typeof window.openAdminPanel).toBe('function')
    })

    it('should have closeAdminPanel handler', () => {
      expect(typeof window.closeAdminPanel).toBe('function')
    })

    it('should have adminAddPoints handler', () => {
      expect(typeof window.adminAddPoints).toBe('function')
    })

    it('should have adminAddSkillPoints handler', () => {
      expect(typeof window.adminAddSkillPoints).toBe('function')
    })

    it('should have adminLevelUp handler', () => {
      expect(typeof window.adminLevelUp).toBe('function')
    })

    it('should have adminMaxStats handler', () => {
      expect(typeof window.adminMaxStats).toBe('function')
    })

    it('should have adminExportState handler', () => {
      expect(typeof window.adminExportState).toBe('function')
    })

    it('should have adminResetState handler', () => {
      expect(typeof window.adminResetState).toBe('function')
    })

    it('should have setAdminTab handler', () => {
      expect(typeof window.setAdminTab).toBe('function')
    })

    it('should have loadAdminFeedback handler', () => {
      expect(typeof window.loadAdminFeedback).toBe('function')
    })

    it('should have setAdminFeedbackPeriod handler', () => {
      expect(typeof window.setAdminFeedbackPeriod).toBe('function')
    })

    it('should have exportFeedbackCSV handler', () => {
      expect(typeof window.exportFeedbackCSV).toBe('function')
    })

    it('should have loadAdminSentry handler', () => {
      expect(typeof window.loadAdminSentry).toBe('function')
    })
  })
})
