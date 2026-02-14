/**
 * Navigation Overlay Component
 * Shows turn-by-turn directions on top of the map
 * No ETA, no voice guidance — simple and clean
 */

import { formatDistance, getDirectionIcon } from '../../services/navigation.js'
import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

/**
 * Render navigation overlay
 * @param {Object} state - App state
 */
export function renderNavigationOverlay(state) {
  if (!state.navigationActive) return ''

  const {
    navigationDestination,
    navigationDistance,
    navigationInstructions,
    navigationCurrentStep,
    gasStations,
    showGasStationsOnMap,
  } = state

  const currentInstruction = navigationInstructions?.[navigationCurrentStep]
  const nextInstruction = navigationInstructions?.[navigationCurrentStep + 1]
  const gasCount = (gasStations || []).length

  return `
    <div class="navigation-overlay fixed inset-x-0 top-16 z-40 pointer-events-none">
      <!-- Current Instruction Card -->
      <div class="mx-4 mt-4 pointer-events-auto">
        <div class="bg-primary-600 rounded-2xl shadow-2xl overflow-hidden">
          <!-- Main instruction -->
          <div class="p-4 flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              ${icon(currentInstruction ? getDirectionIcon(currentInstruction.maneuver?.type, currentInstruction.maneuver?.modifier) : 'arrow-up', 'w-7 h-7 text-white')}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-bold text-base leading-tight">
                ${currentInstruction?.instruction || t('calculatingRoute') || 'Calcul...'}
              </div>
              <div class="text-white/70 text-sm mt-1">
                ${currentInstruction?.distance ? formatDistance(currentInstruction.distance) : ''}
                ${currentInstruction?.name ? ` — ${currentInstruction.name}` : ''}
              </div>
            </div>
          </div>

          <!-- Next instruction preview -->
          ${nextInstruction ? `
            <div class="px-4 py-2.5 bg-black/20 flex items-center gap-3">
              <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                ${icon(getDirectionIcon(nextInstruction.maneuver?.type, nextInstruction.maneuver?.modifier), 'w-4 h-4 text-white/70')}
              </div>
              <div class="flex-1 text-white/70 text-sm truncate">
                ${t('then') || 'Puis'}: ${nextInstruction.instruction}
              </div>
              <div class="text-white/50 text-xs shrink-0">
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
            <!-- Distance remaining -->
            <div>
              <div class="text-2xl font-bold text-primary-400">
                ${navigationDistance ? formatDistance(navigationDistance) : '--'}
              </div>
              <div class="text-xs text-slate-400">${t('remaining') || 'Restant'}</div>
            </div>

            <!-- Destination -->
            <div class="text-right shrink-0 max-w-[50%]">
              <div class="text-sm text-white font-medium truncate">
                ${icon('map-pin', 'w-4 h-4 text-primary-400 mr-1')}
                ${navigationDestination?.name || 'Destination'}
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
          <div class="mt-4 flex gap-2">
            <button
              onclick="stopNavigation()"
              class="flex-1 py-3 px-3 rounded-xl bg-danger-500/20 text-danger-400 font-medium hover:bg-danger-500/30 transition-all text-sm"
            >
              ${icon('times', 'w-4 h-4 mr-1')}
              ${t('stop') || 'Arrêter'}
            </button>
            <button
              onclick="toggleGasStations()"
              class="py-3 px-3 rounded-xl ${showGasStationsOnMap ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-slate-400'} font-medium hover:bg-white/20 transition-all text-sm"
              aria-label="${t('gasStations') || 'Stations-service'}"
              title="${t('gasStations') || 'Stations-service'}${gasCount ? ` (${gasCount})` : ''}"
            >
              ${icon('fuel', 'w-4 h-4')}
            </button>
            <button
              onclick="openExternalNavigation(${navigationDestination?.lat}, ${navigationDestination?.lng}, '${navigationDestination?.name?.replace(/'/g, "\\'")}')"
              class="flex-1 py-3 px-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all text-sm"
            >
              ${icon('external-link', 'w-4 h-4 mr-1')}
              ${t('externalGPS') || 'GPS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Calculate progress percentage
 */
function getProgressPercent(instructions, currentStep) {
  if (!instructions?.length) return 0
  return Math.round((currentStep / (instructions.length - 1)) * 100)
}

/**
 * Render compact navigation widget (for when not in full navigation mode)
 */
export function renderNavigationWidget(state) {
  if (!state.navigationActive) return ''

  const { navigationDestination, navigationDistance } = state

  return `
    <div class="navigation-widget fixed bottom-24 left-4 right-4 z-30 pointer-events-auto">
      <button
        onclick="showFullNavigation()"
        class="w-full bg-primary-600 rounded-xl p-3 shadow-lg flex items-center gap-3 hover:bg-primary-500 transition-all"
      >
        <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          ${icon('navigation', 'w-5 h-5 text-white')}
        </div>
        <div class="flex-1 text-left">
          <div class="text-white font-medium text-sm truncate">
            ${navigationDestination?.name || t('navigationActive') || 'Navigation active'}
          </div>
          <div class="text-white/70 text-xs">
            ${navigationDistance ? formatDistance(navigationDistance) : ''}
          </div>
        </div>
        ${icon('chevron-up', 'w-5 h-5 text-white/70')}
      </button>
    </div>
  `
}

export default {
  renderNavigationOverlay,
  renderNavigationWidget,
}
