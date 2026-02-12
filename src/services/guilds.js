/**
 * Guilds/Clans Service
 * Create and manage guilds for hitchhikers community
 * Feature #162
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { escapeHTML } from '../utils/sanitize.js';

/**
 * Guild roles enum
 */
export const GuildRole = {
  LEADER: 'leader',
  OFFICER: 'officer',
  MEMBER: 'member',
};

/**
 * Guild membership status enum
 */
export const MembershipStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  LEFT: 'left',
  KICKED: 'kicked',
};

/**
 * Maximum guild members
 */
const MAX_GUILD_MEMBERS = 50;

/**
 * Create a new guild
 * @param {string} name - Guild name (3-30 characters)
 * @param {string} description - Guild description (max 200 characters)
 * @param {boolean} isPublic - Whether guild is public (default true)
 * @returns {Object|null} Created guild or null if error
 */
export function createGuild(name, description = '', isPublic = true) {
  const state = getState();
  const userId = state.user?.uid || 'local';

  // Validation
  if (!name || typeof name !== 'string') {
    showToast(t('guildNameRequired'), 'error');
    return null;
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    showToast(t('guildNameTooShort'), 'error');
    return null;
  }

  if (trimmedName.length > 30) {
    showToast(t('guildNameTooLong'), 'error');
    return null;
  }

  // Check if user already has a guild
  const existingGuild = getMyGuild();
  if (existingGuild) {
    showToast(t('alreadyInGuild'), 'error');
    return null;
  }

  // Check for duplicate names (case insensitive)
  const guilds = state.guilds || [];
  const nameLower = trimmedName.toLowerCase();
  if (guilds.some(g => g.name.toLowerCase() === nameLower)) {
    showToast(t('guildNameTaken'), 'error');
    return null;
  }

  const trimmedDesc = (description || '').trim().substring(0, 200);

  const guild = {
    id: `guild_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: trimmedName,
    description: trimmedDesc,
    isPublic: Boolean(isPublic),
    leaderId: userId,
    leaderName: state.username || 'Leader',
    createdAt: new Date().toISOString(),
    members: [
      {
        id: userId,
        name: state.username || 'Leader',
        avatar: state.avatar || '',
        role: GuildRole.LEADER,
        joinedAt: new Date().toISOString(),
        status: MembershipStatus.ACTIVE,
        xpContributed: 0,
        spotsContributed: 0,
        distanceContributed: 0,
      },
    ],
    pendingRequests: [],
    stats: {
      totalXp: 0,
      totalSpots: 0,
      totalDistance: 0,
      totalMembers: 1,
    },
    settings: {
      minLevel: 1,
      requireApproval: !isPublic,
      allowChat: true,
      icon: '',
      color: '#FF6B35',
    },
  };

  // Add to state
  setState({
    guilds: [...guilds, guild],
    myGuildId: guild.id,
  });

  showToast(t('guildCreated', { name: trimmedName }), 'success');
  return guild;
}

/**
 * Join a public guild
 * @param {string} guildId - Guild ID to join
 * @returns {boolean} Success status
 */
export function joinGuild(guildId) {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) {
    showToast(t('guildNotFound'), 'error');
    return false;
  }

  const guild = guilds[guildIndex];

  // Check if already in a guild
  if (getMyGuild()) {
    showToast(t('alreadyInGuild'), 'error');
    return false;
  }

  // Check if guild is public
  if (!guild.isPublic) {
    showToast(t('guildIsPrivate'), 'error');
    return false;
  }

  // Check if already a member
  if (guild.members.some(m => m.id === userId && m.status === MembershipStatus.ACTIVE)) {
    showToast(t('alreadyGuildMember'), 'error');
    return false;
  }

  // Check max members
  const activeMembers = guild.members.filter(m => m.status === MembershipStatus.ACTIVE);
  if (activeMembers.length >= MAX_GUILD_MEMBERS) {
    showToast(t('guildFull'), 'error');
    return false;
  }

  // Check minimum level
  if (guild.settings?.minLevel && (state.level || 1) < guild.settings.minLevel) {
    showToast(t('guildLevelRequired', { level: guild.settings.minLevel }), 'error');
    return false;
  }

  // Add member
  const newMember = {
    id: userId,
    name: state.username || 'Member',
    avatar: state.avatar || '',
    role: GuildRole.MEMBER,
    joinedAt: new Date().toISOString(),
    status: MembershipStatus.ACTIVE,
    xpContributed: 0,
    spotsContributed: 0,
    distanceContributed: 0,
  };

  guilds[guildIndex] = {
    ...guild,
    members: [...guild.members, newMember],
    stats: {
      ...guild.stats,
      totalMembers: activeMembers.length + 1,
    },
  };

  setState({
    guilds: [...guilds],
    myGuildId: guildId,
  });

  showToast(t('guildJoined', { name: guild.name }), 'success');
  return true;
}

/**
 * Request to join a private guild
 * @param {string} guildId - Guild ID to request to join
 * @returns {boolean} Success status
 */
export function requestJoinGuild(guildId) {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) {
    showToast(t('guildNotFound'), 'error');
    return false;
  }

  const guild = guilds[guildIndex];

  // Check if already in a guild
  if (getMyGuild()) {
    showToast(t('alreadyInGuild'), 'error');
    return false;
  }

  // Check if already requested
  if (guild.pendingRequests?.some(r => r.id === userId)) {
    showToast(t('guildRequestPending'), 'error');
    return false;
  }

  // Check if already a member
  if (guild.members.some(m => m.id === userId && m.status === MembershipStatus.ACTIVE)) {
    showToast(t('alreadyGuildMember'), 'error');
    return false;
  }

  // Check max members
  const activeMembers = guild.members.filter(m => m.status === MembershipStatus.ACTIVE);
  if (activeMembers.length >= MAX_GUILD_MEMBERS) {
    showToast(t('guildFull'), 'error');
    return false;
  }

  // Check minimum level
  if (guild.settings?.minLevel && (state.level || 1) < guild.settings.minLevel) {
    showToast(t('guildLevelRequired', { level: guild.settings.minLevel }), 'error');
    return false;
  }

  // Add request
  const request = {
    id: userId,
    name: state.username || 'User',
    avatar: state.avatar || '',
    level: state.level || 1,
    requestedAt: new Date().toISOString(),
  };

  guilds[guildIndex] = {
    ...guild,
    pendingRequests: [...(guild.pendingRequests || []), request],
  };

  setState({ guilds: [...guilds] });

  showToast(t('guildRequestSent', { name: guild.name }), 'success');
  return true;
}

/**
 * Accept a join request (leader/officer only)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID to accept
 * @returns {boolean} Success status
 */
export function acceptJoinRequest(guildId, userId) {
  const state = getState();
  const currentUserId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) return false;

  const guild = guilds[guildIndex];

  // Check permissions
  const currentMember = guild.members.find(m => m.id === currentUserId);
  if (!currentMember || (currentMember.role !== GuildRole.LEADER && currentMember.role !== GuildRole.OFFICER)) {
    showToast(t('guildNoPermission'), 'error');
    return false;
  }

  // Find request
  const requestIndex = guild.pendingRequests?.findIndex(r => r.id === userId);
  if (requestIndex === -1 || requestIndex === undefined) {
    showToast(t('guildRequestNotFound'), 'error');
    return false;
  }

  const request = guild.pendingRequests[requestIndex];

  // Add as member
  const newMember = {
    id: request.id,
    name: request.name,
    avatar: request.avatar || '',
    role: GuildRole.MEMBER,
    joinedAt: new Date().toISOString(),
    status: MembershipStatus.ACTIVE,
    xpContributed: 0,
    spotsContributed: 0,
    distanceContributed: 0,
  };

  const newPendingRequests = [...guild.pendingRequests];
  newPendingRequests.splice(requestIndex, 1);

  const activeMembers = guild.members.filter(m => m.status === MembershipStatus.ACTIVE);

  guilds[guildIndex] = {
    ...guild,
    members: [...guild.members, newMember],
    pendingRequests: newPendingRequests,
    stats: {
      ...guild.stats,
      totalMembers: activeMembers.length + 1,
    },
  };

  setState({ guilds: [...guilds] });

  showToast(t('guildRequestAccepted', { name: request.name }), 'success');
  return true;
}

/**
 * Reject a join request (leader/officer only)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID to reject
 * @returns {boolean} Success status
 */
export function rejectJoinRequest(guildId, userId) {
  const state = getState();
  const currentUserId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) return false;

  const guild = guilds[guildIndex];

  // Check permissions
  const currentMember = guild.members.find(m => m.id === currentUserId);
  if (!currentMember || (currentMember.role !== GuildRole.LEADER && currentMember.role !== GuildRole.OFFICER)) {
    showToast(t('guildNoPermission'), 'error');
    return false;
  }

  // Find and remove request
  const newPendingRequests = guild.pendingRequests?.filter(r => r.id !== userId) || [];

  if (newPendingRequests.length === guild.pendingRequests?.length) {
    showToast(t('guildRequestNotFound'), 'error');
    return false;
  }

  guilds[guildIndex] = {
    ...guild,
    pendingRequests: newPendingRequests,
  };

  setState({ guilds: [...guilds] });

  showToast(t('guildRequestRejected'), 'info');
  return true;
}

/**
 * Leave a guild
 * @param {string} guildId - Guild ID to leave
 * @returns {boolean} Success status
 */
export function leaveGuild(guildId) {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) {
    showToast(t('guildNotFound'), 'error');
    return false;
  }

  const guild = guilds[guildIndex];
  const memberIndex = guild.members.findIndex(
    m => m.id === userId && m.status === MembershipStatus.ACTIVE
  );

  if (memberIndex === -1) {
    showToast(t('notGuildMember'), 'error');
    return false;
  }

  const member = guild.members[memberIndex];

  // Leader cannot leave, must transfer or disband
  if (member.role === GuildRole.LEADER) {
    const otherActiveMembers = guild.members.filter(
      m => m.id !== userId && m.status === MembershipStatus.ACTIVE
    );
    if (otherActiveMembers.length > 0) {
      showToast(t('guildLeaderMustTransfer'), 'error');
      return false;
    }
    // Disband guild if leader is only member
    return disbandGuild(guildId);
  }

  // Update member status
  const updatedMembers = [...guild.members];
  updatedMembers[memberIndex] = {
    ...member,
    status: MembershipStatus.LEFT,
    leftAt: new Date().toISOString(),
  };

  const activeMembers = updatedMembers.filter(m => m.status === MembershipStatus.ACTIVE);

  guilds[guildIndex] = {
    ...guild,
    members: updatedMembers,
    stats: {
      ...guild.stats,
      totalMembers: activeMembers.length,
    },
  };

  setState({
    guilds: [...guilds],
    myGuildId: null,
  });

  showToast(t('guildLeft', { name: guild.name }), 'success');
  return true;
}

/**
 * Disband a guild (leader only)
 * @param {string} guildId - Guild ID to disband
 * @returns {boolean} Success status
 */
export function disbandGuild(guildId) {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) return false;

  const guild = guilds[guildIndex];

  // Only leader can disband
  if (guild.leaderId !== userId) {
    showToast(t('guildOnlyLeaderCanDisband'), 'error');
    return false;
  }

  // Remove guild
  const newGuilds = guilds.filter(g => g.id !== guildId);

  setState({
    guilds: newGuilds,
    myGuildId: state.myGuildId === guildId ? null : state.myGuildId,
  });

  showToast(t('guildDisbanded', { name: guild.name }), 'success');
  return true;
}

/**
 * Get user's current guild
 * @returns {Object|null} User's guild or null
 */
export function getMyGuild() {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guilds = state.guilds || [];

  // First check by myGuildId
  if (state.myGuildId) {
    const guild = guilds.find(g => g.id === state.myGuildId);
    if (guild) {
      const member = guild.members.find(m => m.id === userId && m.status === MembershipStatus.ACTIVE);
      if (member) return guild;
    }
  }

  // Fallback: search all guilds
  return guilds.find(g =>
    g.members.some(m => m.id === userId && m.status === MembershipStatus.ACTIVE)
  ) || null;
}

/**
 * Get guild members
 * @param {string} guildId - Guild ID
 * @param {boolean} activeOnly - Only return active members (default true)
 * @returns {Object[]} Array of members
 */
export function getGuildMembers(guildId, activeOnly = true) {
  const state = getState();
  const guilds = state.guilds || [];
  const guild = guilds.find(g => g.id === guildId);

  if (!guild) return [];

  if (activeOnly) {
    return guild.members.filter(m => m.status === MembershipStatus.ACTIVE);
  }

  return guild.members;
}

/**
 * Get guild statistics
 * @param {string} guildId - Guild ID
 * @returns {Object} Guild stats
 */
export function getGuildStats(guildId) {
  const state = getState();
  const guilds = state.guilds || [];
  const guild = guilds.find(g => g.id === guildId);

  if (!guild) {
    return {
      totalXp: 0,
      totalSpots: 0,
      totalDistance: 0,
      totalMembers: 0,
      avgXpPerMember: 0,
      avgSpotsPerMember: 0,
      rank: 0,
    };
  }

  const activeMembers = guild.members.filter(m => m.status === MembershipStatus.ACTIVE);
  const totalXp = activeMembers.reduce((sum, m) => sum + (m.xpContributed || 0), 0);
  const totalSpots = activeMembers.reduce((sum, m) => sum + (m.spotsContributed || 0), 0);
  const totalDistance = activeMembers.reduce((sum, m) => sum + (m.distanceContributed || 0), 0);

  // Calculate rank
  const sortedGuilds = [...guilds].sort((a, b) => {
    const aXp = a.members.filter(m => m.status === MembershipStatus.ACTIVE)
      .reduce((sum, m) => sum + (m.xpContributed || 0), 0);
    const bXp = b.members.filter(m => m.status === MembershipStatus.ACTIVE)
      .reduce((sum, m) => sum + (m.xpContributed || 0), 0);
    return bXp - aXp;
  });
  const rank = sortedGuilds.findIndex(g => g.id === guildId) + 1;

  return {
    totalXp,
    totalSpots,
    totalDistance,
    totalMembers: activeMembers.length,
    avgXpPerMember: activeMembers.length > 0 ? Math.round(totalXp / activeMembers.length) : 0,
    avgSpotsPerMember: activeMembers.length > 0 ? Math.round(totalSpots / activeMembers.length) : 0,
    rank,
  };
}

/**
 * Get guild leaderboard
 * @param {number} limit - Max guilds to return (default 10)
 * @returns {Object[]} Sorted array of guilds with stats
 */
export function getGuildLeaderboard(limit = 10) {
  const state = getState();
  const guilds = state.guilds || [];

  return guilds
    .map(guild => {
      const stats = getGuildStats(guild.id);
      return {
        id: guild.id,
        name: guild.name,
        description: guild.description,
        isPublic: guild.isPublic,
        leaderName: guild.leaderName,
        icon: guild.settings?.icon || '',
        color: guild.settings?.color || '#FF6B35',
        ...stats,
      };
    })
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, limit)
    .map((guild, index) => ({
      ...guild,
      rank: index + 1,
    }));
}

/**
 * Promote a member to officer (leader only)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID to promote
 * @returns {boolean} Success status
 */
export function promoteToOfficer(guildId, userId) {
  const state = getState();
  const currentUserId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) {
    showToast(t('guildNotFound'), 'error');
    return false;
  }

  const guild = guilds[guildIndex];

  // Only leader can promote
  if (guild.leaderId !== currentUserId) {
    showToast(t('guildOnlyLeaderCanPromote'), 'error');
    return false;
  }

  // Cannot promote self
  if (userId === currentUserId) {
    showToast(t('guildCannotPromoteSelf'), 'error');
    return false;
  }

  // Find member
  const memberIndex = guild.members.findIndex(
    m => m.id === userId && m.status === MembershipStatus.ACTIVE
  );

  if (memberIndex === -1) {
    showToast(t('guildMemberNotFound'), 'error');
    return false;
  }

  const member = guild.members[memberIndex];

  // Already officer or leader
  if (member.role === GuildRole.OFFICER || member.role === GuildRole.LEADER) {
    showToast(t('guildAlreadyOfficer'), 'error');
    return false;
  }

  // Promote
  const updatedMembers = [...guild.members];
  updatedMembers[memberIndex] = {
    ...member,
    role: GuildRole.OFFICER,
    promotedAt: new Date().toISOString(),
  };

  guilds[guildIndex] = {
    ...guild,
    members: updatedMembers,
  };

  setState({ guilds: [...guilds] });

  showToast(t('guildMemberPromoted', { name: member.name }), 'success');
  return true;
}

/**
 * Demote an officer to member (leader only)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID to demote
 * @returns {boolean} Success status
 */
export function demoteToMember(guildId, userId) {
  const state = getState();
  const currentUserId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) return false;

  const guild = guilds[guildIndex];

  // Only leader can demote
  if (guild.leaderId !== currentUserId) {
    showToast(t('guildOnlyLeaderCanDemote'), 'error');
    return false;
  }

  // Find member
  const memberIndex = guild.members.findIndex(
    m => m.id === userId && m.status === MembershipStatus.ACTIVE
  );

  if (memberIndex === -1) return false;

  const member = guild.members[memberIndex];

  // Can only demote officers
  if (member.role !== GuildRole.OFFICER) {
    showToast(t('guildCannotDemote'), 'error');
    return false;
  }

  // Demote
  const updatedMembers = [...guild.members];
  updatedMembers[memberIndex] = {
    ...member,
    role: GuildRole.MEMBER,
    demotedAt: new Date().toISOString(),
  };

  guilds[guildIndex] = {
    ...guild,
    members: updatedMembers,
  };

  setState({ guilds: [...guilds] });

  showToast(t('guildMemberDemoted', { name: member.name }), 'info');
  return true;
}

/**
 * Transfer leadership (leader only)
 * @param {string} guildId - Guild ID
 * @param {string} newLeaderId - New leader's user ID
 * @returns {boolean} Success status
 */
export function transferLeadership(guildId, newLeaderId) {
  const state = getState();
  const currentUserId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) return false;

  const guild = guilds[guildIndex];

  // Only leader can transfer
  if (guild.leaderId !== currentUserId) {
    showToast(t('guildOnlyLeaderCanTransfer'), 'error');
    return false;
  }

  // Cannot transfer to self
  if (newLeaderId === currentUserId) {
    showToast(t('guildCannotTransferToSelf'), 'error');
    return false;
  }

  // Find new leader
  const newLeaderIndex = guild.members.findIndex(
    m => m.id === newLeaderId && m.status === MembershipStatus.ACTIVE
  );

  if (newLeaderIndex === -1) {
    showToast(t('guildMemberNotFound'), 'error');
    return false;
  }

  const oldLeaderIndex = guild.members.findIndex(m => m.id === currentUserId);
  const newLeader = guild.members[newLeaderIndex];

  // Update roles
  const updatedMembers = [...guild.members];
  updatedMembers[oldLeaderIndex] = {
    ...updatedMembers[oldLeaderIndex],
    role: GuildRole.OFFICER,
  };
  updatedMembers[newLeaderIndex] = {
    ...newLeader,
    role: GuildRole.LEADER,
  };

  guilds[guildIndex] = {
    ...guild,
    leaderId: newLeaderId,
    leaderName: newLeader.name,
    members: updatedMembers,
  };

  setState({ guilds: [...guilds] });

  showToast(t('guildLeadershipTransferred', { name: newLeader.name }), 'success');
  return true;
}

/**
 * Kick a member from guild (leader/officer only)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID to kick
 * @returns {boolean} Success status
 */
export function kickMember(guildId, userId) {
  const state = getState();
  const currentUserId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) {
    showToast(t('guildNotFound'), 'error');
    return false;
  }

  const guild = guilds[guildIndex];

  // Check permissions
  const currentMember = guild.members.find(m => m.id === currentUserId);
  if (!currentMember || (currentMember.role !== GuildRole.LEADER && currentMember.role !== GuildRole.OFFICER)) {
    showToast(t('guildNoPermission'), 'error');
    return false;
  }

  // Cannot kick self
  if (userId === currentUserId) {
    showToast(t('guildCannotKickSelf'), 'error');
    return false;
  }

  // Find member to kick
  const memberIndex = guild.members.findIndex(
    m => m.id === userId && m.status === MembershipStatus.ACTIVE
  );

  if (memberIndex === -1) {
    showToast(t('guildMemberNotFound'), 'error');
    return false;
  }

  const member = guild.members[memberIndex];

  // Officers cannot kick leader or other officers
  if (currentMember.role === GuildRole.OFFICER &&
      (member.role === GuildRole.LEADER || member.role === GuildRole.OFFICER)) {
    showToast(t('guildCannotKickHigherRank'), 'error');
    return false;
  }

  // Cannot kick leader
  if (member.role === GuildRole.LEADER) {
    showToast(t('guildCannotKickLeader'), 'error');
    return false;
  }

  // Update member status
  const updatedMembers = [...guild.members];
  updatedMembers[memberIndex] = {
    ...member,
    status: MembershipStatus.KICKED,
    kickedAt: new Date().toISOString(),
    kickedBy: currentUserId,
  };

  const activeMembers = updatedMembers.filter(m => m.status === MembershipStatus.ACTIVE);

  guilds[guildIndex] = {
    ...guild,
    members: updatedMembers,
    stats: {
      ...guild.stats,
      totalMembers: activeMembers.length,
    },
  };

  // If kicked user is current user, clear their guild
  const updates = { guilds: [...guilds] };
  if (state.myGuildId === guildId && userId === (state.user?.uid || 'local')) {
    updates.myGuildId = null;
  }

  setState(updates);

  showToast(t('guildMemberKicked', { name: member.name }), 'success');
  return true;
}

/**
 * Update guild settings (leader only)
 * @param {string} guildId - Guild ID
 * @param {Object} settings - Settings to update
 * @returns {boolean} Success status
 */
export function updateGuildSettings(guildId, settings) {
  const state = getState();
  const currentUserId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guildId);

  if (guildIndex === -1) {
    showToast(t('guildNotFound'), 'error');
    return false;
  }

  const guild = guilds[guildIndex];

  // Only leader can update settings
  if (guild.leaderId !== currentUserId) {
    showToast(t('guildOnlyLeaderCanUpdate'), 'error');
    return false;
  }

  // Validate settings
  const validSettings = {};

  if (settings.name !== undefined) {
    const trimmedName = settings.name.trim();
    if (trimmedName.length >= 3 && trimmedName.length <= 30) {
      // Check for duplicate names
      const nameLower = trimmedName.toLowerCase();
      const duplicate = guilds.some(g => g.id !== guildId && g.name.toLowerCase() === nameLower);
      if (!duplicate) {
        validSettings.name = trimmedName;
      }
    }
  }

  if (settings.description !== undefined) {
    validSettings.description = settings.description.trim().substring(0, 200);
  }

  if (settings.isPublic !== undefined) {
    validSettings.isPublic = Boolean(settings.isPublic);
  }

  // Nested settings
  const newSettings = { ...guild.settings };

  if (settings.minLevel !== undefined) {
    const level = parseInt(settings.minLevel);
    if (level >= 1 && level <= 100) {
      newSettings.minLevel = level;
    }
  }

  if (settings.requireApproval !== undefined) {
    newSettings.requireApproval = Boolean(settings.requireApproval);
  }

  if (settings.allowChat !== undefined) {
    newSettings.allowChat = Boolean(settings.allowChat);
  }

  if (settings.icon !== undefined) {
    newSettings.icon = settings.icon.substring(0, 4); // Emoji max
  }

  if (settings.color !== undefined && /^#[0-9A-Fa-f]{6}$/.test(settings.color)) {
    newSettings.color = settings.color;
  }

  guilds[guildIndex] = {
    ...guild,
    ...validSettings,
    settings: newSettings,
  };

  setState({ guilds: [...guilds] });

  showToast(t('guildSettingsUpdated'), 'success');
  return true;
}

/**
 * Contribute XP to guild
 * @param {number} xp - XP amount
 * @param {string} source - Source of XP
 */
export function contributeXp(xp, source = '') {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guild = getMyGuild();

  if (!guild) return;

  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guild.id);

  if (guildIndex === -1) return;

  const memberIndex = guild.members.findIndex(m => m.id === userId);
  if (memberIndex === -1) return;

  const updatedMembers = [...guild.members];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    xpContributed: (updatedMembers[memberIndex].xpContributed || 0) + xp,
  };

  guilds[guildIndex] = {
    ...guild,
    members: updatedMembers,
    stats: {
      ...guild.stats,
      totalXp: (guild.stats?.totalXp || 0) + xp,
    },
  };

  setState({ guilds: [...guilds] });
}

/**
 * Contribute spot discovery to guild
 */
export function contributeSpot() {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guild = getMyGuild();

  if (!guild) return;

  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guild.id);

  if (guildIndex === -1) return;

  const memberIndex = guild.members.findIndex(m => m.id === userId);
  if (memberIndex === -1) return;

  const updatedMembers = [...guild.members];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    spotsContributed: (updatedMembers[memberIndex].spotsContributed || 0) + 1,
  };

  guilds[guildIndex] = {
    ...guild,
    members: updatedMembers,
    stats: {
      ...guild.stats,
      totalSpots: (guild.stats?.totalSpots || 0) + 1,
    },
  };

  setState({ guilds: [...guilds] });
}

/**
 * Contribute distance to guild
 * @param {number} km - Distance in kilometers
 */
export function contributeDistance(km) {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guild = getMyGuild();

  if (!guild) return;

  const guilds = state.guilds || [];
  const guildIndex = guilds.findIndex(g => g.id === guild.id);

  if (guildIndex === -1) return;

  const memberIndex = guild.members.findIndex(m => m.id === userId);
  if (memberIndex === -1) return;

  const updatedMembers = [...guild.members];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    distanceContributed: (updatedMembers[memberIndex].distanceContributed || 0) + km,
  };

  guilds[guildIndex] = {
    ...guild,
    members: updatedMembers,
    stats: {
      ...guild.stats,
      totalDistance: (guild.stats?.totalDistance || 0) + km,
    },
  };

  setState({ guilds: [...guilds] });
}

/**
 * Get all guilds
 * @param {boolean} publicOnly - Only return public guilds (default false)
 * @returns {Object[]} Array of guilds
 */
export function getAllGuilds(publicOnly = false) {
  const state = getState();
  const guilds = state.guilds || [];

  if (publicOnly) {
    return guilds.filter(g => g.isPublic);
  }

  return guilds;
}

/**
 * Get guild by ID
 * @param {string} guildId - Guild ID
 * @returns {Object|null} Guild or null
 */
export function getGuildById(guildId) {
  const state = getState();
  const guilds = state.guilds || [];
  return guilds.find(g => g.id === guildId) || null;
}

/**
 * Search guilds by name
 * @param {string} query - Search query
 * @returns {Object[]} Matching guilds
 */
export function searchGuilds(query) {
  const state = getState();
  const guilds = state.guilds || [];
  const queryLower = (query || '').toLowerCase().trim();

  if (!queryLower) return guilds.filter(g => g.isPublic);

  return guilds.filter(g =>
    g.isPublic && (
      g.name.toLowerCase().includes(queryLower) ||
      g.description.toLowerCase().includes(queryLower)
    )
  );
}

/**
 * Get user's role in a guild
 * @param {string} guildId - Guild ID
 * @returns {string|null} Role or null if not a member
 */
export function getMyRole(guildId) {
  const state = getState();
  const userId = state.user?.uid || 'local';
  const guilds = state.guilds || [];
  const guild = guilds.find(g => g.id === guildId);

  if (!guild) return null;

  const member = guild.members.find(m => m.id === userId && m.status === MembershipStatus.ACTIVE);
  return member?.role || null;
}

/**
 * Render guild card HTML
 * @param {Object} guild - Guild object
 * @returns {string} HTML string
 */
export function renderGuildCard(guild) {
  const state = getState();
  const stats = getGuildStats(guild.id);
  const myRole = getMyRole(guild.id);
  const isMyGuild = myRole !== null;

  const roleIcons = {
    [GuildRole.LEADER]: '',
    [GuildRole.OFFICER]: '',
    [GuildRole.MEMBER]: '',
  };

  return `
    <div class="bg-dark-primary rounded-xl p-4 border border-white/10 hover:border-primary/50 transition-colors"
         data-guild-id="${escapeHTML(guild.id)}">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
             style="background-color: ${escapeHTML(guild.settings?.color || '#FF6B35')}20">
          ${escapeHTML(guild.settings?.icon || '')}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-white truncate">${escapeHTML(guild.name)}</h3>
            ${!guild.isPublic ? '<span class="text-xs text-slate-400"></span>' : ''}
            ${isMyGuild ? `<span class="text-xs text-primary">${roleIcons[myRole] || ''}</span>` : ''}
          </div>
          <p class="text-xs text-slate-400">${escapeHTML(guild.leaderName)}</p>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-primary">#${stats.rank}</div>
          <div class="text-xs text-slate-400">${stats.totalMembers}/50</div>
        </div>
      </div>

      ${guild.description ? `
        <p class="text-sm text-slate-300 mb-3 line-clamp-2">${escapeHTML(guild.description)}</p>
      ` : ''}

      <div class="flex items-center gap-4 text-xs text-slate-400 mb-3">
        <span class="flex items-center gap-1">
          <span>XP</span>
          <span class="text-white font-medium">${stats.totalXp.toLocaleString()}</span>
        </span>
        <span class="flex items-center gap-1">
          <span>Spots</span>
          <span class="text-white font-medium">${stats.totalSpots}</span>
        </span>
        <span class="flex items-center gap-1">
          <span>km</span>
          <span class="text-white font-medium">${stats.totalDistance.toLocaleString()}</span>
        </span>
      </div>

      ${!isMyGuild ? `
        <div class="flex gap-2">
          ${guild.isPublic ? `
            <button onclick="window.joinGuild('${escapeHTML(guild.id)}')"
                    class="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors">
              ${t('guildJoinButton')}
            </button>
          ` : `
            <button onclick="window.requestJoinGuild('${escapeHTML(guild.id)}')"
                    class="flex-1 bg-white/5 text-white py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
              ${t('guildRequestButton')}
            </button>
          `}
        </div>
      ` : `
        <div class="flex gap-2">
          <button onclick="window.viewGuild('${escapeHTML(guild.id)}')"
                  class="flex-1 bg-white/5 text-white py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            ${t('guildViewButton')}
          </button>
        </div>
      `}
    </div>
  `;
}

/**
 * Render guild list HTML
 * @param {Object[]} guilds - Array of guilds
 * @returns {string} HTML string
 */
export function renderGuildList(guilds) {
  if (!guilds || guilds.length === 0) {
    return `
      <div class="text-center py-12">
        <div class="text-4xl mb-4">&#127979;</div>
        <p class="text-slate-400">${t('noGuildsFound')}</p>
        <button onclick="window.showCreateGuild()"
                class="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/80 transition-colors">
          ${t('createGuildButton')}
        </button>
      </div>
    `;
  }

  return `
    <div class="grid gap-4">
      ${guilds.map(guild => renderGuildCard(guild)).join('')}
    </div>
  `;
}

/**
 * Render guild member list HTML
 * @param {Object[]} members - Array of members
 * @param {string} guildId - Guild ID (for actions)
 * @returns {string} HTML string
 */
export function renderMemberList(members, guildId) {
  const state = getState();
  const myRole = getMyRole(guildId);
  const isLeader = myRole === GuildRole.LEADER;
  const isOfficer = myRole === GuildRole.OFFICER;

  const roleLabels = {
    [GuildRole.LEADER]: t('guildRoleLeader'),
    [GuildRole.OFFICER]: t('guildRoleOfficer'),
    [GuildRole.MEMBER]: t('guildRoleMember'),
  };

  const roleColors = {
    [GuildRole.LEADER]: 'text-yellow-400',
    [GuildRole.OFFICER]: 'text-blue-400',
    [GuildRole.MEMBER]: 'text-slate-400',
  };

  return members.map(member => `
    <div class="flex items-center gap-3 p-3 bg-dark-primary rounded-lg">
      <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
        ${escapeHTML(member.avatar || '')}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-medium text-white truncate">${escapeHTML(member.name)}</span>
          <span class="text-xs ${roleColors[member.role]}">${roleLabels[member.role]}</span>
        </div>
        <div class="text-xs text-slate-400">
          ${(member.xpContributed || 0).toLocaleString()} XP
        </div>
      </div>
      ${(isLeader || isOfficer) && member.role === GuildRole.MEMBER && member.id !== (state.user?.uid || 'local') ? `
        <div class="flex gap-1">
          ${isLeader ? `
            <button onclick="window.promoteToOfficer('${escapeHTML(guildId)}', '${escapeHTML(member.id)}')"
                    class="p-2 text-blue-400 hover:bg-white/5 rounded"
                    title="${t('promote')}">
              &#11014;
            </button>
          ` : ''}
          <button onclick="window.kickMember('${escapeHTML(guildId)}', '${escapeHTML(member.id)}')"
                  class="p-2 text-red-400 hover:bg-white/5 rounded"
                  title="${t('kick')}">
            &#10006;
          </button>
        </div>
      ` : ''}
      ${isLeader && member.role === GuildRole.OFFICER && member.id !== (state.user?.uid || 'local') ? `
        <div class="flex gap-1">
          <button onclick="window.demoteToMember('${escapeHTML(guildId)}', '${escapeHTML(member.id)}')"
                  class="p-2 text-slate-400 hover:bg-white/5 rounded"
                  title="${t('demote')}">
            &#11015;
          </button>
          <button onclick="window.kickMember('${escapeHTML(guildId)}', '${escapeHTML(member.id)}')"
                  class="p-2 text-red-400 hover:bg-white/5 rounded"
                  title="${t('kick')}">
            &#10006;
          </button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

export default {
  // Enums
  GuildRole,
  MembershipStatus,
  // Guild management
  createGuild,
  joinGuild,
  requestJoinGuild,
  acceptJoinRequest,
  rejectJoinRequest,
  leaveGuild,
  disbandGuild,
  // Member management
  promoteToOfficer,
  demoteToMember,
  transferLeadership,
  kickMember,
  // Settings
  updateGuildSettings,
  // Queries
  getMyGuild,
  getGuildMembers,
  getGuildStats,
  getGuildLeaderboard,
  getAllGuilds,
  getGuildById,
  searchGuilds,
  getMyRole,
  // Contributions
  contributeXp,
  contributeSpot,
  contributeDistance,
  // Rendering
  renderGuildCard,
  renderGuildList,
  renderMemberList,
};
