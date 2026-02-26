/**
 * Admin Panel Modal
 * Quick access to all app features for testing
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

export function renderAdminPanel(state) {
  return `
    <div class="modal-overlay active" role="dialog" aria-modal="true" onclick="closeAdminPanel()">
      <div class="modal-content max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold flex items-center gap-2">
            ${icon('shield', 'w-5 h-5 text-amber-400')}
            ${t('adminPanel') || 'Panneau Admin'}
          </h2>
          <button onclick="closeAdminPanel()" class="text-slate-400 hover:text-white">
            ${icon('x', 'w-6 h-6')}
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="card p-4 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div class="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div class="font-bold text-amber-400">${state.points || 0}</div>
              <div class="text-xs text-slate-400">${t('points') || 'Pouces'}</div>
            </div>
            <div>
              <div class="font-bold text-emerald-400">${state.level || 1}</div>
              <div class="text-xs text-slate-400">${t('level') || 'Niveau'}</div>
            </div>
            <div>
              <div class="font-bold text-purple-400">${state.skillPoints || 0}</div>
              <div class="text-xs text-slate-400">${t('skillPoints') || 'Skill 👍'}</div>
            </div>
            <div>
              <div class="font-bold text-amber-400">${state.thumbs || 0}</div>
              <div class="text-xs text-slate-400">${t('thumbs') || 'Pouces'}</div>
            </div>
          </div>
        </div>

        <!-- Add Points/Resources -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-amber-400">
            ${icon('coins', 'w-5 h-5 mr-2')}
            ${t('resources') || 'Ressources'}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="adminAddPoints(100)" class="btn-secondary text-sm py-2">
              +100 👍
            </button>
            <button onclick="adminAddPoints(1000)" class="btn-secondary text-sm py-2">
              +1000 👍
            </button>
            <button onclick="adminAddSkillPoints(5)" class="btn-secondary text-sm py-2">
              +5 Skill 👍
            </button>
            <button onclick="adminAddThumbs(50)" class="btn-secondary text-sm py-2">
              +50 Pouces
            </button>
            <button onclick="adminLevelUp()" class="btn-secondary text-sm py-2">
              Level Up
            </button>
            <button onclick="adminMaxStats()" class="btn-primary text-sm py-2">
              MAX ALL
            </button>
          </div>
        </div>

        <!-- Gamification -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-purple-400">
            ${icon('gamepad', 'w-5 h-5 mr-2')}
            ${t('gamification') || 'Gamification'}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openBadges(); closeAdminPanel();" class="admin-btn">
              ${icon('medal', 'w-5 h-5 text-amber-400')}
              ${t('badges') || 'Badges'}
            </button>
            <button onclick="openChallenges(); closeAdminPanel();" class="admin-btn">
              ${icon('crosshair', 'w-5 h-5 text-purple-400')}
              ${t('challenges') || 'Défis'}
            </button>
            <button onclick="openTeamChallenges(); closeAdminPanel();" class="admin-btn">
              ${icon('user-cog', 'w-5 h-5 text-orange-400')}
              ${t('teamChallenges') || 'Défis Équipe'}
            </button>
            <button onclick="openQuiz(); closeAdminPanel();" class="admin-btn">
              ${icon('brain', 'w-5 h-5 text-amber-400')}
              ${t('quiz') || 'Quiz'}
            </button>
            <button onclick="openLeaderboard(); closeAdminPanel();" class="admin-btn">
              ${icon('trophy', 'w-5 h-5 text-yellow-400')}
              ${t('leaderboard') || 'Classement'}
            </button>
          </div>
        </div>

        <!-- Shop & Rewards -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-emerald-400">
            ${icon('store', 'w-5 h-5 mr-2')}
            ${t('shopRewards') || 'Boutique & Récompenses'}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openShop(); closeAdminPanel();" class="admin-btn">
              ${icon('shopping-cart', 'w-5 h-5 text-emerald-400')}
              ${t('shop') || 'Boutique'}
            </button>
            <button onclick="openMyRewards(); closeAdminPanel();" class="admin-btn">
              ${icon('gift', 'w-5 h-5 text-pink-400')}
              ${t('myRewards') || 'Mes Récompenses'}
            </button>
            <button onclick="openProfileCustomization(); closeAdminPanel();" class="admin-btn">
              ${icon('palette', 'w-5 h-5 text-purple-400')}
              ${t('customization') || 'Personnalisation'}
            </button>
            <button onclick="openStats(); closeAdminPanel();" class="admin-btn">
              ${icon('chart-bar', 'w-5 h-5 text-amber-400')}
              ${t('stats') || 'Statistiques'}
            </button>
          </div>
        </div>

        <!-- Social -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-amber-400">
            ${icon('users', 'w-5 h-5 mr-2')}
            ${t('social') || 'Social'}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openNearbyFriends(); closeAdminPanel();" class="admin-btn">
              ${icon('map-pin', 'w-5 h-5 text-emerald-400')}
              ${t('nearbyFriends') || 'Amis Proches'}
            </button>
            <button onclick="openCreateTravelGroup(); closeAdminPanel();" class="admin-btn">
              ${icon('car', 'w-5 h-5 text-purple-400')}
              ${t('travelGroups') || 'Groupes Voyage'}
            </button>
            <button onclick="changeTab('social'); closeAdminPanel();" class="admin-btn">
              ${icon('messages-square', 'w-5 h-5 text-amber-400')}
              ${t('chat') || 'Chat'}
            </button>
            <button onclick="openReport(); closeAdminPanel();" class="admin-btn">
              ${icon('flag', 'w-5 h-5 text-red-400')}
              ${t('report') || 'Signalement'}
            </button>
          </div>
        </div>

        <!-- Map & Spots -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-primary-400">
            ${icon('map-pinned', 'w-5 h-5 mr-2')}
            ${t('mapSpots') || 'Carte & Spots'}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openAddSpot(); closeAdminPanel();" class="admin-btn">
              ${icon('circle-plus', 'w-5 h-5 text-emerald-400')}
              ${t('addSpot') || 'Ajouter Spot'}
            </button>
            <button onclick="openFilters(); closeAdminPanel();" class="admin-btn">
              ${icon('funnel', 'w-5 h-5 text-purple-400')}
              ${t('filters') || 'Filtres'}
            </button>
            <button onclick="changeTab('travel'); closeAdminPanel();" class="admin-btn">
              ${icon('route', 'w-5 h-5 text-amber-400')}
              ${t('planner') || 'Planificateur'}
            </button>
            <button onclick="openSOS(); closeAdminPanel();" class="admin-btn">
              ${icon('triangle-alert', 'w-5 h-5 text-red-400')}
              ${t('sosMode') || 'Mode SOS'}
            </button>
          </div>
        </div>

        <!-- System -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-slate-400">
            ${icon('settings', 'w-5 h-5 mr-2')}
            ${t('system') || 'Système'}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openAuth(); closeAdminPanel();" class="admin-btn">
              ${icon('log-in', 'w-5 h-5 text-primary-400')}
              ${t('login') || 'Connexion'}
            </button>
            <button onclick="startTutorial(); closeAdminPanel();" class="admin-btn">
              ${icon('graduation-cap', 'w-5 h-5 text-amber-400')}
              ${t('tutorial') || 'Tutoriel'}
            </button>
            <button onclick="openAccessibilityHelp(); closeAdminPanel();" class="admin-btn">
              ${icon('accessibility', 'w-5 h-5 text-amber-400')}
              ${t('accessibility') || 'Accessibilité'}
            </button>
            <button onclick="openDonation(); closeAdminPanel();" class="admin-btn">
              ${icon('heart', 'w-5 h-5 text-pink-400')}
              ${t('donation') || 'Donation'}
            </button>
            <button onclick="adminResetState()" class="admin-btn text-red-400">
              ${icon('trash', 'w-5 h-5')}
              ${t('resetState') || 'Reset State'}
            </button>
            <button onclick="adminExportState()" class="admin-btn">
              ${icon('download', 'w-5 h-5 text-emerald-400')}
              ${t('exportState') || 'Export State'}
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="card p-4">
          <h3 class="font-bold text-sm mb-3 text-slate-400">
            ${icon('compass', 'w-5 h-5 mr-2')}
            ${t('quickNavigation') || 'Navigation Rapide'}
          </h3>
          <div class="flex flex-wrap gap-2">
            <button onclick="changeTab('map'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/30">
              ${t('map') || 'Carte'}
            </button>
            <button onclick="changeTab('travel'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30">
              ${t('travel') || 'Voyage'}
            </button>
            <button onclick="changeTab('challenges'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30">
              ${t('challenges') || 'Défis'}
            </button>
            <button onclick="changeTab('social'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30">
              ${t('social') || 'Social'}
            </button>
            <button onclick="changeTab('profile'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30">
              ${t('profile') || 'Profil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.openAdminPanel = () => setState({ showAdminPanel: true })
window.closeAdminPanel = () => setState({ showAdminPanel: false })

window.adminAddPoints = (amount) => {
  const state = getState();
  setState({
    points: (state.points || 0) + amount,
    totalPoints: (state.totalPoints || 0) + amount
  });
  window.showToast?.(t('pointsAdded')?.replace('{amount}', amount) || `+${amount} 👍 ajoutés`, 'success');
};

window.adminAddSkillPoints = (amount) => {
  const state = getState();
  setState({ skillPoints: (state.skillPoints || 0) + amount });
  window.showToast?.(t('skillPointsAdded')?.replace('{amount}', amount) || `+${amount} skill 👍 ajoutés`, 'success');
};

window.adminAddThumbs = (amount) => {
  const state = getState();
  setState({ thumbs: (state.thumbs || 0) + amount });
  window.showToast?.(t('thumbsAdded')?.replace('{amount}', amount) || `+${amount} pouces ajoutés`, 'success');
};

window.adminLevelUp = () => {
  const state = getState();
  setState({
    level: (state.level || 1) + 1,
    skillPoints: (state.skillPoints || 0) + 3
  });
  window.showToast?.(t('levelReached')?.replace('{level}', (state.level || 1) + 1) || `Niveau ${(state.level || 1) + 1} atteint !`, 'success');
};

window.adminMaxStats = () => {
  setState({
    points: 99999,
    totalPoints: 99999,
    seasonPoints: 5000,
    level: 50,
    skillPoints: 100,
    thumbs: 9999,
    spotsCreated: 50,
    checkins: 100,
    reviewsGiven: 75,
    badges: ['first_spot', 'explorer', 'social', 'veteran', 'helper', 'night_owl', 'early_bird', 'marathon']
  });
  window.showToast?.(t('statsMaxed') || 'Stats maximisées !', 'success');
};

window.adminResetState = () => {
  if (confirm(t('confirmResetState') || 'Réinitialiser toutes les données ?')) {
    localStorage.clear();
    location.reload();
  }
};

window.adminExportState = () => {
  const state = getState();
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spothitch-state-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.showToast?.(t('stateExported') || 'State exporté', 'success');
};

// openDonation is defined in DonationCard.js (accepts amount/type params)
// openSOS — canonical in main.js
// openAddSpot — canonical in main.js
// openFilters defined in main.js (canonical)

export default { renderAdminPanel };
