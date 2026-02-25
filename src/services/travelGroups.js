/**
 * Travel Groups Service
 * Feature #187 - Groupes de voyage
 *
 * Find and create travel companions with chat integration
 * and shared itinerary features.
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { Storage } from '../utils/storage.js';
import { icon } from '../utils/icons.js'

// Storage key
const TRAVEL_GROUPS_KEY = 'spothitch_travel_groups';

// Group status
export const GROUP_STATUS = {
  PLANNING: { id: 'planning', label: 'En préparation', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  ACTIVE: { id: 'active', label: 'En cours', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  COMPLETED: { id: 'completed', label: 'Terminé', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  CANCELLED: { id: 'cancelled', label: 'Annulé', color: 'text-red-400', bg: 'bg-red-500/20' },
};

// Member roles
export const MEMBER_ROLE = {
  CREATOR: 'creator',
  ADMIN: 'admin',
  MEMBER: 'member',
};

// Invitation status
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
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
    members: [
      { id: 'user1', role: MEMBER_ROLE.CREATOR, joinedAt: '2025-01-20T10:00:00Z' },
      { id: 'user2', role: MEMBER_ROLE.MEMBER, joinedAt: '2025-01-21T14:30:00Z' },
    ],
    creator: 'user1',
    status: 'planning',
    tags: ['nature', 'cities', 'relaxed'],
    requirements: ['Niveau intermédiaire minimum', 'Parle anglais'],
    chat: [],
    itinerary: [],
    invitations: [],
    createdAt: '2025-01-20T10:00:00Z',
  },
];

/**
 * Get groups from storage
 * @returns {Array}
 */
