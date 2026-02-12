/**
 * SOS Modal Component
 * Emergency mode for sharing location
 */

import { t } from '../../i18n/index.js';

export function renderSOS(state) {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeSOS()"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
      aria-describedby="sos-modal-desc"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border-2 border-danger-500/50 rounded-3xl
          w-full max-w-md max-h-[90vh] overflow-y-auto slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="bg-danger-500/20 p-6 text-center">
          <div class="w-20 h-20 rounded-full bg-danger-500 flex items-center justify-center
            text-4xl mx-auto mb-4 animate-pulse" aria-hidden="true">
            🆘
          </div>
          <h2 id="sos-modal-title" class="text-2xl font-bold text-danger-400">${t('sosTitle')}</h2>
          <p id="sos-modal-desc" class="text-slate-400 mt-2">${t('sosDesc')}</p>
        </div>
        
        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Share Location Button -->
          <button
            onclick="shareSOSLocation()"
            class="btn btn-danger w-full text-lg py-4 ${state.sosActive ? 'animate-pulse-glow' : ''}"
            id="sos-share-btn"
            type="button"
            aria-pressed="${state.sosActive ? 'true' : 'false'}"
            aria-describedby="sos-status"
          >
            <i class="fas ${state.sosActive ? 'fa-stop' : 'fa-broadcast-tower'}" aria-hidden="true"></i>
            ${state.sosActive ? t('stopSharing') : t('shareLocation')}
          </button>

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
          
          <!-- Emergency Contacts -->
          <div>
            <h3 class="font-semibold mb-3" id="contacts-heading">${t('emergencyContacts')}</h3>

            <!-- Add Contact Form -->
            <div class="card p-3 mb-3 space-y-2">
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
                  placeholder="+33 6 12 34 56 78"
                  aria-label="${t('emergencyContactPhone') || 'Téléphone du contact d\'urgence'}"
                  onkeydown="if(event.key==='Enter') addEmergencyContact()"
                />
                <button
                  onclick="addEmergencyContact()"
                  class="btn-primary px-4"
                  type="button"
                  aria-label="${t('addContact') || 'Ajouter le contact'}"
                >
                  <i class="fas fa-plus" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <ul class="space-y-2" aria-labelledby="contacts-heading" role="list">
              ${state.emergencyContacts.length > 0
    ? state.emergencyContacts.map((contact, i) => `
                    <li class="card p-3 flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center" aria-hidden="true">
                          👤
                        </div>
                        <div>
                          <div class="font-medium">${contact.name}</div>
                          <div class="text-sm text-slate-400">${contact.phone}</div>
                        </div>
                      </div>
                      <button
                        onclick="removeEmergencyContact(${i})"
                        class="text-slate-500 hover:text-danger-400"
                        type="button"
                        aria-label="${t('deleteContact') || 'Supprimer le contact'} ${contact.name}"
                      >
                        <i class="fas fa-times" aria-hidden="true"></i>
                      </button>
                    </li>
                  `).join('')
    : `
                  <li class="text-center text-slate-400 py-4">
                    <i class="fas fa-user-plus text-2xl mb-2" aria-hidden="true"></i>
                    <p class="text-sm">${t('addTrustedContacts') || 'Ajoute des contacts de confiance'}</p>
                  </li>
                `
}
            </ul>
          </div>

          <!-- Emergency Call -->
          <a
            href="tel:112"
            class="btn btn-ghost w-full border border-danger-500/30 text-danger-400"
            aria-label="${t('call112') || 'Appeler le 112, numéro d\'urgence européen'}"
          >
            <i class="fas fa-phone-alt" aria-hidden="true"></i>
            ${t('call112Label') || 'Appeler le 112 (Urgences EU)'}
          </a>

          <!-- Country Emergency Numbers -->
          <div class="card p-4 space-y-3">
            <h3 class="font-semibold flex items-center gap-2">
              <i class="fas fa-globe text-primary-400"></i>
              ${t('emergencyNumbersByCountry') || 'Numéros d\'urgence par pays'}
            </h3>
            <div id="country-emergency-numbers">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <a href="tel:112" class="p-2 rounded-lg bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">Europe</div>
                  <div class="font-bold text-danger-400">112</div>
                </a>
                <a href="tel:911" class="p-2 rounded-lg bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">USA/Canada</div>
                  <div class="font-bold text-danger-400">911</div>
                </a>
                <a href="tel:000" class="p-2 rounded-lg bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">${t('australia') || 'Australie'}</div>
                  <div class="font-bold text-danger-400">000</div>
                </a>
                <a href="tel:111" class="p-2 rounded-lg bg-danger-500/10 text-center">
                  <div class="text-xs text-slate-400">${t('newZealand') || 'Nv-Zélande'}</div>
                  <div class="font-bold text-danger-400">111</div>
                </a>
              </div>
            </div>
          </div>

          <!-- Pre-programmed Messages -->
          <div class="card p-4 space-y-3">
            <h3 class="font-semibold flex items-center gap-2">
              <i class="fas fa-comment-dots text-emerald-400"></i>
              ${t('emergencyMessages') || 'Messages d\'urgence'}
            </h3>
            <div class="space-y-2">
              <button onclick="sendSOSTemplate('danger')" class="w-full p-3 rounded-lg bg-danger-500/10 text-left text-sm hover:bg-danger-500/20 transition-all">
                <div class="font-medium text-danger-400">🚨 ${t('sosInDanger') || 'Je suis en danger'}</div>
                <div class="text-xs text-slate-400">${t('sosInDangerDesc') || 'Envoie ta position + message d\'alerte'}</div>
              </button>
              <button onclick="sendSOSTemplate('stuck')" class="w-full p-3 rounded-lg bg-amber-500/10 text-left text-sm hover:bg-amber-500/20 transition-all">
                <div class="font-medium text-amber-400">📍 ${t('sosStuck') || 'Je suis bloqué(e)'}</div>
                <div class="text-xs text-slate-400">${t('sosStuckDesc') || 'Envoie ta position + demande d\'aide'}</div>
              </button>
              <button onclick="sendSOSTemplate('help')" class="w-full p-3 rounded-lg bg-primary-500/10 text-left text-sm hover:bg-primary-500/20 transition-all">
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
              <i class="fas fa-check-circle" aria-hidden="true"></i>
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
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
}

