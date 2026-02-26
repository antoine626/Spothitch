/**
 * SOS Modal Component
 * Emergency mode for sharing location with extended safety features:
 * - SMS/WhatsApp channel preference
 * - Offline mode with cached position
 * - Auto-call with country detection
 * - 5-second countdown before alert
 * - Silent alarm mode
 * - Fake call UI
 * - Audio/video recording evidence
 * - Primary contact (starred)
 * - Customizable alert message
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
import { escapeHTML } from '../../utils/sanitize.js'

// ─── SOS localStorage helpers ───────────────────────────────────────────────
const LS = {
  channel: () => localStorage.getItem('spothitch_sos_channel') || 'both',
  silent: () => localStorage.getItem('spothitch_sos_silent') === '1',
  customMsg: () => localStorage.getItem('spothitch_sos_custom_msg') || '',
  primaryContact: () => parseInt(localStorage.getItem('spothitch_sos_primary') ?? '-1', 10),
  cachedPos: () => {
    try { return JSON.parse(localStorage.getItem('spothitch_sos_last_pos') || 'null') } catch { return null }
  },
  savePos: (lat, lng) => localStorage.setItem('spothitch_sos_last_pos', JSON.stringify({ lat, lng, ts: Date.now() })),
}

// Country emergency numbers lookup (ISO 2-letter → number)
const COUNTRY_EMERGENCY = {
  US: '911', CA: '911', MX: '911',
  AU: '000', NZ: '111',
  GB: '999', IE: '999',
  DE: '112', FR: '112', ES: '112', IT: '112', PT: '112', NL: '112',
  BE: '112', AT: '112', CH: '112', SE: '112', NO: '112', DK: '112',
  FI: '112', PL: '112', CZ: '112', SK: '112', HU: '112', RO: '112',
  BG: '112', HR: '112', SI: '112', LT: '112', LV: '112', EE: '112',
  GR: '112', CY: '112', MT: '112', LU: '112',
  IN: '112', CN: '110', JP: '110', KR: '119', BR: '190', AR: '911',
  ZA: '10111', EG: '123', NG: '199', KE: '999',
  RU: '112', UA: '112', TR: '112',
  // Default fallback
  DEFAULT: '112',
}

function getCountryEmergencyNumber() {
  // Try to get from stored locale/lang preference or timezone heuristic
  const lang = localStorage.getItem('spothitch_lang') || navigator.language || 'fr'
  const country = lang.split('-')[1]?.toUpperCase()
  return COUNTRY_EMERGENCY[country] || COUNTRY_EMERGENCY.DEFAULT
}

export function renderSOS(state) {
  const disclaimerSeen = typeof localStorage !== 'undefined' && localStorage.getItem('spothitch_sos_disclaimer_seen')
  if (!disclaimerSeen) return renderSOSDisclaimer()
  return renderSOSMain(state)
}

// ─── Disclaimer ─────────────────────────────────────────────────────────────
function renderSOSDisclaimer() {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeSOS()"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-disclaimer-title"
     tabindex="0">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>
      <div
        class="relative bg-dark-primary border-2 border-amber-500/50 rounded-3xl w-full max-w-md slide-up"
        onclick="event.stopPropagation()"
      >
        <div class="p-8 text-center">
          <div class="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
            ${icon('triangle-alert', 'w-8 h-8 text-amber-400')}
          </div>
          <h2 id="sos-disclaimer-title" class="text-xl font-bold text-amber-400 mb-4">
            ${t('sosDisclaimerTitle') || 'Important — SOS'}
          </h2>
          <div class="text-sm text-slate-300 text-left space-y-3 mb-6">
            <p>${t('sosDisclaimerText1') || 'SpotHitch does NOT replace emergency services.'}</p>
            <p>${t('sosDisclaimerText2') || 'The SOS feature helps you share your location with your trusted contacts but cannot guarantee help will arrive.'}</p>
            <p>${t('sosDisclaimerText3') || 'In case of real emergency, always call your local emergency number (112 in Europe, 911 in USA/Canada).'}</p>
          </div>
          <button
            onclick="acceptSOSDisclaimer()"
            class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-dark-primary font-bold text-lg transition-colors"
          >
            ${t('sosDisclaimerAccept') || 'I understand, continue'}
          </button>
        </div>
        <button
          onclick="closeSOS()"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="${t('close') || 'Close'}"
        >
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

// ─── Main SOS Modal ──────────────────────────────────────────────────────────
function renderSOSMain(state) {
  const channel = LS.channel()
  const isSilent = LS.silent()
  const customMsg = LS.customMsg()
  const primaryIdx = LS.primaryContact()
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  const cachedPos = LS.cachedPos()
  const detectedNumber = getCountryEmergencyNumber()

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeSOS()"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
      aria-describedby="sos-modal-desc"
     tabindex="0">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border-2 border-danger-500/50 rounded-3xl
          w-full max-w-md max-h-[90vh] overflow-y-auto slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="bg-danger-500/20 p-8 text-center">
          <div class="w-20 h-20 rounded-full bg-danger-500 flex items-center justify-center
            text-4xl mx-auto mb-4 animate-pulse" aria-hidden="true">
            🆘
          </div>
          <h2 id="sos-modal-title" class="text-2xl font-bold text-danger-400">${t('sosTitle')}</h2>
          <p id="sos-modal-desc" class="text-slate-400 mt-2">${t('sosDesc')}</p>

          ${!isOnline ? `
            <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium" role="alert">
              ${icon('wifi-off', 'w-3 h-3')}
              ${t('sosOfflineMode') || 'Mode hors ligne'}
              ${cachedPos ? `— ${t('sosUsingCachedPos') || 'position en cache'}` : `— ${t('sosNoCachedPos') || 'aucune position en cache'}`}
            </div>
          ` : ''}
        </div>

        <!-- Content -->
        <div class="p-6 space-y-5">

          <!-- Main SOS Button with Countdown -->
          <button
            onclick="sosStartCountdown()"
            class="btn btn-danger w-full text-lg py-4 ${state.sosActive ? 'animate-pulse-glow' : ''}"
            id="sos-share-btn"
            type="button"
            aria-pressed="${state.sosActive ? 'true' : 'false'}"
            aria-describedby="sos-status"
          >
            ${icon(state.sosActive ? 'circle-stop' : 'radio-tower', 'w-5 h-5')}
            ${state.sosActive ? t('stopSharing') : t('shareLocation')}
          </button>

          <!-- Countdown UI (hidden by default, shown via JS) -->
          <div id="sos-countdown-ui" class="hidden card p-5 text-center bg-danger-500/10 border-danger-500/30" role="alert" aria-live="assertive">
            <div class="text-5xl font-black text-danger-400 mb-2" id="sos-countdown-num">5</div>
            <p class="text-sm text-slate-300 mb-4">${t('sosCountdownDesc') || 'Alerte en cours d\'envoi...'}</p>
            <button
              onclick="sosCancelCountdown()"
              class="btn btn-ghost border border-slate-500/30 text-slate-400 w-full"
              type="button"
            >
              ${icon('x', 'w-4 h-4')}
              ${t('sosCountdownCancel') || 'Annuler'}
            </button>
          </div>

          ${state.sosActive ? `
            <div class="card p-4 bg-danger-500/10 border-danger-500/30" role="alert" aria-live="assertive" id="sos-status">
              <div class="flex items-center gap-3">
                <div class="live-dot" aria-hidden="true"></div>
                <span class="text-danger-400 font-medium">${t('positionSharedLive') || 'Position partagée en direct'}</span>
              </div>
              <p class="text-sm text-slate-400 mt-2">
                ${t('contactsCanSeePosition') || 'Tes contacts de confiance peuvent voir ta position en temps réel.'}
              </p>
            </div>
          ` : `<div id="sos-status" class="sr-only">${t('positionShareInactive') || 'Partage de position non actif'}</div>`}

          <!-- ── Silent Alarm + Fake Call row ── -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Silent Alarm Toggle -->
            <button
              onclick="sosToggleSilent()"
              class="card p-3 text-center transition-colors ${isSilent ? 'bg-purple-500/20 border-purple-500/40' : 'hover:bg-white/5'}"
              type="button"
              aria-pressed="${isSilent}"
              title="${t('sosSilentModeTitle') || 'Mode alarme silencieuse'}"
            >
              <div class="flex justify-center mb-1">
                ${icon(isSilent ? 'eye-off' : 'eye', `w-5 h-5 ${isSilent ? 'text-purple-400' : 'text-slate-400'}`)}
              </div>
              <div class="text-xs font-medium ${isSilent ? 'text-purple-400' : 'text-slate-400'}">
                ${t('sosSilentMode') || 'Alarme silencieuse'}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">
                ${isSilent ? (t('sosSilentOn') || 'Activé') : (t('sosSilentOff') || 'Désactivé')}
              </div>
            </button>

            <!-- Fake Call -->
            <button
              onclick="sosOpenFakeCall()"
              class="card p-3 text-center hover:bg-emerald-500/10 transition-colors"
              type="button"
              title="${t('sosFakeCallTitle') || 'Simuler un appel entrant'}"
            >
              <div class="flex justify-center mb-1">
                ${icon('phone', 'w-5 h-5 text-emerald-400')}
              </div>
              <div class="text-xs font-medium text-emerald-400">
                ${t('sosFakeCall') || 'Faux appel'}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">
                ${t('sosFakeCallDesc') || 'Simuler un appel'}
              </div>
            </button>
          </div>

          <!-- ── Record Evidence ── -->
          <div class="card p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                ${icon('camera', 'w-4 h-4 text-rose-400')}
                <span class="text-sm font-medium">${t('sosRecordEvidence') || 'Enregistrer des preuves'}</span>
              </div>
              <span id="sos-rec-indicator" class="hidden items-center gap-1 text-xs text-rose-400 font-medium">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block"></span>
                ${t('sosRecording') || 'REC'}
              </span>
            </div>
            <div class="flex gap-2">
              <button
                onclick="sosStartRecording('audio')"
                id="sos-rec-audio-btn"
                class="flex-1 btn btn-ghost border border-rose-500/30 text-rose-400 text-sm py-2"
                type="button"
              >
                ${icon('music', 'w-4 h-4')}
                ${t('sosRecordAudio') || 'Audio'}
              </button>
              <button
                onclick="sosStartRecording('video')"
                id="sos-rec-video-btn"
                class="flex-1 btn btn-ghost border border-rose-500/30 text-rose-400 text-sm py-2"
                type="button"
              >
                ${icon('camera', 'w-4 h-4')}
                ${t('sosRecordVideo') || 'Vidéo'}
              </button>
              <button
                onclick="sosStopRecording()"
                id="sos-rec-stop-btn"
                class="hidden btn btn-ghost border border-danger-500/30 text-danger-400 text-sm py-2 px-3"
                type="button"
                aria-label="${t('sosStopRecording') || 'Arrêter l\'enregistrement'}"
              >
                ${icon('circle-stop', 'w-4 h-4')}
              </button>
            </div>
            <div id="sos-rec-result" class="hidden mt-2 text-xs text-slate-400"></div>
          </div>

          <!-- ── Emergency Contacts ── -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold" id="contacts-heading">
                ${t('emergencyContacts')}
                ${state.emergencyContacts.length > 0 ? `<span class="ml-2 text-xs text-slate-500">(${state.emergencyContacts.length})</span>` : ''}
              </h3>
              <!-- SMS/WhatsApp channel selector -->
              <div class="flex items-center gap-1 text-xs">
                <button
                  onclick="sosSetChannel('sms')"
                  class="px-2 py-1 rounded-lg transition-colors ${channel === 'sms' ? 'bg-primary-500/30 text-primary-400' : 'text-slate-500 hover:text-slate-300'}"
                  type="button"
                  title="${t('sosChannelSMS') || 'SMS'}"
                >SMS</button>
                <button
                  onclick="sosSetChannel('whatsapp')"
                  class="px-2 py-1 rounded-lg transition-colors ${channel === 'whatsapp' ? 'bg-emerald-500/30 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}"
                  type="button"
                  title="${t('sosChannelWhatsApp') || 'WhatsApp'}"
                >WA</button>
                <button
                  onclick="sosSetChannel('both')"
                  class="px-2 py-1 rounded-lg transition-colors ${channel === 'both' ? 'bg-amber-500/30 text-amber-400' : 'text-slate-500 hover:text-slate-300'}"
                  type="button"
                  title="${t('sosChannelBoth') || 'SMS + WhatsApp'}"
                >${t('sosChannelBothShort') || 'Les 2'}</button>
              </div>
            </div>

            <!-- Channel description -->
            <p class="text-xs text-slate-500 mb-3">
              ${channel === 'sms' ? (t('sosChannelSMSDesc') || 'Les alertes seront envoyées par SMS') :
                channel === 'whatsapp' ? (t('sosChannelWhatsAppDesc') || 'Les alertes seront envoyées par WhatsApp') :
                (t('sosChannelBothDesc') || 'Les alertes seront envoyées par SMS et WhatsApp')}
            </p>

            <!-- Add Contact Form -->
            <div class="card p-4 mb-4 space-y-3">
              <div class="flex gap-2">
                <input
                  type="text"
                  id="emergency-name"
                  class="input-field flex-1"
                  placeholder="${t('contactName') || 'Nom du contact'}"
                  aria-label="${t('emergencyContactName') || 'Nom du contact d\'urgence'}"
                />
              </div>
              <div class="flex gap-2">
                <input
                  type="tel"
                  id="emergency-phone"
                  class="input-field flex-1"
                  placeholder="${t('phonePlaceholder') || '+33 6 12 34 56 78'}"
                  aria-label="${t('emergencyContactPhone') || 'Téléphone du contact d\'urgence'}"
                  onkeydown="if(event.key==='Enter') addEmergencyContact()"
                />
                <button
                  onclick="addEmergencyContact()"
                  class="btn-primary px-4"
                  type="button"
                  aria-label="${t('addContact') || 'Ajouter le contact'}"
                >
                  ${icon('plus', 'w-5 h-5')}
                </button>
              </div>
            </div>

            <ul class="space-y-2" aria-labelledby="contacts-heading" role="list">
              ${state.emergencyContacts.length > 0
    ? state.emergencyContacts.map((contact, i) => `
                    <li class="card p-3 flex items-center justify-between ${i === primaryIdx ? 'border-amber-500/40 bg-amber-500/5' : ''}">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${i === primaryIdx ? 'bg-amber-500/20' : 'bg-primary-500/20'} flex items-center justify-center" aria-hidden="true">
                          ${i === primaryIdx ? '⭐' : '👤'}
                        </div>
                        <div>
                          <div class="font-medium flex items-center gap-1">
                            ${escapeHTML(contact.name)}
                            ${i === primaryIdx ? `<span class="text-xs text-amber-400">${t('sosPrimaryContact') || 'Principal'}</span>` : ''}
                          </div>
                          <div class="text-sm text-slate-400">${escapeHTML(contact.phone)}</div>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          onclick="sosSetPrimaryContact(${i})"
                          class="w-8 h-8 flex items-center justify-center rounded-full transition-colors ${i === primaryIdx ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}"
                          type="button"
                          aria-label="${t('sosSetPrimary') || 'Définir comme contact principal'} ${escapeHTML(contact.name)}"
                          aria-pressed="${i === primaryIdx}"
                        >
                          ${icon('star', 'w-4 h-4')}
                        </button>
                        <button
                          onclick="removeEmergencyContact(${i})"
                          class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-danger-400 rounded-full transition-colors"
                          type="button"
                          aria-label="${t('deleteContact') || 'Supprimer le contact'} ${escapeHTML(contact.name)}"
                        >
                          ${icon('x', 'w-4 h-4')}
                        </button>
                      </div>
                    </li>
                  `).join('')
    : `
                  <li class="text-center text-slate-400 py-4">
                    ${icon('user-plus', 'w-7 h-7 mb-2')}
                    <p class="text-sm">${t('addTrustedContacts') || 'Ajoute des contacts de confiance'}</p>
                  </li>
                `
}
            </ul>
          </div>

          <!-- ── Custom Alert Message ── -->
          <div class="card p-4 space-y-2">
            <label class="flex items-center gap-2 text-sm font-medium" for="sos-custom-msg">
              ${icon('pencil', 'w-4 h-4 text-primary-400')}
              ${t('sosCustomMessage') || 'Message personnalisé'}
            </label>
            <textarea
              id="sos-custom-msg"
              class="input-field w-full text-sm resize-none"
              rows="2"
              maxlength="200"
              placeholder="${t('sosCustomMsgPlaceholder') || 'Ajouté en tête de chaque alerte...'}"
              oninput="sosUpdateCustomMsg(this.value)"
            >${escapeHTML(customMsg)}</textarea>
            <p class="text-xs text-slate-500">${t('sosCustomMsgHint') || 'Ce texte sera ajouté au début de vos messages d\'alerte.'}</p>
          </div>

          <!-- ── Auto-call with country detection ── -->
          <div class="card p-4 space-y-3">
            <h3 class="font-semibold flex items-center gap-2">
              ${icon('phone', 'w-5 h-5 text-danger-400')}
              ${t('sosAutoCall') || 'Appel automatique'}
            </h3>
            <a
              href="tel:${detectedNumber}"
              class="btn btn-danger w-full"
              aria-label="${t('sosAutoCallLabel') || 'Appeler les secours'} (${detectedNumber})"
            >
              ${icon('phone', 'w-5 h-5')}
              ${t('sosCallEmergency') || 'Appeler les secours'} — <strong>${detectedNumber}</strong>
            </a>
            <p class="text-xs text-slate-500 text-center">
              ${t('sosAutoCallHint') || 'Numéro détecté selon votre région'}
            </p>
          </div>

          <!-- Country Emergency Numbers Grid -->
          <div class="card p-5 space-y-4">
            <h3 class="font-semibold flex items-center gap-2">
              ${icon('globe', 'w-5 h-5 text-primary-400')}
              ${t('emergencyNumbersByCountry') || 'Numéros d\'urgence par pays'}
            </h3>
            <div id="country-emergency-numbers">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <a href="tel:112" class="p-2 rounded-xl bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">Europe</div>
                  <div class="font-bold text-danger-400">112</div>
                </a>
                <a href="tel:911" class="p-2 rounded-xl bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">USA/Canada</div>
                  <div class="font-bold text-danger-400">911</div>
                </a>
                <a href="tel:000" class="p-2 rounded-xl bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">${t('australia') || 'Australie'}</div>
                  <div class="font-bold text-danger-400">000</div>
                </a>
                <a href="tel:111" class="p-2 rounded-xl bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">${t('newZealand') || 'Nv-Zélande'}</div>
                  <div class="font-bold text-danger-400">111</div>
                </a>
              </div>
            </div>
          </div>

          <!-- ── Pre-programmed Messages ── -->
          <div class="card p-5 space-y-4">
            <h3 class="font-semibold flex items-center gap-2">
              ${icon('message-circle-more', 'w-5 h-5 text-emerald-400')}
              ${t('emergencyMessages') || 'Messages d\'urgence'}
            </h3>
            <div class="space-y-3">
              <button onclick="sendSOSTemplate('danger')" class="w-full p-3 rounded-xl bg-danger-500/10 text-left text-sm hover:bg-danger-500/20 transition-colors">
                <div class="font-medium text-danger-400">🚨 ${t('sosInDanger') || 'Je suis en danger'}</div>
                <div class="text-xs text-slate-400">${t('sosInDangerDesc') || 'Envoie ta position + message d\'alerte'}</div>
              </button>
              <button onclick="sendSOSTemplate('stuck')" class="w-full p-3 rounded-xl bg-amber-500/10 text-left text-sm hover:bg-amber-500/20 transition-colors">
                <div class="font-medium text-amber-400">📍 ${t('sosStuck') || 'Je suis bloqué(e)'}</div>
                <div class="text-xs text-slate-400">${t('sosStuckDesc') || 'Envoie ta position + demande d\'aide'}</div>
              </button>
              <button onclick="sendSOSTemplate('help')" class="w-full p-3 rounded-xl bg-primary-500/10 text-left text-sm hover:bg-primary-500/20 transition-colors">
                <div class="font-medium text-primary-400">🆘 ${t('sosNeedHelp') || 'J\'ai besoin d\'aide'}</div>
                <div class="text-xs text-slate-400">${t('sosNeedHelpDesc') || 'Envoie ta position + description'}</div>
              </button>
            </div>
          </div>

          <!-- I'm Safe Button -->
          ${state.sosActive ? `
            <button
              onclick="markSafe()"
              class="btn btn-success w-full"
              type="button"
            >
              ${icon('circle-check', 'w-5 h-5')}
              ${t('iAmSafe')}
            </button>
          ` : ''}
        </div>

        <!-- Close -->
        <button
          onclick="closeSOS()"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="${t('closeSOSWindow') || 'Fermer la fenêtre SOS'}"
          type="button"
        >
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

// ─── Fake Call Overlay ───────────────────────────────────────────────────────
function renderFakeCallOverlay() {
  const callerName = t('sosFakeCallerName') || 'Maman'
  return `
    <div
      id="sos-fake-call"
      class="fixed inset-0 z-[200] flex flex-col items-center justify-between
        bg-gradient-to-b from-slate-800 to-slate-900 p-8"
      role="dialog"
      aria-modal="true"
      aria-label="${t('sosFakeCallTitle') || 'Appel entrant simulé'}"
    >
      <!-- Caller info -->
      <div class="flex-1 flex flex-col items-center justify-center gap-6 w-full">
        <div class="w-28 h-28 rounded-full bg-primary-500/20 border-4 border-primary-500/40
          flex items-center justify-center text-6xl animate-pulse">
          👤
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-white mb-2">${escapeHTML(callerName)}</div>
          <div class="text-slate-400 text-lg" id="fake-call-status">${t('sosFakeCallIncoming') || 'Appel entrant...'}</div>
          <div class="text-slate-500 mt-1 text-sm hidden" id="fake-call-timer">0:00</div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="w-full space-y-4">
        <div class="grid grid-cols-2 gap-4" id="fake-call-answer-row">
          <!-- Decline -->
          <button
            onclick="sosFakeCallDecline()"
            class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-danger-500 active:bg-danger-600"
            type="button"
            aria-label="${t('sosFakeCallDecline') || 'Raccrocher'}"
          >
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center rotate-135">
              ${icon('phone', 'w-6 h-6')}
            </div>
            <span class="text-sm font-medium">${t('sosFakeCallDecline') || 'Raccrocher'}</span>
          </button>
          <!-- Answer -->
          <button
            onclick="sosFakeCallAnswer()"
            class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500 active:bg-emerald-600"
            type="button"
            aria-label="${t('sosFakeCallAnswer') || 'Répondre'}"
          >
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              ${icon('phone', 'w-6 h-6')}
            </div>
            <span class="text-sm font-medium">${t('sosFakeCallAnswer') || 'Répondre'}</span>
          </button>
        </div>
        <!-- Hang up (shown after answering) -->
        <button
          onclick="sosFakeCallDecline()"
          id="fake-call-hangup"
          class="hidden w-full flex-col items-center gap-2 p-4 rounded-2xl bg-danger-500"
          type="button"
          aria-label="${t('sosFakeCallHangUp') || 'Raccrocher'}"
        >
          <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center rotate-135 mx-auto">
            ${icon('phone', 'w-6 h-6')}
          </div>
          <span class="text-sm font-medium">${t('sosFakeCallHangUp') || 'Raccrocher'}</span>
        </button>
      </div>
    </div>
  `
}

// ─── Global handlers ─────────────────────────────────────────────────────────

// ── Existing handlers (preserved) ────────────────────────────────────────────
window.shareSOSLocation = async () => {
  const { getState, actions } = await import('../../stores/state.js')
  const { showSuccess, showError } = await import('../../services/notifications.js')
  const state = getState()

  if (state.sosActive) {
    actions.toggleSOS()
    showSuccess(t('positionShareStopped') || 'Partage de position arrêté')
    return
  }

  if (!navigator.geolocation) {
    showError(t('geoNotSupported') || 'Géolocalisation non disponible')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { lat, lng } = { lat: position.coords.latitude, lng: position.coords.longitude }
      LS.savePos(lat, lng)
      actions.toggleSOS()
      actions.setUserLocation({ lat, lng })
      showSuccess(t('locationShared'))
      if (navigator.share) {
        try {
          await navigator.share({
            title: t('sosShareTitle') || '🆘 SOS Position - SpotHitch',
            text: t('sosShareText') || "Je partage ma position d'urgence",
            url: `https://www.google.com/maps?q=${lat},${lng}`,
          })
        } catch (e) { /* User cancelled */ }
      }
    },
    (error) => {
      showError(t('positionError') || 'Impossible de partager la position')
      console.error('Geolocation error:', error)
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

window.addEmergencyContact = async () => {
  const nameInput = document.getElementById('emergency-name')
  const phoneInput = document.getElementById('emergency-phone')
  const name = nameInput?.value?.trim()
  const phone = phoneInput?.value?.trim()

  if (!name || !phone) {
    const { showToast } = await import('../../services/notifications.js')
    showToast(t('fillNameAndNumber') || 'Remplis le nom et le numéro', 'warning')
    return
  }

  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) {
    const { showToast } = await import('../../services/notifications.js')
    showToast(t('invalidPhoneNumber') || 'Numéro de téléphone invalide', 'warning')
    return
  }

  const { actions } = await import('../../stores/state.js')
  actions.addEmergencyContact({ name, phone })
  if (nameInput) nameInput.value = ''
  if (phoneInput) phoneInput.value = ''

  const { showSuccess } = await import('../../services/notifications.js')
  showSuccess(t('contactAdded') || 'Contact ajouté !')
}

