/**
 * Map View Component (New Home)
 * Full-screen map with search, scores, and add button
 */

import { t } from '../../i18n/index.js';
import { countryGuides } from '../../data/guides.js';
import { icon } from '../../utils/icons.js'

// Build reverse lookup: country name (EN + local variants) → code
const _countryNameMap = {}
countryGuides.forEach(g => {
  const code = g.code.toLowerCase()
  if (g.nameEn) _countryNameMap[g.nameEn] = code
  if (g.name && g.name !== g.nameEn) _countryNameMap[g.name] = code
})
// Common Nominatim variants not in guides
Object.assign(_countryNameMap, {
  'Deutschland': 'de', 'España': 'es', 'Italia': 'it',
  'Nederland': 'nl', 'Belgique': 'be', 'België': 'be',
  'Österreich': 'at', 'Schweiz': 'ch', 'Suisse': 'ch',
  'Polska': 'pl', 'Česko': 'cz', 'Czechia': 'cz',
  'Magyarország': 'hu', 'Hrvatska': 'hr', 'România': 'ro',
  'Ελλάδα': 'gr', 'България': 'bg', 'Slovensko': 'sk',
  'Slovenija': 'si', 'Ísland': 'is', 'Srbija': 'rs',
  'Україна': 'ua', 'Беларусь': 'by', 'Eesti': 'ee',
  'Lietuva': 'lt', 'Latvija': 'lv', 'Საქართველო': 'ge',
  'ישראל': 'il', 'المغرب': 'ma', 'Türkiye': 'tr',
  'ایران': 'ir', 'UK': 'gb', 'United Kingdom': 'gb',
  'New Zealand': 'nz', 'Aotearoa': 'nz',
  'South Africa': 'za', 'Suid-Afrika': 'za',
})

function countryNameToCode(name) {
  if (!name) return null
  return _countryNameMap[name] || null
}

export function renderMap(state) {
  return `
    <div class="h-full flex flex-col relative" style="height: calc(100vh - 130px);">
      <!-- Search Bar -->
      <div class="absolute top-2 left-2 right-2 z-30 flex gap-2">
        <div class="flex-1 relative">
          <input
            type="text"
            id="map-search"
            placeholder="${t('searchPlace') || 'Search a location...'}"
            class="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            oninput="searchMapSuggestions(this.value)"
            onkeydown="if(event.key==='Enter') { searchLocation(this.value); hideSearchSuggestions(); }"
            onfocus="if(this.value.length>=2) searchMapSuggestions(this.value)"
            aria-label="${t('searchMapLocation') || 'Search a location on the map'}"
            autocomplete="off"
          />
          ${icon('search', 'w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400')}
          <div id="map-search-suggestions" class="absolute top-full left-0 right-0 mt-1 z-50 hidden"></div>
        </div>
        <button
          onclick="openFilters()"
          class="px-4 py-3 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-slate-400 hover:text-white hover:border-primary-500/50 transition-all"
          aria-label="${t('filterSpots') || 'Filter spots'}"
          title="${t('filters') || 'Filters'}"
        >
          ${icon('sliders-horizontal', 'w-5 h-5')}
        </button>
      </div>

      <!-- Mini Score Bar -->
      <div class="absolute top-16 left-2 right-2 z-20">
        <div class="flex justify-center gap-2">
          <button
            onclick="openStats()"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm hover:border-primary-500/50 transition-all"
            aria-label="${t('viewMyStats') || 'View my stats'}"
          >
            <span class="text-amber-400">🏆</span>
            <span class="font-bold text-white">${state.points || 0}</span>
            <span class="text-slate-400 text-xs">👍</span>
          </button>
          <button
            onclick="openStats()"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm hover:border-primary-500/50 transition-all"
            aria-label="${t('viewMyLevel') || 'View my level'}"
          >
            <span class="text-primary-400">⭐</span>
            <span class="font-bold text-white">${t('levelPrefix') || 'Lvl.'} ${state.level || 1}</span>
          </button>
        </div>
      </div>

      <!-- Map Container -->
      <div id="main-map" class="flex-1 w-full bg-dark-secondary"></div>

      <!-- Map Controls (Zoom + Location) -->
      <div class="absolute left-4 bottom-36 z-30 flex flex-col gap-2">
        <button
          onclick="mapZoomIn()"
          class="w-11 h-11 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-dark-secondary hover:border-primary-500/50 transition-all"
          aria-label="${t('zoomIn') || 'Zoom in'}"
          title="Zoom +"
        >
          ${icon('plus', 'w-5 h-5')}
        </button>
        <button
          onclick="mapZoomOut()"
          class="w-11 h-11 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-dark-secondary hover:border-primary-500/50 transition-all"
          aria-label="${t('zoomOut') || 'Zoom out'}"
          title="Zoom -"
        >
          ${icon('minus', 'w-5 h-5')}
        </button>
        <button
          onclick="centerOnUser()"
          class="w-11 h-11 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-primary-400 flex items-center justify-center hover:bg-dark-secondary hover:border-primary-500/50 transition-all"
          aria-label="${t('myLocation') || 'My location'}"
          title="${t('myLocation') || 'My location'}"
        >
          ${icon('locate', 'w-5 h-5')}
        </button>
      </div>

      <!-- Add Spot FAB -->
      <button
        onclick="openAddSpot()"
        class="absolute bottom-32 right-4 z-20 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center text-xl hover:bg-primary-600 hover:scale-110 transition-all"
        aria-label="${t('addNewSpot') || 'Add a new spot'}"
        title="${t('addSpot') || 'Add spot'}"
      >
        ${icon('plus', 'w-5 h-5')}
      </button>

    </div>
  `;
}

