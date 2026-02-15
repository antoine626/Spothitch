/**
 * CheckinModal Component
 * Enhanced spot validation with photo and characteristics
 */

import { t } from '../../i18n/index.js';
import { getState, setState } from '../../stores/state.js';
import { escapeHTML } from '../../utils/sanitize.js';
import { icon } from '../../utils/icons.js'

export function renderCheckinModal(state) {
  const spot = state.checkinSpot;
  if (!spot) return '';

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeCheckinModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 to-primary-500/20">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="checkin-title" class="text-xl font-bold flex items-center gap-2">
                ${icon('map-pin', 'w-5 h-5 text-emerald-400')}
                ${t('validateSpot') || 'Valider ce spot'}
              </h2>
              <p class="text-sm text-slate-400 mt-1">
                ${escapeHTML(spot.from)} → ${escapeHTML(spot.to)}
              </p>
            </div>
            <button
              onclick="closeCheckinModal()"
              class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="${t('close') || 'Fermer'}"
            >
              ${icon('times', 'w-5 h-5')}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[70vh] space-y-5">

          <!-- Photo Upload -->
          <div class="space-y-3">
            <label class="block text-sm font-medium">
              ${icon('camera', 'w-5 h-5 mr-2 text-primary-400')}
              ${t('addPhotoOptional') || 'Ajouter une photo (optionnel)'}
            </label>
            <div
              id="checkin-photo-preview"
              class="relative w-full h-32 rounded-xl border-2 border-dashed border-white/20
                flex items-center justify-center cursor-pointer hover:border-primary-400
                hover:bg-primary-400/5 transition-all"
              onclick="triggerCheckinPhoto()"
            >
              <div id="checkin-photo-placeholder" class="text-center">
                ${icon('cloud-upload-alt', 'w-8 h-8 text-slate-500 mb-2')}
                <p class="text-sm text-slate-400">${t('clickToAddPhoto') || 'Cliquer pour ajouter une photo'}</p>
              </div>
              <img id="checkin-photo-img" class="hidden w-full h-full object-cover rounded-xl" alt="Photo du spot" loading="lazy"/>
            </div>
            <input
              type="file"
              id="checkin-photo-input"
              accept="image/*"
              class="hidden"
              onchange="handleCheckinPhoto(event)"
            />
          </div>

          <!-- Wait Time -->
          <div class="space-y-3">
            <label class="block text-sm font-medium">
              ${icon('clock', 'w-5 h-5 mr-2 text-warning-400')}
              ${t('waitTime') || 'Temps d\'attente'}
            </label>
            <div class="grid grid-cols-4 gap-3">
              ${['< 5 min', '5-15 min', '15-30 min', '> 30 min'].map((time, i) => `
                <button
                  type="button"
                  onclick="setCheckinWaitTime(${i})"
                  class="checkin-wait-btn px-4 py-2.5 rounded-lg text-xs font-medium border transition-all
                    ${state.checkinWaitTime === i
                      ? 'bg-warning-500 border-warning-500 text-white'
                      : 'bg-white/5 border-white/10 hover:border-warning-400'}"
                  data-wait="${i}"
                >
                  ${time}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Characteristics -->
          <div class="space-y-3">
            <label class="block text-sm font-medium">
              ${icon('check-circle', 'w-5 h-5 mr-2 text-emerald-400')}
              ${t('confirmCharacteristics') || 'Confirmer les caractéristiques'}
            </label>
            <div class="space-y-3">
              ${[
                { id: 'safe', icon: 'shield-alt', label: t('safeSpot') || 'Spot sécurisé', color: 'emerald' },
                { id: 'visible', icon: 'eye', label: t('goodVisibility') || 'Bonne visibilité', color: 'primary' },
                { id: 'traffic', icon: 'car', label: t('frequentTraffic') || 'Trafic fréquent', color: 'warning' },
                { id: 'shelter', icon: 'umbrella', label: t('shelterAvailable') || 'Abri disponible', color: 'cyan' },
              ].map(char => `
                <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    id="checkin-char-${char.id}"
                    class="w-5 h-5 rounded accent-${char.color}-500"
                    onchange="toggleCheckinChar('${char.id}')"
                    ${state.checkinChars?.[char.id] ? 'checked' : ''}
                  />
                  ${icon(char.icon, `w-5 h-5 text-${char.color}-400`)}
                  <span>${char.label}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Comment -->
          <div class="space-y-3">
            <label class="block text-sm font-medium">
              ${icon('comment', 'w-5 h-5 mr-2 text-primary-400')}
              ${t('commentOptional') || 'Commentaire (optionnel)'}
            </label>
            <textarea
              id="checkin-comment"
              class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white
                placeholder-slate-500 resize-none focus:border-primary-400 focus:outline-hidden"
              placeholder="${t('checkinCommentPlaceholder') || 'Ex: Super spot, voiture arrêtée en 5 min!'}"
              rows="2"
            ></textarea>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-white/10 bg-white/5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2 text-sm">
              ${icon('gift', 'w-5 h-5 text-warning-400')}
              <span>${t('reward') || 'Récompense'}: <strong class="text-warning-400">+15 👍</strong></span>
            </div>
            ${state.checkinPhotoData ? `
              <span class="text-xs text-emerald-400">
                ${icon('check', 'w-5 h-5 mr-1')} ${t('photoAdded') || 'Photo ajoutée'} (+5 👍)
              </span>
            ` : ''}
          </div>
          <button
            onclick="submitCheckin()"
            class="w-full btn btn-primary py-3 font-semibold"
          >
            ${icon('check-circle', 'w-5 h-5 mr-2')}
            ${t('validateMyCheckin') || 'Valider mon passage'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
export function registerCheckinHandlers() {
  window.openCheckinModal = async (spotId) => {
    const state = getState();
    const spot = state.spots.find(s => s.id === spotId) || state.selectedSpot;
    if (spot) {
      setState({
        checkinSpot: spot,
        checkinWaitTime: null,
        checkinChars: {},
        checkinPhotoData: null
      });

      // Show contextual tip for first check-in
      try {
        const { triggerCheckinTip } = await import('../../services/contextualTips.js');
        triggerCheckinTip();
      } catch (e) {
        // Silently fail if tips service not available
      }
    }
  };

  window.closeCheckinModal = () => {
    setState({
      checkinSpot: null,
      checkinWaitTime: null,
      checkinChars: {},
      checkinPhotoData: null
    });
  };

  window.setCheckinWaitTime = (time) => {
    setState({ checkinWaitTime: time });
  };

  window.toggleCheckinChar = (charId) => {
    const state = getState();
    const chars = { ...state.checkinChars };
    chars[charId] = !chars[charId];
    setState({ checkinChars: chars });
  };

  window.triggerCheckinPhoto = () => {
    document.getElementById('checkin-photo-input')?.click();
  };

  window.handleCheckinPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Compress and preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('checkin-photo-img');
      const placeholder = document.getElementById('checkin-photo-placeholder');
      if (img && placeholder) {
        img.src = e.target.result;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
      }
      setState({ checkinPhotoData: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  window.submitCheckin = async () => {
    const state = getState();
    const spot = state.checkinSpot;
    if (!spot) return;

    // Proximity check: user must be near the spot
    const spotLat = spot.coordinates?.lat || spot.lat
    const spotLng = spot.coordinates?.lng || spot.lng
    if (spotLat && spotLng) {
      const { checkProximity } = await import('../../services/proximityVerification.js')
      const proximity = checkProximity(spotLat, spotLng, state.userLocation)
      if (!proximity.allowed) {
        const { showToast: toast } = await import('../../services/notifications.js')
        toast(t('proximityRequired') || `Tu dois être à moins de 5 km de ce spot (${proximity.distanceKm} km)`, 'error')
        return
      }
    }

    const { showToast } = await import('../../services/notifications.js');
    const { recordCheckin, addPoints } = await import('../../services/gamification.js');
    const { saveValidationToFirebase, uploadPhotoToFirebase } = await import('../../services/firebase.js');

    try {
      // Calculate points
      let points = 15; // Base points
      if (state.checkinPhotoData) points += 5; // Bonus for photo
      if (Object.values(state.checkinChars || {}).filter(Boolean).length >= 3) points += 5; // Bonus for details

      // Save validation data
      const validationData = {
        spotId: spot.id,
        userId: state.user?.uid,
        waitTime: state.checkinWaitTime,
        characteristics: state.checkinChars,
        comment: document.getElementById('checkin-comment')?.value || '',
        hasPhoto: !!state.checkinPhotoData,
        timestamp: new Date().toISOString()
      };

      // Upload photo if present
      if (state.checkinPhotoData) {
        try {
          await uploadPhotoToFirebase(state.checkinPhotoData, `checkins/${spot.id}/${Date.now()}`);
        } catch (e) {
          console.warn('Photo upload failed:', e);
        }
      }

      // Save to Firebase
      await saveValidationToFirebase(spot.id, state.user?.uid, validationData);

      // Record check-in and add points
      recordCheckin();
      addPoints(points);

      // Close modal and show success
      window.closeCheckinModal();
      showToast(t('checkinValidated') || `Check-in validé ! +${points} 👍`, 'success');

      // Animation
      const { launchConfettiBurst } = await import('../../utils/confetti.js');
      launchConfettiBurst();

    } catch (error) {
      console.error('Checkin error:', error);
      showToast(t('checkinError') || 'Erreur lors du check-in', 'error');
    }
  };
}

export default { renderCheckinModal, registerCheckinHandlers };
