/**
 * Friend Challenges Service
 * Create and manage challenges between friends
 * Feature #157
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';
import { t } from '../i18n/index.js';

/**
 * Challenge types available
 */
export const challengeTypes = [
  {
    id: 'checkins_race',
    name: t('friendChallengeCheckinsRaceName') || 'Course aux Check-ins',
    nameEn: 'Check-in Race',
    description: t('friendChallengeCheckinsRaceDesc') || 'Le premier a faire X check-ins gagne',
    descriptionEn: 'First to complete X check-ins wins',
    icon: '🏁',
    metric: 'checkins',
    defaultTarget: 10,
    minTarget: 5,
    maxTarget: 50,
    rewardPoints: 100,
  },
  {
    id: 'spots_discovery',
    name: t('friendChallengeSpotsDiscoveryName') || 'Decouverte de Spots',
    nameEn: 'Spot Discovery',
    description: t('friendChallengeSpotsDiscoveryDesc') || 'Le premier a visiter X nouveaux spots gagne',
    descriptionEn: 'First to visit X new spots wins',
    icon: '🗺️',
    metric: 'spotsVisited',
    defaultTarget: 5,
    minTarget: 3,
    maxTarget: 20,
    rewardPoints: 150,
  },
  {
    id: 'countries_explored',
    name: t('friendChallengeCountriesExploredName') || 'Tour d\'Europe',
    nameEn: 'World Tour',
    description: t('friendChallengeCountriesExploredDesc') || 'Le premier a visiter X pays gagne',
    descriptionEn: 'First to visit X countries wins',
    icon: '🌍',
    metric: 'countriesVisited',
    defaultTarget: 3,
    minTarget: 2,
    maxTarget: 10,
    rewardPoints: 300,
  },
  {
    id: 'reviews_battle',
    name: t('friendChallengeReviewsBattleName') || 'Bataille d\'Avis',
    nameEn: 'Review Battle',
    description: t('friendChallengeReviewsBattleDesc') || 'Le premier a donner X avis gagne',
    descriptionEn: 'First to give X reviews wins',
    icon: '✍️',
    metric: 'reviewsGiven',
    defaultTarget: 10,
    minTarget: 5,
    maxTarget: 30,
    rewardPoints: 120,
  },
  {
    id: 'distance_race',
    name: t('friendChallengeDistanceRaceName') || 'Course aux Kilometres',
    nameEn: 'Distance Race',
    description: t('friendChallengeDistanceRaceDesc') || 'Le premier a parcourir X km en autostop gagne',
    descriptionEn: 'First to travel X km hitchhiking wins',
    icon: '🚗',
    metric: 'totalDistance',
    defaultTarget: 500,
    minTarget: 100,
    maxTarget: 2000,
    rewardPoints: 250,
  },
  {
    id: 'night_hitchhiker',
    name: t('friendChallengeNightHitchhikerName') || 'Autostoppeur Nocturne',
    nameEn: 'Night Hitchhiker',
    description: t('friendChallengeNightHitchhikerDesc') || 'Le premier a faire X check-ins de nuit gagne',
    descriptionEn: 'First to complete X night check-ins wins',
    icon: '🌙',
    metric: 'nightCheckins',
    defaultTarget: 3,
    minTarget: 1,
    maxTarget: 10,
    rewardPoints: 180,
  },
];

/**
 * Challenge status enum
 */
export const ChallengeStatus = {
  PENDING: 'pending', // Waiting for friend to accept
  ACTIVE: 'active', // Challenge is ongoing
  COMPLETED: 'completed', // Someone won
  EXPIRED: 'expired', // Time limit reached
  DECLINED: 'declined', // Friend declined
  CANCELLED: 'cancelled', // Creator cancelled
};

/**
 * Create a new challenge
 * @param {string} friendId - Friend's user ID
 * @param {string} challengeTypeId - Type of challenge
 * @param {number} target - Target to reach
 * @param {number} durationDays - Duration in days (default 7)
 * @returns {Object} Created challenge
 */
