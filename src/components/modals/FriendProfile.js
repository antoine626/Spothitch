/**
 * Friend Profile Modal
 * Shows another user's profile with avatar, level, badges, and remove button
 */

import { getTrustBadge } from '../../services/identityVerification.js'

export function renderFriendProfileModal(state) {
  const friendId = state.selectedFriendProfileId
  const friends = state.friends || []
  const friend = friends.find(f => f.id === friendId)

  if (!friend) return ''

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeFriendProfile()"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>
      <div
        class="relative bg-dark-primary border border-white/10 rounded-3xl w-full max-w-sm slide-up"
        onclick="event.stopPropagation()"
      >
        <div class="p-6 text-center space-y-4">
          <!-- Avatar -->
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/30 to-emerald-500/30 flex items-center justify-center text-5xl mx-auto">
            ${friend.avatar || '🤙'}
          </div>

          <!-- Name + Trust Badge -->
          <div>
            <div class="flex items-center justify-center gap-2">
              <h2 class="text-xl font-bold">${friend.name}</h2>
              ${getTrustBadge(friend.verificationLevel || 0)}
            </div>
            <div class="flex items-center justify-center gap-2 mt-1">
              <span class="w-3 h-3 rounded-full ${friend.online ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
              <span class="text-sm text-slate-400">${friend.online ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-3">
            <div class="card p-3 text-center">
              <div class="text-lg font-bold text-primary-400">${friend.level || 1}</div>
              <div class="text-xs text-slate-500">Niveau</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-lg font-bold text-amber-400">${friend.badges?.length || 0}</div>
              <div class="text-xs text-slate-500">Badges</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-lg font-bold text-emerald-400">${friend.checkins || 0}</div>
              <div class="text-xs text-slate-500">Check-ins</div>
            </div>
          </div>

          <!-- Added date -->
          ${friend.addedAt ? `
            <p class="text-xs text-slate-500">
              Ami depuis le ${new Date(friend.addedAt).toLocaleDateString('fr-FR')}
            </p>
          ` : ''}

          <!-- Actions -->
          <div class="space-y-2">
            <button
              onclick="closeFriendProfile(); openFriendChat('${friend.id}')"
              class="btn-primary w-full"
            >
              <i class="fas fa-comment mr-2" aria-hidden="true"></i>
              Envoyer un message
            </button>
            <button
              onclick="removeFriend('${friend.id}'); closeFriendProfile()"
              class="w-full py-2 rounded-lg border border-danger-500/30 text-danger-400 hover:bg-danger-500/10 transition-all text-sm"
            >
              <i class="fas fa-user-minus mr-2" aria-hidden="true"></i>
              Retirer des amis
            </button>
          </div>
        </div>

        <button
          onclick="closeFriendProfile()"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Fermer"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `
}

// Global handler
window.closeFriendProfile = () => {
  window.setState?.({ showFriendProfile: false, selectedFriendProfileId: null })
}

export default { renderFriendProfileModal }
