/**
 * Mock for src/utils/icons.js (Lucide icons)
 * Returns simple SVG placeholders for tests
 */
export function icon(name, cls) {
  return `<svg class="${cls || ''}" data-icon="${name}"></svg>`
}

export function brandIcon(name, cls) {
  return `<svg class="${cls || ''}" data-brand="${name}"></svg>`
}

export default { icon, brandIcon }
