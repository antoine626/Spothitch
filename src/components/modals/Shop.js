/**
 * Shop Modal Component
 * Partner rewards - Exchange thumbs (pouces) for real discounts
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { shopRewards, rewardCategories, getRewardsByCategory, getRewardById, canAfford } from '../../data/rewards.js';
import { showToast } from '../../services/notifications.js';

/**
 * Render shop modal
 */
export function renderShopModal() {
  const state = getState();
  const { showShop, thumbs = 0, points = 0, redeemedCodes = [], lang = 'fr', shopCategory = 'all' } = state;

  if (!showShop) return '';

  const userThumbs = thumbs || points; // Backward compatibility
  const categoryRewards = getRewardsByCategory(shopCategory);

  return `
    <div class="shop-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeShop()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="shop-title">
      <div class="bg-dark-primary w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden
                  flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="shop-title" class="text-2xl font-bold text-white">Récompenses</h2>
              <p class="text-white/80">Échange tes pouces contre des réductions</p>
            </div>
            <button onclick="closeShop()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                    type="button"
                    aria-label="${t('close') || 'Close'}">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>

          <!-- Balance -->
          <div class="mt-4 flex items-center justify-center bg-white/20 rounded-xl p-4">
            <div class="text-center">
              <div class="text-4xl mb-1">👍</div>
              <div class="text-3xl font-bold text-white">${userThumbs.toLocaleString()}</div>
              <div class="text-white/70 text-sm">Pouces disponibles</div>
            </div>
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-dark-secondary/50">
          ${rewardCategories.map(cat => `
            <button onclick="setShopCategory('${cat.id}')"
                    class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                           ${shopCategory === cat.id
    ? 'bg-primary-500 text-white'
    : 'bg-white/5 text-slate-400 hover:bg-white/10'}">
              ${cat.icon} ${cat.name}
            </button>
          `).join('')}
        </div>

        <!-- Rewards Grid -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="space-y-3">
            ${categoryRewards.map(reward => renderPartnerReward(reward, userThumbs, redeemedCodes, lang)).join('')}
          </div>

          ${categoryRewards.length === 0 ? `
            <div class="text-center py-10 text-slate-500">
              <span class="text-4xl">🎁</span>
              <p class="mt-2">Aucune offre dans cette catégorie</p>
            </div>
          ` : ''}
        </div>

        <!-- My Codes Button -->
        <div class="p-4 border-t border-white/10">
          <button onclick="showMyRewards()"
                  class="w-full py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
            <i class="fas fa-ticket-alt mr-2" aria-hidden="true"></i>
            Mes codes promo (${redeemedCodes?.length || 0})
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a partner reward card
 */
function renderPartnerReward(reward, userThumbs, redeemedCodes, lang) {
  const name = lang === 'en' && reward.nameEn ? reward.nameEn : reward.name;
  const description = lang === 'en' && reward.descriptionEn ? reward.descriptionEn : reward.description;
  const isRedeemed = redeemedCodes?.includes(reward.id);
  const canBuy = userThumbs >= reward.cost && !isRedeemed;

  return `
    <div class="card p-4 ${isRedeemed ? 'opacity-60' : ''} ${canBuy ? 'hover:border-primary-500/50' : ''}">
      <div class="flex gap-4">
        <!-- Partner Logo -->
        <div class="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
          ${reward.partnerLogo}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="font-bold text-white">${name}</h4>
              <p class="text-xs text-slate-400">${reward.partner}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-lg font-bold ${canBuy ? 'text-amber-400' : 'text-slate-500'}">
                ${reward.discount}
              </div>
            </div>
          </div>

          <p class="text-sm text-slate-400 mt-1">${description}</p>

          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-1 text-sm ${canBuy ? 'text-amber-400' : 'text-slate-500'}">
              <span>👍</span>
              <span class="font-bold">${reward.cost}</span>
              <span class="text-slate-500">pouces</span>
            </div>

            ${isRedeemed ? `
              <span class="text-emerald-400 text-sm font-medium">
                <i class="fas fa-check mr-1" aria-hidden="true"></i>
                Obtenu
              </span>
            ` : canBuy ? `
              <button onclick="redeemReward('${reward.id}')"
                      class="px-4 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all">
                Échanger
              </button>
            ` : `
              <span class="text-slate-500 text-sm">
                ${userThumbs < reward.cost ? `Il te manque ${reward.cost - userThumbs} 👍` : ''}
              </span>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render user's redeemed codes
 */
export function renderMyRewardsModal() {
  const state = getState();
  const { showMyRewards, redeemedCodes = [], lang = 'fr' } = state;

  if (!showMyRewards) return '';

  const redeemedRewards = redeemedCodes.map(id => getRewardById(id)).filter(Boolean);

  return `
    <div class="my-rewards-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeMyRewards()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="myrewards-title">
      <div class="bg-dark-primary w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden
                  flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="myrewards-title" class="text-2xl font-bold text-white">Mes Codes Promo</h2>
              <p class="text-white/80">${redeemedRewards.length} code(s) disponible(s)</p>
            </div>
            <button onclick="closeMyRewards()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                    type="button"
                    aria-label="${t('close') || 'Close'}">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          ${redeemedRewards.length === 0 ? `
            <div class="text-center py-10 text-slate-500">
              <span class="text-5xl mb-4 block">🎫</span>
              <p class="font-medium">Aucun code promo</p>
              <p class="text-sm mt-1">Échange tes pouces contre des réductions !</p>
              <button onclick="closeMyRewards(); openShop()"
                      class="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                Voir les offres
              </button>
            </div>
          ` : `
            <div class="space-y-4">
              ${redeemedRewards.map(reward => `
                <div class="card p-4 border-emerald-500/30">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                      ${reward.partnerLogo}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <h4 class="font-bold text-white">${reward.partner}</h4>
                        <span class="text-emerald-400 font-bold">${reward.discount}</span>
                      </div>
                      <p class="text-sm text-slate-400 mt-1">${reward.description}</p>

                      <!-- Code Box -->
                      <div class="mt-3 flex items-center gap-2">
                        <div class="flex-1 px-4 py-2 bg-dark-secondary rounded-lg font-mono text-lg text-center text-white border-2 border-dashed border-emerald-500/50">
                          ${reward.code}
                        </div>
                        <button onclick="copyCode('${reward.code}')"
                                class="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                aria-label="${t('copyCode') || 'Copy code'}">
                          <i class="fas fa-copy" aria-hidden="true"></i>
                        </button>
                      </div>

                      <!-- Use Button -->
                      <a href="${reward.url}" target="_blank" rel="noopener"
                         class="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-white/5 rounded-lg text-slate-400 hover:bg-white/10 transition-all">
                        <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                        Utiliser sur ${reward.partner}
                      </a>

                      <p class="text-xs text-slate-500 mt-2">
                        <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
                        ${reward.conditions}
                      </p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Redeem a reward (exchange thumbs for code)
 */
export function redeemReward(rewardId) {
  const state = getState();
  const reward = getRewardById(rewardId);

  if (!reward) return;

  const userThumbs = state.thumbs || state.points || 0;

  if (userThumbs < reward.cost) {
    showToast(t('notEnoughThumbs') || 'Pas assez de pouces ! 👍', 'error');
    return;
  }

  if (state.redeemedCodes?.includes(rewardId)) {
    showToast(t('codeAlreadyObtained') || 'Code déjà obtenu !', 'info');
    return;
  }

  setState({
    thumbs: userThumbs - reward.cost,
    points: userThumbs - reward.cost, // Keep both in sync
    redeemedCodes: [...(state.redeemedCodes || []), rewardId],
  });

  showToast(t('codeObtained') || `🎉 Code ${reward.partner} obtenu !`, 'success');
}

// Global handlers
window.redeemReward = redeemReward;
window.copyCode = (code) => {
  navigator.clipboard.writeText(code);
  showToast(t('codeCopied') || 'Code copié ! 📋', 'success');
};

export default {
  renderShopModal,
  renderMyRewardsModal,
  redeemReward,
};
