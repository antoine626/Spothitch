/**
 * Gamification UI Service
 * Manages progressive simplification of gamification interface based on user level and preferences
 *
 * Features:
 * - Progressive element unlocking (BEGINNER → INTERMEDIATE → ADVANCED → EXPERT)
 * - Custom visibility overrides per element
 * - Compact mode, animations toggle, notifications toggle
 * - Full UI rendering for gamification panel, badges, progress bars, notifications
 * - i18n support (FR/EN/ES/DE)
 */

const STORAGE_KEY = 'spothitch_gamification_ui'

// UI Complexity Levels
export const UIComplexityLevel = {
  BEGINNER: 'BEGINNER', // Levels 1-5
  INTERMEDIATE: 'INTERMEDIATE', // Levels 6-15
  ADVANCED: 'ADVANCED', // Levels 16-30
  EXPERT: 'EXPERT', // Levels 31+
}

// UI Elements
export const UIElement = {
  POINTS_DISPLAY: 'POINTS_DISPLAY',
  LEVEL_BAR: 'LEVEL_BAR',
  BADGES: 'BADGES',
  LEADERBOARD: 'LEADERBOARD',
  QUESTS: 'QUESTS',
  STREAKS: 'STREAKS',
  SEASONS: 'SEASONS',
  GUILDS: 'GUILDS',
  ACHIEVEMENTS: 'ACHIEVEMENTS',
  FRIEND_CHALLENGES: 'FRIEND_CHALLENGES',
}

// Element unlock levels
const ELEMENT_UNLOCK_LEVELS = {
  [UIElement.POINTS_DISPLAY]: 1,
  [UIElement.LEVEL_BAR]: 1,
  [UIElement.BADGES]: 6,
  [UIElement.QUESTS]: 6,
  [UIElement.STREAKS]: 6,
  [UIElement.LEADERBOARD]: 16,
  [UIElement.SEASONS]: 16,
  [UIElement.ACHIEVEMENTS]: 16,
  [UIElement.GUILDS]: 31,
  [UIElement.FRIEND_CHALLENGES]: 31,
}

