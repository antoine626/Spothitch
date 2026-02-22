/**
 * Create Travel Group Modal
 * Form to create a new travel group
 */

import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

export function renderCreateTravelGroupModal(_state) {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeCreateTravelGroup()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
    >
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>
      <div
        class="relative modal-panel rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto slide-up"
        onclick="event.stopPropagation()"
      >
        <div class="p-6 space-y-4">
          <h2 id="create-group-title" class="text-xl font-bold flex items-center gap-2">
            ${icon('users', 'w-5 h-5 text-primary-400')}
            ${t('createTravelGroup') || 'Creer un groupe de voyage'}
          </h2>

          <div>
            <label class="block text-sm text-slate-400 mb-1">${t('groupName') || 'Nom du groupe'}</label>
            <input
              type="text"
              id="group-name"
              class="input-field w-full"
              placeholder="${t('groupNamePlaceholder') || 'Ex: Road trip Portugal'}"
            />
          </div>

          <div>
            <label class="block text-sm text-slate-400 mb-1">${t('description') || 'Description'}</label>
            <textarea
              id="group-desc"
              class="input-field w-full h-20 resize-none"
              placeholder="${t('describeTrip') || 'Decrivez votre voyage...'}"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-slate-400 mb-1">${t('departure') || 'Depart'}</label>
              <input
                type="text"
                id="group-from"
                class="input-field w-full"
                placeholder="${t('departurePlaceholder') || 'Paris'}"
              />
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">${t('destination') || 'Destination'}</label>
              <input
                type="text"
                id="group-to"
                class="input-field w-full"
                placeholder="${t('destinationPlaceholder') || 'Lisbonne'}"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-slate-400 mb-1">${t('departureDate') || 'Date depart'}</label>
              <input
                type="date"
                id="group-start"
                class="input-field w-full"
              />
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">${t('maxMembers') || 'Max membres'}</label>
              <select id="group-max" class="input-field w-full">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4" selected>4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>
          </div>

          <button
            onclick="submitCreateTravelGroup()"
            class="btn-primary w-full py-3"
          >
            ${icon('plus', 'w-5 h-5 mr-2')}
            ${t('createGroup') || 'Creer le groupe'}
          </button>
        </div>

        <button
          onclick="closeCreateTravelGroup()"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="${t('close') || 'Fermer'}"
        >
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

// Global handler
window.submitCreateTravelGroup = async () => {
  const { t } = await import('../../i18n/index.js');
  const name = document.getElementById('group-name')?.value?.trim()
  const desc = document.getElementById('group-desc')?.value?.trim()
  const from = document.getElementById('group-from')?.value?.trim()
  const to = document.getElementById('group-to')?.value?.trim()
  const startDate = document.getElementById('group-start')?.value
  const maxMembers = parseInt(document.getElementById('group-max')?.value || '4')

  if (!name) {
    window.showToast?.(t('giveGroupName') || 'Donne un nom a ton groupe', 'warning')
    return
  }

  const { getState, setState } = await import('../../stores/state.js')
  const state = getState()
  const groups = state.travelGroups || []

  const newGroup = {
    id: `group_${Date.now()}`,
    name,
    description: desc || '',
    icon: '🚗',
    departure: { city: from || '?' },
    destination: { city: to || '?' },
    startDate: startDate || null,
    maxMembers,
    members: [state.user?.uid || 'local-user'],
    creator: state.user?.uid || 'local-user',
    status: 'Planification',
    createdAt: new Date().toISOString(),
  }

  setState({
    travelGroups: [...groups, newGroup],
    showCreateTravelGroup: false,
  })
  window.showToast?.(t('groupCreated')?.replace('{name}', name) || `Groupe "${name}" cree !`, 'success')
}

export default { renderCreateTravelGroupModal }
