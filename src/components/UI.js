/**
 * UI Helper Components
 * Shared UI elements and utilities
 */

import { getState } from '../stores/state.js';
import { t } from '../i18n/index.js';

/**
 * Render side menu (hamburger menu)
 */
export function renderSideMenu() {
  const state = getState();
  const { showSideMenu, user, isLoggedIn } = state;

  if (!showSideMenu) return '';

  const menuItems = [
    { id: 'home', icon: '🏠', label: t('home') || 'Home' },
    { id: 'spots', icon: '📍', label: t('spots') || 'Spots' },
    { id: 'planner', icon: '🗺️', label: t('planner') || 'Planner' },
    { id: 'guides', icon: '📚', label: t('guides') || 'Guides' },
    { id: 'chat', icon: '💬', label: t('chat') || 'Chat' },
    { id: 'friends', icon: '👥', label: t('friends') || 'Friends' },
    { id: 'profile', icon: '👤', label: t('profile') || 'Profile' },
  ];

  const bottomItems = [
    { action: 'openSettings', icon: '⚙️', label: t('settings') || 'Settings' },
    { action: 'showLegalPage', icon: '📋', label: t('legal') || 'Legal' },
    { action: 'openSOS', icon: '🆘', label: t('sosMode') || 'SOS Mode' },
  ];

  return `
    <div class="side-menu-overlay fixed inset-0 bg-black/60 z-50" onclick="closeSideMenu()" role="presentation">
      <aside class="side-menu fixed left-0 top-0 bottom-0 w-72 bg-dark-secondary shadow-2xl
                  transform transition-transform animate-slide-in-left"
           onclick="event.stopPropagation()"
           role="dialog"
           aria-modal="true"
           aria-label="${t('sideMenu') || 'Side menu'}">
        <!-- Header -->
        <div class="p-6 border-b border-white/10">
          ${isLoggedIn ? `
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600
                          flex items-center justify-center text-2xl" aria-hidden="true">
                ${state.avatar || '🤙'}
              </div>
              <div>
                <div class="text-white font-bold">${user?.displayName || state.username || (t('you') || 'Traveler')}</div>
                <div class="text-slate-500 text-sm">${t('levelPrefix') || 'Lvl.'} ${state.level || 1}</div>
              </div>
            </div>
          ` : `
            <button onclick="closeSideMenu(); openAuth()"
                    class="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white
                           font-bold rounded-xl"
                    type="button">
              ${t('login') || 'Login'}
            </button>
          `}
        </div>

        <!-- Main Menu -->
        <nav class="p-4 space-y-1" aria-label="${t('mainMenu') || 'Main menu'}">
          ${menuItems.map(item => `
            <button onclick="closeSideMenu(); changeTab('${item.id}')"
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                           ${state.activeTab === item.id
    ? 'bg-primary-500/20 text-primary-400'
    : 'text-slate-300 hover:bg-white/10'}"
                    type="button"
                    aria-current="${state.activeTab === item.id ? 'page' : 'false'}">
              <span class="text-xl" aria-hidden="true">${item.icon}</span>
              <span>${item.label}</span>
            </button>
          `).join('')}
        </nav>

        <!-- Divider -->
        <div class="mx-4 border-t border-white/10" aria-hidden="true"></div>

        <!-- Bottom Menu -->
        <nav class="p-4 space-y-1" aria-label="${t('secondaryMenu') || 'Secondary menu'}">
          ${bottomItems.map(item => `
            <button onclick="closeSideMenu(); ${item.action}()"
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                           text-slate-300 hover:bg-white/10"
                    type="button">
              <span class="text-xl" aria-hidden="true">${item.icon}</span>
              <span>${item.label}</span>
            </button>
          `).join('')}
        </nav>

        <!-- Footer -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div class="text-center text-slate-500 text-xs">
            SpotHitch v2.0 - Open Source
          </div>
        </div>
      </aside>
    </div>
  `;
}