window.removeEmergencyContact = async (index) => {
  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const contacts = [...state.emergencyContacts]
  contacts.splice(index, 1)
  // Adjust primary contact index if needed
  const primary = LS.primaryContact()
  if (primary === index) localStorage.removeItem('spothitch_sos_primary')
  else if (primary > index) localStorage.setItem('spothitch_sos_primary', String(primary - 1))
  setState({ emergencyContacts: contacts })
}

window.markSafe = async () => {
  const { actions } = await import('../../stores/state.js')
  const { showSuccess } = await import('../../services/notifications.js')
  actions.toggleSOS()
  showSuccess(t('markedSafe') || 'Super ! Content que tu sois en sécurité')
}

window.acceptSOSDisclaimer = () => {
  localStorage.setItem('spothitch_sos_disclaimer_seen', '1')
  window.setState?.({ showSOS: true })
}

window.sendSOSTemplate = async (type) => {
  const customMsg = LS.customMsg()
  const templates = {
    danger: t('sosTemplateDanger') || "🚨 URGENCE - Je suis en danger et j'ai besoin d'aide immédiatement !",
    stuck: t('sosTemplateStuck') || "📍 Je suis bloqué(e) en auto-stop et j'ai besoin qu'on vienne me chercher.",
    help: t('sosTemplateHelp') || "🆘 J'ai besoin d'aide. Voici ma position actuelle.",
  }
  const baseText = templates[type] || templates.help
  const text = customMsg ? `${customMsg}\n\n${baseText}` : baseText

  const sendWithPosition = (lat, lng) => {
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`
    const myPosLabel = t('myPosition') || 'Ma position'
    const fullMsg = `${text}\n\n${myPosLabel}: ${mapUrl}`
    _dispatchSOSAlert(fullMsg)
  }

  // Try live position first, fallback to cache when offline
  if (!navigator.onLine) {
    const cached = LS.cachedPos()
    if (cached) {
      sendWithPosition(cached.lat, cached.lng)
    } else {
      window.showToast?.(t('sosNoCachedPos') || 'Aucune position en cache', 'error')
    }
    return
  }

  if (!navigator.geolocation) {
    window.showToast?.(t('geoNotAvailable') || 'Géolocalisation non disponible', 'error')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      LS.savePos(pos.coords.latitude, pos.coords.longitude)
      sendWithPosition(pos.coords.latitude, pos.coords.longitude)
    },
    () => {
      // Geolocation failed — try cache
      const cached = LS.cachedPos()
      if (cached) {
        sendWithPosition(cached.lat, cached.lng)
      } else {
        window.showToast?.(t('positionNotAvailable') || 'Position non disponible', 'error')
      }
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

// ─── Internal send dispatcher (respects channel + silent mode) ───────────────
function _dispatchSOSAlert(fullMsg) {
  const channel = LS.channel()
  const isSilent = LS.silent()
  const encoded = encodeURIComponent(fullMsg)

  const doSend = () => {
    if (channel === 'sms') {
      window.location.href = `sms:?&body=${encoded}`
    } else if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank')
    } else {
      // both — open WhatsApp; SMS is secondary via native share
      if (navigator.share) {
        navigator.share({ title: 'SOS SpotHitch', text: fullMsg }).catch(() => {
          window.open(`https://wa.me/?text=${encoded}`, '_blank')
        })
      } else {
        window.open(`https://wa.me/?text=${encoded}`, '_blank')
      }
    }
  }

  if (isSilent) {
    // Silent: send without any visible UI change
    doSend()
  } else {
    doSend()
    window.showToast?.(t('sosSentToContacts') || 'SOS envoyé à tes contacts d\'urgence', 'success')
  }
}

