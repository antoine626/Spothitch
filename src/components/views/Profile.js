/**
 * Profile View Component
 * User info, stats, friends link, settings
 */

import { t } from '../../i18n/index.js';
import { vipLevels } from '../../data/vip-levels.js';
import { renderDonationCard } from '../ui/DonationCard.js';
import { renderTrustScoreCard, getUserTrustScore } from '../../services/trustScore.js';

export function renderProfile(state) {
  const levelProgress = (state.points || 0) % 100;
  const pointsToNext = 100 - levelProgress;

  // Get VIP level
  const currentVipLevel = vipLevels.find(v => (state.totalPoints || state.points || 0) >= v.minPoints) || vipLevels[0];

  // Get leagues
  const leagues = ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant'];
  const currentLeagueIndex = Math.min(Math.floor((state.seasonPoints || 0) / 500), leagues.length - 1);
  const currentLeague = leagues[currentLeagueIndex];

  return `
    <div class="p-4 space-y-4 pb-24">
      <!-- Profile Header -->
      <div class="card p-6 text-center">
        <div class="relative inline-block">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/30 to-emerald-500/30 flex items-center justify-center text-5xl mx-auto mb-3">
            ${state.avatar || '🤙'}
          </div>
          <button
            onclick="editAvatar()"
            class="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm hover:bg-primary-600 transition-all"
            aria-label="Changer l'avatar"
          >
            <i class="fas fa-pencil-alt" aria-hidden="true"></i>
          </button>
        </div>
        <h2 class="text-xl font-bold">${state.username || 'Voyageur'}</h2>
        <p class="text-slate-400 text-sm">${state.user?.email || 'Non connecté'}</p>

        <!-- VIP Badge -->
        <div class="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          ${currentVipLevel.image
            ? `<img src="${currentVipLevel.image}" alt="${currentVipLevel.name}" class="w-6 h-6 object-contain" loading="lazy" />`
            : `<span class="text-lg">${currentVipLevel.icon}</span>`
          }
          <span class="font-medium text-purple-300">${currentVipLevel.name}</span>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-4 gap-2">
        <button onclick="openStats()" class="card p-3 text-center hover:border-primary-500/50 transition-all">
          <div class="text-xl font-bold text-primary-400">${state.points || 0}</div>
          <div class="text-xs text-slate-500">Points</div>
        </button>
        <button onclick="openStats()" class="card p-3 text-center hover:border-primary-500/50 transition-all">
          <div class="text-xl font-bold text-emerald-400">Niv.${state.level || 1}</div>
          <div class="text-xs text-slate-500">Niveau</div>
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

      <!-- Level Progress -->
      <div class="card p-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-primary-400 font-medium">Niveau ${state.level || 1}</span>
          <span class="text-slate-400">${pointsToNext} pts → Niveau ${(state.level || 1) + 1}</span>
        </div>
        <div class="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all"
            style="width: ${levelProgress}%"
            role="progressbar"
            aria-valuenow="${levelProgress}"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>

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
            class="w-12 h-6 rounded-full ${state.theme === 'dark' ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all"
            role="switch"
            aria-checked="${state.theme === 'dark'}"
            aria-label="Activer le thème sombre"
          >
            <div class="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${state.theme === 'dark' ? 'left-6' : 'left-0.5'}"></div>
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
            class="w-12 h-6 rounded-full ${state.notifications !== false ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all"
            role="switch"
            aria-checked="${state.notifications !== false}"
            aria-label="Activer les notifications"
          >
            <div class="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${state.notifications !== false ? 'left-6' : 'left-0.5'}"></div>
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
