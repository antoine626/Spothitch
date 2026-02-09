/**
 * Icon Accessibility Service
 * WCAG 2.1 AA compliant icon accessibility helpers
 * Provides functions to enhance icon accessibility with aria-labels, sr-only text,
 * and proper ARIA roles for icon-based UI elements
 */

import { getState } from '../stores/state.js'

// Storage key for preferences
const STORAGE_KEY = 'spothitch_icon_accessibility'

// Icon types
export const IconType = {
  DECORATIVE: 'decorative', // Pure decoration, hidden from screen readers
  INFORMATIVE: 'informative', // Conveys information, needs alt text
  INTERACTIVE: 'interactive', // Button/link, needs accessible label
  STATUS: 'status', // Status indicator, needs aria-live
}

// Translations for common icons
const iconTranslations = {
  fr: {
    // Navigation
    home: 'Accueil',
    back: 'Retour',
    menu: 'Menu',
    close: 'Fermer',
    settings: 'Parametres',
    search: 'Rechercher',
    filter: 'Filtrer',

    // Actions
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    share: 'Partager',
    download: 'Telecharger',
    upload: 'Telecharger vers le serveur',
    refresh: 'Actualiser',

    // Social
    like: 'J\'aime',
    comment: 'Commenter',
    favorite: 'Favori',
    follow: 'Suivre',
    message: 'Message',
    notification: 'Notification',

    // Info
    info: 'Information',
    warning: 'Avertissement',
    error: 'Erreur',
    success: 'Succes',
    help: 'Aide',

    // Map
    location: 'Localisation',
    map: 'Carte',
    directions: 'Itineraire',
    marker: 'Marqueur',

    // User
    user: 'Utilisateur',
    profile: 'Profil',
    login: 'Connexion',
    logout: 'Deconnexion',
    register: 'Inscription',

    // Media
    photo: 'Photo',
    video: 'Video',
    audio: 'Audio',
    camera: 'Appareil photo',

    // Misc
    star: 'Etoile',
    heart: 'Coeur',
    flag: 'Drapeau',
    calendar: 'Calendrier',
    clock: 'Horloge',
    check: 'Valide',
    times: 'Fermer',
    plus: 'Plus',
    minus: 'Moins',
    eye: 'Voir',
    'eye-slash': 'Cacher',

    // Status
    online: 'En ligne',
    offline: 'Hors ligne',
    loading: 'Chargement en cours',
    pending: 'En attente',
    completed: 'Complete',
  },
  en: {
    // Navigation
    home: 'Home',
    back: 'Back',
    menu: 'Menu',
    close: 'Close',
    settings: 'Settings',
    search: 'Search',
    filter: 'Filter',

    // Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    share: 'Share',
    download: 'Download',
    upload: 'Upload',
    refresh: 'Refresh',

    // Social
    like: 'Like',
    comment: 'Comment',
    favorite: 'Favorite',
    follow: 'Follow',
    message: 'Message',
    notification: 'Notification',

    // Info
    info: 'Information',
    warning: 'Warning',
    error: 'Error',
    success: 'Success',
    help: 'Help',

    // Map
    location: 'Location',
    map: 'Map',
    directions: 'Directions',
    marker: 'Marker',

    // User
    user: 'User',
    profile: 'Profile',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',

    // Media
    photo: 'Photo',
    video: 'Video',
    audio: 'Audio',
    camera: 'Camera',

    // Misc
    star: 'Star',
    heart: 'Heart',
    flag: 'Flag',
    calendar: 'Calendar',
    clock: 'Clock',
    check: 'Valid',
    times: 'Close',
    plus: 'Plus',
    minus: 'Minus',
    eye: 'View',
    'eye-slash': 'Hide',

    // Status
    online: 'Online',
    offline: 'Offline',
    loading: 'Loading',
    pending: 'Pending',
    completed: 'Completed',
  },
  es: {
    // Navigation
    home: 'Inicio',
    back: 'Atras',
    menu: 'Menu',
    close: 'Cerrar',
    settings: 'Configuracion',
    search: 'Buscar',
    filter: 'Filtrar',

    // Actions
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    share: 'Compartir',
    download: 'Descargar',
    upload: 'Subir',
    refresh: 'Actualizar',

    // Social
    like: 'Me gusta',
    comment: 'Comentar',
    favorite: 'Favorito',
    follow: 'Seguir',
    message: 'Mensaje',
    notification: 'Notificacion',

    // Info
    info: 'Informacion',
    warning: 'Advertencia',
    error: 'Error',
    success: 'Exito',
    help: 'Ayuda',

    // Map
    location: 'Ubicacion',
    map: 'Mapa',
    directions: 'Direcciones',
    marker: 'Marcador',

    // User
    user: 'Usuario',
    profile: 'Perfil',
    login: 'Iniciar sesion',
    logout: 'Cerrar sesion',
    register: 'Registrarse',

    // Media
    photo: 'Foto',
    video: 'Video',
    audio: 'Audio',
    camera: 'Camara',

    // Misc
    star: 'Estrella',
    heart: 'Corazon',
    flag: 'Bandera',
    calendar: 'Calendario',
    clock: 'Reloj',
    check: 'Valido',
    times: 'Cerrar',
    plus: 'Mas',
    minus: 'Menos',
    eye: 'Ver',
    'eye-slash': 'Ocultar',

    // Status
    online: 'En linea',
    offline: 'Fuera de linea',
    loading: 'Cargando',
    pending: 'Pendiente',
    completed: 'Completado',
  },
  de: {
    // Navigation
    home: 'Startseite',
    back: 'Zuruck',
    menu: 'Menu',
    close: 'Schliessen',
    settings: 'Einstellungen',
    search: 'Suchen',
    filter: 'Filtern',

    // Actions
    add: 'Hinzufugen',
    edit: 'Bearbeiten',
    delete: 'Loschen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestatigen',
    share: 'Teilen',
    download: 'Herunterladen',
    upload: 'Hochladen',
    refresh: 'Aktualisieren',

    // Social
    like: 'Gefalt mir',
    comment: 'Kommentieren',
    favorite: 'Favorit',
    follow: 'Folgen',
    message: 'Nachricht',
    notification: 'Benachrichtigung',

    // Info
    info: 'Information',
    warning: 'Warnung',
    error: 'Fehler',
    success: 'Erfolg',
    help: 'Hilfe',

    // Map
    location: 'Standort',
    map: 'Karte',
    directions: 'Wegbeschreibung',
    marker: 'Markierung',

    // User
    user: 'Benutzer',
    profile: 'Profil',
    login: 'Anmelden',
    logout: 'Abmelden',
    register: 'Registrieren',

    // Media
    photo: 'Foto',
    video: 'Video',
    audio: 'Audio',
    camera: 'Kamera',

    // Misc
    star: 'Stern',
    heart: 'Herz',
    flag: 'Flagge',
    calendar: 'Kalender',
    clock: 'Uhr',
    check: 'Gultig',
    times: 'Schliessen',
    plus: 'Plus',
    minus: 'Minus',
    eye: 'Ansehen',
    'eye-slash': 'Verstecken',

    // Status
    online: 'Online',
    offline: 'Offline',
    loading: 'Laden',
    pending: 'Ausstehend',
    completed: 'Abgeschlossen',
  },
}

