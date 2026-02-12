/**
 * AddSpot Modal Component
 * Form to add a new hitchhiking spot
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

/**
 * Render interactive star rating for a criterion
 */
function renderStarInput(criterion, label) {
  return `
    <div class="mb-3">
      <label class="text-sm text-slate-400 block mb-1">${label} <span aria-label="obligatoire">*</span></label>
      <div class="flex items-center gap-1" role="radiogroup" aria-label="${label}">
        ${[1, 2, 3, 4, 5].map(star => `
          <button
            type="button"
            onclick="setSpotRating('${criterion}', ${star})"
            class="spot-star-btn text-2xl text-slate-500 hover:text-yellow-400 transition-colors"
            data-criterion="${criterion}"
            data-star="${star}"
            aria-label="${star}/5"
          >
            ${icon('star', 'w-5 h-5')}
          </button>
        `).join('')}
        <span class="ml-2 text-sm text-white font-medium" id="spot-rating-value-${criterion}">-</span>
      </div>
      <p class="text-xs text-slate-500 mt-1 min-h-[1.25rem]" id="spot-rating-desc-${criterion}" aria-live="polite"></p>
    </div>
  `
}

export function renderAddSpot(_state) {
  const isPreview = _state.addSpotPreview === true
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
        class="relative modal-panel sm:rounded-3xl
          w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="addspot-modal-title" class="text-xl font-bold">${t('addSpot')}${isPreview ? ` <span class="text-sm font-normal text-amber-400 ml-2">${t('previewMode')}</span>` : ''}</h2>
          <button
            onclick="closeAddSpot()"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            aria-label="${t('close') || 'Fermer'}"
            type="button"
          >
            ${icon('times', 'w-5 h-5')}
          </button>
        </div>

        <!-- Form -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <form id="add-spot-form" onsubmit="handleAddSpot(event)" class="space-y-5" aria-label="${t('addSpotForm') || 'Formulaire d\'ajout de spot'}">
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
                aria-label="${t('clickToAddPhoto') || 'Cliquez pour ajouter une photo'}"
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
                  ${icon('camera', 'w-10 h-10 text-slate-500 mb-2')}
                  <p class="text-slate-400">${t('takePhoto')}</p>
                  <p class="text-slate-500 text-sm" id="photo-help">${t('chooseFromGallery')}</p>
                </div>
              </div>
            </div>

            <!-- Spot Type -->
            <div>
              <label for="spot-type" class="text-sm text-slate-400 block mb-2">${t('spotTypeLabel')} <span aria-label="obligatoire">*</span></label>
              <select
                id="spot-type"
                name="spotType"
                class="input-modern w-full"
                onchange="onSpotTypeChange(this.value)"
                required
                aria-required="true"
              >
                <option value="" disabled selected>${t('selectSpotType')}</option>
                <option value="city_exit">${t('spotTypeCityExit')}</option>
                <option value="gas_station">${t('spotTypeGasStation')}</option>
                <option value="highway">${t('spotTypeHighway')}</option>
                <option value="custom">${t('spotTypeCustom')}</option>
              </select>
            </div>

            <!-- Direction (always required) -->
            <div>
              <label for="spot-direction" class="text-sm text-slate-400 block mb-2">${t('directionLabel')} <span aria-label="obligatoire">*</span></label>
              <input
                type="text"
                id="spot-direction"
                name="direction"
                class="input-modern"
                placeholder="${t('directionPlaceholder')}"
                required
                aria-required="true"
              />
            </div>

            <!-- Conditional Fields Container -->
            <div id="spot-conditional-fields"></div>

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
                placeholder="${t('spotDescPlaceholder') || 'Decris le spot, comment y acceder, conseils...'}"
                maxlength="500"
                aria-describedby="desc-counter"
              ></textarea>
              <div class="text-right text-xs text-slate-500 mt-1" id="desc-counter" aria-live="polite">
                <span id="desc-count">0</span>/500 <span class="sr-only">caracteres</span>
              </div>
            </div>

            <!-- Ratings -->
            <div class="border-t border-white/10 pt-4">
              <h3 class="text-sm font-semibold text-slate-300 mb-3">${t('detailedRatings')}</h3>
              ${renderStarInput('safety', t('safetyRating'))}
              ${renderStarInput('traffic', t('traffic'))}
              ${renderStarInput('accessibility', t('accessibility'))}
            </div>

            <!-- Location -->
            <div>
              <span class="text-sm text-slate-400 block mb-2" id="location-label"><span aria-hidden="true">📍</span> ${t('position') || 'Position'}</span>
              <button
                type="button"
                onclick="getSpotLocation()"
                class="btn btn-ghost w-full"
                aria-describedby="location-display"
              >
                ${icon('crosshairs', 'w-5 h-5')}
                ${t('useMyPosition') || 'Utiliser ma position actuelle'}
              </button>
              <div id="location-display" class="text-sm text-slate-400 mt-2 text-center" aria-live="polite" role="status"></div>
            </div>

            <!-- Submit -->
            ${isPreview ? `
            <button
              type="button"
              onclick="closeAddSpot()"
              class="btn w-full text-lg bg-amber-500/20 text-amber-400 border border-amber-500/30"
              id="submit-spot-btn"
            >
              ${icon('eye', 'w-5 h-5')}
              ${t('previewModeClose')}
            </button>
            ` : `
            <button
              type="submit"
              class="btn btn-primary w-full text-lg"
              id="submit-spot-btn"
            >
              ${icon('share', 'w-5 h-5')}
              ${t('create')}
            </button>
            `}
          </form>
        </div>
      </div>
    </div>
  `
}

// Form state
window.spotFormData = {
  photo: null,
  lat: null,
  lng: null,
  ratings: {
    safety: 0,
    traffic: 0,
    accessibility: 0,
  },
}

// Star rating descriptions map
const starDescriptions = {
  safety: (v) => t(`safetyDesc${v}`) || '',
  traffic: (v) => t(`trafficDesc${v}`) || '',
  accessibility: (v) => t(`accessibilityDesc${v}`) || '',
}

// Global handlers
window.triggerPhotoUpload = () => {
  document.getElementById('spot-photo')?.click()
}

window.handlePhotoSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Compress image
  try {
    const { compressImage } = await import('../../utils/image.js')
    const compressed = await compressImage(file)
    window.spotFormData.photo = compressed

    // Show preview
    const uploadDiv = document.getElementById('photo-upload')
    const previewDiv = document.getElementById('photo-preview')

    if (uploadDiv && previewDiv) {
      uploadDiv.classList.add('has-photo')
      previewDiv.innerHTML = `<img src="${compressed}" alt="Preview" loading="lazy" />`
    }
  } catch (error) {
    console.error('Photo processing failed:', error)
    const { showError } = await import('../../services/notifications.js')
    showError(t('photoError') || 'Erreur lors du traitement de la photo')
  }
}

window.setSpotRating = (criterion, value) => {
  window.spotFormData.ratings = window.spotFormData.ratings || {}
  window.spotFormData.ratings[criterion] = value

  // Update visual stars
  const buttons = document.querySelectorAll(`button[data-criterion="${criterion}"]`)
  buttons.forEach((btn) => {
    const star = parseInt(btn.dataset.star, 10)
    const icon = btn.querySelector('i')
    if (star <= value) {
      icon.className = 'fas fa-star text-yellow-400'
      btn.className = 'spot-star-btn text-2xl text-yellow-400 hover:text-yellow-300 transition-colors'
    } else {
      icon.className = 'far fa-star'
      btn.className = 'spot-star-btn text-2xl text-slate-500 hover:text-yellow-400 transition-colors'
    }
  })

  // Update value display
  const valueEl = document.getElementById(`spot-rating-value-${criterion}`)
  if (valueEl) valueEl.textContent = `${value}/5`

  // Update description
  const descEl = document.getElementById(`spot-rating-desc-${criterion}`)
  if (descEl) {
    const descFn = starDescriptions[criterion]
    descEl.textContent = descFn ? descFn(value) : ''
  }
}

window.onSpotTypeChange = (spotType) => {
  const container = document.getElementById('spot-conditional-fields')
  if (!container) return

  let html = ''

  if (spotType === 'city_exit') {
    html = `
      <div>
        <label for="spot-from-city" class="text-sm text-slate-400 block mb-2">${t('fromCityLabel')} <span aria-label="obligatoire">*</span></label>
        <input
          type="text"
          id="spot-from-city"
          name="fromCity"
          class="input-modern"
          placeholder="${t('fromCityPlaceholder')}"
          required
          aria-required="true"
        />
      </div>
    `
  } else if (spotType === 'gas_station') {
    html = `
      <div>
        <label for="spot-station-name" class="text-sm text-slate-400 block mb-2">${t('stationNameLabel')} <span aria-label="obligatoire">*</span></label>
        <input
          type="text"
          id="spot-station-name"
          name="stationName"
          class="input-modern"
          placeholder="${t('stationNamePlaceholder')}"
          required
          aria-required="true"
        />
      </div>
    `
  } else if (spotType === 'highway') {
    html = `
      <div>
        <label for="spot-road-number" class="text-sm text-slate-400 block mb-2">${t('roadNumberLabel')}</label>
        <input
          type="text"
          id="spot-road-number"
          name="roadNumber"
          class="input-modern"
          placeholder="${t('roadNumberPlaceholder')}"
        />
      </div>
    `
  }

  container.innerHTML = html
}

window.getSpotLocation = () => {
  const display = document.getElementById('location-display')

  if (!navigator.geolocation) {
    if (display) display.textContent = t('geoNotSupported') || 'Geolocalisation non supportee'
    return
  }

  if (display) display.innerHTML = `${icon('spinner', 'w-5 h-5 animate-spin')} ${t('locating') || 'Localisation...'}`

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      window.spotFormData.lat = position.coords.latitude
      window.spotFormData.lng = position.coords.longitude

      // Reverse geocode
      try {
        const { reverseGeocode } = await import('../../services/osrm.js')
        const location = await reverseGeocode(position.coords.latitude, position.coords.longitude)

        if (display) {
          display.innerHTML = `
            ${icon('check-circle', 'w-5 h-5 text-success-400')}
            ${location?.city || 'Position'} (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})
          `
        }
      } catch {
        if (display) {
          display.innerHTML = `
            ${icon('check-circle', 'w-5 h-5 text-success-400')}
            ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}
          `
        }
      }
    },
    (error) => {
      if (display) display.textContent = t('positionError') || "Impossible d'obtenir la position"
      console.error('Geolocation error:', error)
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

window.handleAddSpot = async (event) => {
  event.preventDefault()

  const from = document.getElementById('spot-from')?.value.trim()
  const to = document.getElementById('spot-to')?.value.trim()
  const description = document.getElementById('spot-description')?.value.trim()
  const direction = document.getElementById('spot-direction')?.value.trim()
  const spotType = document.getElementById('spot-type')?.value
  const fromCity = document.getElementById('spot-from-city')?.value?.trim() || ''
  const stationName = document.getElementById('spot-station-name')?.value?.trim() || ''
  const roadNumber = document.getElementById('spot-road-number')?.value?.trim() || ''
  const submitBtn = document.getElementById('submit-spot-btn')

  // Validation
  if (!from || !to) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('fillRequired') || 'Remplis les champs obligatoires')
    return
  }

  if (!direction) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('directionRequired'))
    return
  }

  if (!window.spotFormData.photo) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('photoRequired') || 'Une photo est requise')
    return
  }

  // Disable button
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.innerHTML = `${icon('spinner', 'w-5 h-5 animate-spin')} ${t('sending') || 'Envoi...'}`
  }

  const ratings = window.spotFormData.ratings || { safety: 0, traffic: 0, accessibility: 0 }
  const ratingValues = [ratings.safety, ratings.traffic, ratings.accessibility].filter(v => v > 0)
  const globalRating = ratingValues.length > 0
    ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
    : 0

  try {
    // Upload photo
    const { uploadImage, addSpot } = await import('../../services/firebase.js')
    const photoPath = `spots/${Date.now()}.jpg`
    const photoResult = await uploadImage(window.spotFormData.photo, photoPath)

    if (!photoResult.success) {
      throw new Error('Photo upload failed')
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
        safety: ratings.safety || 0,
        traffic: ratings.traffic || 0,
        accessibility: ratings.accessibility || 0,
      },
      globalRating,
      avgWaitTime: 30,
      spotType: spotType || 'custom',
      direction,
      fromCity,
      stationName,
      roadNumber,
    }

    const result = await addSpot(spotData)

    if (result.success) {
      const { showSuccess } = await import('../../services/notifications.js')
      const { actions, setState } = await import('../../stores/state.js')

      showSuccess(t('spotAdded') || 'Spot ajoute avec succes !')
      actions.incrementSpotsCreated()
      setState({ showAddSpot: false })

      // Reset form data
      window.spotFormData = {
        photo: null,
        lat: null,
        lng: null,
        ratings: { safety: 0, traffic: 0, accessibility: 0 },
      }

      // Show contextual tip for first spot created
      try {
        const { triggerSpotCreatedTip } = await import('../../services/contextualTips.js')
        triggerSpotCreatedTip()
      } catch (e) {
        // Silently fail if tips service not available
      }
    } else {
      throw new Error('Failed to add spot')
    }
  } catch (error) {
    console.error('Add spot failed:', error)
    const { showError } = await import('../../services/notifications.js')
    showError(t('addSpotError') || "Erreur lors de l'ajout du spot")
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.innerHTML = `${icon('share', 'w-5 h-5')} ${t('create')}`
    }
  }
}

// Character counter for description
document.addEventListener('input', (e) => {
  if (e.target.id === 'spot-description') {
    const count = document.getElementById('desc-count')
    if (count) count.textContent = e.target.value.length
  }
})

export default { renderAddSpot }
