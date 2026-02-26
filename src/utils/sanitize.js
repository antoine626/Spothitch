/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing HTML content
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify
const config = {
  ALLOWED_TAGS: [
    'a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
    'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'button', 'input', 'label', 'form', 'select', 'option', 'textarea',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'nav', 'main', 'section', 'article', 'header', 'footer', 'aside',
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'style', 'type', 'value',
    'placeholder', 'name', 'for', 'checked', 'disabled', 'readonly', 'required',
    'min', 'max', 'step', 'pattern', 'minlength', 'maxlength',
    'role', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
    'aria-expanded', 'aria-controls', 'aria-selected', 'aria-modal', 'aria-live',
    'aria-atomic', 'aria-busy', 'aria-current', 'aria-invalid', 'aria-required',
    'tabindex', 'autofocus', 'autocomplete',
    'data-*',
    'target', 'rel', 'download',
    'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r',
    'loading', 'decoding',
  ],
  ALLOW_DATA_ATTR: true,
  FORBID_ATTR: ['onclick', 'onchange', 'onsubmit', 'oninput', 'onfocus', 'onblur', 'onerror', 'onload', 'onmouseover'],
};

/**
 * Sanitize HTML string to prevent XSS
 * @param {string} dirty - Potentially unsafe HTML
 * @returns {string} Sanitized HTML
 */
export function sanitize(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize and set innerHTML safely
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content to set
 */
function safeInnerHTML(element, html) {
  if (!element) return;
  element.innerHTML = sanitize(html);
}

/**
 * Create a sanitized HTML element from string
 * @param {string} html - HTML string
 * @returns {DocumentFragment} Sanitized document fragment
 */
function createSafeHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = sanitize(html);
  return template.content;
}

/**
 * Escape HTML entities (for text content, not HTML)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
  if (!text || typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escape a string for safe use inside JS string literals in HTML onclick attributes.
 * Prevents XSS when injecting user data into onclick="fn('${value}')".
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for onclick attributes
 */
export function escapeJSString(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/\\/g, '\\\\')
    .replace(/&/g, '&amp;')  // & first to avoid double-encoding
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Sanitize user input for use in templates
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return escapeHTML(input.trim());
}

export default {
  sanitize,
  safeInnerHTML,
  createSafeHTML,
  escapeHTML,
  escapeJSString,
  sanitizeInput,
};
