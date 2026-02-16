/**
 * Donation Card Component
 * Section "Soutenir SpotHitch" with predefined amounts
 */

import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

/**
 * Render donation card
 * @param {Object} options - Options
 * @param {string} options.variant - 'full' | 'compact' | 'banner'
 */
export function renderDonationCard(options = {}) {
  const { variant = 'full' } = options;

  if (variant === 'compact') {
    return renderCompactDonation();
  }

  if (variant === 'banner') {
    return renderDonationBanner();
  }

  return renderFullDonation();
}

/**
 * Full donation card with explanation
 */
function renderFullDonation() {
  const state = window.getState?.() || {};
  const isSupporter = state.badges?.includes('supporter') || state.isSupporter;

  return `
    <div class="donation-card card p-6 bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-orange-500/10 border-rose-500/30">
      <div class="text-center">
        <!-- Heart icon with animation -->
        <div class="text-5xl mb-4">
          <span class="inline-block animate-pulse text-rose-400">
            ${icon('heart', 'w-5 h-5')}
          </span>
        </div>

        <h3 class="text-xl font-bold mb-2 flex items-center justify-center gap-2">
          ${icon('hand-holding-heart', 'w-5 h-5 text-rose-400')}
          Soutenir SpotHitch
        </h3>

        <p class="text-slate-400 text-sm mb-6 leading-relaxed">
          SpotHitch est <strong class="text-emerald-400">gratuit</strong> et le restera !<br/>
          Si tu veux nous aider a continuer l'aventure et a ameliorer l'app...
        </p>

        ${isSupporter ? `
          <!-- Supporter badge display -->
          <div class="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/30">
            <div class="flex items-center justify-center gap-3">
              <span class="text-3xl">
                ${icon('medal', 'w-5 h-5 text-amber-400')}
              </span>
              <div class="text-left">
                <div class="font-bold text-amber-400">Merci Supporter !</div>
                <div class="text-xs text-slate-400">Tu fais partie des heros de SpotHitch</div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Donation amounts grid -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <!-- Coffee - 3E -->
          <button
            onclick="openDonation(3, 'coffee')"
            class="donation-btn p-4 rounded-xl bg-white/5 hover:bg-amber-500/20 transition-all text-white border border-white/10 hover:border-amber-500/50 group"
          >
            <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">
              ${icon('mug-hot', 'w-5 h-5 text-amber-400')}
            </div>
            <div class="font-bold text-lg">3 EUR</div>
            <div class="text-xs text-slate-400">Offrir un cafe</div>
          </button>

          <!-- Pizza - 10E -->
          <button
            onclick="openDonation(10, 'pizza')"
            class="donation-btn p-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/30 transition-all text-white border border-amber-500/30 hover:border-amber-500/50 ring-2 ring-amber-500/20 group"
          >
            <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">
              ${icon('pizza-slice', 'w-5 h-5 text-orange-400')}
            </div>
            <div class="font-bold text-lg">10 EUR</div>
            <div class="text-xs text-amber-400">Offrir une pizza</div>
            <div class="text-[10px] text-amber-500 mt-1 font-medium">Populaire</div>
          </button>

          <!-- Gas - 50E -->
          <button
            onclick="openDonation(50, 'gas')"
            class="donation-btn p-4 rounded-xl bg-white/5 hover:bg-emerald-500/20 transition-all text-white border border-white/10 hover:border-emerald-500/50 group"
          >
            <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">
              ${icon('gas-pump', 'w-5 h-5 text-emerald-400')}
            </div>
            <div class="font-bold text-lg">50 EUR</div>
            <div class="text-xs text-slate-400">Offrir le plein</div>
          </button>

          <!-- Custom amount -->
          <button
            onclick="openDonation('custom', 'heart')"
            class="donation-btn p-4 rounded-xl bg-white/5 hover:bg-rose-500/20 transition-all text-white border border-white/10 hover:border-rose-500/50 group"
          >
            <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">
              ${icon('heart', 'w-5 h-5 text-rose-400')}
            </div>
            <div class="font-bold text-lg">? EUR</div>
            <div class="text-xs text-slate-400">Montant libre</div>
          </button>
        </div>

        <!-- External links -->
        <div class="flex justify-center gap-4 mb-4">
          <a
            href="https://ko-fi.com/spothitch"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            aria-label="Soutenir sur Ko-fi"
          >
            ${icon('coffee', 'w-5 h-5')}
            Ko-fi
          </a>
          <span class="text-slate-600">|</span>
          <a
            href="https://www.buymeacoffee.com/spothitch"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
            aria-label="Buy Me a Coffee"
          >
            ${icon('mug-saucer', 'w-5 h-5')}
            Buy Me a Coffee
          </a>
        </div>

        <!-- Supporter badge info -->
        ${!isSupporter ? `
          <div class="pt-4 border-t border-white/10">
            <p class="text-xs text-slate-400 flex items-center justify-center gap-2">
              ${icon('star', 'w-5 h-5 text-amber-400')}
              Recois le badge <strong class="text-amber-400">Supporter</strong> sur ton profil !
            </p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Compact donation button
 */
function renderCompactDonation() {
  return `
    <button
      onclick="openDonation(10, 'pizza')"
      class="donation-btn-compact flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/30 hover:border-rose-500/50 transition-all"
    >
      <span class="text-xl">
        ${icon('heart', 'w-5 h-5 text-rose-400')}
      </span>
      <span class="text-sm font-medium text-rose-400">Soutenir</span>
    </button>
  `;
}

/**
 * Donation banner (for header or footer)
 */
function renderDonationBanner() {
  return `
    <div class="donation-banner bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border-y border-rose-500/20 py-3 px-4">
      <div class="flex items-center justify-between max-w-screen-lg mx-auto">
        <div class="flex items-center gap-3">
          <span class="text-2xl">
            ${icon('heart', 'w-5 h-5 text-rose-400 animate-pulse')}
          </span>
          <div>
            <div class="font-medium text-sm">Tu aimes SpotHitch ?</div>
            <div class="text-xs text-slate-400">Soutiens le projet et aide la communaute</div>
          </div>
        </div>
        <button
          onclick="openDonation(10, 'pizza')"
          class="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 text-white text-sm font-medium hover:from-rose-600 hover:to-amber-600 transition-all shadow-lg shadow-rose-500/30"
        >
          ${icon('heart', 'w-5 h-5 mr-1')} Soutenir
        </button>
      </div>
    </div>
  `;
}

/**
 * Render donation modal
 * @param {Object} state - App state
 */
export function renderDonationModal(state) {
  if (!state.showDonation) return '';

  const { donationAmount = 10, donationType = 'pizza' } = state;
  const isCustom = donationAmount === 'custom';

  // Get donation info based on type
  const donationInfo = {
    coffee: { icon: 'fa-mug-hot', color: 'amber', label: 'Un cafe bien chaud' },
    pizza: { icon: 'fa-pizza-slice', color: 'orange', label: 'Une pizza pour le dev' },
    gas: { icon: 'fa-gas-pump', color: 'emerald', label: 'Un plein pour les adventures' },
    heart: { icon: 'fa-heart', color: 'rose', label: 'Ton soutien du coeur' },
  };
  const info = donationInfo[donationType] || donationInfo.heart;

  return `
    <div
      class="donation-modal fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeDonation()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-title"
    >
      <div class="modal-panel rounded-2xl max-w-md w-full overflow-hidden animate-in">
        <!-- Header -->
        <div class="bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 p-6 text-center">
          <div class="text-5xl mb-2">
            ${icon(info.icon, 'w-5 h-5 text-white')}
          </div>
          <h2 id="donation-title" class="text-2xl font-bold text-white">Soutenir SpotHitch</h2>
          <p class="text-white/80 text-sm">${info.label}</p>
        </div>

        <!-- Content -->
        <div class="p-6">
          ${isCustom ? `
            <div class="mb-6">
              <label class="block text-sm text-slate-400 mb-2">Choisis ton montant</label>
              <div class="relative">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value="5"
                  id="custom-amount"
                  class="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-center text-2xl font-bold text-white focus:border-rose-500 focus:outline-hidden"
                  placeholder="5"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">EUR</span>
              </div>
            </div>
          ` : `
            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center gap-3 mb-2">
                <span class="text-4xl">
                  ${icon(info.icon, `w-5 h-5 text-${info.color}-400`)}
                </span>
                <span class="text-5xl font-bold text-white">${donationAmount} EUR</span>
              </div>
              <div class="text-slate-400 text-sm">${info.label}</div>
            </div>
          `}

          <!-- Payment Methods -->
          <div class="space-y-3">
            <a
              href="https://ko-fi.com/spothitch"
              target="_blank"
              rel="noopener noreferrer"
              onclick="handleDonationClick('kofi')"
              class="w-full py-4 px-6 rounded-xl bg-[#FF5E5B] text-white font-medium flex items-center justify-center gap-3 hover:bg-[#e5524f] transition-all block text-center"
            >
              ${icon('coffee', 'w-6 h-6')}
              Ko-fi
            </a>

            <a
              href="https://www.buymeacoffee.com/spothitch"
              target="_blank"
              rel="noopener noreferrer"
              onclick="handleDonationClick('bmc')"
              class="w-full py-4 px-6 rounded-xl bg-[#FFDD00] text-black font-medium flex items-center justify-center gap-3 hover:bg-[#E5C700] transition-all block text-center"
            >
              ${icon('mug-saucer', 'w-6 h-6')}
              Buy Me a Coffee
            </a>

            <a
              href="https://www.paypal.com/donate?business=spothitch@example.com&currency_code=EUR"
              target="_blank"
              rel="noopener noreferrer"
              onclick="handleDonationClick('paypal')"
              class="w-full py-4 px-6 rounded-xl bg-[#0070ba] text-white font-medium flex items-center justify-center gap-3 hover:bg-[#005ea6] transition-all block text-center"
            >
              ${icon('paypal', 'w-6 h-6')}
              PayPal
            </a>
          </div>

          <!-- Info notice -->
          <div class="mt-6 text-center space-y-2">
            <p class="text-xs text-slate-400 flex items-center justify-center gap-2">
              ${icon('lock', 'w-5 h-5')}
              Paiement securise via les plateformes officielles
            </p>
            <p class="text-xs text-amber-400/80 flex items-center justify-center gap-2">
              ${icon('star', 'w-5 h-5')}
              Tu recevras le badge Supporter !
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-white/10 flex justify-center">
          <button
            onclick="closeDonation()"
            class="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ${icon('times', 'w-5 h-5 mr-1')}
            Peut-etre plus tard
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render thank you modal after donation
 * @param {Object} state - App state
 */
export function renderThankYouModal(state) {
  if (!state.showDonationThankYou) return '';

  return `
    <div
      class="thank-you-modal fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeDonationThankYou()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thank-you-title"
    >
      <div class="modal-panel rounded-2xl max-w-md w-full overflow-hidden animate-in text-center">
        <!-- Confetti effect area -->
        <div class="bg-gradient-to-br from-rose-500/20 via-amber-500/20 to-orange-500/20 p-8">
          <!-- Animated heart -->
          <div class="text-7xl mb-4 animate-bounce">
            ${icon('heart', 'w-5 h-5 text-rose-500')}
          </div>

          <h2 id="thank-you-title" class="text-3xl font-bold mb-2">MERCI !</h2>
          <p class="text-slate-300 mb-4">
            Tu es incroyable ! Ton soutien nous motive a continuer.
          </p>

          <!-- Badge earned -->
          <div class="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/50">
            ${icon('medal', 'w-7 h-7 text-amber-400')}
            <div class="text-left">
              <div class="text-xs text-amber-400/80">Badge debloque</div>
              <div class="font-bold text-amber-400">Supporter</div>
            </div>
          </div>
        </div>

        <div class="p-6">
          <p class="text-slate-400 text-sm mb-6">
            Ton badge Supporter est maintenant visible sur ton profil.
            La communaute te remercie !
          </p>

          <button
            onclick="closeDonationThankYou()"
            class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-medium hover:from-rose-600 hover:to-amber-600 transition-all"
          >
            ${icon('check', 'w-5 h-5 mr-2')}
            Super, merci !
          </button>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
window.openDonation = (amount = 10, type = 'pizza') => {
  window.setState?.({ showDonation: true, donationAmount: amount, donationType: type });
};

window.closeDonation = () => {
  window.setState?.({ showDonation: false });
};

window.handleDonationClick = (platform) => {
  const state = window.getState?.() || {};
  let amount = state.donationAmount;

  // Get custom amount if applicable
  if (amount === 'custom') {
    const input = document.getElementById('custom-amount');
    amount = parseInt(input?.value) || 5;
  }

  // Award supporter badge
  const currentBadges = state.badges || [];
  if (!currentBadges.includes('supporter')) {
    window.setState?.({
      badges: [...currentBadges, 'supporter'],
      isSupporter: true,
    });
  }

  // Award points based on amount
  const points = Math.min(amount * 5, 250); // Cap at 250 points
  window.addPoints?.(points, 'donation');

  // Close donation modal and show thank you
  window.setState?.({
    showDonation: false,
    showDonationThankYou: true,
  });

  // Show toast
  window.showToast?.(t('donationThankYou') || 'Thank you for your support!', 'success');

};

window.closeDonationThankYou = () => {
  window.setState?.({ showDonationThankYou: false });
};

// Legacy handler for backward compatibility
window.processDonation = (method) => {
  window.handleDonationClick(method);
};

export default {
  renderDonationCard,
  renderDonationModal,
  renderThankYouModal,
};
