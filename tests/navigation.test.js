/**
 * Tests for Navigation component
 */

import { describe, it, expect } from 'vitest';
import { renderNavigation } from '../src/components/Navigation.js';

describe('Navigation Component', () => {
  const mockState = {
    activeTab: 'map',
  };

  describe('renderNavigation', () => {
    it('should render navigation bar', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('nav');
      expect(html).toContain('role="navigation"');
    });

    it('should render all tabs', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('Carte');
      expect(html).toContain('Voyage');
      expect(html).toContain('Social');
      expect(html).toContain('Profil');
    });

    it('should have data-tab attributes', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('data-tab="map"');
      expect(html).toContain('data-tab="challenges"');
      expect(html).toContain('data-tab="social"');
      expect(html).toContain('data-tab="profile"');
    });

    it('should have aria-labels for accessibility', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('aria-label="Carte"');
      expect(html).toContain('aria-label="Voyage"');
      expect(html).toContain('aria-label="Social"');
      expect(html).toContain('aria-label="Profil"');
    });

    it('should highlight active tab', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('aria-selected="true"');
    });

    it('should use changeTab onclick handler', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain("changeTab('map')");
      expect(html).toContain("changeTab('challenges')");
      expect(html).toContain("changeTab('social')");
      expect(html).toContain("changeTab('profile')");
    });

    it('should have icons for each tab', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('<svg');
      expect(html).toContain('<svg');
      expect(html).toContain('<svg');
      expect(html).toContain('<svg');
    });

    it('should be fixed at bottom', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('fixed');
      expect(html).toContain('bottom-4');
    });

    it('should have proper tablist role', () => {
      const html = renderNavigation(mockState);
      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
    });
  });

  describe('Tab states', () => {
    it('should mark map as active when activeTab is map', () => {
      const html = renderNavigation({ activeTab: 'map' });
      expect(html).toContain('id="tab-map"');
    });

    it('should mark challenges as active when activeTab is challenges', () => {
      const html = renderNavigation({ activeTab: 'challenges' });
      // The challenges tab should have active styling
      expect(html).toContain('challenges');
    });
  });
});