// ── New handlers ─────────────────────────────────────────────────────────────

// SMS/WhatsApp channel preference
window.sosSetChannel = (channel) => {
  localStorage.setItem('spothitch_sos_channel', channel)
  // Re-render to update UI
  window.setState?.({})
}

// Silent alarm toggle
window.sosToggleSilent = () => {
  const current = LS.silent()
  localStorage.setItem('spothitch_sos_silent', current ? '0' : '1')
  window.setState?.({})
}

// Custom message persistence
window.sosUpdateCustomMsg = (value) => {
  localStorage.setItem('spothitch_sos_custom_msg', value.slice(0, 200))
}

// Primary contact
window.sosSetPrimaryContact = (index) => {
  const current = LS.primaryContact()
  if (current === index) {
    localStorage.removeItem('spothitch_sos_primary')
  } else {
    localStorage.setItem('spothitch_sos_primary', String(index))
  }
  window.setState?.({})
}

// ── Countdown ────────────────────────────────────────────────────────────────
let _sosCountdownTimer = null

window.sosStartCountdown = async () => {
  const { getState, actions } = await import('../../stores/state.js')
  const { showSuccess } = await import('../../services/notifications.js')
  const state = getState()

  // If SOS already active, stop sharing immediately
  if (state.sosActive) {
    actions.toggleSOS()
    showSuccess(t('positionShareStopped') || 'Partage de position arrêté')
    return
  }

  const ui = document.getElementById('sos-countdown-ui')
  const numEl = document.getElementById('sos-countdown-num')
  const shareBtn = document.getElementById('sos-share-btn')

  if (!ui || !numEl) {
    // Fallback: immediate share
    window.shareSOSLocation()
    return
  }

  ui.classList.remove('hidden')
  if (shareBtn) shareBtn.setAttribute('disabled', 'true')

  let count = 5
  numEl.textContent = count

  _sosCountdownTimer = setInterval(() => {
    count--
    numEl.textContent = count
    if (count <= 0) {
      clearInterval(_sosCountdownTimer)
      _sosCountdownTimer = null
      ui.classList.add('hidden')
      if (shareBtn) shareBtn.removeAttribute('disabled')
      // Actually trigger location share
      window.shareSOSLocation()
    }
  }, 1000)
}

