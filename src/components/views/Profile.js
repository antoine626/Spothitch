/**
 * Profile View Component
 * User info, stats, friends link, settings
 */

import { t } from '../../i18n/index.js';
import { vipLevels } from '../../data/vip-levels.js';
import { renderDonationCard } from '../ui/DonationCard.js';
import { renderTrustScoreCard, getUserTrustScore } from '../../services/trustScore.js';
import { getTitleForLevel, getTitleProgress, getUnlockedTitles, getLockedTitles, getAllTitles } from '../../data/titles.js';

export function renderProfile(state) {
  const levelProgress = (state.points || 0) % 100;
  const pointsToNext = 100 - levelProgress;

  // Get VIP level
  const currentVipLevel = vipLevels.find(v => (state.totalPoints || state.points || 0) >= v.minPoints) || vipLevels[0];

  // Get leagues
  const leagues = ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant'];
  const currentLeagueIndex = Math.min(Math.floor((state.seasonPoints || 0) / 500), leagues.length - 1);
  const currentLeague = leagues[currentLeagueIndex];

  // Get narrative title
  const currentTitle = getTitleForLevel(state.level || 1);
  const titleProgress = getTitleProgress(state.level || 1);
  const unlockedTitles = getUnlockedTitles(state.level || 1);
  const lockedTitles = getLockedTitles(state.level || 1);
  const allTitles = getAllTitles();

  return `
    <div class="p-4 space-y-4 pb-24">
      <!-- Profile Header -->
      <div class="card p-6 text-center">
        <div class="relative inline-block">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/30 to-emerald-500/30 flex items-center justify-center text-5xl mx-auto mb-3">
            ${state.avatar || '🤙'}
          </div>
          <button
            onclick="openProfileCustomization()"
            class="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm hover:bg-primary-600 transition-all"
            aria-label="Personnaliser le profil"
          >
            <i class="fas fa-palette" aria-hidden="true"></i>
          </button>
        </div>
        <h2 class="text-xl font-bold">${state.username || 'Voyageur'}</h2>
        <p class="text-slate-400 text-sm">${state.user?.email || 'Non connecté'}</p>

        <!-- Narrative Title Badge -->
        <div class="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full" style="background: linear-gradient(135deg, ${currentTitle.color}20, ${currentTitle.color}40); border: 1px solid ${currentTitle.color}50;">
          <span class="text-lg">${currentTitle.emoji}</span>
          <span class="font-medium" style="color: ${currentTitle.color}">${currentTitle.name}</span>
        </div>

        <!-- VIP Badge -->
        <div class="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          ${currentVipLevel.image
    ? `<img src="${currentVipLevel.image}" alt="${currentVipLevel.name}" class="w-6 h-6 object-contain" loading="lazy" />`
    : `<span class="text-lg">${currentVipLevel.icon}</span>`
}
          <span class="font-medium text-purple-300">${currentVipLevel.name}</span>
        </div>

        <!-- Customize Button -->
        <button
          onclick="openProfileCustomization()"
          class="mt-3 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm"
        >
          <i class="fas fa-wand-magic-sparkles mr-2" aria-hidden="true"></i>
          Personnaliser (cadres & titres)
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-4 gap-2">
        <button onclick="openStats()" class="card p-3 text-center hover:border-primary-500/50 transition-all">
          <div class="text-xl font-bold text-primary-400">${state.points || 0}</div>
          <div class="text-xs text-slate-500">Points</div>
        </button>
        <button onclick="openTitles()" class="card p-3 text-center hover:border-primary-500/50 transition-all">
          <div class="text-xl font-bold" style="color: ${currentTitle.color}">${currentTitle.emoji}</div>
          <div class="text-xs text-slate-500">Niv.${state.level || 1}</div>
        </button>
        <button onclick="openStats()" class="card p-3 text-center hover:border-primary-500/50 transition-all">
          <div class="text-xl font-bold text-amber-400">${currentLeague[0]}</div>
          <div class="text-xs text-slate-500">Ligue</div>
        </button>
        <button onclick="openStats()" class="card p-3 text-center hover:border-primary-500/50 transition-all">
          <div class="text-xl font-bold text-orange-400">${state.streak || 0}</div>
          <div class="text-xs text-slate-500">Série</div>
        </button>
      </div>

      <!-- Skills Section (moved up for visibility) -->
      <button
        onclick="openSkillTree()"
        class="card p-4 w-full text-left hover:border-purple-500/50 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <i class="fas fa-tree text-purple-400 text-xl" aria-hidden="true"></i>
            </div>
            <div>
              <div class="font-semibold">Arbre de compétences</div>
              <div class="text-sm text-slate-400">${state.skillPoints || 0} points disponibles</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-purple-400">${(state.unlockedSkills || []).length} skills</span>
            <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
          </div>
        </div>
      </button>

      <!-- Level Progress -->
      <div class="card p-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="font-medium" style="color: ${currentTitle.color}">${currentTitle.emoji} ${currentTitle.name} - Niveau ${state.level || 1}</span>
          <span class="text-slate-400">${pointsToNext} pts → Niveau ${(state.level || 1) + 1}</span>
        </div>
        <div class="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            style="width: ${levelProgress}%; background: linear-gradient(90deg, ${currentTitle.color}, ${currentTitle.color}80)"
            role="progressbar"
            aria-valuenow="${levelProgress}"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
        ${titleProgress.next ? `
        <div class="text-xs text-slate-500 mt-2 text-center">
          ${titleProgress.levelsNeeded} niveau${titleProgress.levelsNeeded > 1 ? 'x' : ''} avant le titre "${titleProgress.next.emoji} ${titleProgress.next.name}"
        </div>
        ` : `
        <div class="text-xs text-amber-400 mt-2 text-center">
          Tu as atteint le titre ultime !
        </div>
        `}
      </div>

      <!-- Titles Section -->
      <button
        onclick="openTitles()"
        class="card p-4 w-full text-left hover:border-amber-500/50 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, ${currentTitle.color}30, ${currentTitle.color}50);">
              <span class="text-2xl">${currentTitle.emoji}</span>
            </div>
            <div>
              <div class="font-semibold">Titres Narratifs</div>
              <div class="text-sm text-slate-400">${unlockedTitles.length}/${allTitles.length} titres debloqués</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex -space-x-1">
              ${unlockedTitles.slice(0, 3).map(t => `<span class="text-sm">${t.emoji}</span>`).join('')}
              ${unlockedTitles.length > 3 ? `<span class="text-xs text-slate-400">+${unlockedTitles.length - 3}</span>` : ''}
            </div>
            <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
          </div>
        </div>
      </button>

      <!-- Activity Stats -->
      <div class="card p-4">
        <h3 class="font-bold mb-4 flex items-center gap-2">
          <i class="fas fa-chart-bar text-primary-400" aria-hidden="true"></i>
          Activité
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-lg bg-white/5 text-center">
            <div class="text-2xl font-bold text-emerald-400">${state.spotsCreated || 0}</div>
            <div class="text-xs text-slate-400">Spots partagés</div>
          </div>
          <div class="p-3 rounded-lg bg-white/5 text-center">
            <div class="text-2xl font-bold text-purple-400">${state.checkins || 0}</div>
            <div class="text-xs text-slate-400">Check-ins</div>
          </div>
          <div class="p-3 rounded-lg bg-white/5 text-center">
            <div class="text-2xl font-bold text-amber-400">${state.reviewsGiven || 0}</div>
            <div class="text-xs text-slate-400">Avis donnés</div>
          </div>
          <div class="p-3 rounded-lg bg-white/5 text-center">
            <div class="text-2xl font-bold text-sky-400">${state.badges?.length || 0}</div>
            <div class="text-xs text-slate-400">Badges</div>
          </div>
        </div>
      </div>

      <!-- Trust Score -->
      ${renderTrustScoreCard()}

      <!-- Friends Link -->
      <button
        onclick="changeTab('social'); setSocialTab('friends');"
        class="card p-4 w-full text-left hover:border-primary-500/50 transition-all flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
            <i class="fas fa-user-friends text-primary-400" aria-hidden="true"></i>
          </div>
          <div>
            <div class="font-medium">Mes amis</div>
            <div class="text-sm text-slate-400">${(state.friends || []).length} amis</div>
          </div>
        </div>
        <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
      </button>

      <!-- Settings -->
      <div class="card p-4 space-y-3">
        <h3 class="font-bold flex items-center gap-2">
          <i class="fas fa-cog text-slate-400" aria-hidden="true"></i>
          Paramètres
        </h3>

        <!-- Theme Toggle -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div class="flex items-center gap-3">
            <i class="fas fa-moon text-purple-400" aria-hidden="true"></i>
            <span>Thème sombre</span>
          </div>
          <button
            onclick="toggleTheme()"
            class="w-14 h-8 rounded-full ${state.theme === 'dark' ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
            role="switch"
            aria-checked="${state.theme === 'dark'}"
            aria-label="Activer le thème sombre"
          >
            <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.theme === 'dark' ? 'left-7' : 'left-1'}"></div>
          </button>
        </div>

        <!-- Language -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div class="flex items-center gap-3">
            <i class="fas fa-globe text-emerald-400" aria-hidden="true"></i>
            <span>Langue</span>
          </div>
          <select
            class="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:border-primary-500 outline-none"
            onchange="setLanguage(this.value)"
            aria-label="Choisir la langue"
          >
            <option value="fr" ${state.lang === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
            <option value="en" ${state.lang === 'en' ? 'selected' : ''}>🇬🇧 English</option>
            <option value="es" ${state.lang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
          </select>
        </div>

        <!-- Notifications -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div class="flex items-center gap-3">
            <i class="fas fa-bell text-amber-400" aria-hidden="true"></i>
            <span>Notifications</span>
          </div>
          <button
            onclick="toggleNotifications()"
            class="w-14 h-8 rounded-full ${state.notifications !== false ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
            role="switch"
            aria-checked="${state.notifications !== false}"
            aria-label="Activer les notifications"
          >
            <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.notifications !== false ? 'left-7' : 'left-1'}"></div>
          </button>
        </div>

        <!-- Tutorial -->
        <button
          onclick="startTutorial()"
          class="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          <div class="flex items-center gap-3">
            <i class="fas fa-question-circle text-sky-400" aria-hidden="true"></i>
            <span>Revoir le tutoriel</span>
          </div>
          <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
        </button>

        <!-- GDPR My Data -->
        <button
          onclick="openMyData()"
          class="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          <div class="flex items-center gap-3">
            <i class="fas fa-database text-blue-400" aria-hidden="true"></i>
            <span>Mes donnees (RGPD)</span>
          </div>
          <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Auth -->
      ${state.isLoggedIn ? `
        <button
          onclick="handleLogout()"
          class="card p-4 w-full flex items-center gap-3 text-left text-danger-400 hover:border-danger-500/50 transition-all"
        >
          <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
          <span>Se déconnecter</span>
        </button>
      ` : `
        <button
          onclick="openAuth()"
          class="btn-primary w-full py-4"
        >
          <i class="fas fa-sign-in-alt mr-2" aria-hidden="true"></i>
          Se connecter
        </button>
      `}

      <!-- Support / Donation -->
      ${renderDonationCard({ variant: 'full' })}

      <!-- Version & Reset -->
      <div class="flex items-center justify-between text-xs text-slate-500 pt-4">
        <span>SpotHitch v2.0.0</span>
        <button
          onclick="resetApp()"
          class="text-amber-500 hover:text-amber-400"
        >
          Réinitialiser l'app
        </button>
      </div>
    </div>
  `;
}

// Global handlers
window.startTutorial = () => {
  window.setState?.({ showTutorial: true, tutorialStep: 0 });
};

window.handleLogout = async () => {
  try {
    const { logOut } = await import('../../services/firebase.js');
    await logOut();
    window.showToast?.('Déconnexion réussie', 'success');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

window.setLanguage = async (lang) => {
  const { setLanguage } = await import('../../i18n/index.js');
  setLanguage(lang);
  window.setState?.({ lang });
  location.reload();
};

window.toggleTheme = () => {
  const state = window.getState?.() || {};
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  window.setState?.({ theme: newTheme });
  document.documentElement.classList.toggle('dark', newTheme === 'dark');
};

window.toggleNotifications = () => {
  const state = window.getState?.() || {};
  window.setState?.({ notifications: state.notifications === false ? true : false });
  window.showToast?.(
    state.notifications === false ? 'Notifications activées' : 'Notifications désactivées',
    'info'
  );
};

window.editAvatar = () => {
  // Open welcome modal to change avatar
  window.setState?.({ showWelcome: true });
};

window.setSocialTab = (tab) => {
  window.setState?.({ socialSubTab: tab });
};

export default { renderProfile };