// Translations
const translations = {
  fr: {
    elements: {
      [UIElement.POINTS_DISPLAY]: 'Affichage des points',
      [UIElement.LEVEL_BAR]: 'Barre de niveau',
      [UIElement.BADGES]: 'Badges',
      [UIElement.LEADERBOARD]: 'Classement',
      [UIElement.QUESTS]: 'Quêtes',
      [UIElement.STREAKS]: 'Séries',
      [UIElement.SEASONS]: 'Saisons',
      [UIElement.GUILDS]: 'Guildes',
      [UIElement.ACHIEVEMENTS]: 'Succès',
      [UIElement.FRIEND_CHALLENGES]: 'Défis entre amis',
    },
    descriptions: {
      [UIElement.POINTS_DISPLAY]: 'Affiche vos points actuels',
      [UIElement.LEVEL_BAR]: 'Progression vers le niveau suivant',
      [UIElement.BADGES]: 'Vos badges débloqués',
      [UIElement.LEADERBOARD]: 'Comparez-vous aux autres',
      [UIElement.QUESTS]: 'Missions à accomplir',
      [UIElement.STREAKS]: 'Jours consécutifs de connexion',
      [UIElement.SEASONS]: 'Événements saisonniers',
      [UIElement.GUILDS]: 'Rejoignez des groupes',
      [UIElement.ACHIEVEMENTS]: 'Objectifs à long terme',
      [UIElement.FRIEND_CHALLENGES]: 'Défiez vos amis',
    },
    complexity: {
      [UIComplexityLevel.BEGINNER]: 'Débutant',
      [UIComplexityLevel.INTERMEDIATE]: 'Intermédiaire',
      [UIComplexityLevel.ADVANCED]: 'Avancé',
      [UIComplexityLevel.EXPERT]: 'Expert',
    },
    ui: {
      level: 'Niveau',
      points: 'Points',
      progress: 'Progression',
      unlockedAt: 'Débloqué au niveau',
      locked: 'Verrouillé',
      settings: 'Paramètres',
      compactMode: 'Mode compact',
      animations: 'Animations',
      notifications: 'Notifications',
      levelUp: 'Niveau supérieur !',
      unlockedElements: 'Nouveaux éléments débloqués',
      customize: 'Personnaliser',
    },
  },
  en: {
    elements: {
      [UIElement.POINTS_DISPLAY]: 'Points Display',
      [UIElement.LEVEL_BAR]: 'Level Bar',
      [UIElement.BADGES]: 'Badges',
      [UIElement.LEADERBOARD]: 'Leaderboard',
      [UIElement.QUESTS]: 'Quests',
      [UIElement.STREAKS]: 'Streaks',
      [UIElement.SEASONS]: 'Seasons',
      [UIElement.GUILDS]: 'Guilds',
      [UIElement.ACHIEVEMENTS]: 'Achievements',
      [UIElement.FRIEND_CHALLENGES]: 'Friend Challenges',
    },
    descriptions: {
      [UIElement.POINTS_DISPLAY]: 'Display your current points',
      [UIElement.LEVEL_BAR]: 'Progress to next level',
      [UIElement.BADGES]: 'Your unlocked badges',
      [UIElement.LEADERBOARD]: 'Compare with others',
      [UIElement.QUESTS]: 'Missions to complete',
      [UIElement.STREAKS]: 'Consecutive login days',
      [UIElement.SEASONS]: 'Seasonal events',
      [UIElement.GUILDS]: 'Join groups',
      [UIElement.ACHIEVEMENTS]: 'Long-term goals',
      [UIElement.FRIEND_CHALLENGES]: 'Challenge your friends',
    },
    complexity: {
      [UIComplexityLevel.BEGINNER]: 'Beginner',
      [UIComplexityLevel.INTERMEDIATE]: 'Intermediate',
      [UIComplexityLevel.ADVANCED]: 'Advanced',
      [UIComplexityLevel.EXPERT]: 'Expert',
    },
    ui: {
      level: 'Level',
      points: 'Points',
      progress: 'Progress',
      unlockedAt: 'Unlocked at level',
      locked: 'Locked',
      settings: 'Settings',
      compactMode: 'Compact mode',
      animations: 'Animations',
      notifications: 'Notifications',
      levelUp: 'Level up!',
      unlockedElements: 'New elements unlocked',
      customize: 'Customize',
    },
  },
  es: {
    elements: {
      [UIElement.POINTS_DISPLAY]: 'Visualización de puntos',
      [UIElement.LEVEL_BAR]: 'Barra de nivel',
      [UIElement.BADGES]: 'Insignias',
      [UIElement.LEADERBOARD]: 'Clasificación',
      [UIElement.QUESTS]: 'Misiones',
      [UIElement.STREAKS]: 'Rachas',
      [UIElement.SEASONS]: 'Temporadas',
      [UIElement.GUILDS]: 'Gremios',
      [UIElement.ACHIEVEMENTS]: 'Logros',
      [UIElement.FRIEND_CHALLENGES]: 'Desafíos entre amigos',
    },
    descriptions: {
      [UIElement.POINTS_DISPLAY]: 'Muestra tus puntos actuales',
      [UIElement.LEVEL_BAR]: 'Progreso al siguiente nivel',
      [UIElement.BADGES]: 'Tus insignias desbloqueadas',
      [UIElement.LEADERBOARD]: 'Compárate con otros',
      [UIElement.QUESTS]: 'Misiones por completar',
      [UIElement.STREAKS]: 'Días consecutivos de conexión',
      [UIElement.SEASONS]: 'Eventos estacionales',
      [UIElement.GUILDS]: 'Únete a grupos',
      [UIElement.ACHIEVEMENTS]: 'Objetivos a largo plazo',
      [UIElement.FRIEND_CHALLENGES]: 'Desafía a tus amigos',
    },
    complexity: {
      [UIComplexityLevel.BEGINNER]: 'Principiante',
      [UIComplexityLevel.INTERMEDIATE]: 'Intermedio',
      [UIComplexityLevel.ADVANCED]: 'Avanzado',
      [UIComplexityLevel.EXPERT]: 'Experto',
    },
    ui: {
      level: 'Nivel',
      points: 'Puntos',
      progress: 'Progreso',
      unlockedAt: 'Desbloqueado en nivel',
      locked: 'Bloqueado',
      settings: 'Configuración',
      compactMode: 'Modo compacto',
      animations: 'Animaciones',
      notifications: 'Notificaciones',
      levelUp: '¡Subiste de nivel!',
      unlockedElements: 'Nuevos elementos desbloqueados',
      customize: 'Personalizar',
    },
  },
  de: {
    elements: {
      [UIElement.POINTS_DISPLAY]: 'Punkteanzeige',
      [UIElement.LEVEL_BAR]: 'Level-Balken',
      [UIElement.BADGES]: 'Abzeichen',
      [UIElement.LEADERBOARD]: 'Bestenliste',
      [UIElement.QUESTS]: 'Quests',
      [UIElement.STREAKS]: 'Serien',
      [UIElement.SEASONS]: 'Jahreszeiten',
      [UIElement.GUILDS]: 'Gilden',
      [UIElement.ACHIEVEMENTS]: 'Erfolge',
      [UIElement.FRIEND_CHALLENGES]: 'Freunde-Herausforderungen',
    },
    descriptions: {
      [UIElement.POINTS_DISPLAY]: 'Zeigt deine aktuellen Punkte',
      [UIElement.LEVEL_BAR]: 'Fortschritt zum nächsten Level',
      [UIElement.BADGES]: 'Deine freigeschalteten Abzeichen',
      [UIElement.LEADERBOARD]: 'Vergleiche dich mit anderen',
      [UIElement.QUESTS]: 'Missionen zu erfüllen',
      [UIElement.STREAKS]: 'Aufeinanderfolgende Login-Tage',
      [UIElement.SEASONS]: 'Saisonale Events',
      [UIElement.GUILDS]: 'Trete Gruppen bei',
      [UIElement.ACHIEVEMENTS]: 'Langfristige Ziele',
      [UIElement.FRIEND_CHALLENGES]: 'Fordere deine Freunde heraus',
    },
    complexity: {
      [UIComplexityLevel.BEGINNER]: 'Anfänger',
      [UIComplexityLevel.INTERMEDIATE]: 'Fortgeschritten',
      [UIComplexityLevel.ADVANCED]: 'Erweitert',
      [UIComplexityLevel.EXPERT]: 'Experte',
    },
    ui: {
      level: 'Level',
      points: 'Punkte',
      progress: 'Fortschritt',
      unlockedAt: 'Freigeschaltet auf Level',
      locked: 'Gesperrt',
      settings: 'Einstellungen',
      compactMode: 'Kompaktmodus',
      animations: 'Animationen',
      notifications: 'Benachrichtigungen',
      levelUp: 'Level aufgestiegen!',
      unlockedElements: 'Neue Elemente freigeschaltet',
      customize: 'Anpassen',
    },
  },
}

