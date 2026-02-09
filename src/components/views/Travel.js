/**
 * Travel View Component
 * Combines Trip Planner and Country Guides
 */

import { t } from '../../i18n/index.js'
import { countryGuides, getGuideByCode } from '../../data/guides.js'
import { renderCommunityTips } from '../../services/communityTips.js'
import { renderHostelSection } from '../../services/hostelRecommendations.js'

export function renderTravel(state) {
  const activeSubTab = state.activeSubTab || 'planner';
  const selectedGuide = state.selectedCountryGuide ? getGuideByCode(state.selectedCountryGuide) : null;

  return `
    <div class="p-4 space-y-4">
      <!-- Sub-tabs -->
      <div class="flex gap-2 p-1 bg-dark-secondary rounded-xl">
        <button
          onclick="setSubTab('planner')"
          class="flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
  activeSubTab === 'planner'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
          aria-selected="${activeSubTab === 'planner'}"
        >
          <i class="fas fa-route mr-2" aria-hidden="true"></i>
          Planifier
        </button>
        <button
          onclick="setSubTab('guides')"
          class="flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
  activeSubTab === 'guides'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
          aria-selected="${activeSubTab === 'guides'}"
        >
          <i class="fas fa-book mr-2" aria-hidden="true"></i>
          Guides
        </button>
      </div>

      <!-- Content -->
      ${activeSubTab === 'planner' ? renderPlanner(state) : renderGuides(state, selectedGuide)}
    </div>
  `;
}

function renderPlanner(state) {
  const savedTrips = state.savedTrips || [];

  return `
    <div class="space-y-4">
      <!-- New Trip Form -->
      <div class="card p-4 space-y-4">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <i class="fas fa-map-signs text-primary-400" aria-hidden="true"></i>
          Nouveau voyage
        </h3>

        <div class="space-y-3">
          <div>
            <label for="trip-from" class="block text-sm text-slate-400 mb-1">Point de départ</label>
            <div class="relative">
              <input
                type="text"
                id="trip-from"
                placeholder="Paris, France"
                class="input-field w-full pl-10"
                value="${state.tripFrom || ''}"
                onblur="updateTripField('from', this.value)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();updateTripField('from',this.value);document.getElementById('trip-to')?.focus()}"
              />
              <i class="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" aria-hidden="true"></i>
            </div>
          </div>

          <div class="flex justify-center">
            <button
              onclick="swapTripPoints()"
              class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Inverser départ et arrivée"
            >
              <i class="fas fa-exchange-alt rotate-90" aria-hidden="true"></i>
            </button>
          </div>

          <div>
            <label for="trip-to" class="block text-sm text-slate-400 mb-1">Destination</label>
            <div class="relative">
              <input
                type="text"
                id="trip-to"
                placeholder="Berlin, Allemagne"
                class="input-field w-full pl-10"
                value="${state.tripTo || ''}"
                onblur="updateTripField('to', this.value)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();updateTripField('to',this.value);calculateTrip()}"
              />
              <i class="fas fa-flag-checkered absolute left-3 top-1/2 -translate-y-1/2 text-danger-400" aria-hidden="true"></i>
            </div>
          </div>
        </div>

        <button
          onclick="syncTripFieldsAndCalculate()"
          class="btn-primary w-full py-3"
        >
          <i class="fas fa-search mr-2" aria-hidden="true"></i>
          Trouver les spots sur le trajet
        </button>
      </div>

      <!-- Trip Results (if calculated) -->
      ${state.tripResults ? renderTripResults(state.tripResults) : ''}

      <!-- Saved Trips -->
      ${savedTrips.length > 0 ? `
        <div class="space-y-3">
          <h3 class="font-bold text-lg flex items-center gap-2">
            <i class="fas fa-bookmark text-amber-400" aria-hidden="true"></i>
            Voyages sauvegardés
          </h3>

          ${savedTrips.map((trip, index) => `
            <button
              onclick="loadTrip(${index})"
              class="card p-4 w-full text-left hover:border-primary-500/50 transition-all"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <i class="fas fa-route text-primary-400" aria-hidden="true"></i>
                  </div>
                  <div>
                    <div class="font-medium">${trip.from} → ${trip.to}</div>
                    <div class="text-sm text-slate-400">${trip.spots?.length || 0} spots • ${trip.distance || '?'} km</div>
                  </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
              </div>
            </button>
          `).join('')}
        </div>
      ` : `
        <div class="card p-6 text-center">
          <i class="fas fa-route text-4xl text-slate-600 mb-3" aria-hidden="true"></i>
          <p class="text-slate-400">Aucun voyage sauvegardé</p>
          <p class="text-sm text-slate-500 mt-1">Planifiez votre premier voyage !</p>
        </div>
      `}
    </div>
  `;
}

