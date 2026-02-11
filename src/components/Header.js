/**
 * Header Component
 */

import { t } from '../i18n/index.js';

export function renderHeader(state) {
  return `
    <header class="glass-dark fixed top-0 left-0 right-0 z-40 px-4 py-3" role="banner">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <span class="text-2xl">🤙</span>
          <h1 class="font-display text-xl font-bold gradient-text">${t('appName')}</h1>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- Admin Button -->
          <button
            onclick="openAdminPanel()"
            class="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:scale-105 transition-all flex items-center justify-center"
            aria-label="${t('adminPanel') || 'Panneau Admin'}"
            title="${t('adminPanel') || 'Panneau Admin'}"
          >
            <i class="fas fa-shield-alt text-sm" aria-hidden="true"></i>
          </button>
          <!-- SOS Button - Always visible, prominent -->
          <button
            onclick="openSOS()"
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-danger-500 text-white font-bold text-sm shadow-lg shadow-danger-500/30 hover:bg-danger-600 hover:scale-105 transition-all animate-pulse-subtle"
            aria-label="Mode urgence SOS - Partager ma position"
            title="Mode urgence SOS"
          >
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <span>SOS</span>
          </button>
        </div>
      </div>
      
      <!-- Online/Offline indicator -->
      ${!state.isOnline ? `
        <div class="absolute bottom-0 left-0 right-0 bg-warning-500/20 text-warning-400 text-xs text-center py-1" role="status" aria-live="polite">
          <i class="fas fa-wifi-slash mr-1" aria-hidden="true"></i>
          <span>${t('offlineMode') || 'Mode hors-ligne'}</span>
        </div>
      ` : ''}
    </header>
  `;
}

export default { renderHeader };
