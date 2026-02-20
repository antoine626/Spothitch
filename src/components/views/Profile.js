/**
 * Profile View Component
 * User info, stats, friends link, settings
 */

import { t } from '../../i18n/index.js';
import { renderDonationCard } from '../ui/DonationCard.js';
import { renderTrustScoreCard } from '../../services/trustScore.js';
import { icon } from '../../utils/icons.js'

export function renderProfile(state) {
  return `
    <div class="p-5 space-y-5 pb-28 overflow-x-hidden">
      <!-- Profile Header -->
      <div class="card p-6 text-center">
        <div class="relative inline-block">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/30 to-emerald-500/30 flex items-center justify-center text-5xl mx-auto mb-3">
            ${state.avatar || '🤙'}
          </div>
          <button
            onclick="openProfileCustomization()"
            class="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm hover:bg-primary-600 transition-all"
            aria-label="${t('customizeProfile') || 'Personnaliser le profil'}"
          >
            ${icon('palette', 'w-5 h-5')}
          </button>
        </div>
        <h2 class="text-xl font-bold">${state.username || t('traveler') || 'Voyageur'}</h2>
        <p class="text-slate-400 text-sm">${state.user?.email || t('notConnected') || 'Non connecté'}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-3">
        <button onclick="openStats()" class="card p-4 text-center hover:border-emerald-500/50 transition-all overflow-hidden">
          <div class="text-2xl font-bold text-emerald-400">${state.spotsCreated || 0}</div>
          <div class="text-xs text-slate-400">${t('spotsCreated') || 'Spots créés'}</div>
        </button>
        <button onclick="openStats()" class="card p-4 text-center hover:border-primary-500/50 transition-all overflow-hidden">
          <div class="text-2xl font-bold text-primary-400">${state.spotsValidated || 0}</div>
          <div class="text-xs text-slate-400">${t('spotsValidatedLabel') || 'Validés'}</div>
        </button>
        <button onclick="openStats()" class="card p-4 text-center hover:border-amber-500/50 transition-all overflow-hidden">
          <div class="text-2xl font-bold text-amber-400">${state.checkins || 0}</div>
          <div class="text-xs text-slate-400">${t('checkins') || 'Check-ins'}</div>
        </button>
        <button onclick="openStats()" class="card p-4 text-center hover:border-purple-500/50 transition-all overflow-hidden">
          <div class="text-2xl font-bold text-purple-400">${state.reviewsGiven || 0}</div>
          <div class="text-xs text-slate-400">${t('reviewsGivenLabel') || 'Avis'}</div>
        </button>
      </div>

      <!-- Trust Score -->
      ${renderTrustScoreCard()}

      <!-- Friends Link -->
      <button
        onclick="changeTab('social'); setSocialTab('friends');"
        class="card p-5 w-full text-left hover:border-primary-500/50 transition-all flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
            ${icon('users', 'w-5 h-5 text-primary-400')}
          </div>
          <div>
            <div class="font-medium">${t('myFriends') || 'Mes amis'}</div>
            <div class="text-sm text-slate-400">${(state.friends || []).length} ${t('friendsCount') || 'amis'}</div>
          </div>
        </div>
        ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
      </button>

      <!-- Trip History -->
      <button
        onclick="openTripHistory()"
        class="card p-5 w-full text-left hover:border-emerald-500/50 transition-all flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            ${icon('clipboard-list', 'w-5 h-5 text-emerald-400')}
          </div>
          <div>
            <div class="font-medium">${t('history') || 'Historique'}</div>
            <div class="text-sm text-slate-400">${t('privateTravelJournal') || 'Journal de voyage privé'}</div>
          </div>
        </div>
        ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
      </button>

      <!-- Companion Mode -->
      <button
        onclick="showCompanionModal()"
        class="card p-5 w-full text-left hover:border-red-500/50 transition-all flex items-center justify-between ${state.companionActive ? 'border-emerald-500/50 bg-emerald-500/5' : ''}"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${state.companionActive ? 'bg-emerald-500/20' : 'bg-red-500/20'} flex items-center justify-center">
            ${icon('shield', `w-5 h-5 ${state.companionActive ? 'text-emerald-400' : 'text-red-400'}`)}
          </div>
          <div>
            <div class="font-medium">${t('companionMode') || 'Mode Compagnon'}</div>
            <div class="text-sm text-slate-400">${state.companionActive ? (t('companionActiveDesc') || 'Actif — check-in GPS en cours') : (t('companionSafetyDesc') || 'Sécurité : partage ta position avec un proche')}</div>
          </div>
        </div>
        ${state.companionActive
          ? `<span class="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">${t('active') || 'Actif'}</span>`
          : icon('chevron-right', 'w-5 h-5 text-slate-400')
        }
      </button>

      <!-- Guides -->
      <button
        onclick="openGuidesOverlay()"
        class="card p-5 w-full text-left hover:border-blue-500/50 transition-all flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            ${icon('book-open', 'w-5 h-5 text-blue-400')}
          </div>
          <div>
            <div class="font-medium">${t('guides') || 'Guides'}</div>
            <div class="text-sm text-slate-400">${t('guidesSubtitle') || 'Conseils, sécurité, légalité par pays'}</div>
          </div>
        </div>
        ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
      </button>

      <!-- Settings -->
      <div class="card p-5 space-y-4">
        <h3 class="font-bold flex items-center gap-2">
          ${icon('settings', 'w-5 h-5 text-slate-400')}
          ${t('settings') || 'Paramètres'}
        </h3>

        <!-- Theme Toggle -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div class="flex items-center gap-3">
            ${icon('moon', 'w-5 h-5 text-purple-400')}
            <span>${t('darkMode') || 'Thème sombre'}</span>
          </div>
          <button
            onclick="toggleTheme()"
            class="w-14 h-8 rounded-full ${state.theme === 'dark' ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
            role="switch"
            aria-checked="${state.theme === 'dark'}"
            aria-label="${t('toggleDarkMode') || 'Activer le thème sombre'}"
          >
            <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.theme === 'dark' ? 'left-7' : 'left-1'}"></div>
          </button>
        </div>

        <!-- Language -->
        <div class="p-3 rounded-xl bg-white/5">
          <div class="flex items-center gap-3 mb-3">
            ${icon('globe', 'w-5 h-5 text-emerald-400')}
            <span>${t('language') || 'Langue'}</span>
          </div>
          <div class="grid grid-cols-4 gap-3" role="radiogroup" aria-label="${t('chooseLanguage') || 'Choisir la langue'}">
            ${[
              { code: 'fr', flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'FR' },
              { code: 'en', flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'EN' },
              { code: 'es', flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'ES' },
              { code: 'de', flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'DE' },
            ].map(lang => `
              <button
                onclick="setLanguage('${lang.code}')"
                class="flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${state.lang === lang.code ? 'bg-primary-500/20 border-2 border-primary-500 ring-1 ring-primary-500/30' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}"
                role="radio"
                aria-checked="${state.lang === lang.code}"
                aria-label="${lang.name}"
                type="button"
              >
                <span class="text-2xl">${lang.flag}</span>
                <span class="text-xs font-medium ${state.lang === lang.code ? 'text-primary-400' : 'text-slate-400'}">${lang.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Notifications -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div class="flex items-center gap-3">
            ${icon('bell', 'w-5 h-5 text-amber-400')}
            <span>${t('notifications') || 'Notifications'}</span>
          </div>
          <button
            onclick="toggleNotifications()"
            class="w-14 h-8 rounded-full ${state.notifications !== false ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
            role="switch"
            aria-checked="${state.notifications !== false}"
            aria-label="${t('toggleNotifications') || 'Activer les notifications'}"
          >
            <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.notifications !== false ? 'left-7' : 'left-1'}"></div>
          </button>
        </div>

        <!-- Proximity Alerts -->
        <div class="p-3 rounded-xl bg-white/5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              ${icon('map-pin', 'w-5 h-5 text-emerald-400')}
              <div>
                <span class="block">${t('proximityAlerts') || 'Nearby spot alerts'}</span>
                <span class="text-xs text-slate-400">${t('proximityAlertsDesc') || 'Get notified when near a spot'}</span>
              </div>
            </div>
            <button
              onclick="toggleProximityAlertsSetting()"
              class="w-14 h-8 rounded-full ${state.proximityAlerts !== false ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
              role="switch"
              aria-checked="${state.proximityAlerts !== false}"
              aria-label="${t('proximityAlerts') || 'Nearby spot alerts'}"
            >
              <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.proximityAlerts !== false ? 'left-7' : 'left-1'}"></div>
            </button>
          </div>
        </div>

        <!-- Tutorial -->
        <button
          onclick="startTutorial()"
          class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <div class="flex items-center gap-3">
            ${icon('info', 'w-5 h-5 text-primary-400')}
            <span>${t('reviewTutorial') || 'Revoir le tutoriel'}</span>
          </div>
          ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
        </button>

        <!-- GDPR My Data -->
        <button
          onclick="openMyData()"
          class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <div class="flex items-center gap-3">
            ${icon('database', 'w-5 h-5 text-blue-400')}
            <span>${t('myData') || 'Mes donnees'} (RGPD)</span>
          </div>
          ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
        </button>

        <!-- Blocked Users -->
        <button
          onclick="openBlockedUsers()"
          class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <div class="flex items-center gap-3">
            ${icon('ban', 'w-5 h-5 text-slate-400')}
            <span>${t('blockedUsers') || 'Utilisateurs bloques'}</span>
          </div>
          ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
        </button>

        <!-- Community Guidelines -->
        <button
          onclick="showLegalPage('guidelines')"
          class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <div class="flex items-center gap-3">
            ${icon('scroll-text', 'w-5 h-5 text-emerald-400')}
            <span>${t('communityGuidelines') || 'Regles de la communaute'}</span>
          </div>
          ${icon('chevron-right', 'w-5 h-5 text-slate-400')}
        </button>
      </div>

      <!-- Auth -->
      ${state.isLoggedIn ? `
        <button
          onclick="handleLogout()"
          class="card p-5 w-full flex items-center gap-3 text-left text-danger-400 hover:border-danger-500/50 transition-all"
        >
          ${icon('log-out', 'w-5 h-5')}
          <span>${t('logout') || 'Se déconnecter'}</span>
        </button>
      ` : `
        <button
          onclick="openAuth()"
          class="btn-primary w-full py-4"
        >
          ${icon('log-in', 'w-5 h-5 mr-2')}
          ${t('login') || 'Se connecter'}
        </button>
      `}

      <!-- Support / Donation -->
      ${renderDonationCard({ variant: 'full' })}

      <!-- Footer -->
      <div class="card p-5 space-y-1">
        <button
          onclick="openContactForm()"
          class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
        >
          ${icon('mail', 'w-4 h-4 text-slate-500')}
          <span class="text-sm text-slate-400">${t('contactUs') || 'Nous contacter'}</span>
        </button>
        <button
          onclick="openFAQ()"
          class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
        >
          ${icon('help-circle', 'w-4 h-4 text-slate-500')}
          <span class="text-sm text-slate-400">${t('faqAndHelp') || 'FAQ & Aide'}</span>
        </button>
        <div class="p-3">
          <div class="flex items-center gap-3 mb-2">
            ${icon('info', 'w-4 h-4 text-slate-500')}
            <span class="text-sm text-slate-400">${t('aboutSpotHitch') || 'À propos de SpotHitch'}</span>
          </div>
          <p class="text-xs text-slate-500 pl-7">${t('aboutSpotHitchDesc') || 'La communauté des autostoppeurs.'}</p>
        </div>
        <button
          onclick="showLegalPage('privacy')"
          class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
        >
          ${icon('scroll-text', 'w-4 h-4 text-slate-500')}
          <span class="text-sm text-slate-400">${t('legalNotices') || 'Mentions légales'}</span>
        </button>
        <button
          onclick="shareApp()"
          class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
        >
          ${icon('share-2', 'w-4 h-4 text-slate-500')}
          <span class="text-sm text-slate-400">${t('inviteFriends') || 'Inviter des amis'}</span>
        </button>
        <div class="p-3 pt-2 border-t border-white/5">
          <div class="flex items-center gap-3 mb-1">
            ${icon('heart', 'w-4 h-4 text-slate-500')}
            <span class="text-sm text-slate-400">${t('creditsLabel') || 'Crédits'}</span>
          </div>
          <p class="text-xs text-slate-500 pl-7">${t('creditsText') || 'Données : Hitchwiki (ODBL) • Cartes : OpenFreeMap'}</p>
        </div>
      </div>

      <!-- Version & Reset -->
      <div class="flex items-center justify-between text-xs text-slate-400 pt-4">
        <span>SpotHitch v2.0.0</span>
        <button
          onclick="resetApp()"
          class="text-amber-500 hover:text-amber-400"
        >
          ${t('resetApp') || 'Réinitialiser l\'app'}
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
    window.showToast?.(t('logoutSuccess') || 'Déconnexion réussie', 'success');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

// setLanguage is defined in main.js (single source of truth)

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
    state.notifications === false ? (t('notificationsEnabled') || 'Notifications activées') : (t('notificationsDisabled') || 'Notifications désactivées'),
    'info'
  );
};

window.toggleProximityAlertsSetting = () => {
  const state = window.getState?.() || {};
  window.setState?.({ proximityAlerts: state.proximityAlerts === false ? true : false });
  window.showToast?.(
    state.proximityAlerts === false ? (t('notificationsEnabled') || 'Notifications activées') : (t('notificationsDisabled') || 'Notifications désactivées'),
    'info'
  );
};

window.editAvatar = () => {
  // Open welcome modal to change avatar
  window.setState?.({ showWelcome: true });
};

window.openBlockedUsers = () => {
  window.setState?.({ showBlockedUsers: true });
};

window.closeBlockedUsers = () => {
  window.setState?.({ showBlockedUsers: false });
};

export default { renderProfile };
