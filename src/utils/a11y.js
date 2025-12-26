/**
 * Accessibility Utilities
 * WCAG 2.1 AA Compliance Helpers
 */

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announce(message, priority = 'polite') {
  const announcer = document.getElementById('sr-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', priority);

  // Clear and set message (forces re-announcement)
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

function createAnnouncer() {
  const announcer = document.createElement('div');
  announcer.id = 'sr-announcer';
  announcer.className = 'sr-only';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(announcer);
  return announcer;
}

/**
 * Trap focus within an element (for modals)
 * @param {HTMLElement} element - Container element
 * @returns {Function} Cleanup function
 */
export function trapFocus(element) {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = element.querySelectorAll(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Focus first element
  firstFocusable?.focus();

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  function handleEscape(e) {
    if (e.key === 'Escape') {
      element.dispatchEvent(new CustomEvent('close-modal'));
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  element.addEventListener('keydown', handleEscape);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
    element.removeEventListener('keydown', handleEscape);
  };
}

/**
 * Generate unique ID for ARIA relationships
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'aria') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 * @returns {boolean}
 */
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Format number for screen readers
 * @param {number} num - Number to format
 * @param {string} unit - Unit name (singular)
 * @param {string} unitPlural - Unit name (plural)
 * @returns {string} Formatted string
 */
export function formatForSR(num, unit, unitPlural) {
  const plural = num === 1 ? unit : (unitPlural || `${unit}s`);
  return `${num} ${plural}`;
}

/**
 * Create skip link
 * @param {string} targetId - ID of main content
 * @param {string} text - Link text
 * @returns {string} HTML string
 */
export function createSkipLink(targetId = 'main-content', text = 'Aller au contenu principal') {
  return `
    <a 
      href="#${targetId}" 
      class="skip-link"
      tabindex="0"
    >
      ${text}
    </a>
  `;
}

/**
 * Add ARIA attributes to make an element a modal
 * @param {HTMLElement} element - Modal element
 * @param {string} labelledBy - ID of title element
 */
export function setupModal(element, labelledBy) {
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');

  if (labelledBy) {
    element.setAttribute('aria-labelledby', labelledBy);
  }

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Setup focus trap
  const cleanup = trapFocus(element);

  // Return cleanup function
  return () => {
    cleanup();
    document.body.style.overflow = '';
  };
}

/**
 * Color contrast checker (simplified)
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} Contrast ratio
 */
export function getContrastRatio(foreground, background) {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {boolean} largeText - Is large text (18px+ or 14px+ bold)
 * @returns {boolean}
 */
export function meetsContrastAA(foreground, background, largeText = false) {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Keyboard navigation handler for lists
 * @param {HTMLElement} container - List container
 * @param {string} itemSelector - Selector for list items
 */
export function enableArrowNavigation(container, itemSelector = 'button, a') {
  const items = container.querySelectorAll(itemSelector);

  container.addEventListener('keydown', (e) => {
    const currentIndex = Array.from(items).indexOf(document.activeElement);

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  });
}

export default {
  announce,
  trapFocus,
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
  formatForSR,
  createSkipLink,
  setupModal,
  getContrastRatio,
  meetsContrastAA,
  enableArrowNavigation,
};
