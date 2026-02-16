/**
 * Companion Mode Modal
 * Safety feature: set a guardian, start a trip, check in periodically.
 * If check-in is missed, alert guardian with last known position.
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
import {
  getCompanionState,
  isCompanionActive,
  getTimeUntilNextCheckIn,
  isCheckInOverdue,
} from '../../services/companion.js'

/**
 * Render the Companion Mode modal
 */
export function renderCompanionModal(state) {
  const companion = getCompanionState()
  const active = companion.active

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeCompanionModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="companion-modal-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border border-white/10 rounded-3xl
          w-full max-w-md max-h-[90vh] overflow-y-auto slide-up"
        onclick="event.stopPropagation()"
      >
        ${active ? renderActiveView(companion) : renderSetupView(companion)}
      </div>

      <!-- Overdue Alert Overlay -->
      ${active && isCheckInOverdue() && !companion.alertSent ? renderAlertOverlay(companion) : ''}
    </div>
  `
}

/**
 * Setup view — configure guardian and start trip
 */
function renderSetupView(companion) {
  return `
    <!-- Header -->
    <div class="bg-emerald-500/10 p-8 text-center rounded-t-3xl">
      <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center
        text-3xl mx-auto mb-4" aria-hidden="true">
        ${icon('shield-alt', 'w-8 h-8 text-emerald-400')}
      </div>
      <h2 id="companion-modal-title" class="text-xl font-bold text-white">
        ${t('companionMode') || 'Mode Compagnon'}
      </h2>
      <p class="text-slate-400 mt-2 text-sm">
        ${t('companionSetup') || 'Configure ta sécurité'}
      </p>
    </div>

    <!-- Close button -->
    <button
      onclick="closeCompanionModal()"
      class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
      aria-label="${t('close') || 'Fermer'}"
    >
      ${icon('times', 'w-5 h-5 text-white')}
    </button>

    <!-- Content -->
    <div class="p-6 space-y-5">
      <!-- Explanation -->
      <div class="bg-white/5 rounded-xl p-4 border border-white/10">
        <p class="text-sm text-slate-300 leading-relaxed">
          ${t('companionExplanation') || 'Le mode compagnon te protège pendant tes trajets. Choisis un contact de confiance. Si tu ne confirmes pas que tu vas bien à temps, une alerte sera envoyée avec ta position.'}
        </p>
      </div>

      <!-- Guardian Name -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2" for="companion-guardian-name">
          ${t('guardianName') || 'Nom du gardien'}
        </label>
        <input
          type="text"
          id="companion-guardian-name"
          class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          placeholder="${t('guardianName') || 'Nom du gardien'}"
          value="${companion.guardian?.name || ''}"
          aria-label="${t('guardianName') || 'Nom du gardien'}"
        />
      </div>

      <!-- Guardian Phone -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2" for="companion-guardian-phone">
          ${t('guardianPhone') || 'Téléphone du gardien'}
        </label>
        <input
          type="tel"
          id="companion-guardian-phone"
          class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          placeholder="+33 6 12 34 56 78"
          value="${companion.guardian?.phone || ''}"
          aria-label="${t('guardianPhone') || 'Téléphone du gardien'}"
        />
      </div>

      <!-- Check-in Interval -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2" for="companion-interval">
          ${t('checkInInterval') || 'Intervalle de check-in'}
        </label>
        <select
          id="companion-interval"
          class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
          aria-label="${t('checkInInterval') || 'Intervalle de check-in'}"
        >
          <option value="15" class="bg-dark-primary">${t('every15min') || 'Toutes les 15 min'}</option>
          <option value="30" selected class="bg-dark-primary">${t('every30min') || 'Toutes les 30 min'}</option>
          <option value="45" class="bg-dark-primary">${t('every45min') || 'Toutes les 45 min'}</option>
          <option value="60" class="bg-dark-primary">${t('every1h') || 'Toutes les heures'}</option>
        </select>
      </div>

      <!-- Start Trip Button -->
      <button
        onclick="startCompanion()"
        class="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        aria-label="${t('startTrip') || 'Démarrer le trajet'}"
      >
        ${icon('play', 'w-6 h-6')}
        ${t('startTrip') || 'Démarrer le trajet'}
      </button>
    </div>
  `
}

/**
 * Active view — timer, check-in button, trip info
 */
function renderActiveView(companion) {
  const secondsRemaining = getTimeUntilNextCheckIn()
  const overdue = secondsRemaining < 0
  const absSeconds = Math.abs(secondsRemaining)
  const minutes = Math.floor(absSeconds / 60)
  const seconds = absSeconds % 60

  // Trip duration
  const tripMs = companion.tripStart ? Date.now() - companion.tripStart : 0
  const tripMinutes = Math.floor(tripMs / 60_000)
  const tripHours = Math.floor(tripMinutes / 60)
  const tripMins = tripMinutes % 60

  // Last position
  const lastPos = companion.positions.length > 0
    ? companion.positions[companion.positions.length - 1]
    : null

  // Timer circle progress (0 to 1)
  const totalSeconds = companion.checkInInterval * 60
  const elapsed = totalSeconds - secondsRemaining
  const progress = overdue ? 1 : Math.min(elapsed / totalSeconds, 1)

  return `
    <!-- Header -->
    <div class="bg-emerald-500/10 p-6 text-center rounded-t-3xl">
      <h2 id="companion-modal-title" class="text-lg font-bold text-white flex items-center justify-center gap-2">
        ${icon('shield-alt', 'w-5 h-5 text-emerald-400')}
        ${t('companionActive') || 'Mode Compagnon actif'}
      </h2>
      <p class="text-sm text-slate-400 mt-1">
        ${t('guardianName') || 'Gardien'}: <span class="text-emerald-400 font-medium">${companion.guardian?.name || '?'}</span>
      </p>
    </div>

    <!-- Close button -->
    <button
      onclick="closeCompanionModal()"
      class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
      aria-label="${t('close') || 'Fermer'}"
    >
      ${icon('times', 'w-5 h-5 text-white')}
    </button>

    <!-- Content -->
    <div class="p-6 space-y-5">
      <!-- Timer Circle -->
      <div class="flex justify-center">
        <div class="relative w-40 h-40">
          <!-- Background circle -->
          <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="45" stroke-width="6" fill="none"
              class="stroke-white/10" />
            <circle cx="50" cy="50" r="45" stroke-width="6" fill="none"
              stroke-linecap="round"
              class="${overdue ? 'stroke-red-500' : 'stroke-emerald-400'}"
              stroke-dasharray="${2 * Math.PI * 45}"
              stroke-dashoffset="${2 * Math.PI * 45 * (1 - progress)}"
              style="transition: stroke-dashoffset 0.5s ease" />
          </svg>
          <!-- Timer text -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-bold ${overdue ? 'text-red-400' : 'text-white'}">
              ${overdue ? '-' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
            </span>
            <span class="text-xs ${overdue ? 'text-red-400' : 'text-slate-400'} mt-1">
              ${overdue ? (t('companionOverdue') || 'En retard !') : (t('checkInReminder') || 'Prochain check-in')}
            </span>
          </div>
        </div>
      </div>

      <!-- Check-in Button -->
      <button
        onclick="companionCheckIn()"
        class="w-full py-5 rounded-xl ${overdue ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'} text-white font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
        aria-label="${t('imSafe') || 'Je vais bien'}"
      >
        ${icon('check-circle', 'w-7 h-7')}
        ${t('imSafe') || 'Je vais bien'}
      </button>

      <!-- Trip Info -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div class="text-xs text-slate-400 mb-1">${t('tripDuration') || 'Durée du trajet'}</div>
          <div class="text-lg font-bold text-white">
            ${tripHours > 0 ? `${tripHours}h${String(tripMins).padStart(2, '0')}` : `${tripMins}min`}
          </div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div class="text-xs text-slate-400 mb-1">${t('checkInInterval') || 'Intervalle'}</div>
          <div class="text-lg font-bold text-white">${companion.checkInInterval}min</div>
        </div>
      </div>

      <!-- Last Position -->
      ${lastPos ? `
        <div class="bg-white/5 rounded-xl p-3 border border-white/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              ${icon('map-pin', 'w-4 h-4 text-emerald-400')}
              <span class="text-sm text-slate-300">${t('lastPosition') || 'Dernière position'}</span>
            </div>
            <span class="text-xs text-slate-400">
              ${new Date(lastPos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div class="text-xs text-slate-400 mt-1">
            ${lastPos.lat.toFixed(4)}, ${lastPos.lng.toFixed(4)}
          </div>
        </div>
      ` : ''}

      <!-- SOS Button -->
      <button
        onclick="companionSendAlert()"
        class="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/30 transition-all"
        aria-label="SOS"
      >
        ${icon('exclamation-triangle', 'w-5 h-5')}
        SOS — ${t('sendAlertTo') || 'Envoyer alerte à'} ${companion.guardian?.name || '?'}
      </button>

      <!-- Stop Trip -->
      <button
        onclick="stopCompanion()"
        class="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
        aria-label="${t('stopTrip') || 'Arrêter le trajet'}"
      >
        ${icon('stop', 'w-4 h-4')}
        ${t('stopTrip') || 'Arrêter le trajet'}
      </button>
    </div>
  `
}

/**
 * Alert overlay — shown when check-in is overdue
 */
function renderAlertOverlay(companion) {
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-red-900/95 backdrop-blur-xl"
      role="alertdialog" aria-modal="true" aria-labelledby="companion-alert-title"
      onclick="event.stopPropagation()">
      <div class="text-center max-w-sm">
        <!-- Pulsing icon -->
        <div class="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center
          text-5xl mx-auto mb-6 animate-pulse" aria-hidden="true">
          ${icon('exclamation-triangle', 'w-12 h-12 text-white')}
        </div>

        <h2 id="companion-alert-title" class="text-3xl font-bold text-white mb-3">
          ${t('areYouOk') || 'Tu vas bien ?'}
        </h2>
        <p class="text-red-200 mb-8">
          ${t('missedCheckIn') || 'Tu n\'as pas fait ton check-in à temps.'}
        </p>

        <!-- I'm fine -->
        <button
          onclick="companionCheckIn()"
          class="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg mb-4 flex items-center justify-center gap-3 active:scale-95 transition-all"
          aria-label="${t('imSafe') || 'Je vais bien'}"
        >
          ${icon('check-circle', 'w-6 h-6')}
          ${t('imSafe') || 'Je vais bien'}
        </button>

        <!-- Send Alert -->
        <button
          onclick="companionSendAlert()"
          class="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
          aria-label="${t('sendAlertTo') || 'Envoyer alerte à'} ${companion.guardian?.name || ''}"
        >
          ${icon('paper-plane', 'w-6 h-6')}
          ${t('sendAlertTo') || 'Envoyer alerte à'} ${companion.guardian?.name || ''}
        </button>
      </div>
    </div>
  `
}

export default { renderCompanionModal }
