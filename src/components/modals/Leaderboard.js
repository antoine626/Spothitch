/**
 * Leaderboard Modal Component
 * Weekly and monthly rankings
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';

// Mock leaderboard data (in real app, this would come from Firebase)
const mockLeaderboardData = {
  weekly: [
    { id: 1, username: 'RoadRunner', avatar: '🏃', points: 1250, level: 15, country: 'FR' },
    { id: 2, username: 'ThumbsUp', avatar: '👍', points: 1180, level: 14, country: 'DE' },
    { id: 3, username: 'WanderlustPro', avatar: '🌍', points: 1050, level: 13, country: 'NL' },
    { id: 4, username: 'FreeSoul', avatar: '✌️', points: 920, level: 12, country: 'ES' },
    { id: 5, username: 'HitchKing', avatar: '👑', points: 850, level: 11, country: 'IT' },
    { id: 6, username: 'Nomad42', avatar: '🎒', points: 780, level: 10, country: 'BE' },
    { id: 7, username: 'RoadTripper', avatar: '🚗', points: 720, level: 9, country: 'PT' },
    { id: 8, username: 'Backpacker', avatar: '🧳', points: 650, level: 8, country: 'AT' },
    { id: 9, username: 'Explorer99', avatar: '🧭', points: 580, level: 7, country: 'CH' },
    { id: 10, username: 'Adventurer', avatar: '⛺', points: 520, level: 6, country: 'PL' },
  ],
  monthly: [
    { id: 1, username: 'LegendHitcher', avatar: '🏆', points: 5200, level: 25, country: 'FR' },
    { id: 2, username: 'RoadRunner', avatar: '🏃', points: 4800, level: 24, country: 'FR' },
    { id: 3, username: 'ThumbsUp', avatar: '👍', points: 4500, level: 22, country: 'DE' },
    { id: 4, username: 'WanderlustPro', avatar: '🌍', points: 4200, level: 21, country: 'NL' },
    { id: 5, username: 'MasterNomad', avatar: '🎯', points: 3900, level: 20, country: 'ES' },
    { id: 6, username: 'FreeSoul', avatar: '✌️', points: 3600, level: 19, country: 'ES' },
    { id: 7, username: 'HitchKing', avatar: '👑', points: 3300, level: 18, country: 'IT' },
    { id: 8, username: 'Nomad42', avatar: '🎒', points: 3000, level: 17, country: 'BE' },
    { id: 9, username: 'RoadTripper', avatar: '🚗', points: 2700, level: 16, country: 'PT' },
    { id: 10, username: 'Backpacker', avatar: '🧳', points: 2400, level: 15, country: 'AT' },
  ],
  allTime: [
    { id: 1, username: 'LegendHitcher', avatar: '🏆', points: 52000, level: 50, country: 'FR' },
    { id: 2, username: 'MasterNomad', avatar: '🎯', points: 48000, level: 48, country: 'ES' },
    { id: 3, username: 'RoadRunner', avatar: '🏃', points: 45000, level: 45, country: 'FR' },
    { id: 4, username: 'ThumbsUp', avatar: '👍', points: 42000, level: 42, country: 'DE' },
    { id: 5, username: 'WanderlustPro', avatar: '🌍', points: 38000, level: 38, country: 'NL' },
    { id: 6, username: 'FreeSoul', avatar: '✌️', points: 35000, level: 35, country: 'ES' },
    { id: 7, username: 'HitchKing', avatar: '👑', points: 32000, level: 32, country: 'IT' },
    { id: 8, username: 'Nomad42', avatar: '🎒', points: 28000, level: 28, country: 'BE' },
    { id: 9, username: 'RoadTripper', avatar: '🚗', points: 25000, level: 25, country: 'PT' },
    { id: 10, username: 'Backpacker', avatar: '🧳', points: 22000, level: 22, country: 'AT' },
  ],
};

const countryFlags = {
  FR: '🇫🇷', DE: '🇩🇪', NL: '🇳🇱', ES: '🇪🇸', IT: '🇮🇹',
  BE: '🇧🇪', PT: '🇵🇹', AT: '🇦🇹', CH: '🇨🇭', PL: '🇵🇱',
};

/**
 * Render leaderboard modal
 */
