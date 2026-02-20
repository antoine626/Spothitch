/**
 * Leaderboard Modal Component
 * Weekly and monthly rankings with country filter and monthly rewards
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

const countryNames = {
  FR: 'France', DE: 'Deutschland', NL: 'Nederland', ES: 'España', IT: 'Italia',
  BE: 'Belgique', PT: 'Portugal', AT: 'Österreich', CH: 'Schweiz', PL: 'Polska',
};

/**
 * Get unique countries from leaderboard data
 */
function getAvailableCountries(data) {
  const countries = new Set();
  for (const tab of Object.values(data)) {
    for (const user of tab) {
      if (user.country) countries.add(user.country);
    }
  }
  return [...countries].sort();
}

/**
 * Render leaderboard modal
 */
export function renderLeaderboardModal() {
  const state = getState();
  const { showLeaderboard, leaderboardTab = 'weekly', leaderboardCountry = 'all' } = state;

  if (!showLeaderboard) return '';

  const rawData = mockLeaderboardData[leaderboardTab] || [];
  const leaderboardData = leaderboardCountry === 'all'
    ? rawData
    : rawData.filter(u => u.country === leaderboardCountry);

  const availableCountries = getAvailableCountries(mockLeaderboardData);

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
              <h2 id="leaderboard-title" class="text-2xl font-bold text-white">${t('leaderboardTitle') || 'Leaderboard'}</h2>
              <p class="text-white/80">${t('leaderboardSubtitle') || 'Top hitchhikers'}</p>
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
                <div class="text-white/70 text-sm">${t('levelN') || 'Level'} ${currentUser.level} • ${currentUser.points.toLocaleString()} 👍</div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-white">#${currentUser.rank}</div>
                <div class="text-white/70 text-xs">${t('yourRank') || 'Your rank'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-white/10">
          <button onclick="setLeaderboardTab('weekly')"
                  class="flex-1 py-3 text-sm font-medium transition-colors
                         ${leaderboardTab === 'weekly' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}">
            ${t('thisWeek') || 'This week'}
          </button>
          <button onclick="setLeaderboardTab('monthly')"
                  class="flex-1 py-3 text-sm font-medium transition-colors
                         ${leaderboardTab === 'monthly' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}">
            ${t('thisMonth') || 'This month'}
          </button>
          <button onclick="setLeaderboardTab('allTime')"
                  class="flex-1 py-3 text-sm font-medium transition-colors
                         ${leaderboardTab === 'allTime' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}">
            ${t('allTimeTab') || 'All-time'}
          </button>
        </div>

        <!-- Country Filter -->
        <div class="px-5 pt-3 pb-1">
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button onclick="setLeaderboardCountry('all')"
                    type="button"
                    class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer
                           ${leaderboardCountry === 'all' ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}">
              🌍 ${t('allCountries') || 'All'}
            </button>
            ${availableCountries.map(code => `
              <button onclick="setLeaderboardCountry('${code}')"
                      type="button"
                      class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer
                             ${leaderboardCountry === code ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}">
                ${countryFlags[code] || '🌍'} ${countryNames[code] || code}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Monthly Rewards Banner -->
        ${leaderboardTab === 'monthly' ? `
        <div class="mx-5 mt-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div class="text-xs font-bold text-amber-400 mb-2">${t('monthlyRewards') || 'Monthly rewards'}</div>
          <div class="flex justify-between text-[10px]">
            <span class="text-amber-300">🥇 ${t('monthlyRewardGold') || '1st: Gold + 500 👍'}</span>
          </div>
          <div class="flex justify-between text-[10px] mt-0.5">
            <span class="text-slate-300">🥈 ${t('monthlyRewardSilver') || '2nd: Silver + 300 👍'}</span>
          </div>
          <div class="flex justify-between text-[10px] mt-0.5">
            <span class="text-orange-300">🥉 ${t('monthlyRewardBronze') || '3rd: Bronze + 100 👍'}</span>
          </div>
        </div>
        ` : ''}

        <!-- Leaderboard List -->
        <div class="flex-1 overflow-y-auto">
          ${leaderboardData.length > 0 ? `
          <!-- Top 3 Podium -->
          <div class="flex justify-center items-end gap-4 p-8 bg-gradient-to-b from-dark-secondary/50 to-transparent">
            ${renderPodiumPlace(leaderboardData[1], 2, leaderboardTab === 'monthly')}
            ${renderPodiumPlace(leaderboardData[0], 1, leaderboardTab === 'monthly')}
            ${renderPodiumPlace(leaderboardData[2], 3, leaderboardTab === 'monthly')}
          </div>

          <!-- Rest of Leaderboard -->
          <div class="px-5 pb-5 space-y-3">
            ${leaderboardData.slice(3).map((user, index) => renderLeaderboardRow(user, index + 4)).join('')}
          </div>
          ` : `
          <div class="text-center text-slate-400 py-12">
            ${t('noResults') || 'No results'}
          </div>
          `}
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
              <div class="text-xs text-slate-400">${t('participants') || 'Participants'}</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-400">${leaderboardData.length > 0 ? Math.max(...leaderboardData.map(u => u.level)) : 0}</div>
              <div class="text-xs text-slate-400">${t('bestLevel') || 'Best level'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render podium place (top 3) with optional monthly reward indicator
 */
function renderPodiumPlace(user, position, showReward = false) {
  if (!user) return '';

  const podiumStyles = {
    1: { height: 'h-28', medal: '🥇', bg: 'from-amber-500/30 to-amber-600/30', border: 'border-amber-500/50' },
    2: { height: 'h-24', medal: '🥈', bg: 'from-slate-400/30 to-slate-500/30', border: 'border-slate-400/50' },
    3: { height: 'h-20', medal: '🥉', bg: 'from-orange-700/30 to-orange-800/30', border: 'border-orange-700/50' },
  };

  const rewardThumbs = { 1: 500, 2: 300, 3: 100 };

  const style = podiumStyles[position];

  return `
    <div class="flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}">
      <div class="text-3xl mb-2">${user.avatar}</div>
      <div class="text-white font-medium text-sm truncate max-w-20">${user.username}</div>
      <div class="text-slate-400 text-xs">${user.points.toLocaleString()} 👍</div>
      ${showReward ? `<div class="text-amber-400 text-[10px] font-bold mt-0.5">+${rewardThumbs[position]} 👍</div>` : ''}
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
        <div class="text-slate-400 text-xs">${t('levelShort') || 'Lv.'} ${user.level}</div>
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
window.setLeaderboardCountry = (country) => setState({ leaderboardCountry: country });

export default {
  renderLeaderboardModal,
};
