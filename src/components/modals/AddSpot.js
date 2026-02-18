/**
 * AddSpot Modal Component
 * 3-step form to add a new hitchhiking spot with autocomplete
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
            class="spot-star-btn text-2xl text-slate-400 hover:text-yellow-400 transition-colors"
            data-criterion="${criterion}"
            data-star="${star}"
            aria-label="${star}/5"
          >
            ${icon('star', 'w-5 h-5')}
          </button>
        `).join('')}
        <span class="ml-2 text-sm text-white font-medium" id="spot-rating-value-${criterion}">-</span>
      </div>
      <p class="text-xs text-slate-400 mt-1 min-h-[1.25rem]" id="spot-rating-desc-${criterion}" aria-live="polite"></p>
    </div>
  `
}

/**
 * Render step progress indicator
 */
function renderStepProgress(currentStep) {
  const steps = [1, 2, 3]
  const labels = [
    t('step1of3') || 'Étape 1/3',
    t('step2of3') || 'Étape 2/3',
    t('step3of3') || 'Étape 3/3',
  ]
  return `
    <div class="flex items-center justify-center gap-1 mb-4">
      ${steps.map((step, i) => {
        const dotClass = step < currentStep ? 'completed' : step === currentStep ? 'current' : 'pending'
        const lineClass = step < currentStep ? 'completed' : 'pending'
        return `
          ${i > 0 ? `<div class="step-line ${lineClass}"></div>` : ''}
          <div class="step-dot ${dotClass}" title="${labels[i]}"></div>
        `
      }).join('')}
    </div>
    <p class="text-center text-xs text-slate-400 mb-4">${labels[currentStep - 1]}</p>
  `
}

/**
 * Render Step 1: Photo + Type
 */
function renderStep1(state) {
  const spotType = state.addSpotType || ''
  return `
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
          ${icon('camera', 'w-10 h-10 text-slate-400 mb-2')}
          <p class="text-slate-400">${t('takePhoto')}</p>
          <p class="text-slate-400 text-sm" id="photo-help">${t('chooseFromGallery')}</p>
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
        <option value="" disabled ${!spotType ? 'selected' : ''}>${t('selectSpotType')}</option>
        <option value="city_exit" ${spotType === 'city_exit' ? 'selected' : ''}>${t('spotTypeCityExit')}</option>
        <option value="gas_station" ${spotType === 'gas_station' ? 'selected' : ''}>${t('spotTypeGasStation')}</option>
        <option value="highway" ${spotType === 'highway' ? 'selected' : ''}>${t('spotTypeHighway')}</option>
        <option value="custom" ${spotType === 'custom' ? 'selected' : ''}>${t('spotTypeCustom')}</option>
      </select>
    </div>

    <!-- Continue button -->
    <button
      type="button"
      onclick="addSpotNextStep()"
      class="btn btn-primary w-full text-lg"
    >
      ${t('continue') || 'Continuer'}
      ${icon('arrow-right', 'w-5 h-5')}
    </button>
  `
}

/**
 * Render Step 2: Location (varies by spot type)
 */
function renderStep2(state) {
  const spotType = state.addSpotType || 'custom'
  let locationFields = ''

  if (spotType === 'city_exit') {
    locationFields = renderCityExitLocation()
  } else if (spotType === 'gas_station') {
    locationFields = renderGasStationLocation()
  } else if (spotType === 'highway') {
    locationFields = renderHighwayLocation()
  } else {
    locationFields = renderCustomLocation()
  }

  return `
    ${locationFields}

    <!-- Navigation buttons -->
    <div class="flex gap-3">
      <button
        type="button"
        onclick="addSpotPrevStep()"
        class="btn btn-ghost flex-1"
      >
        ${icon('arrow-left', 'w-5 h-5')}
        ${t('back') || 'Retour'}
      </button>
      <button
        type="button"
        onclick="addSpotNextStep()"
        class="btn btn-primary flex-1"
      >
        ${t('continue') || 'Continuer'}
        ${icon('arrow-right', 'w-5 h-5')}
      </button>
    </div>
  `
}

