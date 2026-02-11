/**
 * Welcome Modal Component
 * Onboarding for new users
 */

import { t, getAvailableLanguages, setLanguage } from '../../i18n/index.js';

const avatars = ['🤙', '😎', '🧳', '🎒', '🌍', '✌️', '🚗', '🛣️', '⛺', '🏕️', '🌄', '🗺️'];

export function renderWelcome(state) {
  const languages = getAvailableLanguages();
  const currentLang = state.lang || 'fr';

  return `
    <div class="min-h-screen flex items-center justify-center p-4
      bg-gradient-to-br from-dark-primary to-dark-secondary"
      role="main"
      aria-labelledby="welcome-title">
      <div class="card p-8 max-w-md w-full text-center fade-in">
        <!-- Logo -->
        <div class="text-6xl mb-4" aria-hidden="true">🤙</div>
        <h1 id="welcome-title" class="text-3xl font-display font-bold gradient-text mb-2">${t('appName')}</h1>
        <p class="text-slate-400 mb-6">${t('welcomeDesc')}</p>

        <!-- Language Selection (compact) -->
        <div class="mb-6">
          <label class="text-sm text-slate-400 block mb-2">${t('chooseLanguage')}</label>
          <div class="flex justify-center gap-2" role="radiogroup" aria-label="Language selection">
            ${languages.map((lang) => `
              <button
                type="button"
                class="welcome-lang-btn w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center text-xl
                  ${lang.code === currentLang
    ? 'border-primary-500 bg-primary-500/20'
    : 'border-white/10 bg-white/5 hover:border-primary-500/50'
}"
                data-lang="${lang.code}"
                onclick="selectWelcomeLanguage('${lang.code}')"
                role="radio"
                aria-checked="${lang.code === currentLang ? 'true' : 'false'}"
                aria-label="${lang.nativeName}"
                title="${lang.nativeName}"
              >
                ${lang.flag}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Username -->
        <div class="mb-6 text-left">
          <label for="welcome-username" class="text-sm text-slate-400 block mb-2">${t('yourUsername')}</label>
          <input
            type="text"
            id="welcome-username"
            name="username"
            class="input-modern"
            placeholder="Ex: Marco_Polo"
            maxlength="20"
            autocomplete="username"
          />
        </div>

        <!-- Avatar Selection -->
        <fieldset class="mb-8 text-left border-none p-0">
          <legend class="text-sm text-slate-400 block mb-3">${t('chooseAvatar')}</legend>
          <div class="grid grid-cols-6 gap-2" id="avatar-grid" role="radiogroup" aria-label="Selection d'avatar">
            ${avatars.map((avatar, i) => `
              <button
                type="button"
                class="avatar-option ${i === 0 ? 'selected' : ''}"
                data-avatar="${avatar}"
                onclick="selectAvatar('${avatar}')"
                role="radio"
                aria-checked="${i === 0 ? 'true' : 'false'}"
                aria-label="Avatar ${avatar}"
              >
                ${avatar}
              </button>
            `).join('')}
          </div>
        </fieldset>

        <!-- Submit -->
        <button
          onclick="completeWelcome()"
          class="btn btn-primary w-full text-lg"
          type="button"
        >
          ${t('letsGo')} <span aria-hidden="true">🚀</span>
        </button>

        <!-- Skip -->
        <button
          onclick="skipWelcome()"
          class="text-slate-500 text-sm mt-4 hover:text-slate-300 transition-colors"
          type="button"
        >
          ${t('continueWithoutAccount')}
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
    const isSelected = el.dataset.avatar === avatar;
    el.classList.toggle('selected', isSelected);
    el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });
};

/**
 * Handle language selection in welcome screen
 */
window.selectWelcomeLanguage = async (langCode) => {
  // Update UI for language buttons
  document.querySelectorAll('.welcome-lang-btn').forEach(el => {
    const isSelected = el.dataset.lang === langCode;
    el.classList.toggle('border-primary-500', isSelected);
    el.classList.toggle('bg-primary-500/20', isSelected);
    el.classList.toggle('border-white/10', !isSelected);
    el.classList.toggle('bg-white/5', !isSelected);
    el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });

  // Use global setLanguage which writes directly to localStorage + reloads
  window.setLanguage(langCode);
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
  const { t } = await import('../../i18n/index.js');
  showSuccess(t('welcomeUser')?.replace('{username}', username) || `Bienvenue ${username} !`);
};

window.skipWelcome = async () => {
  const { setState } = await import('../../stores/state.js');
  setState({ showWelcome: false });
};

export default { renderWelcome };
