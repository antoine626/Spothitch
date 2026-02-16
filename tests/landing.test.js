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
    });

    it('should contain hero section with CTA buttons', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('openAuth()');
      expect(html).toContain('setAuthMode');
      expect(html).toContain('skipWelcome()');
    });

    it('should display statistics', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('14000+');
      expect(html).toContain('137');
      expect(html).toContain('Check-ins');
    });

    it('should contain features section', () => {
      const state = {};
      const html = renderLanding(state);

      // Check for feature section structure (6 feature cards)
      expect(html).toContain('<section');
      expect(html).toContain('rounded-xl');
    });

    it('should contain how it works section', () => {
      const state = {};
      const html = renderLanding(state);

      // Section with numbered steps
      expect(html).toContain('1');
      expect(html).toContain('2');
      expect(html).toContain('3');
      expect(html).toContain('4');
    });

    it('should contain testimonials section', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('France');
    });

    it('should contain app preview section', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('installPWA()');
    });

    it('should contain footer with navigation links', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('SpotHitch');
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

    it('should include SVG icons', () => {
      const state = {};
      const html = renderLanding(state);

      expect(html).toContain('<svg');
    });
  });
});

export default { renderLanding };