function renderCityExitLocation() {
  return `
    <!-- Country -->
    <div class="relative">
      <label for="spot-country" class="text-sm text-slate-400 block mb-2">${t('country') || 'Pays'}</label>
      <input
        type="text"
        id="spot-country"
        name="country"
        class="input-modern"
        placeholder="${t('selectCountry') || 'Choisir un pays'}"
        aria-required="true"
      />
    </div>

    <!-- Departure City -->
    <div class="relative">
      <label for="spot-departure-city" class="text-sm text-slate-400 block mb-2">${t('departureCity') || 'Ville de départ'} <span aria-label="obligatoire">*</span></label>
      <input
        type="text"
        id="spot-departure-city"
        name="departureCity"
        class="input-modern"
        placeholder="${t('departureCity') || 'Ville de départ'}"
        required
        aria-required="true"
      />
    </div>

    <!-- Direction City -->
    <div class="relative">
      <label for="spot-direction-city" class="text-sm text-slate-400 block mb-2">${t('directionCity') || 'Direction'} <span aria-label="obligatoire">*</span></label>
      <input
        type="text"
        id="spot-direction-city"
        name="directionCity"
        class="input-modern"
        placeholder="${t('directionCity') || 'Direction'}"
        required
        aria-required="true"
      />
    </div>

    <!-- Position -->
    ${renderPositionBlock()}
  `
}

function renderGasStationLocation() {
  return `
    <!-- Position (first for gas stations) -->
    ${renderPositionBlock()}

    <!-- Station Name -->
    <div>
      <label for="spot-station-name" class="text-sm text-slate-400 block mb-2">${t('stationName') || 'Nom de la station'}</label>
      <input
        type="text"
        id="spot-station-name"
        name="stationName"
        class="input-modern"
        placeholder="${t('stationName') || 'Nom de la station'}"
      />
      <button
        type="button"
        onclick="autoDetectStation()"
        class="btn btn-ghost btn-sm mt-2 w-full"
      >
        ${icon('search', 'w-4 h-4')}
        ${t('detecting') || 'Détection...'}
      </button>
    </div>

    <!-- Direction City -->
    <div class="relative">
      <label for="spot-direction-city" class="text-sm text-slate-400 block mb-2">${t('directionCity') || 'Direction'} <span aria-label="obligatoire">*</span></label>
      <input
        type="text"
        id="spot-direction-city"
        name="directionCity"
        class="input-modern"
        placeholder="${t('directionCity') || 'Direction'}"
        required
        aria-required="true"
      />
    </div>
  `
}

function renderHighwayLocation() {
  return `
    <!-- Position -->
    ${renderPositionBlock()}

    <!-- Road Name/Number -->
    <div>
      <label for="spot-road-name" class="text-sm text-slate-400 block mb-2">${t('roadName') || 'Nom/numéro de route'}</label>
      <input
        type="text"
        id="spot-road-name"
        name="roadName"
        class="input-modern"
        placeholder="${t('roadName') || 'Nom/numéro de route'}"
      />
      <button
        type="button"
        onclick="autoDetectRoad()"
        class="btn btn-ghost btn-sm mt-2 w-full"
      >
        ${icon('search', 'w-4 h-4')}
        ${t('detecting') || 'Détection...'}
      </button>
    </div>

    <!-- Direction City -->
    <div class="relative">
      <label for="spot-direction-city" class="text-sm text-slate-400 block mb-2">${t('directionCity') || 'Direction'} <span aria-label="obligatoire">*</span></label>
      <input
        type="text"
        id="spot-direction-city"
        name="directionCity"
        class="input-modern"
        placeholder="${t('directionCity') || 'Direction'}"
        required
        aria-required="true"
      />
    </div>
  `
}

function renderCustomLocation() {
  return `
    <!-- Position -->
    ${renderPositionBlock()}

    <!-- Location Description -->
    <div>
      <label for="spot-location-desc" class="text-sm text-slate-400 block mb-2">${t('locationDesc') || 'Description du lieu'}</label>
      <input
        type="text"
        id="spot-location-desc"
        name="locationDesc"
        class="input-modern"
        placeholder="${t('locationDesc') || 'Description du lieu'}"
      />
    </div>

    <!-- Direction City -->
    <div class="relative">
      <label for="spot-direction-city" class="text-sm text-slate-400 block mb-2">${t('directionCity') || 'Direction'} <span aria-label="obligatoire">*</span></label>
      <input
        type="text"
        id="spot-direction-city"
        name="directionCity"
        class="input-modern"
        placeholder="${t('directionCity') || 'Direction'}"
        required
        aria-required="true"
      />
    </div>
  `
}