/**
 * Get translation for an icon
 * @param {string} iconKey - Icon key (e.g., 'home', 'search')
 * @param {string} lang - Language code
 * @returns {string} Translated label
 */
export function getIconLabel(iconKey, lang = null) {
  const state = getState()
  const currentLang = lang || state?.lang || 'fr'
  const langTranslations = iconTranslations[currentLang] || iconTranslations.fr

  // Try with key as-is
  if (langTranslations[iconKey]) {
    return langTranslations[iconKey]
  }

  // Try removing 'fa-' prefix if present
  const cleanKey = iconKey.replace(/^fa-/, '')
  if (langTranslations[cleanKey]) {
    return langTranslations[cleanKey]
  }

  // Return key as fallback
  return iconKey
}

/**
 * Make icon accessible by adding appropriate ARIA attributes
 * @param {string} iconClass - Icon class (e.g., 'fas fa-home')
 * @param {Object} options - Options for accessibility
 * @returns {string} HTML string with accessible icon
 */
export function makeIconAccessible(iconClass, options = {}) {
  const {
    label = null,
    type = IconType.DECORATIVE,
    role = null,
    lang = null,
    className = '',
  } = options

  const state = getState()
  const currentLang = lang || state?.lang || 'fr'

  // Extract icon name for auto-labeling
  const iconMatch = iconClass.match(/fa-([a-z-]+)/)
  const iconName = iconMatch ? iconMatch[1] : ''

  // Determine label
  const finalLabel = label || (type !== IconType.DECORATIVE ? getIconLabel(iconName, currentLang) : '')

  // Build HTML based on type
  switch (type) {
    case IconType.DECORATIVE:
      // Purely decorative, hide from screen readers
      return `<i class="${iconClass} ${className}" aria-hidden="true"></i>`

    case IconType.INFORMATIVE:
      // Conveys information
      return `<i class="${iconClass} ${className}" aria-label="${finalLabel}" role="${role || 'img'}"></i>`

    case IconType.INTERACTIVE:
      // Interactive element (should be inside button/link)
      return `<i class="${iconClass} ${className}" aria-hidden="true"></i><span class="sr-only">${finalLabel}</span>`

    case IconType.STATUS:
      // Status indicator
      return `<i class="${iconClass} ${className}" aria-label="${finalLabel}" role="${role || 'status'}" aria-live="polite"></i>`

    default:
      return `<i class="${iconClass} ${className}" aria-hidden="true"></i>`
  }
}

