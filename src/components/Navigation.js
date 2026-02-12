/**
 * Bottom Navigation Component
 * New structure: Carte, Voyage, Défis, Social, Profil
 */

import { t } from '../i18n/index.js';

export function renderNavigation(state) {
  const tabs = [
    { id: 'map', icon: 'fa-map-marked-alt', label: t('navMap') || 'Carte' },
    { id: 'travel', icon: 'fa-route', label: t('navTravel') || 'Voyage' },
    { id: 'challenges', icon: 'fa-compass', label: t('navActivities') || 'Activités' },
    { id: 'social', icon: 'fa-users', label: t('navSocial') || 'Social' },
    { id: 'profile', icon: 'fa-user', label: t('navProfile') || 'Profil' },
  ];

  return `
    <nav class="glass-dark fixed bottom-0 left-0 right-0 z-40 px-2 py-2 safe-area-inset-bottom" role="navigation" aria-label="${t('mainNavigation') || 'Navigation principale'}">
      <ul class="flex justify-around items-center max-w-lg mx-auto list-none m-0 p-0" role="tablist" aria-label="${t('mainNavigation') || 'Navigation principale'}">
        ${tabs.map(tab => `
          <li role="presentation">
            <button
              onclick="changeTab('${tab.id}')"
              class="nav-btn flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
  state.activeTab === tab.id
    ? 'bg-primary-500 text-white scale-105'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
              role="tab"
              id="tab-${tab.id}"
              data-tab="${tab.id}"
              aria-label="${tab.label}"
              aria-selected="${state.activeTab === tab.id ? 'true' : 'false'}"
              aria-controls="panel-${tab.id}"
              tabindex="${state.activeTab === tab.id ? '0' : '-1'}"
            >
              <i class="fas ${tab.icon} text-lg" aria-hidden="true"></i>
              <span class="text-xs font-medium">${tab.label}</span>
            </button>
          </li>
        `).join('')}
      </ul>
    </nav>
  `;
}

export default { renderNavigation };
