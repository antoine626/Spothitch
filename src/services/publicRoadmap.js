/**
 * Public Roadmap Service
 * Displays upcoming features and allows users to vote for priorities
 * Statuses: planned, in-progress, completed, considering
 */

import { getState, setState } from '../stores/state.js'
import { trackEvent } from './analytics.js'

// Roadmap item statuses
export const RoadmapStatus = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CONSIDERING: 'considering',
}

// Status display configuration
const statusConfig = {
  [RoadmapStatus.PLANNED]: {
    label: { fr: 'Planifié', en: 'Planned', es: 'Planificado', de: 'Geplant' },
    color: 'blue',
    icon: 'fa-calendar-check',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
  },
  [RoadmapStatus.IN_PROGRESS]: {
    label: { fr: 'En cours', en: 'In Progress', es: 'En progreso', de: 'In Arbeit' },
    color: 'yellow',
    icon: 'fa-spinner',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
  },
  [RoadmapStatus.COMPLETED]: {
    label: { fr: 'Terminé', en: 'Completed', es: 'Completado', de: 'Fertig' },
    color: 'green',
    icon: 'fa-check-circle',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
  },
  [RoadmapStatus.CONSIDERING]: {
    label: { fr: 'En réflexion', en: 'Considering', es: 'En consideración', de: 'In Überlegung' },
    color: 'purple',
    icon: 'fa-lightbulb',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
  },
}

