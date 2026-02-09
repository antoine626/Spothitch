/**
 * Temporary Events Service
 * Manage temporary events like double XP, country focus, community challenges
 * Feature #164
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';
import { t } from '../i18n/index.js';

/**
 * Event types enum
 */
export const EventType = {
  DOUBLE_XP: 'double_xp',
  COUNTRY_FOCUS: 'country_focus',
  COMMUNITY_CHALLENGE: 'community_challenge',
  SEASONAL: 'seasonal',
};

/**
 * Sample events data (to be replaced with backend data)
 */
export const sampleEvents = [
  {
    id: 'evt_france_nationalday_2026',
    type: EventType.COUNTRY_FOCUS,
    name: 'Fete Nationale France',
    nameEn: 'France National Day',
    description: 'Celebre le 14 juillet avec des bonus sur tous les spots francais !',
    descriptionEn: 'Celebrate July 14th with bonuses on all French spots!',
    icon: '🇫🇷',
    country: 'France',
    countryCode: 'FR',
    bonusMultiplier: 2.0,
    startDate: '2026-07-13T00:00:00.000Z',
    endDate: '2026-07-15T23:59:59.000Z',
    rewards: [
      { type: 'points', amount: 200, condition: 'participation' },
      { type: 'badge', id: 'tricolore_2026', name: 'Tricolore 2026' },
    ],
    requirements: {
      minCheckins: 3,
      countryFilter: 'FR',
    },
  },
  {
    id: 'evt_summer_festival_2026',
    type: EventType.SEASONAL,
    name: 'Festival d\'Ete',
    nameEn: 'Summer Festival',
    description: 'L\'ete des routards ! Double XP tout le mois de juillet.',
    descriptionEn: 'Hitchhiker summer! Double XP all July.',
    icon: '☀️',
    bonusMultiplier: 2.0,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-31T23:59:59.000Z',
    rewards: [
      { type: 'points', amount: 500, condition: 'completion' },
      { type: 'badge', id: 'summer_2026', name: 'Ete 2026' },
    ],
    requirements: {
      minCheckins: 10,
      minCountries: 2,
    },
  },
  {
    id: 'evt_community_100k_2026',
    type: EventType.COMMUNITY_CHALLENGE,
    name: 'Defi Communautaire : 100K Check-ins',
    nameEn: 'Community Challenge: 100K Check-ins',
    description: 'Ensemble, atteignons 100 000 check-ins ce mois !',
    descriptionEn: 'Together, let\'s reach 100,000 check-ins this month!',
    icon: '🎯',
    communityTarget: 100000,
    communityProgress: 67543,
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-28T23:59:59.000Z',
    rewards: [
      { type: 'points', amount: 300, condition: 'community_goal' },
      { type: 'badge', id: 'community_hero_2026', name: 'Heros Communautaire' },
    ],
    requirements: {
      minContribution: 5,
    },
  },
  {
    id: 'evt_double_xp_weekend',
    type: EventType.DOUBLE_XP,
    name: 'Weekend Double XP',
    nameEn: 'Double XP Weekend',
    description: 'Double points sur tous tes check-ins ce weekend !',
    descriptionEn: 'Double points on all your check-ins this weekend!',
    icon: '⚡',
    bonusMultiplier: 2.0,
    startDate: '2026-02-07T18:00:00.000Z',
    endDate: '2026-02-09T22:00:00.000Z',
    rewards: [
      { type: 'points', amount: 100, condition: 'participation' },
    ],
    requirements: {
      minCheckins: 1,
    },
  },
  {
    id: 'evt_germany_oktoberfest_2026',
    type: EventType.COUNTRY_FOCUS,
    name: 'Route vers l\'Oktoberfest',
    nameEn: 'Road to Oktoberfest',
    description: 'Bonus sur tous les spots vers Munich pour l\'Oktoberfest !',
    descriptionEn: 'Bonuses on all spots towards Munich for Oktoberfest!',
    icon: '🇩🇪',
    country: 'Germany',
    countryCode: 'DE',
    bonusMultiplier: 1.5,
    startDate: '2026-09-15T00:00:00.000Z',
    endDate: '2026-10-05T23:59:59.000Z',
    rewards: [
      { type: 'points', amount: 250, condition: 'completion' },
      { type: 'badge', id: 'prost_2026', name: 'Prost! 2026' },
    ],
    requirements: {
      minCheckins: 5,
      countryFilter: 'DE',
    },
  },
];

/**
 * Initialize events in state if not present
 */