/**
 * Create accessible icon button
 * @param {Object} options - Button options
 * @returns {string} HTML string for button with accessible icon
 */
export function renderIconButton(options = {}) {
  const {
    iconClass = 'fas fa-plus',
    label = '',
    onClick = '',
    className = '',
    disabled = false,
    variant = 'primary',
    size = 'md',
    lang = null,
  } = options

  const state = getState()
  const currentLang = lang || state?.lang || 'fr'

  // Extract icon name for auto-labeling
  const iconMatch = iconClass.match(/fa-([a-z-]+)/)
  const iconName = iconMatch ? iconMatch[1] : ''
  const finalLabel = label || getIconLabel(iconName, currentLang)

  // Size classes
  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg',
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-slate-500 hover:bg-slate-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-300',
  }

  return `
    <button
      type="button"
      ${onClick ? `onclick="${onClick}"` : ''}
      ${disabled ? 'disabled aria-disabled="true"' : ''}
      class="icon-button rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}"
      aria-label="${finalLabel}"
    >
      <i class="${iconClass}" aria-hidden="true"></i>
    </button>
  `.trim()
}

/**
 * Create accessible icon link
 * @param {Object} options - Link options
 * @returns {string} HTML string for link with accessible icon
 */
export function renderIconLink(options = {}) {
  const {
    iconClass = 'fas fa-link',
    label = '',
    href = '#',
    className = '',
    external = false,
    lang = null,
  } = options

  const state = getState()
  const currentLang = lang || state?.lang || 'fr'

  // Extract icon name for auto-labeling
  const iconMatch = iconClass.match(/fa-([a-z-]+)/)
  const iconName = iconMatch ? iconMatch[1] : ''
  const finalLabel = label || getIconLabel(iconName, currentLang)

  const externalAttrs = external ? 'target="_blank" rel="noopener noreferrer"' : ''
  const externalIcon = external ? '<i class="fas fa-external-link-alt ml-1 text-xs" aria-hidden="true"></i>' : ''

  return `
    <a
      href="${href}"
      ${externalAttrs}
      class="icon-link inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded ${className}"
      aria-label="${finalLabel}"
    >
      <i class="${iconClass}" aria-hidden="true"></i>
      <span class="sr-only">${finalLabel}</span>
      ${externalIcon}
    </a>
  `.trim()
}

/**
 * Create accessible status icon
 * @param {Object} options - Status icon options
 * @returns {string} HTML string for status icon
 */
