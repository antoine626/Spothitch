/**
 * Cookie Banner Component (RGPD / GDPR)
 * Bandeau de consentement cookies conformement au RGPD
 */

import { t } from '../../i18n/index.js';
import { Storage } from '../../utils/storage.js';

// Storage key for cookie consent
const COOKIE_CONSENT_KEY = 'cookie_consent';

// Default preferences (necessary cookies always active)
const DEFAULT_PREFERENCES = {
  necessary: true, // Always true, cannot be disabled
  analytics: false,
  marketing: false,
  personalization: false,
};

/**
 * Check if user has already given consent
 * @returns {boolean} True if user has responded to cookie banner
 */
export function hasConsent() {
  const consent = Storage.get(COOKIE_CONSENT_KEY);
  return consent !== null && consent.timestamp !== undefined;
}

/**
 * Get user's cookie preferences
 * @returns {Object} Cookie preferences object
 */
export function getConsent() {
  const consent = Storage.get(COOKIE_CONSENT_KEY);
  if (consent && consent.preferences) {
    // Ensure necessary cookies are always true
    return {
      ...consent.preferences,
      necessary: true,
    };
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Save user's cookie preferences
 * @param {Object} preferences - Cookie preferences to save
 * @returns {boolean} Success status
 */
export function setConsent(preferences) {
  const consent = {
    preferences: {
      ...preferences,
      necessary: true, // Always enforce necessary cookies
    },
    timestamp: Date.now(),
    version: '1.0',
  };
  return Storage.set(COOKIE_CONSENT_KEY, consent);
}

/**
 * Accept all cookies
 */
export function acceptAllCookies() {
  setConsent({
    necessary: true,
    analytics: true,
    marketing: true,
    personalization: true,
  });
  hideBanner();
  // Trigger analytics initialization if needed
  initializeAnalytics();
}

/**
 * Refuse optional cookies (only necessary)
 */
export function refuseOptionalCookies() {
  setConsent({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });
  hideBanner();
}

/**
 * Save custom preferences from the customize modal
 */
export function saveCustomPreferences() {
  const analyticsCheckbox = document.getElementById('cookie-analytics');
  const marketingCheckbox = document.getElementById('cookie-marketing');
  const personalizationCheckbox = document.getElementById('cookie-personalization');

  const preferences = {
    necessary: true,
    analytics: analyticsCheckbox?.checked || false,
    marketing: marketingCheckbox?.checked || false,
    personalization: personalizationCheckbox?.checked || false,
  };

  setConsent(preferences);
  hideCustomizeModal();
  hideBanner();

  // Initialize analytics if accepted
  if (preferences.analytics) {
    initializeAnalytics();
  }
}

/**
 * Initialize analytics (placeholder for actual implementation)
 */
function initializeAnalytics() {
  const preferences = getConsent();
  if (preferences.analytics) {
    console.log('Analytics initialized with user consent');
    // Here you would initialize your analytics service (Google Analytics, etc.)
  }
}

/**
 * Hide the cookie banner
 */
function hideBanner() {
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    banner.classList.add('fade-out');
    setTimeout(() => {
      banner.remove();
    }, 300);
  }
}

/**
 * Show the customize modal
 */
export function showCustomizeModal() {
  const modal = document.getElementById('cookie-customize-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('fade-in');
    // Focus first interactive element
    setTimeout(() => {
      const firstCheckbox = modal.querySelector('input[type="checkbox"]:not(:disabled)');
      if (firstCheckbox) firstCheckbox.focus();
    }, 100);
  }
}

/**
 * Hide the customize modal
 */
export function hideCustomizeModal() {
  const modal = document.getElementById('cookie-customize-modal');
  if (modal) {
    modal.classList.add('fade-out');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('fade-out');
    }, 300);
  }
}

/**
 * Render the cookie banner
 * @returns {string} HTML string for the cookie banner
 */
