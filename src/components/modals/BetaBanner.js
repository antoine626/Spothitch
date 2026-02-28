/**
 * Beta Banner + Welcome Popup
 * - Small persistent banner at top: "Version bêta"
 * - First-visit popup explaining the beta + where to give feedback
 * - localStorage key: spothitch_beta_seen (popup shown once only)
 */

import { t } from '../../i18n/index.js'

const BETA_SEEN_KEY = 'spothitch_beta_seen'

function hasSeen() {
  return localStorage.getItem(BETA_SEEN_KEY) === '1'
}

/**
 * Render the beta banner (small top banner) + popup if first visit
 */
export function renderBetaBanner() {
  const showPopup = !hasSeen()

  const banner = `
    <div id="beta-banner"
      class="fixed top-0 left-0 right-0 z-40 text-center py-1 text-xs font-bold"
      style="background: linear-gradient(90deg, #f59e0b, #fb923c); color: #000">
      ${t('betaBannerText') || 'Version bêta — aide-nous à améliorer SpotHitch !'}
    </div>`

  if (!showPopup) return banner

  const popup = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeBetaPopup()" role="dialog" aria-modal="true" tabindex="0">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true"></div>
      <div class="relative bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-amber-500/30"
        onclick="event.stopPropagation()">

        <!-- Header -->
        <div class="text-center mb-5">
          <div class="text-5xl mb-3">🚀</div>
          <h2 class="text-xl font-bold text-white mb-1">
            ${t('betaPopupTitle') || 'Bienvenue sur SpotHitch !'}
          </h2>
          <div class="inline-block px-3 py-1 rounded-full text-xs font-bold mt-1"
            style="background: linear-gradient(90deg, #f59e0b, #fb923c); color: #000">
            ${t('betaPopupBadge') || 'VERSION BÊTA'}
          </div>
        </div>

        <!-- Explanation -->
        <div class="space-y-3 mb-5">
          <p class="text-sm text-slate-200 leading-relaxed">
            ${t('betaPopupExplain') || 'Tu fais partie des premiers à tester SpotHitch ! L\'app est en cours de développement et ton avis compte énormément pour nous.'}
          </p>
          <p class="text-sm text-slate-300 leading-relaxed">
            ${t('betaPopupHelp') || 'Si tu trouves un bug ou si tu as une idée, on veut le savoir !'}
          </p>
        </div>

        <!-- Feedback button location -->
        <div class="card p-3 mb-5 border border-amber-500/30 bg-amber-500/10">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-0.5">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                style="background: linear-gradient(180deg, #fbbf24, #f59e0b)">
                <span class="text-black text-sm font-bold">💬</span>
              </div>
            </div>
            <div>
              <p class="text-sm font-bold text-amber-400 mb-1">
                ${t('betaPopupFeedbackTitle') || 'Bouton "Avis" sur le côté gauche'}
              </p>
              <p class="text-xs text-slate-300">
                ${t('betaPopupFeedbackDesc') || 'Clique sur le bouton orange "Avis" à gauche de l\'écran pour noter chaque fonctionnalité et nous dire ce que tu en penses.'}
              </p>
            </div>
          </div>
        </div>

        <!-- What to look for -->
        <div class="grid grid-cols-3 gap-2 mb-5 text-center">
          <div class="card p-2">
            <div class="text-lg mb-1">🐛</div>
            <div class="text-[10px] text-slate-300">${t('betaPopupBugs') || 'Signale les bugs'}</div>
          </div>
          <div class="card p-2">
            <div class="text-lg mb-1">💡</div>
            <div class="text-[10px] text-slate-300">${t('betaPopupIdeas') || 'Propose des idées'}</div>
          </div>
          <div class="card p-2">
            <div class="text-lg mb-1">👍</div>
            <div class="text-[10px] text-slate-300">${t('betaPopupLike') || 'Dis ce que tu aimes'}</div>
          </div>
        </div>

        <!-- CTA -->
        <button onclick="closeBetaPopup()"
          class="w-full py-3 rounded-xl font-bold text-black text-sm"
          style="background: linear-gradient(90deg, #f59e0b, #fb923c)">
          ${t('betaPopupCTA') || 'C\'est parti, je teste !'}
        </button>
      </div>
    </div>`

  return banner + popup
}

// ==================== HANDLERS ====================

window.closeBetaPopup = () => {
  localStorage.setItem(BETA_SEEN_KEY, '1')
  // Remove popup from DOM
  const popup = document.querySelector('[role="dialog"][aria-modal="true"]')
  if (popup && popup.closest('.fixed.inset-0.z-50')) {
    popup.closest('.fixed.inset-0.z-50').remove()
  }
}

export default { renderBetaBanner }
