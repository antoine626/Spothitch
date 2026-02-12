/**
 * Community Tips Service
 * User-submitted tips with votes, stored in localStorage
 */

import { Storage } from '../utils/storage.js'
import { icon } from '../utils/icons.js'

const TIPS_KEY = 'spothitch_community_tips'

function getTips() {
  return Storage.get(TIPS_KEY) || []
}

function saveTips(tips) {
  Storage.set(TIPS_KEY, tips)
}

export function getTipsByCountry(countryCode) {
  return getTips()
    .filter(t => t.country === countryCode)
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
}

export function addTip(countryCode, text, author) {
  const tips = getTips()
  const newTip = {
    id: `tip_${Date.now()}`,
    country: countryCode,
    text,
    author: author || 'Voyageur anonyme',
    upvotes: 0,
    downvotes: 0,
    votedBy: [],
    createdAt: new Date().toISOString(),
  }
  tips.push(newTip)
  saveTips(tips)
  return newTip
}

export function voteTip(tipId, direction) {
  const tips = getTips()
  const tip = tips.find(t => t.id === tipId)
  if (!tip) return false

  const userId = 'local-user'
  if (tip.votedBy?.includes(userId)) return false

  if (direction === 'up') tip.upvotes = (tip.upvotes || 0) + 1
  else tip.downvotes = (tip.downvotes || 0) + 1
  tip.votedBy = [...(tip.votedBy || []), userId]

  saveTips(tips)
  return true
}

export function renderCommunityTips(countryCode) {
  const tips = getTipsByCountry(countryCode)

  return `
    <div class="card p-4 space-y-3">
      <h3 class="font-bold flex items-center gap-2">
        ${icon('users', 'w-5 h-5 text-primary-400')}
        Conseils de la communaute
      </h3>

      <!-- Add tip form -->
      <div class="flex gap-2">
        <input
          type="text"
          id="community-tip-input"
          class="input-field flex-1"
          placeholder="Partage un conseil..."
          onkeydown="if(event.key==='Enter') submitCommunityTip('${countryCode}')"
        />
        <button
          onclick="submitCommunityTip('${countryCode}')"
          class="btn-primary px-4"
        >
          ${icon('paper-plane', 'w-5 h-5')}
        </button>
      </div>

      ${tips.length > 0 ? `
        <div class="space-y-2">
          ${tips.map(tip => `
            <div class="p-3 rounded-lg bg-white/5">
              <p class="text-sm text-slate-300">${tip.text}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-slate-500">${tip.author} - ${new Date(tip.createdAt).toLocaleDateString('fr-FR')}</span>
                <div class="flex items-center gap-2">
                  <button onclick="voteCommunityTip('${tip.id}', 'up')" class="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                    👍 ${tip.upvotes || 0}
                  </button>
                  <button onclick="voteCommunityTip('${tip.id}', 'down')" class="text-xs px-2 py-1 rounded bg-danger-500/10 text-danger-400 hover:bg-danger-500/20">
                    👎 ${tip.downvotes || 0}
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <p class="text-sm text-slate-500 text-center py-2">Aucun conseil pour ce pays. Sois le premier !</p>
      `}
    </div>
  `
}

// Global handlers
window.submitCommunityTip = (countryCode) => {
  const input = document.getElementById('community-tip-input')
  const text = input?.value?.trim()
  if (!text) return

  addTip(countryCode, text)
  input.value = ''
  window.showToast?.('Conseil ajoute !', 'success')

  // Re-render the guide detail
  window.setState?.({ selectedCountryGuide: countryCode })
}

window.voteCommunityTip = (tipId, direction) => {
  const success = voteTip(tipId, direction)
  if (success) {
    window.showToast?.('Vote enregistre !', 'success')
    // Force re-render
    const state = window.getState?.() || {}
    window.setState?.({ selectedCountryGuide: state.selectedCountryGuide })
  } else {
    window.showToast?.('Deja vote', 'info')
  }
}

export default { getTipsByCountry, addTip, voteTip, renderCommunityTips }
