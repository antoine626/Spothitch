/**
 * Bottom Navigation Component — Floating pill design
 * 4 tabs: Carte, Activités, Social, Profil
 */

import { t } from '../i18n/index.js'

export function renderNavigation(state) {
  const tabs = [
    { id: 'map', icon: 'fa-map-marked-alt', label: t('navMap') || 'Carte' },
    { id: 'challenges', icon: 'fa-compass', label: t('navActivities') || 'Activités' },
    { id: 'social', icon: 'fa-users', label: t('navSocial') || 'Social' },
    { id: 'profile', icon: 'fa-user', label: t('navProfile') || 'Profil' },
  ]

  return `
    <nav class="fixed bottom-4 left-4 right-4 z-40 px-4 py-2 rounded-2xl bg-dark-primary/80 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 safe-area-inset-bottom" role="navigation" aria-label="${t('mainNavigation') || 'Navigation principale'}">
      <ul class="flex items-center justify-around list-none m-0 p-0" role="tablist" aria-label="${t('mainNavigation') || 'Navigation principale'}">
        ${tabs.map(tab => `
          <li role="presentation" class="flex-1">
            <button
              onclick="changeTab('${tab.id}')"
              class="nav-btn relative w-full flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl transition-all duration-300 ${
  state.activeTab === tab.id
    ? 'text-primary-400'
    : 'text-slate-500 hover:text-white'
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
              <span class="text-[11px] font-medium leading-tight">${tab.label}</span>
              ${state.activeTab === tab.id ? '<span class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary-400"></span>' : ''}
            </button>
          </li>
        `).join('')}
      </ul>
    </nav>
  `
}

export default { renderNavigation }
