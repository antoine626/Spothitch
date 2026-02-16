/**
 * Location Permission Modal Component
 * Explains why we need location before asking for permission
 */

import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

/**
 * Render the location permission explanation modal
 */
export function renderLocationPermission(_state) {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      aria-describedby="location-modal-desc"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-3xl w-full max-w-md overflow-hidden scale-in"
        onclick="event.stopPropagation()"
      >
        <!-- Header with icon -->
        <div class="p-6 text-center border-b border-white/10">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            ${icon('map-pin', 'w-8 h-8 text-white')}
          </div>
          <h2 id="location-modal-title" class="text-2xl font-bold text-white">
            ${t('locationPermissionTitle')}
          </h2>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <p id="location-modal-desc" class="text-slate-400 text-center mb-4">
            ${t('locationPermissionDesc')}
          </p>

          <!-- Reasons list -->
          <div class="space-y-3">
            <div class="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                ${icon('search', 'w-5 h-5 text-primary-400')}
              </div>
              <div>
                <p class="text-white font-medium">${t('locationReason1Title')}</p>
                <p class="text-slate-400 text-sm">${t('locationReason1Desc')}</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div class="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                ${icon('map', 'w-5 h-5 text-cyan-400')}
              </div>
              <div>
                <p class="text-white font-medium">${t('locationReason2Title')}</p>
                <p class="text-slate-400 text-sm">${t('locationReason2Desc')}</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div class="w-10 h-10 rounded-full bg-success-500/20 flex items-center justify-center shrink-0">
                ${icon('route', 'w-5 h-5 text-success-400')}
              </div>
              <div>
                <p class="text-white font-medium">${t('locationReason3Title')}</p>
                <p class="text-slate-400 text-sm">${t('locationReason3Desc')}</p>
              </div>
            </div>
          </div>

          <!-- Privacy assurance -->
          <div class="flex items-center gap-2 p-3 bg-success-500/10 border border-success-500/20 rounded-xl mt-4">
            ${icon('shield', 'w-5 h-5 text-success-400')}
            <p class="text-success-400 text-sm font-medium">
              ${t('locationPrivacyAssurance')}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-6 pt-0 flex flex-col gap-3">
          <button
            onclick="acceptLocationPermission()"
            class="btn btn-primary w-full"
            type="button"
          >
            ${icon('check', 'w-5 h-5 mr-2')}
            ${t('locationAllow')}
          </button>
          <button
            onclick="declineLocationPermission()"
            class="btn btn-ghost w-full text-slate-400"
            type="button"
          >
            ${t('locationDecline')}
          </button>
        </div>
      </div>
    </div>
  `;
}

export default { renderLocationPermission };
