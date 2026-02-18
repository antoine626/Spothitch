/**
 * Language Selector Modal Component
 * Shown on first launch for language selection
 */

import { icon } from '../../utils/icons.js'
import {
  getAvailableLanguages,
  setLanguage,
  detectLanguage,
  markLanguageSelected,
} from '../../i18n/index.js';

/**
 * Render the language selector screen
 * @param {Object} state - Current app state
 * @returns {string} HTML string
 */
export function renderLanguageSelector(state) {
  const languages = getAvailableLanguages();
  const detectedLang = detectLanguage();

  return `
    <div class="min-h-screen flex items-center justify-center p-4
      bg-gradient-to-br from-dark-primary to-dark-secondary"
      role="main"
      aria-labelledby="language-title">
      <div class="card p-8 max-w-md w-full text-center fade-in">
        <!-- Logo -->
        <div class="text-6xl mb-4" aria-hidden="true">🌍</div>
        <h1 id="language-title" class="text-3xl font-display font-bold gradient-text mb-2">SpotHitch</h1>
        <p class="text-slate-400 mb-8">Choose your language / Choisis ta langue</p>

        <!-- Language Grid -->
        <div class="grid grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Language selection">
          ${languages.map((lang) => `
            <button
              type="button"
              class="language-option p-4 rounded-xl border-2 transition-all
                ${lang.code === detectedLang
    ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/50'
    : 'border-white/10 bg-white/5 hover:border-primary-500/50 hover:bg-white/10'
}"
              data-lang="${lang.code}"
              onclick="selectLanguageOption('${lang.code}')"
              role="radio"
              aria-checked="${lang.code === detectedLang ? 'true' : 'false'}"
              aria-label="${lang.nativeName}"
            >
              <div class="text-3xl mb-2">${lang.flag}</div>
              <div class="font-medium">${lang.nativeName}</div>
            </button>
          `).join('')}
        </div>

        <!-- Detected language hint -->
        <p class="text-xs text-slate-400 mb-6">
          ${icon('wand-sparkles', 'w-5 h-5 mr-1')}
          Auto-detected: ${languages.find(l => l.code === detectedLang)?.nativeName || 'English'}
        </p>

        <!-- Confirm Button -->
        <button
          onclick="confirmLanguageSelection()"
          class="btn btn-primary w-full text-lg"
          type="button"
          id="confirm-language-btn"
        >
          <span class="confirm-text">Continue</span> <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  `;
}

// Store selected language temporarily
window.selectedLanguageCode = detectLanguage();

/**
 * Handle language option selection
 */
window.selectLanguageOption = (langCode) => {
  window.selectedLanguageCode = langCode;

  // Update UI - remove selection from all, add to clicked
  document.querySelectorAll('.language-option').forEach(el => {
    const isSelected = el.dataset.lang === langCode;
    el.classList.toggle('border-primary-500', isSelected);
    el.classList.toggle('bg-primary-500/20', isSelected);
    el.classList.toggle('ring-2', isSelected);
    el.classList.toggle('ring-primary-500/50', isSelected);
    el.classList.toggle('border-white/10', !isSelected);
    el.classList.toggle('bg-white/5', !isSelected);
    el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });

  // Update button text based on selected language
  const buttonTexts = {
    fr: 'Continuer',
    en: 'Continue',
    es: 'Continuar',
    de: 'Weiter',
  };
  const confirmText = document.querySelector('.confirm-text');
  if (confirmText) {
    confirmText.textContent = buttonTexts[langCode] || 'Continue';
  }
};

/**
 * Confirm language selection and proceed to welcome
 */
window.confirmLanguageSelection = async () => {
  const langCode = window.selectedLanguageCode || 'en';

  // Write lang directly to localStorage first
  try {
    const stored = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
    stored.lang = langCode
    stored.showLanguageSelector = false
    localStorage.setItem('spothitch_v4_state', JSON.stringify(stored))
  } catch (e) { /* no-op */ }

  // Set the language via i18n + mark selection
  setLanguage(langCode);
  markLanguageSelected();

  // Update state
  const { setState } = await import('../../stores/state.js');
  setState({
    lang: langCode,
    showLanguageSelector: false,
  });
};

export default { renderLanguageSelector };
