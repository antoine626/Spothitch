/**
 * Moderator Roles Service
 * Feature #216 - Service pour gerer les roles de moderation
 *
 * Gestion des roles et permissions de moderation avec hierarchie
 * et panel de moderateur.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage keys
const MODERATOR_ROLES_KEY = 'spothitch_moderator_roles';
const ROLE_ASSIGNMENTS_KEY = 'spothitch_role_assignments';
const MODERATION_HISTORY_KEY = 'spothitch_moderation_history';

/**
 * Role hierarchy levels (higher = more power)
 */
export const RoleLevel = {
  USER: 0,
  HELPER: 1,
  MODERATOR: 2,
  SENIOR_MODERATOR: 3,
  ADMIN: 4,
};

/**
 * Role definitions with permissions and metadata
 */
export const Roles = {
  USER: {
    id: 'user',
    level: RoleLevel.USER,
    label: 'Utilisateur',
    labelEn: 'User',
    color: 'slate',
    icon: 'fa-user',
    description: 'Membre standard de la communaute',
    descriptionEn: 'Standard community member',
    permissions: [],
  },
  HELPER: {
    id: 'helper',
    level: RoleLevel.HELPER,
    label: 'Aide',
    labelEn: 'Helper',
    color: 'green',
    icon: 'fa-hands-helping',
    description: 'Aide la communaute et peut signaler des problemes',
    descriptionEn: 'Helps the community and can flag issues',
    permissions: ['flag_content', 'view_reports'],
  },
  MODERATOR: {
    id: 'moderator',
    level: RoleLevel.MODERATOR,
    label: 'Moderateur',
    labelEn: 'Moderator',
    color: 'blue',
    icon: 'fa-shield-alt',
    description: 'Modere le contenu et gere les avertissements',
    descriptionEn: 'Moderates content and manages warnings',
    permissions: [
      'flag_content',
      'view_reports',
      'warn_user',
      'mute_user',
      'edit_spots',
      'delete_content',
      'resolve_reports',
    ],
  },
  SENIOR_MODERATOR: {
    id: 'senior_moderator',
    level: RoleLevel.SENIOR_MODERATOR,
    label: 'Moderateur senior',
    labelEn: 'Senior Moderator',
    color: 'purple',
    icon: 'fa-user-shield',
    description: 'Moderateur experimente avec pouvoirs etendus',
    descriptionEn: 'Experienced moderator with extended powers',
    permissions: [
      'flag_content',
      'view_reports',
      'warn_user',
      'mute_user',
      'edit_spots',
      'delete_content',
      'resolve_reports',
      'ban_temp',
      'view_user_history',
      'manage_helpers',
    ],
  },
  ADMIN: {
    id: 'admin',
    level: RoleLevel.ADMIN,
    label: 'Administrateur',
    labelEn: 'Admin',
    color: 'red',
    icon: 'fa-crown',
    description: 'Acces complet a toutes les fonctionnalites',
    descriptionEn: 'Full access to all features',
    permissions: [
      'flag_content',
      'view_reports',
      'warn_user',
      'mute_user',
      'edit_spots',
      'delete_content',
      'resolve_reports',
      'ban_temp',
      'ban_perm',
      'view_user_history',
      'manage_helpers',
      'manage_moderators',
      'manage_senior_moderators',
      'view_admin_dashboard',
      'configure_system',
    ],
  },
};

/**
 * All available permissions with descriptions
 */