function renderPositionBlock() {
  return `
    <div>
      <span class="text-sm text-slate-400 block mb-2" id="location-label">${t('position') || 'Position'} <span aria-label="obligatoire">*</span></span>
      <div class="flex gap-2">
        <button
          type="button"
          onclick="useGPSForSpot()"
          class="btn btn-ghost flex-1"
          aria-describedby="location-display"
        >
          ${icon('crosshair', 'w-5 h-5')}
          ${t('useMyPosition') || 'Ma position GPS'}
        </button>
        <button
          type="button"
          onclick="toggleSpotMapPicker()"
          class="btn btn-ghost flex-1"
        >
          ${icon('map-pin', 'w-5 h-5')}
          ${t('pickOnMap') || 'Pointer sur la carte'}
        </button>
      </div>
      <div id="location-display" class="text-sm text-slate-400 mt-2 text-center" aria-live="polite" role="status"></div>
      <div id="spot-map-container" class="hidden mt-3">
        <p class="text-xs text-center text-slate-400 mb-2">${t('tapToPlacePin') || 'Toucher pour placer'}</p>
        <div id="spot-mini-map" class="spot-map-picker"></div>
      </div>
    </div>
  `
}

/**
 * Render Step 3: Details (description + ratings)
 */
function renderStep3(state) {
  const isPreview = state.addSpotPreview === true
  const tags = window.spotFormData.tags || { signMethod: null, hasShelter: false }
  return `
    <!-- Practical Tags -->
    <div>
      <label class="text-sm text-slate-400 block mb-2">
        ${icon('tag', 'w-4 h-4 mr-1 text-primary-400')}
        ${t('practicalTips') || 'Practical tips'}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          onclick="setSpotTag('signMethod', 'sign')"
          class="px-4 py-2 rounded-full text-sm font-medium border transition-all
            ${tags.signMethod === 'sign'
              ? 'bg-primary-500/20 border-primary-500 text-primary-400'
              : 'bg-white/5 border-white/10 hover:border-white/30 text-slate-300'}"
        >
          ${icon('file-text', 'w-4 h-4 mr-1')}
          ${t('signMethod') || 'Sign'}
        </button>
        <button
          type="button"
          onclick="setSpotTag('signMethod', 'thumb')"
          class="px-4 py-2 rounded-full text-sm font-medium border transition-all
            ${tags.signMethod === 'thumb'
              ? 'bg-primary-500/20 border-primary-500 text-primary-400'
              : 'bg-white/5 border-white/10 hover:border-white/30 text-slate-300'}"
        >
          ${icon('hand', 'w-4 h-4 mr-1')}
          ${t('thumbMethod') || 'Thumb'}
        </button>
        <button
          type="button"
          onclick="setSpotTag('hasShelter', ${!tags.hasShelter})"
          class="px-4 py-2 rounded-full text-sm font-medium border transition-all
            ${tags.hasShelter
              ? 'bg-primary-500/20 border-primary-500 text-primary-400'
              : 'bg-white/5 border-white/10 hover:border-white/30 text-slate-300'}"
        >
          ${icon('umbrella', 'w-4 h-4 mr-1')}
          ${t('hasShelter') || 'Rain shelter'}
        </button>
      </div>
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
      <div class="text-right text-xs text-slate-400 mt-1" id="desc-counter" aria-live="polite">
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

    <!-- Navigation + Submit -->
    <div class="flex gap-3">
      <button
        type="button"
        onclick="addSpotPrevStep()"
        class="btn btn-ghost flex-1"
      >
        ${icon('arrow-left', 'w-5 h-5')}
        ${t('back') || 'Retour'}
      </button>
      ${isPreview ? `
      <button
        type="button"
        onclick="closeAddSpot()"
        class="btn flex-1 text-lg bg-amber-500/20 text-amber-400 border border-amber-500/30"
        id="submit-spot-btn"
      >
        ${icon('eye', 'w-5 h-5')}
        ${t('previewModeClose')}
      </button>
      ` : `
      <button
        type="submit"
        class="btn btn-primary flex-1 text-lg"
        id="submit-spot-btn"
      >
        ${icon('share', 'w-5 h-5')}
        ${t('createSpot') || t('create')}
      </button>
      `}
    </div>
  `
}

