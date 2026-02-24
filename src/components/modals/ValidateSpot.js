/**
 * ValidateSpot Modal Component
 * "I tested this spot" — adds a validation/experience to an existing spot
 *
 * Collects structured data: wait time, method, group size, time of day,
 * direction, ratings, optional photo, optional comment.
 * All data is stored as a validation record linked to the spot.
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

// Wait time slider steps (minutes)
const WAIT_STEPS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180]

// Validation form state
window.validateFormData = window.validateFormData || {
  waitTime: null,
  method: null,
  groupSize: null,
  timeOfDay: null,
  directionCity: null,
  directionCityCoords: null,
  ratings: { safety: 0, traffic: 0, accessibility: 0 },
  photo: null,
  comment: '',
  rideResult: null,
}

function detectSeason() {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

/**
 * Render star input for validation ratings
 */
function renderValStarInput(criterion, label) {
  return `
    <div class="mb-2">
      <label class="text-sm text-slate-400 block mb-1">${label}</label>
      <div class="flex items-center gap-1" role="radiogroup" aria-label="${label}">
        ${[1, 2, 3, 4, 5].map(star => `
          <button
            type="button"
            onclick="setValidationRating('${criterion}', ${star})"
            class="val-star-btn text-xl text-slate-400 hover:text-yellow-400 transition-colors"
            data-val-criterion="${criterion}"
            data-val-star="${star}"
            aria-label="${star}/5"
          >
            ${icon('star', 'w-4 h-4')}
          </button>
        `).join('')}
        <span class="ml-2 text-sm text-white font-medium" id="val-rating-${criterion}">-</span>
      </div>
    </div>
  `
}

