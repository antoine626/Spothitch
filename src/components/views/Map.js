/**
 * Map View Component (New Home)
 * Full-screen map with search, scores, add button, and guide indicator
 */

import { t } from '../../i18n/index.js';
import { countryGuides, getGuideByCode } from '../../data/guides.js';
import { renderSpotOfTheDayCompact } from '../SpotOfTheDay.js';

export function renderMap(state) {
  // Get current country from search or map center
  const currentCountry = state.searchCountry || null;
  const currentGuide = currentCountry ? getGuideByCode(currentCountry.toUpperCase()) : null;
  const hasGuide = !!currentGuide;

  return `
    <div class="h-full flex flex-col relative" style="height: calc(100vh - 130px);">
      <!-- Search Bar -->
      <div class="absolute top-2 left-2 right-2 z-20 flex gap-2">
        <div class="flex-1 relative">
          <input
            type="text"
            id="map-search"
            placeholder="Rechercher un lieu..."
            class="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            onkeydown="if(event.key==='Enter') searchLocation(this.value)"
            aria-label="Rechercher un lieu sur la carte"
          />
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
        </div>
        <button
          onclick="openFilters()"
          class="px-4 py-3 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-slate-400 hover:text-white hover:border-primary-500/50 transition-all"
          aria-label="Filtrer les spots"
          title="Filtres"
        >
          <i class="fas fa-sliders-h" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Mini Score Bar -->
      <div class="absolute top-16 left-2 right-2 z-20">
        <div class="flex justify-center gap-2">
          <button
            onclick="openStats()"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm hover:border-primary-500/50 transition-all"
            aria-label="Voir mes statistiques"
          >
            <span class="text-amber-400">🏆</span>
            <span class="font-bold text-white">${state.points || 0}</span>
            <span class="text-slate-400 text-xs">pts</span>
          </button>
          <button
            onclick="openStats()"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm hover:border-primary-500/50 transition-all"
            aria-label="Voir mon niveau"
          >
            <span class="text-primary-400">⭐</span>
            <span class="font-bold text-white">Niv. ${state.level || 1}</span>
          </button>
          ${state.streak > 0 ? `
            <button
              onclick="openStats()"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm hover:border-primary-500/50 transition-all"
              aria-label="Série de ${state.streak} jours"
            >
              <span class="text-orange-400">🔥</span>
              <span class="font-bold text-white">${state.streak}j</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Map Container -->
      <div id="main-map" class="flex-1 w-full bg-dark-secondary"></div>

      <!-- Country Guide Indicator (shows when a guide is available) -->
      <div id="guide-indicator" class="absolute bottom-20 left-4 z-20 ${hasGuide ? '' : 'hidden'}">
        <button
          onclick="openCountryGuide('${currentGuide?.code || ''}')"
          class="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/90 backdrop-blur text-white font-medium shadow-lg hover:bg-emerald-600 transition-all animate-guide-blink"
          aria-label="Voir le guide du pays"
        >
          <span class="text-xl">${currentGuide?.flag || '🌍'}</span>
          <div class="text-left">
            <div class="text-xs opacity-80">Guide disponible</div>
            <div class="font-bold">${currentGuide?.name || 'Pays'}</div>
          </div>
          <i class="fas fa-chevron-right ml-2" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Map Controls (Zoom + Location) -->
      <div class="absolute left-4 bottom-32 z-20 flex flex-col gap-2">
        <button
          onclick="mapZoomIn()"
          class="w-11 h-11 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-dark-secondary hover:border-primary-500/50 transition-all"
          aria-label="Zoomer"
          title="Zoom +"
        >
          <i class="fas fa-plus" aria-hidden="true"></i>
        </button>
        <button
          onclick="mapZoomOut()"
          class="w-11 h-11 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-white flex items-center justify-center hover:bg-dark-secondary hover:border-primary-500/50 transition-all"
          aria-label="Dézoomer"
          title="Zoom -"
        >
          <i class="fas fa-minus" aria-hidden="true"></i>
        </button>
        <button
          onclick="centerOnUser()"
          class="w-11 h-11 rounded-xl bg-dark-secondary/95 backdrop-blur border border-white/10 text-primary-400 flex items-center justify-center hover:bg-dark-secondary hover:border-primary-500/50 transition-all"
          aria-label="Ma position"
          title="Ma position"
        >
          <i class="fas fa-location-crosshairs" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Add Spot FAB -->
      <button
        onclick="openAddSpot()"
        class="absolute bottom-32 right-4 z-20 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center text-xl hover:bg-primary-600 hover:scale-110 transition-all"
        aria-label="Ajouter un nouveau spot"
        title="Ajouter un spot"
      >
        <i class="fas fa-plus" aria-hidden="true"></i>
      </button>

      <!-- Spot of the Day -->
      <div class="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md">
        ${renderSpotOfTheDayCompact(state)}
      </div>

      <!-- Spots count -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div class="px-4 py-2 rounded-full bg-dark-secondary/90 backdrop-blur border border-white/10 text-sm" aria-live="polite">
          <span class="text-primary-400 font-bold">${state.spots?.length || 0}</span>
          <span class="text-slate-400"> spots disponibles</span>
        </div>
      </div>
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
          <i class="fas fa-map-marked-alt text-5xl mb-4 text-primary-400"></i>
          <p>Carte en chargement...</p>
        </div>
      </div>
    `;
  });
}

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

      // Map country name to code
      const countryMap = {
        'France': 'fr', 'Germany': 'de', 'Deutschland': 'de', 'Spain': 'es', 'España': 'es',
        'Italy': 'it', 'Italia': 'it', 'Netherlands': 'nl', 'Nederland': 'nl',
        'Belgium': 'be', 'Belgique': 'be', 'België': 'be', 'Portugal': 'pt',
        'Austria': 'at', 'Österreich': 'at', 'Switzerland': 'ch', 'Schweiz': 'ch', 'Suisse': 'ch',
        'Ireland': 'ie', 'Poland': 'pl', 'Polska': 'pl', 'Czech Republic': 'cz', 'Czechia': 'cz',
        'United Kingdom': 'uk', 'UK': 'uk'
      };

      const countryCode = countryMap[countryName] || null;

      // Update state with search country
      if (window.setState) {
        window.setState({ searchCountry: countryCode });
      }

      // Show/hide guide indicator
      const guideIndicator = document.getElementById('guide-indicator');
      if (guideIndicator) {
        const guide = countryCode ? getGuideByCode(countryCode.toUpperCase()) : null;
        if (guide) {
          guideIndicator.classList.remove('hidden');
          guideIndicator.querySelector('button').onclick = () => window.openCountryGuide(guide.code);
          guideIndicator.querySelector('.text-xl').textContent = guide.flag;
          guideIndicator.querySelector('.font-bold').textContent = guide.name;
        } else {
          guideIndicator.classList.add('hidden');
        }
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
        window.showError('Lieu non trouvé');
      }
    }
  } catch (error) {
    console.error('Search failed:', error);
    if (window.showError) {
      window.showError('Erreur de recherche');
    }
  }
};

// Open country guide
window.openCountryGuide = (countryCode) => {
  if (window.setState) {
    window.setState({
      selectedCountryGuide: countryCode,
      activeSubTab: 'guides'
    });
    window.changeTab?.('travel');
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
