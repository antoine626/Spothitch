/**
 * Icon Accessibility Service Tests
 * Comprehensive tests for WCAG 2.1 AA compliant icon accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  IconType,
  getIconLabel,
  makeIconAccessible,
  renderIconButton,
  renderIconLink,
  renderStatusIcon,
  enhanceIconsAccessibility,
  validateIconAccessibility,
  getIconTranslations,
  getIconTranslationsForLang,
  hasIconTranslation,
  addIconTranslation,
} from '../src/services/iconAccessibility.js'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    lang: 'fr',
  })),
}))

import { getState } from '../src/stores/state.js'

describe('Icon Accessibility Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getState.mockReturnValue({ lang: 'fr' })
  })

  describe('IconType enum', () => {
    it('should have DECORATIVE type', () => {
      expect(IconType.DECORATIVE).toBe('decorative')
    })

    it('should have INFORMATIVE type', () => {
      expect(IconType.INFORMATIVE).toBe('informative')
    })

    it('should have INTERACTIVE type', () => {
      expect(IconType.INTERACTIVE).toBe('interactive')
    })

    it('should have STATUS type', () => {
      expect(IconType.STATUS).toBe('status')
    })

    it('should have exactly 4 types', () => {
      expect(Object.keys(IconType).length).toBe(4)
    })
  })

  describe('getIconLabel', () => {
    it('should return French label by default', () => {
      expect(getIconLabel('home')).toBe('Accueil')
    })

    it('should return English label when lang is en', () => {
      getState.mockReturnValue({ lang: 'en' })
      expect(getIconLabel('home')).toBe('Home')
    })

    it('should return Spanish label when lang is es', () => {
      getState.mockReturnValue({ lang: 'es' })
      expect(getIconLabel('home')).toBe('Inicio')
    })

    it('should return German label when lang is de', () => {
      getState.mockReturnValue({ lang: 'de' })
      expect(getIconLabel('home')).toBe('Startseite')
    })

    it('should handle fa- prefix removal', () => {
      expect(getIconLabel('fa-home')).toBe('Accueil')
    })

    it('should return key as fallback for unknown icon', () => {
      expect(getIconLabel('unknown-icon')).toBe('unknown-icon')
    })

    it('should work with explicit lang parameter', () => {
      expect(getIconLabel('home', 'en')).toBe('Home')
    })

    it('should handle common navigation icons', () => {
      expect(getIconLabel('back')).toBe('Retour')
      expect(getIconLabel('menu')).toBe('Menu')
      expect(getIconLabel('close')).toBe('Fermer')
      expect(getIconLabel('settings')).toBe('Parametres')
    })

    it('should handle action icons', () => {
      expect(getIconLabel('add')).toBe('Ajouter')
      expect(getIconLabel('edit')).toBe('Modifier')
      expect(getIconLabel('delete')).toBe('Supprimer')
    })

    it('should handle social icons', () => {
      expect(getIconLabel('like')).toBe('J\'aime')
      expect(getIconLabel('comment')).toBe('Commenter')
      expect(getIconLabel('favorite')).toBe('Favori')
    })

    it('should handle status icons', () => {
      expect(getIconLabel('online')).toBe('En ligne')
      expect(getIconLabel('offline')).toBe('Hors ligne')
      expect(getIconLabel('loading')).toBe('Chargement en cours')
    })
  })

  describe('makeIconAccessible', () => {
    it('should create decorative icon with aria-hidden', () => {
      const html = makeIconAccessible('fas fa-home', { type: IconType.DECORATIVE })
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('fas fa-home')
    })

    it('should create informative icon with aria-label and role', () => {
      const html = makeIconAccessible('fas fa-info', {
        type: IconType.INFORMATIVE,
        label: 'Information',
      })
      expect(html).toContain('aria-label="Information"')
      expect(html).toContain('role="img"')
    })

    it('should create interactive icon with sr-only text', () => {
      const html = makeIconAccessible('fas fa-edit', {
        type: IconType.INTERACTIVE,
        label: 'Modifier',
      })
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('sr-only')
      expect(html).toContain('Modifier')
    })

    it('should create status icon with aria-live', () => {
      const html = makeIconAccessible('fas fa-circle', {
        type: IconType.STATUS,
        label: 'En ligne',
      })
      expect(html).toContain('aria-label="En ligne"')
      expect(html).toContain('role="status"')
      expect(html).toContain('aria-live="polite"')
    })

    it('should auto-label icon from translations', () => {
      const html = makeIconAccessible('fas fa-home', { type: IconType.INFORMATIVE })
      expect(html).toContain('aria-label="Accueil"')
    })

    it('should support custom role', () => {
      const html = makeIconAccessible('fas fa-icon', {
        type: IconType.INFORMATIVE,
        label: 'Test',
        role: 'presentation',
      })
      expect(html).toContain('role="presentation"')
    })

    it('should support custom className', () => {
      const html = makeIconAccessible('fas fa-home', {
        type: IconType.DECORATIVE,
        className: 'text-xl text-red-500',
      })
      expect(html).toContain('text-xl text-red-500')
    })

    it('should use explicit label over auto-label', () => {
      const html = makeIconAccessible('fas fa-home', {
        type: IconType.INFORMATIVE,
        label: 'Custom Label',
      })
      expect(html).toContain('aria-label="Custom Label"')
      expect(html).not.toContain('Accueil')
    })
  })

  describe('renderIconButton', () => {
    it('should render button with default options', () => {
      const html = renderIconButton()
      expect(html).toContain('<button')
      expect(html).toContain('fas fa-plus')
      expect(html).toContain('aria-hidden="true"')
    })

    it('should render button with custom icon', () => {
      const html = renderIconButton({ iconClass: 'fas fa-edit' })
      expect(html).toContain('fas fa-edit')
    })

    it('should render button with custom label', () => {
      const html = renderIconButton({ label: 'Modifier' })
      expect(html).toContain('aria-label="Modifier"')
    })

    it('should auto-label from icon name', () => {
      const html = renderIconButton({ iconClass: 'fas fa-home' })
      expect(html).toContain('aria-label="Accueil"')
    })

    it('should render button with onClick handler', () => {
      const html = renderIconButton({ onClick: 'handleClick()' })
      expect(html).toContain('onclick="handleClick()"')
    })

    it('should render disabled button', () => {
      const html = renderIconButton({ disabled: true })
      expect(html).toContain('disabled')
      expect(html).toContain('aria-disabled="true"')
      expect(html).toContain('opacity-50')
      expect(html).toContain('cursor-not-allowed')
    })

    it('should render button with primary variant', () => {
      const html = renderIconButton({ variant: 'primary' })
      expect(html).toContain('bg-primary-500')
      expect(html).toContain('hover:bg-primary-600')
    })

    it('should render button with secondary variant', () => {
      const html = renderIconButton({ variant: 'secondary' })
      expect(html).toContain('bg-slate-500')
      expect(html).toContain('hover:bg-slate-600')
    })

    it('should render button with danger variant', () => {
      const html = renderIconButton({ variant: 'danger' })
      expect(html).toContain('bg-red-500')
      expect(html).toContain('hover:bg-red-600')
    })

    it('should render button with ghost variant', () => {
      const html = renderIconButton({ variant: 'ghost' })
      expect(html).toContain('bg-transparent')
      expect(html).toContain('hover:bg-white/10')
    })

    it('should render button with small size', () => {
      const html = renderIconButton({ size: 'sm' })
      expect(html).toContain('p-1.5 text-sm')
    })

    it('should render button with medium size', () => {
      const html = renderIconButton({ size: 'md' })
      expect(html).toContain('p-2 text-base')
    })

    it('should render button with large size', () => {
      const html = renderIconButton({ size: 'lg' })
      expect(html).toContain('p-3 text-lg')
    })

    it('should render button with custom className', () => {
      const html = renderIconButton({ className: 'custom-class' })
      expect(html).toContain('custom-class')
    })

    it('should render button with focus styles', () => {
      const html = renderIconButton()
      expect(html).toContain('focus:outline-none')
      expect(html).toContain('focus:ring-2')
      expect(html).toContain('focus:ring-primary-500')
    })

    it('should support different languages', () => {
      getState.mockReturnValue({ lang: 'en' })
      const html = renderIconButton({ iconClass: 'fas fa-home' })
      expect(html).toContain('aria-label="Home"')
    })
  })

  describe('renderIconLink', () => {
    it('should render link with default options', () => {
      const html = renderIconLink()
      expect(html).toContain('<a')
      expect(html).toContain('href="#"')
      expect(html).toContain('fas fa-link')
    })

    it('should render link with custom icon', () => {
      const html = renderIconLink({ iconClass: 'fas fa-home' })
      expect(html).toContain('fas fa-home')
    })

    it('should render link with custom href', () => {
      const html = renderIconLink({ href: '/profile' })
      expect(html).toContain('href="/profile"')
    })

    it('should render link with custom label', () => {
      const html = renderIconLink({ label: 'Profil' })
      expect(html).toContain('aria-label="Profil"')
      expect(html).toContain('sr-only')
      expect(html).toContain('Profil')
    })

    it('should auto-label from icon name', () => {
      const html = renderIconLink({ iconClass: 'fas fa-user' })
      expect(html).toContain('aria-label="Utilisateur"')
    })

    it('should render external link with target blank', () => {
      const html = renderIconLink({ external: true })
      expect(html).toContain('target="_blank"')
      expect(html).toContain('rel="noopener noreferrer"')
    })

    it('should render external link with icon indicator', () => {
      const html = renderIconLink({ external: true })
      expect(html).toContain('fa-external-link-alt')
    })

    it('should not render external icon for internal links', () => {
      const html = renderIconLink({ external: false })
      expect(html).not.toContain('fa-external-link-alt')
    })

    it('should render link with custom className', () => {
      const html = renderIconLink({ className: 'custom-link' })
      expect(html).toContain('custom-link')
    })

    it('should render link with focus styles', () => {
      const html = renderIconLink()
      expect(html).toContain('focus:outline-none')
      expect(html).toContain('focus:ring-2')
      expect(html).toContain('focus:ring-primary-500')
    })

    it('should hide icon from screen readers', () => {
      const html = renderIconLink()
      expect(html).toContain('aria-hidden="true"')
    })
  })

  describe('renderStatusIcon', () => {
    it('should render status icon with default options', () => {
      const html = renderStatusIcon()
      expect(html).toContain('fas fa-circle')
      expect(html).toContain('role="status"')
      expect(html).toContain('aria-live="polite"')
    })

    it('should render online status with green color', () => {
      const html = renderStatusIcon({ status: 'online' })
      expect(html).toContain('text-green-500')
    })

    it('should render offline status with slate color', () => {
      const html = renderStatusIcon({ status: 'offline' })
      expect(html).toContain('text-slate-500')
    })

    it('should render pending status with yellow color', () => {
      const html = renderStatusIcon({ status: 'pending' })
      expect(html).toContain('text-yellow-500')
    })

    it('should render error status with red color', () => {
      const html = renderStatusIcon({ status: 'error' })
      expect(html).toContain('text-red-500')
    })

    it('should render success status with green color', () => {
      const html = renderStatusIcon({ status: 'success' })
      expect(html).toContain('text-green-500')
    })

    it('should render warning status with orange color', () => {
      const html = renderStatusIcon({ status: 'warning' })
      expect(html).toContain('text-orange-500')
    })

    it('should render info status with blue color', () => {
      const html = renderStatusIcon({ status: 'info' })
      expect(html).toContain('text-blue-500')
    })

    it('should render animated status icon', () => {
      const html = renderStatusIcon({ animate: true })
      expect(html).toContain('animate-pulse')
    })

    it('should not animate by default', () => {
      const html = renderStatusIcon({ animate: false })
      expect(html).not.toContain('animate-pulse')
    })

    it('should render with custom icon class', () => {
      const html = renderStatusIcon({ iconClass: 'fas fa-check' })
      expect(html).toContain('fas fa-check')
    })

    it('should render with custom label', () => {
      const html = renderStatusIcon({ label: 'Custom Status' })
      expect(html).toContain('aria-label="Custom Status"')
    })

    it('should auto-label from status', () => {
      const html = renderStatusIcon({ status: 'online' })
      expect(html).toContain('aria-label="En ligne"')
    })

    it('should include sr-only text', () => {
      const html = renderStatusIcon({ status: 'online' })
      expect(html).toContain('sr-only')
      expect(html).toContain('En ligne')
    })

    it('should render with custom className', () => {
      const html = renderStatusIcon({ className: 'custom-status' })
      expect(html).toContain('custom-status')
    })
  })

  describe('enhanceIconsAccessibility', () => {
    it('should return input for null', () => {
      expect(enhanceIconsAccessibility(null)).toBe(null)
    })

    it('should return input for non-string', () => {
      expect(enhanceIconsAccessibility(123)).toBe(123)
    })

    it('should add aria-hidden to icons without it', () => {
      const html = '<i class="fas fa-home"></i>'
      const enhanced = enhanceIconsAccessibility(html)
      expect(enhanced).toContain('aria-hidden="true"')
    })

    it('should not duplicate aria-hidden if already present', () => {
      const html = '<i class="fas fa-home" aria-hidden="true"></i>'
      const enhanced = enhanceIconsAccessibility(html)
      const matches = enhanced.match(/aria-hidden/g) || []
      expect(matches.length).toBe(1)
    })

    it('should handle multiple icons', () => {
      const html = '<i class="fas fa-home"></i><i class="fas fa-user"></i>'
      const enhanced = enhanceIconsAccessibility(html)
      const matches = enhanced.match(/aria-hidden="true"/g) || []
      expect(matches.length).toBe(2)
    })

    it('should preserve other attributes', () => {
      const html = '<i class="fas fa-home text-xl"></i>'
      const enhanced = enhanceIconsAccessibility(html)
      expect(enhanced).toContain('text-xl')
    })

    it('should handle icons with various FontAwesome prefixes', () => {
      const html = '<i class="fab fa-facebook"></i><i class="far fa-heart"></i>'
      const enhanced = enhanceIconsAccessibility(html)
      const matches = enhanced.match(/aria-hidden="true"/g) || []
      expect(matches.length).toBe(2)
    })
  })

  describe('validateIconAccessibility', () => {
    it('should return invalid for null html', () => {
      const result = validateIconAccessibility(null)
      expect(result.valid).toBe(false)
      expect(result.issues).toContain('no-html')
    })

    it('should return invalid for non-string html', () => {
      const result = validateIconAccessibility(123)
      expect(result.valid).toBe(false)
    })

    it('should detect icon missing aria attributes', () => {
      const html = '<i class="fas fa-home"></i>'
      const result = validateIconAccessibility(html)
      expect(result.issues.some(i => i.type === 'missing-aria')).toBe(true)
    })

    it('should not warn for icon with aria-hidden', () => {
      const html = '<i class="fas fa-home" aria-hidden="true"></i>'
      const result = validateIconAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-aria').length).toBe(0)
    })

    it('should not warn for icon with aria-label', () => {
      const html = '<i class="fas fa-home" aria-label="Home"></i>'
      const result = validateIconAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-aria').length).toBe(0)
    })

    it('should not warn for icon with role', () => {
      const html = '<i class="fas fa-home" role="img"></i>'
      const result = validateIconAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-aria').length).toBe(0)
    })

    it('should warn about icon with aria-label but no role', () => {
      const html = '<i class="fas fa-home" aria-label="Home"></i>'
      const result = validateIconAccessibility(html)
      expect(result.issues.some(i => i.type === 'missing-role')).toBe(true)
    })

    it('should count total icons correctly', () => {
      const html = '<i class="fas fa-home"></i><i class="fas fa-user"></i><i class="fas fa-edit"></i>'
      const result = validateIconAccessibility(html)
      expect(result.totalIcons).toBe(3)
    })

    it('should calculate score correctly', () => {
      const html = '<i class="fas fa-home" aria-hidden="true"></i>'
      const result = validateIconAccessibility(html)
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should give perfect score for fully accessible icons', () => {
      const html = '<i class="fas fa-home" aria-hidden="true"></i><i class="fas fa-user" aria-hidden="true"></i>'
      const result = validateIconAccessibility(html)
      expect(result.score).toBe(100)
    })

    it('should return 100 score for empty HTML', () => {
      const html = '<div>No icons</div>'
      const result = validateIconAccessibility(html)
      expect(result.score).toBe(100)
      expect(result.totalIcons).toBe(0)
    })
  })

  describe('getIconTranslations', () => {
    it('should return translations object', () => {
      const translations = getIconTranslations()
      expect(translations).toBeDefined()
      expect(typeof translations).toBe('object')
    })

    it('should have French translations', () => {
      const translations = getIconTranslations()
      expect(translations.fr).toBeDefined()
      expect(translations.fr.home).toBe('Accueil')
    })

    it('should have English translations', () => {
      const translations = getIconTranslations()
      expect(translations.en).toBeDefined()
      expect(translations.en.home).toBe('Home')
    })

    it('should have Spanish translations', () => {
      const translations = getIconTranslations()
      expect(translations.es).toBeDefined()
      expect(translations.es.home).toBe('Inicio')
    })

    it('should have German translations', () => {
      const translations = getIconTranslations()
      expect(translations.de).toBeDefined()
      expect(translations.de.home).toBe('Startseite')
    })

    it('should have all 4 languages', () => {
      const translations = getIconTranslations()
      expect(Object.keys(translations).length).toBe(4)
    })
  })

  describe('getIconTranslationsForLang', () => {
    it('should return French translations by default', () => {
      const translations = getIconTranslationsForLang()
      expect(translations.home).toBe('Accueil')
    })

    it('should return English translations for en', () => {
      const translations = getIconTranslationsForLang('en')
      expect(translations.home).toBe('Home')
    })

    it('should return Spanish translations for es', () => {
      const translations = getIconTranslationsForLang('es')
      expect(translations.home).toBe('Inicio')
    })

    it('should return German translations for de', () => {
      const translations = getIconTranslationsForLang('de')
      expect(translations.home).toBe('Startseite')
    })

    it('should fallback to French for unknown language', () => {
      const translations = getIconTranslationsForLang('xx')
      expect(translations.home).toBe('Accueil')
    })
  })

  describe('hasIconTranslation', () => {
    it('should return true for existing translation', () => {
      expect(hasIconTranslation('home')).toBe(true)
    })

    it('should return true for icon with fa- prefix', () => {
      expect(hasIconTranslation('fa-home')).toBe(true)
    })

    it('should return false for non-existing translation', () => {
      expect(hasIconTranslation('nonexistent')).toBe(false)
    })

    it('should work with different languages', () => {
      expect(hasIconTranslation('home', 'en')).toBe(true)
      expect(hasIconTranslation('home', 'es')).toBe(true)
      expect(hasIconTranslation('home', 'de')).toBe(true)
    })

    it('should check common navigation icons', () => {
      expect(hasIconTranslation('menu')).toBe(true)
      expect(hasIconTranslation('close')).toBe(true)
      expect(hasIconTranslation('back')).toBe(true)
    })

    it('should check action icons', () => {
      expect(hasIconTranslation('add')).toBe(true)
      expect(hasIconTranslation('edit')).toBe(true)
      expect(hasIconTranslation('delete')).toBe(true)
    })

    it('should check social icons', () => {
      expect(hasIconTranslation('like')).toBe(true)
      expect(hasIconTranslation('comment')).toBe(true)
      expect(hasIconTranslation('favorite')).toBe(true)
    })
  })

  describe('addIconTranslation', () => {
    it('should add new translation for all languages', () => {
      const result = addIconTranslation('custom', {
        fr: 'Personnalise',
        en: 'Custom',
        es: 'Personalizado',
        de: 'Benutzerdefiniert',
      })
      expect(result).toBe(true)
      expect(hasIconTranslation('custom')).toBe(true)
      expect(getIconLabel('custom', 'fr')).toBe('Personnalise')
      expect(getIconLabel('custom', 'en')).toBe('Custom')
    })

    it('should return false for missing iconKey', () => {
      const result = addIconTranslation('', { fr: 'Test' })
      expect(result).toBe(false)
    })

    it('should return false for non-object translations', () => {
      const result = addIconTranslation('test', 'not-object')
      expect(result).toBe(false)
    })

    it('should handle partial translations', () => {
      const result = addIconTranslation('partial', { fr: 'Partiel' })
      expect(result).toBe(true)
      expect(getIconLabel('partial', 'fr')).toBe('Partiel')
      expect(getIconLabel('partial', 'en')).toBe('partial') // Fallback to key
    })

    it('should overwrite existing translations', () => {
      addIconTranslation('home', { fr: 'Nouveau Accueil' })
      expect(getIconLabel('home', 'fr')).toBe('Nouveau Accueil')
    })
  })

  describe('Integration scenarios', () => {
    it('should create accessible button with auto-translation', () => {
      const html = renderIconButton({ iconClass: 'fas fa-save' })
      expect(html).toContain('aria-label="Enregistrer"')
      expect(html).toContain('fas fa-save')
      expect(html).toContain('aria-hidden="true"')
    })

    it('should create accessible link with external indicator', () => {
      const html = renderIconLink({
        iconClass: 'fas fa-external-link',
        href: 'https://example.com',
        external: true,
      })
      expect(html).toContain('target="_blank"')
      expect(html).toContain('rel="noopener noreferrer"')
      expect(html).toContain('fa-external-link-alt')
    })

    it('should validate and enhance HTML in workflow', () => {
      const originalHtml = '<button><i class="fas fa-home"></i></button>'
      const enhanced = enhanceIconsAccessibility(originalHtml)
      const validation = validateIconAccessibility(enhanced)

      expect(enhanced).toContain('aria-hidden="true"')
      expect(validation.issues.length).toBeLessThan(2)
    })

    it('should support multilingual icon buttons', () => {
      getState.mockReturnValue({ lang: 'en' })
      const enButton = renderIconButton({ iconClass: 'fas fa-delete' })

      getState.mockReturnValue({ lang: 'es' })
      const esButton = renderIconButton({ iconClass: 'fas fa-delete' })

      expect(enButton).toContain('aria-label="Delete"')
      expect(esButton).toContain('aria-label="Eliminar"')
    })

    it('should create status indicators with proper accessibility', () => {
      const online = renderStatusIcon({ status: 'online', label: 'Utilisateur en ligne' })
      expect(online).toContain('role="status"')
      expect(online).toContain('aria-live="polite"')
      expect(online).toContain('text-green-500')
      expect(online).toContain('sr-only')
    })
  })
})