export function renderValidateSpot(state) {
  const spotId = state.validateSpotId
  const spot = (state.spots || []).find(s => s.id === spotId) || state.selectedSpot
  const spotName = spot ? (spot.from && spot.to ? `${spot.from} → ${spot.to}` : spot.direction || `Spot #${spot.id}`) : ''

  const vf = window.validateFormData
  const waitIdx = vf.waitTime != null ? WAIT_STEPS.indexOf(vf.waitTime) : 4
  const currentWait = WAIT_STEPS[waitIdx >= 0 ? waitIdx : 4]

  return `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onclick="closeValidateSpot()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="validate-modal-title"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <div class="relative modal-panel sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="validate-modal-title" class="text-xl font-bold">
            ${icon('circle-check', 'w-5 h-5 text-emerald-400 mr-2')}
            ${t('validateSpotTitle') || 'Valider ce spot'}
          </h2>
          <button onclick="closeValidateSpot()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            aria-label="${t('close') || 'Fermer'}" type="button">
            ${icon('x', 'w-5 h-5')}
          </button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <!-- Spot name -->
          ${spotName ? `<p class="text-sm text-slate-400 mb-4">${spotName}</p>` : ''}

          <form id="validate-spot-form" onsubmit="submitValidation(event)" class="space-y-4">

            <!-- Wait Time Slider -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">
                ${icon('clock', 'w-4 h-4 mr-1')} ${t('waitTimeLabel') || "Temps d'attente"}
              </label>
              <input type="range" min="0" max="${WAIT_STEPS.length - 1}"
                value="${waitIdx >= 0 ? waitIdx : 4}"
                class="wait-slider w-full"
                oninput="setValidationWaitTime(this.value)"
              />
              <div class="wait-slider-labels">
                <span>1 min</span><span>15</span><span>45</span><span>2h</span><span>3h+</span>
              </div>
              <div class="text-center text-lg font-bold text-primary-400 mt-1" id="val-wait-display">
                ${currentWait >= 180 ? '3h+' : currentWait + ' min'}
              </div>
            </div>

            <!-- Got a ride? -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">${t('gotARide') || 'Tu as eu un lift ?'}</label>
              <div class="radio-group">
                <button type="button" onclick="setValidationRideResult('yes')"
                  class="radio-btn ${vf.rideResult === 'yes' ? 'active' : ''}">
                  ✅ ${t('yes') || 'Oui'}
                </button>
                <button type="button" onclick="setValidationRideResult('no')"
                  class="radio-btn ${vf.rideResult === 'no' ? 'active' : ''}">
                  ❌ ${t('no') || 'Non'}
                </button>
                <button type="button" onclick="setValidationRideResult('gaveUp')"
                  class="radio-btn ${vf.rideResult === 'gaveUp' ? 'active' : ''}">
                  🏳️ ${t('gaveUp') || "Abandonné"}
                </button>
              </div>
            </div>

            <!-- Method -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">
                ${icon('hand', 'w-4 h-4 mr-1')} ${t('practicalTips') || 'Méthode'}
              </label>
              <div class="radio-group">
                <button type="button" onclick="setValidationMethod('sign')"
                  class="radio-btn ${vf.method === 'sign' ? 'active' : ''}">
                  ${icon('file-text', 'w-4 h-4 mr-1')} ${t('methodSign')}
                </button>
                <button type="button" onclick="setValidationMethod('thumb')"
                  class="radio-btn ${vf.method === 'thumb' ? 'active' : ''}">
                  ${icon('hand', 'w-4 h-4 mr-1')} ${t('methodThumb')}
                </button>
                <button type="button" onclick="setValidationMethod('asking')"
                  class="radio-btn ${vf.method === 'asking' ? 'active' : ''}">
                  ${icon('message-circle', 'w-4 h-4 mr-1')} ${t('methodAsking')}
                </button>
              </div>
            </div>

            <!-- Group Size -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">
                ${icon('users', 'w-4 h-4 mr-1')} ${t('groupSizeLabel')}
              </label>
              <div class="radio-group">
                <button type="button" onclick="setValidationGroupSize('solo')"
                  class="radio-btn ${vf.groupSize === 'solo' ? 'active' : ''}">${t('groupSolo')}</button>
                <button type="button" onclick="setValidationGroupSize('duo')"
                  class="radio-btn ${vf.groupSize === 'duo' ? 'active' : ''}">${t('groupDuo')}</button>
                <button type="button" onclick="setValidationGroupSize('group')"
                  class="radio-btn ${vf.groupSize === 'group' ? 'active' : ''}">${t('groupTrioPlus')}</button>
              </div>
            </div>

            <!-- Time of Day -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">
                ${icon('sun', 'w-4 h-4 mr-1')} ${t('timeOfDayLabel')}
              </label>
              <div class="radio-group">
                <button type="button" onclick="setValidationTimeOfDay('morning')"
                  class="radio-btn ${vf.timeOfDay === 'morning' ? 'active' : ''}">🌅 ${t('timeMorning')}</button>
                <button type="button" onclick="setValidationTimeOfDay('afternoon')"
                  class="radio-btn ${vf.timeOfDay === 'afternoon' ? 'active' : ''}">☀️ ${t('timeAfternoon')}</button>
                <button type="button" onclick="setValidationTimeOfDay('evening')"
                  class="radio-btn ${vf.timeOfDay === 'evening' ? 'active' : ''}">🌆 ${t('timeEvening')}</button>
                <button type="button" onclick="setValidationTimeOfDay('night')"
                  class="radio-btn ${vf.timeOfDay === 'night' ? 'active' : ''}">🌙 ${t('timeNight')}</button>
              </div>
            </div>

            <!-- Direction (optional, can differ from spot) -->
            <div class="relative">
              <label for="val-direction-city" class="text-sm text-slate-400 block mb-2">
                ${icon('compass', 'w-4 h-4 mr-1')} ${t('yourDirection') || 'Ta direction'}
              </label>
              <input type="text" id="val-direction-city" class="input-modern"
                placeholder="${t('destinationCity') || 'Direction'}" />
            </div>

            <!-- Ratings -->
            <div class="border-t border-white/10 pt-3">
              ${renderValStarInput('safety', t('safetyRating'))}
              ${renderValStarInput('traffic', t('traffic'))}
              ${renderValStarInput('accessibility', t('accessibility'))}
            </div>

            <!-- Comment -->
            <div>
              <label for="val-comment" class="text-sm text-slate-400 block mb-2">
                ${icon('message-circle', 'w-4 h-4 mr-1')} ${t('addComment') || 'Commentaire'}
              </label>
              <textarea id="val-comment" class="input-modern min-h-[80px] resize-none"
                placeholder="${t('commentPlaceholder') || 'Conseils, avertissements...'}"
                maxlength="500"></textarea>
            </div>

            <!-- Photo (optional) -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">
                ${icon('camera', 'w-4 h-4 mr-1')} ${t('optionalPhoto') || 'Photo (optionnel)'}
              </label>
              <input type="file" id="val-photo" accept="image/*" capture="environment"
                class="hidden" onchange="handleValidationPhoto(event)" />
              <button type="button" onclick="document.getElementById('val-photo')?.click()"
                class="btn btn-ghost btn-sm w-full">
                ${icon('camera', 'w-4 h-4')} ${t('takePhoto')}
              </button>
              <div id="val-photo-preview" class="mt-2"></div>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary w-full text-lg" id="val-submit-btn">
              ${icon('circle-check', 'w-5 h-5')} ${t('submitValidation') || 'Envoyer ma validation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
}

// --- Validation handlers ---

window.openValidateSpot = async (spotId) => {
  const { setState } = await import('../../stores/state.js')
  // Reset form
  window.validateFormData = {
    waitTime: 10, method: null, groupSize: null, timeOfDay: null,
    directionCity: null, directionCityCoords: null,
    ratings: { safety: 0, traffic: 0, accessibility: 0 },
    photo: null, comment: '', rideResult: null,
  }
  setState({ showValidateSpot: true, validateSpotId: spotId })
}

window.closeValidateSpot = async () => {
  const { setState } = await import('../../stores/state.js')
  setState({ showValidateSpot: false, validateSpotId: null })
}

window.setValidationWaitTime = (sliderIndex) => {
  const idx = parseInt(sliderIndex, 10)
  const minutes = WAIT_STEPS[idx] || 10
  window.validateFormData.waitTime = minutes
  const display = document.getElementById('val-wait-display')
  if (display) display.textContent = minutes >= 180 ? '3h+' : minutes + ' min'
}

window.setValidationRideResult = (result) => {
  window.validateFormData.rideResult = result
  import('../../stores/state.js').then(({ setState }) => setState({ _valRefresh: Date.now() }))
}

window.setValidationMethod = (method) => {
  window.validateFormData.method = method
  import('../../stores/state.js').then(({ setState }) => setState({ _valRefresh: Date.now() }))
}

window.setValidationGroupSize = (size) => {
  window.validateFormData.groupSize = size
  import('../../stores/state.js').then(({ setState }) => setState({ _valRefresh: Date.now() }))
}

window.setValidationTimeOfDay = (time) => {
  window.validateFormData.timeOfDay = time
  import('../../stores/state.js').then(({ setState }) => setState({ _valRefresh: Date.now() }))
}

window.setValidationRating = (criterion, value) => {
  window.validateFormData.ratings[criterion] = value

  const buttons = document.querySelectorAll(`button[data-val-criterion="${criterion}"]`)
  buttons.forEach((btn) => {
    const star = parseInt(btn.dataset.valStar, 10)
    const svg = btn.querySelector('svg')
    if (svg) svg.setAttribute('fill', star <= value ? 'currentColor' : 'none')
    if (star <= value) {
      btn.className = 'val-star-btn text-xl text-yellow-400 hover:text-yellow-300 transition-colors'
    } else {
      btn.className = 'val-star-btn text-xl text-slate-400 hover:text-yellow-400 transition-colors'
    }
  })
  const el = document.getElementById(`val-rating-${criterion}`)
  if (el) el.textContent = `${value}/5`
}

window.handleValidationPhoto = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const { compressImage } = await import('../../utils/image.js')
    const compressed = await compressImage(file)
    window.validateFormData.photo = compressed
    const preview = document.getElementById('val-photo-preview')
    if (preview) {
      preview.innerHTML = `<img src="${compressed}" alt="Preview" class="w-full h-32 object-cover rounded-xl" />`
    }
  } catch { /* no-op */ }
}

window.submitValidation = async (event) => {
  if (event) event.preventDefault()

  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const spotId = state.validateSpotId
  const vf = window.validateFormData
  const comment = document.getElementById('val-comment')?.value?.trim() || ''
  const directionCity = document.getElementById('val-direction-city')?.value?.trim() || vf.directionCity || ''
  const submitBtn = document.getElementById('val-submit-btn')

  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin')} ${t('sending') || 'Envoi...'}`
  }

  try {
    // Build validation data — ALL structured
    const validationData = {
      spotId,
      waitTime: vf.waitTime,
      method: vf.method,
      groupSize: vf.groupSize,
      timeOfDay: vf.timeOfDay,
      rideResult: vf.rideResult,
      directionCity: directionCity,
      ratings: vf.ratings,
      comment: comment,
      season: detectSeason(),
      timestamp: new Date().toISOString(),
      dataSource: 'community',
    }

    // Upload photo if provided
    if (vf.photo) {
      try {
        const { uploadImage } = await import('../../services/firebase.js')
        const photoPath = `validations/${Date.now()}.jpg`
        const photoResult = await uploadImage(vf.photo, photoPath)
        if (photoResult.success) {
          validationData.photoUrl = photoResult.url
        }
      } catch { /* no-op — validation still valid without photo */ }
    }

    // Save to Firebase
    const { addValidation } = await import('../../services/firebase.js')
    if (typeof addValidation === 'function') {
      await addValidation(validationData)
    }

    // Also add to local checkin history
    const { actions } = await import('../../stores/state.js')
    actions.addCheckinToHistory({
      spotId,
      type: 'validation',
      ...validationData,
    })
    actions.incrementCheckins()

    const { showSuccess } = await import('../../services/notifications.js')
    showSuccess(t('validationSubmitted') || 'Validation envoyée ! Merci')
    setState({ showValidateSpot: false, validateSpotId: null })

  } catch (error) {
    console.error('Validation failed:', error)
    const { showError } = await import('../../services/notifications.js')
    showError(t('validationError') || 'Erreur lors de la validation')
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.innerHTML = `${icon('circle-check', 'w-5 h-5')} ${t('submitValidation')}`
    }
  }
}

// Init autocomplete for direction field in validation modal
// Called from afterRender in App.js instead of using a global MutationObserver
export function initValidateSpotAfterRender() {
  const dirInput = document.getElementById('val-direction-city')
  if (dirInput && !dirInput._acInit) {
    dirInput._acInit = true
    if (navigator.onLine) {
      import('../../utils/autocomplete.js').then(({ initAutocomplete }) => {
        import('../../services/osrm.js').then(({ searchCities }) => {
          initAutocomplete({
            inputId: 'val-direction-city',
            searchFn: (q) => searchCities(q, {}),
            onSelect: (item) => {
              window.validateFormData.directionCity = item.name
              window.validateFormData.directionCityCoords = { lat: item.lat, lng: item.lng }
            },
          })
        })
      })
    }
  }
}

export default { renderValidateSpot }