// Internal state
let initialized = false
let currentUserLevel = 1
let customVisibility = {}
let compactMode = false
let animationsEnabled = true
let notificationsEnabled = true

/**
 * Get data from storage
 */
function getStorageData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.warn('[GamificationUI] Failed to read storage:', e)
  }
  return null
}

/**
 * Save data to storage
 */
function saveStorageData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[GamificationUI] Failed to save storage:', e)
  }
}

/**
 * Load settings from storage
 */
function loadSettings() {
  const data = getStorageData()
  if (data) {
    customVisibility = data.customVisibility || {}
    compactMode = data.compactMode || false
    animationsEnabled = data.animationsEnabled !== false
    notificationsEnabled = data.notificationsEnabled !== false
  }
}

/**
 * Save settings to storage
 */
function saveSettings() {
  saveStorageData({
    customVisibility,
    compactMode,
    animationsEnabled,
    notificationsEnabled,
  })
}

/**
 * Reset gamification UI service (for testing)
 */
export function resetGamificationUI() {
  initialized = false
  currentUserLevel = 1
  customVisibility = {}
  compactMode = false
  animationsEnabled = true
  notificationsEnabled = true
}

/**
 * Initialize gamification UI service
 * @param {number} userLevel - Current user level
 */
export function initGamificationUI(userLevel = 1) {
  if (initialized) return

  currentUserLevel = userLevel
  loadSettings()
  initialized = true
}

/**
 * Get UI complexity level based on user level
 * @param {number} userLevel - User level
 * @returns {string} UIComplexityLevel
 */
export function getUIComplexityLevel(userLevel) {
  if (userLevel >= 31) return UIComplexityLevel.EXPERT
  if (userLevel >= 16) return UIComplexityLevel.ADVANCED
  if (userLevel >= 6) return UIComplexityLevel.INTERMEDIATE
  return UIComplexityLevel.BEGINNER
}

