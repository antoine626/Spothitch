/**
 * Daily Reward Modal Component
 * Shows daily login reward calendar and claim button
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import {
  getDailyRewardInfo,
  canClaimReward,
  claimReward,
  getRewardsCalendar,
  DAILY_REWARDS,
} from '../../services/dailyReward.js';
import { launchConfettiBurst } from '../../utils/confetti.js';
import { showToast } from '../../services/notifications.js';

/**
 * Render daily reward modal
 */
export function renderDailyRewardModal() {
  const state = getState();
  const { showDailyReward, lastDailyRewardResult } = state;

  if (!showDailyReward) return '';

  const info = getDailyRewardInfo();
  const calendar = getRewardsCalendar();
  const canClaim = canClaimReward();

  // Check if showing result after claiming
  if (lastDailyRewardResult) {
    return renderRewardResult(lastDailyRewardResult);
  }

  return `
    <div class="daily-reward-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="if(event.target===this)closeDailyReward()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="daily-reward-title">
      <div class="bg-dark-primary w-full max-w-md rounded-2xl overflow-hidden animate-bounce-in">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-center relative overflow-hidden">
          <!-- Decorative elements -->
          <div class="absolute inset-0 opacity-20">
            <div class="absolute top-2 left-4 text-3xl animate-bounce-slow">🎁</div>
            <div class="absolute top-4 right-6 text-2xl animate-bounce-slow" style="animation-delay: 0.2s">✨</div>
            <div class="absolute bottom-2 left-8 text-2xl animate-bounce-slow" style="animation-delay: 0.4s">🌟</div>
            <div class="absolute bottom-4 right-4 text-3xl animate-bounce-slow" style="animation-delay: 0.3s">🎁</div>
          </div>

          <div class="relative z-10">
            <div class="text-5xl mb-3 animate-bounce-slow">🎁</div>
            <h2 id="daily-reward-title" class="text-2xl font-bold text-white">
              Recompense Quotidienne
            </h2>
            <p class="text-white/80 mt-1">
              ${canClaim ? 'Ta recompense t\'attend !' : 'Reviens demain pour continuer !'}
            </p>
          </div>

          <!-- Close button -->
          <button onclick="closeDailyReward()"
                  class="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 z-20"
                  type="button"
                  aria-label="${t('close') || 'Close'}">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Reward Info -->
        <div class="bg-dark-secondary/50 p-4 border-b border-white/10">
          <div class="flex items-center justify-center gap-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-amber-400">${t('day') || 'Jour'} ${info.currentDay}</div>
              <div class="text-xs text-slate-400">${t('dailyRewardCycle') || 'Cycle de recompenses'}</div>
            </div>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="p-4">
          <div class="grid grid-cols-7 gap-2">
            ${calendar.map(day => renderDayCard(day, info)).join('')}
          </div>
        </div>

        <!-- Claim Button -->
        <div class="p-4 pt-0">
          ${canClaim ? `
            <button onclick="handleClaimDailyReward()"
                    class="w-full py-4 rounded-xl font-bold text-lg text-white
                           bg-gradient-to-r from-amber-500 to-orange-500
                           hover:from-amber-600 hover:to-orange-600
                           shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50
                           transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    id="claim-reward-btn">
              <i class="fas fa-gift mr-2" aria-hidden="true"></i>
              Recuperer ma recompense !
            </button>
          ` : `
            <div class="text-center">
              <div class="py-4 px-6 rounded-xl bg-white/5 text-slate-400">
                <i class="fas fa-check-circle text-emerald-400 mr-2" aria-hidden="true"></i>
                Recompense recuperee aujourd'hui !
              </div>
              <p class="text-xs text-slate-500 mt-2">
                Reviens demain pour le jour ${(info.currentDay % 7) + 1}
              </p>
            </div>
          `}
        </div>

        <!-- Info Footer -->
        <div class="px-4 pb-4 text-center text-xs text-slate-500">
          <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
          Connecte-toi chaque jour pour maximiser tes recompenses !
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single day card in the calendar
 */
function renderDayCard(day, info) {
  const isClaimed = day.claimed;
  const isCurrent = day.current;
  const isLocked = day.locked && !isCurrent;
  const isMystery = day.isMystery;

  let statusClass = '';
  let bgClass = 'bg-white/5';
  let borderClass = '';

  if (isClaimed) {
    bgClass = 'bg-emerald-500/20';
    borderClass = 'border-2 border-emerald-500';
  } else if (isCurrent) {
    bgClass = 'bg-gradient-to-br from-amber-500/30 to-orange-500/30';
    borderClass = 'border-2 border-amber-500 animate-pulse';
  } else if (isLocked) {
    bgClass = 'bg-white/5';
    statusClass = 'opacity-40';
  }

  return `
    <div class="day-card ${bgClass} ${borderClass} ${statusClass} rounded-xl p-2 text-center transition-all">
      <div class="text-[10px] text-slate-400 mb-1">Jour ${day.day}</div>
      <div class="text-2xl mb-1">
        ${isClaimed ? '✅' : isMystery ? '🎁' : day.icon}
      </div>
      <div class="text-xs font-bold ${isClaimed ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-slate-300'}">
        ${isMystery ? '?' : `+${day.points}`}
      </div>
      ${isMystery && !isClaimed ? `
        <div class="text-[8px] text-amber-400 mt-0.5">Mystere</div>
      ` : ''}
    </div>
  `;
}

/**
 * Render reward result after claiming
 */
function renderRewardResult(result) {
  return `
    <div class="daily-reward-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="if(event.target===this)closeDailyRewardResult()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="reward-result-title">
      <div class="bg-dark-primary w-full max-w-md rounded-2xl overflow-hidden animate-bounce-in text-center">
        <!-- Celebration Header -->
        <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 relative overflow-hidden">
          <!-- Sparkles -->
          <div class="absolute inset-0">
            ${Array(6).fill(0).map((_, i) => `
              <div class="absolute animate-bounce-slow"
                   style="top: ${10 + Math.random() * 80}%; left: ${5 + Math.random() * 90}%; animation-delay: ${i * 0.15}s">
                ✨
              </div>
            `).join('')}
          </div>

          <div class="relative z-10">
            <div class="text-6xl mb-4 animate-bounce-slow">
              ${result.isMystery ? '🎁' : '🎉'}
            </div>
            <h2 id="reward-result-title" class="text-2xl font-bold text-white">
              ${result.isMystery ? 'Coffre Mystere Ouvert !' : 'Felicitations !'}
            </h2>
          </div>
        </div>

        <!-- Reward Display -->
        <div class="p-6 space-y-4">
          <!-- Points -->
          <div class="bg-amber-500/20 rounded-xl p-4">
            <div class="text-amber-400 text-sm mb-1">Points gagnes</div>
            <div class="text-4xl font-bold text-white flex items-center justify-center gap-2">
              <span>+${result.points}</span>
              <span class="text-amber-400">pts</span>
            </div>
          </div>

          ${result.badge ? `
            <!-- Badge Earned -->
            <div class="bg-purple-500/20 rounded-xl p-4">
              <div class="text-purple-400 text-sm mb-2">Badge debloque !</div>
              <div class="flex items-center justify-center gap-3">
                <span class="text-4xl">${result.badge.icon}</span>
                <div class="text-left">
                  <div class="font-bold text-white">${result.badge.name}</div>
                  <div class="text-xs text-purple-300 capitalize">${result.badge.rarity}</div>
                </div>
              </div>
            </div>
          ` : ''}

        </div>

        <!-- Continue Button -->
        <div class="p-4 pt-0">
          <button onclick="closeDailyRewardResult()"
                  class="w-full py-4 rounded-xl font-bold text-lg text-white
                         bg-gradient-to-r from-primary-500 to-cyan-500
                         hover:from-primary-600 hover:to-cyan-600
                         shadow-lg transition-all">
            <i class="fas fa-thumbs-up mr-2" aria-hidden="true"></i>
            Super !
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle claim button click
 */
export function handleClaimDailyReward() {
  const result = claimReward();

  if (result.success) {
    // Launch confetti celebration
    setTimeout(() => {
      launchConfettiBurst();
    }, 100);

    // Show result modal
    setState({
      showDailyReward: true,
      lastDailyRewardResult: result,
    });
  } else {
    showToast(result.message, 'info');
  }
}

/**
 * Close daily reward popup
 */
export function closeDailyReward() {
  setState({ showDailyReward: false, lastDailyRewardResult: null });
}

/**
 * Close result and finish
 */
export function closeDailyRewardResult() {
  setState({ showDailyReward: false, lastDailyRewardResult: null });
}

// Register global handlers
window.handleClaimDailyReward = handleClaimDailyReward;
window.closeDailyReward = closeDailyReward;
window.closeDailyRewardResult = closeDailyRewardResult;

export default {
  renderDailyRewardModal,
  handleClaimDailyReward,
  closeDailyReward,
  closeDailyRewardResult,
};
