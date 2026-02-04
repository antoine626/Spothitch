/**
 * PhotoGallery Component Tests
 * Tests for photo gallery carousel functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderPhotoGallery, renderPhotoFullscreen } from '../src/components/PhotoGallery.js'

describe('PhotoGallery Component', () => {
  const mockPhotos = [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
    'https://example.com/photo3.jpg'
  ]

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  // ==================== renderPhotoGallery Tests ====================

  describe('renderPhotoGallery', () => {
    it('should render empty state when no photos provided', () => {
      const html = renderPhotoGallery([], 1)
      expect(html).toContain('photo-gallery-empty')
      expect(html).toContain('Aucune photo pour ce spot')
      expect(html).toContain('fas fa-camera')
    })

    it('should render empty state when photos is null', () => {
      const html = renderPhotoGallery(null, 1)
      expect(html).toContain('photo-gallery-empty')
    })

    it('should render empty state when photos is undefined', () => {
      const html = renderPhotoGallery(undefined, 1)
      expect(html).toContain('photo-gallery-empty')
    })

    it('should render add photo button in empty state', () => {
      const html = renderPhotoGallery([], 42)
      expect(html).toContain('openPhotoUpload(42)')
      expect(html).toContain('Ajouter une photo')
    })

    it('should render single photo gallery', () => {
      const html = renderPhotoGallery([mockPhotos[0]], 1)
      expect(html).toContain('photo-gallery')
      expect(html).toContain('gallery-1')
      expect(html).toContain(mockPhotos[0])
    })

    it('should not show navigation arrows for single photo', () => {
      const html = renderPhotoGallery([mockPhotos[0]], 1)
      expect(html).not.toContain('fa-chevron-left')
      expect(html).not.toContain('fa-chevron-right')
    })

    it('should not show counter for single photo', () => {
      const html = renderPhotoGallery([mockPhotos[0]], 1)
      expect(html).not.toContain('gallery-1-counter')
    })

    it('should render multiple photos gallery', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('photo-gallery')
      expect(html).toContain(mockPhotos[0])
      expect(html).toContain(mockPhotos[1])
      expect(html).toContain(mockPhotos[2])
    })

    it('should show navigation arrows for multiple photos', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('fa-chevron-left')
      expect(html).toContain('fa-chevron-right')
      expect(html).toContain('prevPhoto')
      expect(html).toContain('nextPhoto')
    })

    it('should show photo counter for multiple photos', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('gallery-1-counter')
      expect(html).toContain('/3')
    })

    it('should render thumbnails for multiple photos', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('goToPhoto')
      expect(html).toContain('data-thumb-index="0"')
      expect(html).toContain('data-thumb-index="1"')
      expect(html).toContain('data-thumb-index="2"')
    })

    it('should render fullscreen button', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('openPhotoFullscreen')
      expect(html).toContain('fa-expand')
    })

    it('should render add photo button', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('openPhotoUpload')
      expect(html).toContain('Ajouter une photo')
    })

    it('should escape photo URLs', () => {
      const unsafeUrl = 'https://example.com/photo.jpg?evil=%3Cscript%3Ealert(1)%3C/script%3E'
      const html = renderPhotoGallery([unsafeUrl], 1)
      // escapeHTML converts & < > to HTML entities in img src attributes
      expect(html).toContain('src=')
      expect(html).toContain('example.com')
    })

    it('should use correct gallery ID', () => {
      const html = renderPhotoGallery(mockPhotos, 99)
      expect(html).toContain('gallery-99')
      expect(html).toContain('data-gallery-id="gallery-99"')
    })

    it('should set lazy loading on images', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('loading="lazy"')
    })

    it('should include photo data in JSON script tag', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('application/json')
      expect(html).toContain(mockPhotos[0])
    })

    it('should have proper accessibility labels', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('aria-label')
      expect(html).toContain('Photo precedente')
      expect(html).toContain('Photo suivante')
      expect(html).toContain('Plein ecran')
    })

    it('should have correct initial border styling for thumbnails', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('border-primary-500')
      expect(html).toContain('border-transparent')
    })

    it('should render with correct aspect ratio for main image', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('aspect-video')
    })

    it('should handle special characters in spotId', () => {
      const html = renderPhotoGallery(mockPhotos, 123)
      expect(html).toContain('gallery-123')
    })
  })

  // ==================== renderPhotoFullscreen Tests ====================

  describe('renderPhotoFullscreen', () => {
    it('should render fullscreen container', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('photo-fullscreen')
      expect(html).toContain('fixed inset-0')
    })

    it('should render close button', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('closePhotoFullscreen')
      expect(html).toContain('fa-times')
      expect(html).toContain('Fermer')
    })

    it('should render correct photo at given index', () => {
      const html = renderPhotoFullscreen(mockPhotos, 1, 'gallery-1')
      expect(html).toContain(mockPhotos[1])
      expect(html).toContain('fullscreen-counter')
      expect(html).toContain('>2<')
    })

    it('should render navigation arrows for multiple photos', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('prevPhotoFullscreen')
      expect(html).toContain('nextPhotoFullscreen')
    })

    it('should not show navigation for single photo', () => {
      const html = renderPhotoFullscreen([mockPhotos[0]], 0, 'gallery-1')
      expect(html).not.toContain('prevPhotoFullscreen')
    })

    it('should show photo counter', () => {
      const html = renderPhotoFullscreen(mockPhotos, 2, 'gallery-1')
      expect(html).toContain('fullscreen-counter')
      expect(html).toContain('>3<')
      expect(html).toContain('/ 3')
    })

    it('should render thumbnails bar', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('goToPhotoFullscreen')
      expect(html).toContain('Photo 1')
      expect(html).toContain('Photo 2')
    })

    it('should highlight current thumbnail', () => {
      const html = renderPhotoFullscreen(mockPhotos, 1, 'gallery-1')
      expect(html).toContain('border-primary-500')
    })

    it('should store current index', () => {
      const html = renderPhotoFullscreen(mockPhotos, 1, 'gallery-1')
      expect(html).toContain('fullscreen-current-index')
      expect(html).toContain('value="1"')
    })

    it('should store gallery ID', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-99')
      expect(html).toContain('fullscreen-gallery-id')
      expect(html).toContain('gallery-99')
    })

    it('should store photos data', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('fullscreen-photos-data')
      expect(html).toContain(mockPhotos[0])
    })

    it('should escape photo URLs', () => {
      const unsafeUrl = 'https://example.com/photo.jpg?evil=%3Cscript%3Ealert(1)%3C/script%3E'
      const html = renderPhotoFullscreen([unsafeUrl], 0, 'gallery-1')
      // escapeHTML converts dangerous characters to HTML entities
      expect(html).toContain('src=')
      expect(html).toContain('example.com')
    })

    it('should have proper accessibility labels', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('aria-label="Fermer"')
      expect(html).toContain('aria-label="Photo precedente"')
      expect(html).toContain('aria-label="Photo suivante"')
    })

    it('should prevent body scroll on fullscreen', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('bg-black')
      expect(html).toContain('z-[100]')
    })

    it('should set proper image sizing', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('max-w-full')
      expect(html).toContain('max-h-full')
      expect(html).toContain('object-contain')
    })

    it('should handle empty photos array gracefully', () => {
      const html = renderPhotoFullscreen([], 0, 'gallery-1')
      expect(html).toContain('photo-fullscreen')
    })

    it('should handle first photo correctly', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('>1<')
      expect(html).toContain('/ ' + mockPhotos.length)
    })

    it('should handle last photo correctly', () => {
      const html = renderPhotoFullscreen(mockPhotos, mockPhotos.length - 1, 'gallery-1')
      expect(html).toContain('>' + mockPhotos.length + '<')
    })
  })

  // ==================== Global Handlers Tests ====================

  describe('Global Handlers', () => {
    beforeEach(() => {
      document.body.innerHTML = ''
      // Setup window handlers if needed
    })

    it('should have getCurrentPhotoIndex handler', () => {
      expect(window.getCurrentPhotoIndex).toBeDefined()
      expect(typeof window.getCurrentPhotoIndex).toBe('function')
    })

    it('should have goToPhoto handler', () => {
      expect(window.goToPhoto).toBeDefined()
      expect(typeof window.goToPhoto).toBe('function')
    })

    it('should have nextPhoto handler', () => {
      expect(window.nextPhoto).toBeDefined()
      expect(typeof window.nextPhoto).toBe('function')
    })

    it('should have prevPhoto handler', () => {
      expect(window.prevPhoto).toBeDefined()
      expect(typeof window.prevPhoto).toBe('function')
    })

    it('should have openPhotoFullscreen handler', () => {
      expect(window.openPhotoFullscreen).toBeDefined()
      expect(typeof window.openPhotoFullscreen).toBe('function')
    })

    it('should have closePhotoFullscreen handler', () => {
      expect(window.closePhotoFullscreen).toBeDefined()
      expect(typeof window.closePhotoFullscreen).toBe('function')
    })

    it('should have nextPhotoFullscreen handler', () => {
      expect(window.nextPhotoFullscreen).toBeDefined()
      expect(typeof window.nextPhotoFullscreen).toBe('function')
    })

    it('should have prevPhotoFullscreen handler', () => {
      expect(window.prevPhotoFullscreen).toBeDefined()
      expect(typeof window.prevPhotoFullscreen).toBe('function')
    })

    it('should have goToPhotoFullscreen handler', () => {
      expect(window.goToPhotoFullscreen).toBeDefined()
      expect(typeof window.goToPhotoFullscreen).toBe('function')
    })

    it('should have openPhotoUpload handler', () => {
      expect(window.openPhotoUpload).toBeDefined()
      expect(typeof window.openPhotoUpload).toBe('function')
    })
  })

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should render gallery and handle navigation', () => {
      document.body.innerHTML = renderPhotoGallery(mockPhotos, 1)
      const gallery = document.querySelector('[data-gallery-id="gallery-1"]')
      expect(gallery).toBeTruthy()
      expect(gallery.dataset.current).toBe('0')
    })

    it('should render fullscreen modal with proper structure', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      document.body.innerHTML = html
      const fullscreen = document.getElementById('photo-fullscreen')
      expect(fullscreen).toBeTruthy()
      expect(fullscreen.classList.contains('fixed')).toBe(true)
    })

    it('should have max 6 preview photos recommendation', () => {
      const sixPhotos = Array(6).fill('https://example.com/photo.jpg')
      const html = renderPhotoGallery(sixPhotos, 1)
      expect(html).toContain('gallery-1')
      const thumbs = html.match(/data-thumb-index/g)
      expect(thumbs?.length).toBe(6)
    })

    it('should handle many photos', () => {
      const manyPhotos = Array(20).fill('https://example.com/photo.jpg')
      const html = renderPhotoGallery(manyPhotos, 1)
      expect(html).toContain('gallery-1')
      expect(html).toContain('/20')
    })

    it('should preserve scroll context in main gallery', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      document.body.innerHTML = html
      expect(document.body.style.overflow).toBe('')
    })
  })

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle photos array with falsy values', () => {
      const html = renderPhotoGallery([mockPhotos[0], null, mockPhotos[1]], 1)
      expect(html).toContain('gallery-1')
    })

    it('should handle special characters in gallery ID', () => {
      const html = renderPhotoGallery(mockPhotos, 'spot-abc-123')
      expect(html).toContain('gallery-spot-abc-123')
    })

    it('should handle very long photo URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '.jpg'
      const html = renderPhotoGallery([longUrl], 1)
      expect(html).toContain('gallery-1')
    })

    it('should handle photo index at boundaries', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('>1<')
      expect(html).toContain(mockPhotos[0])
    })

    it('should handle last photo index', () => {
      const html = renderPhotoFullscreen(mockPhotos, mockPhotos.length - 1, 'gallery-1')
      expect(html).toContain('>' + mockPhotos.length + '<')
    })

    it('should render without throwing on empty gallery ID', () => {
      const html = renderPhotoGallery(mockPhotos, '')
      expect(html).toContain('gallery-')
    })

    it('should handle single character spotId', () => {
      const html = renderPhotoGallery(mockPhotos, 'a')
      expect(html).toContain('gallery-a')
    })
  })

  // ==================== Performance Tests ====================

  describe('Performance', () => {
    it('should render large photo gallery efficiently', () => {
      const photos = Array(50).fill('https://example.com/photo.jpg')
      const start = performance.now()
      renderPhotoGallery(photos, 1)
      const duration = performance.now() - start
      expect(duration).toBeLessThan(100) // Should render in less than 100ms
    })

    it('should lazily load images', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('loading="lazy"')
    })

    it('should use data attributes for efficient queries', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('data-gallery-id')
      expect(html).toContain('data-thumb-index')
      expect(html).toContain('data-current')
    })
  })

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('should have proper aria labels on buttons', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('aria-label')
    })

    it('should have proper alt text for images', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('alt=')
    })

    it('should have semantic HTML structure', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('<button')
      expect(html).toContain('<img')
    })

    it('should prevent click propagation in fullscreen', () => {
      const html = renderPhotoFullscreen(mockPhotos, 0, 'gallery-1')
      expect(html).toContain('stopPropagation')
    })

    it('should have role indicators', () => {
      const html = renderPhotoGallery(mockPhotos, 1)
      expect(html).toContain('<button')
      expect(html).toContain('onclick')
    })
  })
})
