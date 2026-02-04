/**
 * Landing Component Tests
 * Tests for renderLanding page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderLanding } from '../src/components/views/Landing.js';

describe('Landing Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.openAuth = vi.fn();
    window.setAuthMode = vi.fn();
    window.skipWelcome = vi.fn();
    window.installPWA = vi.fn();
  });

  describe('renderLanding', () => {
    it('should render landing page structure', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('landing-page');
      expect(html).toContain('SpotHitch');
      expect(html).toContain('La communaute des autostoppeurs');
    });

    it('should contain hero section with CTA buttons', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('Commencer gratuitement');
      expect(html).toContain('Explorer la carte');
      expect(html).toContain('openAuth()');
      expect(html).toContain('setAuthMode');
      expect(html).toContain('skipWelcome()');
    });

    it('should display statistics', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('94+');
      expect(html).toContain('Spots verifies');
      expect(html).toContain('12');
      expect(html).toContain('Pays couverts');
      expect(html).toContain('1500+');
      expect(html).toContain('Autostoppeurs');
      expect(html).toContain('5000+');
      expect(html).toContain('Check-ins');
    });

    it('should contain features section with 6 features', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('Carte interactive');
      expect(html).toContain('Communaute active');
      expect(html).toContain('Planificateur de voyage');
      expect(html).toContain('Gamification');
      expect(html).toContain('Mode SOS');
      expect(html).toContain('Application PWA');
    });

    it('should contain how it works section with 4 steps', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('Comment ca marche');
      expect(html).toContain('Inscrivez-vous');
      expect(html).toContain('Explorez la carte');
      expect(html).toContain('Partagez vos spots');
      expect(html).toContain('Partez a l\'aventure');
    });

    it('should contain testimonials section with user feedback', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('Ils nous font confiance');
      expect(html).toContain('Marie L.');
      expect(html).toContain('Thomas K.');
      expect(html).toContain('Elena S.');
      expect(html).toContain('France');
      expect(html).toContain('Allemagne');
      expect(html).toContain('Espagne');
    });

    it('should contain app preview section with features list', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('Une application pensee pour la route');
      expect(html).toContain('Mode hors-ligne');
      expect(html).toContain('GPS integre');
      expect(html).toContain('100% gratuit');
      expect(html).toContain('Multilingue');
      expect(html).toContain('installPWA()');
    });

    it('should contain footer with navigation links', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('SpotHitch');
      expect(html).toContain('Application');
      expect(html).toContain('Ressources');
      expect(html).toContain('Legal');
      expect(html).toContain('openFAQ()');
      expect(html).toContain('showLegalPage');
    });

    it('should have proper semantic HTML structure', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('<section');
      expect(html).toContain('<h1');
      expect(html).toContain('<h2');
      expect(html).toContain('<button');
      expect(html).toContain('<footer');
    });

    it('should include emoji icons', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('🤙');
    });

    it('should have gradient text styling', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('gradient-text');
    });

    it('should have dark mode support with proper classes', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('slate-');
      expect(html).toContain('primary-');
    });

    it('should have proper accessibility attributes', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('sr-only');
    });

    it('should have call-to-action buttons with proper handlers', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('onclick="openAuth()');
      expect(html).toContain('setAuthMode(\'register\')');
      expect(html).toContain('setAuthMode(\'login\')');
    });

    it('should include font awesome icons', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('fa-');
      expect(html).toContain('fas');
      expect(html).toContain('fab');
    });
  });
});

export default { renderLanding };
