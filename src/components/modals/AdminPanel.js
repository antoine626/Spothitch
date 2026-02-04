/**
 * Admin Panel Modal
 * Quick access to all app features for testing
 */

import { getState, setState } from '../../stores/state.js';

export function renderAdminPanel(state) {
  return `
    <div class="modal-overlay active" onclick="closeAdminPanel()">
      <div class="modal-content max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <i class="fas fa-shield-alt text-amber-400" aria-hidden="true"></i>
            Panneau Admin
          </h2>
          <button onclick="closeAdminPanel()" class="text-slate-400 hover:text-white">
            <i class="fas fa-times text-xl" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="card p-4 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div class="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div class="font-bold text-amber-400">${state.points || 0}</div>
              <div class="text-xs text-slate-400">Points</div>
            </div>
            <div>
              <div class="font-bold text-emerald-400">${state.level || 1}</div>
              <div class="text-xs text-slate-400">Niveau</div>
            </div>
            <div>
              <div class="font-bold text-purple-400">${state.skillPoints || 0}</div>
              <div class="text-xs text-slate-400">Skill Pts</div>
            </div>
            <div>
              <div class="font-bold text-sky-400">${state.thumbs || 0}</div>
              <div class="text-xs text-slate-400">Pouces</div>
            </div>
          </div>
        </div>

        <!-- Add Points/Resources -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-amber-400">
            <i class="fas fa-coins mr-2" aria-hidden="true"></i>
            Ressources
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="adminAddPoints(100)" class="btn-secondary text-sm py-2">
              +100 Points
            </button>
            <button onclick="adminAddPoints(1000)" class="btn-secondary text-sm py-2">
              +1000 Points
            </button>
            <button onclick="adminAddSkillPoints(5)" class="btn-secondary text-sm py-2">
              +5 Skill Points
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
            <i class="fas fa-gamepad mr-2" aria-hidden="true"></i>
            Gamification
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openBadges(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-medal text-amber-400" aria-hidden="true"></i>
              Badges
            </button>
            <button onclick="openChallenges(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-bullseye text-purple-400" aria-hidden="true"></i>
              Défis
            </button>
            <button onclick="openTeamChallenges(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-users-cog text-orange-400" aria-hidden="true"></i>
              Défis Équipe
            </button>
            <button onclick="openSkillTree(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-tree text-emerald-400" aria-hidden="true"></i>
              Skill Tree
            </button>
            <button onclick="openQuiz(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-brain text-sky-400" aria-hidden="true"></i>
              Quiz
            </button>
            <button onclick="openLeaderboard(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-trophy text-yellow-400" aria-hidden="true"></i>
              Classement
            </button>
          </div>
        </div>

        <!-- Shop & Rewards -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-emerald-400">
            <i class="fas fa-store mr-2" aria-hidden="true"></i>
            Boutique & Récompenses
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openShop(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-shopping-cart text-emerald-400" aria-hidden="true"></i>
              Boutique
            </button>
            <button onclick="openMyRewards(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-gift text-pink-400" aria-hidden="true"></i>
              Mes Récompenses
            </button>
            <button onclick="openProfileCustomization(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-palette text-purple-400" aria-hidden="true"></i>
              Personnalisation
            </button>
            <button onclick="openStats(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-chart-bar text-sky-400" aria-hidden="true"></i>
              Statistiques
            </button>
          </div>
        </div>

        <!-- Social -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-sky-400">
            <i class="fas fa-users mr-2" aria-hidden="true"></i>
            Social
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openNearbyFriends(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-location-dot text-emerald-400" aria-hidden="true"></i>
              Amis Proches
            </button>
            <button onclick="openCreateTravelGroup(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-car text-purple-400" aria-hidden="true"></i>
              Groupes Voyage
            </button>
            <button onclick="changeTab('social'); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-comments text-sky-400" aria-hidden="true"></i>
              Chat
            </button>
            <button onclick="openReport(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-flag text-red-400" aria-hidden="true"></i>
              Signalement
            </button>
          </div>
        </div>

        <!-- Map & Spots -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-primary-400">
            <i class="fas fa-map-marked-alt mr-2" aria-hidden="true"></i>
            Carte & Spots
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openAddSpot(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-plus-circle text-emerald-400" aria-hidden="true"></i>
              Ajouter Spot
            </button>
            <button onclick="openFilters(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-filter text-purple-400" aria-hidden="true"></i>
              Filtres
            </button>
            <button onclick="changeTab('travel'); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-route text-amber-400" aria-hidden="true"></i>
              Planificateur
            </button>
            <button onclick="openSOS(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-exclamation-triangle text-red-400" aria-hidden="true"></i>
              Mode SOS
            </button>
          </div>
        </div>

        <!-- System -->
        <div class="card p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-slate-400">
            <i class="fas fa-cog mr-2" aria-hidden="true"></i>
            Système
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openAuth(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-sign-in-alt text-primary-400" aria-hidden="true"></i>
              Connexion
            </button>
            <button onclick="startTutorial(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-graduation-cap text-amber-400" aria-hidden="true"></i>
              Tutoriel
            </button>
            <button onclick="openAccessibilityHelp(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-universal-access text-sky-400" aria-hidden="true"></i>
              Accessibilité
            </button>
            <button onclick="openDonation(); closeAdminPanel();" class="admin-btn">
              <i class="fas fa-heart text-pink-400" aria-hidden="true"></i>
              Donation
            </button>
            <button onclick="adminResetState()" class="admin-btn text-red-400">
              <i class="fas fa-trash-alt" aria-hidden="true"></i>
              Reset State
            </button>
            <button onclick="adminExportState()" class="admin-btn">
              <i class="fas fa-download text-emerald-400" aria-hidden="true"></i>
              Export State
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="card p-4">
          <h3 class="font-bold text-sm mb-3 text-slate-400">
            <i class="fas fa-compass mr-2" aria-hidden="true"></i>
            Navigation Rapide
          </h3>
          <div class="flex flex-wrap gap-2">
            <button onclick="changeTab('map'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/30">
              Carte
            </button>
            <button onclick="changeTab('travel'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30">
              Voyage
            </button>
            <button onclick="changeTab('challenges'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30">
              Défis
            </button>
            <button onclick="changeTab('social'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-sky-500/20 text-sky-400 text-sm hover:bg-sky-500/30">
              Social
            </button>
            <button onclick="changeTab('profile'); closeAdminPanel();" class="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30">
              Profil
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
window.openAdminPanel = () => setState({ showAdminPanel: true });
window.closeAdminPanel = () => setState({ showAdminPanel: false });

window.adminAddPoints = (amount) => {
  const state = getState();
  setState({
    points: (state.points || 0) + amount,
    totalPoints: (state.totalPoints || 0) + amount
  });
  window.showToast?.(`+${amount} points ajoutés`, 'success');
};

window.adminAddSkillPoints = (amount) => {
  const state = getState();
  setState({ skillPoints: (state.skillPoints || 0) + amount });
  window.showToast?.(`+${amount} skill points ajoutés`, 'success');
};

window.adminAddThumbs = (amount) => {
  const state = getState();
  setState({ thumbs: (state.thumbs || 0) + amount });
  window.showToast?.(`+${amount} pouces ajoutés`, 'success');
};

window.adminLevelUp = () => {
  const state = getState();
  setState({
    level: (state.level || 1) + 1,
    skillPoints: (state.skillPoints || 0) + 3
  });
  window.showToast?.(`Niveau ${(state.level || 1) + 1} atteint !`, 'success');
};

window.adminMaxStats = () => {
  setState({
    points: 99999,
    totalPoints: 99999,
    seasonPoints: 5000,
    level: 50,
    skillPoints: 100,
    thumbs: 9999,
    streak: 30,
    spotsCreated: 50,
    checkins: 100,
    reviewsGiven: 75,
    badges: ['first_spot', 'explorer', 'social', 'veteran', 'helper', 'night_owl', 'early_bird', 'marathon', 'streak_7', 'streak_30']
  });
  window.showToast?.('Stats maximisées !', 'success');
};

window.adminResetState = () => {
  if (confirm('Réinitialiser toutes les données ?')) {
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
  window.showToast?.('State exporté', 'success');
};

window.openReport = () => setState({ showReport: true });
window.openDonation = () => setState({ showDonation: true });
window.openSOS = () => setState({ showSOS: true });
window.openAddSpot = () => setState({ showAddSpot: true });
window.openFilters = () => setState({ showFilters: true });

export default { renderAdminPanel };
