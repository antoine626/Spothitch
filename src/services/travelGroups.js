/**
 * Travel Groups Service
 * Find and create travel companions
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Group status
export const GROUP_STATUS = {
  PLANNING: { id: 'planning', label: 'En préparation', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  ACTIVE: { id: 'active', label: 'En cours', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  COMPLETED: { id: 'completed', label: 'Terminé', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  CANCELLED: { id: 'cancelled', label: 'Annulé', color: 'text-red-400', bg: 'bg-red-500/20' },
};

// Sample travel groups
const SAMPLE_GROUPS = [
  {
    id: 'group_1',
    name: 'Berlin → Amsterdam',
    description: 'Voyage détente à travers l\'Allemagne et les Pays-Bas',
    departure: { city: 'Berlin', country: 'DE', coordinates: { lat: 52.52, lng: 13.405 } },
    destination: { city: 'Amsterdam', country: 'NL', coordinates: { lat: 52.3676, lng: 4.9041 } },
    startDate: '2025-02-15',
    endDate: '2025-02-20',
    maxMembers: 4,
    members: ['user1', 'user2'],
    creator: 'user1',
    status: 'planning',
    tags: ['nature', 'cities', 'relaxed'],
    requirements: ['Niveau intermédiaire minimum', 'Parle anglais'],
    chat: [],
    createdAt: '2025-01-20T10:00:00Z',
  },
];

/**
 * Create a new travel group
 * @param {Object} groupData
 * @returns {Object} Created group
 */
export function createTravelGroup(groupData) {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId) {
    showToast('Connecte-toi pour créer un groupe', 'error');
    return null;
  }

  const group = {
    id: `group_${Date.now()}`,
    name: groupData.name,
    description: groupData.description || '',
    departure: groupData.departure,
    destination: groupData.destination,
    startDate: groupData.startDate,
    endDate: groupData.endDate,
    maxMembers: groupData.maxMembers || 4,
    members: [userId],
    creator: userId,
    status: 'planning',
    tags: groupData.tags || [],
    requirements: groupData.requirements || [],
    chat: [],
    createdAt: new Date().toISOString(),
  };

  const travelGroups = state.travelGroups || [];
  travelGroups.push(group);

  setState({ travelGroups, currentTravelGroup: group });

  showToast(`Groupe "${group.name}" créé !`, 'success');
  return group;
}

/**
 * Join a travel group
 * @param {string} groupId
 * @returns {boolean}
 */
export function joinTravelGroup(groupId) {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId) {
    showToast('Connecte-toi pour rejoindre un groupe', 'error');
    return false;
  }

  const travelGroups = state.travelGroups || [];
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    showToast('Groupe introuvable', 'error');
    return false;
  }

  const group = travelGroups[groupIndex];

  if (group.members.includes(userId)) {
    showToast('Tu es déjà dans ce groupe', 'warning');
    return false;
  }

  if (group.members.length >= group.maxMembers) {
    showToast('Ce groupe est complet', 'error');
    return false;
  }

  if (group.status !== 'planning') {
    showToast('Ce groupe n\'accepte plus de membres', 'error');
    return false;
  }

  group.members.push(userId);
  travelGroups[groupIndex] = group;

  setState({ travelGroups, currentTravelGroup: group });

  showToast(`Tu as rejoint "${group.name}" !`, 'success');
  return true;
}

/**
 * Leave a travel group
 * @param {string} groupId
 * @returns {boolean}
 */
export function leaveTravelGroup(groupId) {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId) return false;

  const travelGroups = state.travelGroups || [];
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) return false;

  const group = travelGroups[groupIndex];

  if (!group.members.includes(userId)) {
    return false;
  }

  // If creator leaves, transfer or delete
  if (group.creator === userId) {
    if (group.members.length > 1) {
      group.creator = group.members.find((m) => m !== userId);
    } else {
      group.status = 'cancelled';
    }
  }

  group.members = group.members.filter((m) => m !== userId);

  if (group.members.length === 0) {
    travelGroups.splice(groupIndex, 1);
  } else {
    travelGroups[groupIndex] = group;
  }

  setState({
    travelGroups,
    currentTravelGroup: null,
  });

  showToast('Tu as quitté le groupe', 'info');
  return true;
}

/**
 * Send message to group chat
 * @param {string} groupId
 * @param {string} message
 */
