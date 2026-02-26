/**
 * Companion Mode Modal
 * Safety feature: set a guardian, start a trip, check in periodically.
 * If check-in is missed, alert guardian with last known position.
 *
 * Features:
 * - SMS/WhatsApp channel toggle (#22)
 * - GPS breadcrumb timeline (#24)
 * - Safe arrival notification toggle (#25)
 * - Departure notification toggle (#26)
 * - Battery level display (#27)
 * - ETA estimation (#28)
 * - Check-in reminder (handled in service) (#29)
 * - Trusted contacts circle (#30)
 * - Trip history (#31)
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
import { getState } from '../../stores/state.js'
import {
  getCompanionState,
  getTimeUntilNextCheckIn,
  isCheckInOverdue,
  getChannelPreference,
  loadTripHistory,
  getETAInfo,
} from '../../services/companion.js'

/**
 * Render the Companion Mode modal
 * Includes per-session location consent (legal requirement)
 */
export function renderCompanionModal(_state) {
  const companion = getCompanionState()
  const active = companion.active

  // Check if location consent was given this session
  const consentGiven =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('spothitch_companion_consent')

  // Check auto-expiration (8 hours max)
  if (active && companion.tripStart) {
    const elapsed = Date.now() - companion.tripStart
    const maxDuration = 8 * 60 * 60 * 1000 // 8 hours
    if (elapsed > maxDuration) {
      import('../../services/companion.js').then(m => m.stopCompanionMode?.())
      return ''
    }
  }

  // Show consent screen if not yet consented this session and not already active
  if (!active && !consentGiven) {
    return renderConsentScreen()
  }

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeCompanionModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="companion-modal-title"
     tabindex="0">
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
 * Per-session consent screen for location sharing
 */
function renderConsentScreen() {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeCompanionModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="companion-consent-title"
     tabindex="0">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>
      <div
        class="relative bg-dark-primary border border-emerald-500/30 rounded-3xl w-full max-w-md slide-up"
        onclick="event.stopPropagation()"
      >
        <div class="p-8 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            ${icon('map-pin', 'w-8 h-8 text-emerald-400')}
          </div>
          <h2 id="companion-consent-title" class="text-xl font-bold text-white mb-4">
            ${t('companionConsentTitle') || 'Location sharing consent'}
          </h2>
          <div class="text-sm text-slate-300 text-left space-y-3 mb-6">
            <p>${t('companionConsentText1') || 'Companion mode will share your real-time GPS position with your chosen guardian contact.'}</p>
            <p>${t('companionConsentText2') || 'Your location will be shared only during the active trip and will automatically stop after 8 hours maximum.'}</p>
            <p>${t('companionConsentText3') || 'You can stop sharing at any time. Your location history is never sold or shared with third parties.'}</p>
          </div>
          <button
            onclick="acceptCompanionConsent()"
            class="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg transition-colors mb-3"
          >
            ${t('companionConsentAccept') || 'I agree, continue'}
          </button>
          <button
            onclick="closeCompanionModal()"
            class="w-full py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors text-sm"
          >
            ${t('cancel') || 'Cancel'}
          </button>
        </div>
        <button
          onclick="closeCompanionModal()"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="${t('close') || 'Close'}"
        >
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

/**
 * Setup view — configure guardian(s), channel, departure/arrival toggles, then start trip
 */
function renderSetupView(companion) {
  const channel = getChannelPreference()
  const history = loadTripHistory()
  const contacts = Array.isArray(companion.trustedContacts) ? companion.trustedContacts : []

  return `
    <!-- Header -->
    <div class="bg-emerald-500/10 p-8 text-center rounded-t-3xl">
      <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center
        text-3xl mx-auto mb-4" aria-hidden="true">
        ${icon('shield', 'w-8 h-8 text-emerald-400')}
      </div>
      <h2 id="companion-modal-title" class="text-xl font-bold text-white">
        ${t('companionMode') || 'Companion Mode'}
      </h2>
      <p class="text-slate-400 mt-2 text-sm">
        ${t('companionSetup') || 'Set up your safety'}
      </p>
    </div>

    <!-- Close button -->
    <button
      onclick="closeCompanionModal()"
      class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      aria-label="${t('close') || 'Close'}"
    >
      ${icon('x', 'w-5 h-5 text-white')}
    </button>

    <!-- Content -->
    <div class="p-6 space-y-5">
      <!-- Explanation -->
      <div class="bg-white/5 rounded-xl p-4 border border-white/10">
        <p class="text-sm text-slate-300 leading-relaxed">
          ${t('companionExplanation') || 'Companion mode keeps you safe while hitchhiking. Choose a trusted contact (guardian). If you do not check in on time, an alert with your last known position will be sent.'}
        </p>
      </div>

      <!-- === PRIMARY GUARDIAN === -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
          ${icon('shield-check', 'w-4 h-4')}
          ${t('guardianTitle') || 'Primary guardian'}
        </h3>

        <!-- Guardian Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2" for="companion-guardian-name">
            ${t('guardianName') || 'Guardian name'}
          </label>
          <input
            type="text"
            id="companion-guardian-name"
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            placeholder="${t('guardianName') || 'Guardian name'}"
            value="${companion.guardian?.name || ''}"
            aria-label="${t('guardianName') || 'Guardian name'}"
          />
        </div>

        <!-- Guardian Phone -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2" for="companion-guardian-phone">
            ${t('guardianPhone') || 'Guardian phone'}
          </label>
          <input
            type="tel"
            id="companion-guardian-phone"
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            placeholder="+33 6 12 34 56 78"
            value="${companion.guardian?.phone || ''}"
            aria-label="${t('guardianPhone') || 'Guardian phone'}"
          />
        </div>
      </div>

      <!-- === TRUSTED CONTACTS (#30) === -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
          ${icon('users', 'w-4 h-4 text-emerald-400')}
          ${t('trustedContacts') || 'Trusted contacts'} <span class="text-slate-500 font-normal normal-case">(${t('trustedContactsMax') || 'up to 5'})</span>
        </h3>

        <!-- Existing trusted contacts list -->
        <div id="companion-trusted-contacts" class="space-y-2">
          ${contacts.length === 0
            ? `<p class="text-xs text-slate-500 italic">${t('noTrustedContacts') || 'No additional contacts yet'}</p>`
            : contacts.map((c, i) => `
              <div class="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                <div>
                  <span class="text-sm text-white font-medium">${c.name || '?'}</span>
                  <span class="text-xs text-slate-400 ml-2">${c.phone}</span>
                </div>
                <button
                  onclick="companionRemoveTrustedContact(${i})"
                  class="text-slate-500 hover:text-red-400 transition-colors"
                  aria-label="${t('remove') || 'Remove'}"
                >
                  ${icon('x', 'w-4 h-4')}
                </button>
              </div>
            `).join('')
          }
        </div>

        <!-- Add trusted contact form (shown only when < 5 contacts) -->
        ${contacts.length < 5 ? `
          <div class="flex gap-2">
            <input
              type="text"
              id="companion-tc-name"
              class="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 transition-colors"
              placeholder="${t('contactName') || 'Name'}"
              aria-label="${t('contactName') || 'Contact name'}"
            />
            <input
              type="tel"
              id="companion-tc-phone"
              class="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-emerald-500 transition-colors"
              placeholder="+33 6..."
              aria-label="${t('guardianPhone') || 'Phone'}"
            />
            <button
              onclick="companionAddTrustedContact()"
              class="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              aria-label="${t('add') || 'Add'}"
            >
              ${icon('plus', 'w-4 h-4')}
            </button>
          </div>
        ` : `
          <p class="text-xs text-amber-400">${t('trustedContactsMaxReached') || 'Maximum 5 contacts reached'}</p>
        `}
      </div>

      <!-- === ALERT CHANNEL (#22) === -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-3">
          ${icon('message-circle', 'w-4 h-4 inline mr-1 text-emerald-400')}
          ${t('alertChannel') || 'Alert channel'}
        </label>
        <div class="flex rounded-xl overflow-hidden border border-white/10" role="group" aria-label="${t('alertChannel') || 'Alert channel'}">
          ${[
            { val: 'whatsapp', label: 'WhatsApp', ico: 'message-circle' },
            { val: 'sms', label: 'SMS', ico: 'smartphone' },
            { val: 'both', label: t('both') || 'Both', ico: 'layers' },
          ].map(opt => `
            <button
              onclick="companionSetChannel('${opt.val}')"
              class="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors
                ${channel === opt.val
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }"
              aria-pressed="${channel === opt.val}"
            >
              ${icon(opt.ico, 'w-4 h-4')}
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- === DESTINATION (for ETA #28) === -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2" for="companion-destination">
          ${icon('navigation', 'w-4 h-4 inline mr-1 text-slate-400')}
          ${t('companionDestination') || 'Destination'} <span class="text-slate-500">(${t('optional') || 'optional'})</span>
        </label>
        <input
          type="text"
          id="companion-destination"
          class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
          placeholder="${t('companionDestinationPlaceholder') || 'e.g. Paris, Lyon...'}"
          value="${companion.destination || ''}"
          aria-label="${t('companionDestination') || 'Destination'}"
        />
      </div>

      <!-- === NOTIFICATIONS TOGGLES (#25, #26) === -->
      <div class="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
        <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
          ${icon('bell', 'w-4 h-4 text-emerald-400')}
          ${t('companionNotifications') || 'Automatic notifications'}
        </h3>

        <!-- Departure toggle (#26) -->
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <span class="text-sm text-white">${t('notifyOnDeparture') || 'Notify guardian on departure'}</span>
            <p class="text-xs text-slate-400">${t('notifyOnDepartureDesc') || 'Sends "I am starting my trip" on start'}</p>
          </div>
          <input type="checkbox" id="companion-notify-departure" class="hidden" ${companion.notifyOnDeparture !== false ? 'checked' : ''}>
          <button type="button" onclick="toggleFormCheckbox('companion-notify-departure',this)" role="switch" aria-checked="${companion.notifyOnDeparture !== false}"
            class="relative w-14 h-7 rounded-full transition-colors shrink-0 ${companion.notifyOnDeparture !== false ? 'bg-emerald-500' : 'bg-slate-600'}">
            <span class="absolute top-0.5 ${companion.notifyOnDeparture !== false ? 'right-0.5' : 'left-0.5'} w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm shadow transition-all">${companion.notifyOnDeparture !== false ? '👍' : '👎'}</span>
          </button>
        </label>

        <!-- Arrival toggle (#25) -->
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <span class="text-sm text-white">${t('notifyOnArrival') || 'Notify guardian on arrival'}</span>
            <p class="text-xs text-slate-400">${t('notifyOnArrivalDesc') || 'Sends "I arrived safely" on stop'}</p>
          </div>
          <input type="checkbox" id="companion-notify-arrival" class="hidden" ${companion.notifyOnArrival !== false ? 'checked' : ''}>
          <button type="button" onclick="toggleFormCheckbox('companion-notify-arrival',this)" role="switch" aria-checked="${companion.notifyOnArrival !== false}"
            class="relative w-14 h-7 rounded-full transition-colors shrink-0 ${companion.notifyOnArrival !== false ? 'bg-emerald-500' : 'bg-slate-600'}">
            <span class="absolute top-0.5 ${companion.notifyOnArrival !== false ? 'right-0.5' : 'left-0.5'} w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm shadow transition-all">${companion.notifyOnArrival !== false ? '👍' : '👎'}</span>
          </button>
        </label>
      </div>

      <!-- === CHECK-IN INTERVAL === -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2" for="companion-interval">
          ${t('checkInInterval') || 'Check-in interval'}
        </label>
        <select
          id="companion-interval"
          class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors appearance-none"
          aria-label="${t('checkInInterval') || 'Check-in interval'}"
        >
          <option value="15" class="bg-dark-primary">${t('every15min') || 'Every 15 min'}</option>
          <option value="30" selected class="bg-dark-primary">${t('every30min') || 'Every 30 min'}</option>
          <option value="45" class="bg-dark-primary">${t('every45min') || 'Every 45 min'}</option>
          <option value="60" class="bg-dark-primary">${t('every1h') || 'Every hour'}</option>
        </select>
      </div>

      <!-- Start Trip Button -->
      <button
        onclick="startCompanion()"
        class="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
        aria-label="${t('startTrip') || 'Start trip'}"
      >
        ${icon('play', 'w-6 h-6')}
        ${t('startTrip') || 'Start trip'}
      </button>

      <!-- === TRIP HISTORY (#31) === -->
      ${history.length > 0 ? renderTripHistory(history) : ''}
    </div>
  `
}

/**
 * Active view — timer, check-in button, battery, breadcrumbs, ETA
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

  // Positions array
  const positions = companion.positions || []

  // Timer circle progress (0 to 1)
  const totalSeconds = companion.checkInInterval * 60
  const elapsed = totalSeconds - secondsRemaining
  const progress = overdue ? 1 : Math.min(elapsed / totalSeconds, 1)

  // ETA
  const etaInfo = getETAInfo(companion)

  // Contacts count (primary guardian + trusted contacts with phone)
  const extraContacts = Array.isArray(companion.trustedContacts)
    ? companion.trustedContacts.filter(c => c?.phone).length
    : 0
  const contactsCount = 1 + extraContacts

  return `
    <!-- Header -->
    <div class="bg-emerald-500/10 p-6 text-center rounded-t-3xl">
      <h2 id="companion-modal-title" class="text-lg font-bold text-white flex items-center justify-center gap-2">
        ${icon('shield', 'w-5 h-5 text-emerald-400')}
        ${t('companionActive') || 'Companion Mode active'}
      </h2>
      <p class="text-sm text-slate-400 mt-1">
        ${t('guardianName') || 'Guardian'}: <span class="text-emerald-400 font-medium">${companion.guardian?.name || '?'}</span>
        ${contactsCount > 1 ? `<span class="text-slate-500 ml-1">+${contactsCount - 1}</span>` : ''}
      </p>
    </div>

    <!-- Close button -->
    <button
      onclick="closeCompanionModal()"
      class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      aria-label="${t('close') || 'Close'}"
    >
      ${icon('x', 'w-5 h-5 text-white')}
    </button>

    <!-- Content -->
    <div class="p-6 space-y-5">
      <!-- Timer Circle -->
      <div class="flex justify-center">
        <div class="relative w-40 h-40">
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
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-bold ${overdue ? 'text-red-400' : 'text-white'}">
              ${overdue ? '-' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
            </span>
            <span class="text-xs ${overdue ? 'text-red-400' : 'text-slate-400'} mt-1">
              ${overdue ? (t('companionOverdue') || 'Overdue!') : (t('checkInReminder') || 'Next check-in')}
            </span>
          </div>
        </div>
      </div>

      <!-- Check-in Button -->
      <button
        onclick="companionCheckIn()"
        class="w-full py-5 rounded-xl ${overdue ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'} text-white font-bold text-xl flex items-center justify-center gap-3 transition-colors shadow-lg active:scale-95"
        aria-label="${t('imSafe') || "I'm safe"}"
      >
        ${icon('circle-check', 'w-7 h-7')}
        ${t('imSafe') || "I'm safe"}
      </button>

      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-2">
        <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div class="text-xs text-slate-400 mb-1">${t('tripDuration') || 'Duration'}</div>
          <div class="text-base font-bold text-white">
            ${tripHours > 0 ? `${tripHours}h${String(tripMins).padStart(2, '0')}` : `${tripMins}min`}
          </div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div class="text-xs text-slate-400 mb-1">${t('checkInInterval') || 'Interval'}</div>
          <div class="text-base font-bold text-white">${companion.checkInInterval}min</div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div class="text-xs text-slate-400 mb-1">${t('checkInsCount') || 'Check-ins'}</div>
          <div class="text-base font-bold text-emerald-400">${companion.checkInsCount || 0}</div>
        </div>
      </div>

      <!-- Battery level (#27) -->
      <div id="companion-battery-row" class="hidden">
        <!-- Populated by JS after mount -->
      </div>

      <!-- ETA (#28) -->
      ${etaInfo.speedKmh !== null ? `
        <div class="bg-white/5 rounded-xl p-3 border border-white/10">
          <div class="flex items-center gap-2 mb-2">
            ${icon('gauge', 'w-4 h-4 text-emerald-400')}
            <span class="text-sm font-medium text-slate-300">${t('etaTitle') || 'Speed & ETA'}</span>
          </div>
          <div class="flex items-center gap-4 text-sm">
            <span class="text-white font-bold">${Math.round(etaInfo.speedKmh)} km/h</span>
            ${etaInfo.etaMinutes !== null ? `
              <span class="text-slate-400">·</span>
              <span class="text-slate-300">${t('etaLabel') || 'ETA'}: <span class="text-emerald-400 font-bold">
                ${etaInfo.etaMinutes < 60
                  ? `${etaInfo.etaMinutes}min`
                  : `${Math.floor(etaInfo.etaMinutes / 60)}h${String(etaInfo.etaMinutes % 60).padStart(2, '0')}`
                }
              </span></span>
            ` : ''}
            ${etaInfo.distanceKm !== null ? `
              <span class="text-slate-400">·</span>
              <span class="text-slate-400">${etaInfo.distanceKm.toFixed(1)} km</span>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- GPS Breadcrumb Trail (#24) -->
      ${positions.length > 0 ? renderBreadcrumbTimeline(positions) : ''}

      <!-- SOS Button -->
      <button
        onclick="companionSendAlert()"
        class="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors"
        aria-label="SOS"
      >
        ${icon('triangle-alert', 'w-5 h-5')}
        SOS — ${t('sendAlertTo') || 'Send alert to'} ${companion.guardian?.name || '?'}
        ${contactsCount > 1 ? `+${contactsCount - 1}` : ''}
      </button>

      <!-- Stop Trip -->
      <button
        onclick="stopCompanion()"
        class="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
        aria-label="${t('stopTrip') || 'Stop trip'}"
      >
        ${icon('circle-stop', 'w-4 h-4')}
        ${t('stopTrip') || 'Stop trip'}
      </button>
    </div>
  `
}

/**
 * GPS breadcrumb timeline — last 10 positions (#24)
 */
function renderBreadcrumbTimeline(positions) {
  const lang = getState().lang || 'fr'
  const trail = positions.slice(-10).reverse() // newest first

  return `
    <div class="bg-white/5 rounded-xl p-4 border border-white/10">
      <div class="flex items-center gap-2 mb-3">
        ${icon('route', 'w-4 h-4 text-emerald-400')}
        <span class="text-sm font-medium text-slate-300">${t('breadcrumbTrail') || 'GPS trail'}</span>
        <span class="text-xs text-slate-500 ml-auto">${positions.length} ${t('positions') || 'positions'}</span>
      </div>
      <div class="space-y-2 max-h-40 overflow-y-auto">
        ${trail.map((pos, i) => `
          <div class="flex items-center gap-3 ${i === 0 ? 'opacity-100' : 'opacity-60'}">
            <div class="flex-shrink-0 w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-400' : 'bg-slate-500'}"></div>
            <div class="flex-1 min-w-0">
              <span class="text-xs text-slate-400 font-mono">
                ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}
              </span>
            </div>
            <span class="text-xs text-slate-500 flex-shrink-0">
              ${new Date(pos.timestamp).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

/**
 * Trip history section (#31)
 */
function renderTripHistory(history) {
  const lang = getState().lang || 'fr'
  const shown = history.slice(0, 5)

  return `
    <details class="group bg-white/5 rounded-xl border border-white/10">
      <summary class="flex items-center justify-between p-4 cursor-pointer list-none select-none">
        <span class="text-sm font-medium text-slate-300 flex items-center gap-2">
          ${icon('history', 'w-4 h-4 text-slate-400')}
          ${t('pastTrips') || 'Past trips'} <span class="text-slate-500">(${history.length})</span>
        </span>
        <span class="text-slate-400 group-open:rotate-180 transition-transform">
          ${icon('chevron-down', 'w-4 h-4')}
        </span>
      </summary>
      <div class="px-4 pb-4 space-y-2">
        ${shown.map(trip => {
          const start = new Date(trip.startTime)
          const durationMs = (trip.endTime || Date.now()) - trip.startTime
          const totalMin = Math.floor(durationMs / 60_000)
          const h = Math.floor(totalMin / 60)
          const m = totalMin % 60
          const dur = h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`

          return `
            <div class="bg-white/5 rounded-xl p-3 border border-white/10">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-white">
                  ${start.toLocaleDateString(lang, { day: '2-digit', month: 'short' })}
                  ${start.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span class="text-xs text-slate-400">${dur}</span>
              </div>
              <div class="flex items-center gap-3 text-xs text-slate-400">
                <span>${icon('shield', 'w-3 h-3 inline')} ${trip.guardian?.name || '?'}</span>
                ${trip.destination ? `<span>→ ${trip.destination}</span>` : ''}
                <span>${icon('circle-check', 'w-3 h-3 inline text-emerald-500')} ${trip.checkInsCount || 0}</span>
                <span>${icon('map-pin', 'w-3 h-3 inline')} ${(trip.positions || []).length}</span>
              </div>
            </div>
          `
        }).join('')}
        ${history.length > 5 ? `<p class="text-xs text-slate-500 text-center">${t('andMoreTrips') || `+${history.length - 5} more trips`}</p>` : ''}
        <button
          onclick="companionClearHistory()"
          class="w-full mt-2 py-2 text-xs text-slate-500 hover:text-red-400 transition-colors text-center"
        >
          ${t('clearHistory') || 'Clear history'}
        </button>
      </div>
    </details>
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
          ${icon('triangle-alert', 'w-12 h-12 text-white')}
        </div>

        <h2 id="companion-alert-title" class="text-3xl font-bold text-white mb-3">
          ${t('areYouOk') || 'Are you OK?'}
        </h2>
        <p class="text-red-200 mb-8">
          ${t('missedCheckIn') || "You didn't check in on time."}
        </p>

        <!-- I'm fine -->
        <button
          onclick="companionCheckIn()"
          class="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg mb-4 flex items-center justify-center gap-3 active:scale-95 transition-colors"
          aria-label="${t('imSafe') || "I'm safe"}"
        >
          ${icon('circle-check', 'w-6 h-6')}
          ${t('imSafe') || "I'm safe"}
        </button>

        <!-- Send Alert -->
        <button
          onclick="companionSendAlert()"
          class="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-colors"
          aria-label="${t('sendAlertTo') || 'Send alert to'} ${companion.guardian?.name || ''}"
        >
          ${icon('send', 'w-6 h-6')}
          ${t('sendAlertTo') || 'Send alert to'} ${companion.guardian?.name || ''}
        </button>
      </div>
    </div>
  `
}

// ---- Global handlers ----

/** Accept consent and show setup */
window.acceptCompanionConsent = () => {
  sessionStorage.setItem('spothitch_companion_consent', '1')
  // Force re-render — setState({showCompanionModal:true}) is a no-op if already true
  window._forceRender?.()
}

/** Set alert channel preference and re-render */
window.companionSetChannel = async (channel) => {
  const { setChannelPreference } = await import('../../services/companion.js')
  setChannelPreference(channel)
  // Re-render by toggling state
  const { setState: ss } = await import('../../stores/state.js')
  ss({ showCompanionModal: true })
}

/** Add a trusted contact to the saved companion state */
window.companionAddTrustedContact = async () => {
  const nameEl = document.getElementById('companion-tc-name')
  const phoneEl = document.getElementById('companion-tc-phone')
  const name = nameEl?.value?.trim() || ''
  const phone = phoneEl?.value?.trim() || ''

  if (!phone) {
    const { showToast } = await import('../../services/notifications.js')
    showToast(t('fillPhoneNumber') || 'Enter a phone number', 'warning')
    return
  }

  const { getCompanionState: gcs } = await import('../../services/companion.js')
  const state = gcs()
  const contacts = Array.isArray(state.trustedContacts) ? state.trustedContacts : []

  if (contacts.length >= 5) {
    const { showToast } = await import('../../services/notifications.js')
    showToast(t('trustedContactsMaxReached') || 'Maximum 5 contacts', 'warning')
    return
  }

  contacts.push({ name, phone: phone.replace(/[^0-9+]/g, '') })
  state.trustedContacts = contacts

  try {
    localStorage.setItem('spothitch_companion', JSON.stringify(state))
  } catch {
    // ignore
  }

  if (nameEl) nameEl.value = ''
  if (phoneEl) phoneEl.value = ''

  // Re-render
  window.setState?.({ showCompanionModal: true })
}

/** Remove a trusted contact by index */
window.companionRemoveTrustedContact = async (index) => {
  const { getCompanionState: gcs } = await import('../../services/companion.js')
  const state = gcs()
  const contacts = Array.isArray(state.trustedContacts) ? [...state.trustedContacts] : []
  contacts.splice(index, 1)
  state.trustedContacts = contacts

  try {
    localStorage.setItem('spothitch_companion', JSON.stringify(state))
  } catch {
    // ignore
  }

  window.setState?.({ showCompanionModal: true })
}

/** Clear trip history */
window.companionClearHistory = async () => {
  const { clearTripHistory } = await import('../../services/companion.js')
  clearTripHistory()
  window.setState?.({ showCompanionModal: true })
}

/** Load and display battery level into the active view */
async function updateBatteryDisplay() {
  const el = document.getElementById('companion-battery-row')
  if (!el) return

  const { getBatteryLevel } = await import('../../services/companion.js')
  const level = await getBatteryLevel()

  if (level === null) return

  const pct = Math.round(level * 100)
  const isLow = pct <= 15
  const color = isLow ? 'text-red-400' : pct <= 30 ? 'text-amber-400' : 'text-emerald-400'
  const batteryIcon = icon('battery-low', `w-5 h-5 ${color}`)

  el.classList.remove('hidden')
  el.innerHTML = `
    <div class="bg-white/5 rounded-xl p-3 border ${isLow ? 'border-red-500/30' : 'border-white/10'} flex items-center gap-3">
      <span>${batteryIcon}</span>
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-300">${t('batteryLevel') || 'Battery'}</span>
          <span class="text-sm font-bold ${color}">${pct}%</span>
        </div>
        <div class="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-colors ${isLow ? 'bg-red-500' : pct <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}"
            style="width: ${pct}%"></div>
        </div>
        ${isLow ? `<p class="text-xs text-red-400 mt-1">${t('batteryLowWarning') || 'Battery low — guardian will be alerted'}</p>` : ''}
      </div>
    </div>
  `
}

// Init companion battery display after render
// Called from afterRender in App.js instead of using a global MutationObserver
let _batteryDisplayDone = false
export function initCompanionAfterRender(isVisible) {
  if (isVisible) {
    const el = document.getElementById('companion-battery-row')
    if (el && !_batteryDisplayDone) {
      _batteryDisplayDone = true
      updateBatteryDisplay()
    }
  } else {
    // Reset flag when modal closes
    _batteryDisplayDone = false
  }
}

export default { renderCompanionModal }