// Global handlers
window.shareSOSLocation = async () => {
  const { getState, actions } = await import('../../stores/state.js');
  const { showSuccess, showError } = await import('../../services/notifications.js');
  const state = getState();

  if (state.sosActive) {
    // Stop sharing
    actions.toggleSOS();
    showSuccess(t('positionShareStopped') || 'Partage de position arrêté');
    return;
  }

  // Start sharing
  if (!navigator.geolocation) {
    showError(t('geoNotSupported') || 'Géolocalisation non disponible');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { lat, lng } = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      actions.toggleSOS();
      actions.setUserLocation({ lat, lng });

      showSuccess(t('locationShared'));

      // Share via native share if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: '🆘 Position SOS - SpotHitch',
            text: t('sosShareText') || "Je partage ma position d'urgence",
            url: `https://www.google.com/maps?q=${lat},${lng}`,
          });
        } catch (e) {
          // User cancelled or not supported
        }
      }
    },
    (error) => {
      showError(t('positionError') || 'Impossible de partager la position');
      console.error('Geolocation error:', error);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

window.addEmergencyContact = async () => {
  const nameInput = document.getElementById('emergency-name');
  const phoneInput = document.getElementById('emergency-phone');
  const name = nameInput?.value?.trim();
  const phone = phoneInput?.value?.trim();

  if (!name || !phone) {
    const { showToast } = await import('../../services/notifications.js');
    showToast(t('fillNameAndNumber') || 'Remplis le nom et le numéro', 'warning');
    return;
  }

  const { actions } = await import('../../stores/state.js');
  actions.addEmergencyContact({ name, phone });

  if (nameInput) nameInput.value = '';
  if (phoneInput) phoneInput.value = '';

  const { showSuccess } = await import('../../services/notifications.js');
  showSuccess(t('contactAdded') || 'Contact ajouté !');
};

window.removeEmergencyContact = async (index) => {
  const { getState, setState } = await import('../../stores/state.js');
  const state = getState();
  const contacts = [...state.emergencyContacts];
  contacts.splice(index, 1);
  setState({ emergencyContacts: contacts });
};

window.markSafe = async () => {
  const { actions } = await import('../../stores/state.js');
  const { showSuccess } = await import('../../services/notifications.js');

  actions.toggleSOS();
  showSuccess(t('markedSafe') || 'Super ! Content que tu sois en sécurité');
};

window.sendSOSTemplate = async (type) => {
  const templates = {
    danger: t('sosTemplateDanger') || "🚨 URGENCE - Je suis en danger et j'ai besoin d'aide immédiatement !",
    stuck: t('sosTemplateStuck') || "📍 Je suis bloqué(e) en auto-stop et j'ai besoin qu'on vienne me chercher.",
    help: t('sosTemplateHelp') || "🆘 J'ai besoin d'aide. Voici ma position actuelle.",
  }
  const text = templates[type] || templates.help

  if (!navigator.geolocation) {
    window.showToast?.(t('geoNotAvailable') || 'Géolocalisation non disponible', 'error')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
      const myPosLabel = t('myPosition') || 'Ma position'
      const fullMsg = `${text}\n\n${myPosLabel}: ${mapUrl}`
      const encoded = encodeURIComponent(fullMsg)

      // Try WhatsApp first, fallback to SMS
      if (navigator.share) {
        navigator.share({ title: 'SOS SpotHitch', text: fullMsg }).catch(() => {})
      } else {
        window.open(`https://wa.me/?text=${encoded}`, '_blank')
      }
    },
    () => window.showToast?.(t('positionNotAvailable') || 'Position non disponible', 'error'),
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

export default { renderSOS };