window.sosCancelCountdown = () => {
  if (_sosCountdownTimer) {
    clearInterval(_sosCountdownTimer)
    _sosCountdownTimer = null
  }
  const ui = document.getElementById('sos-countdown-ui')
  const shareBtn = document.getElementById('sos-share-btn')
  if (ui) ui.classList.add('hidden')
  if (shareBtn) shareBtn.removeAttribute('disabled')
  window.showToast?.(t('sosCountdownCancelled') || 'Alerte annulée', 'info')
}

// ── Fake Call ─────────────────────────────────────────────────────────────────
let _fakeCallTimer = null
let _fakeCallSeconds = 0

window.sosOpenFakeCall = () => {
  // Remove existing overlay if any
  document.getElementById('sos-fake-call')?.remove()
  const overlay = document.createElement('div')
  overlay.innerHTML = renderFakeCallOverlay()
  document.body.appendChild(overlay.firstElementChild)

  // Vibrate like an incoming call (if supported)
  if (navigator.vibrate) {
    navigator.vibrate([500, 300, 500, 300, 500])
  }
}

window.sosFakeCallAnswer = () => {
  const statusEl = document.getElementById('fake-call-status')
  const timerEl = document.getElementById('fake-call-timer')
  const answerRow = document.getElementById('fake-call-answer-row')
  const hangupBtn = document.getElementById('fake-call-hangup')

  if (statusEl) statusEl.textContent = t('sosFakeCallConnected') || 'En communication...'
  if (timerEl) timerEl.classList.remove('hidden')
  if (answerRow) answerRow.classList.add('hidden')
  if (hangupBtn) hangupBtn.classList.remove('hidden')
  hangupBtn?.classList.add('flex')

  if (navigator.vibrate) navigator.vibrate(0) // stop vibration

  _fakeCallSeconds = 0
  _fakeCallTimer = setInterval(() => {
    _fakeCallSeconds++
    const m = Math.floor(_fakeCallSeconds / 60)
    const s = String(_fakeCallSeconds % 60).padStart(2, '0')
    if (timerEl) timerEl.textContent = `${m}:${s}`
  }, 1000)
}