export function sendGroupMessage(groupId, message) {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId || !message.trim()) return;

  const travelGroups = state.travelGroups || [];
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) return;

  const group = travelGroups[groupIndex];

  group.chat.push({
    id: `msg_${Date.now()}`,
    userId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    message: message.trim(),
    timestamp: new Date().toISOString(),
  });

  travelGroups[groupIndex] = group;
  setState({ travelGroups, currentTravelGroup: group });
}

/**
 * Update group status
 * @param {string} groupId
 * @param {string} status
 */
export function updateGroupStatus(groupId, status) {
  const state = getState();
  const userId = state.user?.uid;

  const travelGroups = state.travelGroups || [];
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) return false;

  const group = travelGroups[groupIndex];

  // Only creator can change status
  if (group.creator !== userId) {
    showToast('Seul le créateur peut modifier le statut', 'warning');
    return false;
  }

  group.status = status;
  travelGroups[groupIndex] = group;

  setState({ travelGroups, currentTravelGroup: group });

  const statusInfo = GROUP_STATUS[status.toUpperCase()];
  showToast(`Statut mis à jour: ${statusInfo?.label || status}`, 'success');

  return true;
}

/**
 * Search for travel groups
 * @param {Object} filters
 * @returns {Array}
 */
export function searchTravelGroups(filters = {}) {
  const state = getState();
  let groups = state.travelGroups || SAMPLE_GROUPS;

  // Filter by status
  if (filters.status) {
    groups = groups.filter((g) => g.status === filters.status);
  }

  // Filter by destination country
  if (filters.destinationCountry) {
    groups = groups.filter((g) => g.destination?.country === filters.destinationCountry);
  }

  // Filter by date range
  if (filters.startDate) {
    groups = groups.filter((g) => g.startDate >= filters.startDate);
  }

  if (filters.endDate) {
    groups = groups.filter((g) => g.endDate <= filters.endDate);
  }

  // Filter by available spots
  if (filters.hasAvailableSpots) {
    groups = groups.filter((g) => g.members.length < g.maxMembers);
  }

  // Filter by tags
  if (filters.tags?.length > 0) {
    groups = groups.filter((g) =>
      filters.tags.some((tag) => g.tags?.includes(tag))
    );
  }

  return groups;
}

/**
 * Get user's travel groups
 * @returns {Array}
 */
export function getMyTravelGroups() {
  const state = getState();
  const userId = state.user?.uid;

  if (!userId) return [];

  const groups = state.travelGroups || [];
  return groups.filter((g) => g.members.includes(userId));
}

/**
 * Render travel group card
 * @param {Object} group
 * @returns {string}
 */