/**
 * Render floating action button (FAB)
 */
export function renderFAB() {
  const state = getState();

  // Only show on certain tabs
  if (!['spots', 'home'].includes(state.activeTab)) return '';

  return `
    <button onclick="openAddSpot()"
            class="fab fixed right-4 bottom-20 w-14 h-14 rounded-full
                   bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg
                   flex items-center justify-center text-white text-2xl
                   hover:scale-110 transition-transform z-30"
            aria-label="${t('addSpot')}"
            type="button">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  `;
}

/**
 * Render empty state
 */
export function renderEmptyState(type = 'spots') {
  const emptyStates = {
    spots: {
      icon: '📍',
      title: t('noSpots'),
      description: 'Aucun spot trouvé avec ces critères',
      action: { label: 'Ajouter un spot', onclick: 'openAddSpot()' },
    },
    search: {
      icon: '🔍',
      title: t('noResults'),
      description: 'Essaie avec d\'autres mots-clés',
      action: null,
    },
    trips: {
      icon: '🗺️',
      title: t('noTrips'),
      description: 'Planifie ton premier voyage',
      action: { label: 'Créer un voyage', onclick: 'changeTab("planner")' },
    },
    friends: {
      icon: '👥',
      title: 'Aucun ami',
      description: 'Ajoute des amis pour voyager ensemble',
      action: { label: 'Ajouter un ami', onclick: 'showAddFriend()' },
    },
    messages: {
      icon: '💬',
      title: 'Aucun message',
      description: 'Commence une conversation',
      action: null,
    },
    offline: {
      icon: '📵',
      title: 'Hors ligne',
      description: 'Contenu limité en mode hors-ligne',
      action: null,
    },
  };

  const state = emptyStates[type] || emptyStates.spots;

  return `
    <div class="empty-state py-16 px-8 text-center">
      <div class="text-6xl mb-4">${state.icon}</div>
      <h3 class="text-xl font-bold text-white mb-2">${state.title}</h3>
      <p class="text-slate-500 mb-6">${state.description}</p>
      ${state.action ? `
        <button onclick="${state.action.onclick}"
                class="px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl
                       hover:bg-primary-600 transition-colors">
          ${state.action.label}
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Render skeleton spot card (loading placeholder)
 */
export function renderSkeletonSpotCard() {
  return `
    <div class="skeleton-card bg-white/5 rounded-xl overflow-hidden animate-pulse">
      <div class="h-32 bg-white/10"></div>
      <div class="p-4 space-y-3">
        <div class="h-4 bg-white/10 rounded w-3/4"></div>
        <div class="h-3 bg-white/10 rounded w-1/2"></div>
        <div class="flex gap-2">
          <div class="h-6 bg-white/10 rounded w-16"></div>
          <div class="h-6 bg-white/10 rounded w-12"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render skeleton list (multiple loading cards)
 */
export function renderSkeletonList(count = 4) {
  return `
    <div class="skeleton-list grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      ${Array(count).fill(0).map(() => renderSkeletonSpotCard()).join('')}
    </div>
  `;
}

/**
 * Render loading spinner
 */
export function renderSpinner(size = 'md', text = '') {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return `
    <div class="spinner flex flex-col items-center justify-center gap-3">
      <div class="${sizes[size]} border-2 border-white/10 border-t-primary-500 rounded-full animate-spin"></div>
      ${text ? `<div class="text-slate-500 text-sm">${text}</div>` : ''}
    </div>
  `;
}

/**
 * Render toast notification
 */
export function renderToast(message, type = 'info', duration = 3000) {
  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-primary-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return `
    <div class="toast fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div class="${typeStyles[type]} rounded-xl px-4 py-3 flex items-center gap-3 text-white shadow-lg">
        <span class="text-xl">${icons[type]}</span>
        <span class="flex-1">${message}</span>
      </div>
    </div>
  `;
}

/**
 * Render confirmation dialog
 */
export function renderConfirmDialog(title, message, onConfirm, onCancel = 'closeConfirm()') {
  return `
    <div class="confirm-dialog fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
         onclick="if(event.target===this)${onCancel}"
         role="alertdialog"
         aria-modal="true"
         aria-labelledby="confirm-title"
         aria-describedby="confirm-message">
      <div class="modal-panel w-full max-w-sm rounded-2xl overflow-hidden">
        <div class="p-6 text-center">
          <h3 id="confirm-title" class="text-xl font-bold text-white mb-2">${title}</h3>
          <p id="confirm-message" class="text-slate-400">${message}</p>
        </div>
        <div class="flex border-t border-white/10">
          <button onclick="${onCancel}"
                  class="flex-1 py-3 text-slate-400 hover:bg-white/10"
                  type="button">
            Annuler
          </button>
          <button onclick="${onConfirm}"
                  class="flex-1 py-3 text-red-400 hover:bg-white/10 border-l border-white/10"
                  type="button">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render back button
 */
export function renderBackButton(onclick = 'history.back()') {
  return `
    <button onclick="${onclick}"
            class="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Retour a la page precedente"
            type="button">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  `;
}

/**
 * Render rating stars
 */
export function renderRatingStars(rating, interactive = false, size = 'md') {
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  if (interactive) {
    return `
      <div class="rating-stars flex gap-1 ${sizes[size]}" role="group" aria-label="Selection de la note">
        ${[1, 2, 3, 4, 5].map(i => `
          <button onclick="setRating(${i})"
                  class="star-btn hover:scale-110 transition-transform
                         ${i <= rating ? 'text-amber-400' : 'text-gray-600'}"
                  type="button"
                  aria-label="${i} etoile${i > 1 ? 's' : ''}"
                  aria-pressed="${i <= rating ? 'true' : 'false'}">
            <span aria-hidden="true">★</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  return `
    <span class="rating-stars ${sizes[size]}" aria-label="Note: ${rating} sur 5">
      <span aria-hidden="true">${Array(fullStars).fill('★').join('')}${hasHalf ? '½' : ''}${Array(5 - fullStars - (hasHalf ? 1 : 0)).fill('☆').join('')}</span>
    </span>
  `;
}

/**
 * Render badge pill
 */
export function renderBadge(text, type = 'default') {
  const typeStyles = {
    default: 'bg-white/10 text-slate-300',
    primary: 'bg-primary-500/20 text-primary-400',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-amber-500/20 text-amber-400',
    danger: 'bg-red-500/20 text-red-400',
  };

  return `
    <span class="badge px-2 py-0.5 rounded-full text-xs font-medium ${typeStyles[type]}">
      ${text}
    </span>
  `;
}

/**
 * Render progress bar
 */
export function renderProgressBar(progress, color = 'primary') {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    purple: 'from-purple-500 to-pink-500',
    amber: 'from-amber-500 to-orange-500',
    green: 'from-green-500 to-emerald-500',
  };
  const percentage = Math.min(progress * 100, 100);

  return `
    <div class="progress-bar h-2 bg-white/10 rounded-full overflow-hidden"
         role="progressbar"
         aria-valuenow="${Math.round(percentage)}"
         aria-valuemin="0"
         aria-valuemax="100"
         aria-label="Progression: ${Math.round(percentage)}%">
      <div class="h-full bg-gradient-to-r ${colors[color]} transition-all duration-500"
           style="width: ${percentage}%"></div>
    </div>
  `;
}

export default {
  renderSideMenu,
  renderFAB,
  renderEmptyState,
  renderSkeletonSpotCard,
  renderSkeletonList,
  renderSpinner,
  renderToast,
  renderConfirmDialog,
  renderBackButton,
  renderRatingStars,
  renderBadge,
  renderProgressBar,
};
