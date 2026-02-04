/**
 * Challenges Hub View Component
 * Gamification center: Badges, Challenges, Quiz, Shop, Leagues
 */

import { t } from '../../i18n/index.js';
import { allBadges } from '../../data/badges.js';
import { allChallenges } from '../../data/challenges.js';
import { shopRewards } from '../../data/rewards.js';
import { vipLevels } from '../../data/vip-levels.js';

export function renderChallengesHub(state) {
  const userBadges = state.badges || [];
  const earnedBadgesCount = userBadges.length;
  const totalBadges = allBadges.length;

  // Get active challenges (combine daily and weekly)
  const activeChallenges = [
    ...(allChallenges.daily || []).slice(0, 2).map(c => ({ ...c, challengeType: 'daily' })),
    ...(allChallenges.weekly || []).slice(0, 1).map(c => ({ ...c, challengeType: 'weekly' })),
  ];

  // Get current league info
  const leagues = ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant'];
  const currentLeagueIndex = Math.min(Math.floor((state.seasonPoints || 0) / 500), leagues.length - 1);
  const currentLeague = leagues[currentLeagueIndex];

  // Get VIP level
  const currentVipLevel = vipLevels.find(v => (state.totalPoints || 0) >= v.minPoints) || vipLevels[0];

  return `
    <div class="p-4 space-y-4">
      <!-- Header Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-3 text-center">
          <div class="text-2xl font-bold text-amber-400">${state.thumbs || state.points || 0}</div>
          <div class="text-xs text-slate-400">👍 Pouces</div>
        </div>
        <div class="card p-3 text-center">
          <div class="text-2xl font-bold text-purple-400">${currentLeague}</div>
          <div class="text-xs text-slate-400">Ligue</div>
        </div>
        <div class="card p-3 text-center">
          ${currentVipLevel.image
    ? `<img src="${currentVipLevel.image}" alt="${currentVipLevel.name}" class="w-8 h-8 mx-auto" loading="lazy" />`
    : `<div class="text-2xl">${currentVipLevel.icon}</div>`
}
          <div class="text-xs text-slate-400">${currentVipLevel.name}</div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Badges -->
        <button
          onclick="openBadges()"
          class="card p-4 text-left hover:border-amber-500/50 transition-all group"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🏅
            </div>
            <div>
              <div class="font-bold text-white">Badges</div>
              <div class="text-sm text-slate-400">${earnedBadgesCount}/${totalBadges}</div>
            </div>
          </div>
          <div class="h-2 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-amber-500 rounded-full transition-all" style="width: ${(earnedBadgesCount/totalBadges)*100}%"></div>
          </div>
        </button>

        <!-- Challenges -->
        <button
          onclick="openChallenges()"
          class="card p-4 text-left hover:border-purple-500/50 transition-all group"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🎯
            </div>
            <div>
              <div class="font-bold text-white">Défis</div>
              <div class="text-sm text-slate-400">${activeChallenges.length} actifs</div>
            </div>
          </div>
          <div class="flex gap-1">
            ${activeChallenges.map(c => `
              <span class="w-2 h-2 rounded-full ${c.challengeType === 'daily' ? 'bg-emerald-400' : 'bg-purple-400'}"></span>
            `).join('')}
          </div>
        </button>

        <!-- Quiz -->
        <button
          onclick="openQuiz()"
          class="card p-4 text-left hover:border-sky-500/50 transition-all group"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🧠
            </div>
            <div>
              <div class="font-bold text-white">Quiz</div>
              <div class="text-sm text-slate-400">+50 pts/jour</div>
            </div>
          </div>
        </button>

        <!-- Shop -->
        <button
          onclick="openShop()"
          class="card p-4 text-left hover:border-emerald-500/50 transition-all group"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🛒
            </div>
            <div>
              <div class="font-bold text-white">Boutique</div>
              <div class="text-sm text-slate-400">${shopRewards.length} items</div>
            </div>
          </div>
        </button>
      </div>

      <!-- Team Challenges Section -->
      <button
        onclick="openTeamChallenges()"
        class="card p-4 w-full text-left hover:border-orange-500/50 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center">
              <span class="text-3xl">⚔️</span>
            </div>
            <div>
              <div class="font-bold text-lg">Défis d'équipe</div>
              <div class="text-sm text-slate-400">Relevez des défis collectifs avec vos amis</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium">
              Nouveau
            </span>
            <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
          </div>
        </div>
      </button>

      <!-- Active Challenges Preview -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold flex items-center gap-2">
            <i class="fas fa-fire text-orange-400" aria-hidden="true"></i>
            Défis en cours
          </h3>
          <button onclick="openChallenges()" class="text-sm text-primary-400">
            Voir tout →
          </button>
        </div>

        <div class="space-y-3">
          ${activeChallenges.map(challenge => {
    const progress = Math.min((state[challenge.type] || 0) / challenge.target * 100, 100);
    return `
              <div class="p-3 rounded-lg bg-white/5">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">${challenge.icon}</span>
                    <span class="font-medium">${challenge.name}</span>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full ${
  challenge.challengeType === 'daily' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
}">${challenge.challengeType === 'daily' ? 'Quotidien' : 'Hebdo'}</span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all" style="width: ${progress}%"></div>
                  </div>
                  <span class="text-xs text-slate-400">${Math.round(progress)}%</span>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      </div>

      <!-- League Progress -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold flex items-center gap-2">
            <i class="fas fa-trophy text-amber-400" aria-hidden="true"></i>
            Classement
          </h3>
          <button onclick="openLeaderboard()" class="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            <i class="fas fa-crown mr-1" aria-hidden="true"></i>
            Voir le classement →
          </button>
        </div>

        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 flex items-center justify-center">
            <img src="/images/leagues/${['bronze', 'silver', 'gold', 'platinum', 'diamond'][currentLeagueIndex]}.webp"
                 alt="${currentLeague}"
                 class="w-12 h-12 object-contain"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='block';"
                 loading="lazy" />
            <span class="text-3xl hidden">${currentLeagueIndex === 0 ? '🥉' : currentLeagueIndex === 1 ? '🥈' : currentLeagueIndex === 2 ? '🥇' : currentLeagueIndex === 3 ? '💎' : '👑'}</span>
          </div>
          <div class="flex-1">
            <div class="font-bold text-lg">Ligue ${currentLeague}</div>
            <div class="text-sm text-slate-400">${state.seasonPoints || 0} points saisonniers</div>
            <div class="text-xs text-primary-400 mt-1">
              ${currentLeagueIndex < leagues.length - 1 ? `${500 - ((state.seasonPoints || 0) % 500)} pts pour ${leagues[currentLeagueIndex + 1]}` : 'Niveau maximum !'}
            </div>
          </div>
        </div>

        <!-- Leagues bar -->
        <div class="flex gap-1">
          ${leagues.map((league, i) => `
            <div class="flex-1 h-2 rounded-full ${
  i <= currentLeagueIndex ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-white/10'
}"></div>
          `).join('')}
        </div>
        <div class="flex justify-between mt-1 text-xs text-slate-500">
          ${leagues.map(l => `<span>${l[0]}</span>`).join('')}
        </div>
      </div>

      <!-- VIP Level -->
      <div class="card p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
            ${currentVipLevel.image
    ? `<img src="${currentVipLevel.image}" alt="${currentVipLevel.name}" class="w-12 h-12 object-contain" loading="lazy" />`
    : `<span class="text-3xl">${currentVipLevel.icon}</span>`
}
          </div>
          <div class="flex-1">
            <div class="text-xs text-purple-400 mb-1">Statut VIP</div>
            <div class="font-bold text-lg">${currentVipLevel.name}</div>
            <div class="text-sm text-slate-400">${currentVipLevel.benefits?.[0] || ''}</div>
          </div>
          <button
            onclick="openMyRewards()"
            class="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-all"
          >
            Avantages
          </button>
        </div>
      </div>

      <!-- Daily Streak -->
      ${state.streak > 0 ? `
        <div class="card p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
          <div class="flex items-center gap-4">
            <div class="text-4xl">🔥</div>
            <div class="flex-1">
              <div class="font-bold text-lg">${state.streak} jours consécutifs !</div>
              <div class="text-sm text-slate-400">Continue pour débloquer des badges</div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-orange-400">+${state.streak * 5}</div>
              <div class="text-xs text-slate-400">bonus pts</div>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export default { renderChallengesHub };