/**
 * Get visible elements based on user level
 * @param {number} userLevel - User level
 * @returns {string[]} Array of visible UIElement values
 */
export function getVisibleElements(userLevel) {
  const visible = []

  for (const [element, unlockLevel] of Object.entries(ELEMENT_UNLOCK_LEVELS)) {
    // Check custom visibility first
    if (customVisibility[element] !== undefined) {
      if (customVisibility[element]) {
        visible.push(element)
      }
      continue
    }

    // Default: visible if user level >= unlock level
    if (userLevel >= unlockLevel) {
      visible.push(element)
    }
  }

  return visible
}

/**
 * Check if a specific element is visible
 * @param {string} element - UIElement value
 * @param {number} userLevel - User level
 * @returns {boolean} True if visible
 */
export function isElementVisible(element, userLevel) {
  // Check custom visibility first
  if (customVisibility[element] !== undefined) {
    return customVisibility[element]
  }

  // Default: visible if user level >= unlock level
  const unlockLevel = ELEMENT_UNLOCK_LEVELS[element]
  if (unlockLevel === undefined) return false

  return userLevel >= unlockLevel
}

/**
 * Set custom visibility for an element
 * @param {string} element - UIElement value
 * @param {boolean} visible - Visibility state
 */
export function setCustomVisibility(element, visible) {
  if (!Object.values(UIElement).includes(element)) {
    console.warn('[GamificationUI] Invalid element:', element)
    return
  }

  customVisibility[element] = visible
  saveSettings()
}

/**
 * Get all custom visibility overrides
 * @returns {Object} Map of element to visibility
 */
export function getCustomVisibility() {
  return { ...customVisibility }
}

/**
 * Reset custom visibility to defaults
 */
export function resetCustomVisibility() {
  customVisibility = {}
  saveSettings()
}

/**
 * Get the level at which an element unlocks
 * @param {string} element - UIElement value
 * @returns {number|null} Unlock level or null if invalid
 */
export function getElementUnlockLevel(element) {
  return ELEMENT_UNLOCK_LEVELS[element] || null
}

/**
 * Get compact mode setting
 * @returns {boolean} True if compact mode enabled
 */
export function getCompactMode() {
  return compactMode
}

/**
 * Set compact mode
 * @param {boolean} enabled - Compact mode state
 */
export function setCompactMode(enabled) {
  compactMode = !!enabled
  saveSettings()
}

/**
 * Get animations enabled setting
 * @returns {boolean} True if animations enabled
 */
export function getAnimationsEnabled() {
  return animationsEnabled
}

/**
 * Set animations enabled
 * @param {boolean} enabled - Animations state
 */
export function setAnimationsEnabled(enabled) {
  animationsEnabled = !!enabled
  saveSettings()
}

/**
 * Get notifications enabled setting
 * @returns {boolean} True if notifications enabled
 */
export function getNotificationsEnabled() {
  return notificationsEnabled
}

/**
 * Set notifications enabled
 * @param {boolean} enabled - Notifications state
 */
export function setNotificationsEnabled(enabled) {
  notificationsEnabled = !!enabled
  saveSettings()
}

/**
 * Get layout configuration based on user level
 * @param {number} userLevel - User level
 * @returns {Object} Layout configuration
 */
export function getLayoutConfig(userLevel) {
  const complexity = getUIComplexityLevel(userLevel)
  const visibleElements = getVisibleElements(userLevel)

  return {
    complexity,
    userLevel,
    visibleElements,
    compactMode,
    animationsEnabled,
    notificationsEnabled,
    elementsCount: visibleElements.length,
  }
}

/**
 * Get translation for current or specified language
 * @param {string} key - Translation key path (e.g., 'elements.BADGES')
 * @param {string} lang - Language code (default: 'fr')
 * @returns {string} Translated string or key if not found
 */
function t(key, lang = 'fr') {
  const keys = key.split('.')
  let value = translations[lang] || translations.fr

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      return key
    }
  }

  return value || key
}

