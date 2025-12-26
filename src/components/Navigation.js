/**
 * Bottom Navigation Component
 */

import { t } from '../i18n/index.js';

export function renderNavigation(state) {
  const tabs = [
    { id: 'home', icon: 'fa-home', label: t('home') },
    { id: 'spots', icon: 'fa-map-marker-alt', label: t('spots') },
    { id: 'planner', icon: 'fa-route', label: t('planner') },
    { id: 'chat', icon: 'fa-comments', label: t('chat') },
    { id: 'profile', icon: 'fa-user', label: t('profile') },
  ];

  return `
    <nav class="glass-dark fixed bottom-0 left-0 right-0 z-40 px-2 py-2 safe-area-inset-bottom">
      <div class="flex justify-around items-center max-w-lg mx-auto">
        ${tabs.map(tab => `
          <button 
            onclick="changeTab('${tab.id}')"
            class="nav-btn flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
  state.activeTab === tab.id
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
            aria-label="${tab.label}"
            aria-current="${state.activeTab === tab.id ? 'page' : 'false'}"
          >
            <i class="fas ${tab.icon} text-lg"></i>
            <span class="text-xs font-medium">${tab.label}</span>
          </button>
        `).join('')}
      </div>
    </nav>
  `;
}

export default { renderNavigation };