/**
 * Render offline draft button (shown when offline at step 2)
 */
function renderOfflineDraftButton() {
  if (navigator.onLine) return ''
  return `
    <div class="mt-3 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20">
      <p class="text-sm text-warning-400 mb-2">${t('offlineMode') || 'Mode hors-ligne'}</p>
      <button
        type="button"
        onclick="saveSpotAsDraft()"
        class="btn btn-warning btn-sm w-full"
      >
        ${icon('save', 'w-4 h-4')}
        ${t('saveDraft') || 'Sauvegarder le brouillon'}
      </button>
    </div>
  `
}

export function renderAddSpot(_state) {
  const isPreview = _state.addSpotPreview === true
  const currentStep = _state.addSpotStep || 1

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
            ${icon('x', 'w-5 h-5')}
          </button>
        </div>

        <!-- Form -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          ${renderStepProgress(currentStep)}

          <form id="add-spot-form" onsubmit="handleAddSpot(event)" class="space-y-5" aria-label="${t('addSpotForm') || 'Formulaire d\'ajout de spot'}">
            ${currentStep === 1 ? renderStep1(_state) : ''}
            ${currentStep === 2 ? renderStep2(_state) : ''}
            ${currentStep === 3 ? renderStep3(_state) : ''}
            ${currentStep === 2 ? renderOfflineDraftButton() : ''}
          </form>
        </div>
      </div>
    </div>
  `
}

// Form state
window.spotFormData = window.spotFormData || {
  photo: null,
  lat: null,
  lng: null,
  ratings: {
    safety: 0,
    traffic: 0,
    accessibility: 0,
  },
  tags: {
    signMethod: null,
    hasShelter: false,
  },
  // New structured fields
  country: null,
  countryName: null,
  departureCity: null,
  departureCityCoords: null,
  directionCity: null,
  directionCityCoords: null,
  locationName: null,
  roadNumber: null,
  positionSource: null,
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

  try {
    const { compressImage } = await import('../../utils/image.js')
    const compressed = await compressImage(file)
    window.spotFormData.photo = compressed

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

  const buttons = document.querySelectorAll(`button[data-criterion="${criterion}"]`)
  buttons.forEach((btn) => {
    const star = parseInt(btn.dataset.star, 10)
    const svg = btn.querySelector('svg')
    if (svg) {
      svg.setAttribute('fill', star <= value ? 'currentColor' : 'none')
    }
    if (star <= value) {
      btn.className = 'spot-star-btn text-2xl text-yellow-400 hover:text-yellow-300 transition-colors'
    } else {
      btn.className = 'spot-star-btn text-2xl text-slate-400 hover:text-yellow-400 transition-colors'
    }
  })

  const valueEl = document.getElementById(`spot-rating-value-${criterion}`)
  if (valueEl) valueEl.textContent = `${value}/5`

  const descEl = document.getElementById(`spot-rating-desc-${criterion}`)
  if (descEl) {
    const descFn = starDescriptions[criterion]
    descEl.textContent = descFn ? descFn(value) : ''
  }
}

window.setSpotTag = (tagName, value) => {
  window.spotFormData.tags = window.spotFormData.tags || { signMethod: null, hasShelter: false }
  if (tagName === 'signMethod') {
    // Radio-style: toggle off if same value clicked
    window.spotFormData.tags.signMethod = window.spotFormData.tags.signMethod === value ? null : value
  } else if (tagName === 'hasShelter') {
    window.spotFormData.tags.hasShelter = value === true || value === 'true'
  }
  // Re-render to update button states
  import('../../stores/state.js').then(({ getState, setState }) => {
    setState({ _tagRefresh: Date.now() })
  })
}

window.onSpotTypeChange = (spotType) => {
  import('../../stores/state.js').then(({ setState }) => {
    setState({ addSpotType: spotType })
  })
}

// Step navigation
window.addSpotNextStep = async () => {
  const { getState, setState } = await import('../../stores/state.js')
  const { showError } = await import('../../services/notifications.js')
  const state = getState()
  const currentStep = state.addSpotStep || 1

  if (currentStep === 1) {
    // Validate photo + type
    if (!window.spotFormData.photo) {
      showError(t('photoRequired') || 'Une photo est requise')
      return
    }
    const spotType = state.addSpotType || document.getElementById('spot-type')?.value
    if (!spotType) {
      showError(t('selectSpotType') || 'Choisis un type de spot')
      return
    }
    setState({ addSpotStep: 2, addSpotType: spotType })
  } else if (currentStep === 2) {
    // Validate location fields based on type
    const spotType = state.addSpotType

    // Position is always required
    if (!window.spotFormData.lat || !window.spotFormData.lng) {
      showError(t('positionRequired') || 'Position obligatoire')
      return
    }

    // Direction is always required
    if (!window.spotFormData.directionCity) {
      showError(t('directionRequired') || 'Direction obligatoire')
      return
    }

    // City exit needs departure city
    if (spotType === 'city_exit' && !window.spotFormData.departureCity) {
      showError(t('departureCityRequired') || 'Ville de départ obligatoire')
      return
    }

    setState({ addSpotStep: 3 })
  }
}

window.addSpotPrevStep = async () => {
  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const currentStep = state.addSpotStep || 1
  if (currentStep > 1) {
    setState({ addSpotStep: currentStep - 1 })
  }
}

// GPS position
window.useGPSForSpot = () => {
  const display = document.getElementById('location-display')

  if (!navigator.geolocation) {
    if (display) display.textContent = t('geoNotSupported') || 'Geolocalisation non supportee'
    return
  }

  if (display) display.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin')} ${t('locating') || 'Localisation...'}`

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      window.spotFormData.lat = position.coords.latitude
      window.spotFormData.lng = position.coords.longitude
      window.spotFormData.positionSource = 'gps'

      try {
        const { reverseGeocode } = await import('../../services/osrm.js')
        const location = await reverseGeocode(position.coords.latitude, position.coords.longitude)

        if (location) {
          // Auto-fill country
          if (location.countryCode) {
            window.spotFormData.country = location.countryCode
            window.spotFormData.countryName = location.country
            const countryInput = document.getElementById('spot-country')
            if (countryInput) countryInput.value = location.country || ''
          }

          // Auto-fill departure city for city_exit
          if (location.city) {
            const departureCityInput = document.getElementById('spot-departure-city')
            if (departureCityInput && !departureCityInput.value) {
              departureCityInput.value = location.city
              window.spotFormData.departureCity = location.city
              window.spotFormData.departureCityCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
            }
          }

          if (display) {
            display.innerHTML = `
              ${icon('circle-check', 'w-5 h-5 text-success-400')}
              ${location.city || 'Position'} (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})
            `
          }
        }
      } catch {
        if (display) {
          display.innerHTML = `
            ${icon('circle-check', 'w-5 h-5 text-success-400')}
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

// Map picker
let miniMap = null

window.toggleSpotMapPicker = async () => {
  const container = document.getElementById('spot-map-container')
  if (!container) return

  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden')
    if (miniMap) { miniMap.remove(); miniMap = null }
    return
  }

  container.classList.remove('hidden')

  // Lazy-load MapLibre
  try {
    const maplibregl = await import('maplibre-gl')
    const mapDiv = document.getElementById('spot-mini-map')
    if (!mapDiv) return

    const center = window.spotFormData.lng
      ? [window.spotFormData.lng, window.spotFormData.lat]
      : [2.35, 48.85]

    miniMap = new maplibregl.default.Map({
      container: mapDiv,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center,
      zoom: 13,
    })

    let marker = null

    // If position already set, show marker
    if (window.spotFormData.lat) {
      marker = new maplibregl.default.Marker({ color: '#f59e0b' })
        .setLngLat([window.spotFormData.lng, window.spotFormData.lat])
        .addTo(miniMap)
    }

    miniMap.on('click', async (e) => {
      const { lng, lat } = e.lngLat
      window.spotFormData.lat = lat
      window.spotFormData.lng = lng
      window.spotFormData.positionSource = 'map'

      if (marker) marker.remove()
      marker = new maplibregl.default.Marker({ color: '#f59e0b' })
        .setLngLat([lng, lat])
        .addTo(miniMap)

      const display = document.getElementById('location-display')
      if (display) {
        display.innerHTML = `${icon('circle-check', 'w-5 h-5 text-success-400')} ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }

      // Reverse geocode to fill fields
      try {
        const { reverseGeocode } = await import('../../services/osrm.js')
        const location = await reverseGeocode(lat, lng)
        if (location?.countryCode) {
          window.spotFormData.country = location.countryCode
          window.spotFormData.countryName = location.country
          const countryInput = document.getElementById('spot-country')
          if (countryInput) countryInput.value = location.country || ''
        }
        if (location?.city) {
          const departureCityInput = document.getElementById('spot-departure-city')
          if (departureCityInput && !departureCityInput.value) {
            departureCityInput.value = location.city
            window.spotFormData.departureCity = location.city
            window.spotFormData.departureCityCoords = { lat, lng }
          }
        }
        if (display && location?.city) {
          display.innerHTML = `${icon('circle-check', 'w-5 h-5 text-success-400')} ${location.city} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        }
      } catch { /* no-op */ }
    })
  } catch (error) {
    console.error('Map picker failed:', error)
    container.classList.add('hidden')
  }
}

window.spotMapPickLocation = () => {
  // Handled by map click listener above
}

// Auto-detect station name
window.autoDetectStation = async () => {
  if (!window.spotFormData.lat || !window.spotFormData.lng) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('positionRequired') || 'Position obligatoire')
    return
  }

  try {
    const { reverseGeocode } = await import('../../services/osrm.js')
    const location = await reverseGeocode(window.spotFormData.lat, window.spotFormData.lng)
    const nameInput = document.getElementById('spot-station-name')
    if (location?.name && nameInput) {
      // Extract station/amenity name from display_name
      const parts = location.name.split(',')
      nameInput.value = parts[0].trim()
      window.spotFormData.locationName = parts[0].trim()
    } else {
      const { showInfo } = await import('../../services/notifications.js')
      showInfo(t('noStationFound') || 'Aucune station trouvée')
    }
  } catch {
    const { showInfo } = await import('../../services/notifications.js')
    showInfo(t('noStationFound') || 'Aucune station trouvée')
  }
}

// Auto-detect road
window.autoDetectRoad = async () => {
  if (!window.spotFormData.lat || !window.spotFormData.lng) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('positionRequired') || 'Position obligatoire')
    return
  }

  try {
    const { reverseGeocode } = await import('../../services/osrm.js')
    const location = await reverseGeocode(window.spotFormData.lat, window.spotFormData.lng)
    const nameInput = document.getElementById('spot-road-name')
    if (location?.name && nameInput) {
      const parts = location.name.split(',')
      nameInput.value = parts[0].trim()
      window.spotFormData.roadNumber = parts[0].trim()
    }
  } catch { /* no-op */ }
}

// Draft saving
window.saveSpotAsDraft = async () => {
  const { saveSpotDraft } = await import('../../services/spotDrafts.js')
  const { setState } = await import('../../stores/state.js')
  const { showSuccess } = await import('../../services/notifications.js')

  saveSpotDraft({
    photo: window.spotFormData.photo,
    spotType: (await import('../../stores/state.js')).getState().addSpotType,
    lat: window.spotFormData.lat,
    lng: window.spotFormData.lng,
    country: window.spotFormData.country,
    countryName: window.spotFormData.countryName,
    positionSource: window.spotFormData.positionSource,
  })

  showSuccess(t('draftSaved') || 'Brouillon sauvegardé !')
  setState({ showAddSpot: false })
}

window.openSpotDraft = async (draftId) => {
  const { getSpotDrafts } = await import('../../services/spotDrafts.js')
  const { setState } = await import('../../stores/state.js')
  const drafts = getSpotDrafts()
  const draft = drafts.find(d => d.id === draftId)
  if (!draft) return

  // Restore form data
  window.spotFormData.photo = draft.photo
  window.spotFormData.lat = draft.lat
  window.spotFormData.lng = draft.lng
  window.spotFormData.country = draft.country
  window.spotFormData.countryName = draft.countryName
  window.spotFormData.positionSource = draft.positionSource

  setState({
    showAddSpot: true,
    addSpotStep: 2,
    addSpotType: draft.spotType,
  })
}

window.deleteSpotDraft = async (draftId) => {
  const { deleteSpotDraft } = await import('../../services/spotDrafts.js')
  deleteSpotDraft(draftId)
  const { showToast } = await import('../../services/notifications.js')
  showToast(t('deleteDraft') || 'Brouillon supprimé', 'info')
}

// Initialize autocomplete fields when step 2 renders
let autocompleteCleanups = []

function initStep2Autocomplete() {
  // Clean up previous instances
  autocompleteCleanups.forEach(c => c.destroy())
  autocompleteCleanups = []

  // Only init if we're online
  if (!navigator.onLine) return

  import('../../utils/autocomplete.js').then(({ initAutocomplete }) => {
    import('../../services/osrm.js').then(({ searchCities, searchCountries }) => {
      // Country autocomplete
      const countryInput = document.getElementById('spot-country')
      if (countryInput) {
        const ac = initAutocomplete({
          inputId: 'spot-country',
          searchFn: (q) => searchCountries(q),
          onSelect: (item) => {
            window.spotFormData.country = item.code
            window.spotFormData.countryName = item.name
          },
          renderItem: (item) => `<div class="font-medium text-sm">${item.name} (${item.code})</div>`,
        })
        autocompleteCleanups.push(ac)
      }

      // Departure city autocomplete (filtered by country)
      const depInput = document.getElementById('spot-departure-city')
      if (depInput) {
        const ac = initAutocomplete({
          inputId: 'spot-departure-city',
          searchFn: (q) => searchCities(q, { countryCode: window.spotFormData.country }),
          onSelect: (item) => {
            window.spotFormData.departureCity = item.name
            window.spotFormData.departureCityCoords = { lat: item.lat, lng: item.lng }
            if (item.countryCode && !window.spotFormData.country) {
              window.spotFormData.country = item.countryCode
              window.spotFormData.countryName = item.countryName
              const countryEl = document.getElementById('spot-country')
              if (countryEl) countryEl.value = item.countryName || ''
            }
          },
        })
        autocompleteCleanups.push(ac)
      }

      // Direction city autocomplete
      const dirInput = document.getElementById('spot-direction-city')
      if (dirInput) {
        const ac = initAutocomplete({
          inputId: 'spot-direction-city',
          searchFn: (q) => searchCities(q, {}),
          onSelect: (item) => {
            window.spotFormData.directionCity = item.name
            window.spotFormData.directionCityCoords = { lat: item.lat, lng: item.lng }
          },
        })
        autocompleteCleanups.push(ac)
      }
    })
  })
}

// Watch for DOM changes to init autocomplete
const observer = new MutationObserver(() => {
  if (document.getElementById('spot-departure-city') || document.getElementById('spot-direction-city')) {
    initStep2Autocomplete()
  }
})

if (typeof document !== 'undefined') {
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true })
}

window.handleAddSpot = async (event) => {
  event.preventDefault()

  const { getState } = await import('../../stores/state.js')
  const state = getState()
  const spotType = state.addSpotType || 'custom'
  const description = document.getElementById('spot-description')?.value.trim()
  const submitBtn = document.getElementById('submit-spot-btn')

  // Gather location-specific fields
  const stationName = document.getElementById('spot-station-name')?.value?.trim() || ''
  const roadName = document.getElementById('spot-road-name')?.value?.trim() || ''
  const locationDesc = document.getElementById('spot-location-desc')?.value?.trim() || ''

  // Build legacy fields for backward compatibility
  const from = window.spotFormData.departureCity || ''
  const to = window.spotFormData.directionCity || ''
  const direction = window.spotFormData.directionCity || ''

  // Validation
  if (!window.spotFormData.photo) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('photoRequired') || 'Une photo est requise')
    return
  }

  if (!window.spotFormData.lat || !window.spotFormData.lng) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('positionRequired') || 'Position obligatoire')
    return
  }

  if (!direction) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('directionRequired'))
    return
  }

  // Proximity check
  if (window.spotFormData.lat && window.spotFormData.lng) {
    const { checkProximity } = await import('../../services/proximityVerification.js')
    const proximity = checkProximity(
      window.spotFormData.lat,
      window.spotFormData.lng,
      state.userLocation
    )
    if (!proximity.allowed) {
      const { showError } = await import('../../services/notifications.js')
      showError(t('proximityRequired') || `Tu dois être passé à moins de 5 km de ce spot dans les dernières 24h (${proximity.distanceKm} km)`)
      return
    }
  }

  // Disable button
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin')} ${t('sending') || 'Envoi...'}`
  }

  const ratings = window.spotFormData.ratings || { safety: 0, traffic: 0, accessibility: 0 }
  const ratingValues = [ratings.safety, ratings.traffic, ratings.accessibility].filter(v => v > 0)
  const globalRating = ratingValues.length > 0
    ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
    : 0

  try {
    const { uploadImage, addSpot } = await import('../../services/firebase.js')
    const photoPath = `spots/${Date.now()}.jpg`
    const photoResult = await uploadImage(window.spotFormData.photo, photoPath)

    if (!photoResult.success) {
      throw new Error('Photo upload failed')
    }

    const spotData = {
      // New structured fields
      country: window.spotFormData.country || '',
      countryName: window.spotFormData.countryName || '',
      departureCity: window.spotFormData.departureCity || '',
      departureCityCoords: window.spotFormData.departureCityCoords || null,
      directionCity: window.spotFormData.directionCity || '',
      directionCityCoords: window.spotFormData.directionCityCoords || null,
      locationName: stationName || roadName || locationDesc || '',
      roadNumber: roadName || '',
      positionSource: window.spotFormData.positionSource || 'gps',

      // Legacy fields (backward compat)
      from: from || window.spotFormData.departureCity || '',
      to: to || window.spotFormData.directionCity || '',
      direction: direction || '',

      // Standard fields
      description,
      photoUrl: photoResult.url,
      coordinates: {
        lat: window.spotFormData.lat,
        lng: window.spotFormData.lng,
      },
      ratings: {
        safety: ratings.safety || 0,
        traffic: ratings.traffic || 0,
        accessibility: ratings.accessibility || 0,
      },
      globalRating,
      avgWaitTime: 30,
      spotType,
      fromCity: from,
      stationName,
      roadNumber: roadName,
      tags: window.spotFormData.tags || { signMethod: null, hasShelter: false },
    }

    const result = await addSpot(spotData)

    if (result.success) {
      const { showSuccess } = await import('../../services/notifications.js')
      const { actions, setState: setStateFn } = await import('../../stores/state.js')

      showSuccess(t('spotAdded') || 'Spot ajoute avec succes !')
      actions.incrementSpotsCreated()
      setStateFn({ showAddSpot: false, addSpotStep: 1, addSpotType: null })

      // Reset form data
      window.spotFormData = {
        photo: null, lat: null, lng: null,
        ratings: { safety: 0, traffic: 0, accessibility: 0 },
        tags: { signMethod: null, hasShelter: false },
        country: null, countryName: null,
        departureCity: null, departureCityCoords: null,
        directionCity: null, directionCityCoords: null,
        locationName: null, roadNumber: null, positionSource: null,
      }

      // Show contextual tip for first spot created
      try {
        const { triggerSpotCreatedTip } = await import('../../services/contextualTips.js')
        triggerSpotCreatedTip()
      } catch { /* no-op */ }
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
      submitBtn.innerHTML = `${icon('share', 'w-5 h-5')} ${t('createSpot') || t('create')}`
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