export function renderCookieBanner() {
  // Don't render if consent already given
  if (hasConsent()) {
    return '';
  }

  const currentPrefs = getConsent();

  return `
    <!-- Cookie Banner -->
    <div
      id="cookie-banner"
      class="fixed bottom-0 left-0 right-0 z-[9999] p-4 slide-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div class="max-w-4xl mx-auto bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden">
        <!-- Header with icon -->
        <div class="p-6 pb-4">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <i class="fas fa-cookie-bite text-2xl text-primary-400" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
              <h2 id="cookie-banner-title" class="text-lg font-semibold text-white mb-2">
                ${t('cookieTitle') || 'Respect de votre vie privee'}
              </h2>
              <p id="cookie-banner-desc" class="text-sm text-slate-400 leading-relaxed">
                ${t('cookieDescription') || 'Nous utilisons des cookies pour ameliorer votre experience, analyser le trafic et personnaliser le contenu. Les cookies necessaires sont toujours actifs pour le bon fonctionnement du site.'}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6 flex flex-wrap gap-3 items-center">
          <button
            onclick="acceptAllCookies()"
            class="btn btn-primary flex-1 sm:flex-none min-w-[140px]"
            type="button"
          >
            <i class="fas fa-check mr-2" aria-hidden="true"></i>
            ${t('cookieAccept') || 'Accepter'}
          </button>
          <button
            onclick="refuseOptionalCookies()"
            class="btn btn-ghost flex-1 sm:flex-none min-w-[140px]"
            type="button"
          >
            <i class="fas fa-times mr-2" aria-hidden="true"></i>
            ${t('cookieRefuse') || 'Refuser'}
          </button>
          <button
            onclick="showCookieCustomize()"
            class="btn btn-ghost text-primary-400 flex-1 sm:flex-none min-w-[140px]"
            type="button"
            aria-haspopup="dialog"
          >
            <i class="fas fa-sliders-h mr-2" aria-hidden="true"></i>
            ${t('cookieCustomize') || 'Personnaliser'}
          </button>
        </div>

        <!-- Legal links -->
        <div class="px-6 pb-4 pt-2 border-t border-white/10">
          <p class="text-xs text-slate-500">
            ${t('cookieLegalText') || 'En continuant, vous acceptez notre'}
            <a href="#" onclick="showLegalPage('privacy')" class="text-primary-400 hover:text-primary-300 underline">
              ${t('privacyPolicy') || 'Politique de confidentialite'}
            </a>
            ${t('and') || 'et'}
            <a href="#" onclick="showLegalPage('cgu')" class="text-primary-400 hover:text-primary-300 underline">
              ${t('termsOfService') || 'CGU'}
            </a>.
          </p>
        </div>
      </div>
    </div>

    <!-- Customize Modal -->
    <div
      id="cookie-customize-modal"
      class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-customize-title"
    >
      <div class="bg-dark-card border border-dark-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 id="cookie-customize-title" class="text-lg font-semibold text-white">
            <i class="fas fa-cog mr-2 text-primary-400" aria-hidden="true"></i>
            ${t('cookiePreferences') || 'Preferences des cookies'}
          </h3>
          <button
            onclick="hideCookieCustomize()"
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="${t('close') || 'Fermer'}"
            type="button"
          >
            <i class="fas fa-times text-white" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Cookie Categories -->
        <div class="p-6 space-y-6">
          <!-- Necessary Cookies (Always On) -->
          <div class="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
            <div class="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="cookie-necessary"
                checked
                disabled
                class="w-5 h-5 rounded border-2 border-primary-500 bg-primary-500 text-white cursor-not-allowed"
                aria-describedby="cookie-necessary-desc"
              />
            </div>
            <div class="flex-1">
              <label for="cookie-necessary" class="font-medium text-white flex items-center gap-2">
                ${t('cookieNecessary') || 'Cookies necessaires'}
                <span class="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                  ${t('required') || 'Obligatoire'}
                </span>
              </label>
              <p id="cookie-necessary-desc" class="text-sm text-slate-400 mt-1">
                ${t('cookieNecessaryDesc') || 'Ces cookies sont essentiels au fonctionnement du site (authentification, securite, preferences de base).'}
              </p>
            </div>
          </div>

          <!-- Analytics Cookies -->
          <div class="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <div class="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="cookie-analytics"
                ${currentPrefs.analytics ? 'checked' : ''}
                class="w-5 h-5 rounded border-2 border-white/30 bg-transparent cursor-pointer accent-primary-500"
                aria-describedby="cookie-analytics-desc"
              />
            </div>
            <div class="flex-1">
              <label for="cookie-analytics" class="font-medium text-white cursor-pointer">
                ${t('cookieAnalytics') || 'Cookies analytiques'}
              </label>
              <p id="cookie-analytics-desc" class="text-sm text-slate-400 mt-1">
                ${t('cookieAnalyticsDesc') || 'Nous aident a comprendre comment vous utilisez le site pour l\'ameliorer (pages visitees, temps passe, etc.).'}
              </p>
            </div>
          </div>

          <!-- Marketing Cookies -->
          <div class="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <div class="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="cookie-marketing"
                ${currentPrefs.marketing ? 'checked' : ''}
                class="w-5 h-5 rounded border-2 border-white/30 bg-transparent cursor-pointer accent-primary-500"
                aria-describedby="cookie-marketing-desc"
              />
            </div>
            <div class="flex-1">
              <label for="cookie-marketing" class="font-medium text-white cursor-pointer">
                ${t('cookieMarketing') || 'Cookies marketing'}
              </label>
              <p id="cookie-marketing-desc" class="text-sm text-slate-400 mt-1">
                ${t('cookieMarketingDesc') || 'Permettent d\'afficher des contenus personnalises et de mesurer l\'efficacite de nos campagnes.'}
              </p>
            </div>
          </div>

          <!-- Personalization Cookies -->
          <div class="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <div class="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="cookie-personalization"
                ${currentPrefs.personalization ? 'checked' : ''}
                class="w-5 h-5 rounded border-2 border-white/30 bg-transparent cursor-pointer accent-primary-500"
                aria-describedby="cookie-personalization-desc"
              />
            </div>
            <div class="flex-1">
              <label for="cookie-personalization" class="font-medium text-white cursor-pointer">
                ${t('cookiePersonalization') || 'Cookies de personnalisation'}
              </label>
              <p id="cookie-personalization-desc" class="text-sm text-slate-400 mt-1">
                ${t('cookiePersonalizationDesc') || 'Memorisent vos preferences pour personnaliser votre experience (langue, theme, recommandations).'}
              </p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-white/10 flex flex-wrap gap-3">
          <button
            onclick="saveCustomCookiePreferences()"
            class="btn btn-primary flex-1"
            type="button"
          >
            <i class="fas fa-save mr-2" aria-hidden="true"></i>
            ${t('savePreferences') || 'Enregistrer mes choix'}
          </button>
          <button
            onclick="acceptAllCookies()"
            class="btn btn-ghost flex-1"
            type="button"
          >
            ${t('acceptAll') || 'Tout accepter'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Global handlers for onclick
window.acceptAllCookies = acceptAllCookies;
window.refuseOptionalCookies = refuseOptionalCookies;
window.showCookieCustomize = showCustomizeModal;
window.hideCookieCustomize = hideCustomizeModal;
window.saveCustomCookiePreferences = saveCustomPreferences;

export default {
  renderCookieBanner,
  hasConsent,
  getConsent,
  setConsent,
  acceptAllCookies,
  refuseOptionalCookies,
  showCustomizeModal,
  hideCustomizeModal,
  saveCustomPreferences,
};