window.sosFakeCallDecline = () => {
  if (_fakeCallTimer) {
    clearInterval(_fakeCallTimer)
    _fakeCallTimer = null
  }
  if (navigator.vibrate) navigator.vibrate(0)
  document.getElementById('sos-fake-call')?.remove()
}

// ── Audio/Video Recording ─────────────────────────────────────────────────────
let _mediaRecorder = null
let _recordingChunks = []

window.sosStartRecording = async (mode) => {
  const { showToast } = await import('../../services/notifications.js')

  if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
    showToast(t('sosAlreadyRecording') || 'Enregistrement déjà en cours', 'warning')
    return
  }

  try {
    const constraints = mode === 'video'
      ? { video: true, audio: true }
      : { audio: true }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    _recordingChunks = []
    _mediaRecorder = new MediaRecorder(stream)

    _mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) _recordingChunks.push(e.data)
    }

    _mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      const mimeType = mode === 'video' ? 'video/webm' : 'audio/webm'
      const blob = new Blob(_recordingChunks, { type: mimeType })
      const url = URL.createObjectURL(blob)

      const resultEl = document.getElementById('sos-rec-result')
      if (resultEl) {
        resultEl.classList.remove('hidden')
        const ext = mode === 'video' ? 'webm' : 'webm'
        resultEl.innerHTML = `
          <a href="${url}" download="sos-evidence.${ext}"
            class="text-primary-400 underline">
            ${icon('download', 'w-3 h-3 inline-block mr-1')}${t('sosDownloadRecording') || 'Télécharger l\'enregistrement'}
          </a>
        `
      }

      // Update UI
      const recIndicator = document.getElementById('sos-rec-indicator')
      const stopBtn = document.getElementById('sos-rec-stop-btn')
      const audioBtn = document.getElementById('sos-rec-audio-btn')
      const videoBtn = document.getElementById('sos-rec-video-btn')
      if (recIndicator) recIndicator.classList.add('hidden')
      if (stopBtn) stopBtn.classList.add('hidden')
      if (audioBtn) audioBtn.removeAttribute('disabled')
      if (videoBtn) videoBtn.removeAttribute('disabled')
    }

    _mediaRecorder.start()

    // Update UI to show recording state
    const recIndicator = document.getElementById('sos-rec-indicator')
    const stopBtn = document.getElementById('sos-rec-stop-btn')
    const audioBtn = document.getElementById('sos-rec-audio-btn')
    const videoBtn = document.getElementById('sos-rec-video-btn')
    if (recIndicator) recIndicator.classList.remove('hidden')
    if (recIndicator) recIndicator.style.display = 'flex'
    if (stopBtn) stopBtn.classList.remove('hidden')
    if (audioBtn) audioBtn.setAttribute('disabled', 'true')
    if (videoBtn) videoBtn.setAttribute('disabled', 'true')

  } catch (err) {
    console.error('Recording error:', err)
    showToast(t('sosRecordingError') || 'Impossible d\'accéder au microphone/caméra', 'error')
  }
}

window.sosStopRecording = () => {
  if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
    _mediaRecorder.stop()
  }
}

export default { renderSOS }