function renderTripResults(results) {
  return `
    <div class="card p-4 space-y-4 border-primary-500/30">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-primary-400">
          <i class="fas fa-check-circle mr-2" aria-hidden="true"></i>
          ${results.spots?.length || 0} spots trouvés
        </h4>
        <button
          onclick="saveCurrentTrip()"
          class="text-sm text-amber-400 hover:text-amber-300"
        >
          <i class="fas fa-bookmark mr-1" aria-hidden="true"></i>
          Sauvegarder
        </button>
      </div>

      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-2">
          <i class="fas fa-road text-slate-400" aria-hidden="true"></i>
          <span>${results.distance || '?'} km</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-clock text-slate-400" aria-hidden="true"></i>
          <span>~${results.estimatedTime || '?'}</span>
        </div>
      </div>

      <!-- Countries on route with guides -->
      ${results.countries && results.countries.length > 0 ? `
        <div class="flex flex-wrap gap-2">
          ${results.countries.map(code => {
    const guide = getGuideByCode(code);
    return guide ? `
              <button
                onclick="setSubTab('guides'); selectGuide('${code}')"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-all"
              >
                <span>${guide.flag}</span>
                <span>${guide.name}</span>
                <i class="fas fa-book text-xs" aria-hidden="true"></i>
              </button>
            ` : '';
  }).join('')}
        </div>
      ` : ''}

      <!-- Spots list preview -->
      <div class="space-y-2 max-h-60 overflow-y-auto">
        ${(results.spots || []).slice(0, 10).map(spot => `
          <button
            onclick="openSpotDetail('${spot.id}')"
            class="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-sm">
              📍
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">${spot.name}</div>
              <div class="text-xs text-slate-400">${spot.city}, ${spot.country}</div>
            </div>
            <div class="flex items-center gap-1 text-amber-400 text-sm">
              <i class="fas fa-star" aria-hidden="true"></i>
              ${spot.globalRating?.toFixed(1) || '?'}
            </div>
            <i class="fas fa-chevron-right text-slate-500 text-xs" aria-hidden="true"></i>
          </button>
        `).join('')}
        ${(results.spots?.length || 0) > 10 ? `
          <p class="text-center text-sm text-slate-400 py-2">
            +${results.spots.length - 10} autres spots
          </p>
        ` : ''}
      </div>

      <button
        onclick="viewTripOnMap()"
        class="btn-secondary w-full"
      >
        <i class="fas fa-map mr-2" aria-hidden="true"></i>
        Voir sur la carte
      </button>
    </div>

    <!-- Hostel Recommendations -->
    ${results.to ? renderHostelSection(results.to) : ''}
  `;
}

