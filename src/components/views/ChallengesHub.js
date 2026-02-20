/**
 * Progression View Component
 * Gamification center: Badges, Weekly Challenge, Quiz, Rewards Shop
 * Rewards earned by: validating spots, comments, photos
 */

import { t } from '../../i18n/index.js'
import { allBadges } from '../../data/badges.js'
import { allChallenges } from '../../data/challenges.js'
import { shopRewards } from '../../data/rewards.js'
import { icon } from '../../utils/icons.js'

export function renderChallengesHub(state) {
  const userBadges = state.badges || []
  const earnedBadgesCount = userBadges.length
  const totalBadges = allBadges.length
  const showThumbHistory = state.showThumbHistory || false

  // Get active challenges (combine weekly and monthly)
  const activeChallenges = [
    ...(allChallenges.weekly || []).slice(0, 2).map(c => ({ ...c, challengeType: 'weekly' })),
    ...(allChallenges.monthly || []).slice(0, 1).map(c => ({ ...c, challengeType: 'monthly' })),
  ]

  return `
    <div class="p-5 space-y-5 pb-28 overflow-x-hidden">
      <!-- Header Stats -->
      <div class="grid grid-cols-3 gap-3">
        <button onclick="toggleThumbHistory()" class="card p-4 text-center cursor-pointer relative z-10 hover:border-amber-500/50 transition-all">
          <div class="text-2xl font-bold text-amber-400">${state.points || 0}</div>
          <div class="text-xs text-slate-400">${t('points') || 'Pouces'}</div>
        </button>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400">${earnedBadgesCount}</div>
          <div class="text-xs text-slate-400">${t('badges') || 'Badges'}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-purple-400">${state.spotsCreated || 0}</div>
          <div class="text-xs text-slate-400">${t('contributions') || 'Contributions'}</div>
        </div>
      </div>

      <!-- Thumb History Info Card (toggle) -->
      ${showThumbHistory ? `
      <div class="card p-4 border border-amber-500/30 bg-amber-500/5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-sm flex items-center gap-2">
            ${icon('sparkles', 'w-4 h-4 text-amber-400')}
            ${t('thumbHistoryTitle') || 'Comment gagner des Pouces'}
          </h3>
          <button onclick="toggleThumbHistory()" class="text-slate-400 hover:text-white text-xs cursor-pointer relative z-10" type="button">✕</button>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">📍 ${t('thumbHistoryCreate') || 'Créer un spot'}</span>
            <span class="text-amber-400 font-bold">+20 👍</span>
          </div>
          <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">✅ ${t('thumbHistoryValidate') || 'Valider un spot'}</span>
            <span class="text-amber-400 font-bold">+5 👍</span>
          </div>
          <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">💬 ${t('thumbHistoryReview') || 'Laisser un avis'}</span>
            <span class="text-amber-400 font-bold">+10 👍</span>
          </div>
          <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">🧠 ${t('thumbHistoryQuiz') || 'Quiz du jour'}</span>
            <span class="text-amber-400 font-bold">+50 👍</span>
          </div>
          <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">🎯 ${t('thumbHistoryWeekly') || 'Défi hebdomadaire'}</span>
            <span class="text-amber-400 font-bold">+50-60 👍</span>
          </div>
          <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">🏆 ${t('thumbHistoryMonthly') || 'Défi mensuel'}</span>
            <span class="text-amber-400 font-bold">+150-250 👍</span>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- How to earn points -->
      <div class="card p-4">
        <div class="flex items-center gap-2 mb-3">
          ${icon('sparkles', 'w-5 h-5 text-amber-400')}
          <span class="font-medium text-sm">${t('howToEarnPoints') || 'Comment gagner des Pouces ?'}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 rounded-xl bg-emerald-500/10">
            <div class="text-lg mb-1">📍</div>
            <div class="text-[10px] text-slate-400">${t('validateSpots') || 'Valider des spots'}</div>
          </div>
          <div class="p-2 rounded-xl bg-purple-500/10">
            <div class="text-lg mb-1">💬</div>
            <div class="text-[10px] text-slate-400">${t('leaveComments') || 'Commentaires'}</div>
          </div>
          <div class="p-2 rounded-xl bg-amber-500/10">
            <div class="text-lg mb-1">📸</div>
            <div class="text-[10px] text-slate-400">${t('addPhotos') || 'Ajouter des photos'}</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Badges -->
        <button
          onclick="openBadges()"
          type="button"
          class="card p-4 text-left hover:border-amber-500/50 transition-all group cursor-pointer relative z-10"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🏅
            </div>
            <div>
              <div class="font-bold text-white">${t('badges') || 'Badges'}</div>
              <div class="text-sm text-slate-400">${earnedBadgesCount}/${totalBadges}</div>
            </div>
          </div>
          <div class="h-2 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-amber-500 rounded-full transition-all" style="width: ${totalBadges > 0 ? (earnedBadgesCount / totalBadges) * 100 : 0}%"></div>
          </div>
        </button>

        <!-- Weekly Challenge -->
        <button
          onclick="openChallenges()"
          type="button"
          class="card p-4 text-left hover:border-purple-500/50 transition-all group cursor-pointer relative z-10"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🎯
            </div>
            <div>
              <div class="font-bold text-white">${t('weeklyChallenge') || 'Défi de la semaine'}</div>
              <div class="text-sm text-slate-400">${activeChallenges.length} ${t('active') || 'actifs'}</div>
            </div>
          </div>
          <div class="flex gap-1">
            ${activeChallenges.map(c => `
              <span class="w-2 h-2 rounded-full ${c.challengeType === 'weekly' ? 'bg-emerald-400' : 'bg-purple-400'}"></span>
            `).join('')}
          </div>
        </button>

        <!-- Quiz -->
        <button
          onclick="openQuiz()"
          type="button"
          class="card p-4 text-left hover:border-primary-500/50 transition-all group cursor-pointer relative z-10"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🧠
            </div>
            <div>
              <div class="font-bold text-white">${t('quiz') || 'Quiz'}</div>
              <div class="text-sm text-slate-400">${t('quizDailyPoints') || '+50 👍/jour'}</div>
            </div>
          </div>
        </button>

        <!-- Rewards Shop -->
        <button
          onclick="openShop()"
          type="button"
          class="card p-4 text-left hover:border-emerald-500/50 transition-all group cursor-pointer relative z-10"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🎁
            </div>
            <div>
              <div class="font-bold text-white">${t('rewards') || 'Récompenses'}</div>
              <div class="text-sm text-slate-400">${shopRewards.length} ${t('available') || 'disponibles'}</div>
            </div>
          </div>
        </button>
      </div>

      <!-- Leaderboard Button -->
      <button
        onclick="openLeaderboard()"
        type="button"
        class="card p-4 w-full text-left hover:border-amber-500/50 transition-all group cursor-pointer relative z-10"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            🏆
          </div>
          <div class="flex-1">
            <div class="font-bold text-white">${t('ranking') || 'Classement'}</div>
            <div class="text-sm text-slate-400">${t('seeRanking') || 'Voir le classement'}</div>
          </div>
          <span class="text-slate-400">→</span>
        </div>
      </button>

      <!-- Active Challenges Preview -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold flex items-center gap-2">
            ${icon('flame', 'w-5 h-5 text-orange-400')}
            ${t('activeChallenges') || 'Défis en cours'}
          </h3>
          <button onclick="openChallenges()" type="button" class="text-sm text-primary-400 cursor-pointer relative z-10">
            ${t('seeAll') || 'Voir tout'} →
          </button>
        </div>

        <div class="space-y-4">
          ${activeChallenges.length > 0 ? activeChallenges.map(challenge => {
    const progress = Math.min((state[challenge.type] || 0) / challenge.target * 100, 100)
    return `
              <div class="p-3 rounded-xl bg-white/5">
                <div class="flex items-center justify-between mb-2 gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-base shrink-0">${challenge.icon}</span>
                    <span class="font-medium text-sm truncate">${challenge.name || challenge.title || (t('challenge') || 'Challenge')}</span>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
  challenge.challengeType === 'weekly' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
}">${challenge.challengeType === 'weekly' ? (t('weekly') || 'Hebdo') : (t('monthly') || 'Mensuel')}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all" style="width: ${progress}%"></div>
                  </div>
                  <span class="text-[10px] text-slate-400 shrink-0">${Math.round(progress)}%</span>
                </div>
              </div>
            `
  }).join('') : `
            <div class="text-center text-slate-400 py-4">
              ${t('noChallengesActive') || 'Aucun défi en cours'}
            </div>
          `}
        </div>
      </div>

    </div>
  `
}

export default { renderChallengesHub }
