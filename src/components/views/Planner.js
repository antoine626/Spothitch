/**
 * Planner View Component
 * Trip planning interface
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { formatDistance, formatDuration } from '../../services/osrm.js';
import { getSavedTrips, getTripById } from '../../services/planner.js';

/**
 * Render the trip planner view
 */
export function renderPlanner(state) {
  const { tripSteps = [], activeTrip, savedTrips = [] } = state;

  return `
    <div class="planner-view pb-24">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-xl font-bold text-white mb-1">${t('planTrip')}</h1>
        <p class="text-gray-400 text-sm">Planifie ton prochain voyage en autostop</p>
      </div>

      <!-- Trip Steps -->
      <div class="p-4 space-y-3">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Étapes</h2>

        <div id="trip-steps" class="space-y-2">
          ${tripSteps.length === 0
    ? `
              <div class="text-center py-8 text-gray-500">
                <span class="text-4xl">🗺️</span>
                <p class="mt-2">Ajoute une ville de départ</p>
              </div>
            `
    : tripSteps.map((step, index) => renderTripStep(step, index, tripSteps.length)).join('')
}
        </div>

        <!-- Add Step Input -->
        <div class="relative">
          <input
            type="text"
            id="step-input"
            placeholder="Ajouter une ville..."
            class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                   placeholder-gray-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            oninput="searchTripCity(this.value)"
            onkeydown="if(event.key==='Enter')addFirstSuggestion()"
          />
          <div id="city-suggestions" class="absolute top-full left-0 right-0 z-10 mt-1 hidden"></div>
        </div>

        ${tripSteps.length >= 2 ? `
          <!-- Calculate Route Button -->
          <button
            onclick="calculateTrip()"
            class="w-full py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white
                   font-semibold rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all"
          >
            Calculer l'itinéraire
          </button>
        ` : ''}

        ${tripSteps.length > 0 ? `
          <button
            onclick="clearTripSteps()"
            class="w-full py-2 text-gray-400 hover:text-white text-sm"
          >
            Effacer tout
          </button>
        ` : ''}
      </div>

      <!-- Active Trip Details -->
      ${activeTrip ? renderActiveTripDetails(activeTrip) : ''}

      <!-- Map Container -->
      ${tripSteps.length >= 2 || activeTrip ? `
        <div class="px-4 mb-4">
          <div id="planner-map" class="h-64 rounded-xl overflow-hidden bg-gray-800"></div>
        </div>
      ` : ''}

      <!-- Saved Trips Section -->
      <div class="p-4 border-t border-gray-700">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          ${t('myTrips')} (${savedTrips.length})
        </h2>

        ${savedTrips.length === 0
    ? `
            <div class="text-center py-6 text-gray-500">
              <span class="text-3xl">📋</span>
              <p class="mt-2 text-sm">${t('noTrips')}</p>
            </div>
          `
    : `
            <div class="space-y-2">
              ${savedTrips.map(trip => renderSavedTripCard(trip)).join('')}
            </div>
          `
}
      </div>
    </div>
  `;
}

/**
 * Render a single trip step
 */
function renderTripStep(step, index, totalSteps) {
  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

  return `
    <div class="trip-step flex items-center gap-3 p-3 bg-gray-800 rounded-xl group">
      <!-- Step indicator -->
      <div class="flex flex-col items-center">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isFirst ? 'bg-green-500 text-white' : isLast ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'}">
          ${isFirst ? '🚀' : isLast ? '🏁' : index}
        </div>
        ${!isLast ? '<div class="w-0.5 h-4 bg-gray-600 mt-1"></div>' : ''}
      </div>

      <!-- Step info -->
      <div class="flex-1 min-w-0">
        <div class="text-white font-medium truncate">${step.name}</div>
        <div class="text-gray-500 text-xs truncate">${step.fullName || ''}</div>
      </div>

      <!-- Actions -->
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        ${index > 0 ? `
          <button onclick="moveTripStep(${index}, ${index - 1})"
                  class="p-1.5 text-gray-400 hover:text-white rounded">
            ↑
          </button>
        ` : ''}
        ${index < totalSteps - 1 ? `
          <button onclick="moveTripStep(${index}, ${index + 1})"
                  class="p-1.5 text-gray-400 hover:text-white rounded">
            ↓
          </button>
        ` : ''}
        <button onclick="removeTripStep(${index})"
                class="p-1.5 text-red-400 hover:text-red-300 rounded">
          ✕
        </button>
      </div>
    </div>
  `;
}

/**
 * Render active trip details
 */
