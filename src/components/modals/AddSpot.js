/**
 * AddSpot Modal Component
 * Form to add a new hitchhiking spot
 */

import { t } from '../../i18n/index.js';

export function renderAddSpot(_state) {
  return `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onclick="closeAddSpot()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addspot-modal-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border border-white/10 rounded-t-3xl sm:rounded-3xl
          w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10">
          <h2 id="addspot-modal-title" class="text-xl font-bold">${t('addSpot')}</h2>
          <button
            onclick="closeAddSpot()"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            aria-label="Fermer la fenetre d'ajout de spot"
            type="button"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
        
        <!-- Form -->
        <div class="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <form id="add-spot-form" onsubmit="handleAddSpot(event)" class="space-y-4" aria-label="Formulaire d'ajout de spot">
            <!-- Photo -->
            <div>
              <label for="spot-photo" class="text-sm text-slate-400 block mb-2">${t('photoRequired')}</label>
              <div
                id="photo-upload"
                class="photo-upload"
                onclick="triggerPhotoUpload()"
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();triggerPhotoUpload();}"
                role="button"
                tabindex="0"
                aria-label="Cliquez pour ajouter une photo du spot"
              >
                <input
                  type="file"
                  id="spot-photo"
                  name="photo"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  onchange="handlePhotoSelect(event)"
                  aria-describedby="photo-help"
                />
                <div id="photo-preview">
                  <i class="fas fa-camera text-4xl text-slate-500 mb-2" aria-hidden="true"></i>
                  <p class="text-slate-400">${t('takePhoto')}</p>
                  <p class="text-slate-500 text-sm" id="photo-help">${t('chooseFromGallery')}</p>
                </div>
              </div>
            </div>

            <!-- From -->
            <div>
              <label for="spot-from" class="text-sm text-slate-400 block mb-2">${t('from')} <span aria-label="obligatoire">*</span></label>
              <input
                type="text"
                id="spot-from"
                name="from"
                class="input-modern"
                placeholder="Ex: Paris"
                required
                aria-required="true"
              />
            </div>

            <!-- To -->
            <div>
              <label for="spot-to" class="text-sm text-slate-400 block mb-2">${t('to')} <span aria-label="obligatoire">*</span></label>
              <input
                type="text"
                id="spot-to"
                name="to"
                class="input-modern"
                placeholder="Ex: Lyon (A6)"
                required
                aria-required="true"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="spot-description" class="text-sm text-slate-400 block mb-2">${t('description')}</label>
              <textarea
                id="spot-description"
                name="description"
                class="input-modern min-h-[100px] resize-none"
                placeholder="Decris le spot, comment y acceder, conseils..."
                maxlength="500"
                aria-describedby="desc-counter"
              ></textarea>
              <div class="text-right text-xs text-slate-500 mt-1" id="desc-counter" aria-live="polite">
                <span id="desc-count">0</span>/500 <span class="sr-only">caracteres</span>
              </div>
            </div>
            
            <!-- Location -->
            <div>
              <span class="text-sm text-slate-400 block mb-2" id="location-label"><span aria-hidden="true">📍</span> Position</span>
              <button
                type="button"
                onclick="getSpotLocation()"
                class="btn btn-ghost w-full"
                aria-describedby="location-display"
              >
                <i class="fas fa-crosshairs" aria-hidden="true"></i>
                Utiliser ma position actuelle
              </button>
              <div id="location-display" class="text-sm text-slate-400 mt-2 text-center" aria-live="polite" role="status"></div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="btn btn-primary w-full text-lg"
              id="submit-spot-btn"
            >
              <i class="fas fa-share" aria-hidden="true"></i>
              ${t('create')}
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Form state
window.spotFormData = {
  photo: null,
  lat: null,
  lng: null,
};

// Global handlers
window.triggerPhotoUpload = () => {
  document.getElementById('spot-photo')?.click();
};

window.handlePhotoSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Compress image
  try {
    const { compressImage } = await import('../../utils/image.js');
    const compressed = await compressImage(file);
    window.spotFormData.photo = compressed;

    // Show preview
    const uploadDiv = document.getElementById('photo-upload');
    const previewDiv = document.getElementById('photo-preview');

    if (uploadDiv && previewDiv) {
      uploadDiv.classList.add('has-photo');
      previewDiv.innerHTML = `<img src="${compressed}" alt="Preview" loading="lazy" />`;
    }
  } catch (error) {
    console.error('Photo processing failed:', error);
    const { showError } = await import('../../services/notifications.js');
    showError('Erreur lors du traitement de la photo');
  }
};

window.getSpotLocation = () => {
  const display = document.getElementById('location-display');

  if (!navigator.geolocation) {
    if (display) display.textContent = 'Géolocalisation non supportée';
    return;
  }

  if (display) display.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Localisation...';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      window.spotFormData.lat = position.coords.latitude;
      window.spotFormData.lng = position.coords.longitude;

      // Reverse geocode
      try {
        const { reverseGeocode } = await import('../../services/osrm.js');
        const location = await reverseGeocode(position.coords.latitude, position.coords.longitude);

        if (display) {
          display.innerHTML = `
            <i class="fas fa-check-circle text-success-400"></i>
            ${location?.city || 'Position'} (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})
          `;
        }
      } catch {
        if (display) {
          display.innerHTML = `
            <i class="fas fa-check-circle text-success-400"></i>
            ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}
          `;
        }
      }
    },
    (error) => {
      if (display) display.textContent = 'Impossible d\'obtenir la position';
      console.error('Geolocation error:', error);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

window.handleAddSpot = async (event) => {
  event.preventDefault();

  const from = document.getElementById('spot-from')?.value.trim();
  const to = document.getElementById('spot-to')?.value.trim();
  const description = document.getElementById('spot-description')?.value.trim();
  const submitBtn = document.getElementById('submit-spot-btn');

  // Validation
  if (!from || !to) {
    const { showError } = await import('../../services/notifications.js');
    showError('Remplis les champs obligatoires');
    return;
  }

  if (!window.spotFormData.photo) {
    const { showError } = await import('../../services/notifications.js');
    showError('Une photo est requise');
    return;
  }

  // Disable button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
  }

  try {
    // Upload photo
    const { uploadImage, addSpot } = await import('../../services/firebase.js');
    const photoPath = `spots/${Date.now()}.jpg`;
    const photoResult = await uploadImage(window.spotFormData.photo, photoPath);

    if (!photoResult.success) {
      throw new Error('Photo upload failed');
    }

    // Create spot
    const spotData = {
      from,
      to,
      description,
      photoUrl: photoResult.url,
      coordinates: window.spotFormData.lat ? {
        lat: window.spotFormData.lat,
        lng: window.spotFormData.lng,
      } : null,
      ratings: {
        accessibility: 0,
        safety: 0,
        visibility: 0,
        traffic: 0,
      },
      globalRating: 0,
      avgWaitTime: 30,
    };

    const result = await addSpot(spotData);

    if (result.success) {
      const { showSuccess } = await import('../../services/notifications.js');
      const { actions, setState } = await import('../../stores/state.js');

      showSuccess('Spot ajouté avec succès ! 🎉');
      actions.incrementSpotsCreated();
      setState({ showAddSpot: false });

      // Reset form data
      window.spotFormData = { photo: null, lat: null, lng: null };
    } else {
      throw new Error('Failed to add spot');
    }
  } catch (error) {
    console.error('Add spot failed:', error);
    const { showError } = await import('../../services/notifications.js');
    showError('Erreur lors de l\'ajout du spot');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-share"></i> ${t('create')}`;
    }
  }
};

// Character counter for description
document.addEventListener('input', (e) => {
  if (e.target.id === 'spot-description') {
    const count = document.getElementById('desc-count');
    if (count) count.textContent = e.target.value.length;
  }
});

export default { renderAddSpot };
