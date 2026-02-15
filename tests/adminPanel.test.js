/**
 * Tests for Admin Panel component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderAdminPanel } from '../src/components/modals/AdminPanel.js';

describe('Admin Panel', () => {
  const mockState = {
    points: 100,
    level: 5,
    skillPoints: 10,
    thumbs: 50,
    showAdminPanel: true,
  };

  describe('renderAdminPanel', () => {
    it('should render admin panel modal', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('Panneau Admin');
      expect(html).toContain('modal-overlay');
    });

    it('should show current stats', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('100'); // points
      expect(html).toContain('5'); // level
    });

    it('should have resource buttons', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('+100');
      expect(html).toContain('+1000');
      expect(html).toContain('MAX ALL');
    });

    it('should have gamification section', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('Gamification');
      expect(html).toContain('Badges');
      expect(html).toContain('Quiz');
      expect(html).toContain('Quiz');
    });

    it('should have shop section', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('Boutique');
    });

    it('should have social section', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('Social');
    });

    it('should have system section', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('Système');

      expect(html).toContain('Reset');
      expect(html).toContain('Export');
    });

    it('should have navigation tabs', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('Carte');
      expect(html).toContain('Voyage');
      expect(html).toContain('Profil');
    });

    it('should have close button', () => {
      const html = renderAdminPanel(mockState);
      expect(html).toContain('closeAdminPanel');
    });
  });

  describe('Admin handlers', () => {
    it('should have openAdminPanel handler', () => {
      expect(typeof window.openAdminPanel).toBe('function');
    });

    it('should have closeAdminPanel handler', () => {
      expect(typeof window.closeAdminPanel).toBe('function');
    });

    it('should have adminAddPoints handler', () => {
      expect(typeof window.adminAddPoints).toBe('function');
    });

    it('should have adminAddSkillPoints handler', () => {
      expect(typeof window.adminAddSkillPoints).toBe('function');
    });

    it('should have adminLevelUp handler', () => {
      expect(typeof window.adminLevelUp).toBe('function');
    });

    it('should have adminMaxStats handler', () => {
      expect(typeof window.adminMaxStats).toBe('function');
    });

    it('should have adminExportState handler', () => {
      expect(typeof window.adminExportState).toBe('function');
    });

    it('should have adminResetState handler', () => {
      expect(typeof window.adminResetState).toBe('function');
    });
  });
});
