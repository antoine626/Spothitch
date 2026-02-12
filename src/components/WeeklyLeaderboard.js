/**
 * Weekly Leaderboard Component
 * Displays weekly ranking with countdown and rewards
 */

import { getState, setState } from '../stores/state.js';
import { t } from '../i18n/index.js';
import {
import { icon } from '../utils/icons.js'
  getWeeklyLeaderboard,
  getUserWeeklyRank,
  formatTimeRemaining,
  getTimeUntilReset,
  loadWeeklyHistory,
  getWeeklyRules,
  getWeeklyRewards,
  getWeekId,
} from '../services/weeklyLeaderboard.js';

/**
 * Render the Weekly Leaderboard Modal
 */
export function renderWeeklyLeaderboardModal() {
  const state = getState();
  const { showWeeklyLeaderboard, weeklyLeaderboardTab = 'ranking' } = state;

  if (!showWeeklyLeaderboard) return '';

  const leaderboard = getWeeklyLeaderboard();
  const userRank = getUserWeeklyRank();
  const timeRemaining = getTimeUntilReset();
  const currentUser = {
    username: state.username || (t('you') || 'You'),
    avatar: state.avatar || '🤙',
    weeklyPoints: userRank.weeklyPoints,
    level: state.level || 1,
    rank: userRank.rank,
  };

  return `
    <div class="weekly-leaderboard-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeWeeklyLeaderboard()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="weekly-leaderboard-title">
      <div class="modal-panel w-full sm:max-w-lg max-h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col animate-slide-up">
        <!-- Header with Gradient -->
        <div class="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="weekly-leaderboard-title" class="text-2xl font-bold text-white flex items-center gap-2">
                <span>${t('weeklyRanking') || 'Weekly Ranking'}</span>
                <span class="animate-bounce">🏆</span>
              </h2>
              <p class="text-white/80 text-sm">${t('weekNumber') || 'Week'} ${getWeekId().split('-W')[1]}</p>
            </div>
            <button onclick="closeWeeklyLeaderboard()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
                    type="button"
                    aria-label="${t('close') || 'Close'}">
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <!-- Countdown Timer -->
          <div class="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">⏱️</span>
                <span class="text-white/80 text-sm">${t('resetIn') || 'Reset in'}</span>
              </div>
              <div class="flex gap-2">
                ${renderCountdownUnit(timeRemaining.days, 'j')}
                ${renderCountdownUnit(timeRemaining.hours, 'h')}
                ${renderCountdownUnit(timeRemaining.minutes, 'm')}
              </div>
            </div>
          </div>

          <!-- Your Rank Card -->
          <div class="mt-4 p-4 bg-white/20 rounded-xl backdrop-blur">
            <div class="flex items-center gap-4">
              <div class="relative">
                <div class="text-4xl">${currentUser.avatar}</div>
                ${userRank.isInTop10 ? '<div class="absolute -top-1 -right-1 text-lg">⭐</div>' : ''}
              </div>
              <div class="flex-1">
                <div class="font-bold text-white">${currentUser.username}</div>
                <div class="text-white/70 text-sm">
                  ${currentUser.weeklyPoints.toLocaleString()} ${t('ptsThisWeek') || 'pts this week'}
                </div>
              </div>
              <div class="text-right">
                ${currentUser.rank ? `
                  <div class="text-3xl font-bold text-white">#${currentUser.rank}</div>
                  <div class="text-white/70 text-xs">${t('yourRank') || 'Your rank'}</div>
                ` : `
                  <div class="text-white/70 text-sm">${t('notRanked') || 'Not ranked'}</div>
                  <div class="text-white/50 text-xs">${t('earnPoints') || 'Earn points!'}</div>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-white/10 bg-white/5/50">
          <button onclick="setWeeklyLeaderboardTab('ranking')"
                  class="flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2
                         ${weeklyLeaderboardTab === 'ranking' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}">
            ${icon('trophy', 'w-5 h-5')}
            ${t('ranking') || 'Ranking'}
          </button>
          <button onclick="setWeeklyLeaderboardTab('rewards')"
                  class="flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2
                         ${weeklyLeaderboardTab === 'rewards' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}">
            ${icon('gift', 'w-5 h-5')}
            ${t('rewards') || 'Rewards'}
          </button>
          <button onclick="setWeeklyLeaderboardTab('history')"
                  class="flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2
                         ${weeklyLeaderboardTab === 'history' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}">
            ${icon('history', 'w-5 h-5')}
            ${t('history') || 'History'}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          ${weeklyLeaderboardTab === 'ranking' ? renderRankingTab(leaderboard, currentUser) : ''}
          ${weeklyLeaderboardTab === 'rewards' ? renderRewardsTab() : ''}
          ${weeklyLeaderboardTab === 'history' ? renderHistoryTab() : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render countdown unit
 */
function renderCountdownUnit(value, unit) {
  return `
    <div class="bg-white/20 rounded-lg px-3 py-1 text-center min-w-12">
      <div class="text-lg font-bold text-white">${value}</div>
      <div class="text-xs text-white/60">${unit}</div>
    </div>
  `;
}

/**
 * Render the ranking tab
 */
function renderRankingTab(leaderboard, currentUser) {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);

  return `
    <div class="p-4">
      <!-- Top 3 Podium -->
      <div class="flex justify-center items-end gap-3 mb-6 pt-4">
        ${renderPodiumPlace(top3[1], 2)}
        ${renderPodiumPlace(top3[0], 1)}
        ${renderPodiumPlace(top3[2], 3)}
      </div>

      <!-- Ranks 4-10 -->
      <div class="space-y-2">
        ${rest.map((user, index) => renderLeaderboardRow(user, index + 4, currentUser.rank)).join('')}
      </div>

      <!-- Show more indicator -->
      ${leaderboard.length > 10 ? `
        <div class="text-center mt-4 text-slate-500 text-sm">
          + ${leaderboard.length - 10} ${t('otherParticipants') || 'other participants'}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render podium place (top 3)
 */
function renderPodiumPlace(user, position) {
  if (!user) {
    return `
      <div class="flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}">
        <div class="text-3xl mb-2 opacity-30">?</div>
        <div class="text-slate-600 font-medium text-sm">${t('empty') || 'Empty'}</div>
        <div class="mt-2 w-20 ${position === 1 ? 'h-28' : position === 2 ? 'h-24' : 'h-20'} rounded-t-lg bg-white/5/50 border-2 border-white/10/50 flex items-start justify-center pt-2">
          <span class="text-2xl opacity-30">${position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}</span>
        </div>
      </div>
    `;
  }

  const podiumStyles = {
    1: { height: 'h-28', medal: '🥇', bg: 'from-amber-500/40 to-amber-600/40', border: 'border-amber-500/70', glow: 'shadow-lg shadow-amber-500/30' },
    2: { height: 'h-24', medal: '🥈', bg: 'from-slate-400/40 to-slate-500/40', border: 'border-slate-400/70', glow: 'shadow-lg shadow-slate-400/20' },
    3: { height: 'h-20', medal: '🥉', bg: 'from-orange-600/40 to-orange-700/40', border: 'border-orange-600/70', glow: 'shadow-lg shadow-orange-500/20' },
  };

  const style = podiumStyles[position];

  return `
    <div class="flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'} animate-fade-in"
         style="animation-delay: ${(position - 1) * 100}ms">
      <div class="relative">
        <div class="text-3xl mb-1 animate-bounce-slow">${user.avatar}</div>
        ${position === 1 ? '<div class="absolute -top-2 left-1/2 -translate-x-1/2 text-lg animate-pulse">👑</div>' : ''}
      </div>
      <div class="text-white font-medium text-sm truncate max-w-20">${user.username}</div>
      <div class="text-emerald-400 text-xs font-bold">${user.weeklyPoints.toLocaleString()} pts</div>
      <div class="mt-2 w-20 ${style.height} rounded-t-lg bg-gradient-to-b ${style.bg} border-2 ${style.border} ${style.glow} flex items-start justify-center pt-2 transition-all hover:scale-105">
        <span class="text-2xl">${style.medal}</span>
      </div>
    </div>
  `;
}

/**
 * Render leaderboard row (4th place and below)
 */
function renderLeaderboardRow(user, rank, currentUserRank) {
  const isCurrentUser = rank === currentUserRank;

  return `
    <div class="flex items-center gap-3 p-3 rounded-xl transition-all animate-fade-in
                ${isCurrentUser ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5 hover:bg-white/10'}"
         style="animation-delay: ${(rank - 4) * 50}ms">
      <div class="w-8 text-center font-bold ${rank <= 10 ? 'text-emerald-400' : 'text-slate-500'}">
        ${rank}
      </div>
      <div class="text-2xl">${user.avatar}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-white font-medium truncate">${user.username}</span>
          ${isCurrentUser ? `<span class="text-xs bg-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">${t('you') || 'You'}</span>` : ''}
        </div>
        <div class="text-slate-500 text-xs">${t('levelPrefix') || 'Lvl.'} ${user.level}</div>
      </div>
      <div class="text-right">
        <div class="text-emerald-400 font-bold">${user.weeklyPoints.toLocaleString()}</div>
        <div class="text-slate-500 text-xs">${t('points') || 'points'}</div>
      </div>
    </div>
  `;
}

/**
 * Render rewards tab
 */
function renderRewardsTab() {
  const rewards = getWeeklyRewards();
  const rules = getWeeklyRules();

  return `
    <div class="p-4 space-y-6">
      <!-- Rewards Section -->
      <div>
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🎁</span>
          ${t('endOfWeekRewards') || 'End of week rewards'}
        </h3>
        <div class="space-y-3">
          ${rewards.map(reward => `
            <div class="p-4 rounded-xl bg-gradient-to-r ${
  reward.rank === 1 ? 'from-amber-500/20 to-amber-600/20 border border-amber-500/30' :
    reward.rank === 3 ? 'from-slate-400/20 to-slate-500/20 border border-slate-400/30' :
      'from-orange-600/20 to-orange-700/20 border border-orange-600/30'
}">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-3xl">${reward.icon}</span>
                <span class="font-bold text-white text-lg">${reward.label}</span>
              </div>
              <div class="space-y-2 pl-2">
                ${reward.rewards.map(r => `
                  <div class="flex items-center gap-2 text-sm">
                    <span>${r.icon}</span>
                    <span class="text-slate-300">${r.text}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Rules Section -->
      <div>
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📜</span>
          ${t('howItWorks') || 'How it works?'}
        </h3>
        <div class="space-y-3">
          ${rules.map(rule => `
            <div class="flex items-start gap-3 p-3 bg-white/5/50 rounded-lg">
              <span class="text-xl">${rule.icon}</span>
              <span class="text-slate-300 text-sm">${rule.text}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- How to earn points -->
      <div>
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>⚡</span>
          ${t('howToEarnPoints') || 'How to earn points?'}
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-white/5 rounded-lg text-center">
            <div class="text-2xl mb-1">📍</div>
            <div class="text-emerald-400 font-bold">+5 pts</div>
            <div class="text-slate-500 text-xs">Check-in</div>
          </div>
          <div class="p-3 bg-white/5 rounded-lg text-center">
            <div class="text-2xl mb-1">➕</div>
            <div class="text-emerald-400 font-bold">+20 pts</div>
            <div class="text-slate-500 text-xs">${t('addSpot') || 'New spot'}</div>
          </div>
          <div class="p-3 bg-white/5 rounded-lg text-center">
            <div class="text-2xl mb-1">⭐</div>
            <div class="text-emerald-400 font-bold">+10 pts</div>
            <div class="text-slate-500 text-xs">${t('reviewLabel') || 'Review'}</div>
          </div>
          <div class="p-3 bg-white/5 rounded-lg text-center">
            <div class="text-2xl mb-1">🧠</div>
            <div class="text-emerald-400 font-bold">+50 pts</div>
            <div class="text-slate-500 text-xs">${t('perfectQuiz') || 'Perfect quiz'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render history tab
 */
function renderHistoryTab() {
  const history = loadWeeklyHistory();

  if (history.length === 0) {
    return `
      <div class="p-8 text-center">
        <div class="text-5xl mb-4 opacity-50">📅</div>
        <div class="text-slate-400 text-lg mb-2">${t('noHistoryYet') || 'No history yet'}</div>
        <div class="text-slate-500 text-sm">${t('historyAfterFirstWeek') || 'History will appear after the first complete week'}</div>
      </div>
    `;
  }

  return `
    <div class="p-4 space-y-4">
      ${history.reverse().map(week => `
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="font-bold text-white">${t('weekNumber') || 'Week'} ${week.weekId.split('-W')[1]}</div>
            <div class="text-slate-500 text-sm">${formatWeekDate(week.weekStart)}</div>
          </div>
          <div class="space-y-2">
            ${week.topPlayers.slice(0, 3).map((player, index) => `
              <div class="flex items-center gap-3 p-2 ${index === 0 ? 'bg-amber-500/10' : 'bg-white/5/50'} rounded-lg">
                <span class="text-lg">${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                <span class="text-xl">${player.avatar}</span>
                <span class="text-white flex-1">${player.username}</span>
                <span class="text-emerald-400 font-bold">${player.weeklyPoints.toLocaleString()} pts</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Format week date for display
 */
function formatWeekDate(isoDate) {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

/**
 * Render compact weekly leaderboard widget (for ChallengesHub)
 */
export function renderWeeklyLeaderboardWidget(state) {
  const leaderboard = getWeeklyLeaderboard().slice(0, 3);
  const userRank = getUserWeeklyRank();
  const timeRemaining = formatTimeRemaining();

  return `
    <button
      onclick="openWeeklyLeaderboard()"
      class="card p-4 w-full text-left hover:border-emerald-500/50 transition-all"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
            <span class="text-2xl">🏆</span>
          </div>
          <div>
            <div class="font-bold text-white">${t('weeklyRanking') || 'Weekly Ranking'}</div>
            <div class="text-sm text-emerald-400">${t('resetIn') || 'Reset in'} ${timeRemaining}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${userRank.rank ? `
            <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
              #${userRank.rank}
            </span>
          ` : ''}
          ${icon('chevron-right', 'w-5 h-5 text-slate-500')}
        </div>
      </div>

      <!-- Mini Top 3 -->
      <div class="flex items-center justify-around">
        ${leaderboard.map((player, index) => `
          <div class="flex items-center gap-2">
            <span class="text-lg">${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
            <span class="text-xl">${player.avatar}</span>
            <div class="hidden sm:block">
              <div class="text-white text-sm truncate max-w-16">${player.username}</div>
              <div class="text-emerald-400 text-xs">${player.weeklyPoints} pts</div>
            </div>
          </div>
        `).join('')}
      </div>
    </button>
  `;
}

// Global handlers
window.openWeeklyLeaderboard = () => setState({ showWeeklyLeaderboard: true });
window.closeWeeklyLeaderboard = () => setState({ showWeeklyLeaderboard: false });
window.setWeeklyLeaderboardTab = (tab) => setState({ weeklyLeaderboardTab: tab });

export default {
  renderWeeklyLeaderboardModal,
  renderWeeklyLeaderboardWidget,
};