/**
 * Render gamification panel HTML
 * @param {number} userLevel - User level
 * @param {Object} stats - User stats (points, badges, etc.)
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderGamificationPanel(userLevel, stats = {}, options = {}) {
  const lang = options.lang || 'fr'
  const visibleElements = getVisibleElements(userLevel)
  const complexity = getUIComplexityLevel(userLevel)
  const compact = options.compact !== undefined ? options.compact : compactMode

  const {
    points = 0,
    badges = [],
    streak = 0,
    rank = null,
  } = stats

  let html = `<div class="gamification-panel ${compact ? 'compact' : ''}" data-complexity="${complexity}" aria-label="${t('ui.level', lang)} ${userLevel}">`

  // Points display
  if (visibleElements.includes(UIElement.POINTS_DISPLAY)) {
    html += `<div class="points-display" aria-label="${t('ui.points', lang)}">
      <span class="icon">⭐</span>
      <span class="value">${points}</span>
      <span class="label">${t('ui.points', lang)}</span>
    </div>`
  }

  // Level bar
  if (visibleElements.includes(UIElement.LEVEL_BAR)) {
    const nextLevelPoints = (userLevel + 1) * 100 // Simplified calculation
    const currentLevelPoints = userLevel * 100
    const progress = Math.min(100, ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100)

    html += `<div class="level-bar" aria-label="${t('ui.progress', lang)}">
      <div class="level-info">
        <span>${t('ui.level', lang)} ${userLevel}</span>
        <span>${Math.round(progress)}%</span>
      </div>
      <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>`
  }

  // Badges
  if (visibleElements.includes(UIElement.BADGES) && badges.length > 0) {
    html += `<div class="badges-section">
      <h3>${t('elements.BADGES', lang)}</h3>
      ${renderSimplifiedBadges(badges, compact ? 3 : 6, { lang })}
    </div>`
  }

  // Streaks
  if (visibleElements.includes(UIElement.STREAKS) && streak > 0) {
    html += `<div class="streak-display" aria-label="${t('elements.STREAKS', lang)}">
      <span class="icon">🔥</span>
      <span class="value">${streak}</span>
      <span class="label">${t('elements.STREAKS', lang)}</span>
    </div>`
  }

  // Leaderboard rank
  if (visibleElements.includes(UIElement.LEADERBOARD) && rank) {
    html += `<div class="rank-display" aria-label="${t('elements.LEADERBOARD', lang)}">
      <span class="icon">🏆</span>
      <span class="value">#${rank}</span>
      <span class="label">${t('elements.LEADERBOARD', lang)}</span>
    </div>`
  }

  html += `</div>`
  return html
}

/**
 * Render simplified badges list
 * @param {Array} badges - Array of badge objects
 * @param {number} maxVisible - Maximum badges to show
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderSimplifiedBadges(badges, maxVisible = 6, options = {}) {
  const lang = options.lang || 'fr'
  const visible = badges.slice(0, maxVisible)
  const remaining = Math.max(0, badges.length - maxVisible)

  let html = `<div class="badges-list">`

  for (const badge of visible) {
    html += `<div class="badge-item" title="${badge.name || ''}" aria-label="${badge.name || ''}">
      <span class="badge-icon">${badge.icon || '🏅'}</span>
    </div>`
  }

  if (remaining > 0) {
    html += `<div class="badge-item more" aria-label="+${remaining}">
      <span class="badge-icon">+${remaining}</span>
    </div>`
  }

  html += `</div>`
  return html
}

/**
 * Render progress bar
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderProgressBar(current, max, options = {}) {
  const {
    label = '',
    showPercentage = true,
    color = '#4CAF50',
    height = '8px',
  } = options

  // Handle division by zero
  const percentage = max === 0 ? 0 : Math.min(100, Math.max(0, (current / max) * 100))

  let html = `<div class="progress-bar-container" style="height: ${height}">`

  if (label || showPercentage) {
    html += `<div class="progress-label">`
    if (label) {
      html += `<span>${label}</span>`
    }
    if (showPercentage) {
      html += `<span>${Math.round(percentage)}%</span>`
    }
    html += `</div>`
  }

  html += `<div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(percentage)}" aria-valuemin="0" aria-valuemax="100">
    <div class="progress-fill" style="width: ${percentage}%; background-color: ${color}"></div>
  </div>`

  html += `</div>`
  return html
}

/**
 * Render level up notification
 * @param {number} newLevel - New level reached
 * @param {Array} unlockedElements - Array of newly unlocked UIElement values
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderLevelUpNotification(newLevel, unlockedElements = [], options = {}) {
  const lang = options.lang || 'fr'

  let html = `<div class="level-up-notification" role="alert" aria-live="assertive">
    <div class="level-up-header">
      <span class="icon">🎉</span>
      <h2>${t('ui.levelUp', lang)}</h2>
    </div>
    <div class="level-up-body">
      <p>${t('ui.level', lang)} ${newLevel}</p>`

  if (unlockedElements.length > 0) {
    html += `<div class="unlocked-elements">
      <p>${t('ui.unlockedElements', lang)}:</p>
      <ul>`

    for (const element of unlockedElements) {
      html += `<li>
        <span class="icon">🔓</span>
        <span>${t(`elements.${element}`, lang)}</span>
      </li>`
    }

    html += `</ul></div>`
  }

  html += `</div></div>`
  return html
}

/**
 * Render settings panel
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderSettingsPanel(options = {}) {
  const lang = options.lang || 'fr'

  let html = `<div class="gamification-settings-panel">
    <h3>${t('ui.settings', lang)}</h3>
    <div class="settings-list">
      <label class="setting-item">
        <input type="checkbox" ${compactMode ? 'checked' : ''} onchange="window.toggleGamificationCompactMode(this.checked)">
        <span>${t('ui.compactMode', lang)}</span>
      </label>
      <label class="setting-item">
        <input type="checkbox" ${animationsEnabled ? 'checked' : ''} onchange="window.toggleGamificationAnimations(this.checked)">
        <span>${t('ui.animations', lang)}</span>
      </label>
      <label class="setting-item">
        <input type="checkbox" ${notificationsEnabled ? 'checked' : ''} onchange="window.toggleGamificationNotifications(this.checked)">
        <span>${t('ui.notifications', lang)}</span>
      </label>
    </div>
    <button class="btn-customize" onclick="window.openGamificationCustomize()">${t('ui.customize', lang)}</button>
  </div>`

  return html
}

/**
 * Render element preview (locked state)
 * @param {string} element - UIElement value
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderElementPreview(element, options = {}) {
  const lang = options.lang || 'fr'
  const unlockLevel = getElementUnlockLevel(element)

  if (unlockLevel === null) return ''

  let html = `<div class="element-preview locked" data-element="${element}">
    <div class="preview-icon">🔒</div>
    <div class="preview-info">
      <h4>${t(`elements.${element}`, lang)}</h4>
      <p>${t(`descriptions.${element}`, lang)}</p>
      <p class="unlock-info">${t('ui.unlockedAt', lang)} ${unlockLevel}</p>
    </div>
  </div>`

  return html
}

/**
 * Get gamification UI stats
 * @returns {Object} Statistics object
 */