// Default roadmap items (in production, this would come from Firebase)
const defaultRoadmapItems = [
  {
    id: 'feature-offline-maps',
    title: { fr: 'Cartes hors ligne', en: 'Offline Maps', es: 'Mapas sin conexión', de: 'Offline-Karten' },
    description: {
      fr: 'Téléchargez les cartes pour les utiliser sans connexion internet',
      en: 'Download maps to use without internet connection',
      es: 'Descarga mapas para usar sin conexión a internet',
      de: 'Karten herunterladen zur Offline-Nutzung',
    },
    status: RoadmapStatus.IN_PROGRESS,
    category: 'feature',
    votes: 234,
    targetQuarter: 'Q1 2026',
    progress: 65,
  },
  {
    id: 'feature-ride-share',
    title: { fr: 'Partage de trajet', en: 'Ride Sharing', es: 'Compartir viaje', de: 'Mitfahrgelegenheit' },
    description: {
      fr: 'Connectez-vous avec des conducteurs qui vont dans la même direction',
      en: 'Connect with drivers heading in the same direction',
      es: 'Conecta con conductores que van en la misma dirección',
      de: 'Verbinde dich mit Fahrern in dieselbe Richtung',
    },
    status: RoadmapStatus.PLANNED,
    category: 'feature',
    votes: 456,
    targetQuarter: 'Q2 2026',
    progress: 0,
  },
  {
    id: 'feature-weather-alerts',
    title: { fr: 'Alertes météo', en: 'Weather Alerts', es: 'Alertas meteorológicas', de: 'Wetterwarnungen' },
    description: {
      fr: 'Recevez des alertes météo pour les spots de votre itinéraire',
      en: 'Get weather alerts for spots on your route',
      es: 'Recibe alertas meteorológicas para los spots de tu ruta',
      de: 'Erhalte Wetterwarnungen für Spots auf deiner Route',
    },
    status: RoadmapStatus.CONSIDERING,
    category: 'feature',
    votes: 189,
    targetQuarter: null,
    progress: 0,
  },
  {
    id: 'feature-multi-language',
    title: { fr: 'Plus de langues', en: 'More Languages', es: 'Más idiomas', de: 'Mehr Sprachen' },
    description: {
      fr: 'Support pour italien, portugais, polonais et néerlandais',
      en: 'Support for Italian, Portuguese, Polish and Dutch',
      es: 'Soporte para italiano, portugués, polaco y holandés',
      de: 'Unterstützung für Italienisch, Portugiesisch, Polnisch und Niederländisch',
    },
    status: RoadmapStatus.PLANNED,
    category: 'i18n',
    votes: 312,
    targetQuarter: 'Q1 2026',
    progress: 25,
  },
  {
    id: 'feature-dark-mode-v2',
    title: { fr: 'Mode sombre v2', en: 'Dark Mode v2', es: 'Modo oscuro v2', de: 'Dunkelmodus v2' },
    description: {
      fr: 'Améliorations du mode sombre avec plus de personnalisation',
      en: 'Dark mode improvements with more customization',
      es: 'Mejoras del modo oscuro con más personalización',
      de: 'Verbesserungen des Dunkelmodus mit mehr Anpassung',
    },
    status: RoadmapStatus.COMPLETED,
    category: 'ui',
    votes: 567,
    targetQuarter: 'Q4 2025',
    progress: 100,
    completedAt: '2025-12-15',
  },
  {
    id: 'feature-spot-photos',
    title: { fr: 'Galerie photos', en: 'Photo Gallery', es: 'Galería de fotos', de: 'Fotogalerie' },
    description: {
      fr: 'Parcourez les photos des spots ajoutées par la communauté',
      en: 'Browse spot photos added by the community',
      es: 'Explora las fotos de los spots añadidas por la comunidad',
      de: 'Durchsuche Community-Fotos von Spots',
    },
    status: RoadmapStatus.COMPLETED,
    category: 'feature',
    votes: 789,
    targetQuarter: 'Q4 2025',
    progress: 100,
    completedAt: '2025-12-20',
  },
  {
    id: 'feature-gamification-v2',
    title: { fr: 'Gamification avancée', en: 'Advanced Gamification', es: 'Gamificación avanzada', de: 'Erweiterte Gamification' },
    description: {
      fr: 'Nouveaux badges, défis hebdomadaires et ligues compétitives',
      en: 'New badges, weekly challenges and competitive leagues',
      es: 'Nuevas insignias, desafíos semanales y ligas competitivas',
      de: 'Neue Abzeichen, wöchentliche Herausforderungen und Wettkampfligen',
    },
    status: RoadmapStatus.IN_PROGRESS,
    category: 'gamification',
    votes: 623,
    targetQuarter: 'Q1 2026',
    progress: 80,
  },
  {
    id: 'feature-apple-watch',
    title: { fr: 'App Apple Watch', en: 'Apple Watch App', es: 'App Apple Watch', de: 'Apple Watch App' },
    description: {
      fr: 'Check-in rapide et alertes depuis votre montre',
      en: 'Quick check-in and alerts from your watch',
      es: 'Check-in rápido y alertas desde tu reloj',
      de: 'Schnelles Check-in und Benachrichtigungen von deiner Uhr',
    },
    status: RoadmapStatus.CONSIDERING,
    category: 'platform',
    votes: 156,
    targetQuarter: null,
    progress: 0,
  },
  {
    id: 'feature-android-widget',
    title: { fr: 'Widget Android', en: 'Android Widget', es: 'Widget Android', de: 'Android Widget' },
    description: {
      fr: 'Widget pour accéder rapidement aux spots à proximité',
      en: 'Widget for quick access to nearby spots',
      es: 'Widget para acceso rápido a spots cercanos',
      de: 'Widget für schnellen Zugriff auf nahegelegene Spots',
    },
    status: RoadmapStatus.PLANNED,
    category: 'platform',
    votes: 245,
    targetQuarter: 'Q2 2026',
    progress: 0,
  },
  {
    id: 'feature-trip-history',
    title: { fr: 'Historique de voyages', en: 'Trip History', es: 'Historial de viajes', de: 'Reiseverlauf' },
    description: {
      fr: 'Consultez et partagez vos anciens voyages en auto-stop',
      en: 'View and share your past hitchhiking trips',
      es: 'Consulta y comparte tus viajes pasados en autoestop',
      de: 'Sehe und teile deine vergangenen Tramperfahrten',
    },
    status: RoadmapStatus.COMPLETED,
    category: 'feature',
    votes: 445,
    targetQuarter: 'Q4 2025',
    progress: 100,
    completedAt: '2025-11-28',
  },
]

// In-memory storage for roadmap items and user votes
let roadmapItems = [...defaultRoadmapItems]
let userVotes = new Set() // Track which features user has voted for

// Storage key for persistence
const STORAGE_KEY = 'spothitch_roadmap_votes'
const ROADMAP_ITEMS_KEY = 'spothitch_roadmap_items'

/**
 * Initialize roadmap from localStorage
 */
function initializeFromStorage() {
  try {
    const storedVotes = localStorage.getItem(STORAGE_KEY)
    if (storedVotes) {
      userVotes = new Set(JSON.parse(storedVotes))
    }
    const storedItems = localStorage.getItem(ROADMAP_ITEMS_KEY)
    if (storedItems) {
      roadmapItems = JSON.parse(storedItems)
    }
  } catch (error) {
    console.warn('[Roadmap] Failed to load from storage:', error)
  }
}

