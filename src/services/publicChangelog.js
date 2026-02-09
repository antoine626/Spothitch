/**
 * Public Changelog Service
 * Manages version changelog with read status tracking
 */

import { getState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Storage key for read versions
const CHANGELOG_READ_KEY = 'spothitch_changelog_read';

// Change types with their configuration
export const CHANGE_TYPES = {
  feature: {
    id: 'feature',
    label: 'Nouvelle fonctionnalite',
    labelEn: 'New Feature',
    icon: '✨',
    color: 'primary',
    bgClass: 'bg-primary-500/20',
    textClass: 'text-primary-400',
  },
  fix: {
    id: 'fix',
    label: 'Correction',
    labelEn: 'Bug Fix',
    icon: '🐛',
    color: 'red',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
  },
  improvement: {
    id: 'improvement',
    label: 'Amelioration',
    labelEn: 'Improvement',
    icon: '⚡',
    color: 'amber',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
  },
  security: {
    id: 'security',
    label: 'Securite',
    labelEn: 'Security',
    icon: '🔒',
    color: 'green',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
  },
  performance: {
    id: 'performance',
    label: 'Performance',
    labelEn: 'Performance',
    icon: '🚀',
    color: 'purple',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
  },
  breaking: {
    id: 'breaking',
    label: 'Changement majeur',
    labelEn: 'Breaking Change',
    icon: '⚠️',
    color: 'orange',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
  },
};

// Changelog entries - newest first
export const CHANGELOG_ENTRIES = [
  {
    version: '2.5.0',
    date: '2026-02-06',
    title: 'Changelog public et ameliorations',
    titleEn: 'Public changelog and improvements',
    changes: [
      {
        type: 'feature',
        description: 'Ajout du changelog public pour suivre les mises a jour',
        descriptionEn: 'Added public changelog to track updates',
      },
      {
        type: 'feature',
        description: 'Badge "Nouveau" sur les entrees non lues',
        descriptionEn: '"New" badge on unread entries',
      },
      {
        type: 'improvement',
        description: 'Meilleure accessibilite du changelog',
        descriptionEn: 'Better changelog accessibility',
      },
    ],
    breakingChanges: null,
  },
  {
    version: '2.4.0',
    date: '2026-02-05',
    title: 'Groupes de voyage et recherche de compagnons',
    titleEn: 'Travel groups and companion search',
    changes: [
      {
        type: 'feature',
        description: 'Creation de groupes de voyage avec itineraires',
        descriptionEn: 'Create travel groups with itineraries',
      },
      {
        type: 'feature',
        description: 'Recherche de compagnons de voyage compatibles',
        descriptionEn: 'Search for compatible travel companions',
      },
      {
        type: 'improvement',
        description: 'Score de compatibilite avance',
        descriptionEn: 'Advanced compatibility score',
      },
    ],
    breakingChanges: null,
  },
  {
    version: '2.3.0',
    date: '2026-02-04',
    title: 'Analytics et verification identite',
    titleEn: 'Analytics and identity verification',
    changes: [
      {
        type: 'feature',
        description: 'Tracking utilisateur avec trackUserAction',
        descriptionEn: 'User tracking with trackUserAction',
      },
      {
        type: 'feature',
        description: 'Verification d\'identite en 4 niveaux',
        descriptionEn: '4-level identity verification',
      },
      {
        type: 'security',
        description: 'Documents d\'identite traites de maniere securisee',
        descriptionEn: 'Identity documents processed securely',
      },
      {
        type: 'improvement',
        description: 'Badges de verification visibles',
        descriptionEn: 'Visible verification badges',
      },
    ],
    breakingChanges: null,
  },
  {
    version: '2.2.0',
    date: '2026-02-03',
    title: 'Defis entre amis et galerie photo',
    titleEn: 'Friend challenges and photo gallery',
    changes: [
      {
        type: 'feature',
        description: '7 types de defis entre amis',
        descriptionEn: '7 types of friend challenges',
      },
      {
        type: 'feature',
        description: 'Galerie photo avec visionneuse plein ecran',
        descriptionEn: 'Photo gallery with fullscreen viewer',
      },
      {
        type: 'improvement',
        description: 'Navigation clavier dans la galerie',
        descriptionEn: 'Keyboard navigation in gallery',
      },
    ],
    breakingChanges: null,
  },
  {
    version: '2.1.0',
    date: '2026-01-28',
    title: 'Contenu sponsorise et FAQ',
    titleEn: 'Sponsored content and FAQ',
    changes: [
      {
        type: 'feature',
        description: 'Partenariats locaux non-intrusifs',
        descriptionEn: 'Non-intrusive local partnerships',
      },
      {
        type: 'feature',
        description: 'FAQ complete avec 25 questions',
        descriptionEn: 'Complete FAQ with 25 questions',
      },
      {
        type: 'improvement',
        description: 'Recherche instantanee dans la FAQ',
        descriptionEn: 'Instant search in FAQ',
      },
    ],
    breakingChanges: null,
  },
  {
    version: '2.0.0',
    date: '2026-01-15',
    title: 'Migration ES Modules v2.0',
    titleEn: 'ES Modules Migration v2.0',
    changes: [
      {
        type: 'feature',
        description: 'Migration complete vers Vite et ES Modules',
        descriptionEn: 'Complete migration to Vite and ES Modules',
      },
      {
        type: 'feature',
        description: 'Tests avec Vitest et Playwright',
        descriptionEn: 'Testing with Vitest and Playwright',
      },
      {
        type: 'performance',
        description: 'Build 10x plus rapide avec Vite',
        descriptionEn: '10x faster build with Vite',
      },
      {
        type: 'improvement',
        description: 'Hot Module Replacement (HMR)',
        descriptionEn: 'Hot Module Replacement (HMR)',
      },
    ],
    breakingChanges: [
      'Nouvelle structure de fichiers modulaire',
      'Configuration Tailwind locale requise',
      'Node.js 18+ requis',
    ],
    breakingChangesEn: [
      'New modular file structure',
      'Local Tailwind configuration required',
      'Node.js 18+ required',
    ],
  },
  {
    version: '1.5.0',
    date: '2025-12-20',
    title: 'Mode hors-ligne et accessibilite',
    titleEn: 'Offline mode and accessibility',
    changes: [
      {
        type: 'feature',
        description: 'Mode hors-ligne complet avec sync',
        descriptionEn: 'Complete offline mode with sync',
      },
      {
        type: 'improvement',
        description: 'Conformite WCAG 2.1 AA',
        descriptionEn: 'WCAG 2.1 AA compliance',
      },
      {
        type: 'security',
        description: 'Reduction des vulnerabilites npm',
        descriptionEn: 'Reduced npm vulnerabilities',
      },
    ],
    breakingChanges: null,
  },
];

/**
 * Get all changelog entries
 * @returns {Array} All changelog entries sorted by date (newest first)
 */
export function getChangelog() {
  return [...CHANGELOG_ENTRIES];
}

/**
 * Get changelog entry by version
 * @param {string} version - Version string (e.g., '2.0.0')
 * @returns {Object|null} Changelog entry or null if not found
 */
export function getChangelogByVersion(version) {
  if (!version || typeof version !== 'string') {
    return null;
  }
  return CHANGELOG_ENTRIES.find(entry => entry.version === version) || null;
}

/**
 * Get the latest changelog entry
 * @returns {Object} Latest changelog entry
 */
export function getLatestVersion() {
  return CHANGELOG_ENTRIES[0] || null;
}

/**
 * Get read versions from localStorage
 * @returns {Array} Array of read version strings
 */
export function getReadVersions() {
  try {
    const saved = localStorage.getItem(CHANGELOG_READ_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save read versions to localStorage
 * @param {Array} versions - Array of version strings
 */
function saveReadVersions(versions) {
  try {
    localStorage.setItem(CHANGELOG_READ_KEY, JSON.stringify(versions));
  } catch (e) {
    console.warn('[Changelog] Failed to save read versions:', e);
  }
}

/**
 * Check if a version has been read
 * @param {string} version - Version string
 * @returns {boolean} Whether the version has been read
 */
export function isVersionRead(version) {
  if (!version) return false;
  const readVersions = getReadVersions();
  return readVersions.includes(version);
}

/**
 * Mark a version as read
 * @param {string} version - Version string to mark as read
 * @returns {boolean} Success status
 */
export function markAsRead(version) {
  if (!version || typeof version !== 'string') {
    console.warn('[Changelog] Invalid version to mark as read');
    return false;
  }

  const entry = getChangelogByVersion(version);
  if (!entry) {
    console.warn('[Changelog] Version not found:', version);
    return false;
  }

  const readVersions = getReadVersions();
  if (!readVersions.includes(version)) {
    readVersions.push(version);
    saveReadVersions(readVersions);
  }

  return true;
}

/**
 * Mark all versions as read
 * @returns {boolean} Success status
 */
export function markAllAsRead() {
  const allVersions = CHANGELOG_ENTRIES.map(entry => entry.version);
  saveReadVersions(allVersions);
  return true;
}

/**
 * Get count of unread versions
 * @returns {number} Number of unread versions
 */
export function getUnreadCount() {
  const readVersions = getReadVersions();
  return CHANGELOG_ENTRIES.filter(entry => !readVersions.includes(entry.version)).length;
}

/**
 * Check if there are any unread versions
 * @returns {boolean} Whether there are unread versions
 */
export function hasUnreadVersions() {
  return getUnreadCount() > 0;
}

/**
 * Get all unread entries
 * @returns {Array} Array of unread changelog entries
 */
export function getUnreadEntries() {
  const readVersions = getReadVersions();
  return CHANGELOG_ENTRIES.filter(entry => !readVersions.includes(entry.version));
}

/**
 * Clear all read status (reset)
 */
export function clearReadStatus() {
  try {
    localStorage.removeItem(CHANGELOG_READ_KEY);
  } catch (e) {
    console.warn('[Changelog] Failed to clear read status:', e);
  }
}

/**
 * Get changes by type across all versions
 * @param {string} type - Change type (feature, fix, improvement, etc.)
 * @returns {Array} Array of changes with version info
 */
export function getChangesByType(type) {
  if (!type || !CHANGE_TYPES[type]) {
    return [];
  }

  const changes = [];
  CHANGELOG_ENTRIES.forEach(entry => {
    entry.changes
      .filter(change => change.type === type)
      .forEach(change => {
        changes.push({
          ...change,
          version: entry.version,
          date: entry.date,
        });
      });
  });

  return changes;
}

/**
 * Get all available change types
 * @returns {Object} Change types configuration
 */
export function getChangeTypes() {
  return { ...CHANGE_TYPES };
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Formatted date
 */
export function formatChangelogDate(dateStr, lang = null) {
  const state = getState();
  const language = lang || state.lang || 'fr';

  try {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    const localeMap = {
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES',
      de: 'de-DE',
    };

    return date.toLocaleDateString(localeMap[language] || 'fr-FR', options);
  } catch {
    return dateStr;
  }
}

/**
 * Render a single changelog entry
 * @param {Object} entry - Changelog entry
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderChangelogEntry(entry, options = {}) {
  if (!entry || !entry.version) {
    return '';
  }

  const { showBadge = true, expanded = true, lang = null } = options;
  const state = getState();
  const language = lang || state.lang || 'fr';
  const isUnread = !isVersionRead(entry.version);
  const formattedDate = formatChangelogDate(entry.date, language);

  // Get localized title
  const title = language === 'en' && entry.titleEn ? entry.titleEn : entry.title;

  // Get localized breaking changes
  const breakingChanges = language === 'en' && entry.breakingChangesEn
    ? entry.breakingChangesEn
    : entry.breakingChanges;

  let html = `
    <article
      class="changelog-entry bg-dark-card rounded-xl p-4 mb-4 border border-dark-border hover:border-primary-500/30 transition-colors"
      data-version="${entry.version}"
      role="article"
      aria-label="Version ${entry.version}"
    >
      <header class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <span class="text-lg font-bold text-primary-400">v${entry.version}</span>
          ${showBadge && isUnread ? `
            <span class="badge-new px-2 py-0.5 bg-primary-500 text-white text-xs font-semibold rounded-full animate-pulse" aria-label="Non lu">
              Nouveau
            </span>
          ` : ''}
        </div>
        <time class="text-sm text-gray-400" datetime="${entry.date}">${formattedDate}</time>
      </header>

      <h3 class="text-white font-semibold mb-3">${escapeHTML(title)}</h3>
  `;

  if (expanded && entry.changes && entry.changes.length > 0) {
    html += `<ul class="space-y-2 mb-3" role="list">`;

    entry.changes.forEach(change => {
      const typeConfig = CHANGE_TYPES[change.type] || CHANGE_TYPES.improvement;
      const description = language === 'en' && change.descriptionEn
        ? change.descriptionEn
        : change.description;
      const typeLabel = language === 'en' ? typeConfig.labelEn : typeConfig.label;

      html += `
        <li class="flex items-start gap-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${typeConfig.bgClass} ${typeConfig.textClass}"
            aria-label="${typeLabel}"
          >
            <span aria-hidden="true">${typeConfig.icon}</span>
            ${typeLabel}
          </span>
          <span class="text-gray-300 text-sm">${escapeHTML(description)}</span>
        </li>
      `;
    });

    html += `</ul>`;
  }

  // Breaking changes section
  if (expanded && breakingChanges && breakingChanges.length > 0) {
    html += `
      <div class="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <h4 class="flex items-center gap-2 text-orange-400 font-semibold text-sm mb-2">
          <span aria-hidden="true">⚠️</span>
          ${language === 'en' ? 'Breaking Changes' : 'Changements majeurs'}
        </h4>
        <ul class="space-y-1 text-sm text-orange-300" role="list">
    `;

    breakingChanges.forEach(change => {
      html += `<li class="flex items-start gap-2">
        <span aria-hidden="true">•</span>
        <span>${escapeHTML(change)}</span>
      </li>`;
    });

    html += `</ul></div>`;
  }

  html += `</article>`;

  return html;
}

/**
 * Render the full changelog
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderChangelog(options = {}) {
  const {
    limit = 0,
    showHeader = true,
    showMarkAllRead = true,
    filterType = null,
    lang = null,
  } = options;

  const state = getState();
  const language = lang || state.lang || 'fr';
  let entries = getChangelog();

  // Filter by type if specified
  if (filterType && CHANGE_TYPES[filterType]) {
    entries = entries.filter(entry =>
      entry.changes.some(change => change.type === filterType)
    );
  }

  // Limit entries if specified
  if (limit > 0) {
    entries = entries.slice(0, limit);
  }

  const unreadCount = getUnreadCount();
  const headerTitle = language === 'en' ? 'Changelog' : 'Historique des versions';
  const markAllText = language === 'en' ? 'Mark all as read' : 'Tout marquer comme lu';

  let html = `
    <div class="changelog-container" role="region" aria-label="${headerTitle}">
  `;

  if (showHeader) {
    html += `
      <header class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-white">${headerTitle}</h2>
          ${unreadCount > 0 ? `
            <span class="px-2 py-0.5 bg-primary-500 text-white text-xs font-semibold rounded-full">
              ${unreadCount} ${language === 'en' ? 'new' : 'nouveau'}${unreadCount > 1 && language === 'fr' ? 'x' : ''}
            </span>
          ` : ''}
        </div>
        ${showMarkAllRead && unreadCount > 0 ? `
          <button
            onclick="window.markAllChangelogRead && window.markAllChangelogRead()"
            class="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            aria-label="${markAllText}"
          >
            ${markAllText}
          </button>
        ` : ''}
      </header>
    `;
  }

  if (entries.length === 0) {
    html += `
      <div class="text-center py-8 text-gray-400">
        <span class="text-4xl mb-2 block" aria-hidden="true">📋</span>
        <p>${language === 'en' ? 'No changelog entries found.' : 'Aucune entree dans l\'historique.'}</p>
      </div>
    `;
  } else {
    entries.forEach(entry => {
      html += renderChangelogEntry(entry, { lang: language });
    });
  }

  html += `</div>`;

  return html;
}

/**
 * Render a compact changelog widget (for sidebar/dashboard)
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderChangelogWidget(options = {}) {
  const { maxEntries = 3, lang = null } = options;
  const state = getState();
  const language = lang || state.lang || 'fr';

  const entries = getChangelog().slice(0, maxEntries);
  const unreadCount = getUnreadCount();

  const title = language === 'en' ? 'Recent Updates' : 'Mises a jour recentes';
  const viewAllText = language === 'en' ? 'View all' : 'Voir tout';

  let html = `
    <div class="changelog-widget bg-dark-card rounded-xl p-4" role="complementary" aria-label="${title}">
      <header class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-white flex items-center gap-2">
          <span aria-hidden="true">📋</span>
          ${title}
          ${unreadCount > 0 ? `
            <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse" aria-label="${unreadCount} non lu${unreadCount > 1 ? 's' : ''}"></span>
          ` : ''}
        </h3>
        <button
          onclick="window.openChangelog && window.openChangelog()"
          class="text-xs text-primary-400 hover:text-primary-300"
        >
          ${viewAllText}
        </button>
      </header>
      <ul class="space-y-2" role="list">
  `;

  entries.forEach(entry => {
    const isUnread = !isVersionRead(entry.version);
    const title = language === 'en' && entry.titleEn ? entry.titleEn : entry.title;

    html += `
      <li class="flex items-center gap-2 text-sm">
        <span class="text-primary-400 font-mono text-xs">v${entry.version}</span>
        ${isUnread ? '<span class="w-1.5 h-1.5 bg-primary-500 rounded-full" aria-label="Nouveau"></span>' : ''}
        <span class="text-gray-300 truncate flex-1">${escapeHTML(title)}</span>
      </li>
    `;
  });

  html += `</ul></div>`;

  return html;
}

/**
 * Show changelog notification for new versions
 */
export function showChangelogNotification() {
  const unreadEntries = getUnreadEntries();
  if (unreadEntries.length === 0) return;

  const latest = unreadEntries[0];
  const state = getState();
  const language = state.lang || 'fr';

  const message = language === 'en'
    ? `New version ${latest.version} available! Check out what's new.`
    : `Nouvelle version ${latest.version} disponible ! Decouvrez les nouveautes.`;

  showToast(message, 'info', 6000);
}

/**
 * Compare two version strings
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;

  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Get entries between two versions (exclusive)
 * @param {string} fromVersion - Starting version (exclusive)
 * @param {string} toVersion - Ending version (exclusive)
 * @returns {Array} Changelog entries between versions
 */
export function getEntriesBetweenVersions(fromVersion, toVersion) {
  if (!fromVersion || !toVersion) return [];

  return CHANGELOG_ENTRIES.filter(entry => {
    const cmpFrom = compareVersions(entry.version, fromVersion);
    const cmpTo = compareVersions(entry.version, toVersion);
    return cmpFrom < 0 && cmpTo > 0;
  });
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Setup global handlers for onclick
if (typeof window !== 'undefined') {
  window.markAllChangelogRead = () => {
    markAllAsRead();
    const state = getState();
    const message = state.lang === 'en'
      ? 'All entries marked as read'
      : 'Toutes les entrees marquees comme lues';
    showToast(message, 'success', 3000);

    // Re-render changelog if visible
    const container = document.querySelector('.changelog-container');
    if (container) {
      container.outerHTML = renderChangelog();
    }
  };

  window.markChangelogVersionRead = (version) => {
    markAsRead(version);
  };
}

export default {
  CHANGE_TYPES,
  CHANGELOG_ENTRIES,
  getChangelog,
  getChangelogByVersion,
  getLatestVersion,
  getReadVersions,
  isVersionRead,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  hasUnreadVersions,
  getUnreadEntries,
  clearReadStatus,
  getChangesByType,
  getChangeTypes,
  formatChangelogDate,
  renderChangelogEntry,
  renderChangelog,
  renderChangelogWidget,
  showChangelogNotification,
  compareVersions,
  getEntriesBetweenVersions,
};
