/**
 * Filters Modal Component
 * Spot filtering options
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';


/**
 * Render filters modal
 */
export function renderFiltersModal() {
  const state = getState();
  const { showFilters, filterCountry = 'all', filterMinRating = 0, filterMaxWait = 999, filterVerifiedOnly = false } = state;

  if (!showFilters) return '';

  // Available filter options
  const countryOptions = [
    { code: 'all', name: t('allCountries') || 'All countries', flag: '🌍' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
    { code: 'ES', name: 'España', flag: '🇪🇸' },
    { code: 'IT', name: 'Italia', flag: '🇮🇹' },
    { code: 'NL', name: 'Nederland', flag: '🇳🇱' },
    { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
    { code: 'PL', name: 'Polska', flag: '🇵🇱' },
    { code: 'CZ', name: 'Česko', flag: '🇨🇿' },
    { code: 'AT', name: 'Österreich', flag: '🇦🇹' },
    { code: 'CH', name: 'Schweiz', flag: '🇨🇭' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'GB', name: 'UK', flag: '🇬🇧' },
    { code: 'SE', name: 'Sverige', flag: '🇸🇪' },
    { code: 'NO', name: 'Norge', flag: '🇳🇴' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
    { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
    { code: 'US', name: 'USA', flag: '🇺🇸' },
    { code: 'NZ', name: 'NZ', flag: '🇳🇿' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  ];

  const ratingOptions = [
    { value: 0, label: t('all') || 'Tous' },
    { value: 3, label: '⭐ 3+' },
    { value: 3.5, label: '⭐ 3.5+' },
    { value: 4, label: '⭐ 4+' },
    { value: 4.5, label: '⭐ 4.5+' },
  ];

  const waitOptions = [
    { value: 999, label: t('noPreference') || 'Peu importe' },
    { value: 60, label: '< 1h' },
    { value: 30, label: '< 30 min' },
    { value: 20, label: '< 20 min' },
    { value: 10, label: '< 10 min' },
  ];

  return `
    <div class="filters-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeFilters()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="filters-title">
      <div class="modal-panel w-full sm:max-w-md sm:rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10">
          <h2 id="filters-title" class="text-xl font-bold text-white">${t('filters')}</h2>
          <div class="flex gap-2">
            <button onclick="resetFilters()"
                    class="px-3 py-1.5 text-slate-400 hover:text-white text-sm"
                    type="button">
              ${t('resetFilters')}
            </button>
            <button onclick="closeFilters()"
                    class="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full"
                    type="button"
                    aria-label="${t('closeFilters') || 'Close filters'}">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          <!-- Country Filter -->
          <section>
            <label class="block text-sm font-medium text-slate-400 mb-3">
              ${t('country') || 'Pays'}
            </label>
            <div class="grid grid-cols-3 gap-2">
              ${countryOptions.map(opt => `
                <button onclick="setFilterCountry('${opt.code}')"
                        class="p-2 rounded-xl text-center transition-colors
                               ${filterCountry === opt.code
    ? 'bg-sky-500 text-white'
    : 'bg-white/5 text-slate-300 hover:bg-white/10'}">
                  <span class="text-lg">${opt.flag}</span>
                  <span class="block text-xs mt-1 truncate">${opt.code === 'all' ? (t('all') || 'All') : opt.code}</span>
                </button>
              `).join('')}
            </div>
          </section>

          <!-- Rating Filter -->
          <section>
            <label class="block text-sm font-medium text-slate-400 mb-3">
              ${t('minRating')}
            </label>
            <div class="flex flex-wrap gap-2">
              ${ratingOptions.map(opt => `
                <button onclick="setFilterMinRating(${opt.value})"
                        class="px-4 py-2 rounded-xl transition-colors
                               ${filterMinRating === opt.value
    ? 'bg-sky-500 text-white'
    : 'bg-white/5 text-slate-300 hover:bg-white/10'}">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
          </section>

          <!-- Wait Time Filter -->
          <section>
            <label class="block text-sm font-medium text-slate-400 mb-3">
              ${t('maxWait')}
            </label>
            <div class="flex flex-wrap gap-2">
              ${waitOptions.map(opt => `
                <button onclick="setFilterMaxWait(${opt.value})"
                        class="px-4 py-2 rounded-xl transition-colors
                               ${filterMaxWait === opt.value
    ? 'bg-sky-500 text-white'
    : 'bg-white/5 text-slate-300 hover:bg-white/10'}">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
          </section>

          <!-- Verified Only Toggle -->
          <section>
            <label class="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
              <div>
                <span class="text-white font-medium">${t('verifiedOnly') || 'Spots vérifiés uniquement'}</span>
                <p class="text-slate-500 text-sm">${t('verifiedOnlyDesc') || "N'afficher que les spots avec ✓"}</p>
              </div>
              <button onclick="toggleVerifiedFilter()"
                      class="w-12 h-7 rounded-full transition-colors relative
                             ${filterVerifiedOnly ? 'bg-sky-500' : 'bg-white/10'}">
                <span class="absolute w-5 h-5 bg-white rounded-full top-1 transition-transform
                             ${filterVerifiedOnly ? 'translate-x-6' : 'translate-x-1'}"></span>
              </button>
            </label>
          </section>

          <!-- Sort Options -->
          <section>
            <label class="block text-sm font-medium text-slate-400 mb-3">
              ${t('sortBy') || 'Trier par'}
            </label>
            <div class="grid grid-cols-2 gap-2">
              ${[
    { value: 'rating', label: t('rating') || 'Note', icon: '⭐' },
    { value: 'recent', label: t('recent') || 'Récent', icon: '🕐' },
    { value: 'popular', label: t('popular') || 'Populaire', icon: '🔥' },
    { value: 'distance', label: 'Distance', icon: '📍' },
  ].map(opt => `
                <button onclick="setSortBy('${opt.value}')"
                        class="p-3 rounded-xl text-left transition-colors flex items-center gap-2
                               ${state.sortBy === opt.value
    ? 'bg-sky-500 text-white'
    : 'bg-white/5 text-slate-300 hover:bg-white/10'}">
                  <span>${opt.icon}</span>
                  <span>${opt.label}</span>
                </button>
              `).join('')}
            </div>
          </section>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-white/10">
          <button onclick="applyFilters()"
                  class="w-full py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white
                         font-bold rounded-xl hover:from-sky-600 hover:to-cyan-600">
            ${t('applyFilters')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Apply filters and close modal
 */
export function applyFilters() {
  setState({ showFilters: false });
  // Filters are applied reactively through state
}

/**
 * Reset all filters
 */
export function resetFilters() {
  setState({
    filterCountry: 'all',
    filterMinRating: 0,
    filterMaxWait: 999,
    filterVerifiedOnly: false,
    sortBy: 'rating',
  });
}

/**
 * Filter spots based on current filter state
 */
export function getFilteredSpots(spots, state) {
  let filtered = [...spots];

  // Filter by country
  if (state.filterCountry && state.filterCountry !== 'all') {
    filtered = filtered.filter(s => s.country === state.filterCountry);
  }

  // Filter by minimum rating
  if (state.filterMinRating > 0) {
    filtered = filtered.filter(s => (s.globalRating || 0) >= state.filterMinRating);
  }

  // Filter by maximum wait time
  if (state.filterMaxWait < 999) {
    filtered = filtered.filter(s => (s.avgWaitTime || 999) <= state.filterMaxWait);
  }

  // Filter by verified only
  if (state.filterVerifiedOnly) {
    filtered = filtered.filter(s => s.verified);
  }

  // Filter by search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      s.from?.toLowerCase().includes(query) ||
      s.to?.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    );
  }

  // Sort
  switch (state.sortBy) {
    case 'rating':
      filtered.sort((a, b) => (b.globalRating || 0) - (a.globalRating || 0));
      break;
    case 'recent':
      filtered.sort((a, b) => new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0));
      break;
    case 'popular':
      filtered.sort((a, b) => (b.checkins || 0) - (a.checkins || 0));
      break;
    case 'distance':
      if (state.userLocation) {
        filtered.sort((a, b) => {
          const distA = getDistance(state.userLocation, a.coordinates);
          const distB = getDistance(state.userLocation, b.coordinates);
          return distA - distB;
        });
      }
      break;
    default:
      filtered.sort((a, b) => (b.globalRating || 0) - (a.globalRating || 0));
  }

  return filtered;
}

/**
 * Calculate distance between two points
 */
function getDistance(point1, point2) {
  if (!point1 || !point2) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default {
  renderFiltersModal,
  applyFilters,
  resetFilters,
  getFilteredSpots,
};
