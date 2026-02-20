/**
 * AddSpot Modal Component
 * 3-step form to add a new hitchhiking spot with structured data collection
 *
 * Step 1: Photo + Type + GPS position + departure city
 * Step 2: Destination + Experience (wait time, method, group, time of day)
 * Step 3: Details (ratings, amenities, description) + Submit
 *
 * All data is structured for city pages, SEO, and future API export.
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

// Wait time slider steps (minutes)
const WAIT_STEPS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180]

/**
 * Detect current season from date
 */
function detectSeason() {
  const month = new Date().getMonth() // 0-11
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

function seasonLabel(season) {
  const labels = { spring: 'seasonSpring', summer: 'seasonSummer', autumn: 'seasonAutumn', winter: 'seasonWinter' }
  return t(labels[season]) || season
}

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
    t('stepPhotoType') || 'Photo & Type',
    t('stepExperience') || 'Experience',
    t('stepDetails') || 'Details',
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
 * Render Step 1: Photo + Type + Position + Departure City
 */
function renderStep1(state) {
  const spotType = state.addSpotType || ''
  return `
    <div class="step-transition">
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

      <!-- Spot Type - Big visual buttons -->
      <div>
        <label class="text-sm text-slate-400 block mb-2">${t('spotTypeLabel')} <span aria-label="obligatoire">*</span></label>
        <div class="spot-type-grid">
          <button type="button" onclick="selectSpotType('city_exit')"
            class="spot-type-btn ${spotType === 'city_exit' ? 'active' : ''}">
            <span class="text-2xl">🏙️</span>
            <span class="text-xs font-medium">${t('spotTypeCityExit')}</span>
          </button>
          <button type="button" onclick="selectSpotType('gas_station')"
            class="spot-type-btn ${spotType === 'gas_station' ? 'active' : ''}">
            <span class="text-2xl">⛽</span>
            <span class="text-xs font-medium">${t('spotTypeGasStation')}</span>
          </button>
          <button type="button" onclick="selectSpotType('highway')"
            class="spot-type-btn ${spotType === 'highway' ? 'active' : ''}">
            <span class="text-2xl">🛣️</span>
            <span class="text-xs font-medium">${t('spotTypeHighway')}</span>
          </button>
          <button type="button" onclick="selectSpotType('custom')"
            class="spot-type-btn ${spotType === 'custom' ? 'active' : ''}">
            <span class="text-2xl">📍</span>
            <span class="text-xs font-medium">${t('spotTypeCustom')}</span>
          </button>
        </div>
      </div>

      <!-- GPS Position -->
      ${renderPositionBlock()}

      <!-- Departure City (autocomplete forced) -->
      <div class="relative">
        <label for="spot-departure-city" class="text-sm text-slate-400 block mb-2">
          ${t('departureCity') || 'Ville de départ'} <span aria-label="obligatoire">*</span>
        </label>
        <input
          type="text"
          id="spot-departure-city"
          name="departureCity"
          class="input-modern"
          placeholder="${t('departureCity') || 'Ville de départ'}"
          required
          aria-required="true"
        />
        <p class="text-xs text-slate-500 mt-1">${t('selectFromList') || 'Sélectionne dans la liste'}</p>
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
    </div>
  `
}

/**
 * Render Step 2: Destination + Experience
 */
function renderStep2(state) {
  const waitIdx = state.addSpotWaitTime != null
    ? WAIT_STEPS.indexOf(state.addSpotWaitTime)
    : -1
  const currentWait = waitIdx >= 0 ? WAIT_STEPS[waitIdx] : null
  const method = state.addSpotMethod || ''
  const groupSize = state.addSpotGroupSize || ''
  const timeOfDay = state.addSpotTimeOfDay || ''

  return `
    <div class="step-transition">
      <h3 class="text-sm font-semibold text-slate-300 mb-4">
        ${icon('compass', 'w-4 h-4 mr-1 text-primary-400')}
        ${t('experienceSection') || 'Ton expérience'}
      </h3>

      <!-- Direction City (autocomplete forced) -->
      <div class="relative mb-4">
        <label for="spot-direction-city" class="text-sm text-slate-400 block mb-2">
          ${t('destinationCity') || 'Direction'} <span aria-label="obligatoire">*</span>
        </label>
        <input
          type="text"
          id="spot-direction-city"
          name="directionCity"
          class="input-modern"
          placeholder="${t('destinationCity') || 'Direction'}"
          required
          aria-required="true"
        />
        <p class="text-xs text-slate-500 mt-1">${t('selectFromList') || 'Sélectionne dans la liste'}</p>
      </div>

      <!-- Wait Time Slider -->
      <div class="mb-4">
        <label class="text-sm text-slate-400 block mb-2">
          ${icon('clock', 'w-4 h-4 mr-1')}
          ${t('waitTimeLabel') || "Temps d'attente"}
        </label>
        <input
          type="range"
          min="0"
          max="${WAIT_STEPS.length - 1}"
          value="${waitIdx >= 0 ? waitIdx : 4}"
          class="wait-slider w-full"
          oninput="setWaitTime(this.value)"
          aria-label="${t('waitTimeSliderDesc') || 'Combien de temps as-tu attendu ?'}"
        />
        <div class="wait-slider-labels">
          <span>1 min</span>
          <span>15</span>
          <span>45</span>
          <span>2h</span>
          <span>3h+</span>
        </div>
        <div class="text-center text-lg font-bold text-primary-400 mt-2" id="wait-time-display">
          ${currentWait ? (currentWait >= 180 ? '3h+' : currentWait + ' min') : '10 min'}
        </div>
      </div>

      <!-- Method (3 radio buttons) -->
      <div class="mb-4">
        <label class="text-sm text-slate-400 block mb-2">
          ${icon('hand', 'w-4 h-4 mr-1')}
          ${t('practicalTips') || 'Méthode'}
        </label>
        <div class="radio-group">
          <button type="button" onclick="setMethod('sign')"
            class="radio-btn ${method === 'sign' ? 'active' : ''}">
            ${icon('file-text', 'w-4 h-4 mr-1')} ${t('methodSign') || 'Panneau'}
          </button>
          <button type="button" onclick="setMethod('thumb')"
            class="radio-btn ${method === 'thumb' ? 'active' : ''}">
            ${icon('hand', 'w-4 h-4 mr-1')} ${t('methodThumb') || 'Pouce'}
          </button>
          <button type="button" onclick="setMethod('asking')"
            class="radio-btn ${method === 'asking' ? 'active' : ''}">
            ${icon('message-circle', 'w-4 h-4 mr-1')} ${t('methodAsking') || 'En demandant'}
          </button>
        </div>
      </div>

      <!-- Group Size (3 radio buttons) -->
      <div class="mb-4">
        <label class="text-sm text-slate-400 block mb-2">
          ${icon('users', 'w-4 h-4 mr-1')}
          ${t('groupSizeLabel') || 'Combien étiez-vous ?'}
        </label>
        <div class="radio-group">
          <button type="button" onclick="setGroupSize('solo')"
            class="radio-btn ${groupSize === 'solo' ? 'active' : ''}">
            ${t('groupSolo') || 'Solo'}
          </button>
          <button type="button" onclick="setGroupSize('duo')"
            class="radio-btn ${groupSize === 'duo' ? 'active' : ''}">
            ${t('groupDuo') || 'Duo'}
          </button>
          <button type="button" onclick="setGroupSize('group')"
            class="radio-btn ${groupSize === 'group' ? 'active' : ''}">
            ${t('groupTrioPlus') || 'Groupe 3+'}
          </button>
        </div>
      </div>

      <!-- Time of Day (4 radio buttons) -->
      <div class="mb-4">
        <label class="text-sm text-slate-400 block mb-2">
          ${icon('sun', 'w-4 h-4 mr-1')}
          ${t('timeOfDayLabel') || 'Moment de la journée'}
        </label>
        <div class="radio-group">
          <button type="button" onclick="setTimeOfDay('morning')"
            class="radio-btn ${timeOfDay === 'morning' ? 'active' : ''}">
            🌅 ${t('timeMorning') || 'Matin'}
          </button>
          <button type="button" onclick="setTimeOfDay('afternoon')"
            class="radio-btn ${timeOfDay === 'afternoon' ? 'active' : ''}">
            ☀️ ${t('timeAfternoon') || 'Après-midi'}
          </button>
          <button type="button" onclick="setTimeOfDay('evening')"
            class="radio-btn ${timeOfDay === 'evening' ? 'active' : ''}">
            🌆 ${t('timeEvening') || 'Soir'}
          </button>
          <button type="button" onclick="setTimeOfDay('night')"
            class="radio-btn ${timeOfDay === 'night' ? 'active' : ''}">
            🌙 ${t('timeNight') || 'Nuit'}
          </button>
        </div>
      </div>

      <!-- Season (auto-detected, shown as info) -->
      <div class="mb-4 text-sm text-slate-500 flex items-center gap-2">
        ${icon('calendar', 'w-4 h-4')}
        ${t('seasonLabel') || 'Saison'}: <span class="text-slate-300 font-medium">${seasonLabel(detectSeason())}</span>
      </div>

      <!-- Navigation buttons -->
      <div class="flex gap-3">
        <button type="button" onclick="addSpotPrevStep()" class="btn btn-ghost flex-1">
          ${icon('arrow-left', 'w-5 h-5')} ${t('back') || 'Retour'}
        </button>
        <button type="button" onclick="addSpotNextStep()" class="btn btn-primary flex-1">
          ${t('continue') || 'Continuer'} ${icon('arrow-right', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

/**
 * Render Step 3: Details (ratings + amenities + description) + Submit
 */
function renderStep3(state) {
  const isPreview = state.addSpotPreview === true
  const tags = window.spotFormData.tags || {}
  return `
    <div class="step-transition">
      <!-- Ratings -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">
          ${icon('star', 'w-4 h-4 mr-1 text-yellow-400')}
          ${t('detailedRatings')}
        </h3>
        ${renderStarInput('safety', t('safetyRating'))}
        ${renderStarInput('traffic', t('traffic'))}
        ${renderStarInput('accessibility', t('accessibility'))}
      </div>

      <!-- Amenities -->
      <div class="mb-5">
        <label class="text-sm text-slate-400 block mb-2">
          ${icon('map-pin', 'w-4 h-4 mr-1 text-emerald-400')}
          ${t('amenitiesLabel') || 'Équipements à proximité'}
        </label>
        <div class="flex flex-wrap gap-2">
          <button type="button" onclick="toggleAmenity('shelter')"
            class="amenity-chip ${tags.shelter ? 'active' : ''}">
            ${icon('umbrella', 'w-4 h-4 mr-1')} ${t('amenityShelter') || 'Abri pluie'}
          </button>
          <button type="button" onclick="toggleAmenity('waterFood')"
            class="amenity-chip ${tags.waterFood ? 'active' : ''}">
            ${icon('droplets', 'w-4 h-4 mr-1')} ${t('amenityWaterFood') || 'Eau/nourriture'}
          </button>
          <button type="button" onclick="toggleAmenity('toilets')"
            class="amenity-chip ${tags.toilets ? 'active' : ''}">
            🚻 ${t('amenityToilets') || 'Toilettes'}
          </button>
          <button type="button" onclick="toggleAmenity('visibility')"
            class="amenity-chip ${tags.visibility ? 'active' : ''}">
            ${icon('eye', 'w-4 h-4 mr-1')} ${t('goodVisibilityTag') || 'Visible de loin'}
          </button>
          <button type="button" onclick="toggleAmenity('stoppingSpace')"
            class="amenity-chip ${tags.stoppingSpace ? 'active' : ''}">
            ${icon('square-parking', 'w-4 h-4 mr-1')} ${t('stoppingSpaceTag') || "Place pour s'arrêter"}
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="mb-5">
        <label for="spot-description" class="text-sm text-slate-400 block mb-2">${t('description')}</label>
        <textarea
          id="spot-description"
          name="description"
          class="input-modern min-h-[100px] resize-none"
          placeholder="${t('spotDescPlaceholder') || 'Décris le spot, comment y accéder, conseils...'}"
          maxlength="500"
          aria-describedby="desc-counter"
        ></textarea>
        <div class="text-right text-xs text-slate-400 mt-1" id="desc-counter" aria-live="polite">
          <span id="desc-count">0</span>/500 <span class="sr-only">caractères</span>
        </div>
      </div>

      <!-- Navigation + Submit -->
      <div class="flex gap-3">
        <button type="button" onclick="addSpotPrevStep()" class="btn btn-ghost flex-1">
          ${icon('arrow-left', 'w-5 h-5')} ${t('back') || 'Retour'}
        </button>
        ${isPreview ? `
        <button type="button" onclick="closeAddSpot()"
          class="btn flex-1 text-lg bg-amber-500/20 text-amber-400 border border-amber-500/30" id="submit-spot-btn">
          ${icon('eye', 'w-5 h-5')} ${t('previewModeClose')}
        </button>
        ` : `
        <button type="submit" class="btn btn-primary flex-1 text-lg" id="submit-spot-btn">
          ${icon('share', 'w-5 h-5')} ${t('shareThisSpot') || t('create')}
        </button>
        `}
      </div>
    </div>
  `
}

/**
 * Render offline draft button
 */
function renderOfflineDraftButton() {
  if (navigator.onLine) return ''
  return `
    <div class="mt-3 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20">
      <p class="text-sm text-warning-400 mb-2">${t('offlineMode') || 'Mode hors-ligne'}</p>
      <button type="button" onclick="saveDraftAndClose()" class="btn btn-warning btn-sm w-full">
        ${icon('save', 'w-4 h-4')} ${t('saveDraft') || 'Sauvegarder le brouillon'}
      </button>
    </div>
  `
}

function renderPositionBlock() {
  return `
    <div>
      <span class="text-sm text-slate-400 block mb-2" id="location-label">${t('position') || 'Position'} <span aria-label="obligatoire">*</span></span>
      <div class="flex gap-2">
        <button type="button" onclick="useGPSForSpot()" class="btn btn-ghost flex-1" aria-describedby="location-display">
          ${icon('crosshair', 'w-5 h-5')} ${t('useMyPosition') || 'Ma position GPS'}
        </button>
        <button type="button" onclick="toggleSpotMapPicker()" class="btn btn-ghost flex-1">
          ${icon('map-pin', 'w-5 h-5')} ${t('pickOnMap') || 'Pointer sur la carte'}
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

          <form id="add-spot-form" onsubmit="handleAddSpot(event)" class="space-y-5" aria-label="${t('addSpotForm') || "Formulaire d'ajout de spot"}">
            ${currentStep === 1 ? renderStep1(_state) : ''}
            ${currentStep === 2 ? renderStep2(_state) : ''}
            ${currentStep === 3 ? renderStep3(_state) : ''}
            ${currentStep >= 2 ? renderOfflineDraftButton() : ''}
          </form>
        </div>
      </div>
    </div>
  `
}

// Form state — ALL data structured for export/analysis
window.spotFormData = window.spotFormData || {
  photo: null,
  lat: null,
  lng: null,
  ratings: { safety: 0, traffic: 0, accessibility: 0 },
  tags: {
    shelter: false,
    waterFood: false,
    toilets: false,
    visibility: false,
    stoppingSpace: false,
  },
  country: null,
  countryName: null,
  departureCity: null,
  departureCityCoords: null,
  directionCity: null,
  directionCityCoords: null,
  locationName: null,
  roadNumber: null,
  positionSource: null,
  method: null,       // 'sign' | 'thumb' | 'asking'
  groupSize: null,    // 'solo' | 'duo' | 'group'
  timeOfDay: null,    // 'morning' | 'afternoon' | 'evening' | 'night'
  waitTime: null,     // minutes (number)
  season: null,       // auto-detected
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

// Spot type selection (big buttons)
window.selectSpotType = (type) => {
  window.spotFormData.spotType = type
  import('../../stores/state.js').then(({ setState }) => {
    setState({ addSpotType: type })
  })
}

// Wait time slider
window.setWaitTime = (sliderIndex) => {
  const idx = parseInt(sliderIndex, 10)
  const minutes = WAIT_STEPS[idx] || 10
  window.spotFormData.waitTime = minutes
  import('../../stores/state.js').then(({ setState }) => {
    setState({ addSpotWaitTime: minutes })
  })
  const display = document.getElementById('wait-time-display')
  if (display) {
    display.textContent = minutes >= 180 ? '3h+' : minutes + ' min'
  }
}

// Method selection
window.setMethod = (method) => {
  window.spotFormData.method = method
  import('../../stores/state.js').then(({ setState }) => {
    setState({ addSpotMethod: method })
  })
}

// Group size selection
window.setGroupSize = (size) => {
  window.spotFormData.groupSize = size
  import('../../stores/state.js').then(({ setState }) => {
    setState({ addSpotGroupSize: size })
  })
}

// Time of day selection
window.setTimeOfDay = (time) => {
  window.spotFormData.timeOfDay = time
  import('../../stores/state.js').then(({ setState }) => {
    setState({ addSpotTimeOfDay: time })
  })
}

// Toggle amenity chip
window.toggleAmenity = (name) => {
  window.spotFormData.tags = window.spotFormData.tags || {}
  window.spotFormData.tags[name] = !window.spotFormData.tags[name]
  import('../../stores/state.js').then(({ setState }) => {
    setState({ _tagRefresh: Date.now() })
  })
}

// Keep backward compat for setSpotTag
window.setSpotTag = (tagName, value) => {
  window.spotFormData.tags = window.spotFormData.tags || {}
  if (tagName === 'signMethod') {
    window.spotFormData.tags.signMethod = window.spotFormData.tags.signMethod === value ? null : value
  } else {
    window.spotFormData.tags[tagName] = value === true || value === 'true'
  }
  import('../../stores/state.js').then(({ setState }) => {
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
    // Validate photo + type + position + departure city
    if (!window.spotFormData.photo) {
      showError(t('photoRequired') || 'Une photo est requise')
      return
    }
    const spotType = state.addSpotType || window.spotFormData.spotType
    if (!spotType) {
      showError(t('selectSpotType') || 'Choisis un type de spot')
      return
    }
    if (!window.spotFormData.lat || !window.spotFormData.lng) {
      showError(t('positionRequired') || 'Position obligatoire')
      return
    }
    if (!window.spotFormData.departureCity) {
      showError(t('departureRequired') || 'Ville de départ obligatoire')
      return
    }
    setState({ addSpotStep: 2, addSpotType: spotType })
  } else if (currentStep === 2) {
    // Validate direction
    if (!window.spotFormData.directionCity) {
      showError(t('destinationRequired') || 'Destination obligatoire')
      return
    }
    // Auto-detect season
    window.spotFormData.season = detectSeason()
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
    if (display) display.textContent = t('geoNotSupported') || 'Géolocalisation non supportée'
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
          if (location.countryCode) {
            window.spotFormData.country = location.countryCode
            window.spotFormData.countryName = location.country
          }
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

      try {
        const { reverseGeocode } = await import('../../services/osrm.js')
        const location = await reverseGeocode(lat, lng)
        if (location?.countryCode) {
          window.spotFormData.country = location.countryCode
          window.spotFormData.countryName = location.country
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
    if (location?.name) {
      const parts = location.name.split(',')
      window.spotFormData.locationName = parts[0].trim()
    }
  } catch { /* no-op */ }
}

// Auto-detect road
window.autoDetectRoad = async () => {
  if (!window.spotFormData.lat || !window.spotFormData.lng) return
  try {
    const { reverseGeocode } = await import('../../services/osrm.js')
    const location = await reverseGeocode(window.spotFormData.lat, window.spotFormData.lng)
    if (location?.name) {
      const parts = location.name.split(',')
      window.spotFormData.roadNumber = parts[0].trim()
    }
  } catch { /* no-op */ }
}

// Draft saving — saves ALL form data
window.saveDraftAndClose = async () => {
  const { saveSpotDraft } = await import('../../services/spotDrafts.js')
  const { setState, getState } = await import('../../stores/state.js')
  const { showSuccess } = await import('../../services/notifications.js')
  const state = getState()

  saveSpotDraft({
    ...window.spotFormData,
    spotType: state.addSpotType,
    addSpotStep: state.addSpotStep,
    addSpotMethod: state.addSpotMethod,
    addSpotGroupSize: state.addSpotGroupSize,
    addSpotTimeOfDay: state.addSpotTimeOfDay,
    addSpotWaitTime: state.addSpotWaitTime,
  })

  showSuccess(t('draftSaved') || 'Brouillon sauvegardé !')
  setState({ showAddSpot: false })
}

// Keep backward compat
window.saveSpotAsDraft = window.saveDraftAndClose

window.openSpotDraft = async (draftId) => {
  const { getSpotDrafts } = await import('../../services/spotDrafts.js')
  const { setState } = await import('../../stores/state.js')
  const drafts = getSpotDrafts()
  const draft = drafts.find(d => d.id === draftId)
  if (!draft) return

  // Restore ALL form data
  window.spotFormData = {
    photo: draft.photo,
    lat: draft.lat,
    lng: draft.lng,
    ratings: draft.ratings || { safety: 0, traffic: 0, accessibility: 0 },
    tags: draft.tags || {},
    country: draft.country,
    countryName: draft.countryName,
    departureCity: draft.departureCity,
    departureCityCoords: draft.departureCityCoords,
    directionCity: draft.directionCity,
    directionCityCoords: draft.directionCityCoords,
    locationName: draft.locationName,
    roadNumber: draft.roadNumber,
    positionSource: draft.positionSource,
    method: draft.method,
    groupSize: draft.groupSize,
    timeOfDay: draft.timeOfDay,
    waitTime: draft.waitTime,
    season: draft.season,
  }

  setState({
    showAddSpot: true,
    addSpotStep: draft.addSpotStep || 2,
    addSpotType: draft.spotType,
    addSpotMethod: draft.addSpotMethod || draft.method,
    addSpotGroupSize: draft.addSpotGroupSize || draft.groupSize,
    addSpotTimeOfDay: draft.addSpotTimeOfDay || draft.timeOfDay,
    addSpotWaitTime: draft.addSpotWaitTime || draft.waitTime,
    spotDraftsBannerVisible: false,
  })
}

window.deleteSpotDraft = async (draftId) => {
  const { deleteSpotDraft } = await import('../../services/spotDrafts.js')
  deleteSpotDraft(draftId)
  const { showToast } = await import('../../services/notifications.js')
  showToast(t('deleteDraft') || 'Brouillon supprimé', 'info')
  import('../../stores/state.js').then(({ setState }) => {
    setState({ spotDraftsBannerVisible: false })
  })
}

// Initialize autocomplete fields when step renders
let autocompleteCleanups = []

function initStep1Autocomplete() {
  cleanupAutocompletes()
  if (!navigator.onLine) return

  import('../../utils/autocomplete.js').then(({ initAutocomplete }) => {
    import('../../services/osrm.js').then(({ searchCities }) => {
      const depInput = document.getElementById('spot-departure-city')
      if (depInput) {
        const ac = initAutocomplete({
          inputId: 'spot-departure-city',
          searchFn: (q) => searchCities(q, { countryCode: window.spotFormData.country }),
          forceSelection: true,
          onSelect: (item) => {
            window.spotFormData.departureCity = item.name
            window.spotFormData.departureCityCoords = { lat: item.lat, lng: item.lng }
            if (item.countryCode && !window.spotFormData.country) {
              window.spotFormData.country = item.countryCode
              window.spotFormData.countryName = item.countryName
            }
          },
          onClear: () => {
            window.spotFormData.departureCity = null
            window.spotFormData.departureCityCoords = null
          },
        })
        autocompleteCleanups.push(ac)
      }
    })
  })
}

function initStep2Autocomplete() {
  cleanupAutocompletes()
  if (!navigator.onLine) return

  import('../../utils/autocomplete.js').then(({ initAutocomplete }) => {
    import('../../services/osrm.js').then(({ searchCities }) => {
      const dirInput = document.getElementById('spot-direction-city')
      if (dirInput) {
        const ac = initAutocomplete({
          inputId: 'spot-direction-city',
          searchFn: (q) => searchCities(q, {}),
          forceSelection: true,
          onSelect: (item) => {
            window.spotFormData.directionCity = item.name
            window.spotFormData.directionCityCoords = { lat: item.lat, lng: item.lng }
          },
          onClear: () => {
            window.spotFormData.directionCity = null
            window.spotFormData.directionCityCoords = null
          },
        })
        autocompleteCleanups.push(ac)
      }
    })
  })
}

function cleanupAutocompletes() {
  autocompleteCleanups.forEach(c => c.destroy())
  autocompleteCleanups = []
}

// Watch for DOM changes to init autocomplete
const observer = new MutationObserver(() => {
  if (document.getElementById('spot-departure-city') && !document.getElementById('spot-direction-city')) {
    initStep1Autocomplete()
  }
  if (document.getElementById('spot-direction-city')) {
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

  // Build fields
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

  // Ratings validation — all 3 criteria required
  const ratingsCheck = window.spotFormData.ratings || {}
  if (!ratingsCheck.safety || !ratingsCheck.traffic || !ratingsCheck.accessibility) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('ratingsRequired') || 'Note les 3 critères (sécurité, trafic, accessibilité)')
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
    submitBtn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin')} ${t('submittingSpot') || 'Envoi...'}`
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

    // Build complete spot data — ALL fields structured
    const spotData = {
      // Structured fields (unique data!)
      country: window.spotFormData.country || '',
      countryName: window.spotFormData.countryName || '',
      departureCity: window.spotFormData.departureCity || '',
      departureCityCoords: window.spotFormData.departureCityCoords || null,
      directionCity: window.spotFormData.directionCity || '',
      directionCityCoords: window.spotFormData.directionCityCoords || null,
      locationName: window.spotFormData.locationName || '',
      roadNumber: window.spotFormData.roadNumber || '',
      positionSource: window.spotFormData.positionSource || 'gps',

      // Experience data (unique!)
      method: window.spotFormData.method || null,
      groupSize: window.spotFormData.groupSize || null,
      timeOfDay: window.spotFormData.timeOfDay || null,
      waitTime: window.spotFormData.waitTime || null,
      season: window.spotFormData.season || detectSeason(),

      // Legacy fields (backward compat)
      from: from,
      to: to,
      direction: direction,

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
      avgWaitTime: window.spotFormData.waitTime || 30,
      spotType,
      fromCity: from,
      tags: window.spotFormData.tags || {},
      dataSource: 'community',
      createdAt: new Date().toISOString(),
    }

    const result = await addSpot(spotData)

    if (result.success) {
      const { showSuccess } = await import('../../services/notifications.js')
      const { actions, setState: setStateFn } = await import('../../stores/state.js')

      showSuccess(t('spotShared') || 'Spot partagé avec succès !')
      actions.incrementSpotsCreated()
      setStateFn({
        showAddSpot: false,
        addSpotStep: 1,
        addSpotType: null,
        addSpotMethod: null,
        addSpotGroupSize: null,
        addSpotTimeOfDay: null,
        addSpotWaitTime: null,
      })

      // Reset form data
      window.spotFormData = {
        photo: null, lat: null, lng: null,
        ratings: { safety: 0, traffic: 0, accessibility: 0 },
        tags: { shelter: false, waterFood: false, toilets: false, visibility: false, stoppingSpace: false },
        country: null, countryName: null,
        departureCity: null, departureCityCoords: null,
        directionCity: null, directionCityCoords: null,
        locationName: null, roadNumber: null, positionSource: null,
        method: null, groupSize: null, timeOfDay: null, waitTime: null, season: null,
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
      submitBtn.innerHTML = `${icon('share', 'w-5 h-5')} ${t('shareThisSpot') || t('create')}`
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