function getGroupsFromStorage() {
  try {
    const data = Storage.get(TRAVEL_GROUPS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[TravelGroups] Error reading groups:', error);
    return [];
  }
}

/**
 * Save groups to storage
 * @param {Array} groups
 */
function saveGroupsToStorage(groups) {
  try {
    Storage.set(TRAVEL_GROUPS_KEY, groups);
    setState({ travelGroups: groups });
  } catch (error) {
    console.error('[TravelGroups] Error saving groups:', error);
  }
}

/**
 * Create a new travel group (alias for createGroup)
 * @param {Object} groupData
 * @returns {Object} Created group
 */
export function createTravelGroup(groupData) {
  return createGroup(groupData.name, groupData.destination, {
    startDate: groupData.startDate,
    endDate: groupData.endDate,
  }, groupData);
}

/**
 * Create a new travel group
 * @param {string} name - Group name
 * @param {Object|string} destination - Destination object or city name
 * @param {Object} dates - { startDate, endDate }
 * @param {Object} options - Additional options
 * @returns {Object} Created group or error
 */
export function createGroup(name, destination, dates = {}, options = {}) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    showToast(t('groupNameRequired') || 'Le nom du groupe est obligatoire', 'error');
    return { success: false, error: 'invalid_name' };
  }

  if (name.length > 50) {
    showToast(t('groupNameTooLong') || 'Le nom est trop long (max 50 caractères)', 'error');
    return { success: false, error: 'name_too_long' };
  }

  // Format destination
  const formattedDestination = typeof destination === 'string'
    ? { city: destination, country: '' }
    : destination;

  if (!formattedDestination?.city) {
    showToast(t('destinationRequired') || 'La destination est obligatoire', 'error');
    return { success: false, error: 'invalid_destination' };
  }

  const now = new Date().toISOString();
  const group = {
    id: `group_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    name: name.trim(),
    description: options.description || '',
    departure: options.departure || null,
    destination: formattedDestination,
    startDate: dates.startDate || null,
    endDate: dates.endDate || null,
    maxMembers: options.maxMembers || 4,
    members: [
      {
        id: userId,
        username: state.username || 'Anonyme',
        avatar: state.avatar || '🤙',
        role: MEMBER_ROLE.CREATOR,
        joinedAt: now,
      },
    ],
    creator: userId,
    status: 'planning',
    tags: options.tags || [],
    requirements: options.requirements || [],
    languages: options.languages || [],
    chat: [],
    itinerary: [],
    invitations: [],
    createdAt: now,
    updatedAt: now,
  };

  const travelGroups = getGroupsFromStorage();
  travelGroups.push(group);
  saveGroupsToStorage(travelGroups);

  setState({ currentTravelGroup: group });

  showToast(t('groupCreated') || `Groupe "${group.name}" créé !`, 'success');
  return { success: true, group };
}

/**
 * Join a travel group (alias)
 * @param {string} groupId
 * @returns {Object}
 */
export function joinGroup(groupId) {
  return joinTravelGroup(groupId);
}

/**
 * Leave a travel group (alias)
 * @param {string} groupId
 * @returns {Object}
 */
export function leaveGroup(groupId) {
  return leaveTravelGroup(groupId);
}

/**
 * Join a travel group
 * @param {string} groupId
 * @returns {Object}
 */
export function joinTravelGroup(groupId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  if (!groupId) {
    return { success: false, error: 'invalid_group_id' };
  }

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    showToast(t('groupNotFound') || 'Groupe introuvable', 'error');
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };

  // Check if already a member (handle both old and new member structure)
  const isMember = group.members.some((m) =>
    typeof m === 'string' ? m === userId : m.id === userId
  );

  if (isMember) {
    showToast(t('alreadyInGroup') || 'Tu es déjà dans ce groupe', 'warning');
    return { success: false, error: 'already_member' };
  }

  // Check capacity
  const memberCount = group.members.length;
  if (memberCount >= group.maxMembers) {
    showToast(t('groupFull') || 'Ce groupe est complet', 'error');
    return { success: false, error: 'group_full' };
  }

  // Check status
  if (group.status !== 'planning') {
    showToast(t('groupNotAcceptingMembers') || 'Ce groupe n\'accepte plus de membres', 'error');
    return { success: false, error: 'not_accepting_members' };
  }

  // Add new member
  const newMember = {
    id: userId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    role: MEMBER_ROLE.MEMBER,
    joinedAt: new Date().toISOString(),
  };

  group.members.push(newMember);
  group.updatedAt = new Date().toISOString();

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);

  setState({ currentTravelGroup: group });

  showToast(t('joinedGroup') || `Tu as rejoint "${group.name}" !`, 'success');
  return { success: true, group, member: newMember };
}

/**
 * Leave a travel group
 * @param {string} groupId
 * @returns {Object}
 */
export function leaveTravelGroup(groupId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  if (!groupId) {
    return { success: false, error: 'invalid_group_id' };
  }

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };

  // Check if member (handle both old and new member structure)
  const memberIndex = group.members.findIndex((m) =>
    typeof m === 'string' ? m === userId : m.id === userId
  );

  if (memberIndex === -1) {
    return { success: false, error: 'not_a_member' };
  }

  // If creator leaves, transfer ownership or cancel
  if (group.creator === userId) {
    const otherMembers = group.members.filter((m, i) => i !== memberIndex);
    if (otherMembers.length > 0) {
      // Transfer to first admin or first member
      const newCreator = otherMembers.find((m) => m.role === MEMBER_ROLE.ADMIN) || otherMembers[0];
      group.creator = typeof newCreator === 'string' ? newCreator : newCreator.id;
      if (typeof newCreator !== 'string') {
        newCreator.role = MEMBER_ROLE.CREATOR;
      }
    } else {
      group.status = 'cancelled';
    }
  }

  // Remove member
  group.members.splice(memberIndex, 1);
  group.updatedAt = new Date().toISOString();

  if (group.members.length === 0) {
    travelGroups.splice(groupIndex, 1);
  } else {
    travelGroups[groupIndex] = group;
  }

  saveGroupsToStorage(travelGroups);

  setState({ currentTravelGroup: null });

  showToast(t('leftGroup') || 'Tu as quitté le groupe', 'info');
  return { success: true };
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

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) return;

  const group = { ...travelGroups[groupIndex] };

  group.chat.push({
    id: `msg_${Date.now()}`,
    userId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    message: message.trim(),
    timestamp: new Date().toISOString(),
  });

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);
  setState({ currentTravelGroup: group });
}

/**
 * Update group status
 * @param {string} groupId
 * @param {string} status
 */
export function updateGroupStatus(groupId, status) {
  const state = getState();
  const userId = state.user?.uid;

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) return false;

  const group = { ...travelGroups[groupIndex] };

  // Only creator can change status
  if (group.creator !== userId) {
    showToast('Seul le créateur peut modifier le statut', 'warning');
    return false;
  }

  group.status = status;
  group.updatedAt = new Date().toISOString();
  travelGroups[groupIndex] = group;

  saveGroupsToStorage(travelGroups);
  setState({ currentTravelGroup: group });

  const statusInfo = GROUP_STATUS[status.toUpperCase()];
  showToast(`Statut mis à jour: ${statusInfo?.label || status}`, 'success');

  return true;
}

/**
 * Get group members
 * @param {string} groupId
 * @returns {Array}
 */
export function getGroupMembers(groupId) {
  if (!groupId) return [];

  const travelGroups = getGroupsFromStorage();
  const group = travelGroups.find((g) => g.id === groupId);

  if (!group) return [];

  // Normalize member structure
  return group.members.map((m) => {
    if (typeof m === 'string') {
      return {
        id: m,
        username: 'Membre',
        avatar: '👤',
        role: m === group.creator ? MEMBER_ROLE.CREATOR : MEMBER_ROLE.MEMBER,
        joinedAt: group.createdAt,
      };
    }
    return m;
  });
}

/**
 * Get a specific group by ID
 * @param {string} groupId
 * @returns {Object|null}
 */
export function getGroupById(groupId) {
  if (!groupId) return null;

  const travelGroups = getGroupsFromStorage();
  return travelGroups.find((g) => g.id === groupId) || null;
}

/**
 * Invite a user to a group
 * @param {string} groupId
 * @param {string} userId - User to invite
 * @param {string} username - Display name (optional)
 * @returns {Object}
 */
export function inviteToGroup(groupId, userId, username = '') {
  if (!groupId || !userId) {
    return { success: false, error: 'invalid_parameters' };
  }

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    showToast(t('groupNotFound') || 'Groupe introuvable', 'error');
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };

  // Check if current user is a member
  const currentMember = group.members.find((m) =>
    typeof m === 'string' ? m === currentUserId : m.id === currentUserId
  );

  if (!currentMember) {
    showToast(t('mustBeMember') || 'Tu dois être membre pour inviter', 'error');
    return { success: false, error: 'not_a_member' };
  }

  // Check if user is already a member
  const isAlreadyMember = group.members.some((m) =>
    typeof m === 'string' ? m === userId : m.id === userId
  );

  if (isAlreadyMember) {
    showToast(t('userAlreadyInGroup') || 'Cet utilisateur est déjà dans le groupe', 'warning');
    return { success: false, error: 'already_member' };
  }

  // Check if invitation already exists
  const existingInvitation = (group.invitations || []).find(
    (inv) => inv.userId === userId && inv.status === INVITATION_STATUS.PENDING
  );

  if (existingInvitation) {
    showToast(t('invitationAlreadySent') || 'Invitation déjà envoyée', 'warning');
    return { success: false, error: 'invitation_exists' };
  }

  // Check if group is full
  if (group.members.length >= group.maxMembers) {
    showToast(t('groupFull') || 'Le groupe est complet', 'error');
    return { success: false, error: 'group_full' };
  }

  // Create invitation
  const invitation = {
    id: `inv_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    userId: userId,
    username: username || userId,
    invitedBy: currentUserId,
    invitedByName: state.username || 'Membre',
    status: INVITATION_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };

  group.invitations = group.invitations || [];
  group.invitations.push(invitation);
  group.updatedAt = new Date().toISOString();

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);

  showToast(t('invitationSent') || `Invitation envoyée à ${username || userId} !`, 'success');
  return { success: true, invitation };
}