export const Permissions = {
  FLAG_CONTENT: {
    id: 'flag_content',
    label: 'Signaler du contenu',
    labelEn: 'Flag content',
    description: 'Signaler du contenu pour examen',
    minRole: 'helper',
  },
  VIEW_REPORTS: {
    id: 'view_reports',
    label: 'Voir les signalements',
    labelEn: 'View reports',
    description: 'Acceder a la liste des signalements',
    minRole: 'helper',
  },
  WARN_USER: {
    id: 'warn_user',
    label: 'Avertir un utilisateur',
    labelEn: 'Warn user',
    description: 'Envoyer un avertissement a un utilisateur',
    minRole: 'moderator',
  },
  MUTE_USER: {
    id: 'mute_user',
    label: 'Rendre muet',
    labelEn: 'Mute user',
    description: 'Empecher un utilisateur de poster temporairement',
    minRole: 'moderator',
  },
  EDIT_SPOTS: {
    id: 'edit_spots',
    label: 'Modifier les spots',
    labelEn: 'Edit spots',
    description: 'Modifier les informations des spots',
    minRole: 'moderator',
  },
  DELETE_CONTENT: {
    id: 'delete_content',
    label: 'Supprimer du contenu',
    labelEn: 'Delete content',
    description: 'Supprimer des messages, commentaires ou photos',
    minRole: 'moderator',
  },
  RESOLVE_REPORTS: {
    id: 'resolve_reports',
    label: 'Resoudre les signalements',
    labelEn: 'Resolve reports',
    description: 'Marquer les signalements comme resolus',
    minRole: 'moderator',
  },
  BAN_TEMP: {
    id: 'ban_temp',
    label: 'Bannissement temporaire',
    labelEn: 'Temporary ban',
    description: 'Bannir un utilisateur temporairement',
    minRole: 'senior_moderator',
  },
  BAN_PERM: {
    id: 'ban_perm',
    label: 'Bannissement permanent',
    labelEn: 'Permanent ban',
    description: 'Bannir un utilisateur definitivement',
    minRole: 'admin',
  },
  VIEW_USER_HISTORY: {
    id: 'view_user_history',
    label: 'Voir l\'historique',
    labelEn: 'View user history',
    description: 'Acceder a l\'historique complet d\'un utilisateur',
    minRole: 'senior_moderator',
  },
  MANAGE_HELPERS: {
    id: 'manage_helpers',
    label: 'Gerer les aides',
    labelEn: 'Manage helpers',
    description: 'Assigner ou retirer le role d\'aide',
    minRole: 'senior_moderator',
  },
  MANAGE_MODERATORS: {
    id: 'manage_moderators',
    label: 'Gerer les moderateurs',
    labelEn: 'Manage moderators',
    description: 'Assigner ou retirer le role de moderateur',
    minRole: 'admin',
  },
  MANAGE_SENIOR_MODERATORS: {
    id: 'manage_senior_moderators',
    label: 'Gerer les moderateurs seniors',
    labelEn: 'Manage senior moderators',
    description: 'Assigner ou retirer le role de moderateur senior',
    minRole: 'admin',
  },
  VIEW_ADMIN_DASHBOARD: {
    id: 'view_admin_dashboard',
    label: 'Dashboard admin',
    labelEn: 'Admin dashboard',
    description: 'Acceder au tableau de bord administrateur',
    minRole: 'admin',
  },
  CONFIGURE_SYSTEM: {
    id: 'configure_system',
    label: 'Configurer le systeme',
    labelEn: 'Configure system',
    description: 'Modifier les parametres systeme',
    minRole: 'admin',
  },
};

/**
 * Get role assignments from storage
 * @returns {Object} Map of userId -> role
 */
function getRoleAssignmentsFromStorage() {
  try {
    const data = Storage.get(ROLE_ASSIGNMENTS_KEY);
    return data && typeof data === 'object' ? data : {};
  } catch (error) {
    console.error('Error reading role assignments:', error);
    return {};
  }
}

/**
 * Save role assignments to storage
 * @param {Object} assignments - Map of userId -> role assignment data
 */
function saveRoleAssignmentsToStorage(assignments) {
  try {
    Storage.set(ROLE_ASSIGNMENTS_KEY, assignments);
    setState({ moderatorRoles: assignments });
  } catch (error) {
    console.error('Error saving role assignments:', error);
  }
}

/**
 * Get moderation history from storage
 * @returns {Array} Array of history entries
 */
