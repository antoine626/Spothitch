/**
 * Profile Setup Modal
 * Shown when user wants to contribute (add spot, review, etc.)
 * Not a gate — the map is always accessible.
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

const avatars = ['🤙', '😎', '🧳', '🎒', '🌍', '✌️', '🚗', '🛣️', '⛺', '🏕️', '🌄', '🗺️']

export function renderWelcome(state) {
  const selectedAvatar = state.selectedAvatar || '🤙'

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="skipWelcome()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border border-white/10 rounded-3xl
          w-full max-w-md max-h-[90vh] overflow-y-auto slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="bg-primary-500/10 p-6 text-center rounded-t-3xl">
          <div class="text-5xl mb-3" aria-hidden="true">🤙</div>
          <h2 id="welcome-title" class="text-xl font-bold text-white">
            ${t('profileSetupTitle') || 'Quick profile setup'}
          </h2>
          <p class="text-slate-400 mt-2 text-sm">
            ${t('profileSetupDesc') || 'Pick a name and avatar to contribute'}
          </p>
        </div>

        <!-- Close button -->
        <button
          onclick="skipWelcome()"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          aria-label="${t('close') || 'Close'}"
        >
          ${icon('x', 'w-5 h-5 text-white')}
        </button>

        <!-- Content -->
        <div class="p-6 space-y-5">
          <!-- Username -->
          <div>
            <label for="welcome-username" class="block text-sm font-medium text-slate-300 mb-2">
              ${t('yourUsername') || 'Your username'}
            </label>
            <input
              type="text"
              id="welcome-username"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="Ex: Marco_Polo"
              maxlength="20"
              value="${state.username || ''}"
              autocomplete="username"
            />
          </div>

          <!-- Avatar Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              ${t('chooseAvatar') || 'Choose your avatar'}
            </label>
            <div class="grid grid-cols-6 gap-2" role="radiogroup" aria-label="${t('chooseAvatar') || 'Avatar selection'}">
              ${avatars.map((avatar) => `
                <button
                  type="button"
                  class="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all
                    ${avatar === selectedAvatar
                      ? 'bg-primary-500/20 border-2 border-primary-500 scale-110'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'}"
                  onclick="selectAvatar('${avatar}')"
                  role="radio"
                  aria-checked="${avatar === selectedAvatar ? 'true' : 'false'}"
                  aria-label="Avatar ${avatar}"
                >
                  ${avatar}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Submit -->
          <button
            onclick="completeWelcome()"
            class="w-full py-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            ${icon('check', 'w-6 h-6')}
            ${t('letsGo') || "Let's go!"}
          </button>

          <!-- Skip -->
          <button
            onclick="skipWelcome()"
            class="w-full text-center text-slate-400 text-sm hover:text-slate-300 transition-colors"
          >
            ${t('maybeLater') || 'Maybe later'}
          </button>
        </div>
      </div>
    </div>
  `
}

export default { renderWelcome }
