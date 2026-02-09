/**
 * Saved Filters Service
 * Manages user's saved search filters with localStorage persistence
 *
 * Supports filter types: spot rating, country, amenities, freshness, verified status
 */

import { showToast } from './notifications.js';

// Storage key for saved filters
const STORAGE_KEY = 'spothitch_saved_filters';

// Maximum number of saved filters per user
const MAX_FILTERS = 20;

/**
 * Filter types that can be saved
 */
export const FILTER_TYPES = {
  RATING: 'rating',
  COUNTRY: 'country',
  AMENITIES: 'amenities',
  FRESHNESS: 'freshness',
  VERIFIED: 'verified',
};

/**
 * Filter freshness options (how recent the spot data is)
 */
export const FRESHNESS_OPTIONS = {
  ANY: 'any',
  WEEK: 'week',      // Last 7 days
  MONTH: 'month',    // Last 30 days
  QUARTER: 'quarter', // Last 90 days
  YEAR: 'year',      // Last 365 days
};

/**
 * Available amenities for filtering
 */
export const AMENITIES_LIST = [
  'shelter',      // Abri
  'lighting',     // Eclairage
  'bench',        // Banc
  'toilet',       // Toilettes
  'water',        // Eau potable
  'wifi',         // WiFi
  'restaurant',   // Restaurant proche
  'gas_station',  // Station service
  'parking',      // Parking
  'hitchhiker_friendly', // Accueillant pour les autostoppeurs
];

/**
 * Get all saved filters from localStorage
 * @returns {Object} Object containing filters array and metadata
 */
function getFiltersFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { filters: [], defaultFilterId: null, lastUpdated: null };
    }
    const data = JSON.parse(stored);
    return {
      filters: Array.isArray(data.filters) ? data.filters : [],
      defaultFilterId: data.defaultFilterId || null,
      lastUpdated: data.lastUpdated || null,
    };
  } catch (error) {
    console.error('[SavedFilters] Error reading from storage:', error);
    return { filters: [], defaultFilterId: null, lastUpdated: null };
  }
}

/**
 * Save filters to localStorage
 * @param {Object} data - Data to save
 * @returns {boolean} Success status
 */
function saveFiltersToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error('[SavedFilters] Error saving to storage:', error);
    return false;
  }
}

/**
 * Generate unique filter ID
 * @returns {string} Unique ID
 */
