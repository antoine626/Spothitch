/**
 * Profile View Component
 */

import { t } from '../../i18n/index.js';

export function renderProfile(state) {
  const levelProgress = (state.points % 100);
  const pointsToNext = 100 - levelProgress;
  
  return `
    <div class="p-4 space-y-6">
      <!-- Profile Header -->
      <div class="card p-6 text-center">
        <div class="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center text-4xl mx-auto mb-4">
          ${state.avatar || '🤙'}
        </div>
        <h2 class="text-xl font-bold">${state.username || 'Voyageur'}</h2>
        <p class="text-slate-400 text-sm">${t('tagline')}</p>
        
        <!-- Level Progress -->
        <div class="mt-4">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-primary-400">${t('level')} ${state.level}</span>
            <span class="text-slate-400">${pointsToNext} pts → Niveau ${state.level + 1}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${levelProgress}%"></div>
          </div>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-primary-400">${state.points}</div>
          <div class="text-xs text-slate-400">${t('points')}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400">${state.spotsCreated}</div>
          <div class="text-xs text-slate-400">${t('spotsShared')}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-purple-400">${state.checkins}</div>
          <div class="text-xs text-slate-400">${t('checkinsCount')}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-warning-400">${state.reviewsGiven}</div>
          <div class="text-xs text-slate-400">${t('reviewsGiven')}</div>
        </div>
      </div>
      
      <!-- Badges -->
      <section>
        <h3 class="text-lg font-bold mb-4">🏆 Badges</h3>
        <div class="flex flex-wrap gap-2">
          ${state.badges.length > 0 
            ? state.badges.map(badge => `
                <div class="badge badge-success">
                  <i class="fas fa-medal"></i>
                  ${badge}
                </div>
              `).join('')
            : `<p class="text-slate-400 text-sm">Aucun badge encore. Continue à explorer !</p>`
          }
        </div>
      </section>
      
      <!-- Settings -->
      <section>
        <h3 class="text-lg font-bold mb-4">⚙️ ${t('settings')}</h3>
        
        <div class="space-y-3">
          <!-- Theme Toggle -->
          <div class="card p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-moon text-primary-400"></i>
              <span>${t('theme')}</span>
            </div>
            <button 
              onclick="toggleTheme()"
              class="w-12 h-6 rounded-full ${state.theme === 'dark' ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all"
            >
              <div class="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${state.theme === 'dark' ? 'left-6' : 'left-0.5'}"></div>
            </button>
          </div>
          
          <!-- Language -->
          <div class="card p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-globe text-primary-400"></i>
              <span>${t('language')}</span>
            </div>
            <select 
              class="bg-white/10 rounded-lg px-3 py-2 text-sm"
              onchange="setLanguage(this.value)"
            >
              <option value="fr" ${state.lang === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
              <option value="en" ${state.lang === 'en' ? 'selected' : ''}>🇬🇧 English</option>
              <option value="es" ${state.lang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
            </select>
          </div>
          
          <!-- Tutorial -->
          <button 
            onclick="startTutorial()"
            class="card p-4 w-full flex items-center gap-3 text-left hover:border-primary-500/50 transition-all"
          >
            <i class="fas fa-question-circle text-primary-400"></i>
            <span>Revoir le tutoriel</span>
          </button>
          
          <!-- Auth -->
          ${state.isLoggedIn ? `
            <button 
              onclick="handleLogout()"
              class="card p-4 w-full flex items-center gap-3 text-left hover:border-danger-500/50 transition-all text-danger-400"
            >
              <i class="fas fa-sign-out-alt"></i>
              <span>${t('logout')}</span>
            </button>
          ` : `
            <button 
              onclick="openAuth()"
              class="card p-4 w-full flex items-center gap-3 text-left hover:border-primary-500/50 transition-all"
            >
              <i class="fas fa-sign-in-alt text-primary-400"></i>
              <span>${t('login')}</span>
            </button>
          `}
        </div>
      </section>
      
      <!-- Version -->
      <div class="text-center text-slate-500 text-xs">
        SpotHitch v2.0.0 • Made with 🤙
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
  location.reload(); // Reload to apply translations
};

export default { renderProfile };
