/**
 * Welcome Modal Component
 * Onboarding for new users
 */

import { t } from '../../i18n/index.js';

const avatars = ['🤙', '😎', '🧳', '🎒', '🌍', '✌️', '🚗', '🛣️', '⛺', '🏕️', '🌄', '🗺️'];

export function renderWelcome(_state) {
  return `
    <div class="min-h-screen flex items-center justify-center p-4
      bg-gradient-to-br from-dark-primary to-dark-secondary">
      <div class="card p-8 max-w-md w-full text-center fade-in">
        <!-- Logo -->
        <div class="text-6xl mb-4">🤙</div>
        <h1 class="text-3xl font-display font-bold gradient-text mb-2">${t('appName')}</h1>
        <p class="text-slate-400 mb-8">${t('welcomeDesc')}</p>
        
        <!-- Username -->
        <div class="mb-6 text-left">
          <label class="text-sm text-slate-400 block mb-2">${t('yourUsername')}</label>
          <input 
            type="text"
            id="welcome-username"
            class="input-modern"
            placeholder="Ex: Marco_Polo"
            maxlength="20"
          />
        </div>
        
        <!-- Avatar Selection -->
        <div class="mb-8 text-left">
          <label class="text-sm text-slate-400 block mb-3">${t('chooseAvatar')}</label>
          <div class="grid grid-cols-6 gap-2" id="avatar-grid">
            ${avatars.map((avatar, i) => `
              <button 
                type="button"
                class="avatar-option ${i === 0 ? 'selected' : ''}"
                data-avatar="${avatar}"
                onclick="selectAvatar('${avatar}')"
              >
                ${avatar}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Submit -->
        <button 
          onclick="completeWelcome()"
          class="btn btn-primary w-full text-lg"
        >
          ${t('letsGo')} 🚀
        </button>
        
        <!-- Skip -->
        <button 
          onclick="skipWelcome()"
          class="text-slate-500 text-sm mt-4 hover:text-slate-300 transition-colors"
        >
          Continuer sans compte
        </button>
      </div>
    </div>
  `;
}

// Global handlers
window.selectedAvatar = '🤙';

window.selectAvatar = (avatar) => {
  window.selectedAvatar = avatar;

  // Update UI
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.avatar === avatar);
  });
};

window.completeWelcome = async () => {
  const usernameInput = document.getElementById('welcome-username');
  const username = usernameInput?.value.trim() || 'Voyageur';

  const { actions } = await import('../../stores/state.js');
  actions.updateProfile({
    username,
    avatar: window.selectedAvatar,
  });

  // Show success toast
  const { showSuccess } = await import('../../services/notifications.js');
  showSuccess(`Bienvenue ${username} !`);
};

window.skipWelcome = async () => {
  const { setState } = await import('../../stores/state.js');
  setState({ showWelcome: false });
};

export default { renderWelcome };