/**
 * Save user votes to localStorage
 */
function saveVotesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...userVotes]))
  } catch (error) {
    console.warn('[Roadmap] Failed to save votes:', error)
  }
}

/**
 * Save roadmap items to localStorage
 */
function saveItemsToStorage() {
  try {
    localStorage.setItem(ROADMAP_ITEMS_KEY, JSON.stringify(roadmapItems))
  } catch (error) {
    console.warn('[Roadmap] Failed to save items:', error)
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  initializeFromStorage()
}

/**
 * Get all roadmap items
 * @returns {Array} List of roadmap items sorted by votes
 */
export function getRoadmapItems() {
  return [...roadmapItems].sort((a, b) => b.votes - a.votes)
}

/**
 * Get roadmap items filtered by status
 * @param {string} status - Status filter (planned, in-progress, completed, considering)
 * @returns {Array} Filtered list of roadmap items
 */
export function getRoadmapByStatus(status) {
  if (!status || !Object.values(RoadmapStatus).includes(status)) {
    return []
  }
  return roadmapItems
    .filter((item) => item.status === status)
    .sort((a, b) => b.votes - a.votes)
}

/**
 * Get roadmap items filtered by category
 * @param {string} category - Category filter (feature, i18n, ui, gamification, platform)
 * @returns {Array} Filtered list of roadmap items
 */
export function getRoadmapByCategory(category) {
  if (!category) return []
  return roadmapItems
    .filter((item) => item.category === category)
    .sort((a, b) => b.votes - a.votes)
}

/**
 * Get a single roadmap item by ID
 * @param {string} featureId - Feature ID
 * @returns {Object|null} Roadmap item or null
 */
export function getRoadmapItem(featureId) {
  if (!featureId) return null
  return roadmapItems.find((item) => item.id === featureId) || null
}

/**
 * Vote for a feature
 * @param {string} featureId - Feature ID to vote for
 * @returns {Object} Result with success status and new vote count
 */
export function voteForFeature(featureId) {
  if (!featureId) {
    return { success: false, error: 'no_feature_id', message: 'Feature ID is required' }
  }

  const item = roadmapItems.find((i) => i.id === featureId)
  if (!item) {
    return { success: false, error: 'not_found', message: 'Feature not found' }
  }

  // Check if user already voted
  if (userVotes.has(featureId)) {
    return { success: false, error: 'already_voted', message: 'You have already voted for this feature', votes: item.votes }
  }

  // Cannot vote for completed features
  if (item.status === RoadmapStatus.COMPLETED) {
    return { success: false, error: 'completed', message: 'Cannot vote for completed features', votes: item.votes }
  }

  // Add vote
  item.votes += 1
  userVotes.add(featureId)

  // Persist changes
  saveVotesToStorage()
  saveItemsToStorage()

  // Track analytics
  trackEvent('roadmap_vote', {
    feature_id: featureId,
    feature_title: item.title.en,
    feature_status: item.status,
    new_vote_count: item.votes,
  })

  return { success: true, votes: item.votes, message: 'Vote recorded' }
}

/**
 * Remove vote for a feature
 * @param {string} featureId - Feature ID to unvote
 * @returns {Object} Result with success status and new vote count
 */
export function unvoteFeature(featureId) {
  if (!featureId) {
    return { success: false, error: 'no_feature_id', message: 'Feature ID is required' }
  }

  const item = roadmapItems.find((i) => i.id === featureId)
  if (!item) {
    return { success: false, error: 'not_found', message: 'Feature not found' }
  }

  // Check if user has voted
  if (!userVotes.has(featureId)) {
    return { success: false, error: 'not_voted', message: 'You have not voted for this feature', votes: item.votes }
  }

  // Remove vote
  item.votes = Math.max(0, item.votes - 1)
  userVotes.delete(featureId)

  // Persist changes
  saveVotesToStorage()
  saveItemsToStorage()

  return { success: true, votes: item.votes, message: 'Vote removed' }
}

/**
 * Check if user has voted for a feature
 * @param {string} featureId - Feature ID
 * @returns {boolean} True if user has voted
 */
export function hasVotedFor(featureId) {
  return userVotes.has(featureId)
}

/**
 * Get all features user has voted for
 * @returns {Array} List of feature IDs
 */
export function getUserVotes() {
  return [...userVotes]
}

/**
 * Get status configuration
 * @param {string} status - Status key
 * @returns {Object} Status configuration
 */
export function getStatusConfig(status) {
  return statusConfig[status] || null
}

/**
 * Get all available statuses
 * @returns {Array} List of status objects with key and label
 */
export function getAllStatuses() {
  const { lang } = getState()
  return Object.entries(statusConfig).map(([key, config]) => ({
    key,
    label: config.label[lang] || config.label.en,
    color: config.color,
    icon: config.icon,
  }))
}

/**
 * Get all unique categories from roadmap items
 * @returns {Array} List of category strings
 */
export function getCategories() {
  const categories = new Set(roadmapItems.map((item) => item.category))
  return [...categories]
}

/**
 * Get roadmap statistics
 * @returns {Object} Statistics about roadmap items
 */
export function getRoadmapStats() {
  const stats = {
    total: roadmapItems.length,
    byStatus: {},
    byCategory: {},
    totalVotes: 0,
    averageVotes: 0,
    mostVoted: null,
    recentlyCompleted: [],
  }

  roadmapItems.forEach((item) => {
    // Count by status
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1
    // Count by category
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1
    // Sum votes
    stats.totalVotes += item.votes
    // Track most voted
    if (!stats.mostVoted || item.votes > stats.mostVoted.votes) {
      stats.mostVoted = item
    }
    // Track recently completed
    if (item.status === RoadmapStatus.COMPLETED && item.completedAt) {
      stats.recentlyCompleted.push(item)
    }
  })

  stats.averageVotes = stats.total > 0 ? Math.round(stats.totalVotes / stats.total) : 0
  stats.recentlyCompleted.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  stats.recentlyCompleted = stats.recentlyCompleted.slice(0, 3)

  return stats
}

/**
 * Render a feature card HTML
 * @param {Object} feature - Feature object
 * @returns {string} HTML string
 */
export function renderFeatureCard(feature) {
  if (!feature) return ''

  const { lang } = getState()
  const config = statusConfig[feature.status] || statusConfig[RoadmapStatus.CONSIDERING]
  const title = feature.title[lang] || feature.title.en
  const description = feature.description[lang] || feature.description.en
  const statusLabel = config.label[lang] || config.label.en
  const hasVoted = userVotes.has(feature.id)
  const isCompleted = feature.status === RoadmapStatus.COMPLETED

  const voteButtonClass = hasVoted
    ? 'bg-primary-500 text-white'
    : 'bg-dark-secondary text-gray-300 hover:bg-primary-500/20'
  const voteButtonDisabled = isCompleted ? 'disabled opacity-50 cursor-not-allowed' : ''

  const progressBar = feature.progress > 0 && feature.progress < 100
    ? `<div class="w-full bg-dark-tertiary rounded-full h-1.5 mt-2">
        <div class="h-1.5 rounded-full ${config.bgClass}" style="width: ${feature.progress}%"></div>
       </div>`
    : ''

  const targetQuarter = feature.targetQuarter
    ? `<span class="text-xs text-gray-500 ml-2">${feature.targetQuarter}</span>`
    : ''

  const completedDate = feature.completedAt
    ? `<span class="text-xs text-gray-500 ml-2">✓ ${feature.completedAt}</span>`
    : ''

  return `
    <div class="feature-card rounded-lg p-4 border ${config.borderClass} bg-dark-secondary/50 hover:bg-dark-secondary transition-colors"
         data-feature-id="${feature.id}"
         data-status="${feature.status}"
         role="article"
         aria-label="${title}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgClass} ${config.textClass}">
              <i class="fas ${config.icon} mr-1" aria-hidden="true"></i>
              ${statusLabel}
            </span>
            <span class="text-xs text-gray-500 bg-dark-tertiary px-2 py-0.5 rounded">${feature.category}</span>
            ${targetQuarter}
            ${completedDate}
          </div>
          <h3 class="text-base font-semibold text-white mt-2">${title}</h3>
          <p class="text-sm text-gray-400 mt-1 line-clamp-2">${description}</p>
          ${progressBar}
        </div>
        <div class="flex flex-col items-center gap-1">
          <button class="vote-button flex flex-col items-center justify-center w-14 h-14 rounded-lg ${voteButtonClass} ${voteButtonDisabled} transition-colors"
                  data-feature-id="${feature.id}"
                  ${isCompleted ? 'disabled' : ''}
                  onclick="window.toggleRoadmapVote?.('${feature.id}')"
                  aria-label="${hasVoted ? 'Retirer le vote' : 'Voter'} pour ${title}"
                  aria-pressed="${hasVoted}">
            <i class="fas ${hasVoted ? 'fa-check' : 'fa-arrow-up'} text-lg" aria-hidden="true"></i>
            <span class="text-xs font-bold mt-0.5">${feature.votes}</span>
          </button>
        </div>
      </div>
    </div>
  `
}

/**
 * Render the complete roadmap view
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderRoadmap(options = {}) {
  const { lang } = getState()
  const { filter = null, showStats = true, showFilters = true } = options

  const items = filter ? getRoadmapByStatus(filter) : getRoadmapItems()
  const stats = getRoadmapStats()
  const statuses = getAllStatuses()

  const labels = {
    title: { fr: 'Roadmap publique', en: 'Public Roadmap', es: 'Hoja de ruta pública', de: 'Öffentliche Roadmap' },
    subtitle: { fr: 'Votez pour les fonctionnalités que vous souhaitez voir', en: 'Vote for features you want to see', es: 'Vota por las funciones que quieres ver', de: 'Stimme für Features die du sehen möchtest' },
    all: { fr: 'Tout', en: 'All', es: 'Todo', de: 'Alle' },
    noItems: { fr: 'Aucune fonctionnalité trouvée', en: 'No features found', es: 'No se encontraron funciones', de: 'Keine Features gefunden' },
    totalVotes: { fr: 'votes totaux', en: 'total votes', es: 'votos totales', de: 'Gesamtstimmen' },
    features: { fr: 'fonctionnalités', en: 'features', es: 'funciones', de: 'Features' },
  }

  const statsHtml = showStats
    ? `
    <div class="roadmap-stats grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="stat-card bg-dark-secondary/50 rounded-lg p-3 text-center">
        <span class="text-2xl font-bold text-primary-400">${stats.total}</span>
        <span class="block text-xs text-gray-400">${labels.features[lang] || labels.features.en}</span>
      </div>
      <div class="stat-card bg-dark-secondary/50 rounded-lg p-3 text-center">
        <span class="text-2xl font-bold text-green-400">${stats.byStatus[RoadmapStatus.COMPLETED] || 0}</span>
        <span class="block text-xs text-gray-400">${statusConfig[RoadmapStatus.COMPLETED].label[lang] || statusConfig[RoadmapStatus.COMPLETED].label.en}</span>
      </div>
      <div class="stat-card bg-dark-secondary/50 rounded-lg p-3 text-center">
        <span class="text-2xl font-bold text-yellow-400">${stats.byStatus[RoadmapStatus.IN_PROGRESS] || 0}</span>
        <span class="block text-xs text-gray-400">${statusConfig[RoadmapStatus.IN_PROGRESS].label[lang] || statusConfig[RoadmapStatus.IN_PROGRESS].label.en}</span>
      </div>
      <div class="stat-card bg-dark-secondary/50 rounded-lg p-3 text-center">
        <span class="text-2xl font-bold text-blue-400">${stats.totalVotes}</span>
        <span class="block text-xs text-gray-400">${labels.totalVotes[lang] || labels.totalVotes.en}</span>
      </div>
    </div>
  `
    : ''

  const filtersHtml = showFilters
    ? `
    <div class="roadmap-filters flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Filtres de statut">
      <button class="filter-btn px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!filter ? 'bg-primary-500 text-white' : 'bg-dark-secondary text-gray-300 hover:bg-dark-tertiary'}"
              onclick="window.filterRoadmap?.(null)"
              role="tab"
              aria-selected="${!filter}"
              aria-controls="roadmap-items">
        ${labels.all[lang] || labels.all.en}
      </button>
      ${statuses
        .map(
          (s) => `
        <button class="filter-btn px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s.key ? 'bg-primary-500 text-white' : 'bg-dark-secondary text-gray-300 hover:bg-dark-tertiary'}"
                onclick="window.filterRoadmap?.('${s.key}')"
                role="tab"
                aria-selected="${filter === s.key}"
                aria-controls="roadmap-items">
          <i class="fas ${s.icon} mr-1" aria-hidden="true"></i>
          ${s.label}
        </button>
      `
        )
        .join('')}
    </div>
  `
    : ''

  const itemsHtml =
    items.length > 0
      ? items.map((item) => renderFeatureCard(item)).join('')
      : `<div class="text-center text-gray-400 py-8">${labels.noItems[lang] || labels.noItems.en}</div>`

  return `
    <div class="roadmap-container" role="region" aria-label="${labels.title[lang] || labels.title.en}">
      <header class="roadmap-header mb-6">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <i class="fas fa-road text-primary-400" aria-hidden="true"></i>
          ${labels.title[lang] || labels.title.en}
        </h2>
        <p class="text-sm text-gray-400 mt-1">${labels.subtitle[lang] || labels.subtitle.en}</p>
      </header>
      ${statsHtml}
      ${filtersHtml}
      <div id="roadmap-items" class="roadmap-items space-y-3" role="tabpanel">
        ${itemsHtml}
      </div>
    </div>
  `
}

/**
 * Add a new roadmap item (admin function)
 * @param {Object} item - New roadmap item
 * @returns {Object} Result
 */
export function addRoadmapItem(item) {
  if (!item || !item.id || !item.title || !item.description) {
    return { success: false, error: 'invalid_item', message: 'Invalid item data' }
  }

  // Check for duplicate ID
  if (roadmapItems.some((i) => i.id === item.id)) {
    return { success: false, error: 'duplicate_id', message: 'Item with this ID already exists' }
  }

  const newItem = {
    votes: 0,
    status: RoadmapStatus.CONSIDERING,
    category: 'feature',
    progress: 0,
    ...item,
  }

  roadmapItems.push(newItem)
  saveItemsToStorage()

  return { success: true, item: newItem }
}

/**
 * Update roadmap item status (admin function)
 * @param {string} featureId - Feature ID
 * @param {string} newStatus - New status
 * @returns {Object} Result
 */
export function updateRoadmapStatus(featureId, newStatus) {
  if (!featureId) {
    return { success: false, error: 'no_feature_id', message: 'Feature ID is required' }
  }

  if (!Object.values(RoadmapStatus).includes(newStatus)) {
    return { success: false, error: 'invalid_status', message: 'Invalid status' }
  }

  const item = roadmapItems.find((i) => i.id === featureId)
  if (!item) {
    return { success: false, error: 'not_found', message: 'Feature not found' }
  }

  item.status = newStatus
  if (newStatus === RoadmapStatus.COMPLETED) {
    item.progress = 100
    item.completedAt = new Date().toISOString().split('T')[0]
  }

  saveItemsToStorage()

  return { success: true, item }
}

/**
 * Update roadmap item progress (admin function)
 * @param {string} featureId - Feature ID
 * @param {number} progress - Progress percentage (0-100)
 * @returns {Object} Result
 */
export function updateRoadmapProgress(featureId, progress) {
  if (!featureId) {
    return { success: false, error: 'no_feature_id', message: 'Feature ID is required' }
  }

  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    return { success: false, error: 'invalid_progress', message: 'Progress must be a number between 0 and 100' }
  }

  const item = roadmapItems.find((i) => i.id === featureId)
  if (!item) {
    return { success: false, error: 'not_found', message: 'Feature not found' }
  }

  item.progress = progress
  if (progress === 100 && item.status !== RoadmapStatus.COMPLETED) {
    item.status = RoadmapStatus.COMPLETED
    item.completedAt = new Date().toISOString().split('T')[0]
  }

  saveItemsToStorage()

  return { success: true, item }
}

