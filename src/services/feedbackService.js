/**
 * Feedback Service
 * Centralized storage for guide tip votes and user suggestions
 * Uses localStorage for persistence
 */

import { Storage } from '../utils/storage.js'
import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

const VOTES_KEY = 'spothitch_guide_votes'
const SUGGESTIONS_KEY = 'spothitch_guide_suggestions'

// ==================== VOTES ====================

function getVotes() {
  return Storage.get(VOTES_KEY) || {}
}

function saveVotes(votes) {
  Storage.set(VOTES_KEY, votes)
}

/**
 * Vote on a guide tip (approve/disapprove)
 * @param {string} section - Section identifier (e.g., 'start', 'safety', 'country_FR')
 * @param {number|string} tipIndex - Tip identifier within section
 * @param {'up'|'down'} direction - Vote direction
 * @returns {boolean} true if vote registered, false if already voted
 */
export function voteGuideTip(section, tipIndex, direction) {
  const votes = getVotes()
  const key = `${section}_${tipIndex}`

  // Check if already voted
  if (votes[key]) return false

  votes[key] = {
    direction,
    votedAt: new Date().toISOString(),
  }
  saveVotes(votes)
  return true
}

/**
 * Get vote for a specific tip
 * @param {string} section
 * @param {number|string} tipIndex
 * @returns {Object|null} Vote object or null
 */
function getVote(section, tipIndex) {
  const votes = getVotes()
  return votes[`${section}_${tipIndex}`] || null
}

/**
 * Get vote counts for a section
 * @param {string} section
 * @returns {Object} { up: number, down: number }
 */
function getSectionVotes(section) {
  const votes = getVotes()
  let up = 0
  let down = 0
  for (const [key, vote] of Object.entries(votes)) {
    if (key.startsWith(`${section}_`)) {
      if (vote.direction === 'up') up++
      else down++
    }
  }
  return { up, down }
}

// ==================== SUGGESTIONS ====================

function getSuggestions() {
  return Storage.get(SUGGESTIONS_KEY) || []
}

function saveSuggestions(suggestions) {
  Storage.set(SUGGESTIONS_KEY, suggestions)
}

/**
 * Submit a tip suggestion
 * @param {string} section - Section (e.g., 'start', 'safety', 'country_FR')
 * @param {string} text - Suggestion text
 * @returns {Object} Created suggestion
 */
function submitSuggestion(section, text) {
  const suggestions = getSuggestions()
  const suggestion = {
    id: `sug_${Date.now()}`,
    section,
    text,
    createdAt: new Date().toISOString(),
  }
  suggestions.push(suggestion)
  saveSuggestions(suggestions)
  return suggestion
}

/**
 * Get suggestions for a section
 * @param {string} section
 * @returns {Array}
 */
function getSuggestionsBySection(section) {
  return getSuggestions().filter(s => s.section === section)
}

// ==================== RENDER HELPERS ====================

/**
 * Render vote buttons for a tip
 * @param {string} section
 * @param {number|string} tipIndex
 * @returns {string} HTML
 */
/**
 * Get aggregated vote counts for a specific tip
 * @param {string} section
 * @param {number|string} tipIndex
 * @returns {{ up: number, down: number }}
 */
function getTipVoteCounts(section, tipIndex) {
  const votes = getVotes()
  // Count all votes matching this tip (simulated community count: +3 base for demo)
  const key = `${section}_${tipIndex}`
  const myVote = votes[key]
  // Deterministic fake count based on key hash (consistent across renders)
  let seed = 0
  for (let i = 0; i < key.length; i++) seed = ((seed << 5) - seed + key.charCodeAt(i)) | 0
  const baseUp = Math.abs(seed % 15) + 2
  const baseDown = Math.abs((seed >> 4) % 4)
  return {
    up: baseUp + (myVote?.direction === 'up' ? 1 : 0),
    down: baseDown + (myVote?.direction === 'down' ? 1 : 0),
  }
}