function renderActiveTripDetails(trip) {
  return `
    <div class="active-trip mx-4 mb-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg font-bold text-white">Itinéraire calculé</h3>
        <button onclick="saveCurrentTrip()" class="text-sky-400 hover:text-sky-300 text-sm">
          💾 Sauvegarder
        </button>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">${formatDistance(trip.totalDistance)}</div>
          <div class="text-xs text-gray-500">Distance</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-white">${formatDuration(trip.totalDuration)}</div>
          <div class="text-xs text-gray-500">En voiture</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-white">${trip.estimatedDays}j</div>
          <div class="text-xs text-gray-500">Estimé stop</div>
        </div>
      </div>

      <!-- Spots by leg -->
      ${trip.spotsByLeg ? `
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-gray-400">Spots recommandés</h4>
          ${trip.spotsByLeg.map(leg => `
            <div class="bg-gray-800/50 rounded-lg p-3">
              <div class="text-sm text-gray-300 mb-2">${leg.from} → ${leg.to}</div>
              ${leg.spots.length > 0
    ? `<div class="flex flex-wrap gap-2">
                    ${leg.spots.slice(0, 3).map(spot => `
                      <span class="px-2 py-1 bg-sky-500/20 text-sky-400 text-xs rounded-full cursor-pointer"
                            onclick="selectSpot(${spot.id})">
                        ⭐${spot.globalRating?.toFixed(1) || 'N/A'} ${spot.from}
                      </span>
                    `).join('')}
                  </div>`
    : '<p class="text-gray-500 text-xs">Pas de spots connus sur ce tronçon</p>'
}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render saved trip card
 */
function renderSavedTripCard(trip) {
  const stepNames = trip.steps.map(s => s.name);
  const route = stepNames.length > 2
    ? `${stepNames[0]} → ... → ${stepNames[stepNames.length - 1]}`
    : stepNames.join(' → ');

  return `
    <div class="saved-trip p-3 bg-gray-800 rounded-xl flex items-center gap-3 cursor-pointer
                hover:bg-gray-750 transition-colors"
         onclick="loadSavedTrip('${trip.id}')">
      <div class="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg
                  flex items-center justify-center text-white text-lg">
        🗺️
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-white font-medium truncate">${route}</div>
        <div class="text-gray-500 text-xs">
          ${formatDistance(trip.totalDistance)} • ${trip.steps.length} étapes •
          ${new Date(trip.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button onclick="event.stopPropagation(); deleteSavedTrip('${trip.id}')"
              class="p-2 text-gray-500 hover:text-red-400">
        🗑️
      </button>
    </div>
  `;
}

/**
 * Render saved trip detail page
 */
export function renderSavedTripDetail(tripId) {
  const trip = getTripById(tripId);

  if (!trip) {
    return `
      <div class="text-center py-20 text-gray-500">
        <span class="text-4xl">❌</span>
        <p class="mt-4">Voyage non trouvé</p>
        <button onclick="changeTab('planner')" class="mt-4 text-sky-400 hover:text-sky-300">
          Retour au planificateur
        </button>
      </div>
    `;
  }

  return `
    <div class="trip-detail pb-24">
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900/95 backdrop-blur z-10 border-b border-gray-700">
        <div class="flex items-center gap-3 p-4">
          <button onclick="changeTab('planner')" class="p-2 hover:bg-gray-800 rounded-full">
            ←
          </button>
          <div class="flex-1">
            <h1 class="text-lg font-bold text-white">Détails du voyage</h1>
            <p class="text-gray-500 text-xs">Créé le ${new Date(trip.createdAt).toLocaleDateString()}</p>
          </div>
          <button onclick="deleteSavedTrip('${trip.id}')" class="p-2 text-red-400 hover:bg-gray-800 rounded-full">
            🗑️
          </button>
        </div>
      </div>

      <!-- Map -->
      <div id="trip-detail-map" class="h-48 bg-gray-800"></div>

      <!-- Stats -->
      <div class="p-4 grid grid-cols-3 gap-4 border-b border-gray-700">
        <div class="text-center">
          <div class="text-xl font-bold text-white">${formatDistance(trip.totalDistance)}</div>
          <div class="text-xs text-gray-500">Distance totale</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-white">${trip.steps.length}</div>
          <div class="text-xs text-gray-500">Étapes</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-white">${trip.estimatedDays}j</div>
          <div class="text-xs text-gray-500">Durée estimée</div>
        </div>
      </div>

      <!-- Steps List -->
      <div class="p-4">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Étapes</h2>
        <div class="space-y-2">
          ${trip.steps.map((step, i) => `
            <div class="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${i === 0 ? 'bg-green-500' : i === trip.steps.length - 1 ? 'bg-red-500' : 'bg-gray-600'}">
                ${i === 0 ? '🚀' : i === trip.steps.length - 1 ? '🏁' : i}
              </div>
              <div class="flex-1">
                <div class="text-white font-medium">${step.name}</div>
                <div class="text-gray-500 text-xs">${step.fullName || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recommended Spots -->
      ${trip.spotsByLeg ? `
        <div class="p-4 border-t border-gray-700">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Spots recommandés
          </h2>
          <div class="space-y-4">
            ${trip.spotsByLeg.map(leg => `
              <div>
                <div class="text-sm text-gray-400 mb-2">${leg.from} → ${leg.to}</div>
                <div class="grid grid-cols-1 gap-2">
                  ${leg.spots.slice(0, 3).map(spot => `
                    <div class="flex items-center gap-3 p-2 bg-gray-800 rounded-lg cursor-pointer
                                hover:bg-gray-750"
                         onclick="selectSpot(${spot.id})">
                      <img src="${spot.photoUrl}" alt="" class="w-12 h-12 rounded-lg object-cover" loading="lazy" />
                      <div class="flex-1">
                        <div class="text-white text-sm">${spot.from}</div>
                        <div class="text-gray-500 text-xs">⭐${spot.globalRating?.toFixed(1)} • ${spot.avgWaitTime}min</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="p-4">
        <button onclick="shareTrip('${trip.id}')"
                class="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600">
          Partager ce voyage
        </button>
      </div>
    </div>
  `;
}

export default {
  renderPlanner,
  renderSavedTripDetail,
};
