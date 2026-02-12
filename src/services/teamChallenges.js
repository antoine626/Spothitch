/**
 * Team Challenges Service
 * Group challenges and collaborative goals
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints, addSeasonPoints } from './gamification.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// Team challenge types
export const TEAM_CHALLENGE_TYPES = {
  COLLECTIVE_DISTANCE: {
    id: 'collective_distance',
    name: t('teamChallengeCollectiveDistanceName') || 'Distance collective',
    description: t('teamChallengeCollectiveDistanceDesc') || 'Parcourez ensemble une distance',
    icon: 'fa-road',
    color: 'from-blue-500 to-cyan-400',
  },
  SPOT_VALIDATION: {
    id: 'spot_validation',
    name: t('teamChallengeSpotValidationName') || 'Validation communautaire',
    description: t('teamChallengeSpotValidationDesc') || 'Validez des spots ensemble',
    icon: 'fa-check-double',
    color: 'from-emerald-500 to-green-400',
  },
  COUNTRY_EXPLORATION: {
    id: 'country_exploration',
    name: t('teamChallengeCountryExplorationName') || 'Exploration de pays',
    description: t('teamChallengeCountryExplorationDesc') || 'Explorez de nouveaux pays',
    icon: 'fa-globe',
    color: 'from-purple-500 to-pink-400',
  },
  PHOTO_CHALLENGE: {
    id: 'photo_challenge',
    name: t('teamChallengePhotoChallengeName') || 'Défi photo',
    description: t('teamChallengePhotoChallengeDesc') || 'Partagez des photos de spots',
    icon: 'fa-camera',
    color: 'from-amber-500 to-orange-400',
  },
  REVIEW_MARATHON: {
    id: 'review_marathon',
    name: t('teamChallengeReviewMarathonName') || 'Marathon d\'avis',
    description: t('teamChallengeReviewMarathonDesc') || 'Laissez des avis détaillés',
    icon: 'fa-star',
    color: 'from-yellow-500 to-amber-400',
  },
};

// Sample team challenges
export const TEAM_CHALLENGES = [
  {
    id: 'team_1',
    type: 'collective_distance',
    name: t('teamChallenge1Name') || 'Tour de France en stop',
    description: t('teamChallenge1Desc') || 'L\'équipe doit cumuler 2000km en auto-stop',
    target: 2000,
    unit: 'km',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    rewards: {
      points: 500,
      badge: 'team_traveler',
      title: t('teamChallenge1Title') || 'Explorateurs Unis',
    },
    minMembers: 3,
    maxMembers: 10,
  },
  {
    id: 'team_2',
    type: 'spot_validation',
    name: t('teamChallenge2Name') || 'Validateurs',
    description: t('teamChallenge2Desc') || 'Validez 50 spots existants',
    target: 50,
    unit: 'spots',
    startDate: '2025-01-01',
    endDate: '2025-01-15',
    rewards: {
      points: 300,
      badge: 'quality_team',
      title: t('teamChallenge2Title') || 'Gardiens de la Qualité',
    },
    minMembers: 2,
    maxMembers: 5,
  },
  {
    id: 'team_3',
    type: 'country_exploration',
    name: t('teamChallenge3Name') || 'Eurotour',
    description: t('teamChallenge3Desc') || 'Visitez 10 pays différents en équipe',
    target: 10,
    unit: t('teamChallenge3Unit') || 'pays',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    rewards: {
      points: 1000,
      badge: 'eurotour',
      title: t('teamChallenge3Title') || 'Citoyens d\'Europe',
    },
    minMembers: 4,
    maxMembers: 8,
  },
];

/**
 * Create a new team
 * @param {Object} teamData
 * @returns {Object} The created team
 */
export function createTeam(teamData) {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId) {
    showToast(t('teamCreateLoginRequired') || 'Connecte-toi pour créer une équipe', 'error');
    return null;
  }

  const team = {
    id: `team_${Date.now()}`,
    name: teamData.name,
    description: teamData.description || '',
    avatar: teamData.avatar || '👥',
    leader: userId,
    members: [userId],
    createdAt: new Date().toISOString(),
    stats: {
      totalDistance: 0,
      spotsValidated: 0,
      countriesVisited: [],
      photosShared: 0,
      reviewsWritten: 0,
    },
    activeChallenges: [],
    completedChallenges: [],
  };

  // Save team
  const teams = state.teams || [];
  teams.push(team);

  setState({
    teams,
    currentTeam: team,
    myTeamId: team.id,
  });

  showToast((t('teamCreated') || 'Équipe "{name}" créée !').replace('{name}', team.name), 'success');
  return team;
}

/**
 * Join an existing team
 * @param {string} teamId
 * @returns {boolean}
 */