export function getGamificationUIStats() {
  return {
    initialized,
    currentUserLevel,
    complexity: getUIComplexityLevel(currentUserLevel),
    visibleElementsCount: getVisibleElements(currentUserLevel).length,
    totalElements: Object.keys(UIElement).length,
    customOverridesCount: Object.keys(customVisibility).length,
    compactMode,
    animationsEnabled,
    notificationsEnabled,
  }
}

// Window global handlers for UI interactions
if (typeof window !== 'undefined') {
  window.toggleGamificationCompactMode = (enabled) => {
    setCompactMode(enabled)
  }

  window.toggleGamificationAnimations = (enabled) => {
    setAnimationsEnabled(enabled)
  }

  window.toggleGamificationNotifications = (enabled) => {
    setNotificationsEnabled(enabled)
  }

  window.openGamificationCustomize = () => {
    // Placeholder for custom visibility editor
    console.log('[GamificationUI] Open customize panel')
  }
}

export default {
  UIComplexityLevel,
  UIElement,
  initGamificationUI,
  resetGamificationUI,
  getUIComplexityLevel,
  getVisibleElements,
  isElementVisible,
  setCustomVisibility,
  getCustomVisibility,
  resetCustomVisibility,
  getElementUnlockLevel,
  getCompactMode,
  setCompactMode,
  getAnimationsEnabled,
  setAnimationsEnabled,
  getNotificationsEnabled,
  setNotificationsEnabled,
  getLayoutConfig,
  renderGamificationPanel,
  renderSimplifiedBadges,
  renderProgressBar,
  renderLevelUpNotification,
  renderSettingsPanel,
  renderElementPreview,
  getGamificationUIStats,
}