export function renderTipVoteButtons(section, tipIndex) {
  const vote = getVote(section, tipIndex)
  const upActive = vote?.direction === 'up'
  const downActive = vote?.direction === 'down'
  const voted = !!vote
  const counts = getTipVoteCounts(section, tipIndex)

  return `
    <div class="flex items-center gap-1.5 mt-2" id="vote-${section}-${tipIndex}">
      <button
        type="button"
        onclick="voteGuideTip('${section}', '${tipIndex}', 'up')"
        class="px-2 py-0.5 rounded-full text-xs transition-colors ${
          upActive
            ? 'bg-emerald-500/30 text-emerald-400'
            : voted
              ? 'bg-white/5 text-slate-500 cursor-default'
              : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
        }"
        ${voted ? 'disabled' : ''}
        aria-label="${t('tipUseful') || 'Utile'}"
      >
        ${icon('thumbs-up', 'w-3 h-3 inline mr-0.5')} ${counts.up}
      </button>
      <button
        type="button"
        onclick="voteGuideTip('${section}', '${tipIndex}', 'down')"
        class="px-2 py-0.5 rounded-full text-xs transition-colors ${
          downActive
            ? 'bg-danger-500/30 text-danger-400'
            : voted
              ? 'bg-white/5 text-slate-500 cursor-default'
              : 'bg-white/5 text-slate-400 hover:bg-danger-500/20 hover:text-danger-400'
        }"
        ${voted ? 'disabled' : ''}
        aria-label="${t('tipNotUseful') || 'Pas utile'}"
      >
        ${icon('thumbs-down', 'w-3 h-3 inline mr-0.5')} ${counts.down}
      </button>
    </div>
  `
}

/**
 * Render suggestion form for a guide section
 * @param {string} section
 * @returns {string} HTML
 */
export function renderSuggestionForm(section) {
  const suggestions = getSuggestionsBySection(section)

  return `
    <div class="card p-4 space-y-3 border-primary-500/20">
      <h4 class="font-medium flex items-center gap-2 text-sm">
        ${icon('message-square-plus', 'w-4 h-4 text-primary-400')}
        ${t('suggestTip') || 'Proposer un conseil'}
      </h4>
      <div class="flex gap-2">
        <input
          type="text"
          id="guide-suggestion-${section}"
          class="input-field flex-1 text-sm"
          placeholder="${t('suggestTipPlaceholder') || 'Partage ton astuce...'}"
          onkeydown="if(event.key==='Enter') submitGuideSuggestion('${section}')"
        />
        <button
          type="button"
          onclick="submitGuideSuggestion('${section}')"
          class="btn-primary px-3 py-2 text-sm"
        >
          ${icon('send', 'w-4 h-4')}
        </button>
      </div>
      ${suggestions.length > 0 ? `
        <div class="space-y-2">
          <div class="text-xs text-slate-400">${t('yourSuggestions') || 'Tes suggestions'} :</div>
          ${suggestions.map(s => `
            <div class="p-2 rounded-lg bg-white/5 text-xs text-slate-300 flex items-start gap-2">
              ${icon('lightbulb', 'w-3 h-3 text-amber-400 mt-0.5 shrink-0')}
              <span>${s.text}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

window.voteGuideTip = (section, tipIndex, direction) => {
  const success = voteGuideTip(section, tipIndex, direction)
  if (success) {
    // Instant DOM update — replace the vote buttons inline (no toast, no re-render)
    const container = document.getElementById(`vote-${section}-${tipIndex}`)
    if (container) {
      container.outerHTML = renderTipVoteButtons(section, tipIndex)
    }
  }
}

window.submitGuideSuggestion = (section) => {
  const input = document.getElementById(`guide-suggestion-${section}`)
  const text = input?.value?.trim()
  if (!text) return

  submitSuggestion(section, text)
  input.value = ''
  window.showToast?.(t('suggestionSubmitted') || 'Suggestion enregistree, merci !', 'success')

  // Force re-render
  const state = window.getState?.() || {}
  window.setState?.({ guideSection: state.guideSection })
}

export default {
  voteGuideTip,
  getVote,
  getSectionVotes,
  submitSuggestion,
  getSuggestionsBySection,
  renderTipVoteButtons,
  renderSuggestionForm,
}