export function renderLeaderboardModal() {
  const state = getState();
  const { showLeaderboard, leaderboardTab = 'weekly' } = state;

  if (!showLeaderboard) return '';

  const leaderboardData = mockLeaderboardData[leaderboardTab] || [];
  const currentUser = {
    username: state.username || 'Vous',
    avatar: state.avatar || '🤙',
    points: state.points || 0,
    level: state.level || 1,
    rank: 42, // Mock rank
  };

  return `
    <div class="leaderboard-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeLeaderboard()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="leaderboard-title">
      <div class="modal-panel w-full sm:max-w-lg max-h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-8">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="leaderboard-title" class="text-2xl font-bold text-white">Classement</h2>
              <p class="text-white/80">Les meilleurs autostoppeurs</p>
            </div>
            <button onclick="closeLeaderboard()"
                    class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                    type="button"
                    aria-label="${t('close') || 'Close'}">
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <!-- Your Rank Card -->
          <div class="mt-4 p-4 bg-white/20 rounded-xl backdrop-blur">
            <div class="flex items-center gap-4">
              <div class="text-4xl">${currentUser.avatar}</div>
              <div class="flex-1">
                <div class="font-bold text-white">${currentUser.username}</div>
                <div class="text-white/70 text-sm">Niveau ${currentUser.level} • ${currentUser.points.toLocaleString()} 👍</div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-white">#${currentUser.rank}</div>
                <div class="text-white/70 text-xs">Votre rang</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-white/10">
          <button onclick="setLeaderboardTab('weekly')"
                  class="flex-1 py-3 text-sm font-medium transition-colors
                         ${leaderboardTab === 'weekly' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}">
            Cette semaine
          </button>
          <button onclick="setLeaderboardTab('monthly')"
                  class="flex-1 py-3 text-sm font-medium transition-colors
                         ${leaderboardTab === 'monthly' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}">
            Ce mois
          </button>
          <button onclick="setLeaderboardTab('allTime')"
                  class="flex-1 py-3 text-sm font-medium transition-colors
                         ${leaderboardTab === 'allTime' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}">
            All-time
          </button>
        </div>

        <!-- Leaderboard List -->
        <div class="flex-1 overflow-y-auto">
          <!-- Top 3 Podium -->
          <div class="flex justify-center items-end gap-4 p-8 bg-gradient-to-b from-dark-secondary/50 to-transparent">
            ${renderPodiumPlace(leaderboardData[1], 2)}
            ${renderPodiumPlace(leaderboardData[0], 1)}
            ${renderPodiumPlace(leaderboardData[2], 3)}
          </div>

          <!-- Rest of Leaderboard -->
          <div class="px-5 pb-5 space-y-3">
            ${leaderboardData.slice(3).map((user, index) => renderLeaderboardRow(user, index + 4)).join('')}
          </div>
        </div>

        <!-- Footer Stats -->
        <div class="p-5 border-t border-white/10 bg-dark-secondary/50">
          <div class="flex justify-around text-center">
            <div>
              <div class="text-2xl font-bold text-amber-400">${leaderboardData.reduce((sum, u) => sum + u.points, 0).toLocaleString()}</div>
              <div class="text-xs text-slate-400">${t('totalPoints') || 'Pouces totaux'}</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-emerald-400">${leaderboardData.length * 10}+</div>
              <div class="text-xs text-slate-400">Participants</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-400">${Math.max(...leaderboardData.map(u => u.level))}</div>
              <div class="text-xs text-slate-400">Meilleur niveau</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render podium place (top 3)
 */
function renderPodiumPlace(user, position) {
  if (!user) return '';

  const podiumStyles = {
    1: { height: 'h-28', medal: '🥇', bg: 'from-amber-500/30 to-amber-600/30', border: 'border-amber-500/50' },
    2: { height: 'h-24', medal: '🥈', bg: 'from-slate-400/30 to-slate-500/30', border: 'border-slate-400/50' },
    3: { height: 'h-20', medal: '🥉', bg: 'from-orange-700/30 to-orange-800/30', border: 'border-orange-700/50' },
  };

  const style = podiumStyles[position];

  return `
    <div class="flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}">
      <div class="text-3xl mb-2">${user.avatar}</div>
      <div class="text-white font-medium text-sm truncate max-w-20">${user.username}</div>
      <div class="text-slate-400 text-xs">${user.points.toLocaleString()} 👍</div>
      <div class="mt-2 w-20 ${style.height} rounded-t-lg bg-gradient-to-b ${style.bg} border-2 ${style.border} flex items-start justify-center pt-2">
        <span class="text-2xl">${style.medal}</span>
      </div>
    </div>
  `;
}

/**
 * Render leaderboard row (4th place and below)
 */
function renderLeaderboardRow(user, rank) {
  return `
    <div class="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
      <div class="w-8 text-center font-bold ${rank <= 10 ? 'text-amber-400' : 'text-slate-400'}">
        ${rank}
      </div>
      <div class="text-2xl">${user.avatar}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-white font-medium truncate">${user.username}</span>
          <span class="text-sm">${countryFlags[user.country] || '🌍'}</span>
        </div>
        <div class="text-slate-400 text-xs">Niv. ${user.level}</div>
      </div>
      <div class="text-right">
        <div class="text-amber-400 font-bold">${user.points.toLocaleString()}</div>
        <div class="text-slate-400 text-xs">👍</div>
      </div>
    </div>
  `;
}

// Global handlers
window.openLeaderboard = () => setState({ showLeaderboard: true });
window.closeLeaderboard = () => setState({ showLeaderboard: false });
window.setLeaderboardTab = (tab) => setState({ leaderboardTab: tab });

export default {
  renderLeaderboardModal,
};
