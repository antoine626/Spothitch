/**
 * Donation Card Component
 * "Buy me a coffee" style donation button
 */

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
  return `
    <div class="donation-card card p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
      <div class="text-center">
        <div class="text-5xl mb-4">
          <span class="inline-block animate-bounce">☕</span>
        </div>
        <h3 class="text-xl font-bold mb-2">Soutenir SpotHitch</h3>
        <p class="text-slate-400 text-sm mb-4">
          SpotHitch est gratuit et le restera. Si tu apprécies l'app, tu peux m'offrir un café pour soutenir le développement !
        </p>

        <!-- Donation amounts -->
        <div class="flex justify-center gap-3 mb-4">
          <button
            onclick="openDonation(3)"
            class="donation-btn px-4 py-3 rounded-xl bg-white/10 hover:bg-amber-500/30 transition-all text-white border border-white/10 hover:border-amber-500/50"
          >
            <div class="text-2xl mb-1">☕</div>
            <div class="font-bold">3€</div>
          </button>
          <button
            onclick="openDonation(5)"
            class="donation-btn px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 transition-all text-white border border-amber-500/30 hover:border-amber-500/50 ring-2 ring-amber-500/20"
          >
            <div class="text-2xl mb-1">☕☕</div>
            <div class="font-bold">5€</div>
            <div class="text-xs text-amber-400">Populaire</div>
          </button>
          <button
            onclick="openDonation(10)"
            class="donation-btn px-4 py-3 rounded-xl bg-white/10 hover:bg-amber-500/30 transition-all text-white border border-white/10 hover:border-amber-500/50"
          >
            <div class="text-2xl mb-1">☕☕☕</div>
            <div class="font-bold">10€</div>
          </button>
        </div>

        <!-- Custom amount -->
        <button
          onclick="openDonation('custom')"
          class="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          <i class="fas fa-edit mr-1"></i>
          Montant personnalisé
        </button>

        <!-- Benefits -->
        <div class="mt-6 pt-4 border-t border-white/10">
          <p class="text-xs text-slate-500">
            <i class="fas fa-heart text-danger-400 mr-1"></i>
            Merci aux 127 supporters qui ont contribué !
          </p>
        </div>
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
      onclick="openDonation(5)"
      class="donation-btn-compact flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all"
    >
      <span class="text-xl">☕</span>
      <span class="text-sm font-medium text-amber-400">Offrir un café</span>
    </button>
  `;
}

/**
 * Donation banner (for header or footer)
 */
function renderDonationBanner() {
  return `
    <div class="donation-banner bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-y border-amber-500/20 py-3 px-4">
      <div class="flex items-center justify-between max-w-screen-lg mx-auto">
        <div class="flex items-center gap-3">
          <span class="text-2xl">☕</span>
          <div>
            <div class="font-medium text-sm">Tu aimes SpotHitch ?</div>
            <div class="text-xs text-slate-400">Soutiens le projet en m'offrant un café</div>
          </div>
        </div>
        <button
          onclick="openDonation(5)"
          class="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30"
        >
          Offrir ☕
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

  const { donationAmount = 5 } = state;
  const isCustom = donationAmount === 'custom';

  return `
    <div
      class="donation-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeDonation()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-title"
    >
      <div class="bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
          <div class="text-5xl mb-2">☕</div>
          <h2 id="donation-title" class="text-2xl font-bold text-white">Offrir un café</h2>
          <p class="text-white/80 text-sm">Merci de soutenir SpotHitch !</p>
        </div>

        <!-- Content -->
        <div class="p-6">
          ${isCustom ? `
            <div class="mb-6">
              <label class="block text-sm text-slate-400 mb-2">Montant personnalisé</label>
              <div class="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value="5"
                  id="custom-amount"
                  class="input-modern text-center text-2xl font-bold pr-8"
                  placeholder="5"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">€</span>
              </div>
            </div>
          ` : `
            <div class="text-center mb-6">
              <div class="text-4xl font-bold text-amber-400 mb-1">${donationAmount}€</div>
              <div class="text-slate-400 text-sm">
                ${donationAmount === 3 ? 'Un petit café' : donationAmount === 5 ? 'Un café et un croissant' : 'Un super soutien !'}
              </div>
            </div>
          `}

          <!-- Payment Methods -->
          <div class="space-y-3">
            <button
              onclick="processDonation('paypal')"
              class="w-full py-4 px-6 rounded-xl bg-[#0070ba] text-white font-medium flex items-center justify-center gap-3 hover:bg-[#005ea6] transition-all"
            >
              <i class="fab fa-paypal text-xl"></i>
              Payer avec PayPal
            </button>

            <button
              onclick="processDonation('stripe')"
              class="w-full py-4 px-6 rounded-xl bg-[#635bff] text-white font-medium flex items-center justify-center gap-3 hover:bg-[#5046e5] transition-all"
            >
              <i class="fas fa-credit-card text-xl"></i>
              Carte bancaire
            </button>

            <a
              href="https://www.buymeacoffee.com/spothitch"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-4 px-6 rounded-xl bg-[#FFDD00] text-black font-medium flex items-center justify-center gap-3 hover:bg-[#E5C700] transition-all"
            >
              <span class="text-xl">☕</span>
              Buy Me a Coffee
            </a>
          </div>

          <!-- Secure payment notice -->
          <div class="mt-6 text-center">
            <p class="text-xs text-slate-500 flex items-center justify-center gap-2">
              <i class="fas fa-lock"></i>
              Paiement sécurisé • Aucun compte requis
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-800 flex justify-center">
          <button
            onclick="closeDonation()"
            class="text-slate-400 hover:text-white transition-colors"
          >
            Peut-être plus tard
          </button>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
window.openDonation = (amount = 5) => {
  window.setState?.({ showDonation: true, donationAmount: amount });
};

window.closeDonation = () => {
  window.setState?.({ showDonation: false });
};

window.processDonation = (method) => {
  const state = window.getState?.() || {};
  let amount = state.donationAmount;

  // Get custom amount if applicable
  if (amount === 'custom') {
    const input = document.getElementById('custom-amount');
    amount = parseInt(input?.value) || 5;
  }

  // Generate payment URL based on method
  let paymentUrl;

  switch (method) {
    case 'paypal':
      paymentUrl = `https://www.paypal.com/donate?business=spothitch@example.com&amount=${amount}&currency_code=EUR`;
      break;
    case 'stripe':
      // In production, this would be a Stripe checkout link
      paymentUrl = `https://buy.stripe.com/test_spothitch?amount=${amount * 100}`;
      break;
    default:
      paymentUrl = 'https://www.buymeacoffee.com/spothitch';
  }

  // Open payment in new tab
  window.open(paymentUrl, '_blank');

  // Show thank you message
  window.showToast?.('Merci pour ton soutien !', 'success');
  window.setState?.({ showDonation: false });

  // Award points for donation
  window.addPoints?.(amount * 10, 'donation');
};

export default {
  renderDonationCard,
  renderDonationModal,
};