function renderGuides(state, selectedGuide) {
  if (selectedGuide) {
    return renderGuideDetail(selectedGuide);
  }

  // Sort guides by difficulty
  const sortedGuides = [...countryGuides].sort((a, b) => a.difficulty - b.difficulty);

  return `
    <div class="space-y-4">
      <!-- Search -->
      <div class="relative">
        <input
          type="text"
          placeholder="Rechercher un pays..."
          class="input-field w-full pl-10"
          oninput="filterGuides(this.value)"
          aria-label="Rechercher un pays"
        />
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-2 text-xs">
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
          <i class="fas fa-smile" aria-hidden="true"></i> Très facile
        </span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/20 text-primary-400">
          <i class="fas fa-meh" aria-hidden="true"></i> Facile
        </span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
          <i class="fas fa-frown" aria-hidden="true"></i> Moyen
        </span>
      </div>

      <!-- Countries Grid -->
      <div id="guides-list" class="grid grid-cols-2 gap-3">
        ${sortedGuides.map(guide => `
          <button
            onclick="selectGuide('${guide.code}')"
            class="card p-4 text-left hover:border-primary-500/50 transition-all guide-card"
            data-country="${guide.name.toLowerCase()} ${(guide.nameEn || '').toLowerCase()}"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">${guide.flag}</span>
              <div>
                <div class="font-bold">${guide.name}</div>
                <div class="text-xs ${
  guide.difficulty === 1 ? 'text-emerald-400' :
    guide.difficulty === 2 ? 'text-primary-400' : 'text-amber-400'
}">${guide.difficultyText}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <i class="fas fa-clock" aria-hidden="true"></i>
              <span>~${guide.avgWaitTime} min</span>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderGuideDetail(guide) {
  const difficultyColors = {
    1: 'text-emerald-400 bg-emerald-500/20',
    2: 'text-primary-400 bg-primary-500/20',
    3: 'text-amber-400 bg-amber-500/20',
  };

  return `
    <div class="space-y-4">
      <!-- Back button -->
      <button
        onclick="selectGuide(null)"
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-all"
      >
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        Retour aux guides
      </button>

      <!-- Header -->
      <div class="card p-6 text-center">
        <span class="text-6xl mb-4 block">${guide.flag}</span>
        <h2 class="text-2xl font-bold mb-2">${guide.name}</h2>
        <div class="flex justify-center gap-3">
          <span class="px-3 py-1 rounded-full text-sm ${difficultyColors[guide.difficulty]}">
            ${guide.difficultyText}
          </span>
          <span class="px-3 py-1 rounded-full text-sm bg-white/10 text-slate-300">
            ~${guide.avgWaitTime} min d'attente
          </span>
        </div>
      </div>

      <!-- Legality -->
      <div class="card p-4">
        <h3 class="font-bold mb-2 flex items-center gap-2">
          <i class="fas fa-gavel text-primary-400" aria-hidden="true"></i>
          Légalité
        </h3>
        <p class="text-slate-300">${guide.legalityText}</p>
      </div>

      <!-- Tips -->
      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          <i class="fas fa-lightbulb text-amber-400" aria-hidden="true"></i>
          Conseils
        </h3>
        <ul class="space-y-2">
          ${guide.tips.map(tip => `
            <li class="flex items-start gap-2">
              <i class="fas fa-check text-emerald-400 mt-1" aria-hidden="true"></i>
              <span class="text-slate-300">${tip}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Best Months -->
      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          <i class="fas fa-calendar text-purple-400" aria-hidden="true"></i>
          Meilleurs mois
        </h3>
        <div class="flex flex-wrap gap-2">
          ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, i) => `
            <span class="px-3 py-1 rounded-full text-sm ${
  guide.bestMonths.includes(i + 1)
    ? 'bg-emerald-500/20 text-emerald-400'
    : 'bg-white/5 text-slate-500'
}">${month}</span>
          `).join('')}
        </div>
      </div>

      <!-- Best Spots -->
      ${guide.bestSpots && guide.bestSpots.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            <i class="fas fa-map-marker-alt text-danger-400" aria-hidden="true"></i>
            Meilleurs spots
          </h3>
          <div class="space-y-2">
            ${guide.bestSpots.map(spot => `
              <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <i class="fas fa-thumbs-up text-primary-400" aria-hidden="true"></i>
                <span class="text-slate-300">${spot}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Emergency Numbers -->
      <div class="card p-4 border-danger-500/30">
        <h3 class="font-bold mb-3 flex items-center gap-2 text-danger-400">
          <i class="fas fa-phone-alt" aria-hidden="true"></i>
          Numéros d'urgence
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="text-center p-3 rounded-lg bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Police</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.police}</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Ambulance</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.ambulance}</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Pompiers</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.fire}</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-emerald-500/10">
            <div class="text-xs text-slate-400 mb-1">Monde</div>
            <div class="font-bold text-lg text-emerald-400">${guide.emergencyNumbers.european}</div>
          </div>
        </div>
      </div>

      ${renderCommunityTips(guide.code)}
    </div>
  `;
}

// Global handlers
window.setSubTab = (tab) => {
  window.setState?.({ activeSubTab: tab });
};

window.selectGuide = (code) => {
  window.setState?.({ selectedCountryGuide: code });
};

window.filterGuides = (query) => {
  const cards = document.querySelectorAll('.guide-card');
  const lowerQuery = query.toLowerCase();
  cards.forEach(card => {
    const country = card.dataset.country || '';
    card.style.display = country.includes(lowerQuery) ? '' : 'none';
  });
};

window.updateTripField = (field, value) => {
  if (field === 'from') {
    window.setState?.({ tripFrom: value });
  } else {
    window.setState?.({ tripTo: value });
  }
};

window.syncTripFieldsAndCalculate = () => {
  const fromInput = document.getElementById('trip-from');
  const toInput = document.getElementById('trip-to');
  const from = fromInput?.value?.trim() || '';
  const to = toInput?.value?.trim() || '';
  if (!from || !to) {
    window.showToast?.('Remplis le départ et la destination', 'warning');
    return;
  }
  window.setState?.({ tripFrom: from, tripTo: to });
  window.calculateTrip?.();
};

window.swapTripPoints = () => {
  const state = window.getState?.() || {};
  window.setState?.({
    tripFrom: state.tripTo || '',
    tripTo: state.tripFrom || ''
  });
};

window.calculateTrip = async () => {
  const state = window.getState?.() || {};
  if (!state.tripFrom || !state.tripTo) return;

  window.showToast?.('Calcul du trajet...', 'info');

  try {
    // Geocode both points
    const [fromResult, toResult] = await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(state.tripFrom)}&limit=1`).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(state.tripTo)}&limit=1`).then(r => r.json())
    ]);

    if (!fromResult[0] || !toResult[0]) {
      window.showError?.('Lieu non trouvé');
      return;
    }

    const fromCoords = [parseFloat(fromResult[0].lat), parseFloat(fromResult[0].lon)];
    const toCoords = [parseFloat(toResult[0].lat), parseFloat(toResult[0].lon)];

    // Find spots near the route (simplified - just spots between lat/lon)
    const spots = state.spots?.filter(spot => {
      const lat = spot.coordinates?.[0] || spot.lat;
      const lon = spot.coordinates?.[1] || spot.lng;
      if (!lat || !lon) return false;

      const minLat = Math.min(fromCoords[0], toCoords[0]) - 0.5;
      const maxLat = Math.max(fromCoords[0], toCoords[0]) + 0.5;
      const minLon = Math.min(fromCoords[1], toCoords[1]) - 0.5;
      const maxLon = Math.max(fromCoords[1], toCoords[1]) + 0.5;

      return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    }) || [];

    // Calculate approximate distance
    const R = 6371;
    const dLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180;
    const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(fromCoords[0] * Math.PI / 180) * Math.cos(toCoords[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = Math.round(R * c);

    // Detect countries
    const countries = [];
    const fromCountry = fromResult[0].display_name.split(',').pop().trim();
    const toCountry = toResult[0].display_name.split(',').pop().trim();

    const countryMap = {
      'France': 'FR', 'Germany': 'DE', 'Deutschland': 'DE', 'Spain': 'ES', 'España': 'ES',
      'Italy': 'IT', 'Italia': 'IT', 'Netherlands': 'NL', 'Nederland': 'NL',
      'Belgium': 'BE', 'Belgique': 'BE', 'België': 'BE', 'Portugal': 'PT',
      'Austria': 'AT', 'Österreich': 'AT', 'Switzerland': 'CH', 'Schweiz': 'CH', 'Suisse': 'CH',
      'Ireland': 'IE', 'Poland': 'PL', 'Polska': 'PL', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
    };

    if (countryMap[fromCountry]) countries.push(countryMap[fromCountry]);
    if (countryMap[toCountry] && !countries.includes(countryMap[toCountry])) {
      countries.push(countryMap[toCountry]);
    }

    // Estimate time (60km/h average for hitchhiking)
    const hours = Math.ceil(distance / 60);
    const estimatedTime = hours > 24 ? `${Math.ceil(hours/24)} jours` : `${hours}h`;

    window.setState?.({
      tripResults: {
        from: state.tripFrom,
        to: state.tripTo,
        fromCoords,
        toCoords,
        spots,
        distance,
        estimatedTime,
        countries
      }
    });

    window.showSuccess?.(`${spots.length} spots trouvés !`);
  } catch (error) {
    console.error('Trip calculation failed:', error);
    window.showError?.('Erreur de calcul');
  }
};

