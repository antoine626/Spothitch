/**
 * Header Component
 */

import { t } from '../i18n/index.js';

export function renderHeader(state) {
  return `
    <header class="glass-dark fixed top-0 left-0 right-0 z-40 px-4 py-3">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <span class="text-2xl">🤙</span>
          <h1 class="font-display text-xl font-bold gradient-text">${t('appName')}</h1>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- SOS Button -->
          <button 
            onclick="openSOS()"
            class="sos-header-btn"
            aria-label="SOS"
          >
            <i class="fas fa-exclamation-triangle"></i>
            SOS
          </button>
          
          <!-- User Avatar -->
          <button 
            onclick="changeTab('profile')"
            class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg"
            aria-label="${t('profile')}"
          >
            ${state.avatar || '🤙'}
          </button>
        </div>
      </div>
      
      <!-- Online/Offline indicator -->
      ${!state.isOnline ? `
        <div class="absolute bottom-0 left-0 right-0 bg-warning-500/20 text-warning-400 text-xs text-center py-1">
          <i class="fas fa-wifi-slash mr-1"></i> Mode hors-ligne
        </div>
      ` : ''}
    </header>
  `;
}

export default { renderHeader };