// Initialize map when the view is rendered
export function initMainMap(state) {
  const mapContainer = document.getElementById('main-map');
  if (!mapContainer) return;

  // Import and initialize the map service
  import('../../services/map.js').then(({ initMapService }) => {
    initMapService(state);
  }).catch(err => {
    console.error('Failed to init map:', err);
    // Show fallback
    mapContainer.innerHTML = `
      <div class="h-full flex items-center justify-center">
        <div class="text-center text-slate-400">
          ${icon('map-pinned', 'w-5 h-5 text-5xl mb-4 text-primary-400')}
          <p>Carte en chargement...</p>
        </div>
      </div>
    `;
  });
}

// Search suggestions handler with debounce
let searchDebounce = null
window.searchMapSuggestions = (query) => {
  clearTimeout(searchDebounce)
  const container = document.getElementById('map-search-suggestions')
  if (!container) return
  if (!query || query.trim().length < 2) {
    container.classList.add('hidden')
    return
  }
  searchDebounce = setTimeout(async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'User-Agent': 'SpotHitch/2.0' } }
      )
      const results = await response.json()
      if (results && results.length > 0) {
        container.classList.remove('hidden')
        const isCityType = (r) => ['city', 'town', 'village', 'municipality', 'hamlet', 'suburb'].some(
          t => (r.type || '').includes(t) || (r.class || '') === 'place'
        )
        container.innerHTML = `
          <div class="bg-dark-secondary/95 backdrop-blur rounded-xl border border-white/10 overflow-hidden shadow-xl">
            ${results.map(r => {
              const safeName = r.display_name.replace(/'/g, "\\'")
              const shortName = r.display_name.split(',').slice(0, 2).join(',')
              const parts = r.display_name.split(',')
              const countryName = (parts[parts.length - 1] || '').trim()
              const cc = (r.address?.country_code || '').toUpperCase()
              const cityName = (parts[0] || '').trim().replace(/'/g, "\\'")
              const isCity = isCityType(r)
              return `
              <div class="border-b border-white/5 last:border-0">
                <button
                  onclick="selectSearchSuggestion(${r.lat}, ${r.lon}, '${safeName}')"
                  class="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all"
                >
                  <div class="font-medium text-sm truncate">${shortName}</div>
                  <div class="text-xs text-slate-400 truncate">${r.display_name}</div>
                </button>
                ${isCity ? `
                  <button
                    onclick="openCityPanel('${cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}', '${cityName}', ${r.lat}, ${r.lon}, '${cc}', '${countryName.replace(/'/g, "\\'")}')"
                    class="w-full px-4 py-2 text-left text-primary-400 hover:bg-primary-500/10 transition-all text-xs font-medium border-t border-white/5"
                  >
                    📍 ${window.t?.('guideHitchhikingCity') || 'Hitchhiking guide —'} ${cityName}
                  </button>
                ` : ''}
              </div>`
            }).join('')}
          </div>
        `
      } else {
        container.classList.add('hidden')
      }
    } catch (e) {
      container.classList.add('hidden')
    }
  }, 300)
}

window.selectSearchSuggestion = (lat, lon, name) => {
  const input = document.getElementById('map-search')
  if (input) input.value = name.split(',')[0]
  window.hideSearchSuggestions()
  if (window.mapInstance) {
    window.mapInstance.setView([parseFloat(lat), parseFloat(lon)], 10)
  }
}

window.hideSearchSuggestions = () => {
  const c = document.getElementById('map-search-suggestions')
  if (c) c.classList.add('hidden')
}

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#map-search') && !e.target.closest('#map-search-suggestions')) {
    window.hideSearchSuggestions?.()
  }
})

// Search location handler
window.searchLocation = async (query) => {
  if (!query || query.trim().length < 2) return;

  try {
    // Use Nominatim for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    );
    const results = await response.json();

    if (results && results.length > 0) {
      const { lat, lon, display_name } = results[0];

      // Detect country code from result
      const countryMatch = display_name.match(/,\s*([^,]+)$/);
      const countryName = countryMatch ? countryMatch[1].trim() : null;

      // Build country map from guides data (covers all 53 guide countries)
      const countryCode = countryNameToCode(countryName);


      // Update state with search country
      if (window.setState) {
        window.setState({ searchCountry: countryCode });
      }

      // Center map on result
      if (window.mapInstance) {
        window.mapInstance.setView([parseFloat(lat), parseFloat(lon)], 10);
      }

      // Show success message
      if (window.showSuccess) {
        window.showSuccess(`📍 ${display_name.split(',')[0]}`);
      }
    } else {
      if (window.showError) {
        window.showError(t('locationNotFound') || 'Lieu non trouvé');
      }
    }
  } catch (error) {
    console.error('Search failed:', error);
    if (window.showError) {
      window.showError(t('searchError') || 'Erreur de recherche');
    }
  }
};

// Open country guide
window.openCountryGuide = (countryCode) => {
  if (window.setState) {
    window.setState({
      selectedCountryGuide: countryCode,
      activeSubTab: 'guides',
      showGuidesOverlay: true,
    });
  }
};

// Map zoom controls
window.mapZoomIn = () => {
  if (window.mapInstance) {
    window.mapInstance.zoomIn();
  }
};

window.mapZoomOut = () => {
  if (window.mapInstance) {
    window.mapInstance.zoomOut();
  }
};

export default { renderMap, initMainMap };