/**
 * Accept a group invitation
 * @param {string} groupId
 * @param {string} invitationId
 * @returns {Object}
 */
export function acceptGroupInvitation(groupId, invitationId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };
  const invitationIndex = (group.invitations || []).findIndex(
    (inv) => inv.id === invitationId && inv.userId === userId
  );

  if (invitationIndex === -1) {
    return { success: false, error: 'invitation_not_found' };
  }

  const invitation = group.invitations[invitationIndex];

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    return { success: false, error: 'invitation_not_pending' };
  }

  // Check expiration
  if (new Date(invitation.expiresAt) < new Date()) {
    invitation.status = INVITATION_STATUS.EXPIRED;
    travelGroups[groupIndex] = group;
    saveGroupsToStorage(travelGroups);
    return { success: false, error: 'invitation_expired' };
  }

  // Check if group is full
  if (group.members.length >= group.maxMembers) {
    return { success: false, error: 'group_full' };
  }

  // Accept invitation and add as member
  invitation.status = INVITATION_STATUS.ACCEPTED;
  invitation.acceptedAt = new Date().toISOString();

  const newMember = {
    id: userId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    role: MEMBER_ROLE.MEMBER,
    joinedAt: new Date().toISOString(),
  };

  group.members.push(newMember);
  group.updatedAt = new Date().toISOString();

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);

  showToast(t('joinedGroup') || `Tu as rejoint "${group.name}" !`, 'success');
  return { success: true, group, member: newMember };
}