export function renderStatusIcon(options = {}) {
  const {
    iconClass = 'fas fa-circle',
    label = '',
    status = 'info',
    animate = false,
    className = '',
    lang = null,
  } = options

  const state = getState()
  const currentLang = lang || state?.lang || 'fr'

  const finalLabel = label || getIconLabel(status, currentLang)

  // Status colors
  const statusColors = {
    online: 'text-green-500',
    offline: 'text-slate-500',
    pending: 'text-yellow-500',
    error: 'text-red-500',
    success: 'text-green-500',
    warning: 'text-orange-500',
    info: 'text-blue-500',
  }

  const animateClass = animate ? 'animate-pulse' : ''

  return `
    <span class="status-icon inline-flex items-center gap-2">
      <i
        class="${iconClass} ${statusColors[status] || statusColors.info} ${animateClass} ${className}"
        role="status"
        aria-label="${finalLabel}"
        aria-live="polite"
      ></i>
      <span class="sr-only">${finalLabel}</span>
    </span>
  `.trim()
}

/**
 * Enhance existing icons in HTML for accessibility
 * @param {string} html - HTML string containing icons
 * @returns {string} Enhanced HTML with accessible icons
 */
export function enhanceIconsAccessibility(html) {
  if (!html || typeof html !== 'string') {
    return html
  }

  // Find all icon elements (simple regex approach)
  // This is a basic implementation - in production, use proper DOM parsing
  const iconRegex = /<i\s+class="([^"]*fa[^"]*)"\s*><\/i>/gi

  return html.replace(iconRegex, (match, classes) => {
    // Check if already has aria-hidden
    if (match.includes('aria-hidden')) {
      return match
    }

    // Add aria-hidden by default for decorative icons
    return `<i class="${classes}" aria-hidden="true"></i>`
  })
}

/**
 * Validate icon accessibility in HTML
 * @param {string} html - HTML string to validate
 * @returns {Object} Validation result with issues
 */
export function validateIconAccessibility(html) {
  if (!html || typeof html !== 'string') {
    return { valid: false, issues: ['no-html'], score: 0 }
  }

  const issues = []

  // Find all icons
  const iconMatches = html.match(/<i[^>]*class="[^"]*fa[^"]*"[^>]*>/gi) || []

  iconMatches.forEach((icon, index) => {
    const hasAriaHidden = /aria-hidden="true"/.test(icon)
    const hasAriaLabel = /aria-label="[^"]+"/.test(icon)
    const hasRole = /role="[^"]+"/.test(icon)

    // Check if icon is in button or link (simplified check)
    // This would need proper DOM parsing in production

    if (!hasAriaHidden && !hasAriaLabel && !hasRole) {
      issues.push({
        type: 'missing-aria',
        message: `Icon ${index + 1} missing aria-hidden, aria-label, or role`,
        severity: 'warning',
        icon,
      })
    }

    // Check for standalone interactive icons (not in button/link)
    if (hasAriaLabel && !hasRole) {
      issues.push({
        type: 'missing-role',
        message: `Icon ${index + 1} has aria-label but missing role`,
        severity: 'warning',
        icon,
      })
    }
  })

  const score = iconMatches.length === 0 ? 100 : Math.max(0, 100 - (issues.length / iconMatches.length * 100))

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    totalIcons: iconMatches.length,
    score: Math.round(score),
  }
}

/**
 * Get all available icon translations
 * @returns {Object} Icon translations by language
 */
export function getIconTranslations() {
  return iconTranslations
}

/**
 * Get icon translations for a specific language
 * @param {string} lang - Language code
 * @returns {Object} Icon translations for the language
 */
export function getIconTranslationsForLang(lang = 'fr') {
  return iconTranslations[lang] || iconTranslations.fr
}

/**
 * Check if icon key has translation
 * @param {string} iconKey - Icon key
 * @param {string} lang - Language code
 * @returns {boolean} True if translation exists
 */
export function hasIconTranslation(iconKey, lang = 'fr') {
  const langTranslations = iconTranslations[lang] || iconTranslations.fr
  const cleanKey = iconKey.replace(/^fa-/, '')
  return Boolean(langTranslations[iconKey] || langTranslations[cleanKey])
}

/**
 * Add custom icon translation
 * @param {string} iconKey - Icon key
 * @param {Object} translations - Translations object { fr, en, es, de }
 */
export function addIconTranslation(iconKey, translations) {
  if (!iconKey || typeof translations !== 'object') {
    return false
  }

  Object.keys(translations).forEach(lang => {
    if (iconTranslations[lang]) {
      iconTranslations[lang][iconKey] = translations[lang]
    }
  })

  return true
}

// Export default object
export default {
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
}
