/**
 * Planner View Component
 * Trip planning interface
 */

import { t } from '../../i18n/index.js';
import { formatDistance, formatDuration } from '../../services/osrm.js';
import { getTripById } from '../../services/planner.js';

/**
 * Render the trip planner view
 */
export function renderPlanner(state) {
  const { tripSteps = [], activeTrip, savedTrips = [] } = state;

  return `
    <div class="planner-view pb-28 overflow-x-hidden">
      <!-- Header -->
      <div class="p-5 border-b border-white/10">
        <h1 class="text-xl font-bold text-white mb-2">${t('planTrip')}</h1>
        <p class="text-slate-400 text-sm">${t('planNextTrip') || 'Planifie ton prochain voyage en autostop'}</p>
      </div>

      <!-- Trip Steps -->
      <div class="p-5 space-y-4">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">${t('steps') || 'Étapes'}</h2>

        <div id="trip-steps" class="space-y-2">
          ${tripSteps.length === 0
    ? `
              <div class="text-center py-8 text-slate-400">
                <span class="text-4xl">🗺️</span>
                <p class="mt-2">${t('addStartCity') || 'Ajoute une ville de départ'}</p>
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
            placeholder="${t('addCity') || 'Ajouter une ville...'}"
            class="w-full bg-dark-secondary border border-white/10 rounded-xl px-4 py-3 text-white
                   placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            oninput="searchTripCity(this.value)"
            onkeydown="if(event.key==='Enter')addFirstSuggestion()"
          />
          <div id="city-suggestions" class="absolute top-full left-0 right-0 z-10 mt-1 hidden"></div>
        </div>

        ${tripSteps.length >= 2 ? `
          <!-- Calculate Route Button -->
          <button
            onclick="calculateTrip()"
            class="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white
                   font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors"
          >
            ${t('calculateRoute') || 'Calculer l\'itinéraire'}
          </button>
        ` : ''}

        ${tripSteps.length > 0 ? `
          <button
            onclick="clearTripSteps()"
            class="w-full py-2 text-slate-400 hover:text-white text-sm"
          >
            ${t('clearAll') || 'Effacer tout'}
          </button>
        ` : ''}
      </div>

      <!-- Active Trip Details -->
      ${activeTrip ? renderActiveTripDetails(activeTrip) : ''}

      <!-- Map Container -->
      ${tripSteps.length >= 2 || activeTrip ? `
        <div class="px-4 mb-4">
          <div id="planner-map" class="h-64 rounded-xl overflow-hidden bg-dark-secondary"></div>
        </div>
      ` : ''}

      <!-- Saved Trips Section -->
      <div class="p-5 border-t border-white/10">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          ${t('myTrips')} (${savedTrips.length})
        </h2>

        ${savedTrips.length === 0
    ? `
            <div class="text-center py-6 text-slate-400">
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
    <div class="trip-step flex items-center gap-3 p-3 bg-dark-secondary rounded-xl group">
      <!-- Step indicator -->
      <div class="flex flex-col items-center">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isFirst ? 'bg-green-500 text-white' : isLast ? 'bg-red-500 text-white' : 'bg-dark-secondary text-slate-300'}">
          ${isFirst ? '🚀' : isLast ? '🏁' : index}
        </div>
        ${!isLast ? '<div class="w-0.5 h-4 bg-dark-secondary mt-1"></div>' : ''}
      </div>

      <!-- Step info -->
      <div class="flex-1 min-w-0">
        <div class="text-white font-medium truncate">${step.name}</div>
        <div class="text-slate-400 text-xs truncate">${step.fullName || ''}</div>
      </div>

      <!-- Actions -->
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        ${index > 0 ? `
          <button onclick="moveTripStep(${index}, ${index - 1})"
                  class="p-1.5 text-slate-400 hover:text-white rounded">
            ↑
          </button>
        ` : ''}
        ${index < totalSteps - 1 ? `
          <button onclick="moveTripStep(${index}, ${index + 1})"
                  class="p-1.5 text-slate-400 hover:text-white rounded">
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
    <div class="active-trip mx-5 mb-5 p-5 bg-gradient-to-br from-dark-secondary to-dark-primary rounded-xl border border-white/10">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg font-bold text-white">Itinéraire calculé</h3>
        <button onclick="saveCurrentTrip()" class="text-amber-400 hover:text-amber-300 text-sm">
          💾 Sauvegarder
        </button>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-5">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">${formatDistance(trip.totalDistance)}</div>
          <div class="text-xs text-slate-400">Distance</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-white">${formatDuration(trip.totalDuration)}</div>
          <div class="text-xs text-slate-400">En voiture</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-white">${trip.estimatedDays}j</div>
          <div class="text-xs text-slate-400">Estimé stop</div>
        </div>
      </div>

      <!-- Spots by leg -->
      ${trip.spotsByLeg ? `
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-slate-400">Spots recommandés</h4>
          ${trip.spotsByLeg.map(leg => `
            <div class="bg-dark-secondary/50 rounded-xl p-3">
              <div class="text-sm text-slate-300 mb-2">${leg.from} → ${leg.to}</div>
              ${leg.spots.length > 0
    ? `<div class="flex flex-wrap gap-2">
                    ${leg.spots.slice(0, 3).map(spot => `
                      <span class="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full cursor-pointer"
                            onclick="selectSpot(${spot.id})">
                        ✓${spot.userValidations || 0} ${spot.from}
                      </span>
                    `).join('')}
                  </div>`
    : `<p class="text-slate-400 text-xs">${t('noKnownSpots') || 'No known spots on this section'}</p>`
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
    <div class="saved-trip p-3 bg-dark-secondary rounded-xl flex items-center gap-3 cursor-pointer
                hover:bg-white/10 transition-colors"
         onclick="loadSavedTrip('${trip.id}')">
      <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl
                  flex items-center justify-center text-white text-lg">
        🗺️
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-white font-medium truncate">${route}</div>
        <div class="text-slate-400 text-xs">
          ${formatDistance(trip.totalDistance)} • ${trip.steps.length} étapes •
          ${new Date(trip.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button onclick="event.stopPropagation(); deleteSavedTrip('${trip.id}')"
              class="p-2 text-slate-400 hover:text-red-400">
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
      <div class="text-center py-20 text-slate-400">
        <span class="text-4xl">❌</span>
        <p class="mt-4">Voyage non trouvé</p>
        <button onclick="changeTab('planner')" class="mt-4 text-amber-400 hover:text-amber-300">
          Retour au planificateur
        </button>
      </div>
    `;
  }

  return `
    <div class="trip-detail pb-28">
      <!-- Header -->
      <div class="sticky top-0 bg-dark-primary/80 backdrop-blur-xl z-10 border-b border-white/10">
        <div class="flex items-center gap-3 p-4">
          <button onclick="changeTab('planner')" class="p-2 hover:bg-dark-secondary rounded-full">
            ←
          </button>
          <div class="flex-1">
            <h1 class="text-lg font-bold text-white">Détails du voyage</h1>
            <p class="text-slate-400 text-xs">Créé le ${new Date(trip.createdAt).toLocaleDateString()}</p>
          </div>
          <button onclick="deleteSavedTrip('${trip.id}')" class="p-2 text-red-400 hover:bg-dark-secondary rounded-full">
            🗑️
          </button>
        </div>
      </div>

      <!-- Map -->
      <div id="trip-detail-map" class="h-48 bg-dark-secondary"></div>

      <!-- Stats -->
      <div class="p-5 grid grid-cols-3 gap-4 border-b border-white/10">
        <div class="text-center">
          <div class="text-xl font-bold text-white">${formatDistance(trip.totalDistance)}</div>
          <div class="text-xs text-slate-400">Distance totale</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-white">${trip.steps.length}</div>
          <div class="text-xs text-slate-400">Étapes</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-white">${trip.estimatedDays}j</div>
          <div class="text-xs text-slate-400">Durée estimée</div>
        </div>
      </div>

      <!-- Steps List -->
      <div class="p-4">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Étapes</h2>
        <div class="space-y-2">
          ${trip.steps.map((step, i) => `
            <div class="flex items-center gap-3 p-3 bg-dark-secondary rounded-xl">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${i === 0 ? 'bg-green-500' : i === trip.steps.length - 1 ? 'bg-red-500' : 'bg-dark-secondary'}">
                ${i === 0 ? '🚀' : i === trip.steps.length - 1 ? '🏁' : i}
              </div>
              <div class="flex-1">
                <div class="text-white font-medium">${step.name}</div>
                <div class="text-slate-400 text-xs">${step.fullName || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recommended Spots -->
      ${trip.spotsByLeg ? `
        <div class="p-4 border-t border-white/10">
          <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Spots recommandés
          </h2>
          <div class="space-y-4">
            ${trip.spotsByLeg.map(leg => `
              <div>
                <div class="text-sm text-slate-400 mb-2">${leg.from} → ${leg.to}</div>
                <div class="grid grid-cols-1 gap-2">
                  ${leg.spots.slice(0, 3).map(spot => `
                    <div class="flex items-center gap-3 p-2 bg-dark-secondary rounded-xl cursor-pointer
                                hover:bg-white/10"
                         onclick="selectSpot(${spot.id})">
                      <img src="${spot.photoUrl}" alt="" class="w-12 h-12 rounded-xl object-cover" loading="lazy" />
                      <div class="flex-1">
                        <div class="text-white text-sm">${spot.from}</div>
                        <div class="text-slate-400 text-xs">✓${spot.userValidations || 0} • ${spot.avgWaitTime}min</div>
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
                class="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600">
          Partager ce voyage
        </button>
      </div>
    </div>
  `;
}

// Global handlers
window.saveCurrentTrip = async () => {
  try {
    const { saveTrip } = await import('../../services/planner.js')
    await saveTrip()
    window.showToast?.(window.t?.('tripSaved') || 'Trajet sauvegardé !', 'success')
  } catch {
    window.showToast?.(window.t?.('error') || 'Erreur', 'error')
  }
}

window.shareTrip = async (tripId) => {
  try {
    const { shareTrip: shareTripFn } = await import('../../services/planner.js')
    await shareTripFn(tripId)
  } catch {
    window.showToast?.(window.t?.('shareError') || 'Erreur de partage', 'error')
  }
}

export default {
  renderPlanner,
  renderSavedTripDetail,
};