window.saveCurrentTrip = () => {
  const state = window.getState?.() || {};
  if (!state.tripResults) return;

  const savedTrips = state.savedTrips || [];
  savedTrips.push(state.tripResults);
  window.setState?.({ savedTrips });
  window.showSuccess?.('Voyage sauvegardé !');
};

window.loadTrip = (index) => {
  const state = window.getState?.() || {};
  const trip = state.savedTrips?.[index];
  if (trip) {
    window.setState?.({
      tripFrom: trip.from,
      tripTo: trip.to,
      tripResults: trip
    });
  }
};

window.viewTripOnMap = async () => {
  const state = window.getState?.() || {}
  if (!state.tripResults?.fromCoords || !state.tripResults?.toCoords) return

  // Store trip route for map to pick up
  window.setState?.({
    activeTab: 'map',
    pendingTripRoute: {
      from: state.tripResults.fromCoords,
      to: state.tripResults.toCoords,
      spots: state.tripResults.spots || []
    }
  })

  // Wait for map to init then draw route + spot markers
  setTimeout(async () => {
    if (!window.mapInstance) return
    try {
      const L = await import('leaflet')
      const from = state.tripResults.fromCoords
      const to = state.tripResults.toCoords

      // Draw simple straight line between points
      const routeCoords = [[from[1], from[0]], [to[1], to[0]]]
      const { drawRoute } = await import('../../services/map.js')
      drawRoute(window.mapInstance, L.default, routeCoords)

      // Remove old trip markers if any
      if (window._tripMarkers) {
        window._tripMarkers.forEach(m => window.mapInstance.removeLayer(m))
      }
      window._tripMarkers = []

      // Add start marker (A)
      const markerA = L.default.marker(from, {
        icon: L.default.divIcon({
          className: 'custom-marker',
          html: '<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">A</div>',
          iconSize: [32, 32], iconAnchor: [16, 32]
        })
      }).addTo(window.mapInstance)
      window._tripMarkers.push(markerA)

      // Add end marker (B)
      const markerB = L.default.marker(to, {
        icon: L.default.divIcon({
          className: 'custom-marker',
          html: '<div class="w-8 h-8 rounded-full bg-danger-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">B</div>',
          iconSize: [32, 32], iconAnchor: [16, 32]
        })
      }).addTo(window.mapInstance)
      window._tripMarkers.push(markerB)

      // Add spot markers along the route
      const spots = state.tripResults.spots || []
      spots.forEach(spot => {
        const lat = spot.coordinates?.[0] || spot.lat
        const lng = spot.coordinates?.[1] || spot.lng
        if (!lat || !lng) return

        const rating = spot.globalRating?.toFixed(1) || '?'
        const marker = L.default.marker([lat, lng], {
          icon: L.default.divIcon({
            className: 'custom-marker',
            html: `<div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white/30 cursor-pointer">${rating}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 28]
          })
        }).addTo(window.mapInstance)

        marker.on('click', () => {
          window.openSpotDetail?.(spot.id)
        })

        marker.bindTooltip(spot.name || 'Spot', {
          direction: 'top',
          offset: [0, -12],
          className: 'spot-tooltip'
        })

        window._tripMarkers.push(marker)
      })

      // Fit map to show all markers
      const allPoints = [from, to, ...spots.map(s => [
        s.coordinates?.[0] || s.lat,
        s.coordinates?.[1] || s.lng
      ]).filter(p => p[0] && p[1])]
      if (allPoints.length > 1) {
        window.mapInstance.fitBounds(allPoints, { padding: [40, 40] })
      }

    } catch (e) {
      console.error('Failed to draw trip route:', e)
    }
  }, 500)
}

export default { renderTravel };
