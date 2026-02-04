/**
 * CheckinModal Component
 * Enhanced spot validation with photo and characteristics
 */

import { t } from '../../i18n/index.js';
import { getState, setState } from '../../stores/state.js';
import { escapeHTML } from '../../utils/sanitize.js';

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
        class="relative bg-dark-primary border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 to-primary-500/20">
          <div class="flex items-center justify-between">
            <div>
              <h2 id="checkin-title" class="text-xl font-bold flex items-center gap-2">
                <i class="fas fa-map-pin text-emerald-400"></i>
                Valider ce spot
              </h2>
              <p class="text-sm text-slate-400 mt-1">
                ${escapeHTML(spot.from)} → ${escapeHTML(spot.to)}
              </p>
            </div>
            <button
              onclick="closeCheckinModal()"
              class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Fermer"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 overflow-y-auto max-h-[60vh] space-y-4">

          <!-- Photo Upload -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">
              <i class="fas fa-camera mr-2 text-primary-400"></i>
              Ajouter une photo (optionnel)
            </label>
            <div
              id="checkin-photo-preview"
              class="relative w-full h-32 rounded-xl border-2 border-dashed border-white/20
                flex items-center justify-center cursor-pointer hover:border-primary-400
                hover:bg-primary-400/5 transition-all"
              onclick="triggerCheckinPhoto()"
            >
              <div id="checkin-photo-placeholder" class="text-center">
                <i class="fas fa-cloud-upload-alt text-3xl text-slate-500 mb-2"></i>
                <p class="text-sm text-slate-400">Cliquer pour ajouter une photo</p>
              </div>
              <img id="checkin-photo-img" class="hidden w-full h-full object-cover rounded-xl" alt="Photo du spot"/>
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
          <div class="space-y-2">
            <label class="block text-sm font-medium">
              <i class="fas fa-clock mr-2 text-warning-400"></i>
              Temps d'attente
            </label>
            <div class="grid grid-cols-4 gap-2">
              ${['< 5 min', '5-15 min', '15-30 min', '> 30 min'].map((time, i) => `
                <button
                  type="button"
                  onclick="setCheckinWaitTime(${i})"
                  class="checkin-wait-btn px-3 py-2 rounded-lg text-xs font-medium border transition-all
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
          <div class="space-y-2">
            <label class="block text-sm font-medium">
              <i class="fas fa-check-circle mr-2 text-emerald-400"></i>
              Confirmer les caractéristiques
            </label>
            <div class="space-y-2">
              ${[
                { id: 'safe', icon: 'shield-alt', label: 'Spot sécurisé', color: 'emerald' },
                { id: 'visible', icon: 'eye', label: 'Bonne visibilité', color: 'primary' },
                { id: 'traffic', icon: 'car', label: 'Trafic fréquent', color: 'warning' },
                { id: 'shelter', icon: 'umbrella', label: 'Abri disponible', color: 'cyan' },
              ].map(char => `
                <label class="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    id="checkin-char-${char.id}"
                    class="w-5 h-5 rounded accent-${char.color}-500"
                    onchange="toggleCheckinChar('${char.id}')"
                    ${state.checkinChars?.[char.id] ? 'checked' : ''}
                  />
                  <i class="fas fa-${char.icon} text-${char.color}-400"></i>
                  <span>${char.label}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Comment -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">
              <i class="fas fa-comment mr-2 text-primary-400"></i>
              Commentaire (optionnel)
            </label>
            <textarea
              id="checkin-comment"
              class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white
                placeholder-slate-500 resize-none focus:border-primary-400 focus:outline-none"
              placeholder="Ex: Super spot, voiture arrêtée en 5 min!"
              rows="2"
            ></textarea>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-white/10 bg-white/5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-gift text-warning-400"></i>
              <span>Récompense: <strong class="text-warning-400">+15 points</strong></span>
            </div>
            ${state.checkinPhotoData ? `
              <span class="text-xs text-emerald-400">
                <i class="fas fa-check mr-1"></i> Photo ajoutée (+5 pts)
              </span>
            ` : ''}
          </div>
          <button
            onclick="submitCheckin()"
            class="w-full btn btn-primary py-3 font-semibold"
          >
            <i class="fas fa-check-circle mr-2"></i>
            Valider mon passage
          </button>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
export function registerCheckinHandlers() {
  window.openCheckinModal = (spotId) => {
    const state = getState();
    const spot = state.spots.find(s => s.id === spotId) || state.selectedSpot;
    if (spot) {
      setState({
        checkinSpot: spot,
        checkinWaitTime: null,
        checkinChars: {},
        checkinPhotoData: null
      });
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
      showToast(`Check-in validé ! +${points} points`, 'success');

      // Animation
      const { launchConfettiBurst } = await import('../../utils/confetti.js');
      launchConfettiBurst();

    } catch (error) {
      console.error('Checkin error:', error);
      showToast('Erreur lors du check-in', 'error');
    }
  };
}

export default { renderCheckinModal, registerCheckinHandlers };