/**
 * Decline a group invitation
 * @param {string} groupId
 * @param {string} invitationId
 * @returns {Object}
 */
export function declineGroupInvitation(groupId, invitationId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };
  const invitationIndex = (group.invitations || []).findIndex(
    (inv) => inv.id === invitationId && inv.userId === userId
  );

  if (invitationIndex === -1) {
    return { success: false, error: 'invitation_not_found' };
  }

  group.invitations[invitationIndex].status = INVITATION_STATUS.DECLINED;
  group.invitations[invitationIndex].declinedAt = new Date().toISOString();
  group.updatedAt = new Date().toISOString();

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);

  showToast(t('invitationDeclined') || 'Invitation refusée', 'info');
  return { success: true };
}

/**
 * Get pending invitations for current user
 * @returns {Array}
 */
export function getPendingInvitations() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const travelGroups = getGroupsFromStorage();
  const pendingInvitations = [];

  travelGroups.forEach((group) => {
    const invitations = group.invitations || [];
    invitations.forEach((inv) => {
      if (inv.userId === userId && inv.status === INVITATION_STATUS.PENDING) {
        const now = new Date();
        if (new Date(inv.expiresAt) > now) {
          pendingInvitations.push({
            ...inv,
            groupId: group.id,
            groupName: group.name,
            destination: group.destination,
          });
        }
      }
    });
  });

  return pendingInvitations;
}

// ========================================
// ITINERARY FUNCTIONS
// ========================================

/**
 * Add a stop to the group itinerary
 * @param {string} groupId
 * @param {Object} stop - { name, location, spotId, date, notes }
 * @returns {Object}
 */