function initEventsState() {
  const state = getState();
  if (!state.temporaryEvents) {
    setState({
      temporaryEvents: sampleEvents,
      eventParticipation: {},
      eventProgress: {},
    });
  }
}

/**
 * Get all events
 * @returns {Object[]} All events
 */
export function getAllEvents() {
  initEventsState();
  const state = getState();
  return state.temporaryEvents || sampleEvents;
}

/**
 * Get active events (currently running)
 * @returns {Object[]} Active events
 */
export function getActiveEvents() {
  const events = getAllEvents();
  const now = new Date();

  return events.filter(event => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return now >= start && now <= end;
  });
}

/**
 * Get upcoming events (not started yet)
 * @returns {Object[]} Upcoming events
 */
export function getUpcomingEvents() {
  const events = getAllEvents();
  const now = new Date();

  return events.filter(event => {
    const start = new Date(event.startDate);
    return now < start;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

/**
 * Get past events (already ended)
 * @returns {Object[]} Past events
 */
export function getPastEvents() {
  const events = getAllEvents();
  const now = new Date();

  return events.filter(event => {
    const end = new Date(event.endDate);
    return now > end;
  }).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
}

/**
 * Get event details by ID
 * @param {string} eventId - Event ID
 * @returns {Object|null} Event details
 */
export function getEventDetails(eventId) {
  const events = getAllEvents();
  return events.find(event => event.id === eventId) || null;
}

/**
 * Get event status
 * @param {string} eventId - Event ID
 * @returns {string} Status: 'active', 'upcoming', 'ended', 'unknown'
 */
export function getEventStatus(eventId) {
  const event = getEventDetails(eventId);
  if (!event) return 'unknown';

  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

/**
 * Join an event
 * @param {string} eventId - Event ID
 * @returns {boolean} Success
 */
export function joinEvent(eventId) {
  initEventsState();
  const state = getState();
  const event = getEventDetails(eventId);

  if (!event) {
    showToast(t('eventNotFound'), 'error');
    return false;
  }

  const status = getEventStatus(eventId);
  if (status === 'ended') {
    showToast(t('eventEnded'), 'error');
    return false;
  }

  if (status === 'upcoming') {
    showToast(t('eventNotStarted'), 'error');
    return false;
  }

  const participation = state.eventParticipation || {};
  if (participation[eventId]) {
    showToast(t('eventAlreadyJoined'), 'info');
    return false;
  }

  participation[eventId] = {
    joinedAt: new Date().toISOString(),
    progress: 0,
    completed: false,
    rewardsClaimed: false,
  };

  setState({ eventParticipation: { ...participation } });
  showToast(t('eventJoined', { name: event.name }), 'success');
  return true;
}

/**
 * Leave an event
 * @param {string} eventId - Event ID
 * @returns {boolean} Success
 */
export function leaveEvent(eventId) {
  initEventsState();
  const state = getState();
  const event = getEventDetails(eventId);

  if (!event) {
    showToast(t('eventNotFound'), 'error');
    return false;
  }

  const participation = state.eventParticipation || {};
  if (!participation[eventId]) {
    showToast(t('eventNotJoined'), 'error');
    return false;
  }

  delete participation[eventId];
  setState({ eventParticipation: { ...participation } });
  showToast(t('eventLeft', { name: event.name }), 'info');
  return true;
}

/**
 * Check if user has joined an event
 * @param {string} eventId - Event ID
 * @returns {boolean} True if joined
 */
export function hasJoinedEvent(eventId) {
  initEventsState();
  const state = getState();
  const participation = state.eventParticipation || {};
  return !!participation[eventId];
}

/**
 * Get event progress for user
 * @param {string} eventId - Event ID
 * @returns {Object} Progress object
 */
export function getEventProgress(eventId) {
  initEventsState();
  const state = getState();
  const event = getEventDetails(eventId);
  const participation = state.eventParticipation || {};

  if (!event || !participation[eventId]) {
    return {
      joined: false,
      progress: 0,
      target: 0,
      percentage: 0,
      completed: false,
      rewardsClaimed: false,
    };
  }

  const userParticipation = participation[eventId];
  const target = event.requirements?.minCheckins || event.requirements?.minContribution || 1;
  const progress = userParticipation.progress || 0;
  const percentage = Math.min(100, Math.round((progress / target) * 100));

  return {
    joined: true,
    joinedAt: userParticipation.joinedAt,
    progress,
    target,
    percentage,
    completed: progress >= target,
    rewardsClaimed: userParticipation.rewardsClaimed || false,
  };
}

/**
 * Update event progress
 * @param {string} eventId - Event ID
 * @param {number} progressDelta - Progress increment (default 1)
 * @returns {boolean} Success
 */
export function updateEventProgress(eventId, progressDelta = 1) {
  initEventsState();
  const state = getState();
  const event = getEventDetails(eventId);
  const participation = state.eventParticipation || {};

  if (!event || !participation[eventId]) {
    return false;
  }

  const status = getEventStatus(eventId);
  if (status !== 'active') {
    return false;
  }

  const currentProgress = participation[eventId].progress || 0;
  const newProgress = currentProgress + progressDelta;
  const target = event.requirements?.minCheckins || event.requirements?.minContribution || 1;

  participation[eventId] = {
    ...participation[eventId],
    progress: newProgress,
    completed: newProgress >= target,
  };

  setState({ eventParticipation: { ...participation } });

  // Check completion
  if (newProgress >= target && currentProgress < target) {
    showToast(t('eventCompleted', { name: event.name }), 'success');
  }

  return true;
}

/**
 * Claim event reward
 * @param {string} eventId - Event ID
 * @returns {Object|null} Claimed rewards
 */
export function claimEventReward(eventId) {
  initEventsState();
  const state = getState();
  const event = getEventDetails(eventId);
  const participation = state.eventParticipation || {};

  if (!event) {
    showToast(t('eventNotFound'), 'error');
    return null;
  }

  if (!participation[eventId]) {
    showToast(t('eventNotJoined'), 'error');
    return null;
  }

  const progress = getEventProgress(eventId);

  if (!progress.completed) {
    showToast(t('eventNotCompleted'), 'error');
    return null;
  }

  if (progress.rewardsClaimed) {
    showToast(t('eventRewardsAlreadyClaimed'), 'info');
    return null;
  }

  // Claim rewards
  const claimedRewards = [];
  for (const reward of event.rewards || []) {
    if (reward.condition === 'participation' || reward.condition === 'completion') {
      if (reward.type === 'points') {
        addPoints(reward.amount, `event_${eventId}`);
        claimedRewards.push(reward);
      } else if (reward.type === 'badge') {
        // Add badge to user
        const badges = state.badges || [];
        if (!badges.includes(reward.id)) {
          setState({ badges: [...badges, reward.id] });
        }
        claimedRewards.push(reward);
      }
    }
  }

  // Mark as claimed
  participation[eventId] = {
    ...participation[eventId],
    rewardsClaimed: true,
    claimedAt: new Date().toISOString(),
  };

  setState({ eventParticipation: { ...participation } });
  showToast(t('eventRewardsClaimed'), 'success');

  return claimedRewards;
}

/**
 * Get event leaderboard
 * @param {string} eventId - Event ID
 * @returns {Object[]} Leaderboard entries
 */
export function getEventLeaderboard(eventId) {
  const event = getEventDetails(eventId);
  if (!event) return [];

  // Mock leaderboard data (would come from backend in production)
  const mockLeaderboard = [
    { rank: 1, username: 'RoadMaster', avatar: '🚗', progress: 47, country: 'FR' },
    { rank: 2, username: 'HitchQueen', avatar: '👸', progress: 42, country: 'DE' },
    { rank: 3, username: 'ThumbsUp', avatar: '👍', progress: 38, country: 'ES' },
    { rank: 4, username: 'WanderLust', avatar: '🌍', progress: 35, country: 'NL' },
    { rank: 5, username: 'RouteRunner', avatar: '🏃', progress: 31, country: 'BE' },
    { rank: 6, username: 'SpotFinder', avatar: '🔍', progress: 28, country: 'IT' },
    { rank: 7, username: 'TravelBug', avatar: '🐛', progress: 25, country: 'PT' },
    { rank: 8, username: 'HighwayHero', avatar: '🦸', progress: 22, country: 'AT' },
    { rank: 9, username: 'PetrolHead', avatar: '⛽', progress: 19, country: 'CH' },
    { rank: 10, username: 'DrifterDan', avatar: '🏄', progress: 15, country: 'PL' },
  ];

  // Add current user if participating
  const state = getState();
  const participation = state.eventParticipation || {};
  if (participation[eventId]) {
    const userProgress = participation[eventId].progress || 0;
    const userEntry = {
      rank: mockLeaderboard.filter(e => e.progress > userProgress).length + 1,
      username: state.username || 'Toi',
      avatar: state.avatar || '🤙',
      progress: userProgress,
      country: 'FR',
      isCurrentUser: true,
    };

    // Insert user at correct position
    const leaderboardWithUser = [...mockLeaderboard];
    leaderboardWithUser.push(userEntry);
    leaderboardWithUser.sort((a, b) => b.progress - a.progress);

    // Re-rank
    return leaderboardWithUser.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  return mockLeaderboard;
}

/**
 * Get time remaining for an event
 * @param {string} eventId - Event ID
 * @returns {Object} Time remaining
 */
export function getEventTimeRemaining(eventId) {
  const event = getEventDetails(eventId);
  if (!event) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const now = new Date();
  const end = new Date(event.endDate);
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, expired: false };
}

/**
 * Get XP multiplier for current active events
 * @returns {number} XP multiplier (1.0 = no bonus)
 */
export function getActiveXPMultiplier() {
  const activeEvents = getActiveEvents();
  let multiplier = 1.0;

  for (const event of activeEvents) {
    if (event.bonusMultiplier && event.bonusMultiplier > multiplier) {
      multiplier = event.bonusMultiplier;
    }
  }

  return multiplier;
}

/**
 * Render event card HTML
 * @param {Object} event - Event object
 * @returns {string} HTML string
 */
export function renderEventCard(event) {
  const state = getState();
  const lang = state.lang || 'fr';
  const status = getEventStatus(event.id);
  const progress = getEventProgress(event.id);
  const timeRemaining = getEventTimeRemaining(event.id);

  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    upcoming: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusLabels = {
    active: lang === 'fr' ? 'En cours' : 'Active',
    upcoming: lang === 'fr' ? 'A venir' : 'Upcoming',
    ended: lang === 'fr' ? 'Termine' : 'Ended',
  };

  const typeLabels = {
    [EventType.DOUBLE_XP]: { fr: 'Double XP', en: 'Double XP', icon: '⚡' },
    [EventType.COUNTRY_FOCUS]: { fr: 'Focus Pays', en: 'Country Focus', icon: '🌍' },
    [EventType.COMMUNITY_CHALLENGE]: { fr: 'Defi Communautaire', en: 'Community Challenge', icon: '🎯' },
    [EventType.SEASONAL]: { fr: 'Saisonnier', en: 'Seasonal', icon: '📅' },
  };

  const typeInfo = typeLabels[event.type] || typeLabels[EventType.SEASONAL];
  const name = lang === 'fr' ? event.name : (event.nameEn || event.name);
  const description = lang === 'fr' ? event.description : (event.descriptionEn || event.description);

  return `
    <div class="bg-dark-700 rounded-xl p-4 border border-dark-600 hover:border-primary/30 transition-colors">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <span class="text-3xl">${event.icon || typeInfo.icon}</span>
          <div>
            <h4 class="font-semibold text-white">${escapeHTML(name)}</h4>
            <span class="text-xs text-gray-400">${typeInfo[lang] || typeInfo.en}</span>
          </div>
        </div>
        <span class="px-2 py-1 rounded-full text-xs border ${statusColors[status] || statusColors.ended}">
          ${statusLabels[status]}
        </span>
      </div>

      <p class="text-sm text-gray-300 mb-3">${escapeHTML(description)}</p>

      ${event.bonusMultiplier && event.bonusMultiplier > 1 ? `
        <div class="flex items-center gap-2 mb-3 text-yellow-400">
          <span class="text-lg">⚡</span>
          <span class="text-sm font-medium">${event.bonusMultiplier}x XP</span>
        </div>
      ` : ''}

      ${event.type === EventType.COMMUNITY_CHALLENGE && event.communityProgress !== undefined ? `
        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>${lang === 'fr' ? 'Progres communautaire' : 'Community Progress'}</span>
            <span>${event.communityProgress.toLocaleString()} / ${event.communityTarget.toLocaleString()}</span>
          </div>
          <div class="bg-dark-600 rounded-full h-2 overflow-hidden">
            <div class="bg-primary h-full transition-all" style="width: ${Math.min(100, Math.round((event.communityProgress / event.communityTarget) * 100))}%"></div>
          </div>
        </div>
      ` : ''}

      ${progress.joined && status === 'active' ? `
        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>${lang === 'fr' ? 'Ta progression' : 'Your Progress'}</span>
            <span>${progress.progress} / ${progress.target}</span>
          </div>
          <div class="bg-dark-600 rounded-full h-2 overflow-hidden">
            <div class="bg-green-500 h-full transition-all" style="width: ${progress.percentage}%"></div>
          </div>
        </div>
      ` : ''}

      ${status === 'active' && !timeRemaining.expired ? `
        <div class="text-xs text-gray-400 mb-3">
          ${lang === 'fr' ? 'Temps restant' : 'Time remaining'}:
          <span class="text-white font-medium">
            ${timeRemaining.days > 0 ? `${timeRemaining.days}j ` : ''}${timeRemaining.hours}h ${timeRemaining.minutes}m
          </span>
        </div>
      ` : ''}

      ${event.rewards && event.rewards.length > 0 ? `
        <div class="flex flex-wrap gap-2 mb-3">
          ${event.rewards.map(reward => `
            <span class="bg-dark-600 px-2 py-1 rounded text-xs text-gray-300">
              ${reward.type === 'points' ? `+${reward.amount} pts` : `🏆 ${reward.name || reward.id}`}
            </span>
          `).join('')}
        </div>
      ` : ''}

      <div class="flex gap-2">
        ${status === 'active' && !progress.joined ? `
          <button onclick="window.joinTemporaryEvent('${event.id}')"
            class="flex-1 bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/80 transition-colors">
            ${lang === 'fr' ? 'Participer' : 'Join'}
          </button>
        ` : ''}

        ${status === 'active' && progress.joined && !progress.rewardsClaimed && progress.completed ? `
          <button onclick="window.claimEventReward('${event.id}')"
            class="flex-1 bg-yellow-500 text-dark-900 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors font-medium">
            ${lang === 'fr' ? 'Reclamer recompense' : 'Claim Reward'}
          </button>
        ` : ''}

        ${status === 'active' && progress.joined && !progress.completed ? `
          <button onclick="window.viewEventDetails('${event.id}')"
            class="flex-1 bg-dark-600 text-white py-2 rounded-lg text-sm hover:bg-dark-500 transition-colors">
            ${lang === 'fr' ? 'Voir details' : 'View Details'}
          </button>
        ` : ''}

        ${status === 'upcoming' ? `
          <span class="flex-1 text-center text-gray-400 py-2 text-sm">
            ${lang === 'fr' ? 'Commence le' : 'Starts'} ${new Date(event.startDate).toLocaleDateString()}
          </span>
        ` : ''}

        ${status === 'ended' && progress.joined && progress.rewardsClaimed ? `
          <span class="flex-1 text-center text-green-400 py-2 text-sm">
            ✓ ${lang === 'fr' ? 'Recompenses obtenues' : 'Rewards Claimed'}
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render event banner HTML (for homepage)
 * @param {Object} event - Event object
 * @returns {string} HTML string
 */
export function renderEventBanner(event) {
  const state = getState();
  const lang = state.lang || 'fr';
  const timeRemaining = getEventTimeRemaining(event.id);

  const name = lang === 'fr' ? event.name : (event.nameEn || event.name);

  return `
    <div class="bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg p-3 border border-primary/30 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl animate-bounce-slow">${event.icon || '🎉'}</span>
        <div>
          <h4 class="font-semibold text-white text-sm">${escapeHTML(name)}</h4>
          <p class="text-xs text-gray-300">
            ${event.bonusMultiplier && event.bonusMultiplier > 1 ? `${event.bonusMultiplier}x XP | ` : ''}
            ${timeRemaining.days > 0 ? `${timeRemaining.days}j ` : ''}${timeRemaining.hours}h ${lang === 'fr' ? 'restant' : 'left'}
          </p>
        </div>
      </div>
      <button onclick="window.viewEventDetails('${event.id}')"
        class="bg-primary text-white px-3 py-1 rounded-lg text-xs hover:bg-primary/80 transition-colors">
        ${lang === 'fr' ? 'Voir' : 'View'}
      </button>
    </div>
  `;
}

/**
 * Helper to escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for non-browser environments
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Register global window handlers
 */
if (typeof window !== 'undefined') {
  window.joinTemporaryEvent = joinEvent;
  window.leaveTemporaryEvent = leaveEvent;
  window.claimEventReward = claimEventReward;
  window.viewEventDetails = (eventId) => {
    // Would open event details modal
    console.log('[TemporaryEvents] View details:', eventId);
    const event = getEventDetails(eventId);
    if (event) {
      showToast(`${event.name}`, 'info');
    }
  };
}

export default {
  EventType,
  sampleEvents,
  getAllEvents,
  getActiveEvents,
  getUpcomingEvents,
  getPastEvents,
  getEventDetails,
  getEventStatus,
  joinEvent,
  leaveEvent,
  hasJoinedEvent,
  getEventProgress,
  updateEventProgress,
  claimEventReward,
  getEventLeaderboard,
  getEventTimeRemaining,
  getActiveXPMultiplier,
  renderEventCard,
  renderEventBanner,
};