export function renderTravelGroupCard(group) {
  const statusInfo = GROUP_STATUS[group.status?.toUpperCase()] || GROUP_STATUS.PLANNING;
  const spotsLeft = group.maxMembers - group.members.length;

  return `
    <div class="bg-dark-card rounded-2xl overflow-hidden" onclick="openTravelGroupDetail('${group.id}')">
      <!-- Header with gradient -->
      <div class="h-24 bg-gradient-to-br from-primary-500 to-primary-600 relative">
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="absolute bottom-3 left-4 right-4">
          <div class="flex items-center gap-2 text-white/90 text-sm">
            <span>${group.departure?.city || 'Départ'}</span>
            <i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
            <span>${group.destination?.city || 'Destination'}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold">${group.name}</h3>
          <span class="px-2 py-0.5 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}">
            ${statusInfo.label}
          </span>
        </div>

        ${group.description ? `
          <p class="text-sm text-slate-400 mb-3 line-clamp-2">${group.description}</p>
        ` : ''}

        <!-- Info row -->
        <div class="flex items-center gap-4 text-sm text-slate-400 mb-3">
          <div>
            <i class="fas fa-calendar mr-1" aria-hidden="true"></i>
            ${formatDate(group.startDate)}
          </div>
          <div>
            <i class="fas fa-users mr-1" aria-hidden="true"></i>
            ${group.members.length}/${group.maxMembers}
          </div>
        </div>

        <!-- Tags -->
        ${group.tags?.length > 0 ? `
          <div class="flex flex-wrap gap-1 mb-3">
            ${group.tags.map((tag) => `
              <span class="px-2 py-0.5 bg-white/10 rounded-full text-xs text-slate-400">#${tag}</span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Members avatars -->
        <div class="flex items-center justify-between">
          <div class="flex -space-x-2">
            ${group.members.slice(0, 4).map(() => `
              <div class="w-8 h-8 rounded-full bg-primary-500 border-2 border-dark-card flex items-center justify-center text-sm">👤</div>
            `).join('')}
            ${group.members.length > 4 ? `
              <div class="w-8 h-8 rounded-full bg-white/10 border-2 border-dark-card flex items-center justify-center text-xs">+${group.members.length - 4}</div>
            ` : ''}
          </div>
          ${spotsLeft > 0 ? `
            <span class="text-xs text-emerald-400">
              <i class="fas fa-user-plus mr-1" aria-hidden="true"></i>
              ${spotsLeft} place${spotsLeft > 1 ? 's' : ''} libre${spotsLeft > 1 ? 's' : ''}
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render travel groups list
 * @param {Object} state
 * @returns {string}
 */
export function renderTravelGroupsList(state) {
  const groups = searchTravelGroups({ status: 'planning', hasAvailableSpots: true });
  const myGroups = getMyTravelGroups();

  return `
    <div class="p-4 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">Groupes de voyage</h2>
          <p class="text-sm text-slate-400">Trouve des compagnons de route</p>
        </div>
        <button onclick="openCreateTravelGroup()" class="btn btn-primary">
          <i class="fas fa-plus mr-2" aria-hidden="true"></i>
          Créer
        </button>
      </div>

      <!-- My groups -->
      ${myGroups.length > 0 ? `
        <div>
          <h3 class="font-semibold mb-3">Mes groupes</h3>
          <div class="space-y-3">
            ${myGroups.map((g) => renderTravelGroupCard(g)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Available groups -->
      <div>
        <h3 class="font-semibold mb-3">Groupes disponibles</h3>
        ${groups.length > 0 ? `
          <div class="space-y-3">
            ${groups.map((g) => renderTravelGroupCard(g)).join('')}
          </div>
        ` : `
          <div class="text-center py-8 text-slate-400">
            <i class="fas fa-users-slash text-3xl mb-2" aria-hidden="true"></i>
            <p>Aucun groupe disponible pour le moment</p>
            <button onclick="openCreateTravelGroup()" class="btn btn-ghost mt-4">
              Crée le premier !
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Render group detail view
 * @param {Object} state
 * @returns {string}
 */
export function renderTravelGroupDetail(state) {
  const group = state.currentTravelGroup;
  if (!group) return '';

  const userId = state.user?.uid;
  const isCreator = group.creator === userId;
  const isMember = group.members.includes(userId);
  const statusInfo = GROUP_STATUS[group.status?.toUpperCase()] || GROUP_STATUS.PLANNING;

  return `
    <div class="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
      <div class="min-h-screen pb-20">
        <!-- Header -->
        <div class="h-48 bg-gradient-to-br from-primary-500 to-primary-600 relative">
          <button
            onclick="closeTravelGroupDetail()"
            class="absolute top-4 left-4 p-2 bg-black/20 rounded-full text-white"
            aria-label="Retour"
          >
            <i class="fas fa-arrow-left" aria-hidden="true"></i>
          </button>
          ${isCreator ? `
            <button
              onclick="openEditTravelGroup()"
              class="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white"
              aria-label="Modifier"
            >
              <i class="fas fa-edit" aria-hidden="true"></i>
            </button>
          ` : ''}
          <div class="absolute bottom-4 left-4 right-4">
            <div class="flex items-center gap-2 text-white/90 text-sm mb-1">
              <span>${group.departure?.city}</span>
              <i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
              <span>${group.destination?.city}</span>
            </div>
            <h1 class="text-2xl font-bold text-white">${group.name}</h1>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <!-- Status & info -->
          <div class="flex flex-wrap gap-3">
            <span class="px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}">
              ${statusInfo.label}
            </span>
            <span class="px-3 py-1 rounded-full bg-white/10 text-slate-300">
              <i class="fas fa-calendar mr-1" aria-hidden="true"></i>
              ${formatDate(group.startDate)} - ${formatDate(group.endDate)}
            </span>
            <span class="px-3 py-1 rounded-full bg-white/10 text-slate-300">
              <i class="fas fa-users mr-1" aria-hidden="true"></i>
              ${group.members.length}/${group.maxMembers}
            </span>
          </div>

          <!-- Description -->
          ${group.description ? `
            <div class="bg-dark-card rounded-xl p-4">
              <h3 class="font-semibold mb-2">Description</h3>
              <p class="text-slate-400">${group.description}</p>
            </div>
          ` : ''}

          <!-- Requirements -->
          ${group.requirements?.length > 0 ? `
            <div class="bg-dark-card rounded-xl p-4">
              <h3 class="font-semibold mb-2">Conditions</h3>
              <ul class="space-y-1 text-slate-400">
                ${group.requirements.map((r) => `
                  <li><i class="fas fa-check text-emerald-400 mr-2" aria-hidden="true"></i>${r}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Members -->
          <div class="bg-dark-card rounded-xl p-4">
            <h3 class="font-semibold mb-3">Membres (${group.members.length}/${group.maxMembers})</h3>
            <div class="space-y-2">
              ${group.members.map((memberId) => `
                <div class="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">👤</div>
                  <div class="flex-1">
                    <div class="font-medium">${memberId === group.creator ? '👑 ' : ''}Membre</div>
                    <div class="text-xs text-slate-400">${memberId === group.creator ? 'Organisateur' : 'Participant'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Chat -->
          ${isMember ? `
            <div class="bg-dark-card rounded-xl p-4">
              <h3 class="font-semibold mb-3">Discussion</h3>
              <div class="space-y-3 max-h-60 overflow-y-auto mb-3">
                ${group.chat?.length > 0 ? group.chat.map((msg) => `
                  <div class="flex gap-2">
                    <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm flex-shrink-0">${msg.avatar || '👤'}</div>
                    <div class="flex-1">
                      <div class="text-sm font-medium">${msg.username}</div>
                      <div class="text-sm text-slate-400">${msg.message}</div>
                    </div>
                  </div>
                `).join('') : `
                  <p class="text-slate-500 text-center py-4">Aucun message</p>
                `}
              </div>
              <div class="flex gap-2">
                <input
                  type="text"
                  id="group-chat-input"
                  class="input-modern flex-1"
                  placeholder="Message..."
                  onkeypress="if(event.key==='Enter')sendGroupChatMessage('${group.id}')"
                />
                <button onclick="sendGroupChatMessage('${group.id}')" class="btn btn-primary">
                  <i class="fas fa-paper-plane" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="flex gap-3">
            ${!isMember && group.status === 'planning' && group.members.length < group.maxMembers ? `
              <button onclick="joinTravelGroup('${group.id}')" class="btn btn-primary flex-1">
                <i class="fas fa-user-plus mr-2" aria-hidden="true"></i>
                Rejoindre
              </button>
            ` : ''}
            ${isMember && !isCreator ? `
              <button onclick="leaveTravelGroup('${group.id}')" class="btn btn-danger flex-1">
                <i class="fas fa-sign-out-alt mr-2" aria-hidden="true"></i>
                Quitter
              </button>
            ` : ''}
            ${isCreator && group.status === 'planning' ? `
              <button onclick="updateGroupStatus('${group.id}', 'active')" class="btn btn-success flex-1">
                <i class="fas fa-play mr-2" aria-hidden="true"></i>
                Démarrer le voyage
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Format date for display
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Global handlers
window.openCreateTravelGroup = () => setState({ showCreateTravelGroup: true });
window.closeCreateTravelGroup = () => setState({ showCreateTravelGroup: false });
window.openTravelGroupDetail = (groupId) => {
  const state = getState();
  const groups = state.travelGroups || SAMPLE_GROUPS;
  const group = groups.find((g) => g.id === groupId);
  setState({ currentTravelGroup: group, showTravelGroupDetail: true });
};
window.closeTravelGroupDetail = () => setState({ currentTravelGroup: null, showTravelGroupDetail: false });
window.joinTravelGroup = joinTravelGroup;
window.leaveTravelGroup = leaveTravelGroup;
window.updateGroupStatus = updateGroupStatus;
window.sendGroupChatMessage = (groupId) => {
  const input = document.getElementById('group-chat-input');
  if (input?.value) {
    sendGroupMessage(groupId, input.value);
    input.value = '';
  }
};

export default {
  GROUP_STATUS,
  createTravelGroup,
  joinTravelGroup,
  leaveTravelGroup,
  sendGroupMessage,
  updateGroupStatus,
  searchTravelGroups,
  getMyTravelGroups,
  renderTravelGroupCard,
  renderTravelGroupsList,
  renderTravelGroupDetail,
};