export function joinTeam(teamId) {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId) {
    showToast(t('teamJoinLoginRequired') || 'Connecte-toi pour rejoindre une équipe', 'error');
    return false;
  }

  const teams = state.teams || [];
  const teamIndex = teams.findIndex((t) => t.id === teamId);

  if (teamIndex === -1) {
    showToast(t('teamNotFound') || 'Équipe introuvable', 'error');
    return false;
  }

  const team = teams[teamIndex];

  if (team.members.includes(userId)) {
    showToast(t('teamAlreadyMember') || 'Tu es déjà dans cette équipe', 'warning');
    return false;
  }

  // Check team size
  if (team.members.length >= 10) {
    showToast(t('teamFull') || 'Cette équipe est complète', 'error');
    return false;
  }

  // Add member
  team.members.push(userId);
  teams[teamIndex] = team;

  setState({
    teams,
    currentTeam: team,
    myTeamId: team.id,
  });

  showToast((t('teamJoined') || 'Tu as rejoint l\'équipe "{name}" !').replace('{name}', team.name), 'success');
  return true;
}

/**
 * Leave current team
 * @returns {boolean}
 */
export function leaveTeam() {
  const state = getState();
  const userId = state.user?.uid;
  const teamId = state.myTeamId;

  if (!teamId) {
    showToast(t('teamNotInAny') || 'Tu n\'es dans aucune équipe', 'warning');
    return false;
  }

  const teams = state.teams || [];
  const teamIndex = teams.findIndex((t) => t.id === teamId);

  if (teamIndex === -1) return false;

  const team = teams[teamIndex];

  // Check if user is the leader
  if (team.leader === userId && team.members.length > 1) {
    // Transfer leadership
    team.leader = team.members.find((m) => m !== userId);
  }

  // Remove member
  team.members = team.members.filter((m) => m !== userId);

  // If no members left, delete team
  if (team.members.length === 0) {
    teams.splice(teamIndex, 1);
  } else {
    teams[teamIndex] = team;
  }

  setState({
    teams,
    currentTeam: null,
    myTeamId: null,
  });

  showToast(t('teamLeft') || 'Tu as quitté l\'équipe', 'info');
  return true;
}

/**
 * Start a team challenge
 * @param {string} challengeId
 * @returns {boolean}
 */
export function startTeamChallenge(challengeId) {
  const state = getState();
  const teamId = state.myTeamId;

  if (!teamId) {
    showToast(t('teamChallengeJoinFirst') || 'Rejoins une équipe d\'abord', 'warning');
    return false;
  }

  const teams = state.teams || [];
  const teamIndex = teams.findIndex((t) => t.id === teamId);

  if (teamIndex === -1) return false;

  const team = teams[teamIndex];
  const challenge = TEAM_CHALLENGES.find((c) => c.id === challengeId);

  if (!challenge) {
    showToast(t('challengeNotFound') || 'Défi introuvable', 'error');
    return false;
  }

  // Check minimum members
  if (team.members.length < challenge.minMembers) {
    showToast(
      (t('teamChallengeMinMembers') || 'Il faut au moins {min} membres pour ce défi').replace('{min}', challenge.minMembers),
      'warning'
    );
    return false;
  }

  // Check if already active
  if (team.activeChallenges.some((c) => c.id === challengeId)) {
    showToast(t('teamChallengeAlreadyActive') || 'Ce défi est déjà en cours', 'warning');
    return false;
  }

  // Add challenge
  team.activeChallenges.push({
    ...challenge,
    progress: 0,
    startedAt: new Date().toISOString(),
    contributions: {},
  });

  teams[teamIndex] = team;
  setState({ teams, currentTeam: team });

  showToast((t('teamChallengeStarted') || 'Défi "{name}" lancé !').replace('{name}', challenge.name), 'success');
  return true;
}

/**
 * Contribute to a team challenge
 * @param {string} challengeId
 * @param {number} amount
 * @param {string} type - Type of contribution
 * @returns {boolean}
 */
export function contributeToChallenge(challengeId, amount, type) {
  const state = getState();
  const userId = state.user?.uid;
  const teamId = state.myTeamId;

  if (!teamId || !userId) return false;

  const teams = state.teams || [];
  const teamIndex = teams.findIndex((t) => t.id === teamId);

  if (teamIndex === -1) return false;

  const team = teams[teamIndex];
  const challengeIndex = team.activeChallenges.findIndex(
    (c) => c.id === challengeId
  );

  if (challengeIndex === -1) return false;

  const challenge = team.activeChallenges[challengeIndex];

  // Update progress
  challenge.progress = Math.min(challenge.progress + amount, challenge.target);

  // Track individual contribution
  if (!challenge.contributions[userId]) {
    challenge.contributions[userId] = 0;
  }
  challenge.contributions[userId] += amount;

  // Check if completed
  if (challenge.progress >= challenge.target) {
    completeTeamChallenge(team, challengeIndex);
  }

  team.activeChallenges[challengeIndex] = challenge;
  teams[teamIndex] = team;

  setState({ teams, currentTeam: team });
  return true;
}

