/**
 * Navigation Overlay Component
 * Shows turn-by-turn directions on top of the map
 */

import { formatDistance, formatDuration, getDirectionIcon } from '../../services/navigation.js';
import { t } from '../../i18n/index.js';

/**
 * Render navigation overlay
 * @param {Object} state - App state
 */
export function renderNavigationOverlay(state) {
  if (!state.navigationActive) return '';

  const {
    navigationDestination,
    navigationDistance,
    navigationDuration,
    navigationInstructions,
    navigationCurrentStep,
  } = state;

  const currentInstruction = navigationInstructions?.[navigationCurrentStep];
  const nextInstruction = navigationInstructions?.[navigationCurrentStep + 1];

  return `
    <div class="navigation-overlay fixed inset-x-0 top-16 z-40 pointer-events-none">
      <!-- Current Instruction Card -->
      <div class="mx-4 mt-4 pointer-events-auto">
        <div class="bg-primary-600 rounded-2xl shadow-2xl overflow-hidden">
          <!-- Main instruction -->
          <div class="p-4 flex items-center gap-4">
            <div class="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <i class="fas ${currentInstruction ? getDirectionIcon(currentInstruction.maneuver?.type, currentInstruction.maneuver?.modifier) : 'fa-arrow-up'} text-3xl text-white"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-bold text-lg leading-tight">
                ${currentInstruction?.instruction || t('calculatingRoute') || 'Calculer itinéraire...'}
              </div>
              <div class="text-white/70 text-sm mt-1">
                ${currentInstruction?.distance ? formatDistance(currentInstruction.distance) : ''}
                ${currentInstruction?.name ? ` - ${currentInstruction.name}` : ''}
              </div>
            </div>
          </div>

          <!-- Next instruction preview -->
          ${nextInstruction ? `
            <div class="px-4 py-3 bg-black/20 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <i class="fas ${getDirectionIcon(nextInstruction.maneuver?.type, nextInstruction.maneuver?.modifier)} text-white/70"></i>
              </div>
              <div class="flex-1 text-white/70 text-sm truncate">
                ${t('then') || 'Puis'}: ${nextInstruction.instruction}
              </div>
              <div class="text-white/50 text-xs">
                ${formatDistance(nextInstruction.distance)}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Bottom Stats Bar -->
      <div class="fixed inset-x-0 bottom-20 mx-4 pointer-events-auto">
        <div class="bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-4">
          <div class="flex items-center justify-between">
            <!-- ETA & Distance -->
            <div class="flex-1">
              <div class="flex items-center gap-6">
                <div>
                  <div class="text-2xl font-bold text-white">
                    ${navigationDuration ? formatDuration(navigationDuration) : '--'}
                  </div>
                  <div class="text-xs text-slate-400">${t('remainingTime') || 'Temps restant'}</div>
                </div>
                <div class="w-px h-10 bg-white/10"></div>
                <div>
                  <div class="text-2xl font-bold text-primary-400">
                    ${navigationDistance ? formatDistance(navigationDistance) : '--'}
                  </div>
                  <div class="text-xs text-slate-400">${t('distance') || 'Distance'}</div>
                </div>
              </div>
            </div>

            <!-- Destination -->
            <div class="text-right shrink-0 max-w-[40%]">
              <div class="text-sm text-white truncate">
                ${navigationDestination?.name || 'Destination'}
              </div>
              <div class="text-xs text-slate-400">
                ${getETA(navigationDuration)}
              </div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all"
              style="width: ${getProgressPercent(navigationInstructions, navigationCurrentStep)}%"
            ></div>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex gap-3">
            <button
              onclick="stopNavigation()"
              class="flex-1 py-3 px-4 rounded-xl bg-danger-500/20 text-danger-400 font-medium hover:bg-danger-500/30 transition-all"
            >
              <i class="fas fa-times mr-2"></i>
              ${t('stop') || 'Arrêter'}
            </button>
            <button
              onclick="openExternalNavigation(${navigationDestination?.lat}, ${navigationDestination?.lng}, '${navigationDestination?.name?.replace(/'/g, "\\'")}')"
              class="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
            >
              <i class="fas fa-external-link-alt mr-2"></i>
              ${t('externalGPS') || 'GPS externe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Calculate progress percentage
 */
function getProgressPercent(instructions, currentStep) {
  if (!instructions?.length) return 0;
  return Math.round((currentStep / (instructions.length - 1)) * 100);
}

/**
 * Get estimated time of arrival
 */
function getETA(durationSeconds) {
  if (!durationSeconds) return '';

  const eta = new Date(Date.now() + durationSeconds * 1000);
  return `${t('arrivalAt') || 'Arrivée ~'}${eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * Render compact navigation widget (for when not in full navigation mode)
 */
export function renderNavigationWidget(state) {
  if (!state.navigationActive) return '';

  const { navigationDestination, navigationDistance, navigationDuration } = state;

  return `
    <div class="navigation-widget fixed bottom-24 left-4 right-4 z-30 pointer-events-auto">
      <button
        onclick="showFullNavigation()"
        class="w-full bg-primary-600 rounded-xl p-3 shadow-lg flex items-center gap-3 hover:bg-primary-500 transition-all"
      >
        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <i class="fas fa-route text-white"></i>
        </div>
        <div class="flex-1 text-left">
          <div class="text-white font-medium text-sm truncate">
            ${navigationDestination?.name || 'Navigation active'}
          </div>
          <div class="text-white/70 text-xs">
            ${navigationDistance ? formatDistance(navigationDistance) : ''} •
            ${navigationDuration ? formatDuration(navigationDuration) : ''}
          </div>
        </div>
        <i class="fas fa-chevron-up text-white/70"></i>
      </button>
    </div>
  `;
}

export default {
  renderNavigationOverlay,
  renderNavigationWidget,
};