export function addItineraryStop(groupId, stop) {
  if (!groupId || !stop?.name) {
    return { success: false, error: 'invalid_parameters' };
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };

  // Check if user is a member
  const isMember = group.members.some((m) =>
    typeof m === 'string' ? m === userId : m.id === userId
  );

  if (!isMember) {
    return { success: false, error: 'not_a_member' };
  }

  const newStop = {
    id: `stop_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    name: stop.name,
    location: stop.location || null,
    spotId: stop.spotId || null,
    date: stop.date || null,
    notes: stop.notes || '',
    addedBy: userId,
    addedByName: state.username || 'Membre',
    order: (group.itinerary || []).length,
    createdAt: new Date().toISOString(),
  };

  group.itinerary = group.itinerary || [];
  group.itinerary.push(newStop);
  group.updatedAt = new Date().toISOString();

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);

  showToast(t('stopAdded') || `Étape "${stop.name}" ajoutée !`, 'success');
  return { success: true, stop: newStop };
}

/**
 * Remove a stop from the itinerary
 * @param {string} groupId
 * @param {string} stopId
 * @returns {Object}
 */
export function removeItineraryStop(groupId, stopId) {
  if (!groupId || !stopId) {
    return { success: false, error: 'invalid_parameters' };
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };
  const stopIndex = (group.itinerary || []).findIndex((s) => s.id === stopId);

  if (stopIndex === -1) {
    return { success: false, error: 'stop_not_found' };
  }

  // Check if user is creator or admin or the one who added
  const member = group.members.find((m) =>
    typeof m === 'string' ? m === userId : m.id === userId
  );
  const stop = group.itinerary[stopIndex];

  const isAdmin = member?.role === MEMBER_ROLE.CREATOR || member?.role === MEMBER_ROLE.ADMIN
  if (!member || (!isAdmin && stop.addedBy !== userId)) {
    return { success: false, error: 'not_authorized' };
  }

  group.itinerary.splice(stopIndex, 1);

  // Reorder remaining stops
  group.itinerary.forEach((s, i) => {
    s.order = i;
  });

  group.updatedAt = new Date().toISOString();

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);

  showToast(t('stopRemoved') || 'Étape supprimée', 'info');
  return { success: true };
}

/**
 * Reorder itinerary stops
 * @param {string} groupId
 * @param {Array} stopIds - Array of stop IDs in new order
 * @returns {Object}
 */
export function reorderItinerary(groupId, stopIds) {
  if (!groupId || !Array.isArray(stopIds)) {
    return { success: false, error: 'invalid_parameters' };
  }

  const travelGroups = getGroupsFromStorage();
  const groupIndex = travelGroups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return { success: false, error: 'group_not_found' };
  }

  const group = { ...travelGroups[groupIndex] };

  // Create new ordered itinerary
  const newItinerary = [];
  stopIds.forEach((stopId, index) => {
    const stop = (group.itinerary || []).find((s) => s.id === stopId);
    if (stop) {
      newItinerary.push({ ...stop, order: index });
    }
  });

  group.itinerary = newItinerary;
  group.updatedAt = new Date().toISOString();

  travelGroups[groupIndex] = group;
  saveGroupsToStorage(travelGroups);

  return { success: true, itinerary: newItinerary };
}

/**
 * Get group itinerary
 * @param {string} groupId
 * @returns {Array}
 */
export function getGroupItinerary(groupId) {
  if (!groupId) return [];

  const group = getGroupById(groupId);
  if (!group) return [];

  return (group.itinerary || []).sort((a, b) => a.order - b.order);
}

/**
 * Search for travel groups
 * @param {Object} filters
 * @returns {Array}
 */
export function searchTravelGroups(filters = {}) {
  let groups = getGroupsFromStorage();
  // Use SAMPLE_GROUPS if storage is empty
  if (groups.length === 0) {
    groups = [...SAMPLE_GROUPS];
  }

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

  const groups = getGroupsFromStorage();
  return groups.filter((g) =>
    g.members.some((m) =>
      typeof m === 'string' ? m === userId : m.id === userId
    )
  );
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
            ${icon('arrow-right', 'w-3 h-3')}
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
            ${icon('calendar', 'w-5 h-5 mr-1')}
            ${formatDate(group.startDate)}
          </div>
          <div>
            ${icon('users', 'w-5 h-5 mr-1')}
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
              ${icon('user-plus', 'w-5 h-5 mr-1')}
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
export function renderTravelGroupsList(_state) {
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
          ${icon('plus', 'w-5 h-5 mr-2')}
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
            ${icon('users', 'w-8 h-8 mb-2')}
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
            ${icon('arrow-left', 'w-5 h-5')}
          </button>
          ${isCreator ? `
            <button
              onclick="openEditTravelGroup()"
              class="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white"
              aria-label="Modifier"
            >
              ${icon('pencil', 'w-5 h-5')}
            </button>
          ` : ''}
          <div class="absolute bottom-4 left-4 right-4">
            <div class="flex items-center gap-2 text-white/90 text-sm mb-1">
              <span>${group.departure?.city}</span>
              ${icon('arrow-right', 'w-3 h-3')}
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
              ${icon('calendar', 'w-5 h-5 mr-1')}
              ${formatDate(group.startDate)} - ${formatDate(group.endDate)}
            </span>
            <span class="px-3 py-1 rounded-full bg-white/10 text-slate-300">
              ${icon('users', 'w-5 h-5 mr-1')}
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
                  <li>${icon('check', 'w-5 h-5 text-emerald-400 mr-2')}${r}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Members -->
          <div class="bg-dark-card rounded-xl p-4">
            <h3 class="font-semibold mb-3">Membres (${group.members.length}/${group.maxMembers})</h3>
            <div class="space-y-2">
              ${group.members.map((memberId) => `
                <div class="flex items-center gap-3 p-2 rounded-xl bg-white/5">
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
                    <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm shrink-0">${msg.avatar || '👤'}</div>
                    <div class="flex-1">
                      <div class="text-sm font-medium">${msg.username}</div>
                      <div class="text-sm text-slate-400">${msg.message}</div>
                    </div>
                  </div>
                `).join('') : `
                  <p class="text-slate-400 text-center py-4">Aucun message</p>
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
                  ${icon('send', 'w-5 h-5')}
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="flex gap-3">
            ${!isMember && group.status === 'planning' && group.members.length < group.maxMembers ? `
              <button onclick="joinTravelGroup('${group.id}')" class="btn btn-primary flex-1">
                ${icon('user-plus', 'w-5 h-5 mr-2')}
                Rejoindre
              </button>
            ` : ''}
            ${isMember && !isCreator ? `
              <button onclick="leaveTravelGroup('${group.id}')" class="btn btn-danger flex-1">
                ${icon('log-out', 'w-5 h-5 mr-2')}
                Quitter
              </button>
            ` : ''}
            ${isCreator && group.status === 'planning' ? `
              <button onclick="updateGroupStatus('${group.id}', 'active')" class="btn btn-success flex-1">
                ${icon('play', 'w-5 h-5 mr-2')}
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

// openCreateTravelGroup/closeCreateTravelGroup defined in main.js (canonical STUB)
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

// Additional global handlers
window.createTravelGroup = createTravelGroup;
window.createGroup = createGroup;
window.acceptGroupInvitation = acceptGroupInvitation;
window.declineGroupInvitation = declineGroupInvitation;
window.addItineraryStop = addItineraryStop;
window.removeItineraryStop = removeItineraryStop;
window.openEditTravelGroup = () => setState({ editingTravelGroup: true });

export default {
  // Constants
  GROUP_STATUS,
  MEMBER_ROLE,
  INVITATION_STATUS,

  // Core CRUD
  createGroup,
  createTravelGroup,
  joinGroup,
  joinTravelGroup,
  leaveGroup,
  leaveTravelGroup,
  getGroupById,
  getGroupMembers,
  searchTravelGroups,
  getMyTravelGroups,
  updateGroupStatus,

  // Invitations
  inviteToGroup,
  acceptGroupInvitation,
  declineGroupInvitation,
  getPendingInvitations,

  // Itinerary
  addItineraryStop,
  removeItineraryStop,
  reorderItinerary,
  getGroupItinerary,

  // Chat
  sendGroupMessage,

  // Render functions
  renderTravelGroupCard,
  renderTravelGroupsList,
  renderTravelGroupDetail,
};