function generateFilterId() {
  return `filter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate filter configuration
 * @param {Object} filters - Filter configuration to validate
 * @returns {Object} Validation result { isValid, errors }
 */
export function validateFilters(filters) {
  const errors = [];

  if (!filters || typeof filters !== 'object') {
    return { isValid: false, errors: ['Les filtres doivent etre un objet'] };
  }

  // Validate rating
  if (filters.rating !== undefined) {
    if (typeof filters.rating !== 'number' || filters.rating < 0 || filters.rating > 5) {
      errors.push('La note doit etre un nombre entre 0 et 5');
    }
  }

  // Validate country
  if (filters.country !== undefined) {
    if (typeof filters.country !== 'string' && !Array.isArray(filters.country)) {
      errors.push('Le pays doit etre une chaine ou un tableau');
    }
    if (Array.isArray(filters.country)) {
      if (!filters.country.every(c => typeof c === 'string')) {
        errors.push('Tous les pays doivent etre des chaines');
      }
    }
  }

  // Validate amenities
  if (filters.amenities !== undefined) {
    if (!Array.isArray(filters.amenities)) {
      errors.push('Les commodites doivent etre un tableau');
    } else {
      const invalidAmenities = filters.amenities.filter(a => !AMENITIES_LIST.includes(a));
      if (invalidAmenities.length > 0) {
        errors.push(`Commodites invalides: ${invalidAmenities.join(', ')}`);
      }
    }
  }

  // Validate freshness
  if (filters.freshness !== undefined) {
    if (!Object.values(FRESHNESS_OPTIONS).includes(filters.freshness)) {
      errors.push('Option de fraicheur invalide');
    }
  }

  // Validate verified
  if (filters.verified !== undefined) {
    if (typeof filters.verified !== 'boolean') {
      errors.push('Le statut verifie doit etre un booleen');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Save a new filter configuration with a name
 * @param {string} name - Name for the filter
 * @param {Object} filters - Filter configuration
 * @returns {Object|null} The created filter object or null if failed
 */
export function saveFilter(name, filters) {
  // Validate name
  if (!name || typeof name !== 'string') {
    console.warn('[SavedFilters] Invalid filter name');
    showToast('Nom de filtre invalide', 'error');
    return null;
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    console.warn('[SavedFilters] Empty filter name');
    showToast('Le nom du filtre ne peut pas etre vide', 'error');
    return null;
  }

  if (trimmedName.length > 50) {
    console.warn('[SavedFilters] Filter name too long');
    showToast('Le nom du filtre est trop long (max 50 caracteres)', 'error');
    return null;
  }

  // Validate filters
  const validation = validateFilters(filters);
  if (!validation.isValid) {
    console.warn('[SavedFilters] Invalid filters:', validation.errors);
    showToast(validation.errors[0], 'error');
    return null;
  }

  const storage = getFiltersFromStorage();

  // Check for duplicate name
  if (storage.filters.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
    console.warn('[SavedFilters] Duplicate filter name');
    showToast('Un filtre avec ce nom existe deja', 'error');
    return null;
  }

  // Check max filters limit
  if (storage.filters.length >= MAX_FILTERS) {
    console.warn('[SavedFilters] Maximum filters reached');
    showToast(`Limite atteinte (${MAX_FILTERS} filtres maximum)`, 'error');
    return null;
  }

  const newFilter = {
    id: generateFilterId(),
    name: trimmedName,
    filters: { ...filters },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    lastUsedAt: null,
  };

  storage.filters.push(newFilter);

  if (saveFiltersToStorage(storage)) {
    showToast(`Filtre "${trimmedName}" sauvegarde !`, 'success');
    return newFilter;
  }

  showToast('Erreur lors de la sauvegarde', 'error');
  return null;
}

/**
 * Get all saved filters
 * @param {Object} options - Options for retrieving filters
 * @param {string} options.sortBy - Sort by: 'name', 'date', 'usage', 'recent'
 * @returns {Array} Array of saved filter objects
 */
export function getSavedFilters(options = {}) {
  const { sortBy = 'date' } = options;
  const storage = getFiltersFromStorage();
  let filters = [...storage.filters];

  // Sort filters
  switch (sortBy) {
    case 'name':
      filters.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'usage':
      filters.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      break;
    case 'recent':
      filters.sort((a, b) => {
        const dateA = a.lastUsedAt ? new Date(a.lastUsedAt) : new Date(0);
        const dateB = b.lastUsedAt ? new Date(b.lastUsedAt) : new Date(0);
        return dateB - dateA;
      });
      break;
    case 'date':
    default:
      filters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  return filters;
}

/**
 * Load and apply a saved filter
 * @param {string} filterId - The filter ID to load
 * @returns {Object|null} The filter configuration or null if not found
 */
export function loadFilter(filterId) {
  if (!filterId || typeof filterId !== 'string') {
    console.warn('[SavedFilters] Invalid filter ID');
    return null;
  }

  const storage = getFiltersFromStorage();
  const filterIndex = storage.filters.findIndex(f => f.id === filterId);

  if (filterIndex === -1) {
    console.warn('[SavedFilters] Filter not found:', filterId);
    showToast('Filtre introuvable', 'error');
    return null;
  }

  // Update usage statistics
  storage.filters[filterIndex].usageCount = (storage.filters[filterIndex].usageCount || 0) + 1;
  storage.filters[filterIndex].lastUsedAt = new Date().toISOString();
  saveFiltersToStorage(storage);

  const filter = storage.filters[filterIndex];
  showToast(`Filtre "${filter.name}" applique`, 'success');

  return { ...filter.filters };
}

/**
 * Delete a saved filter
 * @param {string} filterId - The filter ID to delete
 * @returns {boolean} Success status
 */
export function deleteFilter(filterId) {
  if (!filterId || typeof filterId !== 'string') {
    console.warn('[SavedFilters] Invalid filter ID for deletion');
    return false;
  }

  const storage = getFiltersFromStorage();
  const filterIndex = storage.filters.findIndex(f => f.id === filterId);

  if (filterIndex === -1) {
    console.warn('[SavedFilters] Filter not found for deletion:', filterId);
    showToast('Filtre introuvable', 'error');
    return false;
  }

  const deletedFilter = storage.filters[filterIndex];
  storage.filters.splice(filterIndex, 1);

  // Clear default if deleting the default filter
  if (storage.defaultFilterId === filterId) {
    storage.defaultFilterId = null;
  }

  if (saveFiltersToStorage(storage)) {
    showToast(`Filtre "${deletedFilter.name}" supprime`, 'success');
    return true;
  }

  showToast('Erreur lors de la suppression', 'error');
  return false;
}

/**
 * Update an existing filter
 * @param {string} filterId - The filter ID to update
 * @param {Object} newFilters - New filter configuration
 * @returns {Object|null} The updated filter or null if failed
 */
export function updateFilter(filterId, newFilters) {
  if (!filterId || typeof filterId !== 'string') {
    console.warn('[SavedFilters] Invalid filter ID for update');
    return null;
  }

  // Validate new filters
  const validation = validateFilters(newFilters);
  if (!validation.isValid) {
    console.warn('[SavedFilters] Invalid filters for update:', validation.errors);
    showToast(validation.errors[0], 'error');
    return null;
  }

  const storage = getFiltersFromStorage();
  const filterIndex = storage.filters.findIndex(f => f.id === filterId);

  if (filterIndex === -1) {
    console.warn('[SavedFilters] Filter not found for update:', filterId);
    showToast('Filtre introuvable', 'error');
    return null;
  }

  storage.filters[filterIndex].filters = { ...newFilters };
  storage.filters[filterIndex].updatedAt = new Date().toISOString();

  if (saveFiltersToStorage(storage)) {
    const updatedFilter = storage.filters[filterIndex];
    showToast(`Filtre "${updatedFilter.name}" mis a jour`, 'success');
    return updatedFilter;
  }

  showToast('Erreur lors de la mise a jour', 'error');
  return null;
}

/**
 * Get a specific filter by ID
 * @param {string} filterId - The filter ID
 * @returns {Object|null} The filter object or null if not found
 */
export function getFilterById(filterId) {
  if (!filterId || typeof filterId !== 'string') {
    return null;
  }

  const storage = getFiltersFromStorage();
  return storage.filters.find(f => f.id === filterId) || null;
}

/**
 * Rename a filter
 * @param {string} filterId - The filter ID
 * @param {string} newName - New name for the filter
 * @returns {Object|null} The updated filter or null if failed
 */
export function renameFilter(filterId, newName) {
  if (!filterId || typeof filterId !== 'string') {
    console.warn('[SavedFilters] Invalid filter ID for rename');
    return null;
  }

  if (!newName || typeof newName !== 'string') {
    console.warn('[SavedFilters] Invalid new name');
    showToast('Nouveau nom invalide', 'error');
    return null;
  }

  const trimmedName = newName.trim();
  if (trimmedName.length === 0) {
    showToast('Le nom ne peut pas etre vide', 'error');
    return null;
  }

  if (trimmedName.length > 50) {
    showToast('Le nom est trop long (max 50 caracteres)', 'error');
    return null;
  }

  const storage = getFiltersFromStorage();
  const filterIndex = storage.filters.findIndex(f => f.id === filterId);

  if (filterIndex === -1) {
    console.warn('[SavedFilters] Filter not found for rename:', filterId);
    showToast('Filtre introuvable', 'error');
    return null;
  }

  // Check for duplicate name (excluding current filter)
  const duplicateExists = storage.filters.some(
    (f, idx) => idx !== filterIndex && f.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (duplicateExists) {
    showToast('Un filtre avec ce nom existe deja', 'error');
    return null;
  }

  const oldName = storage.filters[filterIndex].name;
  storage.filters[filterIndex].name = trimmedName;
  storage.filters[filterIndex].updatedAt = new Date().toISOString();

  if (saveFiltersToStorage(storage)) {
    showToast(`Filtre renomme de "${oldName}" en "${trimmedName}"`, 'success');
    return storage.filters[filterIndex];
  }

  showToast('Erreur lors du renommage', 'error');
  return null;
}

/**
 * Duplicate a filter
 * @param {string} filterId - The filter ID to duplicate
 * @returns {Object|null} The new duplicated filter or null if failed
 */
export function duplicateFilter(filterId) {
  if (!filterId || typeof filterId !== 'string') {
    console.warn('[SavedFilters] Invalid filter ID for duplication');
    return null;
  }

  const storage = getFiltersFromStorage();
  const originalFilter = storage.filters.find(f => f.id === filterId);

  if (!originalFilter) {
    console.warn('[SavedFilters] Filter not found for duplication:', filterId);
    showToast('Filtre introuvable', 'error');
    return null;
  }

  // Check max filters limit
  if (storage.filters.length >= MAX_FILTERS) {
    showToast(`Limite atteinte (${MAX_FILTERS} filtres maximum)`, 'error');
    return null;
  }

  // Generate a unique name for the copy
  let copyName = `${originalFilter.name} (copie)`;
  let copyNumber = 1;
  while (storage.filters.some(f => f.name.toLowerCase() === copyName.toLowerCase())) {
    copyNumber++;
    copyName = `${originalFilter.name} (copie ${copyNumber})`;
  }

  // Ensure name doesn't exceed limit
  if (copyName.length > 50) {
    copyName = copyName.substring(0, 47) + '...';
  }

  const duplicatedFilter = {
    id: generateFilterId(),
    name: copyName,
    filters: { ...originalFilter.filters },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    lastUsedAt: null,
  };

  storage.filters.push(duplicatedFilter);

  if (saveFiltersToStorage(storage)) {
    showToast(`Filtre duplique: "${copyName}"`, 'success');
    return duplicatedFilter;
  }

  showToast('Erreur lors de la duplication', 'error');
  return null;
}

/**
 * Export all filters as JSON
 * @returns {Object} Export object with all filters and metadata
 */
export function exportFilters() {
  const storage = getFiltersFromStorage();

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    totalFilters: storage.filters.length,
    defaultFilterId: storage.defaultFilterId,
    filters: storage.filters.map(f => ({
      name: f.name,
      filters: f.filters,
      createdAt: f.createdAt,
      usageCount: f.usageCount,
    })),
  };
}

/**
 * Import filters from JSON
 * @param {string|Object} json - JSON string or object to import
 * @param {Object} options - Import options
 * @param {boolean} options.merge - Whether to merge with existing filters (default: true)
 * @param {boolean} options.overwrite - Whether to overwrite filters with same name (default: false)
 * @returns {Object} Import result { success, imported, skipped, errors }
 */
export function importFilters(json, options = {}) {
  const { merge = true, overwrite = false } = options;
  const result = { success: false, imported: 0, skipped: 0, errors: [] };

  let data;
  try {
    data = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (error) {
    result.errors.push('Format JSON invalide');
    return result;
  }

  if (!data || !Array.isArray(data.filters)) {
    result.errors.push('Structure de donnees invalide');
    return result;
  }

  const storage = getFiltersFromStorage();
  const existingNames = new Set(storage.filters.map(f => f.name.toLowerCase()));

  for (const filterData of data.filters) {
    // Validate filter data
    if (!filterData.name || typeof filterData.name !== 'string') {
      result.skipped++;
      result.errors.push('Filtre sans nom ignore');
      continue;
    }

    const validation = validateFilters(filterData.filters);
    if (!validation.isValid) {
      result.skipped++;
      result.errors.push(`Filtre "${filterData.name}" invalide: ${validation.errors[0]}`);
      continue;
    }

    const nameLower = filterData.name.toLowerCase();

    // Check for duplicates
    if (existingNames.has(nameLower)) {
      if (overwrite) {
        // Find and update existing filter
        const existingIndex = storage.filters.findIndex(f => f.name.toLowerCase() === nameLower);
        if (existingIndex !== -1) {
          storage.filters[existingIndex].filters = { ...filterData.filters };
          storage.filters[existingIndex].updatedAt = new Date().toISOString();
          result.imported++;
          continue;
        }
      }
      result.skipped++;
      continue;
    }

    // Check max limit
    if (storage.filters.length >= MAX_FILTERS) {
      result.skipped++;
      result.errors.push('Limite de filtres atteinte');
      break;
    }

    // Add new filter
    const newFilter = {
      id: generateFilterId(),
      name: filterData.name.trim(),
      filters: { ...filterData.filters },
      createdAt: filterData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsedAt: null,
    };

    storage.filters.push(newFilter);
    existingNames.add(nameLower);
    result.imported++;
  }

  if (!merge) {
    // Replace all - only keep imported filters
    const importedFilters = storage.filters.slice(-result.imported);
    storage.filters = importedFilters;
    storage.defaultFilterId = null;
  }

  if (saveFiltersToStorage(storage)) {
    result.success = true;
    if (result.imported > 0) {
      showToast(`${result.imported} filtre(s) importe(s)`, 'success');
    } else if (result.skipped > 0) {
      showToast('Aucun nouveau filtre importe', 'info');
    }
  } else {
    result.errors.push('Erreur de sauvegarde');
  }

  return result;
}

/**
 * Get preset default filters
 * @returns {Array} Array of default filter presets
 */
export function getDefaultFilters() {
  return [
    {
      id: 'preset_top_rated',
      name: 'Spots bien notes',
      description: 'Spots avec une note minimale de 4 etoiles',
      filters: {
        rating: 4,
      },
      isPreset: true,
    },
    {
      id: 'preset_verified',
      name: 'Spots verifies',
      description: 'Uniquement les spots verifies par la communaute',
      filters: {
        verified: true,
      },
      isPreset: true,
    },
    {
      id: 'preset_fresh',
      name: 'Spots recents',
      description: 'Spots mis a jour dans le dernier mois',
      filters: {
        freshness: FRESHNESS_OPTIONS.MONTH,
      },
      isPreset: true,
    },
    {
      id: 'preset_equipped',
      name: 'Spots equipes',
      description: 'Spots avec abri et eclairage',
      filters: {
        amenities: ['shelter', 'lighting'],
      },
      isPreset: true,
    },
    {
      id: 'preset_france',
      name: 'France uniquement',
      description: 'Tous les spots en France',
      filters: {
        country: 'FR',
      },
      isPreset: true,
    },
    {
      id: 'preset_europe_top',
      name: 'Monde - Top spots',
      description: 'Meilleurs spots du monde',
      filters: {
        rating: 4.5,
        verified: true,
      },
      isPreset: true,
    },
    {
      id: 'preset_comfort',
      name: 'Confort maximum',
      description: 'Spots avec toutes les commodites de base',
      filters: {
        amenities: ['shelter', 'lighting', 'toilet', 'water'],
        rating: 3.5,
      },
      isPreset: true,
    },
    {
      id: 'preset_hitchhiker',
      name: 'Accueil autostoppeur',
      description: 'Spots connus pour etre accueillants',
      filters: {
        amenities: ['hitchhiker_friendly'],
        rating: 4,
      },
      isPreset: true,
    },
  ];
}

/**
 * Set a filter as the default
 * @param {string} filterId - The filter ID to set as default
 * @returns {boolean} Success status
 */
export function setAsDefault(filterId) {
  if (!filterId || typeof filterId !== 'string') {
    console.warn('[SavedFilters] Invalid filter ID for setAsDefault');
    return false;
  }

  const storage = getFiltersFromStorage();

  // Check if filter exists (can be preset or user filter)
  const isPreset = getDefaultFilters().some(f => f.id === filterId);
  const isUserFilter = storage.filters.some(f => f.id === filterId);

  if (!isPreset && !isUserFilter) {
    console.warn('[SavedFilters] Filter not found:', filterId);
    showToast('Filtre introuvable', 'error');
    return false;
  }

  storage.defaultFilterId = filterId;

  if (saveFiltersToStorage(storage)) {
    showToast('Filtre defini par defaut', 'success');
    return true;
  }

  showToast('Erreur lors de la configuration', 'error');
  return false;
}

/**
 * Get the default filter
 * @returns {Object|null} The default filter configuration or null
 */
export function getDefaultFilter() {
  const storage = getFiltersFromStorage();

  if (!storage.defaultFilterId) {
    return null;
  }

  // Check user filters first
  const userFilter = storage.filters.find(f => f.id === storage.defaultFilterId);
  if (userFilter) {
    return { ...userFilter.filters, filterId: userFilter.id, filterName: userFilter.name };
  }

  // Check presets
  const presetFilter = getDefaultFilters().find(f => f.id === storage.defaultFilterId);
  if (presetFilter) {
    return { ...presetFilter.filters, filterId: presetFilter.id, filterName: presetFilter.name };
  }

  return null;
}

/**
 * Clear the default filter setting
 * @returns {boolean} Success status
 */
export function clearDefaultFilter() {
  const storage = getFiltersFromStorage();
  storage.defaultFilterId = null;

  if (saveFiltersToStorage(storage)) {
    showToast('Filtre par defaut supprime', 'success');
    return true;
  }

  return false;
}

/**
 * Clear all saved filters
 * @param {boolean} keepDefault - Whether to keep the default filter setting (default: false)
 * @returns {boolean} Success status
 */
export function clearAllFilters(keepDefault = false) {
  const storage = getFiltersFromStorage();
  const count = storage.filters.length;

  storage.filters = [];
  if (!keepDefault) {
    storage.defaultFilterId = null;
  }

  if (saveFiltersToStorage(storage)) {
    showToast(`${count} filtre(s) supprime(s)`, 'success');
    return true;
  }

  showToast('Erreur lors de la suppression', 'error');
  return false;
}

/**
 * Get filters count
 * @returns {number} Number of saved filters
 */
export function getFiltersCount() {
  const storage = getFiltersFromStorage();
  return storage.filters.length;
}

/**
 * Get filter statistics
 * @returns {Object} Statistics about saved filters
 */
export function getFilterStats() {
  const storage = getFiltersFromStorage();
  const filters = storage.filters;

  const stats = {
    total: filters.length,
    maxAllowed: MAX_FILTERS,
    remaining: MAX_FILTERS - filters.length,
    hasDefault: storage.defaultFilterId !== null,
    defaultFilterId: storage.defaultFilterId,
    totalUsage: filters.reduce((sum, f) => sum + (f.usageCount || 0), 0),
    mostUsed: null,
    lastCreated: null,
    lastUsed: null,
  };

  if (filters.length > 0) {
    // Most used filter
    const sorted = [...filters].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    if (sorted[0]?.usageCount > 0) {
      stats.mostUsed = { id: sorted[0].id, name: sorted[0].name, count: sorted[0].usageCount };
    }

    // Last created
    const byCreation = [...filters].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    stats.lastCreated = { id: byCreation[0].id, name: byCreation[0].name, date: byCreation[0].createdAt };

    // Last used
    const withUsage = filters.filter(f => f.lastUsedAt);
    if (withUsage.length > 0) {
      const byUsage = withUsage.sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt));
      stats.lastUsed = { id: byUsage[0].id, name: byUsage[0].name, date: byUsage[0].lastUsedAt };
    }
  }

  return stats;
}

/**
 * Search filters by name
 * @param {string} query - Search query
 * @returns {Array} Matching filters
 */
export function searchFilters(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const storage = getFiltersFromStorage();
  return storage.filters.filter(f => f.name.toLowerCase().includes(normalizedQuery));
}

/**
 * Render saved filters list UI
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderSavedFiltersList(options = {}) {
  const { showPresets = true, onSelect = 'applySavedFilter' } = options;

  const userFilters = getSavedFilters();
  const presets = showPresets ? getDefaultFilters() : [];
  const defaultId = getFiltersFromStorage().defaultFilterId;

  if (userFilters.length === 0 && presets.length === 0) {
    return `
      <div class="saved-filters-empty p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-filter text-primary-400 text-2xl" aria-hidden="true"></i>
        </div>
        <h3 class="font-semibold mb-2">Aucun filtre sauvegarde</h3>
        <p class="text-slate-400 text-sm">
          Sauvegardez vos combinaisons de filtres preferees pour les reutiliser rapidement
        </p>
      </div>
    `;
  }

  const renderFilterItem = (filter, isPreset = false) => {
    const isDefault = filter.id === defaultId;
    const filterTypesUsed = Object.keys(filter.filters || {}).length;

    return `
      <div class="saved-filter-item p-3 hover:bg-white/5 transition-colors rounded-lg ${isDefault ? 'border border-primary-500/50' : ''}">
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm truncate">${escapeHtml(filter.name)}</span>
              ${isDefault ? '<span class="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">Defaut</span>' : ''}
              ${isPreset ? '<span class="text-xs bg-secondary-500/20 text-secondary-400 px-2 py-0.5 rounded">Preset</span>' : ''}
            </div>
            <div class="text-xs text-slate-400 mt-1">
              ${filterTypesUsed} critere${filterTypesUsed > 1 ? 's' : ''}
              ${filter.usageCount ? ` - ${filter.usageCount} utilisation${filter.usageCount > 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              onclick="${onSelect}('${filter.id}')"
              class="w-8 h-8 rounded-full flex items-center justify-center text-primary-400 hover:bg-primary-500/20 transition-colors"
              aria-label="Appliquer le filtre ${escapeHtml(filter.name)}"
              title="Appliquer"
            >
              <i class="fas fa-check" aria-hidden="true"></i>
            </button>
            ${!isPreset ? `
              <button
                onclick="deleteSavedFilter('${filter.id}')"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                aria-label="Supprimer le filtre ${escapeHtml(filter.name)}"
                title="Supprimer"
              >
                <i class="fas fa-trash" aria-hidden="true"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  };

  let html = '<div class="saved-filters-list">';

  // User filters
  if (userFilters.length > 0) {
    html += `
      <div class="saved-filters-section mb-4">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-3">
          Mes filtres (${userFilters.length})
        </div>
        <div class="space-y-1">
          ${userFilters.map(f => renderFilterItem(f, false)).join('')}
        </div>
      </div>
    `;
  }

  // Presets
  if (presets.length > 0) {
    html += `
      <div class="saved-filters-section">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-3">
          Filtres predefinis
        </div>
        <div class="space-y-1">
          ${presets.map(f => renderFilterItem(f, true)).join('')}
        </div>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  FILTER_TYPES,
  FRESHNESS_OPTIONS,
  AMENITIES_LIST,
  validateFilters,
  saveFilter,
  getSavedFilters,
  loadFilter,
  deleteFilter,
  updateFilter,
  getFilterById,
  renameFilter,
  duplicateFilter,
  exportFilters,
  importFilters,
  getDefaultFilters,
  setAsDefault,
  getDefaultFilter,
  clearDefaultFilter,
  clearAllFilters,
  getFiltersCount,
  getFilterStats,
  searchFilters,
  renderSavedFiltersList,
};