/**
 * Reset roadmap to default items (for testing)
 */
export function resetRoadmap() {
  // Deep copy default items to avoid mutation issues
  roadmapItems = JSON.parse(JSON.stringify(defaultRoadmapItems))
  userVotes = new Set()
  saveVotesToStorage()
  saveItemsToStorage()
}

// Expose functions globally for onclick handlers
if (typeof window !== 'undefined') {
  window.toggleRoadmapVote = (featureId) => {
    if (hasVotedFor(featureId)) {
      unvoteFeature(featureId)
    } else {
      voteForFeature(featureId)
    }
    // Trigger re-render if needed
    const event = new CustomEvent('roadmap-updated', { detail: { featureId } })
    window.dispatchEvent(event)
  }

  window.filterRoadmap = (status) => {
    const event = new CustomEvent('roadmap-filter', { detail: { status } })
    window.dispatchEvent(event)
  }
}

export default {
  RoadmapStatus,
  getRoadmapItems,
  getRoadmapByStatus,
  getRoadmapByCategory,
  getRoadmapItem,
  voteForFeature,
  unvoteFeature,
  hasVotedFor,
  getUserVotes,
  getStatusConfig,
  getAllStatuses,
  getCategories,
  getRoadmapStats,
  renderFeatureCard,
  renderRoadmap,
  addRoadmapItem,
  updateRoadmapStatus,
  updateRoadmapProgress,
  resetRoadmap,
}