export function createChallenge(friendId, challengeTypeId, target, durationDays = 7) {
  const state = getState();
  const challengeType = challengeTypes.find(c => c.id === challengeTypeId);

  if (!challengeType) {
    showToast(t('friendChallengeInvalidType') || 'Type de defi invalide', 'error');
    return null;
  }

  // Validate target
  const validTarget = Math.max(
    challengeType.minTarget,
    Math.min(challengeType.maxTarget, target || challengeType.defaultTarget)
  );

  const challenge = {
    id: `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: challengeTypeId,
    creatorId: state.user?.uid || 'local',
    creatorName: state.username || t('me') || 'Moi',
    friendId,
    friendName: getFriendName(friendId),
    target: validTarget,
    creatorProgress: 0,
    friendProgress: 0,
    status: ChallengeStatus.PENDING,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
    winnerId: null,
    rewardPoints: challengeType.rewardPoints,
  };

  // Add to state
  const challenges = state.friendChallenges || [];
  setState({
    friendChallenges: [...challenges, challenge],
  });

  showToast((t('friendChallengeSent') || 'Defi envoye a {name} !').replace('{name}', challenge.friendName), 'success');
  return challenge;
}

/**
 * Accept a challenge
 * @param {string} challengeId - Challenge ID
 */
export function acceptChallenge(challengeId) {
  const state = getState();
  const challenges = state.friendChallenges || [];
  const index = challenges.findIndex(c => c.id === challengeId);

  if (index === -1) {
    showToast(t('challengeNotFound') || 'Defi introuvable', 'error');
    return false;
  }

  const challenge = challenges[index];
  if (challenge.status !== ChallengeStatus.PENDING) {
    showToast(t('friendChallengeNotPending') || 'Ce defi n\'est plus en attente', 'error');
    return false;
  }

  challenges[index] = {
    ...challenge,
    status: ChallengeStatus.ACTIVE,
    startedAt: new Date().toISOString(),
  };

  setState({ friendChallenges: [...challenges] });
  showToast(t('friendChallengeAccepted') || 'Defi accepte ! Que le meilleur gagne !', 'success');
  return true;
}

/**
 * Decline a challenge
 * @param {string} challengeId - Challenge ID
 */
export function declineChallenge(challengeId) {
  const state = getState();
  const challenges = state.friendChallenges || [];
  const index = challenges.findIndex(c => c.id === challengeId);

  if (index === -1) return false;

  challenges[index] = {
    ...challenges[index],
    status: ChallengeStatus.DECLINED,
  };

  setState({ friendChallenges: [...challenges] });
  showToast(t('friendChallengeDeclined') || 'Defi decline', 'info');
  return true;
}

/**
 * Cancel a challenge (creator only)
 * @param {string} challengeId - Challenge ID
 */
export function cancelChallenge(challengeId) {
  const state = getState();
  const challenges = state.friendChallenges || [];
  const index = challenges.findIndex(c => c.id === challengeId);

  if (index === -1) return false;

  const challenge = challenges[index];
  if (challenge.creatorId !== (state.user?.uid || 'local')) {
    showToast(t('friendChallengeCreatorOnly') || 'Seul le createur peut annuler ce defi', 'error');
    return false;
  }

  challenges[index] = {
    ...challenge,
    status: ChallengeStatus.CANCELLED,
  };

  setState({ friendChallenges: [...challenges] });
  showToast(t('friendChallengeCancelled') || 'Defi annule', 'info');
  return true;
}

/**
 * Update challenge progress
 * @param {string} challengeId - Challenge ID
 * @param {string} participantId - 'creator' or 'friend'
 * @param {number} progress - New progress value
 */
export function updateChallengeProgress(challengeId, participantId, progress) {
  const state = getState();
  const challenges = state.friendChallenges || [];
  const index = challenges.findIndex(c => c.id === challengeId);

  if (index === -1) return false;

  const challenge = challenges[index];
  if (challenge.status !== ChallengeStatus.ACTIVE) return false;

  const progressKey = participantId === 'creator' ? 'creatorProgress' : 'friendProgress';
  const newProgress = Math.max(0, progress);

  challenges[index] = {
    ...challenge,
    [progressKey]: newProgress,
  };

  // Check if someone won
  if (newProgress >= challenge.target) {
    challenges[index].status = ChallengeStatus.COMPLETED;
    challenges[index].winnerId = participantId === 'creator' ? challenge.creatorId : challenge.friendId;
    challenges[index].completedAt = new Date().toISOString();

    // Award points to winner
    const isWinner = participantId === 'creator'
      ? challenge.creatorId === (state.user?.uid || 'local')
      : challenge.friendId === (state.user?.uid || 'local');

    if (isWinner) {
      addPoints(challenge.rewardPoints, 'friend_challenge_won');
      showToast((t('friendChallengeWon') || 'Tu as gagne le defi ! +{points} points').replace('{points}', challenge.rewardPoints), 'success');
    } else {
      showToast(t('friendChallengeLost') || 'Ton ami a gagne le defi !', 'info');
    }
  }

  setState({ friendChallenges: [...challenges] });
  return true;
}

/**
 * Auto-update progress based on user stats
 */
export function syncChallengeProgress() {
  const state = getState();
  const challenges = state.friendChallenges || [];
  const userId = state.user?.uid || 'local';

  let updated = false;

  challenges.forEach((challenge, index) => {
    if (challenge.status !== ChallengeStatus.ACTIVE) return;

    // Check expiration
    if (new Date(challenge.expiresAt) < new Date()) {
      challenges[index] = {
        ...challenge,
        status: ChallengeStatus.EXPIRED,
      };
      updated = true;
      return;
    }

    // Update progress based on challenge type
    const challengeType = challengeTypes.find(c => c.id === challenge.type);
    if (!challengeType) return;

    const isCreator = challenge.creatorId === userId;
    const currentProgress = isCreator ? challenge.creatorProgress : challenge.friendProgress;
    let newProgress = currentProgress;

    // Get metric from state
    switch (challengeType.metric) {
      case 'checkins':
        newProgress = state.checkins || 0;
        break;
      case 'spotsVisited':
        newProgress = (state.visitedSpots || []).length;
        break;
      case 'countriesVisited':
        newProgress = state.countriesVisited || 0;
        break;
      case 'reviewsGiven':
        newProgress = state.reviewsGiven || 0;
        break;
      case 'totalDistance':
        newProgress = state.totalDistance || 0;
        break;
      case 'nightCheckins':
        newProgress = state.nightCheckins || 0;
        break;
    }

    if (newProgress !== currentProgress) {
      updateChallengeProgress(challenge.id, isCreator ? 'creator' : 'friend', newProgress);
      updated = true;
    }
  });

  if (updated) {
    setState({ friendChallenges: [...challenges] });
  }
}

/**
 * Get active challenges
 * @returns {Object[]} Active challenges
 */
export function getActiveChallenges() {
  const state = getState();
  return (state.friendChallenges || []).filter(c => c.status === ChallengeStatus.ACTIVE);
}

/**
 * Get pending challenges (sent or received)
 * @returns {Object[]} Pending challenges
 */
export function getPendingChallenges() {
  const state = getState();
  return (state.friendChallenges || []).filter(c => c.status === ChallengeStatus.PENDING);
}

/**
 * Get completed challenges
 * @returns {Object[]} Completed challenges
 */
export function getCompletedChallenges() {
  const state = getState();
  return (state.friendChallenges || []).filter(c => c.status === ChallengeStatus.COMPLETED);
}

/**
 * Get challenge statistics
 * @returns {Object} Stats object
 */
export function getChallengeStats() {
  const state = getState();
  const challenges = state.friendChallenges || [];
  const userId = state.user?.uid || 'local';

  const completed = challenges.filter(c => c.status === ChallengeStatus.COMPLETED);
  const wins = completed.filter(c => c.winnerId === userId).length;
  const losses = completed.filter(c => c.winnerId && c.winnerId !== userId).length;

  return {
    total: challenges.length,
    active: challenges.filter(c => c.status === ChallengeStatus.ACTIVE).length,
    pending: challenges.filter(c => c.status === ChallengeStatus.PENDING).length,
    completed: completed.length,
    wins,
    losses,
    winRate: completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0,
  };
}

/**
 * Get all challenge types
 * @returns {Object[]} Challenge types
 */
export function getChallengeTypes() {
  return challengeTypes;
}

/**
 * Helper to get friend name from ID
 * @param {string} friendId - Friend ID
 * @returns {string} Friend name
 */
function getFriendName(friendId) {
  const state = getState();
  const friend = (state.friends || []).find(f => f.id === friendId);
  return friend?.name || friend?.username || t('friend') || 'Ami';
}

/**
 * Render challenge card HTML
 * @param {Object} challenge - Challenge object
 * @returns {string} HTML string
 */
export function renderChallengeCard(challenge) {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const challengeType = challengeTypes.find(c => c.id === challenge.type);
  const isCreator = challenge.creatorId === userId;
  const myProgress = isCreator ? challenge.creatorProgress : challenge.friendProgress;
  const opponentProgress = isCreator ? challenge.friendProgress : challenge.creatorProgress;
  const opponentName = isCreator ? challenge.friendName : challenge.creatorName;

  const progressPercent = Math.min(100, Math.round((myProgress / challenge.target) * 100));
  const opponentPercent = Math.min(100, Math.round((opponentProgress / challenge.target) * 100));

  const statusColors = {
    [ChallengeStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400',
    [ChallengeStatus.ACTIVE]: 'bg-green-500/20 text-green-400',
    [ChallengeStatus.COMPLETED]: 'bg-blue-500/20 text-blue-400',
    [ChallengeStatus.EXPIRED]: 'bg-slate-500/20 text-slate-400',
    [ChallengeStatus.DECLINED]: 'bg-red-500/20 text-red-400',
    [ChallengeStatus.CANCELLED]: 'bg-slate-500/20 text-slate-400',
  };

  const statusLabels = {
    [ChallengeStatus.PENDING]: t('friendChallengeStatusPending') || 'En attente',
    [ChallengeStatus.ACTIVE]: t('friendChallengeStatusActive') || 'En cours',
    [ChallengeStatus.COMPLETED]: challenge.winnerId === userId ? (t('friendChallengeStatusWon') || 'Gagne !') : (t('friendChallengeStatusLost') || 'Perdu'),
    [ChallengeStatus.EXPIRED]: t('friendChallengeStatusExpired') || 'Expire',
    [ChallengeStatus.DECLINED]: t('friendChallengeStatusDeclined') || 'Decline',
    [ChallengeStatus.CANCELLED]: t('friendChallengeStatusCancelled') || 'Annule',
  };

  return `
    <div class="bg-dark-700 rounded-xl p-4 border border-dark-600">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${challengeType?.icon || '🎯'}</span>
          <div>
            <h4 class="font-semibold text-white">${challengeType?.name || challenge.type}</h4>
            <p class="text-xs text-slate-400">vs ${opponentName}</p>
          </div>
        </div>
        <span class="px-2 py-1 rounded-full text-xs ${statusColors[challenge.status]}">
          ${statusLabels[challenge.status]}
        </span>
      </div>

      ${challenge.status === ChallengeStatus.ACTIVE ? `
        <div class="space-y-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 w-12">${t('you') || 'Toi'}</span>
            <div class="flex-1 bg-dark-600 rounded-full h-2 overflow-hidden">
              <div class="bg-primary h-full transition-all" style="width: ${progressPercent}%"></div>
            </div>
            <span class="text-xs text-white w-10 text-right">${myProgress}/${challenge.target}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 w-12 truncate">${opponentName.substring(0, 5)}</span>
            <div class="flex-1 bg-dark-600 rounded-full h-2 overflow-hidden">
              <div class="bg-red-500 h-full transition-all" style="width: ${opponentPercent}%"></div>
            </div>
            <span class="text-xs text-white w-10 text-right">${opponentProgress}/${challenge.target}</span>
          </div>
        </div>
        <p class="text-xs text-slate-400">
          ${(t('friendChallengeExpiresOn') || 'Expire le {date}').replace('{date}', new Date(challenge.expiresAt).toLocaleDateString())}
        </p>
      ` : ''}

      ${challenge.status === ChallengeStatus.PENDING && !isCreator ? `
        <div class="flex gap-2 mt-3">
          <button onclick="window.acceptFriendChallenge('${challenge.id}')"
            class="flex-1 bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/80">
            ${t('accept') || 'Accepter'}
          </button>
          <button onclick="window.declineFriendChallenge('${challenge.id}')"
            class="flex-1 bg-dark-600 text-slate-300 py-2 rounded-lg text-sm hover:bg-dark-500">
            ${t('decline') || 'Decliner'}
          </button>
        </div>
      ` : ''}

      ${challenge.status === ChallengeStatus.PENDING && isCreator ? `
        <div class="mt-3">
          <button onclick="window.cancelFriendChallenge('${challenge.id}')"
            class="w-full bg-dark-600 text-slate-300 py-2 rounded-lg text-sm hover:bg-dark-500">
            ${t('cancel') || 'Annuler'}
          </button>
        </div>
      ` : ''}

      ${challenge.status === ChallengeStatus.COMPLETED && challenge.winnerId === userId ? `
        <p class="text-center text-green-400 font-medium mt-2">
          +${challenge.rewardPoints} ${(t('pointsEarned') || 'points gagnes !')}
        </p>
      ` : ''}
    </div>
  `;
}

export default {
  challengeTypes,
  ChallengeStatus,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  updateChallengeProgress,
  syncChallengeProgress,
  getActiveChallenges,
  getPendingChallenges,
  getCompletedChallenges,
  getChallengeStats,
  getChallengeTypes,
  renderChallengeCard,
};