function getModerationHistoryFromStorage() {
  try {
    const data = Storage.get(MODERATION_HISTORY_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading moderation history:', error);
    return [];
  }
}

/**
 * Save moderation history to storage
 * @param {Array} history - Array of history entries
 */
function saveModerationHistoryToStorage(history) {
  try {
    Storage.set(MODERATION_HISTORY_KEY, history);
  } catch (error) {
    console.error('Error saving moderation history:', error);
  }
}

/**
 * Generate unique history entry ID
 * @returns {string} Unique ID
 */
function generateHistoryId() {
  return `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log a moderation action to history
 * @param {Object} entry - History entry data
 */
function logModAction(entry) {
  const history = getModerationHistoryFromStorage();
  history.push({
    id: generateHistoryId(),
    ...entry,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 1000 entries
  if (history.length > 1000) {
    history.splice(0, history.length - 1000);
  }
  saveModerationHistoryToStorage(history);
}

/**
 * Get role by ID
 * @param {string} roleId - Role ID
 * @returns {Object|null} Role object or null
 */
export function getRoleById(roleId) {
  if (!roleId) return null;
  const normalizedId = roleId.toUpperCase();
  return Roles[normalizedId] || null;
}

/**
 * Get all available roles
 * @returns {Array} Array of role objects
 */
export function getAllRoles() {
  return Object.values(Roles);
}

/**
 * Get roles that can be assigned by a given role
 * @param {string} assignerRole - Role of the person assigning
 * @returns {Array} Array of assignable roles
 */
export function getAssignableRoles(assignerRole) {
  const assigner = getRoleById(assignerRole);
  if (!assigner) return [];

  return Object.values(Roles).filter(role => {
    // Can't assign roles equal or higher than own level
    // Admins can assign up to senior_moderator
    // Senior mods can assign up to helper
    if (assigner.level === RoleLevel.ADMIN) {
      return role.level < RoleLevel.ADMIN;
    }
    if (assigner.level === RoleLevel.SENIOR_MODERATOR) {
      return role.level <= RoleLevel.HELPER;
    }
    return false;
  });
}

/**
 * Assign a role to a user
 * @param {string} userId - Target user ID
 * @param {string} role - Role ID to assign
 * @param {Object} options - Additional options
 * @returns {Object} Result with success status
 */
export function assignRole(userId, role, options = {}) {
  if (!userId) {
    return { success: false, error: 'user_id_required' };
  }

  if (!role) {
    return { success: false, error: 'role_required' };
  }

  const roleObj = getRoleById(role);
  if (!roleObj) {
    return { success: false, error: 'invalid_role' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;
  const currentRole = getUserRole(currentUserId);
  const currentRoleObj = getRoleById(currentRole);

  // Check if current user can assign this role
  if (!options.skipPermissionCheck) {
    if (!currentRoleObj || currentRoleObj.level <= roleObj.level) {
      showToast(t('cannotAssignRole') || 'Tu ne peux pas assigner ce role', 'error');
      return { success: false, error: 'insufficient_permissions' };
    }

    // Check specific management permissions
    if (roleObj.id === 'moderator' && !hasPermission(currentUserId, 'manage_moderators')) {
      return { success: false, error: 'cannot_manage_moderators' };
    }
    if (roleObj.id === 'senior_moderator' && !hasPermission(currentUserId, 'manage_senior_moderators')) {
      return { success: false, error: 'cannot_manage_senior_moderators' };
    }
    if (roleObj.id === 'helper' && !hasPermission(currentUserId, 'manage_helpers')) {
      return { success: false, error: 'cannot_manage_helpers' };
    }
  }

  // Cannot assign role to yourself (unless initial admin setup)
  if (userId === currentUserId && !options.selfAssign) {
    return { success: false, error: 'cannot_assign_self' };
  }

  const assignments = getRoleAssignmentsFromStorage();
  const oldRole = assignments[userId]?.role || 'user';

  // Create assignment
  assignments[userId] = {
    role: roleObj.id,
    assignedBy: currentUserId || 'system',
    assignedAt: new Date().toISOString(),
    reason: options.reason || '',
  };

  saveRoleAssignmentsToStorage(assignments);

  // Log action
  logModAction({
    type: 'role_assigned',
    targetUserId: userId,
    oldRole,
    newRole: roleObj.id,
    assignedBy: currentUserId || 'system',
    reason: options.reason || '',
  });

  showToast(
    (t('roleAssigned') || 'Role assigne') + `: ${roleObj.label}`,
    'success'
  );

  return { success: true, assignment: assignments[userId] };
}

/**
 * Remove a role from a user (revert to user)
 * @param {string} userId - Target user ID
 * @param {Object} options - Additional options
 * @returns {Object} Result with success status
 */
export function removeRole(userId, options = {}) {
  if (!userId) {
    return { success: false, error: 'user_id_required' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;
  const currentRole = getUserRole(currentUserId);
  const targetRole = getUserRole(userId);

  // Check permissions
  if (!options.skipPermissionCheck) {
    const currentRoleObj = getRoleById(currentRole);
    const targetRoleObj = getRoleById(targetRole);

    if (!currentRoleObj || !targetRoleObj) {
      return { success: false, error: 'invalid_roles' };
    }

    // Can only remove roles lower than own level
    if (currentRoleObj.level <= targetRoleObj.level) {
      showToast(t('cannotRemoveRole') || 'Tu ne peux pas retirer ce role', 'error');
      return { success: false, error: 'insufficient_permissions' };
    }
  }

  // Cannot remove own role
  if (userId === currentUserId && !options.selfRemove) {
    return { success: false, error: 'cannot_remove_self' };
  }

  const assignments = getRoleAssignmentsFromStorage();
  const oldRole = assignments[userId]?.role || 'user';

  if (oldRole === 'user') {
    return { success: false, error: 'already_user' };
  }

  // Remove assignment (revert to user)
  delete assignments[userId];
  saveRoleAssignmentsToStorage(assignments);

  // Log action
  logModAction({
    type: 'role_removed',
    targetUserId: userId,
    oldRole,
    newRole: 'user',
    removedBy: currentUserId || 'system',
    reason: options.reason || '',
  });

  showToast(t('roleRemoved') || 'Role retire', 'success');

  return { success: true, oldRole };
}

/**
 * Get a user's current role
 * @param {string} userId - User ID
 * @returns {string} Role ID (defaults to 'user')
 */
export function getUserRole(userId) {
  if (!userId) return 'user';

  const assignments = getRoleAssignmentsFromStorage();
  return assignments[userId]?.role || 'user';
}

/**
 * Get full role info for a user
 * @param {string} userId - User ID
 * @returns {Object} Role object with assignment details
 */
export function getUserRoleInfo(userId) {
  if (!userId) {
    return {
      role: Roles.USER,
      assignment: null,
    };
  }

  const assignments = getRoleAssignmentsFromStorage();
  const assignment = assignments[userId];
  const roleId = assignment?.role || 'user';
  const role = getRoleById(roleId) || Roles.USER;

  return {
    role,
    assignment: assignment || null,
  };
}

/**
 * Check if a user has a specific permission
 * @param {string} userId - User ID
 * @param {string} permission - Permission ID to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(userId, permission) {
  if (!userId || !permission) return false;

  const roleId = getUserRole(userId);
  const role = getRoleById(roleId);

  if (!role) return false;

  return role.permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 * @param {string} userId - User ID
 * @param {Array} permissions - Array of permission IDs
 * @returns {boolean} True if user has at least one permission
 */
export function hasAnyPermission(userId, permissions) {
  if (!Array.isArray(permissions)) return false;
  return permissions.some(p => hasPermission(userId, p));
}

/**
 * Check if a user has all of the specified permissions
 * @param {string} userId - User ID
 * @param {Array} permissions - Array of permission IDs
 * @returns {boolean} True if user has all permissions
 */
export function hasAllPermissions(userId, permissions) {
  if (!Array.isArray(permissions)) return false;
  return permissions.every(p => hasPermission(userId, p));
}

/**
 * Get all permissions for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of permission IDs
 */
export function getUserPermissions(userId) {
  const roleId = getUserRole(userId);
  const role = getRoleById(roleId);
  return role?.permissions || [];
}

/**
 * Check if user is a moderator or higher
 * @param {string} userId - User ID
 * @returns {boolean} True if moderator+
 */
export function isModerator(userId) {
  const roleId = getUserRole(userId);
  const role = getRoleById(roleId);
  return role && role.level >= RoleLevel.MODERATOR;
}

/**
 * Check if user is admin
 * @param {string} userId - User ID
 * @returns {boolean} True if admin
 */
export function isAdmin(userId) {
  const roleId = getUserRole(userId);
  return roleId === 'admin';
}

/**
 * Get list of all moderators (helper and above)
 * @param {Object} options - Filter options
 * @returns {Array} Array of moderator info objects
 */
export function getModeratorsList(options = {}) {
  const {
    minRole = 'helper',
    maxRole = null,
    includeDetails = true,
  } = options;

  const assignments = getRoleAssignmentsFromStorage();
  const minRoleObj = getRoleById(minRole);
  const maxRoleObj = maxRole ? getRoleById(maxRole) : null;

  const minLevel = minRoleObj?.level || RoleLevel.HELPER;
  const maxLevel = maxRoleObj?.level || RoleLevel.ADMIN;

  const moderators = [];

  for (const [userId, assignment] of Object.entries(assignments)) {
    const role = getRoleById(assignment.role);
    if (role && role.level >= minLevel && role.level <= maxLevel) {
      const entry = {
        userId,
        role: assignment.role,
        roleLabel: role.label,
        roleLevel: role.level,
        roleColor: role.color,
        roleIcon: role.icon,
      };

      if (includeDetails) {
        entry.assignedBy = assignment.assignedBy;
        entry.assignedAt = assignment.assignedAt;
        entry.reason = assignment.reason;
      }

      moderators.push(entry);
    }
  }

  // Sort by role level (highest first), then by assignment date
  moderators.sort((a, b) => {
    if (b.roleLevel !== a.roleLevel) {
      return b.roleLevel - a.roleLevel;
    }
    return new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0);
  });

  return moderators;
}

/**
 * Get moderator count by role
 * @returns {Object} Counts by role
 */
export function getModeratorCounts() {
  const assignments = getRoleAssignmentsFromStorage();

  const counts = {
    helper: 0,
    moderator: 0,
    senior_moderator: 0,
    admin: 0,
    total: 0,
  };

  for (const assignment of Object.values(assignments)) {
    if (counts.hasOwnProperty(assignment.role)) {
      counts[assignment.role]++;
      if (assignment.role !== 'user') {
        counts.total++;
      }
    }
  }

  return counts;
}

/**
 * Get moderation history
 * @param {Object} options - Filter options
 * @returns {Array} History entries
 */
export function getModerationHistory(options = {}) {
  const {
    userId = null,
    type = null,
    limit = 50,
    offset = 0,
  } = options;

  let history = getModerationHistoryFromStorage();

  // Filter by user
  if (userId) {
    history = history.filter(h => h.targetUserId === userId || h.assignedBy === userId || h.removedBy === userId);
  }

  // Filter by type
  if (type) {
    history = history.filter(h => h.type === type);
  }

  // Sort by most recent
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Paginate
  const total = history.length;
  const paginated = history.slice(offset, offset + limit);

  return {
    entries: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Check if current user can perform action on target user
 * @param {string} targetUserId - Target user ID
 * @param {string} action - Action to perform
 * @returns {Object} Result with canPerform and reason
 */
export function canPerformAction(targetUserId, action) {
  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) {
    return { canPerform: false, reason: 'not_logged_in' };
  }

  if (!targetUserId) {
    return { canPerform: false, reason: 'no_target' };
  }

  // Can't perform actions on yourself (for most actions)
  if (currentUserId === targetUserId && !['view_reports', 'view_user_history'].includes(action)) {
    return { canPerform: false, reason: 'cannot_target_self' };
  }

  // Check permission
  if (!hasPermission(currentUserId, action)) {
    return { canPerform: false, reason: 'no_permission' };
  }

  // Check role hierarchy for user-targeted actions
  const userTargetedActions = ['warn_user', 'mute_user', 'ban_temp', 'ban_perm'];
  if (userTargetedActions.includes(action)) {
    const currentRole = getRoleById(getUserRole(currentUserId));
    const targetRole = getRoleById(getUserRole(targetUserId));

    if (targetRole && currentRole && targetRole.level >= currentRole.level) {
      return { canPerform: false, reason: 'target_higher_role' };
    }
  }

  return { canPerform: true, reason: null };
}

/**
 * Escape HTML for safe rendering
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Render role badge HTML
 * @param {string} roleId - Role ID
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderRoleBadge(roleId, options = {}) {
  const role = getRoleById(roleId);
  if (!role || role.id === 'user') return '';

  const { size = 'md', showLabel = true } = options;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return `
    <span
      class="inline-flex items-center gap-1.5 rounded-full font-medium
             bg-${role.color}-500/20 text-${role.color}-400
             ${sizeClasses[size] || sizeClasses.md}"
      title="${escapeHTML(role.description)}"
      role="status"
    >
      <i class="fas ${role.icon}"></i>
      ${showLabel ? escapeHTML(role.label) : ''}
    </span>
  `;
}

/**
 * Render moderator panel HTML
 * @returns {string} HTML string
 */
export function renderModeratorPanel() {
  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) {
    return `
      <div class="moderator-panel p-6 text-center">
        <i class="fas fa-lock text-4xl text-slate-500 mb-4"></i>
        <p class="text-slate-400">${escapeHTML(t('loginRequired') || 'Connexion requise')}</p>
      </div>
    `;
  }

  const userRoleInfo = getUserRoleInfo(currentUserId);
  const role = userRoleInfo.role;

  if (role.level < RoleLevel.HELPER) {
    return `
      <div class="moderator-panel p-6 text-center">
        <i class="fas fa-user-times text-4xl text-slate-500 mb-4"></i>
        <p class="text-slate-400">${escapeHTML(t('notModerator') || 'Tu n\'es pas moderateur')}</p>
      </div>
    `;
  }

  const permissions = getUserPermissions(currentUserId);
  const moderators = getModeratorsList();
  const counts = getModeratorCounts();
  const history = getModerationHistory({ limit: 10 });

  return `
    <div class="moderator-panel p-4 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <i class="fas fa-shield-alt text-${role.color}-400"></i>
            ${escapeHTML(t('moderatorPanel') || 'Panel Moderateur')}
          </h2>
          <p class="text-sm text-slate-400 mt-1">
            ${escapeHTML(t('yourRole') || 'Ton role')}: ${renderRoleBadge(role.id)}
          </p>
        </div>
        <button
          onclick="refreshModeratorPanel()"
          class="btn btn-sm bg-white/10 hover:bg-white/20"
          aria-label="${escapeHTML(t('refresh') || 'Rafraichir')}"
        >
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-green-500/10 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-green-400">${counts.helper}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('helpers') || 'Aides')}</div>
        </div>
        <div class="bg-blue-500/10 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-blue-400">${counts.moderator}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('moderators') || 'Moderateurs')}</div>
        </div>
        <div class="bg-purple-500/10 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-purple-400">${counts.senior_moderator}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('seniorMods') || 'Seniors')}</div>
        </div>
        <div class="bg-red-500/10 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-red-400">${counts.admin}</div>
          <div class="text-xs text-slate-400">${escapeHTML(t('admins') || 'Admins')}</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white/5 rounded-xl p-4">
        <h3 class="font-medium text-white mb-3">
          <i class="fas fa-bolt mr-2 text-yellow-400"></i>
          ${escapeHTML(t('quickActions') || 'Actions rapides')}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          ${permissions.includes('view_reports') ? `
            <button onclick="openModerationQueue()" class="btn btn-sm bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
              <i class="fas fa-flag mr-2"></i>${escapeHTML(t('reports') || 'Signalements')}
            </button>
          ` : ''}
          ${permissions.includes('warn_user') ? `
            <button onclick="openWarnUserModal()" class="btn btn-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
              <i class="fas fa-exclamation-triangle mr-2"></i>${escapeHTML(t('warn') || 'Avertir')}
            </button>
          ` : ''}
          ${permissions.includes('mute_user') ? `
            <button onclick="openMuteUserModal()" class="btn btn-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
              <i class="fas fa-volume-mute mr-2"></i>${escapeHTML(t('mute') || 'Mute')}
            </button>
          ` : ''}
          ${permissions.includes('ban_temp') ? `
            <button onclick="openTempBanModal()" class="btn btn-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
              <i class="fas fa-user-clock mr-2"></i>${escapeHTML(t('tempBan') || 'Ban temp')}
            </button>
          ` : ''}
          ${permissions.includes('ban_perm') ? `
            <button onclick="openPermBanModal()" class="btn btn-sm bg-red-500/20 text-red-400 hover:bg-red-500/30">
              <i class="fas fa-user-slash mr-2"></i>${escapeHTML(t('permBan') || 'Ban perm')}
            </button>
          ` : ''}
          ${permissions.includes('view_admin_dashboard') ? `
            <button onclick="openAdminDashboard()" class="btn btn-sm bg-slate-500/20 text-slate-300 hover:bg-slate-500/30">
              <i class="fas fa-chart-line mr-2"></i>${escapeHTML(t('dashboard') || 'Dashboard')}
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Team Members -->
      <div class="bg-white/5 rounded-xl p-4">
        <h3 class="font-medium text-white mb-3">
          <i class="fas fa-users mr-2 text-primary-400"></i>
          ${escapeHTML(t('moderationTeam') || 'Equipe de moderation')} (${counts.total})
        </h3>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          ${moderators.length === 0 ? `
            <p class="text-slate-500 text-sm text-center py-4">
              ${escapeHTML(t('noModerators') || 'Aucun moderateur')}
            </p>
          ` : moderators.map(mod => `
            <div class="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-${mod.roleColor}-500/20 flex items-center justify-center">
                  <i class="fas ${mod.roleIcon} text-${mod.roleColor}-400 text-sm"></i>
                </div>
                <div>
                  <div class="font-medium text-white text-sm">${escapeHTML(mod.userId)}</div>
                  <div class="text-xs text-${mod.roleColor}-400">${escapeHTML(mod.roleLabel)}</div>
                </div>
              </div>
              ${role.level > mod.roleLevel && hasPermission(currentUserId, 'manage_helpers') ? `
                <button
                  onclick="openEditRoleModal('${escapeHTML(mod.userId)}')"
                  class="btn btn-xs bg-white/10 hover:bg-white/20"
                  aria-label="${escapeHTML(t('editRole') || 'Modifier le role')}"
                >
                  <i class="fas fa-edit"></i>
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white/5 rounded-xl p-4">
        <h3 class="font-medium text-white mb-3">
          <i class="fas fa-history mr-2 text-slate-400"></i>
          ${escapeHTML(t('recentActivity') || 'Activite recente')}
        </h3>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          ${history.entries.length === 0 ? `
            <p class="text-slate-500 text-sm text-center py-4">
              ${escapeHTML(t('noActivity') || 'Aucune activite')}
            </p>
          ` : history.entries.map(entry => `
            <div class="flex items-start gap-3 p-2 rounded-lg bg-white/5 text-sm">
              <div class="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fas ${entry.type === 'role_assigned' ? 'fa-user-plus text-green-400' : 'fa-user-minus text-red-400'} text-xs"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-slate-300">
                  ${entry.type === 'role_assigned'
                    ? `<span class="text-white">${escapeHTML(entry.targetUserId)}</span> ${escapeHTML(t('promotedTo') || 'promu')} <span class="text-${getRoleById(entry.newRole)?.color || 'slate'}-400">${escapeHTML(getRoleById(entry.newRole)?.label || entry.newRole)}</span>`
                    : `<span class="text-white">${escapeHTML(entry.targetUserId)}</span> ${escapeHTML(t('demotedTo') || 'retrogade en')} ${escapeHTML(t('user') || 'utilisateur')}`
                  }
                </div>
                <div class="text-xs text-slate-500">${escapeHTML(formatDate(entry.timestamp))}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Your Permissions -->
      <div class="bg-white/5 rounded-xl p-4">
        <h3 class="font-medium text-white mb-3">
          <i class="fas fa-key mr-2 text-amber-400"></i>
          ${escapeHTML(t('yourPermissions') || 'Tes permissions')} (${permissions.length})
        </h3>
        <div class="flex flex-wrap gap-2">
          ${permissions.map(p => {
            const permInfo = Object.values(Permissions).find(perm => perm.id === p);
            return `
              <span class="px-2 py-1 rounded-full text-xs bg-white/10 text-slate-300" title="${escapeHTML(permInfo?.description || p)}">
                ${escapeHTML(permInfo?.label || p)}
              </span>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render role selection dropdown HTML
 * @param {string} currentRole - Current role ID
 * @param {string} assignerRole - Assigner's role ID
 * @returns {string} HTML string
 */
export function renderRoleSelect(currentRole, assignerRole) {
  const assignable = getAssignableRoles(assignerRole);

  return `
    <select
      id="role-select"
      class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500"
    >
      <option value="user" ${currentRole === 'user' ? 'selected' : ''}>
        ${escapeHTML(Roles.USER.label)} (${escapeHTML(t('default') || 'defaut')})
      </option>
      ${assignable.map(role => `
        <option value="${role.id}" ${currentRole === role.id ? 'selected' : ''}>
          ${escapeHTML(role.label)}
        </option>
      `).join('')}
    </select>
  `;
}

/**
 * Initialize moderator system with default admin
 * @param {string} adminUserId - User ID to set as admin
 */
export function initializeWithAdmin(adminUserId) {
  if (!adminUserId) return;

  const assignments = getRoleAssignmentsFromStorage();

  // Only initialize if no admins exist
  const hasAdmin = Object.values(assignments).some(a => a.role === 'admin');
  if (hasAdmin) return;

  assignRole(adminUserId, 'admin', {
    skipPermissionCheck: true,
    selfAssign: true,
    reason: 'Initial admin setup',
  });
}

// Global handlers
window.refreshModeratorPanel = () => {
  const state = getState();
  setState({ moderatorPanelRefresh: Date.now() });
  showToast(t('panelRefreshed') || 'Panel actualise', 'success');
};

window.openEditRoleModal = (userId) => {
  setState({
    showEditRoleModal: true,
    editRoleTargetId: userId,
  });
};

window.closeEditRoleModal = () => {
  setState({
    showEditRoleModal: false,
    editRoleTargetId: null,
  });
};

window.saveUserRole = (userId) => {
  const select = document.getElementById('role-select');
  const newRole = select?.value;

  if (!newRole) return;

  if (newRole === 'user') {
    removeRole(userId);
  } else {
    assignRole(userId, newRole);
  }

  window.closeEditRoleModal();
};

// Export default with all functions
export default {
  // Constants
  RoleLevel,
  Roles,
  Permissions,

  // Role management
  getRoleById,
  getAllRoles,
  getAssignableRoles,
  assignRole,
  removeRole,
  getUserRole,
  getUserRoleInfo,

  // Permission checks
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  isModerator,
  isAdmin,
  canPerformAction,

  // Lists and stats
  getModeratorsList,
  getModeratorCounts,
  getModerationHistory,

  // Rendering
  renderRoleBadge,
  renderModeratorPanel,
  renderRoleSelect,

  // Initialization
  initializeWithAdmin,
};