/**
 * Complete a team challenge
 * @param {Object} team
 * @param {number} challengeIndex
 */
function completeTeamChallenge(team, challengeIndex) {
  const challenge = team.activeChallenges[challengeIndex];

  // Move to completed
  team.completedChallenges.push({
    ...challenge,
    completedAt: new Date().toISOString(),
  });

  // Remove from active
  team.activeChallenges.splice(challengeIndex, 1);

  // Award rewards to all members
  const state = getState();
  const pointsPerMember = Math.floor(
    challenge.rewards.points / team.members.length
  );

  team.members.forEach((memberId) => {
    // Award points (only for current user)
    if (memberId === state.user?.uid) {
      addPoints(pointsPerMember);
      addSeasonPoints(Math.floor(pointsPerMember / 2));
    }
  });

  showToast(
    (t('teamChallengeCompleted') || '🎉 Défi d\'équipe "{name}" terminé ! +{points} points')
      .replace('{name}', challenge.name)
      .replace('{points}', pointsPerMember),
    'success'
  );
}

/**
 * Get team leaderboard
 * @returns {Array}
 */
export function getTeamLeaderboard() {
  const state = getState();
  const teams = state.teams || [];

  return teams
    .map((team) => ({
      id: team.id,
      name: team.name,
      avatar: team.avatar,
      members: team.members.length,
      challengesCompleted: team.completedChallenges?.length || 0,
      totalDistance: team.stats?.totalDistance || 0,
      score:
        (team.completedChallenges?.length || 0) * 100 +
        (team.stats?.totalDistance || 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

/**
 * Render team dashboard
 * @param {Object} state
 * @returns {string}
 */
export function renderTeamDashboard(state) {
  const team = state.currentTeam;

  if (!team) {
    return renderNoTeam(state);
  }

  const activeChallenges = team.activeChallenges || [];
  const typeInfo = TEAM_CHALLENGE_TYPES;

  return `
    <div class="team-dashboard p-4 space-y-6">
      <!-- Team Header -->
      <div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-3xl">
            ${team.avatar}
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-white">${team.name}</h2>
            <p class="text-white/70">${team.members.length} ${(t('teamMembers') || 'membre{s}').replace('{s}', team.members.length > 1 ? 's' : '')}</p>
          </div>
          <button
            onclick="openTeamSettings()"
            class="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="${t('teamSettingsLabel') || 'Paramètres de l\'équipe'}"
          >
            ${icon('cog', 'w-5 h-5')}
          </button>
        </div>
      </div>

      <!-- Team Stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-dark-card rounded-xl p-4">
          <div class="text-2xl font-bold text-primary-400">${team.stats?.totalDistance || 0}</div>
          <div class="text-sm text-slate-400">${t('teamStatKmTraveled') || 'km parcourus'}</div>
        </div>
        <div class="bg-dark-card rounded-xl p-4">
          <div class="text-2xl font-bold text-emerald-400">${team.stats?.spotsValidated || 0}</div>
          <div class="text-sm text-slate-400">${t('teamStatSpotsValidated') || 'spots validés'}</div>
        </div>
        <div class="bg-dark-card rounded-xl p-4">
          <div class="text-2xl font-bold text-purple-400">${team.stats?.countriesVisited?.length || 0}</div>
          <div class="text-sm text-slate-400">${t('teamStatCountriesVisited') || 'pays visités'}</div>
        </div>
        <div class="bg-dark-card rounded-xl p-4">
          <div class="text-2xl font-bold text-amber-400">${team.completedChallenges?.length || 0}</div>
          <div class="text-sm text-slate-400">${t('teamStatChallengesCompleted') || 'défis terminés'}</div>
        </div>
      </div>

      <!-- Active Challenges -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-lg">${t('teamActiveChallenges') || 'Défis actifs'}</h3>
          <button
            onclick="openTeamChallengesList()"
            class="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            ${t('teamViewAllChallenges') || 'Voir tous les défis'} →
          </button>
        </div>

        ${
  activeChallenges.length > 0
    ? `
          <div class="space-y-3">
            ${activeChallenges
    .map((challenge) => {
      const type = typeInfo[challenge.type.toUpperCase()] || {};
      const progress = Math.min(
        (challenge.progress / challenge.target) * 100,
        100
      );
      return `
                <div class="bg-dark-card rounded-xl p-4">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${type.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white">
                      ${icon(type.icon || 'fa-flag', 'w-5 h-5')}
                    </div>
                    <div class="flex-1">
                      <div class="font-medium">${challenge.name}</div>
                      <div class="text-xs text-slate-400">${challenge.description}</div>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-slate-400">${t('teamChallengeProgress') || 'Progression'}</span>
                      <span class="font-medium">${challenge.progress}/${challenge.target} ${challenge.unit}</span>
                    </div>
                    <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r ${type.color || 'from-primary-500 to-primary-400'} rounded-full transition-all"
                        style="width: ${progress}%"
                      ></div>
                    </div>
                  </div>
                </div>
              `;
    })
    .join('')}
          </div>
        `
    : `
          <div class="text-center py-8 text-slate-400">
            ${icon('flag', 'w-8 h-8 mb-2')}
            <p>${t('teamNoActiveChallenges') || 'Aucun défi actif'}</p>
            <button
              onclick="openTeamChallengesList()"
              class="btn btn-primary mt-4"
            >
              ${t('teamStartChallenge') || 'Commencer un défi'}
            </button>
          </div>
        `
}
      </div>

      <!-- Members -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-lg">${t('teamMembersTitle') || 'Membres'}</h3>
          <button
            onclick="inviteToTeam()"
            class="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            ${icon('user-plus', 'w-5 h-5 mr-1')}
            ${t('teamInvite') || 'Inviter'}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          ${team.members
    .map(
      (memberId) => `
            <div class="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-full text-sm">
              <span class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-xs">👤</span>
              <span>${memberId === team.leader ? '👑 ' : ''}${t('teamMember') || 'Membre'}</span>
            </div>
          `
    )
    .join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render no team state
 * @param {Object} state
 * @returns {string}
 */
function renderNoTeam(state) {
  return `
    <div class="p-4 space-y-6">
      <div class="text-center py-12">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
          ${icon('users', 'w-10 h-10 text-primary-400')}
        </div>
        <h2 class="text-xl font-bold mb-2">${t('teamJoinTitle') || 'Rejoins une équipe !'}</h2>
        <p class="text-slate-400 mb-6">
          ${t('teamJoinSubtitle') || 'Relève des défis collectifs et gagne des récompenses exclusives'}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button onclick="openCreateTeam()" class="btn btn-primary">
            ${icon('plus', 'w-5 h-5 mr-2')}
            ${t('teamCreateButton') || 'Créer une équipe'}
          </button>
          <button onclick="openJoinTeam()" class="btn btn-ghost">
            ${icon('search', 'w-5 h-5 mr-2')}
            ${t('teamFindButton') || 'Trouver une équipe'}
          </button>
        </div>
      </div>

      <!-- Featured Challenges -->
      <div>
        <h3 class="font-semibold text-lg mb-4">${t('teamAvailableChallenges') || 'Défis d\'équipe disponibles'}</h3>
        <div class="space-y-3">
          ${TEAM_CHALLENGES.slice(0, 3)
    .map((challenge) => {
      const type =
                TEAM_CHALLENGE_TYPES[challenge.type.toUpperCase()] || {};
      return `
            <div class="bg-dark-card rounded-xl p-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${type.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white text-xl">
                  ${icon(type.icon || 'fa-flag', 'w-5 h-5')}
                </div>
                <div class="flex-1">
                  <div class="font-medium">${challenge.name}</div>
                  <div class="text-sm text-slate-400">${challenge.description}</div>
                  <div class="text-xs text-primary-400 mt-1">
                    ${icon('gift', 'w-5 h-5 mr-1')}
                    ${challenge.rewards.points} ${t('points') || 'points'}
                  </div>
                </div>
              </div>
            </div>
          `;
    })
    .join('')}
        </div>
      </div>
    </div>
  `;
}

// Global handlers
window.openCreateTeam = () => setState({ showCreateTeam: true });
window.openJoinTeam = () => setState({ showJoinTeam: true });
window.openTeamSettings = () => setState({ showTeamSettings: true });
window.openTeamChallengesList = () => setState({ showTeamChallenges: true });
window.inviteToTeam = () => {
  const state = getState();
  const teamId = state.myTeamId;
  if (teamId) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?join=${teamId}`;
    if (navigator.share) {
      navigator.share({
        title: t('teamInviteShareTitle') || 'Rejoins mon équipe sur SpotHitch !',
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast(t('teamInviteLinkCopied') || 'Lien d\'invitation copié !', 'success');
    }
  }
};

export default {
  TEAM_CHALLENGE_TYPES,
  TEAM_CHALLENGES,
  createTeam,
  joinTeam,
  leaveTeam,
  startTeamChallenge,
  contributeToChallenge,
  getTeamLeaderboard,
  renderTeamDashboard,
};
