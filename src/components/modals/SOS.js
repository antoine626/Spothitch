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
          w-full max-w-md overflow-hidden slide-up"
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
                <span class="text-danger-400 font-medium">Position partagee en direct</span>
              </div>
              <p class="text-sm text-slate-400 mt-2">
                Tes contacts de confiance peuvent voir ta position en temps reel.
              </p>
            </div>
          ` : '<div id="sos-status" class="sr-only">Partage de position non actif</div>'}
          
          <!-- Emergency Contacts -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold" id="contacts-heading">${t('emergencyContacts')}</h3>
              <button
                onclick="addEmergencyContact()"
                class="text-primary-400 text-sm"
                type="button"
                aria-label="Ajouter un contact d'urgence"
              >
                <i class="fas fa-plus mr-1" aria-hidden="true"></i> ${t('addContact')}
              </button>
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
                        aria-label="Supprimer le contact ${contact.name}"
                      >
                        <i class="fas fa-times" aria-hidden="true"></i>
                      </button>
                    </li>
                  `).join('')
    : `
                  <li class="text-center text-slate-400 py-4">
                    <i class="fas fa-user-plus text-2xl mb-2" aria-hidden="true"></i>
                    <p class="text-sm">Ajoute des contacts de confiance</p>
                  </li>
                `
}
            </ul>
          </div>

          <!-- Emergency Call -->
          <a
            href="tel:112"
            class="btn btn-ghost w-full border border-danger-500/30 text-danger-400"
            aria-label="Appeler le 112, numero d'urgence europeen"
          >
            <i class="fas fa-phone-alt" aria-hidden="true"></i>
            Appeler le 112 (Urgences EU)
          </a>

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
          aria-label="Fermer la fenetre SOS"
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
    showSuccess('Partage de position arrêté');
    return;
  }

  // Start sharing
  if (!navigator.geolocation) {
    showError('Géolocalisation non disponible');
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

      // In production, send to backend and notify contacts
      console.log('SOS Location:', lat, lng);

      showSuccess(t('locationShared'));

      // Share via native share if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: '🆘 Position SOS - SpotHitch',
            text: 'Je partage ma position d\'urgence',
            url: `https://www.google.com/maps?q=${lat},${lng}`,
          });
        } catch (e) {
          // User cancelled or not supported
        }
      }
    },
    (error) => {
      showError('Impossible de partager la position');
      console.error('Geolocation error:', error);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

window.addEmergencyContact = async () => {
  const name = prompt('Nom du contact:');
  if (!name) return;

  const phone = prompt('Numéro de téléphone:');
  if (!phone) return;

  const { actions } = await import('../../stores/state.js');
  actions.addEmergencyContact({ name, phone });

  const { showSuccess } = await import('../../services/notifications.js');
  showSuccess('Contact ajouté');
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
  showSuccess('Super ! Content que tu sois en sécurité 🙌');
};

export default { renderSOS };
